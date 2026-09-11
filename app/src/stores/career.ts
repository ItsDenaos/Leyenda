// Store de la carrera — estado + motor de progresión de temporada.
// Portado de js/carrera.js, pero SOLO la parte de estado/lógica: todo lo
// que en el original era render*()/animar*()/acceso al DOM se excluye acá
// a propósito — con Vue, la UI reacciona sola a los cambios de este
// estado, no hace falta llamar a un render manualmente después de cada
// mutación. Esa capa de UI (componentes, animaciones, el resumen para
// compartir como imagen) se arma en los bloques 5-7 del plan de migración.
//
// Tampoco se portó el fallback de "carrera demo" que tenía el original
// para poder abrir carrera.html directo sin pasar por la creación de
// personaje — en la SPA esa navegación la controla el router (bloques
// 5-7): no se puede llegar a la vista de carrera sin haber creado
// personaje y elegido club antes.
//
// Los toasts (`showToast` en el original) se reemplazan por una cola de
// mensajes (`mensajes`) que la UI consume y vacía — el store no toca el
// DOM directamente.
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { GameConfig } from '../game/config'
import { GameDatabase, type Liga, type Equipo, type Competicion } from '../data/database'
import { equipoDe, ligaDe } from '../data/database-helpers'
import { GameEvents, type Evento } from '../data/events'
import type {
  Player,
  Temporada,
  DecisionCard,
  OfertaItem,
  LesionActiva,
  CompeticionesTemporada,
  EstadoCompeticionEliminatoria,
  ContextoSolicitudNumero,
  ResumenCarrera,
} from '../game/career-types'

const STORAGE_KEY = 'leyenda-carrera'

// ---------- COMPETICIONES DE LA TEMPORADA ----------
function buscarCompeticionDomestica(ligaId: string, categoria: string): Competicion | null {
  return (
    GameDatabase.competiciones.find(
      (c) => c.tipo === 'domestica' && c.categoria === categoria && c.ligaId === ligaId,
    ) ?? null
  )
}
function buscarCompeticionInternacional(confederacion: string, categoria: string): Competicion | null {
  return (
    GameDatabase.competiciones.find(
      (c) => c.tipo === 'internacional' && c.categoria === categoria && c.confederacion === confederacion,
    ) ?? null
  )
}
function buscarCompeticionSeleccion(confederacion: string, tipoAno: 'mundial' | 'continental'): Competicion | null {
  if (tipoAno === 'mundial') {
    return GameDatabase.competiciones.find((c) => c.tipo === 'seleccion' && c.categoria === 'mundial') ?? null
  }
  return (
    GameDatabase.competiciones.find(
      (c) => c.tipo === 'seleccion' && c.categoria === 'continental' && c.confederacion === confederacion,
    ) ?? null
  )
}
function nombreTorneoSeleccion(confederacion: string, tipoAno: 'mundial' | 'continental'): string {
  return buscarCompeticionSeleccion(confederacion, tipoAno)?.nombre ?? 'competición'
}

function repartirEnPartes(total: number, partes: number): number[] {
  const base = Math.floor(total / partes)
  const resultado: number[] = Array.from({ length: partes }, () => base)
  resultado[partes - 1] = total - base * (partes - 1)
  return resultado
}

function estadoCompeticionEliminatoria(
  competicion: Competicion | null,
  numRondasExtra: number,
): EstadoCompeticionEliminatoria | null {
  if (!competicion) return null
  return {
    competicion,
    minimosJugados: false,
    eliminado: false,
    llegoALaFinal: false,
    partidosJugados: 0,
    rondasExtra: repartirEnPartes(competicion.partidosExtra, numRondasExtra),
  }
}

function inicializarCompeticionesTemporada(
  equipoId: string,
  clasificacionInternacional: 'primerNivel' | 'segundoNivel' | null,
): CompeticionesTemporada {
  const equipo = equipoDe(equipoId)
  const liga = ligaDe(equipo)

  const copaNacionalComp = buscarCompeticionDomestica(liga.id, 'copa')
  const copaInternacionalComp = clasificacionInternacional
    ? buscarCompeticionInternacional(liga.confederacion, clasificacionInternacional)
    : null

  const ultimoTramo = GameConfig.TOTAL_TRAMOS_TEMPORADA - 1
  return {
    liga: { competicion: buscarCompeticionDomestica(liga.id, 'liga'), partidosJugados: 0 },
    copaNacional: estadoCompeticionEliminatoria(copaNacionalComp, ultimoTramo),
    copaInternacional: estadoCompeticionEliminatoria(copaInternacionalComp, ultimoTramo - 1),
  }
}

