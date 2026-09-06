const fs = require('fs');
const body = fs.readFileSync(__dirname + '/readme_body.html', 'utf8');

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Leyenda — Documentación técnica</title>
<style>
  @page { size: A4; margin: 22mm 18mm 20mm; }
  * { box-sizing: border-box; }
  body {
    font-family: "Segoe UI", -apple-system, Helvetica, Arial, sans-serif;
    color: #1a1f2e;
    font-size: 10.5pt;
    line-height: 1.55;
    max-width: 100%;
  }
  .cover {
    padding: 60mm 0 30mm;
    text-align: center;
    page-break-after: always;
  }
  .cover__badge {
    display: inline-block;
    font-size: 60pt;
    margin-bottom: 12mm;
  }
  .cover h1 {
    font-size: 40pt;
    margin: 0 0 4mm;
    letter-spacing: 0.02em;
    color: #16326b;
  }
  .cover__sub {
    font-size: 15pt;
    color: #555;
    margin: 0 0 30mm;
  }
  .cover__meta {
    display: inline-block;
    text-align: left;
    border-top: 2px solid #ffb703;
    padding-top: 6mm;
    font-size: 11pt;
    color: #444;
  }
  .cover__meta div { margin-bottom: 2mm; }
  h1 { font-size: 22pt; color: #16326b; border-bottom: 3px solid #ffb703; padding-bottom: 3mm; }
  h2 {
    font-size: 15pt;
    color: #16326b;
    margin-top: 14mm;
    padding-top: 4mm;
    border-top: 1px solid #dde3ee;
    page-break-before: always;
  }
  h2:first-of-type, .cover + h2 { page-break-before: avoid; }
  h3 { font-size: 12pt; color: #1e3a70; margin-top: 8mm; }
  a { color: #b8710a; text-decoration: none; }
  code {
    font-family: "Cascadia Code", "Consolas", "SFMono-Regular", monospace;
    background: #f1f3f8;
    padding: 0.1em 0.35em;
    border-radius: 4px;
    font-size: 0.92em;
    color: #7a3e00;
  }
  pre {
    background: #14182a;
    color: #e8ecf8;
    padding: 4mm 5mm;
    border-radius: 6px;
    font-size: 8.3pt;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
  }
  pre code { background: none; color: inherit; padding: 0; }
  blockquote {
    border-left: 4px solid #ffb703;
    background: #fff8e8;
    margin: 5mm 0;
    padding: 3mm 5mm;
    color: #4a4530;
    font-size: 9.8pt;
  }
  blockquote p { margin: 0; }
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 5mm 0;
    font-size: 9.3pt;
  }
  th, td {
    border: 1px solid #d7dce6;
    padding: 2mm 3mm;
    text-align: left;
    vertical-align: top;
  }
  th { background: #16326b; color: #fff; }
  tr:nth-child(even) td { background: #f5f7fb; }
  ul, ol { padding-left: 6mm; }
  li { margin-bottom: 1.2mm; }
  hr { border: none; border-top: 1px solid #dde3ee; margin: 8mm 0; }
  strong { color: #16326b; }
</style>
</head>
<body>

<div class="cover">
  <div class="cover__badge">⚽</div>
  <h1>LEYENDA</h1>
  <p class="cover__sub">Documentación técnica completa del proyecto</p>
  <div class="cover__meta">
    <div><strong>Versión:</strong> 0.3.0-alpha — publicada el 6 de septiembre de 2026</div>
    <div><strong>Alcance:</strong> Cada fórmula, cada constante y dónde vive cada pieza en el código</div>
    <div><strong>Motor:</strong> HTML / CSS / JavaScript vanilla, sin dependencias ni build</div>
  </div>
</div>

${body}

</body>
</html>
`;

fs.writeFileSync(__dirname + '/readme_final.html', html, 'utf8');
console.log('Wrote readme_final.html');
