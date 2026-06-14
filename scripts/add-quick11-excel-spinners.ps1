param(
  [string]$SourceXlsx,
  [string]$TargetXlsm
)

$ErrorActionPreference = "Stop"
$xlButtonControl = 0
$xlMoveAndSize = 1
$vbextCtStdModule = 1

function Add-StepButton {
  param(
    $Worksheet,
    [int]$Row,
    [int]$Col,
    [string]$Text,
    [string]$Macro,
    [string]$Name
  )

  $cell = $Worksheet.Cells.Item($Row, $Col)
  $left = [double]$cell.Left + 1
  $top = [double]$cell.Top + 1
  $width = [math]::Max(12, [double]$cell.Width - 2)
  $height = [math]::Max(14, [double]$cell.Height - 2)

  $shape = $Worksheet.Shapes.AddFormControl($xlButtonControl, $left, $top, $width, $height)
  $shape.Name = $Name
  $shape.Placement = $xlMoveAndSize
  $shape.OnAction = $Macro
  $shape.TextFrame.Characters().Text = $Text
  $shape.TextFrame.Characters().Font.Size = 11
  $shape.TextFrame.Characters().Font.Bold = $true
}

function Add-VbaModule {
  param($Workbook)

  $stdCode = @'
Option Explicit

Public Sub Q11PlusPrincipal()
  With Worksheets("首頁").Range("B5")
    .Value = Application.WorksheetFunction.Min(50000000, Application.WorksheetFunction.Max(100000, .Value2 + 50000))
  End With
End Sub

Public Sub Q11MinusPrincipal()
  With Worksheets("首頁").Range("B5")
    .Value = Application.WorksheetFunction.Min(50000000, Application.WorksheetFunction.Max(100000, .Value2 - 50000))
  End With
End Sub

Public Sub Q11PlusRate()
  With Worksheets("首頁").Range("B6")
    .Value = Round(Application.WorksheetFunction.Min(10, Application.WorksheetFunction.Max(0.1, .Value2 + 0.1)), 2)
  End With
End Sub

Public Sub Q11MinusRate()
  With Worksheets("首頁").Range("B6")
    .Value = Round(Application.WorksheetFunction.Min(10, Application.WorksheetFunction.Max(0.1, .Value2 - 0.1)), 2)
  End With
End Sub

Public Sub Q11PlusYears()
  With Worksheets("首頁").Range("B7")
    .Value = Application.WorksheetFunction.Min(40, Application.WorksheetFunction.Max(1, .Value2 + 1))
  End With
End Sub

Public Sub Q11MinusYears()
  With Worksheets("首頁").Range("B7")
    .Value = Application.WorksheetFunction.Min(40, Application.WorksheetFunction.Max(1, .Value2 - 1))
  End With
End Sub

Public Sub Q11PlusIncome()
  With Worksheets("首頁").Range("B8")
    .Value = Application.WorksheetFunction.Min(500000, Application.WorksheetFunction.Max(0, .Value2 + 5000))
  End With
End Sub

Public Sub Q11MinusIncome()
  With Worksheets("首頁").Range("B8")
    .Value = Application.WorksheetFunction.Min(500000, Application.WorksheetFunction.Max(0, .Value2 - 5000))
  End With
End Sub
'@

  $stdModule = $null
  foreach ($comp in @($Workbook.VBProject.VBComponents)) {
    if ($comp.Name -eq "Q11Adjust") {
      $stdModule = $comp
      break
    }
  }
  if (-not $stdModule) {
    $stdModule = $Workbook.VBProject.VBComponents.Add($vbextCtStdModule)
    $stdModule.Name = "Q11Adjust"
  }
  if ($stdModule.CodeModule.CountOfLines -gt 0) {
    $stdModule.CodeModule.DeleteLines(1, $stdModule.CodeModule.CountOfLines)
  }
  $stdModule.CodeModule.AddFromString($stdCode)
}

