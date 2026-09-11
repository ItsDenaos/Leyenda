import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useCareerStore } from '../career'
import { GameDatabase } from '../../data/database'
import { GameConfig } from '../../game/config'
import type { Player, DecisionCard, OfertaItem } from '../../game/career-types'

function jugadorDePrueba(overrides: Partial<Player> = {}): Player {
  const equipo = GameDatabase.equipos[0]!
  return {
    apellido: 'PEREZ',
    numero: 10,
    pierna: 'derecha',
    edad: 17,
    pais: 'Argentina',
    flag: '🇦🇷',
    paisCode: 'ar',
    posicion: 'DC',
    equipoId: equipo.id,
    ovrInicial: 58,
    ...overrides,
  }
}

// Corre una carrera completa resolviendo siempre la primera opción/oferta
// disponible — mismo criterio de automatización que se usó toda la
// migración para validar el motor original en el navegador.
//
// simularTramoYAvanzar demora el paso al siguiente checkpoint hasta que
// termina la animación del spotlight (ver career.ts), así que este loop
// necesita temporizadores falsos para no esperar ~1s por cada tramo — se
// restauran los reales antes de volver, para no afectar a otros tests.
function correrCarreraCompleta(store: ReturnType<typeof useCareerStore>, maxIters = 3000) {
  vi.useFakeTimers()
  try {
    let iters = 0
    while (!store.carreraFinalizada && iters < maxIters) {
      iters++
      const t = store.temporadaActual
      if (!t) break
      const lote = t.loteActual
      if (lote.length === 0) break

      const primero = lote[0]!
      if ('esInformeLesion' in primero && primero.esInformeLesion) {
        store.simularTramoYAvanzar()
        vi.advanceTimersByTime(GameConfig.ANIMACION_TRAMO_MS + 200)
      } else if ('tipoOferta' in primero) {
        store.resolveOferta(primero)
      } else {
        store.resolveDecisionEvento((primero as DecisionCard).id, 0)
        vi.advanceTimersByTime(GameConfig.ANIMACION_TRAMO_MS + 200)
      }
    }
    return iters
  } finally {
    vi.useRealTimers()
  }
}

