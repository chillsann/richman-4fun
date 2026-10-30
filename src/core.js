/* =====================================================================
   大富翁 4Fun · 复刻版 —— 规则内核
   ===================================================================== */

let S = null;
let SPEED = 1;
let MUTE = false;
let AC = null;
let audioUnlocked = false;
let audioWarned = false;

const $ = id => document.getElementById(id);
const sleep = ms => new Promise(r => setTimeout(r, Math.max(0, ms * SPEED)));
const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const fmt = n => '$' + Math.round(n).toLocaleString('en-US');
const isProp = t => t.type === 'prop';
const isCorner = ty => ['start', 'jail', 'hospital', 'park'].includes(ty);

/* ---------------- 音效 ----------------
   浏览器自动播放策略：AudioContext 必须在「用户手势」内创建并 resume，
   否则会一直停在 suspended 状态（表现就是整局没声音）。
   本作的掷骰动画、AI 回合都发生在 await 之后，已经脱离手势上下文，
   所以必须单独监听手势事件做 unlock，并在每次发声前兜底 resume。 */
function ensureAudio() {
  try {
    if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)();
    if (AC.state === 'suspended') AC.resume().catch(() => {});
    return AC;
  } catch (e) { return null; }
}
function unlockAudio() {
  if (AC && AC.state === 'running') { audioUnlocked = true; return; }
  const ac = ensureAudio();
  if (!ac) return;
  ac.resume().catch(() => {});
  try {                       // iOS/Safari 需要真的播一次才解锁
    const o = ac.createOscillator(), g = ac.createGain();
    g.gain.value = 0.00001;
    o.connect(g); g.connect(ac.destination);
    o.start(); o.stop(ac.currentTime + 0.02);
  } catch (e) {}
  audioUnlocked = true;
  setTimeout(() => {
    if (AC && AC.state !== 'running' && !audioWarned) {
      audioWarned = true;
      if (typeof toast === 'function') toast('🔈 浏览器拦住了声音，再点一下画面');
    }
  }, 150);
}
function tone(freq, dur, type = 'sine', vol = 0.05, delay = 0) {
  if (MUTE || SPEED === 0) return;
  const ac = ensureAudio();
  if (!ac) return;
  try {
    const t0 = ac.currentTime + delay;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t0);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(ac.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  } catch (e) {}
}
const sfx = {
  dice: () => { tone(300, .06, 'square', .11); tone(420, .06, 'square', .11, .07); tone(520, .06, 'square', .11, .14); },
  step: () => tone(680, .045, 'triangle', .055),
  coin: () => { tone(880, .09, 'triangle', .14); tone(1320, .12, 'triangle', .12, .07); },
  buy:  () => { tone(523, .12, 'sine', .14); tone(659, .12, 'sine', .14, .08); tone(784, .18, 'sine', .14, .16); },
  pay:  () => { tone(220, .16, 'sawtooth', .11); tone(160, .2, 'sawtooth', .1, .1); },
  bad:  () => { tone(180, .3, 'square', .11); tone(120, .34, 'square', .09, .12); },
  card: () => { tone(700, .08, 'triangle', .12); tone(980, .11, 'triangle', .11, .06); },
  upg:  () => { tone(659, .1, 'sine', .13); tone(880, .13, 'sine', .13, .09); tone(1175, .2, 'sine', .12, .19); },
  win:  () => { [523, 659, 784, 1047].forEach((f, i) => tone(f, .22, 'sine', .16, i * .11)); },
  lose: () => { [392, 330, 262].forEach((f, i) => tone(f, .26, 'sawtooth', .11, i * .13)); },
};

/* =====================================================================
   资产与金钱
   ===================================================================== */
function invested(t) {
  let v = t.price;
  for (let l = 0; l < t.level; l++) v += Math.round(t.price * UPG[l]);
  return v;
}
function upgCost(t) { return Math.round(t.price * UPG[t.level]); }
function buyCost(p, t) { return Math.round(t.price * (p.charId === 'tu' ? 0.9 : 1)); }
function ownsGroup(pid, group) {
  return S.tiles.filter(t => isProp(t) && t.group === group).every(t => t.owner === pid);
}
function stockValue(p) {
  return S.stocks.reduce((s, st) => s + (p.stocks[st.id] || 0) * st.price, 0);
}
function totalAssets(p) {
  return Math.round(p.cash + p.savings + stockValue(p) + p.props.reduce((s, i) => s + invested(S.tiles[i]) * 0.9, 0));
}
function allPropsOfOthers(p) {
  return S.tiles.filter(t => isProp(t) && t.owner != null && t.owner !== p.id && S.players[t.owner].alive);
}
function rentOf(t) {
  const owner = S.players[t.owner];
  if (!owner) return 0;
  let base = t.price * RENT[t.level];
  if (ownsGroup(t.owner, t.group)) base *= 2;
  if (owner.god === 'cai') base *= 2;
  base *= (S.rentMod || 1);
  return Math.round(base);
}

function gain(p, amt, quiet) {
  p.cash += amt;
  if (!quiet) {
    if (p._el) floatMoney(p, '+' + fmt(amt), '#9dffb0');
    sfx.coin();
  }
  updatePlayersOnly();
}

/** 付钱；toId 为收款人。返回 false 表示破产 */
async function payMoney(p, amount, toId = null, quiet = false) {
  const ok = await charge(p, amount, toId);
  if (ok && !quiet && p._el) floatMoney(p, '-' + fmt(amount), '#ff9c9c');
  updatePlayersOnly();
  return ok;
}

