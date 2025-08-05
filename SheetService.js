/**
 * Google Sheet 操作服務
 * 負責所有與 Google Sheet 相關的操作
 */

/**
 * 更新 Google Sheet 中的 SPY 數據 (A2~D2)
 * @param {Object} spy - SPY 數據物件
 */
function updateSheetWithSPY(spy) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.getRange("A2").setValue(new Date());
    sheet.getRange("B2").setValue(spy.close);
    sheet.getRange("C2").setValue(spy.sma200);
    sheet.getRange("D2").setValue(spy.status);

    Logger.log("SPY 數據已成功更新到 Google Sheet");
  } catch (error) {
    const errorMessage = `更新 SPY 數據到 Google Sheet 時發生錯誤: ${error.message}`;
    Logger.log(errorMessage);
    writeErrorToSheet(error.message, "更新 SPY 數據到 Google Sheet");
  }
}

/**
 * 將訊息和使用者資訊寫入 Google Sheet
 * @param {string} message - 使用者訊息
 * @param {Object} event - LINE Bot 事件物件
 */
function writeMessageToSheet(message, event) {
  try {
    const sheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName("LineBot");
    if (!sheet) {
      Logger.log("找不到 LineBot 分頁");
      return;
    }

    const headerRow = sheet
      .getRange(1, 1, 1, sheet.getLastColumn())
      .getValues()[0];

    // 找到第一個開頭為 "訊息" 的欄位
    let messageCol = -1;
    for (let i = 0; i < headerRow.length; i++) {
      if (typeof headerRow[i] === "string" && headerRow[i].startsWith("訊息")) {
        messageCol = i + 1; // 欄位是從 1 開始
        break;
      }
    }

    if (messageCol === -1) {
      Logger.log("找不到開頭為「訊息」的欄位");
      return;
    }

    // 找出該欄的最後一個非空儲存格
    const columnValues = sheet
      .getRange(2, messageCol, sheet.getLastRow())
      .getValues();
    let lastRow = 1; // 預設從第2列開始填
    for (let i = 0; i < columnValues.length; i++) {
      if (columnValues[i][0] === "" || columnValues[i][0] === null) {
        break;
      }
      lastRow++;
    }

    // 寫入訊息
    sheet.getRange(lastRow + 1, messageCol).setValue(message);

    // 寫入使用者詳細資訊到右邊一格
    if (event && event.source) {
      const userInfoText = formatUserInfo(event);
      sheet.getRange(lastRow + 1, messageCol + 1).setValue(userInfoText);
    }

    Logger.log(`訊息已成功寫入 Google Sheet，行數: ${lastRow + 1}`);
  } catch (error) {
    const errorMessage = `寫入訊息到 Google Sheet 時發生錯誤: ${error.message}`;
    Logger.log(errorMessage);
    writeErrorToSheet(error.message, "寫入訊息到 Google Sheet");
  }
}

/**
 * 格式化使用者資訊
 * @param {Object} event - LINE Bot 事件物件
 * @returns {string} 格式化後的使用者資訊文字
 */
function formatUserInfo(event) {
  const userInfo = [];

  // 使用者ID
  if (event.source && event.source.userId) {
    userInfo.push(`使用者ID: ${event.source.userId}`);

    // 嘗試獲取使用者顯示名稱
    try {
      const userProfile = getUserProfile(event.source.userId);
      if (userProfile && userProfile.displayName) {
        userInfo.push(`使用者名稱: ${userProfile.displayName}`);
        if (userProfile.statusMessage) {
          userInfo.push(`狀態訊息: ${userProfile.statusMessage}`);
        }
      }
    } catch (error) {
      Logger.log(`獲取使用者資料時發生錯誤: ${error.message}`);
      // 如果獲取失敗，不影響其他資訊的記錄
    }
  }

  // 來源類型
  if (event.source && event.source.type) {
    userInfo.push(`來源類型: ${event.source.type}`);
  }

  // 群組ID (如果是群組訊息)
  if (event.source && event.source.groupId) {
    userInfo.push(`群組ID: ${event.source.groupId}`);
  }

  // 房間ID (如果是多人聊天室)
  if (event.source && event.source.roomId) {
    userInfo.push(`房間ID: ${event.source.roomId}`);
  }

  // 訊息ID
  if (event.message && event.message.id) {
    userInfo.push(`訊息ID: ${event.message.id}`);
  }

  // 訊息類型
  if (event.message && event.message.type) {
    userInfo.push(`訊息類型: ${event.message.type}`);
  }

  // 時間戳記
  if (event.timestamp) {
    const date = new Date(event.timestamp);
    userInfo.push(`時間: ${date.toLocaleString("zh-TW")}`);
  }

  // Reply Token
  if (event.replyToken) {
    userInfo.push(`Reply Token: ${event.replyToken}`);
  }

  // 將所有資訊合併成一個字串，用換行符分隔
  return userInfo.join("\n");
}

