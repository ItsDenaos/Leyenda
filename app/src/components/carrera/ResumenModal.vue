<script setup lang="ts">
// Modal de resumen de carrera (al retirarte) — portado de
// renderResumenCarrera()/ovrArcoSvg()/trofeosResumenHtml() en carrera.js.
import { computed, ref } from 'vue'
import { useCareerStore } from '@/stores/career'
import { resetZoom } from '@/composables/resetZoom'
import { GameConfig } from '@/game/config'
import { ovrTierColor, formatMarketValue, POSITION_NAMES } from '@/game/format'
import { calcularArcoOvr } from '@/game/ovr-chart'
import { generarTarjetaResumenCanvas } from '@/game/resumen-canvas'
import CrestImg from '@/components/CrestImg.vue'
import FlagImg from '@/components/FlagImg.vue'
import TrofeoIcon from './TrofeoIcon.vue'

defineProps<{ mostrar: boolean }>()
const emit = defineEmits<{ cerrar: [] }>()

// El botón "✕" sigue enfocado cuando el modal pasa a [hidden] — sin
// blurearlo antes, el navegador decide solo a dónde mover el foco (ver
// el mismo ajuste en NumeroModal.vue).
function cerrar() {
  ;(document.activeElement as HTMLElement | null)?.blur()
  resetZoom()
  emit('cerrar')
}

const career = useCareerStore()

const resumen = computed(() => career.construirResumenCarrera())
const ultimoClub = computed(() => resumen.value.clubes[resumen.value.clubes.length - 1]!)
const totalTrofeos = computed(() => resumen.value.trofeos.reduce((suma, t) => suma + t.cantidad, 0))
const colorPico = computed(() => ovrTierColor(resumen.value.mayorOvr))
const arco = computed(() => calcularArcoOvr(resumen.value.serieOvr))
const posicionNombre = computed(() => POSITION_NAMES[career.player!.posicion] ?? career.player!.posicion)

const bannerStyle = computed(() => ({ '--rb-a': ultimoClub.value.a, '--rb-b': ultimoClub.value.b }))
const ovrStyle = computed(() => ({ '--ovr-color': colorPico.value }))

// Tarjeta propia dibujada en canvas (no una captura del modal — ver
// resumen-canvas.ts), pensada para compartirse. Tres niveles de respaldo,
// de mejor a peor experiencia según lo que soporte el navegador:
//   1) Web Share API con archivo — abre el selector nativo (WhatsApp,
//      Mensajes, Guardar en Fotos...); lo mejor en mobile.
//   2) Portapapeles — pegarla donde quieras; lo más práctico en desktop.
//   3) Abrir en una pestaña nueva, para guardarla a mano.
const compartiendo = ref(false)

async function copiarResumenComoImagen() {
  compartiendo.value = true
  try {
    const canvas = await generarTarjetaResumenCanvas(career.player!, resumen.value)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!blob) throw new Error('No se pudo generar la imagen')

    const archivo = new File([blob], `leyenda-${career.player!.apellido.toLowerCase()}.png`, { type: 'image/png' })

    if (navigator.canShare?.({ files: [archivo] })) {
      await navigator.share({
        files: [archivo],
        title: 'Mi carrera en Leyenda',
        text: `El resumen de la carrera de ${career.player!.apellido} en Leyenda.`,
      })
      // Sin toast: el propio selector de la Web Share API ya confirma la acción.
    } else if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
      career.mensajes.push('Resumen copiado como imagen — pegalo donde quieras.')
    } else {
      window.open(canvas.toDataURL('image/png'), '_blank')
      career.mensajes.push('Tu navegador no permite copiar la imagen directo — se abrió aparte para que la guardes.')
    }
  } catch (err) {
    // AbortError: el usuario cerró el selector de compartir sin elegir nada — no es un error.
    if (err instanceof DOMException && err.name === 'AbortError') return
    career.mensajes.push('No se pudo generar la imagen del resumen.')
  } finally {
    compartiendo.value = false
  }
}
</script>

