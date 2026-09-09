import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { setActivePinia, createPinia } from 'pinia'
import CarreraView from '../CarreraView.vue'
import { useCareerStore } from '../../stores/career'
import { GameDatabase } from '../../data/database'

const push = vi.fn<(path: string) => void>()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

describe('CarreraView', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    push.mockClear()
    document.body.className = ''
  })

  it('redirige a / cuando no hay carrera activa ni guardada', () => {
    mount(CarreraView)
    expect(push).toHaveBeenCalledWith('/')
    expect(document.body.classList.contains('body--career')).toBe(false)
  })

  it('con una carrera activa, muestra el hero y agrega la clase body--career', () => {
    const career = useCareerStore()
    const equipo = GameDatabase.equipos[0]!
    career.iniciarCarrera({
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
    })

    const wrapper = mount(CarreraView)

    expect(push).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('PEREZ')
    expect(document.body.classList.contains('body--career')).toBe(true)
  })

  it('con una carrera guardada en localStorage (sin estado en memoria), la carga y la muestra', async () => {
    const bootstrap = useCareerStore()
    const equipo = GameDatabase.equipos[0]!
    bootstrap.iniciarCarrera({
      apellido: 'GOMEZ',
      numero: 7,
      pierna: 'izquierda',
      edad: 18,
      pais: 'Brasil',
      flag: '🇧🇷',
      paisCode: 'br',
      posicion: 'ED',
      equipoId: equipo.id,
      ovrInicial: 60,
    })

    // Simula una recarga de página: un store nuevo, sin nada en memoria.
    setActivePinia(createPinia())
    const wrapper = mount(CarreraView)
    await nextTick()

    expect(push).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('GOMEZ')
  })
})
