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
  // Edad "neutra" (sin penalización de novato — ver EDAD_NOVATO_HASTA)
  // para aislar el efecto de OVR/forma/decisiones en estos tests, igual
  // que antes de agregar la penalización por edad.
  const EDAD_NEUTRA = GameConfig.PARTICIPACION_EDAD_NOVATO_HASTA

  // Referencia (55 de OVR, rendimiento/forma neutros, no titular): sin
  // cambios respecto al valor base.
  it('en la referencia, devuelve exactamente PARTICIPACION_BASE', () => {
    const prob = GameConfig.probabilidadJugar(55, 0, 'regular', false, EDAD_NEUTRA)
    expect(prob).toBeCloseTo(GameConfig.PARTICIPACION_BASE, 5)
  })

  it('un novato en el piso real de OVR inicial casi no juega', () => {
    const prob = GameConfig.probabilidadJugar(GameConfig.OVR_INICIAL_MIN, 0, 'regular', false, EDAD_NEUTRA)
    expect(prob).toBeCloseTo(0.25, 5)
  })

  it('un novato en el techo de OVR inicial ya juega bastante', () => {
    const prob = GameConfig.probabilidadJugar(GameConfig.OVR_INICIAL_MAX, 0, 'regular', false, EDAD_NEUTRA)
    expect(prob).toBeCloseTo(0.85, 5)
  })

  it('ni el mejor jugador del mundo llega al 100% — el techo es PARTICIPACION_MAX', () => {
    const prob = GameConfig.probabilidadJugar(GameConfig.OVR_CARRERA_MAX, 10, 'inspirado', true, EDAD_NEUTRA)
    expect(prob).toBe(GameConfig.PARTICIPACION_MAX)
  })

  it('por debajo de la referencia castiga más fuerte que por encima (pendiente asimétrica)', () => {
    const cincoAbajo = GameConfig.PARTICIPACION_BASE - GameConfig.probabilidadJugar(50, 0, 'regular', false, EDAD_NEUTRA)
    const cincoArriba = GameConfig.probabilidadJugar(60, 0, 'regular', false, EDAD_NEUTRA) - GameConfig.PARTICIPACION_BASE
    expect(cincoAbajo).toBeGreaterThan(cincoArriba)
  })

  it('un novato de 16 a 19 años juega bastante menos que uno igual de grande (plateau, no tapering desde el día 1)', () => {
    // esTitular: false — con true, el bonus de titular ya empuja contra
    // PARTICIPACION_MAX y el clamp del techo distorsiona la diferencia.
    const grande = GameConfig.probabilidadJugar(60, 0, 'regular', false, EDAD_NEUTRA)
    for (const edad of [16, 17, 18, 19]) {
      const joven = GameConfig.probabilidadJugar(60, 0, 'regular', false, edad)
      expect(grande - joven).toBeCloseTo(GameConfig.PARTICIPACION_PENALIZACION_NOVATO_MAX, 5)
    }
  })

  it('la penalización de novato baja lineal recién después del plateau (19-24)', () => {
    const mitad = (GameConfig.PARTICIPACION_EDAD_NOVATO_PLATEAU_HASTA + GameConfig.PARTICIPACION_EDAD_NOVATO_HASTA) / 2
    const probMitad = GameConfig.probabilidadJugar(60, 0, 'regular', false, mitad)
    const probGrande = GameConfig.probabilidadJugar(60, 0, 'regular', false, EDAD_NEUTRA)
    expect(probGrande - probMitad).toBeCloseTo(GameConfig.PARTICIPACION_PENALIZACION_NOVATO_MAX / 2, 5)
  })

  it('sin promedio de temporada (todavía sin partidos), el rendimiento real no pesa', () => {
    const prob = GameConfig.probabilidadJugar(60, 0, 'regular', false, EDAD_NEUTRA, null)
    const sinPromedio = GameConfig.probabilidadJugar(60, 0, 'regular', false, EDAD_NEUTRA)
    expect(prob).toBeCloseTo(sinPromedio, 5)
  })

  it('un promedio de temporada flojo te baja los minutos, uno bueno te los sube', () => {
    const base = GameConfig.probabilidadJugar(60, 0, 'regular', false, EDAD_NEUTRA, GameConfig.RATING_BASE)
    const flojo = GameConfig.probabilidadJugar(60, 0, 'regular', false, EDAD_NEUTRA, 5.0)
    const bueno = GameConfig.probabilidadJugar(60, 0, 'regular', false, EDAD_NEUTRA, 8.5)
    expect(flojo).toBeLessThan(base)
    expect(bueno).toBeGreaterThan(base)
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

describe('GameConfig — VENTAJA_DOMINANCIA_DOMESTICA (Bayern/PSG vs su liga)', () => {
  const bundesliga = GameDatabase.ligas.find((l) => l.id === 'bundesliga')!
  const bayern = GameDatabase.equipos.find((e) => e.id === 'bayern-munich')!
  const leverkusen = GameDatabase.equipos.find((e) => e.id === 'bayer-leverkusen')!

  it('solo incluye a Bayern y PSG, con un bonus positivo', () => {
    expect(Object.keys(GameConfig.VENTAJA_DOMINANCIA_DOMESTICA).sort()).toEqual(['bayern-munich', 'psg'])
    expect(GameConfig.VENTAJA_DOMINANCIA_DOMESTICA['bayern-munich']).toBeGreaterThan(0)
    expect(GameConfig.VENTAJA_DOMINANCIA_DOMESTICA['psg']).toBeGreaterThan(0)
  })

  it('sin el bonus, Bayern y su rival más cercano (Leverkusen) están casi empatados en chances de título', () => {
    const fuerzaBayern = GameConfig.calcularFuerzaTitulo(bayern, bundesliga, 'regular', 0, null)
    const fuerzaLeverkusen = GameConfig.calcularFuerzaTitulo(leverkusen, bundesliga, 'regular', 0, null)
    const probBayern = GameConfig.probGanarLiga(fuerzaBayern)
    const probLeverkusen = GameConfig.probGanarLiga(fuerzaLeverkusen)
    // La brecha real (antes del bonus) es chica — es exactamente el problema
    // que este bonus corrige, no algo a exagerar en este test.
    expect(probBayern - probLeverkusen).toBeLessThan(0.1)
  })

  it('con el bonus aplicado (como hace finalizarTemporada, solo para el título de liga), Bayern se despega claramente', () => {
    const fuerzaBayern = GameConfig.calcularFuerzaTitulo(bayern, bundesliga, 'regular', 0, null)
    const fuerzaLeverkusen = GameConfig.calcularFuerzaTitulo(leverkusen, bundesliga, 'regular', 0, null)
    const fuerzaBayernConBonus = GameConfig.clamp(fuerzaBayern + GameConfig.VENTAJA_DOMINANCIA_DOMESTICA['bayern-munich']!, 0, 1)
    const probBayernConBonus = GameConfig.probGanarLiga(fuerzaBayernConBonus)
    const probLeverkusen = GameConfig.probGanarLiga(fuerzaLeverkusen)

    expect(probBayernConBonus).toBeGreaterThan(0.6)
    expect(probBayernConBonus - probLeverkusen).toBeGreaterThan(0.15)
  })

  it('un club sin entrada en el mapa no recibe ningún bonus', () => {
    expect(GameConfig.VENTAJA_DOMINANCIA_DOMESTICA[leverkusen.id]).toBeUndefined()
  })
})

describe('GameConfig — calcularTitular (peso del OVR)', () => {
  // Edad "neutra" (sin penalización de novato) para aislar el efecto de
  // OVR/pesoTitular en estos tests.
  const EDAD_NEUTRA = GameConfig.TITULAR_EDAD_NOVATO_HASTA

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
    expect(GameConfig.calcularTitular(pesoTitular, ovrBajo, 0, EDAD_NEUTRA)).toBe(true)
    randomSpy.mockReturnValue(probBaja + 0.005)
    expect(GameConfig.calcularTitular(pesoTitular, ovrBajo, 0, EDAD_NEUTRA)).toBe(false)

    const ovrAlto = 65 // 10 puntos por encima de la referencia
    const probAlta = pesoTitular + (ovrAlto - GameConfig.TITULAR_OVR_REFERENCIA) * GameConfig.TITULAR_OVR_PESO
    randomSpy.mockReturnValue(probAlta - 0.005)
    expect(GameConfig.calcularTitular(pesoTitular, ovrAlto, 0, EDAD_NEUTRA)).toBe(true)
    randomSpy.mockReturnValue(probAlta + 0.005)
    expect(GameConfig.calcularTitular(pesoTitular, ovrAlto, 0, EDAD_NEUTRA)).toBe(false)

    randomSpy.mockRestore()
  })

  it('un novato de 16-19 tiene bastante menos chance de ser titular que uno igual de grande', () => {
    const randomSpy = vi.spyOn(Math, 'random')
    const pesoTitular = 0.4
    const ovr = 63

    const probBase = pesoTitular + (ovr - GameConfig.TITULAR_OVR_REFERENCIA) * GameConfig.TITULAR_OVR_PESO
    const probJoven = probBase - GameConfig.TITULAR_PENALIZACION_NOVATO_MAX

    randomSpy.mockReturnValue(probJoven + 0.005)
    expect(GameConfig.calcularTitular(pesoTitular, ovr, 0, 17)).toBe(false)
    randomSpy.mockReturnValue(probJoven - 0.005)
    expect(GameConfig.calcularTitular(pesoTitular, ovr, 0, 17)).toBe(true)

    // A los 19 todavía está en el plateau — misma penalización máxima que a los 17.
    randomSpy.mockReturnValue(probJoven - 0.005)
    expect(GameConfig.calcularTitular(pesoTitular, ovr, 0, 19)).toBe(true)
    randomSpy.mockReturnValue(probJoven + 0.005)
    expect(GameConfig.calcularTitular(pesoTitular, ovr, 0, 19)).toBe(false)

    randomSpy.mockRestore()
  })

  it('la penalización de titularidad por edad baja lineal recién después del plateau (19-24)', () => {
    const randomSpy = vi.spyOn(Math, 'random')
    const pesoTitular = 0.4
    const ovr = 63
    const probBase = pesoTitular + (ovr - GameConfig.TITULAR_OVR_REFERENCIA) * GameConfig.TITULAR_OVR_PESO

    const mitad = (GameConfig.TITULAR_EDAD_NOVATO_PLATEAU_HASTA + GameConfig.TITULAR_EDAD_NOVATO_HASTA) / 2
    const probMitad = probBase - GameConfig.TITULAR_PENALIZACION_NOVATO_MAX / 2

    randomSpy.mockReturnValue(probMitad - 0.005)
    expect(GameConfig.calcularTitular(pesoTitular, ovr, 0, mitad)).toBe(true)
    randomSpy.mockReturnValue(probMitad + 0.005)
    expect(GameConfig.calcularTitular(pesoTitular, ovr, 0, mitad)).toBe(false)

    randomSpy.mockRestore()
  })
})

