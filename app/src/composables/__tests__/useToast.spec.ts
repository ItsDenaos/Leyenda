import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useToast } from '../useToast'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('show() pone el mensaje visible y lo oculta solo después de la duración', () => {
    const toast = useToast(1000)
    toast.show('Hola')
    expect(toast.message.value).toBe('Hola')
    expect(toast.visible.value).toBe(true)

    vi.advanceTimersByTime(999)
    expect(toast.visible.value).toBe(true)
    vi.advanceTimersByTime(1)
    expect(toast.visible.value).toBe(false)
  })

  it('un show() nuevo reinicia el temporizador del anterior', () => {
    const toast = useToast(1000)
    toast.show('Primero')
    vi.advanceTimersByTime(800)
    toast.show('Segundo')
    vi.advanceTimersByTime(800)
    // Ya pasaron 800ms desde el segundo show, pero por el primer show ya
    // habrían pasado 1600ms — si no se hubiera reiniciado, ya estaría oculto.
    expect(toast.visible.value).toBe(true)
    expect(toast.message.value).toBe('Segundo')
  })

  it('drainQueue vacía la cola de a un mensaje por vez, en orden', () => {
    const toast = useToast(1000)
    const cola = ['uno', 'dos', 'tres']
    toast.drainQueue(cola)

    expect(toast.message.value).toBe('uno')
    expect(cola).toEqual(['dos', 'tres'])

    vi.advanceTimersByTime(1200)
    expect(toast.message.value).toBe('dos')
    expect(cola).toEqual(['tres'])

    vi.advanceTimersByTime(1200)
    expect(toast.message.value).toBe('tres')
    expect(cola).toEqual([])
  })

  it('drainQueue no arranca un segundo drenado mientras uno ya está en curso', () => {
    const toast = useToast(1000)
    const cola = ['uno', 'dos']
    toast.drainQueue(cola)
    toast.drainQueue(cola) // llamada concurrente — no debería robarle 'dos' antes de tiempo
    expect(cola).toEqual(['dos'])
  })
})
