# Ensures an Android emulator or USB device is available before expo run:android.
$ErrorActionPreference = "Stop"

$sdk = $env:ANDROID_HOME
if (-not $sdk) { $sdk = $env:ANDROID_SDK_ROOT }
if (-not $sdk) { $sdk = Join-Path $env:LOCALAPPDATA "Android\Sdk" }

$adb = Join-Path $sdk "platform-tools\adb.exe"
$emulator = Join-Path $sdk "emulator\emulator.exe"

if (-not (Test-Path $adb)) {
  Write-Host "Android SDK not found. Install Android Studio and set ANDROID_HOME." -ForegroundColor Red
  Write-Host "https://docs.expo.dev/workflow/android-studio-emulator/"
  exit 1
}

$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:PATH = "$(Join-Path $sdk 'platform-tools');$(Join-Path $sdk 'emulator');$env:PATH"

$devices = & $adb devices | Select-String "device$"
if ($devices) {
  Write-Host "Android device ready: $($devices.Line.Trim())"
  exit 0
}

if (-not (Test-Path $emulator)) {
  Write-Host "No device connected and emulator not installed." -ForegroundColor Red
  Write-Host "Open Android Studio -> Device Manager -> Create Virtual Device, then run this again."
  exit 1
}

$avds = & $emulator -list-avds 2>$null
if (-not $avds) {
  Write-Host "No Android Virtual Devices found." -ForegroundColor Red
  Write-Host "Create one in Android Studio -> Device Manager -> Create Virtual Device."
  exit 1
}

$avd = $avds[0]
Write-Host "Starting emulator: $avd"
Start-Process -FilePath $emulator -ArgumentList @("-avd", $avd) -WindowStyle Minimized

Write-Host "Waiting for emulator (up to 3 minutes)..."
$deadline = (Get-Date).AddMinutes(3)
while ((Get-Date) -lt $deadline) {
  Start-Sleep -Seconds 5
  $devices = & $adb devices | Select-String "device$"
  if ($devices) {
    Write-Host "Emulator ready."
    exit 0
  }
}

Write-Host "Emulator did not become ready in time." -ForegroundColor Red
exit 1
