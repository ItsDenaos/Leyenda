import { createRouter, createWebHistory } from 'vue-router'
import { resetZoom } from '../composables/resetZoom'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  // El original cambiaba de pantalla con una carga de página real, que
  // siempre arranca scrolleada arriba del todo. La SPA no navega de
  // verdad, así que sin esto el scroll queda donde estaba en la vista
  // anterior — por ejemplo, tras completar "¿Dónde juegas?" (el último
  // paso, al fondo de la pantalla) y pasar a elegir equipo, esa vista
  // nueva arrancaba scrolleada al fondo en vez de arriba.
  scrollBehavior() {
    return { top: 0 }
  },
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

// El botón que dispara la navegación (ej. "Comenzar carrera") sigue
// enfocado cuando la vista vieja se desmonta — sin blurearlo antes, el
// navegador tiene que decidir a dónde mover el foco solo, y termina en
// algo impredecible dentro de la vista nueva (en Chrome, suele ser el
// último elemento enfocable del DOM, típicamente al fondo de la
// pantalla). El original nunca tenía este problema: al ser una carga de
// página real, no hay ningún elemento enfocado para heredar.
router.beforeEach(() => {
  if (typeof document === 'undefined') return
  ;(document.activeElement as HTMLElement | null)?.blur()
})

// El original cambiaba de pantalla con una carga de página real (un
// <a href> a otro .html), que resetea cualquier zoom del navegador de
// forma gratuita. Acá, al ser una SPA sin recarga, un zoom que haya
// quedado activo en iOS (p.ej. al enfocar un campo de texto con
// font-size chico) se arrastra de una vista a la siguiente en vez de
// resetearse solo — forzamos ese mismo reseteo después de cada
// navegación (ver resetZoom.ts).
router.afterEach(() => {
  resetZoom()
})

export default router
