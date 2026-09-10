<script setup lang="ts">
// Vista de carrera — portado de carrera.html + js/carrera.js.
// Este bloque (7a) arma el esqueleto: guardia de carrera activa, layout de
// 3 franjas (hero fijo / centro scrollable / pie de decisiones fijo), fix
// de altura real de viewport en móvil, y el toast compartido consumiendo
// la cola de mensajes del store. Spotlight (7b), historial (7c) y el panel
// de decisiones (7d) llegan en los próximos sub-bloques.
import { onMounted, onUnmounted, watch, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useCareerStore } from '@/stores/career'
import { useToast } from '@/composables/useToast'
import { GameConfig } from '@/game/config'
import HeroPanel from '@/components/carrera/HeroPanel.vue'
import SpotlightCard from '@/components/carrera/SpotlightCard.vue'
import TimelineList from '@/components/carrera/TimelineList.vue'
import DecisionsPanel from '@/components/carrera/DecisionsPanel.vue'
import NumeroModal from '@/components/carrera/NumeroModal.vue'
import ResumenModal from '@/components/carrera/ResumenModal.vue'

const router = useRouter()
const career = useCareerStore()
const { message: toastMessage, visible: toastVisible, drainQueue } = useToast()

const mostrarModalNumero = ref(false)
const mostrarModalResumen = ref(false)

// `window.innerHeight` sí refleja siempre el viewport real en el momento
// en que se mide (a diferencia de 100dvh, que varios navegadores mobile
// calculan mal al cargar) — ver --vh-real en el <style> global de abajo.
function actualizarAlturaViewport() {
  document.documentElement.style.setProperty('--vh-real', `${window.innerHeight}px`)
}

onMounted(() => {
  document.title = 'Leyenda — Mi carrera'

  if (!career.carreraIniciada) career.cargar()
  if (!career.carreraIniciada) {
    router.push('/')
    return
  }

  // A diferencia del original (carrera.html se carga como página nueva,
  // con la barra de Safari ya asentada), acá se llega por navegación de
  // ruta del SPA — si veníamos de una vista con scroll normal (equipo/
  // personaje), Safari puede haber ocultado su barra de direcciones, y
  // --vh-real quedaría fijado a ese alto "de más" apenas se expanda de
  // nuevo. overflow:hidden también en <html> (no solo en <body>) evita
  // que ese desfase momentáneo se traduzca en scroll de toda la página —
  // el original nunca lo necesitó porque no tiene ese salto de contexto.
  document.documentElement.classList.add('html--career')
  document.body.classList.add('body--career')
  actualizarAlturaViewport()
  window.addEventListener('resize', actualizarAlturaViewport)
  window.addEventListener('orientationchange', actualizarAlturaViewport)
  window.visualViewport?.addEventListener('resize', actualizarAlturaViewport)
})

onUnmounted(() => {
  document.documentElement.classList.remove('html--career')
  document.body.classList.remove('body--career')
  window.removeEventListener('resize', actualizarAlturaViewport)
  window.removeEventListener('orientationchange', actualizarAlturaViewport)
  window.visualViewport?.removeEventListener('resize', actualizarAlturaViewport)
})

watch(
  () => career.mensajes.length,
  () => drainQueue(career.mensajes),
)
</script>

<template>
  <template v-if="career.carreraIniciada">
    <HeroPanel @solicitar-numero="mostrarModalNumero = true" />

    <main class="career">
      <section v-if="!career.carreraFinalizada" id="spotlight">
        <SpotlightCard />
      </section>

      <section v-if="career.temporadasFinalizadas.length > 0" class="timeline">
        <h2 class="timeline__title">Historial</h2>
        <TimelineList />
      </section>

      <footer class="app-footer">{{ GameConfig.VERSION ? `Leyenda v${GameConfig.VERSION} · Publicado el ${GameConfig.FECHA_PUBLICACION}` : '' }}</footer>
    </main>

    <footer class="decisions">
      <DecisionsPanel @ver-resumen="mostrarModalResumen = true" />
    </footer>

    <div class="toast" :class="{ 'toast--visible': toastVisible }">{{ toastMessage }}</div>

    <NumeroModal :mostrar="mostrarModalNumero" @cerrar="mostrarModalNumero = false" />
    <ResumenModal :mostrar="mostrarModalResumen" @cerrar="mostrarModalResumen = false" />
  </template>
</template>

