import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import OfertaCardItem from '../OfertaCardItem.vue'
import { useCareerStore } from '../../../stores/career'
import { GameDatabase } from '../../../data/database'
import type { OfertaItem, Player } from '../../../game/career-types'

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

describe('OfertaCardItem', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('oferta de club: muestra "Oferta" / "Aceptar oferta" y el valor ofrecido', () => {
    const equipo = GameDatabase.equipos[1]!
    const liga = GameDatabase.ligas.find((l) => l.id === equipo.ligaId)!
    const oferta: OfertaItem = { id: 'o1', tipoOferta: 'club', equipo, liga, valorOfrecido: 250000, desc: 'test' }

    const wrapper = mount(OfertaCardItem, { props: { oferta } })
    expect(wrapper.find('.decision-card__tag').text()).toBe('Oferta')
    expect(wrapper.find('button.btn').text()).toBe('Aceptar oferta')
    expect(wrapper.text()).toContain('€250K')
  })

  it('quedarme: muestra "Tu club" / "Quedarme"', () => {
    const equipo = GameDatabase.equipos[0]!
    const liga = GameDatabase.ligas.find((l) => l.id === equipo.ligaId)!
    const oferta: OfertaItem = { id: 'o2', tipoOferta: 'quedarme', equipo, liga, desc: 'Seguir acá.' }

    const wrapper = mount(OfertaCardItem, { props: { oferta } })
    expect(wrapper.find('.decision-card__tag').text()).toBe('Tu club')
    expect(wrapper.find('button.btn').text()).toBe('Quedarme')
    expect(wrapper.find('.decision-card--quedarme').exists()).toBe(true)
  })

  it('retiro voluntario: muestra "Retiro" / "Retirarme"', () => {
    const equipo = GameDatabase.equipos[0]!
    const liga = GameDatabase.ligas.find((l) => l.id === equipo.ligaId)!
    const oferta: OfertaItem = { id: 'o3', tipoOferta: 'retiro', equipo, liga, desc: 'Colgar los botines.' }

    const wrapper = mount(OfertaCardItem, { props: { oferta } })
    expect(wrapper.find('.decision-card__tag').text()).toBe('Retiro')
    expect(wrapper.find('.decision-card--retiro-forzoso').exists()).toBe(false)
  })

  it('retiro forzoso: muestra "Fin de carrera" y el modificador --retiro-forzoso', () => {
    const equipo = GameDatabase.equipos[0]!
    const liga = GameDatabase.ligas.find((l) => l.id === equipo.ligaId)!
    const oferta: OfertaItem = { id: 'o4', tipoOferta: 'retiro', forzoso: true, equipo, liga, desc: 'Te retirás.' }

    const wrapper = mount(OfertaCardItem, { props: { oferta } })
    expect(wrapper.find('.decision-card__tag').text()).toBe('Fin de carrera')
    expect(wrapper.find('.decision-card--retiro-forzoso').exists()).toBe(true)
  })

  it('al hacer clic, llama a resolveOferta del store con el item', async () => {
    const career = useCareerStore()
    career.iniciarCarrera(jugadorDePrueba())
    const checkpointAntes = career.temporadaActual!.checkpointIndex
    const equipo = GameDatabase.equipos[0]!
    const liga = GameDatabase.ligas.find((l) => l.id === equipo.ligaId)!
    const oferta: OfertaItem = { id: 'o5', tipoOferta: 'quedarme', equipo, liga, desc: 'test' }

    const wrapper = mount(OfertaCardItem, { props: { oferta } })
    await wrapper.find('button.btn').trigger('click')

    // resolveOferta("quedarme") vacía el lote y avanza el checkpoint — que
    // a su vez ya generó el lote de la pausa siguiente (ver iniciarCheckpoint
    // en career.ts), así que lo observable es que se avanzó de checkpoint,
    // no que el lote haya quedado vacío.
    expect(career.temporadaActual!.checkpointIndex).not.toBe(checkpointAntes)
    expect(career.temporadaActual!.loteActual.some((d) => 'id' in d && d.id === 'o5')).toBe(false)
  })
})
