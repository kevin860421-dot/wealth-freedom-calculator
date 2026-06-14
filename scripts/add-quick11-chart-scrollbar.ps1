param(
  [string]$SourceXlsx
)

$ErrorActionPreference = "Stop"
$xlScrollBar = 8

if (-not $SourceXlsx) {
  throw "SourceXlsx is required."
}

$excel = $null
$wb = $null

try {
  $excel = New-Object -ComObject Excel.Application
  $excel.Visible = $false
  $excel.DisplayAlerts = $false

  $wb = $excel.Workbooks.Open($SourceXlsx)
  $ws = $wb.Worksheets.Item(1)
  $ws.Activate() | Out-Null

  for ($i = $ws.Shapes.Count; $i -ge 1; $i--) {
    $s = $ws.Shapes.Item($i)
    if ($s.Name -like "Q11ChartScroll*") {
      $s.Delete()
    }
  }

  # J22 : W22 與圖表同寬
  $leftCell = $ws.Cells.Item(22, 10)
  $rightCell = $ws.Cells.Item(22, 23)
  $left = [double]$leftCell.Left + 2
  $top = [double]$leftCell.Top + 3
  $width = [double]($rightCell.Left + $rightCell.Width - $leftCell.Left) - 4
  $height = 16

  $shape = $ws.Shapes.AddFormControl($xlScrollBar, $left, $top, $width, $height)
  $shape.Name = "Q11ChartScrollBar"
  $cf = $shape.ControlFormat
  $cf.LinkedCell = "Z1"
  $cf.Min = 1
  $cf.Max = 30
  $cf.SmallChange = 1
  $cf.LargeChange = 5

  $ws.Range("Z1").Value2 = 15
  $ws.Columns.Item(26).Hidden = $true

  $wb.Save()
  Write-Host "Inserted chart scroll bar at J22 (linked Z1) in:" $SourceXlsx
}
finally {
  if ($wb) { $wb.Close($true) | Out-Null }
  if ($excel) { $excel.Quit() | Out-Null }
  if ($wb) { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($wb) }
  if ($excel) { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) }
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}
