<script setup lang="ts">
// Elección de primer club — portado de equipo.html + js/equipo.js.
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { GameConfig } from '@/game/config'
import type { Equipo, Liga } from '@/data/database'
import { ligaDe, generarOfertasInicialesParaJugador } from '@/game/initial-offers'
import { loadPlayerDraft, clearPlayerDraft } from '@/game/player-draft'
import { resetZoom } from '@/composables/resetZoom'
import { useCareerStore } from '@/stores/career'
import CrestImg from '@/components/CrestImg.vue'
import FlagImg from '@/components/FlagImg.vue'

const router = useRouter()
const career = useCareerStore()

const logoSrc = `${import.meta.env.BASE_URL}assets/logo/logo_leyenda_transparent.png`

interface Oferta {
  equipo: Equipo
  liga: Liga
}

const ofertas = ref<Oferta[]>([])
const eligiendo = ref(false)

onMounted(() => {
  // Primero calibrar el zoom (ver resetZoom.ts): si veníamos de otra
  // vista con un zoom de iOS todavía activo, cualquier medición de layout
  // hecha antes de recalibrar quedaría en base a ese zoom "fantasma".
  resetZoom()
  document.title = 'Leyenda — Elige tu equipo'

  const draft = loadPlayerDraft()
  if (!draft) {
    // No hay identidad creada todavía: volvemos al primer paso.
    router.push('/')
    return
  }

  ofertas.value = generarOfertasInicialesParaJugador(draft.pais).map((equipo) => ({
    equipo,
    liga: ligaDe(equipo),
  }))
})

function elegirEquipo(oferta: Oferta) {
  if (eligiendo.value) return
  eligiendo.value = true

  const draft = loadPlayerDraft()
  if (!draft) {
    router.push('/')
    return
  }

  const ovrInicial = GameConfig.calcularOvrInicial(oferta.equipo, oferta.liga)
  career.iniciarCarrera({ ...draft, equipoId: oferta.equipo.id, ovrInicial })
  clearPlayerDraft()

  setTimeout(() => router.push('/carrera'), 900)
}
</script>

<template>
  <header class="topbar">
    <div class="brand">
      <img class="brand__logo" :src="logoSrc" alt="Leyenda" />
    </div>
    <p class="brand__tagline">Tu primera decisión como profesional</p>
  </header>

  <main class="offers">
    <div class="offers__intro">
      <h1>Elige tu primer equipo</h1>
      <p>Cuatro clubes te abren la puerta. La elección va a marcar el punto de partida de tu carrera — tu nivel inicial depende de a dónde vayas.</p>
    </div>

    <div class="offers__grid">
      <article v-for="oferta in ofertas" :key="oferta.equipo.id" class="offer-card">
        <div class="offer-card__top">
          <CrestImg
            :src="GameConfig.rutaEscudoEquipo(oferta.equipo)"
            :alt="oferta.equipo.nombre"
            class-css="offer-card__crest"
            :initials="oferta.equipo.initials"
            :style-vars="{ '--crest-a': oferta.equipo.a, '--crest-b': oferta.equipo.b }"
          />
          <div>
            <div class="offer-card__name">{{ oferta.equipo.nombre }}</div>
            <div class="offer-card__league">
              <CrestImg
                :src="GameConfig.rutaEscudoLiga(oferta.liga)"
                :alt="oferta.liga.nombre"
                class-css="team-crest team-crest--xs team-crest--liga"
                :initials="GameConfig.inicialesLiga(oferta.liga)"
              />
              <span>{{ oferta.liga.nombre }}</span>
              <FlagImg :code="oferta.liga.paisCode" :emoji="oferta.liga.paisFlag" class-css="offer-card__flag flag-img" />
            </div>
          </div>
        </div>
        <button type="button" class="offer-card__cta" :disabled="eligiendo" @click="elegirEquipo(oferta)">Elegir este club</button>
      </article>
    </div>
  </main>

  <footer class="app-footer">{{ GameConfig.VERSION ? `Leyenda v${GameConfig.VERSION} · Publicado el ${GameConfig.FECHA_PUBLICACION}` : '' }}</footer>
</template>

<style scoped>
.offers {
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem 2rem 3rem;
}

.offers__intro h1 {
  margin: 0 0 0.35rem;
  font-size: 1.8rem;
}
.offers__intro p {
  margin: 0 0 2rem;
  color: var(--text-dim);
  max-width: 640px;
}

.offers__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.25rem;
}
@media (max-width: 720px) {
  .offers__grid {
    grid-template-columns: 1fr;
  }
}

.offer-card {
  background: var(--card);
  border: 1px solid var(--card-border);
  border-radius: var(--radius);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  transition:
    border-color 0.2s ease,
    transform 0.2s ease;
}
.offer-card:hover {
  border-color: var(--accent-2);
  transform: translateY(-2px);
}

.offer-card__top {
  display: flex;
  align-items: center;
  gap: 0.9rem;
}

.offer-card__crest {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: grid;
  place-items: center;
  font-weight: 900;
  font-size: 1.1rem;
  color: #fff;
  background: linear-gradient(135deg, var(--crest-a, var(--accent-2)), var(--crest-b, #1d4ed8));
  text-shadow: 0 1px 2px #0006;
  flex-shrink: 0;
  object-fit: contain;
}

.offer-card__name {
  font-weight: 800;
  font-size: 1.05rem;
}
.offer-card__league {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: var(--text-dim);
}

/* .team-crest/.team-crest--xs/.team-crest--liga son globales (ver base.css) */

.offer-card__flag {
  flex-shrink: 0;
  margin-left: 0.15rem;
  color: var(--text-dim);
}

.offer-card__cta {
  margin-top: auto;
  background: var(--accent);
  color: #1a1300;
  border: none;
  border-radius: 8px;
  padding: 0.65rem 1rem;
  font-weight: 800;
  font-size: 0.85rem;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    opacity 0.15s ease;
}
.offer-card__cta:hover {
  transform: translateY(-1px);
}
.offer-card__cta:disabled {
  opacity: 0.6;
  cursor: default;
}
</style>
