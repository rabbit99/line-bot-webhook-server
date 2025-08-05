/**
 * LINE Bot Webhook 主要入口點
 * 負責接收和分發 LINE Bot 的訊息事件
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const event = data.events && data.events[0];

    // 檢查事件是否有效
    if (
      !event ||
      event.type !== "message" ||
      !event.message ||
      event.message.type !== "text"
    ) {
      Logger.log("收到非文字訊息或無效事件，忽略處理");
      return;
    }

    const userMessage = event.message.text;
    const replyToken = event.replyToken;

    Logger.log(`收到使用者訊息: ${userMessage}`);

    // 使用 MessageProcessor 處理訊息
    processUserMessage(userMessage, replyToken, event);
  } catch (error) {
    const errorMessage = `doPost 處理時發生錯誤: ${error.message}`;
    Logger.log(errorMessage);
    Logger.log(`錯誤詳情: ${error.stack}`);
    writeErrorToSheet(error.message, "doPost 處理");

    // 如果有 replyToken，發送錯誤訊息
    if (event && event.replyToken) {
      handleErrorResponse(event.replyToken, error);
    }
  }
}

/**
 * 測試 webhook 功能（用於手動測試）
 */
function testWebhook() {
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        events: [
          {
            type: "message",
            message: {
              type: "text",
              text: "查SPY",
              id: "test-message-id",
            },
            source: {
              type: "user",
              userId: "test-user-id",
            },
            timestamp: Date.now(),
            replyToken: "test-reply-token",
          },
        ],
      }),
    },
  };

  Logger.log("開始測試 webhook...");
  doPost(mockEvent);
  Logger.log("測試完成");
}

/**
 * 測試 SPY 數據獲取功能（不發送 LINE 訊息）
 */
function testSPYDataOnly() {
  Logger.log("開始測試 SPY 數據獲取...");

  try {
    const spy = getSPYPriceFromYahoo();

    if (spy) {
      Logger.log(`SPY 數據獲取成功: ${JSON.stringify(spy)}`);
      const message = formatSPYMessage(spy);
      Logger.log(`格式化訊息: ${message}`);

      // 更新到 Google Sheet
      updateSheetWithSPY(spy);
      Logger.log("數據已更新到 Google Sheet");

      Logger.log("✅ SPY 數據測試成功");
    } else {
      Logger.log("❌ SPY 數據獲取失敗");
    }
  } catch (error) {
    Logger.log(`❌ 測試過程中發生錯誤: ${error.message}`);
  }

  Logger.log("SPY 數據測試完成");
}

/**
 * 測試獲取使用者資料功能
 * @param {string} userId - 要測試的使用者ID（可選，預設使用您的ID）
 */
function testGetUserProfile(userId = "U707efc00d17923f130da58af2db3cc93") {
  Logger.log(`開始測試獲取使用者資料，使用者ID: ${userId}`);

  try {
    const userProfile = getUserProfile(userId);

    if (userProfile) {
      Logger.log("✅ 成功獲取使用者資料：");
      Logger.log(`使用者ID: ${userProfile.userId}`);
      Logger.log(`顯示名稱: ${userProfile.displayName}`);
      Logger.log(`狀態訊息: ${userProfile.statusMessage || "（無）"}`);
      Logger.log(`語言: ${userProfile.language || "（未知）"}`);
      Logger.log(`頭像URL: ${userProfile.pictureUrl || "（無）"}`);
    } else {
      Logger.log("❌ 獲取使用者資料失敗");
    }
  } catch (error) {
    Logger.log(`❌ 測試過程中發生錯誤: ${error.message}`);
  }

  Logger.log("使用者資料測試完成");
}
