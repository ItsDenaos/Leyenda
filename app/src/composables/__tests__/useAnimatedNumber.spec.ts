import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useAnimatedNumber } from '../useAnimatedNumber'

describe('useAnimatedNumber', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it('arranca directo en el valor inicial, sin animar', () => {
    const source = ref(42)
    const animado = useAnimatedNumber(() => source.value)
    expect(animado.value).toBe(42)
  })

  it('al cambiar el valor, interpola gradualmente hasta llegar al nuevo (900ms, ease-out)', async () => {
    const source = ref(0)
    const animado = useAnimatedNumber(() => source.value, 900)

    source.value = 100
    await nextTick() // deja que el watcher dispare el primer requestAnimationFrame

    vi.advanceTimersByTime(1) // primer frame: prácticamente en el arranque
    expect(animado.value).toBeGreaterThanOrEqual(0)
    expect(animado.value).toBeLessThan(20)

    vi.advanceTimersByTime(449) // ~mitad de camino (450ms de 900ms)
    const mitad = animado.value
    expect(mitad).toBeGreaterThan(20)
    expect(mitad).toBeLessThan(100)

    vi.advanceTimersByTime(500) // ya pasaron los 900ms totales
    expect(animado.value).toBe(100)
  })

  it('un cambio nuevo a mitad de la animación anterior arranca de nuevo desde el valor mostrado en ese momento (no desde el original)', async () => {
    const source = ref(0)
    const animado = useAnimatedNumber(() => source.value, 900)

    source.value = 100
    await nextTick()
    vi.advanceTimersByTime(450)
    const valorIntermedio = animado.value
    expect(valorIntermedio).toBeGreaterThan(0)
    expect(valorIntermedio).toBeLessThan(100)

    source.value = 50
    await nextTick()
    vi.advanceTimersByTime(1)
    // Recién arrancando la nueva animación, el valor no debería haber saltado
    // de golpe al medio camino entre el valor intermedio y 50.
    expect(animado.value).toBeCloseTo(valorIntermedio, 0)

    vi.advanceTimersByTime(1000) // margen extra: el reinicio no arranca en el t=0 exacto del reloj falso
    expect(animado.value).toBe(50)
  })

  it('si el valor nuevo es igual al mostrado, no arranca ninguna animación', async () => {
    const source = ref(10)
    const animado = useAnimatedNumber(() => source.value, 900)
    source.value = 10
    await nextTick()
    vi.advanceTimersByTime(900)
    expect(animado.value).toBe(10)
  })
})
