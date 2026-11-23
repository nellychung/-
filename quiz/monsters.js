/* 原創奇幻怪物（SVG 繪製，跟角色同一種畫風：漸層、金邊、發光眼睛） */
let _mid = 0;
const MON = {
  slime:  {name: '毒液史萊姆', c1: '#86efac', c2: '#15803d', eye: '#fef08a'},
  ghost:  {name: '怨靈幽魂',   c1: '#c4b5fd', c2: '#5b21b6', eye: '#22d3ee'},
  bat:    {name: '暗影蝙蝠',   c1: '#6d28d9', c2: '#1e1b4b', eye: '#f43f5e'},
  skull:  {name: '骷髏戰士',   c1: '#f5f5f4', c2: '#a8a29e', eye: '#38bdf8'},
  goblin: {name: '哥布林盜賊', c1: '#a3e635', c2: '#3f6212', eye: '#fde047'},
  wolf:   {name: '月夜魔狼',   c1: '#94a3b8', c2: '#1e293b', eye: '#fbbf24'},
  golem:  {name: '岩石巨像',   c1: '#a8a29e', c2: '#44403c', eye: '#f97316'},
  shroom: {name: '劇毒菇怪',   c1: '#f472b6', c2: '#9d174d', eye: '#fef9c3'},
  knight: {name: '黑暗騎士',   c1: '#475569', c2: '#0f172a', eye: '#ef4444'},
  eye:    {name: '深淵魔眼',   c1: '#fb7185', c2: '#7f1d1d', eye: '#a3e635'},
  dragon: {name: '錯題魔龍',   c1: '#dc2626', c2: '#450a0a', eye: '#fde047', boss: true},
  demon:  {name: '迷思魔王',   c1: '#7c3aed', c2: '#2e1065', eye: '#f43f5e', boss: true}
};
const MON_IDS = Object.keys(MON).filter(k => !MON[k].boss);
const MINI_IDS = ['ghost', 'slime', 'bat', 'eye', 'shroom', 'goblin', 'skull', 'wolf'];
/* 觀念怪：同一種怪換顏色 */
const MINI_TINT = [['#fda4af', '#9f1239'], ['#fdba74', '#9a3412'], ['#93c5fd', '#1e3a8a'], ['#f0abfc', '#86198f'], ['#5eead4', '#115e59'], ['#fde68a', '#92400e']];

