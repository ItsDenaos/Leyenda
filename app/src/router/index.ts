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

export default router
