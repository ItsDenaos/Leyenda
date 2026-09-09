<script setup lang="ts">
// Fila de trofeos — portado de trophiesHtml() en carrera.js. Reusado por
// el spotlight (temporada en foco) y el historial (7c): `soloIcono` quita
// la píldora de fondo/borde y agranda el ícono (historial desktop / spotlight
// mobile); `nombreDebajo` apila el nombre bien chico debajo del ícono, oculto
// hasta que la fila se expande (historial mobile — ver `.timeline-item--expandida`).
import type { Trofeo } from '@/game/career-types'
import TrofeoIcon from './TrofeoIcon.vue'

withDefaults(defineProps<{ trofeos: Trofeo[]; soloIcono?: boolean; nombreDebajo?: boolean }>(), {
  soloIcono: false,
  nombreDebajo: false,
})
</script>

<template>
  <div v-if="trofeos.length > 0" class="trophies">
    <span
      v-for="(t, i) in trofeos"
      :key="`${t.nombre}-${i}`"
      class="trophy-card"
      :class="{ 'trophy-card--icon-only': soloIcono, 'trophy-card--stacked': nombreDebajo }"
      :title="t.nombre"
    >
      <TrofeoIcon :trofeo="t" />
      <span v-if="!soloIcono || nombreDebajo" :class="nombreDebajo ? 'trophy-card__name-under' : 'trophy-card__name'">{{ t.nombre }}</span>
    </span>
  </div>
</template>
