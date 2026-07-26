# Hairlines iOS → React Native (Expo) Migration

This document describes the migration of the Hairlines iOS (Swift/UIKit) app to **React Native with Expo**.

## Why Expo?

Expo provides a managed workflow that simplifies:
- Native module management (no CocoaPods/Android Gradle headaches)
- Over-the-air updates
- Push notifications setup
- Build automation via EAS
- Deep linking and auth configuration

> **Note**: This app uses native modules like Stripe, Google Maps, and social login. You must use an **Expo Development Build** (not Expo Go) to run it.

---

## Project Structure

```
HairlinesExpo/
├── src/
│   ├── api/               # API clients (Axios-based)
│   │   ├── client.ts      # Base API client with interceptors
│   │   ├── auth.ts        # Authentication endpoints
│   │   ├── jobs.ts        # Job/service booking endpoints
│   │   ├── profile.ts     # User profile endpoints
│   │   ├── payments.ts    # Stripe payment endpoints
│   │   ├── chat.ts        # Chat thread endpoints
│   │   ├── notifications.ts
│   │   └── upload.ts      # File upload endpoints
│   ├── models/            # TypeScript interfaces (matches iOS models)
│   ├── store/             # Zustand state management
│   │   ├── useAuthStore.ts
│   │   ├── useJobStore.ts
│   │   └── useUserStore.ts
│   ├── navigation/        # React Navigation setup
│   │   ├── RootNavigator.tsx
│   │   ├── AuthNavigator.tsx
│   │   ├── AppNavigator.tsx
│   │   └── HomeNavigator.tsx
│   ├── screens/           # Screen components
│   │   ├── Auth/
│   │   ├── Home/
│   │   ├── MyJobs/
│   │   ├── Chat/
│   │   ├── Profile/
│   │   ├── Payments/
│   │   ├── Notifications/
│   │   ├── Wallet/
│   │   ├── PromoCodes/
│   │   ├── Share/
│   │   ├── ContactSupport/
│   │   ├── Terms/
│   │   └── VoiceCall/
│   ├── components/        # Reusable UI components
│   │   └── common/
│   │       ├── VTButton.tsx
│   │       ├── VTTextField.tsx
│   │       ├── VTLoading.tsx
│   │       ├── VTCard.tsx
│   │       └── CustomDrawerContent.tsx
│   ├── constants/         # App constants, enums, keys
│   ├── theme/             # Colors, fonts, spacing
│   ├── utils/             # Helpers and storage
│   └── hooks/             # Custom React hooks
│       ├── useSocket.ts
│       └── useApi.ts
├── app.json               # Expo configuration
├── eas.json               # EAS Build configuration
├── App.tsx                # Entry point
└── package.json
```

---

## Architecture Mapping

| iOS (Swift) | React Native (Expo) |
|-------------|---------------------|
| Alamofire + ObjectMapper | Axios + TypeScript interfaces |
| Singletons (User, CreateJob) | Zustand stores |
| SlideMenuControllerSwift | @react-navigation/drawer |
| UIKit XIBs | React Native components |
| Socket.IO-Client-Swift | socket.io-client |
| Stripe iOS SDK | @stripe/stripe-react-native |
| GoogleMaps SDK | react-native-maps (Expo-compatible) |
| Core Data | AsyncStorage |
| UserDefaults | AsyncStorage |
| Completion handlers | async/await |
| react-native-image-picker | expo-image-picker |
| @react-native-community/geolocation | expo-location |
| react-native-vector-icons | @expo/vector-icons |

---

## Completed Features

### Authentication Flow
- [x] Login/SignUp landing screen
- [x] Phone number sign in
- [x] Verification code (4-digit)
- [x] Profile creation with `expo-image-picker`
- [x] Guest login
- [x] Social login placeholders (Facebook, Google, Apple)

### Navigation
- [x] Root navigator (Auth/App switch)
- [x] Auth stack navigator
- [x] Drawer navigator (side menu)
- [x] Home stack navigator

### Core Infrastructure
- [x] API client with cookie-based auth
- [x] All API endpoints mapped
- [x] TypeScript models matching iOS
- [x] Zustand stores for auth, job creation, user data
- [x] Socket.IO hook for real-time communication
- [x] Storage utility (AsyncStorage wrapper)
- [x] Theme system (colors, fonts, spacing)

