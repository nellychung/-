/* 原創奇幻角色（SVG 繪製，不需要圖片檔） */
const CHARS = {
  reaper:  {name: '暗夜死神', cls: '鐮刀使', hair: '#e5e7eb', hair2: '#9ca3af', eye: '#a855f7', armor: '#2e1065', armor2: '#4c1d95', trim: '#fbbf24', cape: '#1e1b4b', cape2: '#581c87', skin: '#fde2cf', style: 'long', weapon: 'scythe', acc: 'horns'},
  paladin: {name: '聖光騎士', cls: '劍士', hair: '#fde68a', hair2: '#d97706', eye: '#0ea5e9', armor: '#e2e8f0', armor2: '#94a3b8', trim: '#f59e0b', cape: '#1d4ed8', cape2: '#1e3a8a', skin: '#fcd9bd', style: 'short', weapon: 'sword', acc: 'none'},
  mage:    {name: '星辰魔導士', cls: '法師', hair: '#60a5fa', hair2: '#1d4ed8', eye: '#22d3ee', armor: '#1e3a8a', armor2: '#3730a3', trim: '#fcd34d', cape: '#312e81', cape2: '#6366f1', skin: '#fde2cf', style: 'long', weapon: 'staff', acc: 'tiara', orb: '#67e8f9'},
  archer:  {name: '疾風弓手', cls: '弓箭手', hair: '#4ade80', hair2: '#15803d', eye: '#facc15', armor: '#14532d', armor2: '#166534', trim: '#d9f99d', cape: '#365314', cape2: '#3f6212', skin: '#fcd9bd', style: 'short', weapon: 'bow', acc: 'none'},
  blade:   {name: '赤焰劍姬', cls: '武士', hair: '#ef4444', hair2: '#991b1b', eye: '#f97316', armor: '#450a0a', armor2: '#7f1d1d', trim: '#fbbf24', cape: '#7f1d1d', cape2: '#dc2626', skin: '#fde2cf', style: 'pony', weapon: 'katana', acc: 'none'},
  ninja:   {name: '影之忍者', cls: '刺客', hair: '#1f2937', hair2: '#030712', eye: '#ef4444', armor: '#111827', armor2: '#374151', trim: '#a1a1aa', cape: '#0f172a', cape2: '#334155', skin: '#f5d0b5', style: 'short', weapon: 'daggers', acc: 'mask'},
  dragoon: {name: '龍槍騎士', cls: '槍兵', hair: '#2dd4bf', hair2: '#0f766e', eye: '#fbbf24', armor: '#134e4a', armor2: '#115e59', trim: '#fcd34d', cape: '#042f2e', cape2: '#0d9488', skin: '#fde2cf', style: 'long', weapon: 'spear', acc: 'horns'},
  frost:   {name: '冰霜術士', cls: '法師', hair: '#f8fafc', hair2: '#93c5fd', eye: '#38bdf8', armor: '#0c4a6e', armor2: '#075985', trim: '#e0f2fe', cape: '#082f49', cape2: '#0284c7', skin: '#fcd9bd', style: 'short', weapon: 'staff', acc: 'none', orb: '#bae6fd'}
};
const CHAR_IDS = Object.keys(CHARS);
let _cid = 0;
/* 依等級的光環顏色 */
function tierAura(lv) { return lv >= 20 ? '#f472b6' : lv >= 12 ? '#fbbf24' : lv >= 8 ? '#e2e8f0' : lv >= 5 ? '#f59e0b' : '#60a5fa'; }

