// `code`: código ISO 3166-1 alpha-2 (o subdivisión de Reino Unido), usado
// para pedir la imagen real de la bandera — Windows no dibuja los emoji
// de bandera de país, así que `flag` queda solo como respaldo de texto.
const COUNTRIES = [
  { name: "Argentina", code: "ar", flag: "🇦🇷" },
  { name: "Brasil", code: "br", flag: "🇧🇷" },
  { name: "Uruguay", code: "uy", flag: "🇺🇾" },
  { name: "Chile", code: "cl", flag: "🇨🇱" },
  { name: "Colombia", code: "co", flag: "🇨🇴" },
  { name: "Paraguay", code: "py", flag: "🇵🇾" },
  { name: "Perú", code: "pe", flag: "🇵🇪" },
  { name: "Bolivia", code: "bo", flag: "🇧🇴" },
  { name: "Ecuador", code: "ec", flag: "🇪🇨" },
  { name: "Venezuela", code: "ve", flag: "🇻🇪" },
  { name: "México", code: "mx", flag: "🇲🇽" },
  { name: "Estados Unidos", code: "us", flag: "🇺🇸" },
  { name: "Costa Rica", code: "cr", flag: "🇨🇷" },
  { name: "Panamá", code: "pa", flag: "🇵🇦" },
  { name: "Jamaica", code: "jm", flag: "🇯🇲" },
  { name: "España", code: "es", flag: "🇪🇸" },
  { name: "Portugal", code: "pt", flag: "🇵🇹" },
  { name: "Francia", code: "fr", flag: "🇫🇷" },
  { name: "Inglaterra", code: "gb-eng", flag: "🏴" },
  { name: "Italia", code: "it", flag: "🇮🇹" },
  { name: "Alemania", code: "de", flag: "🇩🇪" },
  { name: "Bélgica", code: "be", flag: "🇧🇪" },
  { name: "Países Bajos", code: "nl", flag: "🇳🇱" },
  { name: "Croacia", code: "hr", flag: "🇭🇷" },
  { name: "Polonia", code: "pl", flag: "🇵🇱" },
  { name: "Suiza", code: "ch", flag: "🇨🇭" },
  { name: "Serbia", code: "rs", flag: "🇷🇸" },
  { name: "Dinamarca", code: "dk", flag: "🇩🇰" },
  { name: "Suecia", code: "se", flag: "🇸🇪" },
  { name: "Noruega", code: "no", flag: "🇳🇴" },
  { name: "Gales", code: "gb-wls", flag: "🏴" },
  { name: "Escocia", code: "gb-sct", flag: "🏴" },
  { name: "Marruecos", code: "ma", flag: "🇲🇦" },
  { name: "Senegal", code: "sn", flag: "🇸🇳" },
  { name: "Nigeria", code: "ng", flag: "🇳🇬" },
  { name: "Ghana", code: "gh", flag: "🇬🇭" },
  { name: "Camerún", code: "cm", flag: "🇨🇲" },
  { name: "Argelia", code: "dz", flag: "🇩🇿" },
  { name: "Egipto", code: "eg", flag: "🇪🇬" },
  { name: "Japón", code: "jp", flag: "🇯🇵" },
  { name: "Corea del Sur", code: "kr", flag: "🇰🇷" },
  { name: "Arabia Saudita", code: "sa", flag: "🇸🇦" },
  { name: "Catar", code: "qa", flag: "🇶🇦" },
  { name: "Irán", code: "ir", flag: "🇮🇷" },
  { name: "Australia", code: "au", flag: "🇦🇺" },
  { name: "Canadá", code: "ca", flag: "🇨🇦" },
];

const state = {
  apellido: "",
  // El dorso no se elige al crear el personaje: te lo asigna el club al
  // debutar. Recién a partir del cierre de temporada se puede pedir un
  // cambio (ver carrera.js), y el club lo acepta o no según cómo vengas.
  numero: GameConfig.randomInt(1, 99),
  edad: GameConfig.EDAD_MIN,
  pierna: "derecha",
  pais: null,
  posicion: null,
};

// ---------- IDENTIDAD ----------
const inputApellido = document.getElementById("inputApellido");
const jerseyName = document.getElementById("jerseyName");
const jerseyNumber = document.getElementById("jerseyNumber");
jerseyNumber.textContent = state.numero;

