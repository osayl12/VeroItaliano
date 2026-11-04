import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import { useLang } from '../../i18n.jsx';
import Icon from '../../components/Icon.jsx';
import { BiInput, Toast, useToast } from './fields.jsx';

export default function SettingsManager() {
  const { t } = useLang();
  const [s, setS] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '' });
  const [msg, toast] = useToast();

  useEffect(() => { api.getSettings().then(setS).catch((e) => toast(e.message, true)); }, []);
  if (!s) return <p>{t('loading')}</p>;
  const set = (k) => (v) => setS({ ...s, [k]: v });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { phone, whatsapp, whatsappGreeting, address, mapUrl, mapLink, instagram, tagline } = s;
      setS(await api.saveSettings({ phone, whatsapp, whatsappGreeting, address, mapUrl, mapLink, instagram, tagline }));
      toast(t('saved'));
    } catch (err) {
      toast(`${t('error')}: ${err.message}`, true);
    } finally {
      setBusy(false);
    }
  };

  const changePw = async (e) => {
    e.preventDefault();
    try {
      await api.changePassword(pw.current, pw.next);
      setPw({ current: '', next: '' });
      toast(t('password_changed'));
    } catch (err) {
      toast(`${t('error')}: ${err.message}`, true);
    }
  };

  return (
    <>
      <form className="card form" onSubmit={save}>
        <div className="row">
          <label><span className="lbl"><Icon name="phone" size={16} /> {t('phone')}</span><input dir="ltr" type="tel" inputMode="tel" value={s.phone} onChange={(e) => set('phone')(e.target.value)} /></label>
          <label><span className="lbl">{t('whatsapp_number')}</span><input dir="ltr" inputMode="numeric" value={s.whatsapp} onChange={(e) => set('whatsapp')(e.target.value)} /></label>
        </div>
        <BiInput label={t('whatsapp_greeting')} value={s.whatsappGreeting} onChange={set('whatsappGreeting')} />
        <BiInput label={t('tagline')} value={s.tagline} onChange={set('tagline')} />
        <BiInput label={t('address_field')} value={s.address} onChange={set('address')} />
        <label><span className="lbl"><Icon name="map" size={16} /> {t('map_url')}</span>
          <textarea dir="ltr" rows={3} value={s.mapUrl} onChange={(e) => set('mapUrl')(e.target.value)} placeholder='<iframe src="https://www.google.com/maps/embed?pb=..." ...></iframe>' />
          <span className="muted small hint"><Icon name="info" size={14} /> {t('map_help')}</span>
        </label>
        <label><span className="lbl"><Icon name="navigation" size={16} /> {t('map_link')}</span><input dir="ltr" type="url" value={s.mapLink} onChange={(e) => set('mapLink')(e.target.value)} placeholder="https://maps.app.goo.gl/..." /></label>
        <label><span className="lbl"><Icon name="instagram" size={16} /> {t('instagram_url')}</span><input dir="ltr" type="url" value={s.instagram} onChange={(e) => set('instagram')(e.target.value)} /></label>
        {s.mapUrl && <div className="map-box small-map"><iframe title="map" src={s.mapUrl} loading="lazy" /></div>}
        <div className="form-actions"><button className="btn btn-green" disabled={busy}>{busy ? '...' : t('save')}</button></div>
      </form>

      <form className="card form" onSubmit={changePw}>
        <h3><Icon name="lock" size={18} /> {t('change_password')}</h3>
        <div className="row">
          <label>{t('current_password')}<input type="password" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} autoComplete="current-password" required /></label>
          <label>{t('new_password')}<input type="password" minLength={8} value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} autoComplete="new-password" required /></label>
        </div>
        <div className="form-actions"><button className="btn btn-outline">{t('change_password')}</button></div>
      </form>
      <Toast msg={msg} />
    </>
  );
}
