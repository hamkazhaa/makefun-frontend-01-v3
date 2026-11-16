// views.js — every surface as a pure function of its data. The router in
// main.js fetches, then drops one of these strings into #view. Nothing here
// touches the network; nothing here writes to the page.

import { esc, num, usd, usd2, pctMicro, fmtDate, isOpen, closesSoon, timeLeft, timeAgo } from './format.js';
import { API_ORIGIN } from './api.js';

function chip(text) {
  return `<span class="chip">${esc(text)}</span>`;
}

function openBadge(c) {
  if (isOpen(c)) return closesSoon(c) ? '<span class="badge soon">Closing soon</span>' : '<span class="badge open">Open</span>';
  return '<span class="badge closed">Closed</span>';
}

function cardHtml(c) {
  const pot = c.potUsd != null && Number(c.potUsd) !== Number(c.rewardAmount) ? ` · pot ${usd(c.potUsd)}` : '';
  const fee = c.entryFeeUsd == null || Number(c.entryFeeUsd) === 0 ? ' · free entry' : ` · fee ${usd2(c.entryFeeUsd)}`;
  const left = timeLeft(c.deadline);
  const leftClass = !isOpen(c) ? 'closed' : closesSoon(c) ? 'soon' : '';
  return `<article class="card">
    <a class="card-title" href="#/bounty/${esc(c.slug)}">${esc(c.title)}</a>
    <p class="card-meta"><strong>${usd(c.rewardAmount)}</strong>${pot}${fee} · <span class="${leftClass}">${esc(left)}</span> · ${num(c.submissionCount)} entries</p>
    <p class="card-foot">${chip(c.category || 'Bounty')} ${openBadge(c)}</p>
  </article>`;
}

export function boardListHtml(items) {
  if (!items.length) return '<p class="empty">No bounties match. Try clearing the search or another filter.</p>';
  return items.map(cardHtml).join('');
}

export function boardView(items, state, totals) {
  const { q, filter, sort } = state;
  return `<h1>Bounty board</h1>
  <p class="sub">${num(totals.all)} bounties · ${num(totals.open)} open · ${usd(totals.pots)} in live pots</p>
  <div class="toolbar">
    <input id="q" type="search" placeholder="Search bounties…" value="${esc(q)}" autocomplete="off">
    <div class="pills" role="group" aria-label="Filter">
      <button data-filter="open" class="${filter === 'open' ? 'on' : ''}">Open</button>
      <button data-filter="soon" class="${filter === 'soon' ? 'on' : ''}">Closing soon</button>
      <button data-filter="all" class="${filter === 'all' ? 'on' : ''}">All</button>
    </div>
    <select id="sort" aria-label="Sort">
      <option value="deadline" ${sort === 'deadline' ? 'selected' : ''}>Closing soonest</option>
      <option value="reward" ${sort === 'reward' ? 'selected' : ''}>Biggest reward</option>
      <option value="entries" ${sort === 'entries' ? 'selected' : ''}>Most entries</option>
    </select>
  </div>
  <div id="list">${boardListHtml(items)}</div>`;
}

export function bountyView(c, top) {
  const rewards = (c.rewardsNow || []).slice(0, 10);
  const rewardRows = rewards.map((r) => `<tr><td>${num(r.place)}</td><td>${usd2(r.amountUsd)}</td><td>${usd2(r.baseUsd)}</td><td>${usd2(r.feeShareUsd)}</td></tr>`).join('');
  const totalPlaces = Object.keys(c.rewards || {}).length;
  const desc = String(c.description || '').split(/\n\s*\n/).map((p) => `<p>${esc(p)}</p>`).join('');
  const rules = c.rules ? `<details class="rules"><summary>Rules</summary>${String(c.rules).split(/\n\s*\n/).map((p) => `<p>${esc(p)}</p>`).join('')}</details>` : '';
  const topRows = (top || []).map((e) => `<tr><td>${num(e.rank)}</td><td><a href="#/u/${esc(e.handle)}">${esc(e.handle)}</a></td><td>${esc(e.title)}</td><td>${pctMicro(e.values?.judge)}</td></tr>`).join('');
  return `<p><a class="back" href="#/">← Board</a></p>
  <h1>${esc(c.title)}</h1>
  <p class="sub">${c.sponsor?.name ? esc(c.sponsor.name) + ' · ' : ''}${esc(c.category || '')}${(c.skills || []).map((s) => ' ' + chip(s)).join('')}</p>
  <div class="facts">
    <div><span>Reward</span><strong>${usd(c.rewardAmount)}</strong></div>
    <div><span>Live pot</span><strong>${usd(c.potUsd)}</strong></div>
    <div><span>Entry fee</span><strong>${c.entryFeeUsd == null ? '—' : usd2(c.entryFeeUsd)}</strong></div>
    <div><span>Deadline</span><strong>${fmtDate(c.deadline)}</strong><em>${esc(timeLeft(c.deadline))}</em></div>
    <div><span>Opened</span><strong>${fmtDate(c.publishedAt)}</strong></div>
    <div><span>Entries</span><strong>${num(c.submissionCount)}</strong></div>
    <div><span>Status</span><strong>${isOpen(c) ? 'Takes entries' : 'Closed to entries'}</strong></div>
  </div>
  ${c.summary ? `<p class="summary">${esc(c.summary)}</p>` : ''}
  <div class="desc">${desc}</div>
  ${rules}
  <h2>Rewards</h2>
  <table class="tbl"><thead><tr><th>Place</th><th>Total</th><th>Base</th><th>Fee share</th></tr></thead><tbody>${rewardRows}</tbody></table>
  ${totalPlaces > rewards.length ? `<p class="sub">${num(totalPlaces)} paid places in all.</p>` : ''}
  <h2>Top entries <a class="more" href="#/bounty/${esc(c.slug)}/leaderboard">Full leaderboard →</a></h2>
  ${topRows ? `<table class="tbl"><thead><tr><th>#</th><th>Entrant</th><th>Entry</th><th>Win rate</th></tr></thead><tbody>${topRows}</tbody></table>` : '<p class="sub">No ranked entries yet.</p>'}`;
}

