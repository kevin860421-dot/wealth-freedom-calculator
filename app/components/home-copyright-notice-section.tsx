"use client";

import { HomeFooterMobileExpand } from "./home-footer-mobile-expand";
import styles from "./home-copyright-notice-section.module.css";

type Props = {
  appVersion: string;
};

/**
 * 首頁版權說明：桌機完整內容；手機可展開全文。
 */
export function HomeCopyrightNoticeSection({ appVersion }: Props) {
  return (
    <section className={styles.root} aria-labelledby="copyright-notice-heading">
      <h2 id="copyright-notice-heading" className={styles.title}>
        版權說明
      </h2>
      <p className={styles.intro}>
        本網頁之<strong>程式碼、試算邏輯與專案檔案</strong>
        係以<strong>開放原始碼（Open Source）</strong>
        方式提供；具體授權條件以公開儲存庫內之 <strong>LICENSE</strong> 及各檔案標頭為準（常見為 MIT
        等寬鬆授權，惟以前開文件為準）。
      </p>

      <HomeFooterMobileExpand expandLabel="展開版權全文 ▼" collapseLabel="收合版權說明 ▲">
        <div className={styles.body}>
          <p>
            在遵守該授權條款之前提下，您得<strong>免費使用、研究、修改、重製與再散布</strong>
            本專案（含商業與非商業用途），無須另行取得個別書面同意；仍請依所適用之授權保留或重製著作權與授權聲明（例如 MIT
            之「License」與「Copyright」文字）。
          </p>
          <p>
            <strong>開放授權不代表任何擔保：</strong>
            本專案係依現狀（AS IS）提供，開發者不就正確性、完整性、可商用性、不侵權或符合特定目的為任何明示或默示之保證；亦不承擔因使用或無法使用所生之損害賠償責任，於法律允許之最大範圍內為限。
          </p>
          <p>
            <strong>不得據以主張對開發者之訴追：</strong>
            您同意：不得以「曾使用本開源專案／本工具」「信賴本工具輸出」或「本專案為開源可自由使用」等事由，單獨或主要作為對本專案作者、維護者或提供方提起民事、刑事、行政程序、仲裁、檢舉或索賠之依據；相關爭議與風險之評估仍應依上方「法律聲明與免責條款」及您所在地法令，由您自行承擔。
          </p>
          <p className={styles.footerNote}>
            本工具所依賴之第三方套件（例如 React、Next.js、試算相關函式庫等）各依其原專案授權條款；再散布或商用時請一併遵守。
          </p>
          <div className={styles.versionBadge}>版本　第 {appVersion} 版</div>
        </div>
      </HomeFooterMobileExpand>
    </section>
  );
}