/** 扣款：现金 → 卖股票 → 取存款 → 变卖地产 → 破产 */
async function charge(p, amount, toId = null) {
  amount = Math.round(amount);
  if (amount <= 0) return true;
  if (p.cash >= amount) {
    p.cash -= amount;
    if (toId != null && S.players[toId]) S.players[toId].cash += amount;
    updatePlayersOnly();
    return true;
  }
  // 1) 卖股票
  for (const s of S.stocks) {
    if (p.cash >= amount) break;
    const sh = p.stocks[s.id] || 0;
    if (sh > 0) {
      p.stocks[s.id] = 0;
      p.cash += sh * s.price;
      p.stockCost[s.id] = 0;
      log(`📉 <b>${p.name}</b> 被迫卖出 ${s.name}股 ${sh} 股，换得 ${fmt(sh * s.price)}`);
      updatePlayersOnly();
      await sleep(160);
    }
  }
  // 2) 取存款
  if (p.cash < amount && p.savings > 0) {
    const take = Math.min(p.savings, amount - p.cash);
    p.savings -= take; p.cash += take;
    log(`🏦 <b>${p.name}</b> 从银行取出 ${fmt(take)}`);
    updatePlayersOnly();
    await sleep(160);
  }
  // 3) 变卖地产（先卖便宜的）
  let guard = 0;
  while (p.cash < amount && p.props.length && guard++ < 40) {
    p.props.sort((a, b) => invested(S.tiles[a]) - invested(S.tiles[b]));
    const ti = p.props.shift();
    const t = S.tiles[ti];
    const val = Math.round(invested(t) * 0.8);
    t.owner = null; t.level = 0;
    p.cash += val;
    log(`💸 <b>${p.name}</b> 变卖「${t.name}」换得 ${fmt(val)}`);
    refreshTile(ti); renderPark(); updatePlayersOnly();
    await sleep(200);
  }
  if (p.cash >= amount) {
    p.cash -= amount;
    if (toId != null && S.players[toId]) S.players[toId].cash += amount;
    updatePlayersOnly();
    return true;
  }
  // 4) 破产
  await goBankrupt(p, amount, toId);
  return false;
}

async function goBankrupt(p, owed, toId) {
  const lost = p.cash;
  p.cash = 0;
  p.alive = false;
  const creditor = (toId != null) ? S.players[toId] : null;
  // 地产转给债主，否则回到无主
  p.props.forEach(ti => {
    const t = S.tiles[ti];
    if (creditor && creditor.alive) { t.owner = creditor.id; creditor.props.push(ti); }
    else { t.owner = null; t.level = 0; }
    refreshTile(ti);
  });
  p.props = [];
  p.stocks = {tech: 0, land: 0, bank: 0, oil: 0};
  p.savings = 0;
  log(`💥 <b style="color:${p.color}">${p.name}</b> 破产出局！（欠款 ${fmt(owed - lost)}${creditor ? '，资产归 ' + creditor.name : ''}）`);
  sfx.bad();
  updateUI();
  await sleep(500);
  if (!p.ai && !(qs.has('autotest') || qs.has('smoketest'))) {
    await modal({
      icon: '💥', title: '你破产啦',
      html: `<p>房子卖光、现金见底，这局到此为止。<br>下次记得留点现金周转哦！</p>`,
      actions: [{label: '看看结果', v: 1}]
    });
  }
  checkEnd();
}

/* =====================================================================
   点数 / 道具
   ===================================================================== */
function addItem(p, id, n = 1) {
  p.items[id] = (p.items[id] || 0) + n;
  updateUI();
}