/**
 * 創建或檢查 LineBot 工作表
 * @returns {GoogleAppsScript.Spreadsheet.Sheet} LineBot 工作表物件
 */
function ensureLineBotSheet() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = spreadsheet.getSheetByName("LineBot");

  if (!sheet) {
    // 如果不存在，創建新的工作表
    sheet = spreadsheet.insertSheet("LineBot");

    // 設置標題列
    const headers = ["時間", "訊息", "使用者資訊"];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

    // 格式化標題列
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight("bold");
    headerRange.setBackground("#E8F0FE");

    Logger.log("已創建新的 LineBot 工作表");
  }

  return sheet;
}

/**
 * 將錯誤訊息寫入表格中第一格是"ERROR"字串的下面一格
 * @param {string} errorMessage - 錯誤訊息內容
 * @param {string} context - 錯誤發生的上下文說明（可選）
 */
function writeErrorToSheet(errorMessage, context = "") {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let statusSheet = spreadsheet.getSheetByName("Status");

    // 如果 Status 分頁不存在，則創建一個
    if (!statusSheet) {
      statusSheet = spreadsheet.insertSheet("Status");
      Logger.log("已創建新的 Status 工作表");
    }

    // 搜尋第一格是"ERROR"的位置
    const searchRange = statusSheet.getDataRange();
    const values = searchRange.getValues();
    let errorRow = -1;

    for (let i = 0; i < values.length; i++) {
      if (values[i][0] === "ERROR") {
        errorRow = i + 1; // Google Sheet 的行數從 1 開始
        break;
      }
    }

    // 如果找不到"ERROR"，則在第一行創建一個
    if (errorRow === -1) {
      // 找到第一個空的行來插入ERROR標題
      const lastRow = statusSheet.getLastRow();
      errorRow = lastRow + 1;
      statusSheet.getRange(errorRow, 1).setValue("ERROR");
    }

    // 從 ERROR 行開始往下找到資料尾端的下一格
    let nextEmptyRow = errorRow + 1; // 從 ERROR 下一行開始
    const columnA = statusSheet
      .getRange(nextEmptyRow, 1, statusSheet.getLastRow() - nextEmptyRow + 10)
      .getValues();

    // 找到第一個空格
    for (let i = 0; i < columnA.length; i++) {
      if (
        columnA[i][0] === "" ||
        columnA[i][0] === null ||
        columnA[i][0] === undefined
      ) {
        nextEmptyRow = nextEmptyRow + i;
        break;
      }
    }

    // 如果沒找到空格，就在最後一行的下一行
    if (
      nextEmptyRow === errorRow + 1 &&
      statusSheet.getLastRow() >= nextEmptyRow
    ) {
      nextEmptyRow = statusSheet.getLastRow() + 1;
    }

    // 寫入錯誤訊息
    const timestamp = new Date().toLocaleString("zh-TW");
    const fullErrorMessage = context
      ? `${context}: ${errorMessage}`
      : errorMessage;
    const finalMessage = `[${timestamp}] ${fullErrorMessage}`;

    statusSheet.getRange(nextEmptyRow, 1).setValue(finalMessage);

    Logger.log(`錯誤已寫入 Status 分頁第 ${nextEmptyRow} 行: ${finalMessage}`);
  } catch (error) {
    // 如果連寫入錯誤都失敗，至少記錄到 Logger
    Logger.log(`無法寫入錯誤到 Status 分頁: ${error.message}`);
    Logger.log(`原始錯誤: ${errorMessage}`);
  }
}
