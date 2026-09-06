// ============================================================
// GameEvents — Banco de eventos de temporada.
//
// Cada evento representa una decisión de dos opciones que el
// jugador puede tomar durante su carrera. Estas tarjetas son
// contenido: los `efectos` de cada opción (rendimiento, forma,
// equipo) y los `personajes` involucrados los usa el motor de
// progresión de temporada (ver carrera.js).
//
// Estructura de cada evento normal (generales / porEdad):
// {
//   id: string,
//   tipo: "personal" | "deportivo",
//   personajes: string[],     // quiénes están involucrados
//   pregunta: string,         // texto de la situación
//   opciones: [
//     {
//       texto: string,        // texto del botón
//       efectos: {
//         rendimiento: number,  // impacto en el desempeño del jugador (-3..+3)
//         forma: string,        // nuevo estado de forma (clave de GameConfig.FORM_STATES)
//         equipo: number,       // impacto en el desempeño del equipo (-2..+2)
//       },
//       resultado: string,    // texto que se muestra al elegir esta opción
//     },
//     { ... segunda opción ... },
//   ],
// }
//
// ---------------- EVENTOS DE ALTO IMPACTO ----------------
// `GameEvents.altoImpacto`: mismo formato que arriba, pero:
//   - Sin restricción de rango de edad (pueden salir a cualquier edad).
//   - `efectos` con magnitudes mucho más fuertes (hasta -6/+6 en
//     rendimiento, -4/+4 en equipo) — la decisión debe sentirse importante.
//   - Algunos tienen las DOS opciones en negativo a propósito: ahí no
//     se trata de "ganar", sino de elegir el mal menor.
// Selección (ver carrera.js): máximo 1 por temporada, sorteado con 30%
// de probabilidad al crear la temporada; si sale, reemplaza la tarjeta
// del slot (personal o deportivo, según su `tipo`) de una pausa al azar.
// En la tarjeta se identifican con un ⚠️ en la esquina superior derecha.
//
// ---------------- LESIONES ----------------
// `GameEvents.lesiones`: { nivel1, nivel2, nivel3 }, cada uno un array de
// { id, nombre, descripcion } — sin opciones, son puramente informativas.
// Se sortean al azar en una pausa de decisión (ver intentarGenerarLesion
// en carrera.js) y esa pausa muestra un parte médico en vez de eventos:
//   - nivel3 (leve, la más común): solo te deja sin partidos 1 pausa.
//   - nivel2 (moderada): sin partidos + forma "lesionado" durante la
//     baja + una caída leve de OVR (-1 a -3), aplicada de una vez.
//   - nivel1 (grave, la más rara): igual que nivel2, pero con una caída
//     fuerte de OVR (-4 a -10) y una baja que puede llegar a durar el
//     resto de la temporada.
//
// Cargar después de config.js.
// ============================================================

