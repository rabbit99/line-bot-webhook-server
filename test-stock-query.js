/**
 * 股票查詢功能測試腳本
 * 用於測試新的股票查詢功能
 */

/**
 * 測試股票代號提取功能
 */
function testExtractStockSymbol() {
  console.log("=== 測試股票代號提取功能 ===");

  const testCases = [
    { input: "查NVDA", expected: "NVDA" },
    { input: "查nvda", expected: "NVDA" },
    { input: "查 AAPL ", expected: "AAPL" },
    { input: "查SPY", expected: "SPY" },
    { input: "查TSLA", expected: "TSLA" },
    { input: "查BTC-USD", expected: "BTC-USD" },
    { input: "查GOOGL", expected: "GOOGL" },
    { input: "查", expected: null },
    { input: "查 ", expected: null },
    { input: "hello", expected: null },
    { input: "查123ABC", expected: "123ABC" },
  ];

  testCases.forEach((testCase, index) => {
    const result = extractStockSymbol(testCase.input);
    const passed = result === testCase.expected;

    console.log(`測試 ${index + 1}: ${passed ? "✅" : "❌"}`);
    console.log(`  輸入: "${testCase.input}"`);
    console.log(`  預期: ${testCase.expected}`);
    console.log(`  結果: ${result}`);
    console.log("");
  });
}

/**
 * 測試股票數據格式化功能
 */
function testFormatStockMessage() {
  console.log("=== 測試股票數據格式化功能 ===");

  const mockStockData = {
    symbol: "NVDA",
    close: 432.5,
    sma200: 421.3,
    status: "⭕ 安全",
  };

  const formattedMessage = formatStockMessage(mockStockData, "測試查詢");
  console.log("格式化結果:");
  console.log(formattedMessage);
}

/**
 * 運行所有測試
 */
function runAllTests() {
  console.log("開始運行股票查詢功能測試...\n");

  testExtractStockSymbol();
  testFormatStockMessage();

  console.log("所有測試完成！");
}

// 如果在 Google Apps Script 環境中運行
if (typeof Logger !== "undefined") {
  // 重新定義 console.log 為 Logger.log
  console.log = Logger.log;
}
