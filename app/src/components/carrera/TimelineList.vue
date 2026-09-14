<script setup lang="ts">
// Historial de temporadas cerradas — portado de renderTimeline() en
// carrera.js. Cada fila tiene un markup desktop (una sola línea, trofeos
// solo-ícono con el nombre en el `title`) y uno mobile (apilado, trofeos
// expandibles al tocar la tarjeta — ver `expandidas` más abajo).
import { computed, reactive } from 'vue'
import { useCareerStore } from '@/stores/career'
import { equipoDe } from '@/data/database-helpers'
import { ovrTierColor } from '@/game/format'
import CrestImg from '@/components/CrestImg.vue'
import FlagImg from '@/components/FlagImg.vue'
import TrophyBadges from './TrophyBadges.vue'
import { GameConfig } from '@/game/config'

const career = useCareerStore()

const filas = computed(() =>
  [...career.temporadasFinalizadas]
    .reverse()
    .map((s) => ({
      temporada: s,
      equipo: equipoDe(s.equipoId),
      color: ovrTierColor(s.ovr),
      edad: Number(career.player!.edad) + (s.numero - 1),
      tieneTrofeos: Boolean(s.trofeos && s.trofeos.length > 0),
      aPrestamo: s.clubDuenoId !== null,
    })),
)

// Solo tiene efecto visual en móvil (ver .timeline-item--expandida en el
// CSS) — se toca la tarjeta entera para revelar el nombre de sus trofeos.
const expandidas = reactive(new Set<number>())
function toggleExpandida(numero: number, tieneTrofeos: boolean) {
  if (!tieneTrofeos) return
  if (expandidas.has(numero)) expandidas.delete(numero)
  else expandidas.add(numero)
}
</script>

<template>
  <div class="timeline__list">
    <div
      v-for="fila in filas"
      :key="fila.temporada.numero"
      class="timeline-item"
      :class="{ 'timeline-item--con-trofeos': fila.tieneTrofeos, 'timeline-item--expandida': expandidas.has(fila.temporada.numero) }"
      @click="toggleExpandida(fila.temporada.numero, fila.tieneTrofeos)"
    >
      <div class="timeline-item__desktop">
        <span class="timeline-item__season"
          >Temporada {{ fila.temporada.numero }}<span>{{ fila.temporada.anio }} · {{ fila.edad }} años</span></span
        >
        <CrestImg
          :src="GameConfig.rutaEscudoEquipo(fila.equipo)"
          :alt="fila.equipo.nombre"
          class-css="team-crest team-crest--sm"
          :initials="fila.equipo.initials"
          :style-vars="{ '--crest-a': fila.equipo.a, '--crest-b': fila.equipo.b }"
        />
        <span class="timeline-item__team">{{ fila.equipo.nombre }}<template v-if="fila.aPrestamo"> (préstamo)</template></span>
        <TrophyBadges v-if="fila.tieneTrofeos" :trofeos="fila.temporada.trofeos" solo-icono />
        <span v-else class="timeline-item__notrophy">Sin trofeos</span>
        <span class="ovr-badge ovr-badge--sm" :style="{ '--ovr-color': fila.color }">
          <span>{{ fila.temporada.ovr }}</span>
          <span class="ovr-badge__label">OVR</span>
        </span>
        <span class="timeline-item__stats"
          >{{ fila.temporada.partidos }} PJ · {{ fila.temporada.goles }} G · {{ fila.temporada.asistencias }} A ·
          {{ fila.temporada.promedio.toFixed(1) }} prom</span
        >
        <span
          v-if="fila.temporada.seleccionPartidos > 0"
          class="timeline-item__seleccion"
          :title="`Con la selección: ${fila.temporada.seleccionPartidos} partidos, ${fila.temporada.seleccionGoles} goles`"
        >
          <FlagImg :code="fila.temporada.seleccion!.paisCode" :emoji="fila.temporada.seleccion!.paisFlag" class-css="flag-img" />
          {{ fila.temporada.seleccionPartidos }} PJ · {{ fila.temporada.seleccionGoles }} G
        </span>
      </div>

      <div class="timeline-item__mobile">
        <div class="timeline-item__mrow">
          <CrestImg
            :src="GameConfig.rutaEscudoEquipo(fila.equipo)"
            :alt="fila.equipo.nombre"
            class-css="team-crest team-crest--sm"
            :initials="fila.equipo.initials"
            :style-vars="{ '--crest-a': fila.equipo.a, '--crest-b': fila.equipo.b }"
          />
          <div class="timeline-item__mid">
            <span class="timeline-item__mteam">{{ fila.equipo.nombre }}<template v-if="fila.aPrestamo"> (préstamo)</template></span>
            <span class="timeline-item__mmeta"
              >T{{ fila.temporada.numero }} · {{ fila.temporada.anio }} · {{ fila.edad }} años · {{ fila.temporada.partidos }} PJ ·
              {{ fila.temporada.goles }} G · {{ fila.temporada.asistencias }} A</span
            >
            <span v-if="fila.temporada.seleccionPartidos > 0" class="timeline-item__mmeta timeline-item__seleccion">
              <FlagImg :code="fila.temporada.seleccion!.paisCode" :emoji="fila.temporada.seleccion!.paisFlag" class-css="flag-img" />
              Selección: {{ fila.temporada.seleccionPartidos }} PJ · {{ fila.temporada.seleccionGoles }} G
            </span>
          </div>
          <span class="ovr-badge ovr-badge--sm" :style="{ '--ovr-color': fila.color }">{{ fila.temporada.ovr }}</span>
        </div>
        <div v-if="fila.tieneTrofeos" class="timeline-item__mtrophies">
          <TrophyBadges :trofeos="fila.temporada.trofeos" solo-icono nombre-debajo />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline__list {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  background: var(--card);
  border: 1px solid var(--card-border);
  border-radius: 12px;
  padding: 0.75rem 1rem;
  flex-wrap: wrap;
  transition:
    border-color 0.15s ease,
    transform 0.15s ease;
}
.timeline-item:hover {
  border-color: var(--accent-2);
  transform: translateY(-1px);
}
.timeline-item--con-trofeos {
  cursor: pointer;
}

