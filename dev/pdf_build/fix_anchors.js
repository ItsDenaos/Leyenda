const fs = require('fs');
const path = process.argv[2];
let html = fs.readFileSync(path, 'utf8');

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}

// Find numbered h2 headings (start with a digit + ".") and assign ids in order.
const h2Regex = /<h2>(\d+\..*?)<\/h2>/g;
const ids = [];
html = html.replace(h2Regex, (match, text) => {
  const slug = slugify(text);
  ids.push(slug);
  return `<h2 id="${slug}">${text}</h2>`;
});

// Rewrite the TOC anchors (in <ol>...<li><a href="#...">) in document order to match.
let i = 0;
html = html.replace(/<a href="#[^"]*">/g, () => {
  const id = ids[i] !== undefined ? ids[i] : '';
  i++;
  return `<a href="#${id}">`;
});

fs.writeFileSync(path, html, 'utf8');
console.log(`Fixed ${ids.length} heading anchors.`);
