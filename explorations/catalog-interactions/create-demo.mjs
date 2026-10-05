// Read-only snapshot of one existing local DEMO card. Does not edit WordPress or theme.
import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { resolve, basename } from 'node:path';
const directory = import.meta.dirname;
const repo = resolve(directory, '../..');
const source = 'http://127.0.0.1:9470';
const response = await fetch(source + '/vehiculos/');
if (!response.ok) throw new Error('Local DEMO catalog is not available.');
const html = await response.text();
let card = html.match(/<article class="vehicle"[\s\S]*?<\/article>/)?.[0];
if (!card || !card.includes('Vento') || !card.includes('DEMO')) throw new Error('Expected labelled Vento DEMO card.');
if (card.includes('vehicle-price') || card.includes('vehicle-arrow')) throw new Error('Unexpected card presentation.');
await mkdir(resolve(directory, 'assets'), { recursive: true });
const images = [...new Set([...card.matchAll(/https?:\/\/[^"' ,<>]+\/demo-[^"' ,<>]+\.(?:jpg|png|webp)/g)].map(match => match[0]))];
for (const url of images) {
  const file = basename(new URL(url).pathname);
  const image = await fetch(url);
  if (!image.ok) throw new Error('Missing existing cover ' + url);
  await writeFile(resolve(directory, 'assets', file), Buffer.from(await image.arrayBuffer()));
  card = card.replaceAll(url, './assets/' + file);
}
card = card.replace(/sizes="[^"]*"/g, 'sizes="(max-width: 900px) 90vw, 720px"');
card = card.replace(/<a class="vehicle-link"/, '<a class="vehicle-link" target="_blank" rel="noopener"');
const concepts = [
  ['A', 'Tensión de bastidor', 'La foto responde al puntero. El texto permanece firme.'],
  ['B', 'Cambio de plano editorial', 'La imagen y el panel se acomodan al entrar y salir.'],
  ['C', 'Luz rasante', 'Una franja tenue recorre únicamente la fotografía.'],
];
const cards = concepts.map(([letter, name, description]) => {
  let markup = card.replace('class="vehicle"', 'class="vehicle variant-' + letter.toLowerCase() + '" data-variant="' + letter + '"');
  if (letter === 'C') markup = markup.replace(/(<div class="vehicle-media">)/, '$1<span class="light-band" aria-hidden="true"></span>');
  return '<section class="concept" data-concept="' + letter + '" aria-labelledby="title-' + letter + '"><div class="concept-heading"><span class="concept-letter">' + letter + '</span><h2 id="title-' + letter + '">' + name + '</h2></div>' + markup + '<p class="concept-description">' + description + '</p></section>';
}).join('\n');
let page = await readFile(resolve(directory, 'template.html'), 'utf8');
page = page.replace('<!-- CARDS -->', cards);
await writeFile(resolve(directory, 'index.html'), page);
for (const font of ['manrope', 'archivo']) await copyFile(resolve(repo, 'theme/rp-usados/src/fonts/' + font + '.woff2'), resolve(directory, 'assets/' + font + '.woff2'));
await writeFile(resolve(directory, 'source.json'), JSON.stringify({ source: source + '/vehiculos/', captured: new Date().toISOString(), unit: 'Volkswagen Vento · DEMO', covers: images.map(url => basename(new URL(url).pathname)), purpose: 'Local isolated interaction comparison. Not real stock.' }, null, 2));
console.log('Sandbox prepared from current local Vento DEMO card; ' + images.length + ' existing cover variants.');
