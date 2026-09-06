const fs = require('fs');
const body = fs.readFileSync(__dirname + '/manual_body.html', 'utf8');

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Leyenda — Manual de Juego</title>
<style>
  @page { size: A4; margin: 20mm 18mm 20mm; }
  * { box-sizing: border-box; }
  * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body {
    font-family: "Segoe UI", -apple-system, Helvetica, Arial, sans-serif;
    background: #0d1120;
    color: #eef1fb;
    font-size: 10.5pt;
    line-height: 1.6;
  }
  .cover {
    background: radial-gradient(circle at 30% 20%, #24304f 0%, #0d1120 60%);
    padding: 60mm 10mm 30mm;
    text-align: center;
    page-break-after: always;
    border-radius: 4mm;
  }
  .cover__badge { font-size: 60pt; margin-bottom: 10mm; }
  .cover h1 {
    font-size: 46pt;
    margin: 0 0 4mm;
    letter-spacing: 0.03em;
    color: #ffb703;
    font-weight: 900;
  }
  .cover__sub { font-size: 15pt; color: #c8cfe6; margin: 0 0 6mm; }
  .cover__badge2 {
    display: inline-block;
    font-size: 9pt;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: #1a1300;
    background: #ffb703;
    padding: 2mm 6mm;
    border-radius: 999px;
    margin-bottom: 30mm;
  }
  .cover__meta {
    display: inline-block;
    text-align: left;
    border-top: 2px solid #22d3ee;
    padding-top: 6mm;
    font-size: 10.5pt;
    color: #c8cfe6;
  }
  .cover__meta div { margin-bottom: 2mm; }
  h1 { font-size: 20pt; color: #ffb703; }
  h2 {
    font-size: 15pt;
    color: #ffb703;
    margin-top: 12mm;
    padding: 4mm 0 3mm;
    border-bottom: 2px solid #2a3355;
    page-break-before: always;
  }
  h2:first-of-type { page-break-before: avoid; }
  h3 { font-size: 12pt; color: #22d3ee; margin-top: 8mm; }
  p { color: #dbe0f2; }
  a { color: #22d3ee; text-decoration: none; }
  strong { color: #ffb703; }
  code {
    font-family: "Cascadia Code", "Consolas", monospace;
    background: #1c2440;
    color: #ffd166;
    padding: 0.1em 0.4em;
    border-radius: 4px;
    font-size: 0.9em;
  }
  blockquote {
    border-left: 4px solid #22d3ee;
    background: #131a2e;
    margin: 5mm 0;
    padding: 3mm 5mm;
    color: #c8cfe6;
    font-size: 9.8pt;
  }
  blockquote p { margin: 0; color: #c8cfe6; }
  ul, ol { padding-left: 6mm; }
  li { margin-bottom: 1.6mm; color: #dbe0f2; }
  li::marker { color: #ffb703; }
  hr { border: none; border-top: 1px solid #2a3355; margin: 8mm 0; }
</style>
</head>
<body>

<div class="cover">
  <div class="cover__badge">🏆</div>
  <h1>LEYENDA</h1>
  <p class="cover__sub">Manual de Juego</p>
  <div class="cover__badge2">Beta 2 · primera versión pública</div>
  <br>
  <div class="cover__meta">
    <div>Cómo se comporta el juego, explicado desde el lado del jugador</div>
    <div>Sin fórmulas, sin números ocultos — lo que necesitás saber para jugar</div>
  </div>
</div>

${body}

</body>
</html>
`;

fs.writeFileSync(__dirname + '/manual_final.html', html, 'utf8');
console.log('Wrote manual_final.html');
