/* =====================================================================
   大富翁 4Fun · 复刻版 —— 界面层
   ===================================================================== */

const CELL = 58;
let tileEls = [];
const boardEl = $('board'), pawnsEl = $('pawns'), logEl = $('log');

/* ---------------- 头像 ---------------- */
function avatarSVG(id) {
  const base = (skin, hair, extra) => `
    <svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="bg${id}" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#ffe9c9"/><stop offset="1" stop-color="#f6cf9e"/></linearGradient></defs>
      <rect width="64" height="64" fill="url(#bg${id})"/>
      <circle cx="32" cy="35" r="21" fill="${skin}"/>
      ${hair}${extra}
    </svg>`;
  if (id === 'mei') return base('#ffe3cf', `
      <path d="M11 34a21 21 0 0 1 42 0c0 3-2 5-4 3-4-6-11-8-17-8s-13 2-17 8c-2 2-4 0-4-3z" fill="#4a2f28"/>
      <circle cx="12" cy="35" r="7" fill="#4a2f28"/><circle cx="52" cy="35" r="7" fill="#4a2f28"/>
      <circle cx="12" cy="35" r="3.2" fill="#e86a9a"/><circle cx="52" cy="35" r="3.2" fill="#e86a9a"/>`, `
      <path d="M18 14l6 6-6 4-4-6z" fill="#e86a9a"/><path d="M46 14l-6 6 6 4 4-6z" fill="#e86a9a"/>
      <circle cx="25" cy="35" r="2.6" fill="#2b1d18"/><circle cx="39" cy="35" r="2.6" fill="#2b1d18"/>
      <circle cx="25.6" cy="34.2" r=".9" fill="#fff"/><circle cx="39.6" cy="34.2" r=".9" fill="#fff"/>
      <path d="M28 42q4 4 8 0" stroke="#b04f6e" stroke-width="1.8" fill="none" stroke-linecap="round"/>
      <circle cx="20" cy="40" r="3" fill="#ffb3c8" opacity=".7"/><circle cx="44" cy="40" r="3" fill="#ffb3c8" opacity=".7"/>`);
  if (id === 'tu') return base('#f3d3b3', `
      <ellipse cx="32" cy="21" rx="26" ry="7" fill="#e0b45c"/>
      <path d="M14 21q3-12 18-12t18 12z" fill="#f0c983"/>
      <path d="M14 21h36" stroke="#b98b3c" stroke-width="2.4"/>`, `
      <path d="M20 34q4-2.5 8 0M36 34q4-2.5 8 0" stroke="#3a2a1e" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <path d="M25 43q7 4 14 0" stroke="#8a5a3a" stroke-width="2.6" fill="none" stroke-linecap="round"/>
      <path d="M28 44q2 5 4 5t4-5" fill="#7a5030"/>
      <circle cx="19" cy="39" r="3" fill="#e8a07a" opacity=".6"/><circle cx="45" cy="39" r="3" fill="#e8a07a" opacity=".6"/>`);
  if (id === 'qian') return base('#ffe0c8', `
      <path d="M11 36a21 21 0 0 1 42 0v4c-6-8-14-10-21-10s-15 2-21 10z" fill="#6b4a8a"/>
      <circle cx="32" cy="12" r="9" fill="#6b4a8a"/><circle cx="32" cy="12" r="4" fill="#9a6bd0"/>`, `
      <circle cx="25" cy="35" r="2.5" fill="#2b1d18"/><circle cx="39" cy="35" r="2.5" fill="#2b1d18"/>
      <circle cx="25.6" cy="34.2" r=".9" fill="#fff"/><circle cx="39.6" cy="34.2" r=".9" fill="#fff"/>
      <path d="M28 42q4 3.4 8 0" stroke="#c0392b" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <circle cx="21" cy="47" r="2" fill="#fff"/><circle cx="26" cy="48.5" r="2" fill="#fff"/>
      <circle cx="32" cy="49.5" r="2" fill="#fff"/><circle cx="38" cy="48.5" r="2" fill="#fff"/><circle cx="43" cy="47" r="2" fill="#fff"/>
      <circle cx="14" cy="40" r="1.8" fill="#ffd76a"/><circle cx="50" cy="40" r="1.8" fill="#ffd76a"/>`);
  if (id === 'sha') return base('#e8c39e', `
      <path d="M10 30q2-16 22-16t22 16q-6-3-22-3T10 30z" fill="#e8913c"/>
      <path d="M12 27q20-9 40 0" stroke="#b96a22" stroke-width="2" fill="none"/>
      <circle cx="32" cy="12" r="4.5" fill="#f7b267"/>`, `
      <circle cx="25" cy="36" r="2.5" fill="#2b1d18"/><circle cx="39" cy="36" r="2.5" fill="#2b1d18"/>
      <path d="M24 42q8 9 16 0-4 12-8 12t-8-12z" fill="#4a3520"/>
      <path d="M27 41q5 2.5 10 0" stroke="#2b1d18" stroke-width="2" fill="none" stroke-linecap="round"/>
      <circle cx="18" cy="40" r="3" fill="#d99b6a" opacity=".6"/>`);
  if (id === 'nin') return base('#f0d0b0', `
      <path d="M11 32a21 21 0 0 1 42 0v3H11z" fill="#2d4a52"/>
      <rect x="9" y="31" width="46" height="7" rx="3" fill="#1f3a42"/>
      <path d="M35 17q9 6 9 16" stroke="#3f8c95" stroke-width="3" fill="none"/>
      <circle cx="46" cy="14" r="5" fill="#2d4a52"/>`, `
      <rect x="16" y="32" width="32" height="8" rx="3" fill="#20323a"/>
      <circle cx="25" cy="36" r="2.4" fill="#dff6ff"/><circle cx="39" cy="36" r="2.4" fill="#dff6ff"/>
      <path d="M26 46q6 3 12 0" stroke="#8a5a3a" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M14 22l6 10" stroke="#2d4a52" stroke-width="2.5" stroke-linecap="round"/>`);
  if (id === 'wu') return base('#ffe6d8', `
      <path d="M10 34a22 22 0 0 1 44 0c0 3-3 4-5 2-5-6-11-8-17-8s-12 2-17 8c-2 2-5 1-5-2z" fill="#c98d2e"/>
      <path d="M14 26l-4-9 9 3z" fill="#c98d2e"/><path d="M50 26l4-9-9 3z" fill="#c98d2e"/>`, `
      <path d="M17 26l3-9 4 8z" fill="#e8b25c"/><path d="M47 26l-3-9-4 8z" fill="#e8b25c"/>
      <circle cx="25" cy="35" r="3.2" fill="#2b1d18"/><circle cx="39" cy="35" r="3.2" fill="#2b1d18"/>
      <circle cx="26" cy="34" r="1.2" fill="#8fe3c5"/><circle cx="40" cy="34" r="1.2" fill="#8fe3c5"/>
      <path d="M28 42q4 3.4 8 0" stroke="#c0392b" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M20 40h-8M20 43h-7M44 40h8M44 43h7" stroke="#c98d2e" stroke-width="1.2" opacity=".8"/>`);
  return base('#e8c39e', '', '');
}

