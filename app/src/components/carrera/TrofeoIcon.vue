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

// Los 3 premios individuales (Bota de Oro, Balón de Oro, Once Ideal) son
// siluetas más "llenas" que las copas/escudos de trofeos de equipo — al
// mismo tamaño de caja se ven notablemente más grandes en la misma fila.
// Se identifican por nombre de archivo (no hay otro campo que los marque
// como individuales) y se achican un poco vía `.trophy-card__icon-img--premio`.
const PREMIOS_INDIVIDUALES = new Set(['bota-de-oro.png', 'balon-de-oro.png', 'once-ideal.png'])
const esPremioIndividual = computed(() => Boolean(props.trofeo.imagen && PREMIOS_INDIVIDUALES.has(props.trofeo.imagen)))
</script>

<template>
  <span v-if="!maskUrl" class="trophy-card__icon">🏆</span>
  <span
    v-else
    class="trophy-card__icon-img"
    :class="{ 'trophy-card__icon-img--premio': esPremioIndividual }"
    :style="{ WebkitMaskImage: maskUrl, maskImage: maskUrl }"
  ></span>
</template>
