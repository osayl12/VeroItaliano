import { useEffect, useMemo, useState } from 'react';
import { api } from '../../api.js';
import { useLang } from '../../i18n.jsx';
import Icon from '../../components/Icon.jsx';
import { money } from '../../utils.js';
import { BiInput, ImagePicker, Toast, useToast } from './fields.jsx';

// <input type="datetime-local"> works in the browser's local time
const toLocalInput = (d) => {
  const x = new Date(d);
  const p = (n) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${p(x.getMonth() + 1)}-${p(x.getDate())}T${p(x.getHours())}:${p(x.getMinutes())}`;
};
const fmt = (d, lang) =>
  new Date(d).toLocaleString(lang === 'ar' ? 'ar' : 'he-IL', { timeZone: 'Asia/Jerusalem', dateStyle: 'short', timeStyle: 'short' });

export function dealStatus(d) {
  const now = Date.now();
  if (!d.active) return 'paused';
  if (new Date(d.startAt).getTime() > now) return 'scheduled';
  if (new Date(d.endAt).getTime() <= now) return 'expired';
  return 'active';
}

function DealForm({ deal, menu, onSaved, onCancel }) {
  const { t, tr } = useLang();
  const isNew = !deal?._id;
  const [f, setF] = useState(() => ({
    title: { he: '', ar: '' }, description: { he: '', ar: '' }, price: '', originalPrice: '', items: [], active: true,
    ...deal,
    originalPrice: deal?.originalPrice ?? '',
    startAt: toLocalInput(deal?.startAt || new Date()),
    endAt: toLocalInput(deal?.endAt || Date.now() + 24 * 3600e3)
  }));
  const [mode, setMode] = useState(isNew ? 'hours' : 'until'); // hours | days | until
  const [amount, setAmount] = useState(isNew ? 24 : 1);
  const [file, setFile] = useState(null);
  const [removed, setRemoved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, toast] = useToast();
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));

  const start = new Date(f.startAt);
  const end = useMemo(() => {
    if (mode === 'until') return new Date(f.endAt);
    const unit = mode === 'hours' ? 3600e3 : 24 * 3600e3;
    return new Date(start.getTime() + Number(amount || 0) * unit);
  }, [mode, amount, f.startAt, f.endAt]);

  const toggleItem = (id) =>
    set('items')(f.items.map(String).includes(String(id)) ? f.items.filter((x) => String(x) !== String(id)) : [...f.items, id]);

  const submit = async (e) => {
    e.preventDefault();
    if (!(end > start)) return toast(`${t('error')}: ${t('end_at')} < ${t('start_at')}`, true);
    setBusy(true);
    const data = {
      title: f.title, description: f.description, items: f.items, active: f.active,
      price: Number(f.price),
      originalPrice: f.originalPrice === '' ? null : Number(f.originalPrice),
      startAt: start.toISOString(),
      endAt: end.toISOString()
    };
    if (removed) data.image = '';
    try {
      isNew ? await api.create('deals', data, file) : await api.update('deals', deal._id, data, file);
      onSaved();
    } catch (err) {
      toast(`${t('error')}: ${err.message}`, true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card form" onSubmit={submit}>
      <BiInput label={t('title')} value={f.title} onChange={set('title')} required />
      <BiInput label={t('description')} value={f.description} onChange={set('description')} textarea />
      <ImagePicker current={f.image} file={file} removed={removed} onChange={(fl, rm) => { setFile(fl); setRemoved(rm); }} />
      <div className="row">
        <label>{t('deal_price')} <span className="req" aria-hidden="true">*</span><input type="number" inputMode="decimal" min="0" step="0.5" value={f.price} onChange={(e) => set('price')(e.target.value)} required /></label>
        <label>{t('original_price')}<input type="number" min="0" step="0.5" value={f.originalPrice} onChange={(e) => set('originalPrice')(e.target.value)} /></label>
      </div>

      <fieldset className="bi">
        <legend><Icon name="timer" size={16} /> {t('duration')}</legend>
        <label>{t('start_at')}<input type="datetime-local" value={f.startAt} onChange={(e) => set('startAt')(e.target.value)} required /></label>
        <div className="seg">
          {['hours', 'days', 'until'].map((m) => (
            <button type="button" key={m} aria-pressed={mode === m} className={mode === m ? 'active' : ''} onClick={() => setMode(m)}>{t(`dur_${m}`)}</button>
          ))}
        </div>
        {mode === 'until' ? (
          <label>{t('end_at')}<input type="datetime-local" value={f.endAt} onChange={(e) => set('endAt')(e.target.value)} required /></label>
        ) : (
          <label>{t(`dur_${mode}`)}<input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} required /></label>
        )}
        <p className="muted small">{t('ends')}: <b>{isNaN(end) ? '-' : fmt(end)}</b></p>
      </fieldset>

      {menu.length > 0 && (
        <fieldset className="bi">
          <legend>{t('linked_items')}</legend>
          <div className="chips">
            {menu.map((m) => (
              <label key={m._id} className={`chip ${f.items.map(String).includes(String(m._id)) ? 'on' : ''}`}>
                <input type="checkbox" hidden checked={f.items.map(String).includes(String(m._id))} onChange={() => toggleItem(m._id)} />
                {tr(m.name)}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <label className="check"><input type="checkbox" checked={f.active} onChange={(e) => set('active')(e.target.checked)} /> {t('active')}</label>
      <div className="form-actions">
        <button className="btn btn-green" disabled={busy}>{busy ? '...' : t('save')}</button>
        <button type="button" className="btn btn-outline" onClick={onCancel}>{t('cancel')}</button>
      </div>
      <Toast msg={msg} />
    </form>
  );
}

export default function DealsManager() {
  const { t, tr, lang } = useLang();
  const [deals, setDeals] = useState(null);
  const [menu, setMenu] = useState([]);
  const [editing, setEditing] = useState(null);
  const [msg, toast] = useToast();

  const load = () => api.list('deals').then(setDeals).catch((e) => toast(e.message, true));
  useEffect(() => {
    load();
    api.list('menu').then(setMenu).catch(() => {});
  }, []);

  const remove = async (d) => {
    if (!window.confirm(`${tr(d.title)} – ${t('confirm_delete')}`)) return;
    await api.remove('deals', d._id);
    load();
  };

  if (editing) {
    return <DealForm deal={editing} menu={menu} onCancel={() => setEditing(null)} onSaved={() => { setEditing(null); toast(t('saved')); load(); }} />;
  }
  if (!deals) return <p>{t('loading')}</p>;

  return (
    <div>
      <div className="toolbar"><button type="button" className="btn btn-red" onClick={() => setEditing({})}>{t('new_deal')}</button></div>
      {deals.length === 0 && <p className="muted">{t('no_items')}</p>}
      <div className="admin-list">
        {deals.map((d) => {
          const st = dealStatus(d);
          return (
            <div key={d._id} className={`admin-row ${st === 'expired' || st === 'paused' ? 'inactive' : ''}`}>
              <div className="thumb">{d.image ? <img src={d.image} alt="" /> : <Icon name="flame" size={26} strokeWidth={1.5} />}</div>
              <div className="admin-row-main">
                <b>{tr(d.title)} <span className={`pill pill-${st}`}>{t(`st_${st}`)}</span></b>
                <span>
                  <b className="text-red">{money(d.price)}</b>
                  {d.originalPrice ? <s className="muted"> {money(d.originalPrice)}</s> : null}
                </span>
                <span className="muted small">{t('starts')}: {fmt(d.startAt, lang)} · {t('ends')}: {fmt(d.endAt, lang)}</span>
              </div>
              <div className="admin-row-actions">
                <button type="button" className="btn btn-sm btn-outline" onClick={() => setEditing(d)}><Icon name="pencil" size={16} /> {t('edit')}</button>
                <button type="button" className="btn btn-sm btn-danger" onClick={() => remove(d)}><Icon name="trash" size={16} /> {t('delete')}</button>
              </div>
            </div>
          );
        })}
      </div>
      <Toast msg={msg} />
    </div>
  );
}
