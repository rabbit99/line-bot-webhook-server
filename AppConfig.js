/**
 * 應用程式配置管理
 * 定義全域設定和服務初始化
 */

/**
 * 應用程式配置
 */
const APP_CONFIG = {
  // 應用程式資訊
  name: "LINE Bot Webhook Server",
  version: "2.0.0",

  // Google Sheet 設定
  sheets: {
    lineBotSheetName: "LineBot",
    spyDataRange: "A2:D2",
  },

  // LINE Bot 設定
  lineBot: {
    apiUrl: "https://api.line.me/v2/bot",
    maxMessagesPerReply: 5,
  },

  // 股票 API 設定
  stock: {
    yahooFinanceUrl: "https://query1.finance.yahoo.com/v8/finance/chart",
    defaultSymbol: "SPY",
    defaultInterval: "1wk",
    defaultRange: "5y",
    smaLength: 200,
  },

  // 日誌設定
  logging: {
    enableDebug: true,
    logPrefix: "[LINE Bot]",
  },
};

/**
 * 取得配置值
 * @param {string} path - 配置路徑，使用點號分隔，如 'sheets.lineBotSheetName'
 * @returns {any} 配置值
 */
function getConfig(path) {
  const keys = path.split(".");
  let current = APP_CONFIG;

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * 取得環境變數
 * @param {string} key - 環境變數鍵名
 * @returns {string|null} 環境變數值
 */
function getEnvVar(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

/**
 * 設置環境變數
 * @param {string} key - 環境變數鍵名
 * @param {string} value - 環境變數值
 */
function setEnvVar(key, value) {
  PropertiesService.getScriptProperties().setProperty(key, value);
}

/**
 * 批量設置環境變數
 * @param {Object} vars - 環境變數物件
 */
function setEnvVars(vars) {
  PropertiesService.getScriptProperties().setProperties(vars);
}

/**
 * 取得所有環境變數
 * @returns {Object} 所有環境變數
 */
function getAllEnvVars() {
  return PropertiesService.getScriptProperties().getProperties();
}

/**
 * 日誌工具函數
 * @param {string} level - 日誌等級 (INFO, WARN, ERROR, DEBUG)
 * @param {string} message - 日誌訊息
 */
function logMessage(level, message) {
  const timestamp = new Date().toISOString();
  const prefix = getConfig("logging.logPrefix");
  const fullMessage = `${prefix} [${level}] ${timestamp}: ${message}`;

  if (level === "DEBUG" && !getConfig("logging.enableDebug")) {
    return; // 如果 debug 未啟用，不記錄 debug 訊息
  }

  Logger.log(fullMessage);
}

/**
 * 便利的日誌函數
 */
function logInfo(message) {
  logMessage("INFO", message);
}
function logWarn(message) {
  logMessage("WARN", message);
}
function logError(message) {
  logMessage("ERROR", message);
}
function logDebug(message) {
  logMessage("DEBUG", message);
}

/**
 * 初始化應用程式（檢查必要的設定）
 * @returns {boolean} 初始化是否成功
 */
function initializeApp() {
  logInfo("開始初始化應用程式...");

  try {
    // 檢查必要的環境變數
    const requiredEnvVars = ["LINE_ACCESS_TOKEN"];
    const missingVars = [];

    for (const varName of requiredEnvVars) {
      if (!getEnvVar(varName)) {
        missingVars.push(varName);
      }
    }

    if (missingVars.length > 0) {
      logError(`缺少必要的環境變數: ${missingVars.join(", ")}`);
      return false;
    }

    // 確保 LineBot 工作表存在
    ensureLineBotSheet();

    logInfo("應用程式初始化成功");
    return true;
  } catch (error) {
    logError(`初始化失敗: ${error.message}`);
    return false;
  }
}

/**
 * 取得應用程式狀態資訊
 * @returns {Object} 狀態資訊
 */
function getAppStatus() {
  return {
    name: getConfig("name"),
    version: getConfig("version"),
    timestamp: new Date().toISOString(),
    initialized: !!getEnvVar("LINE_ACCESS_TOKEN"),
    sheetsConnected: !!SpreadsheetApp.getActiveSpreadsheet(),
    environment: {
      hasLineToken: !!getEnvVar("LINE_ACCESS_TOKEN"),
      hasChannelSecret: !!getEnvVar("LINE_CHANNEL_SECRET"),
    },
  };
}
