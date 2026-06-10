"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { filterTickerPresetsByQuery, getEtfShortName } from "../etf-fuzzy-search";
import styles from "./etf-filter-autocomplete.module.css";

type EtfFilterAutocompleteProps = {
  value: string;
  onChange: (raw: string) => void;
  onSelectEtf: (id: string) => void;
  placeholder?: string;
  title?: string;
  height?: number;
  inputStyle?: CSSProperties;
};

type DropdownPos = { top: number; left: number; width: number };

export function EtfFilterAutocomplete({
  value,
  onChange,
  onSelectEtf,
  placeholder = "例：0050",
  title,
  height = 44,
  inputStyle,
}: EtfFilterAutocompleteProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimerRef = useRef<number | null>(null);
  const [focused, setFocused] = useState(false);
  const [pos, setPos] = useState<DropdownPos>({ top: 0, left: 0, width: 0 });

  useEffect(() => {
    return () => {
      if (blurTimerRef.current != null) clearTimeout(blurTimerRef.current);
    };
  }, []);

  const matches = useMemo(() => filterTickerPresetsByQuery(value), [value]);
  const showDropdown = focused && value.trim().length > 0;

  const updatePos = useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      top: r.bottom + 4,
      left: r.left,
      width: r.width,
    });
  }, []);

  useEffect(() => {
    if (!showDropdown) return;
    updatePos();
    const onReflow = () => updatePos();
    window.addEventListener("resize", onReflow);
    window.addEventListener("scroll", onReflow, true);
    return () => {
      window.removeEventListener("resize", onReflow);
      window.removeEventListener("scroll", onReflow, true);
    };
  }, [showDropdown, updatePos, value]);

  const handleSelect = useCallback(
    (id: string) => {
      onSelectEtf(id);
      onChange(id);
      setFocused(false);
      inputRef.current?.blur();
    },
    [onChange, onSelectEtf],
  );

  return (
    <div className={styles.wrap} ref={wrapRef}>
      <input
        ref={inputRef}
        type="text"
        className={styles.input}
        placeholder={placeholder}
        title={title}
        value={value}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        enterKeyHint="search"
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          setFocused(true);
          updatePos();
        }}
        onBlur={() => {
          if (blurTimerRef.current != null) clearTimeout(blurTimerRef.current);
          blurTimerRef.current = window.setTimeout(() => setFocused(false), 160);
        }}
        style={{
          height,
          minHeight: height,
          ...inputStyle,
        }}
      />
      {showDropdown ? (
        <ul
          className={styles.dropdown}
          role="listbox"
          style={{ top: pos.top, left: pos.left, width: pos.width }}
        >
          {matches.length === 0 ? (
            <li className={styles.empty} role="presentation">
              ❌ 找不到相關 ETF
            </li>
          ) : (
            matches.map((preset) => (
              <li
                key={preset.id}
                className={styles.item}
                role="option"
                aria-selected={false}
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleSelect(preset.id);
                }}
              >
                <span className={styles.code}>{preset.id}</span>
                <span className={styles.sep}>|</span>
                <span className={styles.name}>{getEtfShortName(preset.label)}</span>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
