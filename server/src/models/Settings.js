import mongoose from 'mongoose';

const i18n = { he: { type: String, default: '' }, ar: { type: String, default: '' } };

const daySchema = new mongoose.Schema(
  {
    day: { type: Number, min: 0, max: 6, required: true }, // 0 = Sunday
    closed: { type: Boolean, default: false },
    open: { type: String, default: '16:30' }, // "HH:mm"
    close: { type: String, default: '23:00' } // may be after midnight (e.g. "02:00")
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },
    hours: { type: [daySchema], default: () => [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day })) },
    tempClosed: { type: Boolean, default: false },
    tempClosedMessage: i18n,
    phone: { type: String, default: '0509780855' },
    whatsapp: { type: String, default: '972509780855' },
    whatsappGreeting: {
      he: { type: String, default: 'שלום, אני רוצה להזמין:' },
      ar: { type: String, default: 'مرحبا، بدي أطلب:' }
    },
    address: i18n,
    mapUrl: { type: String, default: '' }, // Google Maps embed URL
    mapLink: { type: String, default: '' }, // Google Maps "open in maps" link
    instagram: { type: String, default: 'https://instagram.com/veroitaliano2026' },
    tagline: {
      he: { type: String, default: 'פיצה איטלקית אמיתית מתנור האבן' },
      ar: { type: String, default: 'نكهة إيطالية أصيلة وصلت المغار' }
    }
  },
  { timestamps: true }
);

export default mongoose.model('Settings', settingsSchema);