export const useCareerStore = defineStore('career', () => {
  // ---------------- ESTADO ----------------
  const player = ref<Player | null>(null)
  const temporadaActual = ref<Temporada | null>(null)
  const temporadasFinalizadas = ref<Temporada[]>([])
  const temporadasEnClubActual = ref(0)
  const esPrimerClub = ref(true)
  const edadRetiroForzoso = ref(0)
  const factorTalento = ref(1)
  const potencialTecho = ref(GameConfig.OVR_CARRERA_MAX)
  const carreraFinalizada = ref(false)
  const eventosUsados = ref<Set<string>>(new Set())
  const puedeSolicitarNumero = ref(false)
  const contextoSolicitudNumero = ref<ContextoSolicitudNumero | null>(null)
  // Cola de avisos puntuales para la UI (reemplaza showToast) — la UI la
  // consume y la vacía, el store nunca toca el DOM.
  const mensajes = ref<string[]>([])

  const carreraIniciada = computed(() => player.value !== null && temporadaActual.value !== null)

  function getEdadActual(): number {
    if (!player.value || !temporadaActual.value) return 0
    return Number(player.value.edad) + (temporadaActual.value.numero - 1)
  }

  // ---------------- CREACIÓN DE TEMPORADA ----------------
  function crearTemporada(
    numero: number,
    equipoId: string,
    ovr: number,
    valorMercado: number,
    clasificacionInternacional: 'primerNivel' | 'segundoNivel' | null = null,
    pesoTitularHeredado?: number,
  ): Temporada {
    if (!player.value) throw new Error('No hay jugador — llamar a iniciarCarrera primero')
    const seleccion = GameDatabase.selecciones.find((s) => s.pais === player.value!.pais) ?? null
    const tipoAnoSeleccion = GameConfig.tipoAnoTorneoSeleccion(numero)
    const convocado = Boolean(seleccion) && Math.random() < GameConfig.probConvocatoria(ovr, seleccion!.fuerza)
    const pesoTitular = pesoTitularHeredado ?? GameConfig.PESO_TITULAR_INICIAL

    return {
      numero,
      anio: String(new Date().getFullYear() + (numero - 1)),
      equipoId,
      ovr,
      partidos: 0,
      goles: 0,
      asistencias: 0,
      mvp: 0,
      sumaRating: 0,
      promedio: 0,
      valorMercado,
      trofeos: [],
      forma: 'regular',
      pesoTitular,
      titular: pesoTitular >= 0.5,
      progreso: 0,
      enCurso: true,
      calendario: GameConfig.crearCalendarioTemporada(numero),
      checkpointIndex: 0,
      tramoIndex: 0,
      altoImpactoPausa: Math.random() < 0.3 ? GameConfig.randomInt(0, GameConfig.TOTAL_TRAMOS_TEMPORADA - 1) : null,
      seleccion,
      tipoAnoSeleccion,
      convocatoriaPausa: convocado ? GameConfig.randomInt(0, GameConfig.TOTAL_TRAMOS_TEMPORADA - 1) : null,
      seleccionPartidos: 0,
      seleccionGoles: 0,
      lesionActiva: null,
      loteActual: [],
      bufferRendimiento: 0,
      bufferEquipo: 0,
      equipoAcumuladoTemporada: 0,
      competiciones: inicializarCompeticionesTemporada(equipoId, clasificacionInternacional),
    }
  }

  // ---------------- ARRANQUE DE CARRERA ----------------
  // Se llama una vez, después de la creación de personaje + elección de
  // club (bloques 5-6) — reemplaza la inicialización a nivel de módulo
  // que tenía el carrera.js original.
  function iniciarCarrera(datosJugador: Player) {
    player.value = datosJugador
    edadRetiroForzoso.value = GameConfig.randomInt(GameConfig.EDAD_RETIRO_FORZOSO_MIN, GameConfig.EDAD_RETIRO_FORZOSO_MAX)
    factorTalento.value = GameConfig.sortearFactorTalento()
    potencialTecho.value = Math.max(
      GameConfig.sortearPotencialTecho(),
      (datosJugador.ovrInicial ?? GameConfig.OVR_INICIAL_MIN) + 5,
    )
    temporadasFinalizadas.value = []
    temporadasEnClubActual.value = 0
    esPrimerClub.value = true
    carreraFinalizada.value = false
    eventosUsados.value = new Set()
    puedeSolicitarNumero.value = false
    contextoSolicitudNumero.value = null
    mensajes.value = []

    if (!datosJugador.equipoId || typeof datosJugador.ovrInicial !== 'number') {
      throw new Error('Faltan equipoId/ovrInicial — elegí un club antes de iniciar la carrera')
    }
    const equipoInicial = equipoDe(datosJugador.equipoId)
    const ligaInicial = ligaDe(equipoInicial)
    const valorMercadoInicial = GameConfig.calcularValorMercado(datosJugador.ovrInicial, equipoInicial, ligaInicial)
    temporadaActual.value = crearTemporada(1, datosJugador.equipoId, datosJugador.ovrInicial, valorMercadoInicial)

    // Arranca la primera pausa (en el original esto lo disparaba una sola
    // llamada a iniciarCheckpoint() al final del archivo, al cargar el script).
    iniciarCheckpoint()
    guardar()
  }

  // ---------------- BANCO DE EVENTOS ----------------
  function esElegibleParaDebut(evento: Evento): boolean {
    if (!evento.debut) return true
    return temporadasFinalizadas.value.length === 0 && temporadaActual.value!.tramoIndex === 0
  }
  function esElegibleDuranteLesion(evento: Evento): boolean {
    if (!evento.noDuranteLesion) return true
    return !temporadaActual.value!.lesionActiva
  }

  function elegirEventoPorTipo(edadActual: number, tipo: 'personal' | 'deportivo'): Evento {
    const rango = GameConfig.rangoEdadDe(edadActual)
    const bancoPorEdad = GameEvents.porEdad[rango]
    const bancoElegido = Math.random() < 0.5 ? GameEvents.generales : bancoPorEdad
    const bancoAlterno = bancoElegido === GameEvents.generales ? bancoPorEdad : GameEvents.generales

    const sinUsar = (banco: Evento[]) =>
      banco.filter((e) => e.tipo === tipo && !eventosUsados.value.has(e.id) && esElegibleParaDebut(e) && esElegibleDuranteLesion(e))
    const cualquiera = (banco: Evento[]) =>
      banco.filter((e) => e.tipo === tipo && esElegibleParaDebut(e) && esElegibleDuranteLesion(e))

    let candidatos = sinUsar(bancoElegido)
    if (candidatos.length === 0) candidatos = sinUsar(bancoAlterno)
    if (candidatos.length === 0) candidatos = cualquiera(bancoElegido)
    if (candidatos.length === 0) candidatos = cualquiera(bancoAlterno)

    const evento = GameConfig.randomFrom(candidatos)
    eventosUsados.value.add(evento.id)
    return evento
  }

  function elegirEventoAltoImpacto(): Evento {
    const elegibles = GameEvents.altoImpacto.filter((e) => esElegibleDuranteLesion(e))
    const bancoBase = elegibles.length > 0 ? elegibles : GameEvents.altoImpacto
    const sinUsar = bancoBase.filter((e) => !eventosUsados.value.has(e.id))
    const candidatos = sinUsar.length > 0 ? sinUsar : bancoBase
    const evento = GameConfig.randomFrom(candidatos)
    eventosUsados.value.add(evento.id)
    return evento
  }

  function mapearEventoACard(evento: Evento, esAltoImpacto: boolean): DecisionCard {
    return {
      id: evento.id,
      tipo: evento.tipo,
      altoImpacto: esAltoImpacto,
      desc: evento.pregunta,
      opciones: evento.opciones.map((op, i) => ({
        label: op.texto,
        variant: i === 0 ? 'accept' : 'ghost',
        efectos: op.efectos,
      })),
    }
  }

  function construirCardConvocatoria(): DecisionCard {
    const t = temporadaActual.value!
    const seleccion = t.seleccion!
    const tipoAno = t.tipoAnoSeleccion
    const desc =
      tipoAno === 'mundial'
        ? `Te convocan a la selección de ${seleccion.pais} para el Mundial.`
        : tipoAno === 'continental'
          ? `Te convocan a la selección de ${seleccion.pais} para la ${nombreTorneoSeleccion(seleccion.confederacion, tipoAno)}.`
          : `Te convocan a la selección de ${seleccion.pais} para la doble fecha FIFA.`

    return {
      id: `seleccion-${t.numero}`,
      tipo: 'deportivo',
      altoImpacto: false,
      seleccion: true,
      desc,
      opciones: [
        { label: 'Priorizar la convocatoria', variant: 'accept', prioriza: true, efectos: { rendimiento: 1, forma: 'inspirado', equipo: -1 } },
        { label: 'Cuidar tu lugar en el club', variant: 'ghost', prioriza: false, efectos: { rendimiento: 0, forma: 'desanimado', equipo: 1 } },
      ],
    }
  }

  function buildDecisionBatch(edadActual: number): DecisionCard[] {
    const t = temporadaActual.value!
    const esPausaAltoImpacto = t.altoImpactoPausa === t.tramoIndex
    const eventoAltoImpacto = esPausaAltoImpacto ? elegirEventoAltoImpacto() : null

    const eventoPersonal =
      eventoAltoImpacto && eventoAltoImpacto.tipo === 'personal' ? eventoAltoImpacto : elegirEventoPorTipo(edadActual, 'personal')

    const altoImpactoEsDeportivo = Boolean(eventoAltoImpacto) && eventoAltoImpacto!.tipo === 'deportivo'
    const esPausaConvocatoria = !altoImpactoEsDeportivo && t.convocatoriaPausa === t.tramoIndex

    const cardDeportivo = esPausaConvocatoria
      ? construirCardConvocatoria()
      : mapearEventoACard(
          altoImpactoEsDeportivo ? eventoAltoImpacto! : elegirEventoPorTipo(edadActual, 'deportivo'),
          altoImpactoEsDeportivo,
        )

    return [mapearEventoACard(eventoPersonal, eventoPersonal === eventoAltoImpacto), cardDeportivo]
  }

  // ---------------- LESIONES ----------------
  function tramosRestantesEnTemporada(): number {
    return GameConfig.TOTAL_TRAMOS_TEMPORADA - temporadaActual.value!.tramoIndex
  }

  function intentarGenerarLesion(edadActual: number): LesionActiva | null {
    const t = temporadaActual.value!
    if (t.lesionActiva) return null
    if (Math.random() >= GameConfig.probabilidadLesion(edadActual)) return null

    const nivel = GameConfig.elegirNivelLesion()
    const banco = GameEvents.lesiones[nivel]
    const base = GameConfig.randomFrom(banco)
    const tramosDisponibles = tramosRestantesEnTemporada()

    const ovrPerdido = GameConfig.ovrPerdidoPorLesion(nivel)
    if (ovrPerdido > 0) {
      t.ovr = GameConfig.clamp(t.ovr - ovrPerdido, GameConfig.OVR_CARRERA_MIN, GameConfig.OVR_CARRERA_MAX)
    }

    const bloqueaForma = nivel !== 'nivel3'
    if (bloqueaForma) t.forma = 'lesionado'

    t.lesionActiva = {
      nivel,
      nombre: base.nombre,
      descripcion: base.descripcion,
      tramosRestantes: GameConfig.duracionLesion(nivel, tramosDisponibles),
      ovrPerdido,
      bloqueaForma,
    }
    return t.lesionActiva
  }

  // ---------------- OFERTAS ----------------
  // Ofertas de fichaje durante la carrera: clubes nuevos + una carta para
  // el club actual, mezcladas en orden aleatorio. Ver la explicación
  // completa (elegibilidad por ventana de OVR, garantía de "tu entorno",
  // retiro forzoso/voluntario) en el carrera.js original — la lógica
  // acá es la misma, solo con el estado leído desde los refs del store.
  function generarLoteOfertas(): OfertaItem[] {
    const t = temporadaActual.value!
    const ovr = t.ovr
    const edad = getEdadActual()
    const valorActual = t.valorMercado
    const temporadaCerrada = temporadasFinalizadas.value[temporadasFinalizadas.value.length - 1]
    const promedioTemporadaAnterior = temporadaCerrada && temporadaCerrada.partidos > 0 ? temporadaCerrada.promedio : null

    const equipoActual = equipoDe(t.equipoId)
    const ligaActual = ligaDe(equipoActual)

    if (edad >= edadRetiroForzoso.value) {
      return [
        {
          id: `retiro-${Math.random().toString(36).slice(2, 8)}`,
          tipoOferta: 'retiro',
          forzoso: true,
          equipo: equipoActual,
          liga: ligaActual,
          desc: `Le comunicas a ${equipoActual.nombre} tu decisión de retirarte. El club agradece cada minuto que le diste con esta camiseta y te despide como a una leyenda, ${player.value!.apellido}.`,
        },
      ]
    }

    const graciaContrato = esPrimerClub.value ? GameConfig.TEMPORADAS_GRACIA_CONTRATO_PRIMER_CLUB : GameConfig.TEMPORADAS_GRACIA_CONTRATO
    const enGraciaDeContrato = temporadasEnClubActual.value < graciaContrato
    const contratoTerminado = !enGraciaDeContrato && GameConfig.contratoDebeTerminar(equipoActual, ligaActual, ovr, promedioTemporadaAnterior)
    const puedeElegirRetiro = !contratoTerminado && edad >= GameConfig.EDAD_RETIRO_OFERTA

    const disponibles = GameDatabase.equipos.filter((e) => e.id !== t.equipoId)
    const pool = disponibles.length > 0 ? disponibles : GameDatabase.equipos

    const candidatos = pool.map((equipo) => {
      const liga = ligaDe(equipo)
      return { equipo, liga, valorEnClub: GameConfig.valorOfrecidoPorClub(ovr, equipo, liga) }
    })
    const potencialAjustado = GameConfig.potencialAjustadoPorEdad(ovr, edad)
    const poderObjetivoVal = GameConfig.poderObjetivo(potencialAjustado)
    const pesoFn = (c: (typeof candidatos)[number]) =>
      GameConfig.pesoPorCercaniaNivel(GameConfig.poderEquipo(c.equipo, c.liga), GameConfig.poderLiga(c.liga), poderObjetivoVal)

    let elegibles = candidatos.filter(
      (c) => GameConfig.equipoElegibleParaOvr(c.equipo, c.liga, ovr) && GameConfig.ofertaTieneValorRazonable(valorActual, c.valorEnClub),
    )
    if (elegibles.length === 0) {
      elegibles = candidatos.filter((c) => GameConfig.equipoElegibleParaOvr(c.equipo, c.liga, ovr))
    }
    if (elegibles.length === 0) elegibles = candidatos

    const enTransicionRetiro = !contratoTerminado && edad >= edadRetiroForzoso.value - GameConfig.EDAD_RETIRO_TRANSICION
    const cantidadOfertasClub = enTransicionRetiro ? 1 : puedeElegirRetiro ? 2 : 3

    let elegidos: typeof elegibles
    if (cantidadOfertasClub === 3) {
      const enOcaso = edad >= GameConfig.EDAD_OCASO_RETORNO_PAIS
      const filtroLocal = (c: (typeof candidatos)[number]) => (enOcaso ? c.liga.pais === player.value!.pais : c.liga.id === ligaActual.id)
      const locales = elegibles.filter(filtroLocal)

      const tierAlto = GameConfig.gruposTierAlto(elegibles, pesoFn)
      const localesEnTierAlto = tierAlto.filter(filtroLocal)

      let cantidadLocales: number
      let poolLocal: typeof elegibles
      if (localesEnTierAlto.length > 0) {
        cantidadLocales = Math.min(2, localesEnTierAlto.length)
        poolLocal = localesEnTierAlto
      } else if (enOcaso && locales.length > 0 && Math.random() < GameConfig.PROB_OFERTA_NOSTALGICA) {
        cantidadLocales = 1
        poolLocal = locales
      } else {
        cantidadLocales = 0
        poolLocal = []
      }
      elegidos = cantidadLocales > 0 ? GameConfig.elegirMejorEncaje(poolLocal, pesoFn, cantidadLocales) : []

      const usados = new Set(elegidos.map((c) => c.equipo.id))
      const restantes = cantidadOfertasClub - elegidos.length
      if (restantes > 0) {
        const poolRestante = elegibles.filter((c) => !usados.has(c.equipo.id))
        elegidos.push(...GameConfig.elegirMejorEncaje(poolRestante, pesoFn, restantes))
      }
    } else {
      elegidos = GameConfig.elegirMejorEncaje(elegibles, pesoFn, cantidadOfertasClub)
    }

    while (elegidos.length < cantidadOfertasClub && elegibles.length > 0) {
      const usadosFinal = new Set(elegidos.map((c) => c.equipo.id))
      const restante = elegibles.filter((c) => !usadosFinal.has(c.equipo.id))
      const siguiente = GameConfig.elegirMejorEncaje(restante.length > 0 ? restante : elegibles, pesoFn, 1)[0]
      if (siguiente) elegidos.push(siguiente)
    }

    const ofertasClub: OfertaItem[] = elegidos.map(({ equipo, liga, valorEnClub }) => ({
      id: `oferta-${equipo.id}-${Math.random().toString(36).slice(2, 8)}`,
      tipoOferta: 'club',
      equipo,
      liga,
      valorOfrecido: valorEnClub,
      desc: `${equipo.nombre} quiere ficharte para reforzar su plantel en ${liga.nombre}.`,
    }))

    const cartaClubActual: OfertaItem = contratoTerminado
      ? {
          id: `retiro-${Math.random().toString(36).slice(2, 8)}`,
          tipoOferta: 'retiro',
          equipo: equipoActual,
          liga: ligaActual,
          desc: `${equipoActual.nombre} decide no renovarte para la próxima temporada.`,
        }
      : {
          id: `quedarme-${Math.random().toString(36).slice(2, 8)}`,
          tipoOferta: 'quedarme',
          equipo: equipoActual,
          liga: ligaActual,
          desc: `Seguir en ${equipoActual.nombre} y pelear tu lugar en ${ligaActual.nombre}.`,
        }

    const cartaRetiroVoluntario: OfertaItem | null = puedeElegirRetiro
      ? {
          id: `retiro-${Math.random().toString(36).slice(2, 8)}`,
          tipoOferta: 'retiro',
          equipo: equipoActual,
          liga: ligaActual,
          desc: `Con ${edad} años, también puedes colgar los botines y cerrar tu carrera en lo más alto.`,
        }
      : null

    const ofertasBarajadas = GameConfig.muestraAleatoria(ofertasClub, ofertasClub.length)

    if (contratoTerminado) {
      return [cartaClubActual, ...ofertasBarajadas]
    }
    return cartaRetiroVoluntario ? [cartaClubActual, cartaRetiroVoluntario, ...ofertasBarajadas] : [cartaClubActual, ...ofertasBarajadas]
  }

  // ---------------- CHECKPOINTS ----------------
  function iniciarCheckpoint() {
    const t = temporadaActual.value!
    const checkpoint = t.calendario[t.checkpointIndex]
    if (!checkpoint) return

    if (checkpoint.tipo === 'oferta') {
      t.loteActual = generarLoteOfertas()
    } else {
      const lesion = intentarGenerarLesion(getEdadActual())
      t.loteActual = lesion ? [{ esInformeLesion: true, ...lesion }] : buildDecisionBatch(getEdadActual())
    }
  }

  function avanzarCheckpoint() {
    const t = temporadaActual.value!
    t.checkpointIndex++
    if (!t.calendario[t.checkpointIndex]) {
      finalizarTemporada()
      return
    }
    iniciarCheckpoint()
  }

  // ---------------- SIMULACIÓN DE TRAMO ----------------
  function partidosLigaParaTramo(temporada: Temporada, tramoIndex: number): number {
    const estado = temporada.competiciones.liga
    if (!estado.competicion) return 0
    const total = estado.competicion.partidosMinimos
    if (tramoIndex === GameConfig.TOTAL_TRAMOS_TEMPORADA - 1) return Math.max(0, total - estado.partidosJugados)
    return Math.round(total / GameConfig.TOTAL_TRAMOS_TEMPORADA)
  }

  function resolverKnockout(
    estado: EstadoCompeticionEliminatoria | null,
    tramoIndex: number,
    tramoMinimos: number,
    fuerza: number,
  ): { partidos: number; mensaje: string | null } {
    if (!estado) return { partidos: 0, mensaje: null }

    if (tramoIndex === tramoMinimos) {
      estado.minimosJugados = true
      estado.partidosJugados += estado.competicion.partidosMinimos
      return { partidos: estado.competicion.partidosMinimos, mensaje: null }
    }

    const indiceRonda = tramoIndex - tramoMinimos - 1
    if (tramoIndex <= tramoMinimos || estado.eliminado || indiceRonda >= estado.rondasExtra.length) {
      return { partidos: 0, mensaje: null }
    }

    const partidosRonda = estado.rondasExtra[indiceRonda] as number
    const avanza = Math.random() < GameConfig.probAvanzarRonda(fuerza)
    estado.partidosJugados += partidosRonda

    if (!avanza) {
      estado.eliminado = true
      return { partidos: partidosRonda, mensaje: `Quedaste eliminado de la ${estado.competicion.nombre}.` }
    }

    const esUltimaRonda = indiceRonda === estado.rondasExtra.length - 1
    if (esUltimaRonda) {
      estado.llegoALaFinal = true
      return { partidos: partidosRonda, mensaje: `¡Llegaste a la final de la ${estado.competicion.nombre}!` }
    }
    return { partidos: partidosRonda, mensaje: `Avanzaste de ronda en la ${estado.competicion.nombre}.` }
  }

  function simularTramoYAvanzar() {
    const t = temporadaActual.value!
    const equipo = equipoDe(t.equipoId)
    const liga = ligaDe(equipo)
    const grupo = GameConfig.GRUPOS_POSICION[player.value!.posicion] ?? 'medio'
    const tramoIndex = t.tramoIndex

    const fuerza = GameConfig.calcularFuerzaCampana(
      equipo,
      liga,
      t.forma,
      t.equipoAcumuladoTemporada,
      t.partidos > 0 ? t.promedio : null,
    )

    const partidosLiga = partidosLigaParaTramo(t, tramoIndex)
    t.competiciones.liga.partidosJugados += partidosLiga

    const resCopaNacional = resolverKnockout(t.competiciones.copaNacional, tramoIndex, 0, fuerza)
    const resCopaInternacional = resolverKnockout(t.competiciones.copaInternacional, tramoIndex, 1, fuerza)

    const partidosClub = partidosLiga + resCopaNacional.partidos + resCopaInternacional.partidos

    const estabaLesionado = Boolean(t.lesionActiva)
    const esTitularEsteTramo = estabaLesionado ? false : GameConfig.calcularTitular(t.pesoTitular, t.ovr, t.bufferRendimiento)
    let partidosJugador: number
    if (estabaLesionado) {
      partidosJugador = 0
    } else {
      const probJugar = GameConfig.probabilidadJugar(t.ovr, t.bufferRendimiento, t.forma, esTitularEsteTramo)
      partidosJugador = GameConfig.clamp(GameConfig.redondeoEstocastico(partidosClub * probJugar), 0, partidosClub)
    }

    const resultado = GameConfig.simularTramo({
      partidos: partidosJugador,
      grupo,
      ovr: t.ovr,
      rendimientoAcumulado: t.bufferRendimiento,
      fuerzaLiga: liga.fuerza,
      factorTalento: factorTalento.value,
    })

    t.partidos += partidosJugador
    t.goles += resultado.goles
    t.asistencias += resultado.asistencias
    t.mvp += resultado.mvp
    t.sumaRating += resultado.sumaRating
    t.promedio = t.partidos > 0 ? t.sumaRating / t.partidos : 0

    const ratingTramo = partidosJugador > 0 ? resultado.sumaRating / partidosJugador : null
    t.pesoTitular = GameConfig.ajustarPesoTitular(t.pesoTitular, ratingTramo, estabaLesionado)

    t.ovr = GameConfig.ajustarOvrTramo(t.ovr, t.bufferRendimiento, getEdadActual(), factorTalento.value, potencialTecho.value)
    t.titular = esTitularEsteTramo
    t.equipoAcumuladoTemporada += t.bufferEquipo
    t.valorMercado = GameConfig.calcularValorMercado(t.ovr, equipo, liga)
    t.tramoIndex++

    const estadoLiga = t.competiciones.liga
    t.progreso = estadoLiga.competicion
      ? GameConfig.clamp(Math.round((estadoLiga.partidosJugados / estadoLiga.competicion.partidosMinimos) * 100), 0, 100)
      : Math.round(((tramoIndex + 1) / GameConfig.TOTAL_TRAMOS_TEMPORADA) * 100)

    let mensajeLesion: string | null = null
    if (estabaLesionado && t.lesionActiva) {
      t.lesionActiva.tramosRestantes--
      if (t.lesionActiva.tramosRestantes <= 0) {
        const ovrRecuperado = Math.round(t.lesionActiva.ovrPerdido * GameConfig.LESION_RECUPERACION_OVR)
        if (ovrRecuperado > 0) {
          t.ovr = GameConfig.clamp(t.ovr + ovrRecuperado, GameConfig.OVR_CARRERA_MIN, GameConfig.OVR_CARRERA_MAX)
        }
        mensajeLesion = `Te recuperaste de tu lesión (${t.lesionActiva.nombre})${ovrRecuperado > 0 ? ` — recuperás ${ovrRecuperado} OVR` : ''}.`
        if (t.lesionActiva.bloqueaForma) t.forma = 'regular'
        t.lesionActiva = null
      }
    }

    const mensajesTramo = [resCopaNacional.mensaje, resCopaInternacional.mensaje, mensajeLesion].filter(
      (m): m is string => Boolean(m),
    )
    if (mensajesTramo.length > 0) mensajes.value.push(mensajesTramo.join(' '))

    t.bufferRendimiento = 0
    t.bufferEquipo = 0

    // Se demora el paso al siguiente checkpoint hasta que termina la
    // animación del spotlight (ver useAnimatedNumber) — igual que el
    // setTimeout(avanzarCheckpoint, ANIMACION_TRAMO_MS + 150) del original,
    // para que la próxima tanda de decisiones no aparezca a mitad de la
    // interpolación y la corte de golpe.
    setTimeout(() => {
      avanzarCheckpoint()
      guardar()
    }, GameConfig.ANIMACION_TRAMO_MS + 150)
  }

  // ---------------- PREMIOS MUNDIALES ----------------
  function generarCandidatosPremiosMundiales() {
    const ligasConCompeticion = GameDatabase.ligas
      .map((liga) => ({
        liga,
        competicion: GameDatabase.competiciones.find((c) => c.tipo === 'domestica' && c.categoria === 'liga' && c.ligaId === liga.id),
      }))
      .filter((x): x is { liga: Liga; competicion: Competicion } => Boolean(x.competicion))
    if (ligasConCompeticion.length === 0) return []

    const candidatos: { liga: Liga; equipo: Equipo; grupo: string; ovr: number; goles: number; asistencias: number; promedio: number; ganoTrofeo: boolean }[] = []
    for (let i = 0; i < GameConfig.PREMIOS_CANDIDATOS_N; i++) {
      const elegido = GameConfig.elegirPonderado(ligasConCompeticion, (x) => x.liga.fuerza, 1)[0]
      if (!elegido) continue
      const { liga, competicion } = elegido
      const equiposLiga = GameDatabase.equipos.filter((e) => e.ligaId === liga.id)
      const equipo = equiposLiga.length > 0 ? GameConfig.elegirPonderado(equiposLiga, (e) => e.fuerza, 1)[0] : null
      if (!equipo) continue

      const grupo = GameConfig.sortearGrupoCandidatoPremio()
      const ovr = GameConfig.sortearOvrCandidatoPremio()
      const factorTalentoCandidato = GameConfig.sortearFactorTalento()
      const resultado = GameConfig.simularTramo({
        partidos: competicion.partidosMinimos,
        grupo,
        ovr,
        rendimientoAcumulado: 0,
        fuerzaLiga: liga.fuerza,
        factorTalento: factorTalentoCandidato,
      })
      const ganoTrofeo = Math.random() < GameConfig.probGanarLiga(GameConfig.calidadFuerzaClub(equipo, liga))

      candidatos.push({
        liga,
        equipo,
        grupo,
        ovr,
        goles: resultado.goles,
        asistencias: resultado.asistencias,
        promedio: competicion.partidosMinimos > 0 ? resultado.sumaRating / competicion.partidosMinimos : 0,
        ganoTrofeo,
      })
    }
    return candidatos
  }

  function evaluarPremiosMundiales(
    candidatos: ReturnType<typeof generarCandidatosPremiosMundiales>,
    ganasteTrofeoDeEquipoOSeleccion: boolean,
  ): string[] {
    const t = temporadaActual.value!
    const mensajesLocal: string[] = []
    if (t.partidos === 0 || candidatos.length === 0) return mensajesLocal

    const grupoJugador = GameConfig.GRUPOS_POSICION[player.value!.posicion] ?? 'medio'

    const mejorGoleador = candidatos.reduce((mejor, c) => (c.goles > mejor.goles ? c : mejor))
    if (t.goles >= mejorGoleador.goles) {
      t.trofeos.push({ nombre: 'Bota de Oro', imagen: 'bota-de-oro.png' })
      mensajesLocal.push('¡Ganaste la Bota de Oro como máximo goleador del mundo!')
    } else {
      const puesto = candidatos.filter((c) => c.goles > t.goles).length + 1
      if (puesto <= 3) {
        mensajesLocal.push(`Terminaste ${puesto}° en la Bota de Oro, detrás de un delantero de ${mejorGoleador.equipo.nombre} con ${mejorGoleador.goles} goles.`)
      }
    }

    const candidatosMismoGrupo = candidatos.filter((c) => c.grupo === grupoJugador)
    if (candidatosMismoGrupo.length > 0) {
      const mejorDelGrupo = candidatosMismoGrupo.reduce((mejor, c) => (c.promedio > mejor.promedio ? c : mejor))
      if (t.promedio >= mejorDelGrupo.promedio - GameConfig.ONCE_IDEAL_MARGEN_PROMEDIO) {
        t.trofeos.push({ nombre: 'Once Ideal', imagen: 'once-ideal.png' })
        mensajesLocal.push('¡Entraste al Once Ideal del año!')
      }
    }

    const calidadJugador = GameConfig.calcularCalidadBalonDeOro(t.promedio, t.goles + t.asistencias, ganasteTrofeoDeEquipoOSeleccion)
    const mejorCalidad = candidatos.reduce((mejor, c) => {
      const calidad = GameConfig.calcularCalidadBalonDeOro(c.promedio, c.goles + c.asistencias, c.ganoTrofeo)
      return calidad > mejor ? calidad : mejor
    }, -1)
    if (calidadJugador >= mejorCalidad) {
      t.trofeos.push({ nombre: 'Balón de Oro', imagen: 'balon-de-oro.png' })
      mensajesLocal.push('¡Ganaste el Balón de Oro, el mejor jugador del mundo esta temporada!')
    }

    return mensajesLocal
  }

  // ---------------- CIERRE DE TEMPORADA ----------------
  function finalizarTemporada() {
    const t = temporadaActual.value!
    const equipo = equipoDe(t.equipoId)
    const liga = ligaDe(equipo)
    const fuerza = GameConfig.calcularFuerzaCampana(equipo, liga, t.forma, t.equipoAcumuladoTemporada, t.partidos > 0 ? t.promedio : null)
    // Título de liga y final de copa internacional pesan mucho más la
    // calidad real del club que la campaña compartida (ver el comentario
    // de calcularFuerzaTitulo) — la copa nacional y la clasificación a
    // torneos internacionales de la próxima temporada siguen usando `fuerza`.
    const fuerzaTitulo = GameConfig.calcularFuerzaTitulo(equipo, liga, t.forma, t.equipoAcumuladoTemporada, t.partidos > 0 ? t.promedio : null)
    const mensajesFinales: string[] = []

    const ganasteLiga = Math.random() < GameConfig.probGanarLiga(fuerzaTitulo)
    if (ganasteLiga && t.competiciones.liga.competicion) {
      const comp = t.competiciones.liga.competicion
      t.trofeos.push({ nombre: comp.nombre, imagen: comp.trofeoImagen })
      mensajesFinales.push(`¡Campeón de ${comp.nombre}!`)
    }

    const copaNacional = t.competiciones.copaNacional
    let ganasteCopaNacional = false
    if (copaNacional && copaNacional.llegoALaFinal) {
      ganasteCopaNacional = Math.random() < GameConfig.probGanarCopa(fuerza)
      if (ganasteCopaNacional) {
        t.trofeos.push({ nombre: copaNacional.competicion.nombre, imagen: copaNacional.competicion.trofeoImagen })
        mensajesFinales.push(`¡Campeón de ${copaNacional.competicion.nombre}!`)
      } else {
        mensajesFinales.push(`Fuiste subcampeón de la ${copaNacional.competicion.nombre}.`)
      }
    }

    const copaInternacional = t.competiciones.copaInternacional
    if (copaInternacional && copaInternacional.llegoALaFinal) {
      if (Math.random() < GameConfig.probGanarLiga(fuerzaTitulo)) {
        t.trofeos.push({ nombre: copaInternacional.competicion.nombre, imagen: copaInternacional.competicion.trofeoImagen })
        mensajesFinales.push(`¡Campeón de ${copaInternacional.competicion.nombre}!`)
      } else {
        mensajesFinales.push(`Fuiste subcampeón de la ${copaInternacional.competicion.nombre}.`)
      }
    }

    const ganasteTrofeoDeEquipoOSeleccion = t.trofeos.length > 0
    const candidatosPremios = generarCandidatosPremiosMundiales()
    mensajesFinales.push(...evaluarPremiosMundiales(candidatosPremios, ganasteTrofeoDeEquipoOSeleccion))

    let clasificacionProxima: 'primerNivel' | 'segundoNivel' | null = null
    if (ganasteLiga || fuerza >= GameConfig.UMBRAL_CLASIFICA_PRIMER_NIVEL) {
      clasificacionProxima = 'primerNivel'
    } else if (fuerza >= GameConfig.UMBRAL_CLASIFICA_SEGUNDO_NIVEL || ganasteCopaNacional) {
      clasificacionProxima = 'segundoNivel'
    }

    temporadasEnClubActual.value++

    t.enCurso = false
    t.progreso = 100
    const numeroCerrada = t.numero
    temporadasFinalizadas.value.push(t)

    const ovrHeredado = t.ovr
    const equipoAcumuladoCerrado = t.equipoAcumuladoTemporada
    const pesoTitularCerrado = t.pesoTitular
    temporadaActual.value = crearTemporada(
      numeroCerrada + 1,
      t.equipoId,
      ovrHeredado,
      GameConfig.calcularValorMercado(ovrHeredado, equipo, liga),
      clasificacionProxima,
      pesoTitularCerrado,
    )

    puedeSolicitarNumero.value = true
    contextoSolicitudNumero.value = { ovr: ovrHeredado, rendimiento: equipoAcumuladoCerrado }

    if (mensajesFinales.length > 0) mensajes.value.push(mensajesFinales.join(' '))

    iniciarCheckpoint()
    guardar()
  }

  // ---------------- SELECCIÓN NACIONAL ----------------
  function resolverParticipacionSeleccion(prioriza: boolean): { mensaje: string } | null {
    const t = temporadaActual.value!
    const seleccion = t.seleccion
    if (!prioriza || !seleccion) return null

    const tipoAno = t.tipoAnoSeleccion
    const calidad = GameConfig.calidadSeleccion(seleccion.fuerza, t.forma)

    let partidos: number
    let mensaje: string

    if (!tipoAno) {
      partidos = GameConfig.randomInt(GameConfig.PARTIDOS_AMISTOSO_SELECCION_MIN, GameConfig.PARTIDOS_AMISTOSO_SELECCION_MAX)
      mensaje = `Jugaste ${partidos} amistosos con ${seleccion.pais}.`
    } else {
      const nombreTorneo = nombreTorneoSeleccion(seleccion.confederacion, tipoAno)
      const partidosEliminatorias = GameConfig.randomInt(GameConfig.PARTIDOS_ELIMINATORIAS_MIN, GameConfig.PARTIDOS_ELIMINATORIAS_MAX)
      const clasifico = Math.random() < GameConfig.probClasificarTorneoSeleccion(calidad)
      partidos = partidosEliminatorias
      if (!clasifico) {
        mensaje = `Jugaste ${partidosEliminatorias} partidos de eliminatorias, pero ${seleccion.pais} no logró clasificarse a la ${nombreTorneo} esta vez.`
      } else {
        partidos += GameConfig.PARTIDOS_FASE_DE_GRUPOS_SELECCION
        const avanzaGrupos = Math.random() < GameConfig.probAvanzarFaseDeGruposSeleccion(calidad)
        if (!avanzaGrupos) {
          mensaje = `Clasificaste a la ${nombreTorneo} con ${seleccion.pais} tras ${partidosEliminatorias} partidos de eliminatorias, pero quedaste eliminado en la fase de grupos.`
        } else {
          const totalRondas = tipoAno === 'mundial' ? GameConfig.RONDAS_KO_MUNDIAL : GameConfig.RONDAS_KO_CONTINENTAL
          const rondas = GameConfig.NOMBRES_RONDA_KO[totalRondas] as string[]
          let rondasSuperadas = 0
          while (rondasSuperadas < rondas.length && Math.random() < GameConfig.probAvanzarRonda(calidad)) {
            rondasSuperadas++
            partidos++
          }
          if (rondasSuperadas === rondas.length) {
            const competicion = buscarCompeticionSeleccion(seleccion.confederacion, tipoAno)
            if (competicion) t.trofeos.push({ nombre: competicion.nombre, imagen: competicion.trofeoImagen })
            mensaje = `¡Campeón de la ${nombreTorneo} con ${seleccion.pais}!`
          } else if (rondasSuperadas === rondas.length - 1) {
            mensaje = `Fuiste subcampeón de la ${nombreTorneo} con ${seleccion.pais}.`
          } else {
            mensaje = `Quedaste eliminado en ${rondas[rondasSuperadas]} de la ${nombreTorneo} con ${seleccion.pais}.`
          }
        }
      }
    }

    const grupo = GameConfig.GRUPOS_POSICION[player.value!.posicion] ?? 'medio'
    const { goles } = GameConfig.simularTramo({
      partidos,
      grupo,
      ovr: t.ovr,
      rendimientoAcumulado: t.bufferRendimiento,
      fuerzaLiga: seleccion.fuerza,
      factorTalento: factorTalento.value,
    })
    t.seleccionPartidos += partidos
    t.seleccionGoles += goles
    if (goles > 0) mensaje += ` Anotaste ${goles} gol${goles === 1 ? '' : 'es'}.`

    return { mensaje }
  }

  // ---------------- RESOLVER DECISIONES / OFERTAS ----------------
  function resolveDecisionEvento(id: string, optionIdx: number) {
    const t = temporadaActual.value!
    const decision = t.loteActual.find((d) => 'id' in d && d.id === id) as DecisionCard | undefined
    if (!decision) return
    const option = decision.opciones[optionIdx]
    if (!option) return

    if (!(t.lesionActiva && t.lesionActiva.bloqueaForma)) {
      t.forma = GameConfig.acumularForma(t.forma, option.efectos.forma)
    }
    t.bufferRendimiento += option.efectos.rendimiento
    t.bufferEquipo += option.efectos.equipo

    if (decision.seleccion) {
      const resultado = resolverParticipacionSeleccion(Boolean(option.prioriza))
      if (resultado) mensajes.value.push(resultado.mensaje)
    }

    t.loteActual = t.loteActual.filter((d) => !('id' in d && d.id === id))

    if (t.loteActual.length === 0) {
      simularTramoYAvanzar()
    }
    guardar()
  }

  function resolveOferta(item: OfertaItem) {
    const t = temporadaActual.value!

    if (item.tipoOferta === 'retiro') {
      t.loteActual = []
      finalizarCarrera()
      return
    }

    if (item.tipoOferta === 'club') {
      t.equipoId = item.equipo.id
      t.competiciones = inicializarCompeticionesTemporada(item.equipo.id, null)
      temporadasEnClubActual.value = 0
      esPrimerClub.value = false
      t.titular = false
      t.pesoTitular = GameConfig.PESO_TITULAR_INICIAL
      t.forma = 'regular'
      t.valorMercado = GameConfig.calcularValorMercado(t.ovr, item.equipo, item.liga)
    }

    t.loteActual = []
    avanzarCheckpoint()
    guardar()
  }

  // ---------------- CAMBIO DE DORSAL ----------------
  function confirmarCambioNumero(nuevoNumero: number): boolean {
    if (!contextoSolicitudNumero.value || !player.value) return false
    if (Number.isNaN(nuevoNumero) || nuevoNumero < 1 || nuevoNumero > 99) {
      mensajes.value.push('Elige un número entre 1 y 99.')
      return false
    }

    const { ovr, rendimiento } = contextoSolicitudNumero.value
    const aceptado = Math.random() < GameConfig.probabilidadAceptarCambioNumero(ovr, rendimiento)

    puedeSolicitarNumero.value = false
    contextoSolicitudNumero.value = null

    if (aceptado) {
      player.value.numero = nuevoNumero
      mensajes.value.push(`El club aprueba tu pedido: ahora usas la ${nuevoNumero}.`)
    } else {
      mensajes.value.push(`El club rechaza tu pedido de cambio de dorsal — sigues con la ${player.value.numero}.`)
    }
    guardar()
    return aceptado
  }

  // ---------------- FIN DE CARRERA ----------------
  function finalizarCarrera() {
    const t = temporadaActual.value
    if (!t || !player.value) return
    carreraFinalizada.value = true
    t.enCurso = false
    temporadasFinalizadas.value.push(t)
    puedeSolicitarNumero.value = false
    mensajes.value.push(`${player.value.apellido} se retira del fútbol profesional.`)
    guardar()
  }

  function construirResumenCarrera(): ResumenCarrera {
    const filas = temporadasFinalizadas.value

    const clubesVistos = new Set<string>()
    const clubes: Equipo[] = []
    filas.forEach((s) => {
      if (!clubesVistos.has(s.equipoId)) {
        clubesVistos.add(s.equipoId)
        clubes.push(equipoDe(s.equipoId))
      }
    })

    let partidos = 0,
      goles = 0,
      asistencias = 0,
      mvp = 0,
      sumaRating = 0
    let seleccionPartidos = 0,
      seleccionGoles = 0
    let mayorOvr = 0,
      mayorValor = 0
    const trofeosPorNombre = new Map<string, { nombre: string; imagen: string | null; cantidad: number }>()
    const numerosTemporada = new Set<number>()
    const serieOvr = filas.map((s) => ({ numero: s.numero, ovr: s.ovr }))

    filas.forEach((s) => {
      partidos += s.partidos
      goles += s.goles
      asistencias += s.asistencias
      mvp += s.mvp
      sumaRating += s.sumaRating
      seleccionPartidos += s.seleccionPartidos || 0
      seleccionGoles += s.seleccionGoles || 0
      if (s.ovr > mayorOvr) mayorOvr = s.ovr
      if (s.valorMercado > mayorValor) mayorValor = s.valorMercado
      numerosTemporada.add(s.numero)
      ;(s.trofeos || []).forEach((tr) => {
        const existente = trofeosPorNombre.get(tr.nombre)
        if (existente) existente.cantidad++
        else trofeosPorNombre.set(tr.nombre, { nombre: tr.nombre, imagen: tr.imagen, cantidad: 1 })
      })
    })

    return {
      clubes,
      partidos,
      goles,
      asistencias,
      mvp,
      promedio: partidos > 0 ? sumaRating / partidos : 0,
      seleccionPartidos,
      seleccionGoles,
      mayorOvr,
      mayorValor,
      ovrDebut: serieOvr.length > 0 ? (serieOvr[0]?.ovr ?? 0) : 0,
      serieOvr,
      trofeos: [...trofeosPorNombre.values()],
      temporadasJugadas: numerosTemporada.size,
      edadRetiro: getEdadActual(),
    }
  }

  // ---------------- GUARDADO DE PARTIDA (localStorage) ----------------
  function guardar() {
    if (typeof localStorage === 'undefined') return
    try {
      const snapshot = {
        player: player.value,
        temporadaActual: temporadaActual.value,
        temporadasFinalizadas: temporadasFinalizadas.value,
        temporadasEnClubActual: temporadasEnClubActual.value,
        esPrimerClub: esPrimerClub.value,
        edadRetiroForzoso: edadRetiroForzoso.value,
        factorTalento: factorTalento.value,
        potencialTecho: potencialTecho.value,
        carreraFinalizada: carreraFinalizada.value,
        eventosUsados: [...eventosUsados.value],
        puedeSolicitarNumero: puedeSolicitarNumero.value,
        contextoSolicitudNumero: contextoSolicitudNumero.value,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
    } catch {
      // localStorage puede fallar (privado, cuota llena, etc.) — la
      // carrera sigue jugable en memoria, solo no persiste.
    }
  }

  function hayCarreraGuardada(): boolean {
    if (typeof localStorage === 'undefined') return false
    try {
      return localStorage.getItem(STORAGE_KEY) !== null
    } catch {
      return false
    }
  }

  function cargar(): boolean {
    if (typeof localStorage === 'undefined') return false
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return false
      const snapshot = JSON.parse(raw) as {
        player: Player | null
        temporadaActual: Temporada | null
        temporadasFinalizadas: Temporada[]
        temporadasEnClubActual: number
        esPrimerClub: boolean
        edadRetiroForzoso: number
        factorTalento: number
        potencialTecho: number
        carreraFinalizada: boolean
        eventosUsados: string[]
        puedeSolicitarNumero: boolean
        contextoSolicitudNumero: ContextoSolicitudNumero | null
      }
      player.value = snapshot.player
      temporadaActual.value = snapshot.temporadaActual
      temporadasFinalizadas.value = snapshot.temporadasFinalizadas
      temporadasEnClubActual.value = snapshot.temporadasEnClubActual
      esPrimerClub.value = snapshot.esPrimerClub
      edadRetiroForzoso.value = snapshot.edadRetiroForzoso
      factorTalento.value = snapshot.factorTalento
      potencialTecho.value = snapshot.potencialTecho
      carreraFinalizada.value = snapshot.carreraFinalizada
      eventosUsados.value = new Set(snapshot.eventosUsados)
      puedeSolicitarNumero.value = snapshot.puedeSolicitarNumero
      contextoSolicitudNumero.value = snapshot.contextoSolicitudNumero
      return true
    } catch {
      return false
    }
  }

  function limpiarPartidaGuardada() {
    if (typeof localStorage === 'undefined') return
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // sin efecto si localStorage no está disponible
    }
  }

  return {
    // estado
    player,
    temporadaActual,
    temporadasFinalizadas,
    temporadasEnClubActual,
    esPrimerClub,
    edadRetiroForzoso,
    factorTalento,
    potencialTecho,
    carreraFinalizada,
    puedeSolicitarNumero,
    contextoSolicitudNumero,
    mensajes,
    // getters
    carreraIniciada,
    getEdadActual,
    // acciones
    iniciarCarrera,
    simularTramoYAvanzar,
    resolveDecisionEvento,
    resolveOferta,
    confirmarCambioNumero,
    finalizarCarrera,
    construirResumenCarrera,
    guardar,
    cargar,
    hayCarreraGuardada,
    limpiarPartidaGuardada,
  }
})