/* ---------------- 棋盘几何 ---------------- */
function gridPos(i) {
  if (i === 0) return {c: 13, r: 13};
  if (i < 12) return {c: 13 - i, r: 13};
  if (i === 12) return {c: 1, r: 13};
  if (i < 24) return {c: 1, r: 13 - (i - 12)};
  if (i === 24) return {c: 1, r: 1};
  if (i < 36) return {c: 1 + (i - 24), r: 1};
  if (i === 36) return {c: 13, r: 1};
  return {c: 13, r: 1 + (i - 36)};
}
function tileCenter(i) {
  const g = gridPos(i);
  return {x: (g.c - .5) * CELL, y: (g.r - .5) * CELL};
}
const PAWN_OFF = [[0, -7], [-9, 3], [9, 3], [0, 10]];

/* ---------------- 格子内容 ---------------- */
const CORNER = {
  start:    ['🏁', '起点', '过路 +2000'],
  jail:     ['🚔', '监狱', '探监'],
  hospital: ['🏥', '医院', '探病'],
  park:     ['🅿️', '停车场', '领奖池'],
};
const SPEC = {
  chance: ['🎁', '机会'],
  fate:   ['🔮', '命运'],
  tax:    ['🧾', '税务局'],
  store:  ['🛒', '道具店'],
  stock:  ['📈', '证券交易所'],
  news:   ['📰', '新闻'],
  bank:   ['🏦', '银行'],
  temple: ['⛩️', '土地庙'],
};

function cornerHTML(t) {
  const m = CORNER[t.type] || ['❓', t.name, ''];
  return `<div class="cicon">${m[0]}</div><div class="cname">${m[1]}</div><div class="csub">${m[2]}</div>`;
}
function tileHTML(t) {
  if (isCorner(t.type)) return cornerHTML(t);
  if (isProp(t)) {
    return `<div class="tint" style="background:${GROUPS[t.group].color};opacity:.06"></div>
      <div class="band" style="background:${GROUPS[t.group].color}"></div>
      <div class="tname ${t.name.length >= 4 ? 'sm' : ''}">${t.name}</div>
      <div class="tprice">$${t.price}</div>
      <div class="dyn"></div>`;
  }
  const s = SPEC[t.type] || ['❓', t.name];
  return `<div class="sicon">${s[0]}</div><div class="sname">${s[1]}</div><div class="dyn"></div>`;
}

