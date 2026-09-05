function ligaDe(equipo) {
  return GameDatabase.ligas.find((l) => l.id === equipo.ligaId);
}

function renderDbTable() {
  const table = document.getElementById("dbTable");
  const rows = GameDatabase.equipos.map((eq) => {
    const liga = ligaDe(eq);
    return `<tr>
      <td>${eq.nombre}</td>
      <td>Nivel ${eq.nivel}</td>
      <td>${liga.nombre}</td>
      <td>Nivel ${liga.nivel}</td>
    </tr>`;
  }).join("");
  table.innerHTML = `<tr><th>Equipo</th><th>Nivel equipo</th><th>Liga</th><th>Nivel liga</th></tr>${rows}`;
}

function renderOfertas() {
  const ofertas = GameConfig.generarOfertasIniciales(GameDatabase.equipos);
  const table = document.getElementById("ofertasTable");
  const rows = ofertas.map((eq) => {
    const liga = ligaDe(eq);
    const ovr = GameConfig.calcularOvrInicial(eq.nivel, liga.nivel);
    return `<tr>
      <td>${eq.nombre}</td>
      <td>Nivel ${eq.nivel}</td>
      <td>${liga.nombre} (Nivel ${liga.nivel})</td>
      <td class="ovr-cell">${ovr}</td>
    </tr>`;
  }).join("");
  table.innerHTML = `<tr><th>Equipo ofrecido</th><th>Nivel equipo</th><th>Liga</th><th>OVR si lo eliges</th></tr>${rows}`;
}

function simularDistribucion() {
  const N = 200;
  const container = document.getElementById("simResults");
  container.innerHTML = "";

  GameDatabase.equipos.forEach((eq) => {
    const liga = ligaDe(eq);
    const valores = [];
    for (let i = 0; i < N; i++) {
      valores.push(GameConfig.calcularOvrInicial(eq.nivel, liga.nivel));
    }
    const min = Math.min(...valores);
    const max = Math.max(...valores);
    const avg = (valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(1);

    const row = document.createElement("div");
    row.className = "stats-row";
    row.innerHTML = `
      <span>${eq.nombre} · equipo nivel ${eq.nivel} · ${liga.nombre} nivel ${liga.nivel}</span>
      <span>mín <b>${min}</b> · máx <b>${max}</b> · promedio <b>${avg}</b></span>
    `;
    container.appendChild(row);
  });
}

document.getElementById("ovrMinLabel").textContent = GameConfig.OVR_INICIAL_MIN;
document.getElementById("ovrMaxLabel").textContent = GameConfig.OVR_INICIAL_MAX;

renderDbTable();
renderOfertas();

document.getElementById("btnGenerarOfertas").addEventListener("click", renderOfertas);
document.getElementById("btnSimular").addEventListener("click", simularDistribucion);
