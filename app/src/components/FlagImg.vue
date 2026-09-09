<script setup lang="ts">
// Bandera real por código ISO 3166-1 alpha-2 (flagcdn.com), con el emoji
// como respaldo de texto — Windows no dibuja los emoji de bandera (muestra
// el código de 2 letras suelto). Reemplaza a GameConfig.flagHtml/flagFallback
// del original (excluidas de config.ts por ser generadoras de HTML/DOM).
import { ref, watch } from 'vue'
import { GameConfig } from '@/game/config'

const props = defineProps<{
  code: string
  emoji: string
  classCss: string
}>()

const fallo = ref(false)
watch(
  () => props.code,
  () => {
    fallo.value = false
  },
)
</script>

<template>
  <img v-if="code && !fallo" :src="`${GameConfig.RUTA_BANDERAS}${code}.png`" alt="" :class="classCss" @error="fallo = true" />
  <span v-else :class="classCss">{{ emoji || '🏳️' }}</span>
</template>
