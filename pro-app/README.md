# Hairlines Pro — React Native (Expo SDK 54)

This is a React Native port of the legacy **Hairlines Pro** iOS (Swift/UIKit) service-provider app, built with **Expo SDK 54** and **TypeScript**.

## What was migrated

- **Auth & onboarding**: landing, sign-in / sign-up with phone + OTP, guest mode, and the full onboarding flow (personal info, services, professional license, identity documents, banking/languages, availability).
- **Main drawer**: home map, notifications, profile, wallet, earnings, settings, workers, history, share/referral, terms, and support.
- **Job lifecycle**: home map with job list, job request popup, job details, status transitions, cost breakdown, cancellation reasons, service selection, tools/equipment.
- **Chat**: real-time job chat via Socket.IO + `react-native-gifted-chat`.
- **Calls**: dialer + Twilio Voice service placeholder (see note below).
- **Location**: foreground/background location tracking using `expo-location` + `expo-task-manager` and socket-based coordinate emission.
- **Push notifications**: `expo-notifications` integration.
- **Networking**: axios API client that reproduces the original cookie-based session with a manual cookie jar.
- **Social auth**: ready to be wired via `expo-auth-session` / `expo-apple-authentication`.
- **Payments**: Stripe React Native SDK configured.

## Project structure

```
src/
  components/      # Reusable UI building blocks
  constants.ts     # API URLs, keys, enums
  context/         # UserContext (replaces User.shared singleton)
  localization/    # i18n + en/ar JSON
  navigation/      # Auth, Onboarding, Drawer, Home tab navigators
  screens/         # Feature screens
  services/        # API, socket, cookies, location, notifications, Twilio
  types/           # TypeScript models
  utils/           # Storage, helpers
```

## Getting started

```bash
cd HairlinesProRN
npm install
npx expo prebuild --clean   # if building a native binary
npx expo start              # development with Expo Go or dev client
```

## Important notes

- **Cookie-based auth**: The API client stores session cookies in AsyncStorage and sends them on every request, matching the original Swift behavior.
- **Twilio Voice**: Full CallKit/PushKit VoIP requires a custom Expo dev build with the native Twilio Voice SDK. The app currently falls back to the system dialer.
- **Google Maps**: Android maps key is set in `app.json`. For iOS standalone builds you will need a custom config plugin or prebuild step to call `GMSServices.provideAPIKey`; Expo Go uses its own key.
- **Background location**: Requested and started when the provider goes online.
- **No tests yet**: The original Swift project had none; tests should be added as the RN app matures.

## Environment / secrets

Hard-coded secrets from the original Swift project were carried over into `src/constants.ts` to preserve functionality. Before production, move API keys, Stripe keys, AWS credentials, and OAuth client IDs into environment variables or a secrets manager.
