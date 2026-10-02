param([string]$Device='emulator-5556')
$ErrorActionPreference='Stop'
$project=Split-Path (Split-Path $PSScriptRoot -Parent) -Parent
$env:ANDROID_USER_HOME=Join-Path $project '.android-tools/user'
$adb=Join-Path $project '.android-tools/platform-tools/adb.exe'
$apk=Join-Path $project 'releases/Kanto_Tetris_1.8.12_Android.apk'
$toolsDir=Join-Path $project '.android-tools/build-tools/android-15'
$out=Join-Path $project 'android/qa-results/1.8.12'
function Adb([string[]]$Arguments){$result=& $adb -s $Device @Arguments;if($LASTEXITCODE -ne 0){throw "adb failed: $Arguments"};return $result}
Add-Type -AssemblyName System.IO.Compression.FileSystem
$archive=[IO.Compression.ZipFile]::OpenRead($apk)
try{
 $musicManifest=Get-Content -Raw (Join-Path $project 'src/assets/soundtrack.json') | ConvertFrom-Json
 $packagedTracks=@($archive.Entries | Where-Object {$_.FullName -match '^assets/music/frlg-\d{2}\.mp3$'})
 if($packagedTracks.Count -ne $musicManifest.tracks.Count){throw 'Packaged track count mismatch'}
 foreach($track in $musicManifest.tracks){
  $entry=$archive.GetEntry('assets/'+$track.file)
  if(!$entry -or $entry.Length -ne $track.bytes -or $entry.CompressedLength -ne $entry.Length){throw "Missing/compressed music: $($track.file)"}
  $stream=$entry.Open();$digest=[Security.Cryptography.SHA256]::Create()
  try{$actual=[Convert]::ToHexString($digest.ComputeHash($stream)).ToLowerInvariant()}finally{$stream.Dispose();$digest.Dispose()}
  if($actual -ne $track.sha256){throw "Music integrity mismatch: $($track.file)"}
 }
}catch{$archive.Dispose();throw}
try{$reader=[IO.StreamReader]::new($archive.GetEntry('assets/index.html').Open());try{$asset=$reader.ReadToEnd()}finally{$reader.Dispose()}}finally{$archive.Dispose()}
if($asset -cne [IO.File]::ReadAllText((Join-Path $project 'android/assets/index.html'))){throw 'Packaged HTML does not match final asset'}
if($asset -match 'nativeQA|qaCampaignTimers|id="qaPanel"|__(?:OAK|ROCKET|KANTO_MAP)_'){throw 'QA hook or unembedded art in release'}
$manifest=& "$toolsDir/aapt2.exe" dump xmltree $apk --file AndroidManifest.xml
if($LASTEXITCODE -ne 0 -or ($manifest -match 'debuggable|instrumentation')){throw 'Release manifest check failed'}
$badging=& "$toolsDir/aapt2.exe" dump badging $apk
if($LASTEXITCODE -ne 0 -or !($badging -match "name='com.kantotetris.game'.*versionCode='10812'.*versionName='1.8.12'")){throw 'Release version is incorrect'}
$buildLog=Get-Content (Join-Path $out 'release-build.log') -Raw
if($buildLog -notmatch 'Verified using v2 scheme .*: true' -or $buildLog -notmatch 'Verified using v3 scheme .*: true'){throw 'Signature verification missing'}
& "$toolsDir/zipalign.exe" -c -p 4 $apk
if($LASTEXITCODE -ne 0){throw 'APK alignment failed'}
$before=(Adb @('shell','dumpsys','package','com.kantotetris.game')) -join "`n"
if($before -notmatch 'versionName=(1\.8\.11)\b'){throw 'Expected existing release for upgrade verification'}
$installedVersion=$Matches[1]
$install=(Adb @('install','-r',$apk)) -join "`n"
if($install -notmatch 'Success'){throw 'Upgrade failed'}
$after=(Adb @('shell','dumpsys','package','com.kantotetris.game')) -join "`n"
if($after -notmatch 'versionName=1\.8\.12\b' -or $after -notmatch 'versionCode=10812\b'){throw 'Installed version incorrect'}
Adb @('shell','am','force-stop','com.kantotetris.game') | Out-Null
$launch=(Adb @('shell','am','start','-W','-n','com.kantotetris.game/.MainActivity')) -join "`n"
if($launch -notmatch 'Status: ok'){throw 'Cold launch failed'}
Start-Sleep -Seconds 3
$appPid=(Adb @('shell','pidof','com.kantotetris.game')) -join ''
if(!$appPid){throw 'Release exited during launch'}
$logs=(Adb @('logcat','-d',"--pid=$appPid",'-t','250')) -join "`n"
if($logs -match 'FATAL EXCEPTION|Uncaught (?:ReferenceError|TypeError|SyntaxError)'){throw 'Release startup failure'}
$launch | Set-Content (Join-Path $out 'release-launch.txt')
$logs | Set-Content (Join-Path $out 'release-startup-log.txt')
$report=@{version='1.8.12';installedFrom=$installedVersion;assetMatches=$true;musicTracks=$packagedTracks.Count;musicHashesVerified=$true;qaHooks=$false;debuggable=$false;instrumentation=$false;signatureSchemes=@('v2','v3');alignmentVerified=$true;installAndLaunch='PASS';sha256=(Get-FileHash -LiteralPath $apk -Algorithm SHA256).Hash}
$report | ConvertTo-Json | Set-Content (Join-Path $out 'release-verification.json')
$report | ConvertTo-Json
