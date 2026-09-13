"use client";

import { useState } from "react";
import styles from "../blog/blog.module.css";

type Choice = "A" | "B" | "C" | null;

/** 00935 2026/09 這檔：最晚買進日是除息日前一交易日。 */
export function Exdiv2026Picker() {
  const [picked, setPicked] = useState<Choice>(null);

  return (
    <div className={styles.quiz} role="region" aria-label="00935 最後買進日測驗">
      <p>
        以<strong>已公告</strong>的 00935 這次（除息 2026/09/16）來說：你要領這次息，最晚買進日是哪一天？
      </p>
      <label>
        <input type="radio" name="exdiv-2026" checked={picked === "A"} onChange={() => setPicked("A")} />
        A. 9/15（除息日前一個交易日）
      </label>
      <label>
        <input type="radio" name="exdiv-2026" checked={picked === "B"} onChange={() => setPicked("B")} />
        B. 9/16（除息日當天再買）
      </label>
      <label>
        <input type="radio" name="exdiv-2026" checked={picked === "C"} onChange={() => setPicked("C")} />
        C. 10/15（發放日）
      </label>
      {picked === "A" ? (
        <p className={styles.callout}>
          對。這次最後買進日是 9/15；9/16 除息，預計 10/15 發放。金額與時程仍以野村投信公告為準。
        </p>
      ) : null}
      {picked === "B" ? (
        <p className={styles.callout}>除息日當天買，通常趕不上這次息。要領息，得在最後買進日收盤前持有。</p>
      ) : null}
      {picked === "C" ? (
        <p className={styles.callout}>10/15 是發放日，錢才入帳。資格在更早的最後買進日就決定了。</p>
      ) : null}
    </div>
  );
}
