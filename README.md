# Leyenda ⚽

Simulador de carrera de un futbolista, de principiante a leyenda (o al fracaso). Juego web, sin backend ni base de datos externa: todo el motor corre en el navegador, en JavaScript vanilla.

**Versión:** 0.2.0-alpha — publicada el 5 de septiembre de 2026 · 22:41.

> Este documento describe **absolutamente toda la lógica del juego**: cada fórmula, cada constante de balance y dónde vive cada pieza en el código. Está pensado como referencia técnica completa, no como introducción rápida — si buscás "cómo se juega" en términos de jugador, ver el *Manual de Juego* aparte.

---

## Índice

1. [Cómo correr el proyecto](#1-cómo-correr-el-proyecto)
2. [Estructura de archivos](#2-estructura-de-archivos)
3. [Flujo general del juego](#3-flujo-general-del-juego)
4. [Creación de personaje](#4-creación-de-personaje-indexhtml--jsscriptjs)
5. [Elección de club inicial](#5-elección-de-club-inicial-equipohtml--jsequipojs)
6. [El motor de carrera — visión general](#6-el-motor-de-carrera--visión-general-jscarrerajs)
7. [Calendario de temporada](#7-calendario-de-temporada)
8. [El ciclo de un tramo, paso a paso](#8-el-ciclo-de-un-tramo-paso-a-paso)
9. [Participación: cuántos partidos jugás](#9-participación-cuántos-partidos-jugás-vos)
10. [Estadísticas del tramo: goles, asistencias, MVP, rating](#10-estadísticas-del-tramo-goles-asistencias-mvp-rating)
11. [Progresión de OVR](#11-progresión-de-ovr)
12. [Estado de forma](#12-estado-de-forma)
13. [Lesiones](#13-lesiones)
14. [Sistema de competiciones (liga, copas, clasificación internacional)](#14-sistema-de-competiciones-liga-copas-clasificación-internacional)
15. [Valor de mercado](#15-valor-de-mercado)
16. [Sistema de fichajes y ofertas](#16-sistema-de-fichajes-y-ofertas)
17. [Fin de carrera: retiro y resumen](#17-fin-de-carrera-retiro-y-resumen)
18. [Solicitud de cambio de dorsal](#18-solicitud-de-cambio-de-dorsal)
19. [Banco de eventos de temporada](#19-banco-de-eventos-de-temporada-jseventsjs)
20. [Base de datos de ligas y equipos](#20-base-de-datos-de-ligas-y-equipos-jsdatabasejs)
21. [Interfaz: componentes, animaciones y responsive](#21-interfaz-componentes-animaciones-y-responsive)
22. [Persistencia y estado](#22-persistencia-y-estado)
23. [Tabla completa de constantes de balance](#23-tabla-completa-de-constantes-de-balance)
24. [Limitaciones conocidas y notas para el futuro](#24-limitaciones-conocidas-y-notas-para-el-futuro)

---

## 1. Cómo correr el proyecto

Es un sitio 100% estático (HTML/CSS/JS sin build). Cualquier servidor estático alcanza:

```bash
npx serve -l 5173 .
```

La configuración ya está en [`.claude/launch.json`](.claude/launch.json) para levantarlo automáticamente en el puerto `5173`. No hay `package.json`, ni paso de compilación, ni dependencias que instalar.

---

## 2. Estructura de archivos

```
Leyenda/
├── index.html            Pantalla 1: creación de personaje
├── equipo.html            Pantalla 2: elección de club inicial
├── carrera.html           Pantalla 3: el juego en sí (pantalla principal)
│
├── js/
│   ├── config.js           GameConfig — TODAS las fórmulas y constantes de balance
│   ├── database.js         GameDatabase — ligas, equipos y competiciones reales
│   ├── events.js           GameEvents — banco de 226 eventos de decisión + lesiones
│   ├── script.js           Lógica de index.html (creación de personaje)
│   ├── equipo.js           Lógica de equipo.html (elección de club)
│   └── carrera.js          El motor del juego: estado, simulación y toda la UI de carrera.html
│
├── css/
│   ├── style.css            Tokens de diseño globales + estilos de index.html/equipo.html
│   ├── carrera.css          Estilos de carrera.html (desktop + su propia línea de diseño móvil)
│   └── equipo.css           Estilos específicos de equipo.html
│
├── assets/
│   ├── logo/                Logo del juego
│   └── escudos/
│       ├── equipos/          Escudos reales de cada club (PNG)
│       ├── ligas/             Escudos/logos de cada liga
│       └── trofeos/            Siluetas de trofeos reales (se pintan de dorado vía CSS mask)
│
└── dev/
    └── test.html / test.js    Herramienta interna de depuración (tablas de la base de datos,
                                distribución de OVR inicial simulada) — no forma parte del juego,
                                es solo para calibrar balance durante el desarrollo.
```

**Orden de carga de scripts** (importa: cada archivo asume que el anterior ya está cargado):

- `index.html` → `config.js` → `script.js`
- `equipo.html` → `config.js` → `database.js` → `equipo.js`
- `carrera.html` → `config.js` → `database.js` → `events.js` → `carrera.js`

Todo vive en objetos globales (`GameConfig`, `GameDatabase`, `GameEvents`) — no hay módulos ES, ni bundler, ni build.

---

## 3. Flujo general del juego

```
index.html (crear personaje)
        │  guarda en localStorage["leyendaPlayer"]:
        │  { apellido, numero, pierna, edad, pais, flag, paisCode, posicion }
        ▼
equipo.html (elegir 1 de 4 ofertas de club inicial)
        │  agrega al mismo objeto: { equipoId, ovrInicial }
        ▼
carrera.html (el juego)
        │  arranca la Temporada 1 con ese club y ese OVR inicial
        │  ┌─────────────────────────────────────────────┐
        │  │  Se repite temporada tras temporada:          │
        │  │  calendario de 5 pausas → tramos → cierre     │
        │  └─────────────────────────────────────────────┘
        ▼
Retiro (forzoso por edad, o elegido) → resumen de carrera → volver a index.html
```

No hay guardado de partida: **todo el estado de la carrera vive en memoria mientras la pestaña está abierta**. Recargar la página reinicia la carrera desde la Temporada 1 (con el mismo club/OVR inicial, porque eso sí quedó en `localStorage`). Ver [sección 22](#22-persistencia-y-estado).

---

## 4. Creación de personaje (`index.html` + `js/script.js`)

Formulario de 3 pasos (acordeón en móvil, los 3 siempre abiertos en escritorio):

| Paso | Campo | Detalle |
|---|---|---|
| 1. ¿Quién eres? | Apellido | Texto libre, máx. 16 caracteres, se muestra en mayúsculas en la camiseta. |
| | Edad | Botones de **16 a 19 años** (`GameConfig.EDAD_MIN`/`EDAD_MAX`, [config.js:13-14](js/config.js:13)). |
| | Pierna hábil | Izquierda / derecha — **no afecta ninguna fórmula del juego**, es solo cosmético (se guarda pero no se lee en ningún cálculo). |
| 2. ¿De dónde eres? | País | 46 países (`COUNTRIES`, [script.js:4-51](js/script.js:4)), con buscador. Define bandera y, en el paso siguiente, el pool de clubes iniciales. |
| 3. ¿Dónde juegas? | Posición | 12 posiciones sobre una cancha ([index.html:158-196](index.html:158)): POR, DFC, LI, LD, MCD, MC, MI, MD, MCO, EI, ED, DC. |

El **dorsal** se asigna solo al azar entre 1 y 99 (`GameConfig.randomInt(1, 99)`, [script.js:58](js/script.js:58)) — no se elige. Recién se puede pedir cambiarlo al cerrar la primera temporada (ver [sección 18](#18-solicitud-de-cambio-de-dorsal)).

Al completar los 3 pasos y tocar "Comenzar carrera", se guarda en `localStorage["leyendaPlayer"]` ([script.js:264-282](js/script.js:264)):

```json
{ "apellido": "...", "numero": 42, "pierna": "derecha", "edad": 17,
  "pais": "Argentina", "flag": "🇦🇷", "paisCode": "ar", "posicion": "DC" }
```

y se pasa a `equipo.html`.

---

## 5. Elección de club inicial (`equipo.html` + `js/equipo.js`)

Se presentan **4 ofertas de club**, elegidas así ([equipo.js:17-32](js/equipo.js:17)):

- **Si el país elegido tiene una liga propia** en la base de datos (Argentina, Brasil, México, Estados Unidos o Colombia — las únicas 5 con `pais` cargado en `GameDatabase.ligas`), las 4 ofertas salen de esa liga, en esta banda fija (`OFERTAS_INICIALES`, [config.js:54-59](js/config.js:54)):
  - 2 clubes de **nivel 3** (chicos)
  - 1 club de **nivel 2** (consolidado)
  - 1 club de **nivel aleatorio** (1, 2 o 3 — la única chance de arrancar en un club grande)
- **Si el país NO tiene liga propia** (la inmensa mayoría — solo 5 de los 46 países la tienen), arranca "de extranjero" en una de las **5 grandes ligas europeas** elegida al azar (Premier League, La Liga, Serie A, Bundesliga, Ligue 1 — `LIGAS_GRANDES_EUROPEAS`, [config.js:51](js/config.js:51)), con una banda más floja y sin favores (`OFERTAS_INICIALES_EXTRANJERO`, [config.js:61-66](js/config.js:61)): 3 clubes de nivel 3 + 1 de nivel 2, nunca nivel 1.

El **OVR inicial** con el que arrancarías en cada club se calcula recién al elegirlo, con `calcularOvrInicial(nivelEquipo, nivelLiga)` ([config.js:94-115](js/config.js:94)):

1. Se normaliza el nivel del equipo (1–3) y el de la liga (1–6) a una escala 0..1 donde 1 = mejor: `normalizarNivel(nivel, min, max) = (max - nivel) / (max - min)`.
2. Se combinan con pesos fijos: **55% equipo + 45% liga** (`OVR_PESO_EQUIPO`/`OVR_PESO_LIGA`).
3. Ese 0..1 se mapea al rango **50–65** (`OVR_INICIAL_MIN`/`MAX`) — un novato, por definición, nunca arranca más alto que eso, sin importar cuán grande sea el club.
4. Se le suma una "suerte" aleatoria de hasta ±4 puntos (`OVR_SUERTE_VARIACION`) y se redondea, recortado siempre entre 50 y 65.

El jugador nunca ve estos números crudos: en la tarjeta de oferta solo se muestra el nombre del club/liga, su escudo, bandera y una etiqueta descriptiva (`descripcionNivelEquipo`/`descripcionNivelLiga`, [config.js:159-169](js/config.js:159): "Club grande" / "consolidado" / "humilde", "Liga de élite" / "competitiva" / "regional").

Al elegir un club se guarda `equipoId` y `ovrInicial` en el mismo objeto de `localStorage`, y se pasa a `carrera.html`.

---

## 6. El motor de carrera — visión general (`js/carrera.js`)

Es el archivo más grande (1500+ líneas): mezcla el **estado del juego**, la **simulación** y **todo el render de la UI** de `carrera.html` (no hay separación de capas — es un único script).

### Estado central

```js
let temporadaActual;          // la temporada en curso (objeto mutable)
let temporadasFinalizadas = []; // historial completo, incluye filas partidas por traspasos a mitad de año
let temporadasEnClubActual = 0; // temporadas completas en el club actual (para el período de gracia de contrato)
let carreraFinalizada = false;
const edadRetiroForzoso = GameConfig.randomInt(41, 45); // sorteada UNA VEZ por carrera, al cargar la página
```

`temporadaActual` (creada por `crearTemporada()`, [carrera.js:122-153](js/carrera.js:122)) contiene, entre otras cosas: `numero`, `anio`, `equipoId`, `ovr`, `partidos/goles/asistencias/mvp/sumaRating/promedio`, `valorMercado`, `trofeos[]`, `forma`, `titular`, `progreso` (0–100%), `calendario[]`, `checkpointIndex`, `tramoIndex`, `lesionActiva`, `bufferRendimiento`/`bufferEquipo` (efecto acumulado de las decisiones del tramo en curso, sin aplicar todavía) y `competiciones` (liga + copa nacional + copa internacional de esa temporada).

Si se abre `carrera.html` sin haber pasado por la creación de personaje (sin `equipoId`/`ovrInicial` válidos en `localStorage`), arranca una **carrera demo** ya avanzada, con el mismo motor real (totalmente jugable) — [carrera.js:758-785](js/carrera.js:758).

**La edad sube 1 año por cada temporada, nunca dentro de una misma temporada** — `getEdadActual()` ([carrera.js:787-789](js/carrera.js:787)):

```
edadActual = edad de creación + (número de temporada actual − 1)
```

Todas las fórmulas que dependen de la edad (crecimiento/declive de OVR, riesgo de lesión, ventanas de fichaje, retiro) usan este valor.

---

## 7. Calendario de temporada

Cada temporada tiene **3 "tramos"** (`TOTAL_TRAMOS_TEMPORADA`, [config.js:534](js/config.js:534)) — bloques de partidos que se simulan de una vez — separados por **5 pausas** donde el jugador interactúa: 3 de decisiones y 2 de fichajes.

`crearCalendarioTemporada(numeroTemporada)` ([config.js:539-550](js/config.js:539)) arma:

| Pausa | Momento (`progreso` %) | Nota |
|---|---|---|
| Oferta (pretemporada) | 0% | **Solo a partir de la Temporada 2** — en la 1 ya elegiste equipo en la creación. |
| Decisión | aleatorio entre 5% y 45% | "antes de la mitad" |
| Oferta (mitad de temporada) | 50% siempre | Fija |
| Decisión | aleatorio entre 0% y 100% | "en cualquier punto" |
| Decisión | aleatorio entre 92% y 99% | "último momento" |

Las 5 (o 4, en la Temporada 1) se ordenan por `progreso` para que el calendario quede cronológico. Cada pausa de decisión resuelta dispara la simulación del tramo siguiente (`simularTramoYAvanzar`) y avanza al próximo checkpoint (`avanzarCheckpoint`, [carrera.js:453-460](js/carrera.js:453)); al agotarse el calendario, se cierra la temporada (`finalizarTemporada`).

**Alto Impacto**: al crear la temporada se sortea si va a haber un evento de alto impacto (30% de probabilidad) y, si sale, en cuál de los 3 tramos va a aparecer (`altoImpactoPausa`, [carrera.js:145](js/carrera.js:145)). Ver [sección 19](#19-banco-de-eventos-de-temporada-jseventsjs).

---

## 8. El ciclo de un tramo, paso a paso

Todo pasa en `simularTramoYAvanzar()` ([carrera.js:567-659](js/carrera.js:567)), disparado al resolver la última decisión pendiente de una pausa:

1. **Partidos del club esta franja**, sumando las 3 competiciones activas:
   - Liga: `partidosLigaParaTramo` reparte el total de la temporada entre los 3 tramos a partes iguales, y el último tramo absorbe el resto del redondeo.
   - Copa nacional / internacional: `resolverKnockout` — en su tramo de "partidos mínimos" juega la ronda garantizada; después, un tramo por cada ronda extra disponible, con una tirada de `probAvanzarRonda(fuerza)` para seguir viva (si pierde, queda eliminado para el resto de la temporada).
2. **Titularidad de este tramo**: `calcularTitular(ovr, rendimientoAcumulado)` — una tirada (ver fórmula en [sección 9](#9-participación-cuántos-partidos-jugás-vos)) decidida **antes** de calcular cuánto jugás, para que ser titular realmente sume participación (no es solo un badge decorativo).
3. **Cuántos de esos partidos jugás vos** (no todos, ver sección 9) — si estás lesionado, **cero**, sin excepción.
4. **Resultado del tramo** (`GameConfig.simularTramo`, ver [sección 10](#10-estadísticas-del-tramo-goles-asistencias-mvp-rating)): goles, asistencias, MVPs y la suma de ratings de esos partidos.
5. Se acumulan a las estadísticas de la temporada, se recalcula el promedio (`sumaRating / partidos`).
6. **Se ajusta el OVR** (`ajustarOvrTramo`, [sección 11](#11-progresión-de-ovr)) y se recalcula el **valor de mercado** con el nuevo OVR.
7. Se descuenta un tramo a la lesión activa, si había una; al llegar a 0, se da de alta.
8. Se avanza `tramoIndex` y el `progreso` salta al de la próxima pausa del calendario.
9. Se anima el spotlight (anillo de progreso + contadores) y, 1050ms después (`ANIMACION_TRAMO_MS` + margen), se pasa a la próxima pausa (o se cierra la temporada si no queda ninguna).

Al **cerrar la temporada** (`finalizarTemporada`, [carrera.js:661-737](js/carrera.js:661)):

- Se tira si ganás la **liga** y, si tu copa nacional llegó a la final, si la ganás también (fórmulas en [sección 14](#14-sistema-de-competiciones-liga-copas-clasificación-internacional)).
- Se decide la **clasificación internacional de la próxima temporada** según qué tan bien te fue.
- Se archiva la temporada en `temporadasFinalizadas`, se crea la siguiente (heredando OVR y club), y se habilita el pedido de cambio de dorsal.

---

## 9. Participación: cuántos partidos jugás vos

Los partidos de arriba son los del **equipo**; cuántos de esos jugás vos depende de tu nivel, tu momento y si sos titular ese tramo.

**Titularidad** — `calcularTitular(ovr, rendimientoAcumulado)` ([config.js:684-687](js/config.js:684)):

```
prob = clamp(0.6 + rendimientoAcumulado × 0.05 + (ovr − 55) × 0.015, 0.1, 0.97)
```

**Probabilidad de jugar cada partido** — `probabilidadJugar(ovr, rendimientoAcumulado, forma, esTitular)` ([config.js:779-785](js/config.js:779)):

```
prob = 0.65                              (PARTICIPACION_BASE)
     + (ovr − 55) × 0.01                 (PARTICIPACION_OVR_REFERENCIA)
     + rendimientoAcumulado × 0.03
     + bonusForma                        (ver tabla abajo)
     + 0.2 si sos titular este tramo     (PARTICIPACION_BONUS_TITULAR)
recortado entre 0.15 y 1
```

| Forma | Bonus de participación |
|---|---|
| Inspirado | +0.15 |
| En plenitud | +0.12 |
| Animado | +0.06 |
| Regular | 0 |
| Desanimado | −0.08 |
| Bajo de forma | −0.15 |
| Tocado físicamente (lesionado) | −0.35 |

`partidosJugador = redondeoEstocastico(partidosClub × prob)` (ver "redondeo estocástico" en [sección 11](#11-progresión-de-ovr)), recortado entre 0 y los partidos totales del club ese tramo. Si hay una lesión activa, `partidosJugador` es directamente 0, sin pasar por esta fórmula.

---

## 10. Estadísticas del tramo: goles, asistencias, MVP, rating

`GameConfig.simularTramo({ partidos, grupo, ovr, rendimientoAcumulado })` ([config.js:583-603](js/config.js:583)) recorre partido por partido (de los que jugás vos, no los del equipo).

**Grupo de posición** (`GRUPOS_POSICION`, [config.js:558-563](js/config.js:558)): cada una de las 12 posiciones cae en uno de 4 grupos —arquero, defensa, medio, ataque— cada uno con su propia propensión a convertir:

| Grupo | Prob. de gol por partido (base) | Prob. de asistencia por partido (base) |
|---|---|---|
| Arquero | 1% | 1% |
| Defensa | 12% | 14% |
| Medio | 24% | 34% |
| Ataque | 55% | 28% |

**Factor de forma general del tramo**:

```
factorOvr   = 0.85 + (ovr − 50) / 50        (~neutral en el debut, crece fuerte después)
factorForma = 1 + clamp(rendimientoAcumulado, −12, 12) × 0.05
factor      = max(0.3, factorOvr × factorForma)
```

Por cada partido: `hizoGol` sale con probabilidad `propensiónGol × factor`, `hizoAsistencia` con `propensiónAsistencia × factor` (tiradas independientes entre sí).

**MVP y rating del partido** están conectados a si metiste gol/asistencia ESE partido puntual (no son 3 sorteos independientes):

```
prob. de MVP  = 0.09 × factor + 0.14 (si hizo gol) + 0.08 (si hizo asistencia)
rating        = clamp(6.5 + (factor − 1) × 2.5 + 0.7 (si gol) + 0.4 (si asistencia) + ruido(±0.4), 5, 10)
```

El resultado del tramo (goles, asistencias, MVPs, suma de ratings) se acumula a las estadísticas de la temporada.

---

## 11. Progresión de OVR

`ajustarOvrTramo(ovrActual, rendimientoAcumulado, edad)` ([config.js:670-682](js/config.js:670)) — se llama una vez por tramo, después de simular las estadísticas de ese tramo:

```
deltaBase = (0.7 + rendimientoAcumulado / 6) × factorCrecimientoPorEdad(edad)
declive   = factorDeclivePorEdad(edad)
deltaCrudo = deltaBase − declive
delta = redondeoEstocastico(deltaCrudo), recortado entre:
        · [-1, +3]  en circunstancias normales (sin declive por edad)
        · [-10, +3] si ya hay declive por edad actuando
ovrNuevo = clamp(ovrActual + delta, 45, 99)     (OVR_CARRERA_MIN / MAX — piso y techo absolutos)
```

**Redondeo estocástico** ([config.js:658-664](js/config.js:658)): en vez de redondear siempre igual, un valor de 0.4 da +1 el 40% de las veces y 0 el 60% restante — así los cambios chicos de vez en cuando pasan, en vez de quedar completamente anulados por el redondeo.

**Freno de crecimiento por edad** — `factorCrecimientoPorEdad(edad)` ([config.js:631-638](js/config.js:631)):

| Edad | Factor |
|---|---|
| ≤ 26 años | 1.0 (crecimiento pleno) |
| 27 a 31 | interpola linealmente de 1.0 a 0.35 |
| 32+ | fijo en 0.35 (un tercio del ritmo pleno — nunca llega a cero) |

**Declive natural por edad** — `factorDeclivePorEdad(edad)` ([config.js:649-656](js/config.js:649)), independiente del freno de arriba:

- Antes de los 32 años: 0 (sin declive).
- De 32 a 39: resta **0.08 de OVR por tramo, por cada año** por encima de 32.
- De 39 en adelante: además, resta **0.35 por tramo, por cada año** por encima de 39 (la caída se acelera fuerte).

En cuanto el declive es mayor a 0, el piso de variación por tramo pasa de −1 a **−10** (`OVR_TRAMO_DECLIVE_VARIACION_MIN`) — nadie se mantiene en su pico para siempre.

**Talento oculto**: al arrancar la carrera se sortea, una única vez, un multiplicador entre **0.85x y 1.2x** (`TALENTO_MIN`/`MAX`, [config.js:695-696](js/config.js:695); sorteado en [carrera.js:750-751](js/carrera.js:750)) que se aplica solo a `deltaBase` (el crecimiento, no el declive) dentro de `ajustarOvrTramo` — así, con las mismas decisiones de punta a punta, dos carreras no crecen exactamente igual: a veces te toca un desarrollo más lento, a veces un talento precoz. No se expone en ningún número visible del juego.

---

## 12. Estado de forma

7 estados (`FORM_STATES`, [config.js:229-237](js/config.js:229)), de mejor a peor: **Inspirado 🔥 → En plenitud 💪 → Animado 🙂 → Regular 😐 → Desanimado 😕 → Bajo de forma 📉 → Tocado físicamente 🤕**.

Cada opción de cada decisión de evento cambia la forma directamente a un valor fijo (no es aleatorio: está definido evento por evento en `js/events.js`). La forma afecta:

- **Participación** (tabla en [sección 9](#9-participación-cuántos-partidos-jugás-vos)).
- **La "calidad" de la temporada del equipo** (`FORMA_CALIDAD`, ver [sección 14](#14-sistema-de-competiciones-liga-copas-clasificación-internacional)) — de 1.0 (inspirado) a 0.05 (lesionado).

Mientras hay una lesión de nivel 1 o 2 activa, la forma queda **fija en "Tocado físicamente"** sin importar qué decisiones tomes (las decisiones siguen sumando a `rendimiento`/`equipo`, solo no "curan" el ánimo de golpe) — [carrera.js:1165-1170](js/carrera.js:1165).

---

## 13. Lesiones

Se evalúan en **cada pausa de decisión** (nunca en una de fichajes), solo si no hay ya una lesión activa — `intentarGenerarLesion(edad)` ([carrera.js:407-433](js/carrera.js:407)).

**Probabilidad de lesión** — `probabilidadLesion(edad)` ([config.js:824-827](js/config.js:824)):

```
prob = clamp(0.065 + max(0, edad − 30) × 0.0027, 0, 0.18)
```

Sube con la edad a partir de los 30 años, con un techo del 18%.

**Nivel de la lesión** (sorteo ponderado, `elegirNivelLesion`, [config.js:830-839](js/config.js:830)):

| Nivel | Probabilidad de que salga | Efecto |
|---|---|---|
| Nivel 3 (leve) | 55% | Sin partidos durante 1 pausa. Sin efecto en forma ni OVR. |
| Nivel 2 (moderada) | 35% | Sin partidos 1–2 pausas + forma fija en "Tocado" + OVR **−1 a −3**, aplicado de una vez. |
| Nivel 1 (grave) | 10% | Sin partidos, entre 2 pausas y el resto de la temporada + forma fija en "Tocado" + OVR **−4 a −10**, aplicado de una vez. |

La duración exacta (`duracionLesion`, [config.js:857-868](js/config.js:857)) y la pérdida de OVR (`ovrPerdidoPorLesion`, [config.js:870-874](js/config.js:870)) se sortean dentro de esos rangos, siempre topeados por los tramos que en verdad quedan en la temporada. Cada nivel tiene su propio banco de nombres/descripciones de lesión real (rotura de LCA, esguince, desgarro, etc. — ver [sección 19](#19-banco-de-eventos-de-temporada-jseventsjs)).

Cuando sale una lesión nueva, esa pausa entera se reemplaza por un **parte médico** (sin decisiones que tomar) que se lee y avanza solo a los 3.2 segundos (`LESION_INFORME_MS`, [carrera.js:976](js/carrera.js:976)).

**Recuperación al darte de alta**: al cumplirse los tramos de baja, se te devuelve el **50%** del OVR que perdiste por esa lesión (`LESION_RECUPERACION_OVR`, [config.js:907](js/config.js:907), aplicado en [carrera.js:636-645](js/carrera.js:636)) — fue un golpe físico puntual, no una pérdida de nivel definitiva. El toast de "te recuperaste" muestra cuánto OVR recuperaste, si fue mayor a 0.

---

## 14. Sistema de competiciones (liga, copas, clasificación internacional)

Todo sale de un único número por temporada, la **"fuerza de campaña"** — `calcularFuerzaCampana(nivelEquipo, nivelLiga, forma, equipoAcumuladoTemporada)` ([config.js:719-729](js/config.js:719)):

```
calidadClub          = misma fórmula de "calidad" que el OVR inicial (55% equipo + 45% liga)
calidadForma         = FORMA_CALIDAD[forma]     (1.0 inspirado ... 0.05 lesionado)
calidadEquipoAcum    = clamp(0.5 + equipoAcumuladoTemporada / 8, 0, 1)

fuerza = 0.5 × calidadClub + 0.2 × calidadForma + 0.3 × calidadEquipoAcum
```

`equipoAcumuladoTemporada` es la suma de todos los efectos `equipo` de las decisiones tomadas en la temporada — cómo le vino colectivamente el año al plantel según tus elecciones.

De `fuerza` salen 4 cosas:

**Ganar la liga** (al cierre de temporada) — curva empinada, casi exclusiva de los grandes:
```
prob = clamp(0.02 + 0.85 × fuerza^3.5, 0, 0.85)
```

**Ganar la copa nacional** (si llegaste a la final) — mucho más pareja a propósito:
```
prob = clamp(0.05 + 0.70 × fuerza^1.3, 0, 0.70)
```

**Avanzar de ronda** en una eliminatoria (copa nacional o internacional), una tirada por ronda:
```
prob = clamp(0.25 + 0.5 × fuerza, 0.1, 0.85)
```

**Clasificación internacional para la próxima temporada**:
- `fuerza ≥ 0.72` o ganaste la liga → clasificás a la competición de **primer nivel** de tu confederación (Champions League / Libertadores / Concacaf Champions Cup).
- `fuerza ≥ 0.45` o ganaste la copa nacional → clasificás a la de **segundo nivel** (Europa League / Sudamericana — CONCACAF no tiene equivalente).
- Si no, no clasificás a nada.

Los partidos de cada competición (mínimos garantizados + extra por ronda) salen de `GameDatabase.competiciones` — ver [sección 20](#20-base-de-datos-de-ligas-y-equipos-jsdatabasejs).

---

## 15. Valor de mercado

`calcularValorMercado(ovr, nivelEquipo, nivelLiga)` ([config.js:192-197](js/config.js:192)) — curva exponencial sobre el OVR (cada punto extra cerca del techo vale desproporcionadamente más, como en la vida real), multiplicada por el prestigio del club/liga actual:

```
valorPorOvr = 18000 × 1.185^(ovr − 45)          (VALOR_MERCADO_BASE, VALOR_MERCADO_CRECIMIENTO)
multiplicadorClub = interpola entre 0.5 (club/liga más floja) y 1.4 (más prestigiosa)
                     según la misma "calidad combinada" de siempre (55% equipo + 45% liga)
valor = round(valorPorOvr × multiplicadorClub / 1000) × 1000    (redondeado al millar)
```

Se recalcula cada vez que cambia el OVR (cada tramo) y cada vez que cambiás de club (con el nivel del club nuevo). Se muestra formateado con `formatMarketValue` ([carrera.js:51-55](js/carrera.js:51)): `€18K`, `€1.2M`, etc.

Para las **ofertas de fichaje** se usa una variante cosmética, `valorOfrecidoPorClub`, que le suma un ±8% de variación aleatoria (`OFERTA_VARIACION_VALOR`, [config.js:205-210](js/config.js:205)) — para que dos clubes del mismo nivel exacto no muestren el mismísimo número al centavo en sus tarjetas. No afecta tu valor de mercado real, solo el texto "Te valoran en €X" de esa tarjeta puntual.

---

## 16. Sistema de fichajes y ofertas

Toda la lógica vive en `generarLoteOfertas(equipoActualId, ovr, edad, valorActual)` ([carrera.js:187-317](js/carrera.js:187)), que corre en cada pausa de "oferta" del calendario.

### 16.1 Retiro forzoso (el corte final)

```js
if (edad >= edadRetiroForzoso) return [ solo la carta de retiro forzoso ];
```

`edadRetiroForzoso` se sortea **una sola vez por carrera**, entre 41 y 45 años (`EDAD_RETIRO_FORZOSO_MIN`/`MAX`). A partir de esa edad, no importa el club ni el OVR: la única carta es retirarte.

**Transición previa (no es un corte seco)**: en las **2 temporadas** justo antes de esa edad (`EDAD_RETIRO_TRANSICION`, [config.js:490](js/config.js:490)), el cupo de ofertas de club se reduce a **1** en vez de 2 — cada vez menos clubes se animan a día ofertarte, hasta que en la última temporada esa única oferta también desaparece. Se implementa como una tercera categoría de cupo en [carrera.js:241-248](js/carrera.js:241): `enTransicionRetiro` reduce `cantidadOfertasClub` a 1 (solo si el contrato actual sigue en pie), antes de llegar al corte total de la edad forzosa.

### 16.2 Período de gracia de contrato

```js
enGraciaDeContrato = temporadasEnClubActual < 2     (TEMPORADAS_GRACIA_CONTRATO)
```

Mientras estés en gracia (tus primeras **2 temporadas completas** en el club actual, sea el inicial o uno fichado después), tu club **nunca** puede "no renovarte" — sin este colchón, cualquier club de nivel medio/alto para arriba te dejaría ir en tu primerísima ventana de fichajes, porque ningún novato arranca con el OVR de un jugador hecho (ver [sección 5](#5-elección-de-club-inicial-equipohtml--jsequipojs): tope de 65 vs. ventanas de OVR que fácilmente piden 70+). El contador se resetea a 0 cada vez que fichás por otro club y sube +1 en cada cierre de temporada en el mismo club.

### 16.3 ¿Tu club actual te renueva?

Pasado el período de gracia, `contratoDebeTerminar(nivelEquipo, nivelLiga, ovr)` ([config.js:483-486](js/config.js:483)) compara tu OVR contra la "ventana de OVR" de tu propio club (ver 16.5 más abajo): si caíste por debajo del mínimo que ese nivel tolera, no te renuevan — la carta de "Quedarme" se reemplaza por una de retiro (no forzoso, con el texto "tu nivel ya no alcanza").

### 16.4 Retiro voluntario

```js
puedeElegirRetiro = !contratoTerminado && edad >= 36     (EDAD_RETIRO_OFERTA)
```

Desde los 36 años podés elegir colgar los botines aunque tu club te siga queriendo — ocupa una de las 3 cartas de club, dejando solo 2 cupos de fichaje ese año (y, en ese caso puntual, sin la garantía de liga/país local del punto 16.6).

### 16.5 Elegibilidad real: la "ventana de OVR" de cada club

Cada combinación equipo+liga solo puede ofertarte si tu OVR cae dentro de su ventana — `equipoElegibleParaOvr` / `ventanaOvrOferta` ([config.js:430-449](js/config.js:430)):

```
centro = 45 + calidadCombinada(nivelEquipo, nivelLiga) × 54    (mapeado a todo el rango 45-99 de carrera)
ventana = [ clamp(centro − 13, 45, 99) , clamp(centro + 13, 45, 99) ]     (OFERTA_TOLERANCIA_OVR = 13)
```

Es un **corte duro**, no solo "menos probable": un club chico deja de poder ofertarte en cuanto sos demasiado bueno para él, y uno grande no entra en juego hasta que estás a su altura (con la tolerancia de 13 puntos, los clubes top del mundo ya son alcanzables desde ~86 de OVR).

Además, la oferta tiene que tener sentido en plata: `ofertaTieneValorRazonable(valorActual, valorEnClub)` ([config.js:219-222](js/config.js:219)) descarta clubes donde fichar implicaría un desplome de más del 60% de tu valor de mercado actual (`OFERTA_UMBRAL_CAIDA_VALOR = 0.4`, es decir el club tiene que ofrecerte como mínimo el 40% de lo que valés hoy), aunque el margen de OVR lo deje pasar.

Si el cruce de ambos filtros deja el pool vacío (dataset chico o caso límite), se relaja primero el filtro de valor, y si todavía no alcanza, se usan todos los candidatos — nunca se deja al jugador sin ofertas.

### 16.6 Cuáles de los elegibles aparecen (y en qué orden de prioridad)

Dentro del pool ya elegible, no se sortea parejo entre todos:

1. **Potencial ajustado por edad** (no el OVR real) decide a qué nivel de club/liga "apunta" el jugador — `potencialAjustadoPorEdad(ovr, edad)` ([config.js:503-515](js/config.js:503)):

   ```
   17 a 24 años: bono que baja linealmente de +8 (a los 17) a 0 (a los 24) — EDAD_POTENCIAL_BONUS_MAX/HASTA
   25 a 30 años: sin ajuste (edad ideal)
   30+ años:     penalización de −0.7 de OVR efectivo por cada año por encima de 30
   ```

   Esto **no** toca la elegibilidad real del punto 16.5 (esa sigue siendo puro OVR) — solo decide, entre los clubes ya alcanzables, cuáles se priorizan. A igual OVR, un jugador de 27 años apunta más arriba que uno de 38.

2. Con ese potencial se calcula el "nivel objetivo" de equipo y de liga (`nivelEquipoObjetivo`/`nivelLigaObjetivo`, [config.js:394-402](js/config.js:394) — cuanto más prestigio, más cerca de nivel 1), y el peso de cada candidato según qué tan cerca está de ese objetivo (`pesoPorCercaniaNivel`, [config.js:408-412](js/config.js:408)):

   ```
   distancia = |nivelEquipo − objetivo| + |nivelLiga − objetivoLiga| × 0.6
   peso = 1 / (1 + distancia)^2.2
   ```

3. **`elegirMejorEncaje`** ([config.js:376-381](js/config.js:376)): ordena los candidatos por peso descendente, y sortea (ponderado, para que siga habiendo variedad) **solo dentro del 40% superior** (`OFERTA_TOP_ENCAJE_FRACCION`) — así, si tu nivel da para los grandes, van a ser los grandes los que en verdad aparezcan, en vez de perderse en un sorteo parejo contra todo el pool elegible.

### 16.7 Cuántas ofertas de club, y la garantía de "tu entorno"

- **3 cupos de club** normalmente (+ la carta de tu club actual = 4 tarjetas en total).
- **2 cupos** si podés elegir retiro voluntario (16.4) — ahí no hay garantía de entorno, queda 100% libre.

Con 3 cupos, **hasta 2 de las 3** salen garantizadas de tu "entorno" ([carrera.js:246-264](js/carrera.js:246)) — exactamente 2 si hay al menos 2 candidatos ahí, menos si no los hay (nunca se fuerza una oferta sin sentido solo para completar el cupo local):

- Normalmente, de **tu liga actual**.
- Desde los **33 años** (`EDAD_OCASO_RETORNO_PAIS`, [config.js:521](js/config.js:521)), ese criterio cambia a **tu país de origen** — para simular volver a cerrar la carrera en casa, aunque la hayas jugado toda en el exterior.

El resto de los cupos (y todo, si no hay candidatos "locales" suficientes) sale libre del pool elegible completo, mismo criterio de mejor encaje. Si aun así faltan candidatos distintos, se completa repitiendo clubes antes que mostrar menos ofertas de las que corresponden.

Las 3-4 cartas resultantes se mezclan en orden aleatorio, con la carta de tu club actual (quedarme/retiro) siempre al final, para que el jugador la encuentre siempre en el mismo lugar.

### 16.8 Resolver la pausa

Un solo clic resuelve toda la pausa:

- **Retiro** → cierra la carrera ([sección 17](#17-fin-de-carrera-retiro-y-resumen)).
- **Fichar por un club nuevo** → si ya jugaste partidos con el club actual esta temporada, esa parte se archiva como su propia fila del historial (con sus propias estadísticas — el historial puede mostrar 2 filas para el mismo año si hubo un traspaso a mitad de camino); se actualiza club, liga, valor de mercado, se resetea `temporadasEnClubActual` a 0 y la forma vuelve a "regular".
- **Quedarme** → sin cambios, solo un mensaje de confirmación.

---

## 17. Fin de carrera: retiro y resumen

Al aceptar una carta de retiro (`finalizarCarrera`, [carrera.js:1326-1350](js/carrera.js:1326)):

- Se archiva la temporada en curso tal como quedó.
- El spotlight desaparece y el panel de decisiones muestra el mensaje de despedida con **2 botones**:
  - **"Ver resumen de mi carrera"** → abre un modal con:
    - Escudo del último club, posición, temporadas jugadas y edad de retiro.
    - Estadísticas combinadas de **toda** la carrera (todas las filas de `temporadasFinalizadas`, incluidas las partidas por traspasos): partidos, goles, asistencias, MVP y promedio de rating.
    - Mayor OVR y mayor valor de mercado alcanzados en cualquier punto de la carrera.
    - Todos los clubes en los que jugaste, **en el orden en que los fichaste**, sin repetir.
    - Todos los trofeos ganados, **agrupados por tipo** (un solo ícono por trofeo distinto, con un contador "×N" si lo ganaste más de una vez).
  - **"Aceptar"** → vuelve a `index.html` para arrancar una carrera nueva.

Toda la lógica de agregación vive en `construirResumenCarrera()` ([carrera.js:1355-1394](js/carrera.js:1355)).

---

## 18. Solicitud de cambio de dorsal

Se habilita al cerrar **cada** temporada ([carrera.js:724-728](js/carrera.js:724)) y queda disponible hasta que se use (no hace falta pedirlo en el momento). Un solo pedido por vez.

`probabilidadAceptarCambioNumero(ovr, equipoAcumuladoTemporada)` ([config.js:799-804](js/config.js:799)) — evaluado con el OVR y el rendimiento colectivo **con los que cerró** la temporada anterior, no con los de la nueva (que todavía no jugó nada):

```
prob = clamp(0.3 + (ovr − 45) × 0.008 + equipoAcumuladoTemporada × 0.05, 0.05, 0.95)
```

El número pedido en sí no influye en nada — lo que pesa es tu peso dentro del plantel, no si "el 10 está más pedido" que el 23.

---

## 19. Banco de eventos de temporada (`js/events.js`)

**226 eventos de decisión** en total, cada uno con **2 opciones** (formato completo documentado en el encabezado de [events.js:10-28](js/events.js:10)):

| Banco | Cantidad | Cuándo aplica |
|---|---|---|
| `generales` | 100 | Cualquier edad |
| `porEdad.novato` | 35 | Edad ≤ 21 años (`RANGO_EDAD_NOVATO_MAX`) |
| `porEdad.promedio` | 35 | 22 a 32 años (`RANGO_EDAD_PROMEDIO_MAX`) |
| `porEdad.veterano` | 34 | 33+ años |
| `altoImpacto` | 22 | Cualquier edad, máx. 1 por temporada |

**Selección de un evento normal** (`elegirEventoPorTipo`, [carrera.js:330-347](js/carrera.js:330)): para cada pausa, 50/50 si sale del banco `generales` o del banco correspondiente a la edad actual; dentro de ese banco se filtra por tipo (`"personal"` o `"deportivo"` — cada pausa siempre muestra exactamente 1 de cada). **Ningún evento se repite en la misma carrera**: se recuerda cada id ya usado (`eventosUsados`, compartido entre bancos) y se excluye de futuros sorteos; si un banco se queda sin eventos sin usar de ese tipo (carrera muy larga), se libera el filtro para ese banco puntual antes que forzar una repetición.

**Eventos de Alto Impacto**: sin restricción de edad, efectos mucho más fuertes (hasta ±6 de rendimiento, ±4 de equipo — contra ±3/±2 de los eventos normales), y algunos tienen **las dos opciones en negativo a propósito** (elegir el mal menor, no "ganar"). Se identifican con un ⚠️ en la tarjeta. Se sortea al crear la temporada si va a haber uno (30% de probabilidad) y en qué tramo; si sale, reemplaza al evento del tipo que corresponda en esa pausa.

Cada opción define: el texto del botón, sus `efectos` (`rendimiento` −3..+3 normal / −6..+6 alto impacto, `forma` nuevo estado fijo, `equipo` −2..+2 normal / −4..+4 alto impacto) y el texto de resultado que se muestra al elegirla.

**Lesiones** (contenido, no la lógica — ver [sección 13](#13-lesiones)): 17 lesiones reales con nombre y descripción médica, repartidas en nivel3 (6, leves), nivel2 (6, moderadas) y nivel1 (5, graves — LCA, fractura de tibia/peroné, tendón de Aquiles, hernia discal, rotura muscular grado 3).

---

## 20. Base de datos de ligas y equipos (`js/database.js`)

**10 ligas reales**, con nivel oculto de 1 (mejor) a 6 (peor):

| Liga | País | Nivel |
|---|---|---|
| Premier League | Inglaterra | 1 |
| La Liga | España | 1 |
| Serie A | Italia | 1 |
| Bundesliga | Alemania | 1 |
| Ligue 1 | Francia | 1 |
| Brasileirão Série A | Brasil | 2 |
| Primera División Argentina | Argentina | 3 |
| Liga MX | México | 3 |
| MLS | Estados Unidos | 3 |
| Primera A (Colombia) | Colombia | 4 |

Solo las últimas 5 tienen el campo `pais` cargado (por eso son las únicas que pueden ser el punto de partida "local" en la creación de personaje — ver [sección 5](#5-elección-de-club-inicial-equipohtml--jsequipojs)).

**~290 equipos reales** repartidos en esas 10 ligas, cada uno con: nombre real, nivel oculto de 1 (grande) a 3 (chico), iniciales y colores propios (para el placeholder si el escudo no carga) y el nombre del archivo de escudo real.

**19 competiciones reales** ([database.js:314-376](js/database.js:314)):
- 10 ligas domésticas (una por cada liga cargada), con la cantidad real de partidos de su formato vigente (ej. Premier League 38, Liga MX 34 + 12 de liguilla, Primera A Colombia 38 + 10 de cuadrangulares).
- 10 copas domésticas (FA Cup, Copa del Rey, Coppa Italia, DFB-Pokal, Coupe de France, Copa do Brasil, Copa Argentina, Copa México, Lamar Hunt U.S. Open Cup, Copa Colombia).
- 4 competiciones internacionales por confederación/categoría: Champions League y Europa League (UEFA), Libertadores y Sudamericana (CONMEBOL), Concacaf Champions Cup (CONCACAF no tiene un segundo nivel continental vigente).

Todos los números de partidos (mínimos garantizados + rondas extra) son una referencia realista basada en el formato vigente de cada torneo — ver los comentarios junto a cada entrada en el archivo para el detalle de cada formato.

---

## 21. Interfaz: componentes, animaciones y responsive

- **Tokens de diseño** centralizados en `:root` de [css/style.css](css/style.css) (colores, radios) — compartidos por las 3 páginas.
- **Escudos con fallback**: `crestHtml`/`ligaCrestHtml` ([config.js:283-310](js/config.js:283)) intentan cargar el PNG real; si falla (`onerror`), se reemplazan solas por un placeholder de iniciales + degradado de los colores del club (`crestFallback`). Los escudos de liga no llevan ese fondo — solo el logo (clase `team-crest--liga`).
- **Banderas reales** vía [flagcdn.com](https://flagcdn.com) (los emoji de bandera no se dibujan en Windows), con el emoji como respaldo de texto si la imagen falla (`flagHtml`/`flagFallback`).
- **Trofeos**: siluetas PNG en `assets/escudos/trofeos/`, pintadas del dorado del sistema vía `mask-image` — el color original del archivo no importa, solo su transparencia define la forma (`trofeoIconHtml`).
- **Color del badge de OVR** (`ovrTierColor`, [carrera.js:42-49](js/carrera.js:42)) — 6 niveles fijos, de metal a gema, proporcionales al rango real de carrera (45–99):

  | OVR | Color |
  |---|---|
  | 45–65 | Bronce |
  | 66–79 | Plata |
  | 80–89 | Oro |
  | 90–92 | Rubí |
  | 93–95 | Esmeralda |
  | 96–99 | Amatista |

- **Etiquetas de efecto en cada opción de decisión** (`efectoRendimientoHtml`/`efectoFormaHtml`/`efectoEquipoHtml`, [carrera.js:1021-1034](js/carrera.js:1021)): antes de elegir, cada botón muestra de forma explícita qué le va a pasar a tu rendimiento, tu forma y al equipo si lo tocás — no hay efectos ocultos en las decisiones de evento.
- **Animaciones de tramo**: los números del spotlight (partidos, goles, OVR, anillo de progreso) no saltan de golpe — se animan con un *ease-out* cúbico durante 900ms (`animarNumero`/`animarAnilloProgreso`, [carrera.js:466-516](js/carrera.js:466)).
- **Reacomodo de tarjetas (técnica FLIP)**: al resolver una decisión y quedar menos tarjetas, la que sigue no salta de golpe a su nueva posición — se captura su posición anterior y se anima el desplazamiento (`capturarPosicionesCards`/`animarReacomodoCards`, [carrera.js:1131-1158](js/carrera.js:1131)).
- **Línea de diseño móvil independiente**: por debajo de los 640px, `carrera.css` no solo achica la versión de escritorio — el hero, el spotlight y el historial tienen su propio HTML más chato (generado aparte en `carrera.js`, oculto/mostrado por CSS), y el panel de decisiones pasa a un carrusel de una tarjeta a la vez con scroll-snap, sin JavaScript adicional para eso.
- **Toast** (`showToast`, definido igual en `carrera.js`/`equipo.js`/`script.js`): en `carrera.html` aparece debajo del hero en vez de abajo de la pantalla, porque ahí abajo siempre está el panel de decisiones.
- **Pie de versión** (`GameConfig.VERSION`, `GameConfig.FECHA_PUBLICACION`, `GameConfig.footerHtml()` — [config.js:11-19](js/config.js:11)): un único punto de verdad para el número de versión y la fecha de publicación, mostrado en las 3 pantallas (`#appFooter`). En `index.html`/`equipo.html` es el último elemento de la página (scroll normal); en `carrera.html` va dentro de `.career`, después del historial, para no restarle alto fijo al hero/spotlight/decisiones.

---

## 22. Persistencia y estado

- `localStorage["leyendaPlayer"]` es la **única** persistencia real: identidad del jugador + club/OVR inicial. Se escribe en `index.html` y se completa en `equipo.html`.
- **Toda la progresión de la carrera** (temporada actual, historial, OVR, trofeos, valor de mercado, etc.) vive únicamente en variables de JavaScript en memoria, dentro de `carrera.html`. **No hay guardado de partida**: cerrar la pestaña o recargar la página pierde el progreso de la carrera (vuelve a arrancar la Temporada 1, con el mismo club/OVR inicial que sí quedó guardado).
- No hay backend, base de datos externa, ni llamadas de red propias del juego (aparte de pedir escudos/banderas/imágenes de trofeos como archivos estáticos, y las banderas de país a flagcdn.com).

---

## 23. Tabla completa de constantes de balance

Todas viven en [`js/config.js`](js/config.js). Cambiar cualquiera de estos números es la forma correcta de recalibrar el juego — nunca hay "números mágicos" repetidos sueltos en otros archivos.

| Constante | Valor | Qué controla |
|---|---|---|
| `EDAD_MIN` / `EDAD_MAX` | 16 / 19 | Rango de edad al crear personaje |
| `RANGO_EDAD_NOVATO_MAX` | 21 | Techo de edad para el banco de eventos "novato" |
| `RANGO_EDAD_PROMEDIO_MAX` | 32 | Techo de edad para el banco "promedio" (arriba, "veterano") |
| `NIVEL_EQUIPO_MIN` / `MAX` | 1 / 3 | Escala oculta de nivel de club |
| `NIVEL_LIGA_MIN` / `MAX` | 1 / 6 | Escala oculta de nivel de liga |
| `OVR_INICIAL_MIN` / `MAX` | 50 / 65 | Rango de OVR con el que puede arrancar un novato |
| `OVR_PESO_EQUIPO` / `OVR_PESO_LIGA` | 0.55 / 0.45 | Peso de club vs. liga en toda "calidad combinada" |
| `OVR_SUERTE_VARIACION` | ±4 | Variación aleatoria del OVR inicial |
| `VALOR_MERCADO_BASE` | 18000 | Valor de mercado en el piso absoluto de OVR |
| `VALOR_MERCADO_CRECIMIENTO` | 1.185 | Multiplicador de valor por cada punto extra de OVR |
| `VALOR_MULTIPLICADOR_CLUB_MIN` / `MAX` | 0.5 / 1.4 | Rango del multiplicador de valor según prestigio del club/liga |
| `OFERTA_VARIACION_VALOR` | ±8% | Variación cosmética del valor mostrado en cada oferta |
| `OFERTA_UMBRAL_CAIDA_VALOR` | 0.4 | Mínimo % de tu valor actual que debe ofrecerte un club para tener sentido |
| `OFERTA_TOP_ENCAJE_FRACCION` | 0.4 | % superior (por cercanía a tu nivel objetivo) del que se sortean las ofertas |
| `OFERTA_TOLERANCIA_OVR` | 13 | Ancho de la "ventana de OVR" de cada club (±) |
| `PESO_DISTANCIA_LIGA` | 0.6 | Cuánto pesa desviarse en liga vs. en equipo al elegir ofertas |
| `PESO_EXPONENTE` | 2.2 | Qué tan fuerte castiga la distancia al nivel objetivo |
| `EDAD_RETIRO_OFERTA` | 36 | Desde cuándo podés elegir retiro voluntario |
| `EDAD_RETIRO_FORZOSO_MIN` / `MAX` | 41 / 45 | Rango del que se sortea la edad de retiro forzoso (una vez por carrera) |
| `EDAD_RETIRO_TRANSICION` | 2 | Temporadas antes del retiro forzoso en las que el cupo de ofertas ya se reduce a 1 |
| `TALENTO_MIN` / `MAX` | 0.85 / 1.2 | Rango del multiplicador de talento oculto (sorteado una vez por carrera) sobre el ritmo de crecimiento de OVR |
| `TEMPORADAS_GRACIA_CONTRATO` | 2 | Temporadas de gracia antes de que tu club pueda "no renovarte" |
| `EDAD_POTENCIAL_BONUS_MAX` | 8 | Bono máx. de "potencial" para un jugador de 17 años |
| `EDAD_POTENCIAL_BONUS_HASTA` | 24 | Edad desde la que el bono de juventud llega a 0 |
| `EDAD_POTENCIAL_PENALIZACION_DESDE` | 30 | Edad desde la que empieza la penalización de potencial |
| `EDAD_POTENCIAL_PENALIZACION_TASA` | 0.7 | Penalización de potencial por año, desde esa edad |
| `EDAD_OCASO_RETORNO_PAIS` | 33 | Edad desde la que la garantía de "entorno" prioriza tu país en vez de tu liga |
| `TOTAL_TRAMOS_TEMPORADA` | 3 | Bloques de partidos simulados por temporada |
| `GRUPOS_POSICION` / `PROPENSION_GOL` / `PROPENSION_ASISTENCIA` | ver [sección 10](#10-estadísticas-del-tramo-goles-asistencias-mvp-rating) | Probabilidad base de gol/asistencia por posición |
| `PROBABILIDAD_MVP_BASE` | 0.09 | Probabilidad base de MVP por partido |
| `BONUS_MVP_POR_GOL` / `_ASISTENCIA` | 0.14 / 0.08 | Bono de probabilidad de MVP en el partido donde participaste en un gol |
| `BONUS_RATING_POR_GOL` / `_ASISTENCIA` | 0.7 / 0.4 | Bono de rating en ese mismo partido |
| `OVR_TRAMO_BASE` | 0.7 | Crecimiento natural de OVR por tramo |
| `OVR_TRAMO_RENDIMIENTO_DIVISOR` | 6 | Cuánto divide el rendimiento acumulado antes de sumarse al crecimiento |
| `OVR_TRAMO_VARIACION_MIN` / `MAX` | −1 / +3 | Variación normal de OVR por tramo (sin declive por edad) |
| `OVR_TRAMO_DECLIVE_VARIACION_MIN` | −10 | Piso de variación por tramo una vez que el declive por edad ya actúa |
| `OVR_CARRERA_MIN` / `MAX` | 45 / 99 | Piso y techo absolutos de OVR durante la carrera |
| `OVR_EDAD_PRIME_MAX` | 26 | Hasta qué edad el crecimiento es pleno |
| `OVR_EDAD_DECLIVE_MAX` | 31 | Edad en la que el freno de crecimiento llega a su mínimo |
| `OVR_EDAD_FACTOR_MIN` | 0.35 | Ritmo de crecimiento mínimo (nunca llega a cero) |
| `OVR_EDAD_DECLIVE_INICIO` | 32 | Edad desde la que empieza el declive natural |
| `OVR_EDAD_ACELERA_DECLIVE` | 39 | Edad desde la que el declive se acelera fuerte |
| `OVR_EDAD_DECLIVE_TASA_BASE` / `_ACELERADA` | 0.08 / 0.35 | OVR perdido por tramo, por año, antes/después de acelerar |
| `FORMA_CALIDAD` | ver [sección 12](#12-estado-de-forma) | Calidad aportada por cada estado de forma a la fuerza de campaña |
| `FUERZA_PESO_NIVEL` / `_FORMA` / `_EQUIPO_ACUMULADO` | 0.5 / 0.2 / 0.3 | Pesos de la fórmula de fuerza de campaña |
| `UMBRAL_CLASIFICA_PRIMER_NIVEL` / `_SEGUNDO_NIVEL` | 0.72 / 0.45 | Umbrales de fuerza para clasificar a competición internacional |
| `FORMA_BONUS_PARTICIPACION` | ver [sección 9](#9-participación-cuántos-partidos-jugás-vos) | Bono/malus de participación por estado de forma |
| `PARTICIPACION_BASE` | 0.65 | Probabilidad base de jugar un partido |
| `PARTICIPACION_BONUS_TITULAR` | 0.2 | Bono si sos titular ese tramo |
| `PARTICIPACION_OVR_REFERENCIA` | 55 | OVR de referencia (neutral) para la probabilidad de jugar |
| `PARTICIPACION_MIN` | 0.15 | Piso de probabilidad de jugar |
| `PETICION_NUMERO_BASE` / `_OVR_PESO` / `_EQUIPO_PESO` | 0.3 / 0.008 / 0.05 | Fórmula de aceptación de cambio de dorsal |
| `PROB_LESION_BASE` | 0.065 | Probabilidad base de lesión por pausa |
| `PROB_LESION_EDAD_INICIO` / `_INCREMENTO` | 30 / 0.0027 | Desde cuándo y cuánto sube el riesgo de lesión con la edad |
| `PROB_LESION_MAX` | 0.18 | Techo de probabilidad de lesión |
| `PESO_LESION_NIVEL1/2/3` | 0.10 / 0.35 / 0.55 | Probabilidad de que, si hay lesión, sea de cada nivel |
| `LESION_NIVEL3_DURACION` | 1 | Duración fija de una lesión leve (en tramos) |
| `LESION_NIVEL2_DURACION_MIN/MAX` | 1 / 2 | Rango de duración de una lesión moderada |
| `LESION_NIVEL1_DURACION_MIN` | 2 | Mínimo de duración de una lesión grave (el máximo es el resto de la temporada) |
| `LESION_NIVEL2_OVR_MIN/MAX` | 1 / 3 | Rango de OVR perdido por una lesión moderada |
| `LESION_NIVEL1_OVR_MIN/MAX` | 4 / 10 | Rango de OVR perdido por una lesión grave |
| `LESION_RECUPERACION_OVR` | 0.5 | % del OVR perdido por lesión que se recupera al darte de alta |

---

## 24. Limitaciones conocidas y notas para el futuro

- **Sin guardado de partida**: es una decisión de diseño actual (juego de sesión única), no una limitación técnica — se podría agregar con `localStorage` guardando `temporadaActual`/`temporadasFinalizadas` serializados.
- **`dev/test.js` / `dev/test.html`** son una herramienta interna para inspeccionar la base de datos y la distribución de OVR inicial durante el desarrollo — no están enlazados desde ninguna pantalla del juego y pueden ignorarse (o borrarse) de cara a producción.
- **`pierna` hábil** se guarda pero no se usa en ninguna fórmula todavía — es puramente cosmético en la ficha/camiseta.
- Los números de partidos por competición ([sección 20](#20-base-de-datos-de-ligas-y-equipos-jsdatabasejs)) son una referencia realista, no oficiales fijos, para ligas/copas cuyo formato cambió seguido en la realidad (Argentina, México, Colombia) — están documentados caso por caso en los comentarios de `database.js`.
- Solo 5 de los 46 países de la creación de personaje tienen liga propia cargada; el resto arranca "de extranjero" en las 5 grandes ligas europeas — es coherente con el diseño actual (documentado en [sección 5](#5-elección-de-club-inicial-equipohtml--jsequipojs)), no un bug, pero es la superficie más obvia para sumar más ligas locales a futuro.
