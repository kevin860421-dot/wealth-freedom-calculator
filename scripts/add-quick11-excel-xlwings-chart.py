#!/usr/bin/env python3
"""
Quick-11 Excel _finalize_：xlwings + 本機 Excel 原生核心

- 刪除幽靈文字框（含 xls-savings-chart 等）
- C/D 欄插入 Form Control「微調按鈕」（Spin Button，無 VBA）
- J2:Q11 淺色靜態折線圖（約原尺寸 1/4）+ C/D ± 按鈕
- 輸出 .xlsm 至 assets 與 D:\\下載

一鍵執行（請先關閉 Excel）：
  py -3 -m pip install xlwings
  py -3 scripts/add-quick11-excel-xlwings-chart.py

或：
  npm run generate:quick11-excel-chart
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
import uuid
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FuturesTimeoutError
from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DEFAULT_IN = ROOT / "assets" / "downloads" / "quick11-loan-dti-template.xlsx"
DEFAULT_XLSM = ROOT / "assets" / "downloads" / "quick11-loan-dti-template.xlsm"
PUBLIC_OUT = ROOT / "public" / "downloads" / "quick11-loan-dti-template.xlsx"
USER_XLSM = Path(r"D:\下載\quick11-home-v5-dual-sheets.xlsm")
XLWINGS_TIMEOUT_SEC = 120

XL_LINE = 4
XL_COLUMNS = 2
XL_SCROLL_BAR = 8
XL_BUTTON = 0
XL_MOVE_AND_SIZE = 1
XL_SPINNER = 16  # 多數環境無法建立；改以 C/D 表單按鈕 + VBA
MSO_SHAPE_ROUNDED_RECTANGLE = 5

COL_LABEL = 1  # A
COL_INPUT = 2  # B
COL_PLUS = 3  # C
COL_MINUS = 4  # D
COL_KNOB = 9  # I（年利率等需小數步進時用）

CHART_ROW_START = 2
CHART_ROW_END = 11  # 約原高度 1/2 → 面積 ~1/4
CHART_COL_START = 10  # J
CHART_COL_END = 17  # Q（原 W=23，約 1/2 寬）

DROPDOWN_COL_PRINCIPAL = 30  # AD
DROPDOWN_COL_INCOME = 31  # AE
DEFAULT_SCROLL_COL = 26
DEFAULT_YEAR_COL = 27
DEFAULT_ANN_COL = 28
DEFAULT_EQ_COL = 29
DATA_START = 2
DATA_ROWS = 50
MILESTONE_YEARS = (1, 25, 50)

CHART_TITLE_STATIC = "📊 累積利息消長對比圖"
LOAN_PRESETS = (
    ("🛵 機車貸", 50_000, 14.0, 4, 36_000),
    ("🚗 汽車貸", 800_000, 4.2, 7, 65_000),
    ("💳 信貸", 500_000, 8.0, 5, 55_000),
    ("🏠 房貸", 11_000_000, 2.2, 30, 120_000),
    ("🎓 學貸", 450_000, 1.9, 10, 42_000),
    ("🛠 裝潢貸", 1_000_000, 3.5, 10, 75_000),
)
PRESET_ROW = 3
# (短標, 填色 BGR, 邊框 BGR, 字色 BGR)
PRESET_BTN_STYLES = (
    ("機車貸", 0xE8D4F8, 0x9060C0, 0x402060),
    ("汽車貸", 0xD4E8FF, 0x2060C0, 0x203060),
    ("信貸", 0xD4F0FF, 0x0080C0, 0x004060),
    ("房貸", 0xD4F8E8, 0x008050, 0x004030),
    ("學貸", 0xE8D4F8, 0x7040A0, 0x302050),
    ("裝潢貸", 0xD4ECFF, 0x0080A0, 0x004050),
)
GHOST_MARKERS = ("xls-savings", "xls_savings", "savings-chart", "chart-placeholder")

# 淺色主題
LIGHT_BG_BGR = 0xFFFFFF  # #FFFFFF
LIGHT_PAGE_BGR = 0xFCFAF8  # #F8FAFC
TEXT_DARK_BGR = 0x3B291E  # #1E293B
TEXT_MUTED_BGR = 0x64748B  # #64748B
GRID_LIGHT_BGR = 0xE2E8F0  # #E2E8F0
COLOR_ANNUITY_BGR = 0x5A5AFF  # #FF5A5A 珊瑚紅
COLOR_EQUAL_BGR = 0xA16903  # #0369A1 經典深藍（resultValue）
XL_LABEL_ABOVE = 2
XL_LABEL_LEFT = -4131
FONT_CHART = "Microsoft JhengHei UI"
XL_VALIDATE_LIST = 3


class FileBusyError(RuntimeError):
    """輸出檔被 Excel／其他程序占用，應立即停止。"""


def _is_file_locked(path: Path) -> bool:
    if not path.exists():
        return False
    try:
        with path.open("r+b") as handle:
            if sys.platform == "win32":
                import msvcrt

                msvcrt.locking(handle.fileno(), msvcrt.LK_NBLCK, 1)
                msvcrt.locking(handle.fileno(), msvcrt.LK_UNLCK, 1)
        return False
    except (OSError, PermissionError):
        return True


def _assert_paths_writable(*paths: Path) -> None:
    locked = [str(p) for p in paths if _is_file_locked(p)]
    if locked:
        joined = "\n  ".join(locked)
        raise FileBusyError(
            f"下列檔案使用中，已停止（請關閉 Excel 後重試）：\n  {joined}"
        )


def _require_writable_output(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    probe = path.parent / f".q11-write-probe-{uuid.uuid4().hex}.tmp"
    try:
        probe.write_text("ok", encoding="utf-8")
        probe.unlink()
    except OSError as exc:
        raise FileBusyError(f"無法寫入目錄 {path.parent}：{exc}") from exc


@dataclass(frozen=True)
class ChartDataColumns:
    year: int
    ann: int
    eq: int
    scroll: int = DEFAULT_SCROLL_COL

    @property
    def year_letter(self) -> str:
        return _col_letter(self.year)

    @property
    def ann_letter(self) -> str:
        return _col_letter(self.ann)

    @property
    def eq_letter(self) -> str:
        return _col_letter(self.eq)


@dataclass(frozen=True)
class SpinnerSpec:
    label: str
    row: int
    linked: str
    small: int
    large: int
    min_val: int
    max_val: int
    num_fmt: str | None = None
    display_formula: str | None = None  # 若需 B=I*n，填 "=I5*500000" 等


def _require_xlwings():
    try:
        import xlwings as xw  # noqa: PLC0415

        return xw
    except ImportError as exc:
        raise SystemExit("請先安裝 xlwings：py -3 -m pip install xlwings") from exc


def _col_letter(col: int) -> str:
    s, n = "", col
    while n:
        n, r = divmod(n - 1, 26)
        s = chr(65 + r) + s
    return s


def _range_rect(ws, r1: int, r2: int, c1: int, c2: int) -> tuple[float, float, float, float]:
    tl, br = ws.api.Cells(r1, c1), ws.api.Cells(r2, c2)
    return (
        float(tl.Left),
        float(tl.Top),
        float(br.Left + br.Width - tl.Left),
        float(br.Top + br.Height - tl.Top),
    )


def _cell_rect_single(ws, row: int, col: int) -> tuple[float, float, float, float]:
    cell = ws.api.Cells(row, col)
    pad = 1.0
    return (
        float(cell.Left) + pad,
        float(cell.Top) + pad,
        max(12.0, float(cell.Width) - pad * 2),
        max(14.0, float(cell.Height) - pad * 2),
    )


def _read_float(ws, addr: str, default: float) -> float:
    v = ws.range(addr).value
    if v is None:
        return default
    try:
        return float(v)
    except (TypeError, ValueError):
        return default


def _find_row_by_label(ws, label: str, search_rows: range = range(1, 25)) -> int | None:
    for r in search_rows:
        v = ws.api.Cells(r, COL_LABEL).Value
        if v and str(v).strip().startswith(label):
            return r
    return None


def resolve_input_rows(ws) -> dict[str, int]:
    """依 A 欄標籤找列；範本預設 5～8 列。"""
    mapping = {
        "principal": "貸款本金",
        "rate": "年利率",
        "years": "貸款年期",
        "income": "月收入",
    }
    rows: dict[str, int] = {}
    for key, label in mapping.items():
        r = _find_row_by_label(ws, label)
        if r is None:
            defaults = {"principal": 6, "rate": 7, "years": 8, "income": 9}
            r = defaults[key]
        rows[key] = r
    return rows


def remove_ghost_shapes(ws) -> None:
    """刪除幽靈文字框、舊圖表占位、舊 Q11 控制項。"""
    for i in range(int(ws.api.Shapes.Count), 0, -1):
        sh = ws.api.Shapes.Item(i)
        name = str(sh.Name).lower()
        if name.startswith(("q11spin", "q11chartscroll", "q11interestchart")):
            continue
        if name.startswith(("q11",)):
            sh.Delete()
            continue
        if sh.Type in (17, 6):  # msoTextBox, msoTextEffect
            sh.Delete()
            continue
        for marker in GHOST_MARKERS:
            if marker in name:
                sh.Delete()
                break

    for i in range(int(ws.api.ChartObjects().Count), 0, -1):
        ws.api.ChartObjects(i).Delete()


def _delete_input_controls(ws) -> None:
    """只刪輸入區按鈕／舊捲軸；**不**刪圖表與 J22 滾動條。"""
    for i in range(int(ws.api.Shapes.Count), 0, -1):
        name = str(ws.api.Shapes.Item(i).Name)
        if name.startswith(("Q11Spin", "Q11PlusBtn", "Q11MinusBtn", "Q11FloatAdjust", "Q11PresetBtn")):
            ws.api.Shapes.Item(i).Delete()


def resolve_data_columns(ws) -> ChartDataColumns:
    defaults = {"年": DEFAULT_YEAR_COL, "本息累積利息": DEFAULT_ANN_COL, "本金平均累積利息": DEFAULT_EQ_COL}
    for col in range(26, 33):
        val = ws.api.Cells(1, col).Value
        if val in defaults:
            defaults[str(val)] = col
    if ws.api.Cells(1, DEFAULT_SCROLL_COL).Value is None:
        ws.api.Cells(1, DEFAULT_SCROLL_COL).Value = "scroll_knob"
    return ChartDataColumns(defaults["年"], defaults["本息累積利息"], defaults["本金平均累積利息"])


def _cell_band_rect(ws, row: int, col_start: int, col_end: int) -> tuple[float, float, float, float]:
    """一列中 col_start～col_end 的可用矩形（供六顆等寬按鈕）。"""
    a, b = ws.api.Cells(row, col_start), ws.api.Cells(row, col_end)
    pad = 2.0
    return (
        float(a.Left) + pad,
        float(a.Top) + 1,
        max(40.0, float(b.Left + b.Width - a.Left) - pad * 2),
        max(16.0, float(a.Height) - 2),
    )


def _milestone_years_for_term(term: int) -> tuple[int, ...]:
    term = max(1, min(DATA_ROWS - 1, int(term)))
    mid = max(2, term // 2)
    out = {1, mid, term}
    if term + 1 <= DATA_ROWS:
        out.add(term + 1)
    return tuple(sorted(out))


def setup_chart_data(ws, annuity: str, equal: str, cols: ChartDataColumns) -> None:
    yl, last = cols.year_letter, DATA_START + DATA_ROWS - 1
    ws.api.Cells(1, cols.scroll).Value = "scroll_knob"
    ws.api.Cells(1, cols.scroll).NumberFormat = "0"
    ws.api.Columns(cols.scroll).Hidden = True

    for hdr, c in (("年", cols.year), ("本息累積利息", cols.ann), ("本金平均累積利息", cols.eq)):
        ws.api.Cells(1, c).Value = hdr
        ws.api.Cells(1, c).Font.Bold = True

    ann_q, eq_q = f"'{annuity}'", f"'{equal}'"
    yrs = _find_row_by_label(ws, "貸款年期") or 8
    y_expr = f"ROW()-{DATA_START - 1}"
    cap_m = f"$B${yrs}*12"

    for r in range(DATA_START, last + 1):
        ws.api.Cells(r, cols.year).Formula = f"=IF({y_expr}<=$B${yrs}+1,{y_expr},NA())"
        ws.api.Cells(r, cols.year).NumberFormat = "0"

        sum_ann = (
            f"SUMIFS({ann_q}!$C$4:$C$603,{ann_q}!$A$4:$A$603,"
            f'"<="&MIN({y_expr}*12,{cap_m}))'
        )
        cap_ann = f"SUMIFS({ann_q}!$C$4:$C$603,{ann_q}!$A$4:$A$603,\"<=\"&{cap_m})"
        ws.api.Cells(r, cols.ann).Formula = (
            f"=IF({y_expr}<=$B${yrs}+1,"
            f"IF({y_expr}<=$B${yrs},{sum_ann},{cap_ann}),NA())"
        )
        ws.api.Cells(r, cols.ann).NumberFormat = "#,##0"

        sum_eq = (
            f"SUMIFS({eq_q}!$C$4:$C$603,{eq_q}!$A$4:$A$603,"
            f'"<="&MIN({y_expr}*12,{cap_m}))'
        )
        cap_eq = f"SUMIFS({eq_q}!$C$4:$C$603,{eq_q}!$A$4:$A$603,\"<=\"&{cap_m})"
        ws.api.Cells(r, cols.eq).Formula = (
            f"=IF({y_expr}<=$B${yrs}+1,"
            f"IF({y_expr}<=$B${yrs},{sum_eq},{cap_eq}),NA())"
        )
        ws.api.Cells(r, cols.eq).NumberFormat = "#,##0"

    for c in range(cols.year, cols.eq + 1):
        ws.api.Columns(c).Hidden = False
        ws.api.Columns(c).ColumnWidth = 0.5


def remove_legacy_chart_ui(ws) -> None:
    """移除滾動條、J1 動態公式列、舊圖表占位。"""
    for i in range(int(ws.api.Shapes.Count), 0, -1):
        name = str(ws.api.Shapes.Item(i).Name)
        if name in ("Q11ChartScrollBar", "Premium_Interest_Chart") or "ChartScroll" in name:
            ws.api.Shapes.Item(i).Delete()

    for r in range(1, 23):
        try:
            ws.api.Range(ws.api.Cells(r, CHART_COL_START), ws.api.Cells(r, CHART_COL_END)).UnMerge()
        except Exception:
            pass
        ws.api.Range(ws.api.Cells(r, CHART_COL_START), ws.api.Cells(r, CHART_COL_END)).ClearContents()
        ws.api.Range(ws.api.Cells(r, CHART_COL_START), ws.api.Cells(r, CHART_COL_END)).Interior.ColorIndex = 0

    z1 = ws.api.Range("Z1")
    z1.ClearContents()
    z1.Interior.ColorIndex = 0
    ws.api.Columns(DEFAULT_SCROLL_COL).Hidden = True


def clean_chart_zone(ws) -> None:
    """J2:W20 淺色底；不寫公式。"""
    remove_legacy_chart_ui(ws)
    zone = ws.api.Range(
        ws.api.Cells(CHART_ROW_START, CHART_COL_START),
        ws.api.Cells(CHART_ROW_END, CHART_COL_END),
    )
    zone.Interior.Color = LIGHT_PAGE_BGR
    for col in range(CHART_COL_START, CHART_COL_END + 1):
        ws.api.Columns(col).ColumnWidth = 10

def _set_chart_font(obj, *, size: int | None = None, bold: bool = False, color: int | None = None) -> None:
    try:
        obj.Name = FONT_CHART
        if size is not None:
            obj.Size = size
        obj.Bold = bold
        if color is not None:
            obj.Color = color
    except Exception:
        pass


def _style_light_chart(chart) -> None:
    """純白／淡灰藍底 + 深藍文字；與左側淺色表格一致。"""
    chart.HasTitle = True
    chart.ChartTitle.Text = CHART_TITLE_STATIC
    _set_chart_font(chart.ChartTitle.Font, size=10, bold=True, color=TEXT_DARK_BGR)

    chart.ChartArea.Format.Fill.ForeColor.RGB = LIGHT_BG_BGR
    chart.ChartArea.Format.Line.Visible = 0
    plot = chart.PlotArea
    plot.Format.Fill.ForeColor.RGB = LIGHT_BG_BGR
    plot.Format.Line.Visible = 0

    for axis_idx in (1, 2):
        ax = chart.Axes(axis_idx)
        ax.HasTitle = False
        ax.Format.Line.ForeColor.RGB = GRID_LIGHT_BGR
        _set_chart_font(ax.TickLabels.Font, size=8, color=TEXT_DARK_BGR)
        if axis_idx == 1:
            ax.HasMajorGridlines = False
        else:
            ax.HasMajorGridlines = True
            try:
                ax.MajorGridlines.Format.Line.ForeColor.RGB = GRID_LIGHT_BGR
            except Exception:
                pass
    chart.Axes(2).TickLabels.NumberFormat = '[>=10000]0,"萬";#,##0'
    if chart.HasLegend:
        _set_chart_font(chart.Legend.Font, size=8, color=TEXT_MUTED_BGR)


def _reserve_plot_area_margin(chart) -> None:
    """縮小繪圖區、留右側邊距，避免最末數據標籤被裁切（對齊 Excel 官方／Peltier 作法）。"""
    pa = chart.PlotArea
    area = chart.ChartArea
    for _ in range(6):
        try:
            w = float(area.Width)
            h = float(area.Height)
            pa.Left = w * 0.10
            pa.Top = h * 0.20
            pa.Width = w * 0.70
            pa.Height = h * 0.58
            break
        except Exception:
            pass


def _apply_milestone_labels(series, milestones: tuple[int, ...]) -> None:
    """依貸款年期顯示節點標籤；最末點置左避免裁切。"""
    try:
        series.HasDataLabels = False
    except Exception:
        pass

    point_count = int(series.Points().Count)
    last_ms = milestones[-1] if milestones else 0
    for year in milestones:
        if year < 1 or year > point_count:
            continue
        try:
            pt = series.Points(year)
            pt.HasDataLabel = True
            dl = pt.DataLabel
            dl.ShowValue = True
            dl.ShowCategoryName = False
            dl.ShowSeriesName = False
            dl.ShowLegendKey = False
            if year == last_ms:
                dl.Position = XL_LABEL_LEFT
            else:
                dl.Position = XL_LABEL_ABOVE
            dl.Font.Bold = True
            dl.Font.Size = 8
            dl.Font.Name = FONT_CHART
            dl.Font.Color = TEXT_DARK_BGR
            dl.NumberFormat = "#,##0"
        except Exception:
            continue


def add_line_chart(ws, cols: ChartDataColumns, rows: dict[str, int]) -> None:
    """J2:Q11 淺色靜態折線圖；X 軸隨 B 欄年期 +1 截斷（#N/A）。"""
    last = DATA_START + DATA_ROWS - 1
    yc, ac, ec = cols.year, cols.ann, cols.eq
    term = int(round(_read_float(ws, f"B{rows['years']}", 30)))
    milestones = _milestone_years_for_term(term)

    for c in (yc, ac, ec):
        ws.api.Columns(c).Hidden = False
    try:
        ws.api.CalculateFullRebuild()
    except Exception:
        ws.api.Calculate()

    left, top, w, h = _range_rect(ws, CHART_ROW_START, CHART_ROW_END, CHART_COL_START, CHART_COL_END)
    shape = ws.api.Shapes.AddChart2(240, XL_LINE, left, top, w, h)
    shape.Name = "Q11InterestChart"
    shape.Placement = XL_MOVE_AND_SIZE
    chart = shape.Chart

    src = ws.api.Range(ws.api.Cells(1, ac), ws.api.Cells(last, ec))
    chart.SetSourceData(Source=src, PlotBy=XL_COLUMNS)
    xvals = ws.api.Range(ws.api.Cells(DATA_START, yc), ws.api.Cells(last, yc))

    n = chart.SeriesCollection().Count
    for i in range(1, n + 1):
        s = chart.SeriesCollection(i)
        s.XValues = xvals
        s.Smooth = True
        if i == 1:
            s.Name = "本息均攤"
            s.Format.Line.ForeColor.RGB = COLOR_ANNUITY_BGR
            s.Format.Line.Weight = 2.25
            _apply_milestone_labels(s, milestones)
        elif i == 2:
            s.Name = "本金平均"
            s.Format.Line.ForeColor.RGB = COLOR_EQUAL_BGR
            s.Format.Line.Weight = 2.25

    if n < 2:
        raise RuntimeError(f"折線圖系列不足（{n}）；AB2={ws.api.Cells(2, ac).Value!r}")

    _style_light_chart(chart)
    _reserve_plot_area_margin(chart)
    chart.HasLegend = True
    chart.Legend.Position = -4107
    _set_chart_font(chart.Legend.Font, size=8, color=TEXT_MUTED_BGR)
    try:
        chart.Legend.Format.Fill.ForeColor.RGB = LIGHT_BG_BGR
    except Exception:
        pass
    try:
        ax = chart.Axes(1)
        ax.MinimumScale = 1
        ax.MaximumScale = term + 1
        ax.MajorUnit = max(1, (term + 1) // 10)
    except Exception:
        pass
    chart.Refresh()

    for c in (yc, ac, ec):
        ws.api.Columns(c).Hidden = False
        ws.api.Columns(c).ColumnWidth = 0.5
    print(
        f"[chart] J{CHART_ROW_START}:Q{CHART_ROW_END}  系列={n}  "
        f"年期={term}  X軸≤{term + 1}  標籤={milestones}"
    )


def clear_input_cell_notes(ws) -> None:
    """移除 B/C/D 輸入列共 12 則角標說明（紅三角註解）。"""
    rows = resolve_input_rows(ws)
    n = 0
    for r in rows.values():
        for c in (COL_INPUT, COL_PLUS, COL_MINUS):
            cell = ws.api.Cells(r, c)
            try:
                cell.ClearComments()
            except Exception:
                pass
            try:
                if cell.Comment is not None:
                    cell.Comment.Delete()
            except Exception:
                pass
            n += 1
    print(f"[notes] 已清除輸入區註解 {n} 格")


def setup_dropdown_lists(ws) -> None:
    """AD/AE 欄：本金／收入快選清單（供 B 欄 ▾ 下拉）。"""
    pr, inc = DROPDOWN_COL_PRINCIPAL, DROPDOWN_COL_INCOME
    ws.api.Cells(1, pr).Value = "principal_list"
    for i in range(41):
        ws.api.Cells(2 + i, pr).Value = 5_000_000 + i * 500_000
    ws.api.Cells(1, inc).Value = "income_list"
    for i in range(41):
        ws.api.Cells(2 + i, inc).Value = 50_000 + i * 5_000
    for c in (pr, inc):
        ws.api.Columns(c).Hidden = True


def apply_input_dropdowns(ws) -> None:
    """B 欄四項：清單驗證 + InCellDropdown，顯示下拉箭頭。"""
    setup_dropdown_lists(ws)
    rows = resolve_input_rows(ws)
    pr_l = f"=${_col_letter(DROPDOWN_COL_PRINCIPAL)}$2:${_col_letter(DROPDOWN_COL_PRINCIPAL)}$42"
    in_l = f"=${_col_letter(DROPDOWN_COL_INCOME)}$2:${_col_letter(DROPDOWN_COL_INCOME)}$42"
    specs = {
        "principal": (pr_l, "#,##0"),
        "rate": ("1.0,1.2,1.5,1.8,2.0,2.2,2.5,2.8,3.0,3.5,4.0,5.0", "0.00"),
        "years": ("5,10,15,20,25,30,35,40,45,50", "0"),
        "income": (in_l, "#,##0"),
    }
    for key, (list_str, num_fmt) in specs.items():
        cell = ws.api.Cells(rows[key], COL_INPUT)
        try:
            cell.Validation.Delete()
        except Exception:
            pass
        cell.Validation.Add(XL_VALIDATE_LIST, 1, 1, list_str)
        v = cell.Validation
        v.IgnoreBlank = False
        v.InCellDropdown = True
        v.ShowInput = False
        v.ShowError = True
        v.ErrorTitle = "請由清單選擇"
        v.ErrorMessage = "請點儲存格右側 ▾ 下拉選單，或按 C/D ± 微調。"
        cell.NumberFormat = num_fmt
    print("[dropdown] B 欄已啟用 ▾ 下拉清單")


def add_scroll_hint(ws) -> None:
    pass  # 已移除滾動條，保留函式避免舊呼叫


def add_chart_scrollbar(ws) -> None:
    pass  # 已移除滾動條


def _build_vba_module(sheet_name: str, rows: dict[str, int]) -> str:
    """純 VBA；寫入儲存格含 50290 重試（Excel 未就緒時）。"""
    rp, rr, ry, ri = rows["principal"], rows["rate"], rows["years"], rows["income"]
    sn = sheet_name.replace('"', '""')
    preset_vba = "".join(
        f"\nPublic Sub Q11Preset{i}()\n  Call Q11LoadPreset({pr}, {rate}, {yrs}, {inc})\nEnd Sub"
        for i, (_, pr, rate, yrs, inc) in enumerate(LOAN_PRESETS, 1)
    )
    return f"""Option Explicit

Private Const Q11_HOME_SHEET As String = "{sn}"

Private Function Q11Home() As Worksheet
  Set Q11Home = ThisWorkbook.Worksheets(Q11_HOME_SHEET)
End Function

Private Function Q11Num(v As Variant) As Double
  If IsNumeric(v) Then
    Q11Num = CDbl(v)
  Else
    Q11Num = 0
  End If
End Function

Private Function Q11Clamp(d As Double, lo As Double, hi As Double) As Double
  If d < lo Then
    Q11Clamp = lo
  ElseIf d > hi Then
    Q11Clamp = hi
  Else
    Q11Clamp = d
  End If
End Function

Private Function Q11Round2(d As Double) As Double
  Q11Round2 = Int(d * 100 + 0.5) / 100
End Function

Private Sub Q11SetCell(ByVal addr As String, ByVal newVal As Double, ByVal fmt As String)
  Dim i As Long
  Dim ws As Worksheet
  Set ws = Q11Home()
  For i = 1 To 8
    On Error GoTo Q11Retry
    Do While Not Application.Ready
      DoEvents
    Loop
    Application.EnableEvents = False
    Application.ScreenUpdating = False
    ws.Range(addr).Value2 = newVal
    ws.Range(addr).NumberFormat = fmt
    Application.ScreenUpdating = True
    Application.EnableEvents = True
    Exit Sub
Q11Retry:
    Application.ScreenUpdating = True
    Application.EnableEvents = True
    If Err.Number = 50290 Or Err.Number = 1004 Then
      Err.Clear
      DoEvents
    Else
      Err.Raise Err.Number
    End If
  Next i
End Sub

Public Sub Q11PlusPrincipal()
  Dim v As Double
  v = Q11Num(Q11Home().Range("B{rp}").Value2)
  Q11SetCell "B{rp}", Q11Clamp(v + 500000, 500000, 300000000), "#,##0"
End Sub

Public Sub Q11MinusPrincipal()
  Dim v As Double
  v = Q11Num(Q11Home().Range("B{rp}").Value2)
  Q11SetCell "B{rp}", Q11Clamp(v - 500000, 500000, 300000000), "#,##0"
End Sub

Public Sub Q11PlusRate()
  Dim v As Double
  v = Q11Num(Q11Home().Range("B{rr}").Value2)
  Q11SetCell "B{rr}", Q11Round2(Q11Clamp(v + 0.05, 0.1, 20)), "0.00"
End Sub

Public Sub Q11MinusRate()
  Dim v As Double
  v = Q11Num(Q11Home().Range("B{rr}").Value2)
  Q11SetCell "B{rr}", Q11Round2(Q11Clamp(v - 0.05, 0.1, 20)), "0.00"
End Sub

Public Sub Q11PlusYears()
  Dim v As Double
  v = Q11Num(Q11Home().Range("B{ry}").Value2)
  Q11SetCell "B{ry}", Q11Clamp(v + 1, 1, 50), "0"
  Call Q11RefreshChartAxis
End Sub

Public Sub Q11MinusYears()
  Dim v As Double
  v = Q11Num(Q11Home().Range("B{ry}").Value2)
  Q11SetCell "B{ry}", Q11Clamp(v - 1, 1, 50), "0"
  Call Q11RefreshChartAxis
End Sub

Public Sub Q11PlusIncome()
  Dim v As Double
  v = Q11Num(Q11Home().Range("B{ri}").Value2)
  Q11SetCell "B{ri}", Q11Clamp(v + 5000, 0, 1000000), "#,##0"
End Sub

Public Sub Q11MinusIncome()
  Dim v As Double
  v = Q11Num(Q11Home().Range("B{ri}").Value2)
  Q11SetCell "B{ri}", Q11Clamp(v - 5000, 0, 1000000), "#,##0"
End Sub

Private Sub Q11LoadPreset(ByVal pr As Double, ByVal rate As Double, ByVal yrs As Double, ByVal inc As Double)
  Q11SetCell "B{rp}", pr, "#,##0"
  Q11SetCell "B{rr}", rate, "0.00"
  Q11SetCell "B{ry}", yrs, "0"
  Q11SetCell "B{ri}", inc, "#,##0"
  Call Q11RefreshChartAxis
End Sub

Public Sub Q11RefreshChartAxis()
  Dim yrs As Long
  Dim cht As Chart
  On Error GoTo Q11ChartDone
  yrs = CLng(Q11Clamp(Q11Num(Q11Home().Range("B{ry}").Value2), 1, 50))
  Set cht = Q11Home().Shapes("Q11InterestChart").Chart
  cht.Axes(1).MinimumScale = 1
  cht.Axes(1).MaximumScale = yrs + 1
  If (yrs + 1) <= 10 Then
    cht.Axes(1).MajorUnit = 1
  ElseIf (yrs + 1) <= 20 Then
    cht.Axes(1).MajorUnit = 2
  Else
    cht.Axes(1).MajorUnit = (yrs + 1) \\ 10
    If cht.Axes(1).MajorUnit < 1 Then cht.Axes(1).MajorUnit = 1
  End If
Q11ChartDone:
End Sub
{preset_vba}
"""


def inject_vba_module(wb, sheet_name: str, rows: dict[str, int]) -> None:
    code = _build_vba_module(sheet_name, rows)
    vbext_ct_std_module = 1
    try:
        vbproj = wb.api.VBProject
    except Exception as exc:
        raise RuntimeError(
            "無法寫入 VBA。請在 Excel：檔案→選項→信任中心→信任中心設定→"
            "巨集設定→勾選「信任對 VBA 專案物件模型的存取」"
        ) from exc

    for comp in list(vbproj.VBComponents):
        if comp.Name == "Q11Adjust":
            vbproj.VBComponents.Remove(comp)
            break

    mod = vbproj.VBComponents.Add(vbext_ct_std_module)
    mod.Name = "Q11Adjust"
    if mod.CodeModule.CountOfLines > 0:
        mod.CodeModule.DeleteLines(1, mod.CodeModule.CountOfLines)
    mod.CodeModule.AddFromString(code)


def inject_workbook_open(wb) -> None:
    """開啟活頁簿時同步圖表 X 軸。"""
    try:
        mod = wb.api.VBProject.VBComponents("ThisWorkbook").CodeModule
        if mod.CountOfLines == 0:
            mod.AddFromString(
                "Private Sub Workbook_Open()\n  Call Q11RefreshChartAxis\nEnd Sub"
            )
    except Exception as exc:
        print(f"[warn] Workbook_Open：{exc}")


def inject_home_sheet_events(wb, ws, rows: dict[str, int]) -> None:
    """首頁 B 欄變更 → 重設圖表 X 軸上限（年期+1）。"""
    rp, ri = rows["principal"], rows["income"]
    try:
        mod = wb.api.VBProject.VBComponents(ws.api.CodeName).CodeModule
        if mod.CountOfLines == 0:
            mod.AddFromString(
                f"""Private Sub Worksheet_Change(ByVal Target As Range)
  On Error GoTo Q11EvtSafe
  If Intersect(Target, Me.Range("$B${rp}:$B${ri}")) Is Nothing Then Exit Sub
  Application.EnableEvents = False
  Call Q11RefreshChartAxis
Q11EvtSafe:
  Application.EnableEvents = True
End Sub"""
            )
    except Exception as exc:
        print(f"[warn] Worksheet_Change：{exc}")


def _add_step_button(ws, row: int, col: int, text: str, macro: str, name: str) -> None:
    left, top, w, h = _cell_rect_single(ws, row, col)
    shape = ws.api.Shapes.AddFormControl(XL_BUTTON, left, top, w, h)
    shape.Name = name
    shape.Placement = XL_MOVE_AND_SIZE
    shape.OnAction = f"Q11Adjust.{macro}"
    tf = shape.TextFrame
    tf.Characters().Text = text
    tf.Characters().Font.Size = 12
    tf.Characters().Font.Bold = True
    tf.HorizontalAlignment = -4108  # xlCenter
    tf.VerticalAlignment = -4108


def _add_preset_shape_button(
    ws,
    left: float,
    top: float,
    width: float,
    height: float,
    text: str,
    macro: str,
    name: str,
    fill_bgr: int,
    line_bgr: int,
    font_bgr: int,
) -> None:
    shape = ws.api.Shapes.AddShape(MSO_SHAPE_ROUNDED_RECTANGLE, left, top, width, height)
    shape.Name = name
    shape.Placement = XL_MOVE_AND_SIZE
    shape.OnAction = macro
    shape.Fill.ForeColor.RGB = fill_bgr
    shape.Line.ForeColor.RGB = line_bgr
    shape.Line.Weight = 1.25
    tf = shape.TextFrame2
    tf.TextRange.Text = text
    tf.TextRange.Font.Name = FONT_CHART
    tf.TextRange.Font.Size = 9
    tf.TextRange.Font.Bold = True
    tf.TextRange.Font.Fill.ForeColor.RGB = font_bgr
    tf.VerticalAnchor = 3
    tf.TextRange.ParagraphFormat.Alignment = 2


def add_loan_preset_buttons(ws) -> None:
    """第 3 列 B～G：六顆等寬圓角色塊按鈕。"""
    for i in range(int(ws.api.Shapes.Count), 0, -1):
        name = str(ws.api.Shapes.Item(i).Name)
        if name.startswith("Q11PresetBtn"):
            ws.api.Shapes.Item(i).Delete()

    left, top, band_w, h = _cell_band_rect(ws, PRESET_ROW, COL_INPUT, COL_INPUT + 5)
    n = len(LOAN_PRESETS)
    gap = 3.0
    bw = (band_w - gap * (n - 1)) / n

    for i, ((full_label, *_vals), (short, fill, line, font)) in enumerate(
        zip(LOAN_PRESETS, PRESET_BTN_STYLES, strict=True), 1
    ):
        x = left + (i - 1) * (bw + gap)
        _add_preset_shape_button(
            ws,
            x,
            top,
            bw,
            h,
            short,
            f"Q11Preset{i}",
            f"Q11PresetBtn{i}",
            fill,
            line,
            font,
        )
        print(f"[preset] {full_label}")


BTN_ANNUITY_BGR = 0xC78402  # #0284C7
BTN_EQUAL_BGR = 0xA16903  # #0369A1


def enhance_detail_sheet_back_buttons(wb) -> None:
    """明細分頁 A1 返回鍵：色塊 + 正黑體，提高辨識度。"""
    accents = (BTN_ANNUITY_BGR, BTN_EQUAL_BGR)
    for sheet_idx, accent in zip((2, 3), accents, strict=False):
        try:
            ws = wb.sheets[sheet_idx - 1]
            cell = ws.api.Range("A1")
            cell.Font.Name = FONT_CHART
            cell.Font.Bold = True
            cell.Font.Size = 12
            cell.Font.Color = 0xFFFFFF
            cell.Interior.Color = accent
            cell.HorizontalAlignment = -4108
            cell.VerticalAlignment = -4108
            cell.RowHeight = 34
            ws.api.Columns(1).ColumnWidth = 13
        except Exception:
            pass


def _normalize_input_values(ws, rows: dict[str, int]) -> None:
    rp, rr, ry, ri = rows["principal"], rows["rate"], rows["years"], rows["income"]
    principal = _read_float(ws, f"B{rp}", 12_000_000)
    rate = _read_float(ws, f"B{rr}", 2.2)
    years = int(round(_read_float(ws, f"B{ry}", 30)))
    income = _read_float(ws, f"B{ri}", 80_000)

    ws.range(f"B{rp}").value = max(500_000, min(300_000_000, int(round(principal / 500_000) * 500_000)))
    ws.range(f"B{rp}").api.NumberFormat = "#,##0"
    ws.range(f"B{rr}").value = round(max(0.1, min(20.0, rate)), 2)
    ws.range(f"B{rr}").api.NumberFormat = "0.00"
    ws.range(f"B{ry}").value = max(1, min(50, years))
    ws.range(f"B{ry}").api.NumberFormat = "0"
    ws.range(f"B{ri}").value = max(0, min(1_000_000, int(round(income / 5_000) * 5_000)))
    ws.range(f"B{ri}").api.NumberFormat = "#,##0"

    # 還原 B 欄直接編輯（移除 I 欄倍率公式）
    for r in (rp, rr, ry, ri):
        cell = ws.api.Cells(r, COL_INPUT)
        if str(cell.Formula).startswith("=I"):
            cell.Formula = str(cell.Value2 if cell.Value2 is not None else 0)


def _knob_rect(ws, row: int) -> tuple[float, float, float, float]:
    """C/D 欄中央：窄而高的垂直捲軸。"""
    lc, rc = ws.api.Cells(row, COL_PLUS), ws.api.Cells(row, COL_MINUS)
    w, h = 14.0, max(20.0, float(lc.Height) - 2)
    center = (float(lc.Left) + float(rc.Left + rc.Width)) / 2
    return center - w / 2, float(lc.Top) + 1, w, h


def build_knob_specs(ws, rows: dict[str, int]) -> list[SpinnerSpec]:
    rp, rr, ry, ri = rows["principal"], rows["rate"], rows["years"], rows["income"]
    principal = _read_float(ws, f"B{rp}", 12_000_000)
    rate = _read_float(ws, f"B{rr}", 2.2)
    years = int(round(_read_float(ws, f"B{ry}", 30)))
    income = _read_float(ws, f"B{ri}", 80_000)
    specs: list[SpinnerSpec] = []

    i_pr = f"I{rp}"
    ws.range(i_pr).value = max(1, min(600, int(round(principal / 500_000))))
    ws.range(f"B{rp}").api.Formula = f"={i_pr}*500000"
    specs.append(SpinnerSpec("貸款本金", rp, i_pr, 1, 10, 1, 600))

    i_rr = f"I{rr}"
    ws.range(i_rr).value = max(2, min(400, int(round(rate / 0.05))))
    ws.range(f"B{rr}").api.Formula = f"={i_rr}*0.05"
    specs.append(SpinnerSpec("年利率", rr, i_rr, 1, 5, 2, 400))

    ws.range(f"B{ry}").value = max(1, min(50, years))
    specs.append(SpinnerSpec("貸款年期", ry, f"B{ry}", 1, 5, 1, 50))

    i_in = f"I{ri}"
    ws.range(i_in).value = max(0, min(200, int(round(income / 5_000))))
    ws.range(f"B{ri}").api.Formula = f"={i_in}*5000"
    specs.append(SpinnerSpec("月收入", ri, i_in, 1, 10, 0, 200))
    return specs


def add_vertical_knobs(ws) -> None:
    """VBA 不可用時：C/D 中央垂直捲軸（上=加、下=減）。"""
    _delete_input_controls(ws)
    ws.api.Columns(COL_KNOB).Hidden = True
    rows = resolve_input_rows(ws)
    for spec in build_knob_specs(ws, rows):
        left, top, w, h = _knob_rect(ws, spec.row)
        shape = ws.api.Shapes.AddFormControl(XL_SCROLL_BAR, left, top, w, h)
        shape.Name = f"Q11Spin{spec.row}"
        shape.Placement = XL_MOVE_AND_SIZE
        cf = shape.ControlFormat
        cf.LinkedCell = spec.linked
        cf.Min, cf.Max = spec.min_val, spec.max_val
        cf.SmallChange, cf.LargeChange = spec.small, spec.large
        for col in (COL_PLUS, COL_MINUS):
            cell = ws.api.Cells(spec.row, col)
            cell.Value2 = ""
            cell.Interior.ColorIndex = 0
        print(f"[vscroll] {spec.label} 列{spec.row} ▲▼")


def add_step_buttons(ws, wb) -> None:
    """C 欄 +、D 欄 −：表單按鈕 + VBA（永遠可見，方向正確）。"""
    _delete_input_controls(ws)
    rows = resolve_input_rows(ws)
    _normalize_input_values(ws, rows)
    inject_vba_module(wb, ws.name, rows)
    inject_workbook_open(wb)
    inject_home_sheet_events(wb, ws, rows)

    buttons = (
        ("principal", "貸款本金", "Principal"),
        ("rate", "年利率", "Rate"),
        ("years", "貸款年期", "Years"),
        ("income", "月收入", "Income"),
    )
    for key, label, suffix in buttons:
        row = rows[key]
        _add_step_button(ws, row, COL_PLUS, "+", f"Q11Plus{suffix}", f"Q11PlusBtn{suffix}")
        _add_step_button(ws, row, COL_MINUS, "−", f"Q11Minus{suffix}", f"Q11MinusBtn{suffix}")
        for col in (COL_PLUS, COL_MINUS):
            cell = ws.api.Cells(row, col)
            cell.Value2 = ""
            cell.Interior.ColorIndex = 0
        print(f"[step-btn] {label} 列{row}  C=+  D=−")


def _deliver(xlsm: Path) -> None:
    USER_XLSM.parent.mkdir(parents=True, exist_ok=True)
    _assert_paths_writable(USER_XLSM)
    if xlsm.resolve() != USER_XLSM.resolve():
        shutil.copy2(xlsm, USER_XLSM)
    stale = USER_XLSM.parent / "quick11-home-v5-dual-sheets.xlsx"
    if stale.exists() and stale.resolve() != xlsm.resolve():
        try:
            stale.unlink()
        except OSError as exc:
            print(f"[deliver] 保留 xlsx（檔案使用中）：{exc}")
    # 只清舊版 quick11-v5.xlsx 等，勿刪 quick11-home-v5-dual-sheets.*
    for name in USER_XLSM.parent.glob("quick11-v*.xls*"):
        try:
            name.unlink()
        except OSError:
            pass
    print(f"[deliver] → {USER_XLSM}")


def finalize_workbook(
    input_path: Path,
    *,
    xlsx_out: Path,
    xlsm_out: Path,
    publish: bool = True,
) -> None:
    xlsx_out = xlsx_out.resolve()
    xlsm_out = xlsm_out.resolve()
    check_paths = list(dict.fromkeys([xlsm_out, xlsx_out, USER_XLSM, PUBLIC_OUT]))
    print("[preflight] 檢查輸出路徑是否可寫…")
    _require_writable_output(xlsm_out)
    _assert_paths_writable(*[p for p in check_paths if p.exists()])

    xw = _require_xlwings()
    temp = Path(tempfile.gettempdir()) / f"q11-{uuid.uuid4().hex}.xlsx"
    shutil.copy2(input_path, temp)

    app = xw.App(visible=False, add_book=False)
    app.display_alerts = False
    wb = None
    try:
        print("[xlwings] 開始後處理…")
        wb = app.books.open(str(temp), update_links=False)
        ws = wb.sheets[0]
        ann, eq = wb.sheets[1].name, wb.sheets[2].name

        remove_ghost_shapes(ws)
        cols = resolve_data_columns(ws)
        rows = resolve_input_rows(ws)
        setup_chart_data(ws, ann, eq, cols)
        clean_chart_zone(ws)
        clear_input_cell_notes(ws)
        apply_input_dropdowns(ws)
        add_line_chart(ws, cols, rows)
        try:
            add_step_buttons(ws, wb)
            add_loan_preset_buttons(ws)
        except Exception as btn_exc:
            print(f"[warn] +/- 按鈕略過（{btn_exc}），改垂直捲軸")
            add_vertical_knobs(ws)

        enhance_detail_sheet_back_buttons(wb)

        app.api.CalculateFull()

        _assert_paths_writable(xlsm_out, xlsx_out, USER_XLSM)
        if xlsm_out.exists():
            xlsm_out.unlink()
        wb.api.SaveAs(str(xlsm_out.resolve()), FileFormat=52)
        print(f"[save] xlsm → {xlsm_out}")

        if xlsx_out.resolve() != xlsm_out.resolve():
            if xlsx_out.exists():
                xlsx_out.unlink()
            wb.api.SaveAs(str(xlsx_out.resolve()), FileFormat=51)
            print(f"[save] xlsx → {xlsx_out}")

        if publish and PUBLIC_OUT.parent.exists() and xlsx_out.exists():
            if PUBLIC_OUT.exists():
                PUBLIC_OUT.unlink()
            shutil.copy2(xlsx_out, PUBLIC_OUT)

        _deliver(xlsm_out)
    finally:
        if wb:
            wb.close()
        app.quit()
        temp.unlink(missing_ok=True)


def main() -> int:
    p = argparse.ArgumentParser(description="Quick-11 xlwings：淺色靜態 J2:W20 折線圖 + C/D ±")
    p.add_argument("-i", "--input", type=Path, default=DEFAULT_IN)
    p.add_argument("-o", "--output-xlsx", type=Path, default=None, help="xlsx 輸出路徑")
    p.add_argument("--xlsm", type=Path, default=DEFAULT_XLSM)
    p.add_argument("--no-publish", action="store_true")
    args = p.parse_args()

    src = args.input.resolve()
    if not src.exists():
        print(f"找不到：{src}", file=sys.stderr)
        return 1

    try:
        with ThreadPoolExecutor(max_workers=1) as pool:
            fut = pool.submit(
                finalize_workbook,
                src,
                xlsx_out=(args.output_xlsx or src).resolve(),
                xlsm_out=args.xlsm.resolve(),
                publish=not args.no_publish,
            )
            try:
                fut.result(timeout=XLWINGS_TIMEOUT_SEC)
            except FuturesTimeoutError as exc:
                raise RuntimeError(
                    f"xlwings 逾時（>{XLWINGS_TIMEOUT_SEC}s）：請關閉 Excel 後重試"
                ) from exc
    except FileBusyError as exc:
        print(f"已停止：{exc}", file=sys.stderr)
        return 2
    except Exception as exc:
        import traceback

        print(f"錯誤：{exc}", file=sys.stderr)
        traceback.print_exc()
        print("請關閉所有 Excel 視窗後重試。", file=sys.stderr)
        return 1

    print("\n完成。請開啟：D:\\下載\\quick11-home-v5-dual-sheets.xlsm")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