inputApellido.addEventListener("input", () => {
  const value = inputApellido.value.toUpperCase();
  state.apellido = value.trim();
  jerseyName.textContent = state.apellido || "APELLIDO";
  refresh();
});

const cardAge = document.getElementById("cardAge");
const agePicker = document.getElementById("agePicker");
for (let edad = GameConfig.EDAD_MIN; edad <= GameConfig.EDAD_MAX; edad++) {
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "age-card" + (edad === state.edad ? " age-card--active" : "");
  btn.textContent = edad;
  btn.dataset.edad = edad;
  agePicker.appendChild(btn);
}
cardAge.textContent = `${state.edad} años`;

agePicker.addEventListener("click", (e) => {
  const btn = e.target.closest(".age-card");
  if (!btn) return;
  state.edad = Number(btn.dataset.edad);
  agePicker.querySelectorAll(".age-card").forEach((b) =>
    b.classList.toggle("age-card--active", b === btn)
  );
  cardAge.textContent = `${state.edad} años`;
  refresh();
});

document.getElementById("toggleLegs").addEventListener("click", (e) => {
  const btn = e.target.closest(".toggle__btn");
  if (!btn) return;
  state.pierna = btn.dataset.leg;
  document.querySelectorAll("#toggleLegs .toggle__btn").forEach((b) =>
    b.classList.toggle("toggle__btn--active", b === btn)
  );
});

// ---------- NACIONALIDAD ----------
const countryList = document.getElementById("countryList");
const searchCountry = document.getElementById("searchCountry");
const cardFlag = document.getElementById("cardFlag");
const cardCountryName = document.getElementById("cardCountryName");

function renderCountries(filter = "") {
  const q = filter.trim().toLowerCase();
  const filtered = COUNTRIES.filter((c) => c.name.toLowerCase().includes(q));
  countryList.innerHTML = "";

  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "country-chip__empty";
    empty.textContent = "No se encontraron países";
    countryList.appendChild(empty);
    return;
  }

  filtered.forEach((c) => {
    const chip = document.createElement("div");
    chip.className = "country-chip";
    chip.classList.toggle("country-chip--active", state.pais === c.name);
    chip.innerHTML = `${GameConfig.flagHtml(c.code, "country-chip__flag flag-img", c.flag)}<span>${c.name}</span>`;
    chip.addEventListener("click", () => {
      state.pais = c.name;
      cardFlag.innerHTML = GameConfig.flagHtml(c.code, "player-card__flag flag-img flag-img--lg", c.flag);
      cardCountryName.textContent = c.name;
      renderCountries(searchCountry.value);
      refresh();
    });
    countryList.appendChild(chip);
  });
}

searchCountry.addEventListener("input", () => renderCountries(searchCountry.value));
renderCountries();

// ---------- POSICION ----------
const posHint = document.getElementById("posHint");
const cardPos = document.getElementById("cardPos");
const cardPosName = document.getElementById("cardPosName");
document.querySelectorAll(".pos-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.posicion = btn.dataset.pos;
    document.querySelectorAll(".pos-btn").forEach((b) =>
      b.classList.toggle("pos-btn--active", b === btn)
    );
    posHint.textContent = `Posición elegida: ${btn.dataset.label} (${btn.dataset.pos})`;
    cardPos.textContent = btn.dataset.pos;
    cardPosName.textContent = btn.dataset.label;
    refresh();
  });
});

// ---------- ACORDEÓN DE PASOS ----------
// Colapsa el paso ya resuelto y expande el siguiente, para que en móvil
// (ver CSS) el registro no sea una fila larga de 3 secciones abiertas a
// la vez. En desktop esto no tiene efecto visual — siempre se ven las 3.
const STEP_ORDER = ["identidad", "nacionalidad", "posicion"];
let pasoAbierto = "identidad";
const pasoCompletadoAntes = { identidad: false, nacionalidad: false, posicion: false };

function actualizarAcordeon() {
  STEP_ORDER.forEach((key) => {
    document.getElementById(`card-${key}`).classList.toggle("flow-step--collapsed", key !== pasoAbierto);
  });
}

