# Facebook 粉專自動發文（fb_auto_post.py）

此腳本會把你準備好的 JSON（計算結果摘要）組成貼文，透過 Facebook Graph API 發到粉專。

## 1) 取得 Access Token（粉專）

用 Meta 開發者工具取得粉專發文所需權限（示意）：`pages_manage_posts`、`pages_read_engagement`。

## 2) 設定環境變數

- `FB_PAGE_ID`: 粉專 Page ID
- `FB_ACCESS_TOKEN`: 可發文的 access token

PowerShell 範例：

```powershell
$env:FB_PAGE_ID="你的粉專ID"
$env:FB_ACCESS_TOKEN="你的Token"
```

## 3) 安裝 Python 依賴

```powershell
py -m pip install -r tools/requirements.txt
```

## 4) 測試（不發文）

```powershell
py tools/fb_auto_post.py --json tools/example_data.json --dry-run --link "https://wealth-freedom-calculator.vercel.app/"
```

## 5) 正式發文

```powershell
py tools/fb_auto_post.py --json tools/example_data.json --link "https://wealth-freedom-calculator.vercel.app/"
```

## JSON 欄位（可選）

腳本會優先讀以下欄位（缺少就顯示 `—`）：

- `retire_age`
- `monthly_income`
- `years`
- `months`

你也可以輸入其他結構，腳本有做幾個常見 key 的相容（例如 camelCase）。

