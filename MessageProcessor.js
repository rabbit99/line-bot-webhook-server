/**
 * 訊息處理服務
 * 負責處理各種使用者指令和訊息路由
 */

/**
 * 處理使用者訊息的主要邏輯
 * @param {string} userMessage - 使用者訊息
 * @param {string} replyToken - LINE Bot 回覆 token
 * @param {Object} event - 完整的 LINE Bot 事件物件
 */
function processUserMessage(userMessage, replyToken, event) {
  try {
    // 記錄訊息到 Google Sheet
    writeMessageToSheet(userMessage, event);

    // 根據訊息內容進行路由處理
    switch (userMessage.toLowerCase().trim()) {
      case "查spy":
        handleSPYQuery(replyToken);
        break;

      case "呼叫寶比":
        handleBabyCall(replyToken);
        break;

      case "幫助":
      case "help":
        handleHelpRequest(replyToken);
        break;

      case "功能":
      case "指令":
        handleCommandList(replyToken);
        break;

      default:
        handleUnknownMessage(userMessage, replyToken);
        break;
    }

    Logger.log(`已處理使用者訊息: ${userMessage}`);
  } catch (error) {
    const errorMessage = `處理使用者訊息時發生錯誤: ${error.message}`;
    Logger.log(errorMessage);
    writeErrorToSheet(error.message, "處理使用者訊息");
    handleErrorResponse(replyToken, error);
  }
}

/**
 * 處理呼叫寶比的請求
 * @param {string} replyToken - LINE Bot 回覆 token
 */
function handleBabyCall(replyToken) {
  try {
    // 如果有 baby.js 文件中的 callBaby 函數，則調用它
    if (typeof callBaby === "function") {
      callBaby(replyToken);
    } else {
      const message = "🍼 寶比功能暫時無法使用，請稍後再試。";
      replyToLINE(replyToken, message);
    }
  } catch (error) {
    const errorMessage = `處理寶比呼叫時發生錯誤: ${error.message}`;
    Logger.log(errorMessage);
    writeErrorToSheet(error.message, "處理寶比呼叫");
    const replyMessage = "🍼 寶比目前不在線上，請稍後再試。";
    replyToLINE(replyToken, replyMessage);
  }
}

/**
 * 處理幫助請求
 * @param {string} replyToken - LINE Bot 回覆 token
 */
function handleHelpRequest(replyToken) {
  const helpMessage =
    "🤖 LINE Bot 使用說明\n\n" +
    "📈 查SPY - 查詢 SPY ETF 當前價格和技術指標\n" +
    "🍼 呼叫寶比 - 呼叫寶比助手\n" +
    "❓ 幫助 - 顯示此說明訊息\n" +
    "📋 功能 - 顯示所有可用指令\n\n" +
    "如需更多協助，請聯繫管理員。";

  replyToLINE(replyToken, helpMessage);
}

/**
 * 處理指令列表請求
 * @param {string} replyToken - LINE Bot 回覆 token
 */
function handleCommandList(replyToken) {
  const commandMessage =
    "📋 可用指令列表：\n\n" +
    "• 查SPY\n" +
    "• 呼叫寶比\n" +
    "• 幫助 / help\n" +
    "• 功能 / 指令\n\n" +
    "💡 提示：指令不區分大小寫";

  replyToLINE(replyToken, commandMessage);
}

/**
 * 處理未知訊息
 * @param {string} userMessage - 使用者訊息
 * @param {string} replyToken - LINE Bot 回覆 token
 */
function handleUnknownMessage(userMessage, replyToken) {
  const responses = [
    "🤔 我不太理解您的意思，請輸入「幫助」查看可用指令。",
    "❓ 抱歉，我無法識別這個指令。輸入「功能」查看所有可用功能。",
    "💭 似乎是我不認識的指令呢！試試輸入「幫助」獲取使用說明。",
  ];

  // 隨機選擇一個回應
  const randomResponse =
    responses[Math.floor(Math.random() * responses.length)];
  replyToLINE(replyToken, randomResponse);

  Logger.log(`收到未知訊息: ${userMessage}`);
}

/**
 * 處理錯誤回應
 * @param {string} replyToken - LINE Bot 回覆 token
 * @param {Error} error - 錯誤物件
 */
function handleErrorResponse(replyToken, error) {
  const errorMessage =
    "⚠️ 系統暫時遇到問題，請稍後再試。\n" + "如問題持續，請聯繫管理員。";

  try {
    replyToLINE(replyToken, errorMessage);
  } catch (replyError) {
    const errorMsg = `發送錯誤回應時也發生錯誤: ${replyError.message}`;
    Logger.log(errorMsg);
    writeErrorToSheet(replyError.message, "發送錯誤回應");
  }
}

/**
 * 檢查訊息是否為指令
 * @param {string} message - 使用者訊息
 * @returns {boolean} 是否為已知指令
 */
function isKnownCommand(message) {
  const knownCommands = ["查spy", "呼叫寶比", "幫助", "help", "功能", "指令"];

  return knownCommands.includes(message.toLowerCase().trim());
}

/**
 * 取得指令統計（可用於分析使用情況）
 * @returns {Object} 指令使用統計
 */
function getCommandStats() {
  // 這裡可以擴展為從 Google Sheet 讀取統計數據
  return {
    totalMessages: 0,
    spyQueries: 0,
    babyCall: 0,
    helpRequests: 0,
    unknownCommands: 0,
  };
}
