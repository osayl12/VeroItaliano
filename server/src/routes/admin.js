import { Router } from 'express';
import MenuItem from '../models/MenuItem.js';
import Deal from '../models/Deal.js';
import Settings from '../models/Settings.js';
import { requireAdmin } from '../middleware/auth.js';
import { upload, removeUpload } from '../middleware/upload.js';
import { getSettings } from '../utils/settings.js';

const router = Router();
router.use(requireAdmin);

// Multipart requests send the fields as JSON in "data" plus an optional "image" file
function parseBody(req) {
  let data = {};
  try {
    data = req.body?.data ? JSON.parse(req.body.data) : { ...req.body };
  } catch {
    data = {};
  }
  delete data._id;
  delete data.createdAt;
  delete data.updatedAt;
  if (req.file) data.image = `/uploads/${req.file.filename}`;
  return data;
}

const pick = (obj, keys) => Object.fromEntries(keys.filter((k) => k in obj).map((k) => [k, obj[k]]));
const MENU_FIELDS = ['name', 'description', 'howMade', 'category', 'price', 'salePrice', 'image', 'active', 'available', 'featured', 'order'];
const DEAL_FIELDS = ['title', 'description', 'image', 'price', 'originalPrice', 'startAt', 'endAt', 'items', 'active'];

// Generic CRUD for menu items and deals
function crud(path, Model, fields, sort) {
  router.get(path, async (req, res, next) => {
    try {
      res.json(await Model.find().sort(sort).lean());
    } catch (e) {
      next(e);
    }
  });

  router.post(path, upload.single('image'), async (req, res, next) => {
    try {
      const doc = await Model.create(pick(parseBody(req), fields));
      res.status(201).json(doc);
    } catch (e) {
      if (req.file) removeUpload(`/uploads/${req.file.filename}`);
      next(e);
    }
  });

  router.put(`${path}/:id`, upload.single('image'), async (req, res, next) => {
    try {
      const doc = await Model.findById(req.params.id);
      if (!doc) return res.status(404).json({ error: 'not_found' });
      const data = pick(parseBody(req), fields);
      const oldImage = doc.image;
      doc.set(data);
      await doc.save();
      if ('image' in data && oldImage && oldImage !== doc.image) removeUpload(oldImage);
      res.json(doc);
    } catch (e) {
      if (req.file) removeUpload(`/uploads/${req.file.filename}`);
      next(e);
    }
  });

  router.delete(`${path}/:id`, async (req, res, next) => {
    try {
      const doc = await Model.findByIdAndDelete(req.params.id);
      if (doc?.image) removeUpload(doc.image);
      res.json({ ok: true });
    } catch (e) {
      next(e);
    }
  });
}

crud('/menu', MenuItem, MENU_FIELDS, { category: 1, order: 1, createdAt: 1 });
crud('/deals', Deal, DEAL_FIELDS, { endAt: -1 });

// Settings: hours, temporary closing, contact info, map
const SETTINGS_FIELDS = [
  'hours', 'tempClosed', 'tempClosedMessage', 'phone', 'whatsapp', 'whatsappGreeting',
  'address', 'mapUrl', 'mapLink', 'instagram', 'tagline'
];

router.get('/settings', async (req, res, next) => {
  try {
    res.json(await getSettings());
  } catch (e) {
    next(e);
  }
});

router.put('/settings', async (req, res, next) => {
  try {
    const data = pick(req.body || {}, SETTINGS_FIELDS);
    if (data.hours) {
      const valid = /^([01]\d|2[0-3]):[0-5]\d$/;
      const current = (await getSettings()).hours || [];
      // always keep exactly 7 days (0 = Sunday ... 6 = Saturday)
      data.hours = [0, 1, 2, 3, 4, 5, 6].map((day) => {
        const h = data.hours.find((x) => Number(x.day) === day) || current.find((x) => x.day === day) || {};
        return {
          day,
          closed: !!h.closed,
          open: valid.test(h.open) ? h.open : '16:30',
          close: valid.test(h.close) ? h.close : '23:00'
        };
      });
    }
    if (data.whatsapp) data.whatsapp = String(data.whatsapp).replace(/\D/g, '');
    if (data.mapUrl) data.mapUrl = extractEmbedSrc(data.mapUrl);
    const s = await Settings.findOneAndUpdate({ key: 'main' }, { $set: data }, { new: true, upsert: true, runValidators: true });
    res.json(s);
  } catch (e) {
    next(e);
  }
});

// Accept either a plain embed URL or the full <iframe ...> code that Google Maps gives you
function extractEmbedSrc(value) {
  const m = String(value).match(/src=["']([^"']+)["']/);
  const url = (m ? m[1] : String(value)).trim();
  return /^https:\/\/(www\.)?google\.[a-z.]+\/maps\//.test(url) ? url : '';
}

export default router;