export function leaderboardView(slug, lb) {
  const entries = lb.entries || [];
  const row = (e) => {
    const img = e.image ? `<img class="ava" crossorigin="anonymous" src="${esc(API_ORIGIN + e.image)}" alt="" loading="lazy">` : '<span class="ava none"></span>';
    return `<tr><td>${num(e.rank)}</td><td>${img}<a href="#/u/${esc(e.handle)}">${esc(e.handle)}</a>${e.house ? ' ' + chip('house') : ''}</td><td>${esc(e.title)}</td><td>${pctMicro(e.values?.judge)}</td><td>${pctMicro(e.values?.judge_low)} – ${pctMicro(e.values?.judge_high)}</td><td>${num(e.values?.bytes)} B</td><td>${e.values?.valid ? '✓' : '—'}</td></tr>`;
  };
  const head = `<thead><tr><th>#</th><th>Entrant</th><th>Entry</th><th>Win rate</th><th>90% interval</th><th>Size</th><th>Valid</th></tr></thead>`;
  const first = entries.slice(0, 50).map(row).join('');
  const rest = entries.slice(50).map(row).join('');
  const table = entries.length
    ? `<table class="tbl">${head}<tbody>${first}</tbody>${rest ? `<tbody id="lb-more" hidden>${rest}</tbody>` : ''}</table>${rest ? `<p><button id="show-all" class="btn">Show all ${num(entries.length)} entries</button></p>` : ''}`
    : '<p class="empty">No ranked entries yet.</p>';
  return `<p><a class="back" href="#/bounty/${esc(slug)}">← ${esc(lb.competition?.title || slug)}</a></p>
  <h1>Leaderboard</h1>
  <p class="sub">${esc(lb.competition?.title || '')} · ${num(entries.length)} ranked entries · ${esc(lb.phase?.title || '')}</p>
  ${table}`;
}

export function profileView(p) {
  const img = p.image || p.avatar;
  const head = img
    ? `<img class="pava" crossorigin="anonymous" src="${esc(img.startsWith('http') ? img : API_ORIGIN + img)}" alt="">`
    : `<span class="pava none">${esc((p.handle || '?')[0].toUpperCase())}</span>`;
  const rec = p.record || {};
  const sols = (p.solutions || []).map((s) => {
    const comp = s.competition || {};
    const score = s.score?.column?.key === 'judge' ? pctMicro(s.score?.value) : esc(s.score?.display ?? '—');
    return `<article class="card">
      <a class="card-title" href="#/bounty/${esc(comp.slug)}">${esc(s.title)}</a>
      <p class="card-meta">${esc(comp.title || '')} · score ${score} · ${s.placement ? 'placed #' + num(s.placement) : 'unplaced'}${s.prize_usd ? ' · won ' + usd2(s.prize_usd) : ''}</p>
      <p class="card-foot">entered ${esc(timeAgo(s.entered_at))} · deadline ${fmtDate(comp.deadline)}</p>
    </article>`;
  }).join('');
  return `<div class="profile">
    ${head}
    <div><h1>@${esc(p.handle)}</h1>
    <p class="sub">${p.display_name ? esc(p.display_name) + ' · ' : ''}joined ${fmtDate(p.joined_at)}${p.bio ? ' · ' + esc(p.bio) : ''}</p></div>
  </div>
  <div class="facts">
    <div><span>Entered</span><strong>${num(rec.competitions_entered)}</strong></div>
    <div><span>Placed</span><strong>${num(rec.competitions_placed)}</strong></div>
    <div><span>Won</span><strong>${num(rec.competitions_won)}</strong></div>
    <div><span>Best place</span><strong>${rec.best_placement ? '#' + num(rec.best_placement) : '—'}</strong></div>
    <div><span>Prize money</span><strong>${usd2(rec.prize_usd)}</strong></div>
  </div>
  <h2>Entries</h2>
  ${sols || '<p class="empty">No entries yet.</p>'}`;
}

export function loadingView(what) {
  return `<p class="loading">Loading ${esc(what)}…</p>`;
}

export function errorView(msg) {
  return `<div class="error"><h1>Couldn’t load this page</h1><p>${esc(msg)}</p><p><a href="#/">Back to the board</a> · <a href="" onclick="location.reload();return false">Try again</a></p></div>`;
}
