// El original nunca necesitaba esto: cada pantalla/modal se cerraba con
// una carga de página real o sin animación de por medio, así que un zoom
// que iOS dejara activo (p.ej. al enfocar un input con font-size chico)
// se perdía solo. Acá, tanto al cambiar de ruta como al cerrar un modal
// sin navegar, no hay ningún reseteo gratuito — se fuerza tocando
// `maximum-scale` un instante y devolviéndolo, el truco estándar para que
// el navegador vuelva a alinear el zoom a 1.
export function resetZoom() {
  if (typeof document === 'undefined') return
  const viewport = document.querySelector('meta[name="viewport"]')
  const original = viewport?.getAttribute('content')
  if (!viewport || !original) return
  viewport.setAttribute('content', `${original}, maximum-scale=1.0`)
  requestAnimationFrame(() => {
    viewport.setAttribute('content', original)
  })
}
