<script setup lang="ts">
// Escudo (equipo o liga) con fallback automático a un placeholder de
// iniciales si la imagen no carga — mismo patrón que FlagImg, reemplaza a
// GameConfig.crestHtml/ligaCrestHtml/crestFallback del original (excluidas
// de config.ts por ser generadoras de HTML/DOM).
import { ref, watch } from 'vue'

const props = defineProps<{
  src: string
  alt: string
  classCss: string
  initials: string
  styleVars?: Record<string, string>
}>()

const fallo = ref(false)
watch(
  () => props.src,
  () => {
    fallo.value = false
  },
)
</script>

<template>
  <img v-if="!fallo" :src="src" :alt="alt" :class="classCss" :style="styleVars" @error="fallo = true" />
  <span v-else :class="classCss" :style="styleVars">{{ initials }}</span>
</template>
