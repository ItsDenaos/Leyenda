<script setup lang="ts">
// Header de identidad del jugador — portado de renderHero() en carrera.js.
// Degradado de fondo en los colores del club actual (--team-a/--team-b).
import { computed } from 'vue'
import { useCareerStore } from '@/stores/career'
import { equipoDe } from '@/data/database-helpers'
import { GameConfig } from '@/game/config'
import { ovrTierColor, formatMarketValue, POSITION_NAMES } from '@/game/format'
import CrestImg from '@/components/CrestImg.vue'
import FlagImg from '@/components/FlagImg.vue'

const emit = defineEmits<{ 'solicitar-numero': [] }>()

const career = useCareerStore()

const player = computed(() => career.player!)
const temporada = computed(() => career.temporadaActual!)
const equipo = computed(() => equipoDe(temporada.value.equipoId))
const estaAPrestamo = computed(() => temporada.value.clubDuenoId !== null)
const edad = computed(() => career.getEdadActual())
const posicionNombre = computed(() => POSITION_NAMES[player.value.posicion] ?? player.value.posicion)

const heroStyle = computed(() => ({
  '--team-a': equipo.value.a,
  '--team-b': equipo.value.b,
}))
const ovrStyle = computed(() => ({ '--ovr-color': ovrTierColor(temporada.value.ovr) }))
</script>

<template>
  <header class="hero" :style="heroStyle">
    <div class="hero__main">
      <div class="hero__avatar">
        <CrestImg
          :src="GameConfig.rutaEscudoEquipo(equipo)"
          :alt="equipo.nombre"
          class-css="team-crest team-crest--avatar"
          :initials="equipo.initials"
          :style-vars="{ '--crest-a': equipo.a, '--crest-b': equipo.b }"
        />
      </div>

      <div class="hero__id">
        <span class="hero__name">{{ player.apellido }}</span>
        <span class="hero__meta">
          <span class="hero__pos-full">{{ posicionNombre }}</span>
          <span class="hero__pos-abbr">{{ player.posicion }}</span>
          <span class="hero__dot">·</span>
          <span class="hero__number-badge">{{ player.numero }}</span>
          <button
            v-if="career.puedeSolicitarNumero"
            type="button"
            class="hero__number-edit"
            title="Solicitar cambio de dorsal"
            @click="emit('solicitar-numero')"
          >
            ✎
          </button>
          <span>{{ equipo.nombre }}<template v-if="estaAPrestamo"> (préstamo)</template></span>
        </span>
      </div>

      <div class="ovr-badge ovr-badge--hero" :style="ovrStyle">
        <span>{{ temporada.ovr }}</span>
        <span class="ovr-badge__label">OVR</span>
      </div>
    </div>

    <div class="hero__chips">
      <div class="chip">
        <span>🎂</span>
        <span>{{ edad }} años</span>
      </div>
      <div class="chip">
        <FlagImg :code="player.paisCode" :emoji="player.flag" class-css="flag-img" />
        <span>{{ player.pais }}</span>
      </div>
      <div class="value-badge">
        <span>💰</span>
        <span>{{ formatMarketValue(temporada.valorMercado) }}</span>
      </div>
    </div>
  </header>
</template>

<style scoped>
.hero {
  flex: 0 0 auto;
  position: relative;
  padding: calc(1.1rem + env(safe-area-inset-top)) 1.5rem 1.25rem;
  background:
    linear-gradient(120deg, rgba(13, 17, 32, 0.6), rgba(13, 17, 32, 0.88)),
    linear-gradient(135deg, var(--team-a, #24304f), var(--team-b, #0f1428));
  border-bottom: 1px solid var(--card-border);
  z-index: 10;
  transition: background 0.4s ease;
}

.hero__main {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.hero__avatar {
  width: 54px;
  height: 54px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  box-shadow: 0 6px 18px -6px #000a;
  border-radius: 50%;
}

.hero__id {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
  flex: 1;
}
.hero__name {
  font-weight: 900;
  font-size: 1.4rem;
  letter-spacing: 0.02em;
  color: #fff;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.hero__meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: rgba(255, 255, 255, 0.75);
  overflow: hidden;
  white-space: nowrap;
}
.hero__meta span {
  overflow: hidden;
  text-overflow: ellipsis;
}
.hero__dot {
  opacity: 0.6;
  flex-shrink: 0;
}
.hero__pos-abbr {
  display: none;
}
.hero__number-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 0.3rem;
  border-radius: 6px;
  background: linear-gradient(135deg, var(--accent), #ffd166);
  color: #1a1300;
  font-weight: 900;
  font-size: 0.65rem;
  flex-shrink: 0;
}

.hero__number-edit {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  background: rgba(0, 0, 0, 0.25);
  color: #fff;
  font-size: 0.7rem;
  line-height: 1;
  cursor: pointer;
  flex-shrink: 0;
  transition: all 0.15s ease;
}
.hero__number-edit:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.hero__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
  margin-top: 1rem;
}

.chip {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.14);
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  backdrop-filter: blur(4px);
}

.value-badge {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: rgba(0, 0, 0, 0.28);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: #fff;
  padding: 0.4rem 0.75rem;
  border-radius: 999px;
  font-size: 0.82rem;
  font-weight: 700;
  white-space: nowrap;
  backdrop-filter: blur(4px);
}

@media (max-width: 640px) {
  .hero {
    padding: calc(0.65rem + env(safe-area-inset-top)) 0.85rem 0.65rem;
  }
  .hero__main {
    flex-wrap: nowrap;
    gap: 0.55rem;
  }
  .hero__avatar {
    width: 34px;
    height: 34px;
  }
  .hero__avatar :deep(.team-crest--avatar) {
    width: 34px;
    height: 34px;
    font-size: 0.8rem;
  }
  .hero__id {
    flex-basis: auto;
  }
  .hero__name {
    font-size: 0.95rem;
  }
  .hero__meta {
    font-size: 0.66rem;
    white-space: nowrap;
    flex-wrap: nowrap;
  }
  .hero__pos-full {
    display: none;
  }
  .hero__pos-abbr {
    display: inline;
  }
  .hero__meta > span:last-child {
    flex: 1;
    min-width: 0;
  }

  .ovr-badge--hero {
    width: 36px;
    height: 36px;
    font-size: 0.74rem;
    margin-left: 0.35rem;
  }
  .ovr-badge--hero .ovr-badge__label {
    display: none;
  }

  .hero__chips {
    margin-top: 0.5rem;
    gap: 0.35rem;
  }
  .chip,
  .value-badge {
    padding: 0.25rem 0.5rem;
    font-size: 0.68rem;
    gap: 0.3rem;
  }
  .hero__chips .chip:first-child > span:first-child,
  .value-badge > span:first-child {
    display: none;
  }
}
</style>
