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

  function show(mensaje: string) {
    message.value = mensaje
    visible.value = true
    clearTimeout(timer)
    timer = setTimeout(() => {
      visible.value = false
    }, duracionMs)
  }

  // Vacía `cola` mostrando cada mensaje de una — igual que showToast() en
  // el original, que nunca encolaba: si ya había un toast visible y salía
  // uno nuevo, simplemente le pisaba el texto y reiniciaba el timer, en
  // vez de esperar a que el anterior termine para mostrar el siguiente.
  function drainQueue(cola: string[]) {
    let siguiente: string | undefined
    while ((siguiente = cola.shift()) !== undefined) {
      show(siguiente)
    }
  }

  return { message, visible, show, drainQueue }
}