const GameEvents = {
  // Vocabulario de referencia para el campo `personajes` (informativo).
  personajesPosibles: [
    "entrenador", "companeros", "familia", "agente", "prensa",
    "rival", "hinchada", "pareja", "medico",
  ],

  // ---------------- EVENTOS GENERALES (100) ----------------
  // No dependen de la edad del jugador.
  generales: [
    {
      id: "gen-01", tipo: "deportivo", personajes: ["entrenador"],
      pregunta: "El entrenador te pide jugar una posición distinta a la habitual para el próximo partido.",
      opciones: [
        { texto: "Aceptar el cambio", efectos: { rendimiento: -1, forma: "animado", equipo: 1 }, resultado: "Te adaptas al nuevo rol y el equipo gana flexibilidad." },
        { texto: "Explicar que prefieres tu posición", efectos: { rendimiento: 1, forma: "regular", equipo: -1 }, resultado: "El entrenador respeta tu decisión, pero queda algo tenso." },
      ],
    },
    {
      id: "gen-02", tipo: "personal", personajes: ["prensa"],
      pregunta: "Un periodista te pregunta en conferencia sobre los rumores de fichaje de un compañero.",
      opciones: [
        { texto: "Responder con humor y evitar el tema", efectos: { rendimiento: -1, forma: "animado", equipo: 0 }, resultado: "La prensa se ríe y pasa al siguiente tema sin problemas." },
        { texto: "Dar una respuesta seria y directa", efectos: { rendimiento: 0, forma: "regular", equipo: -1 }, resultado: "Tu respuesta genera más preguntas incómodas en el vestuario." },
      ],
    },
    {
      id: "gen-03", tipo: "deportivo", personajes: ["companeros"],
      pregunta: "Un compañero te pide que le cedas el remate de un tiro libre que sueles ejecutar tú.",
      opciones: [
        { texto: "Cederle el tiro libre", efectos: { rendimiento: -1, forma: "animado", equipo: 2 }, resultado: "El gesto fortalece la relación con tu compañero y el grupo lo valora." },
        { texto: "Mantener tu rol de ejecutor", efectos: { rendimiento: 1, forma: "regular", equipo: 0 }, resultado: "Sigues siendo el encargado de los tiros libres, sin mayores roces." },
      ],
    },
    {
      id: "gen-04", tipo: "personal", personajes: ["familia"],
      pregunta: "Tu familia te invita a una reunión importante que se cruza con un entrenamiento opcional.",
      opciones: [
        { texto: "Ir a la reunión familiar", efectos: { rendimiento: 0, forma: "plenitud", equipo: 0 }, resultado: "Disfrutas del tiempo en familia y vuelves con la cabeza despejada." },
        { texto: "Priorizar el entrenamiento", efectos: { rendimiento: 1, forma: "desanimado", equipo: 0 }, resultado: "Te pierdes la reunión, pero llegas más afilado a la próxima semana." },
      ],
    },
    {
      id: "gen-05", tipo: "deportivo", personajes: ["rival"],
      pregunta: "Un rival te provoca verbalmente durante el calentamiento previo al partido.",
      opciones: [
        { texto: "Ignorarlo y concentrarte", efectos: { rendimiento: 1, forma: "animado", equipo: -2 }, resultado: "Mantienes la calma y entras al partido con la cabeza fría." },
        { texto: "Responder a la provocación", efectos: { rendimiento: -1, forma: "bajo", equipo: -1 }, resultado: "La discusión te saca de foco antes de que arranque el partido." },
      ],
    },
    {
      id: "gen-06", tipo: "deportivo", personajes: ["hinchada"],
      pregunta: "La hinchada local te silba después de un error en el partido anterior.",
      opciones: [
        { texto: "Pedir la pelota más seguido para responder en la cancha", efectos: { rendimiento: 2, forma: "inspirado", equipo: -1 }, resultado: "Tu reacción convierte la presión en una gran actuación." },
        { texto: "Bajar el perfil por unos partidos", efectos: { rendimiento: -1, forma: "desanimado", equipo: 0 }, resultado: "Te cuesta recuperar la confianza frente a tu propia gente." },
      ],
    },
    {
      id: "gen-07", tipo: "personal", personajes: ["agente"],
      pregunta: "Tu agente te propone una campaña publicitaria que ocuparía varias horas de tu semana.",
      opciones: [
        { texto: "Aceptar la campaña", efectos: { rendimiento: -1, forma: "animado", equipo: 0 }, resultado: "Ganas visibilidad, aunque el tiempo extra te resta algo de descanso." },
        { texto: "Rechazarla por ahora", efectos: { rendimiento: 1, forma: "regular", equipo: 0 }, resultado: "Priorizas el descanso y llegas fresco a los entrenamientos." },
      ],
    },
    {
      id: "gen-08", tipo: "deportivo", personajes: ["entrenador"],
      pregunta: "El cuerpo técnico te ofrece sesiones extra de video para estudiar al próximo rival.",
      opciones: [
        { texto: "Sumarte a las sesiones extra", efectos: { rendimiento: 2, forma: "animado", equipo: 1 }, resultado: "Llegas mejor preparado y se nota en la lectura del partido." },
        { texto: "Preferir descansar en tu tiempo libre", efectos: { rendimiento: 0, forma: "plenitud", equipo: 0 }, resultado: "Llegas descansado, aunque algo menos preparado tácticamente." },
      ],
    },
    {
      id: "gen-09", tipo: "personal", personajes: ["pareja"],
      pregunta: "Tu pareja te pide pasar un fin de semana fuera de la ciudad antes de un partido importante.",
      opciones: [
        { texto: "Aceptar la escapada", efectos: { rendimiento: 0, forma: "plenitud", equipo: 0 }, resultado: "Vuelves relajado y con la cabeza en buen estado para competir." },
        { texto: "Quedarte a entrenar por tu cuenta", efectos: { rendimiento: 1, forma: "regular", equipo: 0 }, resultado: "Ganas algo de forma física, aunque la relación queda algo resentida." },
      ],
    },
    {
      id: "gen-10", tipo: "deportivo", personajes: ["companeros"],
      pregunta: "En el vestuario surge una discusión sobre quién debería ser el próximo capitán.",
      opciones: [
        { texto: "Proponer tu candidatura", efectos: { rendimiento: 0, forma: "animado", equipo: 0 }, resultado: "Tu iniciativa es bien recibida por buena parte del plantel." },
        { texto: "Apoyar a otro compañero", efectos: { rendimiento: 0, forma: "regular", equipo: 1 }, resultado: "El grupo valora tu gesto de compañerismo y madurez." },
      ],
    },
    {
      id: "gen-11", tipo: "deportivo", personajes: ["rival", "companeros"],
      pregunta: "Antes del clásico, un compañero te sugiere ver videos de goles del rival para motivarte.",
      opciones: [
        { texto: "Ver los videos con el equipo", efectos: { rendimiento: 0, forma: "inspirado", equipo: 1 }, resultado: "El grupo llega con la motivación a tope para el partido." },
        { texto: "Preferir tu rutina habitual de concentración", efectos: { rendimiento: 1, forma: "regular", equipo: 0 }, resultado: "Mantienes tu enfoque personal, sin sumarte a la dinámica grupal." },
      ],
    },
    {
      id: "gen-12", tipo: "personal", personajes: ["prensa"],
      pregunta: "Te ofrecen participar en un documental sobre jugadores jóvenes del club.",
      opciones: [
        { texto: "Participar en el documental", efectos: { rendimiento: 0, forma: "animado", equipo: -1 }, resultado: "Ganas exposición mediática y algunos elogios por tu perfil." },
        { texto: "Declinar la propuesta", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Prefieres mantener bajo perfil fuera de la cancha." },
      ],
    },
    {
      id: "gen-13", tipo: "deportivo", personajes: ["entrenador"],
      pregunta: "El entrenador te pregunta tu opinión sobre el sistema táctico antes del próximo partido.",
      opciones: [
        { texto: "Dar tu opinión con sinceridad", efectos: { rendimiento: 1, forma: "animado", equipo: -1 }, resultado: "Se valora tu aporte y el vestuario gana en confianza colectiva." },
        { texto: "Evitar opinar y dejarlo en manos del cuerpo técnico", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Mantienes bajo perfil dentro del grupo, sin mayores cambios." },
      ],
    },
    {
      id: "gen-14", tipo: "personal", personajes: ["familia"],
      pregunta: "Un familiar cercano necesita tu apoyo económico en un momento difícil.",
      opciones: [
        { texto: "Ayudar económicamente", efectos: { rendimiento: 0, forma: "plenitud", equipo: -1 }, resultado: "Sientes tranquilidad por haber podido ayudar a tu familia." },
        { texto: "Consultarlo primero con un asesor financiero", efectos: { rendimiento: 0, forma: "desanimado", equipo: 0 }, resultado: "La demora genera algo de tensión familiar en el corto plazo." },
      ],
    },
    {
      id: "gen-15", tipo: "deportivo", personajes: ["companeros"],
      pregunta: "Un compañero atraviesa un mal momento futbolístico y te pide consejo.",
      opciones: [
        { texto: "Dedicarle tiempo extra para ayudarlo", efectos: { rendimiento: -1, forma: "animado", equipo: 2 }, resultado: "Tu compañero mejora y el grupo se fortalece notablemente." },
        { texto: "Darle un consejo breve y seguir tu rutina", efectos: { rendimiento: 1, forma: "regular", equipo: 0 }, resultado: "Mantienes tu enfoque personal sin descuidar tu propio rendimiento." },
      ],
    },
    {
      id: "gen-16", tipo: "personal", personajes: ["hinchada"],
      pregunta: "Un grupo de hinchas te pide una foto justo antes de entrar a entrenar.",
      opciones: [
        { texto: "Tomarte un momento para la foto", efectos: { rendimiento: 0, forma: "animado", equipo: -1 }, resultado: "Los hinchas se van felices y hablan bien de tu cercanía." },
        { texto: "Disculparte y seguir de largo", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Llegas puntual al entrenamiento, aunque algunos hinchas quedan algo decepcionados." },
      ],
    },
    {
      id: "gen-17", tipo: "deportivo", personajes: ["rival"],
      pregunta: "En la previa, se filtra la posible alineación del rival para el próximo partido.",
      opciones: [
        { texto: "Estudiar a fondo cada rival directo", efectos: { rendimiento: 2, forma: "animado", equipo: -1 }, resultado: "Llegas con ventaja táctica sobre tu marca directa." },
        { texto: "No darle mayor importancia a la filtración", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Prefieres centrarte en tu propio juego antes que en el rival." },
      ],
    },
    {
      id: "gen-18", tipo: "personal", personajes: ["agente"],
      pregunta: "Tu agente te avisa que un club del exterior pregunta por tu situación contractual.",
      opciones: [
        { texto: "Pedirle más información", efectos: { rendimiento: 0, forma: "animado", equipo: -1 }, resultado: "La noticia te genera ilusión y motivación extra en cada entrenamiento." },
        { texto: "Pedirle que no avance nada por ahora", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Prefieres mantener la cabeza enfocada en el presente." },
      ],
    },
    {
      id: "gen-19", tipo: "deportivo", personajes: ["entrenador"],
      pregunta: "El cuerpo técnico propone un cambio en la rutina de entrenamientos físicos.",
      opciones: [
        { texto: "Sumarte sin objeciones", efectos: { rendimiento: 1, forma: "plenitud", equipo: -2 }, resultado: "El cambio de rutina te sienta bien físicamente." },
        { texto: "Pedir mantener tu rutina personal", efectos: { rendimiento: 0, forma: "regular", equipo: -1 }, resultado: "El cuerpo técnico accede, aunque queda una pequeña fricción." },
      ],
    },
    {
      id: "gen-20", tipo: "personal", personajes: ["pareja"],
      pregunta: "Tu pareja te propone mudarse a una casa más cerca del predio de entrenamiento.",
      opciones: [
        { texto: "Aceptar la mudanza", efectos: { rendimiento: 1, forma: "plenitud", equipo: -1 }, resultado: "Ganas tiempo de descanso al reducir los traslados diarios." },
        { texto: "Preferir quedarte en tu barrio actual", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Mantienes tu rutina de siempre, aunque los traslados siguen siendo largos." },
      ],
    },
    {
      id: "gen-21", tipo: "deportivo", personajes: ["companeros"],
      pregunta: "El plantel organiza una cena de camaradería la noche antes de un partido de poca exigencia.",
      opciones: [
        { texto: "Sumarte a la cena grupal", efectos: { rendimiento: 0, forma: "animado", equipo: 2 }, resultado: "El equipo fortalece su unión de cara a los partidos importantes." },
        { texto: "Priorizar el descanso en tu casa", efectos: { rendimiento: 1, forma: "regular", equipo: -1 }, resultado: "Llegas descansado, aunque te pierdes un buen momento grupal." },
      ],
    },
    {
      id: "gen-22", tipo: "personal", personajes: ["prensa"],
      pregunta: "Un medio deportivo te pide una nota íntima sobre tus comienzos en el fútbol.",
      opciones: [
        { texto: "Aceptar contar tu historia", efectos: { rendimiento: 0, forma: "animado", equipo: -1 }, resultado: "La nota emociona a muchos hinchas y mejora tu imagen pública." },
        { texto: "Preferir mantener tu vida privada reservada", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Evitas la exposición mediática, manteniendo tu perfil bajo." },
      ],
    },
    {
      id: "gen-23", tipo: "deportivo", personajes: ["entrenador"],
      pregunta: "El entrenador te da a elegir entre descansar un partido de poca exigencia o sumar minutos.",
      opciones: [
        { texto: "Pedir sumar minutos igual", efectos: { rendimiento: 1, forma: "desanimado", equipo: 1 }, resultado: "Ganas ritmo de competencia, aunque el desgaste físico se acumula." },
        { texto: "Aceptar el descanso", efectos: { rendimiento: 0, forma: "plenitud", equipo: 0 }, resultado: "Llegas renovado físicamente al siguiente partido importante." },
      ],
    },
    {
      id: "gen-24", tipo: "personal", personajes: ["familia"],
      pregunta: "Tus padres viajan a verte jugar por primera vez en mucho tiempo.",
      opciones: [
        { texto: "Organizar todo para que se sientan cómodos", efectos: { rendimiento: 1, forma: "inspirado", equipo: -1 }, resultado: "Jugar frente a ellos te llena de motivación extra." },
        { texto: "Tratar el partido como uno más", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Mantienes la rutina de siempre sin darle mayor peso emocional." },
      ],
    },
    {
      id: "gen-25", tipo: "deportivo", personajes: ["rival"],
      pregunta: "El delantero rival es conocido por provocar a los defensores dentro del área.",
      opciones: [
        { texto: "Mantener la calma ante cualquier provocación", efectos: { rendimiento: 1, forma: "animado", equipo: -2 }, resultado: "Tu temple ayuda a que el equipo no pierda el control del partido." },
        { texto: "Responder con la misma intensidad", efectos: { rendimiento: -1, forma: "bajo", equipo: -1 }, resultado: "Te expones a una sanción innecesaria por la tensión generada." },
      ],
    },
    {
      id: "gen-26", tipo: "personal", personajes: ["hinchada"],
      pregunta: "Un hincha te escribe por redes sociales pidiendo ayuda para una causa solidaria.",
      opciones: [
        { texto: "Sumarte a la causa solidaria", efectos: { rendimiento: 0, forma: "plenitud", equipo: -1 }, resultado: "Tu gesto solidario genera cariño genuino de la hinchada." },
        { texto: "No responder por falta de tiempo", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "El mensaje queda sin respuesta, sin mayores consecuencias." },
      ],
    },
    {
      id: "gen-27", tipo: "deportivo", personajes: ["companeros"],
      pregunta: "Se genera competencia interna por un puesto titular en el próximo partido.",
      opciones: [
        { texto: "Redoblar el esfuerzo en cada entrenamiento", efectos: { rendimiento: 2, forma: "inspirado", equipo: -1 }, resultado: "Tu nivel en los entrenamientos convence al cuerpo técnico." },
        { texto: "Confiar en tu jerarquía habitual", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Mantienes tu lugar sin mayores sobresaltos, por ahora." },
      ],
    },
    {
      id: "gen-28", tipo: "personal", personajes: ["agente"],
      pregunta: "Tu agente te sugiere cambiar de representante para negociar mejores condiciones.",
      opciones: [
        { texto: "Escuchar la propuesta de cambio", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Abres la puerta a nuevas negociaciones a futuro." },
        { texto: "Mantener la confianza en tu agente actual", efectos: { rendimiento: 0, forma: "plenitud", equipo: -1 }, resultado: "La lealtad refuerza la relación de confianza con tu representante." },
      ],
    },
    {
      id: "gen-29", tipo: "deportivo", personajes: ["entrenador", "companeros"],
      pregunta: "El entrenador pide voluntarios para ejecutar los penales del equipo.",
      opciones: [
        { texto: "Ofrecerte como ejecutor", efectos: { rendimiento: 1, forma: "inspirado", equipo: -1 }, resultado: "Asumes una nueva responsabilidad que el grupo valora." },
        { texto: "Dejar que otro compañero se encargue", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Evitas la presión extra, delegando la responsabilidad." },
      ],
    },
    {
      id: "gen-30", tipo: "personal", personajes: ["pareja"],
      pregunta: "Tu pareja atraviesa un momento difícil y necesita tu compañía.",
      opciones: [
        { texto: "Priorizar el acompañamiento", efectos: { rendimiento: -1, forma: "plenitud", equipo: 0 }, resultado: "Fortaleces tu relación, aunque el rendimiento deportivo se resiente un poco." },
        { texto: "Mantener el foco total en lo deportivo", efectos: { rendimiento: 1, forma: "desanimado", equipo: 0 }, resultado: "Rindes bien en la cancha, pero la relación queda algo descuidada." },
      ],
    },
    {
      id: "gen-31", tipo: "deportivo", personajes: ["rival"],
      pregunta: "Un ex compañero, ahora rival, te saluda efusivamente antes del partido.",
      opciones: [
        { texto: "Devolver el saludo con cordialidad", efectos: { rendimiento: 0, forma: "animado", equipo: 0 }, resultado: "El gesto no afecta la intensidad del partido en absoluto." },
        { texto: "Mantener distancia por respeto a la competencia", efectos: { rendimiento: 1, forma: "regular", equipo: 0 }, resultado: "Entras al partido con máxima concentración competitiva." },
      ],
    },
    {
      id: "gen-32", tipo: "personal", personajes: ["prensa"],
      pregunta: "Un rumor falso sobre tu vida personal circula en redes sociales.",
      opciones: [
        { texto: "Aclarar la situación públicamente", efectos: { rendimiento: 0, forma: "regular", equipo: -1 }, resultado: "El desmentido calma la situación, aunque genera algo de desgaste." },
        { texto: "Ignorar el rumor por completo", efectos: { rendimiento: 0, forma: "desanimado", equipo: 0 }, resultado: "El rumor sigue circulando, aunque decides no darle más importancia." },
      ],
    },
    {
      id: "gen-33", tipo: "deportivo", personajes: ["companeros"],
      pregunta: "El equipo pierde varios partidos seguidos y el ambiente se tensa.",
      opciones: [
        { texto: "Hablar frente al grupo para levantar el ánimo", efectos: { rendimiento: 1, forma: "inspirado", equipo: -1 }, resultado: "Tus palabras te motivan a vos, pero no todos en el vestuario están de acuerdo con que te tomes esas atribuciones." },
        { texto: "Dejar que el cuerpo técnico maneje la situación", efectos: { rendimiento: 0, forma: "desanimado", equipo: 0 }, resultado: "El ambiente sigue tenso por unos días más." },
      ],
    },
    {
      id: "gen-34", tipo: "personal", personajes: ["familia"],
      pregunta: "Tu hermano menor te pide consejos para empezar en las divisiones inferiores.",
      opciones: [
        { texto: "Dedicarle tiempo para entrenar juntos", efectos: { rendimiento: 0, forma: "plenitud", equipo: -1 }, resultado: "Disfrutas el momento familiar y refuerzas tus propios fundamentos." },
        { texto: "Recomendarle un entrenador especializado", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Tu hermano recibe una buena guía profesional externa." },
      ],
    },
    {
      id: "gen-35", tipo: "deportivo", personajes: ["entrenador"],
      pregunta: "El cuerpo médico sugiere una pausa preventiva pese a que te sientes bien físicamente.",
      opciones: [
        { texto: "Seguir la recomendación médica", efectos: { rendimiento: 0, forma: "plenitud", equipo: 0 }, resultado: "Evitas un posible problema físico a futuro." },
        { texto: "Insistir en seguir jugando", efectos: { rendimiento: 1, forma: "lesionado", equipo: 0 }, resultado: "Sigues jugando, pero arrastras una molestia que te preocupa." },
      ],
    },
    {
      id: "gen-36", tipo: "personal", personajes: ["hinchada"],
      pregunta: "Se viste una camiseta especial homenaje en el próximo partido y te consultan tu opinión.",
      opciones: [
        { texto: "Apoyar la iniciativa con entusiasmo", efectos: { rendimiento: -1, forma: "inspirado", equipo: 1 }, resultado: "El gesto emociona a la hinchada y motiva al plantel entero." },
        { texto: "Mantenerte neutral ante la decisión", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "La iniciativa sigue adelante sin tu participación activa." },
      ],
    },
    {
      id: "gen-37", tipo: "deportivo", personajes: ["rival"],
      pregunta: "El próximo rival es un equipo históricamente débil según las estadísticas.",
      opciones: [
        { texto: "Tomarlo con la misma seriedad de siempre", efectos: { rendimiento: 1, forma: "animado", equipo: -2 }, resultado: "Tu profesionalismo ayuda a evitar sorpresas indeseadas." },
        { texto: "Relajar un poco la preparación", efectos: { rendimiento: -1, forma: "regular", equipo: -1 }, resultado: "El exceso de confianza casi te juega una mala pasada." },
      ],
    },
    {
      id: "gen-38", tipo: "personal", personajes: ["agente"],
      pregunta: "Tu agente organiza una reunión con posibles patrocinadores para tu marca personal.",
      opciones: [
        { texto: "Asistir a la reunión", efectos: { rendimiento: 0, forma: "animado", equipo: -1 }, resultado: "Se abren nuevas oportunidades comerciales interesantes." },
        { texto: "Postergarla para otro momento", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Prefieres enfocarte por completo en lo deportivo por ahora." },
      ],
    },
    {
      id: "gen-39", tipo: "deportivo", personajes: ["companeros"],
      pregunta: "Un compañero extranjero tiene dificultades para adaptarse al idioma del grupo.",
      opciones: [
        { texto: "Ayudarlo activamente con la integración", efectos: { rendimiento: -1, forma: "plenitud", equipo: 2 }, resultado: "El compañero se integra mejor y el grupo gana en unión." },
        { texto: "Dejar que se adapte a su propio ritmo", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "La integración avanza, aunque de forma más lenta." },
      ],
    },
    {
      id: "gen-40", tipo: "personal", personajes: ["pareja"],
      pregunta: "Se acerca un aniversario importante que coincide con la previa de un partido clave.",
      opciones: [
        { texto: "Organizar una celebración breve", efectos: { rendimiento: 0, forma: "plenitud", equipo: 0 }, resultado: "Logras equilibrar bien lo personal con la preparación deportiva." },
        { texto: "Posponer la celebración para después del partido", efectos: { rendimiento: 1, forma: "regular", equipo: 0 }, resultado: "Te concentras al máximo, aunque la relación queda algo resentida." },
      ],
    },
    {
      id: "gen-41", tipo: "deportivo", personajes: ["entrenador", "companeros"],
      pregunta: "El entrenador te pide asumir la cinta de capitán en un partido por ausencia del titular.",
      opciones: [
        { texto: "Aceptar la responsabilidad", efectos: { rendimiento: 1, forma: "inspirado", equipo: -1 }, resultado: "Lideras al equipo con solvencia en un momento clave." },
        { texto: "Sugerir que otro compañero más experimentado la lleve", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "El grupo respeta tu decisión, aunque pierdes una oportunidad de liderazgo." },
      ],
    },
    {
      id: "gen-42", tipo: "personal", personajes: ["prensa"],
      pregunta: "Te invitan a un programa de televisión deportivo para debatir sobre la actualidad del fútbol.",
      opciones: [
        { texto: "Aceptar la invitación", efectos: { rendimiento: 0, forma: "animado", equipo: -1 }, resultado: "Ganas exposición mediática y algunos elogios por tu criterio." },
        { texto: "Declinar por falta de tiempo", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Prefieres mantenerte enfocado en lo puramente deportivo." },
      ],
    },
    {
      id: "gen-43", tipo: "deportivo", personajes: ["rival", "entrenador"],
      pregunta: "Antes del partido, el entrenador rival hace declaraciones desafiantes en la prensa.",
      opciones: [
        { texto: "Responder con seguridad en la cancha", efectos: { rendimiento: 2, forma: "inspirado", equipo: -1 }, resultado: "Tu equipo responde de la mejor manera posible: con el resultado." },
        { texto: "No darle importancia a las declaraciones", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Mantienes la calma habitual sin mayores cambios en tu preparación." },
      ],
    },
    {
      id: "gen-44", tipo: "personal", personajes: ["hinchada"],
      pregunta: "Un grupo de hinchas organiza una banderaza en tu honor antes del partido.",
      opciones: [
        { texto: "Agradecer el gesto públicamente", efectos: { rendimiento: 1, forma: "inspirado", equipo: -1 }, resultado: "El cariño de la gente te da un impulso extra de motivación." },
        { texto: "Mantener un perfil bajo ante el gesto", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Agradeces internamente, sin mayor exposición pública." },
      ],
    },
    {
      id: "gen-45", tipo: "deportivo", personajes: ["companeros"],
      pregunta: "El plantel debate si pedir un día libre extra tras una seguidilla de partidos exigente.",
      opciones: [
        { texto: "Apoyar el pedido del día libre", efectos: { rendimiento: 0, forma: "plenitud", equipo: 1 }, resultado: "El descanso extra beneficia el estado físico general del plantel." },
        { texto: "Preferir mantener la rutina habitual", efectos: { rendimiento: 1, forma: "regular", equipo: -1 }, resultado: "El cuerpo técnico valora tu compromiso, aunque el grupo queda algo cansado." },
      ],
    },
    {
      id: "gen-46", tipo: "personal", personajes: ["familia"],
      pregunta: "Tu familia te pide que participes de una tradición previa a cada partido importante.",
      opciones: [
        { texto: "Mantener la tradición familiar", efectos: { rendimiento: 1, forma: "plenitud", equipo: -1 }, resultado: "La costumbre te da tranquilidad antes de cada compromiso importante." },
        { texto: "Dejarla de lado por falta de tiempo", efectos: { rendimiento: 0, forma: "desanimado", equipo: 0 }, resultado: "Sientes que algo falta en tu rutina previa al partido." },
      ],
    },
    {
      id: "gen-47", tipo: "deportivo", personajes: ["entrenador"],
      pregunta: "El cuerpo técnico introduce una nueva tecnología de análisis físico para el plantel.",
      opciones: [
        { texto: "Aprovechar al máximo la nueva herramienta", efectos: { rendimiento: 2, forma: "animado", equipo: -1 }, resultado: "Los datos te ayudan a optimizar tu rendimiento notablemente." },
        { texto: "Seguir confiando en tus propias sensaciones", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Mantienes tu método habitual, sin grandes cambios." },
      ],
    },
    {
      id: "gen-48", tipo: "personal", personajes: ["agente"],
      pregunta: "Tu agente te informa que una marca deportiva quiere que cambies de botines.",
      opciones: [
        { texto: "Aceptar el cambio de marca", efectos: { rendimiento: 0, forma: "animado", equipo: 0 }, resultado: "El nuevo contrato mejora tus ingresos, aunque necesitas adaptarte al calzado." },
        { texto: "Mantener tu marca de siempre", efectos: { rendimiento: 1, forma: "plenitud", equipo: -1 }, resultado: "Te sientes cómodo manteniendo lo que ya conoces y funciona." },
      ],
    },
    {
      id: "gen-49", tipo: "deportivo", personajes: ["rival"],
      pregunta: "El árbitro del próximo partido tiene fama de ser muy estricto con los reclamos.",
      opciones: [
        { texto: "Jugar con máxima disciplina", efectos: { rendimiento: 1, forma: "animado", equipo: -2 }, resultado: "Evitas roces innecesarios y te mantienes concentrado en el juego." },
        { texto: "Jugar como siempre, sin cambiar tu forma de reclamar", efectos: { rendimiento: -1, forma: "regular", equipo: -1 }, resultado: "Te arriesgas a alguna amonestación innecesaria durante el partido." },
      ],
    },
    {
      id: "gen-50", tipo: "personal", personajes: ["pareja"],
      pregunta: "Tu pareja te propone iniciar juntos un proyecto personal fuera del fútbol.",
      opciones: [
        { texto: "Sumarte al proyecto", efectos: { rendimiento: 0, forma: "plenitud", equipo: 0 }, resultado: "El nuevo proyecto te da una motivación extra fuera de la cancha." },
        { texto: "Posponerlo hasta el final de la temporada", efectos: { rendimiento: 1, forma: "regular", equipo: 0 }, resultado: "Mantienes el foco total en lo deportivo por el momento." },
      ],
    },
    {
      id: "gen-51", tipo: "deportivo", personajes: ["entrenador"],
      pregunta: "El cuerpo técnico te cambia de esquema táctico a mitad de temporada sin previo aviso.",
      opciones: [
        { texto: "Adaptarte rápido y proponer ajustes", efectos: { rendimiento: 1, forma: "animado", equipo: -2 }, resultado: "Tu flexibilidad ayuda a que la transición sea más fluida." },
        { texto: "Cuestionar el cambio abiertamente", efectos: { rendimiento: 0, forma: "regular", equipo: -1 }, resultado: "El entrenador toma nota de tu resistencia al cambio." },
      ],
    },
    {
      id: "gen-52", tipo: "personal", personajes: ["pareja"],
      pregunta: "Tu pareja consigue un trabajo en otra ciudad y te pide que la acompañes en la decisión.",
      opciones: [
        { texto: "Apoyar la mudanza a distancia", efectos: { rendimiento: 0, forma: "plenitud", equipo: 0 }, resultado: "La relación se fortalece pese a la distancia." },
        { texto: "Pedirle que espere hasta fin de temporada", efectos: { rendimiento: 1, forma: "desanimado", equipo: 0 }, resultado: "Priorizas tu carrera, aunque la relación queda tensa." },
      ],
    },
    {
      id: "gen-53", tipo: "deportivo", personajes: ["companeros"],
      pregunta: "Un compañero te acusa de no pasarle la pelota lo suficiente en los partidos.",
      opciones: [
        { texto: "Hablarlo cara a cara y aclarar el malentendido", efectos: { rendimiento: 0, forma: "animado", equipo: 2 }, resultado: "La charla sincera mejora la conexión dentro de la cancha." },
        { texto: "Ignorar el reclamo", efectos: { rendimiento: 1, forma: "regular", equipo: -1 }, resultado: "El compañero sigue sintiéndose relegado en el juego." },
      ],
    },
    {
      id: "gen-54", tipo: "personal", personajes: ["agente"],
      pregunta: "Tu agente te presenta una oferta para protagonizar un videojuego de fútbol.",
      opciones: [
        { texto: "Aceptar la propuesta", efectos: { rendimiento: 0, forma: "animado", equipo: -1 }, resultado: "Ganas popularidad entre una nueva generación de hinchas." },
        { texto: "Rechazarla por falta de tiempo", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Prefieres concentrar tu energía en lo deportivo." },
      ],
    },
    {
      id: "gen-55", tipo: "deportivo", personajes: ["rival"],
      pregunta: "El equipo rival cambia de entrenador justo antes de enfrentarlos.",
      opciones: [
        { texto: "Estudiar el nuevo estilo del rival", efectos: { rendimiento: 1, forma: "animado", equipo: -1 }, resultado: "Llegas mejor preparado ante lo desconocido." },
        { texto: "Confiar en el plan de siempre", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Te adaptas sobre la marcha durante el partido." },
      ],
    },
    {
      id: "gen-56", tipo: "personal", personajes: ["familia"],
      pregunta: "Un familiar directo se enferma y necesita que estés más presente.",
      opciones: [
        { texto: "Pedir permiso para viajar a verlo", efectos: { rendimiento: -1, forma: "plenitud", equipo: 0 }, resultado: "Estar presente te da paz mental para seguir compitiendo." },
        { texto: "Seguir la rutina y llamar todos los días", efectos: { rendimiento: 1, forma: "desanimado", equipo: 0 }, resultado: "Cumples con el equipo, aunque la preocupación no te abandona." },
      ],
    },
    {
      id: "gen-57", tipo: "deportivo", personajes: ["entrenador"],
      pregunta: "El entrenador te pide jugar con una molestia física menor en un partido decisivo.",
      opciones: [
        { texto: "Jugar igual por el equipo", efectos: { rendimiento: 1, forma: "lesionado", equipo: 1 }, resultado: "Ayudas al equipo, pero la molestia se agrava un poco." },
        { texto: "Priorizar tu recuperación", efectos: { rendimiento: 0, forma: "plenitud", equipo: -1 }, resultado: "Cuidas tu cuerpo, aunque el equipo te extraña en cancha." },
      ],
    },
    {
      id: "gen-58", tipo: "personal", personajes: ["prensa"],
      pregunta: "Un canal internacional te pide una entrevista sobre tu vida fuera del fútbol.",
      opciones: [
        { texto: "Aceptar y mostrar tu lado más personal", efectos: { rendimiento: 0, forma: "animado", equipo: -1 }, resultado: "La entrevista humaniza tu imagen ante el público." },
        { texto: "Mantener el hermetismo habitual", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Prefieres que hablen solo tus actuaciones en la cancha." },
      ],
    },
    {
      id: "gen-59", tipo: "deportivo", personajes: ["companeros"],
      pregunta: "Se arma una interna en el plantel por la repartición de premios económicos.",
      opciones: [
        { texto: "Proponer un reparto más equitativo", efectos: { rendimiento: -1, forma: "animado", equipo: 2 }, resultado: "Tu propuesta calma las aguas dentro del vestuario." },
        { texto: "Mantenerte al margen de la discusión", efectos: { rendimiento: 0, forma: "regular", equipo: -1 }, resultado: "La tensión por el dinero sigue latente en el grupo." },
      ],
    },
    {
      id: "gen-60", tipo: "personal", personajes: ["hinchada"],
      pregunta: "Un grupo de hinchas critica fuertemente tus decisiones fuera de la cancha en redes sociales.",
      opciones: [
        { texto: "Responder con altura y seguir adelante", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Manejas bien la presión externa sin mayores consecuencias." },
        { texto: "Bloquear y desconectarte de las redes por un tiempo", efectos: { rendimiento: 1, forma: "plenitud", equipo: -1 }, resultado: "Ganas paz mental alejándote del ruido digital." },
      ],
    },
    {
      id: "gen-61", tipo: "deportivo", personajes: ["rival"],
      pregunta: "En la previa del partido, un rival te reconoce públicamente como su ídolo de juventud.",
      opciones: [
        { texto: "Agradecer el gesto con humildad", efectos: { rendimiento: 0, forma: "animado", equipo: 0 }, resultado: "El intercambio no afecta tu concentración para el partido." },
        { texto: "Usarlo como motivación extra", efectos: { rendimiento: 1, forma: "inspirado", equipo: -1 }, resultado: "El halago te llena de energía positiva para competir." },
      ],
    },
    {
      id: "gen-62", tipo: "personal", personajes: ["pareja"],
      pregunta: "Discutes fuerte con tu pareja la noche anterior a un partido importante.",
      opciones: [
        { texto: "Buscar resolver las cosas antes de dormir", efectos: { rendimiento: 0, forma: "plenitud", equipo: -1 }, resultado: "Llegas al partido con la cabeza más tranquila." },
        { texto: "Dejarlo para después del partido", efectos: { rendimiento: -1, forma: "bajo", equipo: 0 }, resultado: "La discusión sin resolver te pesa durante el juego." },
      ],
    },
    {
      id: "gen-63", tipo: "deportivo", personajes: ["entrenador"],
      pregunta: "El cuerpo técnico te pide liderar el calentamiento del equipo esta semana.",
      opciones: [
        { texto: "Asumir el rol con entusiasmo", efectos: { rendimiento: 1, forma: "inspirado", equipo: -1 }, resultado: "El grupo responde bien a tu nueva responsabilidad." },
        { texto: "Preferir que otro se encargue", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Sigues enfocado solo en tu propia preparación." },
      ],
    },
    {
      id: "gen-64", tipo: "personal", personajes: ["agente"],
      pregunta: "Tu agente te informa que hay interés de una marca de bebidas energéticas para patrocinarte.",
      opciones: [
        { texto: "Aceptar el patrocinio", efectos: { rendimiento: 0, forma: "animado", equipo: 0 }, resultado: "El acuerdo mejora tus ingresos considerablemente." },
        { texto: "Rechazarlo por no alinearse con tus valores", efectos: { rendimiento: 0, forma: "plenitud", equipo: -1 }, resultado: "Te mantienes fiel a la imagen que quieres proyectar." },
      ],
    },
    {
      id: "gen-65", tipo: "deportivo", personajes: ["companeros"],
      pregunta: "Un compañero comete un error grave que le cuesta puntos al equipo en la tabla.",
      opciones: [
        { texto: "Respaldarlo públicamente", efectos: { rendimiento: -1, forma: "animado", equipo: 2 }, resultado: "El compañero se recupera rápido gracias a tu apoyo." },
        { texto: "Expresar tu frustración abiertamente", efectos: { rendimiento: 0, forma: "bajo", equipo: -2 }, resultado: "El grupo queda con un clima incómodo por varios días." },
      ],
    },
    {
      id: "gen-66", tipo: "personal", personajes: ["familia"],
      pregunta: "Organizas una fiesta sorpresa para un familiar en medio de la temporada.",
      opciones: [
        { texto: "Organizarla igual, con cuidado del descanso", efectos: { rendimiento: 0, forma: "plenitud", equipo: 0 }, resultado: "Disfrutas el momento familiar sin descuidar lo profesional." },
        { texto: "Postergarla para no arriesgar tu descanso", efectos: { rendimiento: 1, forma: "regular", equipo: 0 }, resultado: "Priorizas tu rendimiento, aunque la familia se decepciona un poco." },
      ],
    },
    {
      id: "gen-67", tipo: "deportivo", personajes: ["rival"],
      pregunta: "Te enfrentas a un exjugador de tu club que se fue en malos términos.",
      opciones: [
        { texto: "Mantener la profesionalidad de siempre", efectos: { rendimiento: 1, forma: "animado", equipo: -2 }, resultado: "El partido se resuelve sin polémicas innecesarias." },
        { texto: "Dejar que las viejas rencillas se noten en la cancha", efectos: { rendimiento: -1, forma: "bajo", equipo: -1 }, resultado: "El exceso de intensidad casi te cuesta una tarjeta." },
      ],
    },
    {
      id: "gen-68", tipo: "personal", personajes: ["prensa"],
      pregunta: "Un periodista insinúa en una nota que estás perdiendo motivación.",
      opciones: [
        { texto: "Desmentirlo con hechos en la cancha", efectos: { rendimiento: 2, forma: "inspirado", equipo: -1 }, resultado: "Tu reacción en el campo calla cualquier especulación." },
        { texto: "No responder y seguir como siempre", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Dejas que los rumores se disipen solos, con el tiempo." },
      ],
    },
    {
      id: "gen-69", tipo: "deportivo", personajes: ["entrenador"],
      pregunta: "El entrenador te consulta si prefieres descansar en la doble competencia o jugar todo.",
      opciones: [
        { texto: "Pedir jugar todos los partidos posibles", efectos: { rendimiento: 1, forma: "desanimado", equipo: 1 }, resultado: "Sumas minutos valiosos, aunque el cansancio se acumula." },
        { texto: "Aceptar rotar en algunos partidos", efectos: { rendimiento: 0, forma: "plenitud", equipo: 0 }, resultado: "Llegas más fresco a los partidos más importantes." },
      ],
    },
    {
      id: "gen-70", tipo: "personal", personajes: ["companeros"],
      pregunta: "Organizas junto a tus compañeros una colecta solidaria para una escuela del barrio.",
      opciones: [
        { texto: "Liderar la iniciativa", efectos: { rendimiento: -1, forma: "inspirado", equipo: 2 }, resultado: "El gesto solidario mejora la imagen de todo el plantel." },
        { texto: "Colaborar sin protagonismo", efectos: { rendimiento: 0, forma: "regular", equipo: 1 }, resultado: "Aportas tu parte sin buscar reconocimiento extra." },
      ],
    },
    {
      id: "gen-71", tipo: "deportivo", personajes: ["hinchada"],
      pregunta: "Los hinchas piden que te quedes toda la vida en el club durante una entrevista improvisada.",
      opciones: [
        { texto: "Comprometerte públicamente con el club", efectos: { rendimiento: -1, forma: "inspirado", equipo: 1 }, resultado: "El cariño mutuo con la hinchada se fortalece aún más." },
        { texto: "Evitar comprometerte a futuro", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Prefieres no hacer promesas que no puedas cumplir." },
      ],
    },
    {
      id: "gen-72", tipo: "personal", personajes: ["familia", "pareja"],
      pregunta: "Tu pareja y tu familia no se llevan bien y eso te genera tensión constante.",
      opciones: [
        { texto: "Organizar una reunión para mediar", efectos: { rendimiento: -1, forma: "plenitud", equipo: 0 }, resultado: "Logras acercar posiciones, aliviando bastante la tensión, aunque te resta algo de concentración en lo deportivo." },
        { texto: "Evitar mezclar ambos mundos", efectos: { rendimiento: 0, forma: "desanimado", equipo: 0 }, resultado: "El problema de fondo sigue sin resolverse del todo." },
      ],
    },
    {
      id: "gen-73", tipo: "deportivo", personajes: ["rival"],
      pregunta: "Un rival histórico del club se juega el descenso en su próximo cruce contigo.",
      opciones: [
        { texto: "Jugar con la máxima seriedad de siempre", efectos: { rendimiento: 1, forma: "animado", equipo: -2 }, resultado: "Tu profesionalismo evita cualquier polémica post partido." },
        { texto: "Relajarte pensando que el resultado no te afecta", efectos: { rendimiento: -1, forma: "regular", equipo: -1 }, resultado: "Tu bajón de intensidad genera críticas del entorno." },
      ],
    },
    {
      id: "gen-74", tipo: "personal", personajes: ["agente"],
      pregunta: "Tu agente te sugiere invertir tus ahorros en un negocio fuera del fútbol.",
      opciones: [
        { texto: "Invertir con asesoramiento profesional", efectos: { rendimiento: 0, forma: "plenitud", equipo: -1 }, resultado: "Comienzas a construir un futuro económico más sólido." },
        { texto: "Preferir ahorrar de forma conservadora", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Mantienes tus finanzas simples, sin grandes riesgos." },
      ],
    },
    {
      id: "gen-75", tipo: "deportivo", personajes: ["entrenador"],
      pregunta: "El entrenador te pide opinión sobre si sancionar a un compañero por llegar tarde.",
      opciones: [
        { texto: "Pedir comprensión hacia el compañero", efectos: { rendimiento: -1, forma: "animado", equipo: 1 }, resultado: "El grupo valora tu empatía hacia los demás." },
        { texto: "Apoyar una sanción ejemplar", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "El cuerpo técnico agradece tu compromiso con la disciplina." },
      ],
    },
    {
      id: "gen-76", tipo: "personal", personajes: ["pareja"],
      pregunta: "Tu pareja te pide más presencia en redes sociales compartiendo su vida en común.",
      opciones: [
        { texto: "Compartir más momentos juntos públicamente", efectos: { rendimiento: -1, forma: "animado", equipo: 0 }, resultado: "Fortalecen su vínculo mostrando su relación con naturalidad, aunque la mayor exposición te resta algo de foco." },
        { texto: "Preferir mantener la relación en privado", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Protegen su intimidad, aunque tu pareja queda algo dolida." },
      ],
    },
    {
      id: "gen-77", tipo: "deportivo", personajes: ["companeros"],
      pregunta: "Eres elegido por tus compañeros para representar al plantel en una reunión con la dirigencia.",
      opciones: [
        { texto: "Representar con firmeza los pedidos del grupo", efectos: { rendimiento: -1, forma: "inspirado", equipo: 2 }, resultado: "Ganas el respeto y la confianza de todo el plantel." },
        { texto: "Ser conciliador para no generar conflictos", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "La reunión termina sin grandes definiciones." },
      ],
    },
    {
      id: "gen-78", tipo: "personal", personajes: ["prensa"],
      pregunta: "Se viraliza un video antiguo tuyo celebrando de forma exagerada un gol amistoso.",
      opciones: [
        { texto: "Reírte del momento públicamente", efectos: { rendimiento: 0, forma: "animado", equipo: -1 }, resultado: "El video se convierte en un momento simpático y viral." },
        { texto: "Pedir que se elimine el contenido", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Evitas la exposición, aunque el video ya circuló bastante." },
      ],
    },
    {
      id: "gen-79", tipo: "deportivo", personajes: ["rival"],
      pregunta: "Un delantero rival rompe una racha de sequía de goles justo contra tu equipo.",
      opciones: [
        { texto: "Redoblar la marca en la revancha", efectos: { rendimiento: 1, forma: "animado", equipo: -1 }, resultado: "Neutralizas por completo a tu marca en el siguiente cruce." },
        { texto: "Confiar en que fue solo un partido puntual", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "El delantero rival vuelve a lastimar al equipo después." },
      ],
    },
    {
      id: "gen-80", tipo: "personal", personajes: ["familia"],
      pregunta: "Tu familia te pide ayuda para mudarse cerca de la ciudad donde juegas.",
      opciones: [
        { texto: "Ayudarlos activamente con la mudanza", efectos: { rendimiento: -1, forma: "plenitud", equipo: 0 }, resultado: "Tenerlos cerca te da una tranquilidad enorme." },
        { texto: "Delegar la ayuda en un tercero", efectos: { rendimiento: 1, forma: "regular", equipo: 0 }, resultado: "Mantienes tu rutina, aunque no puedes acompañar tanto el proceso." },
      ],
    },
    {
      id: "gen-81", tipo: "deportivo", personajes: ["entrenador"],
      pregunta: "El cuerpo técnico detecta una fatiga acumulada en tus últimos análisis físicos.",
      opciones: [
        { texto: "Aceptar un plan de carga reducida", efectos: { rendimiento: 0, forma: "plenitud", equipo: 0 }, resultado: "Tu cuerpo agradece la pausa preventiva a tiempo." },
        { texto: "Pedir seguir al mismo ritmo", efectos: { rendimiento: 1, forma: "bajo", equipo: 0 }, resultado: "Sostienes el nivel, aunque el riesgo físico crece." },
      ],
    },
    {
      id: "gen-82", tipo: "personal", personajes: ["companeros"],
      pregunta: "Un compañero te pide dinero prestado para resolver un problema personal urgente.",
      opciones: [
        { texto: "Prestarle el dinero sin condiciones", efectos: { rendimiento: -1, forma: "plenitud", equipo: 1 }, resultado: "El gesto de confianza fortalece mucho el vínculo entre ambos." },
        { texto: "Ofrecerle ayuda de otra forma, sin dinero", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "El compañero entiende tu postura, aunque queda algo incómodo." },
      ],
    },
    {
      id: "gen-83", tipo: "deportivo", personajes: ["hinchada"],
      pregunta: "Antes de un derbi importante, la previa mediática genera una presión enorme sobre el plantel.",
      opciones: [
        { texto: "Aislarte del ruido externo", efectos: { rendimiento: 1, forma: "plenitud", equipo: 0 }, resultado: "Llegas con la cabeza fría pese a la presión ambiental." },
        { texto: "Dejarte llevar por la energía del ambiente", efectos: { rendimiento: 0, forma: "inspirado", equipo: 1 }, resultado: "La adrenalina del momento te potencia dentro de la cancha." },
      ],
    },
    {
      id: "gen-84", tipo: "personal", personajes: ["agente"],
      pregunta: "Tu agente negocia una cláusula de salida más baja a cambio de una rebaja salarial.",
      opciones: [
        { texto: "Aceptar el trato", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Ganas libertad futura a cambio de resignar algo de ingresos." },
        { texto: "Rechazar cualquier rebaja salarial", efectos: { rendimiento: 0, forma: "animado", equipo: -1 }, resultado: "Mantienes tus condiciones actuales sin cambios." },
      ],
    },
    {
      id: "gen-85", tipo: "deportivo", personajes: ["rival"],
      pregunta: "El clásico de la ciudad se juega en un ambiente hostil y cargado de tensión.",
      opciones: [
        { texto: "Bloquear el ambiente y enfocarte en el juego", efectos: { rendimiento: 1, forma: "animado", equipo: -2 }, resultado: "Tu templanza ayuda al equipo a manejar la presión del entorno." },
        { texto: "Dejarte contagiar por la tensión del momento", efectos: { rendimiento: -1, forma: "bajo", equipo: -1 }, resultado: "El nerviosismo colectivo afecta el rendimiento general del equipo." },
      ],
    },
    {
      id: "gen-86", tipo: "personal", personajes: ["familia"],
      pregunta: "Te enteras que serás tío o tía por primera vez en medio de la temporada.",
      opciones: [
        { texto: "Viajar para estar presente en el nacimiento", efectos: { rendimiento: 0, forma: "plenitud", equipo: 0 }, resultado: "El momento familiar te llena de una alegría enorme." },
        { texto: "Enviar tus felicitaciones a la distancia", efectos: { rendimiento: 1, forma: "regular", equipo: 0 }, resultado: "Cumples con tus obligaciones, aunque te hubiera gustado estar presente." },
      ],
    },
    {
      id: "gen-87", tipo: "deportivo", personajes: ["entrenador"],
      pregunta: "El entrenador te pide sinceridad sobre el nivel físico real del plantel.",
      opciones: [
        { texto: "Ser completamente honesto en tu evaluación", efectos: { rendimiento: -1, forma: "animado", equipo: 1 }, resultado: "Tu honestidad ayuda a planificar mejor la pretemporada." },
        { texto: "Suavizar la realidad para no generar alarma", efectos: { rendimiento: 0, forma: "regular", equipo: -1 }, resultado: "El plan de trabajo no se ajusta a la necesidad real del plantel." },
      ],
    },
    {
      id: "gen-88", tipo: "personal", personajes: ["prensa"],
      pregunta: "Te acusan sin fundamento de haber favorecido a un compañero en la repartición de minutos.",
      opciones: [
        { texto: "Aclarar la situación con calma", efectos: { rendimiento: -1, forma: "regular", equipo: 0 }, resultado: "La aclaración disuelve rápidamente el malentendido." },
        { texto: "Ignorar la acusación por completo", efectos: { rendimiento: 0, forma: "desanimado", equipo: -1 }, resultado: "El rumor sigue circulando dentro y fuera del vestuario." },
      ],
    },
    {
      id: "gen-89", tipo: "deportivo", personajes: ["companeros"],
      pregunta: "El equipo consigue una racha histórica de partidos invicto.",
      opciones: [
        { texto: "Celebrar el logro colectivo con humildad", efectos: { rendimiento: 0, forma: "inspirado", equipo: -2 }, resultado: "El grupo se mantiene enfocado en seguir sumando racha." },
        { texto: "Bajar la exigencia tras la buena racha", efectos: { rendimiento: -1, forma: "regular", equipo: -1 }, resultado: "La confianza excesiva pone en riesgo la racha lograda." },
      ],
    },
    {
      id: "gen-90", tipo: "personal", personajes: ["pareja"],
      pregunta: "Tu pareja consigue una oportunidad laboral importante que la haría viajar seguido.",
      opciones: [
        { texto: "Apoyarla totalmente en su carrera", efectos: { rendimiento: -1, forma: "plenitud", equipo: 0 }, resultado: "El apoyo mutuo fortalece muchísimo la relación, aunque la distancia ocasional te pesa un poco en lo futbolístico." },
        { texto: "Expresar tus dudas al respecto", efectos: { rendimiento: 0, forma: "desanimado", equipo: 0 }, resultado: "La conversación deja algo de incertidumbre en la pareja." },
      ],
    },
    {
      id: "gen-91", tipo: "deportivo", personajes: ["rival"],
      pregunta: "Un compañero de la selección juega ahora en el equipo rival y debés enfrentarlo.",
      opciones: [
        { texto: "Saludarlo con respeto antes del partido", efectos: { rendimiento: 0, forma: "animado", equipo: 0 }, resultado: "El vínculo personal no afecta la seriedad del partido." },
        { texto: "Evitar cualquier contacto antes de jugar", efectos: { rendimiento: 1, forma: "regular", equipo: 0 }, resultado: "Mantienes el foco total en la competencia." },
      ],
    },
    {
      id: "gen-92", tipo: "personal", personajes: ["familia"],
      pregunta: "Descubres que un familiar cercano atraviesa problemas económicos que no te había contado.",
      opciones: [
        { texto: "Ofrecer tu ayuda de inmediato", efectos: { rendimiento: 0, forma: "plenitud", equipo: -1 }, resultado: "Tu apoyo alivia bastante la situación familiar." },
        { texto: "Esperar a que te lo pida directamente", efectos: { rendimiento: 0, forma: "desanimado", equipo: 0 }, resultado: "La distancia con tu familiar se hace un poco más grande." },
      ],
    },
    {
      id: "gen-93", tipo: "deportivo", personajes: ["entrenador"],
      pregunta: "El cuerpo técnico prueba un nuevo sistema de juego en un amistoso de pretemporada.",
      opciones: [
        { texto: "Comprometerte al máximo pese a ser un amistoso", efectos: { rendimiento: 1, forma: "animado", equipo: -1 }, resultado: "Tu compromiso ayuda a pulir mejor el nuevo sistema." },
        { texto: "Usar el amistoso solo para probar cosas nuevas", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "El experimento deja dudas sobre su efectividad real." },
      ],
    },
    {
      id: "gen-94", tipo: "personal", personajes: ["agente"],
      pregunta: "Un reality show deportivo te invita a participar durante la pretemporada.",
      opciones: [
        { texto: "Aceptar la experiencia", efectos: { rendimiento: 0, forma: "animado", equipo: 0 }, resultado: "Ganas mucha popularidad fuera del ambiente futbolístico." },
        { texto: "Rechazar para enfocarte en la pretemporada", efectos: { rendimiento: 1, forma: "plenitud", equipo: -1 }, resultado: "Llegas mejor preparado físicamente al inicio de la temporada." },
      ],
    },
    {
      id: "gen-95", tipo: "deportivo", personajes: ["companeros"],
      pregunta: "Un compañero de toda la vida en el club decide no renovar su contrato.",
      opciones: [
        { texto: "Organizar una despedida especial para él", efectos: { rendimiento: -1, forma: "plenitud", equipo: 1 }, resultado: "El gesto emociona a todo el plantel y al propio compañero." },
        { texto: "Vivirlo como una salida más del plantel", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "La partida pasa sin mayor relevancia para el grupo." },
      ],
    },
    {
      id: "gen-96", tipo: "personal", personajes: ["hinchada"],
      pregunta: "Eres elegido por los hinchas como el jugador más querido de la temporada.",
      opciones: [
        { texto: "Recibir el reconocimiento con humildad", efectos: { rendimiento: 0, forma: "inspirado", equipo: -1 }, resultado: "El cariño de la gente te motiva a seguir dando lo mejor." },
        { texto: "Restarle importancia al reconocimiento", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Agradeces el gesto, sin darle mayor trascendencia pública." },
      ],
    },
    {
      id: "gen-97", tipo: "deportivo", personajes: ["rival"],
      pregunta: "Antes del partido de vuelta, tu equipo arrastra una desventaja ajustada del partido de ida.",
      opciones: [
        { texto: "Motivar al plantel para dar vuelta la serie", efectos: { rendimiento: 1, forma: "inspirado", equipo: -1 }, resultado: "El equipo sale con una actitud renovada a buscar la clasificación." },
        { texto: "Jugar con cautela para no arriesgar de más", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "El equipo juega con más prudencia de la necesaria." },
      ],
    },
    {
      id: "gen-98", tipo: "personal", personajes: ["familia"],
      pregunta: "Tienes la posibilidad de comprarle una casa a tus padres con tus ahorros.",
      opciones: [
        { texto: "Comprarles la casa cuanto antes", efectos: { rendimiento: 0, forma: "plenitud", equipo: -1 }, resultado: "La alegría de tu familia te llena de una satisfacción enorme." },
        { texto: "Esperar a tener más estabilidad económica", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Prefieres actuar con cautela financiera por el momento." },
      ],
    },
    {
      id: "gen-99", tipo: "deportivo", personajes: ["entrenador"],
      pregunta: "El entrenador te confiesa en privado que confía en ti para liderar el recambio generacional del equipo.",
      opciones: [
        { texto: "Aceptar el desafío con compromiso", efectos: { rendimiento: 1, forma: "inspirado", equipo: -1 }, resultado: "Asumes con orgullo el nuevo rol dentro del proyecto." },
        { texto: "Expresar dudas sobre asumir ese peso", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "El entrenador respeta tu sinceridad, aunque queda pensando en otras opciones." },
      ],
    },
    {
      id: "gen-100", tipo: "personal", personajes: ["pareja"],
      pregunta: "Con tu pareja deciden dar un paso importante y comprometerse formalmente.",
      opciones: [
        { texto: "Celebrarlo junto a familia y amigos", efectos: { rendimiento: 0, forma: "inspirado", equipo: -1 }, resultado: "El compromiso te llena de una felicidad que se nota hasta en la cancha." },
        { texto: "Mantenerlo en la intimidad por ahora", efectos: { rendimiento: 0, forma: "plenitud", equipo: 0 }, resultado: "Disfrutan el momento a su manera, sin exposición pública." },
      ],
    },
  ],

  // ---------------- EVENTOS POR RANGO DE EDAD (104) ----------------
  porEdad: {
    // ---- NOVATO: edad <= 21 (17 eventos) ----
    novato: [
      {
        id: "nov-01", tipo: "deportivo", personajes: ["entrenador"],
        pregunta: "Es tu primer llamado a entrenar con el plantel principal y los nervios te dominan.",
        opciones: [
          { texto: "Mostrarte con confianza pese a los nervios", efectos: { rendimiento: 2, forma: "inspirado", equipo: -1 }, resultado: "Sorprendes al cuerpo técnico con tu personalidad en la cancha." },
          { texto: "Mantenerte discreto y observar a los mayores", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Aprendes mucho observando, aunque pasas algo desapercibido." },
        ],
      },
      {
        id: "nov-02", tipo: "personal", personajes: ["companeros"],
        pregunta: "Los jugadores veteranos del plantel te hacen una broma de iniciación.",
        opciones: [
          { texto: "Seguirles el juego con buena actitud", efectos: { rendimiento: -1, forma: "animado", equipo: 2 }, resultado: "Te ganas rápido el cariño y respeto del vestuario." },
          { texto: "Tomarlo con seriedad y pedir respeto", efectos: { rendimiento: 0, forma: "regular", equipo: -1 }, resultado: "Marcas un límite, aunque quedas algo distanciado del grupo." },
        ],
      },
      {
        id: "nov-03", tipo: "deportivo", personajes: ["entrenador"],
        pregunta: "El entrenador te da minutos en un partido importante antes de lo esperado.",
        opciones: [
          { texto: "Asumir el desafío con decisión", efectos: { rendimiento: 2, forma: "inspirado", equipo: -1 }, resultado: "Respondes a la altura y ganas la confianza del cuerpo técnico." },
          { texto: "Jugar con extrema cautela para no arriesgar", efectos: { rendimiento: -1, forma: "regular", equipo: 0 }, resultado: "Cumples sin sobresaltos, aunque sin destacar demasiado." },
        ],
      },
      {
        id: "nov-04", tipo: "personal", personajes: ["prensa"],
        pregunta: "Un medio te define como \"la próxima gran promesa\" del club.",
        opciones: [
          { texto: "Disfrutar la exposición con humildad", efectos: { rendimiento: 1, forma: "animado", equipo: -1 }, resultado: "Manejas bien la presión mediática desde el primer momento." },
          { texto: "Evitar leer o comentar la nota", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Prefieres mantenerte al margen del ruido mediático." },
        ],
      },
      {
        id: "nov-05", tipo: "personal", personajes: ["familia"],
        pregunta: "Extrañas mucho tu ciudad natal en tus primeros meses lejos de casa.",
        opciones: [
          { texto: "Hablar seguido con tu familia por videollamada", efectos: { rendimiento: 0, forma: "plenitud", equipo: 0 }, resultado: "El contacto constante te ayuda a sentirte más acompañado." },
          { texto: "Enfocarte por completo en la nueva rutina", efectos: { rendimiento: 1, forma: "desanimado", equipo: 0 }, resultado: "Te adaptas rápido, aunque la nostalgia pesa en algunos momentos." },
        ],
      },
      {
        id: "nov-06", tipo: "deportivo", personajes: ["companeros"],
        pregunta: "Un jugador veterano te ofrece enseñarte trucos tácticos después de los entrenamientos.",
        opciones: [
          { texto: "Aceptar las clases extra con entusiasmo", efectos: { rendimiento: 2, forma: "animado", equipo: -1 }, resultado: "Aprendes conceptos que aceleran notablemente tu desarrollo." },
          { texto: "Preferir entrenar por tu cuenta", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Avanzas a tu propio ritmo, sin la guía de un veterano." },
        ],
      },
      {
        id: "nov-07", tipo: "personal", personajes: ["agente"],
        pregunta: "Tu agente te presiona para firmar tu primer contrato profesional cuanto antes.",
        opciones: [
          { texto: "Firmar rápido para asegurar tu lugar", efectos: { rendimiento: 0, forma: "animado", equipo: -1 }, resultado: "Aseguras estabilidad económica, aunque firmas sin mucha experiencia." },
          { texto: "Tomarte tiempo para evaluar bien la oferta", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Ganas tranquilidad al no apresurar una decisión tan importante." },
        ],
      },
      {
        id: "nov-08", tipo: "deportivo", personajes: ["rival"], debut: true,
        pregunta: "Un defensor experimentado te marca de forma intimidante en tu debut.",
        opciones: [
          { texto: "Encarar el desafío sin bajar los brazos", efectos: { rendimiento: 2, forma: "inspirado", equipo: -1 }, resultado: "Le ganas varios duelos y ganas confianza para el resto de la temporada." },
          { texto: "Jugar de manera más conservadora", efectos: { rendimiento: -1, forma: "regular", equipo: 0 }, resultado: "Evitas riesgos, aunque no logras destacar en tu debut." },
        ],
      },
      {
        id: "nov-09", tipo: "personal", personajes: ["hinchada"],
        pregunta: "Los hinchas más jóvenes ya piden tu camiseta en la tienda del club.",
        opciones: [
          { texto: "Sacarte fotos y firmar camisetas con gusto", efectos: { rendimiento: 0, forma: "animado", equipo: -1 }, resultado: "Te ganas el cariño temprano de una nueva generación de hinchas." },
          { texto: "Mantener bajo perfil pese a la popularidad", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Sigues enfocado en lo deportivo, sin buscar mayor exposición." },
        ],
      },
      {
        id: "nov-10", tipo: "deportivo", personajes: ["entrenador"],
        pregunta: "El entrenador te pide más paciencia antes de exigir la titularidad.",
        opciones: [
          { texto: "Aceptar el proceso con humildad", efectos: { rendimiento: 0, forma: "plenitud", equipo: 1 }, resultado: "Tu madurez sorprende gratamente al cuerpo técnico." },
          { texto: "Insistir en que estás listo para ser titular", efectos: { rendimiento: 1, forma: "desanimado", equipo: -1 }, resultado: "Tu insistencia genera algo de fricción con el entrenador." },
        ],
      },
      {
        id: "nov-11", tipo: "personal", personajes: ["companeros"],
        pregunta: "Un compañero de tu edad te invita a salir de fiesta la noche antes de un entrenamiento fuerte.",
        opciones: [
          { texto: "Rechazar la invitación por el entrenamiento", efectos: { rendimiento: 1, forma: "regular", equipo: -1 }, resultado: "Llegas fresco y con energía a la sesión del día siguiente." },
          { texto: "Aceptar la salida por un rato", efectos: { rendimiento: -1, forma: "desanimado", equipo: 0 }, resultado: "Llegas algo cansado y te cuesta rendir al máximo nivel." },
        ],
      },
      {
        id: "nov-12", tipo: "deportivo", personajes: ["rival", "companeros"],
        pregunta: "Juegas tu primer clásico y la presión del ambiente te resulta abrumadora.",
        opciones: [
          { texto: "Buscar apoyo en un compañero experimentado", efectos: { rendimiento: 1, forma: "animado", equipo: -1 }, resultado: "Sus consejos te ayudan a manejar mejor la presión del momento." },
          { texto: "Enfrentar la presión completamente solo", efectos: { rendimiento: 0, forma: "bajo", equipo: 0 }, resultado: "Te cuesta bastante manejar los nervios en un ambiente tan intenso." },
        ],
      },
      {
        id: "nov-13", tipo: "personal", personajes: ["prensa"],
        pregunta: "Recibes tu primera crítica dura de un periodista tras un partido flojo.",
        opciones: [
          { texto: "Tomarla como aprendizaje y seguir adelante", efectos: { rendimiento: 1, forma: "animado", equipo: -1 }, resultado: "Usas la crítica como combustible para mejorar cada día." },
          { texto: "Sentirte muy afectado por la crítica", efectos: { rendimiento: -1, forma: "bajo", equipo: 0 }, resultado: "La crítica te pesa más de lo que esperabas en los días siguientes." },
        ],
      },
      {
        id: "nov-14", tipo: "deportivo", personajes: ["entrenador", "agente"],
        pregunta: "Te preguntan si prefieres ir a préstamo a otro club para sumar más minutos.",
        opciones: [
          { texto: "Aceptar salir a préstamo", efectos: { rendimiento: 1, forma: "animado", equipo: -1 }, resultado: "Ganas experiencia valiosa jugando con mayor continuidad." },
          { texto: "Preferir quedarte a pelear un lugar en el plantel principal", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Sigues entrenando con el primer equipo, aunque con pocos minutos." },
        ],
      },
      {
        id: "nov-15", tipo: "personal", personajes: ["familia"],
        pregunta: "Con tu primer sueldo importante, no sabes bien cómo administrar el dinero.",
        opciones: [
          { texto: "Buscar asesoramiento financiero profesional", efectos: { rendimiento: 0, forma: "plenitud", equipo: -1 }, resultado: "Empiezas a manejar tus finanzas de forma responsable desde joven." },
          { texto: "Gastarlo en algo que siempre quisiste", efectos: { rendimiento: 0, forma: "animado", equipo: 0 }, resultado: "Disfrutas el momento, aunque sin un plan financiero claro." },
        ],
      },
      {
        id: "nov-16", tipo: "deportivo", personajes: ["companeros"],
        pregunta: "Te dan la oportunidad de patear un penal decisivo en tu segundo partido como profesional.",
        opciones: [
          { texto: "Asumir la responsabilidad de patear", efectos: { rendimiento: 2, forma: "inspirado", equipo: -1 }, resultado: "Conviertes y ganas una confianza enorme de cara al futuro." },
          { texto: "Cederle el penal a un compañero con más experiencia", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Evitas la presión extra, dejando la responsabilidad en otro jugador." },
        ],
      },
      {
        id: "nov-17", tipo: "personal", personajes: ["agente"],
        pregunta: "Un club grande del exterior pregunta informalmente por tu situación, siendo tan joven.",
        opciones: [
          { texto: "Ilusionarte con la posibilidad a futuro", efectos: { rendimiento: 1, forma: "inspirado", equipo: -1 }, resultado: "La noticia te motiva a redoblar el esfuerzo cada día." },
          { texto: "No darle importancia todavía", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Prefieres mantener los pies sobre la tierra por ahora." },
        ],
      },
      {
        id: "nov-18", tipo: "deportivo", personajes: ["entrenador"],
        pregunta: "En un entrenamiento exigente, cometes un error que genera burlas de algunos veteranos.",
        opciones: [
          { texto: "Reírte también y no tomarlo personal", efectos: { rendimiento: 0, forma: "animado", equipo: -1 }, resultado: "Ganas simpatía dentro del grupo por tu buena actitud." },
          { texto: "Sentirte muy afectado por las burlas", efectos: { rendimiento: -1, forma: "bajo", equipo: 0 }, resultado: "Te cuesta sacarte el momento incómodo de la cabeza." },
        ],
      },
      {
        id: "nov-19", tipo: "personal", personajes: ["familia"],
        pregunta: "Vives solo por primera vez, lejos de tu familia, y te cuesta organizar tu día a día.",
        opciones: [
          { texto: "Pedir ayuda a un compañero más grande", efectos: { rendimiento: -1, forma: "animado", equipo: 1 }, resultado: "Aprendes rápido a organizar tu nueva rutina de vida." },
          { texto: "Resolverlo todo por tu cuenta", efectos: { rendimiento: 0, forma: "desanimado", equipo: 0 }, resultado: "Te cuesta bastante adaptarte a vivir solo tan joven." },
        ],
      },
      {
        id: "nov-20", tipo: "deportivo", personajes: ["rival"],
        pregunta: "En un partido de reserva, un rival mucho mayor te trata con dureza física.",
        opciones: [
          { texto: "Responder con el juego, sin provocaciones", efectos: { rendimiento: 1, forma: "animado", equipo: -1 }, resultado: "Ganas experiencia valiosa sobre cómo manejar la intensidad." },
          { texto: "Dejarte intimidar por la diferencia física", efectos: { rendimiento: -1, forma: "bajo", equipo: 0 }, resultado: "El partido se te hace muy cuesta arriba mentalmente." },
        ],
      },
      {
        id: "nov-21", tipo: "personal", personajes: ["prensa"],
        pregunta: "Un video tuyo entrenando se viraliza y de la noche a la mañana ganas miles de seguidores.",
        opciones: [
          { texto: "Manejar tus redes con cabeza fría", efectos: { rendimiento: 0, forma: "animado", equipo: -1 }, resultado: "Aprovechas la ola de popularidad sin perder el foco." },
          { texto: "Dejarte absorber por la nueva atención", efectos: { rendimiento: -1, forma: "regular", equipo: 0 }, resultado: "Te distraes más de lo que esperabas con las redes sociales." },
        ],
      },
      {
        id: "nov-22", tipo: "deportivo", personajes: ["companeros"],
        pregunta: "En tu primer viaje largo con el plantel, no conoces a casi nadie del grupo.",
        opciones: [
          { texto: "Acercarte activamente a hacer amigos", efectos: { rendimiento: -1, forma: "plenitud", equipo: 2 }, resultado: "Te integras rápido y el viaje se hace mucho más ameno." },
          { texto: "Mantenerte reservado durante todo el viaje", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "El viaje pasa sin pena ni gloria en lo social." },
        ],
      },
      {
        id: "nov-23", tipo: "personal", personajes: ["agente"],
        pregunta: "Te ofrecen tu primer contrato de representación siendo muy joven todavía.",
        opciones: [
          { texto: "Firmar con un agente reconocido", efectos: { rendimiento: 0, forma: "animado", equipo: -1 }, resultado: "Ganas respaldo profesional para encarar tu carrera." },
          { texto: "Esperar a tener más trayectoria antes de firmar", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Prefieres no atarte a nadie todavía." },
        ],
      },
      {
        id: "nov-24", tipo: "deportivo", personajes: ["entrenador"],
        pregunta: "Te expulsan por primera vez en tu carrera profesional por una entrada innecesaria.",
        opciones: [
          { texto: "Asumir el error y pedir disculpas al grupo", efectos: { rendimiento: -1, forma: "desanimado", equipo: 1 }, resultado: "El plantel valora tu madurez para reconocer el error." },
          { texto: "Justificar la jugada como parte del fútbol", efectos: { rendimiento: 0, forma: "bajo", equipo: -1 }, resultado: "El entrenador espera una autocrítica que no llega." },
        ],
      },
      {
        id: "nov-25", tipo: "personal", personajes: ["pareja"],
        pregunta: "Tu primer romance serio se complica por la distancia que impone tu nueva carrera.",
        opciones: [
          { texto: "Esforzarte por mantener viva la relación", efectos: { rendimiento: 0, forma: "plenitud", equipo: 0 }, resultado: "Ambos aprenden a sostener el vínculo pese a la distancia." },
          { texto: "Dejar que la relación se enfríe naturalmente", efectos: { rendimiento: 1, forma: "regular", equipo: 0 }, resultado: "Te concentras por completo en tu carrera, sin distracciones." },
        ],
      },
      {
        id: "nov-26", tipo: "deportivo", personajes: ["companeros"],
        pregunta: "Un ídolo del club, ya veterano, te elige como su recambio directo en el equipo.",
        opciones: [
          { texto: "Absorber todo lo posible de su experiencia", efectos: { rendimiento: 2, forma: "inspirado", equipo: -1 }, resultado: "Su guía acelera muchísimo tu crecimiento futbolístico." },
          { texto: "Sentir la presión de reemplazar a un ídolo", efectos: { rendimiento: -1, forma: "bajo", equipo: 0 }, resultado: "La comparación constante te genera bastante ansiedad." },
        ],
      },
      {
        id: "nov-27", tipo: "personal", personajes: ["familia"],
        pregunta: "Tu familia viaja por primera vez a verte jugar en un estadio internacional.",
        opciones: [
          { texto: "Encargarte de organizar todo su viaje", efectos: { rendimiento: 0, forma: "plenitud", equipo: 0 }, resultado: "Tenerlos cerca te llena de tranquilidad y motivación." },
          { texto: "Delegar la organización en tu agente", efectos: { rendimiento: 1, forma: "regular", equipo: 0 }, resultado: "Puedes enfocarte en el partido sin distracciones logísticas." },
        ],
      },
      {
        id: "nov-28", tipo: "deportivo", personajes: ["rival"],
        pregunta: "En un torneo juvenil internacional, te comparan constantemente con una futura estrella rival.",
        opciones: [
          { texto: "Usar la comparación como motivación", efectos: { rendimiento: 2, forma: "inspirado", equipo: -1 }, resultado: "Rindes por encima de las expectativas puestas en ti." },
          { texto: "Sentir que la comparación te pesa demasiado", efectos: { rendimiento: -1, forma: "bajo", equipo: 0 }, resultado: "La presión externa afecta bastante tu naturalidad de juego." },
        ],
      },
      {
        id: "nov-29", tipo: "personal", personajes: ["prensa"],
        pregunta: "Te invitan a tu primera conferencia de prensa importante como profesional.",
        opciones: [
          { texto: "Prepararte a fondo para las preguntas", efectos: { rendimiento: 0, forma: "animado", equipo: -1 }, resultado: "Manejas la conferencia con una soltura sorprendente." },
          { texto: "Ir sin mayor preparación", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Respondes con nervios, aunque sin mayores inconvenientes." },
        ],
      },
      {
        id: "nov-30", tipo: "deportivo", personajes: ["entrenador"],
        pregunta: "El cuerpo técnico te felicita en privado, pero te pide no confiarte demasiado.",
        opciones: [
          { texto: "Tomar el consejo con humildad", efectos: { rendimiento: 1, forma: "plenitud", equipo: -1 }, resultado: "Mantienes los pies sobre la tierra pese a los elogios." },
          { texto: "Sentir que ya lo lograste todo", efectos: { rendimiento: -1, forma: "regular", equipo: 0 }, resultado: "El exceso de confianza empieza a notarse en tu juego." },
        ],
      },
      {
        id: "nov-31", tipo: "personal", personajes: ["companeros"],
        pregunta: "En una previa de partido importante, los veteranos organizan una parrillada de camaradería con permiso especial.",
        opciones: [
          { texto: "Disfrutar del momento con moderación", efectos: { rendimiento: 0, forma: "animado", equipo: 2 }, resultado: "El buen momento grupal fortalece mucho tu integración." },
          { texto: "Retirarte temprano para cuidar tu descanso", efectos: { rendimiento: 1, forma: "regular", equipo: 0 }, resultado: "Cuidas tu físico, aunque te pierdes parte del buen momento grupal." },
        ],
      },
      {
        id: "nov-32", tipo: "deportivo", personajes: ["rival"], debut: true,
        pregunta: "Debutas en un estadio gigante y el ruido de la hinchada rival te resulta abrumador.",
        opciones: [
          { texto: "Concentrarte en tu propia respiración y juego", efectos: { rendimiento: 1, forma: "animado", equipo: -1 }, resultado: "Logras bloquear el ruido externo y rendir a tu nivel." },
          { texto: "Dejarte intimidar por el ambiente hostil", efectos: { rendimiento: -1, forma: "bajo", equipo: 0 }, resultado: "El ambiente te supera durante buena parte del partido." },
        ],
      },
      {
        id: "nov-33", tipo: "personal", personajes: ["familia"],
        pregunta: "Tienes que decidir si repartir tu primer sueldo grande entre ayudar a tu familia o ahorrar para ti.",
        opciones: [
          { texto: "Priorizar ayudar a tu familia", efectos: { rendimiento: 0, forma: "plenitud", equipo: -1 }, resultado: "La alegría de poder ayudar en casa no tiene precio." },
          { texto: "Ahorrar pensando en tu futuro", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Construyes una base financiera sólida desde joven." },
        ],
      },
      {
        id: "nov-34", tipo: "deportivo", personajes: ["entrenador"],
        pregunta: "Te ofrecen ir a la selección juvenil justo cuando empezabas a sumar ritmo en el club.",
        opciones: [
          { texto: "Aceptar el llamado a la selección", efectos: { rendimiento: 1, forma: "inspirado", equipo: -1 }, resultado: "Vives una experiencia enorme, aunque pierdes continuidad en el club." },
          { texto: "Priorizar tu proceso en el club", efectos: { rendimiento: 0, forma: "regular", equipo: 1 }, resultado: "El cuerpo técnico valora tu compromiso con el proyecto local." },
        ],
      },
      {
        id: "nov-35", tipo: "personal", personajes: ["agente"],
        pregunta: "Descubres que tu primer agente no te estaba representando de la mejor manera.",
        opciones: [
          { texto: "Cambiarte a un agente de mayor confianza", efectos: { rendimiento: 0, forma: "animado", equipo: -1 }, resultado: "Sientes un gran alivio al tener mejor respaldo profesional." },
          { texto: "Darle una segunda oportunidad", efectos: { rendimiento: 0, forma: "desanimado", equipo: 0 }, resultado: "La incertidumbre sobre tu representación sigue presente." },
        ],
      },
    ],

    // ---- PROMEDIO: entre 22 y 32 (35 eventos) ----
    promedio: [
      {
        id: "prom-01", tipo: "deportivo", personajes: ["entrenador", "companeros"],
        pregunta: "El club te ofrece la cinta de capitán de forma permanente.",
        opciones: [
          { texto: "Aceptar la capitanía", efectos: { rendimiento: 1, forma: "inspirado", equipo: -1 }, resultado: "Asumes el liderazgo con naturalidad y el grupo responde muy bien." },
          { texto: "Declinar y sugerir a otro compañero", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Prefieres seguir enfocado solo en lo futbolístico, sin cargos extra." },
        ],
      },
      {
        id: "prom-02", tipo: "personal", personajes: ["familia", "pareja"],
        pregunta: "Te enteras que vas a ser padre o madre en plena temporada competitiva.",
        opciones: [
          { texto: "Reorganizar tu rutina para equilibrar todo", efectos: { rendimiento: 0, forma: "plenitud", equipo: 0 }, resultado: "Logras compatibilizar bien la noticia familiar con tu carrera." },
          { texto: "Enfocarte totalmente en lo deportivo por ahora", efectos: { rendimiento: 1, forma: "desanimado", equipo: 0 }, resultado: "Rindes bien en la cancha, aunque sientes que descuidas lo personal." },
        ],
      },
      {
        id: "prom-03", tipo: "deportivo", personajes: ["companeros", "entrenador"],
        pregunta: "Un fichaje nuevo y prometedor amenaza con quitarte el puesto titular.",
        opciones: [
          { texto: "Redoblar el esfuerzo en cada entrenamiento", efectos: { rendimiento: 2, forma: "inspirado", equipo: 0 }, resultado: "Tu nivel obliga al entrenador a seguir confiando en ti." },
          { texto: "Aceptar con deportividad una posible rotación", efectos: { rendimiento: 0, forma: "regular", equipo: 1 }, resultado: "El buen clima interno se mantiene, aunque arriesgas minutos." },
        ],
      },
      {
        id: "prom-04", tipo: "personal", personajes: ["agente"],
        pregunta: "Te ofrecen renovar contrato por varios años con una mejora salarial importante.",
        opciones: [
          { texto: "Renovar de inmediato", efectos: { rendimiento: -1, forma: "plenitud", equipo: 1 }, resultado: "Ganas estabilidad y tranquilidad para encarar el resto de la temporada." },
          { texto: "Negociar condiciones adicionales antes de firmar", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "La negociación se extiende, generando algo de incertidumbre." },
        ],
      },
      {
        id: "prom-05", tipo: "deportivo", personajes: ["companeros"],
        pregunta: "Un compañero joven te pide consejos constantemente y te distrae un poco de tu rutina.",
        opciones: [
          { texto: "Dedicarle tiempo como mentor", efectos: { rendimiento: -1, forma: "animado", equipo: 2 }, resultado: "El joven mejora notablemente y el grupo valora tu generosidad." },
          { texto: "Poner límites para cuidar tu propio enfoque", efectos: { rendimiento: 1, forma: "regular", equipo: 0 }, resultado: "Mantienes tu nivel, aunque el joven crece con más lentitud." },
        ],
      },
      {
        id: "prom-06", tipo: "personal", personajes: ["prensa"],
        pregunta: "Te ofrecen un espacio fijo como comentarista en un programa deportivo.",
        opciones: [
          { texto: "Aceptar el nuevo espacio mediático", efectos: { rendimiento: 0, forma: "animado", equipo: 0 }, resultado: "Disfrutas la nueva faceta, aunque te resta algo de tiempo libre." },
          { texto: "Rechazar para enfocarte solo en lo deportivo", efectos: { rendimiento: 1, forma: "regular", equipo: 0 }, resultado: "Mantienes el máximo foco en tu rendimiento en cancha." },
        ],
      },
      {
        id: "prom-07", tipo: "deportivo", personajes: ["entrenador"],
        pregunta: "Llega un nuevo entrenador con ideas tácticas muy distintas a las habituales.",
        opciones: [
          { texto: "Adaptarte con una mente abierta", efectos: { rendimiento: 1, forma: "animado", equipo: -2 }, resultado: "Te ganas rápido la confianza del nuevo cuerpo técnico." },
          { texto: "Mostrarte reacio a los cambios", efectos: { rendimiento: -1, forma: "desanimado", equipo: -1 }, resultado: "Te cuesta adaptarte y la relación con el entrenador arranca fría." },
        ],
      },
      {
        id: "prom-08", tipo: "personal", personajes: ["pareja"],
        pregunta: "Con tu pareja evalúan comprar su primera propiedad juntos.",
        opciones: [
          { texto: "Avanzar con la compra", efectos: { rendimiento: 0, forma: "plenitud", equipo: 0 }, resultado: "El nuevo proyecto de vida te da estabilidad emocional." },
          { texto: "Esperar a que termine la temporada", efectos: { rendimiento: 1, forma: "regular", equipo: 0 }, resultado: "Mantienes la cabeza enfocada solo en lo deportivo por ahora." },
        ],
      },
      {
        id: "prom-09", tipo: "deportivo", personajes: ["companeros", "entrenador"],
        pregunta: "Te ofrecen ser el referente del equipo en los partidos más difíciles de la temporada.",
        opciones: [
          { texto: "Asumir el rol de referente", efectos: { rendimiento: 2, forma: "inspirado", equipo: 0 }, resultado: "Tu liderazgo marca la diferencia en los momentos clave." },
          { texto: "Preferir compartir la responsabilidad con otros", efectos: { rendimiento: 0, forma: "regular", equipo: 1 }, resultado: "El grupo reparte mejor la presión entre varios jugadores." },
        ],
      },
      {
        id: "prom-10", tipo: "personal", personajes: ["agente"],
        pregunta: "Un club de una liga más competitiva pregunta formalmente por tu fichaje.",
        opciones: [
          { texto: "Mostrarte abierto a la posibilidad", efectos: { rendimiento: 1, forma: "inspirado", equipo: -1 }, resultado: "La ilusión del nuevo desafío te motiva, aunque genera ruido en el plantel." },
          { texto: "Priorizar tu compromiso actual con el club", efectos: { rendimiento: 0, forma: "plenitud", equipo: 1 }, resultado: "Tu lealtad refuerza la confianza del entorno hacia ti." },
        ],
      },
      {
        id: "prom-11", tipo: "deportivo", personajes: ["companeros"],
        pregunta: "El vestuario está dividido por diferencias con el nuevo esquema táctico.",
        opciones: [
          { texto: "Mediar para unificar posturas", efectos: { rendimiento: -1, forma: "animado", equipo: 2 }, resultado: "Tu intervención ayuda a recomponer el clima grupal." },
          { texto: "Mantenerte al margen de la discusión", efectos: { rendimiento: 0, forma: "regular", equipo: -1 }, resultado: "La tensión interna sigue latente por un tiempo más." },
        ],
      },
      {
        id: "prom-12", tipo: "personal", personajes: ["familia"],
        pregunta: "Empiezas a pensar en estudiar para obtener tu licencia de entrenador a futuro.",
        opciones: [
          { texto: "Comenzar el curso en paralelo a la temporada", efectos: { rendimiento: 0, forma: "animado", equipo: -1 }, resultado: "Disfrutas aprender una nueva faceta del fútbol desde otra mirada." },
          { texto: "Postergarlo para el final de tu carrera", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Prefieres mantener el cien por ciento del foco en jugar." },
        ],
      },
      {
        id: "prom-13", tipo: "deportivo", personajes: ["entrenador"],
        pregunta: "El entrenador te pide asumir minutos extra por una baja inesperada en tu posición.",
        opciones: [
          { texto: "Aceptar la sobrecarga de minutos", efectos: { rendimiento: 1, forma: "desanimado", equipo: 1 }, resultado: "El equipo se beneficia, aunque el desgaste físico se empieza a notar." },
          { texto: "Pedir cuidar tu carga de minutos", efectos: { rendimiento: 0, forma: "plenitud", equipo: 0 }, resultado: "Cuidas tu estado físico pensando en el resto de la temporada." },
        ],
      },
      {
        id: "prom-14", tipo: "personal", personajes: ["prensa"],
        pregunta: "Un periodista te pregunta directamente si te ves como el próximo capitán del club.",
        opciones: [
          { texto: "Responder con ambición y seguridad", efectos: { rendimiento: 1, forma: "inspirado", equipo: -1 }, resultado: "Tu declaración genera expectativas positivas en el entorno del club." },
          { texto: "Responder con humildad, sin adelantar nada", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Evitas generar presión extra sobre ti mismo." },
        ],
      },
      {
        id: "prom-15", tipo: "deportivo", personajes: ["rival"],
        pregunta: "Te toca marcar al máximo goleador de la liga en el próximo partido.",
        opciones: [
          { texto: "Prepararte a fondo para el duelo individual", efectos: { rendimiento: 2, forma: "animado", equipo: -1 }, resultado: "Neutralizas bien a tu rival directo durante todo el partido." },
          { texto: "Confiar en tu experiencia habitual", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Cumples correctamente, sin sobresaltos ni grandes destaques." },
        ],
      },
      {
        id: "prom-16", tipo: "personal", personajes: ["pareja", "familia"],
        pregunta: "Tu pareja te pide reducir los viajes familiares por la carga de partidos de la temporada.",
        opciones: [
          { texto: "Aceptar reducir los viajes", efectos: { rendimiento: 1, forma: "regular", equipo: 0 }, resultado: "Ganas descanso extra, aunque extrañas los momentos familiares." },
          { texto: "Mantener los viajes como forma de desconectar", efectos: { rendimiento: 0, forma: "plenitud", equipo: 0 }, resultado: "Llegas con la cabeza despejada, aunque algo más cansado físicamente." },
        ],
      },
      {
        id: "prom-17", tipo: "deportivo", personajes: ["companeros"],
        pregunta: "Eres el jugador con más experiencia en una posición clave y un rival directo por el puesto llega al plantel.",
        opciones: [
          { texto: "Ayudar a integrarlo pese a la competencia", efectos: { rendimiento: 0, forma: "plenitud", equipo: 2 }, resultado: "El buen gesto fortalece el vestuario, aunque compartes protagonismo." },
          { texto: "Marcar distancia para proteger tu lugar", efectos: { rendimiento: 1, forma: "regular", equipo: -1 }, resultado: "Aseguras tu titularidad, aunque el ambiente queda algo más frío." },
        ],
      },
      {
        id: "prom-18", tipo: "deportivo", personajes: ["entrenador"],
        pregunta: "El club evalúa venderte para hacer caja, pese a que rindes a buen nivel.",
        opciones: [
          { texto: "Pedir que respeten tu continuidad", efectos: { rendimiento: 0, forma: "desanimado", equipo: 0 }, resultado: "El club valora tu palabra, aunque la incertidumbre no se disipa del todo." },
          { texto: "Mostrarte abierto a una salida", efectos: { rendimiento: 0, forma: "regular", equipo: -1 }, resultado: "Empiezan a moverse alternativas de salida en el mercado." },
        ],
      },
      {
        id: "prom-19", tipo: "personal", personajes: ["pareja"],
        pregunta: "Tu pareja te propone terapia de pareja para fortalecer la relación en medio de tanto viaje.",
        opciones: [
          { texto: "Aceptar y comprometerte con el proceso", efectos: { rendimiento: 0, forma: "plenitud", equipo: -1 }, resultado: "La relación mejora notablemente con el tiempo." },
          { texto: "Sentir que no es necesario", efectos: { rendimiento: 0, forma: "desanimado", equipo: 0 }, resultado: "La relación queda en un punto de tensión sin resolver." },
        ],
      },
      {
        id: "prom-20", tipo: "deportivo", personajes: ["companeros"],
        pregunta: "Eres el jugador con el salario más alto del plantel y eso genera algo de envidia.",
        opciones: [
          { texto: "Ser generoso y cercano con todo el grupo", efectos: { rendimiento: -1, forma: "animado", equipo: 2 }, resultado: "Tu actitud disuelve cualquier resentimiento en el vestuario." },
          { texto: "Ignorar los comentarios y seguir tu rutina", efectos: { rendimiento: 0, forma: "regular", equipo: -1 }, resultado: "Algunas miradas incómodas persisten dentro del plantel." },
        ],
      },
      {
        id: "prom-21", tipo: "personal", personajes: ["familia"],
        pregunta: "Tus padres empiezan a tener problemas de pareja y te piden consejo.",
        opciones: [
          { texto: "Escucharlos y acompañarlos en el proceso", efectos: { rendimiento: -1, forma: "desanimado", equipo: 0 }, resultado: "Estar presente para tu familia te resta algo de energía mental." },
          { texto: "Mantener distancia del conflicto", efectos: { rendimiento: 1, forma: "regular", equipo: -1 }, resultado: "Proteges tu cabeza para el fútbol, aunque sientes cierta culpa." },
        ],
      },
      {
        id: "prom-22", tipo: "deportivo", personajes: ["rival"],
        pregunta: "Un exjugador tuyo del club ahora juega para el clásico rival de la ciudad.",
        opciones: [
          { texto: "Vivirlo con total profesionalismo", efectos: { rendimiento: 1, forma: "animado", equipo: -2 }, resultado: "El partido se resuelve sin mayores tensiones extra." },
          { texto: "Dejar que la rivalidad personal se note", efectos: { rendimiento: -1, forma: "bajo", equipo: -1 }, resultado: "El foco en la revancha personal te saca del partido colectivo." },
        ],
      },
      {
        id: "prom-23", tipo: "personal", personajes: ["prensa"],
        pregunta: "Un exfutbolista reconocido te critica públicamente en un programa de televisión.",
        opciones: [
          { texto: "Responder con respeto y argumentos", efectos: { rendimiento: 0, forma: "animado", equipo: -1 }, resultado: "Tu respuesta madura te gana el respeto del público." },
          { texto: "Ignorar completamente la crítica", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "La crítica sigue circulando sin que la enfrentes." },
        ],
      },
      {
        id: "prom-24", tipo: "deportivo", personajes: ["entrenador"],
        pregunta: "El entrenador te pide jugar de líbero, una posición completamente nueva para ti.",
        opciones: [
          { texto: "Aceptar el desafío con curiosidad", efectos: { rendimiento: 0, forma: "animado", equipo: 1 }, resultado: "Sorprendes a todos adaptándote bien a la nueva función." },
          { texto: "Pedir mantenerte en tu posición habitual", efectos: { rendimiento: 1, forma: "regular", equipo: 0 }, resultado: "El entrenador respeta tu pedido, sin mayores cambios." },
        ],
      },
      {
        id: "prom-25", tipo: "personal", personajes: ["agente"],
        pregunta: "Te ofrecen ser imagen de una fundación que ayuda a chicos en situación de calle.",
        opciones: [
          { texto: "Comprometerte activamente con la causa", efectos: { rendimiento: 0, forma: "inspirado", equipo: -1 }, resultado: "El compromiso social te da una enorme satisfacción personal." },
          { texto: "Colaborar solo económicamente, sin exposición", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Ayudas igual, aunque de una forma más discreta." },
        ],
      },
      {
        id: "prom-26", tipo: "deportivo", personajes: ["companeros"],
        pregunta: "El plantel atraviesa una racha de lesiones importantes en posiciones clave.",
        opciones: [
          { texto: "Ofrecerte a jugar posiciones que no son la tuya", efectos: { rendimiento: 0, forma: "animado", equipo: 2 }, resultado: "Tu flexibilidad ayuda muchísimo al equipo en un momento difícil." },
          { texto: "Mantenerte en tu rol habitual únicamente", efectos: { rendimiento: 1, forma: "regular", equipo: 0 }, resultado: "Rindes bien en lo tuyo, aunque el equipo sufre las bajas." },
        ],
      },
      {
        id: "prom-27", tipo: "personal", personajes: ["pareja"],
        pregunta: "Con tu pareja atraviesan una crisis por los celos que genera tu exposición pública.",
        opciones: [
          { texto: "Trabajar juntos en la confianza mutua", efectos: { rendimiento: -1, forma: "plenitud", equipo: 0 }, resultado: "La relación sale fortalecida tras superar la crisis, aunque el desgaste emocional te resta algo de concentración." },
          { texto: "Restarle importancia al problema", efectos: { rendimiento: 0, forma: "bajo", equipo: 0 }, resultado: "La crisis de pareja sigue latente y te quita concentración." },
        ],
      },
      {
        id: "prom-28", tipo: "deportivo", personajes: ["rival"],
        pregunta: "Se genera un historial de tarjetas entre tú y un rival directo tras varios cruces.",
        opciones: [
          { texto: "Buscar hacer las paces antes del próximo cruce", efectos: { rendimiento: 0, forma: "animado", equipo: -2 }, resultado: "El partido se juega con mucha más deportividad." },
          { texto: "Mantener la rivalidad activa", efectos: { rendimiento: -1, forma: "bajo", equipo: -1 }, resultado: "El historial de roces sigue sumando episodios tensos." },
        ],
      },
      {
        id: "prom-29", tipo: "personal", personajes: ["familia"],
        pregunta: "Tu familia te pide que definas dónde estudiarán tus hijos, considerando tus constantes mudanzas.",
        opciones: [
          { texto: "Buscar estabilidad educativa para ellos", efectos: { rendimiento: 0, forma: "plenitud", equipo: 0 }, resultado: "La decisión les da tranquilidad a todos en casa." },
          { texto: "Priorizar tu carrera sobre la estabilidad familiar", efectos: { rendimiento: 1, forma: "desanimado", equipo: 0 }, resultado: "Rindes bien deportivamente, aunque en casa sienten el costo." },
        ],
      },
      {
        id: "prom-30", tipo: "deportivo", personajes: ["entrenador"],
        pregunta: "El entrenador te pide ser más vocal dentro de la cancha para ordenar al equipo.",
        opciones: [
          { texto: "Asumir un rol de mayor liderazgo verbal", efectos: { rendimiento: 1, forma: "inspirado", equipo: -1 }, resultado: "El equipo se ordena mucho mejor con tu voz de mando." },
          { texto: "Preferir liderar solo con el ejemplo", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Sigues aportando, aunque el equipo pide más comunicación." },
        ],
      },
      {
        id: "prom-31", tipo: "personal", personajes: ["agente"],
        pregunta: "Recibes una propuesta para abrir tu propia academia de fútbol formativo.",
        opciones: [
          { texto: "Empezar a poner en marcha el proyecto", efectos: { rendimiento: 0, forma: "animado", equipo: -1 }, resultado: "Das el primer paso hacia tu vida después del retiro." },
          { texto: "Postergarlo para cuando te retires", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Prefieres enfocar toda tu energía en el presente deportivo." },
        ],
      },
      {
        id: "prom-32", tipo: "deportivo", personajes: ["companeros"],
        pregunta: "Un compañero con el que tienes buena relación es transferido a mitad de temporada.",
        opciones: [
          { texto: "Ayudarlo a despedirse bien del grupo", efectos: { rendimiento: -1, forma: "plenitud", equipo: 1 }, resultado: "La salida se vive con cariño y buen ambiente general." },
          { texto: "Evitar involucrarte demasiado emocionalmente", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "La partida pasa sin mayor impacto en el grupo." },
        ],
      },
      {
        id: "prom-33", tipo: "personal", personajes: ["prensa"],
        pregunta: "Te consultan tu opinión sobre un tema social delicado que divide a la opinión pública.",
        opciones: [
          { texto: "Dar tu opinión con responsabilidad", efectos: { rendimiento: 0, forma: "animado", equipo: -1 }, resultado: "Tu postura genera respeto, aunque también algo de polémica." },
          { texto: "Evitar opinar sobre temas fuera del fútbol", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Prefieres mantener tu imagen alejada de la polémica." },
        ],
      },
      {
        id: "prom-34", tipo: "deportivo", personajes: ["rival"],
        pregunta: "Te enfrentas a un equipo que suele jugar de forma muy física y desgastante.",
        opciones: [
          { texto: "Preparar físicamente al equipo para el choque", efectos: { rendimiento: 1, forma: "animado", equipo: -1 }, resultado: "El equipo aguanta bien la exigencia física del rival." },
          { texto: "Confiar solo en el nivel futbolístico", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "El partido se hace más difícil de lo esperado físicamente." },
        ],
      },
      {
        id: "prom-35", tipo: "personal", personajes: ["familia", "pareja"],
        pregunta: "Con tu pareja deciden si es momento de agrandar la familia mientras tu carrera está en su mejor momento.",
        opciones: [
          { texto: "Avanzar con el proyecto familiar", efectos: { rendimiento: 0, forma: "plenitud", equipo: 0 }, resultado: "La noticia los llena de una felicidad enorme como familia." },
          { texto: "Esperar a un momento profesional más estable", efectos: { rendimiento: 1, forma: "regular", equipo: 0 }, resultado: "Priorizan la carrera, postergando el proyecto familiar." },
        ],
      },
    ],

    // ---- VETERANO: edad > 32 (34 eventos) ----
    veterano: [
      {
        id: "vet-01", tipo: "deportivo", personajes: ["entrenador"],
        pregunta: "El entrenador te pregunta si prefieres un rol de suplente de lujo para cuidar tu físico.",
        opciones: [
          { texto: "Aceptar el nuevo rol con madurez", efectos: { rendimiento: 0, forma: "plenitud", equipo: 1 }, resultado: "Rindes muy bien en los minutos que te toca sumar." },
          { texto: "Pedir seguir siendo titular indiscutido", efectos: { rendimiento: 1, forma: "desanimado", equipo: 0 }, resultado: "Mantienes tu lugar, aunque el desgaste físico preocupa un poco." },
        ],
      },
      {
        id: "vet-02", tipo: "personal", personajes: ["prensa"],
        pregunta: "La prensa empieza a preguntarte reiteradamente sobre tu fecha de retiro.",
        opciones: [
          { texto: "Hablar abiertamente sobre tus planes", efectos: { rendimiento: 0, forma: "regular", equipo: -1 }, resultado: "La transparencia calma la especulación mediática por un tiempo." },
          { texto: "Evitar el tema por completo", efectos: { rendimiento: 0, forma: "desanimado", equipo: 0 }, resultado: "Las preguntas sobre tu retiro siguen apareciendo constantemente." },
        ],
      },
      {
        id: "vet-03", tipo: "deportivo", personajes: ["companeros"],
        pregunta: "Un juvenil promesa del club te pide que seas su mentor esta temporada.",
        opciones: [
          { texto: "Aceptar el rol de mentor con gusto", efectos: { rendimiento: 0, forma: "plenitud", equipo: 2 }, resultado: "Disfrutas mucho transmitir tu experiencia a la nueva generación." },
          { texto: "Preferir enfocarte en tu propio presente", efectos: { rendimiento: 1, forma: "regular", equipo: 0 }, resultado: "Mantienes el foco en tu rendimiento personal, sin distracciones." },
        ],
      },
      {
        id: "vet-04", tipo: "deportivo", personajes: ["entrenador", "agente"],
        pregunta: "El club te ofrece un año más de contrato con condiciones especiales de descanso.",
        opciones: [
          { texto: "Aceptar la renovación", efectos: { rendimiento: -1, forma: "plenitud", equipo: 1 }, resultado: "Sumas un año más de carrera con condiciones a tu medida." },
          { texto: "Empezar a evaluar el retiro", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Comienzas a planificar con calma el cierre de tu carrera." },
        ],
      },
      {
        id: "vet-05", tipo: "personal", personajes: ["familia"],
        pregunta: "Tu familia te pide que empieces a priorizar el tiempo en casa por sobre lo deportivo.",
        opciones: [
          { texto: "Ajustar tu carga de partidos", efectos: { rendimiento: -1, forma: "plenitud", equipo: 0 }, resultado: "Ganas equilibrio personal, aunque cedes algo de protagonismo deportivo." },
          { texto: "Mantener tu ritmo habitual de competencia", efectos: { rendimiento: 1, forma: "desanimado", equipo: 0 }, resultado: "Sigues rindiendo bien, aunque la familia siente tu ausencia." },
        ],
      },
      {
        id: "vet-06", tipo: "deportivo", personajes: ["rival"],
        pregunta: "Un rival joven te desafía públicamente, cuestionando si todavía tienes nivel para competir.",
        opciones: [
          { texto: "Responder con jerarquía dentro de la cancha", efectos: { rendimiento: 2, forma: "inspirado", equipo: -1 }, resultado: "Callas las críticas con una gran actuación en el campo de juego." },
          { texto: "No darle importancia a la provocación", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Mantienes la calma habitual, sin necesidad de demostrar nada extra." },
        ],
      },
      {
        id: "vet-07", tipo: "personal", personajes: ["hinchada"],
        pregunta: "La hinchada organiza un homenaje especial por tus años de trayectoria en el club.",
        opciones: [
          { texto: "Recibir el homenaje con emoción", efectos: { rendimiento: 1, forma: "inspirado", equipo: -1 }, resultado: "El cariño de la gente te llena de energía para seguir compitiendo." },
          { texto: "Pedir que el homenaje sea breve y sencillo", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Agradeces el gesto sin buscar mayor protagonismo." },
        ],
      },
      {
        id: "vet-08", tipo: "deportivo", personajes: ["companeros"],
        pregunta: "El plantel te pide asumir la capitanía definitiva por tu experiencia y liderazgo.",
        opciones: [
          { texto: "Aceptar la capitanía definitiva", efectos: { rendimiento: 1, forma: "inspirado", equipo: 0 }, resultado: "Tu liderazgo se vuelve clave en los momentos más difíciles de la temporada." },
          { texto: "Ceder la cinta a un jugador más joven", efectos: { rendimiento: 0, forma: "plenitud", equipo: 1 }, resultado: "Fomentas el recambio generacional dentro del plantel." },
        ],
      },
      {
        id: "vet-09", tipo: "personal", personajes: ["agente"],
        pregunta: "Tu agente te propone comenzar a planificar tu vida financiera post retiro.",
        opciones: [
          { texto: "Empezar a planificar cuanto antes", efectos: { rendimiento: 0, forma: "plenitud", equipo: -1 }, resultado: "Ganas tranquilidad mental pensando en tu futuro fuera de las canchas." },
          { texto: "Postergarlo para más adelante", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Prefieres enfocarte solo en el presente deportivo por ahora." },
        ],
      },
      {
        id: "vet-10", tipo: "deportivo", personajes: ["entrenador"],
        pregunta: "El cuerpo técnico te pide opinión sobre qué juveniles merecen sumar minutos.",
        opciones: [
          { texto: "Dar tu opinión con total honestidad", efectos: { rendimiento: -1, forma: "animado", equipo: 1 }, resultado: "Tu criterio ayuda a tomar mejores decisiones para el futuro del club." },
          { texto: "Preferir no opinar sobre esas decisiones", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Dejas esas decisiones completamente en manos del cuerpo técnico." },
        ],
      },
      {
        id: "vet-11", tipo: "personal", personajes: ["pareja"],
        pregunta: "Con tu pareja comienzan a planificar dónde vivir una vez finalizada tu carrera.",
        opciones: [
          { texto: "Definir juntos el lugar de retiro", efectos: { rendimiento: 0, forma: "plenitud", equipo: -1 }, resultado: "Sientes tranquilidad al tener un plan de vida claro a futuro." },
          { texto: "Dejar esa decisión para más adelante", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Prefieres no adelantarte a una decisión tan importante todavía." },
        ],
      },
      {
        id: "vet-12", tipo: "deportivo", personajes: ["rival"],
        pregunta: "Te enfrentas a un exequipo tuyo, con quienes compartiste muchos años de carrera.",
        opciones: [
          { texto: "Vivirlo con toda la intensidad competitiva de siempre", efectos: { rendimiento: 1, forma: "animado", equipo: -1 }, resultado: "El partido especial te saca lo mejor dentro de la cancha." },
          { texto: "Vivirlo con nostalgia y cierta cautela", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Las emociones del reencuentro pesan un poco en tu concentración." },
        ],
      },
      {
        id: "vet-13", tipo: "personal", personajes: ["prensa"],
        pregunta: "Te consultan si te gustaría dedicarte al periodismo deportivo tras retirarte.",
        opciones: [
          { texto: "Mostrar interés genuino en esa posibilidad", efectos: { rendimiento: 0, forma: "animado", equipo: -1 }, resultado: "Empiezas a visualizar con entusiasmo tu futuro fuera de las canchas." },
          { texto: "Descartar esa idea por completo", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Prefieres pensar en otras alternativas para tu vida después del retiro." },
        ],
      },
      {
        id: "vet-14", tipo: "deportivo", personajes: ["entrenador", "hinchada"],
        pregunta: "El club te ofrece jugar tu partido despedida ante tu gente, en la fecha que elijas.",
        opciones: [
          { texto: "Organizar cuanto antes tu partido despedida", efectos: { rendimiento: 0, forma: "inspirado", equipo: 0 }, resultado: "La noticia emociona profundamente a toda la hinchada del club." },
          { texto: "Preferir seguir compitiendo antes de pensar en despedidas", efectos: { rendimiento: 1, forma: "plenitud", equipo: 0 }, resultado: "Postergas la decisión, priorizando el presente competitivo." },
        ],
      },
      {
        id: "vet-15", tipo: "personal", personajes: ["familia"],
        pregunta: "Tus hijos te piden asistir más seguido a sus actividades escolares.",
        opciones: [
          { texto: "Reorganizar tu agenda para acompañarlos más", efectos: { rendimiento: -1, forma: "plenitud", equipo: 0 }, resultado: "Fortaleces el vínculo familiar, cediendo algo de tiempo de entrenamiento extra." },
          { texto: "Mantener la prioridad en tu rutina profesional", efectos: { rendimiento: 1, forma: "desanimado", equipo: 0 }, resultado: "Rindes bien deportivamente, aunque sientes que te pierdes momentos importantes." },
        ],
      },
      {
        id: "vet-16", tipo: "deportivo", personajes: ["companeros"],
        pregunta: "El plantel te pide algunas palabras de motivación antes de una final importante.",
        opciones: [
          { texto: "Dar un discurso desde tu experiencia", efectos: { rendimiento: 0, forma: "inspirado", equipo: 2 }, resultado: "Tus palabras se convierten en un antes y un después para el grupo." },
          { texto: "Preferir motivar con el ejemplo, sin palabras", efectos: { rendimiento: 1, forma: "animado", equipo: 1 }, resultado: "Tu profesionalismo silencioso también inspira a los más jóvenes." },
        ],
      },
      {
        id: "vet-17", tipo: "deportivo", personajes: ["entrenador"],
        pregunta: "El club te pregunta si te interesaría integrarte al cuerpo técnico tras el retiro.",
        opciones: [
          { texto: "Mostrar interés genuino en el cuerpo técnico", efectos: { rendimiento: -1, forma: "animado", equipo: 1 }, resultado: "Empiezas a proyectar tu futuro dentro del club." },
          { texto: "Preferir explorar otras alternativas", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Dejas abiertas otras puertas para el día de mañana." },
        ],
      },
      {
        id: "vet-18", tipo: "personal", personajes: ["familia"],
        pregunta: "Tus hijos ya adolescentes empiezan a mostrar interés en seguir tus pasos futbolísticos.",
        opciones: [
          { texto: "Acompañarlos de cerca en sus primeros pasos", efectos: { rendimiento: 0, forma: "plenitud", equipo: -1 }, resultado: "Disfrutas muchísimo compartir el fútbol con tus hijos." },
          { texto: "Dejar que decidan su camino sin tu influencia", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Respetas su independencia, aunque te gustaría estar más presente." },
        ],
      },
      {
        id: "vet-19", tipo: "deportivo", personajes: ["companeros"],
        pregunta: "Un jugador joven te supera claramente en las pruebas físicas de pretemporada.",
        opciones: [
          { texto: "Tomarlo como motivación para superarte", efectos: { rendimiento: 1, forma: "inspirado", equipo: -1 }, resultado: "Sorprendes a todos manteniendo un nivel físico altísimo." },
          { texto: "Aceptar que los años empiezan a notarse", efectos: { rendimiento: 0, forma: "desanimado", equipo: 0 }, resultado: "Empiezas a asumir con realismo el paso del tiempo." },
        ],
      },
      {
        id: "vet-20", tipo: "personal", personajes: ["agente"],
        pregunta: "Un canal deportivo te ofrece ser comentarista fijo apenas te retires.",
        opciones: [
          { texto: "Aceptar el ofrecimiento a futuro", efectos: { rendimiento: 0, forma: "animado", equipo: -1 }, resultado: "Aseguras una salida laboral tranquila tras el retiro." },
          { texto: "Preferir decidir tu futuro con más calma", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Dejas la puerta abierta sin comprometerte todavía." },
        ],
      },
      {
        id: "vet-21", tipo: "deportivo", personajes: ["rival"],
        pregunta: "Te enfrentas por última vez a un rival histórico con quien compartiste toda tu carrera.",
        opciones: [
          { texto: "Vivir el partido con intensidad y respeto", efectos: { rendimiento: 1, forma: "inspirado", equipo: -1 }, resultado: "El cruce se convierte en un momento memorable de tu carrera." },
          { texto: "Vivirlo con nostalgia, algo distraído", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Las emociones del momento pesan un poco en tu concentración." },
        ],
      },
      {
        id: "vet-22", tipo: "personal", personajes: ["pareja"],
        pregunta: "Con tu pareja de toda la vida celebran un aniversario muy especial tras años de sacrificios compartidos.",
        opciones: [
          { texto: "Organizar una celebración a la altura del momento", efectos: { rendimiento: 0, forma: "inspirado", equipo: 0 }, resultado: "El festejo renueva la energía y el compromiso de la pareja." },
          { texto: "Mantenerlo simple por la carga de partidos", efectos: { rendimiento: 1, forma: "regular", equipo: 0 }, resultado: "La pareja entiende las prioridades del momento deportivo." },
        ],
      },
      {
        id: "vet-23", tipo: "deportivo", personajes: ["entrenador"],
        pregunta: "El entrenador te pide ser el nexo entre el cuerpo técnico y los jugadores más jóvenes.",
        opciones: [
          { texto: "Aceptar el rol de nexo generacional", efectos: { rendimiento: 0, forma: "plenitud", equipo: 2 }, resultado: "Tu experiencia ordena y mejora la comunicación interna del plantel." },
          { texto: "Preferir mantenerte solo como jugador", efectos: { rendimiento: 1, forma: "regular", equipo: 0 }, resultado: "Sigues rindiendo bien, sin asumir responsabilidades extra." },
        ],
      },
      {
        id: "vet-24", tipo: "personal", personajes: ["familia"],
        pregunta: "Tienes la oportunidad de mudar a toda tu familia a tu ciudad natal para tus últimos años de carrera.",
        opciones: [
          { texto: "Concretar la mudanza", efectos: { rendimiento: 0, forma: "plenitud", equipo: -1 }, resultado: "La cercanía familiar te da una paz enorme en el tramo final." },
          { texto: "Mantenerse donde están por estabilidad", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Priorizan no generar más cambios en la rutina familiar." },
        ],
      },
      {
        id: "vet-25", tipo: "deportivo", personajes: ["companeros"],
        pregunta: "El plantel te pide organizar la fiesta de fin de temporada por tu experiencia y liderazgo.",
        opciones: [
          { texto: "Organizar un evento memorable", efectos: { rendimiento: -1, forma: "inspirado", equipo: 2 }, resultado: "El plantel cierra la temporada con una unión enorme." },
          { texto: "Delegar la organización en los más jóvenes", efectos: { rendimiento: 0, forma: "regular", equipo: 1 }, resultado: "Fomentas el protagonismo de la nueva generación del plantel." },
        ],
      },
      {
        id: "vet-26", tipo: "personal", personajes: ["prensa"],
        pregunta: "Un documental sobre tu carrera busca tu autorización para contar tu historia completa.",
        opciones: [
          { texto: "Autorizar el documental sin filtros", efectos: { rendimiento: 0, forma: "animado", equipo: -1 }, resultado: "El documental se convierte en un homenaje muy sentido a tu carrera." },
          { texto: "Pedir controlar qué partes se cuentan", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "El documental avanza, aunque con algunas limitaciones acordadas." },
        ],
      },
      {
        id: "vet-27", tipo: "deportivo", personajes: ["rival"],
        pregunta: "Un exrival, hoy retirado, te invita a un partido homenaje en su honor.",
        opciones: [
          { texto: "Participar con gusto del homenaje", efectos: { rendimiento: 0, forma: "inspirado", equipo: 0 }, resultado: "El gesto de cariño mutuo emociona a todos los presentes." },
          { texto: "No poder asistir por la carga de partidos", efectos: { rendimiento: 1, forma: "regular", equipo: 0 }, resultado: "Envías tu cariño a la distancia, priorizando tu competencia." },
        ],
      },
      {
        id: "vet-28", tipo: "personal", personajes: ["familia"],
        pregunta: "Reflexionas sobre cuánto tiempo de tus hijos te perdiste por la carrera futbolística.",
        opciones: [
          { texto: "Comprometerte a compensar el tiempo perdido", efectos: { rendimiento: -1, forma: "plenitud", equipo: 0 }, resultado: "Empiezas a reconstruir vínculos familiares muy valiosos." },
          { texto: "Aceptar que fue el precio de tu carrera", efectos: { rendimiento: 1, forma: "desanimado", equipo: 0 }, resultado: "Rindes muy bien, aunque con cierta sensación de deuda pendiente." },
        ],
      },
      {
        id: "vet-29", tipo: "deportivo", personajes: ["entrenador"],
        pregunta: "El club te ofrece ser el capitán honorario para el resto de tu carrera.",
        opciones: [
          { texto: "Aceptar con orgullo el reconocimiento", efectos: { rendimiento: 1, forma: "inspirado", equipo: 1 }, resultado: "El gesto simbólico te llena de un orgullo enorme." },
          { texto: "Pedir que el reconocimiento sea para todo el plantel", efectos: { rendimiento: 0, forma: "plenitud", equipo: 2 }, resultado: "Tu humildad refuerza el cariño de todo el grupo hacia ti." },
        ],
      },
      {
        id: "vet-30", tipo: "personal", personajes: ["agente"],
        pregunta: "Analizas con tu agente las opciones de retirarte jugando en tu club de toda la vida o en el exterior.",
        opciones: [
          { texto: "Priorizar cerrar la carrera en casa", efectos: { rendimiento: 0, forma: "inspirado", equipo: 0 }, resultado: "La decisión te da una paz enorme de cara al cierre de tu historia." },
          { texto: "Abrirte a una última aventura en el exterior", efectos: { rendimiento: 1, forma: "animado", equipo: 0 }, resultado: "Te ilusionas con vivir una última experiencia distinta." },
        ],
      },
      {
        id: "vet-31", tipo: "deportivo", personajes: ["companeros"],
        pregunta: "Un jugador joven te pide ser el padrino de su primer hijo, en señal de respeto y cariño.",
        opciones: [
          { texto: "Aceptar el gesto con cariño", efectos: { rendimiento: -1, forma: "plenitud", equipo: 1 }, resultado: "El vínculo humano con el joven se profundiza muchísimo." },
          { texto: "Agradecer, pero mantener distancia profesional", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "El joven entiende tu postura, sin resentimientos." },
        ],
      },
      {
        id: "vet-32", tipo: "personal", personajes: ["familia", "medico"],
        pregunta: "Te diagnostican una molestia crónica propia de tantos años de exigencia física.",
        opciones: [
          { texto: "Adaptar tu rutina para cuidar tu cuerpo", efectos: { rendimiento: 0, forma: "plenitud", equipo: 0 }, resultado: "Logras sostener tu nivel cuidando mejor tu físico." },
          { texto: "Minimizar la molestia y seguir igual", efectos: { rendimiento: 1, forma: "bajo", equipo: 0 }, resultado: "Sostienes el rendimiento, aunque la molestia se hace más notoria." },
        ],
      },
      {
        id: "vet-33", tipo: "deportivo", personajes: ["rival"],
        pregunta: "En tu último clásico como profesional, la previa mediática es enorme.",
        opciones: [
          { texto: "Disfrutar el momento con toda la intensidad", efectos: { rendimiento: 1, forma: "inspirado", equipo: -1 }, resultado: "Vives uno de los partidos más especiales de tu carrera." },
          { texto: "Intentar aislarte de tanta exposición", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "Prefieres vivirlo con calma, lejos del ruido mediático." },
        ],
      },
      {
        id: "vet-34", tipo: "personal", personajes: ["pareja"],
        pregunta: "Con tu pareja empiezan a planificar juntos cómo será tu ceremonia de despedida del fútbol.",
        opciones: [
          { texto: "Involucrarla activamente en la organización", efectos: { rendimiento: 0, forma: "plenitud", equipo: -1 }, resultado: "El evento se convierte en un homenaje compartido en pareja." },
          { texto: "Dejar la organización en manos del club", efectos: { rendimiento: 0, forma: "regular", equipo: 0 }, resultado: "El club organiza todo, aunque sientes que falta un toque personal." },
        ],
      },
    ],
  },

  // ---------------- EVENTOS DE ALTO IMPACTO (22) ----------------
  // Sin restricción de rango de edad. Ver nota al inicio del archivo.
  altoImpacto: [
    {
      id: "ai-01", tipo: "personal", personajes: ["pareja", "prensa"],
      pregunta: "Se filtra en los medios que tu pareja te fue infiel y la noticia explota justo antes de un partido decisivo.",
      opciones: [
        { texto: "Pedir unos días para poner en orden tu cabeza", efectos: { rendimiento: -4, forma: "bajo", equipo: -2 }, resultado: "Te alejas unos días para procesar el golpe, pero el equipo siente tu ausencia." },
        { texto: "Salir a jugar igual, tragándote el dolor", efectos: { rendimiento: -2, forma: "desanimado", equipo: -3 }, resultado: "Rindes por debajo de tu nivel, con la cabeza en otro lado." },
      ],
    },
    {
      id: "ai-02", tipo: "deportivo", personajes: ["companeros", "prensa"],
      pregunta: "Una fiesta del plantel se descontrola y termina en fotos comprometedoras que llegan a la prensa la semana de un clásico.",
      opciones: [
        { texto: "Asumir públicamente el error y pedir disculpas", efectos: { rendimiento: -2, forma: "desanimado", equipo: -1 }, resultado: "El club te sanciona económicamente, pero valora tu autocrítica." },
        { texto: "Negar tu participación en la fiesta", efectos: { rendimiento: -1, forma: "bajo", equipo: -3 }, resultado: "La mentira se descubre después y el vestuario pierde la confianza en ti." },
      ],
    },
    {
      id: "ai-03", tipo: "personal", personajes: ["companeros", "agente"],
      pregunta: "Un compañero te involucra públicamente en un escándalo por presunto consumo de sustancias en la pretemporada.",
      opciones: [
        { texto: "Someterte voluntariamente a un control antidopaje", efectos: { rendimiento: 1, forma: "animado", equipo: -4 }, resultado: "Tu transparencia limpia tu imagen por completo ante el club y la prensa." },
        { texto: "Evitar el tema y esperar que se olvide", efectos: { rendimiento: -3, forma: "bajo", equipo: -3 }, resultado: "La sospecha queda instalada y afecta tu relación con el cuerpo técnico." },
      ],
    },
    {
      id: "ai-04", tipo: "personal", personajes: ["familia", "medico"],
      pregunta: "Sufres un accidente automovilístico camino a un entrenamiento; por suerte no es grave, pero el susto es enorme.",
      opciones: [
        { texto: "Tomarte el tiempo médico necesario para recuperarte del todo", efectos: { rendimiento: -3, forma: "lesionado", equipo: -1 }, resultado: "Te pierdes varios partidos, pero vuelves sin secuelas." },
        { texto: "Volver a las canchas antes de lo recomendado", efectos: { rendimiento: -2, forma: "lesionado", equipo: -2 }, resultado: "Vuelves rápido, pero el cuerpo médico queda muy preocupado por la decisión y arrastras molestias toda la temporada." },
      ],
    },
    {
      id: "ai-05", tipo: "deportivo", personajes: ["companeros", "entrenador"],
      pregunta: "Una discusión en el vestuario termina en una pelea física con un compañero delante de todo el plantel.",
      opciones: [
        { texto: "Pedir disculpas públicamente y hablarlo en privado", efectos: { rendimiento: -4, forma: "desanimado", equipo: -1 }, resultado: "El grupo valora el gesto, aunque el clima queda tenso por un tiempo." },
        { texto: "Sostener que tenías razón en la discusión", efectos: { rendimiento: -3, forma: "bajo", equipo: -4 }, resultado: "El vestuario se divide y el entrenador te aparta de varios partidos." },
      ],
    },
    {
      id: "ai-06", tipo: "personal", personajes: ["familia"],
      pregunta: "Recibes la noticia de la muerte repentina de un familiar muy cercano en medio de la temporada.",
      opciones: [
        { texto: "Tomarte el tiempo que necesites para el duelo", efectos: { rendimiento: -4, forma: "bajo", equipo: -1 }, resultado: "El club te respalda por completo mientras atraviesas el duelo." },
        { texto: "Volver a jugar rápido para distraerte del dolor", efectos: { rendimiento: -2, forma: "desanimado", equipo: -2 }, resultado: "Jugar te distrae a ratos, pero el dolor sigue muy presente." },
      ],
    },
    {
      id: "ai-07", tipo: "personal", personajes: ["familia"],
      pregunta: "Tus padres atraviesan un divorcio muy conflictivo y te piden que tomes partido.",
      opciones: [
        { texto: "Mantenerte neutral pese a la presión de ambos", efectos: { rendimiento: -1, forma: "desanimado", equipo: -1 }, resultado: "Proteges tu estabilidad emocional, aunque ambos se sienten algo dolidos." },
        { texto: "Tomar partido por uno de los dos", efectos: { rendimiento: -2, forma: "bajo", equipo: 0 }, resultado: "El conflicto familiar se profundiza y te afecta mucho más de lo esperado." },
      ],
    },
    {
      id: "ai-08", tipo: "deportivo", personajes: ["entrenador", "companeros"],
      pregunta: "Discutes violentamente con el entrenador delante de todo el plantel tras ser sustituido.",
      opciones: [
        { texto: "Disculparte públicamente al día siguiente", efectos: { rendimiento: -1, forma: "desanimado", equipo: -4 }, resultado: "El entrenador acepta tus disculpas, aunque la relación quedó dañada." },
        { texto: "Mantener tu postura sin retractarte", efectos: { rendimiento: -3, forma: "bajo", equipo: -3 }, resultado: "Pierdes minutos de titular durante varias semanas por decisión técnica." },
      ],
    },
    {
      id: "ai-09", tipo: "deportivo", personajes: ["agente", "entrenador"],
      pregunta: "Denuncias públicamente irregularidades en el manejo económico de la dirigencia del club.",
      opciones: [
        { texto: "Sostener tu denuncia con pruebas", efectos: { rendimiento: 1, forma: "inspirado", equipo: -2 }, resultado: "Ganas respeto público, aunque quedas en la mira de la dirigencia." },
        { texto: "Retractarte para evitar problemas", efectos: { rendimiento: -2, forma: "bajo", equipo: 1 }, resultado: "Evitas el conflicto directo, aunque sientes que traicionaste tus convicciones." },
      ],
    },
    {
      id: "ai-10", tipo: "deportivo", personajes: ["companeros"],
      pregunta: "Descubres que un compañero habló mal de ti ante la dirigencia para quitarte el puesto de titular.",
      opciones: [
        { texto: "Confrontarlo directamente y luego dejarlo atrás", efectos: { rendimiento: 0, forma: "animado", equipo: -3 }, resultado: "Aclaras la situación, aunque la confianza mutua no vuelve a ser la misma." },
        { texto: "Guardarte el rencor y jugar con eso en la cabeza", efectos: { rendimiento: -3, forma: "bajo", equipo: -2 }, resultado: "El rencor te consume mentalmente y afecta tu juego varias semanas." },
      ],
    },
    {
      id: "ai-11", tipo: "personal", personajes: ["pareja", "agente"],
      pregunta: "Recibes la oferta de tu vida de un club top, pero tu pareja no puede acompañarte por motivos laborales.",
      opciones: [
        { texto: "Rechazar la oferta y priorizar tu relación", efectos: { rendimiento: 0, forma: "plenitud", equipo: 0 }, resultado: "Ganas en estabilidad emocional, aunque siempre te preguntarás qué hubiera pasado." },
        { texto: "Aceptar la oferta y arriesgar la relación", efectos: { rendimiento: 3, forma: "inspirado", equipo: -1 }, resultado: "Das un salto enorme en tu carrera, aunque la relación no sobrevive a la distancia." },
      ],
    },
    {
      id: "ai-12", tipo: "deportivo", personajes: ["entrenador", "companeros"],
      pregunta: "Llegas tarde repetidas veces a las concentraciones y el club decide hacer un ejemplo contigo.",
      opciones: [
        { texto: "Aceptar la sanción y cambiar tu actitud", efectos: { rendimiento: -2, forma: "desanimado", equipo: 1 }, resultado: "El grupo valora que hayas aceptado la sanción sin excusas." },
        { texto: "Cuestionar públicamente la sanción", efectos: { rendimiento: -1, forma: "bajo", equipo: -3 }, resultado: "Tu actitud genera un quiebre serio con el cuerpo técnico." },
      ],
    },
    {
      id: "ai-13", tipo: "personal", personajes: ["prensa", "agente"],
      pregunta: "Una foto tuya, sacada de contexto, se viraliza y genera un escándalo mediático nacional.",
      opciones: [
        { texto: "Dar una conferencia de prensa para aclarar todo", efectos: { rendimiento: 0, forma: "regular", equipo: -2 }, resultado: "La aclaración calma bastante la situación mediática." },
        { texto: "Guardar silencio absoluto", efectos: { rendimiento: -2, forma: "bajo", equipo: -1 }, resultado: "El silencio alimenta más rumores y la presión mediática crece." },
      ],
    },
    {
      id: "ai-14", tipo: "deportivo", personajes: ["hinchada"],
      pregunta: "Un sector de la hinchada te increpa duramente e incluso te amenaza tras una racha floja de resultados.",
      opciones: [
        { texto: "Pedir refuerzo de seguridad y seguir tu rutina", efectos: { rendimiento: -1, forma: "desanimado", equipo: -3 }, resultado: "Te sientes protegido, aunque el miedo no desaparece del todo." },
        { texto: "Enfrentar públicamente a los hinchas violentos", efectos: { rendimiento: -2, forma: "bajo", equipo: -2 }, resultado: "La situación escala y genera un problema mayor con la hinchada." },
      ],
    },
    {
      id: "ai-15", tipo: "personal", personajes: ["prensa"],
      pregunta: "Un periodista publica una nota falsa y difamatoria sobre tu vida privada.",
      opciones: [
        { texto: "Iniciar acciones legales contra el medio", efectos: { rendimiento: 0, forma: "animado", equipo: -1 }, resultado: "La justicia te da la razón y tu imagen se limpia con el tiempo." },
        { texto: "Dejarlo pasar para no alimentar la polémica", efectos: { rendimiento: -1, forma: "desanimado", equipo: 0 }, resultado: "La mentira queda instalada en una parte de la opinión pública." },
      ],
    },
    {
      id: "ai-16", tipo: "deportivo", personajes: ["medico", "entrenador"],
      pregunta: "Sufres una lesión grave e inesperada en pleno partido que pone en duda varios meses de tu carrera.",
      opciones: [
        { texto: "Seguir el proceso de rehabilitación al pie de la letra", efectos: { rendimiento: -4, forma: "lesionado", equipo: -2 }, resultado: "Te recuperas de forma completa, aunque tu ausencia prolongada genera malestar en el plantel." },
        { texto: "Apurar la vuelta antes de lo recomendado", efectos: { rendimiento: -5, forma: "lesionado", equipo: -1 }, resultado: "La vuelta apresurada te genera una recaída todavía más grave." },
      ],
    },
    {
      id: "ai-17", tipo: "deportivo", personajes: ["agente", "rival"],
      pregunta: "Una persona cercana al ambiente te ofrece dinero a cambio de bajar tu rendimiento en un partido clave.",
      opciones: [
        { texto: "Rechazar la propuesta y denunciarla al club", efectos: { rendimiento: 2, forma: "inspirado", equipo: 2 }, resultado: "Tu integridad queda por encima de todo y el club lo valora enormemente." },
        { texto: "Aceptar la propuesta por el dinero", efectos: { rendimiento: -6, forma: "bajo", equipo: -4 }, resultado: "El amaño se descubre después y tu reputación queda gravemente dañada." },
      ],
    },
    {
      id: "ai-18", tipo: "personal", personajes: ["familia", "medico"],
      pregunta: "La presión constante te pasa factura y sufres una crisis de ansiedad antes de un partido importante.",
      opciones: [
        { texto: "Pedir ayuda profesional de un psicólogo deportivo", efectos: { rendimiento: -2, forma: "desanimado", equipo: -2 }, resultado: "Empiezas un proceso que te ayuda muchísimo a mediano plazo." },
        { texto: "Ocultarlo y jugar igual, como si nada pasara", efectos: { rendimiento: -4, forma: "bajo", equipo: -1 }, resultado: "El problema se agrava por no haber pedido ayuda a tiempo." },
      ],
    },
    {
      id: "ai-19", tipo: "personal", personajes: ["companeros", "agente"],
      pregunta: "Te das cuenta de que las apuestas deportivas empezaron a consumir buena parte de tu tiempo y tu dinero.",
      opciones: [
        { texto: "Buscar ayuda profesional para controlarlo a tiempo", efectos: { rendimiento: -1, forma: "regular", equipo: -2 }, resultado: "Logras frenar el problema antes de que se vuelva más serio." },
        { texto: "Minimizar el problema y seguir apostando", efectos: { rendimiento: -3, forma: "bajo", equipo: -1 }, resultado: "El problema crece y empieza a afectar tu concentración y tus finanzas." },
      ],
    },
    {
      id: "ai-20", tipo: "deportivo", personajes: ["rival", "prensa"],
      pregunta: "Te cruzas por casualidad con un rival directo fuera de la cancha y la discusión casi termina a golpes.",
      opciones: [
        { texto: "Retirarte de la situación antes de que escale", efectos: { rendimiento: 0, forma: "regular", equipo: -3 }, resultado: "Evitas un escándalo mayor con una salida a tiempo." },
        { texto: "Responder a la provocación físicamente", efectos: { rendimiento: -3, forma: "bajo", equipo: -2 }, resultado: "El escándalo mediático te cuesta una sanción disciplinaria seria." },
      ],
    },
    {
      id: "ai-21", tipo: "personal", personajes: ["prensa", "agente"],
      pregunta: "Te detienen conduciendo bajo los efectos del alcohol después de una celebración con amigos.",
      opciones: [
        { texto: "Asumir públicamente el error y pedir disculpas", efectos: { rendimiento: -2, forma: "desanimado", equipo: -4 }, resultado: "El club te sanciona, pero valora que hayas dado la cara." },
        { texto: "Intentar minimizar el episodio ante la prensa", efectos: { rendimiento: -3, forma: "bajo", equipo: -3 }, resultado: "La estrategia de minimizar el hecho te sale muy cara en imagen." },
      ],
    },
    {
      id: "ai-22", tipo: "deportivo", personajes: ["agente", "entrenador"],
      pregunta: "El club negocia tu salida a tus espaldas pese a que tú quieres quedarte a pelear un puesto.",
      opciones: [
        { texto: "Plantarte y exigir explicaciones a la dirigencia", efectos: { rendimiento: 1, forma: "animado", equipo: -2 }, resultado: "Frenas la negociación, aunque quedas en tensión con la dirigencia." },
        { texto: "Aceptar resignadamente la decisión del club", efectos: { rendimiento: -2, forma: "desanimado", equipo: 0 }, resultado: "Te vas del club sintiendo que no te dieron la oportunidad de pelearla." },
      ],
    },
  ],

  // ---------------- LESIONES ----------------
  lesiones: {
    // Leve: solo te deja sin partidos 1 pausa. Sin efecto en forma ni OVR.
    nivel3: [
      { id: "les3-01", nombre: "Sobrecarga en el isquiotibial", descripcion: "El cuerpo médico prefiere no arriesgarte hasta que la molestia desaparezca del todo." },
      { id: "les3-02", nombre: "Golpe y contusión en el tobillo", descripcion: "Un choque fortuito en el entrenamiento te deja con el tobillo inflamado." },
      { id: "les3-03", nombre: "Distensión leve en el gemelo", descripcion: "Sentiste un tirón durante un sprint y preferiste no forzarlo." },
      { id: "les3-04", nombre: "Molestia lumbar leve", descripcion: "La espalda te viene molestando y el cuerpo técnico prefiere frenar a tiempo." },
      { id: "les3-05", nombre: "Esguince leve de tobillo", descripcion: "Un mal apoyo te deja con el tobillo resentido, sin mayor gravedad." },
      { id: "les3-06", nombre: "Fatiga muscular acumulada", descripcion: "La seguidilla de partidos pasó factura y el cuerpo médico pide una pausa preventiva." },
    ],
    // Moderada: sin partidos durante la baja + forma "lesionado" + OVR -1 a -3.
    nivel2: [
      { id: "les2-01", nombre: "Desgarro en el cuádriceps", descripcion: "Un desgarro de grado leve a moderado te obliga a un proceso de rehabilitación." },
      { id: "les2-02", nombre: "Esguince de rodilla (grado 2)", descripcion: "La rodilla queda inestable por unas semanas mientras cede la inflamación." },
      { id: "les2-03", nombre: "Fractura de un dedo del pie", descripcion: "Un golpe durante el partido termina en una fractura menor que necesita inmovilización." },
      { id: "les2-04", nombre: "Pubalgia", descripcion: "El dolor en la zona inguinal se vuelve crónico y requiere tratamiento específico." },
      { id: "les2-05", nombre: "Esguince de tobillo con edema", descripcion: "La torcedura es más seria de lo que pareció en el momento y deja el tobillo muy hinchado." },
      { id: "les2-06", nombre: "Desgarro fibrilar en el gemelo", descripcion: "El tirón muscular resultó ser un desgarro que necesita reposo real." },
    ],
    // Grave: sin partidos durante la baja + forma "lesionado" + OVR -4 a -10.
    nivel1: [
      { id: "les1-01", nombre: "Rotura de ligamento cruzado anterior", descripcion: "La rodilla no responde tras una mala caída: la lesión más temida de cualquier futbolista." },
      { id: "les1-02", nombre: "Fractura de tibia y peroné", descripcion: "Un choque violento termina en una fractura que exige cirugía y una recuperación larga." },
      { id: "les1-03", nombre: "Rotura del tendón de Aquiles", descripcion: "Sentiste como si te hubieran pateado el talón: el tendón no resistió la exigencia." },
      { id: "les1-04", nombre: "Hernia discal", descripcion: "Un dolor agudo en la espalda termina en un diagnóstico que preocupa a todo el cuerpo médico." },
      { id: "les1-05", nombre: "Rotura muscular completa (grado 3)", descripcion: "El desgarro es total y el músculo necesita un proceso de recuperación extenso." },
    ],
  },
};