function buildBoard() {
  TILES.forEach((t, i) => {
    const g = gridPos(i);
    const el = document.createElement('div');
    el.className = 'tile' + (isCorner(t.type) ? ' corner' : '') + (isProp(t) ? '' : (t.type === 'start' ? '' : ' ' + t.type));
    el.style.gridColumn = g.c;
    el.style.gridRow = g.r;
    el.dataset.i = i;
    el.innerHTML = tileHTML(t);
    el.onclick = () => showTileInfo(i);
    boardEl.appendChild(el);
    tileEls[i] = el;
  });
  buildCenterBadge();
}

function buildCenterBadge() {
  [0, 12, 24, 36].forEach(i => {
    const el = tileEls[i];
    if (!el) return;
    el.classList.add('corner');
    el.innerHTML = cornerHTML((S ? S.tiles : TILES)[i]);
  });
}

function refreshTile(i) {
  const t = (S ? S.tiles : TILES)[i];
  const el = tileEls[i];
  if (!el || !t) return;
  if (isProp(t)) {
    const dyn = el.querySelector('.dyn');
    if (dyn) {
      if (t.owner != null && S) {
        const p = S.players[t.owner];
        dyn.innerHTML = `<div class="own" style="background:${p.color}">${LV_ICON[t.level] || ''}</div>`;
      } else dyn.innerHTML = '';
    }
    el.classList.toggle('lvmax', t.level >= MAX_LV);
    el.classList.toggle('glow', !!(S && S.players[S.cur] && t.owner === S.players[S.cur].id && !S.over));
  }
  el.querySelectorAll('.hazard').forEach(n => n.remove());
  if (t.block != null) el.insertAdjacentHTML('beforeend', '<div class="hazard">🚧</div>');
  else if (t.mine != null) el.insertAdjacentHTML('beforeend', '<div class="hazard">💣</div>');
}
function renderAllTiles() { for (let i = 0; i < N; i++) refreshTile(i); renderPark(); }
function renderPark() {
  const el = tileEls[36];
  if (!el) return;
  let potEl = el.querySelector('.pot');
  if (!potEl) { potEl = document.createElement('div'); potEl.className = 'pot'; el.appendChild(potEl); }
  potEl.textContent = S && S.pot > 0 ? '$' + S.pot : '';
  potEl.style.display = S && S.pot > 0 ? 'block' : 'none';
}

/* ---------------- 棋子 ---------------- */
function renderPawns() {
  if (!S) return;
  pawnsEl.innerHTML = '';
  const byPos = {};
  S.players.forEach(p => { if (p.alive) (byPos[p.pos] = byPos[p.pos] || []).push(p); });
  S.players.forEach((p, idx) => {
    if (!p.alive) return;
    const list = byPos[p.pos];
    const k = list.indexOf(p);
    const off = PAWN_OFF[k % 4];
    const c = tileCenter(p.pos);
    const el = document.createElement('div');
    el.className = 'pawn' + (S.cur === idx && !S.over ? ' turn' : '');
    el.innerHTML = avatarSVG(p.charId);
    el.style.transform = `translate3d(${c.x - 13 + off[0]}px, ${c.y - 13 + off[1]}px, 0)`;
    el.style.zIndex = String(20 + k);
    pawnsEl.appendChild(el);
    p._el = el;
  });
}

