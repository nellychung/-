/* 國中全科刷題網（修練＋養寵物版）：科目 → 冊次 → 單元 */
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
const MAPS = {chinese: ['📜', '藏經閣'], english: ['🐫', '西域商道'], math: ['🧮', '機關迷陣'], nature: ['🌿', '百草谷'], social: ['🏯', '江湖九州'], health: ['🥋', '林濤武場']};
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

/* ---------- 零用錢（經驗值換零用錢，家長設定） ---------- */
const M0 = {on: true, plus: 1, minus: 1, cap: 100, pin: '', days: {}, paid: [], v: 2};
const money = () => { const raw = store.get('money', {}), m = Object.assign({}, M0, raw); if (raw.v !== 2) Object.assign(m, {plus: 1, minus: 1, cap: 100, v: 2}); return m; };
const saveMoney = m => store.set('money', m);
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
function moneySum(m) {
  const earned = Object.values(m.days).reduce((a, d) => a + (d.nt || 0), 0), paid = m.paid.reduce((a, x) => a + x.amt, 0);
  const spent = (m.spent || []).reduce((a, x) => a + x.amt, 0), pend = (m.req || []).reduce((a, x) => a + x.amt, 0);
  return {earned, paid, spent, pend, bal: earned - paid - spent - pend};
}
function moneyAnswer(ok) {
  const m = money(); if (!m.on) return;
  const t = today(), d = Object.assign({r: 0, w: 0, nt: 0}, m.days[t]);
  ok ? d.r++ : d.w++;
  const before = d.nt;
  d.nt = Math.min(d.nt + (ok ? m.plus : -m.minus), m.cap);
  m.days[t] = d; saveMoney(m);
  const got = d.nt - before; if (S) S.nt = (S.nt || 0) + got;
  hud();
  if (got) setTimeout(() => floatText(`💰 ${got > 0 ? '+' : ''}${got} 元`, got > 0 ? 'xp coin' : 'coin neg', $('hud')), 300);
  else if (ok && d.nt >= m.cap) setTimeout(() => floatText('💰 今天已達上限', 'coin', $('hud')), 300);
}
function moneyPage() {
  crumb('› 零用錢存摺');
  const m = money(), sm = moneySum(m), t = m.days[today()] || {xp: 0, nt: 0};
  t.r = t.r || 0; t.w = t.w || 0;
  const full = t.nt >= m.cap;
  const days = Object.keys(m.days).sort().reverse().slice(0, 14);
  $('app').innerHTML = `<div class="panel bank">
    <div class="lvtag">💰 零用錢存摺</div>
    ${m.on ? '' : '<p class="note">家長目前把「經驗值換零用錢」關掉了。</p>'}
    <div class="rgrid">
      <div><span>可以用 / 可以提現</span><b class="gold">NT$ ${sm.bal}</b></div>
      <div><span>累積賺到</span><b>NT$ ${sm.earned}</b></div>
      <div><span>已經提現</span><b>NT$ ${sm.paid}</b></div>
      <div><span>花在寵物</span><b>NT$ ${sm.spent}</b></div>
      ${sm.pend ? `<div><span>提現審核中</span><b>NT$ ${sm.pend}</b></div>` : ''}
      <div><span>今天賺到</span><b class="${t.nt < 0 ? 'neg' : ''}">NT$ ${t.nt} / ${m.cap}</b></div>
    </div>
    <div class="xpbar big"><i style="width:${Math.max(0, Math.min(100, t.nt / m.cap * 100))}%"></i><em>${full ? '今天已經賺到上限，明天再來！' : `今天答對 ${t.r} 題、答錯 ${t.w} 題，離上限還差 ${m.cap - t.nt} 元`}</em></div>
    <p class="note">規則：答對 1 題 +${m.plus} 元，答錯 1 題 −${m.minus} 元，每天最多賺 ${m.cap} 元。</p>
  </div>
  <div class="panel"><div class="lbl" style="margin-top:0">📅 最近的紀錄</div>
    ${days.length ? `<table class="ledger"><tr><th>日期</th><th>答對</th><th>答錯</th><th>零用錢</th></tr>${days.map(k => `<tr><td>${k.slice(5).replace('-', '/')}</td><td>${m.days[k].r || 0}</td><td>${m.days[k].w || 0}</td><td>NT$ ${m.days[k].nt}</td></tr>`).join('')}</table>` : '<div class="empty">還沒有紀錄，去修練賺零用錢吧！</div>'}
    ${(m.spent || []).length ? `<div class="lbl">🐾 花費紀錄</div><table class="ledger"><tr><th>日期</th><th>用途</th><th>金額</th></tr>${m.spent.slice().reverse().slice(0, 10).map(x => `<tr><td>${x.d.slice(5).replace('-', '/')}</td><td>${esc(x.what)}</td><td>NT$ ${x.amt}</td></tr>`).join('')}</table>` : ''}
    ${(m.req || []).length ? `<div class="lbl">⏳ 等家長確認的提現</div><table class="ledger"><tr><th>申請日期</th><th>金額</th></tr>${m.req.map(x => `<tr><td>${x.d.slice(5).replace('-', '/')}</td><td>NT$ ${x.amt}</td></tr>`).join('')}</table>` : ''}
    ${m.paid.length ? `<div class="lbl">🧧 提現紀錄</div><table class="ledger"><tr><th>日期</th><th>金額</th></tr>${m.paid.slice().reverse().slice(0, 10).map(x => `<tr><td>${x.d.slice(5).replace('-', '/')}</td><td>NT$ ${x.amt}</td></tr>`).join('')}</table>` : ''}
  </div>
  <div style="display:flex;gap:.8rem;flex-wrap:wrap"><a class="btn" href="#/">⬅ 回首頁</a><button class="btn gold" onclick="askCash()" ${sm.bal > 0 ? '' : 'disabled'}>💵 申請提現</button><a class="btn" href="#/pets">🐾 寵物園</a><button class="btn ghost" onclick="parentGate()">👨‍👩‍👧 家長專區</button></div>`;
  scrollTo(0, 0);
}
function askCash() {
  const m = money(), bal = moneySum(m).bal;
  const a = parseInt(prompt(`要提現多少元？（最多 ${bal} 元，家長確認後才會給你）`, bal));
  if (!(a > 0)) return;
  if (a > bal) { alert('超過可以提現的金額了'); return; }
  m.req = m.req || []; m.req.push({id: Date.now().toString(36), d: today(), amt: a}); saveMoney(m); hud(); moneyPage();
}
function parentGate() {
  const m = money(), first = !m.pin;
  const box = document.createElement('div'); box.className = 'modal';
  box.innerHTML = `<div class="mbox"><div class="lvtag">👨‍👩‍👧 家長專區</div>
    <p>${first ? '第一次使用，請設定 4 位數家長密碼（請不要讓孩子看到）' : '請輸入家長密碼'}</p>
    <input id="pin" class="pinput" type="password" inputmode="numeric" maxlength="8" autocomplete="off">
    <p class="note" id="pinmsg"></p>
    <button class="btn gold" id="pinok">${first ? '設定密碼' : '進入'}</button> <button class="btn" onclick="this.closest('.modal').remove()">取消</button></div>`;
  document.body.appendChild(box);
  const inp = box.querySelector('#pin'); inp.focus();
  const go = () => {
    const v = inp.value.trim();
    if (first) { if (!/^\d{4,8}$/.test(v)) { box.querySelector('#pinmsg').textContent = '請輸入 4～8 位數字'; return; } const q = money(); q.pin = v; saveMoney(q); }
    else if (v !== m.pin) { box.querySelector('#pinmsg').textContent = '密碼不對'; inp.value = ''; return; }
    box.remove(); moneyAdmin();
  };
  box.querySelector('#pinok').onclick = go; inp.onkeydown = e => { if (e.key === 'Enter') go(); };
}
function moneyAdmin() {
  const m = money(), sm = moneySum(m);
  const box = document.createElement('div'); box.className = 'modal';
  box.innerHTML = `<div class="mbox admin"><div class="lvtag">⚙️ 零用錢設定</div>
    <label class="arow"><span>開啟經驗值換零用錢</span><input type="checkbox" id="mon_on" ${m.on ? 'checked' : ''}></label>
    <label class="arow"><span>答對 1 題賺幾元</span><input type="number" id="mon_plus" min="0" value="${m.plus}"></label>
    <label class="arow"><span>答錯 1 題扣幾元</span><input type="number" id="mon_minus" min="0" value="${m.minus}"></label>
    <label class="arow"><span>每天最多幾元</span><input type="number" id="mon_cap" min="1" value="${m.cap}"></label>
    <button class="btn gold" id="msave">儲存設定</button>
    <hr>${(m.req || []).length ? `<div class="lbl" style="margin-top:0">⏳ 孩子的提現申請</div>${m.req.map(r => `<div class="arow"><span>${r.d.slice(5).replace('-', '/')}　NT$ <b class="gold">${r.amt}</b></span><span><button class="btn sm gold" data-ok="${r.id}">核准發放</button> <button class="btn sm ghost" data-no="${r.id}">退回</button></span></div>`).join('')}<hr>` : ''}
    <div class="arow"><span>目前可以提現 <b class="gold">NT$ ${sm.bal}</b></span></div>
    <label class="arow"><span>直接發給孩子（不用申請）</span><input type="number" id="mon_pay" min="1" value="${Math.max(sm.bal, 0)}"></label>
    <button class="btn" id="mpay">💵 記錄已發放</button>
    <hr>${priceEditor()}
    <hr><label class="arow"><span>改家長密碼</span><input type="password" inputmode="numeric" id="mon_pin" maxlength="8" placeholder="新密碼"></label>
    <p class="note" id="amsg"></p>
    <button class="btn" onclick="this.closest('.modal').remove();moneyPage()">關閉</button></div>`;
  document.body.appendChild(box);
  const msg = t => box.querySelector('#amsg').textContent = t, val = id => box.querySelector('#' + id);
  bindPriceEditor(box, msg);
  val('msave').onclick = () => {
    const q = money(), pl = parseInt(val('mon_plus').value), mi = parseInt(val('mon_minus').value), c = parseInt(val('mon_cap').value), np = val('mon_pin').value.trim();
    if (!(pl >= 0) || !(mi >= 0) || !(c >= 1)) return msg('請輸入正確的數字');
    if (np && !/^\d{4,8}$/.test(np)) return msg('新密碼請用 4～8 位數字');
    q.on = val('mon_on').checked; q.plus = pl; q.minus = mi; q.cap = c; if (np) q.pin = np; saveMoney(q); hud(); msg('✅ 已儲存');
  };
  box.querySelectorAll('[data-ok],[data-no]').forEach(b => b.onclick = () => {
    const q = money(), id = b.dataset.ok || b.dataset.no, r = (q.req || []).find(x => x.id === id); if (!r) return;
    q.req = q.req.filter(x => x.id !== id); if (b.dataset.ok) q.paid.push({d: today(), amt: r.amt});
    saveMoney(q); hud(); box.remove(); moneyAdmin();
  });
  val('mpay').onclick = () => {
    const q = money(), a = parseInt(val('mon_pay').value);
    if (!(a > 0)) return msg('請輸入發放金額');
    q.paid.push({d: today(), amt: a}); saveMoney(q); hud(); box.remove(); moneyPage();
  };
}

