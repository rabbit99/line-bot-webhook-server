
// === 使用 Google Apps Script 的 PropertiesService 來存儲敏感資訊 ===
// 請在 Google Apps Script 編輯器的腳本屬性中設置：
// LINE_ACCESS_TOKEN: 您的 LINE Bot Access Token
// LINE_USER_ID: 您的 LINE User ID

const LINE_ACCESS_TOKEN = PropertiesService.getScriptProperties().getProperty('LINE_ACCESS_TOKEN');
const LINE_USER_ID = PropertiesService.getScriptProperties().getProperty('LINE_USER_ID');

function notifySPYStatus() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const url = "https://query1.finance.yahoo.com/v8/finance/chart/SPY?interval=1wk&range=5y";

  const res = UrlFetchApp.fetch(url);
  const json = JSON.parse(res.getContentText());

  const closes = json.chart.result[0].indicators.quote[0].close;
  const validCloses = closes.filter(p => typeof p === 'number');
  const latest = validCloses[validCloses.length - 1];
  const sma200 = validCloses.slice(-200).reduce((sum, v) => sum + v, 0) / 200;
  const status = latest < sma200 ? "✅ 跌破！可以買進" : "⭕ 安全";
  sheet.getRange("A2").setValue(new Date());     // 日期
  sheet.getRange("B2").setValue(latest);         // 收盤價
  sheet.getRange("C2").setValue(sma200);         // 200週均線
  sheet.getRange("D2").setValue(status);         // 判斷狀態
  Logger.log("B2 原始值: " + sheet.getRange("B2").getValue());
  Logger.log("C2 原始值: " + sheet.getRange("C2").getValue());
  Logger.log("D2 原始值: " + sheet.getRange("D2").getValue());
  // 防呆：只在資料都正確時才發送
  if (isNaN(latest) || isNaN(sma200) || status === "#N/A" || status === "") {
    Logger.log("❌ 抓到無效資料，今天不發送通知。");
    return;
  }
  const message =
    `📊 SPY 技術提醒\n` +
    `📅 日期：${formatDate(new Date())}\n` +
    `📈 收盤價：$${latest.toFixed(2)}\n` +
    `📉 200週均線：$${sma200.toFixed(2)}\n` +
    `📌 狀態：${status}`;

  sendLineMessage(LINE_USER_ID, message);
}


// 發送訊息函式
function sendLineMessage(userId, message) {
  const url = "https://api.line.me/v2/bot/message/push";
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + LINE_ACCESS_TOKEN
  };

  const payload = {
    to: userId,
    messages: [
      {
        type: "text",
        text: message
      }
    ]
  };

  const options = {
    method: "POST",
    headers: headers,
    payload: JSON.stringify(payload)
  };

  const response = UrlFetchApp.fetch(url, options);
  Logger.log(response.getContentText());
}

// 輔助函式：格式化日期
function formatDate(date) {
  return Utilities.formatDate(new Date(date), Session.getScriptTimeZone(), "yyyy-MM-dd");
}
