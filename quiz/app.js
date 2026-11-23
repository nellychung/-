/* 國中全科刷題網（打怪升級版）：科目 → 冊次 → 單元 */
const NEED = 2;               // 錯題觀念要連續答對幾題才算過關（BOSS 有幾顆心）
const L = 'ABCDEF';
let CAT = null, S = null;     // S = 目前這一場戰鬥
const CACHE = {};
const $ = id => document.getElementById(id);
const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuf = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = a => a[Math.floor(Math.random() * a.length)];

/* ---------- 本機紀錄（存在這台平板） ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem('qz:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('qz:' + k, JSON.stringify(v)); } catch (e) {} }
};
const subj = id => CAT.subjects.find(s => s.id === id);
const vol = (s, id) => s.vols.find(v => v.id === id);
const qKey = q => q._v + '/' + q._u + '#' + q.id;
const uKey = (v, u) => v + '/' + u;

/* ---------- 遊戲設定 ---------- */
const MAPS = {chinese: ['📜', '藏經閣'], english: ['🐫', '西域商道'], math: ['🧮', '機關迷陣'], nature: ['🌿', '百草谷'], social: ['🏯', '江湖九州'], health: ['🥋', '少林演武場']};
const miniSVG = c => `<span style="display:block;width:100%;height:100%;filter:hue-rotate(${c.tint}deg)">${monSVG(c.mid)}</span>`;
const TITLES = [[1, '江湖新手'], [3, '初出茅廬'], [5, '少年俠客'], [8, '名門弟子'], [12, '一派高手'], [16, '武林名宿'], [20, '一代宗師'], [30, '武林盟主']];
const P0 = {xp: 0, avatar: 'qingyi', name: '', kills: 0, bosses: 0, best: 0, right: 0, sound: true};
const player = () => { const p = Object.assign({}, P0, store.get('player', {})); if (!CHARS[p.avatar]) p.avatar = 'qingyi'; return p; };
const avatar = (p, opt = {}) => charSVG(p.avatar, Object.assign({aura: tierAura(lvInfo(p.xp).lv)}, opt));
const savePlayer = p => store.set('player', p);
function lvInfo(xp) { let lv = 1, need = 100; while (xp >= need) { xp -= need; lv++; need = 100 + 50 * (lv - 1); } return {lv, cur: xp, need}; }
const title = lv => TITLES.filter(t => lv >= t[0]).pop()[1];
const xpFor = q => ({'易': 10, '中': 15, '難': 20}[q.d] || 12);

/* ---------- 音效（WebAudio 小音效，可關） ---------- */
let AC = null;
function beep(notes, type = 'square', vol = .06) {
  if (!player().sound) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    let t = AC.currentTime;
    notes.forEach(([f, d]) => { const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.0001, t + d); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d); t += d * .8; });
  } catch (e) {}
}
const SFX = {
  hit: () => beep([[660, .08], [990, .12]]),
  crit: () => beep([[660, .06], [880, .06], [1320, .16]]),
  miss: () => beep([[200, .18], [140, .22]], 'sawtooth', .05),
  win: () => beep([[523, .12], [659, .12], [784, .12], [1047, .3]]),
  lvup: () => beep([[392, .1], [523, .1], [659, .1], [784, .1], [1047, .35]], 'triangle', .08),
  kill: () => beep([[880, .08], [660, .08], [1100, .2]], 'triangle', .08)
};

