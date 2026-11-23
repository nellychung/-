/* 寵物系統：用零用錢買寵物、餵食養大；太久沒餵會離家出走（可花錢找回）
   圖片：img/pets/<種類>_<階段 1~3>.png。還沒有圖的種類先用表情符號代替。 */
const PET = {   // img = 已經有幾個階段的圖（img/pets/<id>_<階段>.jpg）；還沒有的階段先用最後一張圖加光暈
  zichen:   {name: '紫宸', kind: '靈貓',   e: '🐈‍⬛', price: 30,  img: 1},
  shuangli: {name: '霜璃', kind: '九尾狐', e: '🦊', price: 50,  img: 1},
  xueling:  {name: '雪翎', kind: '靈鹿',   e: '🦌', price: 80,  img: 1},
  yanhuang: {name: '焰凰', kind: '火鳳',   e: '🦚', price: 120, img: 1},
  yejin:    {name: '夜燼', kind: '幽龍',   e: '🐉', price: 150, img: 1},
  cangming: {name: '滄溟', kind: '水龍',   e: '🐲', price: 200, img: 1}
};
const OLD_PET = {crane: 'xueling', fox: 'shuangli', panda: 'zichen', turtle: 'cangming', tiger: 'xueling', qilin: 'xueling', phoenix: 'yanhuang', dragon: 'yejin'};
const PET_IDS = Object.keys(PET);
const FOOD = [
  {id: 'snack', name: '飯糰', e: '🍙', price: 3,  full: 30,  grow: 10, desc: '飽足 +30、成長 +10'},
  {id: 'meal',  name: '大餐', e: '🍖', price: 8,  full: 100, grow: 30, desc: '吃飽飽、成長 +30'},
  {id: 'fruit', name: '靈果', e: '🍑', price: 15, full: 100, grow: 80, desc: '吃飽飽、成長 +80'}
];
/* 配備：每隻寵物各自購買，買了就一直有效 */
const GEAR = [
  {id: 'bell',  name: '鈴鐺項圈', e: '🔔', price: 20,  desc: '肚子餓得比較慢（飽足度少掉的速度 −30%）'},
  {id: 'jade',  name: '修練玉珮', e: '🪬', price: 40,  desc: '陪你修練時，答對一題成長 ×2'},
  {id: 'charm', name: '護身符',   e: '🧧', price: 60,  desc: '餓到 0 之後多撐 3 天才會離家出走'},
  {id: 'cape',  name: '仙羽披風', e: '✨', price: 100, desc: '金色光環，超帥（純外觀）'}
];
/* 家長可以在家長專區改價錢 */
const priceOf = (id, base) => { const c = store.get('shopcfg', {}); return c[id] >= 0 && c[id] !== '' && c[id] != null ? +c[id] : base; };
const petPrice = id => priceOf('pet_' + id, PET[id].price);
const foodPrice = f => priceOf('food_' + f.id, f.price);
const gearPrice = g => priceOf('gear_' + g.id, g.price);
const hasGear = (p, g) => (p.gear || []).includes(g);
const STAGES = [[0, '幼崽'], [100, '成長期'], [300, '完全體']];
const DECAY = 25;        // 每天少多少飽足度（100 → 0 約 4 天）
const RUN_DAYS = 3;      // 餓到 0 之後再過幾天會離家出走
const DAY = 864e5;

const pets = () => { const d = Object.assign({list: [], active: ''}, store.get('pets', {}));
  d.list.forEach(p => { if (!PET[p.sp]) { p.sp = OLD_PET[p.sp] || 'zichen'; } }); return d; };
