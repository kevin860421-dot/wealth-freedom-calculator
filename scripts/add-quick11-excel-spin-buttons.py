#!/usr/bin/env python3
"""
Quick-11 Excel：C/D 微調按鈕 → 輸出 .xlsm

圖表／J21／J22 滾動條請先由 add-quick11-excel-xlwings-chart.py 寫入 .xlsx；
本腳本在既有圖表上追加 ± 微調按鈕並存成 .xlsm。

用法：
  py -3 -m pip install xlwings
  py -3 scripts/add-quick11-excel-xlwings-chart.py
  py -3 scripts/add-quick11-excel-spin-buttons.py
"""
from __future__ import annotations

import argparse
import importlib.util
import shutil
import sys
import tempfile
import uuid
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_IN = ROOT / "assets" / "downloads" / "quick11-loan-dti-template.xlsx"

XL_SPINNER = 16
XL_MOVE_AND_SIZE = 1

ROW_PRINCIPAL = 5
ROW_RATE = 6
ROW_YEARS = 7
ROW_INCOME = 8
COL_PLUS = 3
COL_MINUS = 4
COL_KNOB = 9


def _load_xlwings_chart_module():
    path = Path(__file__).with_name("add-quick11-excel-xlwings-chart.py")
    spec = importlib.util.spec_from_file_location("q11_xw_chart", path)
    if spec is None or spec.loader is None:
        raise RuntimeError("無法載入 add-quick11-excel-xlwings-chart.py")
    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)
    return mod


def _require_xlwings():
    try:
        import xlwings as xw  # noqa: PLC0415

        return xw
    except ImportError as exc:
        raise SystemExit("請先安裝 xlwings：py -3 -m pip install xlwings") from exc


def _cell_rect(ws, row: int, col_from: int, col_to: int) -> tuple[float, float, float, float]:
    left_cell = ws.api.Cells(row, col_from)
    right_cell = ws.api.Cells(row, col_to)
    left = float(left_cell.Left)
    top = float(left_cell.Top)
    width = float(right_cell.Left + right_cell.Width - left_cell.Left)
    height = float(left_cell.Height)
    pad = 1.5
    return left + pad, top + pad, max(12.0, width - pad * 2), max(14.0, height - pad * 2)


def _delete_old_controls(ws) -> None:
    for i in range(int(ws.api.Shapes.Count), 0, -1):
        name = str(ws.api.Shapes.Item(i).Name)
        if name.startswith(("Q11Spin", "Q11PlusBtn", "Q11MinusBtn", "Q11FloatAdjust")):
            ws.api.Shapes.Item(i).Delete()


def _add_spinner(
    ws,
    *,
    row: int,
    linked: str,
    min_val: int,
    max_val: int,
    small: int,
    large: int,
) -> None:
    left, top, width, height = _cell_rect(ws, row, COL_PLUS, COL_MINUS)
    shape = ws.api.Shapes.AddFormControl(XL_SPINNER, left, top, width, height)
    shape.Name = f"Q11Spin{row}"
    shape.Placement = XL_MOVE_AND_SIZE
    cf = shape.ControlFormat
    cf.LinkedCell = linked
    cf.Min = min_val
    cf.Max = max_val
    cf.SmallChange = small
    cf.LargeChange = large


def _clear_plus_minus_cells(ws, row: int) -> None:
    for col in (COL_PLUS, COL_MINUS):
        cell = ws.api.Cells(row, col)
        cell.Value2 = ""
        cell.Interior.ColorIndex = 0


def _setup_knob_row(
    ws,
    *,
    row: int,
    knob_addr: str,
    display_addr: str,
    formula: str,
    init_knob: int,
    num_fmt: str | None = None,
    spinner: dict[str, int],
) -> None:
    ws.range(knob_addr).value = init_knob
    display = ws.range(display_addr)
    display.api.Formula = formula
    if num_fmt:
        display.api.NumberFormat = num_fmt
    _add_spinner(ws, row=row, linked=knob_addr, **spinner)
    _clear_plus_minus_cells(ws, row)


def _setup_direct_row(
    ws,
    *,
    row: int,
    display_addr: str,
    init_val: int,
    num_fmt: str | None,
    spinner: dict[str, int],
) -> None:
    display = ws.range(display_addr)
    display.value = init_val
    if num_fmt:
        display.api.NumberFormat = num_fmt
    _add_spinner(ws, row=row, linked=display_addr, **spinner)
    _clear_plus_minus_cells(ws, row)


