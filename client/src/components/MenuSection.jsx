import { useMemo, useState } from 'react';
import { useLang } from '../i18n.jsx';
import { finalPrice, hasSale, money, waLink } from '../utils.js';
import { entryKey, quickOrderText } from '../orderText.js';
import WhatsAppIcon from './WhatsAppIcon.jsx';
import Icon from './Icon.jsx';

export const CATEGORIES = ['pizza', 'combos', 'focaccia', 'starters', 'pizzaOfDay', 'salads', 'breads', 'drinks', 'desserts'];
const BIG = new Set(['pizza', 'combos', 'focaccia', 'pizzaOfDay']);

function SaleBadge({ inline }) {
  const { t } = useLang();
  return (
    <span className={`sale-badge ${inline ? 'inline' : ''}`}>
      <Icon name="tag" size={14} /> {t('on_sale')}
    </span>
  );
}

function MenuCard({ item, onSale, settings, onAdd, onOpen, onWhatsApp }) {
  const { t, tr } = useLang();
  const price = finalPrice(item);
  const msg = quickOrderText(tr(settings.whatsappGreeting), tr(item.name), price);
  const entry = { key: entryKey(item), kind: 'item', id: item._id, name: item.name, price };
  const big = BIG.has(item.category) || !!item.image; // photo card whenever there is a photo
  const sale = onSale || hasSale(item);
  const off = item.available === false; // shown, but greyed out and not orderable
  const hasOptions = (item.optionGroups || []).length > 0; // drink / toppings to choose -> open the details panel

  return (
    <article className={`menu-card ${big ? 'menu-card-big' : 'menu-card-small'} ${off ? 'is-unavailable' : ''}`}>
      {big && (
        <button type="button" className="menu-img" onClick={() => onOpen(item)} aria-label={`${t('details')}: ${tr(item.name)}`}>
          {item.image ? (
            <img src={item.image} alt={tr(item.name)} loading="lazy" decoding="async" />
          ) : (
            <div className="img-placeholder" aria-hidden="true">
              <Icon name="pizza" size={56} strokeWidth={1.5} />
            </div>
          )}
          {sale && !off && <SaleBadge />}
          {off && <span className="unavailable-badge">{t('unavailable')}</span>}
        </button>
      )}
      <div className="menu-body">
        <div className="menu-head">
          <h4>
            {tr(item.name)}
            {!big && sale && <SaleBadge inline />}
          </h4>
          <div className="price-col">
            <span className="price-new num">{money(price)}</span>
            {hasSale(item) && <del className="price-old num">{money(item.price)}</del>}
          </div>
        </div>
        {tr(item.description) && <p className="menu-desc">{tr(item.description)}</p>}
        {tr(item.howMade) && (
          <details className="how-made">
            <summary>
              <Icon name="chef" size={16} /> {t('how_made')}
            </summary>
            <p>{tr(item.howMade)}</p>
          </details>
        )}
        {off && !big && <p className="unavailable-text">{t('unavailable')}</p>}
        {!off && (
          <div className="card-actions">
            {hasOptions ? (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => onOpen(item)}
                aria-label={`${t('choose_and_add')}: ${tr(item.name)}`}
              >
                <Icon name="sliders" size={16} /> {t('choose_and_add')}
              </button>
            ) : (
              <>
                <a
                  className="btn btn-wa btn-sm"
                  href={waLink(settings.whatsapp, msg)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => onWhatsApp?.(e, entry)}
                  aria-label={`${t('order_whatsapp')}: ${tr(item.name)}`}
                >
                  <WhatsAppIcon size={16} /> {t('whatsapp')}
                </a>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  aria-label={`${t('add')}: ${tr(item.name)}`}
                  onClick={() => onAdd(entry)}
                >
                  <Icon name="plus" size={16} /> {t('add')}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export default function MenuSection({ menu, settings, dealItemIds, onAdd, onOpen, onWhatsApp }) {
  const { t } = useLang();
  const [active, setActive] = useState('all');

  const groups = useMemo(
    () => CATEGORIES.map((c) => ({ cat: c, items: menu.filter((m) => m.category === c) })).filter((g) => g.items.length),
    [menu]
  );
  const shown = active === 'all' ? groups : groups.filter((g) => g.cat === active);

  return (
    <section className="section menu" id="menu" aria-labelledby="menu-title">
      <div className="container">
        <h2 className="section-title" id="menu-title">
          <Icon name="pizza" size={30} className="title-icon" /> {t('menu_title')}
        </h2>
        <div className="tabs" role="group" aria-label={t('category')}>
          <button
            type="button"
            aria-pressed={active === 'all'}
            className={active === 'all' ? 'active' : ''}
            onClick={() => setActive('all')}
          >
            {t('all')}
          </button>
          {groups.map((g) => (
            <button
              type="button"
              key={g.cat}
              aria-pressed={active === g.cat}
              className={active === g.cat ? 'active' : ''}
              onClick={() => setActive(g.cat)}
            >
              {t(`cat_${g.cat}`)}
            </button>
          ))}
        </div>

        {shown.map((g) => (
          <div className="menu-group" key={g.cat}>
            <h3 className="group-title">{t(`cat_${g.cat}`)}</h3>
            <div className={BIG.has(g.cat) || g.items.some((i) => i.image) ? 'menu-grid' : 'menu-list'}>
              {g.items.map((item) => (
                <MenuCard
                  key={item._id}
                  item={item}
                  settings={settings}
                  onSale={dealItemIds.has(String(item._id))}
                  onAdd={onAdd}
                  onOpen={onOpen}
                  onWhatsApp={onWhatsApp}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
