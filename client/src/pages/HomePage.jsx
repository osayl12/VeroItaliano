import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import { useLang } from '../i18n.jsx';
import Header from '../components/Header.jsx';
import Hero from '../components/Hero.jsx';
import DealsSection from '../components/DealsSection.jsx';
import MenuSection from '../components/MenuSection.jsx';
import HoursSection from '../components/HoursSection.jsx';
import LocationSection from '../components/LocationSection.jsx';
import Footer from '../components/Footer.jsx';
import CartDrawer from '../components/CartDrawer.jsx';
import ItemSheet from '../components/ItemSheet.jsx';
import WhatsAppIcon from '../components/WhatsAppIcon.jsx';
import Icon from '../components/Icon.jsx';
import { telLink, waLink } from '../utils.js';

const CART_KEY = 'vi_cart';
const loadCart = () => {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
};

// Placeholder layout while the first request loads (avoids a blank screen / layout jump)
function Skeleton() {
  return (
    <div className="skeleton-page" aria-busy="true">
      <div className="sk sk-header" />
      <div className="sk sk-hero" />
      <div className="container sk-grid">
        {[0, 1, 2, 3].map((i) => <div key={i} className="sk sk-card" />)}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { t, tr } = useLang();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [cart, setCart] = useState(loadCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [sheetItem, setSheetItem] = useState(null); // item whose details/choices panel is open

  const load = useCallback(() => {
    api.site().then((d) => { setData(d); setError(false); }).catch(() => setError(true));
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000); // refresh hours / deals every minute
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {}
  }, [cart]);

  // cart entry: { key, kind: 'item'|'deal', id, name:{he,ar}, price (incl. options), qty, options?: [{ group:{he,ar}, items:[{ name:{he,ar}, price }] }] }
  const addToCart = (entry) => {
    const add = entry.qty || 1;
    setCart((c) => {
      const found = c.find((x) => x.key === entry.key);
      if (found) return c.map((x) => (x.key === entry.key ? { ...x, qty: x.qty + add } : x));
      return [...c, { ...entry, qty: add }];
    });
  };
  const closeSheet = useCallback(() => setSheetItem(null), []);
  const setQty = (key, qty) => setCart((c) => (qty <= 0 ? c.filter((x) => x.key !== key) : c.map((x) => (x.key === key ? { ...x, qty } : x))));
  const closeCart = useCallback(() => setCartOpen(false), []);
  const cartCount = cart.reduce((s, x) => s + x.qty, 0);

  // ids of menu items that are part of an active deal
  const dealItemIds = useMemo(() => new Set((data?.deals || []).flatMap((d) => d.items || []).map(String)), [data]);

  if (error && !data) {
    return (
      <div className="center-screen" role="alert">
        <Icon name="info" size={40} />
        <p>{t('load_error')}</p>
        <button type="button" className="btn btn-green" onClick={load}><Icon name="refresh" size={18} /> {t('retry')}</button>
      </div>
    );
  }
  if (!data) return <Skeleton />;

  const { settings, menu, deals } = data;

  return (
    <>
      <a href="#main" className="skip-link">{t('skip_to_content')}</a>
      <Header settings={settings} cartCount={cartCount} onCart={() => setCartOpen(true)} showDeals={deals.length > 0} />
      <main id="main" tabIndex={-1}>
        <Hero settings={settings} />
        <DealsSection deals={deals} settings={settings} onAdd={addToCart} onExpire={load} />
        <MenuSection menu={menu} settings={settings} dealItemIds={dealItemIds} onAdd={addToCart} onOpen={setSheetItem} />
        <HoursSection settings={settings} />
        <LocationSection settings={settings} />
      </main>
      <Footer settings={settings} />

      {/* Desktop: floating buttons */}
      <a className="wa-float desktop-only" href={waLink(settings.whatsapp, tr(settings.whatsappGreeting))} target="_blank" rel="noopener noreferrer" aria-label={t('order_whatsapp')}>
        <WhatsAppIcon size={30} />
      </a>
      {cartCount > 0 && !cartOpen && (
        <button type="button" className="cart-float desktop-only" onClick={() => setCartOpen(true)}>
          <Icon name="bag" size={20} /> {t('cart')} <span className="badge-count num">{cartCount}</span>
        </button>
      )}

      {/* Mobile: sticky bottom action bar (thumb zone) */}
      <nav className="mobile-bar" aria-label={t('call_to_order')}>
        <a href={telLink(settings.phone)} className="mb-btn mb-call"><Icon name="phone" size={22} /><span>{t('call')}</span></a>
        <a href={waLink(settings.whatsapp, tr(settings.whatsappGreeting))} target="_blank" rel="noopener noreferrer" className="mb-btn mb-wa">
          <WhatsAppIcon size={22} /><span>{t('whatsapp')}</span>
        </a>
        <button type="button" className="mb-btn mb-cart" onClick={() => setCartOpen(true)}>
          <span className="mb-ico"><Icon name="bag" size={22} />{cartCount > 0 && <span className="badge-count num">{cartCount}</span>}</span>
          <span>{t('cart')}</span>
        </button>
      </nav>

      {sheetItem && <ItemSheet item={sheetItem} onClose={closeSheet} onAdd={addToCart} settings={settings} />}
      <CartDrawer open={cartOpen} onClose={closeCart} cart={cart} setQty={setQty} clear={() => setCart([])} settings={settings} />
    </>
  );
}
