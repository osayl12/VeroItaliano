import { useState } from 'react';
import { useLang } from '../i18n.jsx';
import Logo from './Logo.jsx';
import Icon from './Icon.jsx';

export function LangSwitch({ className = '' }) {
  const { lang, setLang, t } = useLang();
  return (
    <div className={`lang-switch ${className}`} role="group" aria-label={t('language')}>
      <button type="button" aria-pressed={lang === 'he'} className={lang === 'he' ? 'active' : ''} onClick={() => setLang('he')} lang="he">עב</button>
      <button type="button" aria-pressed={lang === 'ar'} className={lang === 'ar' ? 'active' : ''} onClick={() => setLang('ar')} lang="ar">عر</button>
    </div>
  );
}

export default function Header({ cartCount, onCart, showDeals }) {
  const { t } = useLang();
  const [menuOpen, setMenuOpen] = useState(false);
  const close = () => setMenuOpen(false);

  return (
    <header className="header">
      <div className="container header-inner">
        <a href="#top" className="brand" onClick={close} aria-label="Vero Italiano">
          <Logo small />
        </a>

        <nav id="main-nav" className={`nav ${menuOpen ? 'open' : ''}`} aria-label={t('nav_menu')}>
          {showDeals && <a href="#deals" onClick={close}><Icon name="flame" size={18} /> {t('nav_deals')}</a>}
          <a href="#menu" onClick={close}><Icon name="utensils" size={18} /> {t('nav_menu')}</a>
          <a href="#hours" onClick={close}><Icon name="clock" size={18} /> {t('nav_hours')}</a>
          <a href="#location" onClick={close}><Icon name="pin" size={18} /> {t('nav_location')}</a>
        </nav>

        <div className="header-actions">
          <LangSwitch />
          <button type="button" className="icon-btn cart-btn" onClick={onCart} aria-label={`${t('cart')} (${cartCount})`}>
            <Icon name="bag" size={22} />
            {cartCount > 0 && <span className="badge-count" aria-hidden="true">{cartCount}</span>}
          </button>
          <button
            type="button"
            className="icon-btn burger"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? t('close') : t('open_menu')}
            aria-expanded={menuOpen}
            aria-controls="main-nav"
          >
            <Icon name={menuOpen ? 'x' : 'menu'} size={24} />
          </button>
        </div>
      </div>
    </header>
  );
}
