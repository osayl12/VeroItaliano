import { useEffect, useState } from 'react';
import { useLang } from '../i18n.jsx';
import { openStatus, telLink, waLink, formatPhone } from '../utils.js';
import WhatsAppIcon from './WhatsAppIcon.jsx';
import Logo from './Logo.jsx';
import Icon from './Icon.jsx';

// Open / closed badge. Uses an icon + text, never color alone.
export function StatusBadge({ settings }) {
  const { t, tr } = useLang();
  const [, tick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => tick((x) => x + 1), 30_000);
    return () => clearInterval(id);
  }, []);
  const st = openStatus(settings);

  if (st.temp) {
    return (
      <span className="status closed" role="status">
        <Icon name="ban" size={16} /> {t('temp_closed')}
        {tr(settings.tempClosedMessage) ? ` – ${tr(settings.tempClosedMessage)}` : ''}
      </span>
    );
  }
  if (st.open) {
    return (
      <span className="status open" role="status">
        <span className="dot" aria-hidden="true" /> {t('open_now')} · {t('closes_at')}<bdi className="num">{st.closesAt}</bdi>
      </span>
    );
  }
  return (
    <span className="status closed" role="status">
      <Icon name="clock" size={16} /> {t('closed_now')}
      {st.opensAt && (
        <>
          {' · '}{t('opens_at')}<bdi className="num">{st.opensAt}</bdi>
          {st.opensDay != null && ` (${t(`day_${st.opensDay}`)})`}
        </>
      )}
    </span>
  );
}

export default function Hero({ settings }) {
  const { t, tr } = useLang();

  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <div className="hero-glow" aria-hidden="true" />
      <div className="container hero-content">
        <Logo />
        <h1 id="hero-title">{t('hero_title')}</h1>
        <p className="tagline">{tr(settings.tagline)}</p>
        <StatusBadge settings={settings} />
        <div className="hero-buttons">
          <a className="btn btn-red btn-lg" href={telLink(settings.phone)}>
            <Icon name="phone" size={20} /> {t('call_to_order')}
          </a>
          <a className="btn btn-wa btn-lg" href={waLink(settings.whatsapp, tr(settings.whatsappGreeting))} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcon size={22} /> {t('order_whatsapp')}
          </a>
        </div>
        <a className="hero-phone num" href={telLink(settings.phone)} dir="ltr">{formatPhone(settings.phone)}</a>
      </div>
    </section>
  );
}
