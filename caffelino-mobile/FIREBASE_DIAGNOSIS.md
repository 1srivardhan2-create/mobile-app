# Caffélino Mobile — Firebase Phone OTP Diagnosis (This Project)

Analysis date: based on `caffelino-mobile/` codebase as it exists in the repo.

---

## Executive summary — what blocks real SMS OTP

| # | Blocker | Severity |
|---|---------|----------|
| 1 | **Using Expo Go** instead of a **development build** | FATAL |
| 2 | **`adb` not in PATH** → `expo run:android` cannot install app | FATAL |
| 3 | **No device/emulator** connected | FATAL |
| 4 | **`applicationId` was `com.cafflino`** (typo) — Firebase expects `com.caffelino.mobile` | FATAL (fixed in repo) |
| 5 | **Google Services Gradle plugin missing** from generated `android/` | FATAL (fixed in repo) |
| 6 | **`google-services.json` not in `android/app/`** after failed prebuild | FATAL |
| 7 | **`FIREBASE_SERVICE_ACCOUNT_JSON` missing on Render** | Blocks login after OTP |
| 8 | **SHA-1 in Firebase** must match **debug keystore** used by `expo run:android` | FATAL for SMS |

Until #1–#6 are fixed, **no real SMS OTP** will work. Until #7 is fixed, OTP may verify on device but **backend login fails**.

---

## 1. `package.json` — OK with caveats

```json
"expo": "~56.0.0"
"expo-dev-client": "~56.0.18"
"@react-native-firebase/app": "^23.8.8"
"@react-native-firebase/auth": "^23.8.8"
```

- **Expo SDK 56** — correct for new Firebase; **does not run in Play Store Expo Go** (SDK 54 on store).
- **`expo-dev-client`** — required; confirms **development build** is intended.
- Scripts use `--dev-client` — correct.
- **`EXPO_PUBLIC_FIREBASE_API_KEY` in `.env`** does **not** power native Phone Auth; native uses `google-services.json` only.

---

## 2. `app.json` / `app.config.js`

**app.json** — correct:

- `android.package`: `com.caffelino.mobile` ✓
- `android.googleServicesFile`: `./google-services.json` ✓
- Plugins: `@react-native-firebase/app`, `@react-native-firebase/auth`, `expo-dev-client` ✓

**app.config.js** — was only merging `extra`; **did not force `android.package`**. Stale `android/` folder had wrong ID. Now forces package + plugin order.

---

## 3. `android/` folder — CRITICAL BUGS FOUND

### Bug A — Wrong application ID (Firebase killer)

`android/app/build.gradle` had:

```gradle
namespace "com.cafflino"
applicationId "com.cafflino"
```

Your `google-services.json` says:

```json
"package_name": "com.caffelino.mobile"
```

Firebase ties **SHA-1 + package name** to the **installed APK’s applicationId**.  
With `com.cafflino`, Firebase rejects phone auth / never sends SMS to the right app.

**Fixed in repo** → `com.caffelino.mobile`.

### Bug B — Google Services plugin not applied

`android/app/build.gradle` ended at line 182 with **no**:

```gradle
apply plugin: 'com.google.gms.google-services'
```

`android/build.gradle` had **no**:

```gradle
classpath 'com.google.gms:google-services:...'
```

This happens when `android/` was generated **before** Firebase plugins ran, or prebuild failed at copy step.

**Fixed in repo** manually; you must run **`npx expo prebuild --clean`** so plugins re-apply.

### Bug C — Copy error you saw

```
Cannot copy google-services.json to android/app/google-services.json
```

Comes from `@react-native-firebase/app` plugin during prebuild when:

- File missing at `./google-services.json` at prebuild time, OR
- Prebuild interrupted

**Fix:** `npm run copy:google-services` then `npx expo prebuild --clean`.

---

## 4. `google-services.json` location

| Path | Status |
|------|--------|
| `caffelino-mobile/google-services.json` | Present ✓ (`com.caffelino.mobile`, project `caffelino09`) |
| `caffelino-mobile/android/app/google-services.json` | Often **missing** after failed prebuild |

Both are required: root for Expo config plugin source, `android/app/` for Gradle.

---

## 5. Firebase Phone Auth (Console)

