param([string]$Label='4x3')
$ErrorActionPreference='Stop'
Add-Type -AssemblyName System.Drawing
$root=Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$out=Join-Path $root 'builds/Kanto_Tetris_Build_1_8_11_Grid'
$log=Get-Content (Join-Path $root "android/qa-results/1.8.11/grid-native-$Label.txt")
$metrics=(($log | Where-Object {$_ -like 'INSTRUMENTATION_RESULT: metrics=*'}) -replace '^INSTRUMENTATION_RESULT: metrics=','') | ConvertFrom-Json
$bitmap=[Drawing.Bitmap]::new((Join-Path $out "grid-empty-android-$Label.png"))
try {
 $x=[int][Math]::Round($metrics.rect.x*$metrics.ratio)
 $y=[int][Math]::Round($metrics.rect.y*$metrics.ratio)
 $cell=[int]($metrics.canvas[0]/10)
 $background=$bitmap.GetPixel($x+5,$y+5)
 $ink=[Drawing.Color]::FromArgb(134,192,108)
 $contrast=[Math]::Abs($background.R-$ink.R)+[Math]::Abs($background.G-$ink.G)+[Math]::Abs($background.B-$ink.B)
 $scans=@()
 foreach($axis in @('vertical','horizontal')) {
  $length=if($axis -eq 'vertical'){$metrics.canvas[0]}else{$metrics.canvas[1]}
  $runs=@();$start=-1
  # Measure the >=50% line core and integrated stroke coverage separately.
  # Counting any RGB difference as a line mistakes 1/255 GPU rounding noise
  # for a whole extra pixel. Coverage still includes the filtered fringes.
  $coverage=New-Object 'double[]' $length
  for($i=1;$i -lt $length;$i++) {
   $marked=$false
   if($i -lt $length-1){$px=if($axis -eq 'vertical'){$x+$i}else{$x+5};$py=if($axis -eq 'vertical'){$y+5}else{$y+$i};$pixel=$bitmap.GetPixel($px,$py);$coverage[$i]=([Math]::Abs($background.R-$pixel.R)+[Math]::Abs($background.G-$pixel.G)+[Math]::Abs($background.B-$pixel.B))/$contrast;$marked=$coverage[$i] -ge .5}
   if($marked -and $start -lt 0){$start=$i}
   if(!$marked -and $start -ge 0){$runs+=@{start=$start;width=$i-$start};$start=-1}
  }
  $expected=if($axis -eq 'vertical'){9}else{19}
  if($runs.Count -ne $expected){throw "$axis has $($runs.Count) lines"}
  $fringe=$runs[0].start-$cell
  if([Math]::Abs($fringe) -gt 1){throw "Unexpected $axis pixel offset"}
  for($i=0;$i -lt $runs.Count;$i++){if($runs[$i].start -ne ($i+1)*$cell+$fringe -or $runs[$i].width -ne $runs[0].width){throw "Uneven $axis screenshot pixels"}}
  $weights=@();foreach($run in $runs){$weight=0;for($j=$run.start-2;$j -lt $run.start+$run.width+2;$j++){$weight+=$coverage[$j]};$weights+=$weight}
  $ideal=[Math]::Max(1,[Math]::Round($cell/30))
  foreach($weight in $weights){if([Math]::Abs($weight-$ideal) -gt .05){throw "Uneven $axis stroke coverage: $weight vs $ideal"}}
  $scans+=@{axis=$axis;lines=$runs.Count;cellPixels=$cell;linePixels=$runs[0].width;minCoverage=($weights|Measure-Object -Minimum).Minimum;maxCoverage=($weights|Measure-Object -Maximum).Maximum}
 }
 if($scans[0].linePixels -ne $scans[1].linePixels){throw 'Horizontal and vertical line widths differ'}
 $report=@{result='PASS';screen=@($bitmap.Width,$bitmap.Height);scans=$scans}
 $report | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $out "QA-screen-pixels-android-$Label.json")
 $report | ConvertTo-Json -Depth 5
}finally{$bitmap.Dispose()}