.timeline-item__desktop {
  display: contents;
}
.timeline-item__mobile {
  display: none;
}
.timeline-item__season {
  min-width: 78px;
  font-weight: 800;
  font-size: 0.66rem;
  color: var(--accent-2);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.timeline-item__season span {
  display: block;
  margin-top: 0.2rem;
  font-size: 0.82rem;
  color: var(--text);
  font-weight: 700;
  text-transform: none;
  letter-spacing: normal;
}
.timeline-item__team {
  flex: 1;
  min-width: 100px;
  font-weight: 700;
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.timeline-item__stats {
  font-size: 0.78rem;
  color: var(--text-dim);
  white-space: nowrap;
  flex: 0 0 190px;
  text-align: right;
}
.timeline-item__desktop .timeline-item__seleccion {
  flex: 1 0 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.3rem;
  font-size: 0.72rem;
  color: var(--text-dim);
}
.timeline-item__notrophy {
  font-size: 0.78rem;
  color: var(--text-dim);
}
.timeline-item__desktop :deep(.trophies),
.timeline-item__desktop .timeline-item__notrophy {
  flex: 0 0 145px;
}
.timeline-item__desktop :deep(.trophies) {
  flex-wrap: nowrap;
}
.timeline-item :deep(.trophy-card:not(.trophy-card--icon-only)) {
  padding: 0.15rem 0.5rem 0.15rem 0.35rem;
}
.timeline-item :deep(.trophy-card__name) {
  font-size: 0.66rem;
}

@media (max-width: 640px) {
  .timeline__list {
    gap: 0.45rem;
  }
  .timeline-item {
    align-items: stretch;
    gap: 0;
    padding: 0.6rem 0.7rem;
  }
  .timeline-item__desktop {
    display: none;
  }
  .timeline-item__mobile {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }
  .timeline-item__mrow {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    gap: 0.55rem;
  }
  .timeline-item__mid {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.05rem;
  }
  .timeline-item__mteam {
    font-weight: 700;
    font-size: 0.82rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .timeline-item__mmeta {
    font-size: 0.66rem;
    color: var(--text-dim);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .timeline-item__mtrophies {
    display: flex;
    justify-content: center;
    align-items: flex-start;
    gap: 0.35rem;
    padding-top: 0.4rem;
    border-top: 1px solid var(--card-border);
  }
}
</style>
