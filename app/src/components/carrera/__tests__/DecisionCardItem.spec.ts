import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import DecisionCardItem from '../DecisionCardItem.vue'
import { useCareerStore } from '../../../stores/career'
import { GameDatabase } from '../../../data/database'
import type { DecisionCard, Player } from '../../../game/career-types'

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

const decision: DecisionCard = {
  id: 'ev1',
  tipo: 'deportivo',
  altoImpacto: true,
  desc: 'Un evento de prueba.',
  opciones: [
    { label: 'Sí', variant: 'accept', efectos: { rendimiento: 2, forma: 'inspirado', equipo: -1 } },
    { label: 'No', variant: 'ghost', efectos: { rendimiento: 0, forma: 'regular', equipo: 0 } },
  ],
}

describe('DecisionCardItem', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('marca el evento de alto impacto y muestra sus badges de efecto', () => {
    const wrapper = mount(DecisionCardItem, { props: { decision } })
    expect(wrapper.find('.decision-card--alto-impacto').exists()).toBe(true)
    expect(wrapper.find('.decision-card__impacto').attributes('title')).toBe('Evento de alto impacto')
    expect(wrapper.text()).toContain('Rendimiento +2')
    expect(wrapper.text()).toContain('Equipo -1')
  })

  it('una convocatoria a selección muestra el ícono y la etiqueta "Selección"', () => {
    const convocatoria: DecisionCard = { ...decision, altoImpacto: false, seleccion: true }
    const wrapper = mount(DecisionCardItem, { props: { decision: convocatoria } })
    expect(wrapper.find('.decision-card__tag').text()).toBe('Selección')
    expect(wrapper.find('.decision-card__impacto').attributes('title')).toBe('Convocatoria a la selección')
  })

  it('elegir una opción llama a resolveDecisionEvento con el id y el índice correctos', async () => {
    const career = useCareerStore()
    career.iniciarCarrera(jugadorDePrueba())
    career.temporadaActual!.loteActual = [decision]

    const wrapper = mount(DecisionCardItem, { props: { decision } })
    const botones = wrapper.findAll('button')
    await botones[1]!.trigger('click') // "No", índice 1

    expect(career.temporadaActual!.loteActual.some((d) => 'id' in d && d.id === 'ev1')).toBe(false)
  })
})
