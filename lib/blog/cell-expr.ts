/**
 * Spreadsheet-style cell math (Excel / Google Sheets / Handsontable):
 * type 8+1 or =12/2 in the cell, Enter or blur evaluates.
 * Only + - * / and parentheses. No JS eval of arbitrary code.
 */
export function evaluateNumericCell(raw: string): number | null {
  const src = raw
    .trim()
    .replace(/\s+/g, "")
    .replace(/^=/, "")
    .replace(/×/g, "*")
    .replace(/÷/g, "/")
    .replace(/＋/g, "+")
    .replace(/－/g, "-");
  if (!src) return null;
  if (!/^[0-9+\-*/().]+$/.test(src)) return null;

  let i = 0;
  const peek = () => src[i] ?? "";
  const eat = () => src[i++] ?? "";

  function parseExpression(): number {
    let value = parseTerm();
    while (peek() === "+" || peek() === "-") {
      const op = eat();
      const right = parseTerm();
      value = op === "+" ? value + right : value - right;
    }
    return value;
  }

  function parseTerm(): number {
    let value = parseFactor();
    while (peek() === "*" || peek() === "/") {
      const op = eat();
      const right = parseFactor();
      if (op === "/" && right === 0) throw new Error("div0");
      value = op === "*" ? value * right : value / right;
    }
    return value;
  }

  function parseFactor(): number {
    if (peek() === "+") {
      eat();
      return parseFactor();
    }
    if (peek() === "-") {
      eat();
      return -parseFactor();
    }
    if (peek() === "(") {
      eat();
      const value = parseExpression();
      if (eat() !== ")") throw new Error("paren");
      return value;
    }
    const start = i;
    if (!/\d/.test(peek())) throw new Error("num");
    while (/\d/.test(peek())) eat();
    if (peek() === ".") {
      eat();
      while (/\d/.test(peek())) eat();
    }
    return Number(src.slice(start, i));
  }

  try {
    const value = parseExpression();
    if (i !== src.length || !Number.isFinite(value)) return null;
    return value;
  } catch {
    return null;
  }
}
