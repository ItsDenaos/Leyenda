<script setup lang="ts">
// Modal para solicitar cambio de dorsal — portado de abrirModalNumero/
// cerrarModalNumero/confirmarCambioNumero en carrera.js. Solo se puede
// abrir justo al cerrar una temporada (ver career.puedeSolicitarNumero);
// el resultado (aceptado o no) llega como toast desde la cola de
// mensajes del store, no lo maneja este componente.
import { ref, watch } from 'vue'
import { useCareerStore } from '@/stores/career'
import { resetZoom } from '@/composables/resetZoom'

const props = defineProps<{ mostrar: boolean }>()
const emit = defineEmits<{ cerrar: [] }>()

const career = useCareerStore()
const numero = ref(10)

watch(
  () => props.mostrar,
  (abierto) => {
    if (abierto && career.player) numero.value = career.player.numero
  },
)

// El botón tocado (o el input) sigue enfocado cuando el modal pasa a
// [hidden] — sin blurearlo antes, el navegador decide solo a dónde mover
// el foco. Cerrar el modal no navega de ruta, así que el reseteo de zoom
// del router (ver resetZoom.ts) tampoco corre acá — se dispara aparte.
function cerrar() {
  ;(document.activeElement as HTMLElement | null)?.blur()
  resetZoom()
  emit('cerrar')
}

function confirmar() {
  career.confirmarCambioNumero(numero.value)
  cerrar()
}
</script>

<template>
  <div class="modal-overlay" :hidden="!mostrar">
    <div class="modal-card">
      <h3 class="modal-card__title">Solicitar cambio de dorsal</h3>
      <p class="modal-card__desc">Elige el número que quieres pedirle al club. La decisión depende de tu OVR y de cómo te fue en la temporada — no hay garantía.</p>
      <label class="modal-card__field">
        <span class="field__label">Número</span>
        <input v-model.number="numero" type="number" min="1" max="99" />
      </label>
      <div class="modal-card__actions">
        <button type="button" class="btn btn--ghost" @click="cerrar">Ahora no</button>
        <button type="button" class="btn" @click="confirmar">Solicitar</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-card__field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.modal-card__field input {
  background: var(--bg-soft);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 0.65rem 0.8rem;
  color: var(--text);
  font-size: 0.95rem;
  outline: none;
}
.modal-card__field input:focus {
  border-color: var(--accent-2);
}
</style>
