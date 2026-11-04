import { money } from './utils.js';

// list separator per language (Arabic uses its own comma)
export const SEP = { he: ', ', ar: '، ' };

// Everything here is built from { he, ar } objects with `tr`, so the WhatsApp message
// is written in whatever language the visitor is using right now.

/** chosen = [{ group: {he,ar}, items: [{ name: {he,ar}, price }] }] */
export function optionsTotal(chosen = []) {
  return chosen.reduce((s, g) => s + g.items.reduce((a, o) => a + (Number(o.price) || 0), 0), 0);
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
    lines.push(`   ↳ ${tr(g.group)}: ${names}`);
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
