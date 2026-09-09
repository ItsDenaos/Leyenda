import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import ResumenModal from '../ResumenModal.vue'
import { useCareerStore } from '../../../stores/career'
import { GameDatabase } from '../../../data/database'
import type { Player, DecisionCard } from '../../../game/career-types'

// jsdom no implementa un contexto 2D de canvas real — se mockea la
// generación de la tarjeta para poder probar el cableado del botón
// "Copiar como imagen" (estado disabled/⏳, mensaje según el resultado)
// sin depender de Canvas. El dibujo en sí (resumen-canvas.ts) se verificó
// visualmente en el navegador, no acá.
vi.mock('@/game/resumen-canvas', () => ({
  generarTarjetaResumenCanvas: vi.fn<() => Promise<HTMLCanvasElement>>(async () => {
    const canvas = document.createElement('canvas')
    canvas.toBlob = (cb: (b: Blob | null) => void) => cb(new Blob(['x'], { type: 'image/png' }))
    canvas.toDataURL = () => 'data:image/png;base64,xx'
    return canvas
  }),
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

function correrCarreraCompleta(store: ReturnType<typeof useCareerStore>, maxIters = 3000) {
  let iters = 0
  while (!store.carreraFinalizada && iters < maxIters) {
    iters++
    const t = store.temporadaActual
    if (!t) break
    const lote = t.loteActual
    if (lote.length === 0) break
    const primero = lote[0]!
    if ('esInformeLesion' in primero && primero.esInformeLesion) {
      store.simularTramoYAvanzar()
    } else if ('tipoOferta' in primero) {
      store.resolveOferta(primero)
    } else {
      store.resolveDecisionEvento((primero as DecisionCard).id, 0)
    }
  }
}

describe('ResumenModal', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('oculto por default (atributo hidden presente)', () => {
    const wrapper = mount(ResumenModal, { props: { mostrar: false } })
    expect(wrapper.find('.modal-overlay').attributes('hidden')).toBeDefined()
  })

  it('con una carrera terminada, muestra apellido, stats y clubes', () => {
    const career = useCareerStore()
    career.iniciarCarrera(jugadorDePrueba())
    correrCarreraCompleta(career)
    expect(career.carreraFinalizada).toBe(true)

    const wrapper = mount(ResumenModal, { props: { mostrar: true } })
    expect(wrapper.find('.modal-overlay').attributes('hidden')).toBeUndefined()
    expect(wrapper.find('.resumen__name').text()).toBe('PEREZ')
    expect(wrapper.findAll('.stat').length).toBe(6)
    expect(wrapper.find('.resumen__club').exists()).toBe(true)
  })

  it('sin trofeos, muestra el mensaje vacío en vez de la lista', () => {
    const career = useCareerStore()
    career.iniciarCarrera(jugadorDePrueba())
    correrCarreraCompleta(career)
    // Fuerza el caso "sin trofeos" independientemente de cómo haya salido la simulación.
    career.temporadasFinalizadas.forEach((t) => (t.trofeos = []))

    const wrapper = mount(ResumenModal, { props: { mostrar: true } })
    expect(wrapper.find('.resumen__empty').exists()).toBe(true)
    expect(wrapper.find('.trophy-card').exists()).toBe(false)
  })

  it('agrupa trofeos repetidos con un contador ×N', () => {
    const career = useCareerStore()
    career.iniciarCarrera(jugadorDePrueba())
    correrCarreraCompleta(career, 50) // no hace falta terminarla para este chequeo
    career.temporadasFinalizadas = [
      { ...career.temporadaActual!, numero: 1, trofeos: [{ nombre: 'Liga', imagen: null }] },
      { ...career.temporadaActual!, numero: 2, trofeos: [{ nombre: 'Liga', imagen: null }] },
    ] as typeof career.temporadasFinalizadas
    career.carreraFinalizada = true

    const wrapper = mount(ResumenModal, { props: { mostrar: true } })
    expect(wrapper.find('.trophy-card__count').text()).toBe('×2')
  })

  it('el botón cerrar emite "cerrar"', async () => {
    const career = useCareerStore()
    career.iniciarCarrera(jugadorDePrueba())
    correrCarreraCompleta(career)

    const wrapper = mount(ResumenModal, { props: { mostrar: true } })
    await wrapper.find('[aria-label="Cerrar"]').trigger('click')
    expect(wrapper.emitted('cerrar')).toBeTruthy()
  })

  describe('"Compartir resumen"', () => {
    afterEach(() => {
      vi.restoreAllMocks()
      // @ts-expect-error -- limpia los mocks de navigator.share/canShare entre tests
      delete navigator.share
      // @ts-expect-error -- ídem
      delete navigator.canShare
    })

    it('sin Web Share ni clipboard, abre la imagen en una pestaña y avisa por toast', async () => {
      const career = useCareerStore()
      career.iniciarCarrera(jugadorDePrueba())
      correrCarreraCompleta(career)
      const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)

      const wrapper = mount(ResumenModal, { props: { mostrar: true } })
      await wrapper.find('[aria-label="Compartir resumen"]').trigger('click')
      await flushPromises()

      expect(openSpy).toHaveBeenCalledWith('data:image/png;base64,xx', '_blank')
      expect(career.mensajes[career.mensajes.length - 1]).toContain('no permite copiar la imagen directo')
      expect(wrapper.find('[aria-label="Compartir resumen"]').text()).toBe('📤')
    })

    it('con Web Share disponible, abre el selector nativo y no muestra toast', async () => {
      const career = useCareerStore()
      career.iniciarCarrera(jugadorDePrueba())
      correrCarreraCompleta(career)
      const shareSpy = vi.fn<(data: ShareData) => Promise<void>>().mockResolvedValue(undefined)
      navigator.canShare = () => true
      navigator.share = shareSpy

      const wrapper = mount(ResumenModal, { props: { mostrar: true } })
      const mensajesAntes = career.mensajes.length
      await wrapper.find('[aria-label="Compartir resumen"]').trigger('click')
      await flushPromises()

      expect(shareSpy).toHaveBeenCalledTimes(1)
      const args = shareSpy.mock.calls[0]![0]
      expect(args.files?.[0]?.type).toBe('image/png')
      expect(career.mensajes.length).toBe(mensajesAntes) // sin toast: el selector nativo ya confirma
    })

    it('si el usuario cancela el selector nativo (AbortError), no muestra un toast de error', async () => {
      const career = useCareerStore()
      career.iniciarCarrera(jugadorDePrueba())
      correrCarreraCompleta(career)
      navigator.canShare = () => true
      navigator.share = vi.fn<(data: ShareData) => Promise<void>>().mockRejectedValue(new DOMException('cancelado', 'AbortError'))

      const wrapper = mount(ResumenModal, { props: { mostrar: true } })
      const mensajesAntes = career.mensajes.length
      await wrapper.find('[aria-label="Compartir resumen"]').trigger('click')
      await flushPromises()

      expect(career.mensajes.length).toBe(mensajesAntes)
    })
  })
})
