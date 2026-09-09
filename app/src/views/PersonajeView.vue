<script setup lang="ts">
// Creación de personaje — portado de index.html + js/script.js.
// Wizard de 3 pasos con ficha en vivo; portado 1:1 en comportamiento,
// reescrito a Vue: el DOM manual (querySelector, classList.toggle,
// innerHTML) pasa a ser estado reactivo + bindings de plantilla.
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { GameConfig } from '@/game/config'
import { COUNTRIES, type Country } from '@/data/countries'
import { savePlayerDraft } from '@/game/player-draft'
import { useToast } from '@/composables/useToast'
import FlagImg from '@/components/FlagImg.vue'

const router = useRouter()

// Enlace por :src (no un `src` literal) para que el compilador de SFC no lo
// reescriba en un import de módulo — como asset de `public/`, esta ruta se
// resuelve en runtime tal cual, tanto en dev/build como bajo vitest.
const logoSrc = `${import.meta.env.BASE_URL}assets/logo/logo_leyenda_transparent.png`

type Pierna = 'izquierda' | 'derecha'
type PasoKey = 'identidad' | 'nacionalidad' | 'posicion'

interface PosicionDef {
  pos: string
  label: string
}

// Mismo layout que la cancha del original: filas de botones, de ataque a
// arquero. `null` marca un espacio vacío en la fila (para centrar MCO/DFC/POR).
const FILAS_CANCHA: (PosicionDef | null)[][] = [
  [
    { pos: 'EI', label: 'Extremo Izquierdo' },
    { pos: 'DC', label: 'Delantero Centro' },
    { pos: 'ED', label: 'Extremo Derecho' },
  ],
  [null, { pos: 'MCO', label: 'Mediocampista Ofensivo' }, null],
  [
    { pos: 'MI', label: 'Mediocampista Izquierdo' },
    { pos: 'MC', label: 'Mediocampista Central' },
    { pos: 'MD', label: 'Mediocampista Derecho' },
  ],
  [
    { pos: 'LI', label: 'Lateral Izquierdo' },
    { pos: 'MCD', label: 'Mediocampista Defensivo' },
    { pos: 'LD', label: 'Lateral Derecho' },
  ],
  [null, { pos: 'DFC', label: 'Defensor Central' }, null],
  [null, { pos: 'POR', label: 'Portero' }, null],
]

const EDADES = Array.from({ length: GameConfig.EDAD_MAX - GameConfig.EDAD_MIN + 1 }, (_, i) => GameConfig.EDAD_MIN + i)

// ---------- ESTADO ----------
const apellido = ref('')
// El dorsal no se elige al crear el personaje: te lo asigna el club al
// debutar (ver GameConfig.sortearDorsalInicial) — recién se puede pedir
// un cambio al cerrar la primera temporada.
const numero = ref(GameConfig.sortearDorsalInicial())
const edad = ref(GameConfig.EDAD_MIN)
const pierna = ref<Pierna>('derecha')
const paisSeleccionado = ref<string | null>(null)
const posicionSeleccionada = ref<string | null>(null)
const busquedaPais = ref('')

const { message: toastMessage, visible: toastVisible, show: mostrarToast } = useToast()

// ---------- VALIDACIÓN ----------
const identidadOk = computed(
  () => apellido.value.trim().length > 0 && numero.value >= 1 && edad.value >= GameConfig.EDAD_MIN && edad.value <= GameConfig.EDAD_MAX,
)
const paisOk = computed(() => Boolean(paisSeleccionado.value))
const posOk = computed(() => Boolean(posicionSeleccionada.value))
const todoOk = computed(() => identidadOk.value && paisOk.value && posOk.value)

const paisObj = computed<Country | undefined>(() => COUNTRIES.find((c) => c.name === paisSeleccionado.value))
const posicionObj = computed<PosicionDef | undefined>(() =>
  FILAS_CANCHA.flat()
    .filter((p): p is PosicionDef => p !== null)
    .find((p) => p.pos === posicionSeleccionada.value),
)

