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

// Real menu from the shop's ordering app (Nov 2026): names, prices, descriptions and choices.
// Arabic texts are translations - the owner should check them in /admin.
const item = (category, he, ar, price, { img, desc, groups, ...extra } = {}) => ({
  category,
  name: t(he, ar),
  description: desc ? t(desc[0], desc[1]) : t('', ''),
  howMade: t('', ''),
  price,
  img,
  optionGroups: groups || [],
  ...extra
});

// ----- option groups (same as the shop's app) -----
const opt = ([he, ar], price = 0) => ({ name: t(he, ar), price });
const group = (he, ar, min, max, options) => ({ name: t(he, ar), min, max, options });
const TOPPINGS = [
  ['תירס', 'ذرة'], ['זיתים', 'زيتون'], ['פטריות', 'فطر'], ['בצל', 'بصل'], ['עגבניות', 'بندورة'],
  ['חלפיניו', 'هالبينو'], ['פפרוני', 'بيبروني'], ['טונה', 'تونة'], ['גמבה', 'فليفلة']
];
const TOPPINGS_NO_CORN_OLIVES = TOPPINGS.filter(([he]) => he !== 'תירס' && he !== 'זיתים' && he !== 'עגבניות');
const DRINKS = [['קוקה קולה', 'كوكا كولا'], ['קוקה קולה זירו', 'كوكا كولا زيرو'], ['פנטה אקזוטי', 'فانتا إكزوتيك'], ['פנטה תות', 'فانتا فراولة']];
const drinkRequired = () => group('בחר את המשקה', 'اختر المشروب', 1, 1, DRINKS.map((d) => opt(d)));
const drinkExtra = () => group('הוספת משקה', 'إضافة مشروب', 0, 1, DRINKS.map((d) => opt(d, 5)));
const half = (n, max = 3, list = TOPPINGS) =>
  n === 1
    ? group('החצי הראשון', 'النصف الأول', 0, max, list.map((x) => opt(x)))
    : group('החצי השני', 'النصف الثاني', 0, max, list.map((x) => opt(x)));
