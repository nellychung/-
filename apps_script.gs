// 寵物王國：雲端資料庫 + 作業檢核表讀取（執行在你自己的 Google 帳號）
const PASSPHRASE = '請改成你自己的密語';   // ← 改掉它，網頁設定時要輸入同一個
const SHEET_ID   = '1a3XhjDEUXXWPl1X9lRb7M2wNMII5cMhbuAadu5ORkJU';
const SHEET_NAME = '作業檢核';
const FILE_NAME  = 'pokemon_classroom_state.json';
const PHOTO_NAME = 'pokemon_board_photo.txt';

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function photoFile_() {
  const it = DriveApp.getFilesByName(PHOTO_NAME);
  return it.hasNext() ? it.next() : null;
}
function file_() {
  const it = DriveApp.getFilesByName(FILE_NAME);
  return it.hasNext() ? it.next() : null;
}

// 家長專屬連結：只憑「孩子專屬的長密碼」回傳那一位孩子的資料，其他同學的資料完全不會送出
function parent_(t) {
  t = String(t || '');
  if (t.length < 16) return out_({ error: 'invalid' });
  // 家長頁面常被同時開啟：結果暫存 20 秒，減少讀取雲端硬碟的次數，也比較不會偶爾失敗
  const cache = CacheService.getScriptCache();
  const ck = 'p_' + t;
  try { const hit = cache.get(ck); if (hit) return ContentService.createTextOutput(hit).setMimeType(ContentService.MimeType.JSON); } catch (x) {}
  let st = null;
  for (let i = 0; i < 3 && !st; i++) {          // 剛好遇到老師端存檔、讀到一半時，稍等再讀
    try {
      const f = file_();
      if (!f) break;
      st = (JSON.parse(f.getBlob().getDataAsString()).state) || {};
    } catch (e) { Utilities.sleep(400); }
  }
  if (!st) return out_({ error: 'busy' });
  const kid = (st.students || []).find(s => s.token && s.token === t);
  if (!kid) return out_({ error: 'invalid' });
  // 作業狀態：n 未交、f 需訂正、d 已完成（太舊又沒要訂正的不顯示）
  const cut = new Date(); cut.setDate(cut.getDate() - 14);
  const cutKey = Utilities.formatDate(cut, 'Asia/Taipei', 'yyyy-MM-dd');
  const hw = (st.homework || []).map(h => {
    const d = kid.homeworks && kid.homeworks[h.id];
    const state = (!d || !d.completed) ? 'n' : (d.fix ? 'f' : 'd');
    return { title: h.title, state: state, completed: state === 'd', date: h.date || '' };
  }).filter(h => !(h.date && h.date < cutKey && h.state !== 'f')).map(h => ({ title: h.title, state: h.state, completed: h.completed }));
  const pets = (st.pets || []).filter(p => p && p.id === kid.petId);
  // 是否為全班經驗值第一名（只回傳「是／否」，不洩漏其他人的分數）
  const maxScore = Math.max.apply(null, (st.students || []).map(s => Number(s.score) || 0));
  const top = maxScore > 0 && Number(kid.score) === maxScore;
  // 今天到校／請假（只回傳這位孩子自己的）
  const today = Utilities.formatDate(new Date(), 'Asia/Taipei', 'yyyy-MM-dd');
  const day = (((st.daily || {}).days) || {})[today] || {};
  const arr = (day.arrive || {})[kid.id];
  const lv = (day.leave || {})[kid.id];
  // 今日之星：今天經驗值增加最多的人（只回傳「是／否」，不洩漏其他人）
  const net = day.net || {};
  let maxNet = 0; Object.keys(net).forEach(k => { maxNet = Math.max(maxNet, Number(net[k]) || 0); });
  const star = maxNet > 0 && (Number(net[kid.id]) || 0) === maxNet;
  const body = JSON.stringify({
    top: top, star: star,
    className: String(((st.daily || {}).settings || {}).className || ''),
    today: { arrive: arr ? String(arr.t).slice(0, 5) : '', leave: lv || '', gain: Number((day.net || {})[kid.id]) || 0 },
    student: { seatNumber: kid.seatNumber, name: kid.name, score: kid.score, petId: kid.petId, customAvatar: kid.customAvatar || '' },
    homework: hw,
    badges: (kid.badges || []).slice(-60).map(b => ({ icon: b.icon, name: b.name, wk: b.wk })),
    pets: pets
  });
  try { cache.put(ck, body, 20); } catch (x) {}
  return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    if (e.parameter.action === 'parent') return parent_(e.parameter.t);
    if (e.parameter.key !== PASSPHRASE) return out_({ error: '密語錯誤' });
    const action = e.parameter.action;
    if (action === 'load') {
      const f = file_();
      if (!f) return out_({ state: null, rev: 0 });
      const o = JSON.parse(f.getBlob().getDataAsString());
      return out_({ state: o.state, rev: o.rev });
    }
    if (action === 'photo') {
      const pf = photoFile_();
      return out_({ data: pf ? pf.getBlob().getDataAsString() : '' });
    }
    if (action === 'rev') {
      // 很輕量的「資料有沒有更新」查詢，讓其他裝置可以幾秒內同步
      const props = PropertiesService.getScriptProperties();
      let rev = props.getProperty('rev');
      if (rev === null) {
        const f = file_();
        rev = f ? String(JSON.parse(f.getBlob().getDataAsString()).rev || 0) : '0';
        props.setProperty('rev', rev);
      }
      return out_({ rev: Number(rev) });
    }
    if (action === 'sheet') {
      const sh = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
      const range = sh.getDataRange();
      // 新增作業（多出列／欄）時自動補上格線，只在表格大小改變時才做
      try {
        const dim = range.getNumRows() + 'x' + range.getNumColumns();
        const props = PropertiesService.getScriptProperties();
        if (props.getProperty('gridDim') !== dim) {
          range.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
          props.setProperty('gridDim', dim);
        }
      } catch (x) {}
      // 作業名稱（A 欄）：依字數與欄寬自動縮放字級，單行顯示，不動欄寬
      try {
        const colA = sh.getRange(2, 1, Math.max(range.getNumRows() - 1, 1), 1);
        const names = colA.getValues().map(r => String(r[0]));
        const sig = names.join('|') + '#' + sh.getColumnWidth(1);
        const props2 = PropertiesService.getScriptProperties();
        if (props2.getProperty('nameSig') !== sig) {
          const w = sh.getColumnWidth(1) - 10; // 可用寬度（像素）
          const sizes = names.map(function (t) {
            let units = 0;
            for (const ch of t) units += ch.charCodeAt(0) > 255 ? 1 : 0.55;
            if (!units) return [10];
            const pt = Math.floor(w / (units * 1.9));
            return [Math.max(7, Math.min(14, pt))];
          });
          colA.setWrap(false).setHorizontalAlignment('center').setVerticalAlignment('middle');
          colA.setFontSizes(sizes);
          sh.setRowHeights(2, Math.max(range.getNumRows() - 1, 1), 21);
          props2.setProperty('nameSig', sig);
        }
      } catch (x) {}
      const values = range.getValues().map(r => r.map(c => String(c)));
      return out_({ values: values });
    }
    return out_({ error: '未知的動作' });
  } catch (err) {
    return out_({ error: String(err) });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    if (e.parameter.key !== PASSPHRASE) return out_({ error: '密語錯誤' });
    lock.waitLock(20000);
    const body = JSON.parse(e.postData.contents);
    if (e.parameter.action === 'photo') {
      const pf = photoFile_();
      const data = String(body.data || '');
      if (pf) pf.setContent(data); else DriveApp.createFile(PHOTO_NAME, data, MimeType.PLAIN_TEXT);
      return out_({ ok: true });
    }
    const f = file_();
    let rev = 1;
    if (f) { rev = (JSON.parse(f.getBlob().getDataAsString()).rev || 0) + 1; }
    const content = JSON.stringify({ rev: rev, state: body.state });
    if (f) f.setContent(content); else DriveApp.createFile(FILE_NAME, content, MimeType.PLAIN_TEXT);
    PropertiesService.getScriptProperties().setProperty('rev', String(rev));
    return out_({ ok: true, rev: rev });
  } catch (err) {
    return out_({ error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}
