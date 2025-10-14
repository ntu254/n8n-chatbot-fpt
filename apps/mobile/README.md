# AI Adaptive Learning — Mobile (React Native + Expo + TS)

This is the mobile app skeleton with:
- Expo (managed) + TypeScript + expo-router
- Chat screen wired to POST /api/chat
- Demo Learning Plan generator from a sample curriculum
- EAS build profiles and CI workflow (token required)

## Prerequisites

- Node.js 18+
- `npm i -g expo-cli` (optional) and/or use `npx expo`
- The backend proxy running locally at http://localhost:3000 (or deployed). This repo already contains:
  - server/server.js (Express proxy) → POST /api/chat forwards to N8N webhook
  - webapp for browser demo

## Setup

```
cd apps/mobile
npm install
```

Create a `.env` (or set env in your shell/CI) to configure API:
```
# Use your local server or production domain
EXPO_PUBLIC_API_BASE_URL=http://localhost:3000
# Android emulator uses 10.0.2.2 to reach host machine
# EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000
```

Start dev:
```
npm run start
```

Open on devices:
- iOS simulator: press i in the Expo terminal
- Android emulator: press a

## Screens

- Chat AI (default): sends `{ chatInput, sessionId }` to `${EXPO_PUBLIC_API_BASE_URL}/api/chat`
- Learning Plan (Demo): generates semesters from `assets/curriculum.json` with prerequisite DAG + credit-cap

## EAS Build

We include `eas.json` profiles for `preview` and `production`.

To build locally:
```
npx eas build -p android --profile preview
npx eas build -p ios --profile preview
```

To enable CI:
- Add `EXPO_TOKEN` secret to your GitHub repo (https://expo.dev/accounts → Access Tokens).
- Ensure `EXPO_PUBLIC_API_BASE_URL` is set in CI (Repository → Settings → Secrets → Actions).

## Notes

- Session ID persists in AsyncStorage under `tua_session_id`.
- The learning plan generator is a simple greedy/topo heuristic for demo. Replace with your API later.
- Styling kept minimal; you can integrate a UI kit (Tamagui, NativeWind, RN Paper) as next step.