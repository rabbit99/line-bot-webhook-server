/**
 * 股票數據處理服務
 * 負責獲取和處理股票相關數據
 */

/**
 * 取得 SPY 週收盤價與 200 週均線
 * @returns {Object} 包含收盤價、200週均線和狀態的物件
 */
function getSPYPriceFromYahoo() {
  const url =
    "https://query1.finance.yahoo.com/v8/finance/chart/SPY?interval=1wk&range=5y";

  try {
    const res = UrlFetchApp.fetch(url);
    const json = JSON.parse(res.getContentText());
    const closes = json.chart.result[0].indicators.quote[0].close;
    const valid = closes.filter((v) => typeof v === "number");
    const close = valid[valid.length - 1];
    const sma200 = valid.slice(-200).reduce((a, b) => a + b, 0) / 200;
    const status = close < sma200 ? "✅ 跌破" : "⭕ 安全";

    return { close, sma200, status };
  } catch (error) {
    const errorMessage = `獲取 SPY 數據時發生錯誤: ${error.message}`;
    Logger.log(errorMessage);
    writeErrorToSheet(error.message, "獲取 SPY 數據");
    return null;
  }
}

/**
 * 格式化 SPY 數據為訊息文字
 * @param {Object} spyData - SPY 數據物件
 * @param {string} source - 數據來源標示（如：手動查詢、定時提醒等）
 * @returns {string} 格式化後的訊息文字
 */
function formatSPYMessage(spyData, source = "手動查詢") {
  return (
    `📊 SPY 技術提醒（${source}）\n` +
    `📈 收盤價：$${spyData.close.toFixed(2)}\n` +
    `📉 200週均線：$${spyData.sma200.toFixed(2)}\n` +
    `📌 狀態：${spyData.status}`
  );
}

/**
 * 處理 SPY 查詢請求
 * @param {string} replyToken - LINE Bot 回覆 token
 * @returns {Object} SPY 數據物件
 */
function handleSPYQuery(replyToken) {
  try {
    Logger.log(`開始處理 SPY 查詢，replyToken: ${replyToken}`);

    const spy = getSPYPriceFromYahoo();

    if (!spy) {
      Logger.log("getSPYPriceFromYahoo 返回 null");
      const errorMessage = "抱歉，目前無法獲取 SPY 數據，請稍後再試。";
      replyToLINE(replyToken, errorMessage);
      return null;
    }

    Logger.log(`SPY 數據獲取成功: ${JSON.stringify(spy)}`);
    const message = formatSPYMessage(spy);
    Logger.log(`格式化訊息: ${message}`);

    // 更新到 Google Sheet
    updateSheetWithSPY(spy);

    // 回覆訊息
    Logger.log("準備發送回覆訊息到 LINE");
    replyToLINE(replyToken, message);
    Logger.log("SPY 查詢處理完成");

    return spy;
  } catch (error) {
    const errorMessage = `處理 SPY 查詢時發生錯誤: ${error.message}`;
    Logger.log(errorMessage);
    writeErrorToSheet(error.message, "處理 SPY 查詢");
    const replyMessage = "抱歉，目前無法獲取 SPY 數據，請稍後再試。";
    replyToLINE(replyToken, replyMessage);
    return null;
  }
}
