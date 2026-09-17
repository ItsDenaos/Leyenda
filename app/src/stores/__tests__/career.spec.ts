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

  it('retirarse no deja una temporada fantasma con 0 partidos en el historial', () => {
    // El retiro siempre se decide en la pausa de fichajes, que cae al
    // arranque de la temporada (antes de simular cualquier tramo) — la
    // temporada "actual" en ese momento nunca tiene partidos jugados.
    const store = useCareerStore()
    store.iniciarCarrera(jugadorDePrueba({ ovrInicial: 50 }))
    if (store.temporadaActual) store.temporadaActual.ovr = 45

    let cartaRetiro: OfertaItem | null = null
    let iters = 0
    vi.useFakeTimers()
    try {
      while (!store.carreraFinalizada && iters < 200) {
        iters++
        const t = store.temporadaActual
        if (!t) break
        const primero = t.loteActual[0]
        if (primero && 'tipoOferta' in primero && primero.tipoOferta === 'retiro' && !primero.forzoso) {
          cartaRetiro = primero
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
        if (t.ovr > 45) t.ovr = 45
      }

      expect(cartaRetiro).not.toBeNull()
      const numeroAlRetirarse = store.temporadaActual!.numero
      store.resolveOferta(cartaRetiro!)

      expect(store.carreraFinalizada).toBe(true)
      expect(store.temporadasFinalizadas.some((s) => s.numero === numeroAlRetirarse)).toBe(false)
      expect(store.temporadasFinalizadas.every((s) => s.partidos > 0)).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })

  it('epílogo: resolverEpilogo guarda la opción elegida y persiste en guardar/cargar', () => {
    const store = useCareerStore()
    store.iniciarCarrera(jugadorDePrueba())
    store.finalizarCarrera()

    expect(store.epilogoElegido).toBeNull()

    store.resolverEpilogo(1)
    expect(store.epilogoElegido).toBe('entrenador')

    setActivePinia(createPinia())
    const storeNuevo = useCareerStore()
    expect(storeNuevo.cargar()).toBe(true)
    expect(storeNuevo.epilogoElegido).toBe('entrenador')
    expect(storeNuevo.carreraFinalizada).toBe(true)
  })

  it('fama: arranca en 0, sube con una decisión de prensa y clampea en FAMA_MAX', () => {
    const store = useCareerStore()
    store.iniciarCarrera(jugadorDePrueba())
    expect(store.fama).toBe(0)

    const decisionDePrensa: DecisionCard = {
      id: 'test-prensa',
      tipo: 'personal',
      altoImpacto: false,
      desc: 'Una decisión de prensa de prueba.',
      opciones: [
        { label: 'Opción A', variant: 'accept', efectos: { rendimiento: 0, forma: 'animado', equipo: 0, fama: 5 } },
        { label: 'Opción B', variant: 'ghost', efectos: { rendimiento: 0, forma: 'animado', equipo: 0, fama: 0 } },
      ],
    }
    store.temporadaActual!.loteActual = [decisionDePrensa]
    store.resolveDecisionEvento('test-prensa', 0)
    expect(store.fama).toBe(5)

    // Clampea en FAMA_MAX incluso sumando de a mucho.
    for (let i = 0; i < 30; i++) {
      store.temporadaActual!.loteActual = [{ ...decisionDePrensa, id: `test-prensa-${i}` }]
      store.resolveDecisionEvento(`test-prensa-${i}`, 0)
    }
    expect(store.fama).toBe(GameConfig.FAMA_MAX)
  })

  it('fama: sube al cerrar la temporada si ganaste trofeos, más por un premio individual que por uno de equipo', () => {
    const store = useCareerStore()
    store.iniciarCarrera(jugadorDePrueba())

    // Fuerza 2 trofeos "de equipo" ya ganados antes de que cierre la
    // temporada — finalizarTemporada nunca resetea t.trofeos, solo le
    // agrega arriba (los de club/selección/premios individuales que se
    // resuelven ese mismo cierre), así que estos sobreviven al cierre.
    vi.useFakeTimers()
    try {
      let iters = 0
      while (store.temporadaActual!.numero === 1 && iters < 200) {
        iters++
        const t = store.temporadaActual!
        t.trofeos = [
          { nombre: 'La Liga', imagen: null },
          { nombre: 'Copa del Rey', imagen: null },
        ]
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

      expect(store.temporadaActual!.numero).toBe(2)
      // Al menos los 2 trofeos forzados (más lo que haya salido de premios
      // individuales/selección esa temporada, que solo puede sumar más).
      expect(store.fama).toBeGreaterThanOrEqual(2 * GameConfig.FAMA_POR_TROFEO)
    } finally {
      vi.useRealTimers()
    }
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
      // Termina la temporada 1 resolviendo lo que vaya saliendo. pesoTitular/
      // promedio se fuerzan bajos ANTES de cada resolución (no solo cuando
      // el lote queda vacío) — el cierre de temporada puede llegar en
      // cualquier resolución de la última pausa, y `finalizarTemporada` lee
      // el promedio/pesoTitular vigentes en ESE momento; forzarlos siempre
      // de antemano evita depender de en qué resolución exacta cae el
      // cierre (que varía con el estado global de Math.random entre tests).
      let iters = 0
      while (store.temporadaActual!.numero === 1 && iters < 50) {
        iters++
        const t = store.temporadaActual!
        const primero = t.loteActual[0]
        if (!primero) break
        t.pesoTitular = 0.1
        t.sumaRating = 5.0 * Math.max(t.partidos, 1)
        t.promedio = 5.0
        if ('esInformeLesion' in primero && primero.esInformeLesion) {
          store.simularTramoYAvanzar()
        } else if ('tipoOferta' in primero) {
          store.resolveOferta(primero)
        } else {
          store.resolveDecisionEvento((primero as DecisionCard).id, 0)
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

  it('capitanía: se activa tras suficientes temporadas con pesoTitular alto en el mismo club, y se resetea en un traspaso', () => {
    const store = useCareerStore()
    store.iniciarCarrera(jugadorDePrueba())

    vi.useFakeTimers()
    try {
      let iters = 0
      while (store.temporadaActual!.capitan !== true && iters < 500) {
        iters++
        const t = store.temporadaActual!
        t.pesoTitular = 0.9 // muy por encima de CAPITAN_UMBRAL_PESO_TITULAR
        const primero = t.loteActual[0]
        if (!primero) break
        if ('esInformeLesion' in primero && primero.esInformeLesion) {
          store.simularTramoYAvanzar()
        } else if ('tipoOferta' in primero) {
          store.resolveOferta(primero) // "quedarme" siempre primero en el lote
        } else {
          store.resolveDecisionEvento((primero as DecisionCard).id, 0)
        }
        vi.advanceTimersByTime(GameConfig.ANIMACION_TRAMO_MS + 200)
      }

      expect(store.temporadaActual!.capitan).toBe(true)
      expect(store.temporadasEnClubActual).toBeGreaterThanOrEqual(GameConfig.CAPITAN_UMBRAL_TEMPORADAS)
      expect(store.mensajes.some((m) => m.includes('nombraron capitán'))).toBe(true)

      // Un traspaso real resetea la capitanía — te la tienes que volver a ganar.
      const clubActualId = store.temporadaActual!.equipoId
      const otroClub = GameDatabase.equipos.find((e) => e.id !== clubActualId)!
      const otraLiga = GameDatabase.ligas.find((l) => l.id === otroClub.ligaId)!
      store.resolveOferta({
        id: 'test-transfer',
        tipoOferta: 'club',
        equipo: otroClub,
        liga: otraLiga,
        valorOfrecido: GameConfig.calcularValorMercado(store.temporadaActual!.ovr, otroClub, otraLiga),
        desc: 'test',
      })

      expect(store.temporadaActual!.capitan).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('rival: se genera al iniciar la carrera, con nivel de candidato élite, y crece temporada a temporada', () => {
    const store = useCareerStore()
    store.iniciarCarrera(jugadorDePrueba())

    expect(store.rival).not.toBeNull()
    expect(store.rival!.ovr).toBeGreaterThanOrEqual(GameConfig.PREMIOS_OVR_MIN)
    expect(store.rival!.ovr).toBeLessThanOrEqual(GameConfig.PREMIOS_OVR_MAX)
    expect(GameDatabase.equipos.some((e) => e.id === store.rival!.equipoId)).toBe(true)
    expect(store.rival!.golesCarrera).toBe(0)

    const iters = correrCarreraCompleta(store, 200)
    expect(iters).toBeGreaterThan(0)
    // Tras avanzar temporadas, el rival ya jugó (mismo pool de partidos
    // que cualquier candidato élite) — sus totales de carrera crecieron.
    expect(store.rival!.golesCarrera + store.rival!.asistenciasCarrera).toBeGreaterThan(0)
  })

  it('rival: persiste en guardar/cargar', () => {
    const store = useCareerStore()
    store.iniciarCarrera(jugadorDePrueba())
    const rivalAntes = { ...store.rival! }

    setActivePinia(createPinia())
    const storeNuevo = useCareerStore()
    expect(storeNuevo.cargar()).toBe(true)
    expect(storeNuevo.rival).toEqual(rivalAntes)
  })
})