async function useItem(p, id, ai = false) {
  if (!p.items[id] || p.items[id] <= 0) { if (!ai) toast('没有这件道具'); return; }
  if (!ai && (!S.awaitRoll || S.players[S.cur] !== p)) { toast('轮到你掷骰子时才能用道具'); return; }
  const it = ITEM_MAP[id];
  let used = false;

  if (id === 'dice') {
    let v;
    if (ai) v = 2 + rnd(11);
    else v = await chooseNumber('遥控骰子', `指定这次走几步（你有 ${p.pts} 点数）`, [2,3,4,5,6,7,8,9,10,11,12]);
    if (!v) return;
    p.remote = v; used = true;
    log(`🎲 <b>${p.name}</b> 用遥控骰子指定了 ${v} 点`);
    toast(`点数已设为 ${v}`);
  }

  else if (id === 'block' || id === 'mine') {
    const isBlock = id === 'block';
    const offs = [3, 5, 7, 9];
    let off;
    if (ai) off = pick(offs);
    else {
      off = await chooseRows(
        isBlock ? '放置路障' : '埋设地雷',
        '选一个距离，放在你前方的格子上',
        offs.map(o => ({
          icon: isBlock ? '🚧' : '💣',
          name: `前方 ${o} 格`,
          sub: S.tiles[(p.pos + o) % N].name,
          val: o
        })), '取消');
    }
    if (!off) return;
    const idx = (p.pos + off) % N;
    if (S.tiles[idx].block != null || S.tiles[idx].mine != null) { if (!ai) toast('那里已经有陷阱了'); return; }
    if (isBlock) S.tiles[idx].block = p.id; else S.tiles[idx].mine = p.id;
    refreshTile(idx); used = true;
    log(`${isBlock ? '🚧' : '💣'} <b>${p.name}</b> 在「${S.tiles[idx].name}」${isBlock ? '放了路障' : '埋了地雷'}`);
  }

  else if (id === 'tp') {
    const best = mine => mine.length ? mine.sort((a, b) => invested(S.tiles[b]) - invested(S.tiles[a]))[0] : null;
    const myBest = best(p.props.slice());
    const otherBest = best(allPropsOfOthers(p).map(t => t.i));
    const opts = [
      {icon: '🏁', name: '起点', sub: '领过路费 + 点数', val: 0},
      {icon: '🛒', name: '道具店', sub: '买道具', val: S.tiles.findIndex(t => t.type === 'store')},
      {icon: '📈', name: '证券交易所', sub: '买卖股票', val: S.tiles.findIndex(t => t.type === 'stock')},
      {icon: '🏦', name: '银行', sub: '存取款', val: S.tiles.findIndex(t => t.type === 'bank')},
      {icon: '⛩️', name: '土地庙', sub: '求神仙', val: S.tiles.findIndex(t => t.type === 'temple')},
    ];
    if (myBest != null) opts.push({icon: '🏙️', name: '我的「' + S.tiles[myBest].name + '」', sub: '回去盖楼', val: myBest});
    if (otherBest != null) opts.push({icon: '☠️', name: '对手的「' + S.tiles[otherBest].name + '」', sub: '去踩雷付租', val: otherBest});
    let dest;
    if (ai) dest = pick(opts).val;
    else dest = await chooseRows('传送卡', '传送到哪里？传送后本回合不再掷骰', opts, '取消');
    if (dest == null) return;
    p.pos = dest; renderPawns(); used = true;
    log(`🌀 <b>${p.name}</b> 传送到「${S.tiles[dest].name}」`);
    await sleep(260);
    S.skipRoll = true;
    await resolveTile(p);
    if (S.rollResolve) { const r = S.rollResolve; S.rollResolve = null; setTimeout(r, 220); }
  }

  else if (id === 'rich') {
    if (!ai) {
      const ok = await modal({icon: '⚖️', title: '使用均富卡？', html: `<p>所有存活玩家的现金会被收拢后平分。<br>你现在有 <b>${fmt(p.cash)}</b>。</p>`,
        actions: [{label: '使用', v: 1}, {label: '算了', v: 0, cls: 'ghost'}]});
      if (!ok) return;
    }
    const alive = S.players.filter(q => q.alive);
    const total = alive.reduce((s, q) => s + q.cash, 0);
    const avg = Math.round(total / alive.length);
    alive.forEach(q => { q.cash = avg; });
    used = true;
    log(`⚖️ <b>${p.name}</b> 使用均富卡，所有人现金变成 ${fmt(avg)}`);
    sfx.coin(); updateUI();
  }

  else if (id === 'buycard') {
    const cand = allPropsOfOthers(p);
    if (!cand.length) { if (!ai) toast('没有可以买的地产'); return; }
    let t;
    if (ai) t = pick(cand);
    else {
      const v = await chooseRows('购地卡', '按 1.5 倍投资额强买一块地', cand.map(x => ({
        icon: LV_ICON[x.level] || '🏞️',
        name: x.name,
        sub: `${S.players[x.owner].name} · ${LV_NAME[x.level]}`,
        val: x.i, right: fmt(Math.round(invested(x) * 1.5))
      })), '取消');
      if (v == null) return;
      t = S.tiles[v];
    }
    const price = Math.round(invested(t) * 1.5);
    if (p.cash < price) { if (!ai) toast(`需要 ${fmt(price)}，现金不够`); return; }
    const from = S.players[t.owner];
    p.cash -= price; from.cash += price;
    from.props = from.props.filter(i => i !== t.i);
    t.owner = p.id; p.props.push(t.i);
    used = true;
    log(`🏷️ <b>${p.name}</b> 用 ${fmt(price)} 从 ${from.name} 手里买下「${t.name}」`);
    sfx.buy(); refreshTile(t.i); updateUI();
  }

  else if (id === 'wreck') {
    const cand = allPropsOfOthers(p).filter(t => t.level > 0);
    if (!cand.length) { if (!ai) toast('对手没有可拆的建筑'); return; }
    let t;
    if (ai) t = pick(cand);
    else {
      const v = await chooseRows('拆迁卡', '把对手一栋楼拆回空地', cand.map(x => ({
        icon: LV_ICON[x.level], name: x.name, sub: `${S.players[x.owner].name} · ${LV_NAME[x.level]}`, val: x.i
      })), '取消');
      if (v == null) return;
      t = S.tiles[v];
    }
    t.level = 0; used = true;
    log(`🔨 <b>${p.name}</b> 把「${t.name}」拆成了空地`);
    refreshTile(t.i); updateUI();
  }

  else if (id === 'free') {
    p.freePass = true; used = true;
    log(`🎫 <b>${p.name}</b> 准备好了免费卡，下次租金全免`);
  }

  else if (id === 'swap') {
    if (!p.props.length) { if (!ai) toast('你还没有地产'); return; }
    const cand = allPropsOfOthers(p);
    if (!cand.length) { if (!ai) toast('对手没有地产'); return; }
    let mineIdx, theirs;
    if (ai) { mineIdx = pick(p.props); theirs = pick(cand); }
    else {
      const v1 = await chooseRows('换地卡 · 第一步', '选一块自己的地送出去', p.props.map(i => ({
        icon: LV_ICON[S.tiles[i].level] || '🏞️', name: S.tiles[i].name,
        sub: `${LV_NAME[S.tiles[i].level]} · 值 ${fmt(invested(S.tiles[i]))}`, val: i
      })), '取消');
      if (v1 == null) return;
      const v2 = await chooseRows('换地卡 · 第二步', '想换对手哪一块地？', cand.map(x => ({
        icon: LV_ICON[x.level] || '🏞️', name: x.name,
        sub: `${S.players[x.owner].name} · ${LV_NAME[x.level]} · 值 ${fmt(invested(x))}`, val: x.i
      })), '取消');
      if (v2 == null) return;
      mineIdx = v1; theirs = S.tiles[v2];
    }
    const a = S.tiles[mineIdx], b = theirs;
    const oa = S.players[a.owner], ob = S.players[b.owner];
    oa.props = oa.props.filter(i => i !== a.i);
    ob.props = ob.props.filter(i => i !== b.i);
    a.owner = ob.id; ob.props.push(a.i);
    b.owner = oa.id; oa.props.push(b.i);
    used = true;
    log(`🔄 <b>${p.name}</b> 用「${a.name}」换走了「${b.name}」`);
    refreshTile(a.i); refreshTile(b.i); updateUI();
  }

  else if (id === 'reverse') {
    p.dir *= -1;
    used = true;
    log(`↩️ <b>${p.name}</b> 调头，开始${p.dir > 0 ? '顺时针' : '逆时针'}前进`);
  }

  else if (id === 'turtle') {
    const cand = S.players.filter(q => q.alive && q !== p);
    if (!cand.length) return;
    let q;
    if (ai) q = pick(cand);
    else {
      const v = await chooseRows('乌龟卡', '让谁变成乌龟？2 回合只能走 1-2 步', cand.map(x => ({
        icon: '🐢', name: x.name, sub: `现金 ${fmt(x.cash)}`, val: x.id
      })), '取消');
      if (v == null) return;
      q = S.players[v];
    }
    q.turtle = 2; used = true;
    log(`🐢 <b>${p.name}</b> 把 ${q.name} 变成了乌龟（2 回合）`);
  }

  else if (id === 'angel') {
    p.angel = 3; used = true;
    log(`😇 <b>${p.name}</b> 获得天使保护（3 回合免租）`);
  }

  if (used) {
    p.items[id]--;
    updateUI();
    if (!ai && it) toast(`使用了「${it.name}」`);
  }
}

