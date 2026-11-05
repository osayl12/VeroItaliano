import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyDealPrices, finalPrice, openStatus } from './utils.js';

// every day 16:30-23:00 unless a test changes it
const week = (changes = {}) => [0, 1, 2, 3, 4, 5, 6].map((day) => ({ day, closed: false, open: '16:30', close: '23:00', ...changes[day] }));
// 2026-11-04 is a Wednesday (day 3); Israel is UTC+2 in November
const at = (hhmm, date = '2026-11-04') => vi.setSystemTime(new Date(`${date}T${hhmm}:00+02:00`));

describe('openStatus (Israel time)', () => {
  afterEach(() => vi.useRealTimers());

  it('is open during the shift', () => {
    vi.useFakeTimers();
    at('18:00');
    expect(openStatus({ hours: week() })).toEqual({ open: true, closesAt: '23:00' });
  });

  it('is closed before opening, and says when it opens today', () => {
    vi.useFakeTimers();
    at('12:00');
    expect(openStatus({ hours: week() })).toMatchObject({ open: false, opensAt: '16:30', opensToday: true });
  });

  it("keeps yesterday's shift open after midnight", () => {
    vi.useFakeTimers();
    at('01:00');
    const hours = week({ 2: { open: '18:00', close: '02:00' } }); // Tuesday runs past midnight
    expect(openStatus({ hours })).toEqual({ open: true, closesAt: '02:00' });
  });

  it('skips a closed day and gives the next opening day', () => {
    vi.useFakeTimers();
    at('18:00');
    expect(openStatus({ hours: week({ 3: { closed: true } }) })).toMatchObject({ open: false, opensAt: '16:30', opensDay: 4 });
  });

  it('temporary closing wins over the hours', () => {
    vi.useFakeTimers();
    at('18:00');
    expect(openStatus({ hours: week(), tempClosed: true })).toEqual({ open: false, temp: true });
  });
});

describe('applyDealPrices', () => {
  const pizza = { _id: 'p1', price: 77, salePrice: null };
  const deal = (price, item = pizza) => ({ price, item });

  it('sells the linked item at the deal price', () => {
    const [m] = applyDealPrices([pizza], [deal(60)]);
    expect(finalPrice(m)).toBe(60);
  });

  it('keeps a lower sale price the item already has', () => {
    const [m] = applyDealPrices([{ ...pizza, salePrice: 50 }], [deal(60)]);
    expect(finalPrice(m)).toBe(50);
  });

  it('ignores a deal that is not cheaper, and deals without a linked item', () => {
    const [a] = applyDealPrices([pizza], [deal(80)]);
    const [b] = applyDealPrices([pizza], [deal(10, null)]);
    expect(finalPrice(a)).toBe(77);
    expect(finalPrice(b)).toBe(77);
  });

  it('handles a missing menu or deal list', () => {
    expect(applyDealPrices(undefined, undefined)).toEqual([]);
  });
});
