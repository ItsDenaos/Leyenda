<script setup lang="ts">
// Ícono de un trofeo — si la competición todavía no tiene imagen cargada,
// cae al 🏆 genérico. Portado de GameConfig.trofeoIconHtml (excluida de
// config.ts por ser generadora de HTML). Los archivos son siluetas negras
// sobre transparente, pintadas del dorado del sistema vía mask-image (el
// color real del PNG no importa, solo su alpha) — no un <img> a color.
import { computed } from 'vue'
import { GameConfig } from '@/game/config'
import type { Trofeo } from '@/game/career-types'

const props = defineProps<{ trofeo: Trofeo }>()

const maskUrl = computed(() => (props.trofeo.imagen ? `url('${GameConfig.RUTA_ESCUDOS_TROFEOS}${props.trofeo.imagen}')` : null))
</script>

<template>
  <span v-if="!maskUrl" class="trophy-card__icon">🏆</span>
  <span v-else class="trophy-card__icon-img" :style="{ WebkitMaskImage: maskUrl, maskImage: maskUrl }"></span>
</template>