const savePets = d => store.set('pets', d);
const decayOf = p => DECAY * (hasGear(p, 'bell') ? .7 : 1);
const runDays = p => RUN_DAYS + (hasGear(p, 'charm') ? 3 : 0);
const runAt = p => p.fed + (p.full / decayOf(p) + runDays(p)) * DAY;
const fullNow = p => Math.max(0, Math.round(p.full - decayOf(p) * (Date.now() - p.fed) / DAY));
const stageOf = p => STAGES.filter(s => (p.grow || 0) >= s[0]).length;           // 1~3
const stageName = p => STAGES[stageOf(p) - 1][1];
const nextStage = p => STAGES[stageOf(p)];                                        // undefined = 已是完全體
const daysLeft = p => Math.max(0, Math.ceil((runAt(p) - Date.now()) / DAY));
function mood(p) {
  if (p.away) return ['💨', '離家出走了'];
  const f = fullNow(p);
  return f >= 60 ? ['😊', '很開心'] : f >= 25 ? ['🙂', '還不錯'] : f > 0 ? ['😟', '肚子餓了'] : ['😭', `餓壞了！再 ${daysLeft(p)} 天沒吃東西就會離家出走`];
}
function petArt(p, cls = '') {
  const sp = PET[p.sp], st = stageOf(p), m = mood(p)[0];
  const sad = (!p.away && p.fed && fullNow(p) < 25 ? ' sad' : '') + (hasGear(p, 'cape') ? ' cape' : '');
  if (sp.img) return `<span class="pet pic st${st} ${cls}${sad}"><img src="img/pets/${p.sp}_${Math.min(st, sp.img)}.jpg" alt="${esc(sp.name)}"><i>${m}</i></span>`;
  return `<span class="pet emo st${st} ${cls}${sad}">${sp.e}<i>${m}</i></span>`;
}
/* 打開網頁時檢查有沒有寵物離家出走 */
function checkPets() {
  const d = pets(); let gone = [];
  d.list.forEach(p => { if (!p.away && Date.now() > runAt(p)) { p.away = true; p.awayAt = Date.now(); gone.push(p); } });
  if (gone.length) { if (gone.some(p => p.uid === d.active)) d.active = (d.list.find(p => !p.away) || {}).uid || ''; savePets(d); }
  return gone;
}
const activePet = () => { const d = pets(); return d.list.find(p => p.uid === d.active && !p.away) || null; };
function petGrow(n) {  // 答對題目時，陪你修練的寵物也會成長
  const d = pets(), p = d.list.find(x => x.uid === d.active && !x.away); if (!p) return null;
  const before = stageOf(p); p.grow = (p.grow || 0) + n * (hasGear(p, 'jade') ? 2 : 1); savePets(d);
  return stageOf(p) > before ? p : null;
}
function spend(amt, what) {
  const m = money(), sm = moneySum(m);
  if (sm.bal < amt) return false;
  m.spent = m.spent || []; m.spent.push({d: today(), amt, what}); saveMoney(m); hud();
  return true;
}

