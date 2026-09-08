# Leyenda ⚽

Simulador de carrera de un futbolista, de principiante a leyenda (o al fracaso). Juego web, sin backend ni base de datos externa: todo el motor corre en el navegador, en JavaScript vanilla.

**Versión:** 0.8.0-Beta — publicada el 8 de septiembre de 2026 · 09:41.

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
19. [Selección nacional](#19-selección-nacional)
20. [Banco de eventos de temporada](#20-banco-de-eventos-de-temporada-jseventsjs)
21. [Base de datos de ligas y equipos](#21-base-de-datos-de-ligas-y-equipos-jsdatabasejs)
22. [Interfaz: componentes, animaciones y responsive](#22-interfaz-componentes-animaciones-y-responsive)
23. [Persistencia y estado](#23-persistencia-y-estado)
24. [Tabla completa de constantes de balance](#24-tabla-completa-de-constantes-de-balance)
25. [Limitaciones conocidas y notas para el futuro](#25-limitaciones-conocidas-y-notas-para-el-futuro)

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
        │  │  calendario de 4 pausas → tramos → cierre     │
        │  └─────────────────────────────────────────────┘
        ▼
Retiro (forzoso por edad, o elegido) → resumen de carrera → volver a index.html
```

No hay guardado de partida: **todo el estado de la carrera vive en memoria mientras la pestaña está abierta**. Recargar la página reinicia la carrera desde la Temporada 1 (con el mismo club/OVR inicial, porque eso sí quedó en `localStorage`). Ver [sección 23](#23-persistencia-y-estado).

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

- **Si el país elegido tiene una liga propia** en la base de datos (**23 de los 46** países de la creación de personaje, desde Alemania/Argentina/España hasta Bolivia/Costa Rica/Paraguay — todas las que tienen `pais` cargado en `GameDatabase.ligas`, ver [sección 21](#21-base-de-datos-de-ligas-y-equipos-jsdatabasejs)), las 4 ofertas salen de esa liga, en esta banda fija (`OFERTAS_INICIALES`, [config.js:120-125](js/config.js:120)):
  - 2 clubes **humildes** (mitad de abajo por poder, dentro de esa liga)
  - 1 club **consolidado** (entre el 50% y el 85% por poder)
  - 1 club **al azar**, de cualquier categoría (la única chance de arrancar en un club grande)
- **Si el país NO tiene liga propia** (los otros 23 — mayormente africanos, asiáticos y del resto de Europa que todavía no tienen liga doméstica cargada), arranca "de extranjero" en una de las **5 grandes ligas europeas** elegida al azar (Premier League, La Liga, Serie A, Bundesliga, Ligue 1 — `LIGAS_GRANDES_EUROPEAS`, [config.js:116](js/config.js:116)), con una banda más floja y sin favores (`OFERTAS_INICIALES_EXTRANJERO`, [config.js:127-132](js/config.js:127)): 3 clubes humildes + 1 consolidado, nunca uno grande.

"Humilde" / "consolidado" / "grande" son percentiles por poder **dentro de la liga elegida** (`categoriaEquipoEnLiga`, [config.js:174-183](js/config.js:174) — ver [sección 16.6](#16-sistema-de-fichajes-y-ofertas) para qué es el poder de un club), no una categoría fija guardada en cada club: humilde es la mitad de abajo, consolidado el 50-85%, grande el 15% de arriba (`CATEGORIA_EQUIPO_PERCENTIL`, [config.js:118](js/config.js:118)).

El **OVR inicial** con el que arrancarías en cada club se calcula recién al elegirlo, con `calcularOvrInicial(equipo, liga)` ([config.js:155-167](js/config.js:155)):

1. Se combina el poder del equipo y el de la liga con pesos fijos: **55% equipo + 45% liga** (`OVR_PESO_EQUIPO`/`OVR_PESO_LIGA`, `calidadPoderCombinada`, [config.js:96-100](js/config.js:96)), normalizado a una escala 0..1.
2. Ese 0..1 se mapea al rango **50–65** (`OVR_INICIAL_MIN`/`MAX`) — un novato, por definición, nunca arranca más alto que eso, sin importar cuán grande sea el club.
3. Se le suma una "suerte" aleatoria de hasta ±4 puntos (`OVR_SUERTE_VARIACION`) y se redondea, recortado siempre entre 50 y 65.

El jugador nunca ve estos números crudos: en la tarjeta de oferta solo se muestra el nombre del club/liga, su escudo y su bandera — sin ninguna etiqueta de "qué tan grande es", a diferencia de versiones anteriores.

Al elegir un club se guarda `equipoId` y `ovrInicial` en el mismo objeto de `localStorage`, y se pasa a `carrera.html`.

---

## 6. El motor de carrera — visión general (`js/carrera.js`)

Es el archivo más grande (2100+ líneas): mezcla el **estado del juego**, la **simulación** y **todo el render de la UI** de `carrera.html` (no hay separación de capas — es un único script).

### Estado central

```js
let temporadaActual;          // la temporada en curso (objeto mutable)
let temporadasFinalizadas = []; // historial completo, una fila por temporada
let temporadasEnClubActual = 0; // temporadas completas en el club actual (para el período de gracia de contrato)
let carreraFinalizada = false;
const edadRetiroForzoso = GameConfig.randomInt(41, 45); // sorteada UNA VEZ por carrera, al cargar la página
```

`temporadaActual` (creada por `crearTemporada()`, [carrera.js:138](js/carrera.js:138)) contiene, entre otras cosas: `numero`, `anio`, `equipoId`, `ovr`, `partidos/goles/asistencias/mvp/sumaRating/promedio`, `valorMercado`, `trofeos[]`, `forma`, `titular`, `progreso` (0–100%), `calendario[]`, `checkpointIndex`, `tramoIndex`, `lesionActiva`, `bufferRendimiento`/`bufferEquipo` (efecto acumulado de las decisiones del tramo en curso, sin aplicar todavía), `competiciones` (liga + copa nacional + copa internacional de esa temporada) y todo lo de la selección nacional de esa temporada — `seleccion`, `tipoAnoSeleccion`, `convocatoriaPausa`, `seleccionPartidos`/`seleccionGoles` (ver [sección 19](#19-selección-nacional)).

Si se abre `carrera.html` sin haber pasado por la creación de personaje (sin `equipoId`/`ovrInicial` válidos en `localStorage`), arranca una **carrera demo** ya avanzada, con el mismo motor real (totalmente jugable) — [carrera.js:758-785](js/carrera.js:758).

**La edad sube 1 año por cada temporada, nunca dentro de una misma temporada** — `getEdadActual()` ([carrera.js:869-871](js/carrera.js:869)):

```
edadActual = edad de creación + (número de temporada actual − 1)
```

Todas las fórmulas que dependen de la edad (crecimiento/declive de OVR, riesgo de lesión, ventanas de fichaje, retiro) usan este valor.

---

## 7. Calendario de temporada

Cada temporada tiene **3 "tramos"** (`TOTAL_TRAMOS_TEMPORADA`, [config.js:590](js/config.js:590)) — bloques de partidos que se simulan de una vez — separados por pausas donde el jugador interactúa: 3 de decisiones y, a partir de la Temporada 2, **1 sola ventana de fichajes**.

`crearCalendarioTemporada(numeroTemporada)` ([config.js:594-604](js/config.js:594)) arma:

| Pausa | Momento (`progreso` %) | Nota |
|---|---|---|
| Oferta (pretemporada) | 0% | **Solo a partir de la Temporada 2** — en la 1 ya elegiste equipo en la creación, y en el resto **es la única ventana de fichajes del año** (ver nota abajo). |
| Decisión | aleatorio entre 5% y 45% | "antes de la mitad" |
| Decisión | aleatorio entre 0% y 100% | "en cualquier punto" |
| Decisión | aleatorio entre 92% y 99% | "último momento" |

Las 4 (o 3, en la Temporada 1) se ordenan por este `progreso` para que el calendario quede cronológico **al narrar la temporada** — pero ese número es solo para ordenar pausas, no es lo que se muestra en pantalla (ver más abajo). Cada pausa de decisión resuelta dispara la simulación del tramo siguiente (`simularTramoYAvanzar`) y avanza al próximo checkpoint (`avanzarCheckpoint`); al agotarse el calendario, se cierra la temporada (`finalizarTemporada`).

**El progreso que ves en pantalla (anillo/barra) es otro número**: `temporadaActual.progreso` se recalcula en cada tramo como `partidosJugados / partidosMinimos` de la liga (`simularTramoYAvanzar`, [carrera.js](js/carrera.js)), no a partir de la tabla de arriba — antes reusaba esos valores aleatorios de la tabla, así que la barra podía verse casi llena con 15 partidos jugados y saltar a más de 50% recién en el último tramo. Ahora sigue de cerca el avance real de partidos de liga (no puede ser 100% exacto porque la cantidad de partidos por tramo no es fija, pero da la ilusión correcta de avance).

**Por qué una sola ventana, y siempre en pretemporada**: antes había una segunda pausa de fichajes a mitad de año, lo que permitía que un traspaso partiera una temporada en dos (dos clubes distintos, dos filas de historial, el mismo año). Se sacó a propósito — ahora un fichaje sale siempre con la temporada en cero (0 partidos jugados con el club nuevo) y la corres entera de punta a punta con ese club, tal como pasaría en la realidad con una ventana de pases real. `resolveOferta` ([carrera.js:1299-1343](js/carrera.js:1299)) ya no tiene ninguna rama de "traspaso a mitad de camino": cambiar de club siempre resetea `competiciones` (liga + copa nacional; la clasificación internacional NO se hereda, es del club, no del jugador) desde cero.

**Alto Impacto**: al crear la temporada se sortea si va a haber un evento de alto impacto (30% de probabilidad) y, si sale, en cuál de los 3 tramos va a aparecer (`altoImpactoPausa`, [carrera.js:145](js/carrera.js:145)). Ver [sección 20](#20-banco-de-eventos-de-temporada-jseventsjs).

---

## 8. El ciclo de un tramo, paso a paso

Todo pasa en `simularTramoYAvanzar()` ([carrera.js:567-659](js/carrera.js:567)), disparado al resolver la última decisión pendiente de una pausa:

1. **Partidos del club esta franja**, sumando las 3 competiciones activas:
   - Liga: `partidosLigaParaTramo` reparte el total de la temporada entre los 3 tramos a partes iguales, y el último tramo absorbe el resto del redondeo.
   - Copa nacional / internacional: `resolverKnockout` — en su tramo de "partidos mínimos" juega la ronda garantizada; después, un tramo por cada ronda extra disponible, con una tirada de `probAvanzarRonda(fuerza)` para seguir viva (si pierde, queda eliminado para el resto de la temporada).
2. **Titularidad de este tramo**: `calcularTitular(pesoTitular, ovr, rendimientoAcumulado)` — una tirada (ver fórmula en [sección 9](#9-participación-cuántos-partidos-jugás-vos)) decidida **antes** de calcular cuánto jugás, para que ser titular realmente sume participación (no es solo un badge decorativo). Al cierre del tramo, el resultado también ajusta `pesoTitular` de cara al próximo (paso 7 más abajo).
3. **Cuántos de esos partidos jugás vos** (no todos, ver sección 9) — si estás lesionado, **cero**, sin excepción.
4. **Resultado del tramo** (`GameConfig.simularTramo`, ver [sección 10](#10-estadísticas-del-tramo-goles-asistencias-mvp-rating)): goles, asistencias, MVPs y la suma de ratings de esos partidos.
5. Se acumulan a las estadísticas de la temporada, se recalcula el promedio (`sumaRating / partidos`).
6. **Se ajusta el OVR** (`ajustarOvrTramo`, [sección 11](#11-progresión-de-ovr)) y se recalcula el **valor de mercado** con el nuevo OVR.
7. **Se ajusta `pesoTitular`** con el rating de este tramo (`ajustarPesoTitular`, ver [sección 9](#9-participación-cuántos-partidos-jugás-vos)) — de cara al próximo tramo, no a este que ya se jugó.
8. Se descuenta un tramo a la lesión activa, si había una; al llegar a 0, se da de alta.
9. Se avanza `tramoIndex` y se recalcula el `progreso` mostrado en pantalla a partir de `partidosJugados / partidosMinimos` de la liga (ver [sección 7](#7-calendario-de-temporada)).
10. Se anima el spotlight (anillo de progreso + contadores) y, 1050ms después (`ANIMACION_TRAMO_MS` + margen), se pasa a la próxima pausa (o se cierra la temporada si no queda ninguna).

Al **cerrar la temporada** (`finalizarTemporada`, [carrera.js:661-737](js/carrera.js:661)):

- Se tira si ganás la **liga** y, si tu copa nacional llegó a la final, si la ganás también (fórmulas en [sección 14](#14-sistema-de-competiciones-liga-copas-clasificación-internacional)).
- Se decide la **clasificación internacional de la próxima temporada** según qué tan bien te fue.
- Se archiva la temporada en `temporadasFinalizadas`, se crea la siguiente (heredando OVR y club), y se habilita el pedido de cambio de dorsal.

---

## 9. Participación: cuántos partidos jugás vos

Los partidos de arriba son los del **equipo**; cuántos de esos jugás vos depende de tu nivel, tu momento y si sos titular ese tramo.

**Titularidad** — ya no es un sorteo nuevo e independiente cada tramo: hay un valor persistente `pesoTitular` (0-1, "cuánto te ganaste el puesto DE VERDAD") que se arrastra tramo a tramo e incluso de una temporada a la siguiente mientras sigas en el mismo club. Una gran temporada ya no se "olvida" al arrancar la próxima, y un jugador titular indiscutido no vuelve a ser una moneda al aire de un día para el otro.

Arranca en `PESO_TITULAR_INICIAL = 0.4` (novato o recién fichado — hay que ganarse el puesto) y se resetea a ese mismo valor en cada transferencia ([`resolveOferta`](js/carrera.js)); si te quedás en el club, se hereda de una temporada a la siguiente sin tocar.

Después de cada tramo, `ajustarPesoTitular(pesoActual, ratingTramo, estabaLesionado)` ([config.js:844-858](js/config.js:844)) lo mueve según cómo te fue:

```
si estabas lesionado:        delta = PESO_TITULAR_CASTIGO_LESION       (−0.03)
si no jugaste ningún partido: delta = PESO_TITULAR_CASTIGO_SIN_MINUTOS  (−0.05)
si no:                        delta = clamp((ratingTramo − 6.5) × 0.05, −0.08, 0.12)
pesoTitular = clamp(pesoActual + delta, 0.05, 0.95)
```

Y `calcularTitular(pesoTitular, ovr, rendimientoAcumulado)` ([config.js:865-869](js/config.js:865)) decide el tramo actual:

```
prob = clamp(pesoTitular + (ovr − 55) × 0.01 + rendimientoAcumulado × 0.03, 0.08, 0.95)
```

El OVR todavía empuja un poco (un jugador claramente mejor que el resto del plantel tiene ventaja incluso saliendo de una mala racha) y las decisiones del tramo aportan su granito, pero `pesoTitular` es el factor dominante — ya no decide todo un sorteo desde cero.

**La etiqueta que ves antes de jugar el primer tramo de una temporada nueva** (`crearTemporada`, [carrera.js:171](js/carrera.js:171)) ya no arranca fija en "Suplente" — se proyecta directo desde el `pesoTitular` heredado (`pesoTitular ≥ 0.5` → Titular). Antes quedaba en `false` a secas hasta que se simulaba el primer tramo, así que toda temporada nueva mostraba "Suplente" un instante, sin importar cuánto te hubieras ganado el puesto la temporada anterior — se leía como "una gran temporada no sirvió de nada".

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

`GameConfig.simularTramo({ partidos, grupo, ovr, rendimientoAcumulado })` ([config.js:760-782](js/config.js:760)) recorre partido por partido (de los que jugás vos, no los del equipo).

**Grupo de posición** (`GRUPOS_POSICION`, [config.js:695-700](js/config.js:695)): cada una de las 12 posiciones cae en uno de **5 grupos** — antes "defensa" era uno solo (central y lateral idénticos); separarlos deja que el lateral aporte sobre todo asistencias (centros) y el central sume algún gol de cabeza mucho menos seguido:

| Grupo | Prob. de gol por partido (base) | Prob. de asistencia por partido (base) |
|---|---|---|
| Arquero | 0.3% | 0.3% |
| Central (DFC) | 3% | 2% |
| Lateral (LI/LD) | 2% | 9% |
| Medio (MCD/MC/MI/MD/MCO) | 7% | 12% |
| Ataque (EI/ED/DC) | 20% | 9% |

Estas son las propensiones en el punto **neutral** de la curva de OVR de abajo (factor ×1) — no en el piso de carrera. Una primera versión de la curva tenía ese punto neutral en ~OVR 65 (un jugador mediocre rendía casi como uno "decente"), lo que dejaba estadísticas infladas — un delantero de 65 OVR llegaba a ~26 goles en 38 partidos. Recalibrado, el neutral quedó en ~OVR 75-78 (profesional sólido de verdad) y esos mismos 65 OVR rinden bastante por debajo de la media.

**Factor de forma general del tramo**:

```
factorOvr(ovr) = ESTADISTICAS_OVR_BASE + progreso^ESTADISTICAS_OVR_EXPONENTE × ESTADISTICAS_OVR_RANGO
                 (progreso = (ovr − 45) / 54, recortado a 0-1; BASE=0.15, EXPONENTE=2.2, RANGO=2.85)
factorForma    = 1 + clamp(rendimientoAcumulado, −12, 12) × 0.05
factor         = max(0.3, factorOvr × factorForma)
```

Curva (exponente > 1), no una recta: en el OVR mínimo (45) el factor es 0.15, en el máximo (99) es 3.0 — un delantero de 65 OVR (mediocre) promedia ~5 goles en 38 partidos, uno de 75 (profesional sólido) ~10, uno de 90 (estrella) ~23, y solo en el techo absoluto (99) aparecen las temporadas de 30+ goles.

**Goles por partido, sin techo real** — `golesEnPartido(probGol)` ([config.js:750-758](js/config.js:750)), con `probGol = clamp(propensiónGol × factor, 0, 0.9)`:

```
si no sale (prob. 1 − probGol):           0 goles
si sale:                                   1 gol
  con prob. probGol × 0.4 (PROB_SEGUNDO_GOL_FACTOR):   2 goles (doblete)
    con prob. probGol × 0.18 (PROB_TERCER_GOL_FACTOR):  3 goles (hat-trick)
```

Antes era un booleano puro (como mucho 1 gol por partido), así que la temporada entera jamás podía superar la cantidad de partidos jugados, por más crack que fueras — ahora un delantero de nivel alto puede perfectamente terminar una temporada con más goles que partidos. Las asistencias siguen siendo una tirada única por partido (`hizoAsistencia`, con `probAsistencia = clamp(propensiónAsistencia × factor, 0, 0.9)`).

**MVP y rating del partido** están conectados a cuántos goles/si hubo asistencia ESE partido puntual (no son sorteos independientes) — con un doblete o hat-trick, el bono escala con la cantidad de goles, no es todo-o-nada:

```
prob. de MVP  = 0.09 × factor + golesPartido × 0.14 + 0.08 (si hizo asistencia)
rating        = clamp(6.5 + (factor − 1) × 2.5 + golesPartido × 0.7 + 0.4 (si asistencia) + ruido(±0.4), 5, 10)
```

El resultado del tramo (goles, asistencias, MVPs, suma de ratings) se acumula a las estadísticas de la temporada.

---

## 11. Progresión de OVR

`ajustarOvrTramo(ovrActual, rendimientoAcumulado, edad, factorTalento, potencialTecho)` ([config.js:913-936](js/config.js:913)) — se llama una vez por tramo, después de simular las estadísticas de ese tramo:

```
deltaBase = (0.7 + rendimientoAcumulado / 6) × factorCrecimientoPorEdad(edad) × factorTalento
declive   = factorDeclivePorEdad(edad) × (2 − factorTalento)
deltaCrudo = deltaBase − declive
si deltaCrudo > 0 y ovrActual + deltaCrudo > potencialTecho:
  deltaCrudo -= exceso × (1 − POTENCIAL_TECHO_FACTOR_MIN)   (recorta lo que se pasaría del techo, deja pasar un resto)
delta = redondeoEstocastico(deltaCrudo), recortado entre:
        · [-1, +3]  en circunstancias normales (sin declive por edad)
        · [-10, +3] si ya hay declive por edad actuando
ovrNuevo = clamp(ovrActual + delta, 45, 99)     (OVR_CARRERA_MIN / MAX — piso y techo absolutos)
```

**Redondeo estocástico** ([config.js:790-796](js/config.js:790)): en vez de redondear siempre igual, un valor de 0.4 da +1 el 40% de las veces y 0 el 60% restante — así los cambios chicos de vez en cuando pasan, en vez de quedar completamente anulados por el redondeo.

### 11.1 Curva de edad en 3 etapas

Antes el freno de crecimiento se estabilizaba en 35% del ritmo pleno **para siempre** desde los 32 años, y el desgaste natural era demasiado débil para competirle — un jugador con buen rendimiento seguía subiendo bastante incluso pasados los 35-40. Ahora:

**Freno de crecimiento por edad** — `factorCrecimientoPorEdad(edad)` ([config.js:818-825](js/config.js:818)):

| Etapa | Edad | Factor |
|---|---|---|
| Prime | ≤ 28 años | 1.0 (crecimiento pleno) |
| Meseta | 29 a 34 | interpola linealmente de 1.0 a 0.15 |
| Ocaso | 35+ | fijo en 0.15 (un resto mínimo — nunca llega a cero del todo) |

**Desgaste natural por edad** — `factorDeclivePorEdad(edad)` ([config.js:840-847](js/config.js:840)), superpuesto a la meseta de arriba en vez de arrancar recién cuando termina:

- Antes de los 30 años: 0 (sin desgaste).
- De 30 a 37: resta **0.06 de OVR por tramo, por cada año** por encima de 30.
- De 37 en adelante: además, resta **0.22 por tramo, por cada año** por encima de 37 (la caída se acelera).

Con estos números, el neto (crecimiento − desgaste) pasa de "todavía sumás algo" a "cuesta mantenerte" de forma gradual dentro de la ventana 29-34, en vez de un quiebre brusco a los 32 — el pico típico de una carrera queda entre los 30-33 años, y para el retiro obligatorio (41-45) ya bajó de forma notable. En cuanto el desgaste es mayor a 0, el piso de variación por tramo pasa de −1 a **−10** (`OVR_TRAMO_DECLIVE_VARIACION_MIN`).

### 11.2 Talento oculto y techo de potencial

**Talento oculto**: al arrancar la carrera se sortea, una única vez, un multiplicador entre **0.85x y 1.2x** (`TALENTO_MIN`/`MAX`, [config.js:870-871](js/config.js:870); sorteado en [carrera.js:958-960](js/carrera.js:958)) que acelera el crecimiento (`deltaBase`) y, invertido, atenúa el desgaste (`× (2 − factorTalento)`: 1.2 lo deja en 80%, 0.85 lo agrava a 115%) — con las mismas decisiones de punta a punta, dos carreras no crecen (ni declinan) exactamente igual.

**Techo de potencial** (`potencialTecho`, sorteado una única vez en [carrera.js:962-970](js/carrera.js:962), nunca expuesto en ningún número visible): sin esto, el crecimiento del prime empujaba casi cualquier carrera por encima de 90 — no era una excepción, era casi aritmética garantizada. `sortearPotencialTecho()` ([config.js:902-911](js/config.js:902)) reparte:

| Probabilidad | Techo sorteado | Lectura |
|---|---|---|
| 5% | 72-83 | Jugador modesto, nunca despega del todo |
| 55% | 85-90 | Profesional sólido |
| 40% | 91-98 | Estrella de élite |

El crecimiento no se frena "acercándose" al techo (esa fue la primera versión probada — combinada con el freno de edad de la misma ventana 29-34, casi nadie llegaba cerca de un techo alto a tiempo). En cambio, actúa a pleno ritmo hasta el final, y `ajustarOvrTramo` solo recorta lo que un tramo puntual se pasaría de largo del techo, dejando pasar un resto (`POTENCIAL_TECHO_FACTOR_MIN = 0.08`, un 8%) — así una racha buenísima puede "sorprender" y pasarlo por uno o dos puntos en casos raros. Los rangos de la tabla de arriba no son directamente "dónde termina la carrera" (varias con techo alto se quedan cortas por el camino, sea por mala racha o por no alcanzar el límite superior del rango) — se calibraron corriendo ~3000 carreras simuladas contra la fórmula real hasta que el **pico final** de OVR quedara repartido ~10% por debajo de 80, ~60% entre 80-89, ~30% en 90+.

Al fichar por un club nuevo se garantiza un mínimo margen de crecimiento sobre el OVR inicial (`potencialTecho = max(sorteo, ovrInicial + 5)`) — rarísimo que choquen, pero un debutante en un club grande puede arrancar con 65, y sin este piso una tirada floja del techo lo dejaría prácticamente congelado desde el primer tramo.

---

## 12. Estado de forma

7 estados (`FORM_STATES`, [config.js:229-237](js/config.js:229)), de mejor a peor: **Inspirado 🔥 → En plenitud 💪 → Animado 🙂 → Regular 😐 → Desanimado 😕 → Bajo de forma 📉 → Tocado físicamente 🤕**.

Cada opción de cada decisión de evento define un **objetivo** de forma fijo (`efectos.forma`, no es aleatorio — está definido evento por evento en `js/events.js`), pero ya no la teletransporta ahí directamente: `acumularForma(formaActual, formaObjetivo)` ([config.js:312-327](js/config.js:312)) te acerca a ese objetivo recorriendo una fracción del camino (`FORMA_PESO_ACUMULACION = 0.5` del tramo que falta, con un paso mínimo de 1 escalón para no estancarse justo antes de llegar). Así, dos decisiones seguidas que tiran para el mismo lado siguen sumando en vez de que la segunda pise a la primera, y si tiran para lados opuestos se combinan en vez de que gane la última resuelta. La forma afecta:

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

La duración exacta (`duracionLesion`, [config.js:857-868](js/config.js:857)) y la pérdida de OVR (`ovrPerdidoPorLesion`, [config.js:870-874](js/config.js:870)) se sortean dentro de esos rangos, siempre topeados por los tramos que en verdad quedan en la temporada. Cada nivel tiene su propio banco de nombres/descripciones de lesión real (rotura de LCA, esguince, desgarro, etc. — ver [sección 20](#20-banco-de-eventos-de-temporada-jseventsjs)).

Cuando sale una lesión nueva, esa pausa entera se reemplaza por un **parte médico** (sin decisiones que tomar, `crearLesionCard`, [carrera.js:1197-1221](js/carrera.js:1197)): muestra nombre, descripción, OVR perdido (si corresponde) y pausas de baja, y el jugador confirma con un botón **"Continuar"** para avanzar el tramo — no hay temporizador ni avance automático. En mobile esa tarjeta ocupa el ancho completo del carrusel de decisiones en vez de compartir espacio como una tarjeta más.

**Recuperación al darte de alta**: al cumplirse los tramos de baja, se te devuelve el **50%** del OVR que perdiste por esa lesión (`LESION_RECUPERACION_OVR`, [config.js:907](js/config.js:907), aplicado en [carrera.js:636-645](js/carrera.js:636)) — fue un golpe físico puntual, no una pérdida de nivel definitiva. El toast de "te recuperaste" muestra cuánto OVR recuperaste, si fue mayor a 0.

---

## 14. Sistema de competiciones (liga, copas, clasificación internacional)

### 14.0 Antes de esto: la clasificación de clubes y ligas

Cada club y cada liga en `GameDatabase` tiene **3 ejes ocultos de 0 a 100** (reemplazan al viejo `nivel` entero 1-3/1-6):

| Eje | Qué mide | Dónde se usa |
|---|---|---|
| `fuerza` | Nivel deportivo actual del plantel/competencia | Quién gana títulos ([sección 14](#14-sistema-de-competiciones-liga-copas-clasificación-internacional), acá mismo) |
| `prestigio` | Historia, títulos, marca, hinchada | Valor de mercado ([sección 15](#15-valor-de-mercado)) y qué tan aspiracional es un destino ([sección 16](#16-sistema-de-fichajes-y-ofertas)) |
| `economia` | Poder financiero (presupuesto, sueldos, TV) | Valor de mercado y ofertas |

Se combinan de dos formas distintas, a propósito, según qué le corresponde a cada mecánica ([config.js:34-100](js/config.js:34)):

- **`poderEquipo`/`poderLiga`** (`PODER_PESO_FUERZA=0.4` / `PODER_PESO_PRESTIGIO=0.35` / `PODER_PESO_ECONOMIA=0.25`): mezcla los 3 ejes para todo lo que en la vida real depende de una combinación de las tres cosas a la vez — el OVR inicial, la ventana de ofertas, el objetivo de prestigio del jugador.
- **`calidadFuerzaClub`** (sección 14, acá abajo): usa **solo** `fuerza` — ganar títulos depende de qué tan fuerte es el plantel hoy, no de cuánta plata tiene el club ni de su prestigio histórico.
- **`valorScoreEquipo`/`valorScoreLiga`** (sección 15): usan **solo** `economia` + `prestigio` — cuánto valés en el mercado depende de la plata y la marca del club que te tiene, no de si ese club está ganando esta temporada.

La economía de un club nunca cae debajo del 60% de la de su propia liga (`ECONOMIA_PISO_LIGA`, `economiaEfectiva`, [config.js:63-67](js/config.js:63)) — un club chico de una liga rica igual tiene más plata que casi cualquier gigante de una liga menor, por el reparto de TV.

Los ~25 clubes más reconocibles del mundo (Real Madrid, Boca Juniors, PSG, Newcastle, etc.) tienen estos 3 valores puestos a mano; el resto se generó una sola vez a partir de su antiguo nivel 1-3 y la liga a la que pertenece, con una variación estable por club (mismo id → siempre el mismo resultado) para que no todos los equipos de un mismo nivel queden con el número idéntico — ver el comentario de formato en [database.js:9-38](js/database.js:9).

### 14.1 Fuerza de campaña

Todo sale de un único número por temporada, la **"fuerza de campaña"** — `calcularFuerzaCampana(equipo, liga, forma, equipoAcumuladoTemporada, promedioJugador)` ([config.js:1034-1052](js/config.js:1034)):

```
calidadClub              = calidadFuerzaClub(equipo, liga)   (SOLO el eje fuerza, 55% equipo + 45% liga)
calidadForma             = FORMA_CALIDAD[forma]     (1.0 inspirado ... 0.05 lesionado)
calidadEquipoAcum        = clamp(0.5 + equipoAcumuladoTemporada / 8, 0, 1)
calidadRendimientoJugador = promedioJugador ? clamp((promedioJugador − 6.0) / 3.0, 0, 1) : 0.5

fuerza = 0.4 × calidadClub + 0.15 × calidadForma + 0.2 × calidadEquipoAcum + 0.25 × calidadRendimientoJugador
```

`equipoAcumuladoTemporada` es la suma de todos los efectos `equipo` de las decisiones tomadas en la temporada. `promedioJugador` es `temporadaActual.promedio` (el rating medio por partido, que ya arrastra goles/asistencias/MVP — [sección 10](#10-estadísticas-del-tramo-goles-asistencias-mvp-rating)) — `null` si todavía no jugaste ningún partido esta temporada, para no castigar como si hubieras rendido pésimo antes de debutar.

Antes esta fórmula no incluía el rendimiento estadístico real de la temporada en absoluto — solo el club, la forma y las decisiones de "equipo" tomadas en los eventos. Se podía cerrar una temporada de 59 partidos y 59 goles y que eso no pesara nada en las chances de título. Con el peso nuevo, a igualdad de todo lo demás, una temporada floja (promedio 6.0) da ~12% de ganar la liga contra ~40% de una legendaria (promedio 9.5) con el mismo club — más de 3x de diferencia solo por el rendimiento individual.

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
- `fuerza ≥ 0.72` o ganaste la liga → clasificás a la competición de **primer nivel** de tu confederación (Champions League / Libertadores / Concacaf Champions Cup / AFC Champions League Elite).
- `fuerza ≥ 0.45` o ganaste la copa nacional → clasificás a la de **segundo nivel** (Europa League / Sudamericana / AFC Champions League Two — CONCACAF todavía no tiene equivalente).
- Si no, no clasificás a nada.

Las confederaciones con liga(s) cargada(s) son `UEFA` / `CONMEBOL` / `CONCACAF` / `AFC` (`CAF` todavía no tiene ninguna liga doméstica propia, solo selecciones — ver [sección 19](#19-selección-nacional)). Si tu confederación no tiene competición de un nivel dado (el caso de CONCACAF sin segundo nivel), simplemente no clasificás a nada en ese nivel — no hay error ni sustituto.

Los partidos de cada competición (mínimos garantizados + extra por ronda) salen de `GameDatabase.competiciones` — ver [sección 21](#21-base-de-datos-de-ligas-y-equipos-jsdatabasejs).

### 14.2 Premios mundiales: Bota de Oro, Once Ideal y Balón de Oro

Este juego no simula miles de jugadores rivales por el mundo — solo existe tu propio personaje. Para que "sos el mejor del mundo" signifique algo real, al cierre de cada temporada (`generarCandidatosPremiosMundiales`, [carrera.js](js/carrera.js), llamado desde `finalizarTemporada` después de resolver liga/copa/copa internacional) se genera un pool de **24 candidatos fantasma** de nivel élite, simulados con **la misma fórmula que usa tu propio jugador** (`GameConfig.simularTramo`) — así la comparación es justa: si tus números se sienten inflados o flojos, los del pool se sienten exactamente igual.

**Generación de cada candidato** (`PREMIOS_CANDIDATOS_N = 24`, [config.js](js/config.js)):
- **Liga**: sorteada con `elegirPonderado` ponderado por `liga.fuerza` (más candidatos en las ligas top, como en la vida real) entre las que tienen competición doméstica cargada.
- **Club**: dentro de esa liga, ponderado por `equipo.fuerza` — sirve además para narrar el mensaje ("un delantero de Bayern Múnich...").
- **Grupo de posición**: `sortearGrupoCandidatoPremio()` — 55% ataque / 25% medio / 12% lateral / 8% central (`PREMIOS_PESO_GRUPO`); nunca arquero, nadie gana la Bota de Oro de arquero.
- **OVR**: `sortearOvrCandidatoPremio()` — entre 82 y 99 (`PREMIOS_OVR_MIN/MAX`), promediando 3 tiradas uniformes para sesgar hacia el centro del rango (85-95) en vez de una muestra pareja — son candidatos genuinos al premio, no cualquier nivel élite.
- **Estadísticas**: una sola llamada a `simularTramo({ partidos: partidosMinimos de su liga, grupo, ovr, rendimientoAcumulado: 0 })` (rendimiento neutro — no tiene decisiones propias que tomar).
- **Trofeos**: `Math.random() < probGanarLiga(calidadFuerzaClub(equipo, liga))` — reutiliza la misma curva que decide si TU club gana la liga, en vez de inventar una probabilidad aparte.

**🥾 Bota de Oro**: tu `goles` de la temporada contra el máximo del pool, sin filtrar por posición (un jugador de otro grupo con pocos goles nunca compite en la práctica, sin necesidad de un caso especial). Si no ganás pero quedás entre los 3 mejores, un mensaje aparte ("Terminaste 2° en la Bota de Oro, detrás de un delantero de PSG con 34 goles").

**⭐ Once Ideal**: tu `promedio` de rating contra los candidatos de **tu mismo grupo de posición** — no simula quién ocupa los otros 10 puestos, igual que el juego no simula las otras 31 selecciones en un Mundial. Con un margen de tolerancia (`ONCE_IDEAL_MARGEN_PROMEDIO = 0.4`): desde OVR ~95 el rating de cada partido queda clampeado al tope (10.0) sin variación posible (ver [sección 10](#10-estadísticas-del-tramo-goles-asistencias-mvp-rating)), así que comparar el promedio exacto dejaba el premio reservado casi solo a quien pisa ese umbral literal — con el margen, un promedio de élite real un poco por debajo (9.5-9.9) también tiene una chance genuina, no solo cero o cien por ciento.

**🏆 Balón de Oro**: un puntaje combinado contra TODO el pool, sin importar posición — `calcularCalidadBalonDeOro(promedio, goles + asistencias, ganoTrofeo)` ([config.js](js/config.js)):
```
calidadRating    = clamp((promedio − 7.0) / 2.5, 0, 1)
calidadGoleador  = clamp((goles + asistencias) / 40, 0, 1)     (BALON_ORO_REFERENCIA_GOLES)
calidadTrofeos   = ganaste algo esta temporada ? 1 : 0
calidad = 0.4 × calidadRating + 0.35 × calidadGoleador + 0.25 × calidadTrofeos
```
Ninguna pata sola alcanza — hace falta rendimiento de élite **y** producción goleadora **y** haber ganado algo, las tres a la vez. Es el más difícil de los tres.

Los tres empates (`>=` en vez de `>` en las tres comparaciones) los gana el jugador — dado el clampeo de rating de arriba, un empate exacto contra el pool es común en el tramo alto, y no tendría sentido que ese empate SIEMPRE lo pierda el jugador. Los trofeos ganados se guardan en el mismo array `temporadaActual.trofeos` que los de liga/copa/selección — reutilizan toda la UI existente sin cambios (badge, historial, resumen, tarjeta para compartir). **Pendiente**: el Once Ideal todavía usa el ícono genérico 🏆 de respaldo (`imagen: null`) en vez de uno propio — ver [assets/escudos/trofeos/](assets/escudos/trofeos/) para `bota-de-oro.png` y `balon-de-oro.png`, que sí tienen ícono real.

---

## 15. Valor de mercado

`calcularValorMercado(ovr, equipo, liga)` ([config.js:255-260](js/config.js:255)) — curva exponencial sobre el OVR (cada punto extra cerca del techo vale desproporcionadamente más, como en la vida real), multiplicada por la economía y el prestigio del club/liga actual (a propósito, **no** por su fuerza — ver [sección 14.0](#14-sistema-de-competiciones-liga-copas-clasificación-internacional)):

```
valorPorOvr = 18000 × 1.185^(ovr − 45)          (VALOR_MERCADO_BASE, VALOR_MERCADO_CRECIMIENTO)
valorScore  = 0.6 × economía-efectiva + 0.4 × prestigio     (VALOR_PESO_ECONOMIA / _PRESTIGIO,
              valorScoreEquipo/valorScoreLiga, config.js:238-245)
multiplicadorClub = interpola entre 0.5 (valorScore más flojo) y 1.4 (más alto)
                     combinando equipo y liga (55% / 45%, calcularMultiplicadorClub)
valor = round(valorPorOvr × multiplicadorClub / 1000) × 1000    (redondeado al millar)
```

Se recalcula cada vez que cambia el OVR (cada tramo) y cada vez que cambiás de club (con la economía/prestigio del club nuevo). Se muestra formateado con `formatMarketValue` ([carrera.js:67](js/carrera.js:67)): `€18K`, `€1.2M`, etc.

Para las **ofertas de fichaje** se usa una variante cosmética, `valorOfrecidoPorClub` ([config.js:267-271](js/config.js:267)), que le suma un ±8% de variación aleatoria (`OFERTA_VARIACION_VALOR`) — para que dos clubes de poder parecido no muestren el mismísimo número al centavo en sus tarjetas. No afecta tu valor de mercado real, solo el texto "Te valoran en €X" de esa tarjeta puntual.

---

## 16. Sistema de fichajes y ofertas

Toda la lógica vive en `generarLoteOfertas(equipoActualId, ovr, edad, valorActual)` ([carrera.js:203-375](js/carrera.js:203)), que corre en la única pausa de "oferta" de cada temporada (ver [sección 7](#7-calendario-de-temporada)).

### 16.1 Retiro forzoso (el corte final)

```js
if (edad >= edadRetiroForzoso) return [ solo la carta de retiro forzoso ];
```

`edadRetiroForzoso` se sortea **una sola vez por carrera**, entre 41 y 45 años (`EDAD_RETIRO_FORZOSO_MIN`/`MAX`). A partir de esa edad, no importa el club ni el OVR: la única carta es retirarte.

**Transición previa (no es un corte seco)**: en las **2 temporadas** justo antes de esa edad (`EDAD_RETIRO_TRANSICION`, [config.js:513](js/config.js:513)), el cupo de ofertas de club se reduce a **1** en vez de 2 — cada vez menos clubes se animan a día ofertarte, hasta que en la última temporada esa única oferta también desaparece. Se implementa como una tercera categoría de cupo en [carrera.js:241-248](js/carrera.js:241): `enTransicionRetiro` reduce `cantidadOfertasClub` a 1 (solo si el contrato actual sigue en pie), antes de llegar al corte total de la edad forzosa.

### 16.2 Período de gracia de contrato

```js
enGraciaDeContrato = temporadasEnClubActual < 2     (TEMPORADAS_GRACIA_CONTRATO)
```

Mientras estés en gracia (tus primeras **2 temporadas completas** en el club actual, sea el inicial o uno fichado después), tu club **nunca** puede "no renovarte" — sin este colchón, cualquier club de nivel medio/alto para arriba te dejaría ir en tu primerísima ventana de fichajes, porque ningún novato arranca con el OVR de un jugador hecho (ver [sección 5](#5-elección-de-club-inicial-equipohtml--jsequipojs): tope de 65 vs. ventanas de OVR que fácilmente piden 70+). El contador se resetea a 0 cada vez que fichás por otro club y sube +1 en cada cierre de temporada en el mismo club.

### 16.3 ¿Tu club actual te renueva?

Pasado el período de gracia, `contratoDebeTerminar(equipo, liga, ovr, promedioTemporadaAnterior)` ([config.js:617-624](js/config.js:617)) compara primero tu OVR contra la "ventana de OVR" de tu propio club (ver 16.5 más abajo): si llegás al mínimo, seguís sin más vueltas. Si no llegás, todavía hay una salida: si el **promedio de rating con el que cerraste la temporada anterior** fue realmente bueno (`≥ 7.5`, `CONTRATO_RENDIMIENTO_SALVAVIDAS`, muy por encima del neutral de 6.5) el club te renueva igual — antes esto se decidía solo por el número de OVR crudo, sin mirar cómo jugaste, así que se podía cerrar una temporada brillante en goles/asistencias/rating y que el club te cortara igual, porque el OVR (que crece con su propia curva de edad/techo, no 1 a 1 con las estadísticas del año) no llegó a tiempo. Si ninguna de las dos te salva, no te renuevan — la carta de "Quedarme" se reemplaza por una de retiro (no forzoso, con el texto "decide no renovarte para la próxima temporada").

### 16.4 Retiro voluntario

```js
puedeElegirRetiro = !contratoTerminado && edad >= 36     (EDAD_RETIRO_OFERTA)
```

Desde los 36 años podés elegir colgar los botines aunque tu club te siga queriendo — ocupa una de las 3 cartas de club, dejando solo 2 cupos de fichaje ese año (y, en ese caso puntual, sin la garantía de liga/país local del punto 16.6).

### 16.5 Elegibilidad real: la "ventana de OVR" de cada club

Cada combinación equipo+liga solo puede ofertarte si tu OVR cae dentro de su ventana — `equipoElegibleParaOvr` / `ventanaOvrOferta` ([config.js:516-533](js/config.js:516)):

```
centro = 45 + calidadPoderCombinada(equipo, liga) × 54    (mapeado a todo el rango 45-99 de carrera)
ventana = [ clamp(centro − 13, 45, 99) , clamp(centro + 13, 45, 99) ]     (OFERTA_TOLERANCIA_OVR = 13)
```

Es un **corte duro**, no solo "menos probable": un club chico deja de poder ofertarte en cuanto sos demasiado bueno para él, y uno grande no entra en juego hasta que estás a su altura (con la tolerancia de 13 puntos, los clubes top del mundo ya son alcanzables desde ~86 de OVR). Esta ventana de elegibilidad **no cambió** con el ajuste de pesos de 16.6 — lo que cambió es solo cómo se prioriza/ordena a los ya elegibles, no quién entra al pool.

Además, la oferta tiene que tener sentido en plata: `ofertaTieneValorRazonable(valorActual, valorEnClub)` ([config.js:230-232](js/config.js:230)) descarta clubes donde fichar implicaría un desplome de más del 60% de tu valor de mercado actual (`OFERTA_UMBRAL_CAIDA_VALOR = 0.4`, es decir el club tiene que ofrecerte como mínimo el 40% de lo que valés hoy), aunque el margen de OVR lo deje pasar.

Si el cruce de ambos filtros deja el pool vacío (dataset chico o caso límite), se relaja primero el filtro de valor, y si todavía no alcanza, se usan todos los candidatos — nunca se deja al jugador sin ofertas.

### 16.6 Cuáles de los elegibles aparecen (y en qué orden de prioridad)

Dentro del pool ya elegible, no se sortea parejo entre todos:

1. **Potencial ajustado por edad** (no el OVR real) decide a qué poder de club/liga "apunta" el jugador — `potencialAjustadoPorEdad(ovr, edad)` ([config.js:594-606](js/config.js:594)):

   ```
   17 a 24 años: bono que baja linealmente de +8 (a los 17) a 0 (a los 24) — EDAD_POTENCIAL_BONUS_MAX/HASTA
   25 a 30 años: sin ajuste (edad ideal)
   30+ años:     penalización de −0.7 de OVR efectivo por cada año por encima de 30
   ```

   Esto **no** toca la elegibilidad real del punto 16.5 (esa sigue siendo puro OVR) — solo decide, entre los clubes ya alcanzables, cuáles se priorizan. A igual OVR, un jugador de 27 años apunta más arriba que uno de 38.

2. Con ese potencial se calcula un **único** `poderObjetivo` ([config.js:467-469](js/config.js:467): `prestigioJugador(ovr) × 100` — más OVR, más poder objetivo), y el peso de cada candidato según qué tan cerca está de ese objetivo (`pesoPorCercaniaNivel`, [config.js:490-499](js/config.js:490)):

   ```
   deltaEquipo = (poderEquipo − poderObjetivo) / 10     (PESO_ESCALA_DISTANCIA — lleva el delta,
   deltaLiga   = (poderLiga − poderObjetivo) / 10        en puntos de poder 0-100, a una escala chica)
   factor(delta) = 0.05 si delta > 0 (el club/liga "sobra" de poder), 1 si no (PESO_FACTOR_SOBRAR)
   distancia = |deltaEquipo| × factor(deltaEquipo) + |deltaLiga| × factor(deltaLiga) × 0.6
   peso = 1 / (1 + distancia)^2.2
   ```

   **Asimétrico a propósito**: "quedarte corto" de poder (delta negativo — un club/liga peor de lo que tu potencial pide) pesa la distancia completa, pero "sobrar" (delta positivo, un club/liga mejor) casi no penaliza (factor 0.05 en vez de 1). Con una fórmula simétrica, un club top "se pasaba" del objetivo tanto como un club chico se quedaba corto, y ambos pesaban lo mismo — en la práctica, nunca aparecían los grandes de Europa hasta OVRs absurdamente altos. Con el peso asimétrico, un club mejor que tu objetivo deja de competir en desventaja contra uno que directamente te queda grande.

3. **`elegirMejorEncaje`** ([config.js:448-451](js/config.js:448)): apoyada en `gruposTierAlto` ([config.js:442-446](js/config.js:442), ver también 16.7), ordena los candidatos por peso descendente y sortea (ponderado, para que siga habiendo variedad) **solo dentro del 40% superior** (`OFERTA_TOP_ENCAJE_FRACCION`) — así, si tu nivel da para los grandes, van a ser los grandes los que en verdad aparezcan, en vez de perderse en un sorteo parejo contra todo el pool elegible.

### 16.7 Cuántas ofertas de club, y la garantía de "tu entorno" (condicional)

- **3 cupos de club** normalmente (+ la carta de tu club actual = 4 tarjetas en total).
- **2 cupos** si podés elegir retiro voluntario (16.4) — ahí no hay garantía de entorno, queda 100% libre.

Con 3 cupos, la garantía de "tu entorno" ya **no es incondicional** — solo se activa si ese entorno sigue siendo un destino de tu nivel:

- `gruposTierAlto(elegibles, pesoFn)` ([config.js:442-446](js/config.js:442)) calcula el mismo 40% superior por peso que usa `elegirMejorEncaje` (16.6) sobre **todos** los elegibles, sin filtrar por entorno.
- Si algún club de tu entorno cae dentro de ese tier alto, se garantizan **hasta 2 ofertas** de ahí — exactamente 2 si hay al menos 2 candidatos en esa intersección, menos si no los hay.
- Si **ningún** club de tu entorno llega al tier alto (tu nivel ya superó a tu liga actual, o a tu país de origen si sos veterano), la garantía **desaparece del todo** — salvo la excepción de abajo para veteranos.

"Tu entorno" es:

- Normalmente, **tu liga actual**.
- Desde los **33 años** (`EDAD_OCASO_RETORNO_PAIS`, [config.js:617](js/config.js:617)), pasa a ser **tu país de origen** — para simular volver a cerrar la carrera en casa, aunque la hayas jugado toda en el exterior.

**Retorno nostálgico esporádico (solo veteranos, 33+)**: si tu país de origen ya no entra en el tier alto (tu nivel lo superó de sobra) pero igual hay clubes elegibles ahí, aparece **como máximo 1** oferta de esos clubes con **30% de probabilidad** por ventana (`PROB_OFERTA_NOSTALGICA`, [config.js:618](js/config.js:618)) — ya no es una garantía, es una posibilidad ocasional de que un club de tu país intente el gesto sentimental de traerte de vuelta, sin que se sienta forzado en cada carrera.

El resto de los cupos (y todo, si no hay candidatos de entorno) sale libre del pool elegible completo, mismo criterio de mejor encaje. Si aun así faltan candidatos distintos, se completa repitiendo clubes antes que mostrar menos ofertas de las que corresponden.

### 16.8 Orden de las cartas, y resolver la pausa

Las cartas ya **no se mezclan en orden aleatorio**: la carta de tu club actual (quedarme, o el retiro forzoso si no te renuevan) va siempre **primera**; si además aparece la opción de retirarte voluntariamente (16.4), esa va **segunda**. El resto de ofertas de club llena los cupos restantes, en cualquier orden — así el jugador siempre encuentra "seguir acá" (y "retirarme", si corresponde) en el mismo lugar de la fila, en vez de tener que buscarlos entre las demás ofertas.

Un solo clic resuelve toda la pausa (`resolveOferta`, [carrera.js:1299-1343](js/carrera.js:1299)):

- **Retiro** → cierra la carrera ([sección 17](#17-fin-de-carrera-retiro-y-resumen)).
- **Fichar por un club nuevo** → la ventana única de fichajes (ver [sección 7](#7-calendario-de-temporada)) cae siempre en pretemporada, así que el traspaso arranca la temporada entera de cero con el club nuevo (nunca parte un año en dos filas de historial): se actualiza club, liga, valor de mercado, se reinician `competiciones` desde cero (la clasificación internacional no se hereda — es del club, no tuya), se resetea `temporadasEnClubActual` a 0 y la forma vuelve a "regular".
- **Quedarme** → sin cambios.

Ninguna de las dos dispara un toast — el nuevo hero/spotlight (o, si te quedás, la ausencia de cambios) ya lo comunica solo; antes un mensaje de "Fichaste por X"/"Decidiste quedarte en X" se sentía redundante, la única pausa del juego donde SIEMPRE hay un toast aunque no haya nada nuevo que contar.

---

## 17. Fin de carrera: retiro y resumen

Al aceptar una carta de retiro (`finalizarCarrera`, [carrera.js:1402-1434](js/carrera.js:1402)):

- Se archiva la temporada en curso tal como quedó.
- El spotlight desaparece y el panel de decisiones muestra el mensaje de despedida con **2 botones**:
  - **"Ver resumen de mi carrera"** → abre un modal (`renderResumenCarrera`, [carrera.js:1540-1580](js/carrera.js:1540)) con:
    - **Banner** con el degradado de colores del último club (mismo lenguaje visual que el hero de `carrera.html`, vía `--rb-a`/`--rb-b`): escudo, nombre, posición, temporadas jugadas, edad de retiro, y el **badge de pico de OVR** (`ovr-badge--hero`, coloreado con `ovrTierColor` — ver [sección 22](#22-interfaz-componentes-animaciones-y-responsive)) a un costado.
    - **Gráfico de evolución de OVR**: un SVG de área + línea (`ovrArcoSvg`, [carrera.js:1494-1512](js/carrera.js:1494)) con el OVR de cada temporada de punta a punta, coloreado con el mismo color de gema/metal que el badge de pico — la caption de al lado indica "De X a Y" (OVR de la Temporada 1 al pico alcanzado).
    - **Estadísticas combinadas** de **toda** la carrera (todas las filas de `temporadasFinalizadas`): partidos, goles, asistencias, MVP, promedio de rating y mayor valor de mercado, cada una con su ícono.
    - **Clubes**, como un recorrido horizontal con flechas entre escudos (en el orden en que los fichaste, sin repetir) en vez de una grilla suelta — con scroll propio si fueron muchos. El nombre debajo de cada escudo va alineado a la izquierda (`.resumen__club`, [css/carrera.css](css/carrera.css)), igual que el resto del texto del resumen — antes quedaba centrado bajo el escudo, inconsistente con todo lo demás.
    - **Trofeos**, agrupados por tipo (un solo ícono por trofeo distinto, con un contador "×N" si lo ganaste más de una vez).
  - **"Aceptar"** → vuelve a `index.html` para arrancar una carrera nueva.

Toda la lógica de agregación (incluida la serie de OVR para el gráfico) vive en `construirResumenCarrera()` ([carrera.js:1441-1489](js/carrera.js:1441)).

---

## 18. Solicitud de cambio de dorsal

Se habilita al cerrar **cada** temporada ([carrera.js:724-728](js/carrera.js:724)) y queda disponible hasta que se use (no hace falta pedirlo en el momento). Un solo pedido por vez.

`probabilidadAceptarCambioNumero(ovr, equipoAcumuladoTemporada)` ([config.js:799-804](js/config.js:799)) — evaluado con el OVR y el rendimiento colectivo **con los que cerró** la temporada anterior, no con los de la nueva (que todavía no jugó nada):

```
prob = clamp(0.3 + (ovr − 45) × 0.008 + equipoAcumuladoTemporada × 0.05, 0.05, 0.95)
```

El número pedido en sí no influye en nada — lo que pesa es tu peso dentro del plantel, no si "el 10 está más pedido" que el 23.

---

## 19. Selección nacional

Sistema aparte del banco de eventos (aunque su tarjeta se muestra en el mismo lugar): representa las convocatorias, torneos y estadísticas del jugador con la selección de su país, en paralelo a su carrera de club.

### 19.1 Selecciones nacionales (`GameDatabase.selecciones`)

**46 selecciones** — una por cada país de `COUNTRIES` ([script.js:4](js/script.js:4)) — cada una con `fuerza`/`prestigio` (mismo eje 0-100 que clubes/ligas, ver [sección 14.0](#14-sistema-de-competiciones-liga-copas-clasificación-internacional)) y su `confederacion` (`UEFA` / `CONMEBOL` / `CONCACAF` / `CAF` / `AFC` — más amplio que el de `ligas`, porque acá entran todos los países de la creación de personaje, no solo los que tienen liga propia cargada). Van a mano según pedigrí futbolístico real: de Brasil (fuerza 92) a Catar (fuerza 38).

### 19.2 Convocatoria

Se sortea **una vez por temporada**, igual mecanismo que Alto Impacto (ver [sección 20](#20-banco-de-eventos-de-temporada-jseventsjs)): cada país tiene un "OVR de referencia" que te da un 50/50 de ser convocado — `probConvocatoria(ovr, fuerzaSeleccion)` ([config.js](js/config.js)):

```
umbral = 50 + fuerzaSeleccion × 0.35                         (UMBRAL_OVR_CONVOCATORIA_BASE/_FACTOR)
prob   = clamp(0.5 + (ovr − umbral) × 0.04, 0.03, 0.95)       (PROB_CONVOCATORIA_PENDIENTE_OVR, min/max)
```

Cuanto más grande la selección, más alto el OVR que hace falta: a Brasil (fuerza 92, umbral ≈ 82) hay que llegarle con un OVR de élite; a Bolivia (fuerza 35, umbral ≈ 62) un OVR medio ya empareja. La probabilidad sube/baja de forma lineal alrededor de ese umbral — no es un corte seco, hay una franja real de incertidumbre.

Si el sorteo da que sí, se elige al azar en qué pausa de la temporada cae la convocatoria (igual que Alto Impacto). Si esa pausa **ya** está ocupada por un evento de Alto Impacto de tipo "deportivo", la convocatoria simplemente no se muestra esa vez (caso raro: requiere que ambos coincidan de pausa).

### 19.3 La tarjeta de convocatoria

Reemplaza el slot "deportivo" de esa pausa (mismo mecanismo de reemplazo que Alto Impacto), con un dilema real de 2 opciones — nunca gratis, mismo principio que el resto del banco de eventos (ver [sección 20](#20-banco-de-eventos-de-temporada-jseventsjs)):

| Opción | Efecto en tu club | Efecto en tu selección |
|---|---|---|
| Priorizar la convocatoria | `rendimiento +1`, `equipo −1` | Jugás normalmente (ver 19.4) |
| Cuidar tu lugar en el club | `forma: desanimado`, `equipo +1` | 0 partidos esa ventana |

Se identifica con un 🌍 en la esquina superior derecha de la tarjeta (mismo lugar que el ⚠️ de Alto Impacto) y la etiqueta "Selección" en vez de "Deportivo".

### 19.4 Qué se juega — amistosos, eliminatorias o el torneo grande

El calendario de grandes torneos sale directo del número de temporada, sin estado adicional que guardar (`tipoAnoTorneoSeleccion`, [config.js](js/config.js)):

```
temporada % 4 == 1  →  año de Mundial
temporada % 4 == 3  →  año de copa continental (Copa América / Eurocopa / Copa Oro / Copa Africana / Copa Asiática, según tu confederación)
en cualquier otro año →  solo amistosos/eliminatorias, sin trofeo en juego
```

Al aceptar priorizar la convocatoria, `resolverParticipacionSeleccion` resuelve todo de un saque (no se reparte en tramos como las copas de club):

- **Año sin torneo**: jugás entre 3 y 5 amistosos (`PARTIDOS_AMISTOSO_SELECCION_MIN/MAX`) — antes era un número fijo (2), sin variación de temporada a temporada.
- **Año de torneo**: la campaña de eliminatorias se juega **siempre**, clasifiques o no — entre 6 y 10 partidos (`PARTIDOS_ELIMINATORIAS_MIN/MAX`). Antes esto solo aparecía como "premio consuelo" al no clasificar, con el mismo número fijo (2) que un año de amistosos, así que nunca se sentían distintos. Después se tira si tu país **clasifica** (`probClasificarTorneoSeleccion(calidad) = clamp(0.15 + 0.8 × calidad, 0.05, 0.97)`, más parejo que ganarlo):
  - Si no clasifica, la temporada de selección termina ahí (solo esos 6-10 partidos de eliminatorias).
  - Si clasifica, se **suman** arriba: fase de grupos garantizada (3 partidos, `PARTIDOS_FASE_DE_GRUPOS_SELECCION`), con una tirada para avanzar (`probAvanzarFaseDeGruposSeleccion(calidad) = clamp(0.35 + 0.6 × calidad, 0.15, 0.95)` — bastante generoso, como en la vida real).
  - Si avanza, una ronda eliminatoria por vez (octavos → cuartos → semifinal → final en el Mundial, cuartos → semifinal → final en los continentales), cada una con la **misma** `probAvanzarRonda(calidad)` que ya usan las copas de club ([sección 14.1](#14-sistema-de-competiciones-liga-copas-clasificación-internacional)) — si gana todas, es **campeón** y el trofeo (Copa del Mundo / Copa América / Eurocopa / Copa Oro / Copa Africana de Naciones / Copa Asiática) se suma a `temporadaActual.trofeos`, el mismo array que los trofeos de club. Si pierde justo la final, queda **subcampeón**.

Con esto, el total de partidos de un año de torneo grande varía entre 6 (no clasificó) y 17+ (campeón del Mundial) en vez de saltar solo entre 2 (amistoso) o 6 (techo viejo de una campaña corta) como antes.

`calidad` es `calidadSeleccion(fuerzaSeleccion, forma)` ([config.js](js/config.js)): la fuerza fija del país pesa la enorme mayoría, con un empujón chico (`SELECCION_PESO_JUGADOR = 0.15`) según tu forma del momento — un solo jugador no decide el destino de todo un seleccionado.

Los goles de esos partidos reutilizan `GameConfig.simularTramo` tal cual la usa el club (misma propensión por grupo de posición, [sección 10](#10-estadísticas-del-tramo-goles-asistencias-mvp-rating)), para que meter un gol con la selección se sienta igual que uno de club.

### 19.5 Estadísticas y dónde se ven

Cada temporada guarda su propio `seleccionPartidos`/`seleccionGoles` (independientes de los `partidos`/`goles` de club — nunca se suman entre sí):

- **Temporada en curso**: si hubo convocatoria, el spotlight muestra una línea aparte con la bandera del país + "Selección: N PJ · M G", debajo del club/liga (desktop y mobile).
- **Historial**: cada temporada pasada con convocatoria repite esa misma línea en su propia fila, sin desplazar las columnas de club (trofeos, OVR, stats).
- **Resumen final de carrera**: una sección "Con la selección" con la bandera, el país y el total acumulado de partidos/goles de toda la carrera (`construirResumenCarrera`, [carrera.js](js/carrera.js)) — y los trofeos de selección aparecen mezclados con los de club en la misma fila de trofeos, porque comparten el mismo array.

---

## 20. Banco de eventos de temporada (`js/events.js`)

**226 eventos de decisión** en total, cada uno con **2 opciones** (formato completo documentado en el encabezado de [events.js:10-28](js/events.js:10)):

| Banco | Cantidad | Cuándo aplica |
|---|---|---|
| `generales` | 100 | Cualquier edad |
| `porEdad.novato` | 35 | Edad ≤ 21 años (`RANGO_EDAD_NOVATO_MAX`) |
| `porEdad.promedio` | 35 | 22 a 32 años (`RANGO_EDAD_PROMEDIO_MAX`) |
| `porEdad.veterano` | 34 | 33+ años |
| `altoImpacto` | 22 | Cualquier edad, máx. 1 por temporada |

**Selección de un evento normal** (`elegirEventoPorTipo`, [carrera.js:397-414](js/carrera.js:397)): para cada pausa, 50/50 si sale del banco `generales` o del banco correspondiente a la edad actual; dentro de ese banco se filtra por tipo (`"personal"` o `"deportivo"` — cada pausa siempre muestra exactamente 1 de cada). **Ningún evento se repite en la misma carrera**: se recuerda cada id ya usado (`eventosUsados`, compartido entre bancos) y se excluye de futuros sorteos; si un banco se queda sin eventos sin usar de ese tipo (carrera muy larga), se libera el filtro para ese banco puntual antes que forzar una repetición.

**Eventos de debut**: 2 eventos de `porEdad.novato` (`nov-08`, `nov-32`) están escritos sobre el debut profesional en sí ("un defensor te marca en tu debut", "debutás en un estadio gigante") — un momento que ocurre una única vez. Quedan marcados con `debut: true` y `esElegibleParaDebut(evento)` ([carrera.js:392-395](js/carrera.js:392)) los excluye del sorteo salvo que sea, literal, la primera pausa de decisión de toda la carrera (Temporada 1, antes de simular el primer tramo) — antes solo se filtraba por rango de edad, así que podían salir en la Temporada 3 con el jugador ya afianzado en el club.

**Sin decisiones "gratis"**: cada opción de cada evento normal (no aplica a `altoImpacto`, ver el porqué debajo) tiene siempre **al menos una señal positiva y una negativa** entre `rendimiento`/`forma`/`equipo` — ninguna opción es pura-positiva ni pura-negativa, y ninguna queda neutra-plana. La idea no es que una opción "gane" a la otra en todo, sino que el jugador elija cuál le conviene más, cuál le hace perder más o cuál le hace perder menos. Un segundo pase completo sobre las 452 opciones del banco (238 modificadas) eliminó los últimos casos de "opción comprometida en las tres dimensiones vs. opción pasiva floja" que todavía quedaban del primer ajuste — siempre inyectando la señal que falta en un eje que esa opción tenía en cero, nunca pisando la única señal que ya tenía. La única excepción a propósito sigue siendo un evento de `altoImpacto` sobre aceptar un soborno para arreglar un partido (`ai-17`) — ahí rechazar la propuesta debe ser, sí, objetivamente mejor en todo: no es un dilema de números, es una cuestión de integridad.

**Eventos de Alto Impacto**: sin restricción de edad, efectos mucho más fuertes (hasta ±6 de rendimiento, ±4 de equipo — contra ±3/±2 de los eventos normales), y algunos tienen **las dos opciones en negativo a propósito** (elegir el mal menor, no "ganar"). Se identifican con un ⚠️ en la tarjeta. Se sortea al crear la temporada si va a haber uno (30% de probabilidad) y en qué tramo; si sale, reemplaza al evento del tipo que corresponda en esa pausa — mismo mecanismo de reemplazo que usa la convocatoria a la selección nacional ([sección 19](#19-selección-nacional)), que compite por el mismo slot "deportivo".

Cada opción define el texto del botón y sus `efectos` (`rendimiento` −3..+3 normal / −6..+6 alto impacto, `forma` nuevo estado fijo, `equipo` −2..+2 normal / −4..+4 alto impacto). También trae un texto de `resultado` en los datos — es contenido narrativo pensado para uso futuro (por ejemplo, un registro/historial de decisiones), pero **hoy no se muestra en ningún lado de la interfaz**: se sacó del toast que lo mostraba antes porque era pura redundancia con lo que ya decía el botón elegido.

**Lesiones** (contenido, no la lógica — ver [sección 13](#13-lesiones)): 17 lesiones reales con nombre y descripción médica, repartidas en nivel3 (6, leves), nivel2 (6, moderadas) y nivel1 (5, graves — LCA, fractura de tibia/peroné, tendón de Aquiles, hernia discal, rotura muscular grado 3).

---

## 21. Base de datos de ligas y equipos (`js/database.js`)

**29 ligas reales**, cada una con sus 3 ejes ocultos de 0 a 100 (`fuerza` / `prestigio` / `economia` — ver [sección 14.0](#14-sistema-de-competiciones-liga-copas-clasificación-internacional)). Las primeras 10 (las "grandes" originales) tienen estos valores puestos a mano desde el arranque del proyecto; las otras 19 se sumaron después en una incorporación masiva, con la misma metodología:

| Liga | País | Confed. | Fuerza | Prestigio | Economía |
|---|---|---|---|---|---|
| Premier League | Inglaterra | UEFA | 96 | 92 | 100 |
| La Liga | España | UEFA | 93 | 97 | 88 |
| Serie A | Italia | UEFA | 88 | 90 | 78 |
| Bundesliga | Alemania | UEFA | 87 | 82 | 82 |
| Ligue 1 | Francia | UEFA | 82 | 75 | 75 |
| Primeira Liga | Portugal | UEFA | 76 | 80 | 58 |
| Süper Lig | Turquía | UEFA | 74 | 72 | 65 |
| Brasileirão Série A | Brasil | CONMEBOL | 74 | 80 | 45 |
| Eredivisie | Países Bajos | UEFA | 72 | 74 | 60 |
| Pro League | Bélgica | UEFA | 70 | 62 | 55 |
| Primera División Argentina | Argentina | CONMEBOL | 68 | 85 | 25 |
| Liga Premier Rusa | Rusia | UEFA | 66 | 60 | 55 |
| Liga MX | México | CONCACAF | 66 | 55 | 42 |
| Primera División (Uruguay) | Uruguay | CONMEBOL | 64 | 72 | 22 |
| Liga Premier de Ucrania | Ucrania | UEFA | 64 | 62 | 30 |
| J1 League | Japón | AFC | 62 | 55 | 50 |
| Primera División (Chile) | Chile | CONMEBOL | 60 | 62 | 30 |
| Scottish Premiership | Escocia | UEFA | 60 | 58 | 42 |
| MLS | Estados Unidos | CONCACAF | 58 | 40 | 55 |
| Super League Greece | Grecia | UEFA | 58 | 55 | 38 |
| Serie A (Ecuador) | Ecuador | CONMEBOL | 56 | 50 | 22 |
| Super League China | China | AFC | 55 | 50 | 48 |
| Primera División (Costa Rica) | Costa Rica | CONCACAF | 52 | 48 | 25 |
| Primera A (Colombia) | Colombia | CONMEBOL | 55 | 50 | 20 |
| Primera División (Paraguay) | Paraguay | CONMEBOL | 50 | 54 | 16 |
| Liga 1 (Perú) | Perú | CONMEBOL | 48 | 45 | 18 |
| Primera División (Venezuela) | Venezuela | CONMEBOL | 44 | 35 | 16 |
| Primera División (El Salvador) | El Salvador | CONCACAF | 44 | 38 | 14 |
| Primera División (Bolivia) | Bolivia | CONMEBOL | 42 | 38 | 15 |

**23 de las 29** tienen el campo `pais` cargado con un país que existe en `COUNTRIES` (`js/script.js`) — esas son las que pueden ser el punto de partida "local" en la creación de personaje (ver [sección 5](#5-elección-de-club-inicial-equipohtml--jsequipojs)). Turquía, Grecia, Rusia, China, El Salvador y Ucrania tienen liga cargada pero **no** son nacionalidades elegibles todavía — se puede fichar por sus clubes, pero no arrancar la carrera como local ahí.

**510 equipos reales** repartidos en esas 29 ligas, cada uno con: nombre real, sus propios `fuerza`/`prestigio`/`economia`, iniciales y colores propios (para el placeholder si el escudo no carga) y el nombre del archivo de escudo real. Los ~25 clubes más reconocibles del mundo de las 10 ligas originales tienen esos 3 valores puestos a mano; el resto (incluidos los 296 equipos de las 19 ligas nuevas) se derivó con una variación estable por club (mismo id → siempre el mismo resultado) a partir de 3 niveles de referencia por liga — "grande" / "consolidado" / "humilde" — para que no todos los equipos de una misma liga terminen con el número idéntico.

**Nombres cortos, "como se los conoce"**: los 510 equipos usan el nombre por el que se los reconoce popularmente en vez de su denominación social completa (194 renombrados) — por ejemplo "Club Sportivo Independiente Rivadavia" pasó a ser "Independiente Rivadavia", "Club Atlético Boca Juniors" a "Boca Juniors", "FC Barcelona" a "Barcelona", "Sport Club Corinthians Paulista" a "Corinthians", "FC Internazionale Milano" a "Inter". Se dejaron sin tocar los casos donde el prefijo/sufijo es parte genuina del nombre reconocido en su país (Bayern München, Borussia Dortmund, Hamburger SV, VfB Stuttgart, Club Brugge, Royal Antwerp, etc.) — no hay dos equipos con el mismo nombre visible dentro de una misma liga.

**Escudos reales para toda la incorporación nueva**: los 296 equipos, las 19 ligas y sus 38 trofeos (liga + copa nacional de cada una) tienen su imagen real cargada — no hay ninguna liga nueva con ícono genérico de respaldo, salvo el trofeo de liga de Eredivisie (que sí tiene su logo real, pero todavía no un trofeo de campeón propio) y el logo de liga de Costa Rica.

**Sustituciones por falta de escudo**: cuando un club realmente vigente en la temporada de referencia no tenía imagen disponible, se lo reemplazó por otro club real del mismo país que sí la tenía (nunca por un club inventado) — por ejemplo, en la J1 League japonesa Mito HollyHock/JEF United Chiba/V-Varen Nagasaki se reemplazaron por Albirex Niigata/Shonan Bellmare/Yokohama FC; en la Liga Premier Rusa, Akron Tolyatti/Dynamo Majachkalá/Rodina Moscú por Nizhni Nóvgorod/Sochi/Ural Yekaterinburg. La liga de Ucrania quedó con **16 equipos reales** en vez de sus 20 oficiales de esta temporada, por no tener sustitutos disponibles para completar los 4 que faltaban — se prefirió esto antes que inventar clubes sin escudo real.

**71 competiciones reales** ([database.js](js/database.js)):
- **29 ligas domésticas** (una por cada liga cargada), con la cantidad real (o una referencia realista) de partidos de su formato vigente.
- **29 copas domésticas**, una por liga — de las 10 originales (FA Cup, Copa del Rey, Coppa Italia, DFB-Pokal, Coupe de France, Copa do Brasil, Copa Argentina, Copa México, Lamar Hunt U.S. Open Cup, Copa Colombia) a las 19 nuevas (KNVB Beker, Taça de Portugal, Croky Cup, Copa de Turquía, Scottish Cup, Copa de Grecia, Copa de Rusia, Copa del Emperador, Copa de China, Copa Perú, Copa Simón Bolívar, Copa Chile, Copa AUF Uruguay, Copa Venezuela, Copa Ecuador, Copa Costa Rica, Copa Paraguay, Copa Presidente, Copa de Ucrania).
- **7 competiciones internacionales de club** por confederación/categoría: Champions League y Europa League (UEFA), Libertadores y Sudamericana (CONMEBOL), Concacaf Champions Cup (CONCACAF no tiene un segundo nivel continental vigente), y **AFC Champions League Elite/Two** (agregadas junto con J1 League y Super League China, para que sus clubes también tengan a qué clasificar — ver [sección 14](#14-sistema-de-competiciones-liga-copas-clasificación-internacional)).
- **6 competiciones de selección**: Copa del Mundo + una copa continental por confederación (Copa América, Eurocopa, Copa Oro, Copa Africana de Naciones, Copa Asiática) — ver [sección 19](#19-selección-nacional).

Todos los números de partidos (mínimos garantizados + rondas extra) son una referencia realista basada en el formato vigente de cada torneo — ver los comentarios junto a cada entrada en el archivo para el detalle de cada formato.

**46 selecciones nacionales** (`GameDatabase.selecciones`) — una por cada país de la creación de personaje, con `fuerza`/`prestigio` propios y su confederación (`UEFA`/`CONMEBOL`/`CONCACAF`/`CAF`/`AFC`) — ver [sección 19](#19-selección-nacional) para cómo se usan.

---

## 22. Interfaz: componentes, animaciones y responsive

- **Tokens de diseño** centralizados en `:root` de [css/style.css](css/style.css) (colores, radios) — compartidos por las 3 páginas.
- **Escudos con fallback**: `crestHtml`/`ligaCrestHtml` ([config.js:283-310](js/config.js:283)) intentan cargar el PNG real; si falla (`onerror`), se reemplazan solas por un placeholder de iniciales + degradado de los colores del club (`crestFallback`). Los escudos de liga no llevan ese fondo — solo el logo (clase `team-crest--liga`).
- **Banderas reales** vía [flagcdn.com](https://flagcdn.com) (los emoji de bandera no se dibujan en Windows), con el emoji como respaldo de texto si la imagen falla (`flagHtml`/`flagFallback`).
- **Trofeos**: siluetas PNG en `assets/escudos/trofeos/`, pintadas vía `mask-image` con un dorado **propio** (`--trophy-gold: #d4af37`, [css/style.css](css/style.css)) — el color original del archivo no importa, solo su transparencia define la forma (`trofeoIconHtml`). Este dorado es deliberadamente distinto del `--accent` ámbar que usan los botones y el nivel "oro" del OVR: si el trofeo reutilizara ese mismo color, se perdería entre el resto de la interfaz en vez de leerse como un logro aparte.
  - **Historial en mobile**: el nombre del trofeo va apilado y bien chico debajo de su ícono (no en un listado aparte) — oculto por default, se revela al tocar la tarjeta entera de esa temporada (`.timeline-item--expandida`, delegado sobre `#timelineList` en [carrera.js](js/carrera.js)). El texto aparece de golpe (`display: none`/`block`, sin transición) — antes tenía una animación de alto/opacidad que en algunos trofeos se veía como un pequeño salto del ícono, sin aportar nada. En desktop el nombre completo ya está disponible al pasar el mouse (`title`).
- **Color del badge de OVR** (`ovrTierColor`, [carrera.js:58-65](js/carrera.js:58)) — 6 niveles fijos, de metal a gema, proporcionales al rango real de carrera (45–99):

  | OVR | Color |
  |---|---|
  | 45–65 | Bronce |
  | 66–79 | Plata |
  | 80–89 | Oro |
  | 90–92 | Zafiro |
  | 93–95 | Rubí |
  | 96–99 | Amatista |

- **Etiquetas de efecto en cada opción de decisión** (`efectoRendimientoHtml`/`efectoFormaHtml`/`efectoEquipoHtml`, [carrera.js:1021-1034](js/carrera.js:1021)): antes de elegir, cada botón muestra de forma explícita qué le va a pasar a tu rendimiento, tu forma y al equipo si lo tocás — no hay efectos ocultos en las decisiones de evento.
- **Animaciones de tramo**: los números del spotlight (partidos, goles, OVR, anillo de progreso) no saltan de golpe — se animan con un *ease-out* cúbico durante 900ms (`animarNumero`/`animarAnilloProgreso`, [carrera.js:466-516](js/carrera.js:466)). En mobile, la versión chata tiene su propio equivalente: la barra de progreso lineal anima su ancho con una transición CSS (`animarBarraMobile`) y los mismos números se animan con `animarNumero` sobre los elementos `[data-stat-mobile]` — antes en mobile los números y la barra saltaban de golpe, sin animación.
- **Reacomodo de tarjetas (técnica FLIP)**: al resolver una decisión y quedar menos tarjetas, la que sigue no salta de golpe a su nueva posición — se captura su posición anterior y se anima el desplazamiento (`capturarPosicionesCards`/`animarReacomodoCards`, [carrera.js:1131-1158](js/carrera.js:1131)), en 550ms (antes 350ms) con una curva de aceleración/desaceleración pareja (`cubic-bezier(0.4, 0, 0.2, 1)`) en vez de una curva "snappy" que concentraba la mayor parte del recorrido en el primer instante — esa combinación (arranque duro + poco tiempo) era lo que se sentía brusco, no solo la duración. **Solo en desktop**: en mobile, la técnica FLIP (que traslada la tarjeta desde su posición "antes") entraba en conflicto con el scroll-snap nativo del carrusel de decisiones y producía un rebote visible al terminar la transición — en mobile se usa en cambio un fundido + escala simple con la misma curva (`@keyframes decisionCardEntrando`, también en 500ms), sin tocar la posición real de la tarjeta.
- **Lesión activa — efecto de luz roja**: mientras el jugador tiene una lesión en curso, la tarjeta de spotlight de la temporada (desktop y su equivalente mobile) muestra un borde y resplandor rojo (`.spotlight-card--lesionado`/`.spotlight-mobile--lesionado`) — el mismo lenguaje visual que ya usaban la tarjeta de evento de alto impacto y el ícono de mundo de la convocatoria a la selección, para que "algo importante está pasando" se lea igual en toda la interfaz. Se repinta apenas se diagnostica la lesión (no recién al simular el tramo): las lesiones leves duran exactamente 1 tramo, así que sin este repintado inmediato el efecto nunca llegaba a verse — se generaba y se curaba en el mismo ciclo, antes de la siguiente vez que se pintaba el spotlight.
- **Línea de diseño móvil independiente**: por debajo de los 640px, `carrera.css` no solo achica la versión de escritorio — el hero, el spotlight y el historial tienen su propio HTML más chato (generado aparte en `carrera.js`, oculto/mostrado por CSS), y el panel de decisiones pasa a un carrusel de una tarjeta a la vez con scroll-snap, sin JavaScript adicional para eso.
- **Tarjeta para compartir el resumen de carrera**: el botón "C" junto a la ✕ del modal de resumen (`#resumenModalCompartir`) genera una imagen propia con los mismos datos del resumen — no es una captura del popup (eso pediría una librería externa que el proyecto no usa), es una tarjeta de 1080px de ancho dibujada a mano en un `<canvas>` (`generarTarjetaResumenCanvas`, [carrera.js](js/carrera.js)): el logo real del juego (`assets/logo/logo_leyenda_transparent.png`, 70px de alto) en la esquina, escudo del último club, degradado con sus colores, badge de pico de OVR, gráfico de evolución de OVR, grid de estadísticas, recorrido de clubes, sección "Con la selección" (bandera + país + partidos/goles, si aplica) y trofeos — y se copia al portapapeles con la Clipboard API (`navigator.clipboard.write`), con un `window.open` de respaldo si el navegador no la soporta.
  - **Alto dinámico**: el recorrido de clubes y los chips de trofeos pasan a una fila/línea nueva cuando no entran en el ancho disponible (una carrera larga puede tener 7+ clubes) — antes SIEMPRE se dibujaban en una sola fila centrada, así que los escudos de más quedaban fuera de la tarjeta. Antes de dibujar nada se mide cuántas filas va a necesitar cada sección variable y se fija el alto real del canvas en base a eso (entre 1350px y bastante más, según haga falta) — nunca un número fijo.
  - **Nitidez de los escudos**: por defecto el canvas reescala imágenes con `imageSmoothingQuality: "low"` (pensado para animaciones a 60fps, no para una sola exportación estática) — con escudos fuente de 1500×1500px, de sobra para verse nítidos, esto los dejaba borrosos al reducirlos a ~84-130px. Se fija en `"high"` justo después del último resize del canvas (cambiar `width`/`height` resetea todo el estado del contexto, así que tiene que ir después, no antes).
  - **Imágenes cross-origin en el canvas**: la bandera del país sale de [flagcdn.com](https://flagcdn.com), un origen distinto al del juego. Dibujar una imagen así en el canvas sin marcarla `crossOrigin = "anonymous"` lo deja "tainted" (contaminado) y el navegador bloquea después cualquier intento de exportarlo (`toBlob`/`toDataURL`) con un `SecurityError` — rompía la tarjeta entera apenas la carrera incluía convocatorias a la selección. La bandera se carga ahora con `cargarImagenSeguraCrossOrigin` en vez de la función genérica `cargarImagenSegura` (reservada para assets propios del sitio); si el servidor remoto no coopera con CORS, cae sola al respaldo de emoji sin romper nada.
- **Con la selección**: cuando hubo convocatoria esa temporada, el spotlight y el historial muestran una línea aparte con la bandera del país + partidos/goles con la selección (ver [sección 19](#19-selección-nacional)) — nunca mezclada con los números de club.
- **Chips del hero** (edad, país, valor de mercado): los 3 comparten el mismo estilo neutro (texto blanco, borde translúcido) — el de valor de mercado (`.value-badge`) usaba antes el celeste `--accent-2`, distinto de los otros dos sin motivo aparente; ahora los 3 son visualmente el mismo tipo de dato.
- **Altura real de viewport en mobile (`--vh-real`)**: el layout de `carrera.html` (hero fijo / centro scrolleable / footer de decisiones fijo) depende de conocer la altura visible real de la pantalla. `100dvh` la calcula bien en Safari/iOS, pero varios navegadores mobile (Chrome/Firefox en Android, algunos in-app browsers) la calculan mal al cargar la página y dejan una franja del footer tapada. `actualizarAlturaViewport()` ([carrera.js](js/carrera.js), tope del archivo) mide `window.innerHeight` por JS al cargar y en cada resize/orientationchange, y esa variable pisa a `100dvh` en `.body--career` como última palabra — `100vh` y `100dvh` quedan como respaldo en cascada para cuando el JS todavía no corrió.
- **Toast** (`showToast`, definido igual en `carrera.js`/`equipo.js`/`script.js`): en `carrera.html` aparece debajo del hero en vez de abajo de la pantalla, porque ahí abajo siempre está el panel de decisiones. En mobile (`@media (max-width: 640px)` de [css/style.css](css/style.css) y [css/carrera.css](css/carrera.css)) ocupa casi todo el ancho de pantalla (`calc(100vw - 1.5rem)`) en vez de ajustarse solo al texto — más fácil de leer en una pantalla chica.
- **Pie de versión** (`GameConfig.VERSION`, `GameConfig.FECHA_PUBLICACION`, `GameConfig.footerHtml()` — [config.js:11-19](js/config.js:11)): un único punto de verdad para el número de versión y la fecha de publicación, mostrado en las 3 pantallas (`#appFooter`). En `index.html`/`equipo.html` es el último elemento de la página (scroll normal); en `carrera.html` va dentro de `.career`, después del historial, para no restarle alto fijo al hero/spotlight/decisiones.

---

## 23. Persistencia y estado

- `localStorage["leyendaPlayer"]` es la **única** persistencia real: identidad del jugador + club/OVR inicial. Se escribe en `index.html` y se completa en `equipo.html`.
- **Toda la progresión de la carrera** (temporada actual, historial, OVR, trofeos, valor de mercado, etc.) vive únicamente en variables de JavaScript en memoria, dentro de `carrera.html`. **No hay guardado de partida**: cerrar la pestaña o recargar la página pierde el progreso de la carrera (vuelve a arrancar la Temporada 1, con el mismo club/OVR inicial que sí quedó guardado).
- No hay backend, base de datos externa, ni llamadas de red propias del juego (aparte de pedir escudos/banderas/imágenes de trofeos como archivos estáticos, y las banderas de país a flagcdn.com).

---

## 24. Tabla completa de constantes de balance

Todas viven en [`js/config.js`](js/config.js). Cambiar cualquiera de estos números es la forma correcta de recalibrar el juego — nunca hay "números mágicos" repetidos sueltos en otros archivos.

| Constante | Valor | Qué controla |
|---|---|---|
| `EDAD_MIN` / `EDAD_MAX` | 16 / 19 | Rango de edad al crear personaje |
| `RANGO_EDAD_NOVATO_MAX` | 21 | Techo de edad para el banco de eventos "novato" |
| `RANGO_EDAD_PROMEDIO_MAX` | 32 | Techo de edad para el banco "promedio" (arriba, "veterano") |
| `EJE_MAX` | 100 | Techo de la escala oculta de los 3 ejes de clasificación (fuerza/prestigio/economía) de cada club, liga y selección — el piso es 0, implícito en cada `clamp` |
| `PODER_PESO_FUERZA` / `_PRESTIGIO` / `_ECONOMIA` | 0.4 / 0.35 / 0.25 | Peso de cada eje al combinarlos en el "poder" único (OVR inicial, ventana de ofertas, objetivo) |
| `ECONOMIA_PISO_LIGA` | 0.6 | La economía de un club nunca cae debajo de este % de la de su propia liga |
| `VALOR_PESO_ECONOMIA` / `_PRESTIGIO` | 0.6 / 0.4 | Peso de economía vs. prestigio en el valor de mercado (no usa el eje fuerza) |
| `OVR_INICIAL_MIN` / `MAX` | 50 / 65 | Rango de OVR con el que puede arrancar un novato |
| `OVR_PESO_EQUIPO` / `OVR_PESO_LIGA` | 0.55 / 0.45 | Peso de club vs. liga al combinar sus "poder"/"valorScore" |
| `OVR_SUERTE_VARIACION` | ±4 | Variación aleatoria del OVR inicial |
| `VALOR_MERCADO_BASE` | 18000 | Valor de mercado en el piso absoluto de OVR |
| `VALOR_MERCADO_CRECIMIENTO` | 1.185 | Multiplicador de valor por cada punto extra de OVR |
| `VALOR_MULTIPLICADOR_CLUB_MIN` / `MAX` | 0.5 / 1.4 | Rango del multiplicador de valor según economía/prestigio combinados del club/liga |
| `OFERTA_VARIACION_VALOR` | ±8% | Variación cosmética del valor mostrado en cada oferta |
| `OFERTA_UMBRAL_CAIDA_VALOR` | 0.4 | Mínimo % de tu valor actual que debe ofrecerte un club para tener sentido |
| `OFERTA_TOP_ENCAJE_FRACCION` | 0.4 | % superior (por cercanía a tu poder objetivo) del que se sortean las ofertas |
| `OFERTA_TOLERANCIA_OVR` | 13 | Ancho de la "ventana de OVR" de cada club (±) |
| `CATEGORIA_EQUIPO_PERCENTIL` | humilde 0-50% / consolidado 50-85% / grande 85-100% | Percentiles de poder dentro de la liga, para las ofertas iniciales (sección 5) |
| `PESO_ESCALA_DISTANCIA` | 10 | Divisor que lleva la distancia de poder (0-100) a una escala chica antes del exponente |
| `PESO_DISTANCIA_LIGA` | 0.6 | Cuánto pesa desviarse en liga vs. en equipo al elegir ofertas |
| `PESO_EXPONENTE` | 2.2 | Qué tan fuerte castiga la distancia al poder objetivo |
| `PESO_FACTOR_SOBRAR` | 0.05 | Factor que aplica la distancia (en vez del 100%) cuando un club/liga "sobra" de poder en vez de quedar corto — ver [sección 16.6](#16-sistema-de-fichajes-y-ofertas) |
| `PROB_OFERTA_NOSTALGICA` | 0.3 | Probabilidad, por ventana, de que aparezca 1 oferta de "vuelta a casa" para un veterano cuyo país de origen ya no llega a su tier de poder |
| `EDAD_RETIRO_OFERTA` | 36 | Desde cuándo podés elegir retiro voluntario |
| `EDAD_RETIRO_FORZOSO_MIN` / `MAX` | 41 / 45 | Rango del que se sortea la edad de retiro forzoso (una vez por carrera) |
| `EDAD_RETIRO_TRANSICION` | 2 | Temporadas antes del retiro forzoso en las que el cupo de ofertas ya se reduce a 1 |
| `TALENTO_MIN` / `MAX` | 0.85 / 1.2 | Rango del multiplicador de talento oculto (sorteado una vez por carrera) sobre el ritmo de crecimiento de OVR |
| `TEMPORADAS_GRACIA_CONTRATO` | 2 | Temporadas de gracia antes de que tu club pueda "no renovarte" |
| `CONTRATO_RENDIMIENTO_SALVAVIDAS` | 7.5 | Promedio de rating de la temporada anterior que salva el contrato aunque el OVR no llegue a la ventana del club |
| `EDAD_POTENCIAL_BONUS_MAX` | 8 | Bono máx. de "potencial" para un jugador de 17 años |
| `EDAD_POTENCIAL_BONUS_HASTA` | 24 | Edad desde la que el bono de juventud llega a 0 |
| `EDAD_POTENCIAL_PENALIZACION_DESDE` | 30 | Edad desde la que empieza la penalización de potencial |
| `EDAD_POTENCIAL_PENALIZACION_TASA` | 0.7 | Penalización de potencial por año, desde esa edad |
| `EDAD_OCASO_RETORNO_PAIS` | 33 | Edad desde la que la garantía de "entorno" prioriza tu país en vez de tu liga |
| `TOTAL_TRAMOS_TEMPORADA` | 3 | Bloques de partidos simulados por temporada |
| `GRUPOS_POSICION` / `PROPENSION_GOL` / `PROPENSION_ASISTENCIA` | ver [sección 10](#10-estadísticas-del-tramo-goles-asistencias-mvp-rating) | Probabilidad base de gol/asistencia por posición (5 grupos: arquero/central/lateral/medio/ataque) |
| `ESTADISTICAS_OVR_BASE` / `_EXPONENTE` / `_RANGO` | 0.15 / 2.2 / 2.85 | Curva de escalado de estadísticas por OVR (factor 0.15 en el piso de carrera, 3.0 en el techo; punto neutral ×1 en ~OVR 75-78) |
| `PROB_SEGUNDO_GOL_FACTOR` / `_TERCER_GOL_FACTOR` | 0.4 / 0.18 | Probabilidad (relativa a `probGol`) de que un gol se convierta en doblete/hat-trick en el mismo partido |
| `PROBABILIDAD_MVP_BASE` | 0.09 | Probabilidad base de MVP por partido |
| `BONUS_MVP_POR_GOL` / `_ASISTENCIA` | 0.14 / 0.08 | Bono de probabilidad de MVP por cada gol / por asistencia en el partido |
| `BONUS_RATING_POR_GOL` / `_ASISTENCIA` | 0.7 / 0.4 | Bono de rating por cada gol / por asistencia en ese mismo partido |
| `OVR_TRAMO_BASE` | 0.7 | Crecimiento natural de OVR por tramo |
| `OVR_TRAMO_RENDIMIENTO_DIVISOR` | 6 | Cuánto divide el rendimiento acumulado antes de sumarse al crecimiento |
| `OVR_TRAMO_VARIACION_MIN` / `MAX` | −1 / +3 | Variación normal de OVR por tramo (sin declive por edad) |
| `OVR_TRAMO_DECLIVE_VARIACION_MIN` | −10 | Piso de variación por tramo una vez que el declive por edad ya actúa |
| `OVR_CARRERA_MIN` / `MAX` | 45 / 99 | Piso y techo absolutos de OVR durante la carrera |
| `OVR_EDAD_PRIME_MAX` | 28 | Hasta qué edad el crecimiento es pleno |
| `OVR_EDAD_DECLIVE_MAX` | 34 | Edad en la que el freno de crecimiento llega a su mínimo (fin de la meseta) |
| `OVR_EDAD_FACTOR_MIN` | 0.15 | Ritmo de crecimiento mínimo en el ocaso (nunca llega a cero del todo) |
| `OVR_EDAD_DECLIVE_INICIO` | 30 | Edad desde la que empieza el desgaste natural (superpuesto a la meseta) |
| `OVR_EDAD_ACELERA_DECLIVE` | 37 | Edad desde la que el desgaste se acelera |
| `OVR_EDAD_DECLIVE_TASA_BASE` / `_ACELERADA` | 0.06 / 0.22 | OVR perdido por tramo, por año, antes/después de acelerar |
| `TALENTO_MIN` / `MAX` | 0.85 / 1.2 | Multiplicador de talento oculto por carrera (acelera el crecimiento, atenúa el desgaste) |
| `POTENCIAL_TECHO_PROB_BAJO` / `_MEDIO` | 0.05 / 0.55 | Probabilidad de sortear un techo de potencial bajo (72-83) / medio (85-90) — el resto (40%) es alto (91-98) |
| `POTENCIAL_TECHO_FACTOR_MIN` | 0.08 | Fracción de lo que un tramo se pasaría del techo que se deja pasar igual |
| `FORMA_CALIDAD` | ver [sección 12](#12-estado-de-forma) | Calidad aportada por cada estado de forma a la fuerza de campaña |
| `FORMA_PESO_ACUMULACION` | 0.5 | Fracción del camino hacia el objetivo de forma que se recorre por decisión (ver [sección 12](#12-estado-de-forma)) |
| `PESO_TITULAR_INICIAL` | 0.4 | `pesoTitular` de arranque (novato o recién fichado) |
| `PESO_TITULAR_MIN` / `MAX` | 0.05 / 0.95 | Piso y techo de `pesoTitular` |
| `PESO_TITULAR_RATING_NEUTRO` | 6.5 | Rating de tramo que ni suma ni resta `pesoTitular` |
| `PESO_TITULAR_AJUSTE_RATING` | 0.05 | Sensibilidad del ajuste de `pesoTitular` al rating del tramo |
| `PESO_TITULAR_AJUSTE_MIN` / `MAX` | −0.08 / 0.12 | Rango del ajuste de `pesoTitular` por rendimiento en un tramo |
| `PESO_TITULAR_CASTIGO_SIN_MINUTOS` | −0.05 | Ajuste de `pesoTitular` si no jugaste ningún partido ese tramo |
| `PESO_TITULAR_CASTIGO_LESION` | −0.03 | Ajuste de `pesoTitular` si estuviste lesionado ese tramo |
| `FUERZA_PESO_CLUB` / `_FORMA` / `_EQUIPO_ACUMULADO` / `_RENDIMIENTO_JUGADOR` | 0.4 / 0.15 / 0.2 / 0.25 | Pesos de la fórmula de fuerza de campaña (el eje club usa solo `fuerza`, no el poder combinado) |
| `FUERZA_RENDIMIENTO_PROMEDIO_PISO` / `_RANGO` | 6.0 / 3.0 | Normaliza el promedio de rating del jugador a 0-1 para la fuerza de campaña |
| `PREMIOS_CANDIDATOS_N` | 24 | Candidatos fantasma generados por temporada para los premios mundiales — ver [sección 14.2](#14-sistema-de-competiciones-liga-copas-clasificación-internacional) |
| `PREMIOS_OVR_MIN` / `_MAX` | 82 / 99 | Rango de OVR (sesgado al centro) de los candidatos a premio |
| `PREMIOS_PESO_GRUPO` | ataque 55% / medio 25% / lateral 12% / central 8% | Reparto de grupo de posición entre los candidatos (nunca arquero) |
| `BALON_ORO_PESO_RATING` / `_GOLEADOR` / `_TROFEOS` | 0.4 / 0.35 / 0.25 | Pesos del puntaje combinado del Balón de Oro |
| `BALON_ORO_REFERENCIA_GOLES` | 40 | Goles + asistencias de una temporada de ensueño, para normalizar `calidadGoleador` a 0-1 |
| `ONCE_IDEAL_MARGEN_PROMEDIO` | 0.4 | Tolerancia contra el mejor promedio del pool en tu posición, para no depender del empate exacto en el tope de rating |
| `UMBRAL_CLASIFICA_PRIMER_NIVEL` / `_SEGUNDO_NIVEL` | 0.72 / 0.45 | Umbrales de fuerza para clasificar a competición internacional |
| `UMBRAL_OVR_CONVOCATORIA_BASE` / `_FACTOR` | 50 / 0.35 | Fórmula del OVR de referencia (50/50 de convocatoria) según la fuerza de tu selección — ver [sección 19](#19-selección-nacional) |
| `PROB_CONVOCATORIA_PENDIENTE_OVR` | 0.04 | Cuánto sube/baja la probabilidad de convocatoria por cada punto de OVR de diferencia con el umbral |
| `PROB_CONVOCATORIA_MIN` / `MAX` | 0.03 / 0.95 | Piso y techo de probabilidad de convocatoria |
| `SELECCION_PESO_JUGADOR` | 0.15 | Cuánto empuja tu forma del momento a la "calidad" de campaña de tu selección (el resto es la fuerza fija del país) |
| `PARTIDOS_AMISTOSO_SELECCION_MIN` / `_MAX` | 3 / 5 | Partidos de una ventana FIFA sin torneo grande en juego |
| `PARTIDOS_ELIMINATORIAS_MIN` / `_MAX` | 6 / 10 | Partidos de la campaña de eliminatorias, se clasifique o no |
| `PARTIDOS_FASE_DE_GRUPOS_SELECCION` | 3 | Partidos garantizados de fase de grupos, ya clasificado |
| `FORMA_BONUS_PARTICIPACION` | ver [sección 9](#9-participación-cuántos-partidos-jugás-vos) | Bono/malus de participación por estado de forma |
| `PARTICIPACION_BASE` | 0.65 | Probabilidad base de jugar un partido |
| `PARTICIPACION_BONUS_TITULAR` | 0.2 | Bono si sos titular ese tramo |
| `PARTICIPACION_OVR_REFERENCIA` | 55 | OVR de referencia (neutral) para la probabilidad de jugar |
| `PARTICIPACION_MIN` | 0.15 | Piso de probabilidad de jugar |
| `PETICION_NUMERO_BASE` / `_OVR_PESO` / `_EQUIPO_PESO` | 0.3 / 0.008 / 0.05 | Fórmula de aceptación de cambio de dorsal |
| `PROB_LESION_BASE` | 0.065 | Probabilidad base de lesión por pausa |
| `PROB_LESION_EDAD_INICIO` / `_INCREMENTO` | 30 / 0.0027 | Desde cuándo y cuánto sube el riesgo de lesión con la edad |
| `PROB_LESION_MAX` | 0.18 | Techo de probabilidad de lesión |
| `PESO_LESION_NIVEL1` / `_NIVEL2` | 0.10 / 0.35 | Probabilidad de que, si hay lesión, sea nivel 1 o nivel 2 (nivel 3 es el resto, ~0.55) |
| `LESION_NIVEL3_DURACION` | 1 | Duración fija de una lesión leve (en tramos) |
| `LESION_NIVEL2_DURACION_MIN/MAX` | 1 / 2 | Rango de duración de una lesión moderada |
| `LESION_NIVEL1_DURACION_MIN` | 2 | Mínimo de duración de una lesión grave (el máximo es el resto de la temporada) |
| `LESION_NIVEL2_OVR_MIN/MAX` | 1 / 3 | Rango de OVR perdido por una lesión moderada |
| `LESION_NIVEL1_OVR_MIN/MAX` | 4 / 10 | Rango de OVR perdido por una lesión grave |
| `LESION_RECUPERACION_OVR` | 0.5 | % del OVR perdido por lesión que se recupera al darte de alta |

---

## 25. Limitaciones conocidas y notas para el futuro

- **Sin guardado de partida**: es una decisión de diseño actual (juego de sesión única), no una limitación técnica — se podría agregar con `localStorage` guardando `temporadaActual`/`temporadasFinalizadas` serializados.
- **`dev/test.js` / `dev/test.html`** son una herramienta interna para inspeccionar la base de datos y la distribución de OVR inicial durante el desarrollo — no están enlazados desde ninguna pantalla del juego y pueden ignorarse (o borrarse) de cara a producción.
- **`pierna` hábil** se guarda pero no se usa en ninguna fórmula todavía — es puramente cosmético en la ficha/camiseta.
- Los números de partidos por competición ([sección 21](#21-base-de-datos-de-ligas-y-equipos-jsdatabasejs)) son una referencia realista, no oficiales fijos, para ligas/copas cuyo formato cambió seguido en la realidad (Argentina, México, Colombia) — están documentados caso por caso en los comentarios de `database.js`.
- 23 de los 46 países de la creación de personaje tienen liga propia cargada (subió de 5 con la incorporación de 19 ligas nuevas); el resto arranca "de extranjero" en las 5 grandes ligas europeas — es coherente con el diseño actual (documentado en [sección 5](#5-elección-de-club-inicial-equipohtml--jsequipojs)), no un bug, pero sigue siendo la superficie más obvia para sumar más ligas locales a futuro.
- **Rusia sigue cargada como confederación `UEFA`**, aunque sus clubes están suspendidos de las competiciones de UEFA desde 2022 — el juego no modela esa suspensión, así que un club ruso con la fuerza suficiente sí puede "clasificar" a la Champions/Europa League en la ficción del juego. Es una simplificación deliberada (no hay ningún mecanismo de "confederación con competiciones restringidas"), no un error de tipeo.
- **La Liga Premier de Ucrania quedó con 16 equipos** en vez de los 20 reales de esta temporada (ver [sección 21](#21-base-de-datos-de-ligas-y-equipos-jsdatabasejs)) — se prefirió no completarla con clubes inventados sin escudo real.
- **Turquía, Grecia, Rusia, China, El Salvador y Ucrania** tienen liga y equipos cargados pero todavía no son nacionalidades elegibles en la creación de personaje — se puede fichar por sus clubes durante la carrera, pero no arrancarla siendo local ahí.
- **AFC todavía no tiene copa continental de segundo nivel** (a diferencia de UEFA/CONMEBOL) — un club japonés o chino solo puede clasificar a la AFC Champions League Elite, nunca a un equivalente de la Europa League/Sudamericana.
- **CAF no tiene ninguna liga doméstica de club cargada** — solo existe como confederación de selecciones nacionales (para la Copa Africana de Naciones, [sección 19](#19-selección-nacional)); ningún club africano es fichable todavía.
