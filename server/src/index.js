import './env.js';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import publicRoutes from './routes/public.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import { UPLOAD_DIR } from './middleware/upload.js';
import { ensureAdmin, seedIfEmpty } from './seed.js';

const { PORT = 5000, MONGO_URI = 'mongodb://localhost:27017/veroitaliano', JWT_SECRET, CLIENT_ORIGIN } = process.env;

if (!JWT_SECRET || JWT_SECRET.length < 32 || JWT_SECRET.startsWith('replace-with')) {
  console.error('JWT_SECRET is missing, too short (min 32 chars) or still the example value. Set it in .env');
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
// The site and API share one origin (nginx / Vite proxy), so cross-origin access is only enabled when CLIENT_ORIGIN is set
if (CLIENT_ORIGIN) app.use(cors({ origin: CLIENT_ORIGIN.split(',').map((o) => o.trim()) }));
app.use(express.json({ limit: '1mb' }));

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d' }));
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  const status = err.name === 'ValidationError' || err.name === 'CastError' || err.name === 'MulterError' ? 400 : err.status || 500;
  console.error(status >= 500 ? err : err.message);
  // never send internal error details (database / driver messages) to the browser
  res.status(status).json({ error: status >= 500 ? 'server_error' : err.message || 'bad_request' });
});

await mongoose.connect(MONGO_URI);
console.log('MongoDB connected');
await ensureAdmin();
await seedIfEmpty();
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
