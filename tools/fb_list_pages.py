#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
用「使用者 Access Token」（EAAY…）向 Graph API 取得你管理的粉絲專頁清單與各頁的 Page Access Token。

正確端點是 graph.facebook.com 的 /me/accounts，不是把 Token 接在 facebook.com 後面。

用法：
  set FB_USER_TOKEN=你的EAAY開頭Token
  python tools/fb_list_pages.py

或：
  python tools/fb_list_pages.py --token "EAAY..."
"""

from __future__ import annotations

import argparse
import os
import sys

try:
    import requests
except ImportError:
    print("請先安裝: pip install requests", file=sys.stderr)
    sys.exit(1)

GRAPH_VERSION = os.environ.get("FB_GRAPH_VERSION", "v19.0")


def main() -> None:
    p = argparse.ArgumentParser(description="列出 Facebook 粉專與 Page Token（需使用者 Token + pages_show_list 等權限）")
    p.add_argument(
        "--token",
        default=os.environ.get("FB_USER_TOKEN", "").strip(),
        help="EAAY 開頭的使用者 Access Token；若省略則讀環境變數 FB_USER_TOKEN",
    )
    args = p.parse_args()
    token = (args.token or "").strip()
    if not token or token == "貼上你的TOKEN":
        print("請設定：環境變數 FB_USER_TOKEN，或執行時加上 --token \"你的Token\"", file=sys.stderr)
        sys.exit(1)

    url = f"https://graph.facebook.com/{GRAPH_VERSION}/me/accounts"
    res = requests.get(url, params={"access_token": token}, timeout=60)
    try:
        data = res.json()
    except Exception:
        print("無法解析 JSON，HTTP", res.status_code, res.text[:500], file=sys.stderr)
        sys.exit(1)

    if res.status_code != 200:
        print("HTTP", res.status_code, data, file=sys.stderr)
        sys.exit(1)

    if "data" in data and isinstance(data["data"], list):
        for page in data["data"]:
            print(f"粉專名稱: {page.get('name', '')}")
            print(f"粉專 ID: {page.get('id', '')}")
            print(f"這個粉專的『發文專用 Token』: {page.get('access_token', '')}")
            print("-" * 30)
        paging = data.get("paging")
        if paging and paging.get("next"):
            print("(還有更多頁面，API 有分頁；需要可再寫迴圈抓 next)", file=sys.stderr)
    else:
        print("錯誤訊息:", data)


if __name__ == "__main__":
    main()
