import { describe, it, expect } from 'vitest'
import { calcularArcoOvr } from '../ovr-chart'

describe('calcularArcoOvr', () => {
  it('serie vacía devuelve null', () => {
    expect(calcularArcoOvr([])).toBeNull()
  })

  it('un solo punto queda centrado horizontalmente, en el piso vertical', () => {
    const arco = calcularArcoOvr([{ numero: 1, ovr: 70 }])
    expect(arco).not.toBeNull()
    expect(arco!.puntos).toEqual([{ x: 50, y: 28, ovr: 70, numero: 1 }])
    expect(arco!.lineaPath).toBe('M 50,28')
  })

  it('dos puntos: el de mayor OVR queda más arriba (y menor)', () => {
    const arco = calcularArcoOvr([
      { numero: 1, ovr: 60 },
      { numero: 2, ovr: 80 },
    ])!
    expect(arco.puntos).toEqual([
      { x: 3, y: 28, ovr: 60, numero: 1 },
      { x: 97, y: 6, ovr: 80, numero: 2 },
    ])
    expect(arco.lineaPath).toBe('M 3,28 L 97,6')
    expect(arco.areaPath).toBe('M 3,28 L 3,28 L 97,6 L 97,28 Z')
  })

  it('con OVR constante en toda la serie, todos los puntos quedan a la misma altura', () => {
    const arco = calcularArcoOvr([
      { numero: 1, ovr: 65 },
      { numero: 2, ovr: 65 },
      { numero: 3, ovr: 65 },
    ])!
    const alturas = new Set(arco.puntos.map((p) => p.y))
    expect(alturas.size).toBe(1)
  })

  it('los x quedan repartidos de forma pareja y creciente entre 3 y 97', () => {
    const arco = calcularArcoOvr([
      { numero: 1, ovr: 50 },
      { numero: 2, ovr: 55 },
      { numero: 3, ovr: 60 },
      { numero: 4, ovr: 70 },
    ])!
    const xs = arco.puntos.map((p) => p.x)
    expect(xs[0]).toBe(3)
    expect(xs[xs.length - 1]).toBe(97)
    expect(xs).toEqual([...xs].sort((a, b) => a - b))
  })
})