/* ---------- 上方 HUD（等級、經驗值、音效） ---------- */
function hud() {
  const p = player(), i = lvInfo(p.xp);
  $('hud').innerHTML = `<span class="hav">${avatar(p, {head: true})}</span><span class="hlv">Lv ${i.lv}</span>
    <span class="hxp"><i style="width:${i.cur / i.need * 100}%"></i><em>${i.cur} / ${i.need} XP</em></span>
    ${money().on ? `<a class="hcoin" href="#/money" title="零用錢存摺">💰 ${moneySum(money()).bal}</a>` : ''}
    <button class="hsnd" onclick="toggleSound()" title="音效">${p.sound ? '🔊' : '🔇'}</button>`;
}
function toggleSound() { const p = player(); p.sound = !p.sound; savePlayer(p); hud(); }

async function loadUnit(sid, vid, uid) {
  const V = vol(subj(sid), vid), dir = sid + '/' + (V ? V.dir : vid);
  const k = dir + '/' + uid;
  if (!CACHE[k]) CACHE[k] = fetch('data/' + k + '.json', {cache: 'no-cache'}).then(r => { if (!r.ok) throw 0; return r.json(); })
    .then(a => a.map(q => Object.assign(q, {_s: sid, _v: vid, _u: uid, _d: dir, _img: q.img ? 'data/' + dir + '/' + q.img : ''})))
    .catch(() => { delete CACHE[k]; return []; });
  return CACHE[k];
}