def _read_float(ws, addr: str, default: float) -> float:
    val = ws.range(addr).value
    if val is None:
        return default
    try:
        return float(val)
    except (TypeError, ValueError):
        return default


def upgrade_workbook(input_path: Path, output_path: Path) -> None:
    xw = _require_xlwings()
    chart_mod = _load_xlwings_chart_module()

    temp_in = Path(tempfile.gettempdir()) / f"quick11-spin-in-{uuid.uuid4().hex}.xlsx"
    shutil.copy2(input_path, temp_in)

    app = xw.App(visible=False, add_book=False)
    app.display_alerts = False
    wb = None
    try:
        wb = app.books.open(str(temp_in), update_links=False)
        ws = wb.sheets[0]

        _delete_old_controls(ws)
        ws.api.Columns(COL_KNOB).Hidden = True

        principal = _read_float(ws, "B5", 12_000_000)
        rate = _read_float(ws, "B6", 2.2)
        years = int(round(_read_float(ws, "B7", 30)))
        income = _read_float(ws, "B8", 80_000)

        _setup_knob_row(
            ws,
            row=ROW_PRINCIPAL,
            knob_addr="I5",
            display_addr="B5",
            formula="=I5*500000",
            init_knob=max(1, min(600, int(round(principal / 500_000)))),
            num_fmt="#,##0",
            spinner={"min_val": 1, "max_val": 600, "small": 1, "large": 10},
        )

        _setup_knob_row(
            ws,
            row=ROW_RATE,
            knob_addr="I6",
            display_addr="B6",
            formula="=I6*0.05",
            init_knob=max(2, min(200, int(round(rate / 0.05)))),
            num_fmt="0.00",
            spinner={"min_val": 2, "max_val": 200, "small": 1, "large": 5},
        )

        _setup_direct_row(
            ws,
            row=ROW_YEARS,
            display_addr="B7",
            init_val=max(1, min(40, years)),
            num_fmt="0",
            spinner={"min_val": 1, "max_val": 40, "small": 1, "large": 5},
        )

        _setup_knob_row(
            ws,
            row=ROW_INCOME,
            knob_addr="I8",
            display_addr="B8",
            formula="=I8*5000",
            init_knob=max(0, min(200, int(round(income / 5_000)))),
            num_fmt="#,##0",
            spinner={"min_val": 0, "max_val": 200, "small": 1, "large": 4},
        )

        # 若 xlsx 尚未跑 xlwings 圖表步驟，在此補建
        if int(ws.api.ChartObjects().Count) == 0:
            cols = chart_mod.resolve_data_columns(ws)
            annuity = wb.sheets[1].name
            equal = wb.sheets[2].name
            chart_mod.setup_hidden_data(ws, annuity, equal, cols)
            chart_mod.add_interest_chart(ws, cols)
            chart_mod.add_scroll_hint(ws)
            chart_mod.add_chart_scrollbar(ws)

        app.api.CalculateFull()

        out = Path(output_path)
        if out.exists():
            out.unlink()
        wb.api.SaveAs(str(out.resolve()), FileFormat=52)
        print(f"Wrote .xlsm → {out}  （±微調 + 圖表）")
    finally:
        if wb is not None:
            wb.close()
        app.quit()
        temp_in.unlink(missing_ok=True)


def main() -> int:
    parser = argparse.ArgumentParser(description="Quick-11：Form Control 微調按鈕 → .xlsm")
    parser.add_argument("-i", "--input", type=Path, default=DEFAULT_IN)
    parser.add_argument("-o", "--output", type=Path, default=None, help="預設：與 input 同目錄 .xlsm")
    args = parser.parse_args()

    in_path = args.input.resolve()
    if not in_path.exists():
        print(f"找不到輸入檔：{in_path}", file=sys.stderr)
        return 1

    out_path = (args.output or in_path.with_suffix(".xlsm")).resolve()

    try:
        upgrade_workbook(in_path, out_path)
    except Exception as exc:
        print(f"錯誤：{exc}", file=sys.stderr)
        print("提示：請關閉 Excel 後重試；並確認已安裝 xlwings 與 Microsoft Excel。", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
