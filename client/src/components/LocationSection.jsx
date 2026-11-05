import { useLang } from '../i18n.jsx';
import { formatPhone, telLink, waLink } from '../utils.js';
import WhatsAppIcon from './WhatsAppIcon.jsx';
import Icon from './Icon.jsx';

export default function LocationSection({ settings, onWhatsApp }) {
  const { t, tr } = useLang();
  const address = tr(settings.address);
  const mapsLink = settings.mapLink || (address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : '');

  return (
    <section className="section location" id="location" aria-labelledby="location-title">
      <div className="container">
        <h2 className="section-title" id="location-title">
          <Icon name="pin" size={30} className="title-icon" /> {t('location_title')}
        </h2>
        <div className="location-grid">
          <div className="map-box">
            {settings.mapUrl ? (
              <iframe
                title={t('location_title')}
                src={settings.mapUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            ) : (
              <div className="map-placeholder">
                <Icon name="map" size={40} strokeWidth={1.5} />
                <span>{t('map_soon')}</span>
              </div>
            )}
          </div>
          <address className="contact-box">
            {address && (
              <p className="address">
                <Icon name="pin" size={20} /> {address}
              </p>
            )}
            <a className="contact-line" href={telLink(settings.phone)}>
              <span className="contact-ico">
                <Icon name="phone" size={20} />
              </span>
              <span dir="ltr" className="num">
                {formatPhone(settings.phone)}
              </span>
            </a>
            <a
              className="contact-line"
              href={waLink(settings.whatsapp, tr(settings.whatsappGreeting))}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onWhatsApp}
            >
              <span className="contact-ico wa">
                <WhatsAppIcon size={20} />
              </span>
              {t('whatsapp')}
            </a>
            {settings.instagram && (
              <a className="contact-line" href={settings.instagram} target="_blank" rel="noopener noreferrer">
                <span className="contact-ico">
                  <Icon name="instagram" size={20} />
                </span>
                {t('instagram')}
              </a>
            )}
            {mapsLink && (
              <a className="btn btn-green" href={mapsLink} target="_blank" rel="noopener noreferrer">
                <Icon name="navigation" size={18} /> {t('open_in_maps')}
              </a>
            )}
          </address>
        </div>
      </div>
    </section>
  );
}
