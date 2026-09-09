<script setup lang="ts">
// Tarjeta de evento (personal/deportivo, incluida la convocatoria a
// selección) — portado de crearDecisionCard() en carrera.js.
import { useCareerStore } from '@/stores/career'
import { GameConfig } from '@/game/config'
import type { DecisionCard } from '@/game/career-types'
import type { EfectosOpcion } from '@/data/events'

const props = defineProps<{ decision: DecisionCard }>()

const career = useCareerStore()

function efectoRendimientoTexto(valor: number) {
  if (valor > 0) return { texto: `📈 Rendimiento +${valor}`, variant: 'pos' }
  if (valor < 0) return { texto: `📉 Rendimiento ${valor}`, variant: 'neg' }
  return { texto: '➖ Rendimiento', variant: null }
}
function efectoEquipoTexto(valor: number) {
  if (valor > 0) return { texto: `🤝 Equipo +${valor}`, variant: 'pos' }
  if (valor < 0) return { texto: `🤝 Equipo ${valor}`, variant: 'neg' }
  return { texto: '🤝 Equipo', variant: null }
}
function formaInfo(forma: EfectosOpcion['forma']) {
  return GameConfig.FORM_STATES[forma]
}

function elegir(idx: number) {
  career.resolveDecisionEvento(props.decision.id, idx)
}
</script>

<template>
  <article
    class="decision-card"
    :class="[`decision-card--${decision.tipo}`, { 'decision-card--alto-impacto': decision.altoImpacto }]"
  >
    <span v-if="decision.altoImpacto" class="decision-card__impacto" title="Evento de alto impacto">⚠️</span>
    <span v-else-if="decision.seleccion" class="decision-card__impacto" title="Convocatoria a la selección">🌍</span>
    <span class="decision-card__tag">{{ decision.seleccion ? 'Selección' : decision.tipo === 'deportivo' ? 'Deportivo' : 'Personal' }}</span>
    <p class="decision-card__desc">{{ decision.desc }}</p>
    <div class="decision-card__actions">
      <div v-for="(op, i) in decision.opciones" :key="i" class="decision-option">
        <button type="button" :class="op.variant === 'accept' ? 'btn' : 'btn btn--ghost'" @click="elegir(i)">{{ op.label }}</button>
        <div class="decision-option__efectos">
          <span class="efecto" :class="efectoRendimientoTexto(op.efectos.rendimiento).variant ? `efecto--${efectoRendimientoTexto(op.efectos.rendimiento).variant}` : ''">{{
            efectoRendimientoTexto(op.efectos.rendimiento).texto
          }}</span>
          <span class="efecto" :style="{ color: formaInfo(op.efectos.forma).color }">{{ formaInfo(op.efectos.forma).icon }} {{ formaInfo(op.efectos.forma).label }}</span>
          <span class="efecto" :class="efectoEquipoTexto(op.efectos.equipo).variant ? `efecto--${efectoEquipoTexto(op.efectos.equipo).variant}` : ''">{{
            efectoEquipoTexto(op.efectos.equipo).texto
          }}</span>
        </div>
      </div>
    </div>
  </article>
</template>