Your JSON has `"oauth_client": []` — **normal** for Android phone auth when using SHA-1 + package, not OAuth client.

You must have in Firebase Console:

1. Authentication → **Phone** → Enabled  
2. Project settings → Android app → Package **`com.caffelino.mobile`** (exact)  
3. **SHA-1** of the keystore that signs the APK you install  

SHA-1 must be from **debug keystore** used by:

`caffelino-mobile/android/app/debug.keystore` (default for `expo run:android`)

Get SHA-1 (after Android SDK installed):

```powershell
cd c:\Users\1sriv\Downloads\file-main\caffelino-mobile\android
.\gradlew signingReport
```

Copy **SHA-1** under `Variant: debug` → add in Firebase → Android app.

If you added SHA-1 for a **different** package (`com.cafflino` or wrong keystore), SMS will not work.

---

## 6. Expo SDK vs Expo Go

| | Expo Go (Play Store) | Your project |
|--|---------------------|--------------|
| SDK on device | ~54 | **56** |
| Firebase native modules | No | **Yes** |
| QR scan | Opens Expo Go | Must open **Caffélino dev build** |

**Expo Go installed = expected that QR / scanner “does nothing” for this project.**

---

## 7. `adb` and Android SDK (your errors)

```
adb is not recognized
No Android connected device found
```

Means:

- **Android SDK Platform-Tools** not on `PATH`, and/or  
- No USB device / no emulator running  

### Fix PATH (Windows PowerShell — run once per session or set System env)

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path += ";$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\emulator;$env:ANDROID_HOME\tools;$env:ANDROID_HOME\tools\bin"
adb version
```

Permanent: System Properties → Environment Variables → add `ANDROID_HOME` and add to `Path`:

- `%LOCALAPPDATA%\Android\Sdk\platform-tools`

### Device

- **Physical:** USB debugging ON → `adb devices` shows `device`  
- **Emulator:** Android Studio → Device Manager → start Pixel API 34 → `adb devices`

Without this, **`npm run android` cannot run**.

---

## 8. Backend (Render) — after OTP on phone

`server/config/firebase.js` requires:

```
FIREBASE_SERVICE_ACCOUNT_JSON={full service account JSON one line}
```

Without it: `POST /api/auth/firebase-phone` returns **503** — user sees OTP success on Firebase but app login fails.

`FIREBASE_API_KEY` alone is **not enough** for server token verification.

---

## Exact commands (run in order)

```powershell
# 1. Android SDK on PATH (see above)
adb version

# 2. Project
cd c:\Users\1sriv\Downloads\file-main\caffelino-mobile
npm install

# 3. Copy Firebase config into android/app
npm run copy:google-services

# 4. Regenerate native project (applies Firebase plugins + correct package)
npx expo prebuild --clean --platform android

# 5. Verify package name in android/app/build.gradle
#    MUST show: applicationId "com.caffelino.mobile"

# 6. SHA-1 → paste into Firebase Console
cd android
.\gradlew signingReport

# 7. Start emulator OR plug in phone, then:
cd ..
npm run android

# 8. Start Metro (use tunnel if Wi‑Fi issues)
npm run start:tunnel

# 9. On phone: open installed "Caffélino" app (NOT Expo Go)
```

---

## Verification checklist

- [ ] `android/app/build.gradle` → `applicationId "com.caffelino.mobile"`
- [ ] `android/app/google-services.json` exists
- [ ] Last line of `android/app/build.gradle` → `apply plugin: 'com.google.gms.google-services'`
- [ ] `android/build.gradle` → `classpath 'com.google.gms:google-services:...'`
- [ ] Firebase Console SHA-1 matches debug keystore
- [ ] `adb devices` shows a device
- [ ] App installed is **Caffélino** dev build, not Expo Go
- [ ] Render has `FIREBASE_SERVICE_ACCOUNT_JSON`

---

## What was fixed in the codebase

1. `app.config.js` — forces `android.package`, plugin order, `googleServicesFile`  
2. `android/app/build.gradle` — `com.caffelino.mobile` + google-services plugin  
3. `android/build.gradle` — google-services classpath  
4. `scripts/copy-google-services.js` — copies to root + `android/app/`

**You must still run `npx expo prebuild --clean` locally** so future regenerations stay correct.
