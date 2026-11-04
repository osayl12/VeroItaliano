import './env.js';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
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

// Example menu (from the Instagram flyers) - the owner edits/replaces it in the admin panel.
const SAMPLE_MENU = [
  {
    category: 'pizza', price: 70,
    name: t('פיצה מרגריטה', 'بيتزا مارغريتا'),
    description: t('רוטב עגבניות, מוצרלה, בזיליקום טרי', 'صلصة طماطم، موزاريلا، ريحان طازج'),
    howMade: t('בצק שתופח 48 שעות, נאפה בתנור אבן בחום גבוה', 'عجينة مخمّرة 48 ساعة، تُخبز في فرن حجري على حرارة عالية')
  },
  {
    category: 'pizza', price: 70,
    name: t('פיצה ביאנקה', 'بيتزا بيانكا'),
    description: t('שמנת, מוצרלה, שום ושמן זית', 'كريمة، موزاريلا، ثوم وزيت زيتون'),
    howMade: t('בסיס לבן ללא רוטב עגבניות, גבינות נמסות בתנור האבן', 'قاعدة بيضاء بدون صلصة طماطم، أجبان تذوب في الفرن الحجري')
  },
  {
    category: 'pizza', price: 70,
    name: t('פיצה פסטו', 'بيتزا بيستو'),
    description: t('פסטו בזיליקום, מוצרלה, עגבניות שרי', 'بيستو ريحان، موزاريلا، طماطم كرزية'),
    howMade: t('פסטו טרי שאנחנו מכינים במקום כל בוקר', 'بيستو طازج نحضّره في المحل كل صباح')
  },
  {
    category: 'pizza', price: 80,
    name: t('פיצה סטילה (כוכב)', 'بيتزا ستيلا (نجمة)'),
    description: t('פיצה בצורת כוכב עם קצוות ממולאים גבינה', 'بيتزا على شكل نجمة مع أطراف محشوة بالجبنة'),
    howMade: t('קצוות הבצק מקופלים ביד וממולאים לפני האפייה', 'أطراف العجينة تُطوى يدويًا وتُحشى قبل الخبز')
  },
  {
    category: 'pizza', price: 80,
    name: t('פיצה וולקנו', 'بيتزا البركان'),
    description: t('גבינות, רוטב חריף ותוספות לבחירה', 'أجبان، صلصة حارة وإضافات حسب الاختيار'),
    howMade: t('מרכז הפיצה ממולא גבינה נמסה כמו הר געש', 'وسط البيتزا محشو بجبنة ذائبة مثل البركان')
  },
  {
    category: 'pizzaOfDay', price: 50,
    name: t('פוקצ׳ה היום', 'فوكاتشا اليوم'),
    description: t('שואלים אותנו מה היום!', 'اسألونا شو في اليوم!'),
    howMade: t('משתנה כל יום לפי בחירת השף', 'تتغير كل يوم حسب اختيار الشيف')
  },
  { category: 'starters', price: 40, name: t('שניצל + צ׳יפס', 'شنيتسل + بطاطا'), description: t('', ''), howMade: t('', '') },
  { category: 'starters', price: 15, name: t('כדורי גבינה', 'كرات جبنة'), description: t('', ''), howMade: t('', '') },
  { category: 'starters', price: 15, name: t('טבעות בצל', 'حلقات بصل'), description: t('', ''), howMade: t('', '') },
  { category: 'salads', price: 35, name: t('סלט פטוש', 'سلطة فتوش'), description: t('ירקות טריים, לחם קלוי, סומק', 'خضار طازجة، خبز محمص، سماق'), howMade: t('', '') },
  { category: 'breads', price: 25, name: t('לחם שום', 'خبز بالثوم'), description: t('', ''), howMade: t('', '') },
  { category: 'drinks', price: 10, name: t('שתייה קלה', 'مشروب غازي'), description: t('', ''), howMade: t('', '') }
];

export async function seedIfEmpty() {
  await getSettings(); // creates default settings document
  if (await MenuItem.countDocuments()) return;
  const items = await MenuItem.insertMany(SAMPLE_MENU.map((m, i) => ({ ...m, order: i })));
  const now = new Date();
  await Deal.create({
    title: t('ארוחה משפחתית ענקית!', 'وجبة عائلية ضخمة!'),
    description: t('2 פיצות משפחתיות + צ׳יפס + שתייה גדולה', '2 بيتزا عائلية + بطاطا + مشروب كبير'),
    price: 149,
    originalPrice: 180,
    startAt: now,
    endAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    items: [items[0]._id]
  });
  console.log('Sample menu and deal created');
}

// `npm run seed` - run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/veroitaliano');
  await ensureAdmin();
  await seedIfEmpty();
  await mongoose.disconnect();
}
