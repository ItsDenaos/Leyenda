import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import PersonajeView from '../PersonajeView.vue'

const push = vi.fn<(path: string) => void>()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
}))

describe('PersonajeView', () => {
  beforeEach(() => {
    localStorage.clear()
    push.mockClear()
  })

  it('arranca con el paso 1 abierto y el CTA deshabilitado', () => {
    const wrapper = mount(PersonajeView)
    expect(wrapper.find('.cta').attributes('disabled')).toBeDefined()
    expect(wrapper.find('#card-identidad').classes()).not.toContain('flow-step--collapsed')
  })

  it('no avanza el acordeón mientras se tipea el apellido, solo al perder el foco', async () => {
    const wrapper = mount(PersonajeView)
    const input = wrapper.find('input[type="text"]')
    await input.setValue('PEREZ')
    // Escribir no debe cerrar el paso 1, aunque ya sea válido (edad y número
    // ya traen un valor por defecto) — evita saltar de paso a mitad de palabra.
    expect(wrapper.find('#card-identidad').classes()).not.toContain('flow-step--collapsed')

    await input.trigger('blur')
    // Recién en blur se evalúa si corresponde avanzar; con el apellido cargado
    // el paso 1 ya es válido, así que ahora sí se colapsa y pasa al paso 2.
    expect(wrapper.find('#card-identidad').classes()).toContain('flow-step--collapsed')
    expect(wrapper.find('#card-nacionalidad').classes()).not.toContain('flow-step--collapsed')
  })

  it('completa los 3 pasos y habilita "Comenzar carrera"', async () => {
    const wrapper = mount(PersonajeView)

    await wrapper.find('input[type="text"]').setValue('PEREZ')
    await wrapper.find('input[type="text"]').trigger('blur')

    await wrapper.findAll('.country-chip')[0]!.trigger('click')
    await wrapper.findAll('.pos-btn')[0]!.trigger('click')

    expect(wrapper.find('.cta').attributes('disabled')).toBeUndefined()
  })

  it('al confirmar, guarda el borrador en localStorage y navega a /equipo', async () => {
    vi.useFakeTimers()
    const wrapper = mount(PersonajeView)

    await wrapper.find('input[type="text"]').setValue('GOMEZ')
    await wrapper.findAll('.country-chip')[2]!.trigger('click')
    await wrapper.findAll('.pos-btn')[3]!.trigger('click')

    await wrapper.find('.cta').trigger('click')

    const draft = JSON.parse(localStorage.getItem('leyendaPlayerDraft')!)
    expect(draft.apellido).toBe('GOMEZ')

    vi.runAllTimers()
    expect(push).toHaveBeenCalledWith('/equipo')
    vi.useRealTimers()
  })
})
