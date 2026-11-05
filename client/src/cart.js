// The cart lives in localStorage, so the landing page can tell whether the visitor already has an order.
export const CART_KEY = 'vi_cart';

export function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

/**
 * cart entry: { key, kind: 'item'|'deal', id, name:{he,ar}, price (incl. options), qty,
 *               options?: [{ group:{he,ar}, items:[{ name:{he,ar}, price }] }] }
 * Returns a new cart with the entry added (same key = same item and choices, so the qty grows).
 */
export function withEntry(cart, entry) {
  const add = entry.qty || 1;
  if (cart.some((x) => x.key === entry.key)) return cart.map((x) => (x.key === entry.key ? { ...x, qty: x.qty + add } : x));
  return [...cart, { ...entry, qty: add }];
}

/** Cart entry for a deal that is not linked to a menu item */
export const dealEntry = (d) => ({ key: `deal-${d._id}`, kind: 'deal', id: d._id, name: d.title, price: d.price });

export function saveCart(cart) {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    // storage blocked (private mode): the cart just isn't remembered
  }
}
