#Requires -Version 5.1
# UTF-8 friendly: user-facing strings are ASCII to avoid parse errors on some Windows consoles.
param(
  [string]$Message = "",
  [switch]$Pull,
  [switch]$NoWaitForKey
)

$exitCode = 0

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
if (-not (Test-Path (Join-Path $RepoRoot ".git"))) {
  Write-Host "[ERROR] .git not found. Script must live in <repo>/scripts/" -ForegroundColor Yellow
  Write-Host "Resolved root: $RepoRoot" -ForegroundColor DarkGray
  $exitCode = 1
}
else {
  Set-Location $RepoRoot
  Write-Host "Repository: $RepoRoot" -ForegroundColor Cyan

  if ($Pull) {
    Write-Host "git pull --rebase origin main ..." -ForegroundColor Yellow
    git pull --rebase origin main
    if ($LASTEXITCODE -ne 0) {
      Write-Host "[ERROR] git pull failed (exit $LASTEXITCODE)" -ForegroundColor Yellow
      $exitCode = $LASTEXITCODE
    }
  }

  if ($exitCode -eq 0) {
    git add -A
    $porcelain = git status --porcelain
    if (-not $porcelain) {
      Write-Host "Nothing to commit (working tree clean)." -ForegroundColor Green
      Write-Host "git push origin main ..." -ForegroundColor Yellow
      git push origin main
      $exitCode = $LASTEXITCODE
      if ($exitCode -ne 0) {
        Write-Host "[ERROR] git push failed (exit $exitCode)" -ForegroundColor Yellow
      }
    }
    else {
      git status -s
      if ([string]::IsNullOrWhiteSpace($Message)) {
        $Message = "chore: sync $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
      }
      Write-Host "git commit ..." -ForegroundColor Yellow
      git commit -m $Message
      if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] git commit failed (exit $LASTEXITCODE)" -ForegroundColor Yellow
        $exitCode = $LASTEXITCODE
      }
      else {
        Write-Host "git push origin main ..." -ForegroundColor Yellow
        git push origin main
        $exitCode = $LASTEXITCODE
        if ($exitCode -ne 0) {
          Write-Host "[ERROR] git push failed (exit $exitCode)" -ForegroundColor Yellow
        }
      }
    }
  }
}

if (-not $NoWaitForKey) {
  Write-Host ""
  Write-Host "----------------------------------------" -ForegroundColor DarkGray
  if ($exitCode -eq 0) {
    Write-Host "DONE - GitHub push finished OK." -ForegroundColor Green
  }
  else {
    Write-Host "NOT DONE - exit code $exitCode" -ForegroundColor Yellow
    Write-Host "Red text above is often from git (login, merge, etc.). Scroll up."
  }
  Write-Host "----------------------------------------" -ForegroundColor DarkGray
  Write-Host ""
  Write-Host "Press any key to close (English line below is normal)..."
  cmd.exe /c pause
}

exit $exitCode
