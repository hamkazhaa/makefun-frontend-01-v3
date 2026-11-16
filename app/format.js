// format.js — small pure helpers for money, dates and counts. No I/O here,
// so every function is trivially testable and the views stay thin.

export function esc(s) {
  return String(s ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function num(n) {
  return Number(n ?? 0).toLocaleString('en-US');
}

export function usd(n) {
  const v = Number(n ?? 0);
  return '$' + v.toLocaleString('en-US', { maximumFractionDigits: v % 1 ? 2 : 0 });
}

export function usd2(n) {
  return '$' + Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function pctMicro(micro) {
  return (Number(micro ?? 0) / 10000).toFixed(2) + '%';
}

export function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC',
  }) + ' UTC';
}

export function isOpen(c) {
  return !!c?.deadline && new Date(c.deadline).getTime() > Date.now();
}

export function closesSoon(c) {
  if (!isOpen(c)) return false;
  return new Date(c.deadline).getTime() - Date.now() < 48 * 3600_000;
}

export function timeLeft(iso) {
  if (!iso) return '—';
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'Closed';
  const min = Math.floor(ms / 60000);
  if (min < 60) return `${min}m left`;
  const h = Math.floor(min / 60);
  if (h < 48) return `${h}h ${min % 60}m left`;
  const d = Math.floor(h / 24);
  return `${d}d ${h % 24}h left`;
}

export function timeAgo(iso) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 60000) return 'just now';
  const min = Math.floor(ms / 60000);
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
