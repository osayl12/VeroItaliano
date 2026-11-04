import mongoose from 'mongoose';

const i18n = { he: { type: String, default: '' }, ar: { type: String, default: '' } };

// Same categories as the shop's ordering app (+ a few spare ones)
export const CATEGORIES = ['pizza', 'combos', 'focaccia', 'starters', 'pizzaOfDay', 'salads', 'breads', 'drinks', 'desserts'];

const menuItemSchema = new mongoose.Schema(
  {
    name: i18n,
    description: i18n, // ingredients / short description
    howMade: i18n, // "how we make it"
    category: { type: String, enum: CATEGORIES, default: 'pizza' },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, min: 0, default: null }, // optional discounted price
    image: { type: String, default: '' },
    active: { type: Boolean, default: true }, // false = hidden from the site
    available: { type: Boolean, default: true }, // false = shown greyed out as "not available now"
    featured: { type: Boolean, default: false }, // the pizza used in the landing page peak
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

export default mongoose.model('MenuItem', menuItemSchema);
