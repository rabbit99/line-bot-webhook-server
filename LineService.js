/**
 * LINE Bot 通信服務
 * 負責與 LINE Bot API 的所有通信功能
 */

/**
 * 回覆訊息給使用者
 * @param {string} replyToken - LINE Bot 回覆 token
 * @param {string} message - 要回覆的訊息內容
 */
function replyToLINE(replyToken, message) {
  Logger.log(
    `replyToLINE 被調用，replyToken: ${replyToken}, message: ${message}`
  );

  const LINE_ACCESS_TOKEN =
    PropertiesService.getScriptProperties().getProperty("LINE_ACCESS_TOKEN");

  if (!LINE_ACCESS_TOKEN) {
    const errorMessage = "未設置 LINE_ACCESS_TOKEN";
    Logger.log("錯誤：" + errorMessage);
    writeErrorToSheet(errorMessage, "replyToLINE 函數");
    return;
  }

  Logger.log("LINE_ACCESS_TOKEN 已設置，準備發送請求");

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

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200) {
      Logger.log("✅ 訊息已成功發送到 LINE");
    } else {
      Logger.log(`❌ LINE API 回應錯誤，狀態碼: ${responseCode}`);
      Logger.log(`回應內容: ${response.getContentText()}`);

      // 根據不同的錯誤碼提供更具體的錯誤訊息
      let errorContext = "";
      if (responseCode === 400) {
        errorContext = "請求格式錯誤或 replyToken 無效/已過期";
      } else if (responseCode === 401) {
        errorContext = "ACCESS_TOKEN 無效或過期";
      } else if (responseCode === 403) {
        errorContext = "權限不足或 Bot 被封鎖";
      }

      writeErrorToSheet(
        `LINE API 錯誤 ${responseCode}: ${errorContext}`,
        "發送 LINE 訊息"
      );
    }
  } catch (error) {
    const errorMessage = `發送 LINE 訊息時發生錯誤: ${error.message}`;
    Logger.log(errorMessage);
    writeErrorToSheet(error.message, "發送 LINE 訊息");
  }
}

/**
 * 發送多則訊息給使用者
 * @param {string} replyToken - LINE Bot 回覆 token
 * @param {Array<string>} messages - 要回覆的訊息陣列
 */
function replyMultipleMessages(replyToken, messages) {
  const LINE_ACCESS_TOKEN =
    PropertiesService.getScriptProperties().getProperty("LINE_ACCESS_TOKEN");

  if (!LINE_ACCESS_TOKEN) {
    const errorMessage = "未設置 LINE_ACCESS_TOKEN";
    Logger.log("錯誤：" + errorMessage);
    writeErrorToSheet(errorMessage, "replyMultipleMessages 函數");
    return;
  }

  const url = "https://api.line.me/v2/bot/message/reply";
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + LINE_ACCESS_TOKEN,
  };

  // 轉換訊息格式
  const messageObjects = messages.map((msg) => ({
    type: "text",
    text: msg,
  }));

  const payload = {
    replyToken: replyToken,
    messages: messageObjects,
  };

  const options = {
    method: "post",
    headers: headers,
    payload: JSON.stringify(payload),
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200) {
      Logger.log(`已成功發送 ${messages.length} 則訊息到 LINE`);
    } else {
      Logger.log(`LINE API 回應錯誤，狀態碼: ${responseCode}`);
      Logger.log(`回應內容: ${response.getContentText()}`);
    }
  } catch (error) {
    const errorMessage = `發送多則 LINE 訊息時發生錯誤: ${error.message}`;
    Logger.log(errorMessage);
    writeErrorToSheet(error.message, "發送多則 LINE 訊息");
  }
}

/**
 * 推送訊息給特定使用者（不需要 replyToken）
 * @param {string} userId - 使用者 ID
 * @param {string} message - 要推送的訊息內容
 */
function pushMessageToUser(userId, message) {
  const LINE_ACCESS_TOKEN =
    PropertiesService.getScriptProperties().getProperty("LINE_ACCESS_TOKEN");

  if (!LINE_ACCESS_TOKEN) {
    const errorMessage = "未設置 LINE_ACCESS_TOKEN";
    Logger.log("錯誤：" + errorMessage);
    writeErrorToSheet(errorMessage, "pushMessageToUser 函數");
    return;
  }

  const url = "https://api.line.me/v2/bot/message/push";
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + LINE_ACCESS_TOKEN,
  };

  const payload = {
    to: userId,
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

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();

    if (responseCode === 200) {
      Logger.log(`已成功推送訊息給使用者: ${userId}`);
    } else {
      Logger.log(`LINE API 推送錯誤，狀態碼: ${responseCode}`);
      Logger.log(`回應內容: ${response.getContentText()}`);
    }
  } catch (error) {
    const errorMessage = `推送 LINE 訊息時發生錯誤: ${error.message}`;
    Logger.log(errorMessage);
    writeErrorToSheet(error.message, "推送 LINE 訊息");
  }
}