<style scoped>
.timeline__title {
  margin: 0 0 0.85rem;
  font-size: 1rem;
  color: var(--text-dim);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

@media (max-width: 640px) {
  .timeline__title {
    margin-bottom: 0.6rem;
    font-size: 0.85rem;
  }
}
</style>

<style>
/* Reglas que necesariamente son globales: aplican a <body> (fuera del
   árbol de componentes) mientras esta vista está montada — ver el toggle
   de la clase `body--career` en onMounted/onUnmounted arriba. Portado de
   la parte de layout de carrera.css que scoped no puede alcanzar. */
/* Ver el comentario de html--career en onMounted (CarreraView.vue) sobre
   por qué hace falta bloquear el scroll también en <html> acá, a
   diferencia del original. */
.html--career {
  height: 100%;
  overflow: hidden;
}
.body--career {
  height: 100vh;
  height: 100dvh;
  height: var(--vh-real, 100dvh);
  padding-bottom: 0;
  overflow: hidden;
}
/* El original tenía hero/main/decisions como hijos directos de <body> —
   acá los monta Vue adentro de #app, así que el layout de 3 franjas
   (hero fijo / centro scrollable / decisiones fijo) se arma en #app, no
   en <body> directamente. */
.body--career #app {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.career {
  flex: 1 1 auto;
  overflow-y: auto;
  max-width: 1180px;
  width: 100%;
  margin: 0 auto;
  padding: 1.5rem 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  scrollbar-width: thin;
  scrollbar-color: var(--card-border) transparent;
}
.career::-webkit-scrollbar {
  width: 8px;
}
.career::-webkit-scrollbar-track {
  background: transparent;
}
.career::-webkit-scrollbar-thumb {
  background: var(--card-border);
  border-radius: 4px;
}
.career::-webkit-scrollbar-thumb:hover {
  background: var(--text-dim);
}

/* Override del toast genérico (ver base.css): acá abajo siempre está el
   panel de decisiones, así que el toast se reubica arriba (debajo del
   hero) en vez de salir desde abajo, para no tapar tarjetas/botones. */
.body--career .toast {
  top: -60vh;
  bottom: auto;
  transform: translateX(-50%);
  transition: top 0.3s ease;
  max-width: calc(100vw - 2rem);
}
.body--career .toast--visible {
  top: 10.5rem;
}

.decisions {
  flex: 0 0 auto;
  background: rgba(13, 17, 32, 0.95);
  border-top: 1px solid var(--card-border);
  backdrop-filter: blur(6px);
  padding: 0.85rem 1.5rem calc(1rem + env(safe-area-inset-bottom));
}
.decisions__header {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  margin-bottom: 0.65rem;
}
.decisions__header h2 {
  margin: 0;
  font-size: 1rem;
}
.decisions__count {
  font-size: 0.78rem;
  color: var(--text-dim);
}
.decisions__track {
  display: flex;
  gap: 0.85rem;
  overflow-x: auto;
  padding-bottom: 0.25rem;
  scroll-snap-type: x proximity;
}
.decisions__track::-webkit-scrollbar {
  height: 6px;
}
.decisions__track::-webkit-scrollbar-thumb {
  background: var(--card-border);
  border-radius: 3px;
}
.decisions__empty {
  color: var(--text-dim);
  font-size: 0.88rem;
  padding: 0.75rem 0.25rem;
}

/* Acciones al cerrar la carrera (ver DecisionsPanel.vue). */
.retiro {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  text-align: center;
}
.retiro__actions {
  display: flex;
  gap: 0.75rem;
  width: 100%;
  max-width: 420px;
}
.retiro__actions .btn {
  flex: 1;
}

/* ============ MODALES (dorsal, resumen de carrera) ============ */
/* Base compartida por NumeroModal y ResumenModal — cada uno la extiende
   scoped en su propio componente (ej. .modal-card--resumen). */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(5, 7, 16, 0.7);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}
.modal-overlay[hidden] {
  display: none;
}
.modal-card {
  width: 100%;
  max-width: 360px;
  background: var(--card);
  border: 1px solid var(--card-border);
  border-radius: var(--radius);
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  box-shadow: 0 20px 45px -20px #000d;
}
.modal-card__title {
  margin: 0;
  font-size: 1.05rem;
}
.modal-card__desc {
  margin: 0;
  font-size: 0.82rem;
  color: var(--text-dim);
  line-height: 1.4;
}
.modal-card__actions {
  display: flex;
  gap: 0.6rem;
  margin-top: 0.2rem;
}
.modal-card__actions .btn {
  flex: 1;
}

/* Cambio de "escena" completo del panel (nueva pausa) — ver el
   <Transition name="decisions-fade"> en DecisionsPanel.vue, reemplazo
   declarativo de cambiarContenidoDecisiones() del original. */
