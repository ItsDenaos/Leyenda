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

  it('drainQueue vacía la cola de una — el último mensaje es el que queda visible', () => {
    // Igual que showToast() en el original: nunca encolaba, así que si
    // llegan varios mensajes juntos el último simplemente le pisa el
    // texto al anterior, sin esperar a que termine para mostrarse.
    const toast = useToast(1000)
    const cola = ['uno', 'dos', 'tres']
    toast.drainQueue(cola)

    expect(cola).toEqual([])
    expect(toast.message.value).toBe('tres')
    expect(toast.visible.value).toBe(true)
  })

  it('drainQueue con la cola vacía no hace nada', () => {
    const toast = useToast(1000)
    toast.drainQueue([])
    expect(toast.visible.value).toBe(false)
  })
})
