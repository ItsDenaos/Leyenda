// ============================================================
// GameDatabase — Base de datos real de ligas y equipos.
//
// Temporada de referencia: 2026 (Europa 2026-27; América/Sudamérica
// año calendario 2026, en curso a septiembre de 2026).
//
// Cargar después de config.js.
//
// ---------------- FORMATO ----------------
// Tanto ligas como equipos se clasifican con 3 ejes de 0 (peor) a 100
// (mejor), ocultos al jugador — ver GameConfig.poderLiga/poderEquipo/
// calidadFuerzaClub/valorScoreEquipo (config.js) para cómo se combinan:
//   - fuerza: nivel deportivo actual del plantel/competencia — decide
//     quién gana títulos (fuerza de campaña).
//   - prestigio: historia, marca, hinchada — pesa aunque hoy no sea su
//     mejor momento.
//   - economia: poder financiero (presupuesto, sueldos, TV) — junto con
//     el prestigio, decide el valor de mercado. La economía de un
//     equipo nunca cae debajo de ECONOMIA_PISO_LIGA de la de su liga.
// Los ~25 clubes más reconocibles del mundo tienen estos 3 valores
// puestos a mano (Real Madrid, Boca Juniors, PSG, etc. — ver el
// comentario junto a cada uno); el resto se generó una vez a partir de
// su antiguo nivel 1-3 y la liga a la que pertenece, con una variación
// estable por club (mismo id → siempre el mismo resultado) para que no
// todos los equipos de un mismo nivel queden con el número idéntico.
//
// ligas: [{ id, nombre, fuerza, prestigio, economia, pais?, paisCode?, paisFlag?, confederacion, escudo? }]
//   - id: string único, kebab-case, sin espacios.
//   - pais (opcional): nombre EXACTO de país tal como aparece en la
//     lista de nacionalidades de script.js (ej. "México", "Inglaterra").
//     Se usa para decidir las ofertas de primer equipo: si el país
//     elegido por el jugador coincide con el de una liga, empieza ahí.
//   - paisCode / paisFlag: código ISO 3166-1 alpha-2 (para pedir la
//     bandera real a flagcdn.com, ver GameConfig.flagHtml) y su emoji de
//     respaldo si la imagen no carga — mismo criterio que COUNTRIES en
//     script.js. Se muestran junto al nombre de la liga en las cards de
//     oferta/fichaje.
//   - confederacion: "UEFA" | "CONMEBOL" | "CONCACAF" | "AFC" (según las
//     ligas cargadas — CAF no tiene liga doméstica propia todavía, solo
//     selecciones). Define a qué competiciones internacionales (ver
//     `competiciones` más abajo) puede clasificar un equipo de esa liga;
//     si la confederación no tiene ese nivel cargado (ej. AFC todavía sin
//     Champions/Europa League propia), simplemente no clasifica a nada.
//   - escudo: nombre de archivo dentro de assets/escudos/ligas/.
//
// equipos: [{ id, nombre, ligaId, fuerza, prestigio, economia, initials, a, b, escudo? }]
//   - id: string único.
//   - ligaId: debe coincidir con un id de `ligas`.
//   - initials: 2-3 letras, se usan como placeholder si no hay escudo.
//   - a / b: colores hex del degradado del placeholder (colores del club).
//   - escudo: nombre de archivo dentro de assets/escudos/equipos/.
//
// competiciones: [{ id, nombre, tipo, categoria, ligaId?, confederacion?,
//                    trofeoImagen, partidosMinimos, partidosExtra }]
//   - tipo: "domestica" | "internacional" | "seleccion".
//   - categoria: "liga" | "copa" (domesticas) — "primerNivel" | "segundoNivel"
//     (internacionales, ej. Champions/Libertadores vs. Europa League/Sudamericana)
//     — "mundial" | "continental" (seleccion, ver GameDatabase.selecciones).
//   - ligaId (solo domesticas): a qué liga/país pertenece esta competición.
//   - confederacion (internacionales y continentales de selección): "UEFA" |
//     "CONMEBOL" | "CONCACAF" | "CAF" | "AFC" — qué confederación la
//     organiza (cruza con `ligas[].confederacion` o `selecciones[].confederacion`
//     según el caso). null en el Mundial, que no tiene confederación.
//   - trofeoImagen: nombre de archivo dentro de assets/escudos/trofeos/.
//     Vacío ("") hasta tener las imágenes reales.
//   - partidosMinimos: partidos que sí o sí se juegan en esa competición
//     (temporada regular de una liga, o la primera ronda ya asegurada
//     de una copa/fase de grupos).
//   - partidosExtra: partidos adicionales que se pueden sumar si se
//     avanza de ronda (0 en las ligas, que no tienen instancias
//     eliminatorias — todo es partidosMinimos).
//   Los números de partidos son una referencia realista basada en el
//   formato vigente de cada competición; en copas y ligas con
//   pretemporada/playoffs que cambian de formato seguido (Argentina,
//   México, Colombia) son aproximados.
// ============================================================

