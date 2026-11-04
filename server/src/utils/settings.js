import Settings from '../models/Settings.js';

export async function getSettings() {
  let s = await Settings.findOne({ key: 'main' }).lean();
  if (!s) s = (await Settings.create({ key: 'main' })).toObject();
  return s;
}
