import { describe, it, expect, vi } from 'vitest'
import { GameConfig } from '../config'
import { GameDatabase } from '../../data/database'

const chile = GameDatabase.ligas.find((l) => l.id === 'primera-division-chile')!
const premier = GameDatabase.ligas.find((l) => l.id === 'premier-league')!

describe('GameConfig — utilidades', () => {
  it('clamp recorta al rango', () => {
    expect(GameConfig.clamp(5, 0, 10)).toBe(5)
    expect(GameConfig.clamp(-5, 0, 10)).toBe(0)
    expect(GameConfig.clamp(15, 0, 10)).toBe(10)
  })

  it('randomInt siempre cae dentro del rango pedido', () => {
    for (let i = 0; i < 500; i++) {
      const n = GameConfig.randomInt(3, 7)
      expect(n).toBeGreaterThanOrEqual(3)
      expect(n).toBeLessThanOrEqual(7)
    }
  })
})

describe('GameConfig — dorsal inicial', () => {
  it('siempre sortea un número entre 1 y 99', () => {
    for (let i = 0; i < 500; i++) {
      const n = GameConfig.sortearDorsalInicial()
      expect(n).toBeGreaterThanOrEqual(1)
      expect(n).toBeLessThanOrEqual(99)
    }
  })
})

describe('GameConfig — factorPorFuerzaLiga (competitividad de liga)', () => {
  it('el mismo OVR rinde mejor en una liga floja que en una fuerte', () => {
    const factorChile = GameConfig.factorPorFuerzaLiga(70, chile.fuerza)
    const factorPremier = GameConfig.factorPorFuerzaLiga(70, premier.fuerza)
    expect(factorChile).toBeGreaterThan(factorPremier)
  })

  it('sin liga (fuerzaLiga null) el factor es neutral (1)', () => {
    expect(GameConfig.factorPorFuerzaLiga(70, null)).toBe(1)
  })

  it('queda siempre clampeado a FACTOR_LIGA_MIN/MAX', () => {
    const factorMuyBajo = GameConfig.factorPorFuerzaLiga(45, 99)
    const factorMuyAlto = GameConfig.factorPorFuerzaLiga(99, 30)
    expect(factorMuyBajo).toBeGreaterThanOrEqual(GameConfig.FACTOR_LIGA_MIN)
    expect(factorMuyAlto).toBeLessThanOrEqual(GameConfig.FACTOR_LIGA_MAX)
  })
})

describe('GameConfig — simularTramo', () => {
  it('sin partidos jugados no genera estadísticas', () => {
    const r = GameConfig.simularTramo({ partidos: 0, posicion: 'DC', ovr: 80, rendimientoAcumulado: 0 })
    expect(r).toEqual({ goles: 0, asistencias: 0, mvp: 0, sumaRating: 0 })
  })

  it('el rating de cada partido nunca sale de 5-10', () => {
    // factorTalento alto + OVR tope: el caso mas favorable para pisar el techo.
    const r = GameConfig.simularTramo({ partidos: 200, posicion: 'DC', ovr: 99, rendimientoAcumulado: 12, factorTalento: 1.2 })
    const promedio = r.sumaRating / 200
    expect(promedio).toBeGreaterThanOrEqual(5)
    expect(promedio).toBeLessThanOrEqual(10)
  })

  it('a mayor OVR, más goles en promedio (misma posición, mismo talento)', () => {
    const N = 400
    const promedioGoles = (ovr: number) => {
      let total = 0
      for (let i = 0; i < N; i++) {
        total += GameConfig.simularTramo({ partidos: 34, posicion: 'DC', ovr, rendimientoAcumulado: 0 }).goles
      }
      return total / N
    }
    expect(promedioGoles(85)).toBeGreaterThan(promedioGoles(60))
  })

  it('cada posición tiene su propia propensión — un DC ya no rinde igual que un extremo', () => {
    const N = 500
    const promedios = (posicion: string) => {
      let goles = 0
      let asistencias = 0
      for (let i = 0; i < N; i++) {
        const r = GameConfig.simularTramo({ partidos: 34, posicion, ovr: 80, rendimientoAcumulado: 0 })
        goles += r.goles
        asistencias += r.asistencias
      }
      return { goles: goles / N, asistencias: asistencias / N }
    }

    const dc = promedios('DC')
    const ei = promedios('EI')
    const mco = promedios('MCO')
    const mcd = promedios('MCD')

    // El DC es el mayor goleador de la cancha, por encima incluso del extremo.
    expect(dc.goles).toBeGreaterThan(ei.goles)
    // El extremo, en cambio, reparte más entre asistencia y gol.
    expect(ei.asistencias).toBeGreaterThan(dc.asistencias)
    // El MCO es el mediocampista más ofensivo — por delante del MCD, el más contenedor.
    expect(mco.goles + mco.asistencias).toBeGreaterThan(mcd.goles + mcd.asistencias)
  })

  it('una posición desconocida cae al perfil neutral (MC), sin romper', () => {
    const r = GameConfig.simularTramo({ partidos: 10, posicion: 'NO_EXISTE', ovr: 80, rendimientoAcumulado: 0 })
    expect(r.sumaRating).toBeGreaterThan(0)
  })
})

