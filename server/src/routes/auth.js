import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import Admin from '../models/Admin.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

export const MIN_PASSWORD = 12;
const signToken = (admin) =>
  jwt.sign({ id: admin._id, username: admin.username, v: admin.tokenVersion || 0 }, process.env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1d'
  });

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false });

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { username = '', password = '' } = req.body || {};
    const admin = await Admin.findOne({ username: String(username).toLowerCase().trim() });
    if (!admin || !(await bcrypt.compare(String(password), admin.passwordHash))) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }
    res.json({ token: signToken(admin), username: admin.username });
  } catch (err) {
    next(err);
  }
});

router.get('/me', requireAdmin, (req, res) => res.json({ username: req.admin.username }));

router.post('/change-password', requireAdmin, async (req, res, next) => {
  try {
    const { currentPassword = '', newPassword = '' } = req.body || {};
    if (String(newPassword).length < MIN_PASSWORD) return res.status(400).json({ error: 'password_too_short' });
    const admin = await Admin.findById(req.admin.id);
    if (!admin || !(await bcrypt.compare(String(currentPassword), admin.passwordHash))) {
      return res.status(401).json({ error: 'invalid_credentials' });
    }
    admin.passwordHash = await bcrypt.hash(String(newPassword), 12);
    admin.tokenVersion = (admin.tokenVersion || 0) + 1; // logs out every other session
    await admin.save();
    res.json({ ok: true, token: signToken(admin) });
  } catch (err) {
    next(err);
  }
});

export default router;
