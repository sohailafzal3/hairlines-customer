# Hairlines Customer App — Agent Guide

This file contains project-specific context for AI coding agents. Read this first before making any changes.

---

## Project Overview

**Hairlines** is a React Native mobile application built with **Expo** (managed workflow + development client). It is the **customer-facing** app for booking beauty and barber services. Users can browse service categories, book appointments, track service providers on a map, chat in real time, manage payments via Stripe, and rate completed jobs.

This codebase is a migration from an existing native iOS (Swift/UIKit) app. Many file names, constant names, and data structures mirror the original iOS implementation.

- **App type**: Customer / User app (`userType = 1` in API calls)
- **Platforms**: iOS and Android
- **Orientation**: Portrait only
- **Language**: English (all code and comments are in English)

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Framework | React Native 0.81.5 + Expo ~54.0.33 |
| Language | TypeScript 5.9 (strict mode enabled) |
| Navigation | React Navigation v7 — `@react-navigation/native-stack`, `@react-navigation/drawer`, `@react-navigation/bottom-tabs` |
| State Management | Zustand 5.x with `persist` middleware |
| Local Storage | `@react-native-async-storage/async-storage` |
| HTTP Client | Axios (wrapped in a custom `ApiClient` class) |
| Real-time | `socket.io-client` over WebSocket |
| Payments | `@stripe/stripe-react-native` with Apple Pay / Google Pay |
| Maps | `react-native-maps` |
| Location | `expo-location` |
| Images | `expo-image-picker` |
| Notifications | `expo-notifications` |
| Auth | `expo-apple-authentication`, `expo-auth-session` |
| Calendar | `react-native-calendars` |
| Icons | `@expo/vector-icons` |
| UI Styling | React Native `StyleSheet` (no Tailwind or styled-components) |

---

## Project Structure

```
├── App.tsx                    # Root component: SafeAreaProvider + RootNavigator + Toast
├── index.ts                   # Entry point: registers root component with Expo
├── app.json                   # Expo configuration (plugins, permissions, bundle IDs)
├── eas.json                   # EAS Build profiles (development, preview, production)
├── package.json               # Dependencies and npm scripts
├── tsconfig.json              # Extends expo/tsconfig.base, strict: true
├── MIGRATION.md               # Legacy migration notes from iOS → React Native
├── assets/                    # App icons and splash images
└── src/
    ├── api/                   # API layer — one file per domain
    │   ├── client.ts          # Axios client with interceptors
    │   ├── auth.ts
    │   ├── jobs.ts
    │   ├── profile.ts
    │   ├── payments.ts
    │   ├── chat.ts
    │   ├── notifications.ts
    │   └── upload.ts
    ├── models/                # TypeScript interfaces (matches legacy iOS models)
    │   └── index.ts
    ├── store/                 # Zustand stores with AsyncStorage persistence
    │   ├── useAuthStore.ts
    │   ├── useJobStore.ts
    │   └── useUserStore.ts
    ├── navigation/            # React Navigation setup
    │   ├── RootNavigator.tsx      # Auth vs App switch
    │   ├── AuthNavigator.tsx      # Auth stack (login, verify, signup)
    │   ├── AppNavigator.tsx       # Drawer navigator (side menu)
    │   └── HomeNavigator.tsx      # Home stack (categories → services → booking flow)
    ├── screens/               # Screen components grouped by feature
    │   ├── Auth/
    │   ├── Home/
    │   ├── MyJobs/
    │   ├── Chat/
    │   ├── Profile/
    │   ├── Payments/
    │   ├── Notifications/
    │   ├── Wallet/
    │   ├── PromoCodes/
    │   ├── Share/
    │   ├── ContactSupport/
    │   ├── Terms/
    │   └── VoiceCall/
    ├── components/
    │   └── common/            # Reusable UI components (VT-prefixed names)
    │       ├── VTButton.tsx
    │       ├── VTTextField.tsx
    │       ├── VTLoading.tsx
    │       ├── VTCard.tsx
    │       └── CustomDrawerContent.tsx
    ├── constants/             # Enums, magic strings, AsyncStorage keys
    │   └── index.ts
    ├── theme/                 # Design tokens
    │   ├── colors.ts
    │   ├── fonts.ts
    │   └── spacing.ts
    ├── utils/                 # Helpers and storage wrapper
    │   ├── storage.ts
    │   └── helpers.ts
    ├── hooks/                 # Custom React hooks
    │   ├── useApi.ts          # Async state wrapper for API calls
    │   └── useSocket.ts       # Socket.IO connection manager
    └── assets/                # Local fonts and images (currently empty)
        ├── fonts/
        └── images/
```

