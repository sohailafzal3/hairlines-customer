# Hairlines Pro RN — Missing Points & Migration Gaps

This document tracks what has been ported and what still needs work.

## ✅ Completed in this migration

- Expo SDK 54 project shell with TypeScript.
- Cookie-based API client matching the legacy Swift session flow.
- Auth: landing, phone sign-in/sign-up, OTP verification, guest mode, social sign-in hooks (Apple/Facebook/Google placeholders), forgot password.
- Onboarding: personal info, services selection, services-for, professional license, identity documents, banking/languages, availability, thank-you, set-location autocomplete.
- Main drawer: home map, notifications, profile, wallet, earnings, settings, workers list, history, share/referral, terms (WebView), support.
- Job lifecycle: home job list, job request popup, job details, status transitions, cost breakdown/line items, cancellation reasons, add services, tools/equipment, rate customer after completion.
- Chat: real-time Socket.IO chat using `react-native-gifted-chat`.
- Calls: dialer fallback + Twilio service placeholder.
- Location: foreground/background tracking with `expo-location` + `expo-task-manager` and socket emission.
- Push notifications: `expo-notifications` registration and tap-to-navigate routing.
- Localization: English, Arabic, French.
- Config: app.json with bundle IDs, permissions, background modes, Stripe plugin, maps key.

## ⚠️ Known gaps / next steps

1. **Social sign-in secrets**
   - Apple works with `expo-apple-authentication`.
   - Facebook requires a real Facebook App ID and redirect URI.
   - Google requires a real OAuth Web Client ID or `@react-native-google-signin/google-signin` in a dev build.

2. **Twilio Voice native integration**
   - The full CallKit/PushKit VoIP flow requires the native Twilio Voice SDK in a custom Expo dev build.
   - Current implementation fetches the access token and falls back to the system dialer.

3. **Stripe bank account tokenization**
   - Banking screen currently sends a placeholder token. Integrate `createToken` from `@stripe/stripe-react-native` for bank accounts.

4. **Google Maps iOS API key in standalone builds**
   - Android key is set in `app.json`. iOS standalone builds need a config plugin or prebuild step to call `GMSServices.provideAPIKey`.

5. **Company/worker management**
   - Worker list is present; create/edit worker screen and service assignment still need UI.

6. **Referral binary tree / CSV**
   - Only referral code copy/share is implemented.

7. **Checkr background check**
   - Freelancer background-check consent screen is not yet added.

8. **Tests**
   - No unit or E2E tests exist yet.

9. **Error boundaries / retry / offline state**
   - Basic alerts are used; global error boundary and offline banner could be added.

10. **Deep linking / universal links**
    - Basic scheme is configured; route handling for incoming links is not implemented.
