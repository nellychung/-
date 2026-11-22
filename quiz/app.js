/* 國中全科刷題網：科目 → 冊次 → 單元 */
const NEED = 2;               // 錯題觀念要連續答對幾題才算過關
const L = 'ABCDEF';
let CAT = null, S = null;     // S = 目前這一回練習
const CACHE = {};
const $ = id => document.getElementById(id);
const esc = t => String(t ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuf = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- 本機紀錄（存在這台平板） ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem('qz:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('qz:' + k, JSON.stringify(v)); } catch (e) {} }
};
const subj = id => CAT.subjects.find(s => s.id === id);
const vol = (s, id) => s.vols.find(v => v.id === id);
const qKey = q => q._v + '/' + q._u + '#' + q.id;
const uKey = (v, u) => v + '/' + u;

async function loadUnit(sid, vid, uid) {
  const k = sid + '/' + vid + '/' + uid;
  if (!CACHE[k]) CACHE[k] = fetch('data/' + k + '.json', {cache: 'no-cache'}).then(r => { if (!r.ok) throw 0; return r.json(); })
    .then(a => a.map(q => Object.assign(q, {_s: sid, _v: vid, _u: uid, _img: q.img ? 'data/' + sid + '/' + vid + '/' + q.img : ''})))
    .catch(() => { delete CACHE[k]; return []; });
  return CACHE[k];
}

/* ---------- 路由 ---------- */
fetch('data/catalog.json', {cache: 'no-cache'}).then(r => r.json()).then(c => { CAT = c; route(); })
  .catch(() => $('app').innerHTML = '<div class="card">題庫目錄載入失敗，請檢查網路後重新整理。</div>');
window.addEventListener('hashchange', () => {
  if (S && S.active && !confirm('要離開這一回練習嗎？（已作答的紀錄會保留）')) { history.pushState(null, '', S.hash); return; }
  S = null; route();
});
function route() {
  const p = location.hash.replace(/^#\/?/, '').split('/').map(decodeURIComponent);
  if (p[0] === 's' && subj(p[1])) return subjectPage(p[1]);
  home();
}
function crumb(h) { $('crumb').innerHTML = h || ''; }

/* ---------- 首頁：選科目 ---------- */
function home() {
  crumb('');
  const tot = s => s.vols.reduce((n, v) => n + v.units.reduce((m, u) => m + (u.count || 0), 0), 0);
  $('app').innerHTML = `<div class="lbl">選擇科目</div><div class="card"><div class="grid">
    ${CAT.subjects.map(s => { const n = tot(s); return `<a class="subj ${n ? 'has' : ''}" href="#/s/${s.id}">
      <span>${s.icon || ''} ${esc(s.name)}</span><small>${n ? n + ' 題' : '題庫準備中'}</small></a>`; }).join('')}
  </div></div>
  <p class="note">做題紀錄存在這台裝置的瀏覽器裡；換平板或清除瀏覽資料會重新計算。</p>`;
  scrollTo(0, 0);
}

/* ---------- 科目頁：冊次（可複選）＋單元 ---------- */
function subjectPage(sid) {
  const s = subj(sid);
  crumb(`› ${esc(s.name)}`);
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
    <div class="card">
      <div class="lbl" style="margin-top:0">冊次 <label class="chk"><input type="checkbox" id="va" ${allOn ? 'checked' : ''}> 全選</label></div>
      <div class="chips">${s.vols.map(v => { const n = v.units.reduce((m, u) => m + (u.count || 0), 0);
        return `<button class="chip ${sel.vols.includes(v.id) ? 'on' : ''}" data-v="${v.id}">${esc(v.name)}<small>${[v.grade, n ? n + ' 題' : '準備中'].filter(Boolean).join('・')}</small></button>`; }).join('')}</div>
    </div>
    ${vols.length ? vols.map(v => volCard(v)).join('') : '<div class="card empty">請先選擇冊次</div>'}
    <div class="dock"><div class="in">
      <span class="note">已選 ${picked.length} 個單元・${nq} 題</span><span class="sp"></span>
      <span class="seg">${[10, 20, 30].map(n => `<button data-n="${n}" class="${sel.n === n ? 'on' : ''}">${n} 題</button>`).join('')}</span>
      <button class="btn w" id="wb" ${wrong.length ? '' : 'disabled'}>錯題本 ${wrong.length}</button>
      <button class="btn" id="go" ${picked.length ? '' : 'disabled'}>開始練習</button>
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
    if (!v.units.length || !us.length) return `<div class="card vol"><h3>${esc(v.name)} <span class="note">${esc([v.grade, v.pub].filter(Boolean).join('・'))}</span></h3><div class="empty">這一冊的題庫還在準備中</div></div>`;
    const all = us.every(u => sel.units.includes(uKey(v.id, u.id)));
    let lastG = null;
    const rows = v.units.map(u => {
      const k = uKey(v.id, u.id), st = stat[k], g = u.group && u.group !== lastG ? `<div class="grp">${esc(u.group)}</div>` : '';
      lastG = u.group || lastG;
      if (!u.count) return g + `<div class="unit off"><input type="checkbox" disabled><span class="nm">${esc(u.name)}</span><span class="meta">準備中</span></div>`;
      const done = st ? Math.min(st.seen || 0, u.count) : 0;
      return g + `<label class="unit"><input type="checkbox" data-u="${k}" ${sel.units.includes(k) ? 'checked' : ''}>
        <span class="nm">${esc(u.name)}</span>
        <span class="meta">${u.count} 題${st && st.n ? `・答對率 ${Math.round(st.c / st.n * 100)}%` : ''}<div class="mbar"><i style="width:${done / u.count * 100}%"></i></div></span></label>`;
    }).join('');
    return `<div class="card vol"><h3>${esc(v.name)} <span class="note">${esc([v.grade, v.pub].filter(Boolean).join('・'))}</span>
      <label class="chk" style="margin-left:auto"><input type="checkbox" class="vall" data-v="${v.id}" ${all ? 'checked' : ''}> 全選單元</label></h3>${rows}</div>`;
  }
  draw(); scrollTo(0, 0);
}

/* ---------- 出題 ---------- */
async function startRound(s, pairs, n) {
  $('app').innerHTML = '<div class="card">題目載入中…</div>';
  const seen = new Set(store.get(s.id + ':seen', []));
  const banks = await Promise.all(pairs.map(([v, u]) => loadUnit(s.id, v.id, u.id)));
  const pools = banks.filter(b => b.length).map(b => { const un = b.filter(q => !seen.has(qKey(q))); return shuf(un).concat(shuf(b.filter(q => seen.has(qKey(q))))); });
  if (!pools.length) { $('app').innerHTML = '<div class="card">題庫載入失敗，請重新整理。</div>'; return; }
  // 各單元平均輪流出題，優先沒做過的
  const list = [], used = new Set(); let order = [];
  while (list.length < n && pools.some(p => p.length)) {
    if (!order.length) order = shuf(pools.map((_, i) => i));
    const p = pools[order.pop()]; const q = p.shift();
    if (q && !used.has(qKey(q))) { used.add(qKey(q)); list.push(q); }
  }
  begin(s, shuf(list), pairs, '第一輪');
}
async function startWrong(s, n) {
  $('app').innerHTML = '<div class="card">題目載入中…</div>';
  const keys = Object.keys(store.get(s.id + ':wrong', {}));
  const units = [...new Set(keys.map(k => k.split('#')[0]))];
  const banks = await Promise.all(units.map(k => { const [v, u] = k.split('/'); return loadUnit(s.id, v, u); }));
  const all = banks.flat(), ks = new Set(keys);
  const list = shuf(all.filter(q => ks.has(qKey(q)))).slice(0, n);
  if (!list.length) { subjectPage(s.id); return; }
  const pairs = units.map(k => { const [v, u] = k.split('/'); const V = vol(s, v); return [V, V && V.units.find(x => x.id === u)]; }).filter(p => p[0] && p[1]);
  begin(s, list, pairs, '錯題本');
}
function begin(s, list, pairs, label) {
  S = {s, list, pairs, label, i: 0, score: 0, used: new Set(list.map(qKey)), seen: new Set(store.get(s.id + ':seen', [])),
       weak: {}, log: [], cur: null, ans: false, phase: 'round', active: true, hash: '#/s/' + s.id + '/play'};
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
    if (S.i >= S.list.length) { S.phase = 'weak'; return next(); }
    S.cur = {q: S.list[S.i], k: null};
  } else {
    const n = await nextWeak(); if (!n) return summary();
    S.cur = n; S.used.add(qKey(n.q));
  }
  render();
}
function qHtml(q) {
  const pic = q._img ? `<img src="${esc(q._img)}" alt="題目附圖" loading="lazy">` : '';
  return q.img && !q.o ? pic : esc(q.s) + pic;
}
function render() {
  const q = S.cur.q; let head, pct;
  crumb(`› <a href="#/s/${S.s.id}">${esc(S.s.name)}</a> › ${S.phase === 'round' ? S.label : '錯題加強'}`);
  if (S.phase === 'round') { head = `<span>${S.label} ${S.i + 1} / ${S.list.length}</span><span>目前答對 ${S.score}</span>`; pct = S.i / S.list.length * 100; }
  else { const c = S.weak[S.cur.k], all = Object.values(S.weak), done = all.filter(x => x.st !== 'learn').length;
    head = `<span class="pill w">錯題加強</span><span>觀念「${esc(c.tag)}」連續答對 ${c.streak} / ${NEED}</span><span>（完成 ${done} / ${all.length} 個觀念）</span>`; pct = done / all.length * 100; }
  const nOpt = q.o ? q.o.length : (q.n || 4);
  $('app').innerHTML = `<div class="prog"><i style="width:${pct}%"></i></div><div class="card">
    <div class="bar">${head}</div>
    <div class="bar"><span class="pill">${esc(uName(q))}</span>${q.k ? `<span class="pill">${esc(q.k.join('、'))}</span>` : ''}${q.d ? `<span>難易度：${esc(q.d)}</span>` : ''}</div>
    <div class="stem">${qHtml(q)}</div>
    ${q.img && !q.o ? '<p class="note" style="margin:0">看圖作答，點選答案：</p>' : ''}
    ${Array.from({length: nOpt}, (_, i) => `<button class="opt" id="o${i}" onclick="answer(${i})"><b>(${L[i]})</b>${q.o ? esc(q.o[i]) : ''}</button>`).join('')}
    <div id="fb"></div></div>
    <div class="acts"><button class="btn g" onclick="quit()">結束這回，看結果</button></div>`;
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
}
function answer(i) {
  if (S.ans) return; S.ans = true;
  const q = S.cur.q, ok = i === q.a;
  document.querySelectorAll('.opt').forEach(b => b.disabled = true);
  $('o' + q.a).classList.add('ok'); if (!ok) $('o' + i).classList.add('no');
  record(q, ok);
  S.log.push({q, pick: i, ok, phase: S.phase});
  let msg = '';
  if (S.phase === 'round') {
    if (ok) S.score++;
    else { const k = q._v + '/' + q._u + '|' + tag(q);
      if (!S.weak[k]) S.weak[k] = {v: q._v, u: q._u, tag: tag(q), streak: 0, st: 'learn', last: 0, wrong: []};
      S.weak[k].wrong.push(q); }
    S.i++;
  } else {
    const c = S.weak[S.cur.k];
    if (ok) { c.streak++; if (c.streak >= NEED) { c.st = 'ok'; msg = `<br>🎉 觀念「${esc(c.tag)}」連續答對 ${NEED} 題，過關！`; } else msg = `<br>再答對 ${NEED - c.streak} 題這個觀念就過關。`; }
    else { c.streak = 0; c.wrong.push(q); msg = '<br>連續答對次數歸零，再來一題類似題。'; }
  }
  const last = S.phase === 'round' && S.i >= S.list.length;
  $('fb').innerHTML = `<div class="fb ${ok ? 'ok' : 'no'}"><strong>${ok ? '答對了！' : '答錯了，正確答案是 (' + L[q.a] + ')'}</strong>${q.e ? '詳解：' + esc(q.e) : ''}${msg}</div>
    <div class="acts"><button class="btn" onclick="next()">${last ? (Object.keys(S.weak).length ? '開始錯題加強 →' : '看結果 →') : '下一題 →'}</button></div>`;
  $('fb').scrollIntoView({behavior: 'smooth', block: 'nearest'});
}
function quit() { if (!S.log.length) { S.active = false; location.hash = '#/s/' + S.s.id; return; } summary(); }