### Key Conventions

- **Screens** are co-located under `src/screens/<Feature>/`. Each screen is a default-exported `React.FC`.
- **Navigators** live in `src/navigation/` and export their `ParamList` types for type-safe navigation.
- **API modules** export plain objects (`AuthApi`, `JobsApi`, etc.) that delegate to `apiClient`.
- **Zustand stores** use `persist` with `AsyncStorage`. Store names: `auth-storage`, `job-storage`, `user-storage`.
- **Barrel files** (`index.ts`) re-export public APIs for each module.
- **Component prefix**: Common components use the `VT` prefix (e.g., `VTButton`, `VTTextField`). This is a legacy naming convention from the original iOS app.

---

## Build and Run Commands

> **Important**: This app uses native modules (Stripe, Maps, Apple Authentication). It **does not work in Expo Go**. You must use an **Expo Development Build**.

```bash
# Install dependencies
npm install

# Start the Metro bundler (for development build)
npm start            # or: npx expo start

# Run on a specific platform (requires local native build)
npm run android      # npx expo start --android
npm run ios          # npx expo start --ios
npm run web          # npx expo start --web
```

### EAS Build (CI / Distribution)

```bash
# iOS Development Build
npx eas build --profile development --platform ios

# Android Development Build
npx eas build --profile development --platform android

# Preview / QA build
npx eas build --profile preview --platform ios
npx eas build --profile preview --platform android

# Production build
npx eas build --profile production --platform ios
npx eas build --profile production --platform android
```

### EAS Build Profiles (`eas.json`)

| Profile | Purpose | Distribution |
|---------|---------|--------------|
| `development` | Local dev with dev client | Internal |
| `preview` | QA / Testing | Internal |
| `production` | App Store / Play Store | Store |

---

## API and Backend

- **Base URL**: `https://api.hairlines.app/api/v1/en/`
- **Socket URL**: `https://api.hairlines.app`
- **Authentication**: Session cookie-based (`withCredentials: true` in Axios). Not JWT.
- **Timeout**: 40 seconds
- **Pagination**: `offset` / `limit` with default page size `kOffSet = 10`

### API Client (`src/api/client.ts`)

The `ApiClient` wraps Axios and enforces a standard response envelope:

```ts
interface ApiResponse<T> {
  response: number;
  success: boolean;
  message: string;
  data: T;
  error: string;
}
```

The response interceptor automatically:
- Returns `data.data` on success
- Rejects with `data.message` or `data.error` on failure

Available methods: `get`, `post`, `put`, `delete`, `uploadFile`.

### API Modules

| Module | File | Domain |
|--------|------|--------|
| Auth | `src/api/auth.ts` | Login, signup, verification, social auth, guest login |
| Jobs | `src/api/jobs.ts` | Service listings, SP search, job posting, job details, ratings |
| Profile | `src/api/profile.ts` | User profile, members, addresses, wallet, promo codes |
| Payments | `src/api/payments.ts` | Stripe customer setup, cards, defaults |
| Chat | `src/api/chat.ts` | Chat thread fetching |
| Notifications | `src/api/notifications.ts` | Notification list and actions |
| Upload | `src/api/upload.ts` | Image uploads via multipart/form-data |

