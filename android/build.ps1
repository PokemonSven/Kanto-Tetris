param([switch]$QA)
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$toolRoot = Join-Path $projectRoot '.android-tools'
$javaRoot = (Get-ChildItem "$toolRoot/java" -Directory | Select-Object -First 1).FullName
$buildTools = "$toolRoot/build-tools/android-15"
$androidJar = "$toolRoot/platform/android-35/android.jar"
$flavor = if ($QA) { 'qa' } else { 'release' }
$outDir = "$PSScriptRoot/out/$flavor"
$signDir = "$PSScriptRoot/signing"
New-Item -ItemType Directory -Force "$outDir/classes","$outDir/dex",$signDir | Out-Null
function Run-Tool($exe, $arguments) { & $exe @arguments; if ($LASTEXITCODE -ne 0) { throw "$exe failed with exit code $LASTEXITCODE" } }
Run-Tool 'node' @("$projectRoot/tests/build-android-assets.cjs")
$manifest = "$PSScriptRoot/AndroidManifest.xml"
if ($QA) { Run-Tool 'node' @("$projectRoot/tests/build-android-qa.cjs"); $manifest = "$outDir/AndroidManifest.xml" }
$assetsDir = if ($QA) { "$outDir/assets" } else { "$PSScriptRoot/assets" }
Run-Tool "$buildTools/aapt2.exe" @('compile','--dir',"$PSScriptRoot/res",'-o',"$outDir/resources.zip")
Run-Tool "$buildTools/aapt2.exe" @('link','-0','mp3','-o',"$outDir/resources.apk",'-I',$androidJar,'--manifest',$manifest,'-A',$assetsDir,"$outDir/resources.zip")
$sources = @(Get-ChildItem "$PSScriptRoot/java" -Recurse -Filter '*.java' | ForEach-Object FullName)
if ($QA) { $sources += "$projectRoot/tests/android/SmokeInstrumentation.java" }
Run-Tool "$javaRoot/bin/javac.exe" (@('--release','8','-classpath',$androidJar,'-d',"$outDir/classes") + $sources)
Run-Tool "$javaRoot/bin/jar.exe" @('cf',"$outDir/classes.jar",'-C',"$outDir/classes",'.')
Run-Tool "$javaRoot/bin/java.exe" @('-cp',"$buildTools/lib/d8.jar",'com.android.tools.r8.D8','--release','--min-api','26','--lib',$androidJar,'--output',"$outDir/dex","$outDir/classes.jar")
Copy-Item -LiteralPath "$outDir/resources.apk" -Destination "$outDir/unsigned.apk" -Force
Run-Tool "$javaRoot/bin/jar.exe" @('uf',"$outDir/unsigned.apk",'-C',"$outDir/dex",'classes.dex')
# Windows aapt2 can emit backslashes for nested asset names. Android's asset
# manager requires forward slashes; retain uncompressed MP3s for openFd/ranges.
Add-Type -AssemblyName System.IO.Compression.FileSystem
$assetZip=[IO.Compression.ZipFile]::Open("$outDir/unsigned.apk",[IO.Compression.ZipArchiveMode]::Update)
try {
    foreach($entry in @($assetZip.Entries | Where-Object { $_.FullName.Contains('\') })) {
        $normalized=$entry.FullName.Replace('\','/')
        $level=if($normalized.EndsWith('.mp3')){[IO.Compression.CompressionLevel]::NoCompression}else{[IO.Compression.CompressionLevel]::Optimal}
        $replacement=$assetZip.CreateEntry($normalized,$level)
        $sourceStream=$entry.Open();$targetStream=$replacement.Open()
        try{$sourceStream.CopyTo($targetStream)}finally{$sourceStream.Dispose();$targetStream.Dispose()}
        $entry.Delete()
    }
} finally {$assetZip.Dispose()}
Run-Tool "$buildTools/zipalign.exe" @('-f','-p','4',"$outDir/unsigned.apk","$outDir/aligned.apk")
if (!(Test-Path "$signDir/release.jks")) {
    $password = [Guid]::NewGuid().ToString('N')+[Guid]::NewGuid().ToString('N')
    [IO.File]::WriteAllText("$signDir/password.txt", $password)
    Run-Tool "$javaRoot/bin/keytool.exe" @('-genkeypair','-keystore',"$signDir/release.jks",'-alias','kanto-tetris','-storetype','JKS','-storepass:file',"$signDir/password.txt",'-keypass:file',"$signDir/password.txt",'-keyalg','RSA','-keysize','3072','-validity','10000','-dname','CN=Kanto Tetris Local Release, OU=Independent Development')
}
$apk = if ($QA) { "$outDir/Kanto_Tetris_1.8.16_Android_QA.apk" } else { "$projectRoot/releases/Kanto_Tetris_1.8.16_Android.apk" }
Run-Tool "$javaRoot/bin/java.exe" @('-jar',"$buildTools/lib/apksigner.jar",'sign','--ks',"$signDir/release.jks",'--ks-key-alias','kanto-tetris','--ks-pass',"file:$signDir/password.txt",'--v4-signing-enabled','false','--out',$apk,"$outDir/aligned.apk")
Run-Tool "$javaRoot/bin/java.exe" @('-jar',"$buildTools/lib/apksigner.jar",'verify','--verbose','--print-certs',$apk)
Run-Tool "$buildTools/zipalign.exe" @('-c','-p','4',$apk)
Get-FileHash -LiteralPath $apk -Algorithm SHA256
