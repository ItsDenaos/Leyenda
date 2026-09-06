// ============================================================
// GameConfig — Configuración y constantes centrales del juego.
//
// Punto único de verdad para valores de balance y fórmulas.
// El resto de los archivos (script.js, carrera.js, etc.) deben
// LEER de aquí en vez de repetir números sueltos ("magic numbers").
//
// Cargar este script ANTES que cualquier otro que lo use.
// ============================================================

const GameConfig = {
  // ---------------- VERSIÓN ----------------
  // Se muestra en el pie de página de cada pantalla (ver footerHtml).
  // Actualizar acá al publicar una versión nueva — no repetir el
  // número/fecha sueltos en cada HTML.
  VERSION: "0.2.0-alpha",
  FECHA_PUBLICACION: "5 de septiembre de 2026 · 22:41",

  footerHtml() {
    return `Leyenda v${GameConfig.VERSION} · Publicado el ${GameConfig.FECHA_PUBLICACION}`;
  },

  // ---------------- CREACIÓN DE PERSONAJE ----------------
  EDAD_MIN: 16,
  EDAD_MAX: 19,

  // ---------------- RANGOS DE EDAD (para eventos de temporada) ----------------
  // novato: edad <= RANGO_EDAD_NOVATO_MAX
  // promedio: entre RANGO_EDAD_NOVATO_MAX+1 y RANGO_EDAD_PROMEDIO_MAX
  // veterano: edad > RANGO_EDAD_PROMEDIO_MAX
  RANGO_EDAD_NOVATO_MAX: 21,
  RANGO_EDAD_PROMEDIO_MAX: 32,

  // ---------------- NIVELES (ocultos al jugador) ----------------
  // Cuanto más cerca de 1, mejor / más competitivo.
  NIVEL_EQUIPO_MIN: 1,
  NIVEL_EQUIPO_MAX: 3,
  NIVEL_LIGA_MIN: 1,
  NIVEL_LIGA_MAX: 6,

  // ---------------- OVR INICIAL ----------------
  OVR_INICIAL_MIN: 50,
  OVR_INICIAL_MAX: 65,

  // Peso relativo de cada factor en el cálculo del OVR inicial (deben sumar 1).
  OVR_PESO_EQUIPO: 0.55,
  OVR_PESO_LIGA: 0.45,

  // Variación máxima (+/-) que puede aportar la suerte antes de recortar al rango permitido.
  OVR_SUERTE_VARIACION: 4,

  // ---------------- OFERTAS DE EQUIPO INICIAL ----------------
  // Las 4 opciones que se le presentan al jugador al empezar la carrera.
  // Todavía no existe un OVR (se calcula recién al elegir), así que acá
  // se usa nivel fijo, no la ventana de OVR que sí aplica a las ofertas
  // durante la carrera.
  //
  // Si el país elegido tiene liga propia en la base de datos, las 4
  // ofertas salen de esa liga (banda normal). Si no, arranca en una de
  // las 5 grandes ligas europeas al azar, con una banda más floja
  // (sin favores: solo clubes chicos/medios).
  LIGAS_GRANDES_EUROPEAS: ["premier-league", "la-liga", "serie-a", "bundesliga", "ligue-1"],

  // "aleatorio" se resuelve entre NIVEL_EQUIPO_MIN y NIVEL_EQUIPO_MAX al momento de generar.
  OFERTAS_INICIALES: [
    { nivel: 3 },
    { nivel: 3 },
    { nivel: 2 },
    { nivel: "aleatorio" },
  ],

  OFERTAS_INICIALES_EXTRANJERO: [
    { nivel: 3 },
    { nivel: 3 },
    { nivel: 3 },
    { nivel: 2 },
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

  randomFrom(array) {
    return array[GameConfig.randomInt(0, array.length - 1)];
  },

  // Convierte un nivel (1 = mejor) a una escala 0..1 donde 1 = mejor.
  normalizarNivel(nivel, min, max) {
    return (max - nivel) / (max - min);
  },

  // ============================================================
  // CÁLCULO DE OVR INICIAL
  // Mezcla nivel de equipo + nivel de liga + suerte, siempre
  // acotado entre OVR_INICIAL_MIN y OVR_INICIAL_MAX.
  // ============================================================
  calcularOvrInicial(nivelEquipo, nivelLiga) {
    const calidadEquipo = GameConfig.normalizarNivel(
      nivelEquipo, GameConfig.NIVEL_EQUIPO_MIN, GameConfig.NIVEL_EQUIPO_MAX
    );
    const calidadLiga = GameConfig.normalizarNivel(
      nivelLiga, GameConfig.NIVEL_LIGA_MIN, GameConfig.NIVEL_LIGA_MAX
    );

    const calidadCombinada =
      calidadEquipo * GameConfig.OVR_PESO_EQUIPO +
      calidadLiga * GameConfig.OVR_PESO_LIGA;

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
  // Elige un equipo al azar que cumpla el nivel pedido, evitando
  // repetir (cuando el dataset lo permite).
  // ============================================================
  elegirEquipoPorNivel(equipos, nivel, excluirIds = []) {
    const candidatos = equipos.filter((e) => e.nivel === nivel && !excluirIds.includes(e.id));
    if (candidatos.length > 0) return GameConfig.randomFrom(candidatos);

    // Fallback: dataset chico y ya no quedan equipos libres de ese nivel exacto.
    const disponibles = equipos.filter((e) => !excluirIds.includes(e.id));
    return GameConfig.randomFrom(disponibles.length > 0 ? disponibles : equipos);
  },

  generarOfertasDesdeBanda(equipos, banda) {
    const usados = [];
    return banda.map((oferta) => {
      const nivelBuscado = oferta.nivel === "aleatorio"
        ? GameConfig.randomInt(GameConfig.NIVEL_EQUIPO_MIN, GameConfig.NIVEL_EQUIPO_MAX)
        : oferta.nivel;
      const equipo = GameConfig.elegirEquipoPorNivel(equipos, nivelBuscado, usados);
      usados.push(equipo.id);
      return equipo;
    });
  },

  // Ofertas de la liga del propio país del jugador (2 nivel3, 1 nivel2, 1 al azar).
  generarOfertasIniciales(equipos) {
    return GameConfig.generarOfertasDesdeBanda(equipos, GameConfig.OFERTAS_INICIALES);
  },

  // Ofertas cuando el jugador arranca "de extranjero" en una liga grande
  // (3 nivel3, 1 nivel2 — sin la chance de nivel1 ni la casilla al azar).
  generarOfertasInicialesExtranjero(equipos) {
    return GameConfig.generarOfertasDesdeBanda(equipos, GameConfig.OFERTAS_INICIALES_EXTRANJERO);
  },

  // ============================================================
  // ETIQUETAS DESCRIPTIVAS
  // Traducen los niveles ocultos a texto que sí puede ver el
  // jugador, sin exponer el número real.
  // ============================================================
  descripcionNivelEquipo(nivel) {
    if (nivel <= 1) return "Club grande";
    if (nivel === 2) return "Club consolidado";
    return "Club humilde";
  },

  descripcionNivelLiga(nivel) {
    if (nivel <= 2) return "Liga de élite";
    if (nivel <= 4) return "Liga competitiva";
    return "Liga regional";
  },

  // ============================================================
  // VALOR DE MERCADO
  // Curva exponencial sobre el OVR (como en la vida real: cada punto
  // extra de calidad cerca del techo vale desproporcionadamente más),
  // multiplicada por el prestigio del club/liga actual — el mismo OVR
  // vale mucho más en un club/liga grande que en uno chico.
  // ============================================================
  VALOR_MERCADO_BASE: 18000, // valor en el piso absoluto de OVR (OVR_CARRERA_MIN)
  VALOR_MERCADO_CRECIMIENTO: 1.185, // multiplicador de valor por cada punto de OVR extra

  VALOR_MULTIPLICADOR_CLUB_MIN: 0.5, // club/liga más floja posible
  VALOR_MULTIPLICADOR_CLUB_MAX: 1.4, // club/liga más prestigiosa posible

  calcularMultiplicadorClub(nivelEquipo, nivelLiga) {
    const calidadEquipo = GameConfig.normalizarNivel(nivelEquipo, GameConfig.NIVEL_EQUIPO_MIN, GameConfig.NIVEL_EQUIPO_MAX);
    const calidadLiga = GameConfig.normalizarNivel(nivelLiga, GameConfig.NIVEL_LIGA_MIN, GameConfig.NIVEL_LIGA_MAX);
    const calidadCombinada = calidadEquipo * GameConfig.OVR_PESO_EQUIPO + calidadLiga * GameConfig.OVR_PESO_LIGA;
    const rango = GameConfig.VALOR_MULTIPLICADOR_CLUB_MAX - GameConfig.VALOR_MULTIPLICADOR_CLUB_MIN;
    return GameConfig.VALOR_MULTIPLICADOR_CLUB_MIN + calidadCombinada * rango;
  },

  calcularValorMercado(ovr, nivelEquipo, nivelLiga) {
    const valorPorOvr = GameConfig.VALOR_MERCADO_BASE * Math.pow(GameConfig.VALOR_MERCADO_CRECIMIENTO, ovr - GameConfig.OVR_CARRERA_MIN);
    const multiplicadorClub = GameConfig.calcularMultiplicadorClub(nivelEquipo, nivelLiga);
    const valor = valorPorOvr * multiplicadorClub;
    return Math.round(valor / 1000) * 1000;
  },

  // Solo hay 18 combinaciones posibles de nivel de equipo/liga, así que
  // dos clubes del mismo nivel dan EXACTAMENTE el mismo valor de mercado
  // — lógico puertas adentro, pero en una tarjeta de oferta se ve raro
  // que dos clubes distintos "valoren" tu pase por el mismo número exacto
  // al centavo. Esta variación es solo cosmética, para las ofertas: no
  // toca el valor de mercado real del jugador (ver calcularValorMercado).
  OFERTA_VARIACION_VALOR: 0.08,
  valorOfrecidoPorClub(ovr, nivelEquipo, nivelLiga) {
    const base = GameConfig.calcularValorMercado(ovr, nivelEquipo, nivelLiga);
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

  // ============================================================
  // RANGO DE EDAD → usado para elegir qué banco de eventos aplica
  // ============================================================
  rangoEdadDe(edad) {
    if (edad <= GameConfig.RANGO_EDAD_NOVATO_MAX) return "novato";
    if (edad <= GameConfig.RANGO_EDAD_PROMEDIO_MAX) return "promedio";
    return "veterano";
  },

  // Elige `n` elementos únicos al azar de un array, sin modificar el original.
  muestraAleatoria(array, n) {
    const copia = [...array];
    const resultado = [];
    for (let i = 0; i < n && copia.length > 0; i++) {
      const idx = GameConfig.randomInt(0, copia.length - 1);
      resultado.push(copia.splice(idx, 1)[0]);
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

  // Arma el HTML de un escudo de equipo con fallback automático: si la
  // imagen no carga, se reemplaza sola por el placeholder de iniciales.
  // `claseCss` es la clase (o clases) que ya usa el placeholder en cada
  // pantalla (ej. "team-crest team-crest--md" u "offer-card__crest").
  crestHtml(equipo, claseCss) {
    const ruta = GameConfig.rutaEscudoEquipo(equipo);
    return `<img src="${ruta}" alt="${equipo.nombre}" class="${claseCss}"
      style="--crest-a:${equipo.a};--crest-b:${equipo.b}"
      data-initials="${equipo.initials}" onerror="GameConfig.crestFallback(this)">`;
  },
  crestFallback(img) {
    img.onerror = null;
    const span = document.createElement("span");
    span.className = img.className;
    span.setAttribute("style", img.getAttribute("style"));
    span.textContent = img.dataset.initials;
    img.replaceWith(span);
  },

  // Mismo patrón que crestHtml, pero para el escudo de la liga. Las ligas
  // no tienen colores propios en la base de datos (a/b), así que el
  // placeholder de respaldo usa el degradado por defecto (ver --crest-a/b
  // en el CSS) y unas iniciales derivadas del nombre en vez de un campo fijo.
  inicialesLiga(liga) {
    const letras = liga.nombre.replace(/[^\p{L}\s]/gu, "").trim().split(/\s+/);
    return letras.map((p) => p[0]).join("").slice(0, 3).toUpperCase();
  },
  ligaCrestHtml(liga, claseCss) {
    const ruta = GameConfig.rutaEscudoLiga(liga);
    return `<img src="${ruta}" alt="${liga.nombre}" class="${claseCss} team-crest--liga"
      data-initials="${GameConfig.inicialesLiga(liga)}" onerror="GameConfig.crestFallback(this)">`;
  },

  // Trofeos de las competiciones reales (ver GameDatabase.competiciones):
  // si el trofeo todavía no tiene imagen cargada (`trofeoImagen` vacío),
  // se muestra el ícono 🏆 genérico como respaldo. Los archivos son
  // siluetas negras sobre fondo transparente — se pintan del dorado del
  // sistema con `mask-image` (el color real del PNG no importa, solo su
  // alpha), en vez de un <img> con su color original.
  RUTA_ESCUDOS_TROFEOS: "assets/escudos/trofeos/",

  trofeoIconHtml(trofeo) {
    if (!trofeo.imagen) return `<span class="trophy-card__icon">🏆</span>`;
    const ruta = `${GameConfig.RUTA_ESCUDOS_TROFEOS}${trofeo.imagen}`;
    return `<span class="trophy-card__icon-img" style="-webkit-mask-image:url('${ruta}');mask-image:url('${ruta}')"></span>`;
  },

  // ============================================================
  // BANDERAS DE PAÍS
  // Windows no dibuja los emoji de bandera (muestra el código de 2
  // letras suelto), así que se usan imágenes reales por código ISO
  // 3166-1 alpha-2 (flagcdn.com, gratis, sin API key). Si por lo que
  // sea la imagen no carga, cae al emoji como respaldo de texto.
  // ============================================================
  RUTA_BANDERAS: "https://flagcdn.com/w40/",

  flagHtml(code, claseCss, emojiRespaldo) {
    if (!code) return `<span class="${claseCss}">${emojiRespaldo || "🏳️"}</span>`;
    return `<img src="${GameConfig.RUTA_BANDERAS}${code}.png" alt="" class="${claseCss}"
      data-fallback="${emojiRespaldo || "🏳️"}" onerror="GameConfig.flagFallback(this)">`;
  },
  flagFallback(img) {
    img.onerror = null;
    const span = document.createElement("span");
    span.className = img.className;
    span.textContent = img.dataset.fallback;
    img.replaceWith(span);
  },

  // Elige `n` elementos únicos al azar de `candidatos`, con probabilidad
  // proporcional a `pesoFn(candidato)` (mayor peso = más chance de salir).
  elegirPonderado(candidatos, pesoFn, n) {
    const disponibles = [...candidatos];
    const resultado = [];
    for (let i = 0; i < n && disponibles.length > 0; i++) {
      const pesos = disponibles.map(pesoFn);
      const total = pesos.reduce((a, b) => a + b, 0);
      let r = Math.random() * total;
      let idx = pesos.length - 1;
      for (let j = 0; j < pesos.length; j++) {
        r -= pesos[j];
        if (r <= 0) { idx = j; break; }
      }
      resultado.push(disponibles.splice(idx, 1)[0]);
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

  elegirMejorEncaje(candidatos, pesoFn, n) {
    const ordenados = [...candidatos].sort((a, b) => pesoFn(b) - pesoFn(a));
    const tamanioTop = Math.max(n, Math.ceil(ordenados.length * GameConfig.OFERTA_TOP_ENCAJE_FRACCION));
    const grupoTop = ordenados.slice(0, tamanioTop);
    return GameConfig.elegirPonderado(grupoTop, pesoFn, n);
  },

  // ============================================================
  // PRESTIGIO DEL JUGADOR → a qué nivel de equipo/liga "apunta"
  // Cuanto más OVR, más cerca de nivel 1 (mejor) apuntan sus ofertas.
  // No es un corte duro: se usa como peso, así que igual pueden
  // aparecer ofertas de clubes algo más grandes o más chicos.
  // ============================================================
  calcularPrestigioJugador(ovr) {
    const rango = GameConfig.OVR_CARRERA_MAX - GameConfig.OVR_CARRERA_MIN;
    return GameConfig.clamp((ovr - GameConfig.OVR_CARRERA_MIN) / rango, 0, 1);
  },

  nivelEquipoObjetivo(ovr) {
    const prestigio = GameConfig.calcularPrestigioJugador(ovr);
    return GameConfig.NIVEL_EQUIPO_MAX - prestigio * (GameConfig.NIVEL_EQUIPO_MAX - GameConfig.NIVEL_EQUIPO_MIN);
  },

  nivelLigaObjetivo(ovr) {
    const prestigio = GameConfig.calcularPrestigioJugador(ovr);
    return GameConfig.NIVEL_LIGA_MAX - prestigio * (GameConfig.NIVEL_LIGA_MAX - GameConfig.NIVEL_LIGA_MIN);
  },

  // Peso de una oferta según qué tan cerca está su nivel del objetivo del jugador.
  // Exponente > 1 para que el efecto se note fuerte (no un sesgo apenas perceptible).
  PESO_DISTANCIA_LIGA: 0.6, // cuánto pesa desviarse en liga vs. desviarse en equipo
  PESO_EXPONENTE: 2.2,
  pesoPorCercaniaNivel(nivelEquipo, nivelLiga, nivelEquipoObjetivo, nivelLigaObjetivo) {
    const distancia = Math.abs(nivelEquipo - nivelEquipoObjetivo)
      + Math.abs(nivelLiga - nivelLigaObjetivo) * GameConfig.PESO_DISTANCIA_LIGA;
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
  // Tolerancia ampliada de 10 a 13: con 10, un club top (nivel 1 liga +
  // nivel 1 equipo, centro en el 99 absoluto) recién se volvía elegible
  // a partir de 89 OVR — con el rango real de picos de carrera (~85-90),
  // los grandes del mundo eran prácticamente inalcanzables. Con 13, ya
  // entran en juego desde los 86, un nivel de "muy bueno" real.
  // ============================================================
  OFERTA_TOLERANCIA_OVR: 13,

  calcularCentroOvr(nivelEquipo, nivelLiga) {
    const calidadEquipo = GameConfig.normalizarNivel(nivelEquipo, GameConfig.NIVEL_EQUIPO_MIN, GameConfig.NIVEL_EQUIPO_MAX);
    const calidadLiga = GameConfig.normalizarNivel(nivelLiga, GameConfig.NIVEL_LIGA_MIN, GameConfig.NIVEL_LIGA_MAX);
    const calidadCombinada = calidadEquipo * GameConfig.OVR_PESO_EQUIPO + calidadLiga * GameConfig.OVR_PESO_LIGA;
    const rango = GameConfig.OVR_CARRERA_MAX - GameConfig.OVR_CARRERA_MIN;
    return GameConfig.OVR_CARRERA_MIN + calidadCombinada * rango;
  },

  ventanaOvrOferta(nivelEquipo, nivelLiga) {
    const centro = GameConfig.calcularCentroOvr(nivelEquipo, nivelLiga);
    return {
      min: GameConfig.clamp(centro - GameConfig.OFERTA_TOLERANCIA_OVR, GameConfig.OVR_CARRERA_MIN, GameConfig.OVR_CARRERA_MAX),
      max: GameConfig.clamp(centro + GameConfig.OFERTA_TOLERANCIA_OVR, GameConfig.OVR_CARRERA_MIN, GameConfig.OVR_CARRERA_MAX),
    };
  },

  equipoElegibleParaOvr(nivelEquipo, nivelLiga, ovr) {
    const ventana = GameConfig.ventanaOvrOferta(nivelEquipo, nivelLiga);
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

  contratoDebeTerminar(nivelEquipo, nivelLiga, ovr) {
    const ventana = GameConfig.ventanaOvrOferta(nivelEquipo, nivelLiga);
    return ovr < ventana.min;
  },

  // ============================================================
  // POTENCIAL POR EDAD
  // A igual OVR, un jugador joven tiene más recorrido/valor de reventa
  // que uno grande, así que entre dos elegibles para los mismos clubes
  // el joven apunta más arriba. Esto NO toca la elegibilidad real
  // (equipoElegibleParaOvr sigue siendo puro OVR, así que "no ofertas
  // sin sentido" se mantiene) — solo ajusta a cuáles clubes, dentro del
  // pool ya elegible, se los prioriza vía nivelEquipoObjetivo/
  // nivelLigaObjetivo.
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
  // en casa, aunque la hayas jugado toda afuera.
  EDAD_OCASO_RETORNO_PAIS: 33,

  // ============================================================
  // CALENDARIO DE TEMPORADA
  // 3 pausas de eventos (personal/deportivo) + 2 ventanas de fichajes
  // (ofertas). Las pausas de eventos ya no van en bandas fijas y
  // ordenadas: una cae en algún punto antes de la mitad de temporada,
  // otra en cualquier punto de toda la temporada, y la última bien al
  // final — se generan así y recién después se ordenan por progreso
  // para que el calendario quede cronológico. La oferta de
  // pretemporada no aplica a la Temporada 1 (el jugador ya eligió
  // equipo en la pantalla de creación).
  // ============================================================
  TOTAL_TRAMOS_TEMPORADA: 3, // un bloque de partidos simulado por cada pausa de evento
  CALENDARIO_PAUSA_ANTES_MITAD_MIN: 5, CALENDARIO_PAUSA_ANTES_MITAD_MAX: 45,
  CALENDARIO_OFERTA_MITAD: 50,
  CALENDARIO_PAUSA_ULTIMO_MOMENTO_MIN: 92, CALENDARIO_PAUSA_ULTIMO_MOMENTO_MAX: 99,

  crearCalendarioTemporada(numeroTemporada) {
    const calendario = [];
    if (numeroTemporada > 1) {
      calendario.push({ tipo: "oferta", progreso: 0 });
    }
    calendario.push({ tipo: "decision", progreso: GameConfig.randomInt(GameConfig.CALENDARIO_PAUSA_ANTES_MITAD_MIN, GameConfig.CALENDARIO_PAUSA_ANTES_MITAD_MAX) });
    calendario.push({ tipo: "oferta", progreso: GameConfig.CALENDARIO_OFERTA_MITAD });
    calendario.push({ tipo: "decision", progreso: GameConfig.randomInt(0, 100) });
    calendario.push({ tipo: "decision", progreso: GameConfig.randomInt(GameConfig.CALENDARIO_PAUSA_ULTIMO_MOMENTO_MIN, GameConfig.CALENDARIO_PAUSA_ULTIMO_MOMENTO_MAX) });
    calendario.sort((a, b) => a.progreso - b.progreso);
    return calendario;
  },

  // ============================================================
  // ESTADÍSTICAS POR TRAMO
  // Cada posición pertenece a un grupo con distinta propensión a
  // convertir goles/asistencias. El OVR y el rendimiento acumulado
  // del tramo (por las decisiones tomadas) escalan esa propensión.
  // ============================================================
  GRUPOS_POSICION: {
    POR: "arquero",
    DFC: "defensa", LI: "defensa", LD: "defensa",
    MCD: "medio", MC: "medio", MI: "medio", MD: "medio", MCO: "medio",
    EI: "ataque", ED: "ataque", DC: "ataque",
  },

  // Propensiones altas a propósito: el objetivo no es el realismo,
  // es que el jugador se sienta cada vez más habilidoso.
  PROPENSION_GOL: { arquero: 0.01, defensa: 0.12, medio: 0.24, ataque: 0.55 },
  PROPENSION_ASISTENCIA: { arquero: 0.01, defensa: 0.14, medio: 0.34, ataque: 0.28 },
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

  simularTramo({ partidos, grupo, ovr, rendimientoAcumulado }) {
    const factorOvr = 0.85 + (ovr - 50) / 50; // ~neutral en el debut (OVR 50-65), crece fuerte después
    const factorForma = 1 + GameConfig.clamp(rendimientoAcumulado, -12, 12) * 0.05;
    const factor = Math.max(0.3, factorOvr * factorForma);

    let goles = 0, asistencias = 0, mvp = 0, sumaRating = 0;
    for (let i = 0; i < partidos; i++) {
      const hizoGol = Math.random() < GameConfig.PROPENSION_GOL[grupo] * factor;
      const hizoAsistencia = Math.random() < GameConfig.PROPENSION_ASISTENCIA[grupo] * factor;
      if (hizoGol) goles++;
      if (hizoAsistencia) asistencias++;

      const bonusActuacion = (hizoGol ? GameConfig.BONUS_MVP_POR_GOL : 0) + (hizoAsistencia ? GameConfig.BONUS_MVP_POR_ASISTENCIA : 0);
      if (Math.random() < GameConfig.PROBABILIDAD_MVP_BASE * factor + bonusActuacion) mvp++;

      const bonusRating = (hizoGol ? GameConfig.BONUS_RATING_POR_GOL : 0) + (hizoAsistencia ? GameConfig.BONUS_RATING_POR_ASISTENCIA : 0);
      const ratingPartido = GameConfig.clamp(6.5 + (factor - 1) * 2.5 + bonusRating + GameConfig.randomInt(-4, 4) / 10, 5, 10);
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

  // Freno por edad: crecimiento pleno hasta los 26, cada vez más difícil
  // entre 27 y 31, y a partir de los 32 se estabiliza en un tercio del
  // ritmo pleno (sigue habiendo progreso, solo que más lento) — antes caía
  // casi a cero y volvía carreras muy largas para llegar a un buen nivel.
  OVR_EDAD_PRIME_MAX: 26,
  OVR_EDAD_DECLIVE_MAX: 31,
  OVR_EDAD_FACTOR_MIN: 0.35,

  factorCrecimientoPorEdad(edad) {
    if (edad <= GameConfig.OVR_EDAD_PRIME_MAX) return 1;
    if (edad <= GameConfig.OVR_EDAD_DECLIVE_MAX) {
      const progreso = (edad - GameConfig.OVR_EDAD_PRIME_MAX) / (GameConfig.OVR_EDAD_DECLIVE_MAX - GameConfig.OVR_EDAD_PRIME_MAX);
      return 1 - progreso * (1 - GameConfig.OVR_EDAD_FACTOR_MIN);
    }
    return GameConfig.OVR_EDAD_FACTOR_MIN;
  },

  // Caída natural por edad: desde OVR_EDAD_DECLIVE_INICIO empieza a restar
  // OVR de a poco (aunque el jugador rinda bien), y desde OVR_EDAD_ACELERA_DECLIVE
  // la caída se vuelve mucho más pronunciada — nadie se mantiene en su pico
  // para siempre. Es independiente del freno de crecimiento de arriba.
  OVR_EDAD_DECLIVE_INICIO: 32,
  OVR_EDAD_ACELERA_DECLIVE: 39,
  OVR_EDAD_DECLIVE_TASA_BASE: 0.08, // caída por tramo, por año, entre INICIO y ACELERA
  OVR_EDAD_DECLIVE_TASA_ACELERADA: 0.35, // caída por tramo, por año, desde ACELERA en adelante

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
  // (ver carrera.js) sobre el ritmo de crecimiento de OVR — no sobre el
  // declive, que es puro desgaste físico por edad, igual para todos. Con
  // las mismas decisiones de punta a punta, dos carreras ya no crecen
  // exactamente igual: a veces te toca un desarrollo más lento, a veces
  // un talento precoz. No se expone en ningún número visible.
  TALENTO_MIN: 0.85,
  TALENTO_MAX: 1.2,

  ajustarOvrTramo(ovrActual, rendimientoAcumulado, edad, factorTalento = 1) {
    const factorEdad = GameConfig.factorCrecimientoPorEdad(edad);
    const deltaBase = (GameConfig.OVR_TRAMO_BASE + rendimientoAcumulado / GameConfig.OVR_TRAMO_RENDIMIENTO_DIVISOR) * factorEdad * factorTalento;
    const declive = GameConfig.factorDeclivePorEdad(edad);
    const deltaCrudo = deltaBase - declive;
    const minPermitido = declive > 0 ? GameConfig.OVR_TRAMO_DECLIVE_VARIACION_MIN : GameConfig.OVR_TRAMO_VARIACION_MIN;
    const delta = GameConfig.clamp(
      GameConfig.redondeoEstocastico(deltaCrudo),
      minPermitido,
      GameConfig.OVR_TRAMO_VARIACION_MAX
    );
    return GameConfig.clamp(ovrActual + delta, GameConfig.OVR_CARRERA_MIN, GameConfig.OVR_CARRERA_MAX);
  },

  calcularTitular(ovr, rendimientoAcumulado) {
    const prob = GameConfig.clamp(0.6 + rendimientoAcumulado * 0.05 + (ovr - 55) * 0.015, 0.1, 0.97);
    return Math.random() < prob;
  },

  // ============================================================
  // SISTEMA DE COMPETICIONES
  // Todo sale de un único número por temporada, "fuerza de campaña":
  // qué tan bien le está yendo al equipo, mezclando el nivel del club/
  // liga (fijo), el estado de forma del jugador (del momento) y el
  // efecto `equipo` acumulado en la temporada (las decisiones tomadas).
  // De ahí salen tres cosas: la chance de ganar la liga o la copa
  // nacional al cierre de temporada, la chance de avanzar de ronda en
  // cada competición eliminatoria (copa nacional / internacional), y a
  // qué torneo internacional clasifica la próxima temporada.
  // ============================================================
  FORMA_CALIDAD: {
    inspirado: 1.0, plenitud: 0.85, animado: 0.7, regular: 0.5,
    desanimado: 0.3, bajo: 0.15, lesionado: 0.05,
  },

  FUERZA_PESO_NIVEL: 0.5,
  FUERZA_PESO_FORMA: 0.2,
  FUERZA_PESO_EQUIPO_ACUMULADO: 0.3,
  // Umbral de referencia para "normalizar" equipoAcumuladoTemporada a
  // 0..1 (mismo umbral que antes usaba el trofeo genérico): en 0 queda
  // neutral (0.5), en +REFERENCIA llega a 1, en -REFERENCIA a 0.
  FUERZA_EQUIPO_ACUMULADO_REFERENCIA: 4,

  calidadNivelClub(nivelEquipo, nivelLiga) {
    const calidadEquipo = GameConfig.normalizarNivel(nivelEquipo, GameConfig.NIVEL_EQUIPO_MIN, GameConfig.NIVEL_EQUIPO_MAX);
    const calidadLiga = GameConfig.normalizarNivel(nivelLiga, GameConfig.NIVEL_LIGA_MIN, GameConfig.NIVEL_LIGA_MAX);
    return calidadEquipo * GameConfig.OVR_PESO_EQUIPO + calidadLiga * GameConfig.OVR_PESO_LIGA;
  },

  calcularFuerzaCampana(nivelEquipo, nivelLiga, forma, equipoAcumuladoTemporada) {
    const calidadClub = GameConfig.calidadNivelClub(nivelEquipo, nivelLiga);
    const calidadForma = GameConfig.FORMA_CALIDAD[forma] ?? 0.5;
    const calidadEquipoAcumulado = GameConfig.clamp(
      0.5 + equipoAcumuladoTemporada / (2 * GameConfig.FUERZA_EQUIPO_ACUMULADO_REFERENCIA), 0, 1
    );
    const fuerza = GameConfig.FUERZA_PESO_NIVEL * calidadClub
      + GameConfig.FUERZA_PESO_FORMA * calidadForma
      + GameConfig.FUERZA_PESO_EQUIPO_ACUMULADO * calidadEquipoAcumulado;
    return GameConfig.clamp(fuerza, 0, 1);
  },

  // Título de liga: curva empinada, casi exclusiva de los clubes top.
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
  // PARTICIPACIÓN DEL JUGADOR
  // Los partidos calculados arriba son los del CLUB — cuántos de esos
  // juegas tú depende de tu OVR relativo, cómo vienen tus decisiones
  // (rendimientoAcumulado), tu forma (una lesión, por ejemplo, te deja
  // afuera de bastantes partidos aunque el equipo los juegue igual) y de
  // si sos titular ese tramo (ver calcularTitular): antes ese dato era
  // solo decorativo (se mostraba el badge, pero no cambiaba en nada
  // cuántos minutos te tocaban) — ahora si el club te para de arranque
  // efectivamente jugás más.
  // ============================================================
  FORMA_BONUS_PARTICIPACION: {
    inspirado: 0.15, plenitud: 0.12, animado: 0.06, regular: 0,
    desanimado: -0.08, bajo: -0.15, lesionado: -0.35,
  },
  PARTICIPACION_OVR_REFERENCIA: 55,
  PARTICIPACION_MIN: 0.15,
  // Base subida de 0.5 a 0.65: un jugador ya asentado en el plantel
  // (OVR/forma/rendimiento neutros) debería jugar bastante de entrada,
  // no la mitad de los partidos por defecto — así bajar de ahí (mala
  // forma, lesión, ser suplente) se siente como el verdadero castigo.
  PARTICIPACION_BASE: 0.65,
  PARTICIPACION_BONUS_TITULAR: 0.2,

  probabilidadJugar(ovr, rendimientoAcumulado, forma, esTitular) {
    const bonusForma = GameConfig.FORMA_BONUS_PARTICIPACION[forma] ?? 0;
    const bonusTitular = esTitular ? GameConfig.PARTICIPACION_BONUS_TITULAR : 0;
    const prob = GameConfig.PARTICIPACION_BASE + (ovr - GameConfig.PARTICIPACION_OVR_REFERENCIA) * 0.01
      + rendimientoAcumulado * 0.03 + bonusForma + bonusTitular;
    return GameConfig.clamp(prob, GameConfig.PARTICIPACION_MIN, 1);
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

  // Pesos del sorteo de nivel (deben sumar 1): grave es raro a propósito.
  PESO_LESION_NIVEL1: 0.10,
  PESO_LESION_NIVEL2: 0.35,
  PESO_LESION_NIVEL3: 0.55,

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
