#Requires -Version 5.1
# Git: add all, commit if needed, push origin main. Run from repo root or via scripts/ path.
param(
  [string]$Message = "",
  [switch]$Pull
)

$ErrorActionPreference = "Stop"

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if (-not (Test-Path (Join-Path $RepoRoot ".git"))) {
  throw ".git not found. Expected script at <repo>/scripts/push-to-github.ps1. Resolved root: $RepoRoot"
}
Set-Location $RepoRoot
Write-Host "Repository: $RepoRoot" -ForegroundColor Cyan

if ($Pull) {
  Write-Host "git pull --rebase origin main ..." -ForegroundColor Yellow
  git pull --rebase origin main
}

git add -A
$porcelain = git status --porcelain
if (-not $porcelain) {
  Write-Host "Nothing to commit (working tree clean)." -ForegroundColor Green
  Write-Host "git push origin main ..." -ForegroundColor Yellow
  git push origin main
  exit $LASTEXITCODE
}

git status -s
if ([string]::IsNullOrWhiteSpace($Message)) {
  $Message = "chore: sync $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
}
Write-Host "git commit ..." -ForegroundColor Yellow
git commit -m $Message
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host "git push origin main ..." -ForegroundColor Yellow
git push origin main
exit $LASTEXITCODE