/* ---------------- 玩家面板 ---------------- */
function badgesHTML(p) {
  let h = '';
  if (p.jail > 0) h += `<span class="badge jail">牢 ${p.jail}</span>`;
  if (p.hosp > 0) h += `<span class="badge hosp">院 ${p.hosp}</span>`;
  if (p.god) h += `<span class="badge god ${GODS[p.god].good ? '' : 'bad'}">${GODS[p.god].icon}${GODS[p.god].name} ${p.godLeft}</span>`;
  if (p.turtle > 0) h += `<span class="badge turtle">🐢${p.turtle}</span>`;
  if (p.angel > 0) h += `<span class="badge angel">😇${p.angel}</span>`;
  return h;
}
function playerCardHTML(p, idx) {
  const isAct = S && S.cur === idx && !S.over && p.alive;
  const props = p.props.map(ti => `<span class="dot" style="background:${GROUPS[S.tiles[ti].group].color}"></span>`).join('');
  return `<div class="pcard ${isAct ? 'act' : ''} ${p.alive ? '' : 'dead'}">
    <div class="av">${avatarSVG(p.charId)}</div>
    <div class="pinfo">
      <div class="prow1">
        <span class="pname" style="color:${p.color}">${p.name}</span>
        <span class="pcash">${fmt(p.cash)}</span>
      </div>
      <div class="prow2">
        <span>💎<b>${p.pts}</b></span>
        <span>🏦<b>${fmt(p.savings)}</b></span>
        <span>📈<b>${fmt(stockValue(p))}</b></span>
        <span>🏠<b>${p.props.length}</b></span>
      </div>
      <div class="prow3">
        <span class="dots">${props || '<span style="opacity:.45;font-size:9px">暂无地产</span>'}</span>
        <span>${badgesHTML(p)}</span>
      </div>
    </div>
    ${isAct ? '<div class="medal">▶</div>' : ''}
  </div>`;
}
function renderPlayers() {
  if (!S) return;
  $('players').innerHTML = S.players.map((p, i) => playerCardHTML(p, i)).join('');
}
function renderItems() {
  if (!S) return;
  const p = S.players[S.me];
  if (!p) return;
  $('ptsChip').textContent = '💎 ' + p.pts;
  $('itemgrid').innerHTML = ITEMS.map(it => {
    const n = p.items[it.id] || 0;
    return `<button class="it ${n ? '' : 'empty'}" data-item="${it.id}" title="${it.name}：${it.desc}${n ? '' : '（未拥有）'}">
      <span class="ic">${it.icon}</span><span class="nm">${it.name}</span>
      ${n ? `<span class="ct">${n}</span>` : ''}</button>`;
  }).join('');
  $('itemgrid').querySelectorAll('[data-item]').forEach(b => {
    b.onclick = () => {
      const id = b.dataset.item;
      if (!(p.items[id] > 0)) { toast(`没有「${ITEM_MAP[id].name}」，去道具店用点数换`); return; }
      useItem(p, id);
    };
  });
}
function renderMarket() {
  if (!S) return;
  const el = $('market');
  if (!el) return;
  el.innerHTML = S.stocks.map(s => {
    const prev = s.hist.length > 1 ? s.hist[s.hist.length - 2] : s.price;
    const up = s.price >= prev;
    const pct = Math.round((s.price - prev) / Math.max(1, prev) * 100);
    return `<div class="mkt ${up ? 'up' : 'down'}" data-stk="1">
      <span class="mk-n">${s.name}</span>
      <span class="mk-p">${fmt(s.price)}</span>
      <span class="mk-a">${up ? '▲' : '▼'}${Math.abs(pct)}%</span>
    </div>`;
  }).join('');
  el.querySelectorAll('[data-stk]').forEach(b => {
    b.onclick = () => { if (S && S.players[S.me]) stockDialog(S.players[S.me]); };
  });
}
function renderGodbar() {
  const p = S && S.players[S.cur];
  if (!p) return;
  let h = '';
  if (p.god) h += `<span class="god-chip ${GODS[p.god].good ? '' : 'bad'}">${GODS[p.god].icon} ${GODS[p.god].name} · ${p.godLeft}</span>`;
  if (p.angel > 0) h += `<span class="god-chip">😇 天使护体 ${p.angel}</span>`;
  if (p.turtle > 0) h += `<span class="god-chip bad">🐢 减速 ${p.turtle}</span>`;
  if (p.freePass) h += `<span class="god-chip">🎫 免租待用</span>`;
  if (p.dir < 0) h += `<span class="god-chip">↩️ 逆向</span>`;
  $('godbar').innerHTML = h;
  $('newsline').textContent = S.news ? '📰 ' + S.news : '';
}

/* ---------------- 顶栏 ---------------- */
function updateBadge() {
  if (!S) return;
  const p = S.players[S.cur];
  if (!p) return;
  $('badgeAv').innerHTML = avatarSVG(p.charId);
  $('badgeNm').textContent = p.name + (p.ai ? '（电脑）' : '（你）');
  $('badgeNm').style.color = p.color;
  $('badgeCash').textContent = `${fmt(p.cash)} · 💎${p.pts} · 第 ${Math.min(S.round, MAX_ROUNDS)} 回合`;
  $('rollBtn').disabled = !(S.awaitRoll && !S.busy && S.players[S.cur] === p);
  $('roundTip').textContent = `第 ${Math.min(S.round, MAX_ROUNDS)} / ${MAX_ROUNDS} 回合`;
}
function updatePlayersOnly() {
  if (!S) return;
  renderPlayers(); updateBadge(); renderItems(); renderGodbar(); renderMarket();
}
function updateUI() {
  if (!S) return;
  renderPlayers(); updateBadge(); renderAllTiles(); renderItems(); renderGodbar(); renderMarket();
}

