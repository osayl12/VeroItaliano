import { useCallback, useEffect, useState } from 'react';
import { api } from '../../api.js';
import { useLang } from '../../i18n.jsx';
import Icon from '../../components/Icon.jsx';
import { money, hasSale } from '../../utils.js';
import { CATEGORIES } from '../../components/MenuSection.jsx';
import { BiInput, ImagePicker, Toast, useToast } from './fields.jsx';
import OptionGroupsEditor from './OptionGroupsEditor.jsx';

const EMPTY = {
  name: { he: '', ar: '' },
  description: { he: '', ar: '' },
  howMade: { he: '', ar: '' },
  category: 'pizza',
  price: '',
  salePrice: '',
  image: '',
  active: true,
  available: true,
  featured: false,
  optionGroups: [],
  order: 0
};

function ItemForm({ item, onSaved, onCancel }) {
  const { t } = useLang();
  const [f, setF] = useState(() => ({ ...EMPTY, ...item, salePrice: item?.salePrice ?? '' }));
  const [file, setFile] = useState(null);
  const [removed, setRemoved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, toast] = useToast();
  const set = (k) => (v) => setF((x) => ({ ...x, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const data = {
      ...f,
      price: Number(f.price),
      salePrice: f.salePrice === '' ? null : Number(f.salePrice),
      order: Number(f.order) || 0
    };
    if (removed) data.image = '';
    else delete data.image;
    try {
      item?._id ? await api.update('menu', item._id, data, file) : await api.create('menu', data, file);
      onSaved();
    } catch (err) {
      toast(`${t('error')}: ${err.message}`, true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card form" onSubmit={submit}>
      <BiInput label={t('name')} value={f.name} onChange={set('name')} required />
      <div className="row">
        <label>
          {t('category')}
          <select value={f.category} onChange={(e) => set('category')(e.target.value)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {t(`cat_${c}`)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t('price')}{' '}
          <span className="req" aria-hidden="true">
            *
          </span>
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.5"
            value={f.price}
            onChange={(e) => set('price')(e.target.value)}
            required
          />
        </label>
        <label>
          {t('sale_price')}
          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.5"
            value={f.salePrice}
            onChange={(e) => set('salePrice')(e.target.value)}
          />
        </label>
      </div>
      <BiInput label={t('description')} value={f.description} onChange={set('description')} textarea />
      <BiInput label={t('how_made_field')} value={f.howMade} onChange={set('howMade')} textarea />
      <OptionGroupsEditor value={f.optionGroups || []} onChange={set('optionGroups')} />
      <ImagePicker
        current={f.image}
        file={file}
        removed={removed}
        onChange={(fl, rm) => {
          setFile(fl);
          setRemoved(rm);
        }}
      />
      <div className="row">
        <label className="check">
          <input type="checkbox" checked={f.active} onChange={(e) => set('active')(e.target.checked)} /> {t('active')}
        </label>
        <label className="check">
          <input type="checkbox" checked={f.available !== false} onChange={(e) => set('available')(e.target.checked)} />{' '}
          {t('available_now')}
        </label>
        <label className="check">
          <input type="checkbox" checked={!!f.featured} onChange={(e) => set('featured')(e.target.checked)} /> {t('featured_field')}
        </label>
        <label>
          {t('order_field')}
          <input type="number" value={f.order} onChange={(e) => set('order')(e.target.value)} />
        </label>
      </div>
      <div className="form-actions">
        <button className="btn btn-green" disabled={busy}>
          {busy ? '...' : t('save')}
        </button>
        <button type="button" className="btn btn-outline" onClick={onCancel}>
          {t('cancel')}
        </button>
      </div>
      <Toast msg={msg} />
    </form>
  );
}

export default function MenuManager() {
  const { t, tr } = useLang();
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null); // null | {} (new) | item
  const [msg, toast] = useToast();

  const load = useCallback(
    () =>
      api
        .list('menu')
        .then(setItems)
        .catch((e) => toast(e.message, true)),
    [toast]
  );
  useEffect(() => {
    load();
  }, [load]);

  const remove = async (item) => {
    if (!window.confirm(`${tr(item.name)} – ${t('confirm_delete')}`)) return;
    try {
      await api.remove('menu', item._id);
      load();
    } catch (err) {
      toast(`${t('error')}: ${err.message}`, true);
    }
  };

  if (editing) {
    return (
      <ItemForm
        item={editing}
        onCancel={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          toast(t('saved'));
          load();
        }}
      />
    );
  }
  if (!items) return <p>{t('loading')}</p>;

  return (
    <div>
      <div className="toolbar">
        <button type="button" className="btn btn-red" onClick={() => setEditing({})}>
          {t('new_item')}
        </button>
      </div>
      {items.length === 0 && <p className="muted">{t('no_items')}</p>}
      {CATEGORIES.map((c) => {
        const list = items.filter((i) => i.category === c);
        if (!list.length) return null;
        return (
          <div key={c} className="admin-group">
            <h3>{t(`cat_${c}`)}</h3>
            <div className="admin-list">
              {list.map((i) => (
                <div key={i._id} className={`admin-row ${i.active ? '' : 'inactive'}`}>
                  <div className="thumb">{i.image ? <img src={i.image} alt="" /> : <Icon name="pizza" size={26} strokeWidth={1.5} />}</div>
                  <div className="admin-row-main">
                    <b>{tr(i.name)}</b>
                    <span>
                      {hasSale(i) ? (
                        <>
                          <s className="muted">{money(i.price)}</s> <b className="text-red">{money(i.salePrice)}</b>
                        </>
                      ) : (
                        money(i.price)
                      )}
                      {!i.active && <span className="pill pill-gray">{t('st_paused')}</span>}
                      {i.active && i.available === false && <span className="pill pill-gray">{t('unavailable')}</span>}
                      {i.featured && <span className="pill pill-active">★</span>}
                    </span>
                  </div>
                  <div className="admin-row-actions">
                    <button type="button" className="btn btn-sm btn-outline" onClick={() => setEditing(i)}>
                      <Icon name="pencil" size={16} /> {t('edit')}
                    </button>
                    <button type="button" className="btn btn-sm btn-danger" onClick={() => remove(i)}>
                      <Icon name="trash" size={16} /> {t('delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      <Toast msg={msg} />
    </div>
  );
}
