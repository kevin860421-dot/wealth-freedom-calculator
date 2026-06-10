"use client";

import { HomeFooterMobileExpand } from "./home-footer-mobile-expand";
import styles from "./home-legal-disclaimer-section.module.css";

/**
 * 首頁法律聲明：桌機完整條款；手機可展開全文。
 */
export function HomeLegalDisclaimerSection() {
  return (
    <section className={styles.root} aria-labelledby="legal-disclaimer-heading">
      <h2 id="legal-disclaimer-heading" className={styles.title}>
        法律聲明與免責條款
      </h2>
      <p className={styles.intro}>
        您使用本網頁（含試算表、圖表、匯出檔案及所有顯示之數字與文字說明，以下合稱「本工具」）前，請詳閱下列條款。一經使用本工具，即表示您已閱讀、理解並同意受下列條款拘束；若您不同意，請勿使用本工具。
      </p>

      <HomeFooterMobileExpand
        tone="gold"
        expandLabel="展開完整條款 ▼"
        collapseLabel="收合條款 ▲"
      >
        <div className={styles.body}>
          <ol className={styles.list}>
            <li>
              <strong>僅供參考，非專業建議：</strong>
              本工具所產出之試算、模擬、預估報酬、稅費、股數、FIRE 時程及其他數值，均係依您輸入之假設與簡化模型計算，
              <strong>僅供一般性參考</strong>
              ，不構成投資理財、資產配置、證券買賣、稅務申報、法律、會計或其他專業意見或建議，亦不代表對任何標的之推介、保證或預測。
            </li>
            <li>
              <strong>實際狀況以法令與機構為準：</strong>
              所得稅、股利課稅、二代健保補充保費、抵減上限、級距、申報方式、ETF 實際配息、淨值、手續費、匯率及金融市場報酬等，均可能隨法規、政策、契約或市場而變動；
              <strong>請以中華民國現行法令、主管機關函釋、稽徵機關認定、券商／基金公司公告及您個案之事實為準。</strong>
            </li>
            <li>
              <strong>資料與正確性：</strong>
              本工具可能使用預設參數、歷史或第三方資訊作為輸入便利，該等資訊
              <strong>未必即時、完整或正確</strong>
              ；開發者未就試算結果之正確性、完整性、適用性或可達成性為任何明示或默示之擔保。
            </li>
            <li>
              <strong>持續優化與微調：</strong>
              本工具將不定期優化與更新；對於計算邏輯、參數、介面或說明中可能之錯誤、疏漏或不一致，開發者得隨時酌情微調或修正。
              <strong>惟該等優化與微調並不保證</strong>
              試算結果之準確度、完整性，亦不擔保與法令、稽徵實務或市場實況完全一致。
            </li>
            <li>
              <strong>責任限制：</strong>
              因使用或無法使用本工具、信賴本工具之輸出、或依該輸出所為之任何決定，所致之任何直接、間接、附隨、特別或衍生性損害（包含但不限於投資損失、稅務爭議、機會成本），
              <strong>使用者應自行評估並承擔全部風險與責任</strong>
              ；在法律允許之最大範圍內，本工具之開發者與提供方不就前述事項負賠償或補償責任。
            </li>
            <li>
              <strong>條款變更：</strong>
              得隨時修改本聲明內容；修改後於本頁公告即視為您知悉，請定期查閱。
            </li>
          </ol>
          <p className={styles.footerNote}>若您需要個人化之投資、稅務或法律諮詢，請洽具合格證照之專業人員。</p>
        </div>
      </HomeFooterMobileExpand>
    </section>
  );
}
