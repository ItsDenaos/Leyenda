import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import TimelineList from '../TimelineList.vue'
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

describe('TimelineList', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('muestra las temporadas cerradas en orden inverso (la más reciente primero)', () => {
    const career = useCareerStore()
    career.iniciarCarrera(jugadorDePrueba())
    const t1 = { ...career.temporadaActual! }
    const t2 = { ...career.temporadaActual!, numero: 2 }
    career.temporadasFinalizadas = [t1 as Temporada, t2 as Temporada]

    const wrapper = mount(TimelineList)
    const seasons = wrapper.findAll('.timeline-item__season')
    expect(seasons[0]!.text()).toContain('Temporada 2')
    expect(seasons[1]!.text()).toContain('Temporada 1')
  })

  it('sin trofeos, muestra "Sin trofeos" y la fila no es togglable', () => {
    const career = useCareerStore()
    career.iniciarCarrera(jugadorDePrueba())
    career.temporadasFinalizadas = [{ ...career.temporadaActual!, trofeos: [] } as Temporada]

    const wrapper = mount(TimelineList)
    expect(wrapper.text()).toContain('Sin trofeos')
    expect(wrapper.find('.timeline-item--con-trofeos').exists()).toBe(false)
  })

  it('con trofeos, tocar la tarjeta alterna timeline-item--expandida', async () => {
    const career = useCareerStore()
    career.iniciarCarrera(jugadorDePrueba())
    career.temporadasFinalizadas = [
      { ...career.temporadaActual!, trofeos: [{ nombre: 'Liga', imagen: null }] } as Temporada,
    ]

    const wrapper = mount(TimelineList)
    const fila = wrapper.find('.timeline-item')
    expect(fila.classes()).toContain('timeline-item--con-trofeos')
    expect(fila.classes()).not.toContain('timeline-item--expandida')

    await fila.trigger('click')
    expect(fila.classes()).toContain('timeline-item--expandida')

    await fila.trigger('click')
    expect(fila.classes()).not.toContain('timeline-item--expandida')
  })

  it('muestra la línea de selección solo cuando esa temporada tuvo partidos con la selección', () => {
    const career = useCareerStore()
    career.iniciarCarrera(jugadorDePrueba())
    const seleccion = GameDatabase.selecciones.find((s) => s.pais === 'Argentina')!
    career.temporadasFinalizadas = [
      { ...career.temporadaActual!, seleccion, seleccionPartidos: 2, seleccionGoles: 1 } as Temporada,
    ]

    const wrapper = mount(TimelineList)
    expect(wrapper.text()).toContain('2 PJ · 1 G')
  })
})
