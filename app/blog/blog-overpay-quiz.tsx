"use client";

import { useCallback, useState } from "react";
import styles from "./blog-overpay-quiz.module.css";

type Choice = "A" | "B" | "C" | null;

/**
 * 互動題：一年股利 10 萬實拿直覺測驗，選後揭示試算區間（教學用，非個案報稅結果）。
 */
export function BlogOverpayQuiz() {
  const [picked, setPicked] = useState<Choice>(null);

  const select = useCallback((c: Choice) => {
    setPicked(c);
  }, []);

  return (
    <div className={styles.wrap} role="region" aria-label="股利實拿直覺測驗">
      <p className={styles.prompt}>
        假設你一年現金股利約 <strong>100,000</strong> 元（教學用假設），你直覺「扣完該扣的」之後，實拿比較接近哪一個？
      </p>
      <div className={styles.options}>
        <button
          type="button"
          className={`${styles.optionBtn} ${picked === "A" ? styles.selected : ""}`}
          onClick={() => select("A")}
          disabled={picked !== null}
        >
          <strong>A.</strong> 大概 95,000～100,000（覺得稅跟健保很輕）
        </button>
        <button
          type="button"
          className={`${styles.optionBtn} ${picked === "B" ? styles.selected : ""}`}
          onClick={() => select("B")}
          disabled={picked !== null}
        >
          <strong>B.</strong> 大概 65,000～80,000（知道會被咬一大口）
        </button>
        <button
          type="button"
          className={`${styles.optionBtn} ${picked === "C" ? styles.selected : ""}`}
          onClick={() => select("C")}
          disabled={picked !== null}
        >
          <strong>C.</strong> 大概 45,000 以下（覺得會被扣到很誇張）
        </button>
      </div>
      {picked && (
        <div className={styles.reveal}>
          {picked === "A" && (
            <p>
              若走<strong>分離課稅 28%</strong>的粗估想像，光所得稅就約 <strong>28,000</strong>，再視單筆是否觸及二代健保門檻等，實拿常落在「七萬多～八萬多」這種量級——
              <strong>不是「差不多全拿」</strong>。選 A 的人很多，所以會有「我明明有配息，怎麼感覺沒變有錢」的落差。
            </p>
          )}
          {picked === "B" && (
            <p>
              你的直覺方向<strong>比較接近現實</strong>：在分離 28%＋可能的補充保費想像下，十萬級距的股利，實拿落在「六萬多～八萬多」並不罕見。重點是：下一步要確認——你其實有沒有機會用<strong>合併課稅＋股利抵減 8.5%</strong>留更多？
            </p>
          )}
          {picked === "C" && (
            <p>
              十萬這個級距，多數情境不會低到「四萬以下」那麼極端，但這代表你<strong>很在意漏掉的每一塊</strong>——這反而是好事。接下來用同一套假設去對照「合併／分離」與抵減，你會更清楚錢是從哪裡被折掉的。
            </p>
          )}
          <p className={styles.hint}>以上為觀念試算，實際依你的所得結構、申報方式與當年度法規為準。</p>
        </div>
      )}
    </div>
  );
}
