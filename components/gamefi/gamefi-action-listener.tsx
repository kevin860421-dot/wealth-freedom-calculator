"use client";

import { useEffect } from "react";
import { useGameFi } from "@/lib/gamefi/context/gamefi-context";

function isCalculatorActionTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.closest("[data-gamefi-ignore]")) return false;
  if (target.closest("nav, footer, header")) return false;

  const interactive = target.closest(
    'button, input[type="range"], input[type="number"], input[type="text"], select, [role="slider"], [role="tab"]',
  );
  if (!interactive || !(interactive instanceof HTMLElement)) return false;

  if (interactive.tagName === "A") return false;

  if (interactive instanceof HTMLInputElement) {
    if (interactive.type === "hidden" || interactive.type === "checkbox") {
      return false;
    }
    return true;
  }

  if (interactive.tagName === "BUTTON") {
    const type = interactive.getAttribute("type");
    if (type === "submit") return false;
    return true;
  }

  return true;
}

/** 全域無聲監聽：攔截計算機互動，累積操作次數 */
export function GameFiActionListener() {
  const { incrementActionCount } = useGameFi();

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!isCalculatorActionTarget(event.target)) return;
      incrementActionCount();
    };

    const onChange = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLInputElement)) return;
      if (target.type !== "range") return;
      if (!isCalculatorActionTarget(target)) return;
      incrementActionCount();
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("change", onChange, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("change", onChange, true);
    };
  }, [incrementActionCount]);

  return null;
}
