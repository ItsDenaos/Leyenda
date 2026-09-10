// Interpola un número reactivo entre su valor viejo y el nuevo cada vez
// que cambia, en vez de saltar directo — portado de animarNumero()/
// animarAnilloProgreso() en carrera.js (mismo ease-out cúbico, misma
// duración de 900ms). El original lo hacía a mano con requestAnimationFrame
// porque tanto el texto de un contador como la variable CSS `--progress`
// (usada en un conic-gradient) no son propiedades que una transición CSS
// pueda animar por sí sola.
import { ref, watch, onUnmounted, type Ref } from 'vue'

const DURACION_MS = 900

export function useAnimatedNumber(source: () => number, duracionMs = DURACION_MS): Ref<number> {
  const valorMostrado = ref(source())
  let frameId: number | null = null

  function animarHasta(hasta: number) {
    const desde = valorMostrado.value
    if (frameId !== null) cancelAnimationFrame(frameId)
    if (desde === hasta) return
    const inicio = performance.now()
    const frame = (ahora: number) => {
      const t = Math.min((ahora - inicio) / duracionMs, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      valorMostrado.value = desde + (hasta - desde) * eased
      frameId = t < 1 ? requestAnimationFrame(frame) : null
    }
    frameId = requestAnimationFrame(frame)
  }

  watch(source, (nuevo) => animarHasta(nuevo))

  onUnmounted(() => {
    if (frameId !== null) cancelAnimationFrame(frameId)
  })

  return valorMostrado
}
