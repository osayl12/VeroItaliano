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

if (!JWT_SECRET || JWT_SECRET.length < 16) {
  console.error('JWT_SECRET is missing or too short (min 16 chars). Set it in .env');
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors(CLIENT_ORIGIN ? { origin: CLIENT_ORIGIN.split(',') } : {}));
app.use(express.json({ limit: '1mb' }));

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d' }));
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error(err.message);
  const status = err.name === 'ValidationError' || err.name === 'CastError' || err.name === 'MulterError' ? 400 : err.status || 500;
  res.status(status).json({ error: err.message || 'server_error' });
});

await mongoose.connect(MONGO_URI);
console.log('MongoDB connected');
await ensureAdmin();
await seedIfEmpty();
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