function log(html) {
  const div = document.createElement('div');
  div.className = 'ln';
  div.innerHTML = html;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
  while (logEl.children.length > 80) logEl.removeChild(logEl.firstChild);
  $('ticker').innerHTML = html;
}
function toast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('on');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.remove('on'), 1800);
}
function floatMoney(p, text, color) {
  if (!p._el) return;
  const r = p._el.getBoundingClientRect();
  const el = document.createElement('div');
  el.className = 'float';
  el.textContent = text;
  el.style.color = color || '#ffe9a8';
  el.style.left = (r.left + r.width / 2) + 'px';
  el.style.top = (r.top - 6) + 'px';
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1100);
}

/* ---------------- 骰子 ---------------- */
const PIPS = {1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8]};
function initDie() {
  ['die1', 'die2'].forEach(id => {
    const d = $(id);
    d.innerHTML = Array.from({length: 9}, () => '<span class="pip"></span>').join('');
    setDie(d, 3);
  });
}
function setDie(el, v) {
  el.querySelectorAll('.pip').forEach((p, i) => p.classList.toggle('on', PIPS[v].includes(i)));
}
async function animateDice(a, b) {
  const d1 = $('die1'), d2 = $('die2');
  d1.classList.add('rolling'); d2.classList.add('rolling');
  const t0 = Date.now();
  while (Date.now() - t0 < 420 * SPEED) {
    setDie(d1, 1 + rnd(6)); setDie(d2, 1 + rnd(6));
    await sleep(60);
  }
  d1.classList.remove('rolling'); d2.classList.remove('rolling');
  setDie(d1, a); setDie(d2, b);
  sfx.dice();
}

/* ---------------- 弹窗 ---------------- */
function modal({icon, title, html, actions, extra, kind}) {
  return new Promise(resolve => {
    const ovl = $('ovl'), panel = $('panel');
    const acts = actions || [{label: '确定', v: 1}];
    panel.className = 'panel' + (kind ? ' kind-' + kind : '');
    panel.innerHTML = `
      ${kind ? `<div class="card-ribbon">${kind === 'chance' ? '机 会' : '命 运'}</div>` : ''}
      <div class="pic">${icon || '❓'}</div>
      <h3>${title}</h3>
      <div>${html || ''}</div>
      ${extra || ''}
      <div class="acts">${acts.map((a, i) =>
        `<button class="btn ${a.cls || 'gold'}" data-i="${i}">${a.label}</button>`).join('')}</div>`;
    ovl.classList.add('show');
    panel.querySelectorAll('[data-i]').forEach(b => {
      b.onclick = () => {
        ovl.classList.remove('show');
        resolve(acts[+b.dataset.i].v);
      };
    });
  });
}

function chooseRows(title, sub, rows, cancelLabel = '取消') {
  return new Promise(resolve => {
    const ovl = $('ovl'), panel = $('panel');
    panel.className = 'panel';
    panel.innerHTML = `<h3>${title}</h3>${sub ? `<p style="margin-bottom:4px">${sub}</p>` : ''}
      <div class="pick-list">${rows.map((r, i) => `
        <button class="pick-row" data-i="${i}" ${r.disabled ? 'disabled' : ''}>
          <span class="pi">${r.icon || '•'}</span>
          <span class="pm"><span class="pn">${r.name}</span><span class="ps">${r.sub || ''}</span></span>
          <span class="pv">${r.right || ''}</span>
        </button>`).join('')}</div>
      <div class="acts"><button class="btn ghost" data-cancel="1">${cancelLabel}</button></div>`;
    ovl.classList.add('show');
    panel.querySelectorAll('.pick-row').forEach(b => {
      b.onclick = () => { ovl.classList.remove('show'); resolve(rows[+b.dataset.i].val); };
    });
    panel.querySelector('[data-cancel]').onclick = () => { ovl.classList.remove('show'); resolve(null); };
  });
}
function chooseNumber(title, sub, values) {
  return chooseRows(title, sub, values.map(v => ({icon: v, name: `${v} 点`, val: v})), '取消');
}

/* ---------------- 地产信息 ---------------- */
function propTableHTML(t, p) {
  const groupTiles = S.tiles.filter(x => isProp(x) && x.group === t.group);
  const mineCount = p ? groupTiles.filter(x => x.owner === p.id).length : 0;
  const rows = [0, 1, 2, 3, 4].map(l => {
    const r = Math.round(t.price * RENT[l] * (t.owner != null && ownsGroup(t.owner, t.group) ? 2 : 1) * (S.rentMod || 1));
    return `<tr><td>${LV_NAME[l]}${l === 0 ? '（未建）' : ''}</td>
      <td class="${t.level === l ? 'rent-now' : ''}">${t.level === l ? '当前 ' : ''}${fmt(r)}</td></tr>`;
  }).join('');
  return `<table class="prop-table">
    <tr><td>${GROUPS[t.group].name}地块 · 同组已有 ${mineCount}/${groupTiles.length}</td><td>${fmt(t.price)}</td></tr>
    ${rows}
  </table>`;
}

