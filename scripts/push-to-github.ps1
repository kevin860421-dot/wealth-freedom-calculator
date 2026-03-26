#Requires -Version 5.1
param(
  [string]$Message = "",
  [switch]$Pull,
  [switch]$NoWaitForKey
)

$ErrorActionPreference = "Stop"
$exitCode = 0

try {
  $RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
  if (-not (Test-Path (Join-Path $RepoRoot ".git"))) {
    throw ".git not found. Expected script at <repo>/scripts/push-to-github.ps1. Resolved root: $RepoRoot"
  }
  Set-Location $RepoRoot
  Write-Host "Repository: $RepoRoot" -ForegroundColor Cyan

  if ($Pull) {
    Write-Host "git pull --rebase origin main ..." -ForegroundColor Yellow
    git pull --rebase origin main
    if ($LASTEXITCODE -ne 0) {
      $exitCode = $LASTEXITCODE
      throw "git pull failed with exit $exitCode"
    }
  }

  git add -A
  $porcelain = git status --porcelain
  if (-not $porcelain) {
    Write-Host "Nothing to commit (working tree clean)." -ForegroundColor Green
    Write-Host "git push origin main ..." -ForegroundColor Yellow
    git push origin main
    $exitCode = $LASTEXITCODE
  }
  else {
    git status -s
    if ([string]::IsNullOrWhiteSpace($Message)) {
      $Message = "chore: sync $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
    }
    Write-Host "git commit ..." -ForegroundColor Yellow
    git commit -m $Message
    if ($LASTEXITCODE -ne 0) {
      $exitCode = $LASTEXITCODE
      throw "git commit failed with exit $exitCode"
    }
    Write-Host "git push origin main ..." -ForegroundColor Yellow
    git push origin main
    $exitCode = $LASTEXITCODE
  }
}
catch {
  Write-Host $_.Exception.Message -ForegroundColor Red
  if ($exitCode -eq 0) {
    $exitCode = 1
  }
}
finally {
  if (-not $NoWaitForKey) {
    Write-Host ""
    Write-Host "----------------------------------------" -ForegroundColor DarkGray
    if ($exitCode -eq 0) {
      Write-Host "完成" -ForegroundColor Green
      Write-Host "GitHub 已推送完成。"
    }
    else {
      Write-Host "未完成 (錯誤代碼 $exitCode)" -ForegroundColor Red
      Write-Host "請查看上方訊息。"
    }
    Write-Host "----------------------------------------" -ForegroundColor DarkGray
    Write-Host ""
    Write-Host "按任意鍵關閉視窗..."
    try {
      if ($Host.UI -and $Host.UI.RawUI) {
        $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
      }
      else {
        Read-Host "Press Enter to close"
      }
    }
    catch {
      Read-Host "Press Enter to close"
    }
  }
}

exit $exitCode
