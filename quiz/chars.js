/* 武俠角色（圖片：img/chars/<id>.png，透明背景） */
const CHARS = {
  qingyi:   {name: '青衣劍俠',   cls: '劍客'},
  shusheng: {name: '白衣書生',   cls: '扇客'},
  emei:     {name: '峨嵋女弟子', cls: '笛仙'},
  shaolin:  {name: '少林小和尚', cls: '棍僧'},
  daoke:    {name: '紅衣刀客',   cls: '刀客'},
  tangmen:  {name: '唐門暗器手', cls: '暗器'},
  tianshan: {name: '天山琴師',   cls: '琴師'},
  gaibang:  {name: '丐幫少俠',   cls: '棒法'}
};
Object.keys(CHARS).forEach(k => { CHARS[k].sex = 'f'; CHARS[k + '_m'] = {name: CHARS[k].name.replace('女弟子', '弟子'), cls: CHARS[k].cls, sex: 'm', base: k}; });
const CHAR_IDS = Object.keys(CHARS);
function tierAura(lv) { return lv >= 20 ? '#f472b6' : lv >= 12 ? '#fbbf24' : lv >= 8 ? '#e2e8f0' : lv >= 5 ? '#f59e0b' : '#60a5fa'; }
function charSVG(id, opt = {}) {
  const c = CHARS[id] || CHARS.qingyi, src = 'img/chars/' + (CHARS[id] ? id : 'qingyi') + '.png';
  if (opt.head) return `<img class="char head" src="${src.replace('.png', '_head.png')}" alt="${c.name}">`;
  const a = opt.aura || '#60a5fa';
  return `<img class="char" src="${src}" alt="${c.name}" style="filter:drop-shadow(0 0 .35rem ${a}) drop-shadow(0 .3rem 0 #0006)">`;
}

/* ---------- 每位俠客專屬的背景特效 ---------- */
const FX = {
  qingyi:   {name: '紅梅飄落', items: ['🌸'],                 mode: 'fall',    n: 12, cls: 'red'},
  shusheng: {name: '墨字書香', items: ['詩', '書', '墨', '雅', '風', '月', '文'], mode: 'rise', n: 9, cls: 'ink'},
  emei:     {name: '紫蝶飛舞', items: ['🦋'],                 mode: 'flutter', n: 6,  cls: 'bfly2'},
  shaolin:  {name: '金色佛光', items: ['✦', '●', '•'],        mode: 'rise',    n: 18, cls: 'gold'},
  daoke:    {name: '刀光火星', items: ['●', '•', '•'],        mode: 'ember',   n: 22, cls: 'ember'},
  tangmen:  {name: '暗器飛鏢', items: ['✦', '✧', '✴'],        mode: 'dart',    n: 7,  cls: 'dart'},
  tianshan: {name: '天山飛雪', items: ['❄', '❅', '❆', '❄', '🎵'], mode: 'fall', n: 16, cls: 'snow'},
  gaibang:  {name: '竹林葉落', items: ['🍃'],                 mode: 'fall',    n: 11, cls: 'leaf'}
};
function fxInit(id) {
  let box = document.getElementById('fx');
  if (!box) { box = document.createElement('div'); box.id = 'fx'; document.body.prepend(box); }
  const f = fxOf(id), R = (a, b) => a + Math.random() * (b - a);
  box.className = 'fx-' + f.mode;
  let h = '';
  for (let i = 0; i < f.n; i++) {
    const it = f.items[i % f.items.length], dur = {fall: R(10, 18), rise: R(9, 16), ember: R(4, 8), flutter: R(14, 22), dart: R(9, 15)}[f.mode];
    const pos = f.mode === 'dart' ? `top:${R(8, 85)}%;left:-5%` : f.mode === 'flutter' ? `left:${R(3, 92)}%;top:${R(20, 85)}%` : `left:${R(0, 98)}%`;
    h += `<span class="fx ${f.cls}" style="${pos};font-size:${R(.7, 1.5).toFixed(2)}rem;animation-duration:${dur.toFixed(1)}s;animation-delay:-${R(0, dur).toFixed(1)}s;--dx:${R(-12, 12).toFixed(1)}vw;--r:${R(180, 540).toFixed(0)}deg">${it}</span>`;
  }
  box.innerHTML = h;
}

const fxOf = id => FX[id] || FX[(CHARS[id] || {}).base] || FX.emei;