// Al avanzar de paso en móvil, el siguiente se expande pero puede quedar
// más abajo de lo que se ve en pantalla — lo llevamos a la vista solo.
// En desktop los 3 pasos ya están siempre abiertos y visibles, así que
// no hace falta (y sería un scroll molesto sin motivo).
function enfocarPasoSiMovil(key) {
  if (!key || !window.matchMedia("(max-width: 900px)").matches) return;
  document.getElementById(`card-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

// Si el paso que el usuario tiene abierto se acaba de completar, pasa
// solo al siguiente sin resolver — pero si reabre uno ya completado para
// editarlo, no lo cierra de golpe mientras lo sigue tocando.
function avanzarSiCorresponde(key, ok) {
  if (ok && !pasoCompletadoAntes[key] && pasoAbierto === key) {
    pasoAbierto = STEP_ORDER[STEP_ORDER.indexOf(key) + 1] ?? null;
  }
  pasoCompletadoAntes[key] = ok;
}

document.querySelectorAll(".flow-step__header").forEach((header) => {
  const key = header.querySelector(".step").dataset.step;
  header.addEventListener("click", () => {
    pasoAbierto = pasoAbierto === key ? null : key;
    actualizarAcordeon();
  });
});

const summaryIdentidad = document.getElementById("summaryIdentidad");
const summaryNacionalidad = document.getElementById("summaryNacionalidad");
const summaryPosicion = document.getElementById("summaryPosicion");

function actualizarResumenesPasos(identidadOk, paisOk, posOk) {
  summaryIdentidad.textContent = identidadOk ? `${state.apellido} #${state.numero}` : "";
  summaryNacionalidad.textContent = paisOk ? state.pais : "";
  summaryPosicion.textContent = posOk ? state.posicion : "";
}

// ---------- VALIDACION + RESUMEN ----------
const summaryText = document.getElementById("summaryText");
const startBtn = document.getElementById("startBtn");
const toast = document.getElementById("toast");

function refresh() {
  const identidadOk = state.apellido.length > 0 && state.numero !== "" && state.numero >= 1
    && state.edad !== "" && state.edad >= GameConfig.EDAD_MIN && state.edad <= GameConfig.EDAD_MAX;
  const paisOk = !!state.pais;
  const posOk = !!state.posicion;

  setStepState("identidad", identidadOk);
  setStepState("nacionalidad", paisOk);
  setStepState("posicion", posOk);

  const pasoAntesDeAvanzar = pasoAbierto;
  avanzarSiCorresponde("identidad", identidadOk);
  avanzarSiCorresponde("nacionalidad", paisOk);
  avanzarSiCorresponde("posicion", posOk);
  actualizarAcordeon();
  actualizarResumenesPasos(identidadOk, paisOk, posOk);
  if (pasoAbierto !== pasoAntesDeAvanzar) enfocarPasoSiMovil(pasoAbierto);

  const allOk = identidadOk && paisOk && posOk;
  startBtn.disabled = !allOk;

  if (allOk) {
    const flag = COUNTRIES.find((c) => c.name === state.pais)?.flag ?? "";
    summaryText.textContent = `${state.apellido} #${state.numero} · ${flag} ${state.pais} · ${state.posicion}`;
  } else {
    const missing = [];
    if (!identidadOk) missing.push("identidad");
    if (!paisOk) missing.push("nacionalidad");
    if (!posOk) missing.push("posición");
    summaryText.textContent = `Falta completar: ${missing.join(", ")}`;
  }
}

function setStepState(key, done) {
  const step = document.querySelector(`.step[data-step="${key}"]`);
  const card = document.getElementById(`card-${key}`);
  const dot = document.querySelector(`.progress-dot[data-progress="${key}"]`);
  step.classList.toggle("step--done", done);
  step.textContent = done ? "✓" : { identidad: "1", nacionalidad: "2", posicion: "3" }[key];
  card.classList.toggle("card--done", done);
  dot.classList.toggle("progress-dot--done", done);
}

startBtn.addEventListener("click", () => {
  if (startBtn.disabled) return;
  const paisElegido = COUNTRIES.find((c) => c.name === state.pais);
  localStorage.setItem(
    "leyendaPlayer",
    JSON.stringify({
      apellido: state.apellido,
      numero: state.numero,
      pierna: state.pierna,
      edad: state.edad,
      pais: state.pais,
      flag: paisElegido?.flag ?? "",
      paisCode: paisElegido?.code ?? "",
      posicion: state.posicion,
    })
  );
  showToast(`¡Bienvenido, ${state.apellido}! Ahora elige tu primer equipo.`);
  setTimeout(() => { window.location.href = "equipo.html"; }, 900);
});

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("toast--visible");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => toast.classList.remove("toast--visible"), 3200);
}

refresh();
document.getElementById("appFooter").textContent = GameConfig.footerHtml();
