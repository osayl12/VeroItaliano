import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useLang } from '../i18n.jsx';
import { ActsProvider, Act, useActs } from '../evening/acts.jsx';
import Embers from '../evening/Embers.jsx';
import ThePull from '../evening/ThePull.jsx';
import { LangSwitch } from '../components/Header.jsx';
import Icon from '../components/Icon.jsx';
import WhatsAppIcon from '../components/WhatsAppIcon.jsx';
import { finalPrice, formatPhone, israelNow, money, openStatus, telLink, waLink } from '../utils.js';
import '../evening/evening.css';

/**
 * "One Evening at the Oven" – scroll landing page.
 * Chapters of one evening, joined by cuts:
 *   fire (layered hero) → craft (zoom + lines) → tonight's menu (sideways table) → hush (silence)
 *   → THE PULL (peak) → tonight's deals (plates land) → last call (live status, holds)
 * The full menu with ordering lives on /menu.
 */

const RAIL = [
  { id: 'fire', key: 'ev_rail_fire' },
  { id: 'craft', key: 'ev_rail_craft' },
  { id: 'tonight', key: 'ev_rail_menu' },
  { id: 'pull', key: 'ev_rail_pull' },
  { id: 'deals', key: 'ev_rail_deals' },
  { id: 'order', key: 'ev_rail_order' }
];

function EveningRail({ settings, hasDeals }) {
  const { t } = useLang();
  const ref = useRef(null);
  const today = (settings.hours || []).find((h) => h.day === israelNow().day);
  const items = RAIL.filter((r) => r.id !== 'deals' || hasDeals);

  // flame position = how far through the evening (the page) you are
  useEffect(() => {
    let raf = 0;
    const set = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      ref.current?.style.setProperty('--rail', String(max > 0 ? Math.min(1, window.scrollY / max) : 0));
    };
    const req = () => raf || (raf = requestAnimationFrame(set));
    window.addEventListener('scroll', req, { passive: true });
    set();
    return () => window.removeEventListener('scroll', req);
  }, []);

  return (
    <nav className="ev-rail" ref={ref} aria-label={t('nav_menu')}>
      <span className="ev-rail-time num" dir="ltr">{today && !today.closed ? today.open : ''}</span>
      <div className="ev-rail-line">
        <span className="ev-rail-fill" aria-hidden="true" />
        <span className="ev-rail-flame" aria-hidden="true"><Icon name="flame" size={16} /></span>
        <ol className="ev-rail-stops">
          {items.map((r) => (
            <li key={r.id}><a href={`#${r.id}`}>{t(r.key)}</a></li>
          ))}
        </ol>
      </div>
      <span className="ev-rail-time num" dir="ltr">{today && !today.closed ? today.close : t('ev_closed_today')}</span>
    </nav>
  );
}

function Hero({ settings, layers }) {
  const { t, tr } = useLang();
  const ref = useRef(null);
  const { reduced } = useActs();

  // pointer depth: each plane moves a different amount (desktop only)
  useEffect(() => {
    if (reduced || window.matchMedia('(pointer: coarse)').matches) return;
    const el = ref.current;
    const move = (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
      el.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
    };
    el.addEventListener('pointermove', move);
    return () => el.removeEventListener('pointermove', move);
  }, [reduced]);

  return (
    <Act id="fire" span={1.5} reducedValue={0} label={t('ev_rail_fire')}>
      <div className="hero-planes" ref={ref}>
        <div className="hp-bg" aria-hidden="true" />
        <div className="hp-subject">
          <picture>
            <source srcSet="/logo.webp" type="image/webp" />
            <img src="/logo.png" alt="Vero Italiano" width="720" height="638" />
          </picture>
        </div>
        <Embers count={46} className="hp-atmo" />
        <div className="hp-copy">
          <h1>{t('ev_hero_title')}</h1>
          <p>{tr(settings.tagline)}</p>
          <div className="hp-cta">
            <Link className="btn btn-red btn-lg" to="/menu"><Icon name="utensils" size={20} /> {t('ev_order_now')}</Link>
            <a className="btn btn-outline btn-lg" href={telLink(settings.phone)}><Icon name="phone" size={20} /> <span dir="ltr" className="num">{formatPhone(settings.phone)}</span></a>
          </div>
        </div>
        {/* foreground plane: real pizzas, out of focus, overlapping the lower corners */}
        <div className="hp-fore" aria-hidden="true">
          {layers[0] && <img className="hp-fore-a" src={layers[0]} alt="" />}
          {layers[1] && <img className="hp-fore-b" src={layers[1]} alt="" />}
        </div>
      </div>
    </Act>
  );
}

