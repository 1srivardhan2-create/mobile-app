# Run Caffélino on Your Phone (Expo Go)

## Quick start

1. Install **Expo Go** from Play Store (supports **SDK 54**).
2. Phone and PC on **same Wi‑Fi** (or use tunnel — step 4).
3. On PC:

```bash
cd caffelino-mobile
npm install
npm start
```

Terminal should say **"Using Expo Go"** (not "development build").

4. Open **Expo Go** on your phone → **Scan QR code** from the terminal.

If QR does nothing or says "Unable to connect":

```bash
npm run start:tunnel
```

Wait until tunnel URL appears, then scan again with **Expo Go**.

---

## Demo login (no real SMS)

| Field | Value |
|-------|--------|
| Phone | `9876543210` |
| OTP | `123456` |

---

## Still not opening?

| Problem | Fix |
|--------|-----|
| "Incompatible SDK" | Update **Expo Go** from Play Store |
| QR opens browser, not app | Open **Expo Go** first, then scan from inside Expo Go |
| "Unable to connect" | Run `npm run start:tunnel` |
| Different Wi‑Fi / mobile data | Always use `npm run start:tunnel` |
| Windows firewall | Allow Node.js on private network when prompted |
| Scanner does nothing | In Expo Go → **Enter URL manually** → paste `exp://...` from terminal |

---

## Manual URL

In terminal look for a line like:

```
exp://192.168.1.5:8081
```

Type that into Expo Go → **Enter URL manually**.

---

## Native build (optional, later)

For Firebase real SMS OTP you need a custom APK (`npx expo run:android`). Demo mode works in **Expo Go** without that.
