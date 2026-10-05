// Isolated cursor study using the already captured local DEMO card.
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const root = import.meta.dirname;
const source = await readFile(resolve(root, 'index.html'), 'utf8');
const original = source.match(/<article class="vehicle[^"]*"[\s\S]*?<\/article>/)?.[0];
if (!original?.includes('Vento')) throw new Error('Expected captured Vento DEMO card.');
const variants = [
  ['A', 'Speed Trace', 'Dos trazos finos acompañan la velocidad y desaparecen al detenerte.'],
  ['B', 'Encuadre abierto', 'Dos esquinas pequeñas se abren al entrar y se cierran al presionar.'],
  ['C', 'Faceta táctil', 'Una pieza mínima de dos caras responde con una flexión contenida.'],
];
const cards = variants.map(([letter, name, description]) => {
  const card = original.replace(/class="vehicle[^"]*"/, 'class="vehicle variant-b cursor-card"')
    .replace(/data-variant="[^"]*"/, 'data-cursor="' + letter + '"');
  return '<section class="concept" data-concept="' + letter + '" aria-labelledby="cursor-title-' + letter + '"><div class="concept-heading"><span class="concept-letter">' + letter + '</span><h2 id="cursor-title-' + letter + '">' + name + '</h2></div>' + card + '<p class="concept-description">' + description + '</p></section>';
}).join('\n');
const template = await readFile(resolve(root, 'cursors-template.html'), 'utf8');
await writeFile(resolve(root, 'cursors.html'), template.replace('<!-- CARDS -->', cards));
console.log('Three cursor demos generated; common card interaction B, production untouched.');
