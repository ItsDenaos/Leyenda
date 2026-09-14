// Lookups puntuales contra GameDatabase, compartidos por el store de
// carrera, las ofertas iniciales de club y los componentes de la vista de
// carrera (Hero/Spotlight/Timeline/Decisiones) — antes vivían duplicados
// en cada uno por separado.
import { GameDatabase, type Equipo, type Liga } from './database'

export function equipoDe(equipoId: string): Equipo {
  const equipo = GameDatabase.equipos.find((e) => e.id === equipoId)
  if (!equipo) throw new Error(`Equipo no encontrado: ${equipoId}`)
  return equipo
}

export function ligaDe(equipo: Equipo): Liga {
  const liga = GameDatabase.ligas.find((l) => l.id === equipo.ligaId)
  if (!liga) throw new Error(`Liga no encontrada: ${equipo.ligaId}`)
  return liga
}
