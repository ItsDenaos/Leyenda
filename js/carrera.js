// ---------- HELPERS DE BASE DE DATOS ----------
function equipoDe(temporada) {
  return GameDatabase.equipos.find((e) => e.id === temporada.equipoId);
}
function ligaDe(equipo) {
  return GameDatabase.ligas.find((l) => l.id === equipo.ligaId);
}

// ---------- JUGADOR (desde localStorage, con fallback demo) ----------
const DEFAULT_PLAYER = {
  apellido: "APELLIDO",
  numero: 10,
  edad: GameConfig.EDAD_MIN,
  pais: "Argentina",
  flag: "🇦🇷",
  paisCode: "ar",
  posicion: "DC",
};

function loadPlayer() {
  try {
    const raw = localStorage.getItem("leyendaPlayer");
    if (!raw) return DEFAULT_PLAYER;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_PLAYER, ...parsed };
  } catch {
    return DEFAULT_PLAYER;
  }
}

const POSITION_NAMES = {
  POR: "Portero", DFC: "Defensor Central", LI: "Lateral Izquierdo", LD: "Lateral Derecho",
  MCD: "Mediocampista Defensivo", MC: "Mediocampista Central", MI: "Mediocampista Izquierdo",
  MD: "Mediocampista Derecho", MCO: "Mediocampista Ofensivo", EI: "Extremo Izquierdo",
  ED: "Extremo Derecho", DC: "Delantero Centro",
};

// Niveles de OVR, de metal a gema (bronce → plata → oro → rubí →
// esmeralda → amatista), proporcionales al rango real de la carrera
// (OVR_CARRERA_MIN..MAX = 45..99). Las gemas quedan reservadas al tramo
// de élite (90+); "oro" reutiliza el dorado que ya usa el resto de la UI.
function ovrTierColor(ovr) {
  if (ovr >= 96) return "#a855f7"; // amatista
  if (ovr >= 93) return "#2ecc71"; // esmeralda
  if (ovr >= 90) return "#e0245e"; // rubí
  if (ovr >= 80) return "#ffb703"; // oro
  if (ovr >= 66) return "#c0c6d1"; // plata
  return "#cd7f32"; // bronce
}

function formatMarketValue(value) {
  if (value >= 1000000) return `€${(value / 1000000).toFixed(1).replace(/\.0$/, "")}M`;
  if (value >= 1000) return `€${Math.round(value / 1000)}K`;
  return `€${value}`;
}

// ============================================================
// COMPETICIONES DE LA TEMPORADA
// Cada temporada juega su liga + su copa nacional siempre, y una copa
// internacional solo si clasificó la temporada anterior (ver
// finalizarTemporada). El avance en las competiciones eliminatorias
// (copa nacional/internacional) se resuelve ronda por ronda a medida
// que se simulan los tramos — ver resolverKnockout más abajo.
// ============================================================
function buscarCompeticionDomestica(ligaId, categoria) {
  return GameDatabase.competiciones.find((c) => c.tipo === "domestica" && c.categoria === categoria && c.ligaId === ligaId) ?? null;
}
function buscarCompeticionInternacional(confederacion, categoria) {
  return GameDatabase.competiciones.find((c) => c.tipo === "internacional" && c.categoria === categoria && c.confederacion === confederacion) ?? null;
}

// Reparte `total` en `partes` enteras que suman exactamente `total`
// (la última parte absorbe el resto del redondeo).
function repartirEnPartes(total, partes) {
  const base = Math.floor(total / partes);
  const resultado = new Array(partes).fill(base);
  resultado[partes - 1] = total - base * (partes - 1);
  return resultado;
}

// Estado de una competición eliminatoria (copa nacional o internacional):
// `rondasExtra` reparte los partidosExtra de la competición en tantas
// rondas como checkpoints haya disponibles para jugarlas.
function estadoCompeticionEliminatoria(competicion, numRondasExtra) {
  if (!competicion) return null;
  return {
    competicion,
    minimosJugados: false,
    eliminado: false,
    llegoALaFinal: false,
    partidosJugados: 0,
    rondasExtra: repartirEnPartes(competicion.partidosExtra, numRondasExtra),
  };
}

function inicializarCompeticionesTemporada(equipoId, clasificacionInternacional) {
  const equipo = GameDatabase.equipos.find((e) => e.id === equipoId);
  const liga = ligaDe(equipo);

  const copaNacionalComp = buscarCompeticionDomestica(liga.id, "copa");
  const copaInternacionalComp = clasificacionInternacional
    ? buscarCompeticionInternacional(liga.confederacion, clasificacionInternacional)
    : null;

  const ultimoTramo = GameConfig.TOTAL_TRAMOS_TEMPORADA - 1;
  return {
    liga: { competicion: buscarCompeticionDomestica(liga.id, "liga"), partidosJugados: 0 },
    // Rondas extra disponibles después de la 1ra ronda garantizada (que se
    // juega en el tramo 0): un checkpoint por cada tramo restante.
    copaNacional: estadoCompeticionEliminatoria(copaNacionalComp, ultimoTramo),
    // La fase de grupos/liga, garantizada, se juega en el tramo 1 — quedan
    // los tramos siguientes para las rondas de eliminación.
    copaInternacional: estadoCompeticionEliminatoria(copaInternacionalComp, ultimoTramo - 1),
  };
}

// ============================================================
// MOTOR DE TEMPORADA
// Una temporada "vive" mientras la página esté abierta: no hay
// guardado persistente (juego web, sin partida guardada).
// ============================================================
function crearTemporada(numero, equipoId, ovr, valorMercado, clasificacionInternacional) {
  return {
    numero,
    anio: String(new Date().getFullYear() + (numero - 1)),
    equipoId,
    ovr,
    partidos: 0,
    goles: 0,
    asistencias: 0,
    mvp: 0,
    sumaRating: 0, // interno, para recalcular el promedio
    promedio: 0,
    valorMercado,
    trofeos: [],
    forma: "regular",
    titular: false,
    progreso: 0,
    enCurso: true,
    calendario: GameConfig.crearCalendarioTemporada(numero),
    checkpointIndex: 0,
    tramoIndex: 0, // 0..(TOTAL_TRAMOS_TEMPORADA-1), cuál tramo de la temporada
    // Máximo 1 evento de Alto Impacto por temporada, con 30% de chance:
    // se sortea acá mismo en qué pausa de evento caerá, si es que cae.
    altoImpactoPausa: Math.random() < 0.3 ? GameConfig.randomInt(0, GameConfig.TOTAL_TRAMOS_TEMPORADA - 1) : null,
    lesionActiva: null, // { nivel, nombre, descripcion, tramosRestantes, ovrPerdido, bloqueaForma } | null
    loteActual: [],
    bufferRendimiento: 0, // efecto acumulado del tramo actual (aún sin aplicar)
    bufferEquipo: 0,
    equipoAcumuladoTemporada: 0, // "variables de la temporada": cómo viene el año colectivamente
    competiciones: inicializarCompeticionesTemporada(equipoId, clasificacionInternacional),
  };
}

