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
const CHAR_IDS = Object.keys(CHARS);
function tierAura(lv) { return lv >= 20 ? '#f472b6' : lv >= 12 ? '#fbbf24' : lv >= 8 ? '#e2e8f0' : lv >= 5 ? '#f59e0b' : '#60a5fa'; }
function charSVG(id, opt = {}) {
  const c = CHARS[id] || CHARS.qingyi, src = 'img/chars/' + (CHARS[id] ? id : 'qingyi') + '.png';
  if (opt.head) return `<img class="char head" src="${src.replace('.png', '_head.png')}" alt="${c.name}">`;
  const a = opt.aura || '#60a5fa';
  return `<img class="char" src="${src}" alt="${c.name}" style="filter:drop-shadow(0 0 .35rem ${a}) drop-shadow(0 .3rem 0 #0006)">`;
}