/* ---------------- AI 用道具 ---------------- */
async function aiUseItem(p) {
  const owned = ITEMS.filter(it => (p.items[it.id] || 0) > 0).map(it => it.id);
  if (!owned.length) return;
  if (Math.random() > 0.5) return;
  await useItem(p, pick(owned), true);
  await sleep(200);
}

/* =====================================================================
   神仙
   ===================================================================== */
function attachGod(p, id) {
  if (p.god === id) { p.godLeft = GOD_TURNS; toast(`${GODS[id].name}继续跟着 ${p.name}`); return; }
  if (p.god) log(`✨ ${GODS[p.god].name} 离开了 <b>${p.name}</b>`);
  p.god = id; p.godLeft = GOD_TURNS;
  log(`${GODS[id].icon} <b>${GODS[id].name}</b> 附身 <b>${p.name}</b>（${GOD_TURNS} 回合）：${GODS[id].desc}`);
  toast(`${p.name} 被${GODS[id].name}附身`);
  sfx.coin();
  updateUI();
}

async function godTick(p) {
  if (!p.god) return;
  if (p.god === 'qiong') {
    const loss = Math.max(300, Math.round(p.cash * 0.05));
    await payMoney(p, loss);
    log(`👺 穷神让 <b>${p.name}</b> 又赔了 ${fmt(loss)}`);
  }
  p.godLeft--;
  if (p.godLeft <= 0) {
    log(`✨ ${GODS[p.god].icon} ${GODS[p.god].name} 离开了 ${p.name}`);
    p.god = null;
    updateUI();
  }
}

/* =====================================================================
   股票 / 银行
   ===================================================================== */
function stockTick() {
  S.stocks.forEach(s => {
    const drift = (Math.random() - 0.46) * 0.15;
    s.price = Math.max(8, Math.round(s.price * (1 + drift)));
    s.hist.push(s.price);
    if (s.hist.length > 14) s.hist.shift();
  });
}
function buyStock(p, id, qty) {
  const s = S.stocks.find(x => x.id === id);
  const cost = s.price * qty;
  if (p.cash < cost) return false;
  p.cash -= cost;
  p.stocks[id] = (p.stocks[id] || 0) + qty;
  p.stockCost[id] = (p.stockCost[id] || 0) + cost;
  updateUI();
  return true;
}
function sellStock(p, id, qty) {
  const s = S.stocks.find(x => x.id === id);
  const held = p.stocks[id] || 0;
  if (held < qty) return false;
  const gained = s.price * qty;
  const avg = (p.stockCost[id] || 0) / held;
  p.stocks[id] = held - qty;
  p.stockCost[id] = Math.max(0, (p.stockCost[id] || 0) - avg * qty);
  p.cash += gained;
  updateUI();
  return true;
}
async function bankDialog(p) {
  const v = await modal({
    icon: '🏦', title: '银行',
    html: `<p>存款每回合利息 <b>${Math.round(INTEREST * 100 * (p.charId === 'qian' ? 2 : 1))}%</b>，均富卡和查税都动不了存款。</p>
      <table class="prop-table">
        <tr><td>现金</td><td>${fmt(p.cash)}</td></tr>
        <tr><td>存款</td><td>${fmt(p.savings)}</td></tr>
      </table>`,
    actions: [
      {label: '存 $5,000', v: 'd5'}, {label: '存全部', v: 'dall'},
      {label: '取 $5,000', v: 'w5'}, {label: '取全部', v: 'wall'},
      {label: '离开', v: 0, cls: 'ghost'}
    ]
  });
  if (v === 'd5') { const a = Math.min(5000, p.cash); p.cash -= a; p.savings += a; toast(`存入 ${fmt(a)}`); }
  else if (v === 'dall') { p.savings += p.cash; toast(`存入 ${fmt(p.cash)}`); p.cash = 0; }
  else if (v === 'w5') { const a = Math.min(5000, p.savings); p.savings -= a; p.cash += a; toast(`取出 ${fmt(a)}`); }
  else if (v === 'wall') { p.cash += p.savings; toast(`取出 ${fmt(p.savings)}`); p.savings = 0; }
  updateUI();
}

/* =====================================================================
   回合与移动
   ===================================================================== */