export default function EveningPage() {
  return (
    <ActsProvider>
      <Evening />
    </ActsProvider>
  );
}

function Evening() {
  const { t, tr } = useLang();
  const { reduced } = useActs();
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const pullRef = useRef(null);
  const trackRef = useRef(null);

  const load = useCallback(() => api.site().then((d) => { setData(d); setError(false); }).catch(() => setError(true)), []);
  useEffect(() => { load(); }, [load]);

  // deal price wins while a deal runs (same rule as /menu)
  const menu = useMemo(() => {
    const dp = new Map();
    for (const d of data?.deals || []) for (const id of d.items || []) dp.set(String(id), Number(d.price));
    return (data?.menu || []).map((m) => (dp.has(String(m._id)) && dp.get(String(m._id)) < m.price ? { ...m, salePrice: dp.get(String(m._id)) } : m));
  }, [data]);
  const plates = useMemo(
    () => menu.filter((m) => ['pizza', 'focaccia', 'combos'].includes(m.category) && m.image && m.available !== false),
    [menu]
  );
  const featured = useMemo(
    () => menu.find((m) => m.featured && m.image) || plates.find((m) => m.category === 'pizza') || null,
    [menu, plates]
  );
  const foreLayers = plates.filter((m) => m.category === 'pizza' && m._id !== featured?._id).slice(0, 2).map((m) => m.image);

  // sideways table: how far the track must travel (RTL: content overflows to the left)
  const onPan = useCallback((p) => {
    const el = trackRef.current;
    if (!el) return;
    const dist = Math.max(0, el.scrollWidth - el.parentElement.clientWidth);
    el.style.transform = `translate3d(${(p * dist).toFixed(1)}px, 0, 0)`;
  }, []);

  if (error && !data) {
    return (
      <div className="center-screen" role="alert">
        <p>{t('load_error')}</p>
        <button type="button" className="btn btn-green" onClick={load}><Icon name="refresh" size={18} /> {t('retry')}</button>
      </div>
    );
  }
  if (!data) return <div className="ev-loading" aria-busy="true"><div className="ev-loading-glow" /></div>;

  const { settings, deals } = data;
  const st = openStatus(settings);
  const greeting = tr(settings.whatsappGreeting);

  return (
    <div className="evening">
      <a href="#main" className="skip-link">{t('skip_to_content')}</a>
      <header className="ev-top">
        <Link to="/" className="ev-brand" aria-label="Vero Italiano">
          <picture>
            <source srcSet="/logo.webp" type="image/webp" />
            <img src="/logo.png" alt="" width="720" height="638" />
          </picture>
        </Link>
        <EveningRail settings={settings} hasDeals={deals.length > 0} />
        <div className="ev-top-actions">
          <LangSwitch />
          <Link to="/menu" className="btn btn-sm btn-outline ev-menu-link"><Icon name="utensils" size={16} /> {t('ev_full_menu')}</Link>
        </div>
      </header>

      <main id="main" tabIndex={-1}>
        {/* 1. FIRE – layered hero */}
        <Hero settings={settings} layers={foreLayers} />

        {/* 2. CRAFT – macro zoom + lines that assemble (real facts from his menu) */}
        <Act id="craft" span={1.6} label={t('ev_rail_craft')}>
          <div className="craft">
            <div className="craft-img">
              {plates[0] && <img src={(menu.find((m) => m.name.he.includes('סטלה')) || plates[0]).image} alt="" />}
            </div>
            <div className="craft-copy">
              <h2>{t('ev_craft_title')}</h2>
              <ul>
                {['ev_craft_1', 'ev_craft_2', 'ev_craft_3'].map((k, i) => (
                  <li key={k} style={{ '--i': i }}>{t(k)}</li>
                ))}
              </ul>
            </div>
          </div>
        </Act>

        {/* 3. TONIGHT'S MENU – a long table that slides sideways */}
        <Act id="tonight" span={1.8} label={t('ev_rail_menu')} onProgress={onPan}>
          <div className="table">
            <h2 className="table-title">{t('ev_menu_title')}</h2>
            <div className="table-window">
              <ul className="table-track" ref={trackRef}>
                {plates.map((m) => (
                  <li key={m._id}>
                    <Link to={`/menu?item=${m._id}`} className="plate">
                      <span className="plate-img"><img src={m.image} alt="" loading="lazy" decoding="async" /></span>
                      <span className="plate-name">{tr(m.name)}</span>
                      <span className="plate-price num">{money(finalPrice(m))}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Act>

        {/* 4. HUSH – authored silence before the peak */}
        <Act id="hush" span={1.4} reducedValue={0.5} label={t('ev_hush')}>
          <div className="hush">
            <div className="hush-fire" aria-hidden="true" />
            <p className="hush-word">{t('ev_hush')}</p>
          </div>
        </Act>

        {/* 5. THE PULL – peak, largest span */}
        {featured && (
          <Act id="pull" span={2.6} reducedValue={0.62} label={t('ev_rail_pull')} onProgress={(p, v) => { pullRef.current?.draw(p, v); document.getElementById('pull')?.classList.toggle('is-done', p > 0.8); }}>
            <div className="pull">
              <div className="pull-stage">
                <ThePull ref={pullRef} src={featured.image} alt={tr(featured.name)} staticProgress={reduced ? 0.62 : 0} />
              </div>
              <div className="pull-copy">
                <h2 className="pull-cue">{t('ev_pull_title')}</h2>
                <div className="pull-end">
                  <p className="pull-name">{tr(featured.name)}</p>
                  <p className="pull-price num">{money(finalPrice(featured))}</p>
                  <Link to={`/menu?item=${featured._id}`} className="btn btn-red btn-lg">{t('ev_pull_want')}</Link>
                </div>
              </div>
            </div>
          </Act>
        )}

        {/* 6. TONIGHT'S DEALS – plates land on the table */}
        {deals.length > 0 && (
          <Act id="deals" span={1.4} label={t('ev_rail_deals')}>
            <div className="ev-deals">
              <h2>{t('ev_deals_title')}</h2>
              <ul>
                {deals.slice(0, 3).map((d, i) => (
                  <li key={d._id} style={{ '--i': i }}>
                    <a className="ev-deal" href={d.item ? `/menu?item=${d.item._id}` : waLink(settings.whatsapp, `${greeting}\n• ${tr(d.title)} (${money(d.price)})`)} {...(d.item ? {} : { target: '_blank', rel: 'noopener noreferrer' })}>
                      {d.image && <img src={d.image} alt="" loading="lazy" />}
                      <span className="ev-deal-title">{tr(d.title)}</span>
                      <span className="ev-deal-price num">{money(d.price)}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </Act>
        )}

        {/* 7. LAST CALL – live status, the page stops and responds */}
        <section id="order" className="last-call" aria-labelledby="last-title">
          <Embers count={60} followPointer className="lc-embers" />
          <div className="lc-inner">
            <h2 id="last-title">
              {st.temp
                ? t('temp_closed')
                : st.open
                  ? t('ev_close_open').replace('{t}', st.closesAt)
                  : st.opensAt
                    ? t('ev_close_closed').replace('{t}', st.opensAt)
                    : t('closed_now')}
            </h2>
            <p>{st.temp ? tr(settings.tempClosedMessage) : t('ev_close_sub')}</p>
            <div className="lc-cta">
              <a className="btn btn-red btn-lg" href={telLink(settings.phone)}><Icon name="phone" size={20} /> {t('call_to_order')}</a>
              <a className="btn btn-wa btn-lg" href={waLink(settings.whatsapp, greeting)} target="_blank" rel="noopener noreferrer"><WhatsAppIcon size={22} /> {t('order_whatsapp')}</a>
              <Link className="btn btn-outline btn-lg" to="/menu"><Icon name="utensils" size={20} /> {t('ev_full_menu')}</Link>
            </div>
            <p className="lc-meta">
              {tr(settings.address) && <span><Icon name="pin" size={16} /> {tr(settings.address)}</span>}
              <a href={telLink(settings.phone)} dir="ltr" className="num">{formatPhone(settings.phone)}</a>
              {settings.instagram && <a href={settings.instagram} target="_blank" rel="noopener noreferrer"><Icon name="instagram" size={16} /> {t('instagram')}</a>}
            </p>
          </div>
        </section>
      </main>

      <nav className="mobile-bar" aria-label={t('call_to_order')}>
        <a href={telLink(settings.phone)} className="mb-btn mb-call"><Icon name="phone" size={22} /><span>{t('call')}</span></a>
        <a href={waLink(settings.whatsapp, greeting)} target="_blank" rel="noopener noreferrer" className="mb-btn mb-wa"><WhatsAppIcon size={22} /><span>{t('whatsapp')}</span></a>
        <Link to="/menu" className="mb-btn"><Icon name="utensils" size={22} /><span>{t('nav_menu')}</span></Link>
      </nav>
    </div>
  );
}
