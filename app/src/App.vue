<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { RouterView } from 'vue-router'
import { instalarResetZoomAlCerrarTeclado } from '@/composables/resetZoom'

let quitarResetZoom: (() => void) | undefined
onMounted(() => {
  quitarResetZoom = instalarResetZoomAlCerrarTeclado()
})
onUnmounted(() => {
  quitarResetZoom?.()
})
</script>

<template>
  <RouterView />
</template>
