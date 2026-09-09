import { describe, it, expect } from 'vitest'
import { elegirLigaInicial, generarOfertasInicialesParaJugador, ligaDe } from '../initial-offers'
import { GameDatabase } from '../../data/database'
import { GameConfig } from '../config'

describe('initial-offers', () => {
  it('elegirLigaInicial usa la liga local cuando el país tiene una', () => {
    const { liga, extranjero } = elegirLigaInicial('Argentina')
    expect(liga.pais).toBe('Argentina')
    expect(extranjero).toBe(false)
  })

  it('elegirLigaInicial cae a una liga grande europea cuando el país no tiene liga propia', () => {
    const { liga, extranjero } = elegirLigaInicial('Jamaica')
    expect(extranjero).toBe(true)
    expect(GameConfig.LIGAS_GRANDES_EUROPEAS).toContain(liga.id)
  })

  it('generarOfertasInicialesParaJugador devuelve 4 equipos válidos de la misma liga elegida', () => {
    const ofertas = generarOfertasInicialesParaJugador('España')
    expect(ofertas.length).toBe(4)
    const ligaIds = new Set(ofertas.map((e) => e.ligaId))
    expect(ligaIds.size).toBe(1)
    for (const equipo of ofertas) {
      expect(GameDatabase.equipos.some((e) => e.id === equipo.id)).toBe(true)
    }
  })

  it('ligaDe encuentra la liga de un equipo real', () => {
    const equipo = GameDatabase.equipos[0]!
    const liga = ligaDe(equipo)
    expect(liga.id).toBe(equipo.ligaId)
  })
})
