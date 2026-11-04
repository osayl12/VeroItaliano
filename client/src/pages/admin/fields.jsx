import { useEffect, useState } from 'react';
import { useLang } from '../../i18n.jsx';
import Icon from '../../components/Icon.jsx';

// Two inputs (Hebrew + Arabic) for one bilingual field
export function BiInput({ label, value = {}, onChange, textarea = false, required = false }) {
  const { t } = useLang();
  const Tag = textarea ? 'textarea' : 'input';
  const set = (k) => (e) => onChange({ ...value, [k]: e.target.value });
  return (
    <fieldset className="bi">
      <legend>{label}{required && <span className="req" aria-hidden="true"> *</span>}</legend>
      <label>
        <span className="lang-tag">{t('hebrew')}</span>
        <Tag value={value.he || ''} onChange={set('he')} rows={textarea ? 3 : undefined} required={required} lang="he" />
      </label>
      <label>
        <span className="lang-tag">{t('arabic')}</span>
        <Tag value={value.ar || ''} onChange={set('ar')} rows={textarea ? 3 : undefined} lang="ar" />
      </label>
    </fieldset>
  );
}

// Image chooser with preview. onChange(file|null, removed:boolean)
export function ImagePicker({ current, file, removed, onChange }) {
  const { t } = useLang();
  const [preview, setPreview] = useState('');
  useEffect(() => {
    if (!file) return setPreview('');
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const src = preview || (!removed && current) || '';

  return (
    <div className="image-picker">
      <span className="field-label">{t('image')}</span>
      <div className="image-row">
        <div className="image-preview">{src ? <img src={src} alt="" /> : <Icon name="camera" size={32} strokeWidth={1.5} />}</div>
        <div className="image-btns">
          <label className="btn btn-outline btn-sm">
            <Icon name="camera" size={16} /> {t('choose_image')}
            <input type="file" accept="image/*" hidden onChange={(e) => e.target.files[0] && onChange(e.target.files[0], false)} />
          </label>
          {src && (
            <button type="button" className="btn btn-link btn-sm" onClick={() => onChange(null, true)}><Icon name="trash" size={16} /> {t('remove_image')}</button>
          )}
        </div>
      </div>
    </div>
  );
}

export function Toast({ msg }) {
  // Always rendered so screen readers pick up changes (aria-live)
  return (
    <div className={`toast ${msg ? 'show' : ''} ${msg?.error ? 'toast-error' : ''}`} role={msg?.error ? 'alert' : 'status'} aria-live="polite">
      {msg && <><Icon name={msg.error ? 'info' : 'check'} size={18} /> {msg.text}</>}
    </div>
  );
}

export function useToast() {
  const [msg, setMsg] = useState(null);
  useEffect(() => {
    if (!msg) return;
    const id = setTimeout(() => setMsg(null), msg.error ? 5000 : 3000);
    return () => clearTimeout(id);
  }, [msg]);
  return [msg, (text, error = false) => setMsg({ text, error })];
}
