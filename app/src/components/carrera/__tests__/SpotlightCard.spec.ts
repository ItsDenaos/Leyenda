import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import SpotlightCard from '../SpotlightCard.vue'
import { useCareerStore } from '../../../stores/career'
import { GameDatabase } from '../../../data/database'
import type { Player, Temporada } from '../../../game/career-types'

function jugadorDePrueba(overrides: Partial<Player> = {}): Player {
  const equipo = GameDatabase.equipos[0]!
  return {
    apellido: 'PEREZ',
    numero: 10,
    pierna: 'derecha',
    edad: 17,
    pais: 'Argentina',
    flag: '🇦🇷',
    paisCode: 'ar',
    posicion: 'DC',
    equipoId: equipo.id,
    ovrInicial: 58,
    ...overrides,
  }
}

describe('SpotlightCard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('muestra el progreso, las stats y la forma de la temporada en curso', () => {
    const career = useCareerStore()
    career.iniciarCarrera(jugadorDePrueba())
    career.temporadaActual!.progreso = 42
    career.temporadaActual!.partidos = 5
    career.temporadaActual!.goles = 3

    const wrapper = mount(SpotlightCard)

    expect(wrapper.text()).toContain('42%')
    expect(wrapper.text()).toContain('Temporada 1')
    expect(wrapper.findAll('.progress-ring__value')[0]!.text()).toBe('42%')
  })

  it('no muestra trofeos cuando la temporada todavía no ganó ninguno', () => {
    const career = useCareerStore()
    career.iniciarCarrera(jugadorDePrueba())

    const wrapper = mount(SpotlightCard)
    expect(wrapper.find('.trophies').exists()).toBe(false)
  })

  it('muestra los trofeos ganados en la temporada', () => {
    const career = useCareerStore()
    career.iniciarCarrera(jugadorDePrueba())
    career.temporadaActual!.trofeos = [{ nombre: 'Liga', imagen: null }]

    const wrapper = mount(SpotlightCard)
    expect(wrapper.text()).toContain('Liga')
    expect(wrapper.findAll('.trophy-card__icon').length).toBeGreaterThan(0)
  })

  it('muestra la línea de selección solo cuando jugó partidos con la selección', () => {
    const career = useCareerStore()
    career.iniciarCarrera(jugadorDePrueba())

    let wrapper = mount(SpotlightCard)
    expect(wrapper.text()).not.toContain('Selección:')

    const seleccion = GameDatabase.selecciones.find((s) => s.pais === 'Argentina')!
    career.temporadaActual!.seleccion = seleccion
    career.temporadaActual!.seleccionPartidos = 3
    career.temporadaActual!.seleccionGoles = 1

    wrapper = mount(SpotlightCard)
    expect(wrapper.text()).toContain('Selección: 3 PJ · 1 G')
  })

  it('marca la tarjeta como lesionado cuando hay una lesión activa', () => {
    const career = useCareerStore()
    career.iniciarCarrera(jugadorDePrueba())
    // iniciarCheckpoint() puede generar una lesión al azar justo al arrancar
    // la carrera — se fuerza a null para que el estado "sin lesión" inicial
    // sea determinístico en este test.
    career.temporadaActual!.lesionActiva = null

    let wrapper = mount(SpotlightCard)
    expect(wrapper.find('.spotlight-card--lesionado').exists()).toBe(false)

    career.temporadaActual!.lesionActiva = {
      nivel: 'nivel1',
      nombre: 'Rotura de ligamentos',
      descripcion: 'test',
      tramosRestantes: 2,
      ovrPerdido: 3,
      bloqueaForma: true,
    }

    wrapper = mount(SpotlightCard)
    expect(wrapper.find('.spotlight-card--lesionado').exists()).toBe(true)
    expect(wrapper.find('.spotlight-mobile--lesionado').exists()).toBe(true)
  })

  it('al arrancar una temporada nueva, la barra móvil salta a 0% sin animar (no queda "retrocediendo")', async () => {
    const career = useCareerStore()
    career.iniciarCarrera(jugadorDePrueba())
    career.temporadaActual!.progreso = 60

    const wrapper = mount(SpotlightCard)
    const barFillEl = () => wrapper.find('.spotlight-mobile__bar-fill').element as HTMLElement
    expect(barFillEl().style.transition).toBe('')

    // Temporada nueva: no es un tramo más de la misma, es un objeto de
    // temporada distinto arrancando en blanco (ver finalizarTemporada en career.ts).
    career.temporadaActual = { ...career.temporadaActual!, numero: 2, progreso: 0 } as Temporada
    await nextTick()
    expect(barFillEl().style.transition).toBe('none')
    expect(barFillEl().style.width).toBe('0%')

    // Deja correr el resto del watcher (nextTick interno + reflow) hasta
    // que reactiva la transición para los próximos tramos.
    await nextTick()
    await nextTick()
    await nextTick()
    expect(barFillEl().style.transition).toBe('')
  })
})
