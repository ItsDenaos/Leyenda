import { describe, it, expect, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import LesionCardItem from '../LesionCardItem.vue'
import { useCareerStore } from '../../../stores/career'
import { GameDatabase } from '../../../data/database'
import type { InformeLesion, Player } from '../../../game/career-types'

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

describe('LesionCardItem', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
  })

  it('muestra la etiqueta según el nivel, el nombre y el detalle (OVR perdido + pausas de baja)', () => {
    const lesion: InformeLesion = {
      esInformeLesion: true,
      nivel: 'nivel1',
      nombre: 'Rotura de ligamentos',
      descripcion: 'Una lesión grave.',
      tramosRestantes: 3,
      ovrPerdido: 4,
      bloqueaForma: true,
    }

    const wrapper = mount(LesionCardItem, { props: { lesion } })
    expect(wrapper.find('.decision-card__tag').text()).toBe('Lesión grave')
    expect(wrapper.text()).toContain('Rotura de ligamentos')
    expect(wrapper.find('.decision-card__lesion-detalle').text()).toBe('-4 OVR · 3 pausas de baja')
  })

  it('sin OVR perdido, el detalle omite ese dato', () => {
    const lesion: InformeLesion = {
      esInformeLesion: true,
      nivel: 'nivel3',
      nombre: 'Molestia leve',
      descripcion: 'test',
      tramosRestantes: 1,
      ovrPerdido: 0,
      bloqueaForma: false,
    }

    const wrapper = mount(LesionCardItem, { props: { lesion } })
    expect(wrapper.find('.decision-card__lesion-detalle').text()).toBe('1 pausa de baja')
  })

  it('al continuar, deshabilita el botón y llama a simularTramoYAvanzar del store', async () => {
    const career = useCareerStore()
    career.iniciarCarrera(jugadorDePrueba())
    const tramoAntes = career.temporadaActual!.tramoIndex

    const lesion: InformeLesion = {
      esInformeLesion: true,
      nivel: 'nivel2',
      nombre: 'Esguince',
      descripcion: 'test',
      tramosRestantes: 2,
      ovrPerdido: 2,
      bloqueaForma: true,
    }
    const wrapper = mount(LesionCardItem, { props: { lesion } })

    await wrapper.find('button.btn').trigger('click')

    expect(wrapper.find('button.btn').attributes('disabled')).toBeDefined()
    // simularTramoYAvanzar corrió al menos un tramo (o cerró la temporada,
    // en cuyo caso el checkpoint/tramoIndex arranca de nuevo en 0 en la
    // temporada siguiente) — en ambos casos, el store dejó de estar en el
    // mismo tramoIndex sin avanzar el checkpoint.
    expect(career.temporadaActual).not.toBeNull()
    expect(career.temporadaActual!.checkpointIndex !== 0 || career.temporadaActual!.tramoIndex !== tramoAntes || career.temporadasFinalizadas.length > 0).toBe(true)
  })
})