---

## State Management

### Auth Store (`useAuthStore`)

Persists: `isLoggedIn`, `isGuest`, `account`, `user`, `token`.
Key actions: `setAccount`, `setUser`, `setLoggedIn`, `setGuest`, `logout`, `updateUserField`.

### Job Store (`useJobStore`)

Persists the entire multi-step job creation form (`CreateJobData`) and the selected promo code.
Key actions: `setCreateJobField`, `setCreateJob`, `setSelectedSp`, `setPromoCode`, `resetCreateJob`.

### User Store (`useUserStore`)

Persists: `members`, `addresses`, `notificationBadge`, `filters`, `walletAmount`.
Key actions: `setMembers`, `addMember`, `removeMember`, `setAddresses`, etc.

---

## Navigation Architecture

```
RootNavigator (Native Stack)
├── Auth (AuthNavigator — Native Stack)
│   ├── LoginSignUp
│   ├── SignIn
│   ├── Verification
│   ├── SignUpFirst
│   ├── ThankYou
│   ├── NewPassword
│   ├── SelectCountry
│   └── SelectLanguage
└── App (AppNavigator — Drawer)
    ├── HomeStack (HomeNavigator — Native Stack)
    │   ├── Categories
    │   ├── Services
    │   ├── SubServices
    │   ├── UserJobDetail
    │   ├── SuggestedMovers
    │   ├── WorkerProfile
    │   ├── JobSummary
    │   ├── SetLocation
    │   ├── Map
    │   ├── Calendar
    │   ├── Filters
    │   ├── Chat
    │   ├── JobDetails
    │   └── CostBreakDown
    ├── MyJobs
    ├── Notifications
    ├── MyProfile
    ├── Wallet
    ├── Payments
    ├── PromoCodes
    ├── ShareReferral
    ├── ContactSupport
    └── Terms
```

### Typing Navigation

Each navigator file exports its `ParamList` type. Use `NativeStackNavigationProp<ParamList, RouteName>` when typing screen props.

Example:
```ts
type Props = {
  navigation: NativeStackNavigationProp<HomeStackParamList, 'Categories'>;
};
```

---

## Custom Hooks

### `useApi<T>(apiFunction)`

Wraps an async API function and provides `data`, `loading`, `error`, `execute`, and `reset`.

Usage pattern in screens:
```ts
const { data, loading, error, execute } = useApi<ServiceType[]>(JobsApi.fetchServiceTypes);
useEffect(() => { execute(); }, []);
```

### `useSocket()`

Manages a Socket.IO connection that connects only when `isLoggedIn` is true. Returns `emit`, `on`, `off`, and `isConnected`.

---

## Theme System

All styling uses a centralized theme. Do not hardcode colors or font sizes in screens.

| Token File | Exports | Example |
|------------|---------|---------|
| `src/theme/colors.ts` | `Colors` object | `Colors.ButtonPrimaryColor`, `Colors.errorViewColor` |
| `src/theme/fonts.ts` | `Fonts`, `FontSizes` | `Fonts.uberMoveMedium`, `FontSizes.lg` |
| `src/theme/spacing.ts` | `Spacing`, `BorderRadius` | `Spacing.lg`, `BorderRadius.full` |

Fonts used: Ubuntu, Uber Move, Proxima Nova.

---

## Code Style Guidelines

- **TypeScript strict mode is on.** All code must be type-safe.
- Use **functional components** with `React.FC<Props>`.
- Define **styles in the same file** using `StyleSheet.create`.
- Import from theme files rather than using literal values.
- Use the **`useApi` hook** for API calls in screens instead of manual `useState` + `useEffect` loading patterns.
- Use **`Storage` utility** (`src/utils/storage.ts`) instead of calling `AsyncStorage` directly.
- Keep screen components focused on UI; delegate logic to hooks, stores, and API modules.

---

## Testing

**No test infrastructure is currently configured.**