const paisesFiltrados = computed(() => {
  const q = busquedaPais.value.trim().toLowerCase()
  return COUNTRIES.filter((c) => c.name.toLowerCase().includes(q))
})

const summaryText = computed(() => {
  if (todoOk.value) {
    return `${apellido.value} #${numero.value} · ${paisObj.value?.flag ?? ''} ${paisSeleccionado.value} · ${posicionSeleccionada.value}`
  }
  const faltan: string[] = []
  if (!identidadOk.value) faltan.push('identidad')
  if (!paisOk.value) faltan.push('nacionalidad')
  if (!posOk.value) faltan.push('posición')
  return `Falta completar: ${faltan.join(', ')}`
})

// ---------- ACORDEÓN DE PASOS (solo tiene efecto visual en móvil) ----------
const STEP_ORDER: PasoKey[] = ['identidad', 'nacionalidad', 'posicion']
const pasoAbierto = ref<PasoKey | null>('identidad')
const pasoCompletadoAntes = reactive<Record<PasoKey, boolean>>({ identidad: false, nacionalidad: false, posicion: false })

function enfocarPasoSiMovil(key: PasoKey | null) {
  if (!key || typeof window.matchMedia !== 'function') return
  if (!window.matchMedia('(max-width: 900px)').matches) return
  document.getElementById(`card-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// Si el paso que el usuario tiene abierto se acaba de completar, pasa
// solo al siguiente sin resolver — pero si reabre uno ya completado para
// editarlo, no lo cierra de golpe mientras lo sigue tocando.
function avanzarSiCorresponde(key: PasoKey, ok: boolean) {
  if (ok && !pasoCompletadoAntes[key] && pasoAbierto.value === key) {
    const antes = pasoAbierto.value
    pasoAbierto.value = STEP_ORDER[STEP_ORDER.indexOf(key) + 1] ?? null
    if (pasoAbierto.value !== antes) enfocarPasoSiMovil(pasoAbierto.value)
  }
  pasoCompletadoAntes[key] = ok
}

function toggleAcordeon(key: PasoKey) {
  pasoAbierto.value = pasoAbierto.value === key ? null : key
}

// ---------- HANDLERS ----------
// El apellido usa input (sin avanzar el acordeón, para no cerrar el paso
// a mitad de palabra apenas se tipea la primera letra) + blur (donde sí
// se revisa si corresponde avanzar) — misma distinción que el
// `permitirAvance` del script original.
function onApellidoInput(e: Event) {
  apellido.value = (e.target as HTMLInputElement).value.toUpperCase()
}
function onApellidoBlur() {
  avanzarSiCorresponde('identidad', identidadOk.value)
}

function seleccionarEdad(nuevaEdad: number) {
  edad.value = nuevaEdad
  avanzarSiCorresponde('identidad', identidadOk.value)
}

function seleccionarPierna(nuevaPierna: Pierna) {
  pierna.value = nuevaPierna
}

function seleccionarPais(pais: Country) {
  paisSeleccionado.value = pais.name
  avanzarSiCorresponde('nacionalidad', true)
}

function seleccionarPosicion(pos: PosicionDef) {
  posicionSeleccionada.value = pos.pos
  avanzarSiCorresponde('posicion', true)
}

function comenzarCarrera() {
  if (!todoOk.value) return
  savePlayerDraft({
    apellido: apellido.value,
    numero: numero.value,
    pierna: pierna.value,
    edad: edad.value,
    pais: paisSeleccionado.value!,
    flag: paisObj.value?.flag ?? '',
    paisCode: paisObj.value?.code ?? '',
    posicion: posicionSeleccionada.value!,
  })
  mostrarToast(`¡Bienvenido, ${apellido.value}! Ahora elige tu primer equipo.`)
  setTimeout(() => router.push('/equipo'), 900)
}

onMounted(() => {
  document.title = 'Leyenda — Crea tu jugador'
})
</script>

<template>
  <header class="topbar">
    <div class="brand">
      <img class="brand__logo" :src="logoSrc" alt="Leyenda" />
    </div>
    <p class="brand__tagline">Conviértete en una leyenda del fútbol</p>
  </header>

  <main class="creator">
    <div class="creator__intro">
      <h1>Crea tu ficha de jugador</h1>
      <p>Cada dato que cargues se refleja al instante en tu carnet. Cuando esté completo, empiezas tu carrera.</p>
    </div>

    <div class="creator__body">
      <!-- FICHA EN VIVO -->
      <aside class="creator__card">
        <div class="player-card">
          <span class="player-card__ribbon">Nueva ficha</span>

          <div class="player-card__progress">
            <span class="progress-dot" :class="{ 'progress-dot--done': identidadOk }"></span>
            <span class="progress-dot" :class="{ 'progress-dot--done': paisOk }"></span>
            <span class="progress-dot" :class="{ 'progress-dot--done': posOk }"></span>
          </div>

          <div class="player-card__badges">
            <span>
              <span class="player-card__pos">{{ posicionSeleccionada ?? '--' }}</span>
              <span class="player-card__pos-label">Posición</span>
            </span>
            <span class="player-card__flag">
              <FlagImg v-if="paisObj" :code="paisObj.code" :emoji="paisObj.flag" class-css="player-card__flag flag-img flag-img--lg" />
              <template v-else>🏳️</template>
            </span>
          </div>

          <div class="jersey">
            <svg viewBox="0 0 200 175" class="jersey__svg" aria-hidden="true">
              <defs>
                <linearGradient id="jerseyFabric" x1="0" y1="0" x2="0.7" y2="1">
                  <stop offset="0%" stop-color="#ffffff" />
                  <stop offset="100%" stop-color="#d9e0ef" />
                </linearGradient>
              </defs>

              <path
                class="jersey__body"
                d="M65,15 L85,5 Q100,18 115,5 L135,15 L185,43 L150,67 L142,57 L142,160
               Q100,170 58,160 L58,57 L50,67 L15,43 Z"
              />

              <rect class="jersey__panel" x="60" y="60" width="6" height="98" rx="3" />
              <rect class="jersey__panel" x="134" y="60" width="6" height="98" rx="3" />

              <line class="jersey__cuff" x1="21" y1="38" x2="56" y2="62" />
              <line class="jersey__cuff" x1="179" y1="38" x2="144" y2="62" />

              <path class="jersey__trim" d="M85,5 Q100,18 115,5 L121,15 Q100,26 79,15 Z" />
            </svg>
            <div class="jersey__text">
              <span class="jersey__lastname">{{ apellido || 'APELLIDO' }}</span>
              <span class="jersey__number">{{ numero }}</span>
            </div>
          </div>

          <div class="player-card__meta">
            <div class="player-card__metarow">
              <span class="player-card__label">Nacionalidad</span>
              <span class="player-card__value">{{ paisSeleccionado ?? 'Sin elegir' }}</span>
            </div>
            <div class="player-card__metarow">
              <span class="player-card__label">Posición</span>
              <span class="player-card__value">{{ posicionObj?.label ?? 'Sin elegir' }}</span>
            </div>
            <div class="player-card__metarow">
              <span class="player-card__label">Edad</span>
              <span class="player-card__value">{{ edad }} años</span>
            </div>
          </div>
        </div>

        <div class="creator__confirm">
          <p class="creator__hint">{{ summaryText }}</p>
          <button type="button" class="cta" :disabled="!todoOk" @click="comenzarCarrera">Comenzar carrera</button>
        </div>
      </aside>

      <!-- FLUJO DE PASOS -->
      <div class="creator__flow">
        <section id="card-identidad" class="flow-step" :class="{ 'flow-step--collapsed': pasoAbierto !== 'identidad', 'card--done': identidadOk }">
          <h2 class="flow-step__header" @click="toggleAcordeon('identidad')">
            <span class="step" :class="{ 'step--done': identidadOk }">{{ identidadOk ? '✓' : '1' }}</span>
            <span class="flow-step__title">¿Quién eres?</span>
            <span class="flow-step__summary">{{ identidadOk ? `${apellido} #${numero}` : '' }}</span>
            <span class="flow-step__chev">⌄</span>
          </h2>
          <div class="flow-step__body">
            <div class="flow-row">
              <label class="field field--grow">
                <span class="field__label">Apellido</span>
                <input
                  type="text"
                  maxlength="16"
                  placeholder="APELLIDO"
                  autocomplete="off"
                  :value="apellido"
                  @input="onApellidoInput"
                  @blur="onApellidoBlur"
                />
              </label>
            </div>

            <div class="flow-row">
              <div class="field field--grow">
                <span class="field__label">Edad</span>
                <div class="age-picker">
                  <button
                    v-for="e in EDADES"
                    :key="e"
                    type="button"
                    class="age-card"
                    :class="{ 'age-card--active': e === edad }"
                    @click="seleccionarEdad(e)"
                  >
                    {{ e }}
                  </button>
                </div>
              </div>
              <div class="field field--grow">
                <span class="field__label">Pierna hábil</span>
                <div class="toggle">
                  <button
                    type="button"
                    class="toggle__btn"
                    :class="{ 'toggle__btn--active': pierna === 'izquierda' }"
                    @click="seleccionarPierna('izquierda')"
                  >
                    Izquierda
                  </button>
                  <button
                    type="button"
                    class="toggle__btn"
                    :class="{ 'toggle__btn--active': pierna === 'derecha' }"
                    @click="seleccionarPierna('derecha')"
                  >
                    Derecha
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          id="card-nacionalidad"
          class="flow-step"
          :class="{ 'flow-step--collapsed': pasoAbierto !== 'nacionalidad', 'card--done': paisOk }"
        >
          <h2 class="flow-step__header" @click="toggleAcordeon('nacionalidad')">
            <span class="step" :class="{ 'step--done': paisOk }">{{ paisOk ? '✓' : '2' }}</span>
            <span class="flow-step__title">¿De dónde eres?</span>
            <span class="flow-step__summary">{{ paisOk ? paisSeleccionado : '' }}</span>
            <span class="flow-step__chev">⌄</span>
          </h2>
          <div class="flow-step__body">
            <div class="search">
              <span class="search__icon">🔍</span>
              <input v-model="busquedaPais" type="text" placeholder="Buscar país" autocomplete="off" />
            </div>

            <div class="country-grid">
              <div v-if="paisesFiltrados.length === 0" class="country-chip__empty">No se encontraron países</div>
              <div
                v-for="c in paisesFiltrados"
                :key="c.code"
                class="country-chip"
                :class="{ 'country-chip--active': paisSeleccionado === c.name }"
                @click="seleccionarPais(c)"
              >
                <FlagImg :code="c.code" :emoji="c.flag" class-css="country-chip__flag flag-img" />
                <span>{{ c.name }}</span>
              </div>
            </div>
          </div>
        </section>

        <section id="card-posicion" class="flow-step" :class="{ 'flow-step--collapsed': pasoAbierto !== 'posicion', 'card--done': posOk }">
          <h2 class="flow-step__header" @click="toggleAcordeon('posicion')">
            <span class="step" :class="{ 'step--done': posOk }">{{ posOk ? '✓' : '3' }}</span>
            <span class="flow-step__title">¿Dónde juegas?</span>
            <span class="flow-step__summary">{{ posOk ? posicionSeleccionada : '' }}</span>
            <span class="flow-step__chev">⌄</span>
          </h2>
          <div class="flow-step__body">
            <div class="pitch">
              <span class="pitch__corner pitch__corner--tl"></span>
              <span class="pitch__corner pitch__corner--tr"></span>
              <span class="pitch__corner pitch__corner--bl"></span>
              <span class="pitch__corner pitch__corner--br"></span>

              <div class="pitch__box pitch__box--top"></div>
              <div class="pitch__box pitch__box--top-small"></div>
              <div class="pitch__line pitch__line--mid"></div>
              <div class="pitch__circle"></div>
              <div class="pitch__spot"></div>
              <div class="pitch__box pitch__box--bottom-small"></div>
              <div class="pitch__box pitch__box--bottom"></div>

              <div v-for="(fila, i) in FILAS_CANCHA" :key="i" class="pitch__row" :class="{ 'pitch__row--single': fila.filter((p) => p).length === 1 }">
                <template v-for="(p, j) in fila" :key="j">
                  <button
                    v-if="p"
                    type="button"
                    class="pos-btn"
                    :class="{ 'pos-btn--active': posicionSeleccionada === p.pos, 'pos-btn--gk': p.pos === 'POR' }"
                    :title="p.label"
                    @click="seleccionarPosicion(p)"
                  >
                    {{ p.pos }}
                  </button>
                </template>
              </div>
            </div>

            <p class="pitch__hint">{{ posOk ? `Posición elegida: ${posicionObj?.label} (${posicionSeleccionada})` : 'Elige tu posición en la cancha.' }}</p>
          </div>
        </section>
      </div>
    </div>
  </main>

  <footer class="app-footer">{{ GameConfig.VERSION ? `Leyenda v${GameConfig.VERSION} · Publicado el ${GameConfig.FECHA_PUBLICACION}` : '' }}</footer>

  <div class="toast" :class="{ 'toast--visible': toastVisible }">{{ toastMessage }}</div>
</template>

<style scoped>
/* ============ CREATOR LAYOUT ============ */
.creator {
  max-width: 1180px;
  margin: 0 auto;
  padding: 2rem;
}

@media (max-width: 900px) {
  .creator {
    padding: 1.5rem;
  }
}

.creator__body {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 2rem;
  align-items: start;
}

@media (max-width: 900px) {
  .creator__body {
    grid-template-columns: 1fr;
  }
  /* En móvil el formulario va primero: si la ficha (con el jersey) queda
     arriba, hay que scrollear toda esa vista antes de llegar a los
     campos. Así se completa todo y la ficha + botón de confirmar quedan
     al final, como cierre natural. */
  .creator__flow {
    order: 1;
  }
  .creator__card {
    order: 2;
  }
}

.creator__card {
  position: sticky;
  top: 5.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
@media (max-width: 900px) {
  .creator__card {
    position: static;
  }
}

/* ============ PLAYER CARD (ficha en vivo) ============ */
.player-card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(160deg, #212b52 0%, #141a34 55%, #0f1428 100%);
  border: 1px solid var(--card-border);
  border-radius: 20px;
  padding: 1.5rem 1.25rem 1.75rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.1rem;
  box-shadow: 0 24px 60px -28px #000c;
}
.player-card::before {
  content: '';
  position: absolute;
  inset: -50% -10% auto -10%;
  height: 60%;
  background: radial-gradient(circle, var(--accent-soft), transparent 70%);
  pointer-events: none;
}

.player-card__ribbon {
  position: relative;
  align-self: flex-start;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
  background: var(--accent-soft);
  border: 1px solid var(--accent);
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
}

.player-card__progress {
  position: relative;
  align-self: stretch;
  display: flex;
  gap: 0.4rem;
}
.progress-dot {
  flex: 1;
  height: 4px;
  border-radius: 999px;
  background: var(--card-border);
  transition: background 0.2s ease;
}
.progress-dot--done {
  background: var(--accent);
}

.player-card__badges {
  position: relative;
  align-self: stretch;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}
.player-card__pos {
  font-size: 1.3rem;
  font-weight: 900;
  color: var(--accent);
  line-height: 1;
}
.player-card__pos-label {
  display: block;
  font-size: 0.55rem;
  font-weight: 700;
  color: var(--text-dim);
  letter-spacing: 0.05em;
  margin-top: 0.15rem;
}
.player-card__flag {
  font-size: 1.6rem;
  line-height: 1;
}

/* JERSEY */
.jersey {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.jersey__svg {
  width: 132px;
  height: auto;
  overflow: visible;
  filter: drop-shadow(0 8px 12px rgba(0, 0, 0, 0.35));
}
.jersey__body {
  fill: url(#jerseyFabric);
  stroke: rgba(15, 23, 42, 0.55);
  stroke-width: 2;
}
.jersey__trim {
  fill: var(--accent);
  opacity: 0.92;
}
.jersey__panel {
  fill: rgba(31, 41, 55, 0.09);
}
.jersey__cuff {
  stroke: var(--accent);
  stroke-width: 3;
  stroke-linecap: round;
  opacity: 0.9;
}
.jersey__text {
  position: absolute;
  top: 46%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  pointer-events: none;
}
.jersey__lastname {
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 0.05em;
  color: #1f2937;
  max-width: 100px;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.5);
}
.jersey__number {
  font-size: 1.7rem;
  font-weight: 900;
  color: #1f2937;
  line-height: 1;
  text-shadow:
    0 1px 0 rgba(255, 255, 255, 0.5),
    0 2px 4px rgba(15, 23, 42, 0.25);
}

.player-card__meta {
  position: relative;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  border-top: 1px solid var(--card-border);
  padding-top: 0.9rem;
}
.player-card__metarow {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.8rem;
}
.player-card__label {
  color: var(--text-dim);
}
.player-card__value {
  font-weight: 700;
  text-align: right;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 65%;
}

.creator__confirm {
  background: var(--card);
  border: 1px solid var(--card-border);
  border-radius: var(--radius);
  padding: 1rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  text-align: center;
}
.creator__hint {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-dim);
}

/* ============ FLUJO DE PASOS ============ */
.creator__flow {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: 0;
}

.creator__intro {
  margin-bottom: 1.75rem;
}
.creator__intro h1 {
  margin: 0 0 0.35rem;
  font-size: 1.8rem;
}
.creator__intro p {
  margin: 0;
  color: var(--text-dim);
}

.flow-step {
  background: var(--card);
  border: 1px solid var(--card-border);
  border-left: 3px solid var(--card-border);
  border-radius: var(--radius);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  transition:
    border-color 0.25s ease,
    box-shadow 0.25s ease;
  scroll-margin-top: 6rem;
}
#card-identidad {
  border-left-color: var(--accent-2);
}
#card-nacionalidad {
  border-left-color: #a78bfa;
}
#card-posicion {
  border-left-color: var(--accent);
}
.flow-step.card--done {
  box-shadow: 0 0 0 1px var(--accent-soft);
}
.flow-step__header {
  margin: 0;
  font-size: 1.05rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.flow-step__title {
  flex-shrink: 0;
}
.flow-step__summary {
  margin-left: auto;
  font-size: 0.78rem;
  font-weight: 600;
  color: var(--text-dim);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: none;
}
.flow-step__chev {
  display: none;
  flex-shrink: 0;
  color: var(--text-dim);
  font-size: 0.9rem;
  transition: transform 0.2s ease;
}

.step {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 0.85rem;
  font-weight: 700;
  border: 1px solid var(--card-border);
  color: var(--text-dim);
  flex-shrink: 0;
  transition: all 0.2s ease;
}
.step--done {
  background: var(--accent);
  border-color: var(--accent);
  color: #1a1300;
}

.flow-row {
  display: flex;
  gap: 1rem;
}
@media (max-width: 480px) {
  .flow-row {
    flex-direction: column;
  }
}

/* FIELDS */
.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.field--grow {
  flex: 1;
}
/* .field__label es global (ver base.css) */
.field input[type='text'] {
  background: var(--bg-soft);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 0.65rem 0.8rem;
  color: var(--text);
  font-size: 0.95rem;
  outline: none;
  transition: border-color 0.2s ease;
  width: 100%;
}
.field input:focus {
  border-color: var(--accent-2);
}

.age-picker {
  display: flex;
  gap: 0.5rem;
}
.age-card {
  flex: 1;
  background: var(--bg-soft);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 0.65rem 0;
  text-align: center;
  font-weight: 700;
  font-size: 0.95rem;
  color: var(--text-dim);
  cursor: pointer;
  transition: all 0.15s ease;
}
.age-card:hover {
  border-color: var(--accent-2);
  color: var(--accent-2);
}
.age-card--active {
  background: var(--accent);
  border-color: var(--accent);
  color: #1a1300;
}

.toggle {
  display: flex;
  background: var(--bg-soft);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 0.25rem;
  gap: 0.25rem;
}
.toggle__btn {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-dim);
  padding: 0.5rem 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.85rem;
  transition: all 0.15s ease;
}
.toggle__btn--active {
  background: var(--accent);
  color: #1a1300;
}

