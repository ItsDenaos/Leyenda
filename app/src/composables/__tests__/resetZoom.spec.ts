import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { resetZoom, instalarResetZoomAlCerrarTeclado } from '../resetZoom'

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

describe('instalarResetZoomAlCerrarTeclado', () => {
  let quitar: () => void

  beforeEach(() => {
    document.head.innerHTML = '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
    document.body.innerHTML = '<input id="campo" /><button id="boton">ok</button>'
    quitar = instalarResetZoomAlCerrarTeclado()
  })

  afterEach(() => {
    quitar()
  })

  // Un input/textarea con font-size chico dispara el zoom de iOS al
  // enfocarse — al cerrar el teclado (blur) sin navegar ni cerrar un
  // modal, este listener es lo único que lo resetea.
  it('el blur de un input dispara resetZoom', () => {
    document.getElementById('campo')!.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    expect(metaViewport().getAttribute('content')).toBe('width=device-width, initial-scale=1.0, maximum-scale=1.0')
  })

  it('el blur de un elemento que no es input/textarea no hace nada', () => {
    document.getElementById('boton')!.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    expect(metaViewport().getAttribute('content')).toBe('width=device-width, initial-scale=1.0')
  })

  it('la función de limpieza saca el listener', () => {
    quitar()
    document.getElementById('campo')!.dispatchEvent(new FocusEvent('focusout', { bubbles: true }))
    expect(metaViewport().getAttribute('content')).toBe('width=device-width, initial-scale=1.0')
  })
})
