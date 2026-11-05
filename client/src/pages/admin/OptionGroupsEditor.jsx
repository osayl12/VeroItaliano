import { useLang } from '../../i18n.jsx';
import Icon from '../../components/Icon.jsx';

// Same lists as the shop's ordering app. Edit freely in the form afterwards.
const t2 = (he, ar) => ({ he, ar });
const opt = ([he, ar], price = 0) => ({ name: t2(he, ar), price });
const TOPPINGS = [
  ['תירס', 'ذرة'],
  ['זיתים', 'زيتون'],
  ['פטריות', 'فطر'],
  ['בצל', 'بصل'],
  ['עגבניות', 'بندورة'],
  ['חלפיניו', 'هالبينو'],
  ['פפרוני', 'بيبروني'],
  ['טונה', 'تونة'],
  ['גמבה', 'فليفلة']
];
const DRINKS = [
  ['קוקה קולה', 'كوكا كولا'],
  ['קוקה קולה זירו', 'كوكا كولا زيرو'],
  ['פנטה אקזוטי', 'فانتا إكزوتيك'],
  ['פנטה תות', 'فانتا فراولة']
];

const TEMPLATES = {
  tpl_drink: () => [{ name: t2('בחר את המשקה', 'اختر المشروب'), min: 1, max: 1, options: DRINKS.map((d) => opt(d)) }],
  tpl_drink_extra: () => [{ name: t2('הוספת משקה', 'إضافة مشروب'), min: 0, max: 1, options: DRINKS.map((d) => opt(d, 5)) }],
  tpl_halves: () => [
    { name: t2('החצי הראשון', 'النصف الأول'), min: 0, max: 3, options: TOPPINGS.map((x) => opt(x)) },
    { name: t2('החצי השני', 'النصف الثاني'), min: 0, max: 3, options: TOPPINGS.map((x) => opt(x)) }
  ],
  tpl_toppings: () => [{ name: t2('בחר את התוספות', 'اختر الإضافات'), min: 0, max: 3, options: TOPPINGS.map((x) => opt(x)) }],
  tpl_spicy: () => [{ name: t2('תוספות', 'إضافات'), min: 0, max: 1, options: [opt(['חריף', 'حار'])] }]
};

export default function OptionGroupsEditor({ value = [], onChange }) {
  const { t } = useLang();
  const groups = value;
  const setGroup = (gi, patch) => onChange(groups.map((g, i) => (i === gi ? { ...g, ...patch } : g)));
  const setOption = (gi, oi, patch) => setGroup(gi, { options: groups[gi].options.map((o, i) => (i === oi ? { ...o, ...patch } : o)) });
  const move = (gi, dir) => {
    const j = gi + dir;
    if (j < 0 || j >= groups.length) return;
    const next = [...groups];
    [next[gi], next[j]] = [next[j], next[gi]];
    onChange(next);
  };

  return (
    <fieldset className="bi opt-editor">
      <legend>
        <Icon name="sliders" size={16} /> {t('options_title')}
      </legend>
      <p className="muted small">{t('options_help')}</p>

      <div className="tpl-row">
        <span className="small muted">{t('quick_templates')}</span>
        {Object.keys(TEMPLATES).map((k) => (
          <button key={k} type="button" className="btn btn-sm btn-outline" onClick={() => onChange([...groups, ...TEMPLATES[k]()])}>
            <Icon name="plus" size={14} /> {t(k)}
          </button>
        ))}
      </div>

      {groups.map((g, gi) => (
        <div key={g._id || gi} className="opt-edit-group">
          <div className="opt-edit-head">
            <b>{g.name?.he || t('group_name')}</b>
            <span className="opt-edit-tools">
              <button type="button" className="icon-btn" onClick={() => move(gi, -1)} aria-label="up" disabled={gi === 0}>
                ↑
              </button>
              <button type="button" className="icon-btn" onClick={() => move(gi, 1)} aria-label="down" disabled={gi === groups.length - 1}>
                ↓
              </button>
              <button type="button" className="btn btn-sm btn-danger" onClick={() => onChange(groups.filter((_, i) => i !== gi))}>
                <Icon name="trash" size={14} /> {t('remove')}
              </button>
            </span>
          </div>
          <div className="row">
            <label>
              {t('group_name')} ({t('hebrew')})
              <input value={g.name?.he || ''} onChange={(e) => setGroup(gi, { name: { ...g.name, he: e.target.value } })} required />
            </label>
            <label>
              {t('group_name')} ({t('arabic')})
              <input lang="ar" value={g.name?.ar || ''} onChange={(e) => setGroup(gi, { name: { ...g.name, ar: e.target.value } })} />
            </label>
            <label>
              {t('min_field')}
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={g.min ?? 0}
                onChange={(e) => setGroup(gi, { min: Math.max(0, Number(e.target.value) || 0) })}
              />
            </label>
            <label>
              {t('max_field')}
              <input
                type="number"
                min="1"
                inputMode="numeric"
                value={g.max ?? 1}
                onChange={(e) => setGroup(gi, { max: Math.max(1, Number(e.target.value) || 1) })}
              />
            </label>
          </div>
          <div className="opt-edit-list">
            {(g.options || []).length > 0 && (
              <div className="opt-edit-row opt-edit-labels" aria-hidden="true">
                <span>{t('hebrew')}</span>
                <span>{t('arabic')}</span>
                <span>{t('option_price')}</span>
                <span />
              </div>
            )}
            {(g.options || []).map((o, oi) => (
              <div key={o._id || oi} className="opt-edit-row">
                <input
                  aria-label={`${t('name')} ${t('hebrew')}`}
                  placeholder={t('hebrew')}
                  value={o.name?.he || ''}
                  onChange={(e) => setOption(gi, oi, { name: { ...o.name, he: e.target.value } })}
                  required
                />
                <input
                  aria-label={`${t('name')} ${t('arabic')}`}
                  placeholder={t('arabic')}
                  lang="ar"
                  value={o.name?.ar || ''}
                  onChange={(e) => setOption(gi, oi, { name: { ...o.name, ar: e.target.value } })}
                />
                <input
                  aria-label={t('option_price')}
                  title={t('option_price')}
                  type="number"
                  min="0"
                  step="0.5"
                  inputMode="decimal"
                  value={o.price ?? 0}
                  onChange={(e) => setOption(gi, oi, { price: Math.max(0, Number(e.target.value) || 0) })}
                />
                <button
                  type="button"
                  className="icon-btn"
                  aria-label={t('remove')}
                  onClick={() => setGroup(gi, { options: g.options.filter((_, i) => i !== oi) })}
                >
                  <Icon name="x" size={18} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-sm btn-link"
            onClick={() => setGroup(gi, { options: [...(g.options || []), { name: t2('', ''), price: 0 }] })}
          >
            <Icon name="plus" size={14} /> {t('add_option')}
          </button>
        </div>
      ))}

      <button
        type="button"
        className="btn btn-sm btn-outline"
        onClick={() => onChange([...groups, { name: t2('', ''), min: 0, max: 1, options: [] }])}
      >
        <Icon name="plus" size={14} /> {t('add_group')}
      </button>
    </fieldset>
  );
}