// Ofertas de fichaje durante la carrera: clubes nuevos + una carta para el
// club actual, mezcladas en orden aleatorio. Cada tarjeta tiene una sola
// acción (un clic y se resuelve toda la pausa), en vez de tener que
// rechazar una por una para poder quedarte donde estás.
//
// Solo pueden ofertar los clubes cuya "ventana de OVR" incluye tu nivel
// actual (exclusión dura, no solo menos probable) — un club chico deja
// de aparecer una vez que eres demasiado bueno para él, y uno grande no
// aparece hasta que estás a su altura. Además, el valor que tendrías en
// ese club (misma fórmula que el valor de mercado real) tiene que ser
// razonable frente a tu valor actual — si ficharte ahí implicara un
// desplome, ese club no está realmente a tu altura aunque el margen de
// OVR lo deje pasar. Dentro de los elegibles, ya no se sortea parejo
// entre todos: se prioriza el grupo que mejor encaja con tu nivel real,
// así que si tu nivel da para los grandes, van a ser los grandes los que
// aparezcan. Al menos 2 de las 3 ofertas salen siempre de tu propia
// liga (cuando hay candidatos ahí) — el resto queda libre, incluso para
// apuntar al exterior.
//
// Retiro: si el club actual ya no puede sostenerte (tu OVR cayó por
// debajo de lo que ese nivel de club/liga tolera), no renueva — la carta
// de "quedarme" se reemplaza por la de retirarte. Además, desde
// EDAD_RETIRO_OFERTA el propio jugador puede elegir retirarse aunque su
// club lo siga queriendo, ocupando una de las cartas de oferta — en ese
// caso solo quedan 2 cupos de club y ahí no hay garantía de liga local,
// queda 100% libre.
//
// Retiro forzoso: a partir de `edadRetiroForzoso` (sorteada una sola vez
// por carrera, ver más abajo) ya no hay ofertas de ningún tipo — no
// importa el nivel del club actual ni el OVR, la única carta es
// retirarte. Es la única parte de esto que no depende de qué tan bien
// te haya ido.
function generarLoteOfertas(equipoActualId, ovr, edad, valorActual) {
  const equipoActual = GameDatabase.equipos.find((e) => e.id === equipoActualId);
  const ligaActual = ligaDe(equipoActual);

  if (edad >= edadRetiroForzoso) {
    return [{
      id: `retiro-${Math.random().toString(36).slice(2, 8)}`,
      tipoOferta: "retiro",
      forzoso: true,
      equipo: equipoActual,
      liga: ligaActual,
      desc: `Le comunicas a ${equipoActual.nombre} tu decisión de retirarte. El club agradece cada minuto que le diste con esta camiseta y te despide como a una leyenda, ${player.apellido}.`,
    }];
  }

  // En gracia (recién llegado a este club, ver temporadasEnClubActual),
  // el club nunca puede "no renovarte" — sin esto, cualquier club de
  // nivel medio/alto para arriba te dejaría ir en tu primera ventana de
  // traspasos, antes de tener una sola temporada para demostrar algo
  // (un novato jamás arranca con el OVR de un jugador hecho).
  const enGraciaDeContrato = temporadasEnClubActual < GameConfig.TEMPORADAS_GRACIA_CONTRATO;
  const contratoTerminado = !enGraciaDeContrato && GameConfig.contratoDebeTerminar(equipoActual.nivel, ligaActual.nivel, ovr);
  const puedeElegirRetiro = !contratoTerminado && edad >= GameConfig.EDAD_RETIRO_OFERTA;

  const disponibles = GameDatabase.equipos.filter((e) => e.id !== equipoActualId);
  const pool = disponibles.length > 0 ? disponibles : GameDatabase.equipos;

  const candidatos = pool.map((equipo) => {
    const liga = ligaDe(equipo);
    return { equipo, liga, valorEnClub: GameConfig.valorOfrecidoPorClub(ovr, equipo.nivel, liga.nivel) };
  });
  // El potencial (no el OVR real) decide a qué clubes se apunta dentro
  // del pool ya elegible: a igual OVR, un jugador joven tiene más
  // recorrido que uno grande, así que apunta más arriba. La elegibilidad
  // real (unas líneas abajo) sigue siendo puro OVR.
  const potencialAjustado = GameConfig.potencialAjustadoPorEdad(ovr, edad);
  const nivelEquipoObjetivo = GameConfig.nivelEquipoObjetivo(potencialAjustado);
  const nivelLigaObjetivo = GameConfig.nivelLigaObjetivo(potencialAjustado);
  const pesoFn = (c) => GameConfig.pesoPorCercaniaNivel(c.equipo.nivel, c.liga.nivel, nivelEquipoObjetivo, nivelLigaObjetivo);

  let elegibles = candidatos.filter((c) =>
    GameConfig.equipoElegibleParaOvr(c.equipo.nivel, c.liga.nivel, ovr)
    && GameConfig.ofertaTieneValorRazonable(valorActual, c.valorEnClub)
  );

  // Salvaguarda en dos pasos: si el cruce OVR+valor deja el pool vacío
  // (dataset chico o un caso límite), se relaja primero el filtro de
  // valor y, si todavía no alcanza, se usan todos los candidatos antes
  // que dejar al jugador sin ofertas.
  if (elegibles.length === 0) {
    elegibles = candidatos.filter((c) => GameConfig.equipoElegibleParaOvr(c.equipo.nivel, c.liga.nivel, ovr));
  }
  if (elegibles.length === 0) elegibles = candidatos;

  // En los últimos años antes del retiro forzoso (ver EDAD_RETIRO_TRANSICION),
  // el cupo de ofertas se achica a 1 — cada vez menos clubes se animan a
  // día ofertarte, en vez de pasar de golpe de "ofertas normales" a "sin
  // ninguna". Con retiro disponible pero fuera de esa ventana final, se
  // ofrecen 2 clubes en vez de 3 (la carta restante la ocupa la opción de
  // retirarse) — y ahí no aplica la garantía de liga local, ver comentario
  // de arriba.
  const enTransicionRetiro = !contratoTerminado && edad >= edadRetiroForzoso - GameConfig.EDAD_RETIRO_TRANSICION;
  const cantidadOfertasClub = enTransicionRetiro ? 1 : (puedeElegirRetiro ? 2 : 3);

  let elegidos;
  if (cantidadOfertasClub === 3) {
    // En el ocaso de la carrera, el cupo garantizado deja de priorizar
    // tu liga actual y pasa a priorizar tu país de origen — volver a
    // cerrar la carrera en casa, aunque la hayas jugado toda afuera.
    const enOcaso = edad >= GameConfig.EDAD_OCASO_RETORNO_PAIS;
    const locales = elegibles.filter((c) => enOcaso ? c.liga.pais === player.pais : c.liga.id === ligaActual.id);
    const cantidadLocales = Math.min(2, locales.length);
    elegidos = GameConfig.elegirMejorEncaje(locales, pesoFn, cantidadLocales);

    const usados = new Set(elegidos.map((c) => c.equipo.id));
    const restantes = cantidadOfertasClub - elegidos.length;
    if (restantes > 0) {
      const poolRestante = elegibles.filter((c) => !usados.has(c.equipo.id));
      elegidos.push(...GameConfig.elegirMejorEncaje(poolRestante, pesoFn, restantes));
    }
  } else {
    elegidos = GameConfig.elegirMejorEncaje(elegibles, pesoFn, cantidadOfertasClub);
  }

  // Puede no haber suficientes elegibles distintos: se completa repitiendo
  // (evitando duplicar el mismo club mientras haya otra opción), para no
  // mostrar menos ofertas de las que corresponden.
  while (elegidos.length < cantidadOfertasClub && elegibles.length > 0) {
    const usadosFinal = new Set(elegidos.map((c) => c.equipo.id));
    const restante = elegibles.filter((c) => !usadosFinal.has(c.equipo.id));
    elegidos.push(GameConfig.elegirMejorEncaje(restante.length > 0 ? restante : elegibles, pesoFn, 1)[0]);
  }

  const ofertasClub = elegidos.map(({ equipo, liga, valorEnClub }) => ({
    id: `oferta-${equipo.id}-${Math.random().toString(36).slice(2, 8)}`,
    tipoOferta: "club",
    equipo,
    liga,
    valorOfrecido: valorEnClub,
    desc: `${equipo.nombre} quiere ficharte para reforzar su plantel en ${liga.nombre}.`,
  }));

  // La carta que representa tu vínculo con el club actual (renovar o,
  // si no te renuevan, retirarte) siempre va última — no se mezcla con
  // las demás para que el jugador la encuentre siempre en el mismo lugar.
  const cartaClubActual = contratoTerminado
    ? {
        id: `retiro-${Math.random().toString(36).slice(2, 8)}`,
        tipoOferta: "retiro",
        equipo: equipoActual,
        liga: ligaActual,
        desc: `${equipoActual.nombre} no te renueva: tu nivel ya no alcanza para seguir en ${ligaActual.nombre}.`,
      }
    : {
        id: `quedarme-${Math.random().toString(36).slice(2, 8)}`,
        tipoOferta: "quedarme",
        equipo: equipoActual,
        liga: ligaActual,
        desc: `Seguir en ${equipoActual.nombre} y pelear tu lugar en ${ligaActual.nombre}.`,
      };

  const otrasCartas = [...ofertasClub];

  if (puedeElegirRetiro) {
    otrasCartas.push({
      id: `retiro-${Math.random().toString(36).slice(2, 8)}`,
      tipoOferta: "retiro",
      equipo: equipoActual,
      liga: ligaActual,
      desc: `Con ${edad} años, también puedes colgar los botines y cerrar tu carrera en lo más alto.`,
    });
  }

  const ordenAleatorio = GameConfig.muestraAleatoria(otrasCartas, otrasCartas.length);
  return [...ordenAleatorio, cartaClubActual];
}

// Elige un solo evento del `tipo` pedido ("personal" | "deportivo"): para
// cada pausa se sortea al azar si ese evento sale del banco general o del
// banco por rango de edad, y dentro del banco elegido se filtra por tipo
// (con el otro banco como respaldo si ese banco no tiene eventos de ese tipo).
// Ningún evento se repite dentro de la misma carrera (partida): se
// recuerda cada id ya usado y se lo excluye de futuros sorteos. Si un
// banco se queda sin eventos sin usar de ese tipo (carrera muy larga),
// se libera el filtro para ese banco puntual antes que dejar el sorteo
// sin candidatos — nunca se prioriza forzar la repetición.
const eventosUsados = new Set();

function elegirEventoPorTipo(edadActual, tipo) {
  const rango = GameConfig.rangoEdadDe(edadActual);
  const bancoPorEdad = GameEvents.porEdad[rango];
  const bancoElegido = Math.random() < 0.5 ? GameEvents.generales : bancoPorEdad;
  const bancoAlterno = bancoElegido === GameEvents.generales ? bancoPorEdad : GameEvents.generales;

  const sinUsar = (banco) => banco.filter((e) => e.tipo === tipo && !eventosUsados.has(e.id));
  const cualquiera = (banco) => banco.filter((e) => e.tipo === tipo);

  let candidatos = sinUsar(bancoElegido);
  if (candidatos.length === 0) candidatos = sinUsar(bancoAlterno);
  if (candidatos.length === 0) candidatos = cualquiera(bancoElegido);
  if (candidatos.length === 0) candidatos = cualquiera(bancoAlterno);

  const evento = GameConfig.randomFrom(candidatos);
  eventosUsados.add(evento.id);
  return evento;
}