async function showTileInfo(i) {
  if (!S) return;
  const t = S.tiles[i];
  if (isProp(t)) {
    const owner = t.owner != null ? S.players[t.owner] : null;
    await modal({
      icon: GROUPS[t.group].name === '美洲' ? '🌆' : '🏙️',
      title: `${t.name} · ${LV_NAME[t.level]}`,
      html: `<p>${owner ? `业主：<b style="color:${owner.color}">${owner.name}</b>` : '这块地还没有主人'}</p>
        ${owner ? propTableHTML(t, owner) : `<table class="prop-table"><tr><td>地价</td><td>${fmt(t.price)}</td></tr>
        <tr><td>空地租金</td><td>${fmt(Math.round(t.price * RENT[0]))}</td></tr></table>`}`,
      actions: [{label: '关闭', v: 1, cls: 'ghost'}]
    });
  } else {
    const tips = {
      start: '经过领 $2,000 + 150 点数，停在这里再加 $500。',
      jail: '路过探监，没别的事。',
      hospital: '路过探病，没别的事。',
      park: '领走所有税款累积的奖池。',
      chance: '抽一张机会卡，多半是好事。',
      fate: '抽一张命运卡，好坏都有。',
      tax: '缴现金 10%（至少 $900）进停车奖池。',
      store: '用点数买道具，12 种道具各有用处。',
      stock: '买卖 4 支股票，股票计入总资产。',
      bank: '存取款，存款每回合生息且不怕均富卡。',
      news: '触发一条全局新闻，影响所有人。',
      temple: '花 60 点数求一位吉神附身。',
    };
    await modal({icon: SPEC[t.type] ? SPEC[t.type][0] : '❓', title: t.name, html: `<p>${tips[t.type] || ''}</p>`, actions: [{label: '关闭', v: 1, cls: 'ghost'}]});
  }
}

/* ---------------- 股票面板 ---------------- */
function sparkSVG(hist, color) {
  const w = 84, h = 26;
  const min = Math.min(...hist), max = Math.max(...hist);
  const rng = Math.max(1, max - min);
  const pts = hist.map((v, i) => `${(i / Math.max(1, hist.length - 1)) * w},${h - 2 - ((v - min) / rng) * (h - 5)}`).join(' ');
  return `<svg class="spark" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="1.6" stroke-linejoin="round"/></svg>`;
}
function stockDialog(p) {
  return new Promise(resolve => {
    const ovl = $('ovl'), panel = $('panel');
    const render = () => {
      panel.className = 'panel';
      const rows = S.stocks.map(s => {
        const held = p.stocks[s.id] || 0;
        const avg = held ? (p.stockCost[s.id] || 0) / held : 0;
        const pl = held ? Math.round((s.price - avg) * held) : 0;
        const prev = s.hist.length > 1 ? s.hist[s.hist.length - 2] : s.price;
        const up = s.price >= prev;
        return `<div class="stock-row">
            <div class="sn"><b>${s.name}</b><span>${s.code}</span></div>
            <div class="sp">${sparkSVG(s.hist, up ? '#c0392b' : '#2f8a5e')}</div>
            <div class="sv ${up ? 'up' : 'down'}">${fmt(s.price)}</div>
            <div class="sact">
              <button class="btn green sm" data-buy="${s.id}">买100</button>
              <button class="btn ghost sm" data-sell="${s.id}">卖100</button>
            </div>
          </div>
          <div style="font-size:10px;color:#8a7350;text-align:right;margin:-2px 0 5px">
            持有 ${held} 股${held ? ` · <b class="${pl >= 0 ? 'up' : 'down'}">${pl >= 0 ? '盈' : '亏'} ${fmt(Math.abs(pl))}</b>` : ''}
          </div>`;
      }).join('');
      panel.innerHTML = `<h3>📈 证券交易所</h3>
        <p style="font-size:11px">现金 <b>${fmt(p.cash)}</b> · 持仓市值 <b>${fmt(stockValue(p))}</b> · 每次交易 100 股</p>
        <div style="margin-top:8px">${rows}</div>
        <div class="acts"><button class="btn gold" data-close="1">离开</button></div>`;
      panel.querySelectorAll('[data-buy]').forEach(b => b.onclick = () => {
        if (buyStock(p, b.dataset.buy, 100)) { log(`📈 <b>${p.name}</b> 买入 100 股`); sfx.buy(); }
        else toast('现金不够');
        render();
      });
      panel.querySelectorAll('[data-sell]').forEach(b => b.onclick = () => {
        if (sellStock(p, b.dataset.sell, 100)) { log(`📉 <b>${p.name}</b> 卖出 100 股`); sfx.coin(); }
        else toast('没有那么多股');
        render();
      });
      panel.querySelector('[data-close]').onclick = () => { ovl.classList.remove('show'); resolve(); };
    };
    ovl.classList.add('show');
    render();
  });
}

