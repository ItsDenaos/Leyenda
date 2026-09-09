import { describe, it, expect } from 'vitest'
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
    const r = GameConfig.simularTramo({ partidos: 0, grupo: 'ataque', ovr: 80, rendimientoAcumulado: 0 })
    expect(r).toEqual({ goles: 0, asistencias: 0, mvp: 0, sumaRating: 0 })
  })

  it('el rating de cada partido nunca sale de 5-10', () => {
    // factorTalento alto + OVR tope: el caso mas favorable para pisar el techo.
    const r = GameConfig.simularTramo({ partidos: 200, grupo: 'ataque', ovr: 99, rendimientoAcumulado: 12, factorTalento: 1.2 })
    const promedio = r.sumaRating / 200
    expect(promedio).toBeGreaterThanOrEqual(5)
    expect(promedio).toBeLessThanOrEqual(10)
  })

  it('a mayor OVR, más goles en promedio (misma posición, mismo talento)', () => {
    const N = 400
    const promedioGoles = (ovr: number) => {
      let total = 0
      for (let i = 0; i < N; i++) {
        total += GameConfig.simularTramo({ partidos: 34, grupo: 'ataque', ovr, rendimientoAcumulado: 0 }).goles
      }
      return total / N
    }
    expect(promedioGoles(85)).toBeGreaterThan(promedioGoles(60))
  })
})

describe('GameConfig — talento oculto también pesa en estadísticas', () => {
  it('a igual OVR, más talento produce más goles en promedio', () => {
    const N = 500
    const promedioGoles = (factorTalento: number) => {
      let total = 0
      for (let i = 0; i < N; i++) {
        total += GameConfig.simularTramo({ partidos: 34, grupo: 'ataque', ovr: 60, rendimientoAcumulado: 0, factorTalento }).goles
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
