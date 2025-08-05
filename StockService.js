/**
 * 股票數據處理服務
 * 負責獲取和處理股票相關數據
 */

/**
 * 取得指定股票代號的週收盤價與 200 週均線
 * @param {string} symbol - 股票代號（如：SPY, NVDA, AAPL 等）
 * @returns {Object} 包含股票代號、收盤價、200週均線和狀態的物件
 */
function getStockPriceFromYahoo(symbol) {
  // 驗證股票代號格式
  if (!symbol || typeof symbol !== "string") {
    Logger.log(`無效的股票代號: ${symbol}`);
    return null;
  }

  // 清理並標準化股票代號（移除多餘空格、轉為大寫）
  const cleanSymbol = symbol.trim().toUpperCase();

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${cleanSymbol}?interval=1wk&range=5y`;

  try {
    const res = UrlFetchApp.fetch(url);
    const json = JSON.parse(res.getContentText());

    // 檢查 API 回應是否有效
    if (!json.chart || !json.chart.result || json.chart.result.length === 0) {
      Logger.log(`無法找到股票代號 ${cleanSymbol} 的數據`);
      return null;
    }

    const result = json.chart.result[0];
    const closes = result.indicators.quote[0].close;
    const valid = closes.filter((v) => typeof v === "number");

    // 檢查是否有足夠的數據
    if (valid.length < 200) {
      Logger.log(`股票代號 ${cleanSymbol} 的歷史數據不足 200 週`);
      return null;
    }

    const close = valid[valid.length - 1];
    const sma200 = valid.slice(-200).reduce((a, b) => a + b, 0) / 200;
    const status = close < sma200 ? "✅ 跌破" : "⭕ 安全";

    return {
      symbol: cleanSymbol,
      close,
      sma200,
      status,
    };
  } catch (error) {
    const errorMessage = `獲取 ${cleanSymbol} 數據時發生錯誤: ${error.message}`;
    Logger.log(errorMessage);
    writeErrorToSheet(error.message, `獲取 ${cleanSymbol} 數據`);
    return null;
  }
}

/**
 * 取得 SPY 週收盤價與 200 週均線（保持向後相容性）
 * @returns {Object} 包含收盤價、200週均線和狀態的物件
 */
function getSPYPriceFromYahoo() {
  const result = getStockPriceFromYahoo("SPY");
  if (!result) return null;

  // 返回原有格式以保持相容性
  return {
    close: result.close,
    sma200: result.sma200,
    status: result.status,
  };
}

/**
 * 格式化股票數據為訊息文字
 * @param {Object} stockData - 股票數據物件
 * @param {string} source - 數據來源標示（如：手動查詢、定時提醒等）
 * @returns {string} 格式化後的訊息文字
 */
function formatStockMessage(stockData, source = "手動查詢") {
  const symbolDisplay = stockData.symbol || "未知股票";

  return (
    `📊 ${symbolDisplay} 技術提醒（${source}）\n` +
    `📈 收盤價：$${stockData.close.toFixed(2)}\n` +
    `📉 200週均線：$${stockData.sma200.toFixed(2)}\n` +
    `📌 狀態：${stockData.status}`
  );
}

/**
 * 格式化 SPY 數據為訊息文字（保持向後相容性）
 * @param {Object} spyData - SPY 數據物件
 * @param {string} source - 數據來源標示（如：手動查詢、定時提醒等）
 * @returns {string} 格式化後的訊息文字
 */
function formatSPYMessage(spyData, source = "手動查詢") {
  // 為 SPY 數據添加 symbol 屬性以使用新的格式化函數
  const stockData = { ...spyData, symbol: "SPY" };
  return formatStockMessage(stockData, source);
}

/**
 * 處理任意股票查詢請求
 * @param {string} symbol - 股票代號
 * @param {string} replyToken - LINE Bot 回覆 token
 * @returns {Object} 股票數據物件
 */
function handleStockQuery(symbol, replyToken) {
  try {
    Logger.log(`開始處理 ${symbol} 查詢，replyToken: ${replyToken}`);

    const stockData = getStockPriceFromYahoo(symbol);

    if (!stockData) {
      Logger.log(`getStockPriceFromYahoo 返回 null for ${symbol}`);
      const errorMessage = `抱歉，無法獲取 ${symbol.toUpperCase()} 的數據。請確認股票代號是否正確，或稍後再試。`;
      replyToLINE(replyToken, errorMessage);
      return null;
    }

    Logger.log(`${symbol} 數據獲取成功: ${JSON.stringify(stockData)}`);
    const message = formatStockMessage(stockData);
    Logger.log(`格式化訊息: ${message}`);

    // 更新到 Google Sheet
    if (symbol.toUpperCase() === "SPY") {
      // SPY 使用原有的更新方式以保持相容性
      updateSheetWithSPY(stockData);
    } else {
      // 其他股票使用新的通用更新方式
      updateSheetWithStock(stockData);
    }

    // 回覆訊息
    Logger.log("準備發送回覆訊息到 LINE");
    replyToLINE(replyToken, message);
    Logger.log(`${symbol} 查詢處理完成`);

    return stockData;
  } catch (error) {
    const errorMessage = `處理 ${symbol} 查詢時發生錯誤: ${error.message}`;
    Logger.log(errorMessage);
    writeErrorToSheet(error.message, `處理 ${symbol} 查詢`);
    const replyMessage = `抱歉，目前無法獲取 ${symbol.toUpperCase()} 數據，請稍後再試。`;
    replyToLINE(replyToken, replyMessage);
    return null;
  }
}

/**
 * 處理 SPY 查詢請求（保持向後相容性）
 * @param {string} replyToken - LINE Bot 回覆 token
 * @returns {Object} SPY 數據物件
 */
function handleSPYQuery(replyToken) {
  return handleStockQuery("SPY", replyToken);
}

/**
 * 從使用者訊息中提取股票代號
 * @param {string} message - 使用者訊息
 * @returns {string|null} 提取的股票代號，如果無法提取則返回 null
 */
function extractStockSymbol(message) {
  // 移除空格並轉為大寫
  const cleanMessage = message.trim().toUpperCase();

  // 匹配 "查XXX" 格式，其中 XXX 是股票代號
  const match = cleanMessage.match(/^查(.+)$/);

  if (match && match[1]) {
    const symbol = match[1].trim();
    // 檢查股票代號是否為有效格式（只包含字母、數字、點、短橫線）
    if (/^[A-Z0-9.-]+$/.test(symbol)) {
      return symbol;
    }
  }

  return null;
}
