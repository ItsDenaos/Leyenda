// Tarjeta de resumen de carrera para compartir — portado de las funciones
// de dibujo en canvas al final de carrera.js (generarTarjetaResumenCanvas
// y sus helpers). No es una captura del modal: es una tarjeta propia,
// dibujada a mano con los mismos datos, pensada para copiarse como imagen
// — el original evita así depender de una librería externa de captura de
// DOM, y este port mantiene esa misma decisión.
import { GameConfig } from './config'
import { ovrTierColor, formatMarketValue, POSITION_NAMES } from './format'
import type { Player, ResumenCarrera } from './career-types'
import type { Equipo } from '../data/database'

// Carga una imagen sin romper el dibujo si falla (escudo no disponible,
// sin internet, etc.) — se resuelve con `null` en vez de rechazar.
function cargarImagenSegura(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

// Igual que arriba, pero para imágenes de OTRO origen (las banderas salen
// de flagcdn.com) — sin `crossOrigin`, dibujar una imagen cross-origin en
// el canvas lo deja "tainted" y toBlob()/toDataURL() truenan con
// SecurityError apenas se intenta copiar la tarjeta.
function cargarImagenSeguraCrossOrigin(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}

// Los archivos de trofeo son siluetas negras sobre transparente (el color
// real del PNG no importa, solo su alpha — mismo criterio que el
// mask-image de TrofeoIcon.vue en la interfaz). El canvas no tiene
// mask-image: se logra el mismo resultado dibujando la imagen y pintando
// encima con `source-atop`, que solo afecta los píxeles ya no-transparentes
// que acaba de dejar el `drawImage` — pero eso tiene que pasar en un canvas
// aparte, en blanco: hacerlo directo sobre el canvas principal, encima del
// fondo translúcido del chip ya dibujado, dejaría CUALQUIER píxel del
// recuadro como "ya no-transparente" (por el fondo de abajo) y el
// `fillRect` tiñe el cuadrado entero en vez de solo la silueta.
function dibujarIconoTrofeo(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, size: number, color: string) {
  const off = document.createElement('canvas')
  off.width = size
  off.height = size
  const offCtx = off.getContext('2d')!
  offCtx.drawImage(img, 0, 0, size, size)
  offCtx.globalCompositeOperation = 'source-atop'
  offCtx.fillStyle = color
  offCtx.fillRect(0, 0, size, size)
  ctx.drawImage(off, x, y)
}

// Los 3 premios individuales (Bota de Oro, Balón de Oro, Once Ideal) son
// siluetas más "llenas" que las de trofeos de equipo — mismo ajuste que
// `trophy-card__icon-img--premio` en la interfaz (ver TrofeoIcon.vue).
const PREMIOS_INDIVIDUALES = new Set(['bota-de-oro.png', 'balon-de-oro.png', 'once-ideal.png'])
const TROFEO_ICONO_SIZE = 24
const TROFEO_ICONO_GAP = 10

// Mide (y opcionalmente dibuja, si se pasan ctx/fx/fy) el chip de un
// trofeo — compartido entre el paso de medición de filas y el de dibujo
// real para que ambos calculen exactamente el mismo ancho. Sin imagen
// real cargada, el 🏆 de respaldo va inline en el texto (sin ícono aparte).
function chipTrofeo(
  ctx: CanvasRenderingContext2D,
  t: ResumenCarrera['trofeos'][number],
  img: HTMLImageElement | null,
  fx: number,
  fy: number,
  dibujar: boolean,
): number {
  const sufijo = t.cantidad > 1 ? ` ×${t.cantidad}` : ''
  const etiqueta = img ? `${t.nombre}${sufijo}` : `🏆 ${t.nombre}${sufijo}`
  ctx.font = '700 20px "Segoe UI", sans-serif'
  const anchoIcono = img ? TROFEO_ICONO_SIZE + TROFEO_ICONO_GAP : 0
  const anchoChip = ctx.measureText(etiqueta).width + 36 + anchoIcono

  if (dibujar) {
    ctx.beginPath()
    ctx.roundRect(fx, fy, anchoChip, 40, 999)
    ctx.fillStyle = 'rgba(212, 175, 55, 0.2)'
    ctx.fill()
    ctx.strokeStyle = '#d4af37'
    ctx.lineWidth = 1.5
    ctx.stroke()
    if (img) {
      const esPremio = t.imagen ? PREMIOS_INDIVIDUALES.has(t.imagen) : false
      const size = esPremio ? TROFEO_ICONO_SIZE * 0.8 : TROFEO_ICONO_SIZE
      dibujarIconoTrofeo(ctx, img, fx + 16, fy + (40 - size) / 2, size, '#d4af37')
    }
    ctx.fillStyle = '#d4af37'
    ctx.textAlign = 'left'
    ctx.fillText(etiqueta, fx + 18 + anchoIcono, fy + 27)
  }

  return anchoChip
}

type Forma = 'circulo' | 'redondeado'

// Recorta el contexto actual a un círculo o a un rectángulo redondeado
// antes de dibujar adentro — mismo criterio que .team-crest--avatar
// (círculo) vs .team-crest--md (esquinas redondeadas) en el CSS real.
function recortarForma(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, forma: Forma) {
  ctx.beginPath()
  if (forma === 'circulo') {
    ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
  } else {
    ctx.roundRect(x, y, size, size, size * 0.22)
  }
  ctx.closePath()
  ctx.clip()
}

// Dibuja un escudo de club: la imagen real si cargó, o el mismo respaldo
// que usa el juego (degradado de los colores del club + iniciales).
function dibujarEscudoCanvas(
  ctx: CanvasRenderingContext2D,
  equipo: Equipo,
  img: HTMLImageElement | null,
  x: number,
  y: number,
  size: number,
  forma: Forma = 'circulo',
) {
  ctx.save()
  recortarForma(ctx, x, y, size, forma)
  if (img) {
    ctx.drawImage(img, x, y, size, size)
  } else {
    const grad = ctx.createLinearGradient(x, y, x + size, y + size)
    grad.addColorStop(0, equipo.a)
    grad.addColorStop(1, equipo.b)
    ctx.fillStyle = grad
    ctx.fillRect(x, y, size, size)
    ctx.fillStyle = '#fff'
    ctx.font = `900 ${Math.round(size * 0.34)}px "Segoe UI", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(equipo.initials, x + size / 2, y + size / 2 + size * 0.02)
  }
  ctx.restore()
}

// Trunca un texto con "…" si no entra en el ancho disponible, en vez de
// desbordarse o ajustar el layout — mismo criterio que el line-clamp CSS
// del popup real, pero a mano porque canvas no tiene texto multilínea.
function truncarTexto(ctx: CanvasRenderingContext2D, texto: string, anchoMax: number): string {
  if (ctx.measureText(texto).width <= anchoMax) return texto
  let recortado = texto
  while (recortado.length > 1 && ctx.measureText(`${recortado}…`).width > anchoMax) {
    recortado = recortado.slice(0, -1)
  }
  return `${recortado}…`
}

function dibujarTarjetaFondo(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 18)
  ctx.fillStyle = 'rgba(23, 31, 56, 0.7)'
  ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.lineWidth = 1
  ctx.stroke()
}

// Réplica del gráfico de ovr-chart.ts (evolución de OVR), dibujada
// directo en canvas en vez de como <svg>.
function dibujarArcoOvr(ctx: CanvasRenderingContext2D, serie: { numero: number; ovr: number }[], color: string, x: number, y: number, w: number, h: number) {
  if (!serie || serie.length === 0) return
  const ovrs = serie.map((s) => s.ovr)
  const min = Math.min(...ovrs)
  const max = Math.max(...ovrs)
  const rango = Math.max(1, max - min)
  const n = serie.length
  const padX = 10
  const px = (i: number) => x + (n === 1 ? w / 2 : padX + (i * (w - padX * 2)) / (n - 1))
  const py = (ovr: number) => y + h - ((ovr - min) / rango) * h * 0.85 - h * 0.05

  ctx.beginPath()
  ctx.moveTo(px(0), y + h)
  serie.forEach((s, i) => ctx.lineTo(px(i), py(s.ovr)))
  ctx.lineTo(px(n - 1), y + h)
  ctx.closePath()
  ctx.fillStyle = `${color}29` // ~16% opacidad, mismo criterio que el SVG
  ctx.fill()

  ctx.beginPath()
  serie.forEach((s, i) => (i === 0 ? ctx.moveTo(px(i), py(s.ovr)) : ctx.lineTo(px(i), py(s.ovr))))
  ctx.strokeStyle = color
  ctx.lineWidth = 4
  ctx.lineJoin = 'round'
  ctx.lineCap = 'round'
  ctx.stroke()

  serie.forEach((s, i) => {
    ctx.beginPath()
    ctx.arc(px(i), py(s.ovr), 6, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
  })
}

export async function generarTarjetaResumenCanvas(player: Player, r: ResumenCarrera): Promise<HTMLCanvasElement> {
  const ultimoClub = r.clubes[r.clubes.length - 1]!
  const colorPico = ovrTierColor(r.mayorOvr)
  const totalTrofeos = r.trofeos.reduce((suma, t) => suma + t.cantidad, 0)

  const imgUltimoClub = await cargarImagenSegura(GameConfig.rutaEscudoEquipo(ultimoClub))
  const imgsClubes = await Promise.all(r.clubes.map((e) => cargarImagenSegura(GameConfig.rutaEscudoEquipo(e))))
  const imgLogo = await cargarImagenSegura('assets/logo/logo_leyenda_transparent.png')
  // Misma bandera real (no emoji) que usa el resto del juego — en Windows
  // los emoji de bandera no se dibujan ni en HTML, mucho menos en canvas.
  const imgBanderaSeleccion = r.seleccionPartidos > 0 ? await cargarImagenSeguraCrossOrigin(`${GameConfig.RUTA_BANDERAS}${player.paisCode}.png`) : null
  // Mismo asset real que usa TrofeoIcon.vue en la interfaz (siluetas sobre
  // transparente) — antes acá se dibujaba siempre el 🏆 genérico, sin
  // relación con el trofeo real. `null` cuando el trofeo todavía no tiene
  // imagen cargada: esa entrada cae sola al 🏆 de respaldo al dibujar.
  const imgsTrofeos = await Promise.all(
    r.trofeos.map((t) => (t.imagen ? cargarImagenSegura(`${GameConfig.RUTA_ESCUDOS_TROFEOS}${t.imagen}`) : Promise.resolve(null))),
  )

  const W = 1080
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = 100 // alto provisorio — se ajusta abajo antes de dibujar nada
  const ctx = canvas.getContext('2d')!

  // El recorrido de clubes y los chips de trofeos son de alto variable
  // (pasan a una fila/línea nueva si no entran) — se mide cuánto van a
  // ocupar ANTES de fijar el alto real del canvas.
  const escudoSize = 84
  const espacioEntre = 46
  const anchoDisponible = W - 120
  const porFilaClubes = Math.max(1, Math.floor((anchoDisponible + espacioEntre) / (escudoSize + espacioEntre)))
  const filasClubes = Math.ceil(r.clubes.length / porFilaClubes)
  const alturaFilaClubes = escudoSize + 40

  let filasTrofeos = 1
  if (r.trofeos.length > 0) {
    let fxMedido = 60
    const maxAncho = W - 60
    r.trofeos.forEach((t, i) => {
      const anchoChip = chipTrofeo(ctx, t, imgsTrofeos[i] ?? null, 0, 0, false)
      if (fxMedido + anchoChip > maxAncho) {
        fxMedido = 60
        filasTrofeos++
      }
      fxMedido += anchoChip + 14
    })
  }
  const alturaFilaTrofeos = 52

  // Alto pensado para 1 fila de clubes y 1 línea de trofeos — el resto se
  // suma según haga falta.
  const H = (r.seleccionPartidos > 0 ? 1450 : 1350) + Math.max(0, filasClubes - 1) * alturaFilaClubes + Math.max(0, filasTrofeos - 1) * alturaFilaTrofeos
  canvas.height = H // limpia el buffer y resetea el estado del contexto

  // Por defecto los navegadores reescalan imágenes en canvas con calidad
  // "low" — los escudos fuente son de 1500×1500px, de sobra para verse
  // nítidos, pero con la calidad por defecto salían borrosos al reducirlos.
  // Se fija DESPUÉS del último resize del canvas porque cambiar
  // width/height resetea todo el estado del contexto.
  ctx.imageSmoothingQuality = 'high'

  // Fondo: mismo lenguaje que el hero/banner real (degradado del último
  // club, oscurecido para que el texto blanco siga siendo legible).
  const fondo = ctx.createLinearGradient(0, 0, W, H)
  fondo.addColorStop(0, ultimoClub.a)
  fondo.addColorStop(1, ultimoClub.b)
  ctx.fillStyle = fondo
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = 'rgba(13, 17, 32, 0.86)'
  ctx.fillRect(0, 0, W, H)

  // Marca: el logo real del juego (trofeo + wordmark), no una aproximación
  // a mano con emoji.
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  if (imgLogo) {
    const logoH = 70
    const logoW = logoH * (imgLogo.width / imgLogo.height)
    ctx.drawImage(imgLogo, 60, 30, logoW, logoH)
  } else {
    ctx.fillStyle = '#ffb703'
    ctx.font = '800 30px "Segoe UI", sans-serif'
    ctx.fillText('⚽ LEYENDA', 60, 70)
  }

  // Encabezado: escudo + nombre + subtítulo, badge de pico de OVR a la derecha
  dibujarEscudoCanvas(ctx, ultimoClub, imgUltimoClub, 60, 110, 130, 'circulo')
  ctx.fillStyle = '#ffffff'
  ctx.font = '900 52px "Segoe UI", sans-serif'
  ctx.fillText(player.apellido, 216, 175)
  ctx.fillStyle = 'rgba(255,255,255,0.7)'
  ctx.font = '400 26px "Segoe UI", sans-serif'
  const posicion = POSITION_NAMES[player.posicion] ?? player.posicion
  ctx.fillText(`${posicion} · ${r.temporadasJugadas} temporada${r.temporadasJugadas === 1 ? '' : 's'}`, 216, 212)
  ctx.fillText(`Retirado a los ${r.edadRetiro} años`, 216, 244)

  // Badge de pico de OVR (círculo con el color de su gema/metal)
  const ovrCx = W - 140
  const ovrCy = 175
  const ovrR = 78
  ctx.beginPath()
  ctx.arc(ovrCx, ovrCy, ovrR, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.fill()
  ctx.lineWidth = 5
  ctx.strokeStyle = colorPico
  ctx.stroke()
  ctx.fillStyle = colorPico
  ctx.textAlign = 'center'
  ctx.font = '900 46px "Segoe UI", sans-serif'
  ctx.fillText(String(r.mayorOvr), ovrCx, ovrCy + 8)
  ctx.fillStyle = 'rgba(255,255,255,0.65)'
  ctx.font = '700 16px "Segoe UI", sans-serif'
  ctx.fillText('PICO OVR', ovrCx, ovrCy + 40)

  // ---- Tarjeta: evolución de OVR ----
  let y = 300
  dibujarTarjetaFondo(ctx, 60, y, W - 120, 220)
  ctx.textAlign = 'left'
  ctx.fillStyle = '#9aa3c2'
  ctx.font = '700 20px "Segoe UI", sans-serif'
  ctx.fillText('EVOLUCIÓN DE OVR', 90, y + 40)
  ctx.textAlign = 'right'
  ctx.fillText(`De ${r.ovrDebut} a ${r.mayorOvr}`, W - 90, y + 40)
  dibujarArcoOvr(ctx, r.serieOvr, colorPico, 90, y + 60, W - 180, 130)

  // ---- Tarjeta: estadísticas ----
  y += 260
  dibujarTarjetaFondo(ctx, 60, y, W - 120, 190)
  const stats: [string | number, string][] = [
    [r.partidos, 'Partidos'],
    [r.goles, 'Goles'],
    [r.asistencias, 'Asistencias'],
    [r.mvp, 'MVP'],
    [r.promedio.toFixed(1), 'Promedio'],
    [formatMarketValue(r.mayorValor), 'Mayor valor'],
  ]
  const colAncho = (W - 120) / 3
  stats.forEach(([valor, label], i) => {
    const cx = 60 + colAncho * (i % 3) + colAncho / 2
    const cy = y + (i < 3 ? 65 : 140)
    ctx.textAlign = 'center'
    ctx.fillStyle = '#eef1fb'
    ctx.font = '800 40px "Segoe UI", sans-serif'
    ctx.fillText(String(valor), cx, cy)
    ctx.fillStyle = '#9aa3c2'
    ctx.font = '600 18px "Segoe UI", sans-serif'
    ctx.fillText(label, cx, cy + 28)
  })

  // ---- Clubes ----
  y += 250
  ctx.textAlign = 'left'
  ctx.fillStyle = '#9aa3c2'
  ctx.font = '700 20px "Segoe UI", sans-serif'
  ctx.fillText(`CLUBES (${r.clubes.length})`, 60, y)
  y += 30
  r.clubes.forEach((e, i) => {
    const fila = Math.floor(i / porFilaClubes)
    const col = i % porFilaClubes
    const enEstaFila = Math.min(porFilaClubes, r.clubes.length - fila * porFilaClubes)
    const anchoFila = enEstaFila * escudoSize + (enEstaFila - 1) * espacioEntre
    const filaX = 60 + Math.max(0, (anchoDisponible - anchoFila) / 2)
    const cx = filaX + col * (escudoSize + espacioEntre)
    const cy = y + fila * alturaFilaClubes
    dibujarEscudoCanvas(ctx, e, imgsClubes[i]!, cx, cy, escudoSize, 'redondeado')
    ctx.textAlign = 'center'
    ctx.fillStyle = '#9aa3c2'
    ctx.font = '600 15px "Segoe UI", sans-serif'
    ctx.fillText(truncarTexto(ctx, e.nombre, escudoSize + espacioEntre - 10), cx + escudoSize / 2, cy + escudoSize + 24)
    if (col < enEstaFila - 1) {
      ctx.fillStyle = '#9aa3c2'
      ctx.font = '600 28px "Segoe UI", sans-serif'
      ctx.fillText('›', cx + escudoSize + espacioEntre / 2, cy + escudoSize / 2 + 10)
    }
  })
  y += filasClubes * alturaFilaClubes

  // ---- Con la selección (si hubo alguna convocatoria en la carrera) ----
  y += 46
  if (r.seleccionPartidos > 0) {
    ctx.textAlign = 'left'
    ctx.fillStyle = '#9aa3c2'
    ctx.font = '700 20px "Segoe UI", sans-serif'
    ctx.fillText('CON LA SELECCIÓN', 60, y)
    y += 44
    const banderaW = 40
    const banderaH = 28
    if (imgBanderaSeleccion) {
      ctx.drawImage(imgBanderaSeleccion, 60, y - banderaH + 6, banderaW, banderaH)
    } else {
      ctx.font = '400 26px "Segoe UI", sans-serif'
      ctx.fillText(player.flag ?? '🏳️', 60, y)
    }
    ctx.fillStyle = '#eef1fb'
    ctx.font = '700 24px "Segoe UI", sans-serif'
    ctx.fillText(player.pais, 60 + banderaW + 16, y)
    const anchoPais = ctx.measureText(player.pais).width
    ctx.fillStyle = '#9aa3c2'
    ctx.font = '400 22px "Segoe UI", sans-serif'
    const golesTxt = `${r.seleccionPartidos} partido${r.seleccionPartidos === 1 ? '' : 's'} · ${r.seleccionGoles} gol${r.seleccionGoles === 1 ? '' : 'es'}`
    ctx.fillText(golesTxt, 60 + banderaW + 16 + anchoPais + 20, y)
    y += 50
  }

  // ---- Trofeos ----
  ctx.textAlign = 'left'
  ctx.fillStyle = '#9aa3c2'
  ctx.font = '700 20px "Segoe UI", sans-serif'
  ctx.fillText(`TROFEOS (${totalTrofeos})`, 60, y)
  y += 40
  if (r.trofeos.length === 0) {
    ctx.fillStyle = '#9aa3c2'
    ctx.font = '400 20px "Segoe UI", sans-serif'
    ctx.fillText('No ganaste trofeos en esta carrera — pero la viviste a fondo.', 60, y + 20)
  } else {
    let fx = 60
    let fy = y
    const maxAncho = W - 60
    r.trofeos.forEach((t, i) => {
      const img = imgsTrofeos[i] ?? null
      const anchoChip = chipTrofeo(ctx, t, img, 0, 0, false)
      if (fx + anchoChip > maxAncho) {
        fx = 60
        fy += 52
      }
      chipTrofeo(ctx, t, img, fx, fy, true)
      fx += anchoChip + 14
    })
  }

  return canvas
}