function passGo(p, silent) {
  let amt = PASS_GO;
  if (p.god === 'cai') amt *= 2;
  if (p.charId === 'tu') amt += 300;
  if (p.charId === 'qian') amt += 500;
  amt = Math.round(amt);
  p.cash += amt;
  p.pts += PASS_GO_PTS;
  log(`🏁 <b>${p.name}</b> 经过起点，领取 ${fmt(amt)} + ${PASS_GO_PTS} 点数`);
  if (!silent) { floatMoney(p, '+' + fmt(amt), '#ffe08a'); sfx.coin(); }
  updatePlayersOnly();
}

async function moveSteps(p, steps, dir = 1) {
  let hit = false;
  for (let i = 0; i < steps; i++) {
    p.pos = (p.pos + dir + N) % N;
    if (dir > 0 && p.pos === 0) passGo(p);
    renderPawns();
    sfx.step();
    if (p._el) {
      p._el.classList.add('moving');
      setTimeout(() => p._el && p._el.classList.remove('moving'), 130);
    }
    await sleep(110);
    const t = S.tiles[p.pos];
    if (t.block != null) {
      t.block = null; refreshTile(p.pos);
      log(`🚧 <b>${p.name}</b> 被路障拦在「${t.name}」`);
      toast('被路障拦住了！');
      sfx.bad();
      hit = true;
      break;
    }
    if (t.mine != null) {
      const ownerId = t.mine;
      t.mine = null; refreshTile(p.pos);
      const fine = p.charId === 'nin' ? 750 : 1500;
      const turns = p.charId === 'nin' ? 2 : 3;
      log(`💣 <b>${p.name}</b> 踩到地雷！住院 ${turns} 回合，赔偿 ${fmt(fine)}`);
      sfx.bad(); toast('踩到地雷了！');
      if (ownerId != null && S.players[ownerId]) await payMoney(p, fine, ownerId);
      else await payMoney(p, fine);
      p.hosp = turns;
      hit = true;
      break;
    }
  }
  renderPawns();
  return hit;
}

async function rollAndMove(p) {
  S.busy = true; updateUI();
  if (S.skipRoll) { S.skipRoll = false; S.busy = false; return; }
  let total;
  if (p.remote != null) {
    total = p.remote; p.remote = null;
    const a = Math.max(1, Math.floor(total / 2)), b = total - a;
    await animateDice(a, b);
  } else {
    const a = 1 + rnd(6), b = 1 + rnd(6);
    await animateDice(a, b);
    total = a + b;
  }
  if (p.turtle > 0) {
    total = 1 + rnd(2);
    log(`🐢 <b>${p.name}</b> 被乌龟卡拖住，只走 ${total} 步`);
  } else {
    if (p.god === 'fu') total += 2;
    if (p.god === 'shuai') total = Math.max(1, total - 1);
  }
  log(`🎲 <b>${p.name}</b> 掷出 <b style="color:#ffd76a">${total}</b> 点`);
  await sleep(180);
  const hit = await moveSteps(p, total, p.dir);
  if (!hit) await resolveTile(p);
  if (p.turtle > 0) { p.turtle--; if (p.turtle <= 0) log(`🐢 ${p.name} 恢复了正常速度`); }
  if (p.angel > 0) p.angel--;
  if (!S.over) checkEnd();
  S.busy = false;
  updateUI();
}

/* =====================================================================
   落地事件
   ===================================================================== */
async function resolveTile(p, depth = 0) {
  const t = S.tiles[p.pos];
  await sleep(150);

  if (isProp(t)) {
    if (t.owner == null) await tryBuy(p, t);
    else if (t.owner === p.id) await tryUpgrade(p, t);
    else await payRent(p, t);
    return;
  }

  switch (t.type) {
    case 'start':
      gain(p, 500); p.pts += 100;
      log(`🏁 <b>${p.name}</b> 停在起点，额外奖励 $500 + 100 点数`);
      break;
    case 'tax': {
      const tax = Math.max(900, Math.round(p.cash * 0.1));
      log(`🧾 <b>${p.name}</b> 缴纳所得税 ${fmt(tax)}（进入停车奖池）`);
      const ok = await payMoney(p, tax);
      if (ok) { S.pot += tax; renderPark(); }
      break;
    }
    case 'park': {
      if (S.pot > 0) {
        const pot = S.pot; S.pot = 0;
        gain(p, pot);
        log(`🅿️ <b>${p.name}</b> 领走停车奖池 ${fmt(pot)}！`);
        if (!p.ai) await modal({icon: '🅿️', title: '免费停车', html: `<p>奖池里的 <b>${fmt(pot)}</b> 全归你了。</p>`, actions: [{label: '太棒了', v: 1}]});
      } else {
        log(`🅿️ <b>${p.name}</b> 免费停车，休息一下`);
      }
      renderPark();
      break;
    }
    case 'jail':
      log(`🚔 <b>${p.name}</b> 路过监狱，探个监`);
      break;
    case 'hospital':
      log(`🏥 <b>${p.name}</b> 路过医院，探望病号`);
      break;
    case 'store': await visitStore(p); break;
    case 'stock':
      if (p.ai) await aiStock(p); else await stockDialog(p);
      break;
    case 'bank':
      if (p.ai) await aiBank(p); else await bankDialog(p);
      break;
    case 'news': await doNews(p); break;
    case 'temple': await visitTemple(p); break;
    case 'chance':
    case 'fate':
      if (depth < 2) await drawCard(p, t.type);
      break;
  }
  updateUI();
}

