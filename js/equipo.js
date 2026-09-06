function loadDraftPlayer() {
  try {
    const raw = localStorage.getItem("leyendaPlayer");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function ligaDe(equipo) {
  return GameDatabase.ligas.find((l) => l.id === equipo.ligaId);
}

// Si el país elegido tiene liga propia en la base de datos, arranca ahí.
// Si no, arranca "de extranjero" en una de las 5 grandes ligas europeas,
// elegida al azar, con menos favores (banda más floja de niveles).
function elegirLigaInicial(pais) {
  const ligaLocal = GameDatabase.ligas.find((l) => l.pais === pais);
  if (ligaLocal) return { liga: ligaLocal, extranjero: false };

  const ligasGrandes = GameDatabase.ligas.filter((l) => GameConfig.LIGAS_GRANDES_EUROPEAS.includes(l.id));
  const pool = ligasGrandes.length > 0 ? ligasGrandes : GameDatabase.ligas;
  return { liga: GameConfig.randomFrom(pool), extranjero: true };
}

function generarOfertasInicialesParaJugador(pais) {
  const { liga, extranjero } = elegirLigaInicial(pais);
  const equiposLiga = GameDatabase.equipos.filter((e) => e.ligaId === liga.id);
  return extranjero
    ? GameConfig.generarOfertasInicialesExtranjero(equiposLiga)
    : GameConfig.generarOfertasIniciales(equiposLiga);
}

const player = loadDraftPlayer();

if (!player) {
  // No hay identidad creada todavía: volvemos al primer paso.
  window.location.href = "index.html";
} else {
  const ofertas = generarOfertasInicialesParaJugador(player.pais);
  const grid = document.getElementById("offersGrid");
  const toast = document.getElementById("toast");

  function renderOfertas() {
    grid.innerHTML = "";

    ofertas.forEach((equipo, idx) => {
      const liga = ligaDe(equipo);
      const card = document.createElement("article");
      card.className = "offer-card";
      card.innerHTML = `
        <div class="offer-card__top">
          ${GameConfig.crestHtml(equipo, "offer-card__crest")}
          <div>
            <div class="offer-card__name">${equipo.nombre}</div>
            <div class="offer-card__league">
              ${GameConfig.ligaCrestHtml(liga, "team-crest team-crest--xs")}
              <span>${liga.nombre}</span>
              ${GameConfig.flagHtml(liga.paisCode, "offer-card__flag flag-img", liga.paisFlag)}
            </div>
          </div>
        </div>
        <button type="button" class="offer-card__cta" data-idx="${idx}">Elegir este club</button>
      `;
      grid.appendChild(card);
    });

    grid.querySelectorAll(".offer-card__cta").forEach((btn) => {
      btn.addEventListener("click", () => elegirEquipo(Number(btn.dataset.idx)));
    });
  }

  function elegirEquipo(idx) {
    grid.querySelectorAll(".offer-card__cta").forEach((b) => (b.disabled = true));

    const equipo = ofertas[idx];
    const liga = ligaDe(equipo);
    const ovrInicial = GameConfig.calcularOvrInicial(equipo.nivel, liga.nivel);

    const jugador = { ...player, equipoId: equipo.id, ovrInicial };
    localStorage.setItem("leyendaPlayer", JSON.stringify(jugador));

    showToast(`Fichaste por ${equipo.nombre}. OVR inicial: ${ovrInicial}.`);
    setTimeout(() => { window.location.href = "carrera.html"; }, 900);
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("toast--visible");
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove("toast--visible"), 3200);
  }

  renderOfertas();
  document.getElementById("appFooter").textContent = GameConfig.footerHtml();
}