/**
 * 驗證 LINE Bot webhook 簽章（可選用於安全性增強）
 * @param {string} body - 請求內容
 * @param {string} signature - LINE 提供的簽章
 * @returns {boolean} 簽章是否有效
 */
function validateLineSignature(body, signature) {
  const channelSecret = PropertiesService.getScriptProperties().getProperty(
    "LINE_CHANNEL_SECRET"
  );

  if (!channelSecret) {
    Logger.log("警告：未設置 LINE_CHANNEL_SECRET，跳過簽章驗證");
    return true; // 如果沒有設置，暫時跳過驗證
  }

  try {
    const hash = Utilities.computeHmacSha256Signature(body, channelSecret);
    const expectedSignature = Utilities.base64Encode(hash);

    return signature === `sha256=${expectedSignature}`;
  } catch (error) {
    Logger.log(`驗證 LINE 簽章時發生錯誤: ${error.message}`);
    return false;
  }
}

/**
 * 檢查 LINE Bot 設定是否正確
 */
function checkLineConfiguration() {
  Logger.log("開始檢查 LINE Bot 設定...");

  const LINE_ACCESS_TOKEN =
    PropertiesService.getScriptProperties().getProperty("LINE_ACCESS_TOKEN");
  const LINE_CHANNEL_SECRET =
    PropertiesService.getScriptProperties().getProperty("LINE_CHANNEL_SECRET");

  if (!LINE_ACCESS_TOKEN) {
    Logger.log("❌ LINE_ACCESS_TOKEN 未設置");
    writeErrorToSheet("LINE_ACCESS_TOKEN 未設置", "LINE Bot 設定檢查");
    return false;
  } else {
    Logger.log("✅ LINE_ACCESS_TOKEN 已設置");
    Logger.log(`ACCESS_TOKEN 長度: ${LINE_ACCESS_TOKEN.length} 字元`);
    Logger.log(
      `ACCESS_TOKEN 前10字元: ${LINE_ACCESS_TOKEN.substring(0, 10)}...`
    );
  }

  if (!LINE_CHANNEL_SECRET) {
    Logger.log("⚠️ LINE_CHANNEL_SECRET 未設置（可選）");
  } else {
    Logger.log("✅ LINE_CHANNEL_SECRET 已設置");
  }

  // 測試 ACCESS TOKEN 格式
  if (LINE_ACCESS_TOKEN && !LINE_ACCESS_TOKEN.startsWith("/")) {
    Logger.log("✅ ACCESS_TOKEN 格式看起來正確");
    return true;
  } else {
    Logger.log("❌ ACCESS_TOKEN 格式可能不正確");
    writeErrorToSheet("ACCESS_TOKEN 格式可能不正確", "LINE Bot 設定檢查");
    return false;
  }
}

/**
 * 測試 LINE Bot API 連線（使用 Bot Info API）
 */
function testLineAPIConnection() {
  Logger.log("開始測試 LINE Bot API 連線...");

  const LINE_ACCESS_TOKEN =
    PropertiesService.getScriptProperties().getProperty("LINE_ACCESS_TOKEN");

  if (!LINE_ACCESS_TOKEN) {
    Logger.log("❌ LINE_ACCESS_TOKEN 未設置");
    return false;
  }

  // 使用 Bot Info API 測試連線（這個 API 不需要 replyToken）
  const url = "https://api.line.me/v2/bot/info";
  const headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + LINE_ACCESS_TOKEN,
  };

  const options = {
    method: "get",
    headers: headers,
  };

  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    Logger.log(`API 回應狀態碼: ${responseCode}`);
    Logger.log(`API 回應內容: ${responseText}`);

    if (responseCode === 200) {
      Logger.log("✅ LINE Bot API 連線成功！ACCESS_TOKEN 有效");
      const botInfo = JSON.parse(responseText);
      Logger.log(`Bot 名稱: ${botInfo.displayName}`);
      Logger.log(`Bot ID: ${botInfo.userId}`);
      return true;
    } else {
      Logger.log(`❌ LINE Bot API 連線失敗，狀態碼: ${responseCode}`);
      writeErrorToSheet(
        `LINE Bot API 連線失敗，狀態碼: ${responseCode}，回應: ${responseText}`,
        "API 連線測試"
      );
      return false;
    }
  } catch (error) {
    const errorMessage = `測試 LINE Bot API 連線時發生錯誤: ${error.message}`;
    Logger.log(`❌ ${errorMessage}`);
    writeErrorToSheet(error.message, "API 連線測試");
    return false;
  }
}
