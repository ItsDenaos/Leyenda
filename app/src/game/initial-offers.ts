// Lógica de las ofertas iniciales de club — portada de js/equipo.js
// (ligaDe/elegirLigaInicial/generarOfertasInicialesParaJugador vivían ahí
// como funciones de página, no en config.js). Puro dato/lógica, sin DOM,
// así que se extrae a su propio módulo en vez de vivir dentro de la vista.
import { GameConfig } from './config'
import { GameDatabase, type Equipo, type Liga } from '../data/database'
import { ligaDe } from '../data/database-helpers'

export { ligaDe }

// Si el país elegido tiene liga propia en la base de datos, arranca ahí.
// Si no, arranca "de extranjero" en una de las 5 grandes ligas europeas,
// elegida al azar, con menos favores (banda más floja de niveles).
export function elegirLigaInicial(pais: string): { liga: Liga; extranjero: boolean } {
  const ligaLocal = GameDatabase.ligas.find((l) => l.pais === pais)
  if (ligaLocal) return { liga: ligaLocal, extranjero: false }

  const ligasGrandes = GameDatabase.ligas.filter((l) => GameConfig.LIGAS_GRANDES_EUROPEAS.includes(l.id))
  const pool = ligasGrandes.length > 0 ? ligasGrandes : GameDatabase.ligas
  return { liga: GameConfig.randomFrom(pool), extranjero: true }
}

export function generarOfertasInicialesParaJugador(pais: string): Equipo[] {
  const { liga, extranjero } = elegirLigaInicial(pais)
  const equiposLiga = GameDatabase.equipos.filter((e) => e.ligaId === liga.id)
  return extranjero
    ? GameConfig.generarOfertasInicialesExtranjero(equiposLiga)
    : GameConfig.generarOfertasIniciales(equiposLiga)
}