/* ---------- 路由 ---------- */
fetch('data/catalog.json', {cache: 'no-cache'}).then(r => r.json()).then(c => { CAT = c; hud(); route(); })
  .catch(() => $('app').innerHTML = '<div class="panel">題庫目錄載入失敗，請檢查網路後重新整理。</div>');
window.addEventListener('hashchange', () => {
  if (S && S.active && !confirm('要結束這次修練嗎？（已作答的紀錄和經驗值會保留）')) { history.pushState(null, '', S.hash); return; }
  S = null; route();
});
function route() {
  const p = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  if (p[0] === 's' && subj(p[1])) return subjectPage(p[1]);
  if (p[0] === 'money') return moneyPage();
  if (p[0] === 'pets') return petPage();
  home();
}
function crumb(h) { $('crumb').innerHTML = h || ''; }

/* ---------- 首頁：角色卡＋選地圖 ---------- */
function home() {
  crumb(''); checkPets();
  const p = player(), i = lvInfo(p.xp);
  const tot = s => s.vols.reduce((n, v) => n + v.units.reduce((m, u) => m + (u.count || 0), 0), 0);
  $('app').innerHTML = `
  <div class="panel hero">
    <button class="ava" onclick="pickAvatar()" title="換角色">${avatar(p)}<small>${CHARS[p.avatar].name}・換角色</small></button>
    <div class="hinfo">
      <input class="pname" id="pname" maxlength="10" placeholder="輸入俠客名號" value="${esc(p.name)}">
      <div class="ptitle">Lv ${i.lv}・${title(i.lv)}</div>
      <div class="xpbar big"><i style="width:${i.cur / i.need * 100}%"></i><em>${i.cur} / ${i.need} XP　距離升級還差 ${i.need - i.cur}</em></div>
      <div class="stats"><span>✅ 累積答對 <b>${p.right}</b></span><span>🔥 最高連擊 <b>${p.best}</b></span><span>🧠 精熟觀念 <b>${p.bosses}</b></span></div>
      <div class="hbtns"><a class="coinbtn" href="#/pets">🐾 寵物園 <b>${pets().list.filter(x => !x.away).length} 隻</b></a>${money().on ? `<a class="coinbtn" href="#/money">💰 零用錢 <b>NT$ ${moneySum(money()).bal}</b></a>` : ''}</div>
    </div>
  </div>
  ${petAlert()}
  <div class="lbl">🗺️ 選擇修練之地</div>
  <div class="grid">
    ${CAT.subjects.map(s => { const n = tot(s), m = MAPS[s.id] || ['📘', s.name]; return `<a class="map ${n ? 'has' : 'lock'}" href="#/s/${s.id}">
      <span class="mi">${m[0]}</span><b>${esc(s.name)}</b><small>${m[1]}・${n ? n + ' 題' : '🔒 尚未開放'}</small></a>`; }).join('')}
  </div>
  <p class="note">冒險紀錄存在這台平板的瀏覽器裡；換平板或清除瀏覽資料會重新開始。</p>`;
  $('pname').onchange = e => { const q = player(); q.name = e.target.value.trim(); savePlayer(q); };
  scrollTo(0, 0);
}
function petAlert() {
  const d = pets(), gone = d.list.filter(x => x.away);
  const hungry = d.list.filter(x => !x.away && fullNow(x) < 25);
  if (gone.length) return `<a class="panel pmsg warn" href="#/pets">💨 ${gone.map(x => esc(x.name)).join('、')} 太久沒吃東西，離家出走了…快去寵物園把牠找回來！</a>`;
  if (hungry.length) return `<a class="panel pmsg warn" href="#/pets">😟 ${hungry.map(x => esc(x.name)).join('、')} 肚子餓了，記得去寵物園餵牠！</a>`;
  if (!d.list.length) return `<a class="panel pmsg" href="#/pets">🥚 用零用錢去寵物園買一隻寵物，帶牠一起修練吧！</a>`;
  return '';
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
/* 舊版紀錄（沒有版本）搬到預設版本 */
function migrate(s) {
  if (store.get(s.id + ':v2', 0)) return;
  const d = s.defaultPub || 'hanlin', fix = k => /^[^/]+-[^/]+\//.test(k) ? k : d + '-' + k;
  const seen = store.get(s.id + ':seen', null); if (seen) store.set(s.id + ':seen', seen.map(fix));
  for (const key of ['stat', 'wrong']) { const o = store.get(s.id + ':' + key, null); if (o) { const n = {}; for (const k in o) n[fix(k)] = o[k]; store.set(s.id + ':' + key, n); } }
  const sel = store.get(s.id + ':sel', null);
  if (sel) { sel.units = (sel.units || []).map(fix); sel.pubs = [d]; sel.vols = (sel.vols || []).map(v => v.includes('-') ? v.split('-')[1] : v); store.set(s.id + ':sel', sel); }
  store.set(s.id + ':v2', 1);
}
const VORDER = ['1', '2', '3', '4', '5', '6', '6x', 'bc', 'cap'];
function subjectPage(sid) {
  const s = subj(sid), m = MAPS[sid] || ['📘', s.name];
  migrate(s);
  crumb(`› ${m[0]} ${esc(s.name)}`);
  const sel = store.get(sid + ':sel', null) || {pubs: [], vols: [], units: [], n: 10};
  sel.pubs = sel.pubs || [];
  const cnt = v => v.units.reduce((n, u) => n + (u.count || 0), 0);
  if (!sel.pubs.length) sel.pubs = [s.defaultPub || 'hanlin'];
  if (!sel.vols.length) { const a = s.vols.find(v => sel.pubs.includes(v.pub) && cnt(v)); if (a) sel.vols = [a.v]; }
  const stat = store.get(sid + ':stat', {});
  const wrong = Object.keys(store.get(sid + ':wrong', {}));
  const save = () => store.set(sid + ':sel', sel);

  function draw() {
    const vols = s.vols.filter(v => sel.pubs.includes(v.pub) && sel.vols.includes(v.v));
    const vkeys = VORDER.filter(k => s.vols.some(v => v.v === k && sel.pubs.includes(v.pub)));
    const allOn = vkeys.length && vkeys.every(k => sel.vols.includes(k));
    const picked = vols.flatMap(v => v.units.filter(u => u.count && sel.units.includes(uKey(v.id, u.id))));
    const nq = picked.reduce((n, u) => n + u.count, 0);
    const pubN = p => s.vols.filter(v => v.pub === p).reduce((n, v) => n + cnt(v), 0);
    $('app').innerHTML = `
    <div class="panel">
      <div class="lbl" style="margin-top:0">🏷️ 版本 <span class="note">可複選；準備會考可以把不同版本一起選來練</span></div>
      <div class="chips pubs">${(s.pubs || []).map(p => { const n = pubN(p.id);
        return `<button class="chip pub ${sel.pubs.includes(p.id) ? 'on' : ''} ${n ? '' : 'lock'}" data-p="${p.id}">${esc(p.name)}<small>${n ? n + ' 題' : '🔒 準備中'}</small></button>`; }).join('')}</div>
      <div class="lbl">📚 冊次 <label class="chk"><input type="checkbox" id="va" ${allOn ? 'checked' : ''}> 全選</label></div>
      <div class="chips">${vkeys.map(k => { const vs = s.vols.filter(v => v.v === k && sel.pubs.includes(v.pub)), n = vs.reduce((a, v) => a + cnt(v), 0), v0 = vs[0];
        return `<button class="chip vchip ${sel.vols.includes(k) ? 'on' : ''} ${n ? '' : 'lock'}" data-v="${k}">${esc(v0.name)}<small>${[v0.grade, n ? n + ' 題' : '🔒 準備中'].filter(Boolean).join('・')}</small></button>`; }).join('') || '<span class="note">請先選擇版本</span>'}</div>
    </div>
    ${vols.length ? vols.map(v => volCard(v)).join('') : '<div class="panel empty">請先選擇版本和冊次</div>'}
    <div class="dock"><div class="in">
      <span class="note">已選 ${picked.length} 關・${nq} 題</span><span class="sp"></span>
      <span class="seg">${[10, 20, 30].map(n => `<button data-n="${n}" class="${sel.n === n ? 'on' : ''}">${n} 題</button>`).join('')}</span>
      <button class="btn red" id="wb" ${wrong.length ? '' : 'disabled'}>📕 錯題特訓 ${wrong.length}</button>
      <button class="btn gold" id="go" ${picked.length ? '' : 'disabled'}>⚔️ 開始修練</button>
    </div></div>`;

    document.querySelectorAll('.chip.pub').forEach(b => b.onclick = () => {
      const id = b.dataset.p; sel.pubs = sel.pubs.includes(id) ? sel.pubs.filter(x => x !== id) : sel.pubs.concat(id);
      if (id === 'exam' && sel.pubs.includes('exam')) sel.vols = [...new Set(sel.vols.concat(['bc', 'cap']))];
      save(); draw(); });
    $('va').onchange = e => { sel.vols = e.target.checked ? vkeys.slice() : []; save(); draw(); };
    document.querySelectorAll('.vchip').forEach(b => b.onclick = () => {
      const id = b.dataset.v; sel.vols = sel.vols.includes(id) ? sel.vols.filter(x => x !== id) : sel.vols.concat(id); save(); draw(); });
    document.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { sel.n = +b.dataset.n; save(); draw(); });
    document.querySelectorAll('.unit input').forEach(c => c.onchange = () => {
      const k = c.dataset.u; sel.units = c.checked ? sel.units.concat(k) : sel.units.filter(x => x !== k); save(); draw(); });
    document.querySelectorAll('.gall').forEach(c => c.onchange = () => {
      const ks = c.dataset.k.split(','); sel.units = sel.units.filter(x => !ks.includes(x)); if (c.checked) sel.units.push(...ks); save(); draw(); });
    document.querySelectorAll('.vall').forEach(c => c.onchange = () => {
      const v = vol(s, c.dataset.v), ks = v.units.filter(u => u.count).map(u => uKey(v.id, u.id));
      sel.units = sel.units.filter(x => !ks.includes(x)); if (c.checked) sel.units.push(...ks); save(); draw(); });
    $('go').onclick = () => startRound(s, vols.flatMap(v => v.units.filter(u => u.count && sel.units.includes(uKey(v.id, u.id))).map(u => [v, u])), sel.n);
    $('wb').onclick = () => startWrong(s, sel.n);
  }

  function volCard(v) {
    const us = v.units.filter(u => u.count);
    const meta = esc(v.grade || '');
    if (!us.length) return `<div class="panel vol"><h3>${esc(vLabel(s, v))} <span class="note">${meta}</span></h3><div class="empty">🔒 這一冊的關卡還在準備中</div></div>`;
    const all = us.every(u => sel.units.includes(uKey(v.id, u.id)));
    let lastG = null;
    const rows = '<div class="ulist">' + v.units.map(u => {
      const k = uKey(v.id, u.id), st = stat[k], g = u.group && u.group !== lastG ? (() => { const ks = v.units.filter(x => x.group === u.group && x.count).map(x => uKey(v.id, x.id)); return `<label class="grp chk"><input type="checkbox" class="gall" data-k="${ks.join(',')}" ${ks.length && ks.every(x => sel.units.includes(x)) ? 'checked' : ''}> ${esc(u.group)}</label>`; })() : '';
      lastG = u.group || lastG;
      if (!u.count) return g + `<div class="unit off"><input type="checkbox" disabled><span class="nm">${esc(u.name)}</span><span class="meta">🔒 準備中</span></div>`;
      const done = st ? Math.min(st.seen || 0, u.count) : 0;
      return g + `<label class="unit"><input type="checkbox" data-u="${k}" ${sel.units.includes(k) ? 'checked' : ''}>
        <span class="nm">${esc(u.name)}</span>
        <span class="meta">${stars(st, u.count)}<br>${u.count} 題${st && st.n ? `・答對 ${Math.round(st.c / st.n * 100)}%` : ''}<div class="mbar"><i style="width:${done / u.count * 100}%"></i></div></span></label>`;
    }).join('') + '</div>';
    return `<div class="panel vol"><h3>${esc(vLabel(s, v))} <span class="note">${meta}</span>
      <label class="chk" style="margin-left:auto"><input type="checkbox" class="vall" data-v="${v.id}" ${all ? 'checked' : ''}> 全選關卡</label></h3>${rows}</div>`;
  }
  draw(); scrollTo(0, 0);
}

