// Persiste la identidad del jugador (creación de personaje) mientras
// todavía no se eligió club — puente entre PersonajeView y EquipoView,
// igual que el `localStorage["leyendaPlayer"]` del original: en una SPA
// no hace falta para pasar de una vista a otra (alcanzaría con el estado
// en memoria), pero si el usuario recarga la página a mitad de la
// creación, sin esto perdería lo que ya completó.
import type { Player } from './career-types'

const STORAGE_KEY = 'leyendaPlayerDraft'

export function savePlayerDraft(draft: Player) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  } catch {
    // sin efecto si localStorage no está disponible (privado, cuota llena)
  }
}

export function loadPlayerDraft(): Player | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Player) : null
  } catch {
    return null
  }
}

export function clearPlayerDraft() {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // sin efecto si localStorage no está disponible
  }
}