// Eventos de Alto Impacto: sin restricción de rango de edad, se sortea
// entre TODOS los que todavía no se usaron en esta carrera (con el
// mismo respaldo de "liberar el filtro" si alguna vez se agotaran).
function elegirEventoAltoImpacto() {
  const sinUsar = GameEvents.altoImpacto.filter((e) => !eventosUsados.has(e.id));
  const candidatos = sinUsar.length > 0 ? sinUsar : GameEvents.altoImpacto;
  const evento = GameConfig.randomFrom(candidatos);
  eventosUsados.add(evento.id);
  return evento;
}

function mapearEventoACard(evento, esAltoImpacto) {
  return {
    id: evento.id,
    tipo: evento.tipo, // "personal" | "deportivo"
    altoImpacto: esAltoImpacto,
    personajes: evento.personajes,
    desc: evento.pregunta,
    opciones: evento.opciones.map((op, i) => ({
      label: op.texto,
      variant: i === 0 ? "accept" : "ghost",
      outcome: op.resultado,
      efectos: op.efectos,
    })),
  };
}

function buildDecisionBatch(edadActual) {
  // Máximo 1 evento de Alto Impacto por temporada (ver crearTemporada):
  // si esta es la pausa sorteada para esa temporada, reemplaza la
  // tarjeta del slot (personal o deportivo) que coincida con su tipo.
  const esPausaAltoImpacto = temporadaActual.altoImpactoPausa === temporadaActual.tramoIndex;
  const eventoAltoImpacto = esPausaAltoImpacto ? elegirEventoAltoImpacto() : null;

  const eventoPersonal = eventoAltoImpacto && eventoAltoImpacto.tipo === "personal"
    ? eventoAltoImpacto
    : elegirEventoPorTipo(edadActual, "personal");
  const eventoDeportivo = eventoAltoImpacto && eventoAltoImpacto.tipo === "deportivo"
    ? eventoAltoImpacto
    : elegirEventoPorTipo(edadActual, "deportivo");

  return [
    mapearEventoACard(eventoPersonal, eventoPersonal === eventoAltoImpacto),
    mapearEventoACard(eventoDeportivo, eventoDeportivo === eventoAltoImpacto),
  ];
}

// Cuántos tramos quedan en la temporada, contando el que se está por
// jugar — pone el techo real a cuánto puede durar una lesión.
function tramosRestantesEnTemporada() {
  return GameConfig.TOTAL_TRAMOS_TEMPORADA - temporadaActual.tramoIndex;
}

// Se evalúa en cada pausa de decisión (nunca en una de ofertas). Si ya
// hay una lesión activa no se vuelve a tirar — no hay "doble lesión".
// Si sale, esta pausa muestra el parte médico en vez de eventos (ver
// iniciarCheckpoint/renderDecisions) y queda registrada en
// temporadaActual.lesionActiva para que simularTramoYAvanzar la aplique.
function intentarGenerarLesion(edadActual) {
  if (temporadaActual.lesionActiva) return null;
  if (Math.random() >= GameConfig.probabilidadLesion(edadActual)) return null;

  const nivel = GameConfig.elegirNivelLesion();
  const banco = GameEvents.lesiones[nivel];
  const base = GameConfig.randomFrom(banco);
  const tramosDisponibles = tramosRestantesEnTemporada();

  const ovrPerdido = GameConfig.ovrPerdidoPorLesion(nivel);
  if (ovrPerdido > 0) {
    temporadaActual.ovr = GameConfig.clamp(temporadaActual.ovr - ovrPerdido, GameConfig.OVR_CARRERA_MIN, GameConfig.OVR_CARRERA_MAX);
  }

  const bloqueaForma = nivel !== "nivel3";
  if (bloqueaForma) temporadaActual.forma = "lesionado";

  temporadaActual.lesionActiva = {
    nivel,
    nombre: base.nombre,
    descripcion: base.descripcion,
    tramosRestantes: GameConfig.duracionLesion(nivel, tramosDisponibles),
    ovrPerdido,
    bloqueaForma,
  };
  return temporadaActual.lesionActiva;
}

// Arranca la pausa activa según el calendario: genera su lote (decisión,
// ofertas, o un parte médico si justo se sortea una lesión nueva).
function iniciarCheckpoint() {
  const checkpoint = temporadaActual.calendario[temporadaActual.checkpointIndex];
  if (!checkpoint) return;

  if (checkpoint.tipo === "oferta") {
    temporadaActual.loteActual = generarLoteOfertas(temporadaActual.equipoId, temporadaActual.ovr, getEdadActual(), temporadaActual.valorMercado);
  } else {
    const lesion = intentarGenerarLesion(getEdadActual());
    temporadaActual.loteActual = lesion
      ? [{ esInformeLesion: true, ...lesion }]
      : buildDecisionBatch(getEdadActual());
  }

  cambiarContenidoDecisiones(renderDecisions);
}

function avanzarCheckpoint() {
  temporadaActual.checkpointIndex++;
  if (!temporadaActual.calendario[temporadaActual.checkpointIndex]) {
    finalizarTemporada();
    return;
  }
  iniciarCheckpoint();
}

// Simula todos los partidos entre la pausa que se acaba de resolver y la próxima.
// ---------- ANIMACIÓN DE PROGRESO Y ESTADÍSTICAS ----------
const ANIMACION_TRAMO_MS = 900;

