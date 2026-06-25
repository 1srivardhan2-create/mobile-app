# Caffélino Mobile

A **completely separate** mobile-first application for Caffélino. It does not reuse the website UI, routes, or design system.

## Shared with backend only

- MongoDB data (users, feedback, meetups, cafés)
- REST APIs at `/api/*`
- JWT authentication (`/api/auth/mobile-*`)

## Tech stack

- **Expo SDK 56** + React Native
- **React Navigation** (native stack + bottom tabs)
- **Reanimated 4** for 60fps micro-interactions
- **AsyncStorage** for session persistence
- **Socket.io** for live feedback updates

## Project structure

```
caffelino-mobile/
├── src/
│   ├── api/           # API abstraction layer
│   ├── components/    # Mobile-only UI
│   ├── config/        # Environment (API URL)
│   ├── constants/     # Avatars, etc.
│   ├── context/       # Auth + theme
│   ├── hooks/         # Data hooks
│   ├── navigation/    # Auth + main navigators
│   ├── screens/       # All mobile screens
│   ├── services/      # Storage
│   ├── theme/         # Coffee design tokens
│   └── types/
├── App.tsx
└── app.json
```

## User flow

```
Splash (2.5s) → Welcome → Mobile → OTP → Profile (new users) → Location → Home
                                                                    ├── Explore
                                                                    ├── Meetups
                                                                    ├── Loved By Users
                                                                    └── Profile
```

## Run locally

**Requires Expo Go from the Play Store (SDK 54).** This project uses Expo SDK 54 so it works with the standard Expo Go app—not SDK 56.

```bash
cd caffelino-mobile
npm install
npx expo start --clear
# Scan QR code with Expo Go on your phone
```

If you still see an incompatibility error, update **Expo Go** from the Play Store, then run `npx expo start --clear` again.

### API URL

- **Production:** `https://caffelino90-9v4a.onrender.com` (default in release builds)
- **Development:** `http://10.0.2.2:4000` on Android emulator, `http://localhost:4000` on iOS simulator

Edit `src/config/env.ts` to point at your local `server/` instance.

### Demo OTP

Existing users: backend sends OTP (demo code `123456` is also returned in dev).  
New users: enter `123456` on OTP screen, then complete profile → `POST /api/auth/mobile-signup`.

## Design system

| Token        | Hex       |
|-------------|-----------|
| Dark Coffee | `#3E2723` |
| Coffee Brown| `#6F4E37` |
| Latte Brown | `#A67B5B` |
| Cream       | `#F5E6D3` |
| Espresso    | `#2B1B17` |
| Gold Accent | `#D4A373` |

## Website

The `file-main/` web app is **not modified** by this project. Deploy mobile and web independently.

## Next steps (for your Figma assets)

1. Replace emoji placeholders with Lottie/SVG coffee cup & steam animations
2. Drop in anime avatar image assets under `assets/avatars/`
3. Add `eas build` profile for Play Store release
4. Wire real SMS OTP when backend supports it
