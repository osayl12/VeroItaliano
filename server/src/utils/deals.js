const has = (t) => !!(t && (t.he || t.ar));

/**
 * A deal linked to a menu item IS that item at a deal price:
 * empty title / description / image are taken from the item, and `item` carries the
 * item itself (with its choices) so the site can open the same choice panel.
 * A deal links at most one item; only the first linked item that is in `menu` counts.
 */
export function withItem(deal, menu) {
  const ids = (deal.items || []).map(String);
  const item = menu.find((m) => ids.includes(String(m._id))) || null;
  if (!item) return { ...deal, item: null };
  return {
    ...deal,
    title: has(deal.title) ? deal.title : item.name,
    description: has(deal.description) ? deal.description : item.description,
    image: deal.image || item.image,
    originalPrice: deal.originalPrice ?? (Number(item.price) > Number(deal.price) ? item.price : null),
    item
  };
}