<template>
  <div class="modal-overlay" :hidden="!mostrar">
    <div class="modal-card modal-card--resumen">
      <div class="modal-card__head">
        <h3 class="modal-card__title">Resumen de tu carrera</h3>
        <button type="button" class="modal-card__close" aria-label="Compartir resumen" title="Compartir resumen" :disabled="compartiendo" @click="copiarResumenComoImagen">
          {{ compartiendo ? '⏳' : '📤' }}
        </button>
        <button type="button" class="modal-card__close" aria-label="Cerrar" @click="cerrar">✕</button>
      </div>

      <div v-if="mostrar" class="modal-card__scroll">
        <div class="resumen__banner" :style="bannerStyle">
          <div class="resumen__header">
            <CrestImg
              :src="GameConfig.rutaEscudoEquipo(ultimoClub)"
              :alt="ultimoClub.nombre"
              class-css="team-crest team-crest--avatar"
              :initials="ultimoClub.initials"
              :style-vars="{ '--crest-a': ultimoClub.a, '--crest-b': ultimoClub.b }"
            />
            <div>
              <h4 class="resumen__name">{{ career.player!.apellido }}</h4>
              <p class="resumen__subtitle">
                {{ posicionNombre }} · {{ resumen.temporadasJugadas }} temporada{{ resumen.temporadasJugadas === 1 ? '' : 's' }} · Retirado a los
                {{ resumen.edadRetiro }} años
              </p>
            </div>
          </div>
          <div class="ovr-badge ovr-badge--hero resumen__peak-ovr" :style="ovrStyle">
            <span>{{ resumen.mayorOvr }}</span>
            <span class="ovr-badge__label">Pico OVR</span>
          </div>
        </div>

        <div class="resumen__section">
          <div class="resumen__arco-head">
            <h5 class="resumen__section-title">Evolución de OVR</h5>
            <span class="resumen__arco-caption">De {{ resumen.ovrDebut }} a {{ resumen.mayorOvr }}</span>
          </div>
          <div class="resumen__arco-wrap">
            <svg
              v-if="arco"
              class="resumen__arco"
              viewBox="0 0 100 34"
              preserveAspectRatio="none"
              role="img"
              aria-label="Evolución de OVR por temporada"
            >
              <path :d="arco.areaPath" :fill="colorPico" opacity="0.16" stroke="none" />
              <path :d="arco.lineaPath" fill="none" :stroke="colorPico" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" />
              <circle v-for="p in arco.puntos" :key="p.numero" :cx="p.x" :cy="p.y" r="1.7" :fill="colorPico">
                <title>Temporada {{ p.numero }}: {{ p.ovr }} OVR</title>
              </circle>
            </svg>
          </div>
        </div>

        <div class="resumen__stats">
          <div class="stat"><span class="stat__value">{{ resumen.partidos }}</span><span class="stat__label">Partidos</span></div>
          <div class="stat"><span class="stat__value">{{ resumen.goles }}</span><span class="stat__label">Goles</span></div>
          <div class="stat"><span class="stat__value">{{ resumen.asistencias }}</span><span class="stat__label">Asistencias</span></div>
          <div class="stat"><span class="stat__value">{{ resumen.mvp }}</span><span class="stat__label">MVP</span></div>
          <div class="stat"><span class="stat__value">{{ resumen.promedio.toFixed(1) }}</span><span class="stat__label">Promedio</span></div>
          <div class="stat"><span class="stat__value">{{ formatMarketValue(resumen.mayorValor) }}</span><span class="stat__label">Mayor valor</span></div>
        </div>

        <div class="resumen__section">
          <h5 class="resumen__section-title">Clubes ({{ resumen.clubes.length }})</h5>
          <div class="resumen__clubs">
            <template v-for="(equipo, i) in resumen.clubes" :key="equipo.id">
              <span v-if="i > 0" class="resumen__club-arrow">›</span>
              <div class="resumen__club" :title="equipo.nombre">
                <CrestImg
                  :src="GameConfig.rutaEscudoEquipo(equipo)"
                  :alt="equipo.nombre"
                  class-css="team-crest team-crest--md"
                  :initials="equipo.initials"
                  :style-vars="{ '--crest-a': equipo.a, '--crest-b': equipo.b }"
                />
                <span class="resumen__club-name">{{ equipo.nombre }}</span>
              </div>
            </template>
          </div>
        </div>

        <div v-if="resumen.seleccionPartidos > 0" class="resumen__section">
          <h5 class="resumen__section-title">Con la selección</h5>
          <div class="resumen__seleccion">
            <FlagImg :code="career.player!.paisCode" :emoji="career.player!.flag" class-css="resumen__seleccion-flag flag-img" />
            <span class="resumen__seleccion-pais">{{ career.player!.pais }}</span>
            <span class="resumen__seleccion-stats"
              >{{ resumen.seleccionPartidos }} partido{{ resumen.seleccionPartidos === 1 ? '' : 's' }} · {{ resumen.seleccionGoles }} gol{{
                resumen.seleccionGoles === 1 ? '' : 'es'
              }}</span
            >
          </div>
        </div>

        <div class="resumen__section">
          <h5 class="resumen__section-title">Trofeos ({{ totalTrofeos }})</h5>
          <p v-if="resumen.trofeos.length === 0" class="resumen__empty">No ganaste trofeos en esta carrera — pero la viviste a fondo.</p>
          <div v-else class="trophies">
            <span v-for="t in resumen.trofeos" :key="t.nombre" class="trophy-card" :title="t.nombre">
              <TrofeoIcon :trofeo="t" />
              <span class="trophy-card__name">{{ t.nombre }}</span>
              <span v-if="t.cantidad > 1" class="trophy-card__count">×{{ t.cantidad }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-card--resumen {
  max-width: 640px;
  max-height: min(85vh, 720px);
  padding: 1.25rem 1.25rem 0.5rem;
  gap: 0.75rem;
}
.modal-card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-shrink: 0;
}
.modal-card__head .modal-card__title {
  flex: 1;
}
.modal-card__close {
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  border-radius: 8px;
  border: 1px solid var(--card-border);
  background: transparent;
  color: var(--text-dim);
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.15s ease;
}
.modal-card__close:hover {
  color: var(--accent);
  border-color: var(--accent);
}
.modal-card__close:disabled {
  opacity: 0.6;
  cursor: default;
}

