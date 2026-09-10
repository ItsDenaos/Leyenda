<script setup lang="ts">
// Temporada en foco — portado de renderSpotlight() en carrera.js. Dos
// variantes de markup (desktop con anillo de progreso, mobile chata con
// barra lineal) conviven en el DOM; el CSS decide cuál mostrar según el
// ancho, igual que en el original.
import { computed } from 'vue'
import { useCareerStore } from '@/stores/career'
import { equipoDe, ligaDe } from '@/data/database-helpers'
import { GameConfig } from '@/game/config'
import { useAnimatedNumber } from '@/composables/useAnimatedNumber'
import CrestImg from '@/components/CrestImg.vue'
import FlagImg from '@/components/FlagImg.vue'
import TrophyBadges from './TrophyBadges.vue'

const career = useCareerStore()

const s = computed(() => career.temporadaActual!)
const equipo = computed(() => equipoDe(s.value.equipoId))
const liga = computed(() => ligaDe(equipo.value))
const forma = computed(() => GameConfig.FORM_STATES[s.value.forma])
const lesionado = computed(() => Boolean(s.value.lesionActiva))
const formaPillStyle = computed(() => ({ background: `${forma.value.color}22`, color: forma.value.color }))

// El anillo y los contadores interpolan su valor viejo al nuevo en vez de
// saltar directo (ver useAnimatedNumber) — misma animación de 900ms que
// animarAnilloProgreso()/animarNumero() en el original. La barra móvil no
// necesita esto: su ancho es una propiedad CSS común, así que una
// transición normal (ver <style>) ya la anima sola al cambiar el % reactivo.
//
// El número de temporada se pasa como resetKey: al cerrar una temporada,
// finalizarTemporada() (ver career.ts) arranca la siguiente desde cero —
// no es un tramo más de la misma racha, así que ese salto puntual no debe
// animarse (el original tampoco lo hacía, ver renderSpotlight() directo
// en finalizarTemporada() de carrera.js).
const temporadaKey = computed(() => s.value.numero)
const progresoAnimado = useAnimatedNumber(() => s.value.progreso, undefined, () => temporadaKey.value)
const progreso = computed(() => Math.round(progresoAnimado.value))
const progressStyle = computed(() => ({ '--progress': progresoAnimado.value }))
const progresoMobile = computed(() => Math.round(s.value.progreso))

const partidosAnimado = useAnimatedNumber(() => s.value.partidos, undefined, () => temporadaKey.value)
const golesAnimado = useAnimatedNumber(() => s.value.goles, undefined, () => temporadaKey.value)
const asistenciasAnimado = useAnimatedNumber(() => s.value.asistencias, undefined, () => temporadaKey.value)
const mvpAnimado = useAnimatedNumber(() => s.value.mvp, undefined, () => temporadaKey.value)
const promedioAnimado = useAnimatedNumber(() => s.value.promedio, undefined, () => temporadaKey.value)
</script>

