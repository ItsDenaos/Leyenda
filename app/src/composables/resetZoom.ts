// El original nunca necesitaba esto: cada pantalla/modal se cerraba con
// una carga de página real o sin animación de por medio, así que un zoom
// que iOS dejara activo (p.ej. al enfocar un input con font-size chico)
// se perdía solo. Acá, tanto al cambiar de ruta como al cerrar un modal
// sin navegar, no hay ningún reseteo gratuito — se fuerza tocando
// `maximum-scale` un instante y devolviéndolo, el truco estándar para que
// el navegador vuelva a alinear el zoom a 1.
const ORIGINAL_ATTR = 'data-viewport-original-content'

export function resetZoom() {
  if (typeof document === 'undefined') return
  const viewport = document.querySelector('meta[name="viewport"]')
  if (!viewport) return

  // El content "original" se guarda una sola vez, en el propio elemento
  // (no se vuelve a leer `content` en cada llamada): si dos navegaciones/
  // cierres de modal caen juntos, el rAF que restaura la primera puede no
  // haber corrido todavía cuando arranca la segunda — releer `content` en
  // ese momento devolvería el `, maximum-scale=1.0` que la primera ya
  // dejó puesto, y cada llamada lo iría acumulando de nuevo sobre eso.
  let original = viewport.getAttribute(ORIGINAL_ATTR)
  if (original === null) {
    original = viewport.getAttribute('content')
    if (!original) return
    viewport.setAttribute(ORIGINAL_ATTR, original)
  }

  viewport.setAttribute('content', `${original}, maximum-scale=1.0`)
  requestAnimationFrame(() => {
    viewport.setAttribute('content', original!)
  })
}

// resetZoom() ya corre al cambiar de vista (router.afterEach) y al cerrar
// los modales que tienen su propio input (NumeroModal/ResumenModal) — pero
// varios inputs (apellido, búsqueda de país en la creación de personaje,
// el número del NumeroModal) tienen font-size menor a 16px, así que
// enfocarlos en iOS dispara un zoom automático del navegador para que el
// texto se lea bien mientras se escribe. Si el teclado se cierra sin
// navegar ni cerrar un modal (tocar afuera del input, o "listo" del
// teclado), ese zoom se queda pegado — hace falta resetearlo también ahí,
// para cualquier input/textarea de la app, sin tener que cablear un
// @blur en cada uno. Instalado una sola vez, en App.vue.
export function instalarResetZoomAlCerrarTeclado(): () => void {
  function onFocusOut(e: FocusEvent) {
    const tag = (e.target as HTMLElement | null)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') resetZoom()
  }
  document.addEventListener('focusout', onFocusOut)
  return () => document.removeEventListener('focusout', onFocusOut)
}