describe('useCareerStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('iniciarCarrera arma la temporada 1 con los datos del jugador', () => {
    const store = useCareerStore()
    store.iniciarCarrera(jugadorDePrueba())

    expect(store.carreraIniciada).toBe(true)
    expect(store.temporadaActual?.numero).toBe(1)
    expect(store.temporadaActual?.ovr).toBe(58)
    expect(store.temporadaActual?.loteActual.length).toBeGreaterThan(0)
    expect(store.temporadasFinalizadas).toEqual([])
    expect(store.esPrimerClub).toBe(true)
  })

  it('corre una carrera completa de punta a punta sin errores', () => {
    const store = useCareerStore()
    store.iniciarCarrera(jugadorDePrueba())

    const iters = correrCarreraCompleta(store)

    expect(store.carreraFinalizada).toBe(true)
    expect(iters).toBeLessThan(3000) // no se quedó en un loop infinito
    expect(store.temporadasFinalizadas.length).toBeGreaterThan(0)
    // Ninguna temporada debería quedar con estadísticas inválidas.
    for (const s of store.temporadasFinalizadas) {
      expect(Number.isFinite(s.ovr)).toBe(true)
      expect(Number.isFinite(s.promedio)).toBe(true)
      expect(s.goles).toBeGreaterThanOrEqual(0)
      expect(s.ovr).toBeGreaterThanOrEqual(45)
      expect(s.ovr).toBeLessThanOrEqual(99)
    }
  })

  it('el resumen de carrera agrega estadísticas coherentes con las temporadas', () => {
    const store = useCareerStore()
    store.iniciarCarrera(jugadorDePrueba())
    correrCarreraCompleta(store)

    const resumen = store.construirResumenCarrera()
    const golesEsperados = store.temporadasFinalizadas.reduce((acc, s) => acc + s.goles, 0)
    expect(resumen.goles).toBe(golesEsperados)
    expect(resumen.clubes.length).toBeGreaterThan(0)
    expect(resumen.temporadasJugadas).toBe(store.temporadasFinalizadas.length)
  })

  it('el primer club da 4 temporadas de gracia y un club posterior 2', () => {
    // Forzamos un jugador de OVR muy bajo para que el club "quiera"
    // cortar el contrato apenas termine la gracia — así el número de
    // temporadas hasta que aparezca una carta de retiro no forzoso mide
    // directamente el período de gracia real.
    const store = useCareerStore()
    store.iniciarCarrera(jugadorDePrueba({ ovrInicial: 50 }))
    if (store.temporadaActual) store.temporadaActual.ovr = 45

    let temporadaDeCorte: number | null = null
    let iters = 0
    vi.useFakeTimers()
    try {
      while (!store.carreraFinalizada && iters < 200) {
        iters++
        const t = store.temporadaActual
        if (!t) break
        const primero = t.loteActual[0]
        if (primero && 'tipoOferta' in primero && primero.tipoOferta === 'retiro' && !primero.forzoso) {
          temporadaDeCorte = t.numero
          break
        }
        if (!primero) break
        if ('esInformeLesion' in primero && primero.esInformeLesion) {
          store.simularTramoYAvanzar()
          vi.advanceTimersByTime(GameConfig.ANIMACION_TRAMO_MS + 200)
        } else if ('tipoOferta' in primero) {
          store.resolveOferta(primero)
        } else {
          store.resolveDecisionEvento((primero as DecisionCard).id, 0)
          vi.advanceTimersByTime(GameConfig.ANIMACION_TRAMO_MS + 200)
        }
        if (t.ovr > 45) t.ovr = 45 // mantener el nivel bajo para forzar el corte
      }
    } finally {
      vi.useRealTimers()
    }

    expect(temporadaDeCorte).toBe(5) // gracia de 4 temporadas + la 5ta ya sin gracia
  })

  it('guardar/cargar hace un round-trip fiel del estado', () => {
    const store = useCareerStore()
    store.iniciarCarrera(jugadorDePrueba())
    correrCarreraCompleta(store, 50) // avanza unas pausas, sin terminar la carrera

    const ovrAntes = store.temporadaActual?.ovr
    const temporadasFinalizadasAntes = store.temporadasFinalizadas.length

    // Simula recargar la página: un store nuevo, cargando desde localStorage.
    setActivePinia(createPinia())
    const storeNuevo = useCareerStore()
    const cargado = storeNuevo.cargar()

    expect(cargado).toBe(true)
    expect(storeNuevo.temporadaActual?.ovr).toBe(ovrAntes)
    expect(storeNuevo.temporadasFinalizadas.length).toBe(temporadasFinalizadasAntes)
    expect(storeNuevo.player?.apellido).toBe('PEREZ')
  })

  it('sin partida guardada, cargar() devuelve false', () => {
    const store = useCareerStore()
    expect(store.hayCarreraGuardada()).toBe(false)
    expect(store.cargar()).toBe(false)
  })

  it('cede a otro club por bajo rendimiento (préstamo) y vuelve solo al club dueño', () => {
    const store = useCareerStore()
    store.iniciarCarrera(jugadorDePrueba())

    vi.useFakeTimers()
    try {
      // Termina la temporada 1 resolviendo lo que vaya saliendo — justo
      // antes de que se cierre (el lote queda vacío, con el cierre ya
      // encolado en el setTimeout de la animación, todavía sin correr) se
      // fuerza un pesoTitular y un promedio bajos, para que la temporada 2
      // arranque en condición de préstamo.
      let iters = 0
      while (store.temporadaActual!.numero === 1 && iters < 50) {
        iters++
        const t = store.temporadaActual!
        const primero = t.loteActual[0]
        if (!primero) break
        if ('esInformeLesion' in primero && primero.esInformeLesion) {
          store.simularTramoYAvanzar()
        } else if ('tipoOferta' in primero) {
          store.resolveOferta(primero)
        } else {
          store.resolveDecisionEvento((primero as DecisionCard).id, 0)
        }
        if (t.numero === 1 && t.loteActual.length === 0) {
          t.pesoTitular = 0.1
          t.sumaRating = 5.0 * Math.max(t.partidos, 1)
          t.promedio = 5.0
        }
        vi.advanceTimersByTime(GameConfig.ANIMACION_TRAMO_MS + 200)
      }

      expect(store.temporadaActual!.numero).toBe(2)
      const lote = store.temporadaActual!.loteActual
      const tipos = lote.map((x) => ('tipoOferta' in x ? x.tipoOferta : null))
      expect(tipos).toEqual(['quedarme', 'prestamo'])

      const clubDuenoId = store.temporadaActual!.equipoId
      const temporadasEnClubAntes = store.temporadasEnClubActual
      const esPrimerClubAntes = store.esPrimerClub
      const oferta = lote.find((x) => 'tipoOferta' in x && x.tipoOferta === 'prestamo') as OfertaItem

      store.resolveOferta(oferta)

      expect(store.temporadaActual!.equipoId).toBe(oferta.equipo.id)
      expect(store.temporadaActual!.equipoId).not.toBe(clubDuenoId)
      expect(store.temporadaActual!.clubDuenoId).toBe(clubDuenoId)
      expect(store.temporadaActual!.pesoTitular).toBe(GameConfig.PESO_TITULAR_INICIAL)
      // A diferencia de un traspaso real, el reloj del club dueño sigue corriendo.
      expect(store.temporadasEnClubActual).toBe(temporadasEnClubAntes)
      expect(store.esPrimerClub).toBe(esPrimerClubAntes)

      // Termina la temporada de préstamo (resolviendo lo que vaya saliendo)
      // hasta que arranque la 3 — debería volver sola al club dueño.
      iters = 0
      while (store.temporadaActual!.numero === 2 && iters < 50) {
        iters++
        const t = store.temporadaActual!
        const primero = t.loteActual[0]
        if (!primero) break
        if ('esInformeLesion' in primero && primero.esInformeLesion) {
          store.simularTramoYAvanzar()
        } else if ('tipoOferta' in primero) {
          store.resolveOferta(primero)
        } else {
          store.resolveDecisionEvento((primero as DecisionCard).id, 0)
        }
        vi.advanceTimersByTime(GameConfig.ANIMACION_TRAMO_MS + 200)
      }

      expect(store.temporadaActual!.numero).toBe(3)
      expect(store.temporadaActual!.equipoId).toBe(clubDuenoId)
      expect(store.temporadaActual!.clubDuenoId).toBeNull()
      expect(store.temporadaActual!.pesoTitular).toBe(GameConfig.PESO_TITULAR_INICIAL)
      expect(store.mensajes.some((m) => m.includes('préstamo'))).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })
})
