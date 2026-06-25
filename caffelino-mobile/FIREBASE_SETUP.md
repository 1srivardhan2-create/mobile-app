# Firebase Phone Auth — Caffélino Mobile

## Requirements

- **Expo SDK 56** (or 54+ with dev client)
- **Development build** — Firebase Phone Auth does **not** work in standard Expo Go
- `google-services.json` in project root
- Render backend with `FIREBASE_SERVICE_ACCOUNT_JSON` env var

## 1. Add `google-services.json`

```bash
# Copy from existing Android project (if present)
node scripts/copy-google-services.js

# Or download from Firebase Console and save as:
# caffelino-mobile/google-services.json
```

Package name must be: **`com.caffelino.mobile`**

## 2. Firebase Console

1. Enable **Phone** sign-in: Authentication → Sign-in method → Phone
2. Add test phone numbers (optional) for development
3. Download **Service account** JSON for the backend:
   - Project Settings → Service accounts → Generate new private key

## 3. Environment variables

**Local** (`caffelino-mobile/.env`):
```
EXPO_PUBLIC_FIREBASE_API_KEY=your_key_from_firebase_console
```

**Local** (`server/.env`):
```
FIREBASE_API_KEY=your_key_from_firebase_console
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

**Render** (server) — add both:
```
FIREBASE_API_KEY=your_key
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...entire JSON on one line...}
```

The API key alone sends/configures Firebase; **service account JSON is still required** for the server to verify OTP and issue your app JWT.

Install server deps locally:

```bash
cd server
npm install
```

API: `POST /api/auth/firebase-phone` with `{ "idToken": "..." }`

## 4. Build & run Android (real OTP)

```bash
cd caffelino-mobile
npm install
npx expo prebuild --platform android
npx expo run:android
```

Or start dev client after first build:

```bash
npx expo start --dev-client
```

## Auth flow

```
Phone (+91) → Firebase SMS OTP → Verify → Backend JWT (MongoDB)
  → New user? Profile (name, username, avatar) → Location (city) → Home
  → Existing user? Home directly
```

JWT is stored in **expo-secure-store**.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `RNFBAppModule not found` | Use `expo run:android`, not Expo Go |
| OTP not received | Enable Phone auth in Firebase; check SHA-1 in Firebase Android app |
| 503 Firebase not configured | Set `FIREBASE_SERVICE_ACCOUNT_JSON` on Render |
| Invalid token | Device time correct; same Firebase project as `google-services.json` |