function monSVG(id, opt = {}) {
  const m = MON[id] || MON.slime, u = 'm' + (++_mid);
  const c1 = opt.c1 || m.c1, c2 = opt.c2 || m.c2, e = m.eye, gold = '#fbbf24';
  const eyes = (x1, x2, y, r = 7, slant = 1) => `<g>
    <path d="M${x1 - r - 3} ${y - r - 2 * slant} L${x1 + r} ${y - r + 3 * slant}" stroke="#0b0b10" stroke-width="4" stroke-linecap="round"/>
    <path d="M${x2 + r + 3} ${y - r - 2 * slant} L${x2 - r} ${y - r + 3 * slant}" stroke="#0b0b10" stroke-width="4" stroke-linecap="round"/>
    <circle cx="${x1}" cy="${y}" r="${r + 4}" fill="${e}" opacity=".35"/><circle cx="${x2}" cy="${y}" r="${r + 4}" fill="${e}" opacity=".35"/>
    <ellipse cx="${x1}" cy="${y}" rx="${r}" ry="${r * .85}" fill="url(#${u}e)"/><ellipse cx="${x2}" cy="${y}" rx="${r}" ry="${r * .85}" fill="url(#${u}e)"/>
    <ellipse cx="${x1}" cy="${y}" rx="${r * .3}" ry="${r * .7}" fill="#0b0b10"/><ellipse cx="${x2}" cy="${y}" rx="${r * .3}" ry="${r * .7}" fill="#0b0b10"/>
    <circle cx="${x1 - r * .35}" cy="${y - r * .35}" r="${r * .25}" fill="#fff"/><circle cx="${x2 - r * .35}" cy="${y - r * .35}" r="${r * .25}" fill="#fff"/></g>`;
  const fangs = (x, y, w = 30) => `<path d="M${x - w / 2} ${y} Q${x} ${y + 14} ${x + w / 2} ${y}" fill="#3b0712" stroke="#0b0b10" stroke-width="2"/><path d="M${x - w / 2 + 5} ${y + 1} l4 9 l4 -8 M${x + w / 2 - 13} ${y + 1} l4 9 l4 -9" fill="#fff"/>`;
  const B = {
    slime: `<path d="M30 168 Q24 112 62 80 Q84 40 100 30 Q116 40 138 80 Q176 112 170 168 Q150 178 136 170 Q120 182 100 172 Q80 182 64 170 Q48 178 30 168 Z" fill="url(#${u}b)" stroke="${c2}" stroke-width="3"/>
      <path d="M62 86 Q78 60 96 46" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="7" stroke-linecap="round"/><circle cx="140" cy="120" r="6" fill="#fff" opacity=".4"/>
      <path d="M80 34 L88 18 L100 28 L112 18 L120 34 Z" fill="${gold}" stroke="#92400e" stroke-width="2"/><circle cx="100" cy="27" r="3" fill="#f43f5e"/>
      ${eyes(80, 120, 110, 10)}${fangs(100, 138, 36)}`,
    ghost: `<path d="M40 176 L40 92 Q40 30 100 28 Q160 30 160 92 L160 176 L144 160 L128 178 L112 160 L100 178 L88 160 L72 178 L56 160 Z" fill="url(#${u}b)" stroke="${c2}" stroke-width="3" opacity=".95"/>
      <path d="M40 120 Q16 110 20 84 Q34 100 42 98 M160 120 Q184 110 180 84 Q166 100 158 98" fill="url(#${u}b)" stroke="${c2}" stroke-width="2"/>
      <path d="M44 150 q16 8 30 0 q16 8 30 0 q16 8 30 0 q12 6 22 0" fill="none" stroke="${gold}" stroke-width="3" stroke-dasharray="7 5"/>
      <path d="M70 56 Q90 40 110 44" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="5" stroke-linecap="round"/>
      ${eyes(78, 122, 94, 11)}<ellipse cx="100" cy="128" rx="13" ry="16" fill="#1e1b4b"/>`,
    bat: `<path d="M100 80 Q60 40 10 60 Q30 76 24 96 Q40 88 50 104 Q60 92 74 108 Z M100 80 Q140 40 190 60 Q170 76 176 96 Q160 88 150 104 Q140 92 126 108 Z" fill="url(#${u}b)" stroke="${gold}" stroke-width="2"/>
      <path d="M30 66 L50 100 M54 58 L64 104 M170 66 L150 100 M146 58 L136 104" stroke="${c2}" stroke-width="2"/>
      <ellipse cx="100" cy="112" rx="40" ry="44" fill="url(#${u}b)" stroke="${c2}" stroke-width="3"/>
      <path d="M68 82 L62 46 L84 74 Z M132 82 L138 46 L116 74 Z" fill="url(#${u}b)" stroke="${gold}" stroke-width="2"/>
      ${eyes(84, 116, 104, 9)}${fangs(100, 128, 26)}<path d="M84 160 L80 176 M116 160 L120 176" stroke="${c2}" stroke-width="5" stroke-linecap="round"/>`,
    skull: `<path d="M150 70 L176 22 L182 26 L158 76 Z" fill="url(#${u}s)" stroke="#475569"/><rect x="146" y="70" width="22" height="6" rx="2" fill="${gold}" transform="rotate(25 157 73)"/>
      <path d="M58 120 L142 120 L150 176 L50 176 Z" fill="#334155" stroke="${gold}" stroke-width="2"/><path d="M70 132 H130 M68 146 H132 M66 160 H134" stroke="${c2}" stroke-width="5" stroke-linecap="round"/>
      <path d="M56 86 Q56 34 100 32 Q144 34 144 86 Q144 106 128 112 L126 128 L74 128 L72 112 Q56 106 56 86 Z" fill="url(#${u}b)" stroke="#57534e" stroke-width="3"/>
      <path d="M52 66 Q52 22 100 20 Q148 22 148 66 L136 62 Q120 40 100 40 Q80 40 64 62 Z" fill="#1e293b" stroke="${gold}" stroke-width="3"/><path d="M100 20 L100 4" stroke="#dc2626" stroke-width="6" stroke-linecap="round"/>
      <path d="M68 76 Q82 70 92 84 Q86 100 72 96 Q64 88 68 76 Z M132 76 Q118 70 108 84 Q114 100 128 96 Q136 88 132 76 Z" fill="#0b0b10"/>
      <circle cx="80" cy="86" r="5" fill="${e}"/><circle cx="120" cy="86" r="5" fill="${e}"/><circle cx="80" cy="86" r="10" fill="${e}" opacity=".3"/><circle cx="120" cy="86" r="10" fill="${e}" opacity=".3"/>
      <path d="M96 100 L100 92 L104 100 Z" fill="#0b0b10"/><path d="M80 116 V126 M90 116 V128 M100 116 V128 M110 116 V128 M120 116 V126" stroke="#57534e" stroke-width="2"/>`,
    goblin: `<path d="M150 120 L178 70 L184 74 L158 126 Z" fill="url(#${u}s)"/><rect x="146" y="120" width="18" height="6" rx="2" fill="${gold}" transform="rotate(30 155 123)"/>
      <path d="M60 130 Q60 176 100 178 Q140 176 140 130 Z" fill="#78350f" stroke="${gold}" stroke-width="2"/>
      <path d="M50 84 L8 60 L40 100 Z M150 84 L192 60 L160 100 Z" fill="url(#${u}b)" stroke="${c2}" stroke-width="3"/>
      <ellipse cx="100" cy="92" rx="52" ry="48" fill="url(#${u}b)" stroke="${c2}" stroke-width="3"/>
      <path d="M48 76 Q60 30 100 32 Q140 30 152 76 Q130 58 100 60 Q70 58 48 76 Z" fill="#7f1d1d" stroke="${gold}" stroke-width="2"/>
      ${eyes(80, 120, 88, 9)}<path d="M96 100 Q100 112 104 100" fill="none" stroke="${c2}" stroke-width="3"/>${fangs(100, 116, 40)}`,
    wolf: `<path d="M44 70 L36 14 L80 52 Z M156 70 L164 14 L120 52 Z" fill="url(#${u}b)" stroke="${gold}" stroke-width="2"/><path d="M50 58 L46 30 L68 52 Z M150 58 L154 30 L132 52 Z" fill="#fda4af"/>
      <path d="M100 44 Q150 44 160 92 Q166 130 140 140 L128 176 L100 160 L72 176 L60 140 Q34 130 40 92 Q50 44 100 44 Z" fill="url(#${u}b)" stroke="${c2}" stroke-width="3"/>
      <path d="M70 120 Q100 108 130 120 L122 160 Q100 170 78 160 Z" fill="#e2e8f0"/><ellipse cx="100" cy="124" rx="12" ry="8" fill="#0b0b10"/>
      ${eyes(76, 124, 92, 9)}${fangs(100, 142, 34)}<path d="M64 60 Q100 40 136 60" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="4"/>`,
    golem: `<path d="M24 120 Q20 84 46 80 L62 96 L56 150 Q34 156 24 140 Z M176 120 Q180 84 154 80 L138 96 L144 150 Q166 156 176 140 Z" fill="url(#${u}b)" stroke="${c2}" stroke-width="3"/>
      <path d="M52 70 L148 70 L160 120 L140 176 L60 176 L40 120 Z" fill="url(#${u}b)" stroke="${c2}" stroke-width="3"/>
      <path d="M70 26 L130 26 L142 70 L58 70 Z" fill="url(#${u}b)" stroke="${c2}" stroke-width="3"/>
      <path d="M70 110 L90 120 L80 140 M130 110 L112 128 L124 150 M96 150 L104 166" fill="none" stroke="${e}" stroke-width="3" stroke-linecap="round"/>
      <circle cx="100" cy="120" r="12" fill="${e}" opacity=".4"/><path d="M100 110 l8 10 l-8 10 l-8 -10z" fill="${e}"/>
      <rect x="74" y="42" width="18" height="10" rx="2" fill="${e}"/><rect x="108" y="42" width="18" height="10" rx="2" fill="${e}"/><rect x="70" y="38" width="26" height="18" fill="${e}" opacity=".3"/><rect x="104" y="38" width="26" height="18" fill="${e}" opacity=".3"/>
      <path d="M60 30 l10 -10 M140 30 l-10 -10" stroke="#57534e" stroke-width="4"/>`,
    shroom: `<path d="M72 106 L128 106 Q136 150 130 176 L70 176 Q64 150 72 106 Z" fill="#fef3c7" stroke="#a16207" stroke-width="3"/>
      <path d="M20 108 Q20 30 100 26 Q180 30 180 108 Q140 118 100 112 Q60 118 20 108 Z" fill="url(#${u}b)" stroke="${c2}" stroke-width="3"/>
      <circle cx="60" cy="70" r="12" fill="#fff" opacity=".85"/><circle cx="104" cy="50" r="9" fill="#fff" opacity=".85"/><circle cx="146" cy="76" r="13" fill="#fff" opacity=".85"/><circle cx="90" cy="88" r="6" fill="#fff" opacity=".85"/>
      ${eyes(86, 114, 134, 7)}${fangs(100, 154, 24)}<path d="M40 100 Q38 80 50 60" stroke="#fff" stroke-opacity=".4" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    knight: `<path d="M40 70 L60 120 L60 176 L140 176 L140 120 L160 70 Z" fill="#7f1d1d" stroke="${gold}" stroke-width="2"/>
      <path d="M50 120 Q50 100 70 100 L130 100 Q150 100 150 120 L146 176 L54 176 Z" fill="url(#${u}b)" stroke="${gold}" stroke-width="2.5"/>
      <path d="M100 104 L100 176 M66 130 Q100 150 134 130" stroke="${gold}" stroke-width="2.5" fill="none"/>
      <ellipse cx="54" cy="112" rx="20" ry="14" fill="url(#${u}b)" stroke="${gold}" stroke-width="2.5"/><ellipse cx="146" cy="112" rx="20" ry="14" fill="url(#${u}b)" stroke="${gold}" stroke-width="2.5"/>
      <path d="M64 92 Q60 30 100 26 Q140 30 136 92 Q118 104 100 104 Q82 104 64 92 Z" fill="url(#${u}b)" stroke="${gold}" stroke-width="3"/>
      <path d="M100 26 Q96 8 112 0 Q108 16 118 24" fill="#dc2626"/><path d="M72 64 L128 64 L124 74 L76 74 Z" fill="#0b0b10"/>
      <circle cx="88" cy="69" r="4" fill="${e}"/><circle cx="112" cy="69" r="4" fill="${e}"/><rect x="70" y="60" width="60" height="18" fill="${e}" opacity=".25"/><path d="M100 76 L100 100" stroke="${gold}" stroke-width="2"/>`,
    eye: `<path d="M60 150 Q50 178 30 186 M80 158 Q78 184 64 196 M120 158 Q122 184 136 196 M140 150 Q150 178 170 186" stroke="url(#${u}b)" stroke-width="10" fill="none" stroke-linecap="round"/>
      <circle cx="100" cy="100" r="66" fill="url(#${u}b)" stroke="${c2}" stroke-width="3"/>
      <path d="M44 70 L28 40 L60 58 Z M156 70 L172 40 L140 58 Z M100 34 L100 8 L112 34 Z" fill="${gold}" stroke="#92400e"/>
      <ellipse cx="100" cy="100" rx="44" ry="34" fill="#fff"/><circle cx="100" cy="100" r="26" fill="url(#${u}e)"/><ellipse cx="100" cy="100" rx="8" ry="20" fill="#0b0b10"/>
      <circle cx="90" cy="88" r="7" fill="#fff"/><path d="M56 84 Q100 56 144 84" stroke="${c2}" stroke-width="6" fill="none"/>`,
    dragon: `<path d="M30 60 Q10 20 40 6 Q34 34 54 50 Z M170 60 Q190 20 160 6 Q166 34 146 50 Z" fill="#1c1917" stroke="${gold}" stroke-width="2.5"/>
      <path d="M20 110 L2 96 L18 128 Z M180 110 L198 96 L182 128 Z" fill="url(#${u}b)" stroke="${gold}" stroke-width="2"/>
      <path d="M100 30 Q160 30 176 90 Q184 130 160 150 L150 182 L100 166 L50 182 L40 150 Q16 130 24 90 Q40 30 100 30 Z" fill="url(#${u}b)" stroke="${c2}" stroke-width="3"/>
      <path d="M60 128 Q100 112 140 128 L134 170 Q100 182 66 170 Z" fill="#fca5a5" opacity=".9"/><path d="M70 140 H130 M72 154 H128" stroke="${c2}" stroke-width="2"/>
      <path d="M84 40 L100 24 L116 40 L100 60 Z" fill="${gold}"/><circle cx="100" cy="42" r="5" fill="#22d3ee"/>
      ${eyes(70, 130, 92, 12)}<circle cx="88" cy="128" r="4" fill="#0b0b10"/><circle cx="112" cy="128" r="4" fill="#0b0b10"/>${fangs(100, 150, 50)}`,
    demon: `<path d="M50 60 Q20 20 40 0 Q46 36 70 50 Z M150 60 Q180 20 160 0 Q154 36 130 50 Z" fill="#1c1917" stroke="${gold}" stroke-width="2.5"/>
      <path d="M30 150 Q0 120 16 80 Q30 120 56 126 Z M170 150 Q200 120 184 80 Q170 120 144 126 Z" fill="url(#${u}b)" stroke="${gold}" stroke-width="2"/>
      <path d="M48 140 L152 140 L160 190 L40 190 Z" fill="#1e1b4b" stroke="${gold}" stroke-width="2"/>
      <path d="M100 34 Q150 34 154 92 Q154 140 100 146 Q46 140 46 92 Q50 34 100 34 Z" fill="url(#${u}b)" stroke="${c2}" stroke-width="3"/>
      <path d="M62 50 L70 30 L80 48 L90 26 L100 46 L110 26 L120 48 L130 30 L138 50 Z" fill="${gold}" stroke="#92400e" stroke-width="2"/><circle cx="100" cy="40" r="4" fill="#f43f5e"/>
      ${eyes(78, 122, 90, 11)}${fangs(100, 118, 44)}`
  }[id] || '';
  return `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="monsvg" role="img" aria-label="${m.name}">
    <defs><linearGradient id="${u}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
    <linearGradient id="${u}s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f8fafc"/><stop offset="1" stop-color="#94a3b8"/></linearGradient>
    <radialGradient id="${u}e"><stop offset="0" stop-color="#fff"/><stop offset=".35" stop-color="${e}"/><stop offset="1" stop-color="${c2}"/></radialGradient>
    <radialGradient id="${u}a"><stop offset="0" stop-color="${m.boss ? '#ef4444' : c1}" stop-opacity=".45"/><stop offset="1" stop-color="${c1}" stop-opacity="0"/></radialGradient></defs>
    <ellipse cx="100" cy="104" rx="98" ry="98" fill="url(#${u}a)"/><ellipse cx="100" cy="188" rx="60" ry="8" fill="#000" opacity=".35"/>${B}</svg>`;
}
/* 被打倒時的爆炸 */
function boomSVG() {
  return `<svg viewBox="0 0 200 200" class="monsvg" xmlns="http://www.w3.org/2000/svg"><path d="M100 10 L118 70 L180 46 L136 96 L192 130 L126 128 L136 190 L100 140 L64 190 L74 128 L8 130 L64 96 L20 46 L82 70 Z" fill="#fbbf24" stroke="#b45309" stroke-width="4"/>
  <path d="M100 50 L110 86 L146 74 L120 102 L152 122 L114 120 L118 156 L100 128 L82 156 L86 120 L48 122 L80 102 L54 74 L90 86 Z" fill="#fff7ed"/><text x="100" y="114" text-anchor="middle" font-size="26" font-weight="900" fill="#b91c1c">KO!</text></svg>`;
}
