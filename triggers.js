// === 觸發器設置檔案 ===
// 此檔案用於管理 Google Apps Script 的定時觸發器

/**
 * 設置定時觸發器
 * 執行此函式一次即可建立觸發器，之後會自動執行
 */
function setupTriggers() {
  // 刪除現有的觸發器（避免重複）
  deleteExistingTriggers();
  
  // 建立每日觸發器 - 每天台灣時間上午 9:00 執行
  ScriptApp.newTrigger('notifySPYStatus')
    .timeBased()
    .everyDays(1)
    .atHour(9) // 上午 9 點
    .create();
  
  // 建立每週觸發器 - 每週一台灣時間上午 8:00 執行
  ScriptApp.newTrigger('notifySPYStatus')
    .timeBased()
    .everyWeeks(1)
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(8)
    .create();
  
  Logger.log('✅ 觸發器已成功設置！');
  console.log('✅ 觸發器已成功設置！');
}

/**
 * 刪除所有現有觸發器
 */
function deleteExistingTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    if (trigger.getHandlerFunction() === 'notifySPYStatus') {
      ScriptApp.deleteTrigger(trigger);
    }
  });
  Logger.log('🗑️ 已清除現有觸發器');
}

/**
 * 列出所有現有觸發器
 */
function listTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  Logger.log('📋 目前的觸發器列表：');
  
  if (triggers.length === 0) {
    Logger.log('❌ 沒有找到任何觸發器');
    return;
  }
  
  triggers.forEach((trigger, index) => {
    const functionName = trigger.getHandlerFunction();
    const triggerType = trigger.getTriggerSource();
    let scheduleInfo = '';
    
    if (triggerType === ScriptApp.TriggerSource.CLOCK) {
      scheduleInfo = `時間觸發器`;
    }
    
    Logger.log(`${index + 1}. 函式: ${functionName}, 類型: ${scheduleInfo}`);
  });
}

/**
 * 測試觸發器功能
 * 手動執行一次 notifySPYStatus 來測試
 */
function testTrigger() {
  Logger.log('🧪 開始測試觸發器功能...');
  try {
    notifySPYStatus();
    Logger.log('✅ 觸發器測試成功！');
  } catch (error) {
    Logger.log('❌ 觸發器測試失敗：' + error.toString());
  }
}

/**
 * 完整的觸發器管理函式
 * 包含設置、列表和測試
 */
function manageTriggers() {
  Logger.log('🔧 開始管理觸發器...');
  
  // 1. 列出現有觸發器
  listTriggers();
  
  // 2. 設置新觸發器
  setupTriggers();
  
  // 3. 列出設置後的觸發器
  Logger.log('\n設置後的觸發器：');
  listTriggers();
  
  // 4. 測試功能
  testTrigger();
  
  Logger.log('✅ 觸發器管理完成！');
}