function charSVG(id, opt = {}) {
  const c = CHARS[id] || CHARS.reaper, u = 'c' + (++_cid), aura = opt.aura || '#60a5fa';
  const vb = opt.head ? '62 30 76 76' : '0 0 200 280';
  const g = (n, a, b, x2 = 0, y2 = 1) => `<linearGradient id="${u}${n}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
  // 武器（在身體後面的長柄武器）
  const W = {
    scythe: `<g><rect x="147" y="28" width="6" height="244" rx="3" fill="#1c1917"/><rect x="146" y="70" width="8" height="5" fill="${c.trim}"/><rect x="146" y="200" width="8" height="5" fill="${c.trim}"/>
      <path d="M150 34 C118 2 52 0 14 44 C58 22 108 24 150 58 Z" fill="url(#${u}blade)" stroke="${c.trim}" stroke-width="2"/>
      <path d="M150 34 C120 12 70 10 30 38" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.5"/>
      <circle cx="150" cy="40" r="7" fill="${c.trim}"/><circle cx="150" cy="40" r="3.5" fill="${c.eye}"/></g>`,
    spear: `<g><rect x="147" y="40" width="6" height="232" rx="3" fill="#44403c"/><path d="M150 4 L160 44 L150 52 L140 44 Z" fill="url(#${u}blade)" stroke="${c.trim}" stroke-width="2"/>
      <rect x="142" y="50" width="16" height="6" rx="2" fill="${c.trim}"/><path d="M150 58 q-18 10 -10 34 q2-18 10-22 z" fill="${c.cape2}"/></g>`,
    staff: `<g><rect x="147" y="44" width="6" height="228" rx="3" fill="#78350f"/><path d="M150 50 C132 46 130 22 150 14 C170 22 168 46 150 50" fill="none" stroke="${c.trim}" stroke-width="4"/>
      <circle cx="150" cy="32" r="13" fill="${c.orb}" opacity=".35"/><circle cx="150" cy="32" r="9" fill="url(#${u}orb)"/><circle cx="146" cy="28" r="3" fill="#fff"/></g>`,
    sword: '', katana: '', bow: '', daggers: ''
  }[c.weapon];
  // 手上武器（在前面）
  const F = {
    sword: `<g><path d="M146 168 L146 52 L150 40 L154 52 L154 168 Z" fill="url(#${u}blade)" stroke="#64748b" stroke-width="1"/><line x1="150" y1="50" x2="150" y2="160" stroke="#fff" stroke-opacity=".8"/>
      <rect x="134" y="160" width="32" height="7" rx="3" fill="${c.trim}"/><rect x="147" y="167" width="6" height="16" fill="#78350f"/><circle cx="150" cy="186" r="4" fill="${c.trim}"/></g>
      <g transform="translate(54 150)"><path d="M0 0 L28 0 L28 26 Q14 46 0 26 Z" fill="${c.cape}" stroke="${c.trim}" stroke-width="3"/><path d="M14 6 L14 34 M4 16 L24 16" stroke="${c.trim}" stroke-width="3"/></g>`,
    katana: `<g><path d="M150 176 Q160 100 178 38 L181 40 Q166 104 155 176 Z" fill="url(#${u}blade)" stroke="#64748b" stroke-width=".8"/><rect x="143" y="172" width="18" height="5" rx="2" fill="${c.trim}"/><rect x="148" y="177" width="7" height="22" fill="#1c1917"/></g>`,
    bow: `<g><path d="M64 96 Q26 170 64 244" fill="none" stroke="#78350f" stroke-width="6" stroke-linecap="round"/><path d="M64 96 Q26 170 64 244" fill="none" stroke="${c.trim}" stroke-width="2" stroke-dasharray="6 14"/>
      <line x1="64" y1="96" x2="64" y2="244" stroke="#e5e7eb" stroke-width="1.2"/><line x1="40" y1="170" x2="150" y2="170" stroke="#a16207" stroke-width="2.5"/><path d="M150 170 l-10 -5 l0 10 z" fill="#d1d5db"/></g>`,
    daggers: `<g><path d="M150 168 L162 120 L166 122 L156 170 Z" fill="url(#${u}blade)"/><rect x="144" y="166" width="16" height="5" rx="2" fill="${c.trim}" transform="rotate(14 152 168)"/>
      <path d="M68 178 L54 132 L50 134 L62 180 Z" fill="url(#${u}blade)"/><rect x="58" y="176" width="16" height="5" rx="2" fill="${c.trim}" transform="rotate(-16 66 178)"/></g>`
  }[c.weapon] || '';
  const longHair = c.style === 'long' ? `<path d="M70 72 Q60 140 66 196 Q78 186 84 200 Q92 188 100 202 Q108 188 116 200 Q122 186 134 196 Q140 140 130 72 Z" fill="url(#${u}hair)"/>` : '';
  const pony = c.style === 'pony' ? `<path d="M124 60 Q160 70 150 150 Q146 176 132 190 Q142 150 130 110 Q126 84 118 70 Z" fill="url(#${u}hair)"/><circle cx="124" cy="62" r="6" fill="${c.trim}"/>` : '';
  const horns = c.acc === 'horns' ? `<path d="M80 56 Q66 30 58 22 Q74 30 88 52 Z" fill="#1c1917" stroke="${c.trim}" stroke-width="1.5"/><path d="M120 56 Q134 30 142 22 Q126 30 112 52 Z" fill="#1c1917" stroke="${c.trim}" stroke-width="1.5"/>` : '';
  const tiara = c.acc === 'tiara' ? `<path d="M82 58 L90 50 L100 42 L110 50 L118 58" fill="none" stroke="${c.trim}" stroke-width="3"/><circle cx="100" cy="46" r="4" fill="${c.orb}"/>` : '';
  const mask = c.acc === 'mask' ? `<path d="M74 100 Q100 116 126 100 L126 118 Q100 132 74 118 Z" fill="${c.armor2}"/><path d="M124 104 q22 6 30 22 q-16 -6 -28 -8z" fill="${c.cape2}"/>` : `<path d="M96 108 Q100 111 104 108" fill="none" stroke="#9f1239" stroke-width="1.6" stroke-linecap="round"/>`;
  const eye = x => `<g><ellipse cx="${x}" cy="90" rx="6.5" ry="8" fill="#fff"/><ellipse cx="${x}" cy="91" rx="5.2" ry="7" fill="url(#${u}eye)"/><ellipse cx="${x}" cy="92" rx="2.4" ry="3.6" fill="#0f0a1e"/>
    <circle cx="${x - 2}" cy="88" r="2" fill="#fff"/><circle cx="${x + 2}" cy="95" r="1" fill="#fff"/><path d="M${x - 8} 84 Q${x} 79 ${x + 8} 84" fill="none" stroke="#1c1917" stroke-width="2.4" stroke-linecap="round"/></g>`;
  const legs = `<g><rect x="84" y="196" width="14" height="50" rx="5" fill="url(#${u}arm)"/><rect x="102" y="196" width="14" height="50" rx="5" fill="url(#${u}arm)"/>
    <path d="M81 236 h20 v28 q-12 4 -22 0 z" fill="#1c1917"/><path d="M99 236 h20 v28 q-10 4 -22 0 z" fill="#1c1917"/>
    <rect x="81" y="234" width="20" height="5" rx="2" fill="${c.trim}"/><rect x="99" y="234" width="20" height="5" rx="2" fill="${c.trim}"/>
    <path d="M84 214 l6 -6 l6 6 l-6 6z M102 214 l6 -6 l6 6 l-6 6z" fill="${c.trim}"/></g>`;
  const body = `<g>
    <path d="M78 176 L122 176 L132 214 Q100 224 68 214 Z" fill="url(#${u}arm)" stroke="${c.trim}" stroke-width="2"/>
    <path d="M86 176 L100 176 L96 216 L78 212 Z M114 176 L100 176 L104 216 L122 212 Z" fill="${c.armor2}" opacity=".7"/>
    <path d="M90 116 L110 116 L128 130 L120 178 L80 178 L72 130 Z" fill="url(#${u}arm)" stroke="${c.trim}" stroke-width="2"/>
    <path d="M86 132 Q100 150 114 132 M84 160 L116 160 M100 146 L100 178" fill="none" stroke="${c.trim}" stroke-width="2"/>
    <path d="M100 136 l6 8 l-6 8 l-6 -8z" fill="${c.eye}" stroke="${c.trim}" stroke-width="1.5"/>
    <rect x="76" y="170" width="48" height="8" rx="3" fill="${c.trim}"/><circle cx="100" cy="174" r="4" fill="${c.eye}"/>
  </g>`;
  const arms = `<g stroke-linecap="round" fill="none">
    <path d="M78 134 Q66 160 66 182" stroke="url(#${u}arm)" stroke-width="13"/><path d="M122 134 Q140 150 148 168" stroke="url(#${u}arm)" stroke-width="13"/>
    <circle cx="66" cy="184" r="6.5" fill="${c.skin}" stroke="none"/><circle cx="148" cy="170" r="6.5" fill="${c.skin}" stroke="none"/></g>
    <ellipse cx="76" cy="130" rx="14" ry="10" fill="url(#${u}arm)" stroke="${c.trim}" stroke-width="2.2"/><ellipse cx="124" cy="130" rx="14" ry="10" fill="url(#${u}arm)" stroke="${c.trim}" stroke-width="2.2"/>
    <path d="M66 128 l-6 -8 l10 2z M134 128 l6 -8 l-10 2z" fill="${c.trim}"/>`;
  const head = `<g><rect x="94" y="106" width="12" height="14" fill="${c.skin}"/><path d="M88 116 Q100 124 112 116 L112 122 Q100 128 88 122 Z" fill="${c.armor2}"/>
    <path d="M72 82 Q72 118 100 122 Q128 118 128 82 Q128 54 100 54 Q72 54 72 82 Z" fill="${c.skin}"/>
    <ellipse cx="82" cy="102" rx="5" ry="2.5" fill="#fb7185" opacity=".35"/><ellipse cx="118" cy="102" rx="5" ry="2.5" fill="#fb7185" opacity=".35"/>
    ${eye(88)}${eye(112)}${mask}
    <path d="M68 92 Q64 48 100 46 Q136 48 132 92 L126 76 L120 94 L112 70 L104 90 L96 68 L88 90 L82 70 L76 92 Z" fill="url(#${u}hair)"/>
    <path d="M70 80 Q66 104 72 120 L78 96 Z M130 80 Q134 104 128 120 L122 96 Z" fill="url(#${u}hair)"/>
    <path d="M84 56 Q100 48 116 56" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="2.5"/>${horns}${tiara}</g>`;
  return `<svg viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" class="char" role="img" aria-label="${c.name}">
  <defs>${g('hair', c.hair, c.hair2)}${g('arm', c.armor2, c.armor)}${g('cape', c.cape2, c.cape)}${g('blade', '#f8fafc', '#94a3b8', 1, 1)}${g('eye', c.eye, '#1e1b4b')}
    <radialGradient id="${u}orb"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="${c.orb || c.eye}"/></radialGradient>
    <radialGradient id="${u}aura"><stop offset="0" stop-color="${aura}" stop-opacity=".55"/><stop offset="1" stop-color="${aura}" stop-opacity="0"/></radialGradient></defs>
  ${opt.head ? '' : `<ellipse cx="100" cy="150" rx="96" ry="130" fill="url(#${u}aura)"/><ellipse cx="100" cy="266" rx="56" ry="8" fill="#000" opacity=".35"/>`}
  ${opt.head ? '' : `<path d="M80 124 L120 124 Q150 190 166 262 L150 252 L136 266 L118 254 L100 268 L82 254 L64 266 L50 252 L34 262 Q50 190 80 124 Z" fill="url(#${u}cape)" stroke="${c.trim}" stroke-width="1.5"/>`}
  ${longHair}${pony}${opt.head ? '' : W + legs + body + arms}${head}${opt.head ? '' : F}
</svg>`;
}
