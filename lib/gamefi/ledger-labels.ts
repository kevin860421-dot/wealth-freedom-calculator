/** 流水帳 action_type 對應使用者可讀標籤 */
export function getLedgerActionLabel(type: string): string {
  switch (type) {
    case "INITIAL_GRANT":
      return "系統贈送";
    default:
      return type;
  }
}