async function sendJail(p, turns = 2) {
  const t = p.charId === 'nin' ? Math.max(1, turns - 1) : turns;
  p.pos = 12;
  p.jail = t;
  renderPawns();
  sfx.bad();
  log(`🚔 <b>${p.name}</b> 被送进监狱，停 ${t} 回合${p.charId === 'nin' ? '（忍术减 1 回合）' : ''}`);
  toast(`${p.name} 进监狱 ${t} 回合`);
  updateUI();
  await sleep(260);
}
async function sendHospital(p, turns = 3) {
  const t = p.charId === 'nin' ? Math.max(1, turns - 1) : turns;
  p.hosp = t;
  sfx.bad();
  log(`🏥 <b>${p.name}</b> 住院 ${t} 回合${p.charId === 'nin' ? '（忍术减 1 回合）' : ''}`);
  toast(`${p.name} 住院 ${t} 回合`);
  updateUI();
  await sleep(260);
}

async function payRent(p, t) {  const owner = S.players[t.owner];
  let rent = rentOf(t);
  const notes = [];
  if (p.god === 'angel' || p.angel > 0) { rent = 0; notes.push('天使护体'); }
  else if (p.freePass) { p.freePass = false; rent = 0; notes.push('免费卡生效'); }
  else {
    if (p.charId === 'sha') { rent = Math.round(rent * 0.8); notes.push('谈判 -20%'); }
    if (p.god === 'qiong') { rent = Math.round(rent * 2); notes.push('穷神 ×2'); }
  }
  if (rent <= 0) {
    log(`🛡️ <b>${p.name}</b> 踩到「${t.name}」，${notes.join('、')}，一分钱没付`);
    toast('免租金！');
    return;
  }
  log(`🏠 <b>${p.name}</b> 踩到 <b style="color:${owner.color}">${owner.name}</b> 的「${t.name}」${LV_ICON[t.level]}，付租金 <b>${fmt(rent)}</b>${notes.length ? '（' + notes.join('、') + '）' : ''}`);
  sfx.pay();
  if (p.ai && rent > p.cash * 0.8) await sleep(300);
  await payMoney(p, rent, owner.id);
}

async function tryBuy(p, t) {
  const cost = buyCost(p, t);
  if (p.cash < cost) {
    if (!p.ai) toast(`钱不够：${t.name} 要 ${fmt(cost)}`);
    return;
  }
  if (p.ai) {
    if (aiWantsBuy(p, t)) { buy(p, t); await sleep(300); }
    return;
  }
  const groupTiles = S.tiles.filter(x => isProp(x) && x.group === t.group);
  const mine = groupTiles.filter(x => x.owner === p.id).length;
  const ok = await modal({
    icon: '🏙️', title: `买下「${t.name}」？`,
    html: `<p>${GROUPS[t.group].name}地块 ${mine + 1}/${groupTiles.length}，集齐同色整组租金 <b>翻倍</b>。</p>
      ${propTableHTML(t, p)}`,
    actions: [{label: `买下 ${fmt(cost)}`, v: 1}, {label: '放弃', v: 0, cls: 'ghost'}]
  });
  if (ok) buy(p, t);
}

function buy(p, t) {
  const cost = buyCost(p, t);
  p.cash -= cost;
  t.owner = p.id;
  p.props.push(t.i);
  log(`🏙️ <b>${p.name}</b> 买下「${t.name}」${fmt(cost)}`);
  if (p._el) floatMoney(p, '-' + fmt(cost), '#ffd08a');
  sfx.buy();
  refreshTile(t.i);
  updateUI();
}

async function tryUpgrade(p, t) {
  if (t.level >= MAX_LV) { if (!p.ai) toast('已经是摩天楼啦'); return; }
  if (p.god === 'tudi') {
    upgrade(p, t, true);
    log(`⛩️ 土地公显灵，免费升级`);
    await sleep(300);
    return;
  }
  const cost = upgCost(t);
  if (p.cash < cost) { if (!p.ai) toast(`升级需要 ${fmt(cost)}`); return; }
  if (p.ai) {
    const reserve = 3000 + p.props.length * 400;
    if (p.cash - cost > reserve && Math.random() < 0.9) { upgrade(p, t); await sleep(280); }
    return;
  }
  const before = rentOf(t);
  const after = Math.round(t.price * RENT[t.level + 1] * (ownsGroup(p.id, t.group) ? 2 : 1) * (S.rentMod || 1));
  const ok = await modal({
    icon: '🏗️', title: `升级「${t.name}」？`,
    html: `<p>${LV_NAME[t.level]} → <b>${LV_NAME[t.level + 1]}</b>，租金从 ${fmt(before)} 涨到 <b>${fmt(after)}</b>。</p>
      ${propTableHTML(t, p)}`,
    actions: [{label: `升级 ${fmt(cost)}`, v: 1}, {label: '先不升', v: 0, cls: 'ghost'}]
  });
  if (ok) upgrade(p, t);
}

function upgrade(p, t, free) {
  const cost = free ? 0 : upgCost(t);
  p.cash -= cost;
  t.level++;
  log(`🏗️ <b>${p.name}</b> 把「${t.name}」升级为 <b>${LV_NAME[t.level]}</b>${cost ? `（-${fmt(cost)}）` : '（免费）'}`);
  if (!free && p._el) floatMoney(p, '-' + fmt(cost), '#ffd08a');
  sfx.upg();
  refreshTile(t.i);
  updateUI();
}

