// ============================================================
// GameConfig — Configuración y constantes centrales del juego.
//
// Punto único de verdad para valores de balance y fórmulas.
// El resto de los archivos (script.js, carrera.js, etc.) deben
// LEER de aquí en vez de repetir números sueltos ("magic numbers").
//
// Puro dato/lógica — sin dependencia del DOM. Los helpers que generaban
// HTML como string (footerHtml, crestHtml, crestFallback, ligaCrestHtml,
// trofeoIconHtml, flagHtml, flagFallback) NO se portaron acá: son
// presentación disfrazada de función, y en Vue se convierten en
// componentes chicos (AppFooter.vue, TeamCrest.vue, Flag.vue,
// TrophyIcon.vue) en vez de funciones que devuelven strings — se arman
// cuando haga falta (bloques 5-7 del plan de migración).
// ============================================================

import type { Liga, Equipo } from "../data/database";
import type { Forma } from "../data/events";

export type GrupoPosicion = "arquero" | "central" | "lateral" | "medio" | "ataque";
export type CategoriaEquipo = "humilde" | "consolidado" | "grande" | "aleatorio";
export type NivelLesion = "nivel1" | "nivel2" | "nivel3";
export type TipoPausaCalendario = "oferta" | "decision";

export interface VentanaOvr {
  min: number;
  max: number;
}

export interface OfertaBanda {
  categoria: CategoriaEquipo;
}

export interface PausaCalendario {
  tipo: TipoPausaCalendario;
  progreso: number;
}

export interface ResultadoTramo {
  goles: number;
  asistencias: number;
  mvp: number;
  sumaRating: number;
}

export interface SimularTramoParams {
  partidos: number;
  posicion: string;
  ovr: number;
  rendimientoAcumulado: number;
  fuerzaLiga?: number | null;
  factorTalento?: number;
}

interface GameConfigShape {
  VERSION: string;
  FECHA_PUBLICACION: string;

  EDAD_MIN: number;
  EDAD_MAX: number;
  DORSAL_INICIAL_PROB_BAJO: number;
  DORSAL_INICIAL_PROB_MEDIO: number;
  sortearDorsalInicial(): number;

  RANGO_EDAD_NOVATO_MAX: number;
  RANGO_EDAD_PROMEDIO_MAX: number;

  EJE_MAX: number;
  PODER_PESO_FUERZA: number;
  PODER_PESO_PRESTIGIO: number;
  PODER_PESO_ECONOMIA: number;
  ECONOMIA_PISO_LIGA: number;
  economiaEfectiva(equipo: Equipo, liga: Liga): number;
  poderLiga(liga: Liga): number;
  poderEquipo(equipo: Equipo, liga: Liga): number;

  OVR_INICIAL_MIN: number;
  OVR_INICIAL_MAX: number;
  OVR_PESO_EQUIPO: number;
  OVR_PESO_LIGA: number;
  OVR_SUERTE_VARIACION: number;
  calidadPoderCombinada(equipo: Equipo, liga: Liga): number;

  LIGAS_GRANDES_EUROPEAS: string[];
  CATEGORIA_EQUIPO_PERCENTIL: Record<"humilde" | "consolidado" | "grande", [number, number]>;
  OFERTAS_INICIALES: OfertaBanda[];
  OFERTAS_INICIALES_EXTRANJERO: OfertaBanda[];

  clamp(value: number, min: number, max: number): number;
  randomInt(min: number, max: number): number;
  randomFrom<T>(array: T[]): T;

  calcularOvrInicial(equipo: Equipo, liga: Liga): number;
  categoriaEquipoEnLiga(equipo: Equipo, equiposLiga: Equipo[]): number;
  elegirEquipoPorCategoria(equipos: Equipo[], categoria: CategoriaEquipo, excluirIds?: string[]): Equipo;
  generarOfertasDesdeBanda(equipos: Equipo[], banda: OfertaBanda[]): Equipo[];
  generarOfertasIniciales(equipos: Equipo[]): Equipo[];
  generarOfertasInicialesExtranjero(equipos: Equipo[]): Equipo[];

  VALOR_MERCADO_BASE: number;
  VALOR_MERCADO_CRECIMIENTO: number;
  VALOR_MULTIPLICADOR_CLUB_MIN: number;
  VALOR_MULTIPLICADOR_CLUB_MAX: number;
  VALOR_PESO_ECONOMIA: number;
  VALOR_PESO_PRESTIGIO: number;
  valorScoreLiga(liga: Liga): number;
  valorScoreEquipo(equipo: Equipo, liga: Liga): number;
  calcularMultiplicadorClub(equipo: Equipo, liga: Liga): number;
  calcularValorMercado(ovr: number, equipo: Equipo, liga: Liga): number;

  OFERTA_VARIACION_VALOR: number;
  valorOfrecidoPorClub(ovr: number, equipo: Equipo, liga: Liga): number;
  OFERTA_UMBRAL_CAIDA_VALOR: number;
  ofertaTieneValorRazonable(valorActual: number, valorEnClub: number): boolean;

  FORM_STATES: Record<Forma, { label: string; icon: string; color: string }>;
  FORMA_ORDEN: Forma[];
  FORMA_PESO_ACUMULACION: number;
  acumularForma(formaActual: Forma, formaObjetivo: Forma): Forma;

  rangoEdadDe(edad: number): "novato" | "promedio" | "veterano";
  muestraAleatoria<T>(array: T[], n: number): T[];

  RUTA_ESCUDOS_EQUIPOS: string;
  RUTA_ESCUDOS_LIGAS: string;
  rutaEscudoEquipo(equipo: Equipo): string;
  rutaEscudoLiga(liga: Liga): string;
  inicialesLiga(liga: Liga): string;
  RUTA_ESCUDOS_TROFEOS: string;
  RUTA_BANDERAS: string;

  elegirPonderado<T>(candidatos: T[], pesoFn: (candidato: T) => number, n: number): T[];
  OFERTA_TOP_ENCAJE_FRACCION: number;
  gruposTierAlto<T>(candidatos: T[], pesoFn: (candidato: T) => number, tamanioMinimo?: number): T[];
  elegirMejorEncaje<T>(candidatos: T[], pesoFn: (candidato: T) => number, n: number): T[];

  calcularPrestigioJugador(ovr: number): number;
  poderObjetivo(ovr: number): number;
  PESO_ESCALA_DISTANCIA: number;
  PESO_DISTANCIA_LIGA: number;
  PESO_EXPONENTE: number;
  PESO_FACTOR_SOBRAR: number;
  pesoPorCercaniaNivel(poderEquipo: number, poderLiga: number, poderObjetivo: number): number;

  OFERTA_TOLERANCIA_OVR: number;
  calcularCentroOvr(equipo: Equipo, liga: Liga): number;
  ventanaOvrOferta(equipo: Equipo, liga: Liga): VentanaOvr;
  equipoElegibleParaOvr(equipo: Equipo, liga: Liga, ovr: number): boolean;

  EDAD_RETIRO_OFERTA: number;
  EDAD_RETIRO_FORZOSO_MIN: number;
  EDAD_RETIRO_FORZOSO_MAX: number;
  EDAD_RETIRO_TRANSICION: number;
  TEMPORADAS_GRACIA_CONTRATO: number;
  TEMPORADAS_GRACIA_CONTRATO_PRIMER_CLUB: number;
  CONTRATO_RENDIMIENTO_SALVAVIDAS: number;
  contratoDebeTerminar(equipo: Equipo, liga: Liga, ovr: number, promedioTemporadaAnterior?: number | null): boolean;

  PRESTAMO_PESO_TITULAR_UMBRAL: number;
  PRESTAMO_PROMEDIO_UMBRAL: number;
  clubDebePrestar(pesoTitular: number, promedioTemporadaAnterior: number): boolean;

  EDAD_POTENCIAL_BONUS_MAX: number;
  EDAD_POTENCIAL_BONUS_HASTA: number;
  EDAD_POTENCIAL_PENALIZACION_DESDE: number;
  EDAD_POTENCIAL_PENALIZACION_TASA: number;
  potencialAjustadoPorEdad(ovr: number, edad: number): number;

  EDAD_OCASO_RETORNO_PAIS: number;
  PROB_OFERTA_NOSTALGICA: number;

  TOTAL_TRAMOS_TEMPORADA: number;
  ANIMACION_TRAMO_MS: number;
  CALENDARIO_PAUSA_ANTES_MITAD_MIN: number;
  CALENDARIO_PAUSA_ANTES_MITAD_MAX: number;
  CALENDARIO_PAUSA_ULTIMO_MOMENTO_MIN: number;
  CALENDARIO_PAUSA_ULTIMO_MOMENTO_MAX: number;
  crearCalendarioTemporada(numeroTemporada: number): PausaCalendario[];

  GRUPOS_POSICION: Record<string, GrupoPosicion>;
  PROPENSION_GOL_POSICION: Record<string, number>;
  PROPENSION_ASISTENCIA_POSICION: Record<string, number>;
  PROBABILIDAD_MVP_BASE: number;
  BONUS_MVP_POR_GOL: number;
  BONUS_MVP_POR_ASISTENCIA: number;
  BONUS_RATING_POR_GOL: number;
  BONUS_RATING_POR_ASISTENCIA: number;
  RATING_BASE: number;
  RATING_FACTOR_COEFICIENTE: number;

  ESTADISTICAS_OVR_BASE: number;
  ESTADISTICAS_OVR_EXPONENTE: number;
  ESTADISTICAS_OVR_RANGO: number;
  factorEstadisticoPorOvr(ovr: number): number;

  FACTOR_LIGA_COEFICIENTE: number;
  FACTOR_LIGA_MIN: number;
  FACTOR_LIGA_MAX: number;
  factorPorFuerzaLiga(ovr: number, fuerzaLiga: number | null): number;

  PROB_SEGUNDO_GOL_FACTOR: number;
  PROB_TERCER_GOL_FACTOR: number;
  golesEnPartido(probGol: number): number;
  simularTramo(params: SimularTramoParams): ResultadoTramo;

  OVR_TRAMO_BASE: number;
  OVR_TRAMO_RENDIMIENTO_DIVISOR: number;
  OVR_TRAMO_VARIACION_MIN: number;
  OVR_TRAMO_VARIACION_MAX: number;
  OVR_CARRERA_MIN: number;
  OVR_CARRERA_MAX: number;

  OVR_EDAD_PRIME_MAX: number;
  OVR_EDAD_DECLIVE_MAX: number;
  OVR_EDAD_FACTOR_MIN: number;
  factorCrecimientoPorEdad(edad: number): number;

  UMBRAL_CRECIMIENTO_ACELERADO: number;
  CRECIMIENTO_ACELERADO_FACTOR_MAX: number;
  factorAprendizajeJoven(ovrActual: number, edad: number): number;

  OVR_EDAD_DECLIVE_INICIO: number;
  OVR_EDAD_ACELERA_DECLIVE: number;
  OVR_EDAD_DECLIVE_TASA_BASE: number;
  OVR_EDAD_DECLIVE_TASA_ACELERADA: number;
  factorDeclivePorEdad(edad: number): number;

  redondeoEstocastico(valor: number): number;
  OVR_TRAMO_DECLIVE_VARIACION_MIN: number;

  TALENTO_MIN: number;
  TALENTO_MAX: number;
  sortearFactorTalento(): number;

  POTENCIAL_TECHO_PROB_BAJO: number;
  POTENCIAL_TECHO_PROB_MEDIO: number;
  POTENCIAL_TECHO_BAJO_MIN: number;
  POTENCIAL_TECHO_BAJO_MAX: number;
  POTENCIAL_TECHO_MEDIO_MIN: number;
  POTENCIAL_TECHO_MEDIO_MAX: number;
  POTENCIAL_TECHO_ALTO_MIN: number;
  POTENCIAL_TECHO_ALTO_MAX: number;
  POTENCIAL_TECHO_FACTOR_MIN: number;
  sortearPotencialTecho(): number;

  ajustarOvrTramo(ovrActual: number, rendimientoAcumulado: number, edad: number, factorTalento?: number, potencialTecho?: number): number;

  PESO_TITULAR_INICIAL: number;
  PESO_TITULAR_MIN: number;
  PESO_TITULAR_MAX: number;
  PESO_TITULAR_RATING_NEUTRO: number;
  PESO_TITULAR_AJUSTE_RATING: number;
  PESO_TITULAR_AJUSTE_MIN: number;
  PESO_TITULAR_AJUSTE_MAX: number;
  PESO_TITULAR_CASTIGO_SIN_MINUTOS: number;
  PESO_TITULAR_CASTIGO_LESION: number;
  TITULAR_OVR_REFERENCIA: number;
  TITULAR_OVR_PESO: number;
  ajustarPesoTitular(pesoActual: number, ratingTramo: number | null, estabaLesionado: boolean): number;
  calcularTitular(pesoTitular: number, ovr: number, rendimientoAcumulado: number): boolean;

  FORMA_CALIDAD: Record<Forma, number>;
  FUERZA_PESO_CLUB: number;
  FUERZA_PESO_FORMA: number;
  FUERZA_PESO_EQUIPO_ACUMULADO: number;
  FUERZA_PESO_RENDIMIENTO_JUGADOR: number;
  FUERZA_EQUIPO_ACUMULADO_REFERENCIA: number;
  FUERZA_RENDIMIENTO_PROMEDIO_PISO: number;
  FUERZA_RENDIMIENTO_PROMEDIO_RANGO: number;
  calidadFuerzaClub(equipo: Equipo, liga: Liga): number;
  calcularFuerzaCampana(equipo: Equipo, liga: Liga, forma: Forma, equipoAcumuladoTemporada: number, promedioJugador?: number | null): number;

  FUERZA_TITULO_PESO_CLUB: number;
  FUERZA_TITULO_PESO_FORMA: number;
  FUERZA_TITULO_PESO_EQUIPO_ACUMULADO: number;
  FUERZA_TITULO_PESO_RENDIMIENTO_JUGADOR: number;
  calcularFuerzaTitulo(equipo: Equipo, liga: Liga, forma: Forma, equipoAcumuladoTemporada: number, promedioJugador?: number | null): number;

  probGanarLiga(fuerza: number): number;
  probGanarCopa(fuerza: number): number;
  probAvanzarRonda(fuerza: number): number;

