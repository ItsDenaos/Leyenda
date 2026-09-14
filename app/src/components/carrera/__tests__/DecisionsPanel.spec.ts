import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import DecisionsPanel from '../DecisionsPanel.vue'
import { useCareerStore } from '../../../stores/career'
import { GameDatabase } from '../../../data/database'
import type { Player, DecisionCard, OfertaItem, InformeLesion } from '../../../game/career-types'

const push = vi.fn<(path: string) => void>()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

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

const decisionDePrueba = (id: string): DecisionCard => ({
  id,
  tipo: 'personal',
  altoImpacto: false,
  desc: 'Una decisión de prueba.',
  opciones: [
    { label: 'Opción A', variant: 'accept', efectos: { rendimiento: 1, forma: 'animado', equipo: 0 } },
    { label: 'Opción B', variant: 'ghost', efectos: { rendimiento: -1, forma: 'bajo', equipo: 1 } },
  ],
})

describe('DecisionsPanel', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    push.mockClear()
  })

  function iniciar() {
    const career = useCareerStore()
    career.iniciarCarrera(jugadorDePrueba())
    return career
  }

  it('con eventos pendientes, muestra "Decisiones" y el conteo correcto', () => {
    const career = iniciar()
    career.temporadaActual!.loteActual = [decisionDePrueba('a'), decisionDePrueba('b')]

    const wrapper = mount(DecisionsPanel)
    expect(wrapper.find('h2').text()).toBe('Decisiones')
    expect(wrapper.find('.decisions__count').text()).toBe('2 pendientes')
    expect(wrapper.findAll('.decision-card').length).toBe(2)
  })

  it('en una pausa de ofertas, muestra "Ofertas de equipos"', () => {
    const career = iniciar()
    career.temporadaActual!.calendario[career.temporadaActual!.checkpointIndex]!.tipo = 'oferta'
    const equipo = GameDatabase.equipos[1]!
    const liga = GameDatabase.ligas.find((l) => l.id === equipo.ligaId)!
    const oferta: OfertaItem = { id: 'o1', tipoOferta: 'club', equipo, liga, valorOfrecido: 100000, desc: 'test' }
    career.temporadaActual!.loteActual = [oferta]

    const wrapper = mount(DecisionsPanel)
    expect(wrapper.find('h2').text()).toBe('Ofertas de equipos')
    expect(wrapper.find('.decisions__count').text()).toBe('Elige una opción')
    expect(wrapper.find('.decision-card--oferta-club').exists()).toBe(true)
  })

  it('con un informe de lesión, muestra "Parte médico"', () => {
    const career = iniciar()
    const lesion: InformeLesion = {
      esInformeLesion: true,
      nivel: 'nivel2',
      nombre: 'Esguince de tobillo',
      descripcion: 'test',
      tramosRestantes: 2,
      ovrPerdido: 2,
      bloqueaForma: true,
    }
    career.temporadaActual!.loteActual = [lesion]

    const wrapper = mount(DecisionsPanel)
    expect(wrapper.find('h2').text()).toBe('Parte médico')
    expect(wrapper.find('.decisions__count').text()).toBe('Estás lesionado')
    expect(wrapper.find('.decision-card--lesion-informe').exists()).toBe(true)
  })

  it('con el lote vacío, muestra "Resuelto" y el mensaje de vacío', () => {
    const career = iniciar()
    career.temporadaActual!.loteActual = []

    const wrapper = mount(DecisionsPanel)
    expect(wrapper.find('.decisions__count').text()).toBe('Resuelto')
    expect(wrapper.find('.decisions__empty').exists()).toBe(true)
  })

  it('elegir una opción de decisión llama a resolveDecisionEvento del store', async () => {
    const career = iniciar()
    career.temporadaActual!.loteActual = [decisionDePrueba('a')]

    const wrapper = mount(DecisionsPanel)
    await wrapper.find('.decision-card button.btn').trigger('click')

    // resolveDecisionEvento sacó la decisión del lote (y, al quedar vacío,
    // el store avanza solo el tramo — ver career.ts).
    expect(career.temporadaActual!.loteActual.some((d) => 'id' in d && d.id === 'a')).toBe(false)
  })

  it('con la carrera finalizada, muestra "Carrera finalizada" y las acciones de retiro', () => {
    const career = iniciar()
    career.finalizarCarrera()

    const wrapper = mount(DecisionsPanel)
    expect(wrapper.find('h2').text()).toBe('Carrera finalizada')
    expect(wrapper.find('.decisions__count').text()).toBe('Retirado')
    expect(wrapper.find('.retiro').exists()).toBe(true)
    expect(wrapper.text()).toContain('PEREZ')
  })

  it('"Ver resumen de mi carrera" emite ver-resumen', async () => {
    const career = iniciar()
    career.finalizarCarrera()

    const wrapper = mount(DecisionsPanel)
    await wrapper.find('.retiro__actions .btn--ghost').trigger('click')
    expect(wrapper.emitted('ver-resumen')).toBeTruthy()
  })

  it('"Aceptar" navega a /', async () => {
    const career = iniciar()
    career.finalizarCarrera()

    const wrapper = mount(DecisionsPanel)
    const botones = wrapper.findAll('.retiro__actions .btn')
    await botones[botones.length - 1]!.trigger('click')
    expect(push).toHaveBeenCalledWith('/')
  })
})