/* ---------------- 道具店 ---------------- */
async function visitStore(p) {
  if (p.ai) { await aiStore(p); return; }
  for (let guard = 0; guard < 8; guard++) {
    const rows = ITEMS.map(it => ({
      icon: it.icon, name: it.name, sub: it.desc + `（持有 ${p.items[it.id] || 0}）`,
      val: it.id, right: `💎 ${it.cost}`, disabled: p.pts < it.cost
    }));
    const v = await chooseRows(`道具店 · 你有 💎 ${p.pts} 点数`, '点数靠经过起点和事件获得，道具是翻盘关键', rows, '离开商店');
    if (v == null) return;
    const it = ITEM_MAP[v];
    if (p.pts < it.cost) { toast('点数不够'); continue; }
    p.pts -= it.cost;
    addItem(p, v, 1);
    log(`🛒 <b>${p.name}</b> 花 ${it.cost} 点数买了「${it.name}」`);
    sfx.buy();
    updateUI();
  }
}
async function aiStore(p) {
  let guard = 0;
  while (p.pts >= 80 && guard++ < 4) {
    const affordable = ITEMS.filter(it => it.cost <= p.pts);
    if (!affordable.length) break;
    const it = pick(affordable);
    p.pts -= it.cost;
    addItem(p, it.id, 1);
    log(`🛒 <b>${p.name}</b> 花 ${it.cost} 点数买了「${it.name}」`);
    await sleep(180);
  }
}

/* ---------------- 股票 ---------------- */
async function aiStock(p) {
  if (p.cash > 12000 && Math.random() < 0.75) {
    const cheap = [...S.stocks].sort((a, b) => a.price - b.price)[0];
    const qty = Math.min(300, Math.floor((p.cash * 0.25) / cheap.price / 100) * 100) || 100;
    if (buyStock(p, cheap.id, qty)) log(`📈 <b>${p.name}</b> 买入 ${cheap.name}股 ${qty} 股`);
  } else {
    for (const s of S.stocks) {
      const held = p.stocks[s.id] || 0;
      if (held > 0) {
        const avg = (p.stockCost[s.id] || 0) / held;
        if (s.price > avg * 1.15 && sellStock(p, s.id, held)) log(`📉 <b>${p.name}</b> 卖掉 ${s.name}股获利`);
      }
    }
  }
  await sleep(240);
}
async function aiBank(p) {
  if (p.cash > 14000) { const a = p.cash - 8000; p.cash -= a; p.savings += a; log(`🏦 <b>${p.name}</b> 存了 ${fmt(a)} 进银行`); }
  else if (p.cash < 3000 && p.savings > 0) { const a = Math.min(p.savings, 6000); p.savings -= a; p.cash += a; log(`🏦 <b>${p.name}</b> 从银行取出 ${fmt(a)}`); }
  await sleep(220);
}

/* ---------------- 土地庙 ---------------- */
async function visitTemple(p) {
  if (p.ai) {
    if (p.pts >= 60 && Math.random() < 0.75) {
      p.pts -= 60;
      attachGod(p, pick(['cai', 'tudi', 'fu', 'angel']));
    }
    await sleep(200);
    return;
  }
  const v = await modal({
    icon: '⛩️', title: '土地庙',
    html: `<p>花 <b>60 点数</b> 求一位吉神附身（随机，持续 ${GOD_TURNS} 回合）。<br>你现在有 <b>${p.pts}</b> 点数。</p>`,
    actions: [{label: '上香祈福', v: 1}, {label: '下次吧', v: 0, cls: 'ghost'}]
  });
  if (v) {
    if (p.pts < 60) { toast('点数不够'); return; }
    p.pts -= 60;
    attachGod(p, pick(['cai', 'tudi', 'fu', 'angel']));
    updateUI();
  }
}

/* ---------------- 新闻 ---------------- */
async function doNews(p) {
  const n = pick(NEWS);
  let extra = null;
  try { extra = n.fn ? n.fn() : null; } catch (e) {}
  S.news = `${n.title}：${n.text}`;
  log(`📰 <b>新闻</b> ${n.title} —— ${n.text}${extra ? '（' + extra + '）' : ''}`);
  if (!p.ai) {
    await modal({
      icon: '📰', title: '今日新闻 · ' + n.title,
      html: `<p>${n.text}${extra ? '<br><b>' + extra + '</b>' : ''}</p>`,
      actions: [{label: '知道了', v: 1}]
    });
  } else await sleep(380);
  updateUI();
}

/* ---------------- 卡片 ---------------- */
async function drawCard(p, kind) {
  const deck = kind === 'chance' ? CHANCE_CARDS : FATE_CARDS;
  let c = pick(deck);
  const lucky = (p.god === 'fu');
  const immune = (p.god === 'angel' || p.angel > 0);
  if (lucky && c.bad && Math.random() < 0.5) c = pick(deck.filter(x => !x.bad));
  const blocked = immune && c.bad;
  sfx.card();
  if (!p.ai) {
    await modal({
      icon: c.icon, title: c.title,
      html: `<p>${c.text}</p>${blocked ? '<p style="color:#2f8a5e;font-weight:800;margin-top:6px">天使护体，这次免了！</p>' : ''}`,
      actions: [{label: '继续', v: 1}], kind
    });
  } else {
    toast(`${p.name} 抽到「${c.title}」`);
    await sleep(320);
  }
  log(`${kind === 'chance' ? '🎁' : '🔮'} <b>${p.name}</b> 抽到「${c.title}」${blocked ? '（被天使挡下）' : ''}`);
  if (!blocked) await c.fn(p);
  updateUI();
}

/* =====================================================================
   AI 决策
   ===================================================================== */
function aiWantsBuy(p, t) {
  const cost = buyCost(p, t);
  if (p.cash < cost) return false;
  const groupTiles = S.tiles.filter(x => isProp(x) && x.group === t.group);
  const mine = groupTiles.filter(x => x.owner === p.id).length;
  let reserve = 2600 + p.props.length * 260;
  if (mine > 0) reserve = 1200;                 // 能凑齐一组，咬牙也买
  if (p.props.length === 0) reserve = 600;
  return p.cash - cost > reserve;
}

/* =====================================================================
   回合流程
   ===================================================================== */