/* ---------------- 规则 ---------------- */
function openRules() {
  modal({
    icon: '📖', title: '游戏规则',
    html: `<div class="rule-list">
      <h4>🎯 目标</h4>
      让对手全部破产，或者在 ${MAX_ROUNDS} 回合结束时总资产最高。
      <h4>🎲 回合</h4>
      每回合掷两颗骰子前进，经过起点领 <b>$2,000 + 150 点数</b>。掷完才结算落点。
      <h4>🏙️ 地产</h4>
      空地可买；停在自己地上可盖楼：木屋 → 洋房 → 大楼 → 摩天楼，租金逐级暴涨。
      <b>集齐同色一整组，租金翻倍。</b>
      <h4>💎 点数与道具</h4>
      点数靠经过起点和事件获得，在道具店换道具。共 12 种：遥控骰子、路障、地雷、传送卡、均富卡、购地卡、拆迁卡、免费卡、换地卡、转向卡、乌龟卡、天使卡。点击右下道具栏使用。
      <h4>⛩️ 神仙</h4>
      财神（收租翻倍）、土地公（免费盖楼）、福神（多走 2 步）、天使（免租）是吉神；穷神（付租翻倍）、衰神（少走 1 步）是凶神。土地庙可花 60 点数求吉神。
      <h4>📈 股票 / 🏦 银行</h4>
      4 支股票每回合波动，买卖赚差价，市值计入总资产。银行存款每回合 5% 利息（钱夫人 10%），且不会被均富卡和查税动到。
      <h4>🏥 特殊格</h4>
      税务局收 10% 现金进停车奖池；停车场可领走奖池；地雷会让人住院；监狱停 2 回合。
      <h4>💥 破产</h4>
      现金不够会依次卖股票、取存款、变卖地产（八折），还不够就破产，地产归债主。
      <h4>🧑‍🤝‍🧑 角色特技</h4>
      阿土伯买地 9 折、孙小美收租 +25%、钱夫人利息翻倍、沙隆巴斯付租 -20%、忍太郎坐牢住院少 1 回合、乌咪常捡道具。
    </div>`,
    actions: [{label: '开始赚钱', v: 1}]
  });
}

/* ---------------- 结算 ---------------- */
function showResult(title, sub) {
  const sorted = [...S.players].sort((a, b) => (b.alive - a.alive) || (totalAssets(b) - totalAssets(a)));
  const rows = sorted.map((p, i) => `
    <div class="rank-row ${i === 0 ? 'first' : ''}">
      <div class="av">${avatarSVG(p.charId)}</div>
      <div class="rn">${['🥇', '🥈', '🥉', '4️⃣'][i] || ''} ${p.name} ${p.alive ? '' : '（破产）'}
        <div style="font-size:9.5px;color:#9a8460;font-weight:600">现金 ${fmt(p.cash)} · 存款 ${fmt(p.savings)} · 股票 ${fmt(stockValue(p))} · 地产 ${p.props.length} 块</div>
      </div>
      <div class="rv">${fmt(totalAssets(p))}</div>
    </div>`).join('');
  modal({
    icon: '🏆', title, html: `<p>${sub}</p>${rows}`,
    actions: [{label: '再来一局', v: 1}]
  }).then(() => location.reload());
}

/* ---------------- 交互绑定 ---------------- */
$('rollBtn').onclick = () => {
  if (!S || !S.awaitRoll || !S.rollResolve) return;
  const r = S.rollResolve;
  S.rollResolve = null;
  S.awaitRoll = false;
  r();
};
$('rulesBtn').onclick = openRules;
$('muteBtn').onclick = () => {
  MUTE = !MUTE;
  $('muteBtn').textContent = MUTE ? '🔇 静音' : '🔊 音效';
  if (!MUTE) tone(880, .08, 'sine', .05);
};
$('bankBtn').onclick = () => { if (S && S.players[S.me]) bankDialog(S.players[S.me]); };
$('stockBtn').onclick = () => { if (S && S.players[S.me]) stockDialog(S.players[S.me]); };
document.addEventListener('keydown', e => {
  if (e.code === 'Space' && S && S.awaitRoll && S.rollResolve) { e.preventDefault(); $('rollBtn').click(); }
});

