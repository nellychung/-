// 教師登記作業端（重建版）：登記作業、刪除作業、訂正（勾選／取消每位同學的完成狀況）
// 資料就存在「作業檢核」試算表，寵物王國會自己從試算表讀進來，所以兩邊自動連動。
// 貼到「教師端」Apps Script 專案（取代裡面全部內容）→ 改下面的教師密語 → 部署為網頁應用程式。
const SHEET_ID  = '1a3XhjDEUXXWPl1X9lRb7M2wNMII5cMhbuAadu5ORkJU';
const SHEET_NAME = '作業檢核';
const TEACHER_KEY = '請改成教師密語';   // ← 改掉它，開網頁時要輸入同一個

function sh_() { return SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME); }

function doGet() {
  return HtmlService.createHtmlOutput(PAGE_)
    .setTitle('教師登記作業端')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// 作業名稱字級：依字數與欄寬縮放（最大 14、最小 8）
function fit_(sh, title) {
  let units = 0;
  for (const ch of String(title)) units += ch.charCodeAt(0) > 255 ? 1 : 0.55;
  if (!units) return 12;
  return Math.max(8, Math.min(14, Math.floor((sh.getColumnWidth(1) - 10) / (units * 1.9))));
}

function lastRow_(sh) {
  // 最後一列有作業名稱的列
  const v = sh.getRange(1, 1, sh.getMaxRows(), 1).getValues();
  let n = 2;
  for (let i = 2; i < v.length; i++) if (String(v[i][0]).trim()) n = i + 1;
  return n;
}

function api(key, op, a) {
  if (key !== TEACHER_KEY) throw new Error('密語錯誤');
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = sh_();
    const cols = sh.getLastColumn();
    if (op === 'add') {
      const title = String(a.title || '').trim();
      if (!title) throw new Error('請輸入作業名稱');
      const row = lastRow_(sh) + 1;
      if (row > sh.getMaxRows()) sh.insertRowsAfter(sh.getMaxRows(), 5);
      sh.getRange(row, 1).setValue(title);
      const body = sh.getRange(row, 2, 1, cols - 1);
      body.insertCheckboxes();
      body.setValue(false);
      const whole = sh.getRange(row, 1, 1, cols);
      whole.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
      whole.setHorizontalAlignment('center').setVerticalAlignment('middle');
      sh.getRange(row, 1).setWrap(false).setFontSize(fit_(sh, title));
    } else if (op === 'del') {
      const row = Number(a.row);
      if (String(sh.getRange(row, 1).getValue()) !== String(a.title)) throw new Error('作業列已變動，請重新整理');
      sh.deleteRow(row);
    } else if (op === 'set') {
      const row = Number(a.row), col = Number(a.col) + 1;
      if (String(sh.getRange(row, 1).getValue()) !== String(a.title)) throw new Error('作業列已變動，請重新整理');
      sh.getRange(row, col).setValue(!!a.val);
    } else if (op !== 'list') {
      throw new Error('未知的動作');
    }
    // 回傳目前整張表
    const last = lastRow_(sh);
    const head = sh.getRange(1, 2, 1, cols - 1).getValues()[0].map(x => String(x));
    const data = last > 2 ? sh.getRange(3, 1, last - 2, cols).getValues() : [];
    return {
      seats: head,
      rows: data.map((r, i) => ({ row: i + 3, title: String(r[0]), vals: r.slice(1).map(x => x === true || /^true$/i.test(String(x))) }))
    };
  } finally { lock.releaseLock(); }
}

const PAGE_ = '<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8">' +
'<style>body{font-family:system-ui,"Noto Sans TC",sans-serif;margin:0;background:#fff7ed;color:#7c2d12}' +
'header{background:#fb923c;color:#fff;padding:10px 14px;font-weight:900;font-size:18px}' +
'.bar{display:flex;gap:8px;flex-wrap:wrap;padding:10px 14px;align-items:center}' +
'input[type=text],input[type=password]{padding:8px 10px;border:2px solid #fdba74;border-radius:10px;font-size:15px}' +
'button{padding:8px 14px;border:0;border-radius:10px;background:#f97316;color:#fff;font-weight:800;font-size:15px;cursor:pointer}' +
'button.gray{background:#fecaca;color:#991b1b}button.del{background:#fee2e2;color:#b91c1c;padding:4px 8px;font-size:13px}' +
'.wrap{overflow:auto;padding:0 14px 30px}table{border-collapse:collapse;background:#fff}' +
'th,td{border:1px solid #333;text-align:center;padding:0;min-width:34px;height:34px;font-size:13px}' +
'th.t,td.t{position:sticky;left:0;background:#ffedd5;min-width:110px;font-weight:800;z-index:1;padding:0 6px;white-space:nowrap}' +
'td.c{cursor:pointer;user-select:none}td.ok{background:#fff}td.no{background:#0ff;color:#00f}' +
'#msg{padding:0 14px;color:#b91c1c;font-weight:700;min-height:22px}</style></head><body>' +
'<header>教師登記作業端（作業檢核）</header>' +
'<div id="login" class="bar"><input type="password" id="key" placeholder="教師密語"><button onclick="go()">進入</button></div>' +
'<div id="msg"></div><div id="main" style="display:none">' +
'<div class="bar"><input type="text" id="title" placeholder="新作業名稱"><button onclick="add()">＋ 登記作業</button>' +
'<button class="gray" onclick="load()">重新整理</button><span style="font-size:12px">點格子＝訂正（藍色＝未完成，白色＝已完成）</span></div>' +
'<div class="wrap"><table id="tb"></table></div></div>' +
'<script>var KEY="",D=null;function msg(t){document.getElementById("msg").textContent=t||""}' +
'function call(op,a,cb){msg("處理中…");google.script.run.withSuccessHandler(function(r){msg("");D=r;draw();if(cb)cb()}).withFailureHandler(function(e){msg(e.message||e)}).api(KEY,op,a||{})}' +
'function go(){KEY=document.getElementById("key").value;call("list",{},function(){document.getElementById("login").style.display="none";document.getElementById("main").style.display="block"})}' +
'function load(){call("list")}' +
'function add(){var t=document.getElementById("title");call("add",{title:t.value},function(){t.value=""})}' +
'function del(i){var r=D.rows[i];if(confirm("確定刪除「"+r.title+"」？（已加的分數不會被扣回）"))call("del",{row:r.row,title:r.title})}' +
'function tog(i,j){var r=D.rows[i];var v=!r.vals[j];r.vals[j]=v;draw();call("set",{row:r.row,title:r.title,col:j+1,val:v})}' +
'function draw(){var h="<tr><th class=t>座號</th>";D.seats.forEach(function(s){h+="<th>"+s+"</th>"});h+="<th>刪</th></tr>";' +
'D.rows.forEach(function(r,i){h+="<tr><td class=t>"+r.title.replace(/</g,"&lt;")+"</td>";' +
'r.vals.forEach(function(v,j){h+="<td class=\\"c "+(v?"ok":"no")+"\\" onclick=\\"tog("+i+","+j+")\\">"+(v?"✓":"")+"</td>"});' +
'h+="<td><button class=del onclick=\\"del("+i+")\\">刪</button></td></tr>"});document.getElementById("tb").innerHTML=h}' +
'</script></body></html>';
