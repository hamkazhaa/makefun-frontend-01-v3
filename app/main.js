// main.js — the router. One hash route per surface, one fetch per view, and
// the list on the board re-renders from the cached answers without another
// request while you type. window.__shotReady is false while a route loads
// and true once its data has rendered, so screenshots catch the finished
// page, never a spinner.

import { api, listCompetitions, getCompetition, getLeaderboard, getProfile, stats } from './api.js';
import { isOpen, closesSoon, timeAgo } from './format.js';
import { boardView, boardListHtml, bountyView, leaderboardView, profileView, loadingView, errorView } from './views.js';

const view = document.getElementById('view');
const statsEl = document.getElementById('stats');

const boardState = { q: '', filter: 'open', sort: 'deadline' };
let boardItems = [];

function setStats() {
  if (!statsEl) return;
  const updated = stats.lastFetchAt ? ` · data ${timeAgo(new Date(stats.lastFetchAt).toISOString())}` : '';
  statsEl.textContent = `${stats.requests} API requests · ${stats.servedFromCache} served from cache${updated}`;
}

function show(html, ready = true) {
  view.innerHTML = html;
  setStats();
  window.__shotReady = ready;
}

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const parts = raw.split('/').filter(Boolean);
  if (!parts.length) return { name: 'board' };
  if (parts[0] === 'bounty' && parts[1] && parts[2] === 'leaderboard') return { name: 'leaderboard', slug: parts[1] };
  if (parts[0] === 'bounty' && parts[1]) return { name: 'bounty', slug: parts[1] };
  if (parts[0] === 'u' && parts[1]) return { name: 'profile', handle: parts[1] };
  return { name: 'board' };
}

function filteredBoard() {
  const q = boardState.q.trim().toLowerCase();
  let items = boardItems.filter((c) => {
    if (boardState.filter === 'open' && !isOpen(c)) return false;
    if (boardState.filter === 'soon' && !closesSoon(c)) return false;
    if (q && !(c.title + ' ' + (c.category || '') + ' ' + c.slug).toLowerCase().includes(q)) return false;
    return true;
  });
  const by = {
    deadline: (a, b) => new Date(a.deadline) - new Date(b.deadline),
    reward: (a, b) => (b.rewardAmount || 0) - (a.rewardAmount || 0),
    entries: (a, b) => (b.submissionCount || 0) - (a.submissionCount || 0),
  }[boardState.sort];
  return items.sort(by);
}

function boardTotals() {
  return {
    all: boardItems.length,
    open: boardItems.filter(isOpen).length,
    pots: boardItems.reduce((s, c) => s + Number(c.potUsd || 0), 0),
  };
}

function wireBoard() {
  const q = document.getElementById('q');
  const sort = document.getElementById('sort');
  if (q) {
    q.addEventListener('input', () => {
      boardState.q = q.value;
      const list = document.getElementById('list');
      if (list) list.innerHTML = boardListHtml(filteredBoard());
    });
  }
  if (sort) sort.addEventListener('change', () => { boardState.sort = sort.value; route(); });
  view.querySelectorAll('[data-filter]').forEach((b) => b.addEventListener('click', () => {
    boardState.filter = b.dataset.filter;
    route();
  }));
}

async function routeBoard() {
  document.title = 'Bounty board · make.fun lite';
  if (!boardItems.length) {
    window.__shotReady = false;
    show(loadingView('the bounty board'), false);
    boardItems = await listCompetitions();
  }
  window.__shotReady = false;
  show(boardView(filteredBoard(), boardState, boardTotals()));
  wireBoard();
}

async function routeBounty(slug) {
  document.title = 'Bounty · make.fun lite';
  window.__shotReady = false;
  show(loadingView('the bounty'), false);
  const c = await getCompetition(slug);
  let top = [];
  try {
    const lb = await getLeaderboard(slug, 5);
    top = (lb.entries || []).slice(0, 5);
  } catch { /* a bounty with no entries yet has no leaderboard */ }
  document.title = `${c.title} · make.fun lite`;
  window.__shotReady = false;
  show(bountyView(c, top));
}

async function routeLeaderboard(slug) {
  document.title = 'Leaderboard · make.fun lite';
  window.__shotReady = false;
  show(loadingView('the leaderboard'), false);
  const lb = await getLeaderboard(slug, 50);
  document.title = `Leaderboard: ${lb.competition?.title || slug} · make.fun lite`;
  window.__shotReady = false;
  show(leaderboardView(slug, lb));
  const more = document.getElementById('show-all');
  if (more) more.addEventListener('click', () => {
    document.getElementById('lb-more')?.removeAttribute('hidden');
    more.remove();
  });
}

async function routeProfile(handle) {
  document.title = `@${handle} · make.fun lite`;
  window.__shotReady = false;
  show(loadingView('the profile'), false);
  const p = await getProfile(handle);
  window.__shotReady = false;
  show(profileView(p));
}

export async function route() {
  window.__shotReady = false;
  const r = parseHash();
  try {
    if (r.name === 'bounty') await routeBounty(r.slug);
    else if (r.name === 'leaderboard') await routeLeaderboard(r.slug);
    else if (r.name === 'profile') await routeProfile(r.handle);
    else await routeBoard();
  } catch (err) {
    document.title = 'Error · make.fun lite';
    window.__shotReady = false;
    show(errorView(err?.status === 404 ? 'That page does not exist on make.fun.' : `The make.fun API did not answer (${err?.message || 'network error'}). Check your connection and try again.`));
  }
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
route();
