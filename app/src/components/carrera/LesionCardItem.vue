<script setup lang="ts">
// Parte médico — portado de crearLesionCard() en carrera.js. Pausa entera
// reemplazada por el informe de la lesión recién diagnosticada: no hay
// nada que decidir, pero hay que confirmar (botón "Continuar") en vez de
// que la temporada avance sola.
import { computed, ref } from 'vue'
import { useCareerStore } from '@/stores/career'
import type { InformeLesion } from '@/game/career-types'

const props = defineProps<{ lesion: InformeLesion }>()

const career = useCareerStore()
const resolviendo = ref(false)

const ETIQUETA: Record<string, string> = { nivel1: 'Lesión grave', nivel2: 'Lesión moderada', nivel3: 'Lesión leve' }

const detalle = computed(() => {
  const partes: string[] = []
  if (props.lesion.ovrPerdido > 0) partes.push(`-${props.lesion.ovrPerdido} OVR`)
  partes.push(`${props.lesion.tramosRestantes} pausa${props.lesion.tramosRestantes === 1 ? '' : 's'} de baja`)
  return partes.join(' · ')
})

function continuar() {
  resolviendo.value = true
  career.simularTramoYAvanzar()
}
</script>

<template>
  <article class="decision-card decision-card--lesion-informe" :class="`decision-card--lesion-${lesion.nivel}`">
    <span class="decision-card__tag">{{ ETIQUETA[lesion.nivel] }}</span>
    <p class="decision-card__desc"><strong>{{ lesion.nombre }}.</strong> {{ lesion.descripcion }}</p>
    <p class="decision-card__lesion-detalle">{{ detalle }}</p>
    <div class="decision-card__actions">
      <button type="button" class="btn" :disabled="resolviendo" @click="continuar">Continuar</button>
    </div>
  </article>
</template>
