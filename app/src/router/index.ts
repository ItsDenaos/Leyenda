import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'personaje',
      component: () => import('../views/PersonajeView.vue'),
    },
    {
      path: '/equipo',
      name: 'equipo',
      component: () => import('../views/EquipoView.vue'),
    },
    {
      path: '/carrera',
      name: 'carrera',
      component: () => import('../views/CarreraView.vue'),
    },
  ],
})

// El original cambiaba de pantalla con una carga de página real (un
// <a href> a otro .html), que resetea cualquier zoom del navegador de
// forma gratuita. Acá, al ser una SPA sin recarga, un zoom que haya
// quedado activo en iOS (p.ej. al enfocar un campo de texto con
// font-size chico) se arrastra de una vista a la siguiente en vez de
// resetearse solo — forzamos ese mismo reseteo después de cada
// navegación, tocando `maximum-scale` un instante y devolviéndolo.
router.afterEach(() => {
  if (typeof document === 'undefined') return
  const viewport = document.querySelector('meta[name="viewport"]')
  const original = viewport?.getAttribute('content')
  if (!viewport || !original) return
  viewport.setAttribute('content', `${original}, maximum-scale=1.0`)
  requestAnimationFrame(() => {
    viewport.setAttribute('content', original)
  })
})

export default router
