import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { useLang } from '../../i18n.jsx';
import Icon from '../../components/Icon.jsx';
import { BiInput, Toast, useToast } from './fields.jsx';
import { StatusBadge } from '../../components/Hero.jsx';

export default function HoursManager() {
  const { t } = useLang();
  const [s, setS] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, toast] = useToast();

  useEffect(() => {
    api
      .getSettings()
      .then(setS)
      .catch((e) => toast(e.message, true));
  }, [toast]);
  if (!s) return <p>{t('loading')}</p>;

  const hours = [0, 1, 2, 3, 4, 5, 6].map(
    (d) => s.hours.find((h) => h.day === d) || { day: d, closed: true, open: '16:30', close: '23:00' }
  );
  const setDay = (day, patch) => setS({ ...s, hours: hours.map((h) => (h.day === day ? { ...h, ...patch } : h)) });
  const copyToAll = (h) => setS({ ...s, hours: hours.map((x) => ({ ...x, open: h.open, close: h.close, closed: h.closed })) });

  const save = async () => {
    setBusy(true);
    try {
      setS(await api.saveSettings({ hours, tempClosed: s.tempClosed, tempClosedMessage: s.tempClosedMessage }));
      toast(t('saved'));
    } catch (e) {
      toast(`${t('error')}: ${e.message}`, true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card form">
      <div className="center">
        <StatusBadge settings={{ ...s, hours }} />
      </div>

      <label className={`check big-switch ${s.tempClosed ? 'on' : ''}`}>
        <input type="checkbox" checked={!!s.tempClosed} onChange={(e) => setS({ ...s, tempClosed: e.target.checked })} />
        <Icon name="ban" size={20} /> {t('temp_closed_switch')}
      </label>
      {s.tempClosed && (
        <BiInput label={t('temp_closed_msg')} value={s.tempClosedMessage} onChange={(v) => setS({ ...s, tempClosedMessage: v })} />
      )}

      <div className="hours-edit">
        {hours.map((h) => (
          <div key={h.day} className={`hours-row ${h.closed ? 'is-closed' : ''}`}>
            <b className="day">{t(`day_${h.day}`)}</b>
            <label className="check">
              <input type="checkbox" checked={h.closed} onChange={(e) => setDay(h.day, { closed: e.target.checked })} /> {t('closed_day')}
            </label>
            {!h.closed && (
              <>
                <label>
                  {t('open')}
                  <input type="time" value={h.open} onChange={(e) => setDay(h.day, { open: e.target.value })} />
                </label>
                <label>
                  {t('close_time')}
                  <input type="time" value={h.close} onChange={(e) => setDay(h.day, { close: e.target.value })} />
                </label>
              </>
            )}
            <button type="button" className="btn btn-link btn-sm" onClick={() => copyToAll(h)}>
              <Icon name="copy" size={16} /> {t('copy_all')}
            </button>
          </div>
        ))}
      </div>
      <p className="muted small hint">
        <Icon name="info" size={16} /> {t('after_midnight_hint')}
      </p>
      <div className="form-actions">
        <button className="btn btn-green" onClick={save} disabled={busy}>
          {busy ? '...' : t('save')}
        </button>
      </div>
      <Toast msg={msg} />
    </div>
  );
}