/* SEARCH */
.search {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: var(--bg-soft);
  border: 1px solid var(--card-border);
  border-radius: 10px;
  padding: 0.6rem 0.8rem;
}
.search__icon {
  font-size: 0.9rem;
  opacity: 0.7;
}
.search input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text);
  font-size: 0.9rem;
}

/* COUNTRY GRID (chips) */
.country-grid {
  display: flex;
  flex-wrap: nowrap;
  gap: 0.5rem;
  overflow-x: auto;
  padding-bottom: 0.35rem;
  min-width: 0;
}
.country-grid::-webkit-scrollbar {
  height: 6px;
}
.country-grid::-webkit-scrollbar-thumb {
  background: var(--card-border);
  border-radius: 3px;
}

.country-chip {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.5rem 0.85rem;
  border-radius: 999px;
  cursor: pointer;
  border: 1px solid var(--card-border);
  background: var(--bg-soft);
  transition: all 0.15s ease;
  font-size: 0.85rem;
  flex-shrink: 0;
  white-space: nowrap;
}
.country-chip:hover {
  border-color: var(--accent-2);
}
.country-chip--active {
  background: var(--accent-soft);
  border-color: var(--accent);
  color: var(--accent);
  font-weight: 700;
}
.country-chip__flag {
  font-size: 1.05rem;
}
.country-chip__empty {
  color: var(--text-dim);
  padding: 1rem;
  text-align: center;
  font-size: 0.85rem;
  width: 100%;
}

