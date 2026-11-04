import { useLang } from '../i18n.jsx';
import { israelNow } from '../utils.js';
import { StatusBadge } from './Hero.jsx';
import Icon from './Icon.jsx';

export default function HoursSection({ settings }) {
  const { t } = useLang();
  const today = israelNow().day;
  const hours = [...(settings.hours || [])].sort((a, b) => a.day - b.day);

  return (
    <section className="section hours" id="hours" aria-labelledby="hours-title">
      <div className="container narrow">
        <h2 className="section-title" id="hours-title"><Icon name="clock" size={30} className="title-icon" /> {t('hours_title')}</h2>
        <div className="center"><StatusBadge settings={settings} /></div>
        <table className="hours-table">
          <caption className="sr-only">{t('hours_title')}</caption>
          <tbody>
            {hours.map((h) => (
              <tr key={h.day} className={h.day === today ? 'today' : ''} aria-current={h.day === today ? 'date' : undefined}>
                <th scope="row">
                  {t(`day_${h.day}`)}
                  {h.day === today && <span className="today-tag">{t('today')}</span>}
                </th>
                <td className="hours-cell num">
                  {h.closed ? <span className="muted">{t('closed')}</span> : <bdi dir="ltr">{h.open} – {h.close}</bdi>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
