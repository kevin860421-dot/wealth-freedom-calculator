#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import argparse
import json
import os
import sys
import textwrap
import time
import urllib.parse
import urllib.request


GRAPH_VERSION = os.environ.get("FB_GRAPH_VERSION", "v19.0")


def eprint(*args: object) -> None:
    print(*args, file=sys.stderr)


def read_json(path: str | None) -> dict:
    if path:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    raw = sys.stdin.read().strip()
    if not raw:
        return {}
    return json.loads(raw)


def get(d: dict, *keys: str) -> object | None:
    cur: object = d
    for k in keys:
        if not isinstance(cur, dict) or k not in cur:
            return None
        cur = cur[k]
    return cur


def format_int(n: object) -> str:
    try:
        v = int(round(float(n)))  # type: ignore[arg-type]
    except Exception:
        return "—"
    return f"{v:,}"


def build_message(data: dict, *, title: str, link: str | None) -> str:
    # 盡量相容：你可以提供任意 JSON，只要有下面幾個欄位就會帶入；沒有就顯示 —。
    retire_age = get(data, "retire_age") or get(data, "retireAge") or get(data, "fire", "retireAge")
    monthly_income = (
        get(data, "monthly_income")
        or get(data, "monthlyIncome")
        or get(data, "targetQuarterIncomeNum")
        or get(data, "fire", "monthlyIncome")
    )
    years = get(data, "years") or get(data, "fireEtaYears") or get(data, "fire", "etaYears")
    months = get(data, "months") or get(data, "fireEtaMonths") or get(data, "fire", "etaMonths")

    eta_str = "—"
    try:
        if years is not None and months is not None:
            eta_str = f"{int(years)} 年 {int(months)} 個月"
        elif years is not None:
            eta_str = f"{int(years)} 年"
    except Exception:
        eta_str = "—"

    lines = [
        f"📌 {title}",
        "",
        f"預估退休年齡：{format_int(retire_age)} 歲",
        f"目標月收入：{format_int(monthly_income)} 元",
        f"預估達成時間：{eta_str}",
    ]
    if link:
        lines += ["", f"🔗 連結：{link}"]
    return "\n".join(lines).strip() + "\n"


def post_to_facebook_page(*, page_id: str, access_token: str, message: str) -> dict:
    url = f"https://graph.facebook.com/{GRAPH_VERSION}/{page_id}/feed"
    body = urllib.parse.urlencode({"message": message, "access_token": access_token}).encode("utf-8")
    req = urllib.request.Request(url, data=body, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=20) as resp:
            payload = resp.read().decode("utf-8", errors="replace")
            return json.loads(payload)
    except Exception as ex:
        raise RuntimeError(f"Facebook 發文失敗：{ex}") from ex


def main() -> int:
    p = argparse.ArgumentParser(
        prog="fb_auto_post",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        description="用 Graph API 將計算結果自動發到 Facebook 粉專（Page feed）。",
        epilog=textwrap.dedent(
            """\
            必要環境變數：
              - FB_PAGE_ID
              - FB_ACCESS_TOKEN

            例：
              python tools/fb_auto_post.py --json tools/example_data.json --title "我的財富自由計算結果"
            """
        ),
    )
    p.add_argument("--json", dest="json_path", default=None, help="輸入 JSON 檔路徑；不填則從 stdin 讀 JSON")
    p.add_argument("--title", default="我的財富自由計算結果出爐！", help="貼文標題")
    p.add_argument("--link", default=None, help="想附上的連結（例如你的部署站）")
    p.add_argument("--dry-run", action="store_true", help="只輸出 message，不實際發文")
    args = p.parse_args()

    data = read_json(args.json_path)
    message = build_message(data, title=args.title, link=args.link)
    if args.dry_run:
        print(message, end="")
        return 0

    page_id = os.environ.get("FB_PAGE_ID", "").strip()
    token = os.environ.get("FB_ACCESS_TOKEN", "").strip()
    if not page_id:
        eprint("缺少環境變數 FB_PAGE_ID")
        return 2
    if not token:
        eprint("缺少環境變數 FB_ACCESS_TOKEN")
        return 2

    # 避免誤觸連續發文：簡單加 1 秒延遲，給你 Ctrl+C 反悔。
    eprint("將在 1 秒後發文（Ctrl+C 取消）…")
    time.sleep(1)

    resp = post_to_facebook_page(page_id=page_id, access_token=token, message=message)
    post_id = resp.get("id") if isinstance(resp, dict) else None
    print(json.dumps({"ok": True, "post_id": post_id, "response": resp}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