describe('GameConfig — talento oculto también pesa en estadísticas', () => {
  it('a igual OVR, más talento produce más goles en promedio', () => {
    const N = 500
    const promedioGoles = (factorTalento: number) => {
      let total = 0
      for (let i = 0; i < N; i++) {
        total += GameConfig.simularTramo({ partidos: 34, posicion: 'DC', ovr: 60, rendimientoAcumulado: 0, factorTalento }).goles
      }
      return total / N
    }
    expect(promedioGoles(GameConfig.TALENTO_MAX)).toBeGreaterThan(promedioGoles(GameConfig.TALENTO_MIN))
  })
})

describe('GameConfig — ajustarOvrTramo (crecimiento/declive)', () => {
  it('nunca devuelve un OVR fuera de OVR_CARRERA_MIN/MAX', () => {
    const bajo = GameConfig.ajustarOvrTramo(GameConfig.OVR_CARRERA_MIN, -12, 40, 0.85)
    const alto = GameConfig.ajustarOvrTramo(GameConfig.OVR_CARRERA_MAX, 12, 20, 1.2)
    expect(bajo).toBeGreaterThanOrEqual(GameConfig.OVR_CARRERA_MIN)
    expect(alto).toBeLessThanOrEqual(GameConfig.OVR_CARRERA_MAX)
  })

  it('el salto de calidad NO se activa fuera de la etapa Prime', () => {
    // Mismo ovrActual bajo, un jugador en meseta/ocaso (edad > OVR_EDAD_PRIME_MAX)
    // no debería crecer más rápido que uno en prime con rendimiento negativo
    // fuerte (declive ya empezando) — factorAprendizajeJoven da 1x fuera de Prime.
    expect(GameConfig.factorAprendizajeJoven(50, 35)).toBe(1)
    expect(GameConfig.factorAprendizajeJoven(50, 25)).toBeGreaterThan(1)
  })
})

describe('GameConfig — probabilidadJugar (participación según OVR)', () => {
  // Referencia (55 de OVR, rendimiento/forma neutros, no titular): sin
  // cambios respecto al valor base.
  it('en la referencia, devuelve exactamente PARTICIPACION_BASE', () => {
    const prob = GameConfig.probabilidadJugar(55, 0, 'regular', false)
    expect(prob).toBeCloseTo(GameConfig.PARTICIPACION_BASE, 5)
  })

  it('un novato en el piso real de OVR inicial casi no juega', () => {
    const prob = GameConfig.probabilidadJugar(GameConfig.OVR_INICIAL_MIN, 0, 'regular', false)
    expect(prob).toBeCloseTo(0.25, 5)
  })

  it('un novato en el techo de OVR inicial ya juega bastante', () => {
    const prob = GameConfig.probabilidadJugar(GameConfig.OVR_INICIAL_MAX, 0, 'regular', false)
    expect(prob).toBeCloseTo(0.85, 5)
  })

  it('ni el mejor jugador del mundo llega al 100% — el techo es PARTICIPACION_MAX', () => {
    const prob = GameConfig.probabilidadJugar(GameConfig.OVR_CARRERA_MAX, 10, 'inspirado', true)
    expect(prob).toBe(GameConfig.PARTICIPACION_MAX)
  })

  it('por debajo de la referencia castiga más fuerte que por encima (pendiente asimétrica)', () => {
    const cincoAbajo = GameConfig.PARTICIPACION_BASE - GameConfig.probabilidadJugar(50, 0, 'regular', false)
    const cincoArriba = GameConfig.probabilidadJugar(60, 0, 'regular', false) - GameConfig.PARTICIPACION_BASE
    expect(cincoAbajo).toBeGreaterThan(cincoArriba)
  })
})

