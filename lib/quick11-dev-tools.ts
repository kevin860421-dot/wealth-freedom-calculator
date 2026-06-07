/** 本機開發用：sim-reset、exit-modal-preview 等；正式部署不啟用 */
export function isQuick11DevToolsEnabled(): boolean {
  return process.env.NODE_ENV === "development";
}