function animarNumero(el, desde, hasta, duracionMs, decimales = 0) {
  if (!el) return;
  const inicio = performance.now();
  function frame(ahora) {
    const t = Math.min((ahora - inicio) / duracionMs, 1);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out cúbico
    const valor = desde + (hasta - desde) * eased;
    el.textContent = decimales > 0 ? valor.toFixed(decimales) : Math.round(valor);
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

function animarAnilloProgreso(desde, hasta, duracionMs) {
  const ring = document.querySelector(".progress-ring");
  const texto = document.querySelector(".progress-ring__value");
  if (!ring || !texto) return;
  const inicio = performance.now();
  function frame(ahora) {
    const t = Math.min((ahora - inicio) / duracionMs, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    const valor = desde + (hasta - desde) * eased;
    ring.style.setProperty("--progress", valor);
    texto.textContent = `${Math.round(valor)}%`;
    if (t < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

// Deja el spotlight ya renderizado con los valores finales, pero arranca
// los números desde `antes` y los anima hasta el valor actual de la temporada.
function animarSpotlightDesde(antes) {
  const ring = document.querySelector(".progress-ring");
  if (!ring) return;

  ring.style.setProperty("--progress", antes.progreso);
  document.querySelector(".progress-ring__value").textContent = `${Math.round(antes.progreso)}%`;
  Object.entries({ partidos: antes.partidos, goles: antes.goles, asistencias: antes.asistencias, mvp: antes.mvp }).forEach(([stat, valor]) => {
    const el = document.querySelector(`[data-stat="${stat}"]`);
    if (el) el.textContent = valor;
  });
  const promedioEl = document.querySelector('[data-stat="promedio"]');
  if (promedioEl) promedioEl.textContent = antes.promedio.toFixed(1);

  animarAnilloProgreso(antes.progreso, temporadaActual.progreso, ANIMACION_TRAMO_MS);
  animarNumero(document.querySelector('[data-stat="partidos"]'), antes.partidos, temporadaActual.partidos, ANIMACION_TRAMO_MS);
  animarNumero(document.querySelector('[data-stat="goles"]'), antes.goles, temporadaActual.goles, ANIMACION_TRAMO_MS);
  animarNumero(document.querySelector('[data-stat="asistencias"]'), antes.asistencias, temporadaActual.asistencias, ANIMACION_TRAMO_MS);
  animarNumero(document.querySelector('[data-stat="mvp"]'), antes.mvp, temporadaActual.mvp, ANIMACION_TRAMO_MS);
  animarNumero(document.querySelector('[data-stat="promedio"]'), antes.promedio, temporadaActual.promedio, ANIMACION_TRAMO_MS, 1);
}

// Partidos de LIGA que tocan en este tramo: el total de la temporada
// (competiciones.liga.competicion.partidosMinimos) repartido entre los
// TOTAL_TRAMOS_TEMPORADA tramos — el último tramo se ajusta para que la
// suma cierre exacta.
function partidosLigaParaTramo(temporada, tramoIndex) {
  const estado = temporada.competiciones.liga;
  if (!estado.competicion) return 0;
  const total = estado.competicion.partidosMinimos;
  if (tramoIndex === GameConfig.TOTAL_TRAMOS_TEMPORADA - 1) return Math.max(0, total - estado.partidosJugados);
  return Math.round(total / GameConfig.TOTAL_TRAMOS_TEMPORADA);
}

// Motor genérico de una competición eliminatoria (copa nacional o
// internacional): en `tramoMinimos` se juegan los partidos garantizados
// (1ra ronda de copa, o fase de grupos/liga en la internacional). A
// partir de ahí, un tramo por ronda extra disponible, con una tirada de
// GameConfig.probAvanzarRonda para seguir viva — si no avanza, la
// campaña en esa competición termina ahí para el resto de la temporada.
function resolverKnockout(estado, tramoIndex, tramoMinimos, fuerza) {
  if (!estado) return { partidos: 0, mensaje: null };

  if (tramoIndex === tramoMinimos) {
    estado.minimosJugados = true;
    estado.partidosJugados += estado.competicion.partidosMinimos;
    return { partidos: estado.competicion.partidosMinimos, mensaje: null };
  }

  const indiceRonda = tramoIndex - tramoMinimos - 1;
  if (tramoIndex <= tramoMinimos || estado.eliminado || indiceRonda >= estado.rondasExtra.length) {
    return { partidos: 0, mensaje: null };
  }

  const partidosRonda = estado.rondasExtra[indiceRonda];
  const avanza = Math.random() < GameConfig.probAvanzarRonda(fuerza);
  estado.partidosJugados += partidosRonda;

  if (!avanza) {
    estado.eliminado = true;
    return { partidos: partidosRonda, mensaje: `Quedaste eliminado de la ${estado.competicion.nombre}.` };
  }

  const esUltimaRonda = indiceRonda === estado.rondasExtra.length - 1;
  if (esUltimaRonda) {
    estado.llegoALaFinal = true;
    return { partidos: partidosRonda, mensaje: `¡Llegaste a la final de la ${estado.competicion.nombre}!` };
  }
  return { partidos: partidosRonda, mensaje: `Avanzaste de ronda en la ${estado.competicion.nombre}.` };
}

function simularTramoYAvanzar() {
  const antes = {
    partidos: temporadaActual.partidos,
    goles: temporadaActual.goles,
    asistencias: temporadaActual.asistencias,
    mvp: temporadaActual.mvp,
    promedio: temporadaActual.promedio,
    progreso: temporadaActual.progreso,
  };

  const equipo = equipoDe(temporadaActual);
  const liga = ligaDe(equipo);
  const grupo = GameConfig.GRUPOS_POSICION[player.posicion] ?? "medio";
  const tramoIndex = temporadaActual.tramoIndex;

  const fuerza = GameConfig.calcularFuerzaCampana(equipo.nivel, liga.nivel, temporadaActual.forma, temporadaActual.equipoAcumuladoTemporada);

  // ---- Partidos del CLUB este tramo, en todas las competiciones activas ----
  const partidosLiga = partidosLigaParaTramo(temporadaActual, tramoIndex);
  temporadaActual.competiciones.liga.partidosJugados += partidosLiga;

  const resCopaNacional = resolverKnockout(temporadaActual.competiciones.copaNacional, tramoIndex, 0, fuerza);
  const resCopaInternacional = resolverKnockout(temporadaActual.competiciones.copaInternacional, tramoIndex, 1, fuerza);

  const partidosClub = partidosLiga + resCopaNacional.partidos + resCopaInternacional.partidos;

  // ---- Cuántos de esos partidos del club juegas realmente tú ----
  // Lesionado (cualquier nivel): no juegas nada este tramo, sin importar
  // qué tan bueno seas — eso es lo único que garantiza incluso el nivel 3.
  // Ser titular se decide antes (con el OVR/rendimiento con los que se
  // entra al tramo) para que además de mostrarse como badge, sume de
  // verdad a la participación — ver PARTICIPACION_BONUS_TITULAR.
  const estabaLesionado = Boolean(temporadaActual.lesionActiva);
  const esTitularEsteTramo = estabaLesionado ? false : GameConfig.calcularTitular(temporadaActual.ovr, temporadaActual.bufferRendimiento);
  let partidosJugador;
  if (estabaLesionado) {
    partidosJugador = 0;
  } else {
    const probJugar = GameConfig.probabilidadJugar(temporadaActual.ovr, temporadaActual.bufferRendimiento, temporadaActual.forma, esTitularEsteTramo);
    partidosJugador = GameConfig.clamp(GameConfig.redondeoEstocastico(partidosClub * probJugar), 0, partidosClub);
  }

  const resultado = GameConfig.simularTramo({
    partidos: partidosJugador,
    grupo,
    ovr: temporadaActual.ovr,
    rendimientoAcumulado: temporadaActual.bufferRendimiento,
  });

  temporadaActual.partidos += partidosJugador;
  temporadaActual.goles += resultado.goles;
  temporadaActual.asistencias += resultado.asistencias;
  temporadaActual.mvp += resultado.mvp;
  temporadaActual.sumaRating += resultado.sumaRating;
  temporadaActual.promedio = temporadaActual.partidos > 0 ? temporadaActual.sumaRating / temporadaActual.partidos : 0;

  temporadaActual.ovr = GameConfig.ajustarOvrTramo(temporadaActual.ovr, temporadaActual.bufferRendimiento, getEdadActual(), factorTalento);
  temporadaActual.titular = esTitularEsteTramo;
  temporadaActual.equipoAcumuladoTemporada += temporadaActual.bufferEquipo;
  temporadaActual.valorMercado = GameConfig.calcularValorMercado(temporadaActual.ovr, equipo.nivel, liga.nivel);
  temporadaActual.tramoIndex++;

  const siguiente = temporadaActual.calendario[temporadaActual.checkpointIndex + 1];
  temporadaActual.progreso = siguiente ? siguiente.progreso : 100;

  // La baja se cuenta en tramos: al llegar a 0 se da de alta (y, si
  // estaba bloqueando la forma, vuelve a un estado neutral en vez de
  // quedar "lesionado" para siempre).
  let mensajeLesion = null;
  if (estabaLesionado) {
    temporadaActual.lesionActiva.tramosRestantes--;
    if (temporadaActual.lesionActiva.tramosRestantes <= 0) {
      // Fue un golpe físico puntual, no una pérdida de nivel definitiva:
      // al darte de alta recuperás una parte del OVR que te costó.
      const ovrRecuperado = Math.round(temporadaActual.lesionActiva.ovrPerdido * GameConfig.LESION_RECUPERACION_OVR);
      if (ovrRecuperado > 0) {
        temporadaActual.ovr = GameConfig.clamp(temporadaActual.ovr + ovrRecuperado, GameConfig.OVR_CARRERA_MIN, GameConfig.OVR_CARRERA_MAX);
      }
      mensajeLesion = `Te recuperaste de tu lesión (${temporadaActual.lesionActiva.nombre})${ovrRecuperado > 0 ? ` — recuperás ${ovrRecuperado} OVR` : ""}.`;
      if (temporadaActual.lesionActiva.bloqueaForma) temporadaActual.forma = "regular";
      temporadaActual.lesionActiva = null;
    }
  }

  let mensaje = `Tramo completado: ${partidosJugador} partidos jugados · ${resultado.goles} goles · ${resultado.asistencias} asistencias.`;
  [resCopaNacional.mensaje, resCopaInternacional.mensaje, mensajeLesion].forEach((m) => { if (m) mensaje += ` ${m}`; });
  showToast(mensaje);

  temporadaActual.bufferRendimiento = 0;
  temporadaActual.bufferEquipo = 0;

  renderHero();
  renderSpotlight();
  animarSpotlightDesde(antes);

  // Espera a que termine la animación antes de mostrar la siguiente pausa
  // (o cerrar la temporada), para que no se corte a mitad de camino.
  setTimeout(avanzarCheckpoint, ANIMACION_TRAMO_MS + 150);
}

function finalizarTemporada() {
  const equipo = equipoDe(temporadaActual);
  const liga = ligaDe(equipo);
  const fuerza = GameConfig.calcularFuerzaCampana(equipo.nivel, liga.nivel, temporadaActual.forma, temporadaActual.equipoAcumuladoTemporada);
  const mensajesFinales = [];

  const ganasteLiga = Math.random() < GameConfig.probGanarLiga(fuerza);
  if (ganasteLiga && temporadaActual.competiciones.liga.competicion) {
    const comp = temporadaActual.competiciones.liga.competicion;
    temporadaActual.trofeos.push({ nombre: comp.nombre, imagen: comp.trofeoImagen });
    mensajesFinales.push(`¡Campeón de ${comp.nombre}!`);
  }

  const copaNacional = temporadaActual.competiciones.copaNacional;
  let ganasteCopaNacional = false;
  if (copaNacional && copaNacional.llegoALaFinal) {
    ganasteCopaNacional = Math.random() < GameConfig.probGanarCopa(fuerza);
    if (ganasteCopaNacional) {
      temporadaActual.trofeos.push({ nombre: copaNacional.competicion.nombre, imagen: copaNacional.competicion.trofeoImagen });
      mensajesFinales.push(`¡Campeón de ${copaNacional.competicion.nombre}!`);
    } else {
      mensajesFinales.push(`Fuiste subcampeón de la ${copaNacional.competicion.nombre}.`);
    }
  }

  const copaInternacional = temporadaActual.competiciones.copaInternacional;
  if (copaInternacional && copaInternacional.llegoALaFinal) {
    if (Math.random() < GameConfig.probGanarLiga(fuerza)) {
      temporadaActual.trofeos.push({ nombre: copaInternacional.competicion.nombre, imagen: copaInternacional.competicion.trofeoImagen });
      mensajesFinales.push(`¡Campeón de ${copaInternacional.competicion.nombre}!`);
    } else {
      mensajesFinales.push(`Fuiste subcampeón de la ${copaInternacional.competicion.nombre}.`);
    }
  }

  // Clasificación a competición internacional para la PRÓXIMA temporada.
  // Si la confederación no tiene ese nivel de competición (ej. CONCACAF
  // no tiene "segundoNivel"), inicializarCompeticionesTemporada() ya lo
  // resuelve solo a "sin competición internacional" la próxima vez.
  let clasificacionProxima = null;
  if (ganasteLiga || fuerza >= GameConfig.UMBRAL_CLASIFICA_PRIMER_NIVEL) {
    clasificacionProxima = "primerNivel";
  } else if (fuerza >= GameConfig.UMBRAL_CLASIFICA_SEGUNDO_NIVEL || ganasteCopaNacional) {
    clasificacionProxima = "segundoNivel";
  }

  temporadasEnClubActual++;

  temporadaActual.enCurso = false;
  temporadaActual.progreso = 100;
  const numeroCerrada = temporadaActual.numero;
  temporadasFinalizadas.push(temporadaActual);

  const ovrHeredado = temporadaActual.ovr;
  const equipoAcumuladoCerrado = temporadaActual.equipoAcumuladoTemporada;
  temporadaActual = crearTemporada(
    numeroCerrada + 1,
    temporadaActual.equipoId,
    ovrHeredado,
    GameConfig.calcularValorMercado(ovrHeredado, equipo.nivel, liga.nivel),
    clasificacionProxima
  );

  // Habilita el pedido de cambio de dorsal: el club lo evalúa con el OVR
  // y el rendimiento colectivo de la temporada que se acaba de cerrar,
  // no con los de la temporada nueva (que todavía no jugó nada).
  puedeSolicitarNumero = true;
  contextoSolicitudNumero = { ovr: ovrHeredado, rendimiento: equipoAcumuladoCerrado };

  const mensaje = [`¡Temporada ${numeroCerrada} finalizada!`, ...mensajesFinales, `Arranca la Temporada ${temporadaActual.numero}.`].join(" ");
  showToast(mensaje);

  renderHero();
  renderSpotlight();
  renderTimeline();
  actualizarBotonNumero();
  iniciarCheckpoint();
}

// ---------- JUGADOR / ESTADO GLOBAL ----------
const player = loadPlayer();
const usaProgresionReal = Boolean(player.equipoId && typeof player.ovrInicial === "number");

// Edad a la que "se acaba" definitivamente esta carrera (ver
// generarLoteOfertas): se sortea una única vez, no cambia entre
// temporadas ni depende de OVR/rendimiento.
const edadRetiroForzoso = GameConfig.randomInt(GameConfig.EDAD_RETIRO_FORZOSO_MIN, GameConfig.EDAD_RETIRO_FORZOSO_MAX);

// Talento oculto de esta carrera (ver GameConfig.ajustarOvrTramo): sorteado
// una única vez, nunca se muestra en ningún número visible.
const factorTalento = GameConfig.TALENTO_MIN + Math.random() * (GameConfig.TALENTO_MAX - GameConfig.TALENTO_MIN);

let temporadasFinalizadas = [];
let temporadaActual;

// Temporadas completadas sin cambiar de club (ver TEMPORADAS_GRACIA_CONTRATO
// en generarLoteOfertas) — arranca en 0 con cada club nuevo, sea el
// inicial o uno fichado a mitad de carrera, y sube +1 en cada cierre de
// temporada en el mismo club (finalizarTemporada).
let temporadasEnClubActual = 0;

if (usaProgresionReal) {
  const equipoInicial = GameDatabase.equipos.find((e) => e.id === player.equipoId);
  const ligaInicial = ligaDe(equipoInicial);
  const valorMercadoInicial = GameConfig.calcularValorMercado(player.ovrInicial, equipoInicial.nivel, ligaInicial.nivel);
  temporadaActual = crearTemporada(1, player.equipoId, player.ovrInicial, valorMercadoInicial);
} else {
  // Fallback si se abre esta pantalla sin pasar por la creación de personaje:
  // arma una carrera demo ya avanzada, usando el mismo motor (totalmente interactiva).
  // Toma el primer equipo de la base de datos, sea cual sea el dataset cargado.
  const equipoDemoId = GameDatabase.equipos[0].id;
  const t1 = crearTemporada(1, equipoDemoId, 64, 120000);
  t1.partidos = 22; t1.goles = 6; t1.asistencias = 4; t1.mvp = 1;
  t1.sumaRating = 6.8 * 22; t1.promedio = 6.8;
  t1.trofeos = [{ nombre: "Ascenso de Categoría" }];
  t1.enCurso = false; t1.progreso = 100;
  temporadasFinalizadas.push(t1);

  const t2 = crearTemporada(2, equipoDemoId, 68, 380000);
  t2.partidos = 14; t2.goles = 5; t2.asistencias = 3; t2.mvp = 1;
  t2.sumaRating = 7.1 * 14; t2.promedio = 7.1;
  t2.forma = "inspirado"; t2.titular = true;
  t2.trofeos = [{ nombre: "Supercopa Regional" }];
  t2.progreso = 47;
  let idx = t2.calendario.findIndex((c) => c.progreso > 47);
  t2.checkpointIndex = idx === -1 ? t2.calendario.length - 1 : idx;
  t2.tramoIndex = 1; // consistente con haber llegado a mitad de temporada
  temporadaActual = t2;
}

function getEdadActual() {
  return Number(player.edad) + (temporadaActual.numero - 1);
}

// ---------- RENDER HERO ----------
function renderHero() {
  const equipo = equipoDe(temporadaActual);

  document.getElementById("pbAvatarWrap").innerHTML = GameConfig.crestHtml(equipo, "team-crest team-crest--avatar");
  document.getElementById("pbName").textContent = player.apellido;
  // Nombre completo en desktop, abreviatura en móvil (la elige el CSS
  // según el ancho) — así el nombre del club tiene más lugar para respirar.
  document.getElementById("pbPos").innerHTML =
    `<span class="hero__pos-full">${POSITION_NAMES[player.posicion] ?? player.posicion}</span>` +
    `<span class="hero__pos-abbr">${player.posicion}</span>`;
  document.getElementById("pbFlag").innerHTML = GameConfig.flagHtml(player.paisCode, "flag-img", player.flag);
  document.getElementById("pbCountryName").textContent = player.pais;

  document.getElementById("pbAgeValue").textContent = `${getEdadActual()} años`;
  document.getElementById("pbValueAmount").textContent = formatMarketValue(temporadaActual.valorMercado);

  document.getElementById("pbNumberBadge").textContent = player.numero;
  document.getElementById("pbTeamName").textContent = equipo.nombre;

  const ovrBadge = document.getElementById("pbOvr");
  ovrBadge.style.setProperty("--ovr-color", ovrTierColor(temporadaActual.ovr));
  document.getElementById("pbOvrValue").textContent = temporadaActual.ovr;

  document.getElementById("hero").style.setProperty("--team-a", equipo.a);
  document.getElementById("hero").style.setProperty("--team-b", equipo.b);
}

// `soloIcono`: en el historial no hace falta el nombre al lado (ver
// renderTimeline) — el título completo queda igual accesible al pasar
// el mouse por el `title` de la tarjeta.
function trophiesHtml(trofeos, soloIcono = false) {
  if (!trofeos || trofeos.length === 0) return "";
  return `
    <div class="trophies">
      ${trofeos.map((t) => `
        <span class="trophy-card${soloIcono ? " trophy-card--icon-only" : ""}" title="${t.nombre}">
          ${GameConfig.trofeoIconHtml(t)}
          ${soloIcono ? "" : `<span class="trophy-card__name">${t.nombre}</span>`}
        </span>
      `).join("")}
    </div>
  `;
}

// ---------- RENDER SPOTLIGHT (temporada actual) ----------
function renderSpotlight() {
  const spotlight = document.getElementById("spotlight");
  const s = temporadaActual;
  const equipo = equipoDe(s);
  const liga = ligaDe(equipo);
  const forma = GameConfig.FORM_STATES[s.forma];
  const progreso = Math.round(s.progreso);

  const trofeosMobileHtml = s.trofeos && s.trofeos.length > 0 ? trophiesHtml(s.trofeos, true) : "";

  spotlight.innerHTML = `
    <article class="spotlight-card spotlight-card--desktop">
      <div class="spotlight-card__head">
        <div>
          <span class="spotlight-card__season">Temporada ${s.numero} · ${s.anio}</span>
          <span class="spotlight-card__team">con ${equipo.nombre} ${GameConfig.ligaCrestHtml(liga, "team-crest team-crest--xs")}<span>${liga.nombre}</span></span>
        </div>
        <div class="spotlight-card__status">
          <span class="current-tag">EN CURSO</span>
          <span class="forma-pill" style="background:${forma.color}22;color:${forma.color}">${forma.icon} ${forma.label}</span>
          <span class="lineup-tag lineup-tag--${s.titular ? "titular" : "suplente"}">${s.titular ? "Titular" : "Suplente"}</span>
        </div>
      </div>

      <div class="spotlight-card__body">
        <div class="progress-ring" style="--progress:${progreso}">
          <div class="progress-ring__text">
            <span class="progress-ring__value">${progreso}%</span>
            <span class="progress-ring__label">temporada</span>
          </div>
        </div>

        <div class="spotlight-card__stats">
          <div class="stat"><span class="stat__icon">🏟️</span><span class="stat__value" data-stat="partidos">${s.partidos}</span><span class="stat__label">Partidos</span></div>
          <div class="stat"><span class="stat__icon">⚽</span><span class="stat__value" data-stat="goles">${s.goles}</span><span class="stat__label">Goles</span></div>
          <div class="stat"><span class="stat__icon">🎯</span><span class="stat__value" data-stat="asistencias">${s.asistencias}</span><span class="stat__label">Asistencias</span></div>
          <div class="stat"><span class="stat__icon">🏅</span><span class="stat__value" data-stat="mvp">${s.mvp}</span><span class="stat__label">MVP</span></div>
          <div class="stat"><span class="stat__icon">⭐</span><span class="stat__value" data-stat="promedio">${s.promedio.toFixed(1)}</span><span class="stat__label">Promedio</span></div>
        </div>
      </div>

      ${trophiesHtml(s.trofeos)}
    </article>

    <!-- Versión móvil: tarjeta chica y plana, sin anillo animado ni
         iconos decorativos — se redibuja entera en cada tramo con los
         valores finales (sin la cuenta animada de la versión desktop). -->
    <article class="spotlight-mobile">
      <div class="spotlight-mobile__top">
        <span class="spotlight-mobile__season">T${s.numero} · ${s.anio}</span>
        <span class="forma-pill forma-pill--sm" style="background:${forma.color}22;color:${forma.color}">${forma.icon} ${forma.label}</span>
      </div>
      <div class="spotlight-mobile__club">
        ${GameConfig.crestHtml(equipo, "team-crest team-crest--xs")}
        <span class="spotlight-mobile__clubname">${equipo.nombre}</span>
        <span class="lineup-tag lineup-tag--${s.titular ? "titular" : "suplente"}">${s.titular ? "Titular" : "Suplente"}</span>
      </div>
      <div class="spotlight-mobile__bar" title="${progreso}% de la temporada">
        <div class="spotlight-mobile__bar-fill" style="width:${progreso}%"></div>
      </div>
      <div class="spotlight-mobile__stats">
        <span><b>${s.partidos}</b>PJ</span>
        <span><b>${s.goles}</b>Goles</span>
        <span><b>${s.asistencias}</b>Asist.</span>
        <span><b>${s.mvp}</b>MVP</span>
        <span><b>${s.promedio.toFixed(1)}</b>Prom.</span>
      </div>
      ${trofeosMobileHtml ? `<div class="spotlight-mobile__trophies">${trofeosMobileHtml}</div>` : ""}
    </article>
  `;
}

// ---------- RENDER TIMELINE (historial de temporadas pasadas) ----------
function renderTimeline() {
  const section = document.querySelector(".timeline");
  const list = document.getElementById("timelineList");

  if (temporadasFinalizadas.length === 0) {
    section.style.display = "none";
    return;
  }
  section.style.display = "";
  list.innerHTML = "";

  [...temporadasFinalizadas].reverse().forEach((s) => {
    const equipo = equipoDe(s);
    const color = ovrTierColor(s.ovr);
    const edadEsaTemporada = Number(player.edad) + (s.numero - 1);

    const trofeosHtml = s.trofeos && s.trofeos.length > 0
      ? trophiesHtml(s.trofeos, true)
      : `<span class="timeline-item__notrophy">Sin trofeos</span>`;

    const row = document.createElement("div");
    row.className = "timeline-item";
    row.innerHTML = `
      <div class="timeline-item__desktop">
        <span class="timeline-item__season">Temporada ${s.numero}<span>${s.anio} · ${edadEsaTemporada} años</span></span>
        ${GameConfig.crestHtml(equipo, "team-crest team-crest--sm")}
        <span class="timeline-item__team">${equipo.nombre}</span>
        ${trofeosHtml}
        <span class="ovr-badge ovr-badge--sm" style="--ovr-color:${color}"><span>${s.ovr}</span><span class="ovr-badge__label">OVR</span></span>
        <span class="timeline-item__stats">${s.partidos} PJ · ${s.goles} G · ${s.asistencias} A · ${s.promedio.toFixed(1)} prom</span>
      </div>

      <div class="timeline-item__mobile">
        <div class="timeline-item__mrow">
          ${GameConfig.crestHtml(equipo, "team-crest team-crest--sm")}
          <div class="timeline-item__mid">
            <span class="timeline-item__mteam">${equipo.nombre}</span>
            <span class="timeline-item__mmeta">T${s.numero} · ${s.anio} · ${edadEsaTemporada} años · ${s.partidos} PJ · ${s.goles} G</span>
          </div>
          <span class="ovr-badge ovr-badge--sm" style="--ovr-color:${color}">${s.ovr}</span>
        </div>
        ${s.trofeos && s.trofeos.length > 0 ? `<div class="timeline-item__mtrophies">${trofeosHtml}</div>` : ""}
      </div>
    `;
    list.appendChild(row);
  });
}

// Cuando cambia todo el contenido del panel de decisiones (de ofertas a
// eventos, o de eventos al botón de continuar) no hay tarjetas puntuales
// para reacomodar con FLIP — es un cambio de "escena" completo, así que
// se resuelve con un fundido: se apaga, se actualiza el contenido y se
// vuelve a encender, en vez de reemplazarlo de golpe.
function cambiarContenidoDecisiones(actualizar) {
  const footer = document.querySelector(".decisions");
  footer.classList.add("decisions--fade");
  setTimeout(() => {
    actualizar();
    requestAnimationFrame(() => footer.classList.remove("decisions--fade"));
  }, 180);
}

// ---------- RENDER DECISIONES / OFERTAS (pausa activa) ----------
// Cuánto queda visible el parte médico antes de avanzar solo — no hay
// nada que decidir, así que no tiene sentido pedir un clic extra, pero
// sí darle tiempo a leerlo antes de que la temporada siga.
const LESION_INFORME_MS = 3200;

function renderDecisions() {
  const checkpoint = temporadaActual.calendario[temporadaActual.checkpointIndex];
  const esOferta = checkpoint.tipo === "oferta";

  const track = document.getElementById("decisionsTrack");
  const count = document.getElementById("decisionsCount");
  const title = document.getElementById("decisionsTitle");
  const lote = temporadaActual.loteActual;

  track.innerHTML = "";

  // Parte médico: pausa entera reemplazada por el informe de la lesión
  // recién diagnosticada — no hay nada que decidir, se lee y se avanza
  // solo (ver intentarGenerarLesion / iniciarCheckpoint).
  if (lote.length === 1 && lote[0].esInformeLesion) {
    title.textContent = "Parte médico";
    count.textContent = "Estás lesionado";
    track.appendChild(crearLesionCard(lote[0]));
    setTimeout(() => simularTramoYAvanzar(), LESION_INFORME_MS);
    return;
  }

  title.textContent = esOferta ? "Ofertas de equipos" : "Decisiones";

  if (lote.length === 0) {
    count.textContent = "Resuelto";
    const empty = document.createElement("p");
    empty.className = "decisions__empty";
    empty.textContent = "No hay más ofertas por ahora.";
    track.appendChild(empty);
    return;
  }

  count.textContent = esOferta ? "Elige una opción" : `${lote.length} pendiente${lote.length === 1 ? "" : "s"}`;

  lote.forEach((item) => {
    track.appendChild(esOferta ? crearOfertaCard(item) : crearDecisionCard(item));
  });
}

// Etiquetas que muestran, por cada opción, qué toca su efecto en el
// próximo tramo (rendimiento, forma, equipo) — para que la decisión no
// sea a ciegas respecto de cómo pesa en el cálculo del siguiente bloque.
function efectoRendimientoHtml(valor) {
  if (valor > 0) return `<span class="efecto efecto--pos">📈 Rendimiento +${valor}</span>`;
  if (valor < 0) return `<span class="efecto efecto--neg">📉 Rendimiento ${valor}</span>`;
  return `<span class="efecto">➖ Rendimiento</span>`;
}
function efectoEquipoHtml(valor) {
  if (valor > 0) return `<span class="efecto efecto--pos">🤝 Equipo +${valor}</span>`;
  if (valor < 0) return `<span class="efecto efecto--neg">🤝 Equipo ${valor}</span>`;
  return `<span class="efecto">🤝 Equipo</span>`;
}
function efectoFormaHtml(forma) {
  const f = GameConfig.FORM_STATES[forma];
  return `<span class="efecto" style="color:${f.color}">${f.icon} ${f.label}</span>`;
}

function crearDecisionCard(d) {
  const card = document.createElement("article");
  card.className = `decision-card decision-card--${d.tipo}${d.altoImpacto ? " decision-card--alto-impacto" : ""}`;
  card.dataset.id = d.id;

  const buttonsHtml = d.opciones.map((op, i) => {
    const cls = op.variant === "accept" ? "btn" : "btn btn--ghost";
    return `
      <div class="decision-option">
        <button type="button" class="${cls}" data-idx="${i}">${op.label}</button>
        <div class="decision-option__efectos">
          ${efectoRendimientoHtml(op.efectos.rendimiento)}
          ${efectoFormaHtml(op.efectos.forma)}
          ${efectoEquipoHtml(op.efectos.equipo)}
        </div>
      </div>
    `;
  }).join("");

  card.innerHTML = `
    ${d.altoImpacto ? '<span class="decision-card__impacto" title="Evento de alto impacto">⚠️</span>' : ""}
    <span class="decision-card__tag">${d.tipo === "deportivo" ? "Deportivo" : "Personal"}</span>
    <p class="decision-card__desc">${d.desc}</p>
    <div class="decision-card__actions">${buttonsHtml}</div>
  `;

  card.querySelectorAll("button").forEach((btn) => {
    btn.addEventListener("click", () => resolveDecisionEvento(d.id, Number(btn.dataset.idx)));
  });

  return card;
}

function crearOfertaCard(item) {
  const esQuedarme = item.tipoOferta === "quedarme";
  const esRetiro = item.tipoOferta === "retiro";
  const esForzoso = Boolean(item.forzoso);

  const card = document.createElement("article");
  card.className = `decision-card decision-card--oferta-club${esQuedarme ? " decision-card--quedarme" : ""}${esRetiro ? " decision-card--retiro" : ""}${esForzoso ? " decision-card--retiro-forzoso" : ""}`;
  card.dataset.id = item.id;

  const tag = esForzoso ? "Fin de carrera" : esRetiro ? "Retiro" : esQuedarme ? "Tu club" : "Oferta";
  const boton = esRetiro ? "Retirarme" : esQuedarme ? "Quedarme" : "Aceptar oferta";

  card.innerHTML = `
    <span class="decision-card__tag">${tag}</span>
    <div class="decision-card__team">
      ${GameConfig.crestHtml(item.equipo, "team-crest team-crest--sm")}
      <div>
        <div class="decision-card__teamname">${item.equipo.nombre}</div>
        <div class="decision-card__league">
          ${GameConfig.ligaCrestHtml(item.liga, "team-crest team-crest--xs")}
          <span>${item.liga.nombre}</span>
          ${GameConfig.flagHtml(item.liga.paisCode, "decision-card__flag flag-img", item.liga.paisFlag)}
        </div>
      </div>
    </div>
    ${item.tipoOferta === "club" ? "" : `<p class="decision-card__desc">${item.desc}</p>`}
    ${typeof item.valorOfrecido === "number" ? `<p class="decision-card__valor">Te valoran en <strong>${formatMarketValue(item.valorOfrecido)}</strong></p>` : ""}
    <div class="decision-card__actions">
      <button type="button" class="btn">${boton}</button>
    </div>
  `;

  card.querySelector("button").addEventListener("click", () => resolveOferta(item));

  return card;
}

const LESION_NIVEL_ETIQUETA = { nivel1: "Lesión grave", nivel2: "Lesión moderada", nivel3: "Lesión leve" };

function crearLesionCard(lesion) {
  const card = document.createElement("article");
  card.className = `decision-card decision-card--lesion-informe decision-card--lesion-${lesion.nivel}`;

  const detalle = [];
  if (lesion.ovrPerdido > 0) detalle.push(`-${lesion.ovrPerdido} OVR`);
  detalle.push(`${lesion.tramosRestantes} pausa${lesion.tramosRestantes === 1 ? "" : "s"} de baja`);

  card.innerHTML = `
    <span class="decision-card__tag">${LESION_NIVEL_ETIQUETA[lesion.nivel]}</span>
    <p class="decision-card__desc"><strong>${lesion.nombre}.</strong> ${lesion.descripcion}</p>
    <p class="decision-card__lesion-detalle">${detalle.join(" · ")}</p>
  `;

  return card;
}

// Técnica FLIP: como renderDecisions() reconstruye las tarjetas de cero,
// la que queda puede aparecer de golpe en su nueva posición (p.ej. saltar
// a la izquierda al ocupar el lugar de la que se resolvió). Se guarda la
// posición de cada tarjeta antes del re-render y, después, se la hace
// arrancar visualmente desde ahí y deslizarse con una transición hasta
// su lugar real — se ve como un acomodo suave, no un salto.
function capturarPosicionesCards(track) {
  const posiciones = {};
  track.querySelectorAll(".decision-card").forEach((el) => {
    posiciones[el.dataset.id] = el.getBoundingClientRect();
  });
  return posiciones;
}

function animarReacomodoCards(track, posicionesPrevias) {
  track.querySelectorAll(".decision-card").forEach((el) => {
    const antes = posicionesPrevias[el.dataset.id];
    if (!antes) return; // tarjeta nueva: no había posición previa que respetar
    const ahora = el.getBoundingClientRect();
    const dx = antes.left - ahora.left;
    const dy = antes.top - ahora.top;
    if (!dx && !dy) return;

    el.style.transition = "none";
    el.style.transform = `translate(${dx}px, ${dy}px)`;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = "transform 0.35s ease";
        el.style.transform = "";
      });
    });
    el.addEventListener("transitionend", () => { el.style.transition = ""; }, { once: true });
  });
}

function resolveDecisionEvento(id, optionIdx) {
  const decision = temporadaActual.loteActual.find((d) => d.id === id);
  if (!decision) return;
  const option = decision.opciones[optionIdx];

  // Si una lesión de nivel 1/2 está activa, tu forma queda fija en
  // "lesionado" durante la baja — las decisiones igual suman rendimiento
  // y equipo, pero no te "curan" el estado de ánimo de golpe.
  if (!(temporadaActual.lesionActiva && temporadaActual.lesionActiva.bloqueaForma)) {
    temporadaActual.forma = option.efectos.forma;
  }
  temporadaActual.bufferRendimiento += option.efectos.rendimiento;
  temporadaActual.bufferEquipo += option.efectos.equipo;

  const cardEl = document.querySelector(`.decision-card[data-id="${id}"]`);
  if (cardEl) cardEl.classList.add("decision-card--resolved");

  showToast(option.outcome);
  renderSpotlight(); // refleja el cambio de forma al instante

  setTimeout(() => {
    const track = document.getElementById("decisionsTrack");
    const posicionesPrevias = capturarPosicionesCards(track);
    temporadaActual.loteActual = temporadaActual.loteActual.filter((d) => d.id !== id);

    if (temporadaActual.loteActual.length === 0) {
      // Ya no queda nada por decidir en esta pausa: se avanza directo,
      // sin esperar un clic extra en un botón de continuar.
      const count = document.getElementById("decisionsCount");
      track.innerHTML = `<p class="decisions__empty">Avanzando la temporada…</p>`;
      count.textContent = "Resuelto";
      simularTramoYAvanzar();
    } else {
      renderDecisions();
      animarReacomodoCards(track, posicionesPrevias);
    }
  }, 250);
}

// Un solo clic resuelve toda la pausa de ofertas: o fichas por un club
// nuevo, o te quedas en el actual. No hace falta rechazar una por una.
function resolveOferta(item) {
  const cardEl = document.querySelector(`.decision-card[data-id="${item.id}"]`);
  if (cardEl) cardEl.classList.add("decision-card--resolved");

  if (item.tipoOferta === "retiro") {
    temporadaActual.loteActual = [];
    setTimeout(finalizarCarrera, 250);
    return;
  }

  if (item.tipoOferta === "club") {
    // Fichaje a mitad de temporada (ya jugaste algún tramo con el club
    // actual): esa parte de la temporada cierra como su propia fila en
    // el historial, con sus propias estadísticas — no se mezclan dos
    // clubes bajo una sola fila. El historial puede así mostrar dos
    // filas para el mismo año si hubo un traspaso a mitad de camino.
    if (temporadaActual.partidos > 0) {
      const comp = temporadaActual.competiciones;
      temporadasFinalizadas.push({
        ...temporadaActual,
        trofeos: [...temporadaActual.trofeos],
        enCurso: false,
        competiciones: {
          liga: { ...comp.liga },
          copaNacional: comp.copaNacional ? { ...comp.copaNacional, rondasExtra: [...comp.copaNacional.rondasExtra] } : null,
          copaInternacional: comp.copaInternacional ? { ...comp.copaInternacional, rondasExtra: [...comp.copaInternacional.rondasExtra] } : null,
        },
      });

      temporadaActual.partidos = 0;
      temporadaActual.goles = 0;
      temporadaActual.asistencias = 0;
      temporadaActual.mvp = 0;
      temporadaActual.sumaRating = 0;
      temporadaActual.promedio = 0;
      temporadaActual.trofeos = [];
      temporadaActual.equipoAcumuladoTemporada = 0;
    }

    temporadaActual.equipoId = item.equipo.id;
    // Nuevo club, nuevo período de gracia de contrato (ver
    // TEMPORADAS_GRACIA_CONTRATO en generarLoteOfertas).
    temporadasEnClubActual = 0;
    // La liga se actualiza al nuevo club siempre (haya habido split o no):
    // sin esto, la temporada seguía mostrando la liga del club anterior
    // hasta el próximo cierre de temporada. La copa nacional/internacional
    // no se reinicia acá — sigue atada a los tramos ya jugados esta
    // temporada, igual que antes de este cambio.
    temporadaActual.competiciones.liga = { competicion: buscarCompeticionDomestica(item.liga.id, "liga"), partidosJugados: 0 };
    temporadaActual.titular = false;
    temporadaActual.forma = "regular";
    temporadaActual.valorMercado = GameConfig.calcularValorMercado(temporadaActual.ovr, item.equipo.nivel, item.liga.nivel);
    showToast(`Fichaste por ${item.equipo.nombre}.`);
    renderHero();
    renderSpotlight();
  } else {
    showToast(`Decidiste quedarte en ${item.equipo.nombre}.`);
  }

  temporadaActual.loteActual = [];

  // avanzarCheckpoint() ya dispara el siguiente render con fundido (ver
  // iniciarCheckpoint) — no hace falta un renderDecisions() intermedio acá,
  // que solo mostraría "no hay más ofertas" por una fracción de segundo
  // antes de ser tapado por el próximo checkpoint.
  setTimeout(avanzarCheckpoint, 250);
}

// ---------- SOLICITUD DE CAMBIO DE DORSAL ----------
// Se habilita al cerrar cada temporada (ver finalizarTemporada) y queda
// disponible hasta que se use — no hace falta pedirlo justo en ese
// instante. `contextoSolicitudNumero` guarda el OVR y el rendimiento
// colectivo CON LOS QUE CERRÓ esa temporada, para que el club evalúe el
// pedido con esos números y no con los de la temporada nueva recién
// arrancada (que todavía no jugó nada).
let puedeSolicitarNumero = false;
let contextoSolicitudNumero = null;

const numeroEditBtn = document.getElementById("numeroEditBtn");
const numeroModal = document.getElementById("numeroModal");
const numeroModalInput = document.getElementById("numeroModalInput");

function actualizarBotonNumero() {
  numeroEditBtn.hidden = !puedeSolicitarNumero;
}

function abrirModalNumero() {
  numeroModalInput.value = player.numero;
  numeroModal.hidden = false;
  numeroModalInput.focus();
}

function cerrarModalNumero() {
  numeroModal.hidden = true;
}

function confirmarCambioNumero() {
  const nuevoNumero = parseInt(numeroModalInput.value, 10);
  if (isNaN(nuevoNumero) || nuevoNumero < 1 || nuevoNumero > 99) {
    showToast("Elige un número entre 1 y 99.");
    return;
  }

  const { ovr, rendimiento } = contextoSolicitudNumero;
  const aceptado = Math.random() < GameConfig.probabilidadAceptarCambioNumero(ovr, rendimiento);

  cerrarModalNumero();
  puedeSolicitarNumero = false;
  actualizarBotonNumero();

  if (aceptado) {
    player.numero = nuevoNumero;
    document.getElementById("pbNumberBadge").textContent = nuevoNumero;
    const jerseyNumberEl = document.getElementById("jerseyNumber");
    if (jerseyNumberEl) jerseyNumberEl.textContent = nuevoNumero;
    showToast(`El club aprueba tu pedido: ahora usas la ${nuevoNumero}.`);
  } else {
    showToast(`El club rechaza tu pedido de cambio de dorsal — sigues con la ${player.numero}.`);
  }
}

// Cierra la carrera para siempre: no hay más pausas ni tramos, se archiva
// la temporada en curso tal como quedó y se muestra el mensaje de retiro.
let carreraFinalizada = false;

function finalizarCarrera() {
  carreraFinalizada = true;
  temporadaActual.enCurso = false;
  temporadasFinalizadas.push(temporadaActual);

  puedeSolicitarNumero = false;
  actualizarBotonNumero();

  document.getElementById("spotlight").style.display = "none";
  renderTimeline();

  const track = document.getElementById("decisionsTrack");
  const count = document.getElementById("decisionsCount");
  const title = document.getElementById("decisionsTitle");

  title.textContent = "Carrera finalizada";
  count.textContent = "Retirado";
  track.innerHTML = `
    <div class="retiro">
      <p class="decisions__empty">Te retiraste del fútbol profesional. ¡Gracias por una gran carrera, ${player.apellido}!</p>
      <div class="retiro__actions">
        <button type="button" class="btn btn--ghost" id="verResumenBtn">Ver resumen de mi carrera</button>
        <button type="button" class="btn" id="volverInicioBtn">Aceptar</button>
      </div>
    </div>
  `;
  document.getElementById("verResumenBtn").addEventListener("click", abrirResumenModal);
  document.getElementById("volverInicioBtn").addEventListener("click", () => {
    window.location.href = "index.html";
  });

  showToast(`${player.apellido} se retira del fútbol profesional.`);
}

// ---------- RESUMEN DE CARRERA (modal al retirarte) ----------
// Recorre todo temporadasFinalizadas (incluye las filas partidas por
// traspasos a mitad de temporada) para armar un panorama completo:
// clubes distintos en el orden en que se ficharon, estadísticas sumadas
// de punta a punta, picos de OVR/valor de mercado, y los trofeos
// agrupados por nombre (uno solo por tipo, con cuántas veces se ganó).
function construirResumenCarrera() {
  const filas = temporadasFinalizadas;

  const clubesVistos = new Set();
  const clubes = [];
  filas.forEach((s) => {
    if (!clubesVistos.has(s.equipoId)) {
      clubesVistos.add(s.equipoId);
      clubes.push(equipoDe(s));
    }
  });

  let partidos = 0, goles = 0, asistencias = 0, mvp = 0, sumaRating = 0;
  let mayorOvr = 0, mayorValor = 0;
  const trofeosPorNombre = new Map();
  const numerosTemporada = new Set();

  filas.forEach((s) => {
    partidos += s.partidos;
    goles += s.goles;
    asistencias += s.asistencias;
    mvp += s.mvp;
    sumaRating += s.sumaRating;
    if (s.ovr > mayorOvr) mayorOvr = s.ovr;
    if (s.valorMercado > mayorValor) mayorValor = s.valorMercado;
    numerosTemporada.add(s.numero);
    (s.trofeos || []).forEach((t) => {
      const existente = trofeosPorNombre.get(t.nombre);
      if (existente) existente.cantidad++;
      else trofeosPorNombre.set(t.nombre, { nombre: t.nombre, imagen: t.imagen, cantidad: 1 });
    });
  });

  return {
    clubes,
    partidos, goles, asistencias, mvp,
    promedio: partidos > 0 ? sumaRating / partidos : 0,
    mayorOvr,
    mayorValor,
    trofeos: [...trofeosPorNombre.values()],
    temporadasJugadas: numerosTemporada.size,
    edadRetiro: getEdadActual(),
  };
}

function trofeosResumenHtml(trofeos) {
  if (!trofeos || trofeos.length === 0) {
    return `<p class="resumen__empty">No ganaste trofeos en esta carrera — pero la viviste a fondo.</p>`;
  }
  return `
    <div class="trophies">
      ${trofeos.map((t) => `
        <span class="trophy-card" title="${t.nombre}">
          ${GameConfig.trofeoIconHtml(t)}
          <span class="trophy-card__name">${t.nombre}</span>
          ${t.cantidad > 1 ? `<span class="trophy-card__count">×${t.cantidad}</span>` : ""}
        </span>
      `).join("")}
    </div>
  `;
}

function renderResumenCarrera() {
  const r = construirResumenCarrera();
  const ultimoClub = r.clubes[r.clubes.length - 1];
  const totalTrofeos = r.trofeos.reduce((suma, t) => suma + t.cantidad, 0);

  document.getElementById("resumenModalBody").innerHTML = `
    <div class="resumen__header">
      ${GameConfig.crestHtml(ultimoClub, "team-crest team-crest--avatar")}
      <div>
        <h4 class="resumen__name">${player.apellido}</h4>
        <p class="resumen__subtitle">${POSITION_NAMES[player.posicion] ?? player.posicion} · ${r.temporadasJugadas} temporada${r.temporadasJugadas === 1 ? "" : "s"} · Retirado a los ${r.edadRetiro} años</p>
      </div>
    </div>

    <div class="resumen__stats">
      <div class="stat"><span class="stat__value">${r.partidos}</span><span class="stat__label">Partidos</span></div>
      <div class="stat"><span class="stat__value">${r.goles}</span><span class="stat__label">Goles</span></div>
      <div class="stat"><span class="stat__value">${r.asistencias}</span><span class="stat__label">Asistencias</span></div>
      <div class="stat"><span class="stat__value">${r.mvp}</span><span class="stat__label">MVP</span></div>
      <div class="stat"><span class="stat__value">${r.promedio.toFixed(1)}</span><span class="stat__label">Promedio</span></div>
      <div class="stat"><span class="stat__value">${r.mayorOvr}</span><span class="stat__label">Mayor OVR</span></div>
      <div class="stat"><span class="stat__value">${formatMarketValue(r.mayorValor)}</span><span class="stat__label">Mayor valor</span></div>
    </div>

    <div class="resumen__section">
      <h5 class="resumen__section-title">Clubes (${r.clubes.length})</h5>
      <div class="resumen__clubs">
        ${r.clubes.map((e) => `
          <div class="resumen__club" title="${e.nombre}">
            ${GameConfig.crestHtml(e, "team-crest team-crest--md")}
            <span class="resumen__club-name">${e.nombre}</span>
          </div>
        `).join("")}
      </div>
    </div>

    <div class="resumen__section">
      <h5 class="resumen__section-title">Trofeos (${totalTrofeos})</h5>
      ${trofeosResumenHtml(r.trofeos)}
    </div>
  `;
}

function abrirResumenModal() {
  renderResumenCarrera();
  document.getElementById("resumenModal").hidden = false;
}
function cerrarResumenModal() {
  document.getElementById("resumenModal").hidden = true;
}

// ---------- TOAST ----------
const toast = document.getElementById("toast");
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("toast--visible");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("toast--visible"), 3200);
}

// ---------- INIT ----------
numeroEditBtn.addEventListener("click", abrirModalNumero);
document.getElementById("numeroModalCancelar").addEventListener("click", cerrarModalNumero);
document.getElementById("numeroModalConfirmar").addEventListener("click", confirmarCambioNumero);

document.getElementById("resumenModalCerrar").addEventListener("click", cerrarResumenModal);
document.getElementById("resumenModal").addEventListener("click", (e) => {
  if (e.target.id === "resumenModal") cerrarResumenModal();
});

// Los trofeos en icono-solo (spotlight e historial) llevan el nombre en
// el atributo title, que el hover de escritorio ya muestra solo — pero
// en móvil no hay hover, así que un tap ahí no hacía nada. Delegado en
// document porque spotlight/historial se re-renderizan de cero en cada
// tramo/temporada.
document.addEventListener("click", (e) => {
  const trofeo = e.target.closest(".trophy-card");
  if (!trofeo) return;
  const nombre = trofeo.getAttribute("title");
  if (nombre) showToast(`🏆 ${nombre}`);
});

renderHero();
renderSpotlight();
renderTimeline();
actualizarBotonNumero();
iniciarCheckpoint();
document.getElementById("appFooter").textContent = GameConfig.footerHtml();
