// ---------- time / opening hours (always Israel time) ----------
const TZ = 'Asia/Jerusalem';
const toMin = (hhmm) => {
  const [h, m] = String(hhmm || '0:0').split(':').map(Number);
  return h * 60 + m;
};

export function israelNow() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ, weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(new Date());
  const get = (type) => parts.find((p) => p.type === type)?.value;
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'));
  return { day, minutes: Number(get('hour')) * 60 + Number(get('minute')) };
}

/** Returns { open: boolean, closesAt?: "HH:mm", opensAt?: "HH:mm" } */
export function openStatus(settings) {
  if (!settings) return { open: false };
  if (settings.tempClosed) return { open: false, temp: true };
  const hours = settings.hours || [];
  const byDay = (d) => hours.find((h) => h.day === d);
  const { day, minutes } = israelNow();

  // 1) yesterday's shift that runs past midnight
  const y = byDay((day + 6) % 7);
  if (y && !y.closed && toMin(y.close) <= toMin(y.open) && minutes < toMin(y.close)) {
    return { open: true, closesAt: y.close };
  }
  // 2) today's shift
  const td = byDay(day);
  if (td && !td.closed) {
    const o = toMin(td.open);
    const c = toMin(td.close);
    const overnight = c <= o;
    if (minutes >= o && (overnight || minutes < c)) return { open: true, closesAt: td.close };
    if (minutes < o) return { open: false, opensAt: td.open, opensToday: true };
  }
  // 3) next opening day
  for (let i = 1; i <= 7; i++) {
    const d = byDay((day + i) % 7);
    if (d && !d.closed) return { open: false, opensAt: d.open, opensDay: d.day };
  }
  return { open: false };
}

// ---------- prices ----------
export const money = (n) => `${Number(n).toLocaleString('he-IL', { maximumFractionDigits: 2 })}₪`;
export const hasSale = (item) => item.salePrice != null && item.salePrice !== '' && Number(item.salePrice) < Number(item.price);
export const finalPrice = (item) => (hasSale(item) ? Number(item.salePrice) : Number(item.price));

// ---------- contact links ----------
export const telLink = (phone) => `tel:${String(phone || '').replace(/[^\d+]/g, '')}`;
export const waLink = (number, text = '') => {
  const n = String(number || '').replace(/\D/g, '');
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
};
export const formatPhone = (p) => {
  const d = String(p || '').replace(/\D/g, '');
  return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : p;
};

// ---------- countdown ----------
export function timeLeft(endAt) {
  const ms = Math.max(0, new Date(endAt).getTime() - Date.now());
  const s = Math.floor(ms / 1000);
  return { ms, days: Math.floor(s / 86400), hours: Math.floor((s % 86400) / 3600), minutes: Math.floor((s % 3600) / 60), seconds: s % 60 };
}
export const pad = (n) => String(n).padStart(2, '0');
