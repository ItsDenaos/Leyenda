// Gráfico de área + línea de la evolución de OVR por temporada — portado
// de ovrArcoSvg() en carrera.js. Coordenadas en un viewBox de ancho 100
// para escalar con preserveAspectRatio="none" al ancho real del
// contenedor (ver .resumen__arco en el CSS). Puro cálculo, sin DOM — el
// componente arma el <svg> a partir de esto.
export interface PuntoOvr {
  x: number
  y: number
  ovr: number
  numero: number
}

export interface ArcoOvr {
  puntos: PuntoOvr[]
  lineaPath: string
  areaPath: string
}

const ANCHO = 100
const ALTO = 34
const PAD_X = 3
const PAD_Y = 6

export function calcularArcoOvr(serie: { numero: number; ovr: number }[]): ArcoOvr | null {
  if (!serie || serie.length === 0) return null

  const ovrs = serie.map((s) => s.ovr)
  const min = Math.min(...ovrs)
  const max = Math.max(...ovrs)
  const rango = Math.max(1, max - min)
  const n = serie.length

  const x = (i: number) => (n === 1 ? ANCHO / 2 : PAD_X + (i * (ANCHO - PAD_X * 2)) / (n - 1))
  const y = (ovr: number) => ALTO - PAD_Y - ((ovr - min) / rango) * (ALTO - PAD_Y * 2)

  const puntos: PuntoOvr[] = serie.map((s, i) => ({
    x: Number(x(i).toFixed(1)),
    y: Number(y(s.ovr).toFixed(1)),
    ovr: s.ovr,
    numero: s.numero,
  }))

  const coords = puntos.map((p) => `${p.x},${p.y}`)
  const lineaPath = `M ${coords.join(' L ')}`
  const base = ALTO - PAD_Y
  const areaPath = `M ${puntos[0]!.x},${base} L ${coords.join(' L ')} L ${puntos[n - 1]!.x},${base} Z`

  return { puntos, lineaPath, areaPath }
}
