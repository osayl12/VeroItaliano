import { useLang } from '../i18n.jsx';
import { formatPhone, telLink } from '../utils.js';
import Logo from './Logo.jsx';
import Icon from './Icon.jsx';

export default function Footer({ settings }) {
  const { t } = useLang();
  return (
    <footer className="footer">
      <div className="flag-bar" aria-hidden="true"><i /><i /><i /></div>
      <div className="container footer-inner">
        <Logo small />
        <div className="footer-links">
          <a href={telLink(settings.phone)}><Icon name="phone" size={18} /> <span dir="ltr" className="num">{formatPhone(settings.phone)}</span></a>
          {settings.instagram && (
            <a href={settings.instagram} target="_blank" rel="noopener noreferrer"><Icon name="instagram" size={18} /> {t('instagram')}</a>
          )}
        </div>
        <p className="muted small">© {new Date().getFullYear()} Vero Italiano · {t('footer_rights')}</p>
      </div>
    </footer>
  );
}
