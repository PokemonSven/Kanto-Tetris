$ErrorActionPreference='Stop'
$toolRoot=Join-Path (Split-Path $PSScriptRoot -Parent) '.android-tools'
$env:ANDROID_SDK_ROOT=$toolRoot
$env:ANDROID_USER_HOME="$toolRoot/user"
$env:ANDROID_AVD_HOME="$toolRoot/avd"
$avdDir="$toolRoot/avd/KantoQA.avd"
New-Item -ItemType Directory -Force $avdDir,$env:ANDROID_USER_HOME | Out-Null
@"
avd.ini.encoding=UTF-8
path=$avdDir
target=android-30
"@ | Set-Content -LiteralPath "$toolRoot/avd/KantoQA.ini"
@"
avd.ini.encoding=UTF-8
AvdId=KantoQA
abi.type=x86_64
hw.cpu.arch=x86_64
hw.cpu.ncore=2
hw.ramSize=2048
hw.lcd.width=960
hw.lcd.height=1280
hw.lcd.density=240
hw.initialOrientation=landscape
hw.keyboard=yes
hw.gpu.enabled=yes
hw.gpu.mode=swiftshader_indirect
image.sysdir.1=$toolRoot/system-image/x86_64/
tag.id=google_apis
tag.display=Google APIs
disk.dataPartition.size=3G
showDeviceFrame=no
fastboot.forceColdBoot=yes
"@ | Set-Content -LiteralPath "$avdDir/config.ini"
$emuProcess=Start-Process -FilePath "$toolRoot/emulator/emulator.exe" -ArgumentList '-avd KantoQA -no-window -no-audio -no-snapshot -no-boot-anim -gpu swiftshader_indirect -port 5556' -WindowStyle Hidden -PassThru -RedirectStandardOutput "$toolRoot/emulator.log" -RedirectStandardError "$toolRoot/emulator-error.log"
Write-Output "Emulator PID: $($emuProcess.Id)"