If you add tests, the recommended stack is:
- **Unit tests**: Jest (Expo ships with it; you may need to add `jest` and `@types/jest`)
- **Component tests**: React Native Testing Library (`@testing-library/react-native`)
- **E2E tests**: Maestro (Expo-compatible)

There are no existing test files, Jest config, ESLint config, or Prettier config in the repo.

---

## Security Considerations

> ⚠️ **Critical**: Several production secrets are currently hardcoded in `src/constants/index.ts`:
> - Google Maps API key (`kGoogleApiKey`)
> - Stripe publishable key (`kStripeKey`)
> - AWS S3 access key and secret key (`AWSAccesskey`, `AWSSecretKey`)
>
> These must be moved to:
> 1. A `.env` file + `expo-constants` (for local development)
> 2. **EAS Secrets** (for CI/CD builds)
> 3. Never commit real secrets to version control.

- The app relies on **session cookies** for authentication. Axios is configured with `withCredentials: true`.
- Socket.IO connections may need explicit auth headers if cookie propagation does not work in React Native.
- Image uploads go to AWS S3 via pre-signed URLs or direct multipart upload endpoints.

---

## Native Configuration (`app.json`)

Configured Expo plugins:
- `expo-location` — GPS permissions
- `expo-image-picker` — Camera and photo library permissions
- `expo-apple-authentication` — Sign in with Apple
- `@stripe/stripe-react-native` — Payments, Apple Pay, Google Pay

iOS bundle ID: `com.apps.hairlines`
Android package: `com.apps.hairlines`

**Required manual setup before building:**
1. Replace `YOUR_GOOGLE_MAPS_API_KEY` placeholders in `app.json` (iOS + Android)
2. Configure Facebook App ID if using Facebook login
3. Configure Apple Sign In certificates in Apple Developer Portal
4. Set the correct Stripe merchant identifier (`merchant.com.hairlines`)
5. Replace `your-eas-project-id` in `app.json` extra.eas.projectId

---

## AsyncStorage Keys

All storage keys are centralized in `STORAGE_KEYS` inside `src/constants/index.ts`. Examples:
- `kIsUserLoggedIn`
- `kIsGuestUserLoggedIn`
- `kUserId`, `kUserFirstName`, `kUserLastName`
- `kDeviceToken`
- `kPromoCode`, `kPromoCodeApplied`

Prefer using the `Storage` utility (`getItem`, `setItem`, `getObject`, `setObject`) over raw `AsyncStorage`.

---

## Common Patterns

### Adding a New Screen

1. Create the screen component under the appropriate `src/screens/<Feature>/` folder.
2. Export it from the folder's `index.ts` if needed.
3. Add the route to the relevant navigator's `ParamList` and `<Stack.Screen>` list.
4. Type the screen's `navigation` prop using the navigator's `ParamList`.

### Adding a New API Endpoint

1. Add the endpoint method to the appropriate `src/api/<domain>.ts` file.
2. Import the relevant TypeScript interface from `src/models`.
3. Use `apiClient.get`, `post`, `put`, or `delete`.

### Adding a New Zustand Store

1. Create `src/store/use<Name>Store.ts`.
2. Use `create<State>()(persist(...))` with `AsyncStorage`.
3. Re-export from `src/store/index.ts`.

---

## Known Limitations and TODOs

- **Twilio Voice**: Not yet implemented. May require a custom Expo dev client plugin.
- **Push Notifications**: `expo-notifications` is installed but full integration is pending.
- **Social Login**: Facebook and Google login have UI placeholders but are not fully wired.
- **Voice Call screen**: Exists as a folder placeholder with no implementation.
- Some screen `index.ts` files currently export empty objects (`export {};`) as stubs.

---

## Useful References

- `MIGRATION.md` — Detailed mapping from iOS Swift constructs to React Native equivalents.
- `src/constants/index.ts` — All app constants, enums, and third-party keys.
- `src/models/index.ts` — Single source of truth for TypeScript data models.