  UMBRAL_CLASIFICA_PRIMER_NIVEL: number;
  UMBRAL_CLASIFICA_SEGUNDO_NIVEL: number;

  PREMIOS_CANDIDATOS_N: number;
  PREMIOS_OVR_MIN: number;
  PREMIOS_OVR_MAX: number;
  PREMIOS_PESO_GRUPO: Partial<Record<GrupoPosicion, number>>;
  POSICION_REPRESENTATIVA_GRUPO: Record<GrupoPosicion, string>;
  sortearOvrCandidatoPremio(): number;
  sortearGrupoCandidatoPremio(): GrupoPosicion;

  ONCE_IDEAL_MARGEN_PROMEDIO: number;
  BALON_ORO_PESO_RATING: number;
  BALON_ORO_PESO_GOLEADOR: number;
  BALON_ORO_PESO_TROFEOS: number;
  BALON_ORO_REFERENCIA_GOLES: number;
  calcularCalidadBalonDeOro(promedio: number, golesMasAsistencias: number, ganoTrofeo: boolean): number;

  UMBRAL_OVR_CONVOCATORIA_BASE: number;
  UMBRAL_OVR_CONVOCATORIA_FACTOR: number;
  PROB_CONVOCATORIA_PENDIENTE_OVR: number;
  PROB_CONVOCATORIA_MIN: number;
  PROB_CONVOCATORIA_MAX: number;
  umbralOvrConvocatoria(fuerzaSeleccion: number): number;
  probConvocatoria(ovr: number, fuerzaSeleccion: number): number;

  SELECCION_PESO_JUGADOR: number;
  calidadSeleccion(fuerzaSeleccion: number, forma: Forma): number;
  probClasificarTorneoSeleccion(calidad: number): number;
  probAvanzarFaseDeGruposSeleccion(calidad: number): number;

  PARTIDOS_AMISTOSO_SELECCION_MIN: number;
  PARTIDOS_AMISTOSO_SELECCION_MAX: number;
  PARTIDOS_ELIMINATORIAS_MIN: number;
  PARTIDOS_ELIMINATORIAS_MAX: number;
  PARTIDOS_FASE_DE_GRUPOS_SELECCION: number;
  RONDAS_KO_MUNDIAL: number;
  RONDAS_KO_CONTINENTAL: number;
  NOMBRES_RONDA_KO: Record<number, string[]>;
  tipoAnoTorneoSeleccion(numeroTemporada: number): "mundial" | "continental" | null;

  FORMA_BONUS_PARTICIPACION: Record<Forma, number>;
  PARTICIPACION_OVR_REFERENCIA: number;
  PARTICIPACION_OVR_PESO_BAJO: number;
  PARTICIPACION_OVR_PESO_ALTO: number;
  PARTICIPACION_MIN: number;
  PARTICIPACION_MAX: number;
  PARTICIPACION_BASE: number;
  PARTICIPACION_BONUS_TITULAR: number;
  probabilidadJugar(ovr: number, rendimientoAcumulado: number, forma: Forma, esTitular: boolean): number;

  PETICION_NUMERO_BASE: number;
  PETICION_NUMERO_OVR_PESO: number;
  PETICION_NUMERO_EQUIPO_PESO: number;
  probabilidadAceptarCambioNumero(ovr: number, equipoAcumuladoTemporada: number): number;

  PROB_LESION_BASE: number;
  PROB_LESION_EDAD_INICIO: number;
  PROB_LESION_EDAD_INCREMENTO: number;
  PROB_LESION_MAX: number;
  probabilidadLesion(edad: number): number;

  PESO_LESION_NIVEL1: number;
  PESO_LESION_NIVEL2: number;
  elegirNivelLesion(): NivelLesion;

  LESION_NIVEL3_DURACION: number;
  LESION_NIVEL2_DURACION_MIN: number;
  LESION_NIVEL2_DURACION_MAX: number;
  LESION_NIVEL1_DURACION_MIN: number;
  LESION_NIVEL2_OVR_MIN: number;
  LESION_NIVEL2_OVR_MAX: number;
  LESION_NIVEL1_OVR_MIN: number;
  LESION_NIVEL1_OVR_MAX: number;
  duracionLesion(nivel: NivelLesion, tramosDisponibles: number): number;
  ovrPerdidoPorLesion(nivel: NivelLesion): number;
  LESION_RECUPERACION_OVR: number;
}

