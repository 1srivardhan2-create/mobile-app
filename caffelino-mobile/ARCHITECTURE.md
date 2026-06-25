# Caffélino Mobile Architecture

## Separation from web

| Layer | Web (`file-main/`) | Mobile (`caffelino-mobile/`) |
|-------|-------------------|------------------------------|
| UI / screens | Website components | New React Native screens only |
| Design system | Tailwind / Radix | Coffee palette in `src/theme/` |
| Navigation | React web routes | React Navigation stacks + tabs |
| Data | Mixed local + API | API layer in `src/api/` only |

**Unchanged:** `server/` Express API, MongoDB models, JWT auth, feedback/meetup/café endpoints.

## Navigation graph

```
RootNavigator
├── AuthNavigator (logged out or onboarding incomplete)
│   Splash → Welcome → MobileNumber → Otp
│   → ProfileSetup (new) → LocationPermission → [auto] Main
└── MainNavigator (logged in + onboarding done)
    ├── Tabs: Home | Explore | Meetups | Loved | Profile
    ├── CafeDetails
    └── Settings
```

## API endpoints used

| Feature | Method | Path |
|---------|--------|------|
| Send OTP | POST | `/api/auth/mobile-login` |
| Verify OTP | POST | `/api/auth/mobile-verify-otp` |
| Register | POST | `/api/auth/mobile-signup` |
| Profile | PUT | `/api/user/profile/:userId` |
| Cafés | GET | `/api/cafe/approved` |
| Feedback | GET/POST | `/api/feedback` |
| Meetups | GET/POST | `/api/meetups/*` |
| Live feedback | Socket | `new_global_feedback` |

## Auth flows

**Returning user:** mobile-login → OTP verify → JWT stored → Home.

**New user:** mobile-login returns 404 → OTP `123456` (demo) → ProfileSetup → mobile-signup + profile update → Location → Home.

## When you add Figma assets

1. `assets/animations/` — Lottie for splash steam, confetti, success splash
2. `assets/avatars/` — PNG/SVG anime avatars; map IDs in `src/constants/avatars.ts`
3. Replace emoji placeholders in screens (splash bean, welcome cup, empty states)