/* ---------- 特效 ---------- */
function floatText(txt, cls, anchor) {
  const a = anchor || $('mon'); if (!a) return;
  const r = a.getBoundingClientRect(), d = document.createElement('div');
  d.className = 'float ' + (cls || ''); d.textContent = txt;
  d.style.left = (r.left + r.width / 2 + (Math.random() * 40 - 20)) + 'px'; d.style.top = (r.top + window.scrollY + 10) + 'px';
  document.body.appendChild(d); setTimeout(() => d.remove(), 1100);
}
function shake(id, cls) { const e = $(id); if (!e) return; e.classList.remove(cls); void e.offsetWidth; e.classList.add(cls); }
function confetti() {
  const box = document.createElement('div'); box.className = 'confetti';
  box.innerHTML = Array.from({length: 40}, () => `<i style="left:${Math.random() * 100}%;animation-delay:${Math.random() * .6}s;background:${pick(['#fbbf24', '#22c55e', '#38bdf8', '#f472b6', '#a78bfa'])}"></i>`).join('');
  document.body.appendChild(box); setTimeout(() => box.remove(), 2600);
}
function gainXP(n, why) {
  const p = player(), before = lvInfo(p.xp).lv;
  p.xp += n; savePlayer(p);
  const now = lvInfo(p.xp);
  if (S) S.xp += n;
  hud();
  if (now.lv > before) setTimeout(() => levelUp(now.lv), 500);
  return n;
}
function levelUp(lv) {
  SFX.lvup(); confetti();
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="mbox lvbox"><div class="lvchar">${avatar(player())}</div><div class="lvtag">LEVEL UP!</div><div class="lvbig">Lv ${lv}</div>
    <div class="lvtitle">稱號：${title(lv)}</div><button class="btn gold" onclick="this.closest('.modal').remove()">繼續冒險 ▶</button></div>`;
  document.body.appendChild(m);
}

/* ---------- 上方 HUD（等級、經驗值、音效） ---------- */
function hud() {
  const p = player(), i = lvInfo(p.xp);
  $('hud').innerHTML = `<span class="hav">${avatar(p, {head: true})}</span><span class="hlv">Lv ${i.lv}</span>
    <span class="hxp"><i style="width:${i.cur / i.need * 100}%"></i><em>${i.cur} / ${i.need} XP</em></span>
    <button class="hsnd" onclick="toggleSound()" title="音效">${p.sound ? '🔊' : '🔇'}</button>`;
}
function toggleSound() { const p = player(); p.sound = !p.sound; savePlayer(p); hud(); }

async function loadUnit(sid, vid, uid) {
  const k = sid + '/' + vid + '/' + uid;
  if (!CACHE[k]) CACHE[k] = fetch('data/' + k + '.json', {cache: 'no-cache'}).then(r => { if (!r.ok) throw 0; return r.json(); })
    .then(a => a.map(q => Object.assign(q, {_s: sid, _v: vid, _u: uid, _img: q.img ? 'data/' + sid + '/' + vid + '/' + q.img : ''})))
    .catch(() => { delete CACHE[k]; return []; });
  return CACHE[k];
}

/* ---------- 路由 ---------- */
fetch('data/catalog.json', {cache: 'no-cache'}).then(r => r.json()).then(c => { CAT = c; hud(); route(); })
  .catch(() => $('app').innerHTML = '<div class="panel">題庫目錄載入失敗，請檢查網路後重新整理。</div>');
window.addEventListener('hashchange', () => {
  if (S && S.active && !confirm('要逃離這場戰鬥嗎？（已作答的紀錄和經驗值會保留）')) { history.pushState(null, '', S.hash); return; }
  S = null; route();
});
function route() {
  const p = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  if (p[0] === 's' && subj(p[1])) return subjectPage(p[1]);
  home();
}
function crumb(h) { $('crumb').innerHTML = h || ''; }

/* ---------- 首頁：角色卡＋選地圖 ---------- */
function home() {
  crumb('');
  const p = player(), i = lvInfo(p.xp);
  const tot = s => s.vols.reduce((n, v) => n + v.units.reduce((m, u) => m + (u.count || 0), 0), 0);
  $('app').innerHTML = `
  <div class="panel hero">
    <button class="ava" onclick="pickAvatar()" title="換角色">${avatar(p)}<small>${CHARS[p.avatar].name}・換角色</small></button>
    <div class="hinfo">
      <input class="pname" id="pname" maxlength="10" placeholder="輸入俠客名號" value="${esc(p.name)}">
      <div class="ptitle">Lv ${i.lv}・${title(i.lv)}</div>
      <div class="xpbar big"><i style="width:${i.cur / i.need * 100}%"></i><em>${i.cur} / ${i.need} XP　距離升級還差 ${i.need - i.cur}</em></div>
      <div class="stats"><span>⚔️ 擊敗怪物 <b>${p.kills}</b></span><span>🐲 打倒 BOSS <b>${p.bosses}</b></span><span>🔥 最高連擊 <b>${p.best}</b></span><span>✅ 累積答對 <b>${p.right}</b></span></div>
    </div>
  </div>
  <div class="lbl">🗺️ 選擇闖蕩之地</div>
  <div class="grid">
    ${CAT.subjects.map(s => { const n = tot(s), m = MAPS[s.id] || ['📘', s.name]; return `<a class="map ${n ? 'has' : 'lock'}" href="#/s/${s.id}">
      <span class="mi">${m[0]}</span><b>${esc(s.name)}</b><small>${m[1]}・${n ? n + ' 隻怪物' : '🔒 尚未開放'}</small></a>`; }).join('')}
  </div>
  <p class="note">冒險紀錄存在這台平板的瀏覽器裡；換平板或清除瀏覽資料會重新開始。</p>`;
  $('pname').onchange = e => { const q = player(); q.name = e.target.value.trim(); savePlayer(q); };
  scrollTo(0, 0);
}
function pickAvatar() {
  const m = document.createElement('div'); m.className = 'modal';
  m.innerHTML = `<div class="mbox"><div class="lvtag">選擇你的俠客</div><div class="avs">${CHAR_IDS.map(a => `<button onclick="setAvatar('${a}',this)" class="${player().avatar === a ? 'on' : ''}">${charSVG(a, {aura: tierAura(lvInfo(player().xp).lv)})}<b>${CHARS[a].name}</b><small>${CHARS[a].cls}</small></button>`).join('')}</div></div>`;
  m.onclick = e => { if (e.target === m) m.remove(); };
  document.body.appendChild(m);
}
function setAvatar(a, b) { const p = player(); p.avatar = a; savePlayer(p); b.closest('.modal').remove(); hud(); home(); }

/* ---------- 科目頁：冊次（可複選）＋單元（關卡） ---------- */
function stars(st, count) {
  if (!st || !st.n) return '<span class="stars dim">☆☆☆</span>';
  const r = st.c / st.n, cov = (st.seen || 0) / count;
  const n = (r >= .6 ? 1 : 0) + (r >= .8 ? 1 : 0) + (r >= .9 && cov >= .5 ? 1 : 0);
  return `<span class="stars">${'★'.repeat(n)}<span class="dim">${'☆'.repeat(3 - n)}</span></span>`;
}
function subjectPage(sid) {
  const s = subj(sid), m = MAPS[sid] || ['📘', s.name];
  crumb(`› ${m[0]} ${esc(s.name)}`);
  const sel = store.get(sid + ':sel', null) || {vols: [], units: [], n: 10};
  const avail = s.vols.filter(v => v.units.some(u => u.count));
  if (!sel.vols.length && avail.length) sel.vols = [avail[0].id];
  const stat = store.get(sid + ':stat', {});
  const wrong = Object.keys(store.get(sid + ':wrong', {}));
  const save = () => store.set(sid + ':sel', sel);

  function draw() {
    const vols = s.vols.filter(v => sel.vols.includes(v.id));
    const allOn = sel.vols.length === s.vols.length;
    const picked = vols.flatMap(v => v.units.filter(u => u.count && sel.units.includes(uKey(v.id, u.id))));
    const nq = picked.reduce((n, u) => n + u.count, 0);
    $('app').innerHTML = `
    <div class="panel">
      <div class="lbl" style="margin-top:0">📚 冊次 <label class="chk"><input type="checkbox" id="va" ${allOn ? 'checked' : ''}> 全選</label></div>
      <div class="chips">${s.vols.map(v => { const n = v.units.reduce((m, u) => m + (u.count || 0), 0);
        return `<button class="chip ${sel.vols.includes(v.id) ? 'on' : ''} ${n ? '' : 'lock'}" data-v="${v.id}">${esc(v.name)}<small>${[v.grade, n ? n + ' 題' : '🔒 準備中'].filter(Boolean).join('・')}</small></button>`; }).join('')}</div>
    </div>
    ${vols.length ? vols.map(v => volCard(v)).join('') : '<div class="panel empty">請先選擇冊次</div>'}
    <div class="dock"><div class="in">
      <span class="note">已選 ${picked.length} 關・${nq} 題</span><span class="sp"></span>
      <span class="seg">${[10, 20, 30].map(n => `<button data-n="${n}" class="${sel.n === n ? 'on' : ''}">${n} 題</button>`).join('')}</span>
      <button class="btn red" id="wb" ${wrong.length ? '' : 'disabled'}>🐲 錯題魔窟 ${wrong.length}</button>
      <button class="btn gold" id="go" ${picked.length ? '' : 'disabled'}>⚔️ 出發打怪</button>
    </div></div>`;

    $('va').onchange = e => { sel.vols = e.target.checked ? s.vols.map(v => v.id) : []; save(); draw(); };
    document.querySelectorAll('.chip').forEach(b => b.onclick = () => {
      const id = b.dataset.v; sel.vols = sel.vols.includes(id) ? sel.vols.filter(x => x !== id) : sel.vols.concat(id); save(); draw(); });
    document.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { sel.n = +b.dataset.n; save(); draw(); });
    document.querySelectorAll('.unit input').forEach(c => c.onchange = () => {
      const k = c.dataset.u; sel.units = c.checked ? sel.units.concat(k) : sel.units.filter(x => x !== k); save(); draw(); });
    document.querySelectorAll('.vall').forEach(c => c.onchange = () => {
      const v = vol(s, c.dataset.v), ks = v.units.filter(u => u.count).map(u => uKey(v.id, u.id));
      sel.units = sel.units.filter(x => !ks.includes(x)); if (c.checked) sel.units.push(...ks); save(); draw(); });
    $('go').onclick = () => startRound(s, vols.flatMap(v => v.units.filter(u => u.count && sel.units.includes(uKey(v.id, u.id))).map(u => [v, u])), sel.n);
    $('wb').onclick = () => startWrong(s, sel.n);
  }

  function volCard(v) {
    const us = v.units.filter(u => u.count);
    const meta = esc([v.grade, v.pub].filter(Boolean).join('・'));
    if (!us.length) return `<div class="panel vol"><h3>${esc(v.name)} <span class="note">${meta}</span></h3><div class="empty">🔒 這一冊的關卡還在準備中</div></div>`;
    const all = us.every(u => sel.units.includes(uKey(v.id, u.id)));
    let lastG = null;
    const rows = '<div class="ulist">' + v.units.map(u => {
      const k = uKey(v.id, u.id), st = stat[k], g = u.group && u.group !== lastG ? `<div class="grp">${esc(u.group)}</div>` : '';
      lastG = u.group || lastG;
      if (!u.count) return g + `<div class="unit off"><input type="checkbox" disabled><span class="nm">${esc(u.name)}</span><span class="meta">🔒 準備中</span></div>`;
      const done = st ? Math.min(st.seen || 0, u.count) : 0;
      return g + `<label class="unit"><input type="checkbox" data-u="${k}" ${sel.units.includes(k) ? 'checked' : ''}>
        <span class="nm">${esc(u.name)}</span>
        <span class="meta">${stars(st, u.count)}<br>${u.count} 題${st && st.n ? `・答對 ${Math.round(st.c / st.n * 100)}%` : ''}<div class="mbar"><i style="width:${done / u.count * 100}%"></i></div></span></label>`;
    }).join('') + '</div>';
    return `<div class="panel vol"><h3>${esc(v.name)} <span class="note">${meta}</span>
      <label class="chk" style="margin-left:auto"><input type="checkbox" class="vall" data-v="${v.id}" ${all ? 'checked' : ''}> 全選關卡</label></h3>${rows}</div>`;
  }
  draw(); scrollTo(0, 0);
}

/* ---------- 出題 ---------- */
async function startRound(s, pairs, n) {
  $('app').innerHTML = '<div class="panel">怪物出現中…</div>';
  const seen = new Set(store.get(s.id + ':seen', []));
  const banks = await Promise.all(pairs.map(([v, u]) => loadUnit(s.id, v.id, u.id)));
  const pools = banks.filter(b => b.length).map(b => shuf(b.filter(q => !seen.has(qKey(q)))).concat(shuf(b.filter(q => seen.has(qKey(q))))));
  if (!pools.length) { $('app').innerHTML = '<div class="panel">題庫載入失敗，請重新整理。</div>'; return; }
  const list = [], used = new Set(); let order = [];
  while (list.length < n && pools.some(p => p.length)) {
    if (!order.length) order = shuf(pools.map((_, i) => i));
    const q = pools[order.pop()].shift();
    if (q && !used.has(qKey(q))) { used.add(qKey(q)); list.push(q); }
  }
  begin(s, shuf(list), pairs, '打怪');
}
async function startWrong(s, n) {
  $('app').innerHTML = '<div class="panel">魔窟開啟中…</div>';
  const keys = Object.keys(store.get(s.id + ':wrong', {}));
  const units = [...new Set(keys.map(k => k.split('#')[0]))];
  const banks = await Promise.all(units.map(k => { const [v, u] = k.split('/'); return loadUnit(s.id, v, u); }));
  const ks = new Set(keys);
  const list = shuf(banks.flat().filter(q => ks.has(qKey(q)))).slice(0, n);
  if (!list.length) { subjectPage(s.id); return; }
  const pairs = units.map(k => { const [v, u] = k.split('/'); const V = vol(s, v); return [V, V && V.units.find(x => x.id === u)]; }).filter(p => p[0] && p[1]);
  begin(s, list, pairs, '錯題魔窟');
}
function begin(s, list, pairs, label) {
  const mid = pick(MON_IDS), hp = 10 * Math.max(1, Math.ceil(list.length * .7));
  S = {s, list, pairs, label, i: 0, score: 0, used: new Set(list.map(qKey)), seen: new Set(store.get(s.id + ':seen', [])),
       weak: {}, log: [], cur: null, ans: false, phase: 'round', active: true, hash: '#/s/' + s.id + '/play',
       mon: {id: mid, name: MON[mid].name, hp, max: hp, dead: false}, combo: 0, best: 0, xp: 0, kills: 0};
  if (location.hash === S.hash) history.replaceState(null, '', S.hash); else history.pushState(null, '', S.hash);
  next();
}
const uName = q => { const v = vol(S.s, q._v), u = v && v.units.find(x => x.id === q._u); return (v ? v.name + ' ' : '') + (u ? u.name : q._u); };
const tag = q => (q.k && q.k[0]) || '本單元觀念';
async function similar(c) {
  const bank = await loadUnit(S.s.id, c.v, c.u);
  const cand = bank.filter(q => (q.k ? q.k.includes(c.tag) : c.tag === '本單元觀念') && !S.used.has(qKey(q)));
  if (!cand.length) return null;
  const un = cand.filter(q => !S.seen.has(qKey(q)));
  return shuf(un.length ? un : cand)[0];
}
async function nextWeak() {
  const keys = Object.keys(S.weak).filter(k => S.weak[k].st === 'learn').sort((a, b) => S.weak[a].last - S.weak[b].last);
  for (const k of keys) { const q = await similar(S.weak[k]); if (q) { S.weak[k].last = Date.now(); return {q, k}; } S.weak[k].st = 'out'; }
  return null;
}
async function next() {
  S.ans = false;
  if (S.phase === 'round') {
    if (S.i >= S.list.length) {
      if (Object.keys(S.weak).length) return bossIntro();
      return summary();
    }
    S.cur = {q: S.list[S.i], k: null};
  } else {
    const n = await nextWeak(); if (!n) return summary();
    S.cur = n; S.used.add(qKey(n.q));
  }
  render();
}
function bossIntro() {
  S.phase = 'weak';
  crumb(`› <a href="#/s/${S.s.id}">${esc(S.s.name)}</a> › BOSS 戰`);
  const W = Object.values(S.weak);
  $('app').innerHTML = `<div class="panel bossin"><div class="bossbig">${monSVG(pick(['bossSnake', 'bossMaster']))}</div><div class="lvtag red">BOSS 戰！</div>
    <p>剛剛答錯的 <b>${W.length}</b> 個觀念變成了「觀念怪」！<br>每隻有 <b>${NEED}</b> 顆心，連續答對 ${NEED} 題同觀念的類似題才能打倒；答錯牠會回血。</p>
    <div class="minis">${W.map(c => `<span><i class="mini">${miniSVG(c)}</i><small>${esc(c.tag)}</small></span>`).join('')}</div>
    <button class="btn red" onclick="next()">⚔️ 開戰</button></div>`;
  SFX.miss(); scrollTo(0, 0);
}
function qHtml(q) {
  const pic = q._img ? `<img src="${esc(q._img)}" alt="題目附圖" loading="lazy">` : '';
  return q.img && !q.o ? pic : esc(q.s) + pic;
}
function arena() {
  const p = player();
  if (S.phase === 'round') {
    const m = S.mon, pct = m.hp / m.max * 100;
    return `<div class="arena">
      <div class="me"><span class="meav" id="meav">${avatar(p)}</span><div><b>${esc(p.name || CHARS[p.avatar].name)}</b><div class="note">${S.label} ${Math.min(S.i + 1, S.list.length)} / ${S.list.length}</div></div></div>
      <div class="combo ${S.combo >= 3 ? 'hot' : ''}">${S.combo >= 2 ? `🔥 ${S.combo} 連擊` : ''}</div>
      <div class="foe"><div class="finfo"><b>${m.dead ? '已擊敗！' : esc(m.name)}</b><div class="hp"><i style="width:${pct}%" class="${pct < 30 ? 'low' : ''}"></i><em>HP ${m.hp} / ${m.max}</em></div></div>
        <span class="mon ${m.dead ? 'dead' : ''}" id="mon">${m.dead ? boomSVG() : monSVG(m.id)}</span></div></div>`;
  }
  const W = Object.values(S.weak), c = S.weak[S.cur.k];
  return `<div class="arena boss">
    <div class="me"><span class="meav" id="meav">${avatar(p)}</span><div><b>BOSS 戰</b><div class="note">打倒 ${W.filter(x => x.st === 'ok').length} / ${W.length} 隻觀念怪</div></div></div>
    <div class="combo ${S.combo >= 3 ? 'hot' : ''}">${S.combo >= 2 ? `🔥 ${S.combo} 連擊` : ''}</div>
    <div class="foe"><div class="finfo"><b>觀念怪：${esc(c.tag)}</b><div class="hearts">${'❤️'.repeat(NEED - c.streak)}${'🖤'.repeat(c.streak)}</div></div>
      <span class="mon big" id="mon">${miniSVG(c)}</span></div></div>
    <div class="minis row">${W.map(x => `<span class="${x === c ? 'cur' : ''} ${x.st === 'ok' ? 'ko' : ''}">${x.st === 'ok' ? boomSVG() : miniSVG(x)}</span>`).join('')}</div>`;
}
function render() {
  const q = S.cur.q;
  crumb(`› <a href="#/s/${S.s.id}">${esc(S.s.name)}</a> › ${S.phase === 'round' ? S.label : 'BOSS 戰'}`);
  const nOpt = q.o ? q.o.length : (q.n || 4);
  $('app').innerHTML = `${arena()}<div class="qcard">
    <div class="bar"><span class="pill">${esc(uName(q))}</span>${q.k ? `<span class="pill">${esc(q.k.join('、'))}</span>` : ''}${q.d ? `<span class="pill d${esc(q.d)}">${esc(q.d)}・${xpFor(q)} XP</span>` : ''}</div>
    <div class="qgrid"><div class="qleft"><div class="stem">${qHtml(q)}</div>
    ${q.img && !q.o ? '<p class="note" style="margin:0">看圖作答，點選答案：</p>' : ''}</div>
    <div class="qright">${Array.from({length: nOpt}, (_, i) => `<button class="opt" id="o${i}" onclick="answer(${i})"><b>${L[i]}</b><span>${q.o ? esc(q.o[i]) : ''}</span></button>`).join('')}
    <div id="fb"></div></div></div></div>
    <div class="acts"><button class="btn ghost" onclick="quit()">🏳️ 結束戰鬥，看戰果</button></div>`;
  scrollTo(0, 0);
}
function record(q, ok) {
  const sid = S.s.id, k = qKey(q);
  S.seen.add(k); store.set(sid + ':seen', [...S.seen]);
  const st = store.get(sid + ':stat', {}), u = uKey(q._v, q._u);
  st[u] = st[u] || {n: 0, c: 0, seen: 0};
  st[u].n++; if (ok) st[u].c++;
  st[u].seen = [...S.seen].filter(x => x.startsWith(u + '#')).length;
  store.set(sid + ':stat', st);
  const w = store.get(sid + ':wrong', {});
  if (ok) delete w[k]; else w[k] = 1;
  store.set(sid + ':wrong', w);
  const p = player(); if (ok) p.right++; p.best = Math.max(p.best, S.combo); savePlayer(p);
}
function answer(i) {
  if (S.ans) return; S.ans = true;
  const q = S.cur.q, ok = i === q.a;
  document.querySelectorAll('.opt').forEach(b => b.disabled = true);
  $('o' + q.a).classList.add('ok'); if (!ok) $('o' + i).classList.add('no');
  if (ok) { S.combo++; S.best = Math.max(S.best, S.combo); } else S.combo = 0;
  record(q, ok);
  S.log.push({q, pick: i, ok, phase: S.phase});
  let msg = '', got = 0;
  const crit = ok && S.combo >= 3;
  if (ok) {
    got = gainXP(xpFor(q) + Math.min(S.combo, 5) * 2);
    (crit ? SFX.crit : SFX.hit)(); shake('mon', 'hit'); shake('meav', 'atk');
    floatText(crit ? `暴擊！-${15}` : '-10', crit ? 'crit' : 'dmg');
    setTimeout(() => floatText(`+${got} XP`, 'xp', $('meav')), 250);
  } else { SFX.miss(); shake('meav', 'hurt'); floatText('MISS', 'miss'); }

  if (S.phase === 'round') {
    if (ok) {
      S.score++;
      const m = S.mon;
      if (!m.dead) { m.hp = Math.max(0, m.hp - (crit ? 15 : 10));
        if (m.hp === 0) { m.dead = true; S.kills++; const p = player(); p.kills++; savePlayer(p);
          gainXP(50); setTimeout(() => { SFX.kill(); confetti(); floatText(`擊敗 ${m.name}！+50 XP`, 'xp big'); }, 350);
          msg = `<br>💥 你打倒了 ${esc(m.name)}！剩下的題目是「追擊」，繼續賺經驗值！`; } }
    } else { const k = q._v + '/' + q._u + '|' + tag(q);
      if (!S.weak[k]) S.weak[k] = {v: q._v, u: q._u, tag: tag(q), streak: 0, st: 'learn', last: 0, wrong: [], mid: MINI_IDS[Object.keys(S.weak).length % MINI_IDS.length], tint: MINI_TINT[Math.floor(Object.keys(S.weak).length / MINI_IDS.length) % MINI_TINT.length]};
      S.weak[k].wrong.push(q); msg = `<br>👹 這個觀念變成「觀念怪」了，等一下 BOSS 戰再打倒牠！`; }
    S.i++;
  } else {
    const c = S.weak[S.cur.k];
    if (ok) { c.streak++;
      if (c.streak >= NEED) { c.st = 'ok'; msg = `<br>🎉 觀念「${esc(c.tag)}」被你打倒了！+30 XP`;
        gainXP(30); setTimeout(() => { SFX.kill(); floatText('打倒！+30 XP', 'xp big'); }, 350); }
      else msg = `<br>再答對 ${NEED - c.streak} 題就能打倒牠！`; }
    else { c.streak = 0; c.wrong.push(q); msg = '<br>💢 觀念怪回血了！再來一題類似題。'; }
  }
  // 更新戰鬥區（血條、連擊）
  const ar = document.querySelector('.arena'); if (ar) { const t = document.createElement('div'); t.innerHTML = arena(); ar.replaceWith(t.firstElementChild);
    const mr = document.querySelector('.minis.row'); if (mr && t.children[1]) mr.replaceWith(t.children[1]); }
  const last = S.phase === 'round' && S.i >= S.list.length;
  $('fb').innerHTML = `<div class="fb ${ok ? 'ok' : 'no'}"><strong>${ok ? (crit ? '⚡ 暴擊命中！' : '⚔️ 命中！答對了') : '🛡️ 被閃過了！正確答案是 ' + L[q.a]}</strong>${q.e ? '詳解：' + esc(q.e) : ''}${q.e ? msg : msg.replace(/^<br>/, '')}</div>
    <div class="acts"><button class="btn gold" onclick="next()">${last ? (Object.keys(S.weak).length ? '🐲 進入 BOSS 戰 →' : '🏆 看戰果 →') : '下一題 ▶'}</button></div>`;
  $('fb').scrollIntoView({behavior: 'smooth', block: 'nearest'});
}
function quit() { if (!S.log.length) { S.active = false; location.hash = '#/s/' + S.s.id; return; } summary(); }

/* ---------- 戰果 ---------- */
function summary() {
  S.active = false;
  const W = Object.values(S.weak), okC = W.filter(c => c.st === 'ok'), outC = W.filter(c => c.st !== 'ok');
  if (W.length && !outC.length) { const p = player(); p.bosses++; savePlayer(p); }
  const wrongs = S.log.filter(x => !x.ok);
  const answered = S.log.filter(x => x.phase === 'round').length;
  const unitName = c => { const v = vol(S.s, c.v), u = v && v.units.find(x => x.id === c.u); return (v ? v.name + ' ' : '') + (u ? u.name : c.u); };
  const range = [...new Set(S.pairs.map(([v, u]) => v.name + ' ' + u.name))].join('、');
  const win = S.mon.dead && !outC.length;
  const txt = W.length ? `我用刷題網練習${S.s.name}（${range}），${S.label} ${answered} 題答對 ${S.score} 題。
答錯過的觀念：
${W.map(c => `・${unitName(c)}／${c.tag}（錯 ${c.wrong.length} 次，${c.st === 'ok' ? '題庫類似題已連對 ' + NEED + ' 題' : '題庫類似題已用完，還沒連對 ' + NEED + ' 題'}）`).join('\n')}
我答錯的題目：
${wrongs.map((x, n) => `${n + 1}. ${x.q.s || ''}${x.q.img ? '（附圖題，題號 ' + x.q.id + '）' : ''}（我選 ${L[x.pick]}，答案 ${L[x.q.a]}）`).join('\n')}
請針對這些觀念出精熟題，用點選作答、答完顯示詳解。` : '';
  const p = player(), i = lvInfo(p.xp);
  if (win) { SFX.win(); confetti(); }
  crumb(`› <a href="#/s/${S.s.id}">${esc(S.s.name)}</a> › 戰果`);
  $('app').innerHTML = `<div class="panel result ${win ? 'win' : ''}">
    <div class="lvtag ${win ? '' : 'red'}">${win ? '🏆 VICTORY！' : S.mon.dead ? '⚔️ 怪物已擊敗，還有觀念怪逃走了' : '💨 怪物逃走了…下次再挑戰！'}</div>
    <div class="rgrid">
      <div><span>答對</span><b>${S.score} / ${answered}</b></div>
      <div><span>獲得經驗</span><b class="gold">+${S.xp} XP</b></div>
      <div><span>最高連擊</span><b>🔥 ${S.best}</b></div>
      <div><span>打倒觀念怪</span><b>${okC.length} / ${W.length}</b></div>
    </div>
    <div class="ptitle">Lv ${i.lv}・${title(i.lv)}</div>
    <div class="xpbar big"><i style="width:${i.cur / i.need * 100}%"></i><em>${i.cur} / ${i.need} XP</em></div>
    ${outC.length ? `<p class="note">還有 ${outC.length} 隻觀念怪沒打倒（類似題用完或中途結束），答錯的題目都放進「錯題魔窟」了。</p>` : ''}
    <div class="acts" style="justify-content:center"><button class="btn gold" onclick="again()">⚔️ 再戰一回</button><a class="btn ghost" href="#/s/${S.s.id}">🗺️ 回關卡選擇</a></div></div>
    ${W.length ? `<div class="panel"><table><tr><th>關卡</th><th>觀念怪</th><th>被打中幾次</th><th>狀態</th></tr>
      ${W.map(c => `<tr><td>${esc(unitName(c))}</td><td><i class="mini sm">${miniSVG(c)}</i> ${esc(c.tag)}</td><td>${c.wrong.length}</td><td>${c.st === 'ok' ? '<span class="st-ok">💥 已打倒</span>' : '<span class="st-w">逃走了</span>'}</td></tr>`).join('')}</table></div>
    <div class="panel"><b>🧙 請 Claude 出精熟題</b><p class="note" style="margin:4px 0 8px">按「複製」，貼給 Claude（或傳給爸媽），就能針對錯過的觀念出新題目。</p>
      <textarea id="tx" readonly>${esc(txt)}</textarea><div class="acts"><button class="btn gold" onclick="cp()">複製</button><span id="cpm" class="note"></span></div></div>
    <div class="panel"><b>📖 錯題回顧</b>${wrongs.map(x => `<div class="wl">${qHtml(x.q)}
你選 ${L[x.pick]} ${x.q.o ? esc(x.q.o[x.pick]) : ''}　→　正確 ${L[x.q.a]} ${x.q.o ? esc(x.q.o[x.q.a]) : ''}${x.q.e ? '\n<span class="note">詳解：' + esc(x.q.e) + '</span>' : ''}</div>`).join('')}</div>` : ''}`;
  scrollTo(0, 0);
}
function again() {
  const s = S.s, sel = store.get(s.id + ':sel', {n: 10});
  if (S.label === '錯題魔窟') return startWrong(s, sel.n || 10);
  startRound(s, S.pairs, sel.n || 10);
}
function cp() {
  const t = $('tx'); t.select();
  const fail = () => $('cpm').textContent = ' 請長按文字框全選後複製';
  try { navigator.clipboard.writeText(t.value).then(() => $('cpm').textContent = ' 已複製！', fail); } catch (e) { fail(); }
}
