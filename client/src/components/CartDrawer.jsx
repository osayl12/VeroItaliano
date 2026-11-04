import { useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n.jsx';
import { money, waLink } from '../utils.js';
import WhatsAppIcon from './WhatsAppIcon.jsx';
import Icon from './Icon.jsx';

export default function CartDrawer({ open, onClose, cart, setQty, clear, settings }) {
  const { t, tr } = useLang();
  const [name, setName] = useState('');
  const [mode, setMode] = useState('pickup');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const closeRef = useRef(null);

  // Dialog behaviour: focus the close button, Esc closes, page behind does not scroll
  useEffect(() => {
    if (!open) return;
    const prevFocus = document.activeElement;
    closeRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prevFocus?.focus?.();
    };
  }, [open, onClose]);

  const total = cart.reduce((s, x) => s + x.price * x.qty, 0);

  const message = [
    tr(settings.whatsappGreeting),
    '',
    ...cart.map((x) => `• ${x.qty} × ${tr(x.name)} – ${money(x.price * x.qty)}`),
    '',
    `${t('msg_total')}: ${money(total)}`,
    name ? `${t('msg_name')}: ${name}` : null,
    mode === 'delivery' ? `${t('msg_delivery')}: ${address}` : t('msg_pickup'),
    notes ? `${t('msg_notes')}: ${notes}` : null
  ]
    .filter((l) => l !== null)
    .join('\n');

  return (
    <div className={`drawer-backdrop ${open ? 'open' : ''}`} onClick={onClose} aria-hidden={!open}>
      <aside
        className="drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="drawer-head">
          <h2 id="cart-title"><Icon name="bag" size={22} /> {t('cart')}</h2>
          <button ref={closeRef} type="button" className="icon-btn" onClick={onClose} aria-label={t('close')}>
            <Icon name="x" size={22} />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="empty-state">
            <Icon name="pizza" size={48} strokeWidth={1.5} />
            <p>{t('cart_empty')}</p>
            <a href="#menu" className="btn btn-green" onClick={onClose}>{t('nav_menu')}</a>
          </div>
        ) : (
          <>
            <ul className="cart-list">
              {cart.map((x) => (
                <li key={x.key}>
                  <div className="cart-name">
                    {x.kind === 'deal' && <Icon name="flame" size={16} className="text-red" />} {tr(x.name)}
                  </div>
                  <div className="qty">
                    <button type="button" onClick={() => setQty(x.key, x.qty - 1)} aria-label={`${t('decrease')}: ${tr(x.name)}`}>
                      <Icon name="minus" size={18} />
                    </button>
                    <span className="num" aria-live="polite">{x.qty}</span>
                    <button type="button" onClick={() => setQty(x.key, x.qty + 1)} aria-label={`${t('increase')}: ${tr(x.name)}`}>
                      <Icon name="plus" size={18} />
                    </button>
                  </div>
                  <div className="cart-price num">{money(x.price * x.qty)}</div>
                </li>
              ))}
            </ul>
            <div className="cart-total">
              <span>{t('total')}</span>
              <b className="num">{money(total)}</b>
            </div>

            <div className="form">
              <label htmlFor="cart-name">{t('your_name')}</label>
              <input id="cart-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
              <div className="seg" role="group" aria-label={`${t('pickup')} / ${t('delivery')}`}>
                <button type="button" aria-pressed={mode === 'pickup'} className={mode === 'pickup' ? 'active' : ''} onClick={() => setMode('pickup')}>
                  <Icon name="store" size={18} /> {t('pickup')}
                </button>
                <button type="button" aria-pressed={mode === 'delivery'} className={mode === 'delivery' ? 'active' : ''} onClick={() => setMode('delivery')}>
                  <Icon name="bike" size={18} /> {t('delivery')}
                </button>
              </div>
              {mode === 'delivery' && (
                <>
                  <label htmlFor="cart-address">{t('address')}</label>
                  <input id="cart-address" value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" />
                </>
              )}
              <label htmlFor="cart-notes">{t('notes')}</label>
              <textarea id="cart-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <a className="btn btn-wa btn-lg btn-block" href={waLink(settings.whatsapp, message)} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcon size={22} /> {t('send_order_whatsapp')}
            </a>
            <p className="muted small center"><Icon name="info" size={14} /> {t('order_by_phone_note')}</p>
            <button type="button" className="btn btn-link" onClick={clear}><Icon name="trash" size={16} /> {t('clear')}</button>
          </>
        )}
      </aside>
    </div>
  );
}
