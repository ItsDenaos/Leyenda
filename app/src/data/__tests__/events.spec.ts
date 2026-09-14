import { describe, it, expect } from 'vitest'
import { GameEvents, type Evento } from '../events'

const todosLosEventos: Evento[] = [
  ...GameEvents.generales,
  ...GameEvents.porEdad.novato,
  ...GameEvents.porEdad.promedio,
  ...GameEvents.porEdad.veterano,
  ...GameEvents.altoImpacto,
]

describe('GameEvents', () => {
  it('tiene la cantidad de registros esperada', () => {
    expect(GameEvents.generales).toHaveLength(100)
    expect(GameEvents.porEdad.novato).toHaveLength(35)
    expect(GameEvents.porEdad.promedio).toHaveLength(35)
    expect(GameEvents.porEdad.veterano).toHaveLength(34)
    expect(GameEvents.altoImpacto).toHaveLength(22)
    expect(GameEvents.lesiones.nivel1).toHaveLength(5)
    expect(GameEvents.lesiones.nivel2).toHaveLength(6)
    expect(GameEvents.lesiones.nivel3).toHaveLength(6)
  })

  it('todo evento tiene exactamente 2 opciones', () => {
    const conOpcionesInvalidas = todosLosEventos.filter((e) => e.opciones.length !== 2)
    expect(conOpcionesInvalidas).toEqual([])
  })

  it('no hay ids de evento duplicados en toda la carrera (los bancos comparten eventosUsados)', () => {
    const seen = new Set<string>()
    const dupes: string[] = []
    for (const e of todosLosEventos) {
      if (seen.has(e.id)) dupes.push(e.id)
      seen.add(e.id)
    }
    expect(dupes).toEqual([])
  })

  it('los personajes usados están todos en personajesPosibles', () => {
    const posibles = new Set(GameEvents.personajesPosibles)
    const usados = new Set(todosLosEventos.flatMap((e) => e.personajes))
    const desconocidos = [...usados].filter((p) => !posibles.has(p))
    expect(desconocidos).toEqual([])
  })

  it('marca exactamente los 2 eventos de debut esperados (nov-08, nov-32)', () => {
    const conDebut = todosLosEventos.filter((e) => e.debut).map((e) => e.id)
    expect(conDebut.sort()).toEqual(['nov-08', 'nov-32'])
  })

  it('marca exactamente 14 eventos como no elegibles durante lesión', () => {
    const marcados = todosLosEventos.filter((e) => e.noDuranteLesion)
    expect(marcados).toHaveLength(14)
  })
})
