param([string]$Name='next',[string]$Label='nova-4x3')
$ErrorActionPreference='Stop'
$project=Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$env:ANDROID_USER_HOME=Join-Path $project '.android-tools/user'
$info=[Diagnostics.ProcessStartInfo]::new((Join-Path $project '.android-tools/platform-tools/adb.exe'))
$info.UseShellExecute=$false;$info.RedirectStandardOutput=$true;$info.CreateNoWindow=$true
foreach($arg in @('-s','emulator-5556','exec-out','run-as','com.kantotetris.game.qa','cat',"files/preview-$Name.png")){$info.ArgumentList.Add($arg)}
$proc=[Diagnostics.Process]::Start($info)
$stream=[IO.File]::Create((Join-Path $project "android/qa-results/1.8.2/$Name-$Label.png"))
try{$proc.StandardOutput.BaseStream.CopyTo($stream)}finally{$stream.Dispose()}
$proc.WaitForExit();if($proc.ExitCode -ne 0){throw 'Preview retrieval failed'}
