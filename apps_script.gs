// 寵物王國：雲端資料庫 + 作業檢核表讀取（執行在你自己的 Google 帳號）
const PASSPHRASE = '請改成你自己的密語';   // ← 改掉它，網頁設定時要輸入同一個
const SHEET_ID   = '1a3XhjDEUXXWPl1X9lRb7M2wNMII5cMhbuAadu5ORkJU';
const SHEET_NAME = '作業檢核';
const FILE_NAME  = 'pokemon_classroom_state.json';

function out_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function file_() {
  const it = DriveApp.getFilesByName(FILE_NAME);
  return it.hasNext() ? it.next() : null;
}

// 家長專屬連結：只憑「孩子專屬的長密碼」回傳那一位孩子的資料，其他同學的資料完全不會送出
function parent_(t) {
  t = String(t || '');
  if (t.length < 16) return out_({ error: 'invalid' });
  const f = file_();
  if (!f) return out_({ error: 'invalid' });
  const st = (JSON.parse(f.getBlob().getDataAsString()).state) || {};
  const kid = (st.students || []).find(s => s.token && s.token === t);
  if (!kid) return out_({ error: 'invalid' });
  const hw = (st.homework || []).map(h => ({
    title: h.title,
    completed: !!(kid.homeworks && kid.homeworks[h.id] && kid.homeworks[h.id].completed)
  }));
  const pets = (st.pets || []).filter(p => p && p.id === kid.petId);
  // 是否為全班經驗值第一名（只回傳「是／否」，不洩漏其他人的分數）
  const maxScore = Math.max.apply(null, (st.students || []).map(s => Number(s.score) || 0));
  const top = maxScore > 0 && Number(kid.score) === maxScore;
  return out_({
    top: top,
    student: { seatNumber: kid.seatNumber, name: kid.name, score: kid.score, petId: kid.petId, customAvatar: kid.customAvatar || '' },
    homework: hw,
    pets: pets
  });
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
    const f = file_();
    let rev = 1;
    if (f) { rev = (JSON.parse(f.getBlob().getDataAsString()).rev || 0) + 1; }
    const content = JSON.stringify({ rev: rev, state: body.state });
    if (f) f.setContent(content); else DriveApp.createFile(FILE_NAME, content, MimeType.PLAIN_TEXT);
    return out_({ ok: true, rev: rev });
  } catch (err) {
    return out_({ error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}
