import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";

WebBrowser.maybeCompleteAuthSession();

const FACEBOOK_APP_ID = "YOUR_FACEBOOK_APP_ID";
const FACEBOOK_REDIRECT = "https://auth.expo.io/@your-expo-username/hairlinespro";

export interface SocialAuthResult {
  provider: "apple" | "facebook" | "google";
  token?: string;
  email?: string;
  name?: string;
  user?: any;
}

export async function signInWithApple(): Promise<SocialAuthResult> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  return {
    provider: "apple",
    token: credential.identityToken || undefined,
    email: credential.email || undefined,
    name: credential.fullName
      ? `${credential.fullName.givenName || ""} ${
          credential.fullName.familyName || ""
        }`.trim()
      : undefined,
  };
}

export async function signInWithFacebook(): Promise<SocialAuthResult> {
  const authUrl =
    `https://www.facebook.com/v18.0/dialog/oauth` +
    `?client_id=${FACEBOOK_APP_ID}` +
    `&redirect_uri=${encodeURIComponent(FACEBOOK_REDIRECT)}` +
    `&response_type=token` +
    `&scope=email,public_profile`;

  const result = await WebBrowser.openAuthSessionAsync(authUrl, FACEBOOK_REDIRECT);
  if (result.type !== "success" || !result.url) {
    throw new Error("Facebook sign-in cancelled");
  }

  const params = new URL(result.url).hash
    .slice(1)
    .split("&")
    .reduce((acc, pair) => {
      const [key, value] = pair.split("=");
      acc[key] = decodeURIComponent(value);
      return acc;
    }, {} as Record<string, string>);

  const accessToken = params.access_token;
  if (!accessToken) throw new Error("Facebook token not found");

  return {
    provider: "facebook",
    token: accessToken,
  };
}

export async function signInWithGoogle(): Promise<SocialAuthResult> {
  // Google OAuth requires a Web Client ID and a proper redirect handler.
  // Wire this up with expo-auth-session in a React component hook, or use
  // @react-native-google-signin/google-signin in a custom dev build.
  throw new Error("Google sign-in needs a configured OAuth client ID");
}
