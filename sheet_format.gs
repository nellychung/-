// 作業檢核表自動整理（獨立檔案，不依賴任何網頁程式）
// 用法：貼到「寵物王國」Apps Script 專案，新增一個檔案（例如 sheet_format），
//      選擇函式 installTrigger 按一次「執行」並授權，之後每分鐘自動：
//      1) 新增的作業列自動補上格線  2) 作業名稱（A 欄）依字數自動縮放字級
const FMT_SHEET_ID = '1a3XhjDEUXXWPl1X9lRb7M2wNMII5cMhbuAadu5ORkJU';
const FMT_SHEET_NAME = '作業檢核';

function formatSheet() {
  const sh = SpreadsheetApp.openById(FMT_SHEET_ID).getSheetByName(FMT_SHEET_NAME);
  const range = sh.getDataRange();
  const rows = range.getNumRows(), cols = range.getNumColumns();
  const names = sh.getRange(1, 1, rows, 1).getValues().map(r => String(r[0]));
  const sig = rows + 'x' + cols + '|' + names.join('|') + '|' + sh.getColumnWidth(1);
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('fmtSig') === sig) return; // 沒有變動就不做事
  range.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
  if (rows > 1) {
    const w = sh.getColumnWidth(1) - 10;
    const sizes = names.slice(1).map(function (t) {
      let units = 0;
      for (const ch of t) units += ch.charCodeAt(0) > 255 ? 1 : 0.55;
      if (!units) return [12];
      return [Math.max(8, Math.min(14, Math.floor(w / (units * 1.9))))];
    });
    const colA = sh.getRange(2, 1, rows - 1, 1);
    colA.setWrap(false).setHorizontalAlignment('center').setVerticalAlignment('middle');
    colA.setFontSizes(sizes);
    sh.setRowHeights(2, rows - 1, 21); // 作業列維持一行高，不會因換行變高
  }
  props.setProperty('fmtSig', sig);
}

function installTrigger() {
  ScriptApp.getProjectTriggers().forEach(t => { if (t.getHandlerFunction() === 'formatSheet') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('formatSheet').timeBased().everyMinutes(1).create();
  formatSheet();
}
