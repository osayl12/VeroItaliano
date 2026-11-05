import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { withItem } from '../src/utils/deals.js';

const pizza = { _id: 'p1', name: { he: 'מרגריטה', ar: '' }, description: { he: 'גבינות', ar: '' }, image: '/uploads/m.webp', price: 77 };
const empty = { he: '', ar: '' };

describe('withItem', () => {
  it('a linked deal takes the empty fields from the item', () => {
    const d = withItem({ items: ['p1'], title: empty, description: empty, image: '', price: 60, originalPrice: null }, [pizza]);
    assert.equal(d.title, pizza.name);
    assert.equal(d.description, pizza.description);
    assert.equal(d.image, pizza.image);
    assert.equal(d.originalPrice, 77); // the item's normal price, shown crossed out
    assert.equal(d.item, pizza);
  });

  it("keeps the deal's own title, image and original price", () => {
    const title = { he: 'מבצע ערב', ar: '' };
    const d = withItem({ items: ['p1'], title, description: empty, image: '/uploads/d.webp', price: 60, originalPrice: 90 }, [pizza]);
    assert.equal(d.title, title);
    assert.equal(d.image, '/uploads/d.webp');
    assert.equal(d.originalPrice, 90);
  });

  it('no original price when the deal is not cheaper than the item', () => {
    const d = withItem({ items: ['p1'], title: empty, description: empty, price: 80 }, [pizza]);
    assert.equal(d.originalPrice, null);
  });

  it('a deal whose item is not on the (active) menu has no item', () => {
    assert.equal(withItem({ items: ['gone'], price: 50 }, [pizza]).item, null);
    assert.equal(withItem({ price: 50 }, [pizza]).item, null);
  });
});
