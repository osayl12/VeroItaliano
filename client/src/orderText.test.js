import { describe, expect, it } from 'vitest';
import { entryKey, entryLines, groupLabel, optionsTotal, quickOrderText } from './orderText.js';
import { dealEntry, withEntry } from './cart.js';

const tr = (o) => o?.he || '';
const drink = { group: { he: 'בחר את המשקה' }, items: [{ id: 'cola', name: { he: 'קולה' }, price: 0 }] };
const extras = {
  group: { he: 'תוספות' },
  items: [
    { id: 'corn', name: { he: 'תירס' }, price: 3 },
    { id: 'olives', name: { he: 'זיתים' }, price: 2 }
  ]
};

describe('WhatsApp message text', () => {
  it('quick order: greeting + one line', () => {
    expect(quickOrderText('שלום', 'מרגריטה', 77)).toBe('שלום\n• מרגריטה (77₪)');
  });

  it('cart entry lines: total per line, choices with their extra price', () => {
    const entry = { qty: 2, name: { he: 'קלאסית' }, price: 82, options: [drink, extras] };
    expect(entryLines(entry, tr)).toEqual(['• 2 × קלאסית – 164₪', '   🥤 משקה: קולה', '   ➕ תוספות: תירס (+3₪), זיתים (+2₪)']);
  });

  it('short group labels', () => {
    expect(groupLabel({ he: 'בחר את המשקה' }, tr)).toBe('🥤 משקה');
    expect(groupLabel({ he: 'החצי הראשון' }, tr)).toBe('🍕 החצי הראשון');
  });

  it('adds up the choice prices', () => {
    expect(optionsTotal([drink, extras])).toBe(5);
  });
});

describe('cart', () => {
  const item = { _id: 'p1' };

  it('entry key: plain item vs. item with choices (order of choices does not matter)', () => {
    expect(entryKey(item)).toBe('item-p1');
    expect(entryKey(item, [{ items: [] }])).toBe('item-p1');
    const reversed = { ...extras, items: [...extras.items].reverse() };
    expect(entryKey(item, [drink, extras])).toBe(entryKey(item, [drink, reversed]));
  });

  it('the same entry stacks, a different one is added', () => {
    let cart = withEntry([], { key: 'a', price: 10 });
    cart = withEntry(cart, { key: 'a', price: 10, qty: 2 });
    cart = withEntry(cart, dealEntry({ _id: 'd1', title: { he: 'מבצע' }, price: 50 }));
    expect(cart.map((x) => [x.key, x.qty])).toEqual([
      ['a', 3],
      ['deal-d1', 1]
    ]);
  });
});
