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
import { applyDealPrices, telLink, waLink } from '../utils.js';
import { loadCart, saveCart, withEntry } from '../cart.js';

// Placeholder layout while the first request loads (avoids a blank screen / layout jump)
function Skeleton() {
  return (
    <div className="skeleton-page" aria-busy="true">
      <div className="sk sk-header" />
      <div className="sk sk-hero" />
      <div className="container sk-grid">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="sk sk-card" />
        ))}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { t, tr } = useLang();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [cart, setCart] = useState(loadCart);
  // /menu?cart=1 (from the landing page's WhatsApp buttons) opens the order form
  const [cartOpen, setCartOpen] = useState(() => new URLSearchParams(window.location.search).get('cart') === '1');
  const [sheetItem, setSheetItem] = useState(null); // item whose details/choices panel is open

  const load = useCallback(() => {
    api
      .site()
      .then((d) => {
        setData(d);
        setError(false);
      })
      .catch(() => setError(true));
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 60_000); // refresh hours / deals every minute
    return () => clearInterval(id);
  }, [load]);

  useEffect(() => saveCart(cart), [cart]);

  const addToCart = (entry) => setCart((c) => withEntry(c, entry));
  const closeSheet = useCallback(() => setSheetItem(null), []);
  // With items in the cart, a WhatsApp button opens the order form instead of an empty chat,
  // so the message always contains the full order + name + pickup/delivery.
  // entry = the item/deal whose own WhatsApp button was pressed: it joins the order.
  const toCartIfOrder = (e, entry) => {
    if (!cart.length) return;
    e.preventDefault();
    if (entry) addToCart(entry);
    setCartOpen(true);
  };

  const setQty = (key, qty) =>
    setCart((c) => (qty <= 0 ? c.filter((x) => x.key !== key) : c.map((x) => (x.key === key ? { ...x, qty } : x))));
  const closeCart = useCallback(() => setCartOpen(false), []);
  const cartCount = cart.reduce((s, x) => s + x.qty, 0);

  // the menu item linked to each running deal (shown with an "on sale" badge)
  const dealItemIds = useMemo(() => new Set((data?.deals || []).filter((d) => d.item).map((d) => String(d.item._id))), [data]);
  const menuView = useMemo(() => applyDealPrices(data?.menu, data?.deals), [data]);
  const openItem = useCallback((item) => setSheetItem(menuView.find((m) => String(m._id) === String(item._id)) || item), [menuView]);

  // links from the landing page: /menu?item=<id> opens that item directly
  useEffect(() => {
    if (!menuView.length) return;
    const id = new URLSearchParams(window.location.search).get('item');
    const item = id && menuView.find((m) => String(m._id) === id);
    if (item) {
      setSheetItem(item);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, [menuView]);

  // the ?cart=1 link already opened the drawer: clean up the URL
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (!q.has('cart')) return;
    q.delete('cart');
    window.history.replaceState(null, '', window.location.pathname + (q.toString() ? `?${q}` : ''));
  }, []);

  if (error && !data) {
    return (
      <div className="center-screen" role="alert">
        <Icon name="info" size={40} />
        <p>{t('load_error')}</p>
        <button type="button" className="btn btn-green" onClick={load}>
          <Icon name="refresh" size={18} /> {t('retry')}
        </button>
      </div>
    );
  }
  if (!data) return <Skeleton />;

  const { settings, deals } = data;

  return (
    <>
      <a href="#main" className="skip-link">
        {t('skip_to_content')}
      </a>
      <Header settings={settings} cartCount={cartCount} onCart={() => setCartOpen(true)} showDeals={deals.length > 0} />
      <main id="main" tabIndex={-1}>
        <Hero settings={settings} onWhatsApp={toCartIfOrder} />
        <DealsSection deals={deals} settings={settings} onAdd={addToCart} onOpen={openItem} onExpire={load} onWhatsApp={toCartIfOrder} />
        <MenuSection
          menu={menuView}
          settings={settings}
          dealItemIds={dealItemIds}
          onAdd={addToCart}
          onOpen={openItem}
          onWhatsApp={toCartIfOrder}
        />
        <HoursSection settings={settings} />
        <LocationSection settings={settings} onWhatsApp={toCartIfOrder} />
      </main>
      <Footer settings={settings} />

      {/* Desktop: floating buttons */}
      <a
        className="wa-float desktop-only"
        href={waLink(settings.whatsapp, tr(settings.whatsappGreeting))}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={t('order_whatsapp')}
        onClick={toCartIfOrder}
      >
        <WhatsAppIcon size={30} />
      </a>
      {cartCount > 0 && !cartOpen && (
        <button type="button" className="cart-float desktop-only" onClick={() => setCartOpen(true)}>
          <Icon name="bag" size={20} /> {t('cart')} <span className="badge-count num">{cartCount}</span>
        </button>
      )}

      {/* Mobile: sticky bottom action bar (thumb zone) */}
      <nav className="mobile-bar" aria-label={t('call_to_order')}>
        <a href={telLink(settings.phone)} className="mb-btn mb-call">
          <Icon name="phone" size={22} />
          <span>{t('call')}</span>
        </a>
        <a
          href={waLink(settings.whatsapp, tr(settings.whatsappGreeting))}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-btn mb-wa"
          onClick={toCartIfOrder}
        >
          <WhatsAppIcon size={22} />
          <span>{t('whatsapp')}</span>
        </a>
        <button type="button" className="mb-btn mb-cart" onClick={() => setCartOpen(true)}>
          <span className="mb-ico">
            <Icon name="bag" size={22} />
            {cartCount > 0 && <span className="badge-count num">{cartCount}</span>}
          </span>
          <span>{t('cart')}</span>
        </button>
      </nav>

      {sheetItem && <ItemSheet item={sheetItem} onClose={closeSheet} onAdd={addToCart} onCheckout={() => setCartOpen(true)} />}
      <CartDrawer open={cartOpen} onClose={closeCart} cart={cart} setQty={setQty} clear={() => setCart([])} settings={settings} />
    </>
  );
}
