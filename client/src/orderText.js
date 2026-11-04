import { money } from './utils.js';

// list separator per language (Arabic uses its own comma)
export const SEP = { he: ', ', ar: '، ' };

// Everything here is built from { he, ar } objects with `tr`, so the WhatsApp message
// is written in whatever language the visitor is using right now.

/** chosen = [{ group: {he,ar}, items: [{ name: {he,ar}, price }] }] */
export function optionsTotal(chosen = []) {
  return chosen.reduce((s, g) => s + g.items.reduce((a, o) => a + (Number(o.price) || 0), 0), 0);
}

/** Short group name with an emoji for the WhatsApp message:
 *  "בחר את המשקה" -> "🥤 משקה", "החצי הראשון" -> "🍕 החצי הראשון", others -> "➕ ..." */
export function groupLabel(group, tr) {
  const raw = tr(group).trim();
  const he = group?.he || '', ar = group?.ar || '';
  const short = raw
    .replace(/^בחר(ו|י)?\s+את\s+ה/, '')   // "בחר את המשקה" -> "משקה"
    .replace(/^בחר(ו|י)?\s+את\s+/, '')
    .replace(/^اختر(وا|ي)?\s+ال/, '')     // "اختر المشروب" -> "مشروب"
    .replace(/^اختر(وا|ي)?\s+/, '');
  const emoji = /משקה|مشروب/.test(he + ar) ? '🥤' : /חצי|نصف/.test(he + ar) ? '🍕' : '➕';
  return `${emoji} ${short.charAt(0).toUpperCase() + short.slice(1)}`;
}

/** Lines for one cart entry, e.g.
 *  • 1 × Classic pizza – 77₪
 *     ↳ Choose a drink: Coca Cola
 */
export function entryLines(entry, tr) {
  const lines = [`• ${entry.qty} × ${tr(entry.name)} – ${money(entry.price * entry.qty)}`];
  for (const g of entry.options || []) {
    if (!g.items.length) continue;
    const names = g.items.map((o) => (o.price ? `${tr(o.name)} (+${money(o.price)})` : tr(o.name))).join(tr(SEP));
    lines.push(`   ${groupLabel(g.group, tr)}: ${names}`);
  }
  return lines;
}

/** Stable key so the same item with the same choices stacks in the cart */
export function entryKey(item, chosen) {
  const sig = chosen
    .map((g) => g.items.map((o) => o.id).sort().join('.'))
    .join('|');
  return `item-${item._id}${sig.replace(/\|/g, '') ? `-${sig}` : ''}`;
}