const halves = (max, list) => [half(1, max, list), half(2, max, list)];

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
  item('pizza', 'פיצה מרגריטה', 'بيتزا مارغريتا', 77, {
    featured: true, img: 'margherita',
    desc: ['פיצה עם 4 סוגי גבינה (גאודה, מוצרלה, פרמזן ופטה), שמן זית ובזיליקום, עם משקה לבחירה', 'بيتزا مع 4 أنواع جبنة (غاودا، موزاريلا، بارميزان وفيتا)، زيت زيتون وريحان، مع مشروب حسب الاختيار'],
    groups: [drinkRequired()]
  }),
  item('pizza', 'פיצה קלאסית', 'بيتزا كلاسيك', 77, {
    img: 'classic',
    desc: ['פיצה עם תוספות לבחירתך ומשקה', 'بيتزا مع إضافات حسب اختيارك ومشروب'],
    groups: [drinkRequired(), ...halves(3)]
  }),
  item('pizza', 'פיצה פסטו', 'بيتزا بيستو', 77, {
    img: 'pesto',
    desc: ['פיצה ברוטב פסטו עם זיתים, תירס ועגבניות, ומשקה לבחירה', 'بيتزا بصلصة البيستو مع زيتون، ذرة وبندورة، ومشروب حسب الاختيار'],
    groups: [drinkRequired(), ...halves(1, TOPPINGS_NO_CORN_OLIVES)]
  }),
  item('pizza', 'פיצה ביאנקה', 'بيتزا بيانكا', 77, { available: false }),
  item('pizza', 'פיצה סטלה', 'بيتزا ستيلا', 88, {
    img: 'stella',
    desc: ['פיצה בצורת כוכב עם קראסט ממולא בגבינה ופסטו, עם תוספות ומשקה לבחירה', 'بيتزا على شكل نجمة مع أطراف محشوة بالجبنة والبيستو، مع إضافات ومشروب حسب الاختيار'],
    groups: [drinkRequired(), ...halves(3)]
  }),
  item('pizza', 'ולקאנו איתלינו', 'فولكانو إيطاليانو', 88, { available: false }),
  item('pizza', 'פיצה בצק איטלקי מטוגן', 'بيتزا عجينة إيطالية مقلية', 30, {
    img: 'fried-dough',
    desc: ['פיצה אישית עם תוספות לבחירה', 'بيتزا شخصية مع إضافات حسب الاختيار'],
    groups: [group('בחר את התוספות', 'اختر الإضافات', 0, 3, TOPPINGS.map((x) => opt(x)))]
  }),
  item('combos', 'פיצה משפחתית + לחם שום', 'بيتزا عائلية + خبز بالثوم', 150, {
    img: 'combo-garlic-bread',
    desc: ['לחם שום עם פיצה קלאסית, טבעות בצל + כדורי פירה, 20 יחידות', 'خبز بالثوم مع بيتزا كلاسيك، حلقات بصل + كرات بطاطا، 20 قطعة'],
    groups: [...halves(3), drinkExtra()]
  }),
  item('combos', 'פיצה משפחתית + מטוגנים ומשקה', 'بيتزا عائلية + مقليات ومشروب', 121, {
    img: 'combo-fries-drink',
    desc: ['פיצה משפחתית עם תוספות לבחירה, עם כדורי פירה וטבעות בצל + משקה לבחירה', 'بيتزا عائلية مع إضافات حسب الاختيار، مع كرات بطاطا وحلقات بصل + مشروب حسب الاختيار'],
    groups: [drinkRequired(), ...halves(3)]
  }),
  item('combos', 'פיצה משפחתית + מיקס מטוגנים ומשקה', 'بيتزا عائلية + ميكس مقليات ومشروب', 154, {
    img: 'combo-mix-drink',
    desc: ['פיצה משפחתית + שניצלונים + פוטטו + כדורי פירה + מקלות גבינה + טבעות בצל', 'بيتزا عائلية + قطع شنيتسل + بوتيتو + كرات بطاطا + أصابع جبنة + حلقات بصل'],
    groups: [drinkRequired(), ...halves(3)]
  }),
  item('focaccia', 'פוקאצ׳ה אליו', 'فوكاتشا أليو', 55, {
    img: 'focaccia-alio',
    desc: ['בצל, עגבניות, שום, זעתר ואורגנו. המרכיבים קבועים (לא ניתן לשנותם)', 'بصل، بندورة، ثوم، زعتر وأوريغانو. المكونات ثابتة (لا يمكن تغييرها)'],
    groups: [group('תוספות', 'إضافات', 0, 1, [opt(['חריף', 'حار'])])]
  }),
  item('starters', 'כדורי פירה', 'كرات بطاطا مهروسة', 15, { img: 'potato-balls' }),
  item('starters', 'פוטטו', 'بوتيتو', 15, { img: 'potato-wedges' }),
  item('starters', 'סלט פטוש', 'سلطة فتوش', 55, { available: false }),
  item('starters', 'טבעות בצל', 'حلقات بصل', 15, { available: false }),
  item('starters', 'מקלות גבינת מוצרלה', 'أصابع جبنة موزاريلا', 30, { img: 'mozzarella-sticks' }),
  item('starters', 'שניצלונים', 'قطع شنيتسل', 33, { img: 'schnitzels' }),
  item('starters', 'מיקס מטוגנים', 'ميكس مقليات', 70, {
    img: 'fried-mix',
    desc: ['שניצלונים + פוטטו + כדורי פירה + מקלות גבינה + טבעות בצל וגם רוטב צ׳דר בצד', 'قطع شنيتسل + بوتيتو + كرات بطاطا + أصابع جبنة + حلقات بصل مع صلصة شيدر على الجنب']
  }),
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
  // linked to the menu item: name, description, image and choices come from it automatically
  await Deal.create({
    price: 109,
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
