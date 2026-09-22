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
    document.documentElement.className = ''
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
    expect(document.documentElement.classList.contains('html--career')).toBe(true)
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

  it('remide --vh-real al cambiar de pausa (cierre de temporada, nueva ventana, etc.), no solo al montar', async () => {
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

    mount(CarreraView)
    await nextTick()

    const setProperty = vi.spyOn(document.documentElement.style, 'setProperty')
    // Ver actualizarAlturaViewport (CarreraView.vue): remide en cada cambio
    // de pausa porque ahí es donde el layout se reordena de golpe — sin
    // este watcher, --vh-real solo se mide al montar la vista.
    career.temporadaActual!.checkpointIndex++
    await nextTick()
    await nextTick()

    expect(setProperty).toHaveBeenCalledWith('--vh-real', expect.any(String))
  })

  it('"Abandonar esta carrera" pide confirmación y, tras confirmar, borra la carrera y navega a /', async () => {
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
    await nextTick()

    expect(wrapper.text()).not.toContain('Perdés todo el progreso')
    await wrapper.find('.abandonar__link').trigger('click')
    expect(wrapper.text()).toContain('Perdés todo el progreso')
    expect(push).not.toHaveBeenCalled()

    await wrapper.find('.abandonar__confirmar').trigger('click')

    expect(push).toHaveBeenCalledWith('/')
    expect(career.carreraIniciada).toBe(false)
    expect(career.hayCarreraGuardada()).toBe(false)
  })

  it('"Cancelar" en la confirmación de abandono no borra nada', async () => {
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
    await nextTick()

    await wrapper.find('.abandonar__link').trigger('click')
    await wrapper.find('.abandonar__cancelar').trigger('click')

    expect(wrapper.text()).not.toContain('Perdés todo el progreso')
    expect(push).not.toHaveBeenCalled()
    expect(career.carreraIniciada).toBe(true)
  })
})