describe('GameConfig — contratoDebeTerminar y gracia de contrato', () => {
  it('el primer club da el doble de margen que uno posterior', () => {
    expect(GameConfig.TEMPORADAS_GRACIA_CONTRATO_PRIMER_CLUB).toBe(GameConfig.TEMPORADAS_GRACIA_CONTRATO * 2)
  })
})

describe('GameConfig — clubDebePrestar (préstamos)', () => {
  it('necesita las dos condiciones a la vez — poco Y mal', () => {
    const umbralPeso = GameConfig.PRESTAMO_PESO_TITULAR_UMBRAL
    const umbralPromedio = GameConfig.PRESTAMO_PROMEDIO_UMBRAL

    // Poco (pesoTitular bajo) pero bien (promedio alto): no dispara.
    expect(GameConfig.clubDebePrestar(umbralPeso - 0.1, umbralPromedio + 1)).toBe(false)
    // Bien (pesoTitular alto) pero mal (promedio bajo): no dispara.
    expect(GameConfig.clubDebePrestar(umbralPeso + 0.1, umbralPromedio - 1)).toBe(false)
    // Poco y mal a la vez: sí dispara.
    expect(GameConfig.clubDebePrestar(umbralPeso - 0.1, umbralPromedio - 1)).toBe(true)
    // Bien en las dos: no dispara.
    expect(GameConfig.clubDebePrestar(umbralPeso + 0.1, umbralPromedio + 1)).toBe(false)
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