.modal-card__scroll {
  overflow-y: auto;
  padding-bottom: 1.25rem;
  margin-right: -0.4rem;
  padding-right: 0.4rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  scrollbar-width: thin;
  scrollbar-color: var(--card-border) transparent;
}
.modal-card__scroll::-webkit-scrollbar {
  width: 8px;
}
.modal-card__scroll::-webkit-scrollbar-track {
  background: transparent;
}
.modal-card__scroll::-webkit-scrollbar-thumb {
  background: var(--card-border);
  border-radius: 4px;
}

.resumen__banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem;
  border-radius: 12px;
  background:
    linear-gradient(120deg, rgba(13, 17, 32, 0.55), rgba(13, 17, 32, 0.85)),
    linear-gradient(135deg, var(--rb-a, #24304f), var(--rb-b, #0f1428));
  flex-shrink: 0;
}
.resumen__header {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}
.resumen__name {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 900;
  color: #fff;
}
.resumen__subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.78rem;
  color: rgba(255, 255, 255, 0.65);
}
.resumen__peak-ovr {
  margin-left: 0;
}

.resumen__arco-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.6rem;
}
.resumen__arco-caption {
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-dim);
}
.resumen__arco-wrap {
  background: var(--bg-soft);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 0.6rem 0.7rem 0.3rem;
  height: 92px;
}
.resumen__arco {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}

.resumen__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(90px, 1fr));
  gap: 0.6rem;
}

.resumen__section {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}
.resumen__section-title {
  margin: 0;
  font-size: 0.78rem;
  font-weight: 700;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.resumen__empty {
  margin: 0;
  font-size: 0.85rem;
  color: var(--text-dim);
}

.resumen__seleccion {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.resumen__seleccion-pais {
  font-size: 0.85rem;
  font-weight: 600;
}
.resumen__seleccion-stats {
  font-size: 0.8rem;
  color: var(--text-dim);
}

.resumen__clubs {
  display: flex;
  align-items: flex-start;
  flex-wrap: nowrap;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.3rem;
  scrollbar-width: thin;
  scrollbar-color: var(--card-border) transparent;
}
.resumen__clubs::-webkit-scrollbar {
  height: 6px;
}
.resumen__clubs::-webkit-scrollbar-thumb {
  background: var(--card-border);
  border-radius: 4px;
}
.resumen__club-arrow {
  align-self: flex-start;
  height: 40px;
  display: flex;
  align-items: center;
  color: var(--text-dim);
  font-size: 1.1rem;
  font-weight: 700;
  flex-shrink: 0;
}
.resumen__club {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
  width: 76px;
  flex-shrink: 0;
  text-align: left;
}
.resumen__club-name {
  font-size: 0.68rem;
  color: var(--text-dim);
  line-height: 1.25;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.trophy-card__count {
  font-size: 0.68rem;
  font-weight: 800;
  color: var(--bg);
  background: var(--trophy-gold);
  border-radius: 999px;
  padding: 0.05rem 0.4rem;
}

/* Modal casi a pantalla completa (en vez de una tarjeta flotando en el
   centro) para aprovechar todo el alto disponible con tan poco ancho. */
@media (max-width: 640px) {
  .modal-card--resumen {
    max-width: none;
    width: 100%;
    max-height: 92vh;
    padding: 1rem 1rem 0.25rem;
  }
  .resumen__banner {
    flex-direction: column;
    text-align: center;
  }
  .resumen__header {
    flex-direction: column;
    gap: 0.5rem;
  }
  .resumen__name {
    font-size: 1.05rem;
  }
  .resumen__peak-ovr {
    margin: 0;
  }
  .resumen__arco-wrap {
    height: 76px;
  }
  .resumen__club {
    width: 64px;
  }
}
</style>
