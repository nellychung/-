function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('教師端 - 訂正登記')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// 取得「作業檢核」分頁（找不到名稱時退回目前分頁）
function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName('作業檢核') || ss.getActiveSheet();
}

// 自動讀取試算表中「第 3 列起的所有作業」
function getInitialData() {
  var sheet = getSheet_();
  var lastRow = sheet.getLastRow();
  
  if (lastRow < 3) {
    return { tasks: [] };
  }
  
  // 讀取從第 3 列到最後一列（A欄為名稱，B~AB欄為 1~27 號狀態，共 28 欄）
  var range = sheet.getRange(3, 1, lastRow - 2, 28);
  var values = range.getValues();
  
  var tasks = [];
  for (var i = 0; i < values.length; i++) {
    if (values[i][0] !== "" || values[i].slice(1, 28).some(function(v) { return v !== ""; })) {
      tasks.push({
        row: i + 3,
        name: values[i][0],
        statuses: values[i].slice(1, 28) // 讀取 1~27 號狀態
      });
    }
  }
  
  return { tasks: tasks };
}

// 切換學生完成狀態 (TRUE/FALSE)
function toggleStudentStatus(taskRow, seatNum, isUnfinished) {
  var sheet = getSheet_();
  var col = seatNum + 1; // 1 號對應欄 B (第 2 欄)
  sheet.getRange(taskRow, col).setValue(!isUnfinished);
}

// 更新功課名稱（同時依字數縮放字級）
function updateTaskName(taskRow, name) {
  var sheet = getSheet_();
  sheet.getRange(taskRow, 1).setValue(name);
  fitNameRows_(sheet, taskRow, taskRow);
}

// 在試算表最後一列自動新增作業（預設 27 人全部未交 FALSE），並補上格線
function addNewTask(taskName) {
  var sheet = getSheet_();
  var lastRow = sheet.getLastRow();
  var newRow = Math.max(lastRow + 1, 3);
  
  sheet.getRange(newRow, 1).setValue(taskName || '新功課');
  
  var checkboxRange = sheet.getRange(newRow, 2, 1, 27); // 寫入 27 位學生的勾選框
  checkboxRange.insertCheckboxes();
  checkboxRange.setValue(false); // 預設全部未交 (FALSE)
  
  addGridToRows_(sheet, newRow, newRow);
  return true;
}

// 刪除整列作業
function deleteTaskRow(taskRow) {
  var sheet = getSheet_();
  sheet.deleteRow(taskRow);
  return true;
}

// 作業名稱（A 欄）：依字數與欄寬縮放字級、單行顯示、固定列高
// （作業名稱用注音字型時字比較寬，所以用較保守的係數）
function fitNameRows_(sheet, fromRow, toRow) {
  var n = toRow - fromRow + 1;
  var rng = sheet.getRange(fromRow, 1, n, 1);
  var w = sheet.getColumnWidth(1) - 10;
  var sizes = rng.getValues().map(function (r) {
    var units = 0;
    var t = String(r[0]);
    for (var i = 0; i < t.length; i++) units += t.charCodeAt(i) > 255 ? 1 : 0.55;
    if (!units) return [12];
    return [Math.max(8, Math.min(14, Math.floor(w / (units * 1.9))))];
  });
  rng.setWrap(false).setVerticalAlignment('middle');
  rng.setFontSizes(sizes);
  sheet.setRowHeights(fromRow, n, 21);
}

// 幫指定的列（A~AB 共 28 欄）補上黑色格線、文字置中，並縮放作業名稱字級
function addGridToRows_(sheet, fromRow, toRow) {
  var rng = sheet.getRange(fromRow, 1, toRow - fromRow + 1, 28);
  rng.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);
  rng.setHorizontalAlignment('center');
  fitNameRows_(sheet, fromRow, toRow);
}

// 直接在試算表裡新增、輸入作業時，也會自動補上格線（自動觸發，不需要設定）
function onEdit(e) {
  try {
    var range = e.range;
    var sheet = range.getSheet();
    var from = Math.max(range.getRow(), 3);
    var to = range.getLastRow();
    if (to < 3) return;
    addGridToRows_(sheet, from, Math.min(to, from + 200));
  } catch (err) {}
}