function startRound() {
  S.round++;
  stockTick();
  // 利息（用上一回合新闻的利率修正）
  S.players.forEach(p => {
    if (!p.alive || p.savings <= 0) return;
    const rate = INTEREST * (p.charId === 'qian' ? 2 : 1) * (S.interestMod || 1);
    const interest = Math.round(p.savings * rate);
    if (interest > 0) {
      p.savings += interest;
      log(`🏦 <b>${p.name}</b> 收到存款利息 ${fmt(interest)}`);
    }
  });
  S.rentMod = 1;
  S.interestMod = 1;
  log(`—— 第 ${Math.min(S.round, MAX_ROUNDS)} 回合 ——`);
  if (Math.random() < 0.22) {
    const cand = S.players.filter(p => p.alive && !p.god);
    if (cand.length) attachGod(pick(cand), pick(Object.keys(GODS)));
  }
  updateUI();
}

async function playTurn(p) {
  S.busy = true;
  if (S.turnCount >= S.turnCap) { S.stopped = true; S.busy = false; return; }
  S.turnCount++;
  updateUI();
  await godTick(p);

  if (p.jail > 0) {
    p.jail--;
    log(`🚔 <b>${p.name}</b> 在监狱反省（还剩 ${p.jail} 回合）`);
    await sleep(500);
    S.busy = false; updateUI();
    return;
  }
  if (p.hosp > 0) {
    p.hosp--;
    log(`🏥 <b>${p.name}</b> 住院观察（还剩 ${p.hosp} 回合）`);
    await sleep(500);
    S.busy = false; updateUI();
    return;
  }
  if (p.charId === 'wu' && Math.random() < 0.28) {
    const it = pick(ITEMS);
    addItem(p, it.id, 1);
    log(`🐱 <b>${p.name}</b> 顺手捡到「${it.name}」`);
  }

  if (p.ai) {
    await sleep(340);
    if (S.itemSpam) {
      ITEMS.forEach(it => { p.items[it.id] = 3; });
      for (let k = 0; k < 3; k++) await useItem(p, pick(ITEMS).id, true);
    }
    await aiUseItem(p);
  } else {
    S.awaitRoll = true;
    S.busy = false;
    updateUI();
    await new Promise(r => { S.rollResolve = r; });
    S.awaitRoll = false;
    S.rollResolve = null;
    S.busy = true;
    updateUI();
  }
  await rollAndMove(p);
  S.busy = false;
  updateUI();
}

function advanceTurn() {
  if (S.over) return;
  let guard = 0;
  do {
    S.cur = (S.cur + 1) % S.players.length;
    if (S.cur === 0) {
      startRound();
      if (S.round > MAX_ROUNDS) { endByAssets(); return; }
    }
    guard++;
  } while (!S.players[S.cur].alive && guard < 12);
  updateUI();
}

async function gameLoop() {
  while (!S.over && !S.stopped) {
    const p = S.players[S.cur];
    if (p.alive) await playTurn(p);
    if (S.over || S.stopped) break;
    advanceTurn();
    await sleep(90);
  }
}

/* =====================================================================
   结束
   ===================================================================== */
function checkEnd() {
  const alive = S.players.filter(p => p.alive);
  if (alive.length <= 1) endGame(alive[0] || null);
}
function endGame(winner) {
  if (S.over) return;
  S.over = true;
  S.winner = winner;
  sfx.win();
  showResult('游戏结束', winner ? `<b>${winner.name}</b> 把对手全部熬破产了！` : '所有人都破产了…');
}
function endByAssets() {
  if (S.over) return;
  S.over = true;
  const sorted = [...S.players].filter(p => p.alive).sort((a, b) => totalAssets(b) - totalAssets(a));
  S.winner = sorted[0];
  showResult(`${MAX_ROUNDS} 回合结束`, `总资产最高的是 <b>${sorted[0].name}</b>！`);
}

/* =====================================================================
   开局
   ===================================================================== */
function startGame(count, myCharId, allAI) {
  S = {
    players: [],
    tiles: TILES.map((t, i) => ({...t, i, owner: null, level: 0, block: null, mine: null})),
    stocks: STOCK_DEFS.map(s => ({...s, price: s.base, hist: [s.base, s.base]})),
    cur: 0, round: 1, pot: 0, over: false, busy: false, awaitRoll: false,
    turnCount: 0, turnCap: 9999, stopped: false, winner: null, rollResolve: null,
    skipRoll: false, rentMod: 1, interestMod: 1, news: '', me: 0, itemSpam: false
  };
  const order = allAI ? CHARS : [CHARS.find(c => c.id === myCharId) || CHARS[0], ...CHARS.filter(c => c.id !== myCharId)];
  for (let i = 0; i < count; i++) {
    const c = order[i];
    S.players.push({
      id: i, charId: c.id, name: c.name, color: c.color,
      cash: START_CASH, savings: 0, pts: 0, pos: 0, dir: 1, props: [],
      stocks: {tech: 0, land: 0, bank: 0, oil: 0}, stockCost: {tech: 0, land: 0, bank: 0, oil: 0},
      items: {}, jail: 0, hosp: 0, turtle: 0, angel: 0, god: null, godLeft: 0,
      freePass: false, remote: null, alive: true, ai: allAI ? true : i !== 0, _el: null
    });
  }
  S.me = allAI ? 0 : 0;
  $('log').innerHTML = '';
  buildCenterBadge();
  renderAllTiles();
  renderPawns();
  updateUI();
  log(`🎮 游戏开始！每人 ${fmt(START_CASH)}，${count} 位玩家，${MAX_ROUNDS} 回合`);
  toast('先买地、再盖楼，别忘了炒股和道具');
  S.loop = gameLoop();
}
