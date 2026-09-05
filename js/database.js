// ============================================================
// GameDatabase — Base de datos real de ligas y equipos.
//
// Temporada de referencia: 2026 (Europa 2026-27; América/Sudamérica
// año calendario 2026, en curso a septiembre de 2026).
//
// Cargar después de config.js.
//
// ---------------- FORMATO ----------------
// ligas: [{ id, nombre, nivel, pais?, confederacion, escudo? }]
//   - id: string único, kebab-case, sin espacios.
//   - nivel: entero 1 (mejor) a 6 (peor). Oculto al jugador.
//   - pais (opcional): nombre EXACTO de país tal como aparece en la
//     lista de nacionalidades de script.js (ej. "México", "Inglaterra").
//     Se usa para decidir las ofertas de primer equipo: si el país
//     elegido por el jugador coincide con el de una liga, empieza ahí.
//   - confederacion: "UEFA" | "CONMEBOL" | "CONCACAF" (por ahora, según
//     las ligas cargadas). Define a qué competiciones internacionales
//     (ver `competiciones` más abajo) puede clasificar un equipo de esa
//     liga — todavía no afecta el juego, es solo el dato base.
//   - escudo: nombre de archivo dentro de assets/escudos/ligas/.
//
// equipos: [{ id, nombre, ligaId, nivel, initials, a, b, escudo? }]
//   - id: string único.
//   - ligaId: debe coincidir con un id de `ligas`.
//   - nivel: entero 1 (grande) a 3 (chico). Oculto al jugador.
//   - initials: 2-3 letras, se usan como placeholder si no hay escudo.
//   - a / b: colores hex del degradado del placeholder (colores del club).
//   - escudo: nombre de archivo dentro de assets/escudos/equipos/.
//
// competiciones: [{ id, nombre, tipo, categoria, ligaId?, confederacion?,
//                    trofeoImagen, partidosMinimos, partidosExtra }]
//   - tipo: "domestica" | "internacional".
//   - categoria: "liga" | "copa" (domesticas) — "primerNivel" | "segundoNivel"
//     (internacionales, ej. Champions/Libertadores vs. Europa League/Sudamericana).
//   - ligaId (solo domesticas): a qué liga/país pertenece esta competición.
//   - confederacion (solo internacionales): "UEFA" | "CONMEBOL" | "CONCACAF"
//     — qué confederación la organiza (cruza con `ligas[].confederacion`
//     para saber a qué torneo internacional clasifica cada liga).
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
    { id: "premier-league", nombre: "Premier League", nivel: 1, pais: "Inglaterra", confederacion: "UEFA", escudo: "premier-league.png" },
    { id: "la-liga", nombre: "La Liga", nivel: 1, pais: "España", confederacion: "UEFA", escudo: "la-liga.png" },
    { id: "serie-a", nombre: "Serie A", nivel: 1, pais: "Italia", confederacion: "UEFA", escudo: "serie-a.png" },
    { id: "bundesliga", nombre: "Bundesliga", nivel: 1, pais: "Alemania", confederacion: "UEFA", escudo: "bundesliga.png" },
    { id: "ligue-1", nombre: "Ligue 1", nivel: 1, pais: "Francia", confederacion: "UEFA", escudo: "ligue-1.png" },
    { id: "brasileirao", nombre: "Brasileirão Série A", nivel: 2, pais: "Brasil", confederacion: "CONMEBOL", escudo: "brasileirao.png" },
    { id: "primera-division-argentina", nombre: "Primera División Argentina", nivel: 3, pais: "Argentina", confederacion: "CONMEBOL", escudo: "primera-division-argentina.png" },
    { id: "liga-mx", nombre: "Liga MX", nivel: 3, pais: "México", confederacion: "CONCACAF", escudo: "liga-mx.png" },
    { id: "mls", nombre: "MLS", nivel: 3, pais: "Estados Unidos", confederacion: "CONCACAF", escudo: "mls.png" },
    { id: "primera-a-colombia", nombre: "Primera A (Colombia)", nivel: 4, pais: "Colombia", confederacion: "CONMEBOL", escudo: "primera-a-colombia.png" },
  ],

  equipos: [
    // ---------------- PREMIER LEAGUE (Inglaterra) ----------------
    { id: "arsenal", nombre: "Arsenal FC", ligaId: "premier-league", nivel: 1, initials: "ARS", a: "#EF0107", b: "#063672", escudo: "arsenal.png" },
    { id: "aston-villa", nombre: "Aston Villa FC", ligaId: "premier-league", nivel: 2, initials: "AVL", a: "#670E36", b: "#95BFE5", escudo: "aston-villa.png" },
    { id: "bournemouth", nombre: "AFC Bournemouth", ligaId: "premier-league", nivel: 2, initials: "BOU", a: "#DA291C", b: "#000000", escudo: "bournemouth.png" },
    { id: "brentford", nombre: "Brentford FC", ligaId: "premier-league", nivel: 2, initials: "BRE", a: "#E30613", b: "#000000", escudo: "brentford.png" },
    { id: "brighton-hove-albion", nombre: "Brighton & Hove Albion FC", ligaId: "premier-league", nivel: 2, initials: "BHA", a: "#0057B8", b: "#FFFFFF", escudo: "brighton-hove-albion.png" },
    { id: "chelsea", nombre: "Chelsea FC", ligaId: "premier-league", nivel: 1, initials: "CHE", a: "#034694", b: "#FFFFFF", escudo: "chelsea.png" },
    { id: "coventry-city", nombre: "Coventry City FC", ligaId: "premier-league", nivel: 3, initials: "COV", a: "#78D0F2", b: "#000000", escudo: "coventry-city.png" },
    { id: "crystal-palace", nombre: "Crystal Palace FC", ligaId: "premier-league", nivel: 2, initials: "CRY", a: "#1B458F", b: "#C4122E", escudo: "crystal-palace.png" },
    { id: "everton", nombre: "Everton FC", ligaId: "premier-league", nivel: 2, initials: "EVE", a: "#003399", b: "#FFFFFF", escudo: "everton.png" },
    { id: "fulham", nombre: "Fulham FC", ligaId: "premier-league", nivel: 2, initials: "FUL", a: "#000000", b: "#FFFFFF", escudo: "fulham.png" },
    { id: "hull-city", nombre: "Hull City AFC", ligaId: "premier-league", nivel: 3, initials: "HUL", a: "#F18A01", b: "#000000", escudo: "hull-city.png" },
    { id: "ipswich-town", nombre: "Ipswich Town FC", ligaId: "premier-league", nivel: 3, initials: "IPS", a: "#0044A9", b: "#FFFFFF", escudo: "ipswich-town.png" },
    { id: "leeds-united", nombre: "Leeds United FC", ligaId: "premier-league", nivel: 3, initials: "LEE", a: "#FFFFFF", b: "#1D428A", escudo: "leeds-united.png" },
    { id: "liverpool", nombre: "Liverpool FC", ligaId: "premier-league", nivel: 1, initials: "LIV", a: "#C8102E", b: "#F6EB61", escudo: "liverpool.png" },
    { id: "manchester-city", nombre: "Manchester City FC", ligaId: "premier-league", nivel: 1, initials: "MCI", a: "#6CABDD", b: "#1C2C5B", escudo: "manchester-city.png" },
    { id: "manchester-united", nombre: "Manchester United FC", ligaId: "premier-league", nivel: 1, initials: "MUN", a: "#DA291C", b: "#FBE122", escudo: "manchester-united.png" },
    { id: "newcastle-united", nombre: "Newcastle United FC", ligaId: "premier-league", nivel: 2, initials: "NEW", a: "#241F20", b: "#FFFFFF", escudo: "newcastle-united.png" },
    { id: "nottingham-forest", nombre: "Nottingham Forest FC", ligaId: "premier-league", nivel: 2, initials: "NFO", a: "#DD0000", b: "#FFFFFF", escudo: "nottingham-forest.png" },
    { id: "sunderland", nombre: "Sunderland AFC", ligaId: "premier-league", nivel: 3, initials: "SUN", a: "#EB172B", b: "#FFFFFF", escudo: "sunderland.png" },
    { id: "tottenham-hotspur", nombre: "Tottenham Hotspur FC", ligaId: "premier-league", nivel: 1, initials: "TOT", a: "#132257", b: "#FFFFFF", escudo: "tottenham-hotspur.png" },

    // ---------------- LA LIGA (España) ----------------
    { id: "alaves", nombre: "Deportivo Alavés", ligaId: "la-liga", nivel: 3, initials: "ALA", a: "#1F4C9C", b: "#FFFFFF", escudo: "alaves.png" },
    { id: "athletic-bilbao", nombre: "Athletic Club", ligaId: "la-liga", nivel: 2, initials: "ATH", a: "#EE2523", b: "#FFFFFF", escudo: "athletic-bilbao.png" },
    { id: "atletico-madrid", nombre: "Atlético de Madrid", ligaId: "la-liga", nivel: 1, initials: "ATM", a: "#CB3524", b: "#272E61", escudo: "atletico-madrid.png" },
    { id: "barcelona", nombre: "FC Barcelona", ligaId: "la-liga", nivel: 1, initials: "BAR", a: "#A50044", b: "#004D98", escudo: "barcelona.png" },
    { id: "real-betis", nombre: "Real Betis Balompié", ligaId: "la-liga", nivel: 2, initials: "BET", a: "#00954C", b: "#FFFFFF", escudo: "real-betis.png" },
    { id: "celta-vigo", nombre: "RC Celta de Vigo", ligaId: "la-liga", nivel: 2, initials: "CEL", a: "#8AC3EE", b: "#FFFFFF", escudo: "celta-vigo.png" },
    { id: "deportivo-la-coruna", nombre: "RC Deportivo de La Coruña", ligaId: "la-liga", nivel: 3, initials: "DEP", a: "#0066B3", b: "#FFFFFF", escudo: "deportivo-la-coruna.png" },
    { id: "elche", nombre: "Elche CF", ligaId: "la-liga", nivel: 3, initials: "ELX", a: "#00944D", b: "#FFFFFF", escudo: "elche.png" },
    { id: "espanyol", nombre: "RCD Espanyol de Barcelona", ligaId: "la-liga", nivel: 2, initials: "ESP", a: "#0A5EB0", b: "#FFFFFF", escudo: "espanyol.png" },
    { id: "getafe", nombre: "Getafe CF", ligaId: "la-liga", nivel: 2, initials: "GET", a: "#005CA9", b: "#FFFFFF", escudo: "getafe.png" },
    { id: "levante", nombre: "Levante UD", ligaId: "la-liga", nivel: 3, initials: "LEV", a: "#8B1D41", b: "#003DA5", escudo: "levante.png" },
    { id: "malaga", nombre: "Málaga CF", ligaId: "la-liga", nivel: 3, initials: "MAL", a: "#0066CC", b: "#FFFFFF", escudo: "malaga.png" },
    { id: "osasuna", nombre: "CA Osasuna", ligaId: "la-liga", nivel: 2, initials: "OSA", a: "#D91A21", b: "#001A4B", escudo: "osasuna.png" },
    { id: "racing-santander", nombre: "Racing de Santander", ligaId: "la-liga", nivel: 3, initials: "RAC", a: "#008542", b: "#FFFFFF", escudo: "racing-santander.png" },
    { id: "rayo-vallecano", nombre: "Rayo Vallecano", ligaId: "la-liga", nivel: 2, initials: "RAY", a: "#E30613", b: "#FFFFFF", escudo: "rayo-vallecano.png" },
    { id: "real-madrid", nombre: "Real Madrid CF", ligaId: "la-liga", nivel: 1, initials: "RMA", a: "#FFFFFF", b: "#FEBE10", escudo: "real-madrid.png" },
    { id: "real-sociedad", nombre: "Real Sociedad", ligaId: "la-liga", nivel: 2, initials: "RSO", a: "#0033A0", b: "#FFFFFF", escudo: "real-sociedad.png" },
    { id: "sevilla", nombre: "Sevilla FC", ligaId: "la-liga", nivel: 2, initials: "SEV", a: "#D40000", b: "#FFFFFF", escudo: "sevilla.png" },
    { id: "valencia", nombre: "Valencia CF", ligaId: "la-liga", nivel: 2, initials: "VAL", a: "#EE3524", b: "#000000", escudo: "valencia.png" },
    { id: "villarreal", nombre: "Villarreal CF", ligaId: "la-liga", nivel: 2, initials: "VIL", a: "#FFE667", b: "#005187", escudo: "villarreal.png" },

    // ---------------- SERIE A (Italia) ----------------
    { id: "atalanta-bc", nombre: "Atalanta BC", ligaId: "serie-a", nivel: 2, initials: "ATA", a: "#1E71B8", b: "#000000", escudo: "atalanta-bc.png" },
    { id: "bologna", nombre: "Bologna FC 1909", ligaId: "serie-a", nivel: 2, initials: "BOL", a: "#C8102E", b: "#0033A0", escudo: "bologna.png" },
    { id: "cagliari", nombre: "Cagliari Calcio", ligaId: "serie-a", nivel: 3, initials: "CAG", a: "#8B1E3F", b: "#002B5C", escudo: "cagliari.png" },
    { id: "como-1907", nombre: "Como 1907", ligaId: "serie-a", nivel: 3, initials: "COM", a: "#003DA5", b: "#FFFFFF", escudo: "como-1907.png" },
    { id: "fiorentina", nombre: "ACF Fiorentina", ligaId: "serie-a", nivel: 2, initials: "FIO", a: "#5B2A86", b: "#FFFFFF", escudo: "fiorentina.png" },
    { id: "frosinone", nombre: "Frosinone Calcio", ligaId: "serie-a", nivel: 3, initials: "FRO", a: "#FFD400", b: "#004B93", escudo: "frosinone.png" },
    { id: "genoa", nombre: "Genoa CFC", ligaId: "serie-a", nivel: 3, initials: "GEN", a: "#B01C2E", b: "#002855", escudo: "genoa.png" },
    { id: "inter-milan", nombre: "FC Internazionale Milano", ligaId: "serie-a", nivel: 1, initials: "INT", a: "#010E80", b: "#000000", escudo: "inter-milan.png" },
    { id: "juventus", nombre: "Juventus FC", ligaId: "serie-a", nivel: 1, initials: "JUV", a: "#000000", b: "#FFFFFF", escudo: "juventus.png" },
    { id: "lazio", nombre: "SS Lazio", ligaId: "serie-a", nivel: 2, initials: "LAZ", a: "#6CACE4", b: "#FFFFFF", escudo: "lazio.png" },
    { id: "lecce", nombre: "US Lecce", ligaId: "serie-a", nivel: 3, initials: "LEC", a: "#FFD400", b: "#C8102E", escudo: "lecce.png" },
    { id: "ac-milan", nombre: "AC Milan", ligaId: "serie-a", nivel: 1, initials: "MIL", a: "#FB090B", b: "#000000", escudo: "ac-milan.png" },
    { id: "monza", nombre: "AC Monza", ligaId: "serie-a", nivel: 3, initials: "MON", a: "#E4032E", b: "#FFFFFF", escudo: "monza.png" },
    { id: "napoli", nombre: "SSC Napoli", ligaId: "serie-a", nivel: 1, initials: "NAP", a: "#0F82C4", b: "#FFFFFF", escudo: "napoli.png" },
    { id: "parma", nombre: "Parma Calcio 1913", ligaId: "serie-a", nivel: 3, initials: "PAR", a: "#FFD400", b: "#002B5C", escudo: "parma.png" },
    { id: "as-roma", nombre: "AS Roma", ligaId: "serie-a", nivel: 1, initials: "ROM", a: "#8E1F2F", b: "#F0BC42", escudo: "as-roma.png" },
    { id: "sassuolo", nombre: "US Sassuolo Calcio", ligaId: "serie-a", nivel: 3, initials: "SAS", a: "#000000", b: "#00A650", escudo: "sassuolo.png" },
    { id: "torino", nombre: "Torino FC", ligaId: "serie-a", nivel: 2, initials: "TOR", a: "#7B1730", b: "#FFFFFF", escudo: "torino.png" },
    { id: "udinese", nombre: "Udinese Calcio", ligaId: "serie-a", nivel: 3, initials: "UDI", a: "#000000", b: "#FFFFFF", escudo: "udinese.png" },
    { id: "venezia", nombre: "Venezia FC", ligaId: "serie-a", nivel: 3, initials: "VEN", a: "#FF6600", b: "#000000", escudo: "venezia.png" },

    // ---------------- BUNDESLIGA (Alemania) ----------------
    { id: "fc-augsburg", nombre: "FC Augsburg", ligaId: "bundesliga", nivel: 3, initials: "FCA", a: "#CE1126", b: "#00854A", escudo: "fc-augsburg.png" },
    { id: "bayer-leverkusen", nombre: "Bayer 04 Leverkusen", ligaId: "bundesliga", nivel: 1, initials: "B04", a: "#E32219", b: "#000000", escudo: "bayer-leverkusen.png" },
    { id: "bayern-munich", nombre: "FC Bayern München", ligaId: "bundesliga", nivel: 1, initials: "FCB", a: "#DC052D", b: "#FFFFFF", escudo: "bayern-munich.png" },
    { id: "monchengladbach", nombre: "Borussia Mönchengladbach", ligaId: "bundesliga", nivel: 2, initials: "BMG", a: "#000000", b: "#00753E", escudo: "monchengladbach.png" },
    { id: "borussia-dortmund", nombre: "Borussia Dortmund", ligaId: "bundesliga", nivel: 1, initials: "BVB", a: "#FDE100", b: "#000000", escudo: "borussia-dortmund.png" },
    { id: "eintracht-frankfurt", nombre: "Eintracht Frankfurt", ligaId: "bundesliga", nivel: 2, initials: "SGE", a: "#E1000F", b: "#000000", escudo: "eintracht-frankfurt.png" },
    { id: "sv-elversberg", nombre: "SV Elversberg", ligaId: "bundesliga", nivel: 3, initials: "ELV", a: "#000000", b: "#FFFFFF", escudo: "sv-elversberg.png" },
    { id: "sc-freiburg", nombre: "SC Freiburg", ligaId: "bundesliga", nivel: 2, initials: "SCF", a: "#000000", b: "#EB1923", escudo: "sc-freiburg.png" },
    { id: "hamburger-sv", nombre: "Hamburger SV", ligaId: "bundesliga", nivel: 2, initials: "HSV", a: "#0F1E38", b: "#FFFFFF", escudo: "hamburger-sv.png" },
    { id: "tsg-hoffenheim", nombre: "TSG 1899 Hoffenheim", ligaId: "bundesliga", nivel: 2, initials: "TSG", a: "#1961B5", b: "#FFFFFF", escudo: "tsg-hoffenheim.png" },
    { id: "fc-koln", nombre: "1. FC Köln", ligaId: "bundesliga", nivel: 2, initials: "KOE", a: "#ED1C24", b: "#FFFFFF", escudo: "fc-koln.png" },
    { id: "rb-leipzig", nombre: "RB Leipzig", ligaId: "bundesliga", nivel: 1, initials: "RBL", a: "#DD0741", b: "#FFFFFF", escudo: "rb-leipzig.png" },
    { id: "mainz-05", nombre: "1. FSV Mainz 05", ligaId: "bundesliga", nivel: 2, initials: "M05", a: "#C3141E", b: "#FFFFFF", escudo: "mainz-05.png" },
    { id: "sc-paderborn-07", nombre: "SC Paderborn 07", ligaId: "bundesliga", nivel: 3, initials: "SCP", a: "#003399", b: "#000000", escudo: "sc-paderborn-07.png" },
    { id: "schalke-04", nombre: "FC Schalke 04", ligaId: "bundesliga", nivel: 2, initials: "S04", a: "#004D9F", b: "#FFFFFF", escudo: "schalke-04.png" },
    { id: "vfb-stuttgart", nombre: "VfB Stuttgart", ligaId: "bundesliga", nivel: 2, initials: "VFB", a: "#E32219", b: "#FFFFFF", escudo: "vfb-stuttgart.png" },
    { id: "union-berlin", nombre: "1. FC Union Berlin", ligaId: "bundesliga", nivel: 2, initials: "UNI", a: "#EB1923", b: "#FFFFFF", escudo: "union-berlin.png" },
    { id: "werder-bremen", nombre: "SV Werder Bremen", ligaId: "bundesliga", nivel: 2, initials: "SVW", a: "#1D9053", b: "#FFFFFF", escudo: "werder-bremen.png" },

    // ---------------- LIGUE 1 (Francia) ----------------
    { id: "angers-sco", nombre: "Angers SCO", ligaId: "ligue-1", nivel: 3, initials: "ANG", a: "#000000", b: "#FFFFFF", escudo: "angers-sco.png" },
    { id: "aj-auxerre", nombre: "AJ Auxerre", ligaId: "ligue-1", nivel: 3, initials: "AJA", a: "#003DA5", b: "#FFFFFF", escudo: "aj-auxerre.png" },
    { id: "stade-brestois", nombre: "Stade Brestois 29", ligaId: "ligue-1", nivel: 2, initials: "SB29", a: "#E2001A", b: "#FFFFFF", escudo: "stade-brestois.png" },
    { id: "le-havre-ac", nombre: "Le Havre AC", ligaId: "ligue-1", nivel: 3, initials: "HAC", a: "#4FC3F7", b: "#0B2265", escudo: "le-havre-ac.png" },
    { id: "le-mans-fc", nombre: "Le Mans FC", ligaId: "ligue-1", nivel: 3, initials: "LM", a: "#FFD100", b: "#E10600", escudo: "le-mans-fc.png" },
    { id: "rc-lens", nombre: "RC Lens", ligaId: "ligue-1", nivel: 2, initials: "RCL", a: "#C8102E", b: "#FFD100", escudo: "rc-lens.png" },
    { id: "losc-lille", nombre: "LOSC Lille", ligaId: "ligue-1", nivel: 2, initials: "LIL", a: "#E2001A", b: "#002F6C", escudo: "losc-lille.png" },
    { id: "fc-lorient", nombre: "FC Lorient", ligaId: "ligue-1", nivel: 3, initials: "FCL", a: "#FF7F00", b: "#000000", escudo: "fc-lorient.png" },
    { id: "olympique-lyonnais", nombre: "Olympique Lyonnais", ligaId: "ligue-1", nivel: 1, initials: "OL", a: "#003087", b: "#E2001A", escudo: "olympique-lyonnais.png" },
    { id: "olympique-marseille", nombre: "Olympique de Marseille", ligaId: "ligue-1", nivel: 1, initials: "OM", a: "#2FAEE0", b: "#FFFFFF", escudo: "olympique-marseille.png" },
    { id: "as-monaco", nombre: "AS Monaco", ligaId: "ligue-1", nivel: 1, initials: "ASM", a: "#E2001A", b: "#FFFFFF", escudo: "as-monaco.png" },
    { id: "ogc-nice", nombre: "OGC Nice", ligaId: "ligue-1", nivel: 2, initials: "OGCN", a: "#E2001A", b: "#000000", escudo: "ogc-nice.png" },
    { id: "paris-fc", nombre: "Paris FC", ligaId: "ligue-1", nivel: 3, initials: "PFC", a: "#003DA5", b: "#E2001A", escudo: "paris-fc.png" },
    { id: "psg", nombre: "Paris Saint-Germain", ligaId: "ligue-1", nivel: 1, initials: "PSG", a: "#001E62", b: "#DA291C", escudo: "psg.png" },
    { id: "stade-rennais", nombre: "Stade Rennais FC", ligaId: "ligue-1", nivel: 2, initials: "SRFC", a: "#E2001A", b: "#000000", escudo: "stade-rennais.png" },
    { id: "rc-strasbourg", nombre: "RC Strasbourg Alsace", ligaId: "ligue-1", nivel: 2, initials: "RCSA", a: "#0057B7", b: "#FFFFFF", escudo: "rc-strasbourg.png" },
    { id: "toulouse-fc", nombre: "Toulouse FC", ligaId: "ligue-1", nivel: 3, initials: "TFC", a: "#5F259F", b: "#FFFFFF", escudo: "toulouse-fc.png" },
    { id: "es-troyes-ac", nombre: "ES Troyes AC", ligaId: "ligue-1", nivel: 3, initials: "ESTAC", a: "#002B7F", b: "#FFFFFF", escudo: "es-troyes-ac.png" },

    // ---------------- BRASILEIRÃO SÉRIE A (Brasil) ----------------
    { id: "atletico-mineiro", nombre: "Clube Atlético Mineiro", ligaId: "brasileirao", nivel: 2, initials: "CAM", a: "#000000", b: "#FFFFFF", escudo: "atletico-mineiro.png" },
    { id: "bahia", nombre: "Esporte Clube Bahia", ligaId: "brasileirao", nivel: 2, initials: "BAH", a: "#1C3F94", b: "#DA291C", escudo: "bahia.png" },
    { id: "botafogo", nombre: "Botafogo de Futebol e Regatas", ligaId: "brasileirao", nivel: 2, initials: "BOT", a: "#000000", b: "#FFFFFF", escudo: "botafogo.png" },
    { id: "corinthians", nombre: "Sport Club Corinthians Paulista", ligaId: "brasileirao", nivel: 1, initials: "COR", a: "#000000", b: "#FFFFFF", escudo: "corinthians.png" },
    { id: "cruzeiro", nombre: "Cruzeiro Esporte Clube", ligaId: "brasileirao", nivel: 2, initials: "CRU", a: "#003DA5", b: "#FFFFFF", escudo: "cruzeiro.png" },
    { id: "flamengo", nombre: "Clube de Regatas do Flamengo", ligaId: "brasileirao", nivel: 1, initials: "FLA", a: "#E31E24", b: "#000000", escudo: "flamengo.png" },
    { id: "fluminense", nombre: "Fluminense Football Club", ligaId: "brasileirao", nivel: 2, initials: "FLU", a: "#7C1C3C", b: "#006747", escudo: "fluminense.png" },
    { id: "gremio", nombre: "Grêmio Foot-Ball Porto Alegrense", ligaId: "brasileirao", nivel: 1, initials: "GRE", a: "#0D3B66", b: "#000000", escudo: "gremio.png" },
    { id: "internacional", nombre: "Sport Club Internacional", ligaId: "brasileirao", nivel: 1, initials: "INT", a: "#D2001C", b: "#FFFFFF", escudo: "internacional.png" },
    { id: "mirassol", nombre: "Mirassol Futebol Clube", ligaId: "brasileirao", nivel: 2, initials: "MIR", a: "#1C8A42", b: "#FFD100", escudo: "mirassol.png" },
    { id: "palmeiras", nombre: "Sociedade Esportiva Palmeiras", ligaId: "brasileirao", nivel: 1, initials: "PAL", a: "#006437", b: "#FFFFFF", escudo: "palmeiras.png" },
    { id: "rb-bragantino", nombre: "Red Bull Bragantino", ligaId: "brasileirao", nivel: 2, initials: "RBB", a: "#E4002B", b: "#FFFFFF", escudo: "rb-bragantino.png" },
    { id: "santos", nombre: "Santos Futebol Clube", ligaId: "brasileirao", nivel: 2, initials: "SAN", a: "#000000", b: "#FFFFFF", escudo: "santos.png" },
    { id: "sao-paulo", nombre: "São Paulo Futebol Clube", ligaId: "brasileirao", nivel: 1, initials: "SAO", a: "#E4002B", b: "#000000", escudo: "sao-paulo.png" },
    { id: "vasco-da-gama", nombre: "Club de Regatas Vasco da Gama", ligaId: "brasileirao", nivel: 2, initials: "VAS", a: "#000000", b: "#FFFFFF", escudo: "vasco-da-gama.png" },
    { id: "vitoria", nombre: "Esporte Clube Vitória", ligaId: "brasileirao", nivel: 2, initials: "VIT", a: "#C8102E", b: "#000000", escudo: "vitoria.png" },
    { id: "coritiba", nombre: "Coritiba Foot Ball Club", ligaId: "brasileirao", nivel: 2, initials: "CTB", a: "#006437", b: "#FFFFFF", escudo: "coritiba.png" },
    { id: "athletico-paranaense", nombre: "Club Athletico Paranaense", ligaId: "brasileirao", nivel: 2, initials: "CAP", a: "#C8102E", b: "#000000", escudo: "athletico-paranaense.png" },
    { id: "chapecoense", nombre: "Associação Chapecoense de Futebol", ligaId: "brasileirao", nivel: 3, initials: "CHA", a: "#006437", b: "#FFFFFF", escudo: "chapecoense.png" },
    { id: "remo", nombre: "Clube do Remo", ligaId: "brasileirao", nivel: 3, initials: "REM", a: "#0C2340", b: "#FFFFFF", escudo: "remo.png" },

    // ---------------- PRIMERA DIVISIÓN ARGENTINA ----------------
    { id: "aldosivi", nombre: "Club Atlético Aldosivi", ligaId: "primera-division-argentina", nivel: 3, initials: "ALD", a: "#1C8A42", b: "#FFD100", escudo: "aldosivi.png" },
    { id: "argentinos-juniors", nombre: "Asociación Atlética Argentinos Juniors", ligaId: "primera-division-argentina", nivel: 2, initials: "ARG", a: "#E4002B", b: "#FFFFFF", escudo: "argentinos-juniors.png" },
    { id: "atletico-tucuman", nombre: "Club Atlético Tucumán", ligaId: "primera-division-argentina", nivel: 2, initials: "ATU", a: "#4CB5E5", b: "#FFFFFF", escudo: "atletico-tucuman.png" },
    { id: "banfield", nombre: "Club Atlético Banfield", ligaId: "primera-division-argentina", nivel: 2, initials: "BAN", a: "#00A651", b: "#FFFFFF", escudo: "banfield.png" },
    { id: "barracas-central", nombre: "Club Atlético Barracas Central", ligaId: "primera-division-argentina", nivel: 3, initials: "BAR", a: "#E4002B", b: "#FFFFFF", escudo: "barracas-central.png" },
    { id: "belgrano", nombre: "Club Atlético Belgrano", ligaId: "primera-division-argentina", nivel: 2, initials: "BEL", a: "#4CB5E5", b: "#000000", escudo: "belgrano.png" },
    { id: "boca-juniors", nombre: "Club Atlético Boca Juniors", ligaId: "primera-division-argentina", nivel: 1, initials: "BOC", a: "#003DA5", b: "#FFD100", escudo: "boca-juniors.png" },
    { id: "central-cordoba-sde", nombre: "Club Atlético Central Córdoba (SdE)", ligaId: "primera-division-argentina", nivel: 2, initials: "CCO", a: "#000000", b: "#FFFFFF", escudo: "central-cordoba-sde.png" },
    { id: "defensa-y-justicia", nombre: "Club Social y Deportivo Defensa y Justicia", ligaId: "primera-division-argentina", nivel: 3, initials: "DYJ", a: "#006A4E", b: "#FFD100", escudo: "defensa-y-justicia.png" },
    { id: "deportivo-riestra", nombre: "Club Deportivo Riestra", ligaId: "primera-division-argentina", nivel: 3, initials: "RIE", a: "#000000", b: "#FFFFFF", escudo: "deportivo-riestra.png" },
    { id: "estudiantes-de-la-plata", nombre: "Club Estudiantes de La Plata", ligaId: "primera-division-argentina", nivel: 2, initials: "EDLP", a: "#D2001C", b: "#FFFFFF", escudo: "estudiantes-de-la-plata.png" },
    { id: "estudiantes-de-rio-cuarto", nombre: "Asociación Atlética Estudiantes (Río Cuarto)", ligaId: "primera-division-argentina", nivel: 3, initials: "ERC", a: "#6CACE4", b: "#000000", escudo: "estudiantes-de-rio-cuarto.png" },
    { id: "gimnasia-la-plata", nombre: "Club de Gimnasia y Esgrima La Plata", ligaId: "primera-division-argentina", nivel: 2, initials: "GEL", a: "#002554", b: "#FFFFFF", escudo: "gimnasia-la-plata.png" },
    { id: "gimnasia-mendoza", nombre: "Club Atlético Gimnasia y Esgrima (Mendoza)", ligaId: "primera-division-argentina", nivel: 3, initials: "GEM", a: "#000000", b: "#FFFFFF", escudo: "gimnasia-mendoza.png" },
    { id: "huracan", nombre: "Club Atlético Huracán", ligaId: "primera-division-argentina", nivel: 2, initials: "HUR", a: "#FFFFFF", b: "#E4002B", escudo: "huracan.png" },
    { id: "independiente", nombre: "Club Atlético Independiente", ligaId: "primera-division-argentina", nivel: 1, initials: "IND", a: "#E4002B", b: "#FFFFFF", escudo: "independiente.png" },
    { id: "independiente-rivadavia", nombre: "Club Sportivo Independiente Rivadavia", ligaId: "primera-division-argentina", nivel: 3, initials: "IRI", a: "#0C2340", b: "#FFFFFF", escudo: "independiente-rivadavia.png" },
    { id: "instituto", nombre: "Instituto Atlético Central Córdoba", ligaId: "primera-division-argentina", nivel: 2, initials: "INS", a: "#D2001C", b: "#FFFFFF", escudo: "instituto.png" },
    { id: "lanus", nombre: "Club Atlético Lanús", ligaId: "primera-division-argentina", nivel: 2, initials: "LAN", a: "#7A1C3E", b: "#000000", escudo: "lanus.png" },
    { id: "newells-old-boys", nombre: "Newell's Old Boys", ligaId: "primera-division-argentina", nivel: 2, initials: "NOB", a: "#E4002B", b: "#000000", escudo: "newells-old-boys.png" },
    { id: "platense", nombre: "Club Atlético Platense", ligaId: "primera-division-argentina", nivel: 3, initials: "PLA", a: "#6F4E37", b: "#FFFFFF", escudo: "platense.png" },
    { id: "racing-club", nombre: "Racing Club", ligaId: "primera-division-argentina", nivel: 1, initials: "RAC", a: "#6CACE4", b: "#FFFFFF", escudo: "racing-club.png" },
    { id: "river-plate", nombre: "Club Atlético River Plate", ligaId: "primera-division-argentina", nivel: 1, initials: "RIV", a: "#FFFFFF", b: "#E4002B", escudo: "river-plate.png" },
    { id: "rosario-central", nombre: "Club Atlético Rosario Central", ligaId: "primera-division-argentina", nivel: 2, initials: "ROS", a: "#003DA5", b: "#FFD100", escudo: "rosario-central.png" },
    { id: "san-lorenzo", nombre: "Club Atlético San Lorenzo de Almagro", ligaId: "primera-division-argentina", nivel: 1, initials: "SLO", a: "#003DA5", b: "#C8102E", escudo: "san-lorenzo.png" },
    { id: "sarmiento-de-junin", nombre: "Club Atlético Sarmiento (Junín)", ligaId: "primera-division-argentina", nivel: 3, initials: "SAR", a: "#1C8A42", b: "#FFFFFF", escudo: "sarmiento-de-junin.png" },
    { id: "talleres-cordoba", nombre: "Club Atlético Talleres (Córdoba)", ligaId: "primera-division-argentina", nivel: 2, initials: "TAL", a: "#003DA5", b: "#FFFFFF", escudo: "talleres-cordoba.png" },
    { id: "tigre", nombre: "Club Atlético Tigre", ligaId: "primera-division-argentina", nivel: 3, initials: "TIG", a: "#003DA5", b: "#E4002B", escudo: "tigre.png" },
    { id: "union-santa-fe", nombre: "Club Atlético Unión (Santa Fe)", ligaId: "primera-division-argentina", nivel: 2, initials: "UNI", a: "#D2001C", b: "#FFFFFF", escudo: "union-santa-fe.png" },
    { id: "velez-sarsfield", nombre: "Club Atlético Vélez Sarsfield", ligaId: "primera-division-argentina", nivel: 2, initials: "VEL", a: "#FFFFFF", b: "#003DA5", escudo: "velez-sarsfield.png" },

    // ---------------- LIGA MX (México) ----------------
    { id: "club-america", nombre: "Club América", ligaId: "liga-mx", nivel: 1, initials: "AME", a: "#FFEB00", b: "#003057", escudo: "club-america.png" },
    { id: "atlas-fc", nombre: "Atlas FC", ligaId: "liga-mx", nivel: 2, initials: "ATL", a: "#EC1C24", b: "#231F20", escudo: "atlas-fc.png" },
    { id: "atletico-san-luis", nombre: "Atlético San Luis", ligaId: "liga-mx", nivel: 3, initials: "ASL", a: "#CD3825", b: "#EEECEC", escudo: "atletico-san-luis.png" },
    { id: "cruz-azul", nombre: "Cruz Azul", ligaId: "liga-mx", nivel: 1, initials: "CAZ", a: "#001F60", b: "#FFFFFF", escudo: "cruz-azul.png" },
    { id: "chivas-guadalajara", nombre: "C.D. Guadalajara (Chivas)", ligaId: "liga-mx", nivel: 1, initials: "CHI", a: "#CE0E2D", b: "#002E5D", escudo: "chivas-guadalajara.png" },
    { id: "fc-juarez", nombre: "FC Juárez", ligaId: "liga-mx", nivel: 2, initials: "JUA", a: "#21CB35", b: "#1F1D1C", escudo: "fc-juarez.png" },
    { id: "club-leon", nombre: "Club León", ligaId: "liga-mx", nivel: 2, initials: "LEO", a: "#187B56", b: "#FFFFFF", escudo: "club-leon.png" },
    { id: "mazatlan-fc", nombre: "Mazatlán F.C.", ligaId: "liga-mx", nivel: 3, initials: "MAZ", a: "#533278", b: "#101820", escudo: "mazatlan-fc.png" },
    { id: "cf-monterrey", nombre: "C.F. Monterrey", ligaId: "liga-mx", nivel: 1, initials: "MTY", a: "#0A2240", b: "#FFFFFF", escudo: "cf-monterrey.png" },
    { id: "club-necaxa", nombre: "Club Necaxa", ligaId: "liga-mx", nivel: 3, initials: "NEC", a: "#E1001E", b: "#FFFFFF", escudo: "club-necaxa.png" },
    { id: "cf-pachuca", nombre: "C.F. Pachuca", ligaId: "liga-mx", nivel: 2, initials: "PAC", a: "#162577", b: "#FFFFFF", escudo: "cf-pachuca.png" },
    { id: "club-puebla", nombre: "Club Puebla", ligaId: "liga-mx", nivel: 2, initials: "PUE", a: "#2B4B75", b: "#FFFFFF", escudo: "club-puebla.png" },
    { id: "pumas-unam", nombre: "Pumas UNAM", ligaId: "liga-mx", nivel: 1, initials: "PUM", a: "#132347", b: "#CBAB58", escudo: "pumas-unam.png" },
    { id: "queretaro-fc", nombre: "Querétaro F.C.", ligaId: "liga-mx", nivel: 3, initials: "QRO", a: "#0056B3", b: "#000000", escudo: "queretaro-fc.png" },
    { id: "santos-laguna", nombre: "Santos Laguna", ligaId: "liga-mx", nivel: 2, initials: "SAN", a: "#008066", b: "#FFFFFF", escudo: "santos-laguna.png" },
    { id: "tigres-uanl", nombre: "Tigres UANL", ligaId: "liga-mx", nivel: 1, initials: "TIG", a: "#015DAA", b: "#FBAF35", escudo: "tigres-uanl.png" },
    { id: "club-tijuana", nombre: "Club Tijuana (Xolos)", ligaId: "liga-mx", nivel: 2, initials: "TIJ", a: "#ED1B26", b: "#161413", escudo: "club-tijuana.png" },
    { id: "toluca-fc", nombre: "Toluca F.C.", ligaId: "liga-mx", nivel: 1, initials: "TOL", a: "#D53741", b: "#002855", escudo: "toluca-fc.png" },

    // ---------------- MLS (Estados Unidos / Canadá) ----------------
    { id: "atlanta-united", nombre: "Atlanta United FC", ligaId: "mls", nivel: 1, initials: "ATL", a: "#2D2A26", b: "#A32035", escudo: "atlanta-united.png" },
    { id: "austin-fc", nombre: "Austin FC", ligaId: "mls", nivel: 3, initials: "ATX", a: "#00B140", b: "#000000", escudo: "austin-fc.png" },
    { id: "charlotte-fc", nombre: "Charlotte FC", ligaId: "mls", nivel: 3, initials: "CLT", a: "#0085CA", b: "#000000", escudo: "charlotte-fc.png" },
    { id: "chicago-fire", nombre: "Chicago Fire FC", ligaId: "mls", nivel: 3, initials: "CHI", a: "#7CCDEF", b: "#FF0000", escudo: "chicago-fire.png" },
    { id: "fc-cincinnati", nombre: "FC Cincinnati", ligaId: "mls", nivel: 2, initials: "CIN", a: "#FE5000", b: "#003087", escudo: "fc-cincinnati.png" },
    { id: "colorado-rapids", nombre: "Colorado Rapids", ligaId: "mls", nivel: 3, initials: "COL", a: "#8A2432", b: "#8AB7E9", escudo: "colorado-rapids.png" },
    { id: "columbus-crew", nombre: "Columbus Crew", ligaId: "mls", nivel: 1, initials: "CLB", a: "#000000", b: "#FEDD00", escudo: "columbus-crew.png" },
    { id: "fc-dallas", nombre: "FC Dallas", ligaId: "mls", nivel: 3, initials: "DAL", a: "#001F5B", b: "#C6093B", escudo: "fc-dallas.png" },
    { id: "dc-united", nombre: "D.C. United", ligaId: "mls", nivel: 2, initials: "DCU", a: "#2E2A25", b: "#EB0029", escudo: "dc-united.png" },
    { id: "houston-dynamo", nombre: "Houston Dynamo FC", ligaId: "mls", nivel: 3, initials: "HOU", a: "#FF6B00", b: "#101820", escudo: "houston-dynamo.png" },
    { id: "inter-miami", nombre: "Inter Miami CF", ligaId: "mls", nivel: 1, initials: "MIA", a: "#231F20", b: "#F7B5CD", escudo: "inter-miami.png" },
    { id: "sporting-kansas-city", nombre: "Sporting Kansas City", ligaId: "mls", nivel: 2, initials: "SKC", a: "#0C2340", b: "#A7C6ED", escudo: "sporting-kansas-city.png" },
    { id: "los-angeles-fc", nombre: "Los Angeles FC (LAFC)", ligaId: "mls", nivel: 1, initials: "LAF", a: "#C39F6C", b: "#010101", escudo: "los-angeles-fc.png" },
    { id: "la-galaxy", nombre: "LA Galaxy", ligaId: "mls", nivel: 1, initials: "LAG", a: "#15284B", b: "#FFCE00", escudo: "la-galaxy.png" },
    { id: "minnesota-united", nombre: "Minnesota United FC", ligaId: "mls", nivel: 2, initials: "MIN", a: "#E2E2DE", b: "#9BCDE4", escudo: "minnesota-united.png" },
    { id: "cf-montreal", nombre: "CF Montréal", ligaId: "mls", nivel: 3, initials: "MTL", a: "#003DA6", b: "#000000", escudo: "cf-montreal.png" },
    { id: "nashville-sc", nombre: "Nashville SC", ligaId: "mls", nivel: 2, initials: "NSH", a: "#ECE83A", b: "#1F1646", escudo: "nashville-sc.png" },
    { id: "new-england-revolution", nombre: "New England Revolution", ligaId: "mls", nivel: 3, initials: "NE", a: "#0A2240", b: "#CE0E2D", escudo: "new-england-revolution.png" },
    { id: "new-york-red-bulls", nombre: "New York Red Bulls", ligaId: "mls", nivel: 2, initials: "RBNY", a: "#B91F31", b: "#FFC72C", escudo: "new-york-red-bulls.png" },
    { id: "new-york-city-fc", nombre: "New York City FC", ligaId: "mls", nivel: 2, initials: "NYC", a: "#9FD2FF", b: "#000229", escudo: "new-york-city-fc.png" },
    { id: "orlando-city", nombre: "Orlando City SC", ligaId: "mls", nivel: 2, initials: "ORL", a: "#60269E", b: "#F0D283", escudo: "orlando-city.png" },
    { id: "philadelphia-union", nombre: "Philadelphia Union", ligaId: "mls", nivel: 2, initials: "PHI", a: "#E0D0A6", b: "#051C2C", escudo: "philadelphia-union.png" },
    { id: "portland-timbers", nombre: "Portland Timbers", ligaId: "mls", nivel: 2, initials: "POR", a: "#2C5234", b: "#C99700", escudo: "portland-timbers.png" },
    { id: "real-salt-lake", nombre: "Real Salt Lake", ligaId: "mls", nivel: 2, initials: "RSL", a: "#001E61", b: "#F2D11A", escudo: "real-salt-lake.png" },
    { id: "san-diego-fc", nombre: "San Diego FC", ligaId: "mls", nivel: 3, initials: "SD", a: "#051C2C", b: "#687C7B", escudo: "san-diego-fc.png" },
    { id: "san-jose-earthquakes", nombre: "San Jose Earthquakes", ligaId: "mls", nivel: 3, initials: "SJ", a: "#0067B1", b: "#000000", escudo: "san-jose-earthquakes.png" },
    { id: "seattle-sounders", nombre: "Seattle Sounders FC", ligaId: "mls", nivel: 1, initials: "SEA", a: "#4FB84F", b: "#0033A1", escudo: "seattle-sounders.png" },
    { id: "st-louis-city", nombre: "St. Louis City SC", ligaId: "mls", nivel: 3, initials: "STL", a: "#EC1458", b: "#001544", escudo: "st-louis-city.png" },
    { id: "toronto-fc", nombre: "Toronto FC", ligaId: "mls", nivel: 2, initials: "TOR", a: "#AA182C", b: "#323E48", escudo: "toronto-fc.png" },
    { id: "vancouver-whitecaps", nombre: "Vancouver Whitecaps FC", ligaId: "mls", nivel: 2, initials: "VAN", a: "#12284C", b: "#8AB7E9", escudo: "vancouver-whitecaps.png" },

    // ---------------- PRIMERA A (Colombia) ----------------
    { id: "aguilas-doradas", nombre: "Águilas Doradas Rionegro", ligaId: "primera-a-colombia", nivel: 2, initials: "AGD", a: "#FFC72C", b: "#000000", escudo: "aguilas-doradas.png" },
    { id: "alianza", nombre: "Alianza F.C. (Valledupar)", ligaId: "primera-a-colombia", nivel: 3, initials: "ALZ", a: "#002D62", b: "#E30613", escudo: "alianza.png" },
    { id: "america", nombre: "América de Cali", ligaId: "primera-a-colombia", nivel: 1, initials: "AME", a: "#DA291C", b: "#FFFFFF", escudo: "america.png" },
    { id: "bucaramanga", nombre: "Club Atlético Bucaramanga", ligaId: "primera-a-colombia", nivel: 2, initials: "BUC", a: "#FFD100", b: "#007A33", escudo: "bucaramanga.png" },
    { id: "atletico-nacional", nombre: "Club Atlético Nacional", ligaId: "primera-a-colombia", nivel: 1, initials: "ATN", a: "#046A38", b: "#FFFFFF", escudo: "atletico-nacional.png" },
    { id: "boyaca-chico", nombre: "Boyacá Chicó Fútbol Club", ligaId: "primera-a-colombia", nivel: 2, initials: "BOY", a: "#1B3A6B", b: "#F7941D", escudo: "boyaca-chico.png" },
    { id: "cucuta", nombre: "Cúcuta Deportivo", ligaId: "primera-a-colombia", nivel: 3, initials: "CUC", a: "#ED1C24", b: "#000000", escudo: "cucuta.png" },
    { id: "tolima", nombre: "Club Deportes Tolima", ligaId: "primera-a-colombia", nivel: 2, initials: "TOL", a: "#7A1F2B", b: "#000000", escudo: "tolima.png" },
    { id: "deportivo-cali", nombre: "Deportivo Cali", ligaId: "primera-a-colombia", nivel: 1, initials: "DCA", a: "#00A651", b: "#FFFFFF", escudo: "deportivo-cali.png" },
    { id: "pasto", nombre: "Deportivo Pasto", ligaId: "primera-a-colombia", nivel: 2, initials: "PAS", a: "#C8102E", b: "#0033A0", escudo: "pasto.png" },
    { id: "pereira", nombre: "Deportivo Pereira", ligaId: "primera-a-colombia", nivel: 2, initials: "PER", a: "#C8102E", b: "#808080", escudo: "pereira.png" },
    { id: "fortaleza", nombre: "Fortaleza Fútbol Club", ligaId: "primera-a-colombia", nivel: 3, initials: "FOR", a: "#1B3A6B", b: "#ED1C24", escudo: "fortaleza.png" },
    { id: "independiente-medellin", nombre: "Deportivo Independiente Medellín", ligaId: "primera-a-colombia", nivel: 1, initials: "DIM", a: "#E2231A", b: "#002D62", escudo: "independiente-medellin.png" },
    { id: "internacional-bogota", nombre: "Internacional de Bogotá F.C.", ligaId: "primera-a-colombia", nivel: 3, initials: "IB", a: "#1A1A1A", b: "#C9A227", escudo: "internacional-bogota.png" },
    { id: "jaguares", nombre: "Jaguares de Córdoba Fútbol Club", ligaId: "primera-a-colombia", nivel: 3, initials: "JAG", a: "#3EB6E8", b: "#00A550", escudo: "jaguares.png" },
    { id: "junior", nombre: "Junior de Barranquilla", ligaId: "primera-a-colombia", nivel: 1, initials: "JUN", a: "#E4032E", b: "#FFFFFF", escudo: "junior.png" },
    { id: "llaneros", nombre: "Llaneros Fútbol Club", ligaId: "primera-a-colombia", nivel: 3, initials: "LLA", a: "#000000", b: "#FFFFFF", escudo: "llaneros.png" },
    { id: "millonarios", nombre: "Millonarios Fútbol Club", ligaId: "primera-a-colombia", nivel: 1, initials: "MIL", a: "#003DA5", b: "#FFFFFF", escudo: "millonarios.png" },
    { id: "once-caldas", nombre: "Once Caldas", ligaId: "primera-a-colombia", nivel: 2, initials: "ONC", a: "#FFFFFF", b: "#7A1F2B", escudo: "once-caldas.png" },
    { id: "santafe", nombre: "Independiente Santa Fe", ligaId: "primera-a-colombia", nivel: 1, initials: "SFE", a: "#C8102E", b: "#FFFFFF", escudo: "santafe.png" },
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
  ],
};