export const GameConfig: GameConfigShape = {
  // ---------------- VERSIÓN ----------------
  // Se muestra en el pie de página de cada pantalla (ver AppFooter.vue,
  // que arma el texto — acá solo viven los datos).
  // Actualizar acá al publicar una versión nueva — no repetir el
  // número/fecha sueltos en cada componente.
  VERSION: "1.0.0-RC",
  FECHA_PUBLICACION: "9 de septiembre de 2026 · 10:22",

  // ---------------- CREACIÓN DE PERSONAJE ----------------
  EDAD_MIN: 16,
  EDAD_MAX: 19,

  // Dorsal inicial: antes era GameConfig.randomInt(1, 99) parejo — un
  // debutante tenía la misma chance de arrancar con el 7 que con el 87,
  // nada realista (los números altos casi no se usan, salvo excepción).
  // Por niveles en vez de una curva continua, para controlar la
  // proporción exacta: 70% de las carreras arranca con un número común
  // (1-30), 20% con uno menos común (31-50), y solo 10% con uno alto
  // (51-99) — el caso ocasional, no la norma.
  DORSAL_INICIAL_PROB_BAJO: 0.7, // 1-30
  DORSAL_INICIAL_PROB_MEDIO: 0.2, // 31-50 (acumulado con el de arriba: 90% — el 10% restante es 51-99)

  sortearDorsalInicial() {
    const r = Math.random();
    if (r < GameConfig.DORSAL_INICIAL_PROB_BAJO) return GameConfig.randomInt(1, 30);
    if (r < GameConfig.DORSAL_INICIAL_PROB_BAJO + GameConfig.DORSAL_INICIAL_PROB_MEDIO) return GameConfig.randomInt(31, 50);
    return GameConfig.randomInt(51, 99);
  },

  // ---------------- RANGOS DE EDAD (para eventos de temporada) ----------------
  // novato: edad <= RANGO_EDAD_NOVATO_MAX
  // promedio: entre RANGO_EDAD_NOVATO_MAX+1 y RANGO_EDAD_PROMEDIO_MAX
  // veterano: edad > RANGO_EDAD_PROMEDIO_MAX
  RANGO_EDAD_NOVATO_MAX: 21,
  RANGO_EDAD_PROMEDIO_MAX: 32,

  // ---------------- CLASIFICACIÓN DE CLUBES Y LIGAS (ocultos al jugador) ----------------
  // Cada equipo y cada liga tiene 3 ejes de 0 a 100 (ver database.js):
  //   - fuerza: nivel deportivo actual del plantel/competencia.
  //   - prestigio: historia, títulos, marca — pesa aunque hoy no sea tu
  //     mejor momento (un United en crisis deportiva sigue siendo un
  //     United).
  //   - economia: poder financiero (presupuesto, sueldos, TV).
  // Reemplaza al viejo `nivel` entero (1-3 equipo, 1-6 liga): esa escala
  // era demasiado corta para sostener todo lo que dependía de ella —
  // ver `poder`/`poderLiga`/`calidadFuerzaClub`/`valorScoreClub` abajo,
  // que separan qué eje alimenta cada mecánica en vez de mezclar todo
  // en un solo número.
  EJE_MAX: 100,

  // Peso de cada eje al combinarlos en un "poder" único — para todo lo
  // que en la vida real depende de una mezcla de las tres cosas a la vez
  // (qué tan buena oferta es un club, a qué apunta el potencial de un
  // jugador). La fuerza de campaña (quién gana títulos) y el valor de
  // mercado, en cambio, NO usan poder — usan solo el eje que les
  // corresponde (ver calidadFuerzaClub / valorScoreClub más abajo).
  PODER_PESO_FUERZA: 0.4,
  PODER_PESO_PRESTIGIO: 0.35,
  PODER_PESO_ECONOMIA: 0.25,

  // La economía de un club nunca cae por debajo de este % de la de su
  // propia liga — un club chico de Premier League igual tiene más plata
  // que casi cualquier gigante de una liga menor, por el reparto de TV.
  // Así no hace falta acordarse de ajustar esto a mano club por club.
  ECONOMIA_PISO_LIGA: 0.6,

  economiaEfectiva(equipo, liga) {
    return Math.max(equipo.economia, liga.economia * GameConfig.ECONOMIA_PISO_LIGA);
  },

  poderLiga(liga) {
    return GameConfig.PODER_PESO_FUERZA * liga.fuerza
      + GameConfig.PODER_PESO_PRESTIGIO * liga.prestigio
      + GameConfig.PODER_PESO_ECONOMIA * liga.economia;
  },

  poderEquipo(equipo, liga) {
    return GameConfig.PODER_PESO_FUERZA * equipo.fuerza
      + GameConfig.PODER_PESO_PRESTIGIO * equipo.prestigio
      + GameConfig.PODER_PESO_ECONOMIA * GameConfig.economiaEfectiva(equipo, liga);
  },

  // ---------------- OVR INICIAL ----------------
  OVR_INICIAL_MIN: 50,
  OVR_INICIAL_MAX: 65,

  // Peso relativo de equipo vs. liga al combinar sus "poder" (deben sumar 1)
  // — se reutiliza para OVR inicial, ventana de ofertas y valor de mercado.
  OVR_PESO_EQUIPO: 0.55,
  OVR_PESO_LIGA: 0.45,

  // Variación máxima (+/-) que puede aportar la suerte antes de recortar al rango permitido.
  OVR_SUERTE_VARIACION: 4,

  // Combina el poder de equipo y liga en una sola calidad 0..1 — punto
  // único de verdad que reutilizan calcularOvrInicial, calcularCentroOvr
  // y calcularMultiplicadorClub (que le agrega su propio valorScore encima).
  calidadPoderCombinada(equipo, liga) {
    const calidadEquipo = GameConfig.poderEquipo(equipo, liga) / GameConfig.EJE_MAX;
    const calidadLiga = GameConfig.poderLiga(liga) / GameConfig.EJE_MAX;
    return calidadEquipo * GameConfig.OVR_PESO_EQUIPO + calidadLiga * GameConfig.OVR_PESO_LIGA;
  },

  // ---------------- OFERTAS DE EQUIPO INICIAL ----------------
  // Las 4 opciones que se le presentan al jugador al empezar la carrera.
  // Todavía no existe un OVR (se calcula recién al elegir), así que en
  // vez de la ventana de OVR que sí aplica a las ofertas durante la
  // carrera, se elige por percentil de poder DENTRO de la liga elegida
  // ("humilde" = mitad de abajo, "consolidado" = 50-85%, "grande" =
  // el 15% de arriba) — sigue el mismo espíritu que antes (2-3 clubes
  // chicos/medios y como mucho 1 grande), ya sin depender de un campo
  // de nivel fijo por club.
  //
  // Si el país elegido tiene liga propia en la base de datos, las 4
  // ofertas salen de esa liga (banda normal). Si no, arranca en una de
  // las 5 grandes ligas europeas al azar, con una banda más floja
  // (sin favores: solo clubes chicos/medios).
  LIGAS_GRANDES_EUROPEAS: ["premier-league", "la-liga", "serie-a", "bundesliga", "ligue-1"],

  CATEGORIA_EQUIPO_PERCENTIL: { humilde: [0, 0.5], consolidado: [0.5, 0.85], grande: [0.85, 1] },

  OFERTAS_INICIALES: [
    { categoria: "humilde" },
    { categoria: "humilde" },
    { categoria: "consolidado" },
    { categoria: "aleatorio" },
  ],

  OFERTAS_INICIALES_EXTRANJERO: [
    { categoria: "humilde" },
    { categoria: "humilde" },
    { categoria: "humilde" },
    { categoria: "consolidado" },
  ],

  // ============================================================
  // UTILIDADES
  // ============================================================

  clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  },

  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  randomFrom<T>(array: T[]) {
    return array[GameConfig.randomInt(0, array.length - 1)] as T;
  },

  // ============================================================
  // CÁLCULO DE OVR INICIAL
  // Mezcla el poder combinado de equipo + liga + suerte, siempre
  // acotado entre OVR_INICIAL_MIN y OVR_INICIAL_MAX.
  // ============================================================
  calcularOvrInicial(equipo, liga) {
    const calidadCombinada = GameConfig.calidadPoderCombinada(equipo, liga);

    const rango = GameConfig.OVR_INICIAL_MAX - GameConfig.OVR_INICIAL_MIN;
    const base = GameConfig.OVR_INICIAL_MIN + calidadCombinada * rango;

    const suerte = GameConfig.randomInt(
      -GameConfig.OVR_SUERTE_VARIACION, GameConfig.OVR_SUERTE_VARIACION
    );

    const ovrFinal = Math.round(base + suerte);
    return GameConfig.clamp(ovrFinal, GameConfig.OVR_INICIAL_MIN, GameConfig.OVR_INICIAL_MAX);
  },

  // ============================================================
  // OFERTAS DE EQUIPO INICIAL
  // Elige un equipo al azar dentro de la categoría de percentil pedida,
  // evitando repetir (cuando el dataset lo permite).
  // ============================================================
  // Ranking puramente RELATIVO dentro de la misma liga — no hace falta el
  // piso económico de liga (economiaEfectiva) acá, porque ese piso afecta
  // por igual a todos los equipos de una misma liga y no cambia el orden.
  categoriaEquipoEnLiga(equipo, equiposLiga) {
    const poderBruto = (e: Equipo) => GameConfig.PODER_PESO_FUERZA * e.fuerza
      + GameConfig.PODER_PESO_PRESTIGIO * e.prestigio
      + GameConfig.PODER_PESO_ECONOMIA * e.economia;
    const ordenados = [...equiposLiga].sort((a, b) => poderBruto(b) - poderBruto(a));
    const idx = ordenados.findIndex((e) => e.id === equipo.id);
    return 1 - idx / Math.max(1, ordenados.length - 1); // 1 = el mejor de la liga, 0 = el peor
  },

  elegirEquipoPorCategoria(equipos, categoria, excluirIds = []) {
    const disponibles = equipos.filter((e) => !excluirIds.includes(e.id));
    if (disponibles.length === 0) return GameConfig.randomFrom(equipos);

    if (categoria === "aleatorio") return GameConfig.randomFrom(disponibles);

    const [pMin, pMax] = GameConfig.CATEGORIA_EQUIPO_PERCENTIL[categoria];
    const candidatos = disponibles.filter((e) => {
      const percentil = GameConfig.categoriaEquipoEnLiga(e, equipos);
      return percentil >= pMin && percentil <= pMax;
    });
    return GameConfig.randomFrom(candidatos.length > 0 ? candidatos : disponibles);
  },

  generarOfertasDesdeBanda(equipos, banda) {
    const usados: string[] = [];
    return banda.map((oferta) => {
      const equipo = GameConfig.elegirEquipoPorCategoria(equipos, oferta.categoria, usados);
      usados.push(equipo.id);
      return equipo;
    });
  },

  // Ofertas de la liga del propio país del jugador (2 humildes, 1 consolidado, 1 al azar).
  generarOfertasIniciales(equipos) {
    return GameConfig.generarOfertasDesdeBanda(equipos, GameConfig.OFERTAS_INICIALES);
  },

  // Ofertas cuando el jugador arranca "de extranjero" en una liga grande
  // (3 humildes, 1 consolidado — sin la chance de "grande" ni la casilla al azar).
  generarOfertasInicialesExtranjero(equipos) {
    return GameConfig.generarOfertasDesdeBanda(equipos, GameConfig.OFERTAS_INICIALES_EXTRANJERO);
  },

  // ============================================================
  // VALOR DE MERCADO
  // Curva exponencial sobre el OVR (como en la vida real: cada punto
  // extra de calidad cerca del techo vale desproporcionadamente más),
  // multiplicada por el prestigio Y la economía del club/liga actual —
  // a propósito NO usa el eje fuerza: cuánto valés en el mercado
  // depende de la plata y la marca del club que te tiene, no de si ese
  // club está ganando títulos esta temporada.
  // ============================================================
  VALOR_MERCADO_BASE: 18000, // valor en el piso absoluto de OVR (OVR_CARRERA_MIN)
  VALOR_MERCADO_CRECIMIENTO: 1.185, // multiplicador de valor por cada punto de OVR extra

  VALOR_MULTIPLICADOR_CLUB_MIN: 0.5, // club/liga más floja posible
  VALOR_MULTIPLICADOR_CLUB_MAX: 1.4, // club/liga más prestigiosa posible

  VALOR_PESO_ECONOMIA: 0.6,
  VALOR_PESO_PRESTIGIO: 0.4,

  valorScoreLiga(liga) {
    return GameConfig.VALOR_PESO_ECONOMIA * liga.economia + GameConfig.VALOR_PESO_PRESTIGIO * liga.prestigio;
  },

  valorScoreEquipo(equipo, liga) {
    const economiaEfectiva = GameConfig.economiaEfectiva(equipo, liga);
    return GameConfig.VALOR_PESO_ECONOMIA * economiaEfectiva + GameConfig.VALOR_PESO_PRESTIGIO * equipo.prestigio;
  },

  calcularMultiplicadorClub(equipo, liga) {
    const calidadEquipo = GameConfig.valorScoreEquipo(equipo, liga) / GameConfig.EJE_MAX;
    const calidadLiga = GameConfig.valorScoreLiga(liga) / GameConfig.EJE_MAX;
    const calidadCombinada = calidadEquipo * GameConfig.OVR_PESO_EQUIPO + calidadLiga * GameConfig.OVR_PESO_LIGA;
    const rango = GameConfig.VALOR_MULTIPLICADOR_CLUB_MAX - GameConfig.VALOR_MULTIPLICADOR_CLUB_MIN;
    return GameConfig.VALOR_MULTIPLICADOR_CLUB_MIN + calidadCombinada * rango;
  },

  calcularValorMercado(ovr, equipo, liga) {
    const valorPorOvr = GameConfig.VALOR_MERCADO_BASE * Math.pow(GameConfig.VALOR_MERCADO_CRECIMIENTO, ovr - GameConfig.OVR_CARRERA_MIN);
    const multiplicadorClub = GameConfig.calcularMultiplicadorClub(equipo, liga);
    const valor = valorPorOvr * multiplicadorClub;
    return Math.round(valor / 1000) * 1000;
  },

  // La variación cosmética por oferta se mantiene igual que antes — ahora
  // con puntajes continuos ya no hay combinaciones repetidas idénticas,
  // pero sigue sumando textura para que dos clubes de poder parecido no
  // valoren tu pase por el mismo número exacto al centavo.
  OFERTA_VARIACION_VALOR: 0.08,
  valorOfrecidoPorClub(ovr, equipo, liga) {
    const base = GameConfig.calcularValorMercado(ovr, equipo, liga);
    const jitter = 1 + (Math.random() * 2 - 1) * GameConfig.OFERTA_VARIACION_VALOR;
    return Math.round((base * jitter) / 1000) * 1000;
  },

  // Filtro de sentido común para ofertas de fichaje: además de la ventana
  // de OVR (ver más abajo), un club no debería ofertarte si ficharte
  // implicara un desplome de tu valor de mercado — señal clara de que,
  // aunque el OVR dé "elegible" en el margen, ese club no está realmente
  // a tu altura. `valorEnClub` es el valor que tendrías vos en ESE club
  // en particular (mismo OVR, distinto nivel de equipo/liga).
  OFERTA_UMBRAL_CAIDA_VALOR: 0.4, // mínimo: no menos del 40% de tu valor actual
  ofertaTieneValorRazonable(valorActual, valorEnClub) {
    if (valorActual <= 0) return true;
    return valorEnClub >= valorActual * GameConfig.OFERTA_UMBRAL_CAIDA_VALOR;
  },

  // ============================================================
  // BANCO DE ESTADOS DE FORMA
  // De mejor a peor. Afecta cómo se muestra el estado del jugador
  // en la temporada en curso.
  // ============================================================
  FORM_STATES: {
    inspirado: { label: "Inspirado", icon: "🔥", color: "#ffb703" },
    plenitud: { label: "En plenitud", icon: "💪", color: "#34d399" },
    animado: { label: "Animado", icon: "🙂", color: "#22d3ee" },
    regular: { label: "Regular", icon: "😐", color: "#a3b1d6" },
    desanimado: { label: "Desanimado", icon: "😕", color: "#f97316" },
    bajo: { label: "Bajo de forma", icon: "📉", color: "#ef4444" },
    lesionado: { label: "Tocado físicamente", icon: "🤕", color: "#ef4444" },
  },

  // Mismo orden que arriba (de mejor a peor) pero como lista, para poder
  // movernos por pasos en vez de solo consultar cada estado por nombre.
  FORMA_ORDEN: ["inspirado", "plenitud", "animado", "regular", "desanimado", "bajo", "lesionado"],

  // Cada opción de evento ya no TELETRANSPORTA la forma al estado que
  // indica su `efectos.forma` — lo usa como un objetivo hacia el que te
  // "empuja" ese eje, recorriendo una fracción del camino desde donde
  // ya estabas. Así, si en la misma pausa resolvés 2 decisiones que
  // tiran para el mismo lado, tu forma sigue mejorando/empeorando en
  // vez de que la segunda pise a la primera — y si tiran para lados
  // opuestos, se combinan en vez de que gane la que se resolvió último.
  FORMA_PESO_ACUMULACION: 0.5,

  acumularForma(formaActual, formaObjetivo) {
    const orden = GameConfig.FORMA_ORDEN;
    const iActual = orden.indexOf(formaActual);
    const iObjetivo = orden.indexOf(formaObjetivo);
    if (iActual === -1 || iObjetivo === -1 || iActual === iObjetivo) return formaObjetivo ?? formaActual;
    // Paso mínimo de 1 (no proporcional puro): con brechas cortas, redondear
    // hacia abajo dejaba la mejora empantanada justo un escalón antes del
    // objetivo para siempre (0.5 de un solo escalón nunca llegaba a
    // completarlo) — así, un mismo empujón sostenido SIEMPRE termina
    // alcanzando el objetivo tras suficientes pasos, nunca se estanca.
    const direccion = iObjetivo > iActual ? 1 : -1;
    const distancia = Math.abs(iObjetivo - iActual);
    const paso = Math.max(1, Math.round(distancia * GameConfig.FORMA_PESO_ACUMULACION));
    const iNuevo = GameConfig.clamp(iActual + direccion * paso, 0, orden.length - 1);
    return orden[iNuevo] as Forma;
  },

  // ============================================================
  // RANGO DE EDAD → usado para elegir qué banco de eventos aplica
  // ============================================================
  rangoEdadDe(edad) {
    if (edad <= GameConfig.RANGO_EDAD_NOVATO_MAX) return "novato";
    if (edad <= GameConfig.RANGO_EDAD_PROMEDIO_MAX) return "promedio";
    return "veterano";
  },

  // Elige `n` elementos únicos al azar de un array, sin modificar el original.
  muestraAleatoria<T>(array: T[], n: number) {
    const copia = [...array];
    const resultado: T[] = [];
    for (let i = 0; i < n && copia.length > 0; i++) {
      const idx = GameConfig.randomInt(0, copia.length - 1);
      resultado.push(copia.splice(idx, 1)[0] as T);
    }
    return resultado;
  },

  // ============================================================
  // ESCUDOS (equipos y ligas)
  // Poné los archivos en:
  //   assets/escudos/equipos/<archivo>
  //   assets/escudos/ligas/<archivo>
  // Por convención, si el equipo/liga no trae el campo `escudo`,
  // se busca "<id>.png" automáticamente. Si el archivo no existe
  // (o todavía no lo cargaste), se muestra solo el placeholder de
  // iniciales + color — no hace falta completar todos de entrada.
  // ============================================================
  RUTA_ESCUDOS_EQUIPOS: "assets/escudos/equipos/",
  RUTA_ESCUDOS_LIGAS: "assets/escudos/ligas/",

  rutaEscudoEquipo(equipo) {
    return GameConfig.RUTA_ESCUDOS_EQUIPOS + (equipo.escudo || `${equipo.id}.png`);
  },
  rutaEscudoLiga(liga) {
    return GameConfig.RUTA_ESCUDOS_LIGAS + (liga.escudo || `${liga.id}.png`);
  },

  // Deriva las iniciales de una liga a partir de su nombre, para el
  // placeholder de respaldo cuando el escudo no carga (las ligas no
  // tienen colores propios en la base de datos como sí los equipos, así
  // que ese placeholder usa el degradado por defecto).
  inicialesLiga(liga) {
    const letras = liga.nombre.replace(/[^\p{L}\s]/gu, "").trim().split(/\s+/);
    return letras.map((p) => p[0]).join("").slice(0, 3).toUpperCase();
  },

  // Trofeos de las competiciones reales (ver GameDatabase.competiciones):
  // los archivos son siluetas negras sobre fondo transparente — se pintan
  // del dorado del sistema con `mask-image` (el color real del PNG no
  // importa, solo su alpha). Si el trofeo todavía no tiene imagen cargada
  // (`trofeoImagen` vacío), el componente que lo consuma cae al ícono
  // genérico 🏆 de respaldo.
  RUTA_ESCUDOS_TROFEOS: "assets/escudos/trofeos/",

  // ============================================================
  // BANDERAS DE PAÍS
  // Windows no dibuja los emoji de bandera (muestra el código de 2
  // letras suelto), así que se usan imágenes reales por código ISO
  // 3166-1 alpha-2 (flagcdn.com, gratis, sin API key). Si por lo que
  // sea la imagen no carga, el componente cae al emoji como respaldo.
  // ============================================================
  RUTA_BANDERAS: "https://flagcdn.com/w40/",

  // Elige `n` elementos únicos al azar de `candidatos`, con probabilidad
  // proporcional a `pesoFn(candidato)` (mayor peso = más chance de salir).
  elegirPonderado<T>(candidatos: T[], pesoFn: (candidato: T) => number, n: number) {
    const disponibles = [...candidatos];
    const resultado: T[] = [];
    for (let i = 0; i < n && disponibles.length > 0; i++) {
      const pesos = disponibles.map(pesoFn);
      const total = pesos.reduce((a, b) => a + b, 0);
      let r = Math.random() * total;
      let idx = pesos.length - 1;
      for (let j = 0; j < pesos.length; j++) {
        r -= pesos[j] as number;
        if (r <= 0) { idx = j; break; }
      }
      resultado.push(disponibles.splice(idx, 1)[0] as T);
    }
    return resultado;
  },

  // Fracción del pool ya elegible que se considera "el mejor encaje": se
  // ordena por peso descendente y solo se sortea (ponderado, para que
  // siga habiendo variedad) dentro de ese grupo de arriba. Antes se
  // sorteaba entre TODOS los elegibles por igual — un jugador a la
  // altura de los grandes clubes podía perfectamente no verlos nunca,
  // porque el peso pesaba pero no mandaba. Ahora, si tu nivel da para
  // los mejores del rango elegible, van a ser esos los que aparezcan.
  OFERTA_TOP_ENCAJE_FRACCION: 0.4,

  // `tamanioMinimo` garantiza que el grupo top tenga al menos ese tamaño
  // (para que elegirMejorEncaje siempre tenga de dónde sortear n) — sin
  // mínimo (0), da el grupo top "real", útil para preguntas como "¿este
  // candidato puntual entra en la élite de lo que este jugador puede
  // alcanzar?" (ver generarLoteOfertas, garantía de entorno).
  gruposTierAlto(candidatos, pesoFn, tamanioMinimo = 0) {
    const ordenados = [...candidatos].sort((a, b) => pesoFn(b) - pesoFn(a));
    const tamanioTop = Math.max(tamanioMinimo, Math.ceil(ordenados.length * GameConfig.OFERTA_TOP_ENCAJE_FRACCION));
    return ordenados.slice(0, tamanioTop);
  },

  elegirMejorEncaje(candidatos, pesoFn, n) {
    const grupoTop = GameConfig.gruposTierAlto(candidatos, pesoFn, n);
    return GameConfig.elegirPonderado(grupoTop, pesoFn, n);
  },

  // ============================================================
  // PRESTIGIO DEL JUGADOR → a qué poder de equipo/liga "apunta"
  // Cuanto más OVR, a más poder apuntan sus ofertas. No es un corte
  // duro: se usa como peso, así que igual pueden aparecer ofertas de
  // clubes algo más grandes o más chicos.
  // ============================================================
  calcularPrestigioJugador(ovr) {
    const rango = GameConfig.OVR_CARRERA_MAX - GameConfig.OVR_CARRERA_MIN;
    return GameConfig.clamp((ovr - GameConfig.OVR_CARRERA_MIN) / rango, 0, 1);
  },

  // Un solo objetivo (no uno por equipo y otro por liga, como antes):
  // ahora que equipo y liga comparten la misma escala de poder 0-100,
  // no hace falta un objetivo por escala distinta.
  poderObjetivo(ovr) {
    return GameConfig.calcularPrestigioJugador(ovr) * GameConfig.EJE_MAX;
  },

  // Peso de una oferta según qué tan cerca está su poder del objetivo del
  // jugador. Exponente > 1 para que el efecto se note fuerte (no un sesgo
  // apenas perceptible). PESO_ESCALA_DISTANCIA lleva la distancia (en
  // puntos de poder, 0-100) a un rango parecido al que tenía la vieja
  // escala de "nivel" (unos pocos puntos) para que el exponente siga
  // funcionando con la misma sensibilidad de antes.
  PESO_ESCALA_DISTANCIA: 10,
  PESO_DISTANCIA_LIGA: 0.6, // cuánto pesa desviarse en liga vs. desviarse en equipo
  PESO_EXPONENTE: 2.2,
  // Quedarte CORTO de tu objetivo (club/liga peor de lo que ese nivel de
  // OVR "pide") penaliza normal — eso es lo que ya evita ofertas sin
  // sentido para abajo. Pasarte de grande casi no penaliza: un club
  // mejor que tu objetivo no debería competir en desventaja solo por
  // "sobrar" — en la vida real los clubes grandes te quieren igual
  // aunque técnicamente estés "por debajo de su nivel ideal". Sin este
  // colchón, el objetivo actuaba como un techo invisible: a un OVR
  // bueno-pero-no-élite (~80), Europa nunca competía con ligas más
  // chicas pero más "cercanas" al objetivo exacto.
  PESO_FACTOR_SOBRAR: 0.05,
  pesoPorCercaniaNivel(poderEquipo, poderLiga, poderObjetivo) {
    const deltaEquipo = (poderEquipo - poderObjetivo) / GameConfig.PESO_ESCALA_DISTANCIA;
    const deltaLiga = (poderLiga - poderObjetivo) / GameConfig.PESO_ESCALA_DISTANCIA;
    // A diferencia de la vieja escala de "nivel" (1 = mejor, invertida),
    // acá más poder es SIEMPRE mejor — así que "sobrar" es delta > 0
    // (club/liga por encima del objetivo) y "quedarse corto" es delta < 0,
    // al revés de como se comparaba con nivel. Sobrar casi no penaliza;
    // quedarse corto penaliza normal (ver comentario arriba).
    const factorEquipo = deltaEquipo > 0 ? GameConfig.PESO_FACTOR_SOBRAR : 1;
    const factorLiga = deltaLiga > 0 ? GameConfig.PESO_FACTOR_SOBRAR : 1;
    const distancia = Math.abs(deltaEquipo) * factorEquipo
      + Math.abs(deltaLiga) * factorLiga * GameConfig.PESO_DISTANCIA_LIGA;
    return 1 / Math.pow(1 + distancia, GameConfig.PESO_EXPONENTE);
  },

  // ============================================================
  // VENTANA DE OVR PARA OFERTAS
  // Cada combinación equipo+liga solo puede ofertarte dentro de un
  // rango de OVR ("está a tu altura"). Se calcula con la misma
  // fórmula de calidad que el OVR inicial, pero mapeada a todo el
  // rango de carrera (45-99): el punto donde ese club es "justo tu
  // nivel", más/menos una tolerancia. Al recortarse solo en 45/99,
  // los clubes top no tienen techo y los chicos no tienen piso.
  // ============================================================
  OFERTA_TOLERANCIA_OVR: 13,

  calcularCentroOvr(equipo, liga) {
    const calidadCombinada = GameConfig.calidadPoderCombinada(equipo, liga);
    const rango = GameConfig.OVR_CARRERA_MAX - GameConfig.OVR_CARRERA_MIN;
    return GameConfig.OVR_CARRERA_MIN + calidadCombinada * rango;
  },

  ventanaOvrOferta(equipo, liga) {
    const centro = GameConfig.calcularCentroOvr(equipo, liga);
    return {
      min: GameConfig.clamp(centro - GameConfig.OFERTA_TOLERANCIA_OVR, GameConfig.OVR_CARRERA_MIN, GameConfig.OVR_CARRERA_MAX),
      max: GameConfig.clamp(centro + GameConfig.OFERTA_TOLERANCIA_OVR, GameConfig.OVR_CARRERA_MIN, GameConfig.OVR_CARRERA_MAX),
    };
  },

  equipoElegibleParaOvr(equipo, liga, ovr) {
    const ventana = GameConfig.ventanaOvrOferta(equipo, liga);
    return ovr >= ventana.min && ovr <= ventana.max;
  },

  // ============================================================
  // FIN DE CARRERA
  // Si el OVR cae demasiado para el nivel del club/liga actual (el
  // jugador "se quedó viejo" para ese nivel), el club no renueva: en
  // la siguiente ventana de traspasos ya no aparece la opción de
  // quedarse, sino la de retirarse. Además, desde EDAD_RETIRO_OFERTA
  // el propio jugador puede elegir colgar los botines aunque su club
  // todavía lo quiera.
  //
  // Retiro forzoso: no importa cuán bueno seas ni qué tan bien hayas
  // elegido — en algún momento entre EDAD_RETIRO_FORZOSO_MIN y _MAX
  // (distinto para cada carrera, sorteado una sola vez) ya ningún club
  // se anima a ofertarte. A partir de ahí, esa ventana de traspasos
  // solo trae la opción de retirarte, sin ofertas ni "quedarme".
  // ============================================================
  // Acortado frente a los valores originales (38 / 44-48): con el pico
  // terminando ~26-31, esa ventana dejaba hasta 16 años de declive lento
  // antes del cierre — se siente como relleno. Ahora son como mucho ~13.
  EDAD_RETIRO_OFERTA: 36,
  EDAD_RETIRO_FORZOSO_MIN: 41,
  EDAD_RETIRO_FORZOSO_MAX: 45,

  // Los últimos años antes del retiro forzoso ya no cortan de golpe: en
  // vez de pasar de "ofertas normales" a "solo retirarte" de una
  // temporada a la otra, en esta ventana previa el cupo de ofertas de
  // club se reduce a 1 — se siente una carrera que se apaga de a poco,
  // no un cierre seco. Solo aplica si el contrato actual sigue en pie
  // (ver enGraciaDeContrato/contratoTerminado en generarLoteOfertas).
  EDAD_RETIRO_TRANSICION: 2,

  // Todo novato arranca con un OVR bajo la escala de un jugador maduro
  // (ver OVR_INICIAL_MIN/MAX vs. OVR_CARRERA_MIN/MAX más abajo) — a un
  // club de nivel medio/alto para arriba, ningún debutante llega al piso
  // que ventanaOvrOferta le exige a un jugador hecho. Sin este colchón,
  // el propio club que te fichó te "no renovaría" en la primera ventana
  // de traspasos, antes de que hayas tenido una sola temporada para
  // demostrar algo. Se cuenta en carrera.js (temporadasEnClubActual) y
  // se resetea cada vez que cambiás de club, sea el inicial o no.
  TEMPORADAS_GRACIA_CONTRATO: 2,
  // El primer club de la carrera te ficha sabiendo que sos un debutante
  // de verdad (no un jugador hecho de paso) — le da el doble de margen
  // antes de poder cortarte, en vez de las 2 temporadas normales de
  // cualquier club fichado después (ver `esPrimerClub` en carrera.js).
  TEMPORADAS_GRACIA_CONTRATO_PRIMER_CLUB: 4,

  // Rating de rendimiento (mismo dato que ya usa calcularFuerzaCampana
  // para trofeos) por encima del cual una temporada se considera
  // "realmente buena" — suficiente para salvarte el contrato aunque el
  // OVR crudo se haya quedado corto de la ventana del club.
  CONTRATO_RENDIMIENTO_SALVAVIDAS: 7.5,

  // El OVR decide primero — pero si te quedaste corto, una temporada
  // estadísticamente muy buena (promedioTemporadaAnterior) puede salvar
  // el contrato igual. Antes esto se decidía SOLO por el número de OVR,
  // sin mirar para nada cómo jugaste — se podía cerrar una temporada
  // brillante en goles/asistencias/rating y que el club te cortara
  // igual, porque el OVR (que crece con su propia curva de edad/techo,
  // no 1 a 1 con las estadísticas del año) no llegó a tiempo.
  contratoDebeTerminar(equipo, liga, ovr, promedioTemporadaAnterior = null) {
    const ventana = GameConfig.ventanaOvrOferta(equipo, liga);
    if (ovr >= ventana.min) return false;
    if (promedioTemporadaAnterior && promedioTemporadaAnterior >= GameConfig.CONTRATO_RENDIMIENTO_SALVAVIDAS) {
      return false;
    }
    return true;
  },

  // ============================================================
  // PRÉSTAMOS
  // Un caso distinto de "esto no está funcionando" al de arriba: acá el
  // club SÍ te quiere a largo plazo (por eso solo aplica dentro del
  // período de gracia — ver generarLoteOfertas en el store, que no
  // ofrece préstamo una vez pasada la gracia, ahí rige contratoDebeTerminar
  // como siempre), pero no te está dando minutos. Hacen falta las DOS
  // condiciones — poco Y mal — para que dispare; cualquiera de las dos
  // sola es normal en una carrera larga y no amerita una cesión.
  // ============================================================
  PRESTAMO_PESO_TITULAR_UMBRAL: 0.35, // no te estás ganando el puesto
  PRESTAMO_PROMEDIO_UMBRAL: 6.0,      // por debajo de RATING_BASE (6.5, "neutral")

  clubDebePrestar(pesoTitular, promedioTemporadaAnterior) {
    return pesoTitular < GameConfig.PRESTAMO_PESO_TITULAR_UMBRAL
      && promedioTemporadaAnterior < GameConfig.PRESTAMO_PROMEDIO_UMBRAL;
  },

  // ============================================================
  // POTENCIAL POR EDAD
  // A igual OVR, un jugador joven tiene más recorrido/valor de reventa
  // que uno grande, así que entre dos elegibles para los mismos clubes
  // el joven apunta más arriba. Esto NO toca la elegibilidad real
  // (equipoElegibleParaOvr sigue siendo puro OVR, así que "no ofertas
  // sin sentido" se mantiene) — solo ajusta a cuáles clubes, dentro del
  // pool ya elegible, se los prioriza vía poderObjetivo.
  // ============================================================
  EDAD_POTENCIAL_BONUS_MAX: 8,
  EDAD_POTENCIAL_BONUS_HASTA: 24, // desde acá, sin bono: ya está en su prime
  EDAD_POTENCIAL_PENALIZACION_DESDE: 30,
  EDAD_POTENCIAL_PENALIZACION_TASA: 0.7, // por año, desde EDAD_POTENCIAL_PENALIZACION_DESDE

  potencialAjustadoPorEdad(ovr, edad) {
    let ajuste = 0;
    if (edad < GameConfig.EDAD_POTENCIAL_BONUS_HASTA) {
      const progreso = GameConfig.clamp(
        (GameConfig.EDAD_POTENCIAL_BONUS_HASTA - edad) / (GameConfig.EDAD_POTENCIAL_BONUS_HASTA - 17),
        0, 1
      );
      ajuste = progreso * GameConfig.EDAD_POTENCIAL_BONUS_MAX;
    } else if (edad > GameConfig.EDAD_POTENCIAL_PENALIZACION_DESDE) {
      ajuste = -(edad - GameConfig.EDAD_POTENCIAL_PENALIZACION_DESDE) * GameConfig.EDAD_POTENCIAL_PENALIZACION_TASA;
    }
    return GameConfig.clamp(ovr + ajuste, GameConfig.OVR_CARRERA_MIN, GameConfig.OVR_CARRERA_MAX);
  },

  // Desde esta edad, el cupo garantizado de "tu entorno" (2 de 3 ofertas,
  // ver generarLoteOfertas) deja de priorizar tu liga actual y pasa a
  // priorizar clubes de tu país de origen — volver a cerrar la carrera
  // en casa, aunque la hayas jugado toda afuera. Pero esa garantía solo
  // aplica mientras los clubes de tu país sigan siendo un encaje de
  // verdad para tu nivel (ver gruposTierAlto en generarLoteOfertas) — si
  // ya los superaste, la vuelta a casa deja de estar garantizada y pasa
  // a aparecer solo de vez en cuando, como el gesto sentimental que
  // sería en la realidad, no la norma.
  EDAD_OCASO_RETORNO_PAIS: 33,
  PROB_OFERTA_NOSTALGICA: 0.3,

  // ============================================================
  // CALENDARIO DE TEMPORADA
  // 3 pausas de eventos (personal/deportivo) + 1 sola ventana de
  // fichajes, siempre en pretemporada (progreso 0) — no hay una segunda
  // ventana a mitad de año. Las pausas de eventos no van en bandas fijas
  // ni ordenadas: una cae en algún punto antes de la mitad de temporada,
  // otra en cualquier punto de toda la temporada, y la última bien al
  // final — se generan así y recién después se ordenan por progreso
  // para que el calendario quede cronológico. La ventana de pretemporada
  // no aplica a la Temporada 1 (el jugador ya eligió equipo en la
  // pantalla de creación) — arranca recién en la Temporada 2, antes de
  // que se juegue el primer tramo.
  //
  // Como esa ventana cae siempre en progreso 0 (antes de cualquier
  // tramo simulado), un traspaso solo puede pasar con la temporada
  // todavía sin partidos jugados — nunca "a mitad de año" — por eso
  // resolveOferta ya no necesita partir el historial en dos filas por
  // temporada (ver comentario ahí).
  // ============================================================
  TOTAL_TRAMOS_TEMPORADA: 3, // un bloque de partidos simulado por cada pausa de evento
  ANIMACION_TRAMO_MS: 900, // duración de la interpolación del anillo/contadores del spotlight (ver useAnimatedNumber)
  CALENDARIO_PAUSA_ANTES_MITAD_MIN: 5, CALENDARIO_PAUSA_ANTES_MITAD_MAX: 45,
  CALENDARIO_PAUSA_ULTIMO_MOMENTO_MIN: 92, CALENDARIO_PAUSA_ULTIMO_MOMENTO_MAX: 99,

  crearCalendarioTemporada(numeroTemporada) {
    const calendario: PausaCalendario[] = [];
    if (numeroTemporada > 1) {
      calendario.push({ tipo: "oferta", progreso: 0 });
    }
    calendario.push({ tipo: "decision", progreso: GameConfig.randomInt(GameConfig.CALENDARIO_PAUSA_ANTES_MITAD_MIN, GameConfig.CALENDARIO_PAUSA_ANTES_MITAD_MAX) });
    calendario.push({ tipo: "decision", progreso: GameConfig.randomInt(0, 100) });
    calendario.push({ tipo: "decision", progreso: GameConfig.randomInt(GameConfig.CALENDARIO_PAUSA_ULTIMO_MOMENTO_MIN, GameConfig.CALENDARIO_PAUSA_ULTIMO_MOMENTO_MAX) });
    calendario.sort((a, b) => a.progreso - b.progreso);
    return calendario;
  },

  // ============================================================
  // ESTADÍSTICAS POR TRAMO
  // Cada posición tiene su propia propensión a convertir goles/
  // asistencias (antes se agrupaban en 5 perfiles compartidos — ver
  // GRUPOS_POSICION, que sigue existiendo para el sorteo de candidatos
  // a premios individuales, sin relación con esto). El OVR y el
  // rendimiento acumulado del tramo (por las decisiones tomadas) escalan
  // esa propensión por igual para todas.
  // ============================================================
  // "central" y "lateral" antes eran un solo grupo "defensa" con la misma
  // propensión — un lateral que centra todo el partido y un central que
  // solo despeja se sentían idénticos. Separados: el lateral aporta más
  // asistencias que goles (centros), el central anotar de vez en cuando
  // (cabezazos de pelota parada) pero casi no asiste.
  GRUPOS_POSICION: {
    POR: "arquero",
    DFC: "central", LI: "lateral", LD: "lateral",
    MCD: "medio", MC: "medio", MI: "medio", MD: "medio", MCO: "medio",
    EI: "ataque", ED: "ataque", DC: "ataque",
  },

  // Estas son las propensiones en el punto NEUTRAL de la curva de OVR
  // (factor ×1, ver ESTADISTICAS_OVR_* más abajo — hoy cae en un OVR de
  // profesional sólido, ~75-78, no en uno mediocre).
  //
  // Ya no comparten perfil por grupo: un DC es el mayor goleador de la
  // cancha (más que un extremo, que reparte más entre gol y asistencia),
  // el MCO es el mediocampista más ofensivo (cerca del nivel de un
  // extremo), y dentro del mediocampo hay su propio orden — el MCD
  // (el más contenedor) aporta menos que el MC, y los de banda (MI/MD)
  // asisten un poco más que el MC por los centros.
  PROPENSION_GOL_POSICION: {
    POR: 0.003,
    DFC: 0.03, LI: 0.02, LD: 0.02,
    MCD: 0.04, MC: 0.06, MI: 0.06, MD: 0.06, MCO: 0.11,
    EI: 0.20, ED: 0.20, DC: 0.27,
  },
  PROPENSION_ASISTENCIA_POSICION: {
    POR: 0.003,
    DFC: 0.02, LI: 0.09, LD: 0.09,
    MCD: 0.08, MC: 0.11, MI: 0.13, MD: 0.13, MCO: 0.15,
    EI: 0.09, ED: 0.09, DC: 0.05,
  },
  PROBABILIDAD_MVP_BASE: 0.09,

  // Cuánto suma un gol/asistencia a la chance de MVP y al rating de ESE
  // partido puntual (antes eran tiradas 100% independientes: un delantero
  // podía meter muchos goles en la temporada y aun así terminar con pocos
  // MVP y un promedio mediocre, porque nada conectaba una cosa con la
  // otra). Ahora el partido en el que participás en un gol tiene, en ese
  // mismo partido, más chance de MVP y mejor rating — las estadísticas
  // quedan coherentes entre sí en vez de ser tres sorteos que no se hablan.
  BONUS_MVP_POR_GOL: 0.14,
  BONUS_MVP_POR_ASISTENCIA: 0.08,
  BONUS_RATING_POR_GOL: 0.7,
  BONUS_RATING_POR_ASISTENCIA: 0.4,

  // Nota base de un partido "neutral" (factor ×1, sin gol ni asistencia)
  // y cuánto empuja el `factor` de rendimiento esa nota para arriba o
  // para abajo. Con el coeficiente viejo (2.5), un debutante de bajo OVR
  // (factor ~0.3-0.5) promediaba notas de ~4.8-5.5 — pegado al piso de
  // 5.0 una temporada entera, algo que casi no pasa en la vida real: ni
  // un jugador flojo de verdad promedia tan bajo con continuidad, esas
  // notas son para un partido puntual desastroso, no la norma. Bajado a
  // 1.3: ese mismo debutante ahora promedia ~5.6-6.0 (recién arrancando,
  // pero no un desastre), sin tocar el techo — un factor alto (2.5-3.0)
  // sigue empujando la nota hacia el 9-10 en partidos con gol/asistencia.
  RATING_BASE: 6.5,
  RATING_FACTOR_COEFICIENTE: 1.3,

  // Escala de estadísticas por OVR: antes era una recta suave (0.85 a
  // ~1.83 de piso a techo, apenas 2.15x de diferencia) — un crack de 95
  // rendía casi igual que un jugador mediocre de 65. Un primer intento
  // con exponente 1.6 arregló eso, pero el punto NEUTRAL (factor ×1)
  // seguía cayendo cerca de OVR 65 — un jugador mediocre rendía como un
  // profesional decente. Después quedó con el neutral en ~75-78 y el piso
  // (OVR 45) en 0.15 — un jugador de 65 rendía claramente por debajo de
  // la media, pero un debutante recién arrancando (50-60 OVR, siempre por
  // debajo del punto neutral por diseño) quedaba con promedios de gol
  // demasiado bajos para sentirse un jugador de verdad, en vez de "recién
  // empezando" — un delantero de 60 OVR sacaba apenas ~2 goles en una
  // temporada completa. Piso subido (0.15 → 0.22) y exponente suavizado
  // (2.2 → 1.9), sin tocar el techo (factor 3.0 en OVR 99, ajustando
  // RANGO para compensar): ese mismo delantero de 60 OVR ahora saca ~3.2,
  // uno de 65 OVR ~4.5 — el neutral baja un poco, a ~OVR 72-73.
  ESTADISTICAS_OVR_BASE: 0.22,
  ESTADISTICAS_OVR_EXPONENTE: 1.9,
  ESTADISTICAS_OVR_RANGO: 2.78,

  factorEstadisticoPorOvr(ovr) {
    const rango = GameConfig.OVR_CARRERA_MAX - GameConfig.OVR_CARRERA_MIN;
    const progreso = GameConfig.clamp((ovr - GameConfig.OVR_CARRERA_MIN) / rango, 0, 1);
    return GameConfig.ESTADISTICAS_OVR_BASE + Math.pow(progreso, GameConfig.ESTADISTICAS_OVR_EXPONENTE) * GameConfig.ESTADISTICAS_OVR_RANGO;
  },

  // Competitividad de la liga (o selección): hasta acá, un jugador de 65
  // OVR rendía exactamente igual jugando en la liga de Colombia (fuerza
  // ~55) que en La Liga española (fuerza ~93) — el mismo OVR absoluto,
  // sin importar contra qué nivel de rivales compite. `referenciaLiga`
  // mapea la fuerza (0-100) de la liga al mismo rango de OVR de carrera:
  // una liga de fuerza 93 "espera" un nivel de jugador cercano al techo
  // (95), una de fuerza 55 espera un nivel bastante más modesto (~75).
  // La diferencia entre tu OVR y esa referencia (`ventaja`) empuja el
  // factor para arriba o para abajo — el mismo OVR rinde notoriamente
  // mejor en una liga floja (donde está por encima de la media) que en
  // una top (donde queda muy por debajo). Con estos valores, un 70 OVR en
  // Chile (fuerza 60) saca un factor ~0.82; ese mismo 70 en la Premier
  // (fuerza 96) saca ~0.36 — más de 2 veces mejor en Chile con el
  // idéntico OVR. Antes (coeficiente 0.015, piso 0.5) esa misma
  // comparación daba ~0.89 vs ~0.60, apenas 1.5 veces.
  FACTOR_LIGA_COEFICIENTE: 0.024,
  FACTOR_LIGA_MIN: 0.35,
  FACTOR_LIGA_MAX: 2.2,

  factorPorFuerzaLiga(ovr, fuerzaLiga) {
    if (fuerzaLiga == null) return 1;
    const referenciaLiga = GameConfig.OVR_CARRERA_MIN + (fuerzaLiga / 100) * (GameConfig.OVR_CARRERA_MAX - GameConfig.OVR_CARRERA_MIN);
    const ventaja = ovr - referenciaLiga;
    return GameConfig.clamp(1 + ventaja * GameConfig.FACTOR_LIGA_COEFICIENTE, GameConfig.FACTOR_LIGA_MIN, GameConfig.FACTOR_LIGA_MAX);
  },

  // Goles de UN partido: normalmente 0 o 1, pero sin techo real — antes
  // era un booleano puro (como mucho 1 gol por partido), así que la
  // temporada entera JAMÁS podía superar la cantidad de partidos jugados,
  // por más crack que fueras. Con la probabilidad ya alta (buen nivel/
  // forma), de vez en cuando sale un doblete, y más raro todavía un
  // hat-trick — cada gol extra es bastante menos probable que el
  // anterior, así que sigue siendo la excepción, no la norma.
  PROB_SEGUNDO_GOL_FACTOR: 0.4,
  PROB_TERCER_GOL_FACTOR: 0.18,

  golesEnPartido(probGol) {
    if (Math.random() >= probGol) return 0;
    let goles = 1;
    if (Math.random() < probGol * GameConfig.PROB_SEGUNDO_GOL_FACTOR) {
      goles = 2;
      if (Math.random() < probGol * GameConfig.PROB_TERCER_GOL_FACTOR) goles = 3;
    }
    return goles;
  },

  simularTramo({ partidos, posicion, ovr, rendimientoAcumulado, fuerzaLiga = null, factorTalento = 1 }) {
    const factorOvr = GameConfig.factorEstadisticoPorOvr(ovr);
    const factorForma = 1 + GameConfig.clamp(rendimientoAcumulado, -12, 12) * 0.05;
    const factorLiga = GameConfig.factorPorFuerzaLiga(ovr, fuerzaLiga);
    const factor = Math.max(0.3, factorOvr * factorForma * factorLiga * factorTalento);
    // MC como respaldo de una posición desconocida — mediocampista
    // central, el perfil más "neutral" del campo.
    const propensionGol = GameConfig.PROPENSION_GOL_POSICION[posicion] ?? GameConfig.PROPENSION_GOL_POSICION.MC!;
    const propensionAsistencia = GameConfig.PROPENSION_ASISTENCIA_POSICION[posicion] ?? GameConfig.PROPENSION_ASISTENCIA_POSICION.MC!;
    const probGol = GameConfig.clamp(propensionGol * factor, 0, 0.9);
    const probAsistencia = GameConfig.clamp(propensionAsistencia * factor, 0, 0.9);

    let goles = 0, asistencias = 0, mvp = 0, sumaRating = 0;
    for (let i = 0; i < partidos; i++) {
      const golesPartido = GameConfig.golesEnPartido(probGol);
      const hizoAsistencia = Math.random() < probAsistencia;
      goles += golesPartido;
      if (hizoAsistencia) asistencias++;

      const bonusActuacion = golesPartido * GameConfig.BONUS_MVP_POR_GOL + (hizoAsistencia ? GameConfig.BONUS_MVP_POR_ASISTENCIA : 0);
      if (Math.random() < GameConfig.PROBABILIDAD_MVP_BASE * factor + bonusActuacion) mvp++;

      const bonusRating = golesPartido * GameConfig.BONUS_RATING_POR_GOL + (hizoAsistencia ? GameConfig.BONUS_RATING_POR_ASISTENCIA : 0);
      const ratingPartido = GameConfig.clamp(GameConfig.RATING_BASE + (factor - 1) * GameConfig.RATING_FACTOR_COEFICIENTE + bonusRating + GameConfig.randomInt(-4, 4) / 10, 5, 10);
      sumaRating += ratingPartido;
    }
    return { goles, asistencias, mvp, sumaRating };
  },

  // ============================================================
  // AJUSTE DE OVR ENTRE TRAMOS
  // Progresión realista pero con altas chances de llegar lejos si se
  // juega bien: hay una base de progreso natural muy chica en cada
  // tramo, más el efecto de las decisiones (rendimiento acumulado),
  // todo escalado por un freno según la edad (ver más abajo). El
  // resultado se redondea de forma "estocástica" (no matemática): un
  // valor como 0.4 no siempre da 0 ni siempre da 1, sino que tiene
  // ~40% de chance de dar +1 — así los cambios chicos siguen siendo
  // posibles de vez en cuando, en vez de quedar completamente fijos.
  // ============================================================
  OVR_TRAMO_BASE: 0.7,
  OVR_TRAMO_RENDIMIENTO_DIVISOR: 6,
  OVR_TRAMO_VARIACION_MIN: -1,
  OVR_TRAMO_VARIACION_MAX: 3,
  OVR_CARRERA_MIN: 45,
  OVR_CARRERA_MAX: 99,

  // Curva de edad en 3 etapas — antes el freno de crecimiento se
  // estabilizaba en 35% del ritmo pleno PARA SIEMPRE desde los 32, y el
  // desgaste de abajo era demasiado débil para competirle: un jugador con
  // buen rendimiento seguía subiendo bastante incluso pasados los 35-40.
  // Ahora:
  //  - Prime (≤28): crecimiento pleno, sin cambios.
  //  - Meseta (29-34): el crecimiento se frena fuerte Y el desgaste por
  //    edad (ver más abajo) ya está actuando en la misma ventana — cuesta
  //    cada vez más sumar, y hacia el final ya es normal empezar a bajar.
  //  - Ocaso (35+): el crecimiento por decisiones casi desaparece (queda
  //    un resto mínimo — la "excepción" ocasional, sobre todo con mucho
  //    talento oculto, ver factorTalento) y el desgaste sigue creciendo.
  OVR_EDAD_PRIME_MAX: 28,
  OVR_EDAD_DECLIVE_MAX: 34,
  OVR_EDAD_FACTOR_MIN: 0.15,

  factorCrecimientoPorEdad(edad) {
    if (edad <= GameConfig.OVR_EDAD_PRIME_MAX) return 1;
    if (edad <= GameConfig.OVR_EDAD_DECLIVE_MAX) {
      const progreso = (edad - GameConfig.OVR_EDAD_PRIME_MAX) / (GameConfig.OVR_EDAD_DECLIVE_MAX - GameConfig.OVR_EDAD_PRIME_MAX);
      return 1 - progreso * (1 - GameConfig.OVR_EDAD_FACTOR_MIN);
    }
    return GameConfig.OVR_EDAD_FACTOR_MIN;
  },

  // "Salto de calidad" del arranque de carrera: sin esto, un jugador que
  // debuta en un club humilde (OVR ~50-55) tarda 8-12 temporadas — de una
  // carrera de ~26-27 — en cruzar el umbral de 70, más de un tercio del
  // juego entero rindiendo con números flojos por partida doble (poco OVR
  // Y, encima, poco factorPorFuerzaLiga). Este multiplicador NO toca las
  // 3 etapas de arriba (factorCrecimientoPorEdad) ni el declive por edad
  // más abajo (factorDeclivePorEdad) — es aparte, y solo empuja el lado
  // del CRECIMIENTO cuando hay crecimiento de verdad (nunca agrava una
  // racha floja, ver ajustarOvrTramo). Solo aplica en la etapa de Prime
  // (edad ≤ OVR_EDAD_PRIME_MAX, donde el crecimiento ya es pleno) y por
  // debajo del umbral — un veterano que bajó de nivel en la meseta o el
  // ocaso NUNCA lo activa, aunque su OVR haya caído por debajo del umbral:
  // el "salto de calidad" es cosa de pibe que recién arranca, no de
  // alguien en decadencia.
  UMBRAL_CRECIMIENTO_ACELERADO: 72,
  CRECIMIENTO_ACELERADO_FACTOR_MAX: 1.8,

  factorAprendizajeJoven(ovrActual, edad) {
    if (edad > GameConfig.OVR_EDAD_PRIME_MAX) return 1;
    if (ovrActual >= GameConfig.UMBRAL_CRECIMIENTO_ACELERADO) return 1;
    const progreso = (GameConfig.UMBRAL_CRECIMIENTO_ACELERADO - ovrActual) / (GameConfig.UMBRAL_CRECIMIENTO_ACELERADO - GameConfig.OVR_CARRERA_MIN);
    return 1 + GameConfig.clamp(progreso, 0, 1) * (GameConfig.CRECIMIENTO_ACELERADO_FACTOR_MAX - 1);
  },

  // Caída natural por edad: desde OVR_EDAD_DECLIVE_INICIO empieza a restar
  // OVR de a poco (aunque el jugador rinda bien), superpuesta a la meseta
  // de arriba en vez de arrancar recién cuando esta termina — así el neto
  // (crecimiento - desgaste) pasa de "todavía sumás algo" a "cuesta
  // mantenerte" de forma gradual dentro de la misma ventana de 29-34, en
  // vez de un quiebre brusco a los 32. Desde OVR_EDAD_ACELERA_DECLIVE el
  // desgaste se acelera bastante más — nadie se mantiene en su pico para
  // siempre, y para el retiro obligatorio (41-45) ya bajó en serio.
  OVR_EDAD_DECLIVE_INICIO: 30,
  OVR_EDAD_ACELERA_DECLIVE: 37,
  OVR_EDAD_DECLIVE_TASA_BASE: 0.06, // caída por tramo, por año, entre INICIO y ACELERA
  OVR_EDAD_DECLIVE_TASA_ACELERADA: 0.22, // caída por tramo, por año, desde ACELERA en adelante

  factorDeclivePorEdad(edad) {
    if (edad < GameConfig.OVR_EDAD_DECLIVE_INICIO) return 0;
    const aniosLentos = Math.min(edad, GameConfig.OVR_EDAD_ACELERA_DECLIVE) - GameConfig.OVR_EDAD_DECLIVE_INICIO;
    const declivePrevio = aniosLentos * GameConfig.OVR_EDAD_DECLIVE_TASA_BASE;
    if (edad <= GameConfig.OVR_EDAD_ACELERA_DECLIVE) return declivePrevio;
    const aniosAcelerados = edad - GameConfig.OVR_EDAD_ACELERA_DECLIVE;
    return declivePrevio + aniosAcelerados * GameConfig.OVR_EDAD_DECLIVE_TASA_ACELERADA;
  },

  // Redondeo estocástico: un valor de 0.4 da +1 el 40% de las veces y
  // 0 el 60% restante (en vez de redondear siempre para el mismo lado).
  redondeoEstocastico(valor) {
    const piso = Math.floor(valor);
    const frac = valor - piso;
    return Math.random() < frac ? piso + 1 : piso;
  },

  // Tope de caída por tramo cuando ya está actuando el declive por edad —
  // más permisivo que OVR_TRAMO_VARIACION_MIN, que es para variación normal.
  OVR_TRAMO_DECLIVE_VARIACION_MIN: -10,

  // Talento oculto: un multiplicador sorteado una sola vez por carrera
  // (ver carrera.js) sobre el ritmo de crecimiento de OVR — y, en menor
  // medida, sobre qué tan bien se sostiene ese nivel con la edad. Con las
  // mismas decisiones de punta a punta, dos carreras ya no crecen (ni
  // declinan) exactamente igual: a veces te toca un desarrollo más lento,
  // a veces un talento precoz que además se conserva mejor entrada la
  // meseta y el ocaso — la "excepción a la regla" ocasional sale de este
  // mismo sorteo oculto, sin un mecanismo aparte. No se expone en ningún
  // número visible.
  //
  // También pesa en `simularTramo` (ver `factor` más abajo): antes solo
  // tocaba el crecimiento de OVR, así que TODA carrera arrancaba
  // exactamente igual de "en blanco" con el mismo OVR bajo, sin importar
  // el talento — la única narrativa posible era "malo que se hizo bueno".
  // Ahora un talento alto (1.2x) también rinde mejor en cancha con el
  // MISMO OVR bajo (ya se nota que tiene algo especial desde el arranque,
  // antes de que el número lo confirme), mientras uno bajo (0.85x) sigue
  // leyéndose como el grinder clásico — variedad real entre carreras, sin
  // inventar un sorteo aparte.
  TALENTO_MIN: 0.85,
  TALENTO_MAX: 1.2,

  sortearFactorTalento() {
    return GameConfig.TALENTO_MIN + Math.random() * (GameConfig.TALENTO_MAX - GameConfig.TALENTO_MIN);
  },

  // Techo de potencial: sin esto, el crecimiento del prime (deltaBase
  // siempre positivo, tramo tras tramo durante ~10-12 años) empuja casi
  // cualquier carrera por encima de 90 — no era una excepción, era casi
  // aritmética garantizada. Ahora cada carrera sortea, en la creación del
  // personaje (ver carrera.js), un techo real distinto del OVR con el que
  // arranca. No es una pared dura: cerca del techo el crecimiento se
  // vuelve muy chico pero nunca llega a cero del todo, para que una racha
  // buenísima pueda "sorprender" y pasarlo por uno o dos puntos en casos
  // raros — y aun así, alcanzar un techo alto de verdad (90+) requiere
  // recorrer mucho terreno dentro de una carrera de duración finita.
  //
  // Los rangos de acá NO son directamente "dónde termina la carrera": se
  // corrieron ~3000 carreras simuladas con rendimiento variable (bueno y
  // malo, no siempre óptimo) contra la fórmula real de ajustarOvrTramo, y
  // estos valores son los que hacen que el PICO FINAL de OVR quede
  // repartido ~10% por debajo de 80, ~60% entre 80-89, ~30% en 90+ (los
  // techos altos apuntan por encima de 90 porque varios de esos casos se
  // quedan cortos por el camino, sea por mala racha o por no alcanzar el
  // límite superior del rango).
  POTENCIAL_TECHO_PROB_BAJO: 0.05,
  POTENCIAL_TECHO_PROB_MEDIO: 0.55, // acumulado con el de arriba: 60% — el 40% restante es el tramo alto
  POTENCIAL_TECHO_BAJO_MIN: 72,
  POTENCIAL_TECHO_BAJO_MAX: 83,
  POTENCIAL_TECHO_MEDIO_MIN: 85,
  POTENCIAL_TECHO_MEDIO_MAX: 90,
  POTENCIAL_TECHO_ALTO_MIN: 91,
  POTENCIAL_TECHO_ALTO_MAX: 98,
  POTENCIAL_TECHO_FACTOR_MIN: 0.08, // qué fracción de lo que se pasaría del techo se deja pasar igual

  sortearPotencialTecho() {
    const r = Math.random();
    if (r < GameConfig.POTENCIAL_TECHO_PROB_BAJO) {
      return GameConfig.randomInt(GameConfig.POTENCIAL_TECHO_BAJO_MIN, GameConfig.POTENCIAL_TECHO_BAJO_MAX);
    }
    if (r < GameConfig.POTENCIAL_TECHO_PROB_BAJO + GameConfig.POTENCIAL_TECHO_PROB_MEDIO) {
      return GameConfig.randomInt(GameConfig.POTENCIAL_TECHO_MEDIO_MIN, GameConfig.POTENCIAL_TECHO_MEDIO_MAX);
    }
    return GameConfig.randomInt(GameConfig.POTENCIAL_TECHO_ALTO_MIN, GameConfig.POTENCIAL_TECHO_ALTO_MAX);
  },

  ajustarOvrTramo(ovrActual, rendimientoAcumulado, edad, factorTalento = 1, potencialTecho = GameConfig.OVR_CARRERA_MAX) {
    const factorEdad = GameConfig.factorCrecimientoPorEdad(edad);
    let deltaBase = (GameConfig.OVR_TRAMO_BASE + rendimientoAcumulado / GameConfig.OVR_TRAMO_RENDIMIENTO_DIVISOR) * factorEdad * factorTalento;
    // Solo se acelera el crecimiento cuando HAY crecimiento (deltaBase ya
    // positivo) — una racha floja no se agrava por estar en esta etapa,
    // el multiplicador nunca empuja para el lado negativo.
    if (deltaBase > 0) deltaBase *= GameConfig.factorAprendizajeJoven(ovrActual, edad);
    // Mismo sorteo de talento, invertido: 1.2 (muy talentoso) atenúa el
    // desgaste a un 80%; 0.85 (menos talentoso) lo agrava a un 115%.
    const declive = GameConfig.factorDeclivePorEdad(edad) * (2 - factorTalento);
    let deltaCrudo = deltaBase - declive;
    // Techo de potencial: NO frena el camino hacia el techo (eso se probó
    // y, sumado al freno de edad de la misma ventana 29-34, casi nadie
    // llegaba cerca de un techo alto a tiempo) — solo recorta lo que este
    // tramo puntual se pasaría de largo, dejando pasar un resto chico
    // igual. Así el crecimiento real actúa a pleno hasta el final, y el
    // freno se siente justo al llegar, no kilómetros antes.
    if (deltaCrudo > 0 && ovrActual + deltaCrudo > potencialTecho) {
      const exceso = ovrActual + deltaCrudo - potencialTecho;
      deltaCrudo -= exceso * (1 - GameConfig.POTENCIAL_TECHO_FACTOR_MIN);
    }
    const minPermitido = declive > 0 ? GameConfig.OVR_TRAMO_DECLIVE_VARIACION_MIN : GameConfig.OVR_TRAMO_VARIACION_MIN;
    const delta = GameConfig.clamp(
      GameConfig.redondeoEstocastico(deltaCrudo),
      minPermitido,
      GameConfig.OVR_TRAMO_VARIACION_MAX
    );
    return GameConfig.clamp(ovrActual + delta, GameConfig.OVR_CARRERA_MIN, GameConfig.OVR_CARRERA_MAX);
  },

  // `pesoTitular` (0-1) es cuánto te ganaste el puesto DE VERDAD en tu
  // club actual — a diferencia de antes (un sorteo nuevo e independiente
  // cada tramo, sin memoria de nada), ahora es el factor dominante y se
  // arrastra tramo a tramo e incluso de una temporada a la siguiente
  // mientras sigas en el mismo club (ver PESO_TITULAR_INICIAL más abajo y
  // cómo se hereda/resetea en carrera.js). Una gran temporada ya no se
  // "olvida" al arrancar la próxima.
  PESO_TITULAR_INICIAL: 0.4, // novato o recién fichado: tenés que ganarte el puesto
  PESO_TITULAR_MIN: 0.05,
  PESO_TITULAR_MAX: 0.95,
  PESO_TITULAR_RATING_NEUTRO: 6.5, // rating de tramo que ni suma ni resta peso
  PESO_TITULAR_AJUSTE_RATING: 0.05,
  PESO_TITULAR_AJUSTE_MIN: -0.08,
  PESO_TITULAR_AJUSTE_MAX: 0.12,
  PESO_TITULAR_CASTIGO_SIN_MINUTOS: -0.05, // no te tocó jugar nada este tramo (suplente sin entrar)
  PESO_TITULAR_CASTIGO_LESION: -0.03, // una lesión te saca del radar un poco, aunque no sea "tu culpa"

  // Cuánto se ajusta pesoTitular después de simular un tramo, según cómo
  // te fue en los partidos que jugaste (o si no jugaste ninguno).
  ajustarPesoTitular(pesoActual, ratingTramo, estabaLesionado) {
    let delta;
    if (estabaLesionado) {
      delta = GameConfig.PESO_TITULAR_CASTIGO_LESION;
    } else if (ratingTramo === null) {
      delta = GameConfig.PESO_TITULAR_CASTIGO_SIN_MINUTOS;
    } else {
      delta = GameConfig.clamp(
        (ratingTramo - GameConfig.PESO_TITULAR_RATING_NEUTRO) * GameConfig.PESO_TITULAR_AJUSTE_RATING,
        GameConfig.PESO_TITULAR_AJUSTE_MIN,
        GameConfig.PESO_TITULAR_AJUSTE_MAX
      );
    }
    return GameConfig.clamp(pesoActual + delta, GameConfig.PESO_TITULAR_MIN, GameConfig.PESO_TITULAR_MAX);
  },

  // pesoTitular es ahora el factor dominante (ya está en escala 0-1, la
  // misma que la probabilidad) — el OVR todavía empuja un poco (para que
  // un jugador claramente mejor que el resto del plantel tenga ventaja
  // incluso saliendo de una mala racha) y las decisiones del tramo
  // aportan su granito, pero ya no deciden todo un sorteo desde cero.
  //
  // TITULAR_OVR_PESO al doble de lo que era (0.01 → 0.02): quedaba
  // desactualizado frente a probabilidadJugar, que ya pesa el OVR mucho
  // más fuerte — un novato flojo podía seguir saliendo "Titular" seguido
  // (pesoTitular + ese empujón casi nulo alcanzaba igual) aunque esa
  // misma fórmula ya le diera pocos partidos ese tramo.
  TITULAR_OVR_REFERENCIA: 55,
  TITULAR_OVR_PESO: 0.02,

  calcularTitular(pesoTitular, ovr, rendimientoAcumulado) {
    const ajusteOvr = (ovr - GameConfig.TITULAR_OVR_REFERENCIA) * GameConfig.TITULAR_OVR_PESO;
    const prob = GameConfig.clamp(pesoTitular + ajusteOvr + rendimientoAcumulado * 0.03, 0.08, 0.95);
    return Math.random() < prob;
  },

  // ============================================================
  // SISTEMA DE COMPETICIONES
  // Todo sale de un único número por temporada, "fuerza de campaña":
  // qué tan bien le está yendo al equipo, mezclando el nivel del club/
  // liga (fijo), el estado de forma del jugador (del momento), el efecto
  // `equipo` acumulado (las decisiones tomadas) y — esto es nuevo — el
  // rendimiento estadístico real de la temporada (promedio de rating,
  // que ya arrastra goles/asistencias/MVP). Antes una temporada de 59
  // partidos y 59 goles no pesaba nada acá: solo importaban las
  // decisiones de "equipo" tomadas en los eventos, así que se podía
  // terminar una temporada de ensueño individual sin ganar nada. De acá
  // salen tres cosas: la chance de ganar la liga o la copa nacional al
  // cierre de temporada, la chance de avanzar de ronda en cada
  // competición eliminatoria (copa nacional / internacional), y a qué
  // torneo internacional clasifica la próxima temporada.
  // ============================================================
  FORMA_CALIDAD: {
    inspirado: 1.0, plenitud: 0.85, animado: 0.7, regular: 0.5,
    desanimado: 0.3, bajo: 0.15, lesionado: 0.05,
  },

  FUERZA_PESO_CLUB: 0.4,
  FUERZA_PESO_FORMA: 0.15,
  FUERZA_PESO_EQUIPO_ACUMULADO: 0.2,
  FUERZA_PESO_RENDIMIENTO_JUGADOR: 0.25,
  // Umbral de referencia para "normalizar" equipoAcumuladoTemporada a
  // 0..1 (mismo umbral que antes usaba el trofeo genérico): en 0 queda
  // neutral (0.5), en +REFERENCIA llega a 1, en -REFERENCIA a 0.
  FUERZA_EQUIPO_ACUMULADO_REFERENCIA: 4,
  // Rango de "promedio de rating" (ver GameConfig.simularTramo) que
  // normaliza a 0..1: 6.0 (flojo/mediocre) queda en 0, 9.0 (temporada de
  // ensueño, muchos goles/asistencias/MVP) llega a 1.
  FUERZA_RENDIMIENTO_PROMEDIO_PISO: 6.0,
  FUERZA_RENDIMIENTO_PROMEDIO_RANGO: 3.0,

  // A propósito usa SOLO el eje fuerza (no poder): ganar títulos depende
  // de qué tan fuerte es el plantel hoy, no de cuánta plata tiene el club
  // ni de su prestigio histórico — un club rico y prestigioso pero flojo
  // en cancha no debería ganar la liga solo por serlo.
  calidadFuerzaClub(equipo, liga) {
    const fuerzaEquipo = equipo.fuerza / GameConfig.EJE_MAX;
    const fuerzaLiga = liga.fuerza / GameConfig.EJE_MAX;
    return fuerzaEquipo * GameConfig.OVR_PESO_EQUIPO + fuerzaLiga * GameConfig.OVR_PESO_LIGA;
  },

  // `promedioJugador` es null/0 cuando todavía no jugaste ningún partido
  // esta temporada (recién arrancando, o toda la temporada lesionado) —
  // en ese caso queda neutral (0.5) en vez de castigar como si hubieras
  // rendido pésimo.
  calcularFuerzaCampana(equipo, liga, forma, equipoAcumuladoTemporada, promedioJugador = null) {
    const calidadClub = GameConfig.calidadFuerzaClub(equipo, liga);
    const calidadForma = GameConfig.FORMA_CALIDAD[forma] ?? 0.5;
    const calidadEquipoAcumulado = GameConfig.clamp(
      0.5 + equipoAcumuladoTemporada / (2 * GameConfig.FUERZA_EQUIPO_ACUMULADO_REFERENCIA), 0, 1
    );
    const calidadRendimientoJugador = promedioJugador
      ? GameConfig.clamp(
          (promedioJugador - GameConfig.FUERZA_RENDIMIENTO_PROMEDIO_PISO) / GameConfig.FUERZA_RENDIMIENTO_PROMEDIO_RANGO,
          0, 1
        )
      : 0.5;
    const fuerza = GameConfig.FUERZA_PESO_CLUB * calidadClub
      + GameConfig.FUERZA_PESO_FORMA * calidadForma
      + GameConfig.FUERZA_PESO_EQUIPO_ACUMULADO * calidadEquipoAcumulado
      + GameConfig.FUERZA_PESO_RENDIMIENTO_JUGADOR * calidadRendimientoJugador;
    return GameConfig.clamp(fuerza, 0, 1);
  },

  // calcularFuerzaCampana le da a tu temporada personal el 60% del peso
  // (forma + decisiones + rendimiento) — a propósito, porque avanzar de
  // ronda en una copa y ganar la copa nacional están pensados para que
  // TU aporte pese mucho. Pero para pelear un título grande (la liga, o
  // la final de una copa internacional — ver probGanarLiga) eso diluye
  // demasiado la calidad real del club: un Bayern München (calidadClub
  // ~0.90) con un jugador de rendimiento neutro terminaba con una fuerza
  // de campaña de ~0.66, casi igual a la de un club mediano de la misma
  // liga — el equipo más ganador de Europa no se sentía distinto de uno
  // de mitad de tabla. Esta variante le da al club el 85% del peso, para
  // que los grandes de verdad se sientan candidatos de entrada, y vos
  // (con una gran temporada) los empujes más arriba todavía.
  FUERZA_TITULO_PESO_CLUB: 0.85,
  FUERZA_TITULO_PESO_FORMA: 0.04,
  FUERZA_TITULO_PESO_EQUIPO_ACUMULADO: 0.05,
  FUERZA_TITULO_PESO_RENDIMIENTO_JUGADOR: 0.06,

  calcularFuerzaTitulo(equipo, liga, forma, equipoAcumuladoTemporada, promedioJugador = null) {
    const calidadClub = GameConfig.calidadFuerzaClub(equipo, liga);
    const calidadForma = GameConfig.FORMA_CALIDAD[forma] ?? 0.5;
    const calidadEquipoAcumulado = GameConfig.clamp(
      0.5 + equipoAcumuladoTemporada / (2 * GameConfig.FUERZA_EQUIPO_ACUMULADO_REFERENCIA), 0, 1
    );
    const calidadRendimientoJugador = promedioJugador
      ? GameConfig.clamp(
          (promedioJugador - GameConfig.FUERZA_RENDIMIENTO_PROMEDIO_PISO) / GameConfig.FUERZA_RENDIMIENTO_PROMEDIO_RANGO,
          0, 1
        )
      : 0.5;
    const fuerza = GameConfig.FUERZA_TITULO_PESO_CLUB * calidadClub
      + GameConfig.FUERZA_TITULO_PESO_FORMA * calidadForma
      + GameConfig.FUERZA_TITULO_PESO_EQUIPO_ACUMULADO * calidadEquipoAcumulado
      + GameConfig.FUERZA_TITULO_PESO_RENDIMIENTO_JUGADOR * calidadRendimientoJugador;
    return GameConfig.clamp(fuerza, 0, 1);
  },

  // Título de liga (y final de copa internacional — ver finalizarTemporada
  // en el store, que le pasa calcularFuerzaTitulo en vez de la fuerza de
  // campaña compartida): curva empinada, casi exclusiva de los clubes top.
  probGanarLiga(fuerza) {
    return GameConfig.clamp(0.02 + 0.85 * Math.pow(fuerza, 3.5), 0, 0.85);
  },

  // Copa nacional: mucho más pareja (a propósito) — un club chico tiene
  // una chance real, proporcional a su nivel pero no aplastada por él.
  probGanarCopa(fuerza) {
    return GameConfig.clamp(0.05 + 0.70 * Math.pow(fuerza, 1.3), 0, 0.70);
  },

  // Avanzar de ronda en una competición eliminatoria (copa nacional o
  // internacional): se tira una vez por ronda disponible; si no se
  // avanza, la campaña en esa competición termina ahí.
  probAvanzarRonda(fuerza) {
    return GameConfig.clamp(0.25 + 0.5 * fuerza, 0.1, 0.85);
  },

  // Clasificación a competición internacional para la temporada
  // siguiente. Una campaña floja te puede dejar afuera del todo, sin
  // pisos mínimos por nivel de liga.
  UMBRAL_CLASIFICA_PRIMER_NIVEL: 0.72,
  UMBRAL_CLASIFICA_SEGUNDO_NIVEL: 0.45,

  // ============================================================
  // PREMIOS MUNDIALES (Bota de Oro, Once Ideal, Balón de Oro)
  // No hay miles de jugadores rivales simulados en este juego — al
  // cierre de cada temporada (ver generarCandidatosPremiosMundiales en
  // carrera.js) se genera un pool de ~24 candidatos de nivel élite
  // usando LA MISMA fórmula que ya usa tu propio jugador (simularTramo),
  // repartidos entre las ligas de GameDatabase con más peso en las más
  // fuertes. Así la comparación es justa: si tus números se sienten
  // inflados o flojos, los del pool se sienten exactamente igual.
  // ============================================================
  PREMIOS_CANDIDATOS_N: 24,
  PREMIOS_OVR_MIN: 82,
  PREMIOS_OVR_MAX: 99,
  // La Bota de Oro es casi siempre un delantero, pero un mediocampista o
  // lateral prolífico compite de vez en cuando — nunca un arquero o
  // central (P. ej. Van Dijk no gana la Bota de Oro), así que esos dos
  // grupos quedan afuera del sorteo de candidatos.
  PREMIOS_PESO_GRUPO: { ataque: 0.55, medio: 0.25, lateral: 0.12, central: 0.08 },

  // simularTramo ya no toma un grupo (5 perfiles) sino una posición
  // individual (12 perfiles, ver PROPENSION_GOL_POSICION) — un candidato
  // a premio se sortea por grupo (PREMIOS_PESO_GRUPO), así que necesita
  // una posición representativa de ESE grupo para poder simular sus
  // estadísticas. Elegida por ser la más "típica" de cada perfil: el
  // DC es el delantero de referencia (el mayor goleador de todos), el
  // MCO el mediocampista más ofensivo, etc.
  POSICION_REPRESENTATIVA_GRUPO: { arquero: 'POR', central: 'DFC', lateral: 'LI', medio: 'MCO', ataque: 'DC' },

  // OVR sesgado hacia el centro del rango (82-99) promediando 3 tiradas
  // en vez de una sola uniforme — son candidatos genuinos al premio, no
  // una muestra pareja de "cualquier nivel élite".
  sortearOvrCandidatoPremio() {
    const t = (Math.random() + Math.random() + Math.random()) / 3;
    return Math.round(GameConfig.PREMIOS_OVR_MIN + t * (GameConfig.PREMIOS_OVR_MAX - GameConfig.PREMIOS_OVR_MIN));
  },

  sortearGrupoCandidatoPremio() {
    const r = Math.random();
    let acumulado = 0;
    for (const [grupo, peso] of Object.entries(GameConfig.PREMIOS_PESO_GRUPO)) {
      acumulado += peso as number;
      if (r < acumulado) return grupo as GrupoPosicion;
    }
    return "ataque";
  },

  // Margen de tolerancia para el Once Ideal (ver evaluarPremiosMundiales
  // en carrera.js): desde OVR ~95 el rating de cada partido queda
  // clampeado al tope (10.0) sin variación posible, así que comparar el
  // promedio exacto dejaba el premio reservado casi solo a quien pisa
  // ese umbral — con este colchón, un promedio de élite real (9.5-9.9)
  // también tiene una chance genuina.
  ONCE_IDEAL_MARGEN_PROMEDIO: 0.4,

  // Balón de Oro: ninguna pata sola alcanza — hace falta rendimiento de
  // élite (rating), producción goleadora real, Y haber ganado algo esa
  // temporada, los tres a la vez.
  BALON_ORO_PESO_RATING: 0.4,
  BALON_ORO_PESO_GOLEADOR: 0.35,
  BALON_ORO_PESO_TROFEOS: 0.25,
  BALON_ORO_REFERENCIA_GOLES: 40, // goles + asistencias de una temporada de ensueño

  calcularCalidadBalonDeOro(promedio, golesMasAsistencias, ganoTrofeo) {
    const calidadRating = GameConfig.clamp((promedio - 7.0) / 2.5, 0, 1);
    const calidadGoleador = GameConfig.clamp(golesMasAsistencias / GameConfig.BALON_ORO_REFERENCIA_GOLES, 0, 1);
    const calidadTrofeos = ganoTrofeo ? 1 : 0;
    return GameConfig.BALON_ORO_PESO_RATING * calidadRating
      + GameConfig.BALON_ORO_PESO_GOLEADOR * calidadGoleador
      + GameConfig.BALON_ORO_PESO_TROFEOS * calidadTrofeos;
  },

  // ============================================================
  // SELECCIÓN NACIONAL
  // Convocatoria: cada país tiene un "OVR de referencia" (umbralOvrConvocatoria)
  // que le da a un jugador un 50/50 de ser llamado — cuanto más grande la
  // selección, más alto ese OVR (a Francia, fuerza 94, hay que llegarle con
  // un OVR de élite; a Bolivia, fuerza 35, con un OVR medio ya empareja).
  // Por encima o debajo de ese umbral, la probabilidad sube o baja de forma
  // lineal, no de golpe — hay una franja real de incertidumbre, no un corte
  // seco. Se sortea una vez por temporada, igual que Alto Impacto.
  UMBRAL_OVR_CONVOCATORIA_BASE: 50,
  UMBRAL_OVR_CONVOCATORIA_FACTOR: 0.35,
  PROB_CONVOCATORIA_PENDIENTE_OVR: 0.04,
  PROB_CONVOCATORIA_MIN: 0.03,
  PROB_CONVOCATORIA_MAX: 0.95,

  umbralOvrConvocatoria(fuerzaSeleccion) {
    return GameConfig.UMBRAL_OVR_CONVOCATORIA_BASE + fuerzaSeleccion * GameConfig.UMBRAL_OVR_CONVOCATORIA_FACTOR;
  },

  probConvocatoria(ovr, fuerzaSeleccion) {
    const umbral = GameConfig.umbralOvrConvocatoria(fuerzaSeleccion);
    return GameConfig.clamp(
      0.5 + (ovr - umbral) * GameConfig.PROB_CONVOCATORIA_PENDIENTE_OVR,
      GameConfig.PROB_CONVOCATORIA_MIN,
      GameConfig.PROB_CONVOCATORIA_MAX
    );
  },

  // "Calidad de campaña" de la selección (0-1, mismo formato que
  // calcularFuerzaCampana de club): la fuerza fija del país pesa la
  // enorme mayoría — un solo jugador no decide el destino de un
  // seleccionado — con un empujón chico según tu forma del momento.
  SELECCION_PESO_JUGADOR: 0.15,

  calidadSeleccion(fuerzaSeleccion, forma) {
    const base = fuerzaSeleccion / GameConfig.EJE_MAX;
    const calidadForma = GameConfig.FORMA_CALIDAD[forma] ?? 0.5;
    return GameConfig.clamp(base + (calidadForma - 0.5) * GameConfig.SELECCION_PESO_JUGADOR, 0, 1);
  },

  // Clasificar al torneo grande (Mundial/continental) esa ventana — más
  // parejo que ganarlo, ver probGanarCopa como referencia de curva.
  probClasificarTorneoSeleccion(calidad) {
    return GameConfig.clamp(0.15 + 0.8 * calidad, 0.05, 0.97);
  },

  // Sobrevivir la fase de grupos, ya clasificado — bastante generoso,
  // como en la vida real donde caer en fase de grupos es la excepción.
  probAvanzarFaseDeGruposSeleccion(calidad) {
    return GameConfig.clamp(0.35 + 0.6 * calidad, 0.15, 0.95);
  },
  // Cada ronda eliminatoria en adelante reutiliza probAvanzarRonda tal
  // cual (misma escala 0-1 que la fuerza de campaña de un club).

  // Rango en vez de un número fijo — un año de amistosos "de verdad" tiene
  // varias ventanas FIFA, no una sola, así que un valor único siempre se
  // sentía igual de temporada a temporada.
  PARTIDOS_AMISTOSO_SELECCION_MIN: 3,
  PARTIDOS_AMISTOSO_SELECCION_MAX: 5,
  // Una campaña de eliminatorias real son muchos partidos (una liguilla
  // entera o varias rondas), se clasifiques o no — antes esto solo
  // aparecía como "consuelo" al no clasificar, con el mismo número fijo
  // que un año de amistosos (2), lo que las hacía indistinguibles. Ahora
  // TODO año de torneo grande arranca con esta campaña (clasifiques o
  // no), y si clasificás, se le suma la fase de grupos + eliminación
  // directa — así el total ya no salta solo entre "2 o 6".
  PARTIDOS_ELIMINATORIAS_MIN: 6,
  PARTIDOS_ELIMINATORIAS_MAX: 10,
  PARTIDOS_FASE_DE_GRUPOS_SELECCION: 3,
  RONDAS_KO_MUNDIAL: 4, // octavos, cuartos, semifinal, final
  RONDAS_KO_CONTINENTAL: 3, // cuartos, semifinal, final
  NOMBRES_RONDA_KO: {
    4: ["octavos de final", "cuartos de final", "semifinal", "la final"],
    3: ["cuartos de final", "semifinal", "la final"],
  },

  // Calendario real, sin estado adicional que guardar: Mundial y copa
  // continental (Copa América/Eurocopa/Copa Oro/Copa Africana/Copa
  // Asiática, según tu confederación) caen cada 4 temporadas, alternados
  // — igual que en la vida real, donde ambos torneos van cada 4 años
  // desfasados 2 entre sí.
  tipoAnoTorneoSeleccion(numeroTemporada) {
    const ciclo = numeroTemporada % 4;
    if (ciclo === 1) return "mundial";
    if (ciclo === 3) return "continental";
    return null;
  },

  // ============================================================
  // PARTICIPACIÓN DEL JUGADOR
  // Los partidos calculados arriba son los del CLUB — cuántos de esos
  // juegas tú depende de tu OVR relativo, cómo vienen tus decisiones
  // (rendimientoAcumulado), tu forma (una lesión, por ejemplo, te deja
  // afuera de bastantes partidos aunque el equipo los juegue igual) y de
  // si sos titular ese tramo (ver calcularTitular): antes ese dato era
  // solo decorativo (se mostraba el badge, pero no cambiaba en nada
  // cuántos minutos te tocaban) — ahora si el club te para de arranque
  // efectivamente jugás más.
  //
  // El peso del OVR es asimétrico a propósito: por debajo de la
  // referencia castiga fuerte (PESO_BAJO) y por encima suma suave
  // (PESO_ALTO). Con un solo coeficiente parejo, un novato del piso real
  // de OVR inicial (OVR_INICIAL_MIN = 50) todavía terminaba jugando más
  // de la mitad de la temporada — nada de "suplente de verdad" — y para
  // castigar eso con un coeficiente único, el techo de los novatos
  // buenos (OVR_INICIAL_MAX = 65) saturaba de entrada al 100%, sin dejar
  // margen para diferenciar a un jugador ya asentado.
  // ============================================================
  FORMA_BONUS_PARTICIPACION: {
    inspirado: 0.15, plenitud: 0.12, animado: 0.06, regular: 0,
    desanimado: -0.08, bajo: -0.15, lesionado: -0.35,
  },
  PARTICIPACION_OVR_REFERENCIA: 55,
  PARTICIPACION_OVR_PESO_BAJO: 0.08,
  PARTICIPACION_OVR_PESO_ALTO: 0.02,
  PARTICIPACION_MIN: 0.15,
  // Ni el mejor jugador del mundo juega el 100% de los partidos siempre
  // (rotación, descanso, algún golpe menor que ni cuenta como lesión) —
  // se deja un margen del 8% aun en el mejor de los casos.
  PARTICIPACION_MAX: 0.92,
  // Base subida de 0.5 a 0.65: un jugador ya asentado en el plantel
  // (OVR/forma/rendimiento neutros) debería jugar bastante de entrada,
  // no la mitad de los partidos por defecto — así bajar de ahí (mala
  // forma, lesión, ser suplente) se siente como el verdadero castigo.
  PARTICIPACION_BASE: 0.65,
  PARTICIPACION_BONUS_TITULAR: 0.2,

  probabilidadJugar(ovr, rendimientoAcumulado, forma, esTitular) {
    const bonusForma = GameConfig.FORMA_BONUS_PARTICIPACION[forma] ?? 0;
    const bonusTitular = esTitular ? GameConfig.PARTICIPACION_BONUS_TITULAR : 0;
    const diferenciaOvr = ovr - GameConfig.PARTICIPACION_OVR_REFERENCIA;
    const pesoOvr = diferenciaOvr < 0 ? GameConfig.PARTICIPACION_OVR_PESO_BAJO : GameConfig.PARTICIPACION_OVR_PESO_ALTO;
    const prob = GameConfig.PARTICIPACION_BASE + diferenciaOvr * pesoOvr
      + rendimientoAcumulado * 0.03 + bonusForma + bonusTitular;
    return GameConfig.clamp(prob, GameConfig.PARTICIPACION_MIN, GameConfig.PARTICIPACION_MAX);
  },

  // ============================================================
  // SOLICITUD DE CAMBIO DE DORSAL
  // Al cierre de temporada el jugador puede pedirle al club un número
  // nuevo — el club lo acepta o no según el OVR con el que cerró esa
  // temporada y cómo le fue colectivamente (equipoAcumuladoTemporada).
  // El número pedido en sí no influye: lo que pesa es tu peso dentro
  // del plantel, no si el 10 "está más difícil" que el 23.
  // ============================================================
  PETICION_NUMERO_BASE: 0.3,
  PETICION_NUMERO_OVR_PESO: 0.008,
  PETICION_NUMERO_EQUIPO_PESO: 0.05,

  probabilidadAceptarCambioNumero(ovr, equipoAcumuladoTemporada) {
    const prob = GameConfig.PETICION_NUMERO_BASE
      + (ovr - GameConfig.OVR_CARRERA_MIN) * GameConfig.PETICION_NUMERO_OVR_PESO
      + equipoAcumuladoTemporada * GameConfig.PETICION_NUMERO_EQUIPO_PESO;
    return GameConfig.clamp(prob, 0.05, 0.95);
  },

  // ============================================================
  // LESIONES
  // Se evalúan en cada pausa de decisión (si no hay una lesión ya
  // activa — no hay "doble lesión"). El riesgo sube un poco con la
  // edad, mismo espíritu que el declive de OVR por edad.
  // Niveles (ver GameEvents.lesiones para el contenido de cada uno):
  //   nivel3 (leve, más común): solo deja sin partidos 1 pausa.
  //   nivel2 (moderada): + forma "lesionado" durante la baja + OVR leve.
  //   nivel1 (grave, más rara): + OVR fuerte, baja de varios tramos.
  // Probabilidades escaladas ~33% arriba de las originales: al bajar de
  // 4 a 3 pausas por temporada, con los mismos números de antes salían
  // menos lesiones por temporada de las que se sentían pensadas.
  // ============================================================
  PROB_LESION_BASE: 0.065,
  PROB_LESION_EDAD_INICIO: 30,
  PROB_LESION_EDAD_INCREMENTO: 0.0027,
  PROB_LESION_MAX: 0.18,

  probabilidadLesion(edad) {
    const extra = Math.max(0, edad - GameConfig.PROB_LESION_EDAD_INICIO) * GameConfig.PROB_LESION_EDAD_INCREMENTO;
    return GameConfig.clamp(GameConfig.PROB_LESION_BASE + extra, 0, GameConfig.PROB_LESION_MAX);
  },

  // Pesos del sorteo de nivel1/nivel2 (nivel3 es el resto, ~0.55): grave
  // es raro a propósito.
  PESO_LESION_NIVEL1: 0.10,
  PESO_LESION_NIVEL2: 0.35,

  elegirNivelLesion() {
    const r = Math.random();
    if (r < GameConfig.PESO_LESION_NIVEL1) return "nivel1";
    if (r < GameConfig.PESO_LESION_NIVEL1 + GameConfig.PESO_LESION_NIVEL2) return "nivel2";
    return "nivel3";
  },

  // Duraciones acortadas frente a las originales: con solo 3 tramos por
  // temporada (antes 4), los mismos números de antes se comían la
  // temporada casi entera de forma desproporcionada.
  LESION_NIVEL3_DURACION: 1,
  LESION_NIVEL2_DURACION_MIN: 1,
  LESION_NIVEL2_DURACION_MAX: 2,
  LESION_NIVEL1_DURACION_MIN: 2,

  LESION_NIVEL2_OVR_MIN: 1,
  LESION_NIVEL2_OVR_MAX: 3,
  LESION_NIVEL1_OVR_MIN: 4,
  LESION_NIVEL1_OVR_MAX: 10,

  // `tramosDisponibles`: cuántos tramos quedan en la temporada, contando
  // el que se está por jugar — pone el techo real a la duración para
  // que nunca "deba" partidos de una temporada que ya terminó.
  duracionLesion(nivel, tramosDisponibles) {
    if (nivel === "nivel3") {
      return Math.min(GameConfig.LESION_NIVEL3_DURACION, tramosDisponibles);
    }
    if (nivel === "nivel2") {
      const min = Math.min(GameConfig.LESION_NIVEL2_DURACION_MIN, tramosDisponibles);
      const max = Math.min(GameConfig.LESION_NIVEL2_DURACION_MAX, tramosDisponibles);
      return GameConfig.randomInt(min, max);
    }
    const min = Math.min(GameConfig.LESION_NIVEL1_DURACION_MIN, tramosDisponibles);
    return GameConfig.randomInt(min, tramosDisponibles);
  },

  ovrPerdidoPorLesion(nivel) {
    if (nivel === "nivel2") return GameConfig.randomInt(GameConfig.LESION_NIVEL2_OVR_MIN, GameConfig.LESION_NIVEL2_OVR_MAX);
    if (nivel === "nivel1") return GameConfig.randomInt(GameConfig.LESION_NIVEL1_OVR_MIN, GameConfig.LESION_NIVEL1_OVR_MAX);
    return 0;
  },

  // Al recuperarte, una parte del OVR perdido por la lesión vuelve —
  // era un golpe físico puntual, no una pérdida de nivel definitiva.
  // Se aplica una sola vez, al darte de alta (ver simularTramoYAvanzar).
  LESION_RECUPERACION_OVR: 0.5,
};
