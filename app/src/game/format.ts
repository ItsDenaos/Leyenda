// Utilidades de formato/presentación puras (sin DOM) — reusables desde
// cualquier componente. Portadas de carrera.js.

// Niveles de OVR, de metal a gema (bronce → plata → oro → zafiro → rubí →
// amatista), proporcionales al rango real de la carrera (OVR_CARRERA_MIN..MAX
// = 45..99). Las gemas quedan reservadas al tramo de élite (90+); "oro"
// reutiliza el dorado que ya usa el resto de la UI.
export function ovrTierColor(ovr: number): string {
  if (ovr >= 96) return '#a855f7' // amatista
  if (ovr >= 93) return '#e0245e' // rubí
  if (ovr >= 90) return '#0f52ba' // zafiro
  if (ovr >= 80) return '#ffb703' // oro
  if (ovr >= 66) return '#c0c6d1' // plata
  return '#cd7f32' // bronce
}

export function formatMarketValue(value: number): string {
  if (value >= 1000000) return `€${(value / 1000000).toFixed(1).replace(/\.0$/, '')}M`
  if (value >= 1000) return `€${Math.round(value / 1000)}K`
  return `€${value}`
}

export const POSITION_NAMES: Record<string, string> = {
  POR: 'Portero',
  DFC: 'Defensor Central',
  LI: 'Lateral Izquierdo',
  LD: 'Lateral Derecho',
  MCD: 'Mediocampista Defensivo',
  MC: 'Mediocampista Central',
  MI: 'Mediocampista Izquierdo',
  MD: 'Mediocampista Derecho',
  MCO: 'Mediocampista Ofensivo',
  EI: 'Extremo Izquierdo',
  ED: 'Extremo Derecho',
  DC: 'Delantero Centro',
}