/* ---------- 結果 ---------- */
function summary() {
  S.active = false;
  const W = Object.values(S.weak), okC = W.filter(c => c.st === 'ok'), outC = W.filter(c => c.st !== 'ok');
  const wrongs = S.log.filter(x => !x.ok);
  const answered = S.log.filter(x => x.phase === 'round').length;
  const unitName = c => { const v = vol(S.s, c.v), u = v && v.units.find(x => x.id === c.u); return (v ? v.name + ' ' : '') + (u ? u.name : c.u); };
  const range = [...new Set(S.pairs.map(([v, u]) => v.name + ' ' + u.name))].join('、');
  const txt = W.length ? `我用刷題網練習${S.s.name}（${range}），${S.label} ${answered} 題答對 ${S.score} 題。
答錯過的觀念：
${W.map(c => `・${unitName(c)}／${c.tag}（錯 ${c.wrong.length} 次，${c.st === 'ok' ? '題庫類似題已連對 ' + NEED + ' 題' : '題庫類似題已用完，還沒連對 ' + NEED + ' 題'}）`).join('\n')}
我答錯的題目：
${wrongs.map((x, n) => `${n + 1}. ${x.q.s || ''}${x.q.img ? '（附圖題，題號 ' + x.q.id + '）' : ''}（我選 ${L[x.pick]}，答案 ${L[x.q.a]}）`).join('\n')}
請針對這些觀念出精熟題，用點選作答、答完顯示詳解。` : '';
  crumb(`› <a href="#/s/${S.s.id}">${esc(S.s.name)}</a> › 結果`);
  $('app').innerHTML = `<div class="card"><div class="note">${S.label}成績</div><div class="big">${S.score} / ${answered}</div>
    ${W.length ? `<p>答錯 ${W.length} 個觀念，${okC.length} 個已用題庫類似題練到連對 ${NEED} 題${outC.length ? `，${outC.length} 個還沒過關（類似題用完或中途結束）` : ''}。答錯的題目已放進「錯題本」。</p>` : answered ? '<p>全對！可以再來一回，換別的題目檢查。</p>' : ''}
    <div class="acts"><button class="btn" onclick="again()">再來一回</button><a class="btn g" href="#/s/${S.s.id}" style="text-decoration:none">回單元選擇</a></div></div>
    ${W.length ? `<div class="card"><table><tr><th>單元</th><th>觀念</th><th>錯幾次</th><th>狀態</th></tr>
      ${W.map(c => `<tr><td>${esc(unitName(c))}</td><td>${esc(c.tag)}</td><td>${c.wrong.length}</td><td>${c.st === 'ok' ? '<span class="st-ok">已弄懂</span>' : '<span class="st-w">還沒過關</span>'}</td></tr>`).join('')}</table></div>
    <div class="card"><b>題庫題練完了，請 Claude 出精熟題</b><p class="note" style="margin:4px 0 8px">按「複製」，貼給 Claude（或傳給爸媽），就能針對錯過的觀念出新題目。</p>
      <textarea id="tx" readonly>${esc(txt)}</textarea><div class="acts"><button class="btn" onclick="cp()">複製</button><span id="cpm" class="note"></span></div></div>
    <div class="card"><b>錯題回顧</b>${wrongs.map(x => `<div class="wl">${qHtml(x.q)}
你選 (${L[x.pick]}) ${x.q.o ? esc(x.q.o[x.pick]) : ''}　→　正確 (${L[x.q.a]}) ${x.q.o ? esc(x.q.o[x.q.a]) : ''}${x.q.e ? '\n<span class="note">詳解：' + esc(x.q.e) + '</span>' : ''}</div>`).join('')}</div>` : ''}`;
  scrollTo(0, 0);
}
function again() {
  const s = S.s, sel = store.get(s.id + ':sel', {n: 10});
  if (S.label === '錯題本') return startWrong(s, sel.n || 10);
  startRound(s, S.pairs, sel.n || 10);
}
function cp() {
  const t = $('tx'); t.select();
  const fail = () => $('cpm').textContent = ' 請長按文字框全選後複製';
  try { navigator.clipboard.writeText(t.value).then(() => $('cpm').textContent = ' 已複製！', fail); } catch (e) { fail(); }
}
