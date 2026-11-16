// api.js — read-only client for make.fun's public API.
// One rule drives everything here: never fetch the same answer twice in a
// minute. The API's ETags are bound to the minute, so a revalidation inside
// the same minute answers 304 and costs nothing but a round trip; after the
// minute turns it answers 200 with a fresh tag. We keep an in-memory cache
// keyed by URL with the last ETag, send If-None-Match on revalidation, and
// count every request so the footer can show what the cache saved.

export const API_ORIGIN = 'https://make.fun';

export const stats = { requests: 0, servedFromCache: 0, lastFetchAt: null };

const entries = new Map(); // url -> { at, etag, body }

const CACHE_MS = 60_000;

export async function api(path) {
  const url = API_ORIGIN + path;
  const now = Date.now();
  const hit = entries.get(url);
  if (hit && now - hit.at < CACHE_MS) {
    stats.servedFromCache += 1;
    return hit.body;
  }
  const headers = {};
  if (hit && hit.etag) headers['If-None-Match'] = hit.etag;
  stats.requests += 1;
  const res = await fetch(url, { headers });
  if (res.status === 304 && hit) {
    hit.at = now;
    stats.servedFromCache += 1;
    return hit.body;
  }
  if (!res.ok) {
    const err = new Error(`make.fun API ${res.status} for ${path}`);
    err.status = res.status;
    throw err;
  }
  const body = await res.json();
  stats.lastFetchAt = now;
  entries.set(url, { at: now, etag: res.headers.get('etag'), body });
  return body;
}

export async function listCompetitions() {
  const out = [];
  let cursor = null;
  do {
    const page = await api(
      '/api/competitions?limit=100' + (cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''),
    );
    out.push(...(page.items || []));
    cursor = page.next_cursor || null;
  } while (cursor && out.length < 500);
  return out;
}

export function getCompetition(slug) {
  return api(`/api/competitions/${encodeURIComponent(slug)}`);
}

export function getLeaderboard(slug, limit = 50) {
  return api(`/api/competitions/${encodeURIComponent(slug)}/leaderboard?limit=${limit}`);
}

export function getProfile(handle) {
  return api(`/api/profiles/${encodeURIComponent(handle)}`);
}