### UI Components
- [x] VTButton (themed button)
- [x] VTTextField (themed text input)
- [x] VTLoading (loading overlay)
- [x] VTCard (card container)
- [x] CustomDrawerContent (side menu)

### All 30+ Screen Placeholders Created
Every screen from the iOS app exists as a component ready to be fleshed out.

---

## Running the Project

### Prerequisites
1. Install Expo CLI: `npm install -g expo-cli`
2. Install EAS CLI: `npm install -g eas-cli`
3. Have Xcode (macOS) or Android Studio set up

### Development Build (Required!)

This app uses Stripe, Maps, and other native modules that don't work in Expo Go.

#### iOS Development Build
```bash
cd HairlinesExpo
eas build --profile development --platform ios
# Or run locally:
npx expo run:ios
```

#### Android Development Build
```bash
cd HairlinesExpo
eas build --profile development --platform android
# Or run locally:
npx expo run:android
```

### Running in Expo Go (Limited)
Some screens may work in Expo Go, but features like Stripe, Maps, and social login will not.
```bash
cd HairlinesExpo
npx expo start
```

---

## Native Configuration

### app.json Plugins Configured
- `expo-location` — GPS permissions
- `expo-image-picker` — Camera/photo library permissions
- `expo-apple-authentication` — Sign in with Apple
- `@stripe/stripe-react-native` — Payments with Apple Pay

### Required Setup
1. **Google Maps API Key**:
   - Add to `app.json` under `ios.config.googleMapsApiKey` and `android.config.googleMaps.apiKey`

2. **Facebook Login**:
   - Create app at [Facebook Developers](https://developers.facebook.com/)
   - Add app ID to `app.json`

3. **Apple Sign In**:
   - Configure in Apple Developer Portal
   - Enabled via `expo-apple-authentication` plugin

4. **Stripe**:
   - Add publishable key to constants
   - Configure merchant identifier in `app.json`

---

## API Notes

- **Base URL**: `https://api.hairlines.app/api/v1/en/`
- **Socket URL**: `https://api.hairlines.app`
- **Auth**: Session cookie-based (not JWT)
- **Timeout**: 40 seconds
- **Pagination**: offset/limit with `kOffSet = 10`

---

## Critical Security Note

The iOS codebase had hard-coded API keys in `Constants.swift`. In this Expo project, these should be moved to:
- Environment variables using `expo-constants` + `.env`
- EAS secrets for CI/CD builds
- Never commit production secrets to version control

**Example .env file:**
```
GOOGLE_API_KEY=your_key_here
STRIPE_PUBLISHABLE_KEY=your_key_here
AWS_ACCESS_KEY=your_key_here
AWS_SECRET_KEY=your_key_here
```

---

## Testing

Currently no tests are set up. Recommended:
- Unit tests with Jest for utilities and API clients
- Integration tests with React Native Testing Library
- E2E tests with Maestro (Expo-compatible)

---

## Known Issues / Considerations

1. **Cookie-based auth in React Native**: ✅ Addressed. `src/api/client.ts` now uses a small cookie jar (`src/utils/cookies.ts`) that parses `Set-Cookie` headers, persists them in AsyncStorage, and sends them back on every request. Logout clears the stored cookies.

2. **Socket.IO cookies**: Same issue as above — socket may need explicit auth headers.

3. **Twilio Voice**: Not yet implemented. This may require ejecting from Expo or using a custom dev client plugin.

4. **Push Notifications**: Use `expo-notifications` instead of native APNs code.

5. **Image Uploads**: AWS S3 uploads use `expo-file-system` + pre-signed URLs (recommended over direct AWS SDK).

---

## EAS Build Profiles

| Profile | Purpose | Distribution |
|---------|---------|--------------|
| `development` | Local development with dev client | Internal |
| `preview` | QA/Testing builds | Internal |
| `production` | App Store / Play Store | Store |

---

## Next Steps

### High Priority
1. **Home Screen (Categories)** — Implement with actual API integration
2. **Services & SubServices** — Carousel and list views
3. **Job Creation Flow** — Multi-step form with `expo-location` + calendar
4. **My Jobs** — Tabbed listing (Scheduled/History)
5. **Chat** — Socket.IO real-time chat UI
6. **Stripe Integration** — Add card, payment methods

### Native Modules to Configure
- [ ] Google Maps API key in app.json
- [ ] Facebook App ID for login
- [ ] Apple Sign In certificates
- [ ] Stripe merchant identifier
- [ ] Push notification certificates (via EAS)