/* PITCH */
.pitch {
  position: relative;
  background:
    repeating-linear-gradient(180deg, rgba(255, 255, 255, 0.028) 0 34px, rgba(255, 255, 255, 0) 34px 68px),
    radial-gradient(ellipse at 50% 45%, #223a63 0%, var(--pitch) 55%, #101a33 100%);
  border: 1px solid var(--pitch-line);
  border-radius: 14px;
  padding: 1.15rem 1rem;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.7rem;
  overflow: hidden;
  box-shadow: inset 0 0 30px -6px #000a;
}

.pitch__corner {
  position: absolute;
  width: 16px;
  height: 16px;
  border: 1px solid var(--pitch-line);
  opacity: 0.75;
  pointer-events: none;
}
.pitch__corner--tl {
  top: 0.55rem;
  left: 0.55rem;
  border-right: none;
  border-bottom: none;
  border-top-left-radius: 100%;
}
.pitch__corner--tr {
  top: 0.55rem;
  right: 0.55rem;
  border-left: none;
  border-bottom: none;
  border-top-right-radius: 100%;
}
.pitch__corner--bl {
  bottom: 0.55rem;
  left: 0.55rem;
  border-right: none;
  border-top: none;
  border-bottom-left-radius: 100%;
}
.pitch__corner--br {
  bottom: 0.55rem;
  right: 0.55rem;
  border-left: none;
  border-top: none;
  border-bottom-right-radius: 100%;
}

.pitch__box {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  border: 1px solid var(--pitch-line);
  opacity: 0.8;
  pointer-events: none;
}
.pitch__box--top {
  top: 0;
  width: 66%;
  height: 16%;
  border-top: none;
  border-radius: 0 0 6px 6px;
}
.pitch__box--top-small {
  top: 0;
  width: 34%;
  height: 7%;
  border-top: none;
  border-radius: 0 0 4px 4px;
}
.pitch__box--bottom {
  bottom: 0;
  width: 66%;
  height: 16%;
  border-bottom: none;
  border-radius: 6px 6px 0 0;
}
.pitch__box--bottom-small {
  bottom: 0;
  width: 34%;
  height: 7%;
  border-bottom: none;
  border-radius: 4px 4px 0 0;
}

.pitch__line--mid {
  position: absolute;
  left: 0.85rem;
  right: 0.85rem;
  top: 50%;
  height: 1px;
  background: var(--pitch-line);
  opacity: 0.85;
  pointer-events: none;
}
.pitch__circle {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 78px;
  height: 78px;
  border: 1px solid var(--pitch-line);
  border-radius: 50%;
  opacity: 0.85;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
.pitch__spot {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--pitch-line);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.pitch__row {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
}
.pitch__row--single {
  justify-content: center;
}

.pos-btn {
  position: relative;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(10, 14, 28, 0.6);
  border: 1.5px solid var(--pitch-line);
  color: var(--text);
  border-radius: 50%;
  font-weight: 800;
  font-size: 0.66rem;
  letter-spacing: 0.01em;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    box-shadow 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease,
    background 0.15s ease;
  backdrop-filter: blur(2px);
}
.pos-btn:hover {
  border-color: var(--accent-2);
  color: var(--accent-2);
  transform: translateY(-2px);
  box-shadow: 0 6px 14px -6px var(--accent-2);
}
.pos-btn--active {
  background: var(--accent);
  border-color: var(--accent);
  color: #1a1300;
  transform: translateY(-2px) scale(1.08);
  box-shadow:
    0 0 0 4px var(--accent-soft),
    0 10px 20px -8px #000c;
}
.pos-btn--gk {
  width: 50px;
  height: 50px;
  font-size: 0.7rem;
}

.pitch__hint {
  margin: 0;
  text-align: center;
  font-size: 0.82rem;
  color: var(--text-dim);
}

/* ============ ACORDEÓN DE PASOS (solo en móvil) ============ */
@media (max-width: 900px) {
  .flow-step__header {
    cursor: pointer;
  }
  .flow-step__summary {
    display: inline;
  }
  .flow-step__chev {
    display: inline-block;
  }
  .flow-step--collapsed .flow-step__chev {
    transform: rotate(-90deg);
  }
  .flow-step--collapsed .flow-step__body {
    display: none;
  }
}

/* CTA */
.cta {
  background: linear-gradient(90deg, var(--accent), #ffd166);
  color: #1a1300;
  border: none;
  padding: 0.85rem 1.75rem;
  border-radius: 10px;
  font-weight: 800;
  font-size: 0.95rem;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    opacity 0.15s ease;
  width: 100%;
}
.cta:disabled {
  background: var(--bg-soft);
  color: var(--text-dim);
  cursor: not-allowed;
}
.cta:not(:disabled):hover {
  transform: translateY(-2px);
}

/* ============ MÓVIL: menos carga visual ============ */
@media (max-width: 640px) {
  .topbar {
    padding: 1rem 1.25rem;
    gap: 0.75rem;
  }
  .brand__logo {
    height: 2.5rem;
  }
  .brand__tagline {
    font-size: 0.78rem;
  }

  .creator {
    padding: 1.1rem;
  }
  .creator__intro {
    margin-bottom: 1.25rem;
  }
  .creator__intro h1 {
    font-size: 1.4rem;
  }
  .creator__intro p {
    font-size: 0.88rem;
  }

  .player-card {
    padding: 1.15rem 1rem 1.35rem;
    box-shadow: none;
  }
  .player-card::before {
    opacity: 0.5;
  }
  .player-card__ribbon {
    display: none;
  }

  .flow-step {
    padding: 1.15rem;
    gap: 0.9rem;
  }
  .flow-step.card--done {
    box-shadow: none;
  }
}
</style>
