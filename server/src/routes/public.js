import { Router } from 'express';
import MenuItem from '../models/MenuItem.js';
import Deal from '../models/Deal.js';
import { getSettings } from '../utils/settings.js';
import { withItem } from '../utils/deals.js';

const router = Router();

// Everything the public site needs in one request
router.get('/site', async (req, res, next) => {
  try {
    const now = new Date();
    const [settings, menu, deals] = await Promise.all([
      getSettings(),
      MenuItem.find({ active: true }).sort({ category: 1, order: 1, createdAt: 1 }).lean(),
      Deal.find({ active: true, startAt: { $lte: now }, endAt: { $gt: now } })
        .sort({ endAt: 1 })
        .lean()
    ]);
    res.json({ settings, menu, deals: deals.map((d) => withItem(d, menu)), serverTime: now });
  } catch (err) {
    next(err);
  }
});

export default router;