/* ---------------- 开始页 ---------------- */
let pickedChar = 'tu', pickedCount = 4;
function initStart() {
  $('chars').innerHTML = CHARS.map(c => `
    <div class="char ${c.id === pickedChar ? 'sel' : ''}" data-c="${c.id}">
      <div class="tick">✔</div>
      <div class="cav">${avatarSVG(c.id)}</div>
      <div class="cn">${c.name}</div>
      <div class="ct">${c.tag}</div>
      <div class="cs">${c.skill}</div>
    </div>`).join('');
  $('chars').querySelectorAll('.char').forEach(el => {
    el.onclick = () => {
      pickedChar = el.dataset.c;
      $('chars').querySelectorAll('.char').forEach(x => x.classList.toggle('sel', x === el));
      tone(660, .07, 'sine', .04);
    };
  });
  $('counts').querySelectorAll('button').forEach(b => {
    b.onclick = () => {
      pickedCount = +b.dataset.n;
      $('counts').querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
    };
  });
  $('startBtn').onclick = () => {
    $('startScreen').classList.add('hide');
    startGame(pickedCount, pickedChar, false);
  };
}

/* ---------------- 启动 ---------------- */
const qs = new URLSearchParams(location.search);

function boot() {
  if (qs.has('nofx')) document.body.classList.add('nofx');
  buildBoard();
  initDie();
  initStart();

  if (qs.has('autotest')) {
    SPEED = 0; MUTE = true;
    $('startScreen').classList.add('hide');
    const maxTurns = parseInt(qs.get('autotest'), 10) || 400;
    startGame(4, 'tu', true);
    S.turnCap = maxTurns;
    S.itemSpam = qs.has('itemspam');
    S.loop.then(() => {
      setTimeout(() => {
        const t = `AUTOTEST_OK turns=${S.turnCount} round=${S.round} over=${S.over} `
          + `cash=${S.players.map(p => p.cash).join('/')} props=${S.players.map(p => p.props.length).join('/')} `
          + `stocks=${S.players.map(p => Object.values(p.stocks).reduce((a, b) => a + b, 0)).join('/')} `
          + `pts=${S.players.map(p => p.pts).join('/')}`;
        document.title = t;
        $('autotest-result').textContent = t;
        updateUI();
      }, 50);
    }).catch(e => {
      document.title = 'AUTOTEST_FAIL ' + e.message;
      $('autotest-result').textContent = 'FAIL ' + (e.stack || e.message);
    });
  } else if (qs.has('smoketest')) {
    SPEED = 0.05; MUTE = true;
    $('startScreen').classList.add('hide');
    const errs = [];
    window.onerror = (m, s, l) => { errs.push(m + '@' + l); };
    startGame(2, 'tu', false);
    let guard = 0;
    const tick = setInterval(() => {
      guard++;
      if (!S || S.over || S.turnCount > 80 || guard > 6000) {
        clearInterval(tick);
        const t = `SMOKE_OK turns=${S.turnCount} round=${S.round} over=${S.over} err=${errs.length} ${errs.join(' | ')}`;
        document.title = t;
        $('autotest-result').textContent = t;
        return;
      }
      const ovl = $('ovl');
      if (ovl.classList.contains('show')) {
        const b = ovl.querySelector('[data-close]') || ovl.querySelector('.btn.gold') || ovl.querySelector('.btn');
        if (b) b.click();
      } else if (S.awaitRoll && S.rollResolve) {
        $('rollBtn').click();
      }
    }, 50);
  } else if (qs.get('preview') === 'card') {
    $('startScreen').classList.add('hide');
    startGame(4, 'tu', true);
    S.stopped = true;
    setTimeout(() => modal({
      icon: '💰', title: '财神降临',
      html: '<p>财神爷看中了你，<b>附身 4 回合</b>：收租翻倍、过路费翻倍！</p>',
      actions: [{label: '继续', v: 1}], kind: 'chance'
    }), 300);
  } else if (qs.get('preview') === 'stock') {
    $('startScreen').classList.add('hide');
    startGame(4, 'tu', false);
    S.stopped = true;
    S.players[0].cash = 32000;
    S.players[0].stocks = {tech: 300, land: 100, bank: 0, oil: 0};
    S.players[0].stockCost = {tech: 30000, land: 9000, bank: 0, oil: 0};
    setTimeout(() => stockDialog(S.players[0]), 300);
  } else if (qs.get('preview') === 'store') {
    $('startScreen').classList.add('hide');
    startGame(4, 'tu', false);
    S.stopped = true;
    S.players[0].pts = 420;
    S.players[0].items = {dice: 2, block: 1, mine: 1, tp: 1, rich: 1, angel: 1};
    setTimeout(() => visitStore(S.players[0]), 300);
  } else if (qs.get('preview') === 'over') {
    $('startScreen').classList.add('hide');
    startGame(4, 'tu', true);
    S.stopped = true;
    setTimeout(() => {
      S.players[0].cash = 42000; S.players[1].alive = false; S.players[1].cash = 0;
      S.players[2].cash = 28000; S.players[3].alive = false; S.players[3].cash = 0;
      endGame(S.players[0]);
    }, 400);
  }
}
boot();
