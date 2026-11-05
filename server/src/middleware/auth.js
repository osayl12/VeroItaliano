import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

export async function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    // the token must belong to an existing admin and be issued after the last password change
    const admin = await Admin.findById(payload.id).select('username tokenVersion').lean();
    if (!admin || (admin.tokenVersion || 0) !== (payload.v || 0)) return res.status(401).json({ error: 'unauthorized' });
    req.admin = { id: String(admin._id), username: admin.username };
    next();
  } catch {
    res.status(401).json({ error: 'unauthorized' });
  }
}
