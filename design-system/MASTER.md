# Vero Italiano – Design System (MASTER)

The source of truth for all UI work on this project. Before building or changing a page, read this file, and check `design-system/pages/<page>.md` for overrides.

## Product
- **Type:** local restaurant / pizzeria website, ordering by phone and WhatsApp
- **Audience:** locals in Mghar, mostly on mobile. Hebrew by default, Arabic as the second language.
- **Style:** warm, appetizing, Italian. Flat cards with soft shadows, rounded corners, flag accents. No glassmorphism, no neon.

## Language and direction
- The whole site is right-to-left (`dir="rtl"`). Use logical properties (`margin-inline-start`, `text-align: start/end`).
- Wrap numbers, times, phone numbers and prices in `<bdi dir="ltr">` or `dir="ltr"` so they don't flip.
- Every text field in the database is `{ he, ar }`. Every UI string lives in `client/src/i18n.jsx`, never hard-coded.

## Color tokens (`client/src/styles.css` `:root`)
| Token | Value | Use | Contrast |
|---|---|---|---|
| `--green` | `#0f7a3d` | primary actions, active states | white text 5.4:1 |
| `--red` | `#c8102e` | Call button, prices, sale badges | white text 5.9:1 |
| `--wa` | `#25d366` | WhatsApp buttons only | **dark text `--on-wa` only** (white fails at 2:1) |
| `--bg` / `--bg-2` | `#fff8ee` / `#f6ead6` | page / subtle surfaces | |
| `--wood` | `#2b1608` | hero, footer, countdown | |
| `--ink` / `--muted` | `#2a1a12` / `#66564a` | text | muted ≥ 4.9:1 on bg |
| `--focus` | `#1d4ed8` | keyboard focus ring | |

Never use raw hex values in components. Add a token instead.

## Typography
- Hebrew: **Heebo**. Arabic: **Cairo** (switched with `body.lang-ar`). Logo only: **Pacifico**.
- Body text is 16px with line-height 1.6. Inputs are always 16px (smaller sizes make iOS zoom in).
- Headings use weights 800–900. Body uses 400; labels use 600.
- Prices, timers and hours use `.num` (tabular numbers).

## Spacing, shape, motion
- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 (`--s1`…`--s8`).
- Radius: 10px for inputs and small items, 16px for cards, pill shape for buttons and chips.
- Shadows: `--shadow-1` (cards), `--shadow-2` (hover, raised), `--shadow-3` (floating, drawer).
- Animations run 200ms with `--ease`, using transform and opacity only. Respect `prefers-reduced-motion`.

## Icons
- Use **only** `components/Icon.jsx` (Lucide-style, 24px grid, 2px stroke). Add new icons there.
- **No emoji as UI icons.** Emoji are fine inside WhatsApp message text.
- WhatsApp uses its official glyph from `components/WhatsAppIcon.jsx`.

## Interaction and accessibility rules
- Every tap target is at least **44×44px** (`--tap`).
- Every icon-only button has an `aria-label`. Toggles use `aria-pressed`; menus use `aria-expanded`.
- Focus is visible through `:focus-visible` (3px ring). Never remove it.
- Open/closed status always shows an icon or dot **plus text**, never color alone.
- Dialogs (the cart) use `role="dialog" aria-modal`, close on Esc, return focus, and lock the page scroll behind them.
- Toasts use `aria-live`. Errors use `role="alert"`. Deleting anything asks for confirmation first.
- Show a skeleton while loading, and an error screen with a retry button.

## Layout
- Mobile first. Breakpoints are 480 and 820. The content container is at most 1140px wide.
- **Mobile:** a sticky bottom bar (Call / WhatsApp / Cart) that respects `safe-area-inset-bottom`.
- **Desktop:** a floating WhatsApp button (bottom left) and a cart pill (bottom right).
- Images use a fixed `aspect-ratio` (no layout shift), plus `loading="lazy"` and `decoding="async"`.

## Checked
- axe-core WCAG 2 A/AA: **0 violations** on the homepage, `/admin` login and the admin dashboard.
- No visible tap target under 40px on an iPhone 13 viewport.
