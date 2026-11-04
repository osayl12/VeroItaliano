import { Router } from 'express';
import MenuItem from '../models/MenuItem.js';
import Deal from '../models/Deal.js';
import { getSettings } from '../utils/settings.js';

const router = Router();

const has = (t) => !!(t && (t.he || t.ar));
/**
 * A deal linked to a menu item IS that item at a deal price:
 * empty title / description / image are taken from the item, and `item` carries the
 * item itself (with its choices) so the site can open the same choice panel.
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

// Everything the public site needs in one request
router.get('/site', async (req, res, next) => {
  try {
    const now = new Date();
    const [settings, menu, deals] = await Promise.all([
      getSettings(),
      MenuItem.find({ active: true }).sort({ category: 1, order: 1, createdAt: 1 }).lean(),
      Deal.find({ active: true, startAt: { $lte: now }, endAt: { $gt: now } }).sort({ endAt: 1 }).lean()
    ]);
    res.json({ settings, menu, deals: deals.map((d) => withItem(d, menu)), serverTime: now });
  } catch (err) {
    next(err);
  }
});

export default router;
