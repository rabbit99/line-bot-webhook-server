# Line Bot Webhook Server

這是一個使用 Google Apps Script 開發的 LINE Bot Webhook 伺服器，主要功能包括：

## 功能特色

- **多股票查詢**：透過 Yahoo Finance API 獲取任意美股的週收盤價和 200 週均線
- **技術指標分析**：自動判斷股價是否跌破 200 週均線
- **Google Sheets 整合**：自動將查詢結果和用戶訊息記錄到 Google Sheets
- **LINE Bot 互動**：支援即時回覆用戶查詢
- **動態工作表創建**：為不同股票自動創建專屬的工作表

## 支援的指令

- `查SPY` - 查詢 SPY ETF 當前技術指標
- `查[股票代號]` - 查詢指定股票的技術指標（例如：查 NVDA、查 AAPL、查 TSLA）
- `呼叫寶比` - 執行自定義功能
- `幫助` / `help` - 顯示使用說明
- `功能` / `指令` - 顯示可用指令列表

## 股票查詢功能

### 支援的股票代號格式

- 美股代號：NVDA, AAPL, TSLA, MSFT, GOOGL 等
- ETF：SPY, QQQ, VTI 等
- 加密貨幣：BTC-USD, ETH-USD 等

### 查詢結果包含

- 當前週收盤價
- 200 週移動平均線
- 技術狀態（安全/跌破）

### 使用範例

```
用戶輸入：查NVDA
Bot 回覆：
📊 NVDA 技術提醒（手動查詢）
📈 收盤價：$432.50
📉 200週均線：$421.30
📌 狀態：⭕ 安全
```

## 技術架構

- **平台**：Google Apps Script
- **API 整合**：
  - LINE Messaging API
  - Yahoo Finance API
  - Google Sheets API
- **部署工具**：Google Clasp

## 安裝與部署

### 前置需求

1. Google 帳戶
2. LINE Developer 帳戶
3. Node.js 和 npm

### 設置步驟

1. **安裝依賴**

   ```bash
   npm install
   ```

2. **設置 Clasp**

   ```bash
   npx clasp login
   ```

3. **推送程式碼**

   ```bash
   npm run push
   ```

4. **部署到指定 ID**
   ```bash
   npm run deploy
   ```

### 可用的 npm 命令

- `npm run push` - 推送程式碼到 Google Apps Script
- `npm run deploy` - 推送並部署到生產環境
- `npm run open` - 在瀏覽器中開啟 Apps Script 編輯器
- `npm run logs` - 查看執行日誌
- `npm run setup` - 推送程式碼並開啟編輯器（一鍵設置）

## 定時觸發器設置

⚠️ **注意**：由於 `clasp run` 命令的 API 權限限制，請使用手動方式設置觸發器。

### 設置步驟

1. **推送程式碼並開啟編輯器**

   ```bash
   npm run setup
   ```

2. **在 Apps Script 編輯器中執行觸發器設置**

   - 在左側檔案列表中選擇 `triggers.js`
   - 在函式下拉選單中選擇 `setupTriggers`
   - 點擊「執行」按鈕 ▶️
   - 首次執行會要求授權，請點擊「檢閱權限」並授權
   - 查看執行日誌確認觸發器設置成功

3. **管理觸發器**
   - 選擇 `listTriggers` 函式並執行 - 查看所有觸發器
   - 選擇 `testTrigger` 函式並執行 - 測試觸發器功能
   - 選擇 `deleteExistingTriggers` 函式並執行 - 刪除所有觸發器

### 觸發器配置

預設設置包括：

- **每日觸發器**：每天台灣時間上午 9:00 執行 `notifySPYStatus`
- **每週觸發器**：每週一台灣時間上午 8:00 執行 `notifySPYStatus`

如需修改觸發器時間，請編輯 `triggers.js` 檔案中的 `setupTriggers` 函式。

### 快速設置指令

```bash
# 一鍵推送並開啟編輯器
npm run setup

# 然後在編輯器中執行 setupTriggers 函式
```

## 檔案說明

- `Code.js` - 主要的 webhook 處理邏輯
- `baby.js` - 自定義功能模組
- `程式碼.js` - 額外的程式碼檔案
- `appsscript.json` - Google Apps Script 專案配置
- `.clasp.json` - Clasp 部署配置
- `package.json` - npm 專案配置

## 環境變數設置

⚠️ **重要安全提醒**：請勿將敏感資訊如 API keys、tokens 等直接寫在程式碼中！

### Google Apps Script 腳本屬性設置

在 Google Apps Script 編輯器中設置以下腳本屬性：

1. 在 Apps Script 編輯器中，點選左側選單的 **設定** (⚙️)
2. 在 **腳本屬性** 區域，新增以下屬性：

   - **屬性名稱**: `LINE_ACCESS_TOKEN`
   - **值**: 您的 LINE Bot Channel Access Token

   - **屬性名稱**: `LINE_USER_ID`
   - **值**: 您的 LINE User ID（如果需要推送訊息）

### 本地開發配置（選用）

如果需要在本地測試，可以：

1. 複製 `config.example.js` 為 `config.js`
2. 在 `config.js` 中填入真實的 tokens
3. `config.js` 已被加入 `.gitignore`，不會被提交到版本控制

## Google Sheets 設置

專案需要連接到包含以下工作表的 Google Sheets：

- **主工作表**：用於記錄 SPY 數據 (A2-D2)

  - A2: 查詢時間
  - B2: 收盤價
  - C2: 200 週均線
  - D2: 技術狀態

- **LineBot 工作表**：用於記錄用戶訊息
  - 需要有開頭為「訊息」的欄位

## 授權

MIT License

## 貢獻

歡迎提交 Pull Request 或開啟 Issue 來改善這個專案。
