param([string]$Device='emulator-5556',[string]$Label='4x3',[string[]]$Modes=@('suite-controls','suite-pause','suite-brock','suite-backups','suite-ui','suite-features','all','files'))
$ErrorActionPreference='Stop'
$project=Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$env:ANDROID_USER_HOME=Join-Path $project '.android-tools/user'
$adb=Join-Path $project '.android-tools/platform-tools/adb.exe'
$out=Join-Path $project 'android/qa-results/1.8.12'
New-Item -ItemType Directory -Force $out | Out-Null
foreach($mode in $Modes){
 $result=& $adb -s $Device shell am instrument -w -e mode $mode com.kantotetris.game.qa/com.kantotetris.game.SmokeInstrumentation
 $result | Set-Content -LiteralPath (Join-Path $out "$mode-$Label.txt")
 $result | Where-Object {$_ -match '^INSTRUMENTATION_RESULT: (result|error)='} | ForEach-Object {"${mode}: $_"}
 if(!($result -contains 'INSTRUMENTATION_RESULT: result=PASS')){throw "Failed $mode; see $out"}
}
