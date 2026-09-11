import { describe, it, expect, beforeEach } from 'vitest'
import { resetZoom } from '../resetZoom'

function metaViewport() {
  return document.querySelector('meta[name="viewport"]')!
}

describe('resetZoom', () => {
  beforeEach(() => {
    document.head.innerHTML = '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
  })

  it('agrega maximum-scale y lo restaura al content original', async () => {
    resetZoom()
    expect(metaViewport().getAttribute('content')).toBe('width=device-width, initial-scale=1.0, maximum-scale=1.0')

    await new Promise((resolve) => requestAnimationFrame(resolve))
    expect(metaViewport().getAttribute('content')).toBe('width=device-width, initial-scale=1.0')
  })

  it('llamadas seguidas antes de que corra el rAF no acumulan maximum-scale duplicado', async () => {
    // Escenario real: dos navegaciones (o un modal que cierra justo
    // después de navegar) disparan resetZoom() antes de que el rAF de la
    // primera llamada llegue a restaurar el content.
    resetZoom()
    resetZoom()
    resetZoom()
    expect(metaViewport().getAttribute('content')).toBe('width=device-width, initial-scale=1.0, maximum-scale=1.0')

    await new Promise((resolve) => requestAnimationFrame(resolve))
    await new Promise((resolve) => requestAnimationFrame(resolve))
    await new Promise((resolve) => requestAnimationFrame(resolve))
    expect(metaViewport().getAttribute('content')).toBe('width=device-width, initial-scale=1.0')
  })
})