const GameDatabase = {
  ligas: [
    { id: "premier-league", nombre: "Premier League", fuerza: 96, prestigio: 92, economia: 100, pais: "Inglaterra", paisCode: "gb-eng", paisFlag: "🏴", confederacion: "UEFA", escudo: "premier-league.png" },
    { id: "la-liga", nombre: "La Liga", fuerza: 93, prestigio: 97, economia: 88, pais: "España", paisCode: "es", paisFlag: "🇪🇸", confederacion: "UEFA", escudo: "la-liga.png" },
    { id: "serie-a", nombre: "Serie A", fuerza: 88, prestigio: 90, economia: 78, pais: "Italia", paisCode: "it", paisFlag: "🇮🇹", confederacion: "UEFA", escudo: "serie-a.png" },
    { id: "bundesliga", nombre: "Bundesliga", fuerza: 87, prestigio: 82, economia: 82, pais: "Alemania", paisCode: "de", paisFlag: "🇩🇪", confederacion: "UEFA", escudo: "bundesliga.png" },
    { id: "ligue-1", nombre: "Ligue 1", fuerza: 82, prestigio: 75, economia: 75, pais: "Francia", paisCode: "fr", paisFlag: "🇫🇷", confederacion: "UEFA", escudo: "ligue-1.png" },
    { id: "brasileirao", nombre: "Brasileirão Série A", fuerza: 74, prestigio: 80, economia: 45, pais: "Brasil", paisCode: "br", paisFlag: "🇧🇷", confederacion: "CONMEBOL", escudo: "brasileirao.png" },
    { id: "primera-division-argentina", nombre: "Primera División Argentina", fuerza: 68, prestigio: 85, economia: 25, pais: "Argentina", paisCode: "ar", paisFlag: "🇦🇷", confederacion: "CONMEBOL", escudo: "primera-division-argentina.png" },
    { id: "liga-mx", nombre: "Liga MX", fuerza: 66, prestigio: 55, economia: 42, pais: "México", paisCode: "mx", paisFlag: "🇲🇽", confederacion: "CONCACAF", escudo: "liga-mx.png" },
    { id: "mls", nombre: "MLS", fuerza: 58, prestigio: 40, economia: 55, pais: "Estados Unidos", paisCode: "us", paisFlag: "🇺🇸", confederacion: "CONCACAF", escudo: "mls.png" },
    { id: "primera-a-colombia", nombre: "Primera A (Colombia)", fuerza: 55, prestigio: 50, economia: 20, pais: "Colombia", paisCode: "co", paisFlag: "🇨🇴", confederacion: "CONMEBOL", escudo: "primera-a-colombia.png" },

    // ---------------- 16 LIGAS NUEVAS (incorporación masiva) ----------------
    { id: "eredivisie", nombre: "Eredivisie", fuerza: 72, prestigio: 74, economia: 60, pais: "Países Bajos", paisCode: "nl", paisFlag: "🇳🇱", confederacion: "UEFA", escudo: "eredivisie.png" },
    { id: "primeira-liga", nombre: "Primeira Liga", fuerza: 76, prestigio: 80, economia: 58, pais: "Portugal", paisCode: "pt", paisFlag: "🇵🇹", confederacion: "UEFA", escudo: "primeira-liga.png" },
    { id: "pro-league-belgica", nombre: "Pro League", fuerza: 70, prestigio: 62, economia: 55, pais: "Bélgica", paisCode: "be", paisFlag: "🇧🇪", confederacion: "UEFA", escudo: "pro-league-belgica.png" },
    { id: "super-lig-turca", nombre: "Süper Lig", fuerza: 74, prestigio: 72, economia: 65, pais: "Turquía", paisCode: "tr", paisFlag: "🇹🇷", confederacion: "UEFA", escudo: "super-lig-turca.png" },
    { id: "premiership-escocesa", nombre: "Scottish Premiership", fuerza: 60, prestigio: 58, economia: 42, pais: "Escocia", paisCode: "gb-sct", paisFlag: "🏴", confederacion: "UEFA", escudo: "premiership-escocesa.png" },
    { id: "super-liga-griega", nombre: "Super League Greece", fuerza: 58, prestigio: 55, economia: 38, pais: "Grecia", paisCode: "gr", paisFlag: "🇬🇷", confederacion: "UEFA", escudo: "super-liga-griega.png" },
    { id: "liga-premier-rusa", nombre: "Liga Premier Rusa", fuerza: 66, prestigio: 60, economia: 55, pais: "Rusia", paisCode: "ru", paisFlag: "🇷🇺", confederacion: "UEFA", escudo: "liga-premier-rusa.png" },
    { id: "j1-liga", nombre: "J1 League", fuerza: 62, prestigio: 55, economia: 50, pais: "Japón", paisCode: "jp", paisFlag: "🇯🇵", confederacion: "AFC", escudo: "j1-liga.png" },
    { id: "super-liga-china", nombre: "Super League China", fuerza: 55, prestigio: 50, economia: 48, pais: "China", paisCode: "cn", paisFlag: "🇨🇳", confederacion: "AFC", escudo: "super-liga-china.png" },
    { id: "liga1-peru", nombre: "Liga 1", fuerza: 48, prestigio: 45, economia: 18, pais: "Perú", paisCode: "pe", paisFlag: "🇵🇪", confederacion: "CONMEBOL", escudo: "liga1-peru.png" },
    { id: "primera-division-bolivia", nombre: "Primera División", fuerza: 42, prestigio: 38, economia: 15, pais: "Bolivia", paisCode: "bo", paisFlag: "🇧🇴", confederacion: "CONMEBOL", escudo: "primera-division-bolivia.png" },
    { id: "primera-division-chile", nombre: "Primera División", fuerza: 60, prestigio: 62, economia: 30, pais: "Chile", paisCode: "cl", paisFlag: "🇨🇱", confederacion: "CONMEBOL", escudo: "primera-division-chile.png" },
    { id: "primera-division-uruguay", nombre: "Primera División", fuerza: 64, prestigio: 72, economia: 22, pais: "Uruguay", paisCode: "uy", paisFlag: "🇺🇾", confederacion: "CONMEBOL", escudo: "primera-division-uruguay.png" },
    { id: "primera-division-venezuela", nombre: "Primera División", fuerza: 44, prestigio: 35, economia: 16, pais: "Venezuela", paisCode: "ve", paisFlag: "🇻🇪", confederacion: "CONMEBOL", escudo: "primera-division-venezuela.png" },
    { id: "serie-a-ecuador", nombre: "Serie A", fuerza: 56, prestigio: 50, economia: 22, pais: "Ecuador", paisCode: "ec", paisFlag: "🇪🇨", confederacion: "CONMEBOL", escudo: "serie-a-ecuador.png" },
    { id: "primera-division-costa-rica", nombre: "Primera División", fuerza: 52, prestigio: 48, economia: 25, pais: "Costa Rica", paisCode: "cr", paisFlag: "🇨🇷", confederacion: "CONCACAF", escudo: "primera-division-costa-rica.png" },

    // ---------------- 3 LIGAS NUEVAS (Paraguay, El Salvador, Ucrania) ----------------
    { id: "primera-division-paraguay", nombre: "Primera División", fuerza: 50, prestigio: 54, economia: 16, pais: "Paraguay", paisCode: "py", paisFlag: "🇵🇾", confederacion: "CONMEBOL", escudo: "primera-division-paraguay.png" },
    { id: "primera-division-el-salvador", nombre: "Primera División", fuerza: 44, prestigio: 38, economia: 14, pais: "El Salvador", paisCode: "sv", paisFlag: "🇸🇻", confederacion: "CONCACAF", escudo: "primera-division-el-salvador.png" },
    { id: "liga-premier-ucrania", nombre: "Liga Premier de Ucrania", fuerza: 64, prestigio: 62, economia: 30, pais: "Ucrania", paisCode: "ua", paisFlag: "🇺🇦", confederacion: "UEFA", escudo: "liga-premier-ucrania.png" },
  ],


  // selecciones: [{ pais, paisCode, paisFlag, confederacion, fuerza, prestigio }]
  //   - pais: nombre EXACTO tal como aparece en COUNTRIES (script.js) — es
  //     con lo que se cruza player.pais para encontrar tu selección.
  //   - confederacion: "UEFA" | "CONMEBOL" | "CONCACAF" | "CAF" | "AFC" —
  //     organiza tu clasificación a copa continental (cruza con
  //     `competiciones` de tipo "seleccion", ver más abajo). Más amplio que
  //     el de `ligas` porque acá entran los 46 países de COUNTRIES, no solo
  //     los que tienen liga propia cargada.
  //   - fuerza / prestigio: mismos ejes 0-100 que ligas/equipos, a mano
  //     según pedigrí futbolístico real (fuerza = nivel actual, prestigio =
  //     historia/palmarés — ver GameConfig.calidadSeleccion).
  selecciones: [
    // -------- CONMEBOL --------
    { pais: "Argentina", paisCode: "ar", paisFlag: "🇦🇷", confederacion: "CONMEBOL", fuerza: 90, prestigio: 96 },
    { pais: "Brasil", paisCode: "br", paisFlag: "🇧🇷", confederacion: "CONMEBOL", fuerza: 92, prestigio: 98 },
    { pais: "Uruguay", paisCode: "uy", paisFlag: "🇺🇾", confederacion: "CONMEBOL", fuerza: 74, prestigio: 78 },
    { pais: "Chile", paisCode: "cl", paisFlag: "🇨🇱", confederacion: "CONMEBOL", fuerza: 62, prestigio: 58 },
    { pais: "Colombia", paisCode: "co", paisFlag: "🇨🇴", confederacion: "CONMEBOL", fuerza: 70, prestigio: 62 },
    { pais: "Paraguay", paisCode: "py", paisFlag: "🇵🇾", confederacion: "CONMEBOL", fuerza: 48, prestigio: 45 },
    { pais: "Perú", paisCode: "pe", paisFlag: "🇵🇪", confederacion: "CONMEBOL", fuerza: 50, prestigio: 48 },
    { pais: "Bolivia", paisCode: "bo", paisFlag: "🇧🇴", confederacion: "CONMEBOL", fuerza: 35, prestigio: 30 },
    { pais: "Ecuador", paisCode: "ec", paisFlag: "🇪🇨", confederacion: "CONMEBOL", fuerza: 58, prestigio: 42 },
    { pais: "Venezuela", paisCode: "ve", paisFlag: "🇻🇪", confederacion: "CONMEBOL", fuerza: 42, prestigio: 28 },
    // -------- CONCACAF --------
    { pais: "México", paisCode: "mx", paisFlag: "🇲🇽", confederacion: "CONCACAF", fuerza: 68, prestigio: 65 },
    { pais: "Estados Unidos", paisCode: "us", paisFlag: "🇺🇸", confederacion: "CONCACAF", fuerza: 62, prestigio: 45 },
    { pais: "Costa Rica", paisCode: "cr", paisFlag: "🇨🇷", confederacion: "CONCACAF", fuerza: 50, prestigio: 48 },
    { pais: "Panamá", paisCode: "pa", paisFlag: "🇵🇦", confederacion: "CONCACAF", fuerza: 44, prestigio: 32 },
    { pais: "Jamaica", paisCode: "jm", paisFlag: "🇯🇲", confederacion: "CONCACAF", fuerza: 38, prestigio: 28 },
    { pais: "Canadá", paisCode: "ca", paisFlag: "🇨🇦", confederacion: "CONCACAF", fuerza: 54, prestigio: 35 },
    // -------- UEFA --------
    { pais: "España", paisCode: "es", paisFlag: "🇪🇸", confederacion: "UEFA", fuerza: 88, prestigio: 90 },
    { pais: "Portugal", paisCode: "pt", paisFlag: "🇵🇹", confederacion: "UEFA", fuerza: 84, prestigio: 75 },
    { pais: "Francia", paisCode: "fr", paisFlag: "🇫🇷", confederacion: "UEFA", fuerza: 94, prestigio: 92 },
    { pais: "Inglaterra", paisCode: "gb-eng", paisFlag: "🏴", confederacion: "UEFA", fuerza: 86, prestigio: 78 },
    { pais: "Italia", paisCode: "it", paisFlag: "🇮🇹", confederacion: "UEFA", fuerza: 80, prestigio: 88 },
    { pais: "Alemania", paisCode: "de", paisFlag: "🇩🇪", confederacion: "UEFA", fuerza: 85, prestigio: 92 },
    { pais: "Bélgica", paisCode: "be", paisFlag: "🇧🇪", confederacion: "UEFA", fuerza: 78, prestigio: 62 },
    { pais: "Países Bajos", paisCode: "nl", paisFlag: "🇳🇱", confederacion: "UEFA", fuerza: 82, prestigio: 80 },
    { pais: "Croacia", paisCode: "hr", paisFlag: "🇭🇷", confederacion: "UEFA", fuerza: 76, prestigio: 60 },
    { pais: "Polonia", paisCode: "pl", paisFlag: "🇵🇱", confederacion: "UEFA", fuerza: 60, prestigio: 45 },
    { pais: "Suiza", paisCode: "ch", paisFlag: "🇨🇭", confederacion: "UEFA", fuerza: 64, prestigio: 48 },
    { pais: "Serbia", paisCode: "rs", paisFlag: "🇷🇸", confederacion: "UEFA", fuerza: 62, prestigio: 46 },
    { pais: "Dinamarca", paisCode: "dk", paisFlag: "🇩🇰", confederacion: "UEFA", fuerza: 68, prestigio: 55 },
    { pais: "Suecia", paisCode: "se", paisFlag: "🇸🇪", confederacion: "UEFA", fuerza: 58, prestigio: 50 },
    { pais: "Noruega", paisCode: "no", paisFlag: "🇳🇴", confederacion: "UEFA", fuerza: 56, prestigio: 38 },
    { pais: "Gales", paisCode: "gb-wls", paisFlag: "🏴", confederacion: "UEFA", fuerza: 50, prestigio: 35 },
    { pais: "Escocia", paisCode: "gb-sct", paisFlag: "🏴", confederacion: "UEFA", fuerza: 48, prestigio: 38 },
    // -------- CAF --------
    { pais: "Marruecos", paisCode: "ma", paisFlag: "🇲🇦", confederacion: "CAF", fuerza: 72, prestigio: 55 },
    { pais: "Senegal", paisCode: "sn", paisFlag: "🇸🇳", confederacion: "CAF", fuerza: 68, prestigio: 48 },
    { pais: "Nigeria", paisCode: "ng", paisFlag: "🇳🇬", confederacion: "CAF", fuerza: 62, prestigio: 45 },
    { pais: "Ghana", paisCode: "gh", paisFlag: "🇬🇭", confederacion: "CAF", fuerza: 56, prestigio: 42 },
    { pais: "Camerún", paisCode: "cm", paisFlag: "🇨🇲", confederacion: "CAF", fuerza: 54, prestigio: 48 },
    { pais: "Argelia", paisCode: "dz", paisFlag: "🇩🇿", confederacion: "CAF", fuerza: 52, prestigio: 40 },
    { pais: "Egipto", paisCode: "eg", paisFlag: "🇪🇬", confederacion: "CAF", fuerza: 50, prestigio: 40 },
    // -------- AFC --------
    { pais: "Japón", paisCode: "jp", paisFlag: "🇯🇵", confederacion: "AFC", fuerza: 64, prestigio: 42 },
    { pais: "Corea del Sur", paisCode: "kr", paisFlag: "🇰🇷", confederacion: "AFC", fuerza: 60, prestigio: 40 },
    { pais: "Arabia Saudita", paisCode: "sa", paisFlag: "🇸🇦", confederacion: "AFC", fuerza: 48, prestigio: 32 },
    { pais: "Catar", paisCode: "qa", paisFlag: "🇶🇦", confederacion: "AFC", fuerza: 38, prestigio: 25 },
    { pais: "Irán", paisCode: "ir", paisFlag: "🇮🇷", confederacion: "AFC", fuerza: 46, prestigio: 32 },
    { pais: "Australia", paisCode: "au", paisFlag: "🇦🇺", confederacion: "AFC", fuerza: 50, prestigio: 30 },
  ],

  equipos: [
    // ---------------- PREMIER LEAGUE (Inglaterra) ----------------
    { id: "arsenal", nombre: "Arsenal", ligaId: "premier-league", fuerza: 88, prestigio: 85, economia: 85, initials: "ARS", a: "#EF0107", b: "#063672", escudo: "arsenal.png" },
    { id: "aston-villa", nombre: "Aston Villa", ligaId: "premier-league", fuerza: 89, prestigio: 67, economia: 70, initials: "AVL", a: "#670E36", b: "#95BFE5", escudo: "aston-villa.png" },
    { id: "bournemouth", nombre: "Bournemouth", ligaId: "premier-league", fuerza: 88, prestigio: 79, economia: 79, initials: "BOU", a: "#DA291C", b: "#000000", escudo: "bournemouth.png" },
    { id: "brentford", nombre: "Brentford", ligaId: "premier-league", fuerza: 87, prestigio: 81, economia: 62, initials: "BRE", a: "#E30613", b: "#000000", escudo: "brentford.png" },
    { id: "brighton-hove-albion", nombre: "Brighton", ligaId: "premier-league", fuerza: 87, prestigio: 69, economia: 58, initials: "BHA", a: "#0057B8", b: "#FFFFFF", escudo: "brighton-hove-albion.png" },
    { id: "chelsea", nombre: "Chelsea", ligaId: "premier-league", fuerza: 80, prestigio: 78, economia: 90, initials: "CHE", a: "#034694", b: "#FFFFFF", escudo: "chelsea.png" },
    { id: "coventry-city", nombre: "Coventry City", ligaId: "premier-league", fuerza: 78, prestigio: 57, economia: 36, initials: "COV", a: "#78D0F2", b: "#000000", escudo: "coventry-city.png" },
    { id: "crystal-palace", nombre: "Crystal Palace", ligaId: "premier-league", fuerza: 84, prestigio: 83, economia: 66, initials: "CRY", a: "#1B458F", b: "#C4122E", escudo: "crystal-palace.png" },
    { id: "everton", nombre: "Everton", ligaId: "premier-league", fuerza: 83, prestigio: 73, economia: 78, initials: "EVE", a: "#003399", b: "#FFFFFF", escudo: "everton.png" },
    { id: "fulham", nombre: "Fulham", ligaId: "premier-league", fuerza: 83, prestigio: 76, economia: 62, initials: "FUL", a: "#000000", b: "#FFFFFF", escudo: "fulham.png" },
    { id: "hull-city", nombre: "Hull City", ligaId: "premier-league", fuerza: 70, prestigio: 65, economia: 50, initials: "HUL", a: "#F18A01", b: "#000000", escudo: "hull-city.png" },
    { id: "ipswich-town", nombre: "Ipswich Town", ligaId: "premier-league", fuerza: 67, prestigio: 55, economia: 37, initials: "IPS", a: "#0044A9", b: "#FFFFFF", escudo: "ipswich-town.png" },
    { id: "leeds-united", nombre: "Leeds United", ligaId: "premier-league", fuerza: 77, prestigio: 67, economia: 29, initials: "LEE", a: "#FFFFFF", b: "#1D428A", escudo: "leeds-united.png" },
    { id: "liverpool", nombre: "Liverpool", ligaId: "premier-league", fuerza: 90, prestigio: 93, economia: 88, initials: "LIV", a: "#C8102E", b: "#F6EB61", escudo: "liverpool.png" },
    { id: "manchester-city", nombre: "Manchester City", ligaId: "premier-league", fuerza: 95, prestigio: 75, economia: 100, initials: "MCI", a: "#6CABDD", b: "#1C2C5B", escudo: "manchester-city.png" },
    { id: "manchester-united", nombre: "Manchester United", ligaId: "premier-league", fuerza: 78, prestigio: 95, economia: 92, initials: "MUN", a: "#DA291C", b: "#FBE122", escudo: "manchester-united.png" },
    { id: "newcastle-united", nombre: "Newcastle United", ligaId: "premier-league", fuerza: 68, prestigio: 60, economia: 92, initials: "NEW", a: "#241F20", b: "#FFFFFF", escudo: "newcastle-united.png" },
    { id: "nottingham-forest", nombre: "Nottingham Forest", ligaId: "premier-league", fuerza: 90, prestigio: 72, economia: 65, initials: "NFO", a: "#DD0000", b: "#FFFFFF", escudo: "nottingham-forest.png" },
    { id: "sunderland", nombre: "Sunderland", ligaId: "premier-league", fuerza: 75, prestigio: 59, economia: 55, initials: "SUN", a: "#EB172B", b: "#FFFFFF", escudo: "sunderland.png" },
    { id: "tottenham-hotspur", nombre: "Tottenham", ligaId: "premier-league", fuerza: 76, prestigio: 70, economia: 80, initials: "TOT", a: "#132257", b: "#FFFFFF", escudo: "tottenham-hotspur.png" },

    // ---------------- LA LIGA (España) ----------------
    { id: "alaves", nombre: "Deportivo Alavés", ligaId: "la-liga", fuerza: 63, prestigio: 78, economia: 42, initials: "ALA", a: "#1F4C9C", b: "#FFFFFF", escudo: "alaves.png" },
    { id: "athletic-bilbao", nombre: "Athletic Bilbao", ligaId: "la-liga", fuerza: 88, prestigio: 73, economia: 51, initials: "ATH", a: "#EE2523", b: "#FFFFFF", escudo: "athletic-bilbao.png" },
    { id: "atletico-madrid", nombre: "Atlético de Madrid", ligaId: "la-liga", fuerza: 85, prestigio: 78, economia: 78, initials: "ATM", a: "#CB3524", b: "#272E61", escudo: "atletico-madrid.png" },
    { id: "barcelona", nombre: "Barcelona", ligaId: "la-liga", fuerza: 90, prestigio: 97, economia: 85, initials: "BAR", a: "#A50044", b: "#004D98", escudo: "barcelona.png" },
    { id: "real-betis", nombre: "Real Betis", ligaId: "la-liga", fuerza: 80, prestigio: 75, economia: 63, initials: "BET", a: "#00954C", b: "#FFFFFF", escudo: "real-betis.png" },
    { id: "celta-vigo", nombre: "Celta de Vigo", ligaId: "la-liga", fuerza: 75, prestigio: 75, economia: 49, initials: "CEL", a: "#8AC3EE", b: "#FFFFFF", escudo: "celta-vigo.png" },
    { id: "deportivo-la-coruna", nombre: "Deportivo de La Coruña", ligaId: "la-liga", fuerza: 76, prestigio: 74, economia: 31, initials: "DEP", a: "#0066B3", b: "#FFFFFF", escudo: "deportivo-la-coruna.png" },
    { id: "elche", nombre: "Elche", ligaId: "la-liga", fuerza: 75, prestigio: 78, economia: 38, initials: "ELX", a: "#00944D", b: "#FFFFFF", escudo: "elche.png" },
    { id: "espanyol", nombre: "Espanyol", ligaId: "la-liga", fuerza: 76, prestigio: 82, economia: 70, initials: "ESP", a: "#0A5EB0", b: "#FFFFFF", escudo: "espanyol.png" },
    { id: "getafe", nombre: "Getafe", ligaId: "la-liga", fuerza: 81, prestigio: 86, economia: 74, initials: "GET", a: "#005CA9", b: "#FFFFFF", escudo: "getafe.png" },
    { id: "levante", nombre: "Levante", ligaId: "la-liga", fuerza: 74, prestigio: 76, economia: 29, initials: "LEV", a: "#8B1D41", b: "#003DA5", escudo: "levante.png" },
    { id: "malaga", nombre: "Málaga", ligaId: "la-liga", fuerza: 64, prestigio: 67, economia: 45, initials: "MAL", a: "#0066CC", b: "#FFFFFF", escudo: "malaga.png" },
    { id: "osasuna", nombre: "Osasuna", ligaId: "la-liga", fuerza: 88, prestigio: 83, economia: 74, initials: "OSA", a: "#D91A21", b: "#001A4B", escudo: "osasuna.png" },
    { id: "racing-santander", nombre: "Racing de Santander", ligaId: "la-liga", fuerza: 68, prestigio: 76, economia: 25, initials: "RAC", a: "#008542", b: "#FFFFFF", escudo: "racing-santander.png" },
    { id: "rayo-vallecano", nombre: "Rayo Vallecano", ligaId: "la-liga", fuerza: 78, prestigio: 84, economia: 74, initials: "RAY", a: "#E30613", b: "#FFFFFF", escudo: "rayo-vallecano.png" },
    { id: "real-madrid", nombre: "Real Madrid", ligaId: "la-liga", fuerza: 96, prestigio: 100, economia: 97, initials: "RMA", a: "#FFFFFF", b: "#FEBE10", escudo: "real-madrid.png" },
    { id: "real-sociedad", nombre: "Real Sociedad", ligaId: "la-liga", fuerza: 81, prestigio: 82, economia: 58, initials: "RSO", a: "#0033A0", b: "#FFFFFF", escudo: "real-sociedad.png" },
    { id: "sevilla", nombre: "Sevilla", ligaId: "la-liga", fuerza: 82, prestigio: 84, economia: 58, initials: "SEV", a: "#D40000", b: "#FFFFFF", escudo: "sevilla.png" },
    { id: "valencia", nombre: "Valencia", ligaId: "la-liga", fuerza: 84, prestigio: 85, economia: 69, initials: "VAL", a: "#EE3524", b: "#000000", escudo: "valencia.png" },
    { id: "villarreal", nombre: "Villarreal", ligaId: "la-liga", fuerza: 85, prestigio: 74, economia: 75, initials: "VIL", a: "#FFE667", b: "#005187", escudo: "villarreal.png" },

    // ---------------- SERIE A (Italia) ----------------
    { id: "atalanta-bc", nombre: "Atalanta", ligaId: "serie-a", fuerza: 78, prestigio: 81, economia: 46, initials: "ATA", a: "#1E71B8", b: "#000000", escudo: "atalanta-bc.png" },
    { id: "bologna", nombre: "Bologna", ligaId: "serie-a", fuerza: 75, prestigio: 71, economia: 59, initials: "BOL", a: "#C8102E", b: "#0033A0", escudo: "bologna.png" },
    { id: "cagliari", nombre: "Cagliari", ligaId: "serie-a", fuerza: 58, prestigio: 69, economia: 28, initials: "CAG", a: "#8B1E3F", b: "#002B5C", escudo: "cagliari.png" },
    { id: "como-1907", nombre: "Como", ligaId: "serie-a", fuerza: 64, prestigio: 64, economia: 31, initials: "COM", a: "#003DA5", b: "#FFFFFF", escudo: "como-1907.png" },
    { id: "fiorentina", nombre: "Fiorentina", ligaId: "serie-a", fuerza: 79, prestigio: 72, economia: 50, initials: "FIO", a: "#5B2A86", b: "#FFFFFF", escudo: "fiorentina.png" },
    { id: "frosinone", nombre: "Frosinone", ligaId: "serie-a", fuerza: 57, prestigio: 57, economia: 25, initials: "FRO", a: "#FFD400", b: "#004B93", escudo: "frosinone.png" },
    { id: "genoa", nombre: "Genoa", ligaId: "serie-a", fuerza: 69, prestigio: 64, economia: 29, initials: "GEN", a: "#B01C2E", b: "#002855", escudo: "genoa.png" },
    { id: "inter-milan", nombre: "Inter", ligaId: "serie-a", fuerza: 86, prestigio: 85, economia: 78, initials: "INT", a: "#010E80", b: "#000000", escudo: "inter-milan.png" },
    { id: "juventus", nombre: "Juventus", ligaId: "serie-a", fuerza: 84, prestigio: 92, economia: 80, initials: "JUV", a: "#000000", b: "#FFFFFF", escudo: "juventus.png" },
    { id: "lazio", nombre: "Lazio", ligaId: "serie-a", fuerza: 74, prestigio: 82, economia: 51, initials: "LAZ", a: "#6CACE4", b: "#FFFFFF", escudo: "lazio.png" },
    { id: "lecce", nombre: "Lecce", ligaId: "serie-a", fuerza: 58, prestigio: 54, economia: 28, initials: "LEC", a: "#FFD400", b: "#C8102E", escudo: "lecce.png" },
    { id: "ac-milan", nombre: "AC Milan", ligaId: "serie-a", fuerza: 80, prestigio: 90, economia: 75, initials: "MIL", a: "#FB090B", b: "#000000", escudo: "ac-milan.png" },
    { id: "monza", nombre: "Monza", ligaId: "serie-a", fuerza: 58, prestigio: 70, economia: 30, initials: "MON", a: "#E4032E", b: "#FFFFFF", escudo: "monza.png" },
    { id: "napoli", nombre: "Napoli", ligaId: "serie-a", fuerza: 82, prestigio: 72, economia: 65, initials: "NAP", a: "#0F82C4", b: "#FFFFFF", escudo: "napoli.png" },
    { id: "parma", nombre: "Parma", ligaId: "serie-a", fuerza: 62, prestigio: 70, economia: 33, initials: "PAR", a: "#FFD400", b: "#002B5C", escudo: "parma.png" },
    { id: "as-roma", nombre: "AS Roma", ligaId: "serie-a", fuerza: 89, prestigio: 92, economia: 72, initials: "ROM", a: "#8E1F2F", b: "#F0BC42", escudo: "as-roma.png" },
    { id: "sassuolo", nombre: "Sassuolo", ligaId: "serie-a", fuerza: 63, prestigio: 55, economia: 34, initials: "SAS", a: "#000000", b: "#00A650", escudo: "sassuolo.png" },
    { id: "torino", nombre: "Torino", ligaId: "serie-a", fuerza: 84, prestigio: 75, economia: 65, initials: "TOR", a: "#7B1730", b: "#FFFFFF", escudo: "torino.png" },
    { id: "udinese", nombre: "Udinese", ligaId: "serie-a", fuerza: 69, prestigio: 58, economia: 35, initials: "UDI", a: "#000000", b: "#FFFFFF", escudo: "udinese.png" },
    { id: "venezia", nombre: "Venezia", ligaId: "serie-a", fuerza: 59, prestigio: 57, economia: 41, initials: "VEN", a: "#FF6600", b: "#000000", escudo: "venezia.png" },

    // ---------------- BUNDESLIGA (Alemania) ----------------
    { id: "fc-augsburg", nombre: "Augsburg", ligaId: "bundesliga", fuerza: 65, prestigio: 47, economia: 23, initials: "FCA", a: "#CE1126", b: "#00854A", escudo: "fc-augsburg.png" },
    { id: "bayer-leverkusen", nombre: "Bayer Leverkusen", ligaId: "bundesliga", fuerza: 88, prestigio: 76, economia: 96, initials: "B04", a: "#E32219", b: "#000000", escudo: "bayer-leverkusen.png" },
    { id: "bayern-munich", nombre: "Bayern München", ligaId: "bundesliga", fuerza: 93, prestigio: 90, economia: 92, initials: "FCB", a: "#DC052D", b: "#FFFFFF", escudo: "bayern-munich.png" },
    { id: "monchengladbach", nombre: "Borussia Mönchengladbach", ligaId: "bundesliga", fuerza: 78, prestigio: 64, economia: 65, initials: "BMG", a: "#000000", b: "#00753E", escudo: "monchengladbach.png" },
    { id: "borussia-dortmund", nombre: "Borussia Dortmund", ligaId: "bundesliga", fuerza: 82, prestigio: 80, economia: 78, initials: "BVB", a: "#FDE100", b: "#000000", escudo: "borussia-dortmund.png" },
    { id: "eintracht-frankfurt", nombre: "Eintracht Frankfurt", ligaId: "bundesliga", fuerza: 76, prestigio: 60, economia: 47, initials: "SGE", a: "#E1000F", b: "#000000", escudo: "eintracht-frankfurt.png" },
    { id: "sv-elversberg", nombre: "Elversberg", ligaId: "bundesliga", fuerza: 57, prestigio: 63, economia: 36, initials: "ELV", a: "#000000", b: "#FFFFFF", escudo: "sv-elversberg.png" },
    { id: "sc-freiburg", nombre: "Freiburg", ligaId: "bundesliga", fuerza: 77, prestigio: 64, economia: 51, initials: "SCF", a: "#000000", b: "#EB1923", escudo: "sc-freiburg.png" },
    { id: "hamburger-sv", nombre: "Hamburger SV", ligaId: "bundesliga", fuerza: 75, prestigio: 65, economia: 54, initials: "HSV", a: "#0F1E38", b: "#FFFFFF", escudo: "hamburger-sv.png" },
    { id: "tsg-hoffenheim", nombre: "Hoffenheim", ligaId: "bundesliga", fuerza: 70, prestigio: 69, economia: 49, initials: "TSG", a: "#1961B5", b: "#FFFFFF", escudo: "tsg-hoffenheim.png" },
    { id: "fc-koln", nombre: "1. FC Köln", ligaId: "bundesliga", fuerza: 73, prestigio: 63, economia: 49, initials: "KOE", a: "#ED1C24", b: "#FFFFFF", escudo: "fc-koln.png" },
    { id: "rb-leipzig", nombre: "RB Leipzig", ligaId: "bundesliga", fuerza: 80, prestigio: 45, economia: 85, initials: "RBL", a: "#DD0741", b: "#FFFFFF", escudo: "rb-leipzig.png" },
    { id: "mainz-05", nombre: "Mainz 05", ligaId: "bundesliga", fuerza: 76, prestigio: 63, economia: 51, initials: "M05", a: "#C3141E", b: "#FFFFFF", escudo: "mainz-05.png" },
    { id: "sc-paderborn-07", nombre: "Paderborn", ligaId: "bundesliga", fuerza: 66, prestigio: 62, economia: 40, initials: "SCP", a: "#003399", b: "#000000", escudo: "sc-paderborn-07.png" },
    { id: "schalke-04", nombre: "Schalke 04", ligaId: "bundesliga", fuerza: 73, prestigio: 67, economia: 69, initials: "S04", a: "#004D9F", b: "#FFFFFF", escudo: "schalke-04.png" },
    { id: "vfb-stuttgart", nombre: "VfB Stuttgart", ligaId: "bundesliga", fuerza: 81, prestigio: 71, economia: 64, initials: "VFB", a: "#E32219", b: "#FFFFFF", escudo: "vfb-stuttgart.png" },
    { id: "union-berlin", nombre: "Union Berlin", ligaId: "bundesliga", fuerza: 71, prestigio: 74, economia: 50, initials: "UNI", a: "#EB1923", b: "#FFFFFF", escudo: "union-berlin.png" },
    { id: "werder-bremen", nombre: "Werder Bremen", ligaId: "bundesliga", fuerza: 76, prestigio: 68, economia: 50, initials: "SVW", a: "#1D9053", b: "#FFFFFF", escudo: "werder-bremen.png" },

    // ---------------- LIGUE 1 (Francia) ----------------
    { id: "angers-sco", nombre: "Angers", ligaId: "ligue-1", fuerza: 51, prestigio: 44, economia: 24, initials: "ANG", a: "#000000", b: "#FFFFFF", escudo: "angers-sco.png" },
    { id: "aj-auxerre", nombre: "Auxerre", ligaId: "ligue-1", fuerza: 63, prestigio: 54, economia: 22, initials: "AJA", a: "#003DA5", b: "#FFFFFF", escudo: "aj-auxerre.png" },
    { id: "stade-brestois", nombre: "Brest", ligaId: "ligue-1", fuerza: 72, prestigio: 62, economia: 57, initials: "SB29", a: "#E2001A", b: "#FFFFFF", escudo: "stade-brestois.png" },
    { id: "le-havre-ac", nombre: "Le Havre", ligaId: "ligue-1", fuerza: 54, prestigio: 55, economia: 19, initials: "HAC", a: "#4FC3F7", b: "#0B2265", escudo: "le-havre-ac.png" },
    { id: "le-mans-fc", nombre: "Le Mans", ligaId: "ligue-1", fuerza: 51, prestigio: 57, economia: 40, initials: "LM", a: "#FFD100", b: "#E10600", escudo: "le-mans-fc.png" },
    { id: "rc-lens", nombre: "Lens", ligaId: "ligue-1", fuerza: 65, prestigio: 61, economia: 48, initials: "RCL", a: "#C8102E", b: "#FFD100", escudo: "rc-lens.png" },
    { id: "losc-lille", nombre: "Lille", ligaId: "ligue-1", fuerza: 74, prestigio: 55, economia: 60, initials: "LIL", a: "#E2001A", b: "#002F6C", escudo: "losc-lille.png" },
    { id: "fc-lorient", nombre: "Lorient", ligaId: "ligue-1", fuerza: 64, prestigio: 54, economia: 28, initials: "FCL", a: "#FF7F00", b: "#000000", escudo: "fc-lorient.png" },
    { id: "olympique-lyonnais", nombre: "Lyon", ligaId: "ligue-1", fuerza: 85, prestigio: 70, economia: 69, initials: "OL", a: "#003087", b: "#E2001A", escudo: "olympique-lyonnais.png" },
    { id: "olympique-marseille", nombre: "Marseille", ligaId: "ligue-1", fuerza: 72, prestigio: 82, economia: 60, initials: "OM", a: "#2FAEE0", b: "#FFFFFF", escudo: "olympique-marseille.png" },
    { id: "as-monaco", nombre: "AS Monaco", ligaId: "ligue-1", fuerza: 89, prestigio: 77, economia: 82, initials: "ASM", a: "#E2001A", b: "#FFFFFF", escudo: "as-monaco.png" },
    { id: "ogc-nice", nombre: "Nice", ligaId: "ligue-1", fuerza: 68, prestigio: 57, economia: 59, initials: "OGCN", a: "#E2001A", b: "#000000", escudo: "ogc-nice.png" },
    { id: "paris-fc", nombre: "Paris FC", ligaId: "ligue-1", fuerza: 61, prestigio: 37, economia: 35, initials: "PFC", a: "#003DA5", b: "#E2001A", escudo: "paris-fc.png" },
    { id: "psg", nombre: "Paris Saint-Germain", ligaId: "ligue-1", fuerza: 90, prestigio: 70, economia: 99, initials: "PSG", a: "#001E62", b: "#DA291C", escudo: "psg.png" },
    { id: "stade-rennais", nombre: "Rennes", ligaId: "ligue-1", fuerza: 69, prestigio: 56, economia: 45, initials: "SRFC", a: "#E2001A", b: "#000000", escudo: "stade-rennais.png" },
    { id: "rc-strasbourg", nombre: "Strasbourg", ligaId: "ligue-1", fuerza: 74, prestigio: 63, economia: 57, initials: "RCSA", a: "#0057B7", b: "#FFFFFF", escudo: "rc-strasbourg.png" },
    { id: "toulouse-fc", nombre: "Toulouse", ligaId: "ligue-1", fuerza: 61, prestigio: 43, economia: 32, initials: "TFC", a: "#5F259F", b: "#FFFFFF", escudo: "toulouse-fc.png" },
    { id: "es-troyes-ac", nombre: "Troyes", ligaId: "ligue-1", fuerza: 51, prestigio: 41, economia: 40, initials: "ESTAC", a: "#002B7F", b: "#FFFFFF", escudo: "es-troyes-ac.png" },

    // ---------------- BRASILEIRÃO SÉRIE A (Brasil) ----------------
    { id: "atletico-mineiro", nombre: "Atlético Mineiro", ligaId: "brasileirao", fuerza: 56, prestigio: 57, economia: 35, initials: "CAM", a: "#000000", b: "#FFFFFF", escudo: "atletico-mineiro.png" },
    { id: "bahia", nombre: "Bahia", ligaId: "brasileirao", fuerza: 57, prestigio: 65, economia: 33, initials: "BAH", a: "#1C3F94", b: "#DA291C", escudo: "bahia.png" },
    { id: "botafogo", nombre: "Botafogo", ligaId: "brasileirao", fuerza: 64, prestigio: 66, economia: 27, initials: "BOT", a: "#000000", b: "#FFFFFF", escudo: "botafogo.png" },
    { id: "corinthians", nombre: "Corinthians", ligaId: "brasileirao", fuerza: 72, prestigio: 85, economia: 45, initials: "COR", a: "#000000", b: "#FFFFFF", escudo: "corinthians.png" },
    { id: "cruzeiro", nombre: "Cruzeiro", ligaId: "brasileirao", fuerza: 61, prestigio: 70, economia: 36, initials: "CRU", a: "#003DA5", b: "#FFFFFF", escudo: "cruzeiro.png" },
    { id: "flamengo", nombre: "Flamengo", ligaId: "brasileirao", fuerza: 82, prestigio: 88, economia: 55, initials: "FLA", a: "#E31E24", b: "#000000", escudo: "flamengo.png" },
    { id: "fluminense", nombre: "Fluminense", ligaId: "brasileirao", fuerza: 60, prestigio: 60, economia: 30, initials: "FLU", a: "#7C1C3C", b: "#006747", escudo: "fluminense.png" },
    { id: "gremio", nombre: "Grêmio", ligaId: "brasileirao", fuerza: 77, prestigio: 77, economia: 43, initials: "GRE", a: "#0D3B66", b: "#000000", escudo: "gremio.png" },
    { id: "internacional", nombre: "Internacional", ligaId: "brasileirao", fuerza: 76, prestigio: 78, economia: 58, initials: "INT", a: "#D2001C", b: "#FFFFFF", escudo: "internacional.png" },
    { id: "mirassol", nombre: "Mirassol", ligaId: "brasileirao", fuerza: 57, prestigio: 58, economia: 34, initials: "MIR", a: "#1C8A42", b: "#FFD100", escudo: "mirassol.png" },
    { id: "palmeiras", nombre: "Palmeiras", ligaId: "brasileirao", fuerza: 80, prestigio: 87, economia: 50, initials: "PAL", a: "#006437", b: "#FFFFFF", escudo: "palmeiras.png" },
    { id: "rb-bragantino", nombre: "Red Bull Bragantino", ligaId: "brasileirao", fuerza: 57, prestigio: 58, economia: 29, initials: "RBB", a: "#E4002B", b: "#FFFFFF", escudo: "rb-bragantino.png" },
    { id: "santos", nombre: "Santos", ligaId: "brasileirao", fuerza: 56, prestigio: 69, economia: 28, initials: "SAN", a: "#000000", b: "#FFFFFF", escudo: "santos.png" },
    { id: "sao-paulo", nombre: "São Paulo", ligaId: "brasileirao", fuerza: 80, prestigio: 78, economia: 57, initials: "SAO", a: "#E4002B", b: "#000000", escudo: "sao-paulo.png" },
    { id: "vasco-da-gama", nombre: "Vasco da Gama", ligaId: "brasileirao", fuerza: 57, prestigio: 71, economia: 32, initials: "VAS", a: "#000000", b: "#FFFFFF", escudo: "vasco-da-gama.png" },
    { id: "vitoria", nombre: "Vitória", ligaId: "brasileirao", fuerza: 60, prestigio: 59, economia: 34, initials: "VIT", a: "#C8102E", b: "#000000", escudo: "vitoria.png" },
    { id: "coritiba", nombre: "Coritiba", ligaId: "brasileirao", fuerza: 58, prestigio: 71, economia: 31, initials: "CTB", a: "#006437", b: "#FFFFFF", escudo: "coritiba.png" },
    { id: "athletico-paranaense", nombre: "Athletico Paranaense", ligaId: "brasileirao", fuerza: 65, prestigio: 63, economia: 32, initials: "CAP", a: "#C8102E", b: "#000000", escudo: "athletico-paranaense.png" },
    { id: "chapecoense", nombre: "Chapecoense", ligaId: "brasileirao", fuerza: 56, prestigio: 59, economia: 15, initials: "CHA", a: "#006437", b: "#FFFFFF", escudo: "chapecoense.png" },
    { id: "remo", nombre: "Remo", ligaId: "brasileirao", fuerza: 45, prestigio: 55, economia: 19, initials: "REM", a: "#0C2340", b: "#FFFFFF", escudo: "remo.png" },

    // ---------------- PRIMERA DIVISIÓN ARGENTINA ----------------
    { id: "aldosivi", nombre: "Aldosivi", ligaId: "primera-division-argentina", fuerza: 39, prestigio: 59, economia: 13, initials: "ALD", a: "#1C8A42", b: "#FFD100", escudo: "aldosivi.png" },
    { id: "argentinos-juniors", nombre: "Argentinos Juniors", ligaId: "primera-division-argentina", fuerza: 55, prestigio: 62, economia: 14, initials: "ARG", a: "#E4002B", b: "#FFFFFF", escudo: "argentinos-juniors.png" },
    { id: "atletico-tucuman", nombre: "Atlético Tucumán", ligaId: "primera-division-argentina", fuerza: 63, prestigio: 74, economia: 18, initials: "ATU", a: "#4CB5E5", b: "#FFFFFF", escudo: "atletico-tucuman.png" },
    { id: "banfield", nombre: "Banfield", ligaId: "primera-division-argentina", fuerza: 56, prestigio: 74, economia: 14, initials: "BAN", a: "#00A651", b: "#FFFFFF", escudo: "banfield.png" },
    { id: "barracas-central", nombre: "Barracas Central", ligaId: "primera-division-argentina", fuerza: 38, prestigio: 63, economia: 10, initials: "BAR", a: "#E4002B", b: "#FFFFFF", escudo: "barracas-central.png" },
    { id: "belgrano", nombre: "Belgrano", ligaId: "primera-division-argentina", fuerza: 52, prestigio: 66, economia: 19, initials: "BEL", a: "#4CB5E5", b: "#000000", escudo: "belgrano.png" },
    { id: "boca-juniors", nombre: "Boca Juniors", ligaId: "primera-division-argentina", fuerza: 78, prestigio: 96, economia: 35, initials: "BOC", a: "#003DA5", b: "#FFD100", escudo: "boca-juniors.png" },
    { id: "central-cordoba-sde", nombre: "Central Córdoba (SdE)", ligaId: "primera-division-argentina", fuerza: 52, prestigio: 69, economia: 16, initials: "CCO", a: "#000000", b: "#FFFFFF", escudo: "central-cordoba-sde.png" },
    { id: "defensa-y-justicia", nombre: "Defensa y Justicia", ligaId: "primera-division-argentina", fuerza: 44, prestigio: 64, economia: 10, initials: "DYJ", a: "#006A4E", b: "#FFD100", escudo: "defensa-y-justicia.png" },
    { id: "deportivo-riestra", nombre: "Deportivo Riestra", ligaId: "primera-division-argentina", fuerza: 44, prestigio: 52, economia: 7, initials: "RIE", a: "#000000", b: "#FFFFFF", escudo: "deportivo-riestra.png" },
    { id: "estudiantes-de-la-plata", nombre: "Estudiantes de La Plata", ligaId: "primera-division-argentina", fuerza: 62, prestigio: 76, economia: 17, initials: "EDLP", a: "#D2001C", b: "#FFFFFF", escudo: "estudiantes-de-la-plata.png" },
    { id: "estudiantes-de-rio-cuarto", nombre: "Estudiantes (Río Cuarto)", ligaId: "primera-division-argentina", fuerza: 41, prestigio: 61, economia: 10, initials: "ERC", a: "#6CACE4", b: "#000000", escudo: "estudiantes-de-rio-cuarto.png" },
    { id: "gimnasia-la-plata", nombre: "Gimnasia y Esgrima (La Plata)", ligaId: "primera-division-argentina", fuerza: 58, prestigio: 63, economia: 21, initials: "GEL", a: "#002554", b: "#FFFFFF", escudo: "gimnasia-la-plata.png" },
    { id: "gimnasia-mendoza", nombre: "Gimnasia y Esgrima (Mendoza)", ligaId: "primera-division-argentina", fuerza: 44, prestigio: 48, economia: 9, initials: "GEM", a: "#000000", b: "#FFFFFF", escudo: "gimnasia-mendoza.png" },
    { id: "huracan", nombre: "Huracán", ligaId: "primera-division-argentina", fuerza: 53, prestigio: 72, economia: 14, initials: "HUR", a: "#FFFFFF", b: "#E4002B", escudo: "huracan.png" },
    { id: "independiente", nombre: "Independiente", ligaId: "primera-division-argentina", fuerza: 75, prestigio: 90, economia: 32, initials: "IND", a: "#E4002B", b: "#FFFFFF", escudo: "independiente.png" },
    { id: "independiente-rivadavia", nombre: "Independiente Rivadavia", ligaId: "primera-division-argentina", fuerza: 50, prestigio: 54, economia: 13, initials: "IRI", a: "#0C2340", b: "#FFFFFF", escudo: "independiente-rivadavia.png" },
    { id: "instituto", nombre: "Instituto", ligaId: "primera-division-argentina", fuerza: 57, prestigio: 71, economia: 21, initials: "INS", a: "#D2001C", b: "#FFFFFF", escudo: "instituto.png" },
    { id: "lanus", nombre: "Lanús", ligaId: "primera-division-argentina", fuerza: 55, prestigio: 68, economia: 20, initials: "LAN", a: "#7A1C3E", b: "#000000", escudo: "lanus.png" },
    { id: "newells-old-boys", nombre: "Newell's Old Boys", ligaId: "primera-division-argentina", fuerza: 58, prestigio: 65, economia: 17, initials: "NOB", a: "#E4002B", b: "#000000", escudo: "newells-old-boys.png" },
    { id: "platense", nombre: "Platense", ligaId: "primera-division-argentina", fuerza: 37, prestigio: 50, economia: 10, initials: "PLA", a: "#6F4E37", b: "#FFFFFF", escudo: "platense.png" },
    { id: "racing-club", nombre: "Racing Club", ligaId: "primera-division-argentina", fuerza: 69, prestigio: 84, economia: 23, initials: "RAC", a: "#6CACE4", b: "#FFFFFF", escudo: "racing-club.png" },
    { id: "river-plate", nombre: "River Plate", ligaId: "primera-division-argentina", fuerza: 80, prestigio: 94, economia: 33, initials: "RIV", a: "#FFFFFF", b: "#E4002B", escudo: "river-plate.png" },
    { id: "rosario-central", nombre: "Rosario Central", ligaId: "primera-division-argentina", fuerza: 63, prestigio: 77, economia: 16, initials: "ROS", a: "#003DA5", b: "#FFD100", escudo: "rosario-central.png" },
    { id: "san-lorenzo", nombre: "San Lorenzo", ligaId: "primera-division-argentina", fuerza: 73, prestigio: 80, economia: 29, initials: "SLO", a: "#003DA5", b: "#C8102E", escudo: "san-lorenzo.png" },
    { id: "sarmiento-de-junin", nombre: "Sarmiento (Junín)", ligaId: "primera-division-argentina", fuerza: 51, prestigio: 50, economia: 9, initials: "SAR", a: "#1C8A42", b: "#FFFFFF", escudo: "sarmiento-de-junin.png" },
    { id: "talleres-cordoba", nombre: "Talleres (Córdoba)", ligaId: "primera-division-argentina", fuerza: 64, prestigio: 72, economia: 14, initials: "TAL", a: "#003DA5", b: "#FFFFFF", escudo: "talleres-cordoba.png" },
    { id: "tigre", nombre: "Tigre", ligaId: "primera-division-argentina", fuerza: 39, prestigio: 59, economia: 14, initials: "TIG", a: "#003DA5", b: "#E4002B", escudo: "tigre.png" },
    { id: "union-santa-fe", nombre: "Unión (Santa Fe)", ligaId: "primera-division-argentina", fuerza: 62, prestigio: 65, economia: 16, initials: "UNI", a: "#D2001C", b: "#FFFFFF", escudo: "union-santa-fe.png" },
    { id: "velez-sarsfield", nombre: "Vélez Sarsfield", ligaId: "primera-division-argentina", fuerza: 61, prestigio: 71, economia: 17, initials: "VEL", a: "#FFFFFF", b: "#003DA5", escudo: "velez-sarsfield.png" },

    // ---------------- LIGA MX (México) ----------------
    { id: "club-america", nombre: "América", ligaId: "liga-mx", fuerza: 70, prestigio: 65, economia: 55, initials: "AME", a: "#FFEB00", b: "#003057", escudo: "club-america.png" },
    { id: "atlas-fc", nombre: "Atlas", ligaId: "liga-mx", fuerza: 53, prestigio: 37, economia: 30, initials: "ATL", a: "#EC1C24", b: "#231F20", escudo: "atlas-fc.png" },
    { id: "atletico-san-luis", nombre: "Atlético San Luis", ligaId: "liga-mx", fuerza: 47, prestigio: 18, economia: 18, initials: "ASL", a: "#CD3825", b: "#EEECEC", escudo: "atletico-san-luis.png" },
    { id: "cruz-azul", nombre: "Cruz Azul", ligaId: "liga-mx", fuerza: 68, prestigio: 65, economia: 50, initials: "CAZ", a: "#001F60", b: "#FFFFFF", escudo: "cruz-azul.png" },
    { id: "chivas-guadalajara", nombre: "Guadalajara (Chivas)", ligaId: "liga-mx", fuerza: 71, prestigio: 64, economia: 50, initials: "CHI", a: "#CE0E2D", b: "#002E5D", escudo: "chivas-guadalajara.png" },
    { id: "fc-juarez", nombre: "Juárez", ligaId: "liga-mx", fuerza: 50, prestigio: 39, economia: 30, initials: "JUA", a: "#21CB35", b: "#1F1D1C", escudo: "fc-juarez.png" },
    { id: "club-leon", nombre: "León", ligaId: "liga-mx", fuerza: 55, prestigio: 35, economia: 29, initials: "LEO", a: "#187B56", b: "#FFFFFF", escudo: "club-leon.png" },
    { id: "mazatlan-fc", nombre: "Mazatlán", ligaId: "liga-mx", fuerza: 37, prestigio: 19, economia: 12, initials: "MAZ", a: "#533278", b: "#101820", escudo: "mazatlan-fc.png" },
    { id: "cf-monterrey", nombre: "Monterrey", ligaId: "liga-mx", fuerza: 68, prestigio: 51, economia: 48, initials: "MTY", a: "#0A2240", b: "#FFFFFF", escudo: "cf-monterrey.png" },
    { id: "club-necaxa", nombre: "Necaxa", ligaId: "liga-mx", fuerza: 35, prestigio: 22, economia: 23, initials: "NEC", a: "#E1001E", b: "#FFFFFF", escudo: "club-necaxa.png" },
    { id: "cf-pachuca", nombre: "Pachuca", ligaId: "liga-mx", fuerza: 51, prestigio: 45, economia: 32, initials: "PAC", a: "#162577", b: "#FFFFFF", escudo: "cf-pachuca.png" },
    { id: "club-puebla", nombre: "Puebla", ligaId: "liga-mx", fuerza: 56, prestigio: 46, economia: 32, initials: "PUE", a: "#2B4B75", b: "#FFFFFF", escudo: "club-puebla.png" },
    { id: "pumas-unam", nombre: "Pumas UNAM", ligaId: "liga-mx", fuerza: 71, prestigio: 64, economia: 46, initials: "PUM", a: "#132347", b: "#CBAB58", escudo: "pumas-unam.png" },
    { id: "queretaro-fc", nombre: "Querétaro", ligaId: "liga-mx", fuerza: 43, prestigio: 23, economia: 15, initials: "QRO", a: "#0056B3", b: "#000000", escudo: "queretaro-fc.png" },
    { id: "santos-laguna", nombre: "Santos Laguna", ligaId: "liga-mx", fuerza: 53, prestigio: 34, economia: 30, initials: "SAN", a: "#008066", b: "#FFFFFF", escudo: "santos-laguna.png" },
    { id: "tigres-uanl", nombre: "Tigres UANL", ligaId: "liga-mx", fuerza: 66, prestigio: 63, economia: 44, initials: "TIG", a: "#015DAA", b: "#FBAF35", escudo: "tigres-uanl.png" },
    { id: "club-tijuana", nombre: "Tijuana (Xolos)", ligaId: "liga-mx", fuerza: 60, prestigio: 33, economia: 24, initials: "TIJ", a: "#ED1B26", b: "#161413", escudo: "club-tijuana.png" },
    { id: "toluca-fc", nombre: "Toluca", ligaId: "liga-mx", fuerza: 70, prestigio: 58, economia: 41, initials: "TOL", a: "#D53741", b: "#002855", escudo: "toluca-fc.png" },

    // ---------------- MLS (Estados Unidos / Canadá) ----------------
    { id: "atlanta-united", nombre: "Atlanta United", ligaId: "mls", fuerza: 59, prestigio: 47, economia: 59, initials: "ATL", a: "#2D2A26", b: "#A32035", escudo: "atlanta-united.png" },
    { id: "austin-fc", nombre: "Austin FC", ligaId: "mls", fuerza: 38, prestigio: 18, economia: 25, initials: "ATX", a: "#00B140", b: "#000000", escudo: "austin-fc.png" },
    { id: "charlotte-fc", nombre: "Charlotte FC", ligaId: "mls", fuerza: 27, prestigio: 5, economia: 24, initials: "CLT", a: "#0085CA", b: "#000000", escudo: "charlotte-fc.png" },
    { id: "chicago-fire", nombre: "Chicago Fire", ligaId: "mls", fuerza: 30, prestigio: 8, economia: 17, initials: "CHI", a: "#7CCDEF", b: "#FF0000", escudo: "chicago-fire.png" },
    { id: "fc-cincinnati", nombre: "FC Cincinnati", ligaId: "mls", fuerza: 52, prestigio: 25, economia: 34, initials: "CIN", a: "#FE5000", b: "#003087", escudo: "fc-cincinnati.png" },
    { id: "colorado-rapids", nombre: "Colorado Rapids", ligaId: "mls", fuerza: 36, prestigio: 8, economia: 20, initials: "COL", a: "#8A2432", b: "#8AB7E9", escudo: "colorado-rapids.png" },
    { id: "columbus-crew", nombre: "Columbus Crew", ligaId: "mls", fuerza: 60, prestigio: 51, economia: 70, initials: "CLB", a: "#000000", b: "#FEDD00", escudo: "columbus-crew.png" },
    { id: "fc-dallas", nombre: "FC Dallas", ligaId: "mls", fuerza: 33, prestigio: 5, economia: 28, initials: "DAL", a: "#001F5B", b: "#C6093B", escudo: "fc-dallas.png" },
    { id: "dc-united", nombre: "D.C. United", ligaId: "mls", fuerza: 41, prestigio: 20, economia: 34, initials: "DCU", a: "#2E2A25", b: "#EB0029", escudo: "dc-united.png" },
    { id: "houston-dynamo", nombre: "Houston Dynamo", ligaId: "mls", fuerza: 32, prestigio: 10, economia: 24, initials: "HOU", a: "#FF6B00", b: "#101820", escudo: "houston-dynamo.png" },
    { id: "inter-miami", nombre: "Inter Miami", ligaId: "mls", fuerza: 62, prestigio: 58, economia: 75, initials: "MIA", a: "#231F20", b: "#F7B5CD", escudo: "inter-miami.png" },
    { id: "sporting-kansas-city", nombre: "Sporting Kansas City", ligaId: "mls", fuerza: 42, prestigio: 27, economia: 37, initials: "SKC", a: "#0C2340", b: "#A7C6ED", escudo: "sporting-kansas-city.png" },
    { id: "los-angeles-fc", nombre: "LAFC", ligaId: "mls", fuerza: 63, prestigio: 51, economia: 53, initials: "LAF", a: "#C39F6C", b: "#010101", escudo: "los-angeles-fc.png" },
    { id: "la-galaxy", nombre: "LA Galaxy", ligaId: "mls", fuerza: 55, prestigio: 50, economia: 58, initials: "LAG", a: "#15284B", b: "#FFCE00", escudo: "la-galaxy.png" },
    { id: "minnesota-united", nombre: "Minnesota United", ligaId: "mls", fuerza: 48, prestigio: 31, economia: 37, initials: "MIN", a: "#E2E2DE", b: "#9BCDE4", escudo: "minnesota-united.png" },
    { id: "cf-montreal", nombre: "CF Montréal", ligaId: "mls", fuerza: 42, prestigio: 5, economia: 29, initials: "MTL", a: "#003DA6", b: "#000000", escudo: "cf-montreal.png" },
    { id: "nashville-sc", nombre: "Nashville SC", ligaId: "mls", fuerza: 46, prestigio: 17, economia: 33, initials: "NSH", a: "#ECE83A", b: "#1F1646", escudo: "nashville-sc.png" },
    { id: "new-england-revolution", nombre: "New England Revolution", ligaId: "mls", fuerza: 31, prestigio: 8, economia: 18, initials: "NE", a: "#0A2240", b: "#CE0E2D", escudo: "new-england-revolution.png" },
    { id: "new-york-red-bulls", nombre: "New York Red Bulls", ligaId: "mls", fuerza: 45, prestigio: 18, economia: 41, initials: "RBNY", a: "#B91F31", b: "#FFC72C", escudo: "new-york-red-bulls.png" },
    { id: "new-york-city-fc", nombre: "New York City FC", ligaId: "mls", fuerza: 47, prestigio: 27, economia: 30, initials: "NYC", a: "#9FD2FF", b: "#000229", escudo: "new-york-city-fc.png" },
    { id: "orlando-city", nombre: "Orlando City", ligaId: "mls", fuerza: 43, prestigio: 20, economia: 41, initials: "ORL", a: "#60269E", b: "#F0D283", escudo: "orlando-city.png" },
    { id: "philadelphia-union", nombre: "Philadelphia Union", ligaId: "mls", fuerza: 53, prestigio: 17, economia: 35, initials: "PHI", a: "#E0D0A6", b: "#051C2C", escudo: "philadelphia-union.png" },
    { id: "portland-timbers", nombre: "Portland Timbers", ligaId: "mls", fuerza: 40, prestigio: 19, economia: 33, initials: "POR", a: "#2C5234", b: "#C99700", escudo: "portland-timbers.png" },
    { id: "real-salt-lake", nombre: "Real Salt Lake", ligaId: "mls", fuerza: 51, prestigio: 17, economia: 36, initials: "RSL", a: "#001E61", b: "#F2D11A", escudo: "real-salt-lake.png" },
    { id: "san-diego-fc", nombre: "San Diego FC", ligaId: "mls", fuerza: 29, prestigio: 12, economia: 19, initials: "SD", a: "#051C2C", b: "#687C7B", escudo: "san-diego-fc.png" },
    { id: "san-jose-earthquakes", nombre: "San Jose Earthquakes", ligaId: "mls", fuerza: 36, prestigio: 18, economia: 20, initials: "SJ", a: "#0067B1", b: "#000000", escudo: "san-jose-earthquakes.png" },
    { id: "seattle-sounders", nombre: "Seattle Sounders", ligaId: "mls", fuerza: 67, prestigio: 45, economia: 59, initials: "SEA", a: "#4FB84F", b: "#0033A1", escudo: "seattle-sounders.png" },
    { id: "st-louis-city", nombre: "St. Louis City", ligaId: "mls", fuerza: 30, prestigio: 14, economia: 24, initials: "STL", a: "#EC1458", b: "#001544", escudo: "st-louis-city.png" },
    { id: "toronto-fc", nombre: "Toronto FC", ligaId: "mls", fuerza: 45, prestigio: 30, economia: 42, initials: "TOR", a: "#AA182C", b: "#323E48", escudo: "toronto-fc.png" },
    { id: "vancouver-whitecaps", nombre: "Vancouver Whitecaps", ligaId: "mls", fuerza: 50, prestigio: 15, economia: 41, initials: "VAN", a: "#12284C", b: "#8AB7E9", escudo: "vancouver-whitecaps.png" },

    // ---------------- PRIMERA A (Colombia) ----------------
    { id: "aguilas-doradas", nombre: "Águilas Doradas", ligaId: "primera-a-colombia", fuerza: 50, prestigio: 35, economia: 13, initials: "AGD", a: "#FFC72C", b: "#000000", escudo: "aguilas-doradas.png" },
    { id: "alianza", nombre: "Alianza FC (Valledupar)", ligaId: "primera-a-colombia", fuerza: 24, prestigio: 29, economia: 6, initials: "ALZ", a: "#002D62", b: "#E30613", escudo: "alianza.png" },
    { id: "america", nombre: "América de Cali", ligaId: "primera-a-colombia", fuerza: 62, prestigio: 61, economia: 21, initials: "AME", a: "#DA291C", b: "#FFFFFF", escudo: "america.png" },
    { id: "bucaramanga", nombre: "Atlético Bucaramanga", ligaId: "primera-a-colombia", fuerza: 42, prestigio: 26, economia: 12, initials: "BUC", a: "#FFD100", b: "#007A33", escudo: "bucaramanga.png" },
    { id: "atletico-nacional", nombre: "Atlético Nacional", ligaId: "primera-a-colombia", fuerza: 62, prestigio: 62, economia: 25, initials: "ATN", a: "#046A38", b: "#FFFFFF", escudo: "atletico-nacional.png" },
    { id: "boyaca-chico", nombre: "Boyacá Chicó", ligaId: "primera-a-colombia", fuerza: 40, prestigio: 35, economia: 13, initials: "BOY", a: "#1B3A6B", b: "#F7941D", escudo: "boyaca-chico.png" },
    { id: "cucuta", nombre: "Cúcuta Deportivo", ligaId: "primera-a-colombia", fuerza: 37, prestigio: 25, economia: 10, initials: "CUC", a: "#ED1C24", b: "#000000", escudo: "cucuta.png" },
    { id: "tolima", nombre: "Deportes Tolima", ligaId: "primera-a-colombia", fuerza: 40, prestigio: 27, economia: 13, initials: "TOL", a: "#7A1F2B", b: "#000000", escudo: "tolima.png" },
    { id: "deportivo-cali", nombre: "Deportivo Cali", ligaId: "primera-a-colombia", fuerza: 55, prestigio: 61, economia: 23, initials: "DCA", a: "#00A651", b: "#FFFFFF", escudo: "deportivo-cali.png" },
    { id: "pasto", nombre: "Deportivo Pasto", ligaId: "primera-a-colombia", fuerza: 38, prestigio: 28, economia: 11, initials: "PAS", a: "#C8102E", b: "#0033A0", escudo: "pasto.png" },
    { id: "pereira", nombre: "Deportivo Pereira", ligaId: "primera-a-colombia", fuerza: 51, prestigio: 28, economia: 16, initials: "PER", a: "#C8102E", b: "#808080", escudo: "pereira.png" },
    { id: "fortaleza", nombre: "Fortaleza", ligaId: "primera-a-colombia", fuerza: 38, prestigio: 31, economia: 6, initials: "FOR", a: "#1B3A6B", b: "#ED1C24", escudo: "fortaleza.png" },
    { id: "independiente-medellin", nombre: "Independiente Medellín", ligaId: "primera-a-colombia", fuerza: 64, prestigio: 57, economia: 19, initials: "DIM", a: "#E2231A", b: "#002D62", escudo: "independiente-medellin.png" },
    { id: "internacional-bogota", nombre: "Internacional de Bogotá", ligaId: "primera-a-colombia", fuerza: 31, prestigio: 20, economia: 6, initials: "IB", a: "#1A1A1A", b: "#C9A227", escudo: "internacional-bogota.png" },
    { id: "jaguares", nombre: "Jaguares de Córdoba", ligaId: "primera-a-colombia", fuerza: 38, prestigio: 24, economia: 8, initials: "JAG", a: "#3EB6E8", b: "#00A550", escudo: "jaguares.png" },
    { id: "junior", nombre: "Junior", ligaId: "primera-a-colombia", fuerza: 58, prestigio: 44, economia: 22, initials: "JUN", a: "#E4032E", b: "#FFFFFF", escudo: "junior.png" },
    { id: "llaneros", nombre: "Llaneros", ligaId: "primera-a-colombia", fuerza: 34, prestigio: 26, economia: 6, initials: "LLA", a: "#000000", b: "#FFFFFF", escudo: "llaneros.png" },
    { id: "millonarios", nombre: "Millonarios", ligaId: "primera-a-colombia", fuerza: 65, prestigio: 57, economia: 23, initials: "MIL", a: "#003DA5", b: "#FFFFFF", escudo: "millonarios.png" },
    { id: "once-caldas", nombre: "Once Caldas", ligaId: "primera-a-colombia", fuerza: 49, prestigio: 40, economia: 14, initials: "ONC", a: "#FFFFFF", b: "#7A1F2B", escudo: "once-caldas.png" },
    { id: "santafe", nombre: "Independiente Santa Fe", ligaId: "primera-a-colombia", fuerza: 61, prestigio: 61, economia: 19, initials: "SFE", a: "#C8102E", b: "#FFFFFF", escudo: "santafe.png" },
    // ---------------- EREDIVISIE (Países Bajos) ----------------
    { id: "ajax", nombre: "Ajax", ligaId: "eredivisie", fuerza: 87, prestigio: 89, economia: 73, initials: "AJA", a: "#c8102e", b: "#ffffff", escudo: "ajax.png" },
    { id: "psv-eindhoven", nombre: "PSV Eindhoven", ligaId: "eredivisie", fuerza: 96, prestigio: 98, economia: 82, initials: "PE", a: "#00205b", b: "#ffffff", escudo: "psv-eindhoven.png" },
    { id: "feyenoord", nombre: "Feyenoord", ligaId: "eredivisie", fuerza: 93, prestigio: 95, economia: 79, initials: "FEY", a: "#5f259f", b: "#ffffff", escudo: "feyenoord.png" },
    { id: "az-alkmaar", nombre: "AZ Alkmaar", ligaId: "eredivisie", fuerza: 74, prestigio: 74, economia: 62, initials: "AA", a: "#111111", b: "#f2c500", escudo: "az-alkmaar.png" },
    { id: "fc-twente", nombre: "FC Twente", ligaId: "eredivisie", fuerza: 78, prestigio: 78, economia: 66, initials: "TWE", a: "#7a1010", b: "#111111", escudo: "fc-twente.png" },
    { id: "fc-utrecht", nombre: "FC Utrecht", ligaId: "eredivisie", fuerza: 72, prestigio: 72, economia: 60, initials: "UTR", a: "#00205b", b: "#ffffff", escudo: "fc-utrecht.png" },
    { id: "fc-groningen", nombre: "FC Groningen", ligaId: "eredivisie", fuerza: 61, prestigio: 61, economia: 51, initials: "GRO", a: "#00843d", b: "#ffffff", escudo: "fc-groningen.png" },
    { id: "sparta-rotterdam", nombre: "Sparta Rotterdam", ligaId: "eredivisie", fuerza: 56, prestigio: 56, economia: 46, initials: "SR", a: "#1d428a", b: "#ffffff", escudo: "sparta-rotterdam.png" },
    { id: "go-ahead-eagles", nombre: "Go Ahead Eagles", ligaId: "eredivisie", fuerza: 60, prestigio: 60, economia: 50, initials: "GAE", a: "#009edb", b: "#ffffff", escudo: "go-ahead-eagles.png" },
    { id: "sc-heerenveen", nombre: "SC Heerenveen", ligaId: "eredivisie", fuerza: 54, prestigio: 54, economia: 44, initials: "HEE", a: "#111111", b: "#f2c500", escudo: "sc-heerenveen.png" },
    { id: "fortuna-sittard", nombre: "Fortuna Sittard", ligaId: "eredivisie", fuerza: 59, prestigio: 59, economia: 49, initials: "FS", a: "#7a1010", b: "#111111", escudo: "fortuna-sittard.png" },
    { id: "nec-nijmegen", nombre: "NEC Nijmegen", ligaId: "eredivisie", fuerza: 51, prestigio: 51, economia: 41, initials: "NN", a: "#6c1d45", b: "#ffffff", escudo: "nec-nijmegen.png" },
    { id: "pec-zwolle", nombre: "PEC Zwolle", ligaId: "eredivisie", fuerza: 52, prestigio: 52, economia: 42, initials: "PZ", a: "#e35205", b: "#111111", escudo: "pec-zwolle.png" },
    { id: "willem-ii", nombre: "Willem II", ligaId: "eredivisie", fuerza: 53, prestigio: 53, economia: 43, initials: "WI", a: "#6c1d45", b: "#ffffff", escudo: "willem-ii.png" },
    { id: "excelsior", nombre: "Excelsior", ligaId: "eredivisie", fuerza: 58, prestigio: 58, economia: 48, initials: "EXC", a: "#7a1010", b: "#111111", escudo: "excelsior.png" },
    { id: "sc-cambuur", nombre: "SC Cambuur", ligaId: "eredivisie", fuerza: 55, prestigio: 55, economia: 45, initials: "CAM", a: "#0b2265", b: "#c8102e", escudo: "sc-cambuur.png" },
    { id: "ado-den-haag", nombre: "ADO Den Haag", ligaId: "eredivisie", fuerza: 59, prestigio: 59, economia: 49, initials: "ADH", a: "#111111", b: "#f2c500", escudo: "ado-den-haag.png" },
    { id: "telstar", nombre: "Telstar", ligaId: "eredivisie", fuerza: 58, prestigio: 58, economia: 48, initials: "TEL", a: "#e35205", b: "#111111", escudo: "telstar.png" },

    // ---------------- PRIMEIRA LIGA (Portugal) ----------------
    { id: "fc-porto", nombre: "Porto", ligaId: "primeira-liga", fuerza: 94, prestigio: 98, economia: 74, initials: "POR", a: "#00843d", b: "#ffffff", escudo: "fc-porto.png" },
    { id: "sl-benfica", nombre: "Benfica", ligaId: "primeira-liga", fuerza: 95, prestigio: 99, economia: 75, initials: "SB", a: "#0b2265", b: "#c8102e", escudo: "sl-benfica.png" },
    { id: "sporting-cp", nombre: "Sporting", ligaId: "primeira-liga", fuerza: 92, prestigio: 96, economia: 72, initials: "SC", a: "#c8102e", b: "#ffffff", escudo: "sporting-cp.png" },
    { id: "sc-braga", nombre: "Braga", ligaId: "primeira-liga", fuerza: 83, prestigio: 85, economia: 65, initials: "BRA", a: "#0b2265", b: "#c8102e", escudo: "sc-braga.png" },
    { id: "vitoria-de-guimaraes", nombre: "Vitória de Guimarães", ligaId: "primeira-liga", fuerza: 82, prestigio: 84, economia: 64, initials: "VG", a: "#00843d", b: "#ffffff", escudo: "vitoria-de-guimaraes.png" },
    { id: "gil-vicente", nombre: "Gil Vicente", ligaId: "primeira-liga", fuerza: 60, prestigio: 62, economia: 44, initials: "GV", a: "#c8102e", b: "#ffffff", escudo: "gil-vicente.png" },
    { id: "moreirense", nombre: "Moreirense", ligaId: "primeira-liga", fuerza: 63, prestigio: 65, economia: 47, initials: "MOR", a: "#1d428a", b: "#ffffff", escudo: "moreirense.png" },
    { id: "rio-ave", nombre: "Rio Ave", ligaId: "primeira-liga", fuerza: 62, prestigio: 64, economia: 46, initials: "RA", a: "#111111", b: "#f2c500", escudo: "rio-ave.png" },
    { id: "famalicao", nombre: "Famalicão", ligaId: "primeira-liga", fuerza: 60, prestigio: 62, economia: 44, initials: "FAM", a: "#6c1d45", b: "#ffffff", escudo: "famalicao.png" },
    { id: "casa-pia", nombre: "Casa Pia", ligaId: "primeira-liga", fuerza: 56, prestigio: 58, economia: 40, initials: "CP", a: "#c8102e", b: "#ffffff", escudo: "casa-pia.png" },
    { id: "estoril-praia", nombre: "Estoril Praia", ligaId: "primeira-liga", fuerza: 63, prestigio: 65, economia: 47, initials: "EP", a: "#00843d", b: "#ffffff", escudo: "estoril-praia.png" },
    { id: "arouca", nombre: "Arouca", ligaId: "primeira-liga", fuerza: 63, prestigio: 65, economia: 47, initials: "ARO", a: "#e35205", b: "#111111", escudo: "arouca.png" },
    { id: "nacional", nombre: "Nacional", ligaId: "primeira-liga", fuerza: 58, prestigio: 60, economia: 42, initials: "NAC", a: "#7a1010", b: "#111111", escudo: "nacional.png" },
    { id: "maritimo", nombre: "Marítimo", ligaId: "primeira-liga", fuerza: 63, prestigio: 65, economia: 47, initials: "MAR", a: "#c8102e", b: "#ffffff", escudo: "maritimo.png" },
    { id: "santa-clara", nombre: "Santa Clara", ligaId: "primeira-liga", fuerza: 59, prestigio: 61, economia: 43, initials: "SC", a: "#6c1d45", b: "#ffffff", escudo: "santa-clara.png" },
    { id: "estrela-da-amadora", nombre: "Estrela da Amadora", ligaId: "primeira-liga", fuerza: 57, prestigio: 59, economia: 41, initials: "EDA", a: "#0b2265", b: "#c8102e", escudo: "estrela-da-amadora.png" },
    { id: "alverca", nombre: "Alverca", ligaId: "primeira-liga", fuerza: 60, prestigio: 62, economia: 44, initials: "ALV", a: "#5f259f", b: "#ffffff", escudo: "alverca.png" },
    { id: "academico-de-viseu", nombre: "Académico de Viseu", ligaId: "primeira-liga", fuerza: 61, prestigio: 63, economia: 45, initials: "AV", a: "#7a1010", b: "#111111", escudo: "academico-de-viseu.png" },

    // ---------------- PRO LEAGUE (Bélgica) ----------------
    { id: "club-brugge", nombre: "Club Brugge", ligaId: "pro-league-belgica", fuerza: 90, prestigio: 82, economia: 73, initials: "CB", a: "#1d428a", b: "#ffffff", escudo: "club-brugge.png" },
    { id: "anderlecht", nombre: "Anderlecht", ligaId: "pro-league-belgica", fuerza: 91, prestigio: 83, economia: 74, initials: "AND", a: "#009edb", b: "#ffffff", escudo: "anderlecht.png" },
    { id: "union-saint-gilloise", nombre: "Union Saint-Gilloise", ligaId: "pro-league-belgica", fuerza: 79, prestigio: 69, economia: 64, initials: "US", a: "#009edb", b: "#ffffff", escudo: "union-saint-gilloise.png" },
    { id: "genk", nombre: "Genk", ligaId: "pro-league-belgica", fuerza: 69, prestigio: 59, economia: 54, initials: "GEN", a: "#c8102e", b: "#ffffff", escudo: "genk.png" },
    { id: "standard-liege", nombre: "Standard Liège", ligaId: "pro-league-belgica", fuerza: 77, prestigio: 67, economia: 62, initials: "SL", a: "#111111", b: "#f2c500", escudo: "standard-liege.png" },
    { id: "gent", nombre: "Gent", ligaId: "pro-league-belgica", fuerza: 69, prestigio: 59, economia: 54, initials: "GEN", a: "#c8102e", b: "#ffffff", escudo: "gent.png" },
    { id: "royal-antwerp", nombre: "Royal Antwerp", ligaId: "pro-league-belgica", fuerza: 70, prestigio: 60, economia: 55, initials: "RA", a: "#1d428a", b: "#ffffff", escudo: "royal-antwerp.png" },
    { id: "charleroi", nombre: "Charleroi", ligaId: "pro-league-belgica", fuerza: 53, prestigio: 43, economia: 40, initials: "CHA", a: "#7a1010", b: "#111111", escudo: "charleroi.png" },
    { id: "sint-truiden", nombre: "Sint-Truiden", ligaId: "pro-league-belgica", fuerza: 54, prestigio: 44, economia: 41, initials: "SIN", a: "#e35205", b: "#111111", escudo: "sint-truiden.png" },
    { id: "westerlo", nombre: "Westerlo", ligaId: "pro-league-belgica", fuerza: 54, prestigio: 44, economia: 41, initials: "WES", a: "#008542", b: "#111111", escudo: "westerlo.png" },
    { id: "kortrijk", nombre: "Kortrijk", ligaId: "pro-league-belgica", fuerza: 53, prestigio: 43, economia: 40, initials: "KOR", a: "#1d428a", b: "#ffffff", escudo: "kortrijk.png" },
    { id: "mechelen", nombre: "Mechelen", ligaId: "pro-league-belgica", fuerza: 52, prestigio: 42, economia: 39, initials: "MEC", a: "#5f259f", b: "#ffffff", escudo: "mechelen.png" },
    { id: "zulte-waregem", nombre: "Zulte Waregem", ligaId: "pro-league-belgica", fuerza: 58, prestigio: 48, economia: 45, initials: "ZW", a: "#e35205", b: "#111111", escudo: "zulte-waregem.png" },
    { id: "cercle-brugge", nombre: "Cercle Brugge", ligaId: "pro-league-belgica", fuerza: 52, prestigio: 42, economia: 39, initials: "CB", a: "#009edb", b: "#ffffff", escudo: "cercle-brugge.png" },
    { id: "oh-leuven", nombre: "OH Leuven", ligaId: "pro-league-belgica", fuerza: 53, prestigio: 43, economia: 40, initials: "OL", a: "#009edb", b: "#ffffff", escudo: "oh-leuven.png" },
    { id: "beveren", nombre: "Beveren", ligaId: "pro-league-belgica", fuerza: 53, prestigio: 43, economia: 40, initials: "BEV", a: "#008542", b: "#111111", escudo: "beveren.png" },
    { id: "lommel-sk", nombre: "Lommel SK", ligaId: "pro-league-belgica", fuerza: 57, prestigio: 47, economia: 44, initials: "LOM", a: "#00205b", b: "#ffffff", escudo: "lommel-sk.png" },
    { id: "raal-la-louviere", nombre: "RAAL La Louvière", ligaId: "pro-league-belgica", fuerza: 57, prestigio: 47, economia: 44, initials: "RL", a: "#c8102e", b: "#ffffff", escudo: "raal-la-louviere.png" },

    // ---------------- SÜPER LIG (Turquía) ----------------
    { id: "galatasaray", nombre: "Galatasaray", ligaId: "super-lig-turca", fuerza: 96, prestigio: 94, economia: 85, initials: "GAL", a: "#c8102e", b: "#ffffff", escudo: "galatasaray.png" },
    { id: "fenerbahce", nombre: "Fenerbahçe", ligaId: "super-lig-turca", fuerza: 95, prestigio: 93, economia: 84, initials: "FEN", a: "#1d428a", b: "#ffffff", escudo: "fenerbahce.png" },
    { id: "besiktas", nombre: "Beşiktaş", ligaId: "super-lig-turca", fuerza: 91, prestigio: 89, economia: 80, initials: "BEŞ", a: "#0b2265", b: "#c8102e", escudo: "besiktas.png" },
    { id: "trabzonspor", nombre: "Trabzonspor", ligaId: "super-lig-turca", fuerza: 76, prestigio: 72, economia: 67, initials: "TRA", a: "#00843d", b: "#ffffff", escudo: "trabzonspor.png" },
    { id: "basaksehir", nombre: "Başakşehir", ligaId: "super-lig-turca", fuerza: 77, prestigio: 73, economia: 68, initials: "BAŞ", a: "#1d428a", b: "#ffffff", escudo: "basaksehir.png" },
    { id: "konyaspor", nombre: "Konyaspor", ligaId: "super-lig-turca", fuerza: 60, prestigio: 56, economia: 53, initials: "KON", a: "#009edb", b: "#ffffff", escudo: "konyaspor.png" },
    { id: "gaziantep-fk", nombre: "Gaziantep", ligaId: "super-lig-turca", fuerza: 58, prestigio: 54, economia: 51, initials: "GF", a: "#6c1d45", b: "#ffffff", escudo: "gaziantep-fk.png" },
    { id: "samsunspor", nombre: "Samsunspor", ligaId: "super-lig-turca", fuerza: 55, prestigio: 51, economia: 48, initials: "SAM", a: "#e35205", b: "#111111", escudo: "samsunspor.png" },
    { id: "alanyaspor", nombre: "Alanyaspor", ligaId: "super-lig-turca", fuerza: 63, prestigio: 59, economia: 56, initials: "ALA", a: "#c8102e", b: "#ffffff", escudo: "alanyaspor.png" },
    { id: "goztepe", nombre: "Göztepe", ligaId: "super-lig-turca", fuerza: 59, prestigio: 55, economia: 52, initials: "GÖZ", a: "#c8102e", b: "#ffffff", escudo: "goztepe.png" },
    { id: "kasimpasa", nombre: "Kasımpaşa", ligaId: "super-lig-turca", fuerza: 57, prestigio: 53, economia: 50, initials: "KAS", a: "#5f259f", b: "#ffffff", escudo: "kasimpasa.png" },
    { id: "caykur-rizespor", nombre: "Çaykur Rizespor", ligaId: "super-lig-turca", fuerza: 53, prestigio: 49, economia: 46, initials: "ÇR", a: "#008542", b: "#111111", escudo: "caykur-rizespor.png" },
    { id: "genclerbirligi", nombre: "Gençlerbirliği", ligaId: "super-lig-turca", fuerza: 55, prestigio: 51, economia: 48, initials: "GEN", a: "#6c1d45", b: "#ffffff", escudo: "genclerbirligi.png" },
    { id: "kocaelispor", nombre: "Kocaelispor", ligaId: "super-lig-turca", fuerza: 58, prestigio: 54, economia: 51, initials: "KOC", a: "#0b2265", b: "#c8102e", escudo: "kocaelispor.png" },
    { id: "eyupspor", nombre: "Eyüpspor", ligaId: "super-lig-turca", fuerza: 58, prestigio: 54, economia: 51, initials: "EYÜ", a: "#5f259f", b: "#ffffff", escudo: "eyupspor.png" },
    { id: "erzurumspor", nombre: "Erzurumspor", ligaId: "super-lig-turca", fuerza: 60, prestigio: 56, economia: 53, initials: "ERZ", a: "#c8102e", b: "#ffffff", escudo: "erzurumspor.png" },
    { id: "amedspor", nombre: "Amedspor", ligaId: "super-lig-turca", fuerza: 63, prestigio: 59, economia: 56, initials: "AME", a: "#009edb", b: "#ffffff", escudo: "amedspor.png" },
    { id: "corum-fk", nombre: "Çorum", ligaId: "super-lig-turca", fuerza: 60, prestigio: 56, economia: 53, initials: "ÇF", a: "#00205b", b: "#ffffff", escudo: "corum-fk.png" },

    // ---------------- SCOTTISH PREMIERSHIP (Escocia) ----------------
    { id: "celtic", nombre: "Celtic", ligaId: "premiership-escocesa", fuerza: 77, prestigio: 75, economia: 57, initials: "CEL", a: "#e35205", b: "#111111", escudo: "celtic.png" },
    { id: "rangers", nombre: "Rangers", ligaId: "premiership-escocesa", fuerza: 76, prestigio: 74, economia: 56, initials: "RAN", a: "#00843d", b: "#ffffff", escudo: "rangers.png" },
    { id: "aberdeen", nombre: "Aberdeen", ligaId: "premiership-escocesa", fuerza: 65, prestigio: 61, economia: 47, initials: "ABE", a: "#111111", b: "#f2c500", escudo: "aberdeen.png" },
    { id: "heart-of-midlothian", nombre: "Hearts", ligaId: "premiership-escocesa", fuerza: 59, prestigio: 55, economia: 41, initials: "HOM", a: "#e35205", b: "#111111", escudo: "heart-of-midlothian.png" },
    { id: "hibernian", nombre: "Hibernian", ligaId: "premiership-escocesa", fuerza: 64, prestigio: 60, economia: 46, initials: "HIB", a: "#5f259f", b: "#ffffff", escudo: "hibernian.png" },
    { id: "dundee-united", nombre: "Dundee United", ligaId: "premiership-escocesa", fuerza: 47, prestigio: 43, economia: 31, initials: "DU", a: "#e35205", b: "#111111", escudo: "dundee-united.png" },
    { id: "motherwell", nombre: "Motherwell", ligaId: "premiership-escocesa", fuerza: 43, prestigio: 39, economia: 27, initials: "MOT", a: "#009edb", b: "#ffffff", escudo: "motherwell.png" },
    { id: "st-mirren", nombre: "St Mirren", ligaId: "premiership-escocesa", fuerza: 43, prestigio: 39, economia: 27, initials: "SM", a: "#e35205", b: "#111111", escudo: "st-mirren.png" },
    { id: "kilmarnock", nombre: "Kilmarnock", ligaId: "premiership-escocesa", fuerza: 39, prestigio: 35, economia: 23, initials: "KIL", a: "#008542", b: "#111111", escudo: "kilmarnock.png" },
    { id: "dundee-fc", nombre: "Dundee", ligaId: "premiership-escocesa", fuerza: 41, prestigio: 37, economia: 25, initials: "DUN", a: "#5f259f", b: "#ffffff", escudo: "dundee-fc.png" },
    { id: "falkirk", nombre: "Falkirk", ligaId: "premiership-escocesa", fuerza: 41, prestigio: 37, economia: 25, initials: "FAL", a: "#e35205", b: "#111111", escudo: "falkirk.png" },
    { id: "st-johnstone", nombre: "St Johnstone", ligaId: "premiership-escocesa", fuerza: 49, prestigio: 45, economia: 33, initials: "SJ", a: "#009edb", b: "#ffffff", escudo: "st-johnstone.png" },

    // ---------------- SUPER LEAGUE GREECE (Grecia) ----------------
    { id: "olympiacos", nombre: "Olympiacos", ligaId: "super-liga-griega", fuerza: 81, prestigio: 78, economia: 59, initials: "OLY", a: "#00205b", b: "#ffffff", escudo: "olympiacos.png" },
    { id: "panathinaikos", nombre: "Panathinaikos", ligaId: "super-liga-griega", fuerza: 81, prestigio: 78, economia: 59, initials: "PAN", a: "#6c1d45", b: "#ffffff", escudo: "panathinaikos.png" },
    { id: "aek-athens", nombre: "AEK Athens", ligaId: "super-liga-griega", fuerza: 66, prestigio: 61, economia: 46, initials: "AA", a: "#0b2265", b: "#c8102e", escudo: "aek-athens.png" },
    { id: "paok", nombre: "PAOK", ligaId: "super-liga-griega", fuerza: 57, prestigio: 52, economia: 37, initials: "PAO", a: "#c8102e", b: "#ffffff", escudo: "paok.png" },
    { id: "aris", nombre: "Aris", ligaId: "super-liga-griega", fuerza: 37, prestigio: 32, economia: 19, initials: "ARI", a: "#c8102e", b: "#ffffff", escudo: "aris.png" },
    { id: "asteras-tripolis", nombre: "Asteras Tripolis", ligaId: "super-liga-griega", fuerza: 43, prestigio: 38, economia: 25, initials: "AT", a: "#111111", b: "#f2c500", escudo: "asteras-tripolis.png" },
    { id: "atromitos", nombre: "Atromitos", ligaId: "super-liga-griega", fuerza: 44, prestigio: 39, economia: 26, initials: "ATR", a: "#009edb", b: "#ffffff", escudo: "atromitos.png" },
    { id: "ofi-crete", nombre: "OFI Crete", ligaId: "super-liga-griega", fuerza: 43, prestigio: 38, economia: 25, initials: "OC", a: "#e35205", b: "#111111", escudo: "ofi-crete.png" },
    { id: "panetolikos", nombre: "Panetolikos", ligaId: "super-liga-griega", fuerza: 47, prestigio: 42, economia: 29, initials: "PAN", a: "#1d428a", b: "#ffffff", escudo: "panetolikos.png" },
    { id: "volos-nfc", nombre: "Volos", ligaId: "super-liga-griega", fuerza: 41, prestigio: 36, economia: 23, initials: "VN", a: "#0b2265", b: "#c8102e", escudo: "volos-nfc.png" },
    { id: "levadiakos", nombre: "Levadiakos", ligaId: "super-liga-griega", fuerza: 40, prestigio: 35, economia: 22, initials: "LEV", a: "#00843d", b: "#ffffff", escudo: "levadiakos.png" },
    { id: "iraklis", nombre: "Iraklis", ligaId: "super-liga-griega", fuerza: 45, prestigio: 40, economia: 27, initials: "IRA", a: "#0b2265", b: "#c8102e", escudo: "iraklis.png" },
    { id: "kalamata", nombre: "Kalamata", ligaId: "super-liga-griega", fuerza: 40, prestigio: 35, economia: 22, initials: "KAL", a: "#00843d", b: "#ffffff", escudo: "kalamata.png" },
    { id: "ae-kifisia", nombre: "AE Kifisia", ligaId: "super-liga-griega", fuerza: 44, prestigio: 39, economia: 26, initials: "AK", a: "#1d428a", b: "#ffffff", escudo: "ae-kifisia.png" },

    // ---------------- LIGA PREMIER RUSA (Rusia) ----------------
    { id: "zenit", nombre: "Zenit", ligaId: "liga-premier-rusa", fuerza: 89, prestigio: 83, economia: 76, initials: "ZEN", a: "#c8102e", b: "#ffffff", escudo: "zenit.png" },
    { id: "spartak-moscu", nombre: "Spartak Moscú", ligaId: "liga-premier-rusa", fuerza: 85, prestigio: 79, economia: 72, initials: "SM", a: "#e35205", b: "#111111", escudo: "spartak-moscu.png" },
    { id: "cska-moscu", nombre: "CSKA Moscú", ligaId: "liga-premier-rusa", fuerza: 88, prestigio: 82, economia: 75, initials: "CM", a: "#00205b", b: "#ffffff", escudo: "cska-moscu.png" },
    { id: "dynamo-moscu", nombre: "Dynamo Moscú", ligaId: "liga-premier-rusa", fuerza: 71, prestigio: 63, economia: 60, initials: "DM", a: "#c8102e", b: "#ffffff", escudo: "dynamo-moscu.png" },
    { id: "lokomotiv-moscu", nombre: "Lokomotiv Moscú", ligaId: "liga-premier-rusa", fuerza: 67, prestigio: 59, economia: 56, initials: "LM", a: "#e35205", b: "#111111", escudo: "lokomotiv-moscu.png" },
    { id: "krasnodar", nombre: "Krasnodar", ligaId: "liga-premier-rusa", fuerza: 65, prestigio: 57, economia: 54, initials: "KRA", a: "#c8102e", b: "#ffffff", escudo: "krasnodar.png" },
    { id: "rubin-kazan", nombre: "Rubin Kazán", ligaId: "liga-premier-rusa", fuerza: 50, prestigio: 42, economia: 41, initials: "RK", a: "#7a1010", b: "#111111", escudo: "rubin-kazan.png" },
    { id: "rostov", nombre: "Rostov", ligaId: "liga-premier-rusa", fuerza: 48, prestigio: 40, economia: 39, initials: "ROS", a: "#5f259f", b: "#ffffff", escudo: "rostov.png" },
    { id: "krylia-sovetov", nombre: "Krylia Sovetov", ligaId: "liga-premier-rusa", fuerza: 47, prestigio: 39, economia: 38, initials: "KS", a: "#00843d", b: "#ffffff", escudo: "krylia-sovetov.png" },
    { id: "akhmat-grozny", nombre: "Akhmat Grozny", ligaId: "liga-premier-rusa", fuerza: 54, prestigio: 46, economia: 45, initials: "AG", a: "#7a1010", b: "#111111", escudo: "akhmat-grozny.png" },
    { id: "baltika-kaliningrado", nombre: "Baltika Kaliningrado", ligaId: "liga-premier-rusa", fuerza: 54, prestigio: 46, economia: 45, initials: "BK", a: "#111111", b: "#f2c500", escudo: "baltika-kaliningrado.png" },
    { id: "orenburg", nombre: "Orenburg", ligaId: "liga-premier-rusa", fuerza: 47, prestigio: 39, economia: 38, initials: "ORE", a: "#111111", b: "#f2c500", escudo: "orenburg.png" },
    { id: "fakel-voronezh", nombre: "Fakel Voronezh", ligaId: "liga-premier-rusa", fuerza: 51, prestigio: 43, economia: 42, initials: "FV", a: "#c8102e", b: "#ffffff", escudo: "fakel-voronezh.png" },
    { id: "nizhni-novgorod", nombre: "Nizhni Nóvgorod", ligaId: "liga-premier-rusa", fuerza: 50, prestigio: 42, economia: 41, initials: "NN", a: "#6c1d45", b: "#ffffff", escudo: "nizhni-novgorod.png" },
    { id: "sochi", nombre: "Sochi", ligaId: "liga-premier-rusa", fuerza: 53, prestigio: 45, economia: 44, initials: "SOC", a: "#c8102e", b: "#ffffff", escudo: "sochi.png" },
    { id: "ural-yekaterinburg", nombre: "Ural Yekaterinburg", ligaId: "liga-premier-rusa", fuerza: 49, prestigio: 41, economia: 40, initials: "UY", a: "#00205b", b: "#ffffff", escudo: "ural-yekaterinburg.png" },

    // ---------------- J1 LEAGUE (Japón) ----------------
    { id: "kashima-antlers", nombre: "Kashima Antlers", ligaId: "j1-liga", fuerza: 85, prestigio: 78, economia: 71, initials: "KA", a: "#e35205", b: "#111111", escudo: "kashima-antlers.png" },
    { id: "urawa-red-diamonds", nombre: "Urawa Red Diamonds", ligaId: "j1-liga", fuerza: 81, prestigio: 74, economia: 67, initials: "URD", a: "#1d428a", b: "#ffffff", escudo: "urawa-red-diamonds.png" },
    { id: "yokohama-f-marinos", nombre: "Yokohama F. Marinos", ligaId: "j1-liga", fuerza: 78, prestigio: 71, economia: 64, initials: "YFM", a: "#0b2265", b: "#c8102e", escudo: "yokohama-f-marinos.png" },
    { id: "kawasaki-frontale", nombre: "Kawasaki Frontale", ligaId: "j1-liga", fuerza: 68, prestigio: 59, economia: 56, initials: "KF", a: "#5f259f", b: "#ffffff", escudo: "kawasaki-frontale.png" },
    { id: "vissel-kobe", nombre: "Vissel Kobe", ligaId: "j1-liga", fuerza: 67, prestigio: 58, economia: 55, initials: "VK", a: "#e35205", b: "#111111", escudo: "vissel-kobe.png" },
    { id: "gamba-osaka", nombre: "Gamba Osaka", ligaId: "j1-liga", fuerza: 68, prestigio: 59, economia: 56, initials: "GO", a: "#e35205", b: "#111111", escudo: "gamba-osaka.png" },
    { id: "cerezo-osaka", nombre: "Cerezo Osaka", ligaId: "j1-liga", fuerza: 68, prestigio: 59, economia: 56, initials: "CO", a: "#5f259f", b: "#ffffff", escudo: "cerezo-osaka.png" },
    { id: "nagoya-grampus", nombre: "Nagoya Grampus", ligaId: "j1-liga", fuerza: 66, prestigio: 57, economia: 54, initials: "NG", a: "#c8102e", b: "#ffffff", escudo: "nagoya-grampus.png" },
    { id: "sanfrecce-hiroshima", nombre: "Sanfrecce Hiroshima", ligaId: "j1-liga", fuerza: 64, prestigio: 55, economia: 52, initials: "SH", a: "#6c1d45", b: "#ffffff", escudo: "sanfrecce-hiroshima.png" },
    { id: "fc-tokyo", nombre: "FC Tokyo", ligaId: "j1-liga", fuerza: 64, prestigio: 55, economia: 52, initials: "TOK", a: "#00843d", b: "#ffffff", escudo: "fc-tokyo.png" },
    { id: "kashiwa-reysol", nombre: "Kashiwa Reysol", ligaId: "j1-liga", fuerza: 48, prestigio: 39, economia: 38, initials: "KR", a: "#111111", b: "#f2c500", escudo: "kashiwa-reysol.png" },
    { id: "kyoto-sanga", nombre: "Kyoto Sanga", ligaId: "j1-liga", fuerza: 49, prestigio: 40, economia: 39, initials: "KS", a: "#111111", b: "#f2c500", escudo: "kyoto-sanga.png" },
    { id: "avispa-fukuoka", nombre: "Avispa Fukuoka", ligaId: "j1-liga", fuerza: 46, prestigio: 37, economia: 36, initials: "AF", a: "#5f259f", b: "#ffffff", escudo: "avispa-fukuoka.png" },
    { id: "tokyo-verdy", nombre: "Tokyo Verdy", ligaId: "j1-liga", fuerza: 45, prestigio: 36, economia: 35, initials: "TV", a: "#e35205", b: "#111111", escudo: "tokyo-verdy.png" },
    { id: "machida-zelvia", nombre: "Machida Zelvia", ligaId: "j1-liga", fuerza: 41, prestigio: 32, economia: 31, initials: "MZ", a: "#6c1d45", b: "#ffffff", escudo: "machida-zelvia.png" },
    { id: "fagiano-okayama", nombre: "Fagiano Okayama", ligaId: "j1-liga", fuerza: 44, prestigio: 35, economia: 34, initials: "FO", a: "#1d428a", b: "#ffffff", escudo: "fagiano-okayama.png" },
    { id: "shimizu-s-pulse", nombre: "Shimizu S-Pulse", ligaId: "j1-liga", fuerza: 47, prestigio: 38, economia: 37, initials: "SS", a: "#5f259f", b: "#ffffff", escudo: "shimizu-s-pulse.png" },
    { id: "albirex-niigata", nombre: "Albirex Niigata", ligaId: "j1-liga", fuerza: 46, prestigio: 37, economia: 36, initials: "AN", a: "#e35205", b: "#111111", escudo: "albirex-niigata.png" },
    { id: "shonan-bellmare", nombre: "Shonan Bellmare", ligaId: "j1-liga", fuerza: 50, prestigio: 41, economia: 40, initials: "SB", a: "#e35205", b: "#111111", escudo: "shonan-bellmare.png" },
    { id: "yokohama-fc", nombre: "Yokohama FC", ligaId: "j1-liga", fuerza: 47, prestigio: 38, economia: 37, initials: "YOK", a: "#0b2265", b: "#c8102e", escudo: "yokohama-fc.png" },

    // ---------------- SUPER LEAGUE CHINA (China) ----------------
    { id: "shanghai-port", nombre: "Shanghai Port", ligaId: "super-liga-china", fuerza: 72, prestigio: 67, economia: 63, initials: "SP", a: "#111111", b: "#f2c500", escudo: "shanghai-port.png" },
    { id: "beijing-guoan", nombre: "Beijing Guoan", ligaId: "super-liga-china", fuerza: 71, prestigio: 66, economia: 62, initials: "BG", a: "#6c1d45", b: "#ffffff", escudo: "beijing-guoan.png" },
    { id: "shandong-taishan", nombre: "Shandong Taishan", ligaId: "super-liga-china", fuerza: 60, prestigio: 53, economia: 53, initials: "ST", a: "#008542", b: "#111111", escudo: "shandong-taishan.png" },
    { id: "shanghai-shenhua", nombre: "Shanghai Shenhua", ligaId: "super-liga-china", fuerza: 60, prestigio: 53, economia: 53, initials: "SS", a: "#6c1d45", b: "#ffffff", escudo: "shanghai-shenhua.png" },
    { id: "chengdu-rongcheng", nombre: "Chengdu Rongcheng", ligaId: "super-liga-china", fuerza: 62, prestigio: 55, economia: 55, initials: "CR", a: "#5f259f", b: "#ffffff", escudo: "chengdu-rongcheng.png" },
    { id: "wuhan-three-towns", nombre: "Wuhan Three Towns", ligaId: "super-liga-china", fuerza: 56, prestigio: 49, economia: 49, initials: "WTT", a: "#0b2265", b: "#c8102e", escudo: "wuhan-three-towns.png" },
    { id: "zhejiang", nombre: "Zhejiang", ligaId: "super-liga-china", fuerza: 39, prestigio: 32, economia: 34, initials: "ZHE", a: "#e35205", b: "#111111", escudo: "zhejiang.png" },
    { id: "tianjin-jinmen-tiger", nombre: "Tianjin Jinmen Tiger", ligaId: "super-liga-china", fuerza: 39, prestigio: 32, economia: 34, initials: "TJT", a: "#c8102e", b: "#ffffff", escudo: "tianjin-jinmen-tiger.png" },
    { id: "henan-fc", nombre: "Henan FC", ligaId: "super-liga-china", fuerza: 40, prestigio: 33, economia: 35, initials: "HEN", a: "#5f259f", b: "#ffffff", escudo: "henan-fc.png" },
    { id: "dalian-yingbo", nombre: "Dalian Yingbo", ligaId: "super-liga-china", fuerza: 36, prestigio: 29, economia: 31, initials: "DY", a: "#c8102e", b: "#ffffff", escudo: "dalian-yingbo.png" },
    { id: "qingdao-west-coast", nombre: "Qingdao West Coast", ligaId: "super-liga-china", fuerza: 39, prestigio: 32, economia: 34, initials: "QWC", a: "#c8102e", b: "#ffffff", escudo: "qingdao-west-coast.png" },
    { id: "qingdao-hainiu", nombre: "Qingdao Hainiu", ligaId: "super-liga-china", fuerza: 37, prestigio: 30, economia: 32, initials: "QH", a: "#7a1010", b: "#111111", escudo: "qingdao-hainiu.png" },
    { id: "changchun-yatai", nombre: "Changchun Yatai", ligaId: "super-liga-china", fuerza: 36, prestigio: 29, economia: 31, initials: "CY", a: "#111111", b: "#f2c500", escudo: "changchun-yatai.png" },
    { id: "yunnan-yukun", nombre: "Yunnan Yukun", ligaId: "super-liga-china", fuerza: 35, prestigio: 28, economia: 30, initials: "YY", a: "#5f259f", b: "#ffffff", escudo: "yunnan-yukun.png" },
    { id: "guangzhou", nombre: "Guangzhou", ligaId: "super-liga-china", fuerza: 43, prestigio: 36, economia: 38, initials: "GUA", a: "#008542", b: "#111111", escudo: "guangzhou.png" },
    { id: "kunshan", nombre: "Kunshan", ligaId: "super-liga-china", fuerza: 38, prestigio: 31, economia: 33, initials: "KUN", a: "#00205b", b: "#ffffff", escudo: "kunshan.png" },

    // ---------------- LIGA 1 (Perú) ----------------
    { id: "universitario", nombre: "Universitario", ligaId: "liga1-peru", fuerza: 64, prestigio: 61, economia: 32, initials: "UNI", a: "#00843d", b: "#ffffff", escudo: "universitario.png" },
    { id: "alianza-lima", nombre: "Alianza Lima", ligaId: "liga1-peru", fuerza: 71, prestigio: 68, economia: 39, initials: "AL", a: "#6c1d45", b: "#ffffff", escudo: "alianza-lima.png" },
    { id: "sporting-cristal", nombre: "Sporting Cristal", ligaId: "liga1-peru", fuerza: 68, prestigio: 65, economia: 36, initials: "SC", a: "#0b2265", b: "#c8102e", escudo: "sporting-cristal.png" },
    { id: "cusco-fc", nombre: "Cusco FC", ligaId: "liga1-peru", fuerza: 50, prestigio: 45, economia: 20, initials: "CUS", a: "#1d428a", b: "#ffffff", escudo: "cusco-fc.png" },
    { id: "melgar", nombre: "Melgar", ligaId: "liga1-peru", fuerza: 49, prestigio: 44, economia: 19, initials: "MEL", a: "#e35205", b: "#111111", escudo: "melgar.png" },
    { id: "cienciano", nombre: "Cienciano", ligaId: "liga1-peru", fuerza: 54, prestigio: 49, economia: 24, initials: "CIE", a: "#009edb", b: "#ffffff", escudo: "cienciano.png" },
    { id: "deportivo-garcilaso", nombre: "Deportivo Garcilaso", ligaId: "liga1-peru", fuerza: 35, prestigio: 30, economia: 7, initials: "DG", a: "#0b2265", b: "#c8102e", escudo: "deportivo-garcilaso.png" },
    { id: "adt", nombre: "ADT", ligaId: "liga1-peru", fuerza: 27, prestigio: 22, economia: 0, initials: "ADT", a: "#c8102e", b: "#ffffff", escudo: "adt.png" },
    { id: "alianza-atletico", nombre: "Alianza Atlético", ligaId: "liga1-peru", fuerza: 36, prestigio: 31, economia: 8, initials: "AA", a: "#7a1010", b: "#111111", escudo: "alianza-atletico.png" },
    { id: "atletico-grau", nombre: "Atlético Grau", ligaId: "liga1-peru", fuerza: 33, prestigio: 28, economia: 5, initials: "AG", a: "#c8102e", b: "#ffffff", escudo: "atletico-grau.png" },
    { id: "comerciantes-unidos", nombre: "Comerciantes Unidos", ligaId: "liga1-peru", fuerza: 31, prestigio: 26, economia: 3, initials: "CU", a: "#1d428a", b: "#ffffff", escudo: "comerciantes-unidos.png" },
    { id: "los-chankas", nombre: "Los Chankas", ligaId: "liga1-peru", fuerza: 36, prestigio: 31, economia: 8, initials: "LC", a: "#5f259f", b: "#ffffff", escudo: "los-chankas.png" },
    { id: "sport-boys", nombre: "Sport Boys", ligaId: "liga1-peru", fuerza: 33, prestigio: 28, economia: 5, initials: "SB", a: "#008542", b: "#111111", escudo: "sport-boys.png" },
    { id: "sport-huancayo", nombre: "Sport Huancayo", ligaId: "liga1-peru", fuerza: 36, prestigio: 31, economia: 8, initials: "SH", a: "#111111", b: "#f2c500", escudo: "sport-huancayo.png" },
    { id: "utc", nombre: "UTC", ligaId: "liga1-peru", fuerza: 27, prestigio: 22, economia: 0, initials: "UTC", a: "#c8102e", b: "#ffffff", escudo: "utc.png" },
    { id: "fc-cajamarca", nombre: "FC Cajamarca", ligaId: "liga1-peru", fuerza: 33, prestigio: 28, economia: 5, initials: "CAJ", a: "#00205b", b: "#ffffff", escudo: "fc-cajamarca.png" },
    { id: "deportivo-moquegua", nombre: "Deportivo Moquegua", ligaId: "liga1-peru", fuerza: 32, prestigio: 27, economia: 4, initials: "DM", a: "#6c1d45", b: "#ffffff", escudo: "deportivo-moquegua.png" },
    { id: "juan-pablo-ii-college", nombre: "Juan Pablo II College", ligaId: "liga1-peru", fuerza: 32, prestigio: 27, economia: 4, initials: "JPI", a: "#0b2265", b: "#c8102e", escudo: "juan-pablo-ii-college.png" },

    // ---------------- PRIMERA DIVISIÓN (Bolivia) ----------------
    { id: "bolivar", nombre: "Bolívar", ligaId: "primera-division-bolivia", fuerza: 61, prestigio: 57, economia: 32, initials: "BOL", a: "#c8102e", b: "#ffffff", escudo: "bolivar.png" },
    { id: "the-strongest", nombre: "The Strongest", ligaId: "primera-division-bolivia", fuerza: 60, prestigio: 56, economia: 31, initials: "TS", a: "#00205b", b: "#ffffff", escudo: "the-strongest.png" },
    { id: "always-ready", nombre: "Always Ready", ligaId: "primera-division-bolivia", fuerza: 43, prestigio: 37, economia: 16, initials: "AR", a: "#6c1d45", b: "#ffffff", escudo: "always-ready.png" },
    { id: "blooming", nombre: "Blooming", ligaId: "primera-division-bolivia", fuerza: 44, prestigio: 38, economia: 17, initials: "BLO", a: "#00205b", b: "#ffffff", escudo: "blooming.png" },
    { id: "oriente-petrolero", nombre: "Oriente Petrolero", ligaId: "primera-division-bolivia", fuerza: 43, prestigio: 37, economia: 16, initials: "OP", a: "#6c1d45", b: "#ffffff", escudo: "oriente-petrolero.png" },
    { id: "aurora", nombre: "Aurora", ligaId: "primera-division-bolivia", fuerza: 29, prestigio: 23, economia: 4, initials: "AUR", a: "#e35205", b: "#111111", escudo: "aurora.png" },
    { id: "independiente-petrolero", nombre: "Independiente Petrolero", ligaId: "primera-division-bolivia", fuerza: 24, prestigio: 18, economia: 0, initials: "IP", a: "#c8102e", b: "#ffffff", escudo: "independiente-petrolero.png" },
    { id: "nacional-potosi", nombre: "Nacional Potosí", ligaId: "primera-division-bolivia", fuerza: 28, prestigio: 22, economia: 3, initials: "NP", a: "#00843d", b: "#ffffff", escudo: "nacional-potosi.png" },
    { id: "real-potosi", nombre: "Real Potosí", ligaId: "primera-division-bolivia", fuerza: 26, prestigio: 20, economia: 1, initials: "RP", a: "#5f259f", b: "#ffffff", escudo: "real-potosi.png" },
    { id: "real-oruro", nombre: "Real Oruro", ligaId: "primera-division-bolivia", fuerza: 29, prestigio: 23, economia: 4, initials: "RO", a: "#111111", b: "#f2c500", escudo: "real-oruro.png" },
    { id: "real-tomayapo", nombre: "Real Tomayapo", ligaId: "primera-division-bolivia", fuerza: 29, prestigio: 23, economia: 4, initials: "RT", a: "#009edb", b: "#ffffff", escudo: "real-tomayapo.png" },
    { id: "guabira", nombre: "Guabirá", ligaId: "primera-division-bolivia", fuerza: 27, prestigio: 21, economia: 2, initials: "GUA", a: "#1d428a", b: "#ffffff", escudo: "guabira.png" },
    { id: "universitario-de-vinto", nombre: "Universitario de Vinto", ligaId: "primera-division-bolivia", fuerza: 24, prestigio: 18, economia: 0, initials: "UV", a: "#111111", b: "#f2c500", escudo: "universitario-de-vinto.png" },
    { id: "academia-del-balompie", nombre: "Academia del Balompié", ligaId: "primera-division-bolivia", fuerza: 24, prestigio: 18, economia: 0, initials: "AB", a: "#e35205", b: "#111111", escudo: "academia-del-balompie.png" },
    { id: "gv-san-jose", nombre: "GV San José", ligaId: "primera-division-bolivia", fuerza: 28, prestigio: 22, economia: 3, initials: "GSJ", a: "#c8102e", b: "#ffffff", escudo: "gv-san-jose.png" },
    { id: "san-antonio-bulo-bulo", nombre: "San Antonio Bulo Bulo", ligaId: "primera-division-bolivia", fuerza: 30, prestigio: 24, economia: 5, initials: "SAB", a: "#008542", b: "#111111", escudo: "san-antonio-bulo-bulo.png" },

    // ---------------- PRIMERA DIVISIÓN (Chile) ----------------
    { id: "colo-colo", nombre: "Colo-Colo", ligaId: "primera-division-chile", fuerza: 83, prestigio: 85, economia: 51, initials: "COL", a: "#0b2265", b: "#c8102e", escudo: "colo-colo.png" },
    { id: "universidad-de-chile", nombre: "Universidad de Chile", ligaId: "primera-division-chile", fuerza: 81, prestigio: 83, economia: 49, initials: "UC", a: "#c8102e", b: "#ffffff", escudo: "universidad-de-chile.png" },
    { id: "universidad-catolica", nombre: "Universidad Católica", ligaId: "primera-division-chile", fuerza: 76, prestigio: 78, economia: 44, initials: "UC", a: "#111111", b: "#f2c500", escudo: "universidad-catolica.png" },
    { id: "huachipato", nombre: "Huachipato", ligaId: "primera-division-chile", fuerza: 66, prestigio: 66, economia: 36, initials: "HUA", a: "#009edb", b: "#ffffff", escudo: "huachipato.png" },
    { id: "cobresal", nombre: "Cobresal", ligaId: "primera-division-chile", fuerza: 63, prestigio: 63, economia: 33, initials: "COB", a: "#5f259f", b: "#ffffff", escudo: "cobresal.png" },
    { id: "palestino", nombre: "Palestino", ligaId: "primera-division-chile", fuerza: 64, prestigio: 64, economia: 34, initials: "PAL", a: "#00843d", b: "#ffffff", escudo: "palestino.png" },
    { id: "everton-cl", nombre: "Everton", ligaId: "primera-division-chile", fuerza: 47, prestigio: 47, economia: 19, initials: "EVE", a: "#c8102e", b: "#ffffff", escudo: "everton-cl.png" },
    { id: "nublense", nombre: "Ñublense", ligaId: "primera-division-chile", fuerza: 41, prestigio: 41, economia: 13, initials: "ÑUB", a: "#0b2265", b: "#c8102e", escudo: "nublense.png" },
    { id: "o-higgins", nombre: "O'Higgins", ligaId: "primera-division-chile", fuerza: 45, prestigio: 45, economia: 17, initials: "OHI", a: "#5f259f", b: "#ffffff", escudo: "o-higgins.png" },
    { id: "union-la-calera", nombre: "Unión La Calera", ligaId: "primera-division-chile", fuerza: 48, prestigio: 48, economia: 20, initials: "UC", a: "#1d428a", b: "#ffffff", escudo: "union-la-calera.png" },
    { id: "audax-italiano", nombre: "Audax Italiano", ligaId: "primera-division-chile", fuerza: 47, prestigio: 47, economia: 19, initials: "AI", a: "#5f259f", b: "#ffffff", escudo: "audax-italiano.png" },
    { id: "coquimbo-unido", nombre: "Coquimbo Unido", ligaId: "primera-division-chile", fuerza: 44, prestigio: 44, economia: 16, initials: "CU", a: "#009edb", b: "#ffffff", escudo: "coquimbo-unido.png" },
    { id: "deportes-la-serena", nombre: "Deportes La Serena", ligaId: "primera-division-chile", fuerza: 39, prestigio: 39, economia: 11, initials: "DS", a: "#5f259f", b: "#ffffff", escudo: "deportes-la-serena.png" },
    { id: "deportes-concepcion", nombre: "Deportes Concepción", ligaId: "primera-division-chile", fuerza: 43, prestigio: 43, economia: 15, initials: "DC", a: "#6c1d45", b: "#ffffff", escudo: "deportes-concepcion.png" },
    { id: "deportes-limache", nombre: "Deportes Limache", ligaId: "primera-division-chile", fuerza: 42, prestigio: 42, economia: 14, initials: "DL", a: "#008542", b: "#111111", escudo: "deportes-limache.png" },
    { id: "universidad-de-concepcion", nombre: "Universidad de Concepción", ligaId: "primera-division-chile", fuerza: 42, prestigio: 42, economia: 14, initials: "UC", a: "#008542", b: "#111111", escudo: "universidad-de-concepcion.png" },

    // ---------------- PRIMERA DIVISIÓN (Uruguay) ----------------
    { id: "penarol", nombre: "Peñarol", ligaId: "primera-division-uruguay", fuerza: 80, prestigio: 88, economia: 36, initials: "PEÑ", a: "#00205b", b: "#ffffff", escudo: "penarol.png" },
    { id: "nacional-uy", nombre: "Nacional", ligaId: "primera-division-uruguay", fuerza: 83, prestigio: 91, economia: 39, initials: "NAC", a: "#00843d", b: "#ffffff", escudo: "nacional-uy.png" },
    { id: "defensor-sporting", nombre: "Defensor Sporting", ligaId: "primera-division-uruguay", fuerza: 68, prestigio: 74, economia: 26, initials: "DS", a: "#7a1010", b: "#111111", escudo: "defensor-sporting.png" },
    { id: "danubio", nombre: "Danubio", ligaId: "primera-division-uruguay", fuerza: 67, prestigio: 73, economia: 25, initials: "DAN", a: "#7a1010", b: "#111111", escudo: "danubio.png" },
    { id: "liverpool-fc", nombre: "Liverpool FC", ligaId: "primera-division-uruguay", fuerza: 73, prestigio: 79, economia: 31, initials: "LIV", a: "#009edb", b: "#ffffff", escudo: "liverpool-fc.png" },
    { id: "wanderers", nombre: "Wanderers", ligaId: "primera-division-uruguay", fuerza: 50, prestigio: 56, economia: 10, initials: "WAN", a: "#e35205", b: "#111111", escudo: "wanderers.png" },
    { id: "racing", nombre: "Racing", ligaId: "primera-division-uruguay", fuerza: 45, prestigio: 51, economia: 5, initials: "RAC", a: "#5f259f", b: "#ffffff", escudo: "racing.png" },
    { id: "cerro", nombre: "Cerro", ligaId: "primera-division-uruguay", fuerza: 50, prestigio: 56, economia: 10, initials: "CER", a: "#c8102e", b: "#ffffff", escudo: "cerro.png" },
    { id: "cerro-largo", nombre: "Cerro Largo", ligaId: "primera-division-uruguay", fuerza: 49, prestigio: 55, economia: 9, initials: "CL", a: "#009edb", b: "#ffffff", escudo: "cerro-largo.png" },
    { id: "boston-river", nombre: "Boston River", ligaId: "primera-division-uruguay", fuerza: 45, prestigio: 51, economia: 5, initials: "BR", a: "#009edb", b: "#ffffff", escudo: "boston-river.png" },
    { id: "progreso", nombre: "Progreso", ligaId: "primera-division-uruguay", fuerza: 51, prestigio: 57, economia: 11, initials: "PRO", a: "#5f259f", b: "#ffffff", escudo: "progreso.png" },
    { id: "juventud", nombre: "Juventud", ligaId: "primera-division-uruguay", fuerza: 52, prestigio: 58, economia: 12, initials: "JUV", a: "#008542", b: "#111111", escudo: "juventud.png" },
    { id: "deportivo-maldonado", nombre: "Deportivo Maldonado", ligaId: "primera-division-uruguay", fuerza: 46, prestigio: 52, economia: 6, initials: "DM", a: "#e35205", b: "#111111", escudo: "deportivo-maldonado.png" },
    { id: "central-espanol", nombre: "Central Español", ligaId: "primera-division-uruguay", fuerza: 46, prestigio: 52, economia: 6, initials: "CE", a: "#00843d", b: "#ffffff", escudo: "central-espanol.png" },
    { id: "montevideo-city-torque", nombre: "Montevideo City", ligaId: "primera-division-uruguay", fuerza: 47, prestigio: 53, economia: 7, initials: "MCT", a: "#00205b", b: "#ffffff", escudo: "montevideo-city-torque.png" },
    { id: "albion", nombre: "Albion", ligaId: "primera-division-uruguay", fuerza: 51, prestigio: 57, economia: 11, initials: "ALB", a: "#e35205", b: "#111111", escudo: "albion.png" },

    // ---------------- PRIMERA DIVISIÓN (Venezuela) ----------------
    { id: "caracas-fc", nombre: "Caracas", ligaId: "primera-division-venezuela", fuerza: 66, prestigio: 57, economia: 36, initials: "CAR", a: "#6c1d45", b: "#ffffff", escudo: "caracas-fc.png" },
    { id: "deportivo-tachira", nombre: "Deportivo Táchira", ligaId: "primera-division-venezuela", fuerza: 64, prestigio: 55, economia: 34, initials: "DT", a: "#111111", b: "#f2c500", escudo: "deportivo-tachira.png" },
    { id: "estudiantes-de-merida", nombre: "Estudiantes de Mérida", ligaId: "primera-division-venezuela", fuerza: 44, prestigio: 33, economia: 16, initials: "EM", a: "#c8102e", b: "#ffffff", escudo: "estudiantes-de-merida.png" },
    { id: "metropolitanos-fc", nombre: "Metropolitanos", ligaId: "primera-division-venezuela", fuerza: 47, prestigio: 36, economia: 19, initials: "MET", a: "#e35205", b: "#111111", escudo: "metropolitanos-fc.png" },
    { id: "monagas-sc", nombre: "Monagas", ligaId: "primera-division-venezuela", fuerza: 46, prestigio: 35, economia: 18, initials: "MON", a: "#e35205", b: "#111111", escudo: "monagas-sc.png" },
    { id: "zamora-fc", nombre: "Zamora", ligaId: "primera-division-venezuela", fuerza: 28, prestigio: 17, economia: 2, initials: "ZAM", a: "#111111", b: "#f2c500", escudo: "zamora-fc.png" },
    { id: "carabobo-fc", nombre: "Carabobo", ligaId: "primera-division-venezuela", fuerza: 30, prestigio: 19, economia: 4, initials: "CAR", a: "#009edb", b: "#ffffff", escudo: "carabobo-fc.png" },
    { id: "mineros-de-guayana", nombre: "Mineros de Guayana", ligaId: "primera-division-venezuela", fuerza: 28, prestigio: 17, economia: 2, initials: "MG", a: "#c8102e", b: "#ffffff", escudo: "mineros-de-guayana.png" },
    { id: "la-guaira-fc", nombre: "La Guaira", ligaId: "primera-division-venezuela", fuerza: 29, prestigio: 18, economia: 3, initials: "GUA", a: "#009edb", b: "#ffffff", escudo: "la-guaira-fc.png" },
    { id: "portuguesa-fc", nombre: "Portuguesa", ligaId: "primera-division-venezuela", fuerza: 29, prestigio: 18, economia: 3, initials: "POR", a: "#1d428a", b: "#ffffff", escudo: "portuguesa-fc.png" },
    { id: "academia-puerto-cabello", nombre: "Academia Puerto Cabello", ligaId: "primera-division-venezuela", fuerza: 26, prestigio: 15, economia: 0, initials: "APC", a: "#1d428a", b: "#ffffff", escudo: "academia-puerto-cabello.png" },
    { id: "anzoategui", nombre: "Anzoátegui", ligaId: "primera-division-venezuela", fuerza: 32, prestigio: 21, economia: 6, initials: "ANZ", a: "#7a1010", b: "#111111", escudo: "anzoategui.png" },
    { id: "rayo-zuliano", nombre: "Rayo Zuliano", ligaId: "primera-division-venezuela", fuerza: 32, prestigio: 21, economia: 6, initials: "RZ", a: "#00205b", b: "#ffffff", escudo: "rayo-zuliano.png" },
    { id: "trujillanos-fc", nombre: "Trujillanos", ligaId: "primera-division-venezuela", fuerza: 23, prestigio: 12, economia: 0, initials: "TRU", a: "#1d428a", b: "#ffffff", escudo: "trujillanos-fc.png" },
    { id: "universidad-central", nombre: "Universidad Central", ligaId: "primera-division-venezuela", fuerza: 24, prestigio: 13, economia: 0, initials: "UC", a: "#00205b", b: "#ffffff", escudo: "universidad-central.png" },

    // ---------------- SERIE A (Ecuador) ----------------
    { id: "barcelona-sc", nombre: "Barcelona", ligaId: "serie-a-ecuador", fuerza: 71, prestigio: 65, economia: 35, initials: "BAR", a: "#009edb", b: "#ffffff", escudo: "barcelona-sc.png" },
    { id: "ldu-quito", nombre: "LDU Quito", ligaId: "serie-a-ecuador", fuerza: 76, prestigio: 70, economia: 40, initials: "LQ", a: "#6c1d45", b: "#ffffff", escudo: "ldu-quito.png" },
    { id: "independiente-del-valle", nombre: "Independiente del Valle", ligaId: "serie-a-ecuador", fuerza: 75, prestigio: 69, economia: 39, initials: "IV", a: "#c8102e", b: "#ffffff", escudo: "independiente-del-valle.png" },
    { id: "emelec", nombre: "Emelec", ligaId: "serie-a-ecuador", fuerza: 61, prestigio: 53, economia: 27, initials: "EME", a: "#e35205", b: "#111111", escudo: "emelec.png" },
    { id: "aucas", nombre: "Aucas", ligaId: "serie-a-ecuador", fuerza: 62, prestigio: 54, economia: 28, initials: "AUC", a: "#c8102e", b: "#ffffff", escudo: "aucas.png" },
    { id: "universidad-catolica-ec", nombre: "Universidad Católica", ligaId: "serie-a-ecuador", fuerza: 58, prestigio: 50, economia: 24, initials: "UC", a: "#e35205", b: "#111111", escudo: "universidad-catolica-ec.png" },
    { id: "delfin-sc", nombre: "Delfín", ligaId: "serie-a-ecuador", fuerza: 40, prestigio: 32, economia: 8, initials: "DEL", a: "#008542", b: "#111111", escudo: "delfin-sc.png" },
    { id: "deportivo-cuenca", nombre: "Deportivo Cuenca", ligaId: "serie-a-ecuador", fuerza: 44, prestigio: 36, economia: 12, initials: "DC", a: "#111111", b: "#f2c500", escudo: "deportivo-cuenca.png" },
    { id: "macara", nombre: "Macará", ligaId: "serie-a-ecuador", fuerza: 37, prestigio: 29, economia: 5, initials: "MAC", a: "#e35205", b: "#111111", escudo: "macara.png" },
    { id: "orense-sc", nombre: "Orense", ligaId: "serie-a-ecuador", fuerza: 39, prestigio: 31, economia: 7, initials: "ORE", a: "#00843d", b: "#ffffff", escudo: "orense-sc.png" },
    { id: "mushuc-runa", nombre: "Mushuc Runa", ligaId: "serie-a-ecuador", fuerza: 41, prestigio: 33, economia: 9, initials: "MR", a: "#e35205", b: "#111111", escudo: "mushuc-runa.png" },
    { id: "manta-fc", nombre: "Manta", ligaId: "serie-a-ecuador", fuerza: 35, prestigio: 27, economia: 3, initials: "MAN", a: "#c8102e", b: "#ffffff", escudo: "manta-fc.png" },
    { id: "guayaquil-city", nombre: "Guayaquil City", ligaId: "serie-a-ecuador", fuerza: 41, prestigio: 33, economia: 9, initials: "GC", a: "#1d428a", b: "#ffffff", escudo: "guayaquil-city.png" },
    { id: "leones-fc", nombre: "Leones", ligaId: "serie-a-ecuador", fuerza: 35, prestigio: 27, economia: 3, initials: "LEO", a: "#00843d", b: "#ffffff", escudo: "leones-fc.png" },
    { id: "libertad-fc", nombre: "Libertad", ligaId: "serie-a-ecuador", fuerza: 37, prestigio: 29, economia: 5, initials: "LIB", a: "#1d428a", b: "#ffffff", escudo: "libertad-fc.png" },

    // ---------------- PRIMERA DIVISIÓN (Costa Rica) ----------------
    { id: "deportivo-saprissa", nombre: "Saprissa", ligaId: "primera-division-costa-rica", fuerza: 68, prestigio: 64, economia: 39, initials: "DS", a: "#1d428a", b: "#ffffff", escudo: "deportivo-saprissa.png" },
    { id: "alajuelense", nombre: "Alajuelense", ligaId: "primera-division-costa-rica", fuerza: 75, prestigio: 71, economia: 46, initials: "ALA", a: "#009edb", b: "#ffffff", escudo: "alajuelense.png" },
    { id: "herediano", nombre: "Herediano", ligaId: "primera-division-costa-rica", fuerza: 57, prestigio: 51, economia: 30, initials: "HER", a: "#0b2265", b: "#c8102e", escudo: "herediano.png" },
    { id: "cartagines", nombre: "Cartaginés", ligaId: "primera-division-costa-rica", fuerza: 61, prestigio: 55, economia: 34, initials: "CAR", a: "#009edb", b: "#ffffff", escudo: "cartagines.png" },
    { id: "perez-zeledon", nombre: "Pérez Zeledón", ligaId: "primera-division-costa-rica", fuerza: 38, prestigio: 32, economia: 13, initials: "PZ", a: "#00205b", b: "#ffffff", escudo: "perez-zeledon.png" },
    { id: "san-carlos", nombre: "San Carlos", ligaId: "primera-division-costa-rica", fuerza: 36, prestigio: 30, economia: 11, initials: "SC", a: "#009edb", b: "#ffffff", escudo: "san-carlos.png" },
    { id: "puntarenas-fc", nombre: "Puntarenas", ligaId: "primera-division-costa-rica", fuerza: 37, prestigio: 31, economia: 12, initials: "PUN", a: "#6c1d45", b: "#ffffff", escudo: "puntarenas-fc.png" },
    { id: "sporting-san-jose", nombre: "Sporting San José", ligaId: "primera-division-costa-rica", fuerza: 39, prestigio: 33, economia: 14, initials: "SSJ", a: "#0b2265", b: "#c8102e", escudo: "sporting-san-jose.png" },
    { id: "inter-san-carlos", nombre: "Inter San Carlos", ligaId: "primera-division-costa-rica", fuerza: 40, prestigio: 34, economia: 15, initials: "ISC", a: "#e35205", b: "#111111", escudo: "inter-san-carlos.png" },
    { id: "escorpiones", nombre: "Escorpiones", ligaId: "primera-division-costa-rica", fuerza: 39, prestigio: 33, economia: 14, initials: "ESC", a: "#00843d", b: "#ffffff", escudo: "escorpiones.png" },

    // ---------------- PRIMERA DIVISIÓN (Paraguay) ----------------
    { id: "olimpia", nombre: "Olimpia", ligaId: "primera-division-paraguay", fuerza: 66, prestigio: 70, economia: 30, initials: "OLI", a: "#e35205", b: "#111111", escudo: "olimpia.png" },
    { id: "cerro-porteno", nombre: "Cerro Porteño", ligaId: "primera-division-paraguay", fuerza: 68, prestigio: 72, economia: 32, initials: "CP", a: "#5f259f", b: "#ffffff", escudo: "cerro-porteno.png" },
    { id: "libertad", nombre: "Libertad", ligaId: "primera-division-paraguay", fuerza: 50, prestigio: 52, economia: 16, initials: "LIB", a: "#00843d", b: "#ffffff", escudo: "libertad.png" },
    { id: "nacional-py", nombre: "Nacional", ligaId: "primera-division-paraguay", fuerza: 53, prestigio: 55, economia: 19, initials: "NAC", a: "#00843d", b: "#ffffff", escudo: "nacional-py.png" },
    { id: "guarani", nombre: "Guaraní", ligaId: "primera-division-paraguay", fuerza: 55, prestigio: 57, economia: 21, initials: "GUA", a: "#1d428a", b: "#ffffff", escudo: "guarani.png" },
    { id: "sportivo-luqueno", nombre: "Sportivo Luqueño", ligaId: "primera-division-paraguay", fuerza: 30, prestigio: 32, economia: 0, initials: "SL", a: "#6c1d45", b: "#ffffff", escudo: "sportivo-luqueno.png" },
    { id: "sportivo-ameliano", nombre: "Sportivo Ameliano", ligaId: "primera-division-paraguay", fuerza: 36, prestigio: 38, economia: 4, initials: "SA", a: "#00205b", b: "#ffffff", escudo: "sportivo-ameliano.png" },
    { id: "deportivo-recoleta", nombre: "Deportivo Recoleta", ligaId: "primera-division-paraguay", fuerza: 34, prestigio: 36, economia: 2, initials: "DR", a: "#0b2265", b: "#c8102e", escudo: "deportivo-recoleta.png" },
    { id: "trinidense", nombre: "Trinidense", ligaId: "primera-division-paraguay", fuerza: 30, prestigio: 32, economia: 0, initials: "TRI", a: "#5f259f", b: "#ffffff", escudo: "trinidense.png" },
    { id: "2-de-mayo", nombre: "2 de Mayo", ligaId: "primera-division-paraguay", fuerza: 34, prestigio: 36, economia: 2, initials: "MAY", a: "#009edb", b: "#ffffff", escudo: "2-de-mayo.png" },
    { id: "atletico-tembetary", nombre: "Atlético Tembetary", ligaId: "primera-division-paraguay", fuerza: 34, prestigio: 36, economia: 2, initials: "AT", a: "#6c1d45", b: "#ffffff", escudo: "atletico-tembetary.png" },
    { id: "general-caballero", nombre: "General Caballero", ligaId: "primera-division-paraguay", fuerza: 38, prestigio: 40, economia: 6, initials: "GC", a: "#e35205", b: "#111111", escudo: "general-caballero.png" },

    // ---------------- PRIMERA DIVISIÓN (El Salvador) ----------------
    { id: "alianza-fc", nombre: "Alianza", ligaId: "primera-division-el-salvador", fuerza: 61, prestigio: 55, economia: 29, initials: "ALI", a: "#009edb", b: "#ffffff", escudo: "alianza-fc.png" },
    { id: "c-d-fas", nombre: "FAS", ligaId: "primera-division-el-salvador", fuerza: 60, prestigio: 54, economia: 28, initials: "FAS", a: "#5f259f", b: "#ffffff", escudo: "c-d-fas.png" },
    { id: "c-d-aguila", nombre: "Águila", ligaId: "primera-division-el-salvador", fuerza: 48, prestigio: 40, economia: 18, initials: "ÁGU", a: "#c8102e", b: "#ffffff", escudo: "c-d-aguila.png" },
    { id: "isidro-metapan", nombre: "Isidro Metapán", ligaId: "primera-division-el-salvador", fuerza: 46, prestigio: 38, economia: 16, initials: "IM", a: "#6c1d45", b: "#ffffff", escudo: "isidro-metapan.png" },
    { id: "santa-tecla-fc", nombre: "Santa Tecla", ligaId: "primera-division-el-salvador", fuerza: 49, prestigio: 41, economia: 19, initials: "ST", a: "#00205b", b: "#ffffff", escudo: "santa-tecla-fc.png" },
    { id: "once-deportivo", nombre: "Once Deportivo", ligaId: "primera-division-el-salvador", fuerza: 28, prestigio: 20, economia: 0, initials: "OD", a: "#00205b", b: "#ffffff", escudo: "once-deportivo.png" },
    { id: "c-d-platense", nombre: "Platense", ligaId: "primera-division-el-salvador", fuerza: 25, prestigio: 17, economia: 0, initials: "PLA", a: "#c8102e", b: "#ffffff", escudo: "c-d-platense.png" },
    { id: "municipal-limeno", nombre: "Municipal Limeño", ligaId: "primera-division-el-salvador", fuerza: 29, prestigio: 21, economia: 1, initials: "ML", a: "#008542", b: "#111111", escudo: "municipal-limeno.png" },
    { id: "c-d-dragon", nombre: "Dragón", ligaId: "primera-division-el-salvador", fuerza: 24, prestigio: 16, economia: 0, initials: "DRA", a: "#1d428a", b: "#ffffff", escudo: "c-d-dragon.png" },
    { id: "la-firpo", nombre: "La Firpo", ligaId: "primera-division-el-salvador", fuerza: 32, prestigio: 24, economia: 4, initials: "FIR", a: "#00843d", b: "#ffffff", escudo: "la-firpo.png" },
    { id: "fuerte-san-francisco", nombre: "Fuerte San Francisco", ligaId: "primera-division-el-salvador", fuerza: 26, prestigio: 18, economia: 0, initials: "FSF", a: "#00843d", b: "#ffffff", escudo: "fuerte-san-francisco.png" },
    { id: "cacahuatique", nombre: "Cacahuatique", ligaId: "primera-division-el-salvador", fuerza: 31, prestigio: 23, economia: 3, initials: "CAC", a: "#1d428a", b: "#ffffff", escudo: "cacahuatique.png" },

    // ---------------- LIGA PREMIER DE UCRANIA (Ucrania) ----------------
    { id: "shakhtar-donetsk", nombre: "Shakhtar Donetsk", ligaId: "liga-premier-ucrania", fuerza: 81, prestigio: 79, economia: 45, initials: "SD", a: "#008542", b: "#111111", escudo: "shakhtar-donetsk.png" },
    { id: "dynamo-kyiv", nombre: "Dynamo Kyiv", ligaId: "liga-premier-ucrania", fuerza: 79, prestigio: 77, economia: 43, initials: "DK", a: "#008542", b: "#111111", escudo: "dynamo-kyiv.png" },
    { id: "oleksandriya", nombre: "Oleksandriya", ligaId: "liga-premier-ucrania", fuerza: 72, prestigio: 68, economia: 38, initials: "OLE", a: "#008542", b: "#111111", escudo: "oleksandriya.png" },
    { id: "zorya-luhansk", nombre: "Zorya Luhansk", ligaId: "liga-premier-ucrania", fuerza: 65, prestigio: 61, economia: 31, initials: "ZL", a: "#111111", b: "#f2c500", escudo: "zorya-luhansk.png" },
    { id: "polissya-zhytomyr", nombre: "Polissya Zhytomyr", ligaId: "liga-premier-ucrania", fuerza: 66, prestigio: 62, economia: 32, initials: "PZ", a: "#c8102e", b: "#ffffff", escudo: "polissya-zhytomyr.png" },
    { id: "kryvbas-kryvyi-rih", nombre: "Kryvbas Kryvyi Rih", ligaId: "liga-premier-ucrania", fuerza: 71, prestigio: 67, economia: 37, initials: "KKR", a: "#c8102e", b: "#ffffff", escudo: "kryvbas-kryvyi-rih.png" },
    { id: "vorskla-poltava", nombre: "Vorskla Poltava", ligaId: "liga-premier-ucrania", fuerza: 47, prestigio: 43, economia: 15, initials: "VP", a: "#6c1d45", b: "#ffffff", escudo: "vorskla-poltava.png" },
    { id: "rukh-lviv", nombre: "Rukh Lviv", ligaId: "liga-premier-ucrania", fuerza: 51, prestigio: 47, economia: 19, initials: "RL", a: "#111111", b: "#f2c500", escudo: "rukh-lviv.png" },
    { id: "karpaty-lviv", nombre: "Karpaty Lviv", ligaId: "liga-premier-ucrania", fuerza: 47, prestigio: 43, economia: 15, initials: "KL", a: "#0b2265", b: "#c8102e", escudo: "karpaty-lviv.png" },
    { id: "veres-rivne", nombre: "Veres Rivne", ligaId: "liga-premier-ucrania", fuerza: 46, prestigio: 42, economia: 14, initials: "VR", a: "#1d428a", b: "#ffffff", escudo: "veres-rivne.png" },
    { id: "obolon-kyiv", nombre: "Obolon Kyiv", ligaId: "liga-premier-ucrania", fuerza: 52, prestigio: 48, economia: 20, initials: "OK", a: "#00205b", b: "#ffffff", escudo: "obolon-kyiv.png" },
    { id: "kolos-kovalivka", nombre: "Kolos Kovalivka", ligaId: "liga-premier-ucrania", fuerza: 49, prestigio: 45, economia: 17, initials: "KK", a: "#7a1010", b: "#111111", escudo: "kolos-kovalivka.png" },
    { id: "kudrivka", nombre: "Kudrivka", ligaId: "liga-premier-ucrania", fuerza: 52, prestigio: 48, economia: 20, initials: "KUD", a: "#111111", b: "#f2c500", escudo: "kudrivka.png" },
    { id: "lnz-cherkasy", nombre: "LNZ Cherkasy", ligaId: "liga-premier-ucrania", fuerza: 43, prestigio: 39, economia: 11, initials: "LC", a: "#c8102e", b: "#ffffff", escudo: "lnz-cherkasy.png" },
    { id: "epicentr-kamianets-podilskyi", nombre: "Epicentr Kamianets-Podilskyi", ligaId: "liga-premier-ucrania", fuerza: 50, prestigio: 46, economia: 18, initials: "EK", a: "#6c1d45", b: "#ffffff", escudo: "epicentr-kamianets-podilskyi.png" },
    { id: "metalist-1925-kharkiv", nombre: "Metalist 1925 Kharkiv", ligaId: "liga-premier-ucrania", fuerza: 49, prestigio: 45, economia: 17, initials: "MK", a: "#e35205", b: "#111111", escudo: "metalist-1925-kharkiv.png" },

  ],

  // ---------------- COMPETICIONES ----------------
  // Todavía no se usan en el motor de la carrera (`carrera.js`) — es
  // solo el formato y los datos base. Más adelante esto define qué
  // trofeos puede ganar un jugador según su liga/equipo y cuántos
  // partidos suma cada competición al calendario de la temporada.
  competiciones: [
    // -------- DOMÉSTICAS: LIGA (una por cada liga ya cargada) --------
    // partidosExtra siempre 0: una liga no tiene rondas eliminatorias,
    // todos los partidos de la temporada regular son "mínimos".
    { id: "liga-premier-league", nombre: "Premier League", tipo: "domestica", categoria: "liga", ligaId: "premier-league", trofeoImagen: "liga-premier-league.png", partidosMinimos: 38, partidosExtra: 0 },
    { id: "liga-la-liga", nombre: "La Liga", tipo: "domestica", categoria: "liga", ligaId: "la-liga", trofeoImagen: "liga-la-liga.png", partidosMinimos: 38, partidosExtra: 0 },
    { id: "liga-serie-a", nombre: "Serie A", tipo: "domestica", categoria: "liga", ligaId: "serie-a", trofeoImagen: "liga-serie-a.png", partidosMinimos: 38, partidosExtra: 0 },
    { id: "liga-bundesliga", nombre: "Bundesliga", tipo: "domestica", categoria: "liga", ligaId: "bundesliga", trofeoImagen: "liga-bundesliga.png", partidosMinimos: 34, partidosExtra: 0 },
    { id: "liga-ligue-1", nombre: "Ligue 1", tipo: "domestica", categoria: "liga", ligaId: "ligue-1", trofeoImagen: "liga-ligue-1.png", partidosMinimos: 34, partidosExtra: 0 },
    { id: "liga-brasileirao", nombre: "Brasileirão Série A", tipo: "domestica", categoria: "liga", ligaId: "brasileirao", trofeoImagen: "liga-brasileirao.png", partidosMinimos: 38, partidosExtra: 0 },
    // Argentina reformó el formato varias veces en los últimos años
    // (zonas, reclasificación, etc.) — 27 es una referencia realista de
    // una temporada de todos contra todos a una rueda con ~28 equipos,
    // no un número oficial fijo.
    { id: "liga-primera-division-argentina", nombre: "Primera División Argentina", tipo: "domestica", categoria: "liga", ligaId: "primera-division-argentina", trofeoImagen: "liga-primera-division-argentina.png", partidosMinimos: 27, partidosExtra: 0 },
    // México: Apertura + Clausura, 17 partidos de fase regular cada uno
    // (34 en total); partidosExtra cubre la Liguilla (cuartos, semis y
    // final a doble partido) de ambos torneos si se llega a las dos.
    { id: "liga-liga-mx", nombre: "Liga MX", tipo: "domestica", categoria: "liga", ligaId: "liga-mx", trofeoImagen: "liga-liga-mx.png", partidosMinimos: 34, partidosExtra: 12 },
    // MLS: temporada regular de 34 partidos + playoffs (Round One,
    // Conference Semifinals, Conference Finals, MLS Cup).
    { id: "liga-mls", nombre: "MLS", tipo: "domestica", categoria: "liga", ligaId: "mls", trofeoImagen: "liga-mls.png", partidosMinimos: 34, partidosExtra: 4 },
    // Colombia: Apertura + Clausura (~19 partidos de fase regular cada
    // uno) + cuadrangulares y final de ambos torneos como partidosExtra.
    { id: "liga-primera-a-colombia", nombre: "Primera A (Colombia)", tipo: "domestica", categoria: "liga", ligaId: "primera-a-colombia", trofeoImagen: "liga-primera-a-colombia.png", partidosMinimos: 38, partidosExtra: 10 },
    { id: "liga-eredivisie", nombre: "Eredivisie", tipo: "domestica", categoria: "liga", ligaId: "eredivisie", trofeoImagen: "liga-eredivisie.png", partidosMinimos: 34, partidosExtra: 0 },
    { id: "liga-primeira-liga", nombre: "Primeira Liga", tipo: "domestica", categoria: "liga", ligaId: "primeira-liga", trofeoImagen: "liga-primeira-liga.png", partidosMinimos: 34, partidosExtra: 0 },
    { id: "liga-pro-league-belgica", nombre: "Pro League", tipo: "domestica", categoria: "liga", ligaId: "pro-league-belgica", trofeoImagen: "liga-pro-league-belgica.png", partidosMinimos: 34, partidosExtra: 0 },
    { id: "liga-super-lig-turca", nombre: "Süper Lig", tipo: "domestica", categoria: "liga", ligaId: "super-lig-turca", trofeoImagen: "liga-super-lig-turca.png", partidosMinimos: 34, partidosExtra: 0 },
    { id: "liga-premiership-escocesa", nombre: "Scottish Premiership", tipo: "domestica", categoria: "liga", ligaId: "premiership-escocesa", trofeoImagen: "liga-premiership-escocesa.png", partidosMinimos: 33, partidosExtra: 0 },
    { id: "liga-super-liga-griega", nombre: "Super League Greece", tipo: "domestica", categoria: "liga", ligaId: "super-liga-griega", trofeoImagen: "liga-super-liga-griega.png", partidosMinimos: 26, partidosExtra: 0 },
    { id: "liga-liga-premier-rusa", nombre: "Liga Premier Rusa", tipo: "domestica", categoria: "liga", ligaId: "liga-premier-rusa", trofeoImagen: "liga-liga-premier-rusa.png", partidosMinimos: 30, partidosExtra: 0 },
    { id: "liga-j1-liga", nombre: "J1 League", tipo: "domestica", categoria: "liga", ligaId: "j1-liga", trofeoImagen: "liga-j1-liga.png", partidosMinimos: 38, partidosExtra: 0 },
    { id: "liga-super-liga-china", nombre: "Super League China", tipo: "domestica", categoria: "liga", ligaId: "super-liga-china", trofeoImagen: "liga-super-liga-china.png", partidosMinimos: 30, partidosExtra: 0 },
    { id: "liga-liga1-peru", nombre: "Liga 1", tipo: "domestica", categoria: "liga", ligaId: "liga1-peru", trofeoImagen: "liga-liga1-peru.png", partidosMinimos: 34, partidosExtra: 0 },
    { id: "liga-primera-division-bolivia", nombre: "Primera División", tipo: "domestica", categoria: "liga", ligaId: "primera-division-bolivia", trofeoImagen: "liga-primera-division-bolivia.png", partidosMinimos: 30, partidosExtra: 0 },
    { id: "liga-primera-division-chile", nombre: "Primera División", tipo: "domestica", categoria: "liga", ligaId: "primera-division-chile", trofeoImagen: "liga-primera-division-chile.png", partidosMinimos: 30, partidosExtra: 0 },
    { id: "liga-primera-division-uruguay", nombre: "Primera División", tipo: "domestica", categoria: "liga", ligaId: "primera-division-uruguay", trofeoImagen: "liga-primera-division-uruguay.png", partidosMinimos: 30, partidosExtra: 0 },
    { id: "liga-primera-division-venezuela", nombre: "Primera División", tipo: "domestica", categoria: "liga", ligaId: "primera-division-venezuela", trofeoImagen: "liga-primera-division-venezuela.png", partidosMinimos: 28, partidosExtra: 0 },
    { id: "liga-serie-a-ecuador", nombre: "Serie A", tipo: "domestica", categoria: "liga", ligaId: "serie-a-ecuador", trofeoImagen: "liga-serie-a-ecuador.png", partidosMinimos: 28, partidosExtra: 0 },
    { id: "liga-primera-division-costa-rica", nombre: "Primera División", tipo: "domestica", categoria: "liga", ligaId: "primera-division-costa-rica", trofeoImagen: "liga-primera-division-costa-rica.png", partidosMinimos: 18, partidosExtra: 0 },
    { id: "liga-primera-division-paraguay", nombre: "Primera División", tipo: "domestica", categoria: "liga", ligaId: "primera-division-paraguay", trofeoImagen: "liga-primera-division-paraguay.png", partidosMinimos: 22, partidosExtra: 0 },
    { id: "liga-primera-division-el-salvador", nombre: "Primera División", tipo: "domestica", categoria: "liga", ligaId: "primera-division-el-salvador", trofeoImagen: "liga-primera-division-el-salvador.png", partidosMinimos: 22, partidosExtra: 0 },
    { id: "liga-liga-premier-ucrania", nombre: "Liga Premier de Ucrania", tipo: "domestica", categoria: "liga", ligaId: "liga-premier-ucrania", trofeoImagen: "liga-liga-premier-ucrania.png", partidosMinimos: 38, partidosExtra: 0 },

    // -------- DOMÉSTICAS: COPA --------
    // partidosMinimos: 1 (el partido de la ronda en la que entra el
    // equipo, sin garantía de seguir). partidosExtra: rondas de más que
    // se suman si se sigue avanzando hasta ganar el título.
    { id: "copa-fa-cup", nombre: "FA Cup", tipo: "domestica", categoria: "copa", ligaId: "premier-league", trofeoImagen: "copa-fa-cup.png", partidosMinimos: 1, partidosExtra: 6 },
    { id: "copa-del-rey", nombre: "Copa del Rey", tipo: "domestica", categoria: "copa", ligaId: "la-liga", trofeoImagen: "copa-del-rey.png", partidosMinimos: 1, partidosExtra: 5 },
    { id: "copa-coppa-italia", nombre: "Coppa Italia", tipo: "domestica", categoria: "copa", ligaId: "serie-a", trofeoImagen: "copa-coppa-italia.png", partidosMinimos: 1, partidosExtra: 5 },
    { id: "copa-dfb-pokal", nombre: "DFB-Pokal", tipo: "domestica", categoria: "copa", ligaId: "bundesliga", trofeoImagen: "copa-dfb-pokal.png", partidosMinimos: 1, partidosExtra: 5 },
    { id: "copa-coupe-de-france", nombre: "Coupe de France", tipo: "domestica", categoria: "copa", ligaId: "ligue-1", trofeoImagen: "copa-coupe-de-france.png", partidosMinimos: 1, partidosExtra: 5 },
    { id: "copa-do-brasil", nombre: "Copa do Brasil", tipo: "domestica", categoria: "copa", ligaId: "brasileirao", trofeoImagen: "copa-do-brasil.png", partidosMinimos: 1, partidosExtra: 7 },
    { id: "copa-argentina", nombre: "Copa Argentina", tipo: "domestica", categoria: "copa", ligaId: "primera-division-argentina", trofeoImagen: "copa-argentina.png", partidosMinimos: 1, partidosExtra: 6 },
    // La Copa MX se discontinuó tras la temporada 2018-19 y no tiene una
    // edición de primera división en marcha — se incluye igual como
    // "Copa México" para no dejar a Liga MX sin competición de copa.
    { id: "copa-mexico", nombre: "Copa México", tipo: "domestica", categoria: "copa", ligaId: "liga-mx", trofeoImagen: "copa-mexico.png", partidosMinimos: 1, partidosExtra: 5 },
    { id: "copa-us-open-cup", nombre: "Lamar Hunt U.S. Open Cup", tipo: "domestica", categoria: "copa", ligaId: "mls", trofeoImagen: "copa-us-open-cup.png", partidosMinimos: 1, partidosExtra: 4 },
    { id: "copa-colombia", nombre: "Copa Colombia", tipo: "domestica", categoria: "copa", ligaId: "primera-a-colombia", trofeoImagen: "copa-colombia.png", partidosMinimos: 1, partidosExtra: 5 },
    { id: "knvb-beker", nombre: "KNVB Beker", tipo: "domestica", categoria: "copa", ligaId: "eredivisie", trofeoImagen: "knvb-beker.png", partidosMinimos: 1, partidosExtra: 5 },
    { id: "taca-de-portugal", nombre: "Taça de Portugal", tipo: "domestica", categoria: "copa", ligaId: "primeira-liga", trofeoImagen: "taca-de-portugal.png", partidosMinimos: 1, partidosExtra: 5 },
    { id: "croky-cup", nombre: "Croky Cup", tipo: "domestica", categoria: "copa", ligaId: "pro-league-belgica", trofeoImagen: "croky-cup.png", partidosMinimos: 1, partidosExtra: 5 },
    { id: "copa-turquia", nombre: "Copa de Turquía", tipo: "domestica", categoria: "copa", ligaId: "super-lig-turca", trofeoImagen: "copa-turquia.png", partidosMinimos: 1, partidosExtra: 5 },
    { id: "scottish-cup", nombre: "Scottish Cup", tipo: "domestica", categoria: "copa", ligaId: "premiership-escocesa", trofeoImagen: "scottish-cup.png", partidosMinimos: 1, partidosExtra: 5 },
    { id: "copa-grecia", nombre: "Copa de Grecia", tipo: "domestica", categoria: "copa", ligaId: "super-liga-griega", trofeoImagen: "copa-grecia.png", partidosMinimos: 1, partidosExtra: 5 },
    { id: "copa-rusia", nombre: "Copa de Rusia", tipo: "domestica", categoria: "copa", ligaId: "liga-premier-rusa", trofeoImagen: "copa-rusia.png", partidosMinimos: 1, partidosExtra: 5 },
    { id: "copa-emperador", nombre: "Copa del Emperador", tipo: "domestica", categoria: "copa", ligaId: "j1-liga", trofeoImagen: "copa-emperador.png", partidosMinimos: 1, partidosExtra: 5 },
    { id: "copa-china", nombre: "Copa de China", tipo: "domestica", categoria: "copa", ligaId: "super-liga-china", trofeoImagen: "copa-china.png", partidosMinimos: 1, partidosExtra: 5 },
    { id: "copa-peru", nombre: "Copa Perú", tipo: "domestica", categoria: "copa", ligaId: "liga1-peru", trofeoImagen: "copa-peru.png", partidosMinimos: 1, partidosExtra: 5 },
    { id: "copa-simon-bolivar", nombre: "Copa Simón Bolívar", tipo: "domestica", categoria: "copa", ligaId: "primera-division-bolivia", trofeoImagen: "copa-simon-bolivar.png", partidosMinimos: 1, partidosExtra: 5 },
    { id: "copa-chile", nombre: "Copa Chile", tipo: "domestica", categoria: "copa", ligaId: "primera-division-chile", trofeoImagen: "copa-chile.png", partidosMinimos: 1, partidosExtra: 5 },
    { id: "copa-auf-uruguay", nombre: "Copa AUF Uruguay", tipo: "domestica", categoria: "copa", ligaId: "primera-division-uruguay", trofeoImagen: "copa-auf-uruguay.png", partidosMinimos: 1, partidosExtra: 5 },
    { id: "copa-venezuela", nombre: "Copa Venezuela", tipo: "domestica", categoria: "copa", ligaId: "primera-division-venezuela", trofeoImagen: "copa-venezuela.png", partidosMinimos: 1, partidosExtra: 5 },
    { id: "copa-ecuador", nombre: "Copa Ecuador", tipo: "domestica", categoria: "copa", ligaId: "serie-a-ecuador", trofeoImagen: "copa-ecuador.png", partidosMinimos: 1, partidosExtra: 5 },
    { id: "copa-costa-rica", nombre: "Copa Costa Rica", tipo: "domestica", categoria: "copa", ligaId: "primera-division-costa-rica", trofeoImagen: "copa-costa-rica.png", partidosMinimos: 1, partidosExtra: 5 },
    { id: "copa-paraguay", nombre: "Copa Paraguay", tipo: "domestica", categoria: "copa", ligaId: "primera-division-paraguay", trofeoImagen: "copa-paraguay.png", partidosMinimos: 1, partidosExtra: 5 },
    { id: "copa-presidente", nombre: "Copa Presidente", tipo: "domestica", categoria: "copa", ligaId: "primera-division-el-salvador", trofeoImagen: "copa-presidente.png", partidosMinimos: 1, partidosExtra: 5 },
    { id: "copa-ucrania", nombre: "Copa de Ucrania", tipo: "domestica", categoria: "copa", ligaId: "liga-premier-ucrania", trofeoImagen: "copa-ucrania.png", partidosMinimos: 1, partidosExtra: 5 },

    // -------- INTERNACIONALES --------
    // Formato vigente desde 2024-25 (fase de liga suiza): 8 partidos de
    // fase de liga asegurados (partidosMinimos) + ronda de playoffs,
    // octavos, cuartos, semis (ida y vuelta) y una final a partido único
    // como partidosExtra si se sigue avanzando.
    { id: "uefa-champions-league", nombre: "UEFA Champions League", tipo: "internacional", categoria: "primerNivel", confederacion: "UEFA", trofeoImagen: "uefa-champions-league.png", partidosMinimos: 8, partidosExtra: 9 },
    { id: "uefa-europa-league", nombre: "UEFA Europa League", tipo: "internacional", categoria: "segundoNivel", confederacion: "UEFA", trofeoImagen: "uefa-europa-league.png", partidosMinimos: 8, partidosExtra: 9 },
    // Fase de grupos (6 partidos) + octavos, cuartos y semis a ida y
    // vuelta, con final a partido único.
    { id: "conmebol-libertadores", nombre: "CONMEBOL Libertadores", tipo: "internacional", categoria: "primerNivel", confederacion: "CONMEBOL", trofeoImagen: "conmebol-libertadores.png", partidosMinimos: 6, partidosExtra: 7 },
    { id: "conmebol-sudamericana", nombre: "CONMEBOL Sudamericana", tipo: "internacional", categoria: "segundoNivel", confederacion: "CONMEBOL", trofeoImagen: "conmebol-sudamericana.png", partidosMinimos: 6, partidosExtra: 7 },
    // Formato 100% eliminatorio desde el relanzamiento 2024 (sin fase de
    // grupos): octavos a ida y vuelta asegurados si se clasifica, más
    // cuartos, semis (ida y vuelta) y una final a partido único.
    // CONCACAF no tiene actualmente un segundo nivel continental de
    // clubes equivalente a la Europa League/Sudamericana (la antigua
    // Liga de Naciones de clubes se discontinuó en 2023).
    { id: "concacaf-champions-cup", nombre: "CONCACAF Champions Cup", tipo: "internacional", categoria: "primerNivel", confederacion: "CONCACAF", trofeoImagen: "concacaf-champions-cup.png", partidosMinimos: 2, partidosExtra: 5 },
    // Formato vigente desde 2024-25 (fase de liga, igual que la Champions
    // League europea que copió): 8 partidos de fase de liga asegurados +
    // octavos, cuartos, semis y una final a partido único.
    { id: "afc-champions-league-elite", nombre: "AFC Champions League Elite", tipo: "internacional", categoria: "primerNivel", confederacion: "AFC", trofeoImagen: "", partidosMinimos: 8, partidosExtra: 9 },
    { id: "afc-champions-league-two", nombre: "AFC Champions League Two", tipo: "internacional", categoria: "segundoNivel", confederacion: "AFC", trofeoImagen: "", partidosMinimos: 6, partidosExtra: 7 },

    // -------- SELECCIÓN NACIONAL --------
    // tipo "seleccion": categoria "mundial" (una sola, global, sin
    // confederacion) o "continental" (una por confederación). Se resuelven
    // en un solo golpe al aceptar la convocatoria (ver
    // resolverParticipacionSeleccion en carrera.js), no ronda por ronda
    // entre tramos como las copas de club — partidosMinimos/partidosExtra
    // quedan igual como referencia de formato (fase de grupos + rondas
    // eliminatorias hasta la final).
    { id: "mundial-fifa", nombre: "Copa del Mundo", tipo: "seleccion", categoria: "mundial", confederacion: null, trofeoImagen: "mundial-fifa.png", partidosMinimos: 3, partidosExtra: 4 },
    { id: "copa-america", nombre: "Copa América", tipo: "seleccion", categoria: "continental", confederacion: "CONMEBOL", trofeoImagen: "copa-america.png", partidosMinimos: 3, partidosExtra: 3 },
    { id: "eurocopa", nombre: "Eurocopa", tipo: "seleccion", categoria: "continental", confederacion: "UEFA", trofeoImagen: "eurocopa.png", partidosMinimos: 3, partidosExtra: 3 },
    { id: "copa-oro", nombre: "Copa Oro", tipo: "seleccion", categoria: "continental", confederacion: "CONCACAF", trofeoImagen: "copa-oro.png", partidosMinimos: 3, partidosExtra: 3 },
    { id: "copa-africana-de-naciones", nombre: "Copa Africana de Naciones", tipo: "seleccion", categoria: "continental", confederacion: "CAF", trofeoImagen: "copa-africana-de-naciones.png", partidosMinimos: 3, partidosExtra: 3 },
    { id: "copa-asiatica", nombre: "Copa Asiática", tipo: "seleccion", categoria: "continental", confederacion: "AFC", trofeoImagen: "copa-asiatica.png", partidosMinimos: 3, partidosExtra: 3 },
  ],
};
