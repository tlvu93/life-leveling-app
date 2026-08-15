# Atlas pan benchmark: scripted swipes + dumpsys gfxinfo frame stats.
# Prereqs: a RELEASE build installed and open on the Atlas screen
#   npm run android:release   (never benchmark a debug/dev-client build)
# Usage: powershell -File scripts/perf-pan.ps1 [-Package com.lifeleveling.app] [-Swipes 10] [-Label after]
# Protocol (see AGENTS.md): 5 runs, discard the first, compare MEDIANS of
# janky % and p95; change one variable per benchmark cycle.
param(
  [string]$Package = 'com.lifeleveling.app',
  [int]$Swipes = 10,
  [string]$Label = 'run'
)

$ErrorActionPreference = 'Stop'
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$outDir = Join-Path $PSScriptRoot '..' '.tmp' 'perf'
New-Item -ItemType Directory -Force $outDir | Out-Null
$outFile = Join-Path $outDir "gfxinfo-$Label-$stamp.txt"

$devices = (& adb devices) -match '\tdevice$'
if (-not $devices) { throw 'No adb device connected.' }

Write-Host "Resetting gfxinfo counters for $Package..."
& adb shell dumpsys gfxinfo $Package reset | Out-Null
Start-Sleep -Milliseconds 500

Write-Host "Swiping $Swipes times (interleaved left/right so the map stays in bounds)..."
$size = (& adb shell wm size) -replace '.*?(\d+)x(\d+).*', '$1 $2'
$parts = $size.Trim() -split ' '
$w = [int]$parts[0]; $h = [int]$parts[1]
$y = [int]($h * 0.5)
$x1 = [int]($w * 0.85); $x2 = [int]($w * 0.15)
for ($i = 0; $i -lt $Swipes; $i++) {
  if ($i % 2 -eq 0) { & adb shell input swipe $x1 $y $x2 $y 400 } else { & adb shell input swipe $x2 $y $x1 $y 400 }
  Start-Sleep -Milliseconds 300
}

Write-Host "Collecting frame stats -> $outFile"
& adb shell dumpsys gfxinfo $Package | Out-File -Encoding utf8 $outFile
& adb shell dumpsys gfxinfo $Package framestats | Out-File -Encoding utf8 ($outFile -replace '\.txt$', '-framestats.csv')

$summary = Get-Content $outFile | Select-String -Pattern 'Total frames rendered|Janky frames|percentile'
Write-Host "`n=== $Label ($stamp) ==="
$summary | ForEach-Object { Write-Host $_.Line.Trim() }
