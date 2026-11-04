import './env.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';
import { UPLOAD_DIR } from './middleware/upload.js';
import Admin from './models/Admin.js';
import MenuItem from './models/MenuItem.js';
import Deal from './models/Deal.js';
import { getSettings } from './utils/settings.js';

// Creates the single owner account from .env the first time the server starts.
export async function ensureAdmin() {
  if (await Admin.countDocuments()) return;
  const username = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!password || password.length < 8) {
    console.warn('No admin exists and ADMIN_PASSWORD is missing/short (min 8). Admin was NOT created.');
    return;
  }
  await Admin.create({ username, passwordHash: await bcrypt.hash(password, 12) });
  console.log(`Admin user "${username}" created`);
}

const t = (he, ar) => ({ he, ar });

// Real menu from the shop's ordering app (Nov 2026). Descriptions are left empty on purpose:
// the owner fills them in /admin. Arabic names are translations - the owner should check them.
const item = (category, he, ar, price, { img, ...extra } = {}) => ({
  category, name: t(he, ar), description: t('', ''), howMade: t('', ''), price, img, ...extra
});

// Copies the shop's real product photos (server/seed-images) into the uploads folder
const SEED_IMG_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'seed-images');
function seedImage(name) {
  if (!name) return '';
  const src = path.join(SEED_IMG_DIR, `${name}.webp`);
  if (!fs.existsSync(src)) return '';
  const file = `seed-${name}.webp`;
  fs.copyFileSync(src, path.join(UPLOAD_DIR, file));
  return `/uploads/${file}`;
}
const SAMPLE_MENU = [
  item('pizza', 'פיצה מרגריטה', 'بيتزا مارغريتا', 77, { featured: true, img: 'margherita' }),
  item('pizza', 'פיצה קלאסית', 'بيتزا كلاسيك', 77, { img: 'classic' }),
  item('pizza', 'פיצה פסטו', 'بيتزا بيستو', 77, { img: 'pesto' }),
  item('pizza', 'פיצה ביאנקה', 'بيتزا بيانكا', 77, { available: false }),
  item('pizza', 'פיצה סטלה', 'بيتزا ستيلا', 88, { img: 'stella' }),
  item('pizza', 'ולקאנו איתלינו', 'فولكانو إيطاليانو', 88, { available: false }),
  item('pizza', 'פיצה בצק איטלקי מטוגן', 'بيتزا عجينة إيطالية مقلية', 30, { img: 'fried-dough' }),
  item('combos', 'פיצה משפחתית + לחם שום', 'بيتزا عائلية + خبز بالثوم', 150, { img: 'combo-garlic-bread' }),
  item('combos', 'פיצה משפחתית + מטוגנים ומשקה', 'بيتزا عائلية + مقليات ومشروب', 121, { img: 'combo-fries-drink' }),
  item('combos', 'פיצה משפחתית + מיקס מטוגנים ומשקה', 'بيتزا عائلية + ميكس مقليات ومشروب', 154, { img: 'combo-mix-drink' }),
  item('focaccia', 'פוקאצ׳ה אליו', 'فوكاتشا أليو', 55, { img: 'focaccia-alio' }),
  item('starters', 'כדורי פירה', 'كرات بطاطا مهروسة', 15, { img: 'potato-balls' }),
  item('starters', 'פוטטו', 'بوتيتو', 15, { img: 'potato-wedges' }),
  item('starters', 'סלט פטוש', 'سلطة فتوش', 55, { available: false }),
  item('starters', 'טבעות בצל', 'حلقات بصل', 15, { available: false }),
  item('starters', 'מקלות גבינת מוצרלה', 'أصابع جبنة موزاريلا', 30, { img: 'mozzarella-sticks' }),
  item('starters', 'שניצלונים', 'قطع شنيتسل', 33, { img: 'schnitzels' }),
  item('starters', 'מיקס מטוגנים', 'ميكس مقليات', 70, { img: 'fried-mix' }),
  item('drinks', 'קוקה קולה 1.5 ליטר', 'كوكا كولا 1.5 لتر', 11, { img: 'coca-cola' }),
  item('drinks', 'קוקה קולה זירו 1.5 ליטר', 'كوكا كولا زيرو 1.5 لتر', 11, { img: 'coca-cola-zero' }),
  item('drinks', 'פנטה אקזוטית 1.5 ליטר', 'فانتا إكزوتيك 1.5 لتر', 11, { img: 'fanta-exotic' }),
  item('drinks', 'פנטה תות 1.5 ליטר', 'فانتا فراولة 1.5 لتر', 11, { img: 'fanta-strawberry' })
];

export async function seedIfEmpty() {
  await getSettings(); // creates default settings document
  if (await MenuItem.countDocuments()) return;
  const items = await MenuItem.insertMany(SAMPLE_MENU.map(({ img, ...m }, i) => ({ ...m, image: seedImage(img), order: i })));
  const now = new Date();
  await Deal.create({
    title: t('פיצה משפחתית + מטוגנים ומשקה', 'بيتزا عائلية + مقليات ومشروب'),
    description: t('דוגמה למבצע מתוזמן – לעריכה או מחיקה בפאנל הניהול', 'مثال لعرض مؤقت – للتعديل أو الحذف في لوحة التحكم'),
    price: 121,
    startAt: now,
    endAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    items: [items.find((i) => i.category === 'combos' && i.price === 121)._id]
  });
  console.log('Sample menu and deal created');
}

// `npm run seed` - run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/veroitaliano');
  // `npm run seed -- --reset` replaces the menu and deals with the real menu above
  if (process.argv.includes('--reset')) {
    await MenuItem.deleteMany({});
    await Deal.deleteMany({});
    console.log('Menu and deals cleared');
  }
  await ensureAdmin();
  await seedIfEmpty();
  await mongoose.disconnect();
}
