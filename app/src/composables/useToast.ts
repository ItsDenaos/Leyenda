// Toast compartido por las 3 vistas — antes cada una tenía su propia
// copia de este mismo patrón (mensaje + visible + timer). `show` alcanza
// para un aviso puntual (creación de personaje, elección de equipo);
// `drainQueue` además se usa en la vista de carrera para vaciar, uno por
// uno, la cola de mensajes que produce el store (`mensajes`, reemplazo de
// `showToast` del carrera.js original).
import { ref } from 'vue'

export function useToast(duracionMs = 3200) {
  const message = ref('')
  const visible = ref(false)
  let timer: ReturnType<typeof setTimeout> | undefined
  let drenando = false

  function show(mensaje: string) {
    message.value = mensaje
    visible.value = true
    clearTimeout(timer)
    timer = setTimeout(() => {
      visible.value = false
    }, duracionMs)
  }

  // Muestra los mensajes de `cola` de a uno, espaciados, vaciándola a
  // medida que avanza — pensado para invocarse cada vez que la cola
  // (un array reactivo del store) recibe un mensaje nuevo.
  function drainQueue(cola: string[]) {
    if (drenando) return
    drenando = true
    const paso = () => {
      const siguiente = cola.shift()
      if (siguiente === undefined) {
        drenando = false
        return
      }
      show(siguiente)
      setTimeout(paso, duracionMs + 200)
    }
    paso()
  }

  return { message, visible, show, drainQueue }
}
