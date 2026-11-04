import { useEffect, useState } from 'react';
import { useLang } from '../i18n.jsx';
import { money, pad, timeLeft, waLink } from '../utils.js';
import WhatsAppIcon from './WhatsAppIcon.jsx';
import Icon from './Icon.jsx';

function Countdown({ endAt, onExpire }) {
  const { t } = useLang();
  const [left, setLeft] = useState(() => timeLeft(endAt));
  useEffect(() => {
    const id = setInterval(() => {
      const l = timeLeft(endAt);
      setLeft(l);
      if (l.ms <= 0) {
        clearInterval(id);
        onExpire?.();
      }
    }, 1000);
    return () => clearInterval(id);
  }, [endAt, onExpire]);

  return (
    <div className="countdown">
      <span className="countdown-label"><Icon name="timer" size={16} /> {t('deal_ends_in')}</span>
      {/* aria-hidden: a ticking timer would flood screen readers every second */}
      <span className="countdown-time num" aria-hidden="true">
        {left.days > 0 && <span className="countdown-days">{left.days} {t('days')} + </span>}
        <span dir="ltr">{pad(left.hours)}:{pad(left.minutes)}:{pad(left.seconds)}</span>
      </span>
    </div>
  );
}

export default function DealsSection({ deals, settings, onAdd, onOpen, onExpire }) {
  const { t, tr } = useLang();
  if (!deals.length) return null;

  return (
    <section className="section deals" id="deals" aria-labelledby="deals-title">
      <div className="container">
        <h2 className="section-title" id="deals-title"><Icon name="flame" size={30} className="title-icon" /> {t('deals_title')}</h2>
        <div className="deals-grid">
          {deals.map((d) => {
            const msg = `${tr(settings.whatsappGreeting)}\n• ${tr(d.title)} (${money(d.price)})`;
            const off = d.originalPrice > d.price ? Math.round((1 - d.price / d.originalPrice) * 100) : 0;
            return (
              <article className="deal-card" key={d._id}>
                <div className="deal-img">
                  {d.image ? (
                    <img src={d.image} alt={tr(d.title)} loading="lazy" decoding="async" />
                  ) : (
                    <div className="img-placeholder" aria-hidden="true"><Icon name="pizza" size={64} strokeWidth={1.5} /></div>
                  )}
                  {off > 0 && <span className="deal-ribbon num" dir="ltr">-{off}%</span>}
                </div>
                <div className="deal-body">
                  <h3>{tr(d.title)}</h3>
                  {tr(d.description) && <p>{tr(d.description)}</p>}
                  <div className="price-row">
                    <span className="price-new num">{money(d.price)}</span>
                    {off > 0 && <del className="price-old num">{money(d.originalPrice)}</del>}
                  </div>
                  <Countdown endAt={d.endAt} onExpire={onExpire} />
                  {d.item && d.item.available !== false ? (
                  // the deal IS a menu item: open its choices (drink, toppings) at the deal price
                  <div className="card-actions">
                    <button type="button" className="btn btn-red" onClick={() => onOpen(d.item)}>
                      <Icon name="sliders" size={18} /> {(d.item.optionGroups || []).length ? t('choose_and_add') : t('add')}
                    </button>
                  </div>
                  ) : (
                  <div className="card-actions">
                    <a className="btn btn-wa" href={waLink(settings.whatsapp, msg)} target="_blank" rel="noopener noreferrer">
                      <WhatsAppIcon size={18} /> {t('order_whatsapp')}
                    </a>
                    <button
                      type="button"
                      className="btn btn-outline"
                      aria-label={`${t('add')}: ${tr(d.title)}`}
                      onClick={() => onAdd({ key: `deal-${d._id}`, kind: 'deal', id: d._id, name: d.title, price: d.price })}
                    >
                      <Icon name="plus" size={18} /> {t('add')}
                    </button>
                  </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
