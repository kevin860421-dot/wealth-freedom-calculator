#!/usr/bin/env python3
"""已棄用：請改用 scripts/add-quick11-excel-xlwings-chart.py"""
from __future__ import annotations

import runpy
import sys
from pathlib import Path

TARGET = Path(__file__).with_name("add-quick11-excel-xlwings-chart.py")
print(f"[deprecated] {Path(__file__).name} → {TARGET.name}", file=sys.stderr)
runpy.run_path(str(TARGET), run_name="__main__")