<template>
  <article class="spotlight-card spotlight-card--desktop" :class="{ 'spotlight-card--lesionado': lesionado }">
    <div class="spotlight-card__head">
      <div>
        <span class="spotlight-card__season">Temporada {{ s.numero }} · {{ s.anio }}</span>
        <span class="spotlight-card__team">
          con {{ equipo.nombre }}
          <CrestImg
            :src="GameConfig.rutaEscudoLiga(liga)"
            :alt="liga.nombre"
            class-css="team-crest team-crest--xs team-crest--liga"
            :initials="GameConfig.inicialesLiga(liga)"
          />
          <span>{{ liga.nombre }}</span>
        </span>
        <span v-if="s.seleccionPartidos > 0" class="spotlight-card__seleccion">
          <FlagImg :code="s.seleccion!.paisCode" :emoji="s.seleccion!.paisFlag" class-css="flag-img" />
          Selección: {{ s.seleccionPartidos }} PJ · {{ s.seleccionGoles }} G
        </span>
      </div>
      <div class="spotlight-card__status">
        <span class="current-tag">EN CURSO</span>
        <span class="forma-pill" :style="formaPillStyle">{{ forma.icon }} {{ forma.label }}</span>
        <span class="lineup-tag" :class="s.titular ? 'lineup-tag--titular' : 'lineup-tag--suplente'">{{ s.titular ? 'Titular' : 'Suplente' }}</span>
      </div>
    </div>

    <div class="spotlight-card__body">
      <div class="progress-ring" :style="progressStyle">
        <div class="progress-ring__text">
          <span class="progress-ring__value">{{ progreso }}%</span>
          <span class="progress-ring__label">temporada</span>
        </div>
      </div>

      <div class="spotlight-card__stats">
        <div class="stat"><span class="stat__value">{{ Math.round(partidosAnimado) }}</span><span class="stat__label">Partidos</span></div>
        <div class="stat"><span class="stat__value">{{ Math.round(golesAnimado) }}</span><span class="stat__label">Goles</span></div>
        <div class="stat"><span class="stat__value">{{ Math.round(asistenciasAnimado) }}</span><span class="stat__label">Asistencias</span></div>
        <div class="stat"><span class="stat__value">{{ Math.round(mvpAnimado) }}</span><span class="stat__label">MVP</span></div>
        <div class="stat"><span class="stat__value">{{ promedioAnimado.toFixed(1) }}</span><span class="stat__label">Promedio</span></div>
      </div>
    </div>

    <TrophyBadges :trofeos="s.trofeos" />
  </article>

  <!-- Versión móvil: tarjeta chica y plana, sin anillo ni iconos decorativos. -->
  <article class="spotlight-mobile" :class="{ 'spotlight-mobile--lesionado': lesionado }">
    <div class="spotlight-mobile__top">
      <span class="spotlight-mobile__season">T{{ s.numero }} · {{ s.anio }}</span>
      <span class="forma-pill forma-pill--sm" :style="formaPillStyle">{{ forma.icon }} {{ forma.label }}</span>
    </div>
    <div class="spotlight-mobile__club">
      <CrestImg
        :src="GameConfig.rutaEscudoEquipo(equipo)"
        :alt="equipo.nombre"
        class-css="team-crest team-crest--xs"
        :initials="equipo.initials"
        :style-vars="{ '--crest-a': equipo.a, '--crest-b': equipo.b }"
      />
      <span class="spotlight-mobile__clubname">{{ equipo.nombre }}</span>
      <span class="lineup-tag" :class="s.titular ? 'lineup-tag--titular' : 'lineup-tag--suplente'">{{ s.titular ? 'Titular' : 'Suplente' }}</span>
    </div>
    <div v-if="s.seleccionPartidos > 0" class="spotlight-mobile__seleccion">
      <FlagImg :code="s.seleccion!.paisCode" :emoji="s.seleccion!.paisFlag" class-css="flag-img" />
      Selección: {{ s.seleccionPartidos }} PJ · {{ s.seleccionGoles }} G
    </div>
    <div class="spotlight-mobile__bar" :title="`${progresoMobile}% de la temporada`">
      <div class="spotlight-mobile__bar-fill" :style="{ width: `${progresoMobile}%` }"></div>
    </div>
    <div class="spotlight-mobile__stats">
      <span><b>{{ Math.round(partidosAnimado) }}</b>PJ</span>
      <span><b>{{ Math.round(golesAnimado) }}</b>Goles</span>
      <span><b>{{ Math.round(asistenciasAnimado) }}</b>Asist.</span>
      <span><b>{{ Math.round(mvpAnimado) }}</b>MVP</span>
      <span><b>{{ promedioAnimado.toFixed(1) }}</b>Prom.</span>
    </div>
    <div v-if="s.trofeos.length > 0" class="spotlight-mobile__trophies">
      <TrophyBadges :trofeos="s.trofeos" solo-icono />
    </div>
  </article>
</template>

<style scoped>
.spotlight-mobile {
  display: none;
}
.spotlight-card {
  background: linear-gradient(160deg, #1c2444 0%, #171f38 60%);
  border: 1px solid var(--accent);
  box-shadow:
    0 0 0 1px var(--accent-soft),
    0 20px 45px -30px #000d;
  border-radius: 18px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  position: relative;
}
.spotlight-card--lesionado {
  border-color: #ef4444;
  box-shadow:
    0 0 0 1px #ef444440,
    0 8px 28px -14px #ef444488;
}

.spotlight-card__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
}
.spotlight-card__season {
  display: block;
  font-size: 1.15rem;
  font-weight: 800;
}
.spotlight-card__team {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.82rem;
  color: var(--text-dim);
  margin-top: 0.15rem;
}
.spotlight-card__seleccion {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  color: var(--text-dim);
  margin-top: 0.3rem;
}

