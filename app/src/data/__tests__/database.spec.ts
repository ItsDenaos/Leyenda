import { describe, it, expect } from 'vitest'
import { GameDatabase } from '../database'

describe('GameDatabase', () => {
  it('tiene la cantidad de registros esperada', () => {
    expect(GameDatabase.ligas).toHaveLength(29)
    expect(GameDatabase.selecciones).toHaveLength(46)
    expect(GameDatabase.equipos).toHaveLength(510)
    expect(GameDatabase.competiciones).toHaveLength(71)
  })

  it('cada equipo apunta a una liga que existe', () => {
    const ligaIds = new Set(GameDatabase.ligas.map((l) => l.id))
    const huerfanos = GameDatabase.equipos.filter((e) => !ligaIds.has(e.ligaId))
    expect(huerfanos).toEqual([])
  })

  it('cada competición doméstica apunta a una liga que existe', () => {
    const ligaIds = new Set(GameDatabase.ligas.map((l) => l.id))
    const domesticas = GameDatabase.competiciones.filter((c) => c.tipo === 'domestica')
    const huerfanas = domesticas.filter((c) => !c.ligaId || !ligaIds.has(c.ligaId))
    expect(huerfanas).toEqual([])
  })

  it('no hay ids duplicados dentro de cada colección', () => {
    const dupes = <T>(items: T[], key: (x: T) => string) => {
      const seen = new Set<string>()
      const found: string[] = []
      for (const item of items) {
        const k = key(item)
        if (seen.has(k)) found.push(k)
        seen.add(k)
      }
      return found
    }

    expect(dupes(GameDatabase.ligas, (l) => l.id)).toEqual([])
    expect(dupes(GameDatabase.equipos, (e) => e.id)).toEqual([])
    expect(dupes(GameDatabase.competiciones, (c) => c.id)).toEqual([])
    expect(dupes(GameDatabase.selecciones, (s) => s.pais)).toEqual([])
  })

  it('los ejes fuerza/prestigio/economía quedan siempre entre 0 y 100', () => {
    const fueraDeRango = (n: number) => n < 0 || n > 100
    const todos = [...GameDatabase.ligas, ...GameDatabase.equipos]
    const invalidos = todos.filter(
      (x) => fueraDeRango(x.fuerza) || fueraDeRango(x.prestigio) || fueraDeRango(x.economia),
    )
    expect(invalidos).toEqual([])
  })
})