/* ---------- 寵物園頁面 ---------- */
function petPage(msg) {
  crumb('› 🐾 寵物園'); checkPets();
  const d = pets(), bal = moneySum(money()).bal, act = activePet();
  const home = d.list.filter(p => !p.away), away = d.list.filter(p => p.away);
  const card = p => {
    const f = fullNow(p), [me, mt] = mood(p), nx = nextStage(p);
    return `<div class="pcard ${p.uid === d.active ? 'on' : ''}">
      <div class="part">${petArt(p)}</div>
      <div class="pinfo">
        <div class="pname2"><b>${esc(p.name)}</b> <small>${PET[p.sp].kind}・${stageName(p)}</small></div>
        <div class="note">${me} ${mt}</div>
        <div class="bar2"><span>飽足</span><span class="meter"><i style="width:${f}%" class="${f < 25 ? 'low' : ''}"></i></span><em>${f}</em></div>
        <div class="bar2"><span>成長</span><span class="meter g"><i style="width:${nx ? Math.min(100, (p.grow || 0) / nx[0] * 100) : 100}%"></i></span><em>${nx ? `${p.grow || 0}/${nx[0]}` : '完全體'}</em></div>
        ${(p.gear || []).length ? `<div class="gears">${GEAR.filter(g => hasGear(p, g.id)).map(g => `<span title="${esc(g.desc)}">${g.e} ${g.name}</span>`).join('')}</div>` : ''}
        <div class="pacts">${FOOD.map(fd => `<button class="btn sm" onclick="feed('${p.uid}','${fd.id}')" ${bal < foodPrice(fd) ? 'disabled' : ''} title="${fd.desc}">${fd.e} ${fd.name} ${foodPrice(fd)}元</button>`).join('')}
          <button class="btn sm gold" onclick="gearShop('${p.uid}')">🛡️ 配備</button>
          ${p.uid === d.active ? '<span class="tagon">⭐ 陪你修練中</span>' : `<button class="btn sm ghost" onclick="setActive('${p.uid}')">⭐ 帶去修練</button>`}
          <button class="btn sm ghost" onclick="renamePet('${p.uid}')">✏️ 取名</button></div>
      </div></div>`;
  };
  $('app').innerHTML = `
  ${msg ? `<div class="panel pmsg">${msg}</div>` : ''}
  <div class="panel"><div class="lvtag">🐾 寵物園</div>
    <p class="note">用零用錢買寵物、餵牠吃東西。帶著寵物去修練，每答對一題牠也會長大一點，長大會變身！<br>
    每天飽足度會少 ${DECAY}，餓到 0 之後再 ${RUN_DAYS} 天沒餵，寵物就會<b>離家出走</b>。可以幫寵物買配備（項圈、玉珮、護身符、披風）。</p>
    <div class="menu">${FOOD.map(f => `<span>${f.e} ${f.name} <b>${foodPrice(f)}元</b><small>${f.desc}</small></span>`).join('')}</div>
    <div class="wallet">💰 可用零用錢 <b>NT$ ${bal}</b> <a href="#/money">看存摺 / 申請提現 →</a></div>
  </div>
  ${home.length ? `<div class="lbl">🏡 我的寵物</div>${home.map(card).join('')}` : ''}
  ${away.length ? `<div class="lbl">💨 離家出走的寵物</div><div class="shop">${away.map(p => { const c = Math.ceil(petPrice(p.sp) / 2); return `<div class="sitem away">${petArt(p)}<b>${esc(p.name)}</b><small>${PET[p.sp].kind}</small>
      <button class="btn sm gold" onclick="findPet('${p.uid}')" ${bal < c ? 'disabled' : ''}>🔍 找回來 ${c}元</button></div>`; }).join('')}</div>` : ''}
  <div class="lbl">🏪 寵物商店</div>
  <div class="shop">${PET_IDS.map(id => { const sp = PET[id], own = d.list.filter(p => p.sp === id).length;
    return `<div class="sitem">${petArt({sp: id, grow: 0, full: 100, fed: Date.now()})}<b>${sp.name}</b><small>${sp.kind}・NT$ ${petPrice(id)}${own ? `・已有 ${own} 隻` : ''}</small>
      <button class="btn sm gold" onclick="buyPet('${id}')" ${bal < petPrice(id) ? 'disabled' : ''}>購買</button></div>`; }).join('')}</div>
  <div class="acts"><a class="btn ghost" href="#/">⬅ 回首頁</a></div>`;
  scrollTo(0, 0);
}
function buyPet(id) {
  const sp = PET[id];
  const pr = petPrice(id);
  if (!confirm(`要花 ${pr} 元買一隻${sp.name}嗎？`)) return;
  if (!spend(pr, '買寵物：' + sp.name)) return petPage('💸 零用錢不夠喔，再去修練賺一點吧！');
  const d = pets(), p = {uid: 'p' + Date.now().toString(36), sp: id, name: sp.name, born: Date.now(), fed: Date.now(), full: 80, grow: 0, away: false};
  d.list.push(p); if (!activePet()) d.active = p.uid; savePets(d);
  SFX.lvup(); confetti(); petPage(`🎉 歡迎新夥伴「${esc(sp.name)}」！記得幫牠取名字、按時餵牠。`);
}
function feed(uid, fid) {
  const fd = FOOD.find(f => f.id === fid), d = pets(), p = d.list.find(x => x.uid === uid);
  if (!p || !spend(foodPrice(fd), `餵${p.name}：${fd.name}`)) return petPage('💸 零用錢不夠喔！');
  const before = stageOf(p);
  p.full = Math.min(100, fullNow(p) + fd.full); p.fed = Date.now(); p.grow = (p.grow || 0) + fd.grow; savePets(d);
  SFX.hit();
  petPage(stageOf(p) > before ? `✨ ${esc(p.name)} 長大了，變成「${stageName(p)}」！` : `${fd.e} ${esc(p.name)} 吃得好開心！`);
}
function findPet(uid) {
  const d = pets(), p = d.list.find(x => x.uid === uid), c = Math.ceil(petPrice(p.sp) / 2);
  if (!confirm(`花 ${c} 元請人把「${p.name}」找回來？`)) return;
  if (!spend(c, '找回寵物：' + p.name)) return petPage('💸 零用錢不夠喔！');
  p.away = false; p.full = 50; p.fed = Date.now(); if (!activePet()) d.active = p.uid; savePets(d);
  petPage(`🏡 ${esc(p.name)} 回家了！這次要記得常常餵牠喔。`);
}
function setActive(uid) { const d = pets(); d.active = uid; savePets(d); petPage(); }
function renamePet(uid) {
  const d = pets(), p = d.list.find(x => x.uid === uid);
  const n = prompt('幫寵物取個名字（最多 8 個字）', p.name);
  if (n && n.trim()) { p.name = n.trim().slice(0, 8); savePets(d); }
  petPage();
}