.spotlight-card__status {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.current-tag {
  font-size: 0.65rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #1a1300;
  background: var(--accent);
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
}

.forma-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.68rem;
  font-weight: 700;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  white-space: nowrap;
}

.lineup-tag {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.18rem 0.6rem;
  border-radius: 999px;
  white-space: nowrap;
  border: 1px solid var(--card-border);
  color: var(--text-dim);
}
.lineup-tag--titular {
  color: var(--accent-2);
  border-color: var(--accent-2);
  background: #22d3ee1a;
}
.lineup-tag--suplente {
  color: var(--text-dim);
  background: var(--bg-soft);
}

.spotlight-card__body {
  display: flex;
  align-items: center;
  gap: 1.75rem;
  flex-wrap: wrap;
}

.progress-ring {
  --progress: 0;
  width: 108px;
  height: 108px;
  border-radius: 50%;
  flex-shrink: 0;
  background: conic-gradient(var(--accent) calc(var(--progress) * 3.6deg), var(--bg-soft) 0deg);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.progress-ring::before {
  content: '';
  position: absolute;
  inset: 9px;
  border-radius: 50%;
  background: #171f38;
}
.progress-ring__text {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1.1;
}
.progress-ring__value {
  font-size: 1.4rem;
  font-weight: 900;
}
.progress-ring__label {
  font-size: 0.62rem;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.spotlight-card__stats {
  flex: 1;
  min-width: 260px;
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 0.6rem;
}
/* .stat/.stat__value/.stat__label son globales (ver base.css) */

/* ============ VERSIÓN MÓVIL ============ */
@media (max-width: 640px) {
  .spotlight-card--desktop {
    display: none;
  }
  .spotlight-mobile {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    background: var(--card);
    border: 1px solid var(--card-border);
    border-radius: 12px;
    padding: 0.8rem 0.85rem;
    position: relative;
  }
  .spotlight-mobile--lesionado {
    border-color: #ef4444;
    box-shadow:
      0 0 0 1px #ef444440,
      0 6px 20px -12px #ef444488;
  }
  .spotlight-mobile__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .spotlight-mobile__season {
    font-size: 0.68rem;
    font-weight: 800;
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .forma-pill--sm {
    font-size: 0.6rem;
    padding: 0.14rem 0.5rem;
  }
  .spotlight-mobile__club {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }
  .spotlight-mobile__seleccion {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    font-size: 0.68rem;
    color: var(--text-dim);
  }
  .spotlight-mobile__clubname {
    flex: 1;
    min-width: 0;
    font-weight: 700;
    font-size: 0.88rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .spotlight-mobile__bar {
    height: 4px;
    border-radius: 999px;
    background: var(--bg-soft);
    overflow: hidden;
  }
  .spotlight-mobile__bar-fill {
    height: 100%;
    background: var(--accent);
    border-radius: inherit;
    transition: width 0.9s cubic-bezier(0.22, 0.61, 0.36, 1);
  }
  .spotlight-mobile__stats {
    display: flex;
    justify-content: space-between;
    gap: 0.2rem;
  }
  .spotlight-mobile__stats span {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.05rem;
    font-size: 0.6rem;
    color: var(--text-dim);
  }
  .spotlight-mobile__stats b {
    font-size: 0.92rem;
    color: var(--text);
    font-weight: 800;
  }
  .spotlight-mobile__trophies {
    display: flex;
    justify-content: center;
    gap: 0.4rem;
    padding-top: 0.35rem;
    border-top: 1px solid var(--card-border);
  }
  .spotlight-mobile__trophies :deep(.trophy-card--icon-only .trophy-card__icon-img) {
    width: 1.3rem;
    height: 1.3rem;
  }
  .spotlight-mobile__trophies :deep(.trophy-card--icon-only .trophy-card__icon) {
    font-size: 1.15rem;
  }
}
</style>
