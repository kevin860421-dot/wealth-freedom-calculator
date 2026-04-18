# -*- coding: utf-8 -*-
"""產出主視覺 PNG：兩行繁中「自由／從面對數字開始」，金黃立體字 + 深色底。"""
from __future__ import annotations

import os
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

# 輸出尺寸（16:9）
W, H = 1920, 1080
OUT_NAME = "hero-tagline-freedom-from-numbers.png"


def pick_font(size: int) -> ImageFont.FreeTypeFont:
    candidates = [
        os.environ.get("HERO_FONT"),
        r"C:\Windows\Fonts\msjhbd.ttc",
        r"C:\Windows\Fonts\msjhl.ttc",
        r"C:\Windows\Fonts\msjh.ttc",
        "/System/Library/Fonts/PingFang.ttc",
        "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc",
    ]
    for p in candidates:
        if not p:
            continue
        if os.path.isfile(p):
            try:
                return ImageFont.truetype(p, size)
            except OSError:
                continue
    return ImageFont.load_default()


def draw_gold_text(
    draw: ImageDraw.ImageDraw,
    xy: tuple[int, int],
    text: str,
    font: ImageFont.FreeTypeFont,
) -> None:
    x, y = xy
    # 立體陰影（由下往上疊亮）
    for dx, dy, c in [
        (5, 5, (20, 12, 0)),
        (4, 4, (60, 35, 0)),
        (3, 3, (100, 65, 10)),
        (2, 2, (140, 95, 20)),
        (1, 1, (180, 130, 40)),
    ]:
        draw.text((x + dx, y + dy), text, font=font, fill=c)
    # 主金色 + 上緣亮點
    draw.text((x, y), text, font=font, fill=(255, 236, 179))
    draw.text((x, y - 1), text, font=font, fill=(255, 248, 220))


def main() -> int:
    root = Path(__file__).resolve().parents[1]
    out_path = root / "public" / OUT_NAME

    # 深色底（可再疊其他素材）
    img = Image.new("RGB", (W, H), (10, 10, 12))
    draw = ImageDraw.Draw(img)

    line1 = "自由"
    line2 = "從面對數字開始"

    font1 = pick_font(118)
    font2 = pick_font(76)

    # 左上區塊排版（與常見主視覺接近）
    margin_l, margin_t = 96, 96
    draw_gold_text(draw, (margin_l, margin_t), line1, font1)

    bbox = draw.textbbox((0, 0), line1, font=font1)
    line1_h = bbox[3] - bbox[1]
    gap = 18
    y2 = margin_t + line1_h + gap
    draw_gold_text(draw, (margin_l, y2), line2, font2)

    out_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(out_path, "PNG", optimize=True)
    print(f"OK: {out_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