.decisions-fade-enter-active,
.decisions-fade-leave-active {
  transition: opacity 0.18s ease;
}
.decisions-fade-enter-from,
.decisions-fade-leave-to {
  opacity: 0;
}

/* ============ TARJETAS DE DECISIÓN / OFERTA / LESIÓN ============ */
/* Compartidas por DecisionCardItem/OfertaCardItem/LesionCardItem — Vue
   aplica el scope de DecisionsPanel al elemento raíz de cada una (son
   componentes hijos invocados desde su <TransitionGroup>), así que estas
   reglas viven acá, globales, para alcanzar también sus descendientes. */
.decision-card {
  position: relative;
  scroll-snap-align: start;
  flex: 0 0 340px;
  max-width: calc(100vw - 3rem);
  background: var(--card);
  border: 1px solid var(--card-border);
  border-left: 3px solid var(--card-border);
  border-radius: 12px;
  padding: 0.9rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.decision-card--deportivo,
.decision-card--personal {
  flex: 0 0 calc(50% - 0.425rem);
  max-width: calc(50% - 0.425rem);
}
.decision-card--deportivo {
  border-left-color: var(--accent);
}
.decision-card--personal {
  border-left-color: var(--accent-2);
}

.decision-card--alto-impacto {
  border-left-color: #ef4444;
  box-shadow:
    0 0 0 1px #ef444440,
    0 8px 24px -12px #ef444466;
}
.decision-card__impacto {
  position: absolute;
  top: 0.6rem;
  right: 0.7rem;
  font-size: 1.05rem;
  line-height: 1;
  filter: drop-shadow(0 0 4px #ef444488);
}

.decision-card--oferta-club {
  border-left-color: #a78bfa;
}
.decision-card--oferta-club .decision-card__tag {
  background: #a78bfa26;
  color: #a78bfa;
}
.decision-card--quedarme {
  border-left-color: #34d399;
}
.decision-card--quedarme .decision-card__tag {
  background: #34d39926;
  color: #34d399;
}
.decision-card--retiro {
  border-left-color: #f97316;
}
.decision-card--retiro .decision-card__tag {
  background: #f9731626;
  color: #f97316;
}
.decision-card--retiro.decision-card--retiro-forzoso {
  border-left-color: #ef4444;
}
.decision-card--retiro-forzoso .decision-card__tag {
  background: #ef444426;
  color: #ef4444;
}
.decision-card--oferta-club.decision-card--retiro-forzoso {
  flex: 0 0 100%;
  max-width: 100%;
  text-align: center;
}
.decision-card--retiro-forzoso .decision-card__team {
  justify-content: center;
  text-align: left;
}
.decision-card--retiro-forzoso .decision-card__actions {
  max-width: 320px;
  margin: 0 auto;
}

.decision-card--lesion-informe {
  flex: 0 0 100%;
  max-width: 100%;
  text-align: center;
  align-items: center;
}
.decision-card--lesion-nivel3 {
  border-left-color: #eab308;
}
.decision-card--lesion-nivel3 .decision-card__tag {
  background: #eab30826;
  color: #eab308;
}
.decision-card--lesion-nivel2 {
  border-left-color: #f97316;
}
.decision-card--lesion-nivel2 .decision-card__tag {
  background: #f9731626;
  color: #f97316;
}
.decision-card--lesion-nivel1 {
  border-left-color: #ef4444;
}
.decision-card--lesion-nivel1 .decision-card__tag {
  background: #ef444426;
  color: #ef4444;
}
.decision-card__lesion-detalle {
  margin: 0;
  font-size: 0.82rem;
  font-weight: 700;
  color: var(--text);
}

@media (min-width: 641px) {
  .decisions__track:has(.decision-card--oferta-club) {
    flex-wrap: wrap;
  }
  .decision-card--oferta-club {
    flex: 0 0 calc(50% - 0.425rem);
    max-width: calc(50% - 0.425rem);
    min-width: 0;
  }
}

.decision-card__tag {
  align-self: flex-start;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
}
.decision-card--deportivo .decision-card__tag {
  background: var(--accent-soft);
  color: var(--accent);
}
.decision-card--personal .decision-card__tag {
  background: #22d3ee2b;
  color: var(--accent-2);
}

.decision-card__team {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 0;
}
.decision-card__team > div {
  min-width: 0;
  flex: 1;
}
.decision-card__teamname {
  font-weight: 700;
  font-size: 0.88rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.decision-card__league {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.72rem;
  color: var(--text-dim);
  min-width: 0;
}
.decision-card__league span {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.decision-card__flag {
  flex-shrink: 0;
  margin-left: 0.1rem;
}

.decision-card__desc {
  margin: 0;
  font-size: 0.82rem;
  color: var(--text-dim);
  line-height: 1.4;
}
.decision-card__valor {
  margin: -0.2rem 0 0;
  font-size: 0.78rem;
  color: var(--text-dim);
}
.decision-card__valor strong {
  color: var(--accent-2);
  font-weight: 800;
}

.decision-card__actions {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
}
.decision-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
}
.decision-option__efectos {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
}
.efecto {
  font-size: 0.62rem;
  font-weight: 700;
  color: var(--text-dim);
  background: rgba(255, 255, 255, 0.06);
  border-radius: 999px;
  padding: 0.15rem 0.5rem;
  white-space: nowrap;
}
.efecto--pos {
  color: #34d399;
}
.efecto--neg {
  color: #ef4444;
}
.btn {
  flex: 1;
  border: none;
  border-radius: 8px;
  padding: 0.55rem 0.5rem;
  font-size: 0.78rem;
  font-weight: 700;
  cursor: pointer;
  background: var(--accent);
  color: #1a1300;
  transition:
    transform 0.15s ease,
    opacity 0.15s ease;
}
.btn:hover {
  transform: translateY(-1px);
}
.btn:disabled {
  opacity: 0.6;
  cursor: default;
  transform: none;
}
.btn--ghost {
  background: transparent;
  border: 1px solid var(--card-border);
  color: var(--text);
}

/* Tarjeta resuelta dentro de la misma pausa — ver el <TransitionGroup
   name="decision-card"> en DecisionsPanel.vue, reemplazo declarativo de
   capturarPosicionesCards()/animarReacomodoCards() (técnica FLIP) del
   original. */
.decision-card-move {
  transition: transform 0.55s cubic-bezier(0.4, 0, 0.2, 1);
}
.decision-card-enter-active,
.decision-card-leave-active {
  transition:
    opacity 0.25s ease,
    transform 0.25s ease;
}
.decision-card-enter-from {
  opacity: 0;
  transform: scale(0.96);
}
.decision-card-leave-to {
  opacity: 0;
  transform: scale(0.92);
}

@media (max-width: 640px) {
  .body--career .toast--visible {
    top: 6.75rem;
  }
  .body--career .toast {
    width: calc(100vw - 1.5rem);
    max-width: calc(100vw - 1.5rem);
    box-sizing: border-box;
    text-align: center;
  }
  .career {
    padding: 0.85rem 0.85rem 0.75rem;
    gap: 0.9rem;
  }
  .decisions__empty {
    padding: 0.75rem 0.9rem;
  }
  .retiro__actions {
    flex-direction: column;
  }

  /* En mobile las tarjetas viven en un carrusel con scroll-snap (una a la
     vez): el reacomodo por FLIP (mover en X) choca con el scroll-snap
     nativo, así que acá alcanza con el fundido de entrada, sin trasladar. */
  .decision-card-move {
    transition: none;
  }

  .decision-card {
    flex: 0 0 88%;
    max-width: 88%;
    scroll-snap-align: center;
    padding: 0.8rem 0.9rem;
    gap: 0.5rem;
    border-radius: 14px;
  }
  .decision-card__desc {
    font-size: 0.78rem;
  }
  .decision-option__efectos {
    gap: 0.25rem;
  }
  .efecto {
    font-size: 0.6rem;
    padding: 0.14rem 0.45rem;
  }
  .btn {
    padding: 0.7rem 0.5rem;
    font-size: 0.82rem;
  }
  .decision-card--lesion-informe {
    flex: 0 0 100%;
    max-width: 100%;
  }
  .decision-card__actions {
    flex-direction: column;
    gap: 0.55rem;
  }
  .decision-option .btn {
    width: 100%;
    text-align: left;
    font-weight: 600;
    padding: 0.75rem 0.9rem;
  }
  .decision-card--oferta-club {
    padding: 0.8rem 0.9rem;
    gap: 0.55rem;
  }
  .decision-card--oferta-club .decision-card__teamname {
    font-size: 0.92rem;
  }
  .decision-card--oferta-club .decision-card__league {
    font-size: 0.74rem;
  }
  .decision-card--oferta-club .decision-card__desc {
    font-size: 0.8rem;
  }
  .decision-card--oferta-club .btn {
    font-size: 0.82rem;
    padding: 0.7rem 0.5rem;
  }
}
</style>