function gearShop(uid) {
  const d = pets(), p = d.list.find(x => x.uid === uid), bal = moneySum(money()).bal;
  const box = document.createElement('div'); box.className = 'modal';
  box.innerHTML = `<div class="mbox gearbox"><div class="lvtag">🛡️ ${esc(p.name)} 的配備</div><p class="note">可用零用錢 NT$ ${bal}　配備買了就一直有效</p>
    ${GEAR.map(g => `<div class="arow"><span><b>${g.e} ${g.name}</b><br><small class="note">${g.desc}</small></span>
      ${hasGear(p, g.id) ? '<span class="tagon">✅ 已裝備</span>' : `<button class="btn sm gold" data-g="${g.id}" ${bal < gearPrice(g) ? 'disabled' : ''}>${gearPrice(g)} 元</button>`}</div>`).join('')}
    <button class="btn" onclick="this.closest('.modal').remove()">關閉</button></div>`;
  box.onclick = e => { if (e.target === box) box.remove(); };
  box.querySelectorAll('[data-g]').forEach(b => b.onclick = () => {
    const g = GEAR.find(x => x.id === b.dataset.g), pr = gearPrice(g);
    if (!confirm(`花 ${pr} 元幫${p.name}買「${g.name}」？`)) return;
    if (!spend(pr, `${p.name}的配備：${g.name}`)) { box.remove(); return petPage('💸 零用錢不夠喔！'); }
    const dd = pets(), pp = dd.list.find(x => x.uid === uid);
    if (pp.gear === undefined || !Array.isArray(pp.gear)) pp.gear = [];
    if (g.id === 'bell' || g.id === 'charm') { pp.full = fullNow(pp); pp.fed = Date.now(); }  // 從現在開始用新的速度計算
    pp.gear.push(g.id); savePets(dd); SFX.lvup(); box.remove(); petPage(`${g.e} ${esc(pp.name)} 裝上了「${g.name}」！`);
  });
  document.body.appendChild(box);
}
/* 家長專區：價錢設定 */
function priceEditor() {
  const row = (k, label, base) => `<label class="arow"><span>${label}</span><input type="number" min="0" data-k="${k}" value="${priceOf(k, base)}"></label>`;
  return `<div class="lbl" style="margin-top:0">🏪 寵物商店價錢</div>
    ${PET_IDS.map(id => row('pet_' + id, `${PET[id].name}（${PET[id].kind}）`, PET[id].price)).join('')}
    ${FOOD.map(f => row('food_' + f.id, `${f.e} ${f.name}`, f.price)).join('')}
    ${GEAR.map(g => row('gear_' + g.id, `${g.e} ${g.name}`, g.price)).join('')}
    <button class="btn gold" id="psave">儲存價錢</button> <button class="btn ghost" id="preset">恢復預設</button>`;
}
function bindPriceEditor(box, msg) {
  box.querySelector('#psave').onclick = () => {
    const c = {}; box.querySelectorAll('[data-k]').forEach(i => { const v = parseInt(i.value); if (v >= 0) c[i.dataset.k] = v; });
    store.set('shopcfg', c); msg('✅ 價錢已儲存');
  };
  box.querySelector('#preset').onclick = () => { store.set('shopcfg', {}); box.remove(); moneyAdmin(); };
}
