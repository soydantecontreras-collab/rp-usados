// Presentation-only transforms. Never imported by WordPress or the theme build.
import assert from 'node:assert/strict';

const patterns = { landscape:[1200,800], portrait:[720,1280], square:[900,900], wide:[1600,900] };
export const ownerPlaceholders = new Map(Object.entries(patterns).map(([name,[width,height]]) => [
  `wp-content/uploads/owner-presentation/${name}.svg`,
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><pattern id="grid" width="100" height="100" patternUnits="userSpaceOnUse"><path d="M100 0H0V100" fill="none" stroke="#555959" stroke-width="1"/></pattern></defs><path fill="#303434" d="M0 0H${width}V${height}H0Z"/><path fill="url(#grid)" d="M0 0H${width}V${height}H0Z"/><rect x="27" y="27" width="${width-54}" height="${height-54}" fill="none" stroke="#ba8b61" stroke-width="6"/></svg>`,
]));
const attr = text => text.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');

export function prepareOwnerPresentation(html, route, { whatsapp, origin }) {
  assert(/^\d{8,15}$/.test(whatsapp), 'Supply the confirmed WhatsApp in international digits.');
  assert(/^https:\/\/[a-z0-9-]+\.vercel\.app$/.test(origin), 'Supply a dedicated HTTPS preview alias.');
  html = html.replace(/<aside\b[^>]*aria-label="Datos de prueba"[^>]*>[\s\S]*?<\/aside>/g, '');
  html = html.replace(/<p>DEMO VISUAL \/ DATOS DE DESARROLLO\.[\s\S]*?<\/p>/g, '');
  html = html.replace(/<div class="prose">\s*<\/div>/g, '');
  html = html.replace(/DEMO VISUAL — /g, '').replace(/ · DEMO(?: VISUAL)?/g, '');
  html = html.replace(/ &#8211; No es stock real/g, '');
  html = html.replace(/Fotografía o patrón de prueba [^"<>]+ — NO ES STOCK REAL/g, 'Imagen');
  html = html.replace(/\/wp-content\/uploads\/\d{4}\/\d{2}\/demo-(landscape|portrait|square|wide)(?:-\d+x\d+)?\.png/g,
    (_, name) => `/wp-content/uploads/owner-presentation/${name}.svg`);

  const unit = html.match(/<h1\b[^>]*id="unit-title"[^>]*>([^<]+)<\/h1>/)?.[1];
  const message = unit ? `Hola, quiero consultar por esta unidad.\n${unit}\n${origin}${route}` : 'Hola, quiero consultar con RP Usados.';
  const contact = `https://wa.me/${whatsapp}?text=${encodeURIComponent(message)}`;
  html = html.replace(/<a\b[^>]*data-contact-pending[^>]*>/g, tag => tag.replace(/href="[^"]*"/, `href="${attr(contact)}"`).replace(/\sdata-contact-pending/g, ''));
  html = html.replace(/<p class="pending">WhatsApp: [\s\S]*?<\/p>/g, '');
  html = html.replace(/<section id="contacto-pendiente"[\s\S]*?<\/section>/g, '');
  assert(!/DEMO VISUAL|NO ES STOCK|DATOS DE DESARROLLO|CONTENIDO DE PRUEBA| · DEMO|data-contact-pending|#contacto-pendiente/.test(html), `Presentation label/contact leak: ${route}`);
  return html;
}
