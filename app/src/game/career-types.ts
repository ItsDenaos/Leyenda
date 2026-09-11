// Tipos del estado de una carrera — todo lo que hoy vive como variables
// mutables sueltas en carrera.js (temporadaActual, temporadasFinalizadas,
// etc.) pasa a ser el estado tipado del store de Pinia (ver
// stores/career.ts). Puro dato, sin dependencia de Vue ni del DOM.
import type { Equipo, Competicion, Seleccion } from '../data/database'
import type { Forma, EfectosOpcion } from '../data/events'
import type { NivelLesion, PausaCalendario, GrupoPosicion } from './config'

export interface Player {
  apellido: string
  numero: number
  pierna: 'izquierda' | 'derecha'
  edad: number
  pais: string
  flag: string
  paisCode: string
  posicion: string
  // Se completan recién al elegir club (ver equipo.html/EquipoView) — antes
  // de eso, `usaProgresionReal` da false y no hay carrera para arrancar.
  equipoId?: string
  ovrInicial?: number
}

export interface Trofeo {
  nombre: string
  imagen: string | null
}

export interface LesionActiva {
  nivel: NivelLesion
  nombre: string
  descripcion: string
  tramosRestantes: number
  ovrPerdido: number
  bloqueaForma: boolean
}

export interface EstadoCompeticionEliminatoria {
  competicion: Competicion
  minimosJugados: boolean
  eliminado: boolean
  llegoALaFinal: boolean
  partidosJugados: number
  rondasExtra: number[]
}

export interface CompeticionesTemporada {
  liga: { competicion: Competicion | null; partidosJugados: number }
  copaNacional: EstadoCompeticionEliminatoria | null
  copaInternacional: EstadoCompeticionEliminatoria | null
}

export interface DecisionOpcionCard {
  label: string
  variant: 'accept' | 'ghost'
  efectos: EfectosOpcion
  prioriza?: boolean
}

// Una tarjeta de decisión normal (evento del banco, alto impacto, o la
// convocatoria a selección — las 3 comparten esta misma forma para que
// resolveDecisionEvento no necesite un camino aparte, ver carrera.js original).
export interface DecisionCard {
  id: string
  tipo: 'personal' | 'deportivo'
  altoImpacto: boolean
  desc: string
  opciones: DecisionOpcionCard[]
  seleccion?: boolean
}

export interface InformeLesion extends LesionActiva {
  esInformeLesion: true
  id?: undefined
}

export interface OfertaClub {
  id: string
  tipoOferta: 'club'
  equipo: Equipo
  liga: import('../data/database').Liga
  valorOfrecido: number
  desc: string
}

export interface OfertaQuedarme {
  id: string
  tipoOferta: 'quedarme'
  equipo: Equipo
  liga: import('../data/database').Liga
  desc: string
}

export interface OfertaRetiro {
  id: string
  tipoOferta: 'retiro'
  equipo: Equipo
  liga: import('../data/database').Liga
  desc: string
  forzoso?: boolean
}

// El club dueño te cede a otro por una temporada — ver clubDebePrestar en
// config.ts y clubDuenoId en Temporada más abajo. `equipo`/`liga` acá son
// el destino (donde jugarías), no tu club dueño.
export interface OfertaPrestamo {
  id: string
  tipoOferta: 'prestamo'
  equipo: Equipo
  liga: import('../data/database').Liga
  desc: string
}

export type OfertaItem = OfertaClub | OfertaQuedarme | OfertaRetiro | OfertaPrestamo
export type LoteItem = DecisionCard | OfertaItem | InformeLesion

export interface Temporada {
  numero: number
  anio: string
  equipoId: string
  // Si no es null, esta temporada jugás a préstamo: `equipoId` es el club
  // donde jugás, `clubDuenoId` el dueño de tu ficha — al cerrar la
  // temporada volvés ahí solo, sin pedirte nada (ver finalizarTemporada).
  clubDuenoId: string | null
  ovr: number
  partidos: number
  goles: number
  asistencias: number
  mvp: number
  sumaRating: number
  promedio: number
  valorMercado: number
  trofeos: Trofeo[]
  forma: Forma
  pesoTitular: number
  titular: boolean
  progreso: number
  enCurso: boolean
  calendario: PausaCalendario[]
  checkpointIndex: number
  tramoIndex: number
  altoImpactoPausa: number | null
  seleccion: Seleccion | null
  tipoAnoSeleccion: 'mundial' | 'continental' | null
  convocatoriaPausa: number | null
  seleccionPartidos: number
  seleccionGoles: number
  lesionActiva: LesionActiva | null
  loteActual: LoteItem[]
  bufferRendimiento: number
  bufferEquipo: number
  equipoAcumuladoTemporada: number
  competiciones: CompeticionesTemporada
}

export interface ResumenCarrera {
  clubes: Equipo[]
  partidos: number
  goles: number
  asistencias: number
  mvp: number
  promedio: number
  seleccionPartidos: number
  seleccionGoles: number
  mayorOvr: number
  mayorValor: number
  ovrDebut: number
  serieOvr: { numero: number; ovr: number }[]
  trofeos: (Trofeo & { cantidad: number })[]
  temporadasJugadas: number
  edadRetiro: number
}

export interface ContextoSolicitudNumero {
  ovr: number
  rendimiento: number
}

export type { GrupoPosicion }
