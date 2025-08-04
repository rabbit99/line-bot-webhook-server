function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const event = data.events && data.events[0];

  if (!event || event.type !== "message") return;

  const userMessage = event.message.text;
  const replyToken = event.replyToken;
  writeMessageToSheet(userMessage);

  switch (userMessage) {
    case "查SPY":
      const spy = getSPYPriceFromYahoo();
      updateSheetWithSPY(spy); // 寫入 Google Sheet

      const message =
        `📊 SPY 技術提醒（手動查詢）\n` +
        `📈 收盤價：$${spy.close.toFixed(2)}\n` +
        `📉 200週均線：$${spy.sma200.toFixed(2)}\n` +
        `📌 狀態：${spy.status}`;

      replyToLINE(replyToken, message);
      break;
    case "呼叫寶比":
      callBaby(replyToken);
      break;
  }

  if (userMessage === "查SPY") {
    const spy = getSPYPriceFromYahoo();
    updateSheetWithSPY(spy); // 寫入 Google Sheet

    const message =
      `📊 SPY 技術提醒（手動查詢）\n` +
      `📈 收盤價：$${spy.close.toFixed(2)}\n` +
      `📉 200週均線：$${spy.sma200.toFixed(2)}\n` +
      `📌 狀態：${spy.status}`;

    replyToLINE(replyToken, message);
  }
}

// 取得 SPY 週收盤價與 200 週均線
function getSPYPriceFromYahoo() {
  const url =
    "https://query1.finance.yahoo.com/v8/finance/chart/SPY?interval=1wk&range=5y";
  const res = UrlFetchApp.fetch(url);
  const json = JSON.parse(res.getContentText());
  const closes = json.chart.result[0].indicators.quote[0].close;
  const valid = closes.filter((v) => typeof v === "number");
  const close = valid[valid.length - 1];
  const sma200 = valid.slice(-200).reduce((a, b) => a + b, 0) / 200;
  const status = close < sma200 ? "✅ 跌破" : "⭕ 安全";
  return { close, sma200, status };
}

// 更新 Google Sheet A2~D2
function updateSheetWithSPY(spy) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  sheet.getRange("A2").setValue(new Date());
  sheet.getRange("B2").setValue(spy.close);
  sheet.getRange("C2").setValue(spy.sma200);
  sheet.getRange("D2").setValue(spy.status);
}

// 回覆訊息給使用者
function replyToLINE(replyToken, message) {
  const LINE_ACCESS_TOKEN =
    PropertiesService.getScriptProperties().getProperty("LINE_ACCESS_TOKEN");
  const url = "https://api.line.me/v2/bot/message/reply";
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + LINE_ACCESS_TOKEN,
  };
  const payload = {
    replyToken: replyToken,
    messages: [
      {
        type: "text",
        text: message,
      },
    ],
  };
  const options = {
    method: "post",
    headers: headers,
    payload: JSON.stringify(payload),
  };
  UrlFetchApp.fetch(url, options);
}

function writeMessageToSheet(message) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("LineBot");
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
}
