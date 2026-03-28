/** 由其他元件觸發、開啟首頁「我的自選股」彈窗（須已寫入 WATCHLIST_SLOT_SESSION_KEY） */
export const OPEN_WATCHLIST_MODAL_EVENT = "wf-open-watchlist-modal";

/** 從「使用我的標的」雙擊列進自選股編輯時設為 "1"；按「完成」後應再開「使用我的標的」並清除 */
export const RETURN_TO_LOAD_TARGET_AFTER_NOTES_KEY = "wf-return-to-load-target-after-notes";

/** 由「我的自選股」彈窗「完成」觸發，page 監聽後 setLoadTargetModalOpen(true) */
export const OPEN_LOAD_TARGET_MODAL_EVENT = "wf-open-load-target-modal";
