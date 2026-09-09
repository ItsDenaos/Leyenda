<script setup lang="ts">
// Panel de decisiones (barra inferior) — portado de renderDecisions() +
// cambiarContenidoDecisiones() en carrera.js. Dos animaciones distintas
// del original, reimplementadas con las primitivas nativas de Vue en vez
// de manipular el DOM a mano:
//  - Cambio de "escena" completo (nueva pausa: de ofertas a eventos, de
//    eventos al parte médico, etc.) → <Transition> con key = temporada +
//    checkpoint, que funde todo el panel — mismo rol que
//    cambiarContenidoDecisiones().
//  - Una tarjeta resuelta dentro de la MISMA pausa (ej. quedan 2 eventos,
//    resolvés 1) → <TransitionGroup>, que anima la salida de esa tarjeta
//    y el reacomodo de las que quedan — mismo rol que
//    capturarPosicionesCards()/animarReacomodoCards() (técnica FLIP),
//    pero provisto por Vue en vez de a mano.
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useCareerStore } from '@/stores/career'
import type { LoteItem, DecisionCard, OfertaItem, InformeLesion } from '@/game/career-types'
import DecisionCardItem from './DecisionCardItem.vue'
import OfertaCardItem from './OfertaCardItem.vue'
import LesionCardItem from './LesionCardItem.vue'

const emit = defineEmits<{ 'ver-resumen': [] }>()

const router = useRouter()
const career = useCareerStore()

const temporada = computed(() => career.temporadaActual!)
const checkpoint = computed(() => temporada.value.calendario[temporada.value.checkpointIndex])
const esOferta = computed(() => checkpoint.value?.tipo === 'oferta')
const lote = computed(() => temporada.value.loteActual)

function esInformeLesion(item: LoteItem): item is InformeLesion {
  return 'esInformeLesion' in item && item.esInformeLesion === true
}
function esOfertaItem(item: LoteItem): item is OfertaItem {
  return 'tipoOferta' in item
}

// Todo lo que pertenece a la MISMA pausa comparte esta key — cambia
// exactamente cuando iniciarCheckpoint() arranca una escena nueva. El
// retiro no dispara un nuevo checkpoint (finalizarCarrera no lo llama),
// así que carreraFinalizada se suma a la key para que ese cambio de
// "escena" también funda el panel.
const sceneKey = computed(() => `${temporada.value.numero}-${temporada.value.checkpointIndex}-${career.carreraFinalizada}`)

const esParteMedico = computed(() => lote.value.length === 1 && esInformeLesion(lote.value[0]!))

const titulo = computed(() => {
  if (career.carreraFinalizada) return 'Carrera finalizada'
  if (esParteMedico.value) return 'Parte médico'
  return esOferta.value ? 'Ofertas de equipos' : 'Decisiones'
})
const contador = computed(() => {
  if (career.carreraFinalizada) return 'Retirado'
  if (esParteMedico.value) return 'Estás lesionado'
  if (lote.value.length === 0) return 'Resuelto'
  return esOferta.value ? 'Elige una opción' : `${lote.value.length} pendiente${lote.value.length === 1 ? '' : 's'}`
})

function itemKey(item: LoteItem): string {
  return esInformeLesion(item) ? 'lesion-informe' : (item as DecisionCard | OfertaItem).id
}

function volverInicio() {
  router.push('/')
}
</script>

<template>
  <Transition name="decisions-fade" mode="out-in">
    <div :key="sceneKey" class="decisions-scene">
      <div class="decisions__header">
        <h2>{{ titulo }}</h2>
        <span class="decisions__count">{{ contador }}</span>
      </div>

      <div v-if="career.carreraFinalizada" class="decisions__track">
        <div class="retiro">
          <p class="decisions__empty">Te retiraste del fútbol profesional. ¡Gracias por una gran carrera, {{ career.player!.apellido }}!</p>
          <div class="retiro__actions">
            <button type="button" class="btn btn--ghost" @click="emit('ver-resumen')">Ver resumen de mi carrera</button>
            <button type="button" class="btn" @click="volverInicio">Aceptar</button>
          </div>
        </div>
      </div>

      <TransitionGroup v-else name="decision-card" tag="div" class="decisions__track">
        <template v-for="item in lote" :key="itemKey(item)">
          <LesionCardItem v-if="esInformeLesion(item)" :lesion="item" />
          <OfertaCardItem v-else-if="esOfertaItem(item)" :oferta="item" />
          <DecisionCardItem v-else :decision="item as DecisionCard" />
        </template>
        <p v-if="lote.length === 0" key="__empty" class="decisions__empty">No hay más ofertas por ahora.</p>
      </TransitionGroup>
    </div>
  </Transition>
</template>
