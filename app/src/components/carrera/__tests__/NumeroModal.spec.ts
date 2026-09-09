import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import NumeroModal from '../NumeroModal.vue'
import { useCareerStore } from '../../../stores/career'
import { GameDatabase } from '../../../data/database'
import type { Player } from '../../../game/career-types'

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

describe('NumeroModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('oculto por default (atributo hidden presente)', () => {
    const wrapper = mount(NumeroModal, { props: { mostrar: false } })
    expect(wrapper.find('.modal-overlay').attributes('hidden')).toBeDefined()
  })

  it('al mostrarse, precarga el número actual del jugador', async () => {
    const career = useCareerStore()
    career.iniciarCarrera(jugadorDePrueba({ numero: 23 }))

    const wrapper = mount(NumeroModal, { props: { mostrar: false } })
    await wrapper.setProps({ mostrar: true })

    expect(wrapper.find('.modal-overlay').attributes('hidden')).toBeUndefined()
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('23')
  })

  it('"Ahora no" emite cerrar sin tocar el store', async () => {
    const career = useCareerStore()
    career.iniciarCarrera(jugadorDePrueba({ numero: 23 }))
    career.puedeSolicitarNumero = true
    career.contextoSolicitudNumero = { ovr: 60, rendimiento: 0 }

    const wrapper = mount(NumeroModal, { props: { mostrar: true } })
    await wrapper.findAll('button')[0]!.trigger('click')

    expect(wrapper.emitted('cerrar')).toBeTruthy()
    expect(career.puedeSolicitarNumero).toBe(true)
    expect(career.player!.numero).toBe(23)
  })

  it('"Solicitar" llama a confirmarCambioNumero con el número elegido y emite cerrar', async () => {
    const career = useCareerStore()
    career.iniciarCarrera(jugadorDePrueba({ numero: 23 }))
    career.puedeSolicitarNumero = true
    career.contextoSolicitudNumero = { ovr: 90, rendimiento: 5 } // OVR/rendimiento altos: casi seguro aceptado
    vi.spyOn(Math, 'random').mockReturnValue(0)

    const wrapper = mount(NumeroModal, { props: { mostrar: true } })
    await wrapper.find('input').setValue(7)
    await wrapper.findAll('button')[1]!.trigger('click')

    expect(wrapper.emitted('cerrar')).toBeTruthy()
    expect(career.player!.numero).toBe(7)
    expect(career.puedeSolicitarNumero).toBe(false)

    vi.restoreAllMocks()
  })
})
