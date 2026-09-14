<script setup lang="ts">
// Tarjeta de oferta de club / quedarme / retiro — portado de
// crearOfertaCard() en carrera.js. Un solo clic resuelve toda la pausa
// (fichaje, continuidad o retiro), no hace falta rechazar una por una.
import { computed } from 'vue'
import { useCareerStore } from '@/stores/career'
import { GameConfig } from '@/game/config'
import { formatMarketValue } from '@/game/format'
import type { OfertaItem } from '@/game/career-types'
import CrestImg from '@/components/CrestImg.vue'
import FlagImg from '@/components/FlagImg.vue'

const props = defineProps<{ oferta: OfertaItem }>()

const career = useCareerStore()

const esQuedarme = computed(() => props.oferta.tipoOferta === 'quedarme')
const esRetiro = computed(() => props.oferta.tipoOferta === 'retiro')
const esForzoso = computed(() => props.oferta.tipoOferta === 'retiro' && Boolean(props.oferta.forzoso))
const esPrestamo = computed(() => props.oferta.tipoOferta === 'prestamo')

const tag = computed(() => (esForzoso.value ? 'Fin de carrera' : esRetiro.value ? 'Retiro' : esQuedarme.value ? 'Tu club' : esPrestamo.value ? 'Préstamo' : 'Oferta'))
const boton = computed(() => (esRetiro.value ? 'Retirarme' : esQuedarme.value ? 'Quedarme' : esPrestamo.value ? 'Aceptar préstamo' : 'Aceptar oferta'))

function elegir() {
  career.resolveOferta(props.oferta)
}
</script>

<template>
  <article
    class="decision-card decision-card--oferta-club"
    :class="{ 'decision-card--quedarme': esQuedarme, 'decision-card--retiro': esRetiro, 'decision-card--retiro-forzoso': esForzoso, 'decision-card--prestamo': esPrestamo }"
  >
    <span class="decision-card__tag">{{ tag }}</span>
    <div class="decision-card__team">
      <CrestImg
        :src="GameConfig.rutaEscudoEquipo(oferta.equipo)"
        :alt="oferta.equipo.nombre"
        class-css="team-crest team-crest--sm"
        :initials="oferta.equipo.initials"
        :style-vars="{ '--crest-a': oferta.equipo.a, '--crest-b': oferta.equipo.b }"
      />
      <div>
        <div class="decision-card__teamname">{{ oferta.equipo.nombre }}</div>
        <div class="decision-card__league">
          <CrestImg
            :src="GameConfig.rutaEscudoLiga(oferta.liga)"
            :alt="oferta.liga.nombre"
            class-css="team-crest team-crest--xs team-crest--liga"
            :initials="GameConfig.inicialesLiga(oferta.liga)"
          />
          <span>{{ oferta.liga.nombre }}</span>
          <FlagImg :code="oferta.liga.paisCode" :emoji="oferta.liga.paisFlag" class-css="decision-card__flag flag-img" />
        </div>
      </div>
    </div>
    <p v-if="oferta.tipoOferta !== 'club'" class="decision-card__desc">{{ oferta.desc }}</p>
    <p v-if="'valorOfrecido' in oferta" class="decision-card__valor">Te valoran en <strong>{{ formatMarketValue(oferta.valorOfrecido) }}</strong></p>
    <div class="decision-card__actions">
      <button type="button" class="btn" @click="elegir">{{ boton }}</button>
    </div>
  </article>
</template>
