import { useEffect, useRef, useState } from 'react';
import { useLang } from '../i18n.jsx';
import { money, waLink } from '../utils.js';
import WhatsAppIcon from './WhatsAppIcon.jsx';
import Icon from './Icon.jsx';
import { entryLines, SEP } from '../orderText.js';

export default function CartDrawer({ open, onClose, cart, setQty, clear, settings }) {
  const { t, tr } = useLang();
  const [name, setName] = useState('');
  const [mode, setMode] = useState('pickup');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  // exact location from the phone's GPS: { lat, lng, acc } | null
  const [loc, setLoc] = useState(null);
  const [locState, setLocState] = useState('idle'); // idle | loading | error | denied
  const [tried, setTried] = useState(false);
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

  const getLocation = () => {
    if (!('geolocation' in navigator)) return setLocState('error');
    setLocState('loading');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setLoc({ lat: latitude.toFixed(6), lng: longitude.toFixed(6), acc: Math.round(accuracy) });
        setLocState('idle');
      },
      (err) => setLocState(err.code === 1 ? 'denied' : 'error'),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };
  // official links that open the Google Maps / Waze app on the phone (browser if the app isn't installed)
  const mapsUrl = loc ? `https://www.google.com/maps/search/?api=1&query=${loc.lat},${loc.lng}` : '';
  const wazeUrl = loc ? `https://waze.com/ul?ll=${loc.lat},${loc.lng}&navigate=yes` : '';

  // Delivery needs either the exact location or a written address
  const deliveryMissing = mode === 'delivery' && !loc && !address.trim();
  const nameMissing = !name.trim(); // name is always required

  const message = [
    tr(settings.whatsappGreeting),
    '',
    ...cart.flatMap((x) => entryLines(x, tr)),
    '',
    `${t('msg_total')}: ${money(total)}`,
    `${t('msg_name')}: ${name.trim()}`,
    ...(mode === 'delivery'
      ? [
          `🛵 ${t('msg_delivery_title')}`,
          address.trim() ? `${t('msg_address')}: ${address.trim()}` : null,
          loc ? `📍 ${t('msg_location')}:` : null,
          loc ? `Google Maps: ${mapsUrl}` : null,
          loc ? `Waze: ${wazeUrl}` : null
        ]
      : [t('msg_pickup')]),
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
                    {(x.options || []).map((g, i) => (
                      <span key={i} className="cart-opts">
                        {tr(g.group)}: {g.items.map((o) => tr(o.name)).join(tr(SEP))}
                      </span>
                    ))}
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
              <label htmlFor="cart-name">
                <span className="lbl">{t('your_name')}<span className="req" aria-hidden="true">*</span></span>
              </label>
              <input
                id="cart-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                required
                aria-required="true"
                aria-invalid={tried && nameMissing}
                aria-describedby={tried && nameMissing ? 'name-error' : undefined}
              />
              {tried && nameMissing && <p id="name-error" className="opt-error" role="alert">{t('name_required')}</p>}
              <div className="seg" role="group" aria-label={`${t('pickup')} / ${t('delivery')}`}>
                <button type="button" aria-pressed={mode === 'pickup'} className={mode === 'pickup' ? 'active' : ''} onClick={() => setMode('pickup')}>
                  <Icon name="store" size={18} /> {t('pickup')}
                </button>
                <button type="button" aria-pressed={mode === 'delivery'} className={mode === 'delivery' ? 'active' : ''} onClick={() => setMode('delivery')}>
                  <Icon name="bike" size={18} /> {t('delivery')}
                </button>
              </div>
              {mode === 'delivery' && (
                <div className={`delivery-box ${tried && deliveryMissing ? 'has-error' : ''}`}>
                  {loc ? (
                    <div className="loc-ok" role="status">
                      <Icon name="check" size={18} />
                      <span>
                        {t('loc_saved')} <span className="muted small">(±{loc.acc} {t('meters')})</span>
                      </span>
                      <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-link">{t('view_on_map')}</a>
                      <button type="button" className="btn btn-sm btn-link" onClick={() => setLoc(null)}>{t('remove')}</button>
                    </div>
                  ) : (
                    <button type="button" className="btn btn-outline btn-block" onClick={getLocation} disabled={locState === 'loading'} aria-busy={locState === 'loading'}>
                      <Icon name="navigation" size={18} /> {locState === 'loading' ? t('loc_loading') : t('share_location')}
                    </button>
                  )}
                  {locState === 'denied' && <p className="opt-error" role="alert">{t('loc_denied')}</p>}
                  {locState === 'error' && <p className="opt-error" role="alert">{t('loc_error')}</p>}

                  <label htmlFor="cart-address">
                    <span className="lbl">
                      {loc ? t('address_details') : t('address')}
                      {!loc && <span className="req" aria-hidden="true">*</span>}
                    </span>
                  </label>
                  <input
                    id="cart-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    autoComplete="street-address"
                    placeholder={loc ? t('address_details_ph') : t('address_ph')}
                    aria-invalid={tried && deliveryMissing}
                    aria-describedby="addr-help"
                  />
                  <p id="addr-help" className={tried && deliveryMissing ? 'opt-error' : 'muted small'} role={tried && deliveryMissing ? 'alert' : undefined}>
                    {tried && deliveryMissing ? t('need_location_or_address') : loc ? t('address_details_help') : t('location_or_address_help')}
                  </p>
                </div>
              )}
              <label htmlFor="cart-notes">{t('notes')}</label>
              <textarea id="cart-notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <a
              className="btn btn-wa btn-lg btn-block"
              href={waLink(settings.whatsapp, message)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => {
                if (nameMissing || deliveryMissing) {
                  e.preventDefault();
                  setTried(true);
                  // focus the first field that needs fixing
                  document.getElementById(nameMissing ? 'cart-name' : 'cart-address')?.focus();
                }
              }}
            >
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
