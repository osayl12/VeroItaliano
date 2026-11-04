import { useEffect, useMemo, useRef, useState } from 'react';
import { useLang } from '../i18n.jsx';
import { finalPrice, hasSale, money } from '../utils.js';
import { entryKey, optionsTotal } from '../orderText.js';
import WhatsAppIcon from './WhatsAppIcon.jsx';
import Icon from './Icon.jsx';

/**
 * Item details + choices (drink, toppings per half, extras), like the shop's ordering app.
 * Rules per group: min (required when >= 1) and max. max = 1 behaves like a radio choice.
 */
export default function ItemSheet({ item, onClose, onAdd, onCheckout, settings }) {
  const { t, tr } = useLang();
  const groups = item?.optionGroups || [];
  const [sel, setSel] = useState({}); // { groupIndex: [optionIndex, ...] }
  const [qty, setQty] = useState(1);
  const [tried, setTried] = useState(false); // show "required" errors only after a try
  const closeRef = useRef(null);
  const firstMissingRef = useRef(null);

  // reset when another item opens
  useEffect(() => {
    setSel({});
    setQty(1);
    setTried(false);
  }, [item?._id]);

  // dialog behaviour: focus, Esc, no page scroll behind
  useEffect(() => {
    if (!item) return;
    const prev = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [item, onClose]);

  const toggle = (gi, oi) => {
    const g = groups[gi];
    setSel((s) => {
      const cur = s[gi] || [];
      if (cur.includes(oi)) return { ...s, [gi]: cur.filter((x) => x !== oi) };
      if (g.max === 1) return { ...s, [gi]: [oi] }; // radio
      if (cur.length >= g.max) return s; // full
      return { ...s, [gi]: [...cur, oi] };
    });
  };

  const chosen = useMemo(
    () =>
      groups.map((g, gi) => ({
        group: g.name,
        items: (sel[gi] || []).map((oi) => ({ id: g.options[oi]._id || `${gi}-${oi}`, name: g.options[oi].name, price: g.options[oi].price || 0 }))
      })),
    [groups, sel]
  );
  const missing = groups.map((g, gi) => (sel[gi] || []).length < (g.min || 0));
  const valid = !missing.some(Boolean);

  if (!item) return null;

  const base = finalPrice(item);
  const unit = base + optionsTotal(chosen);
  const off = item.available === false;

  const entry = () => ({
    key: entryKey(item, chosen),
    kind: 'item',
    id: item._id,
    name: item.name,
    price: unit,
    options: chosen.filter((g) => g.items.length),
    qty
  });

  const check = () => {
    if (valid) return true;
    setTried(true);
    setTimeout(() => firstMissingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0);
    return false;
  };

  const add = () => {
    if (!check()) return;
    onAdd(entry());
    onClose();
  };


  let firstMissingSet = false;

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-top">
          <button ref={closeRef} type="button" className="icon-btn" onClick={onClose} aria-label={t('close')}>
            <Icon name="x" size={22} />
          </button>
        </div>

        <div className="sheet-scroll">
          {item.image && (
            <div className="sheet-img">
              <img src={item.image} alt={tr(item.name)} />
            </div>
          )}
          <div className="sheet-head">
            <h2 id="sheet-title">{tr(item.name)}</h2>
            <div className="price-col">
              <span className="price-new num">{money(base)}</span>
              {hasSale(item) && <del className="price-old num">{money(item.price)}</del>}
            </div>
          </div>
          {tr(item.description) && <p className="sheet-desc">{tr(item.description)}</p>}

          {groups.map((g, gi) => {
            const count = (sel[gi] || []).length;
            const isMissing = tried && missing[gi];
            const ref = isMissing && !firstMissingSet ? ((firstMissingSet = true), firstMissingRef) : undefined;
            return (
              <fieldset key={gi} className={`opt-group ${g.min > 0 ? 'is-required' : ''} ${isMissing ? 'has-error' : ''}`} ref={ref}>
                <legend>
                  <span className="opt-title">{tr(g.name)}</span>
                  {g.min > 0 ? (
                    <span className="req-badge">{t('required')}</span>
                  ) : (
                    <span className="opt-hint">{t('up_to').replace('{n}', g.max)}</span>
                  )}
                  {g.max > 1 && <span className="opt-count num">{count}/{g.max}</span>}
                </legend>
                <div className="opt-grid" role={g.max === 1 ? 'radiogroup' : 'group'}>
                  {g.options.map((o, oi) => {
                    const on = (sel[gi] || []).includes(oi);
                    const full = !on && g.max > 1 && count >= g.max;
                    return (
                      <button
                        key={oi}
                        type="button"
                        role={g.max === 1 ? 'radio' : 'checkbox'}
                        aria-checked={on}
                        className={`opt ${on ? 'on' : ''}`}
                        disabled={full || off}
                        onClick={() => toggle(gi, oi)}
                      >
                        {on && <Icon name="check" size={16} />}
                        <span>{tr(o.name)}</span>
                        {o.price > 0 && <span className="opt-price num">+{money(o.price)}</span>}
                      </button>
                    );
                  })}
                </div>
                {isMissing && <p className="opt-error" role="alert">{t('please_choose')} {tr(g.name)}</p>}
              </fieldset>
            );
          })}
        </div>

        <div className="sheet-bar">
          {off ? (
            <button type="button" className="btn btn-block" disabled>{t('unavailable')}</button>
          ) : (
            <>
              <div className="qty sheet-qty">
                <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label={t('decrease')} disabled={qty <= 1}>
                  <Icon name="minus" size={18} />
                </button>
                <span className="num" aria-live="polite">{qty}</span>
                <button type="button" onClick={() => setQty((q) => q + 1)} aria-label={t('increase')}>
                  <Icon name="plus" size={18} />
                </button>
              </div>
              <button type="button" className="btn btn-red sheet-add" onClick={add}>
                <Icon name="bag" size={18} /> {t('add_to_order')} · <span className="num">{money(unit * qty)}</span>
              </button>
              {/* WhatsApp = add this item and go straight to the order form (name, pickup/delivery),
                  so the message sent is always the complete order */}
              <button
                type="button"
                className="btn btn-wa sheet-wa"
                onClick={() => {
                  if (!check()) return;
                  onAdd(entry());
                  onClose();
                  onCheckout?.();
                }}
                aria-label={t('add_and_send_whatsapp')}
                title={t('add_and_send_whatsapp')}
              >
                <WhatsAppIcon size={20} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
