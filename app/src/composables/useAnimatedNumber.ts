// Interpola un número reactivo entre su valor viejo y el nuevo cada vez
// que cambia, en vez de saltar directo — portado de animarNumero()/
// animarAnilloProgreso() en carrera.js (mismo ease-out cúbico, misma
// duración de 900ms). El original lo hacía a mano con requestAnimationFrame
// porque tanto el texto de un contador como la variable CSS `--progress`
// (usada en un conic-gradient) no son propiedades que una transición CSS
// pueda animar por sí sola.
import { ref, watch, onUnmounted, type Ref } from 'vue'
import { GameConfig } from '@/game/config'

// `resetKey` identifica de qué "racha" es el valor — en el spotlight es el
// número de temporada. Si cambia junto con `source`, el original tampoco
// animaba (finalizarTemporada() en carrera.js llama a renderSpotlight()
// directo, sin animarSpotlightDesde()): una temporada nueva arranca en
// blanco, no "cuenta hacia atrás" desde los números de la que se cerró.
export function useAnimatedNumber(
  source: () => number,
  duracionMs = GameConfig.ANIMACION_TRAMO_MS,
  resetKey: () => unknown = () => undefined,
): Ref<number> {
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

  watch([source, resetKey], ([nuevo, nuevaKey], [, keyAnterior]) => {
    if (nuevaKey !== keyAnterior) {
      if (frameId !== null) cancelAnimationFrame(frameId)
      frameId = null
      valorMostrado.value = nuevo
      return
    }
    animarHasta(nuevo)
  })

  onUnmounted(() => {
    if (frameId !== null) cancelAnimationFrame(frameId)
  })

  return valorMostrado
}