function Add-ChartScrollBar {
  param($Worksheet)

  $xlScrollBar = 8
  for ($i = $Worksheet.Shapes.Count; $i -ge 1; $i--) {
    $s = $Worksheet.Shapes.Item($i)
    if ($s.Name -like "Q11ChartScroll*") {
      $s.Delete()
    }
  }

  $anchor = $Worksheet.Cells.Item(21, 10)
  $left = [double]$anchor.Left + 2
  $top = [double]$anchor.Top + 4
  $shape = $Worksheet.Shapes.AddFormControl($xlScrollBar, $left, $top, 280, 16)
  $shape.Name = "Q11ChartScrollBar"
  $cf = $shape.ControlFormat
  $cf.LinkedCell = "Z1"
  $cf.Min = 1
  $cf.Max = 30
  $cf.SmallChange = 1
  $cf.LargeChange = 5
  $Worksheet.Range("Z1").Value2 = 15
  $Worksheet.Columns.Item(26).Hidden = $true
}

function Add-InputStepButtons {
  param($Worksheet)

  $rows = @(
    @{ Row = 5; PlusMacro = "Q11PlusPrincipal"; MinusMacro = "Q11MinusPrincipal"; Key = "Principal" },
    @{ Row = 6; PlusMacro = "Q11PlusRate"; MinusMacro = "Q11MinusRate"; Key = "Rate" },
    @{ Row = 7; PlusMacro = "Q11PlusYears"; MinusMacro = "Q11MinusYears"; Key = "Years" },
    @{ Row = 8; PlusMacro = "Q11PlusIncome"; MinusMacro = "Q11MinusIncome"; Key = "Income" }
  )

  foreach ($spec in $rows) {
    Add-StepButton -Worksheet $Worksheet -Row $spec.Row -Col 3 -Text "+" -Macro $spec.PlusMacro -Name ("Q11PlusBtn" + $spec.Key)
    Add-StepButton -Worksheet $Worksheet -Row $spec.Row -Col 4 -Text "-" -Macro $spec.MinusMacro -Name ("Q11MinusBtn" + $spec.Key)
    $Worksheet.Cells.Item($spec.Row, 3).Value2 = ""
    $Worksheet.Cells.Item($spec.Row, 4).Value2 = ""
  }
}

if (-not $SourceXlsx -or -not $TargetXlsm) {
  throw "SourceXlsx and TargetXlsm are required."
}

$tempSource = Join-Path $env:TEMP ("quick11-spin-source-" + [guid]::NewGuid().ToString("N") + ".xlsx")
Copy-Item -LiteralPath $SourceXlsx -Destination $tempSource -Force

$excel = $null
$wb = $null

try {
  $excel = New-Object -ComObject Excel.Application
  $excel.Visible = $false
  $excel.DisplayAlerts = $false

  $wb = $excel.Workbooks.Open($tempSource)
  $ws = $wb.Worksheets.Item(1)
  $ws.Activate() | Out-Null

  for ($i = $ws.Shapes.Count; $i -ge 1; $i--) {
    $s = $ws.Shapes.Item($i)
    if ($s.Name -like "Q11PlusBtn*" -or $s.Name -like "Q11MinusBtn*" -or $s.Name -like "Q11FloatAdjust*") {
      $s.Delete()
    }
  }

  Add-InputStepButtons -Worksheet $ws
  Add-ChartScrollBar -Worksheet $ws

  try {
    Add-VbaModule -Workbook $wb
  } catch {
    throw ('VBA inject failed. Enable Trust access to the VBA project object model in Excel Trust Center. ' + $_.Exception.Message)
  }

  if (Test-Path -LiteralPath $TargetXlsm) {
    Remove-Item -LiteralPath $TargetXlsm -Force
  }

  $wb.SaveAs($TargetXlsm, 52)
  Write-Host "Wrote xlsm with C/D step buttons:" $TargetXlsm
}
finally {
  if ($wb) { $wb.Close($false) | Out-Null }
  if ($excel) { $excel.Quit() | Out-Null }
  if ($wb) { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($wb) }
  if ($excel) { [void][System.Runtime.InteropServices.Marshal]::ReleaseComObject($excel) }
  if (Test-Path -LiteralPath $tempSource) { Remove-Item -LiteralPath $tempSource -Force -ErrorAction SilentlyContinue }
  [GC]::Collect()
  [GC]::WaitForPendingFinalizers()
}