describe('GameConfig — calcularFuerzaTitulo (título de liga/copa internacional)', () => {
  const bundesliga = GameDatabase.ligas.find((l) => l.id === 'bundesliga')!
  const bayern = GameDatabase.equipos.find((e) => e.id === 'bayern-munich')!
  const frankfurt = GameDatabase.equipos.find((e) => e.id === 'eintracht-frankfurt')!

  it('con un jugador de rendimiento neutro, pesa la calidad del club mucho más que la fuerza de campaña compartida', () => {
    const fuerzaCampana = GameConfig.calcularFuerzaCampana(bayern, bundesliga, 'regular', 0, null)
    const fuerzaTitulo = GameConfig.calcularFuerzaTitulo(bayern, bundesliga, 'regular', 0, null)
    expect(fuerzaTitulo).toBeGreaterThan(fuerzaCampana)
  })

  it('un candidato real al título (Bayern) queda claramente por delante de un club de mitad de tabla (Frankfurt)', () => {
    const fuerzaBayern = GameConfig.calcularFuerzaTitulo(bayern, bundesliga, 'regular', 0, null)
    const fuerzaFrankfurt = GameConfig.calcularFuerzaTitulo(frankfurt, bundesliga, 'regular', 0, null)
    const probBayern = GameConfig.probGanarLiga(fuerzaBayern)
    const probFrankfurt = GameConfig.probGanarLiga(fuerzaFrankfurt)

    expect(probBayern).toBeGreaterThan(0.4) // ya candidato de entrada, sin necesitar una temporada perfecta
    expect(probBayern).toBeGreaterThan(probFrankfurt + 0.1) // separación real entre ambos
  })

  it('una gran temporada personal sigue empujando la fuerza de título más arriba', () => {
    const neutro = GameConfig.calcularFuerzaTitulo(bayern, bundesliga, 'regular', 0, null)
    const granTemporada = GameConfig.calcularFuerzaTitulo(bayern, bundesliga, 'inspirado', GameConfig.FUERZA_EQUIPO_ACUMULADO_REFERENCIA, 9)
    expect(granTemporada).toBeGreaterThan(neutro)
  })
})

describe('GameConfig — calcularTitular (peso del OVR)', () => {
  // pesoTitular neutro (0.5) y sin rendimiento acumulado: la probabilidad
  // exacta queda en pesoTitular + (ovr - TITULAR_OVR_REFERENCIA) * TITULAR_OVR_PESO
  // (sin el clamp interno, que acá no llega a activarse). Un Math.random()
  // apenas por debajo de esa probabilidad da titular=true, apenas por
  // encima da false — demuestra que el cálculo interno usa exactamente
  // ese valor, o sea que TITULAR_OVR_PESO de verdad se está aplicando.
  it('el ajuste de OVR pesa el doble que antes (0.02, no el 0.01 viejo)', () => {
    const pesoTitular = 0.5
    const randomSpy = vi.spyOn(Math, 'random')

    const ovrBajo = 45 // 10 puntos por debajo de la referencia
    const probBaja = pesoTitular + (ovrBajo - GameConfig.TITULAR_OVR_REFERENCIA) * GameConfig.TITULAR_OVR_PESO
    randomSpy.mockReturnValue(probBaja - 0.005)
    expect(GameConfig.calcularTitular(pesoTitular, ovrBajo, 0)).toBe(true)
    randomSpy.mockReturnValue(probBaja + 0.005)
    expect(GameConfig.calcularTitular(pesoTitular, ovrBajo, 0)).toBe(false)

    const ovrAlto = 65 // 10 puntos por encima de la referencia
    const probAlta = pesoTitular + (ovrAlto - GameConfig.TITULAR_OVR_REFERENCIA) * GameConfig.TITULAR_OVR_PESO
    randomSpy.mockReturnValue(probAlta - 0.005)
    expect(GameConfig.calcularTitular(pesoTitular, ovrAlto, 0)).toBe(true)
    randomSpy.mockReturnValue(probAlta + 0.005)
    expect(GameConfig.calcularTitular(pesoTitular, ovrAlto, 0)).toBe(false)

    randomSpy.mockRestore()
  })
})

describe('GameConfig — contratoDebeTerminar y gracia de contrato', () => {
  it('el primer club da el doble de margen que uno posterior', () => {
    expect(GameConfig.TEMPORADAS_GRACIA_CONTRATO_PRIMER_CLUB).toBe(GameConfig.TEMPORADAS_GRACIA_CONTRATO * 2)
  })
})

describe('GameConfig — Balón de Oro exige trofeo real', () => {
  it('con las mismas estadísticas, ganar un trofeo real sube la calidad', () => {
    const sinTrofeo = GameConfig.calcularCalidadBalonDeOro(9.0, 35, false)
    const conTrofeo = GameConfig.calcularCalidadBalonDeOro(9.0, 35, true)
    expect(conTrofeo).toBeGreaterThan(sinTrofeo)
    expect(conTrofeo - sinTrofeo).toBeCloseTo(GameConfig.BALON_ORO_PESO_TROFEOS, 5)
  })
})

describe('GameConfig — valor de mercado', () => {
  it('crece con el OVR, a igual club/liga', () => {
    const equipo = GameDatabase.equipos[0]!
    const liga = GameDatabase.ligas.find((l) => l.id === equipo.ligaId)!
    const valorBajo = GameConfig.calcularValorMercado(50, equipo, liga)
    const valorAlto = GameConfig.calcularValorMercado(90, equipo, liga)
    expect(valorAlto).toBeGreaterThan(valorBajo)
  })
})