/* ---------- 出題 ---------- */
async function startRound(s, pairs, n) {
  $('app').innerHTML = '<div class="panel">準備題目中…</div>';
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
  begin(s, shuf(list), pairs, '修練');
}
async function startWrong(s, n) {
  $('app').innerHTML = '<div class="panel">準備錯題中…</div>';
  const keys = Object.keys(store.get(s.id + ':wrong', {}));
  const units = [...new Set(keys.map(k => k.split('#')[0]))];
  const banks = await Promise.all(units.map(k => { const [v, u] = k.split('/'); return loadUnit(s.id, v, u); }));
  const ks = new Set(keys);
  const list = shuf(banks.flat().filter(q => ks.has(qKey(q)))).slice(0, n);
  if (!list.length) { subjectPage(s.id); return; }
  const pairs = units.map(k => { const [v, u] = k.split('/'); const V = vol(s, v); return [V, V && V.units.find(x => x.id === u)]; }).filter(p => p[0] && p[1]);
  begin(s, list, pairs, '錯題特訓');
}
function begin(s, list, pairs, label) {
  S = {s, list, pairs, label, i: 0, score: 0, used: new Set(list.map(qKey)), seen: new Set(store.get(s.id + ':seen', [])),
       weak: {}, log: [], cur: null, ans: false, phase: 'round', active: true, hash: '#/s/' + s.id + '/play',
       combo: 0, best: 0, xp: 0, grow: 0};
  if (location.hash === S.hash) history.replaceState(null, '', S.hash); else history.pushState(null, '', S.hash);
  next();
}
const vLabel = (s, v) => { const p = (s.pubs || []).find(p => p.id === v.pub); return (p && v.pub !== 'exam' ? p.name : '') + v.name; };
const uName = q => { const v = vol(S.s, q._v), u = v && v.units.find(x => x.id === q._u); return (v ? vLabel(S.s, v) + ' ' : '') + (u ? u.name : q._u); };
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
      if (Object.keys(S.weak).length) return weakIntro();
      return summary();
    }
    S.cur = {q: S.list[S.i], k: null};
  } else {
    const n = await nextWeak(); if (!n) return summary();
    S.cur = n; S.used.add(qKey(n.q));
  }
  render();
}
function weakIntro() {
  S.phase = 'weak';
  crumb(`› <a href="#/s/${S.s.id}">${esc(S.s.name)}</a> › 弱點特訓`);
  const W = Object.values(S.weak);
  $('app').innerHTML = `<div class="panel bossin"><div class="lvtag">🧠 弱點特訓</div>
    <p>剛剛答錯的 <b>${W.length}</b> 個觀念要再練一下！<br>每個觀念<b>連續答對 ${NEED} 題</b>類似題就算精熟；答錯會重新計算。</p>
    <div class="wtags">${W.map(c => `<span>${esc(c.tag)}</span>`).join('')}</div>
    <button class="btn gold" onclick="next()">💪 開始特訓</button></div>`;
  scrollTo(0, 0);
}
/* 題目內容：有 html 旗標的題庫（Word 轉來）保留附圖與表格 */
const fixH = (q, h) => String(h || '').replace(/src="img\//g, `loading="lazy" src="data/${q._d}/img/`).replace(/ width="(\d+)"/g, (m, w) => ` style="width:${Math.round(w * 1.15)}px"`);
const R = (q, t) => q.html ? fixH(q, t) : esc(t);
const txt = h => { const d = document.createElement('div'); d.innerHTML = String(h || '').replace(/<br>/g, ' '); return d.textContent; };
function qHtml(q) {
  const pic = q._img ? `<img src="${esc(q._img)}" alt="題目附圖" loading="lazy">` : '';
  const psg = q.p ? `<div class="psg">${R(q, q.p)}</div>` : '';
  const au = q.au ? `<div class="aud"><button class="btn" onclick="playAu()">🔊 播放題目</button><span class="note">可以重複播放</span><audio id="au" src="${esc(q.au)}" preload="auto"></audio></div>` : '';
  return au + psg + (q.img && !q.o ? pic : R(q, q.s) + pic);
}
function stopAu() { const a = $('au'); if (a) a.pause(); }
function playAu() { const a = $('au'); if (!a) return; a.currentTime = 0; a.play().catch(() => {}); }
function arena() {
  const p = player(), pt = activePet();
  const right = pt ? `<div class="buddy"><div class="finfo"><b>${esc(pt.name)}</b><div class="note">${mood(pt)[0]} 陪你修練・${stageName(pt)}</div></div><span id="mon">${petArt(pt, 'mini2')}</span></div>`
    : `<a class="buddy none" href="#/pets"><div class="finfo"><b>還沒有寵物</b><div class="note">去寵物園買一隻陪你 →</div></div><span id="mon" class="pet emo">🥚</span></a>`;
  if (S.phase === 'round') return `<div class="arena">
      <div class="me"><span class="meav" id="meav">${avatar(p)}</span><div><b>${esc(p.name || CHARS[p.avatar].name)}</b><div class="note">${S.label} ${Math.min(S.i + 1, S.list.length)} / ${S.list.length}</div></div></div>
      <div class="combo ${S.combo >= 3 ? 'hot' : ''}">${S.combo >= 2 ? `🔥 ${S.combo} 連對` : ''}</div>${right}</div>`;
  const W = Object.values(S.weak), c = S.weak[S.cur.k];
  return `<div class="arena">
    <div class="me"><span class="meav" id="meav">${avatar(p)}</span><div><b>弱點特訓：${esc(c.tag)}</b><div class="note">${'⭐'.repeat(c.streak)}${'☆'.repeat(NEED - c.streak)}　精熟 ${W.filter(x => x.st === 'ok').length} / ${W.length}</div></div></div>
    <div class="combo ${S.combo >= 3 ? 'hot' : ''}">${S.combo >= 2 ? `🔥 ${S.combo} 連對` : ''}</div>${right}</div>`;
}
function render() {
  stopAu();
  const q = S.cur.q;
  crumb(`› <a href="#/s/${S.s.id}">${esc(S.s.name)}</a> › ${S.phase === 'round' ? S.label : '弱點特訓'}`);
  const nOpt = q.o ? q.o.length : (q.n || 4);
  $('app').innerHTML = `${arena()}<div class="qcard">
    <div class="bar"><span class="pill">${esc(uName(q))}</span>${q.k ? `<span class="pill">${esc(q.k.join('、'))}</span>` : ''}${q.d ? `<span class="pill d${esc(q.d)}">${esc(q.d)}・${xpFor(q)} XP</span>` : ''}</div>
    <div class="qgrid"><div class="qleft"><div class="stem">${qHtml(q)}</div>
    ${q.img && !q.o ? '<p class="note" style="margin:0">看圖作答，點選答案：</p>' : ''}</div>
    <div class="qright">${Array.from({length: nOpt}, (_, i) => `<button class="opt" id="o${i}" onclick="answer(${i})"><b>${L[i]}</b><span>${q.o ? R(q, q.o[i]) : ''}</span></button>`).join('')}
    <div id="fb"></div></div></div></div>
    <div class="acts"><button class="btn ghost" onclick="quit()">🏳️ 結束修練，看成果</button></div>`;
  scrollTo(0, 0);
  if (q.au) setTimeout(playAu, 400);
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
  moneyAnswer(ok);
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
    (crit ? SFX.crit : SFX.hit)(); shake('mon', 'hop'); shake('meav', 'atk');
    floatText(`+${got} XP`, 'xp', $('meav'));
    const up = petGrow(1); S.grow++;
    if (up) setTimeout(() => { SFX.lvup(); confetti(); floatText(`✨ ${up.name} 長大了！`, 'xp big'); }, 400);
  } else { SFX.miss(); shake('meav', 'hurt'); shake('mon', 'hurt'); }

  if (S.phase === 'round') {
    if (ok) S.score++;
    else { const k = q._v + '/' + q._u + '|' + tag(q);
      if (!S.weak[k]) S.weak[k] = {v: q._v, u: q._u, tag: tag(q), streak: 0, st: 'learn', last: 0, wrong: []};
      S.weak[k].wrong.push(q); msg = `<br>📌 這個觀念等一下會在「弱點特訓」再練一次。`; }
    S.i++;
  } else {
    const c = S.weak[S.cur.k];
    if (ok) { c.streak++;
      if (c.streak >= NEED) { c.st = 'ok'; msg = `<br>🎉 觀念「${esc(c.tag)}」精熟了！+30 XP`;
        gainXP(30); const p = player(); p.bosses++; savePlayer(p); setTimeout(() => { SFX.kill(); floatText('精熟！+30 XP', 'xp big'); }, 350); }
      else msg = `<br>再答對 ${NEED - c.streak} 題就精熟了！`; }
    else { c.streak = 0; c.wrong.push(q); msg = '<br>💪 沒關係，重新計算，再來一題類似題。'; }
  }
  // 更新戰鬥區（血條、連擊）
  const ar = document.querySelector('.arena'); if (ar) { const t = document.createElement('div'); t.innerHTML = arena(); ar.replaceWith(t.firstElementChild); }
  const last = S.phase === 'round' && S.i >= S.list.length;
  $('fb').innerHTML = `<div class="fb ${ok ? 'ok' : 'no'}"><strong>${ok ? (crit ? '⚡ 連對好厲害！答對了' : '✅ 答對了！') : '❌ 答錯了，正確答案是 ' + L[q.a]}</strong>${q.e ? '詳解：' + R(q, q.e) : ''}${q.e ? msg : msg.replace(/^<br>/, '')}</div>
    <div class="acts"><button class="btn gold" onclick="next()">${last ? (Object.keys(S.weak).length ? '🧠 進入弱點特訓 →' : '🏆 看成果 →') : '下一題 ▶'}</button></div>`;
  $('fb').scrollIntoView({behavior: 'smooth', block: 'nearest'});
}
function quit() { stopAu(); if (!S.log.length) { S.active = false; location.hash = '#/s/' + S.s.id; return; } summary(); }

/* ---------- 戰果 ---------- */
function summary() {
  S.active = false;
  const W = Object.values(S.weak), okC = W.filter(c => c.st === 'ok'), outC = W.filter(c => c.st !== 'ok');
  const wrongs = S.log.filter(x => !x.ok);
  const answered = S.log.filter(x => x.phase === 'round').length;
  const unitName = c => { const v = vol(S.s, c.v), u = v && v.units.find(x => x.id === c.u); return (v ? vLabel(S.s, v) + ' ' : '') + (u ? u.name : c.u); };
  const range = [...new Set(S.pairs.map(([v, u]) => vLabel(S.s, v) + ' ' + u.name))].join('、');
  const win = answered > 0 && !outC.length;
  const copyText = W.length ? `我用刷題網練習${S.s.name}（${range}），${S.label} ${answered} 題答對 ${S.score} 題。
答錯過的觀念：
${W.map(c => `・${unitName(c)}／${c.tag}（錯 ${c.wrong.length} 次，${c.st === 'ok' ? '題庫類似題已連對 ' + NEED + ' 題' : '題庫類似題已用完，還沒連對 ' + NEED + ' 題'}）`).join('\n')}
我答錯的題目：
${wrongs.map((x, n) => `${n + 1}. ${txt(x.q.s)}${x.q.img || /<img/.test(x.q.s + (x.q.p || '')) ? '（附圖題，題號 ' + x.q.id + '）' : ''}（我選 ${L[x.pick]}，答案 ${L[x.q.a]}）`).join('\n')}
請針對這些觀念出精熟題，用點選作答、答完顯示詳解。` : '';
  const p = player(), i = lvInfo(p.xp);
  if (win) { SFX.win(); confetti(); }
  crumb(`› <a href="#/s/${S.s.id}">${esc(S.s.name)}</a> › 成果`);
  $('app').innerHTML = `<div class="panel result ${win ? 'win' : ''}">
    <div class="lvtag ${win ? '' : 'red'}">${win ? '🏆 修練完成！' : '📌 還有觀念要再加油'}</div>
    <div class="rgrid">
      <div><span>答對</span><b>${S.score} / ${answered}</b></div>
      <div><span>獲得經驗</span><b class="gold">+${S.xp} XP</b></div>
      <div><span>最高連擊</span><b>🔥 ${S.best}</b></div>
      <div><span>精熟觀念</span><b>${okC.length} / ${W.length}</b></div>
      ${activePet() ? `<div><span>${esc(activePet().name)} 成長</span><b>🐾 +${S.grow}</b></div>` : ''}
      ${money().on ? `<div><span>零用錢</span><b class="${(S.nt || 0) < 0 ? 'neg' : 'gold'}">💰 ${(S.nt || 0) >= 0 ? '+' : ''}${S.nt || 0} 元</b></div>` : ''}
    </div>
    <div class="ptitle">Lv ${i.lv}・${title(i.lv)}</div>
    <div class="xpbar big"><i style="width:${i.cur / i.need * 100}%"></i><em>${i.cur} / ${i.need} XP</em></div>
    ${outC.length ? `<p class="note">還有 ${outC.length} 個觀念還沒精熟（類似題用完或中途結束），答錯的題目都放進「錯題特訓」了。</p>` : ''}
    <div class="acts" style="justify-content:center"><button class="btn gold" onclick="again()">⚔️ 再修練一回</button><a class="btn" href="#/pets">🐾 去看寵物</a><a class="btn ghost" href="#/s/${S.s.id}">🗺️ 回關卡選擇</a></div></div>
    ${W.length ? `<div class="panel"><table><tr><th>單元</th><th>觀念</th><th>答錯幾次</th><th>狀態</th></tr>
      ${W.map(c => `<tr><td>${esc(unitName(c))}</td><td>${esc(c.tag)}</td><td>${c.wrong.length}</td><td>${c.st === 'ok' ? '<span class="st-ok">✅ 已精熟</span>' : '<span class="st-w">再加油</span>'}</td></tr>`).join('')}</table></div>
    <div class="panel"><b>🧙 請 Claude 出精熟題</b><p class="note" style="margin:4px 0 8px">按「複製」，貼給 Claude（或傳給爸媽），就能針對錯過的觀念出新題目。</p>
      <textarea id="tx" readonly>${esc(copyText)}</textarea><div class="acts"><button class="btn gold" onclick="cp()">複製</button><span id="cpm" class="note"></span></div></div>
    <div class="panel"><b>📖 錯題回顧</b>${wrongs.map(x => `<div class="wl">${qHtml(x.q)}
你選 ${L[x.pick]} ${x.q.o ? R(x.q, x.q.o[x.pick]) : ''}　→　正確 ${L[x.q.a]} ${x.q.o ? R(x.q, x.q.o[x.q.a]) : ''}${x.q.e ? '\n<span class="note">詳解：' + R(x.q, x.q.e) + '</span>' : ''}</div>`).join('')}</div>` : ''}`;
  scrollTo(0, 0);
}
function again() {
  const s = S.s, sel = store.get(s.id + ':sel', {n: 10});
  if (S.label === '錯題特訓') return startWrong(s, sel.n || 10);
  startRound(s, S.pairs, sel.n || 10);
}
function cp() {
  const t = $('tx'); t.select();
  const fail = () => $('cpm').textContent = ' 請長按文字框全選後複製';
  try { navigator.clipboard.writeText(t.value).then(() => $('cpm').textContent = ' 已複製！', fail); } catch (e) { fail(); }
}
