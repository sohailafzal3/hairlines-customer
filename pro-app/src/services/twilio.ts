import { TWILIO_BASE_URL } from "../constants";

/**
 * Twilio Voice service placeholder.
 * Full CallKit/PushKit integration requires a custom Expo dev build with the
 * native Twilio Voice SDK. In Expo Go this service exposes the access-token
 * endpoint and falls back to the system dialer for outbound calls.
 */
export async function fetchTwilioAccessToken(identity: string): Promise<string | null> {
  try {
    const response = await fetch(
      `${TWILIO_BASE_URL}/accessToken?identity=${encodeURIComponent(identity)}`
    );
    const text = await response.text();
    return text || null;
  } catch (e) {
    console.warn("Twilio token fetch failed", e);
    return null;
  }
}

export function initializeTwilio() {
  // Native initialization happens in a custom dev build.
}

export function registerTwilio(token: string) {
  console.log("registerTwilio", token);
}

export function unregisterTwilio() {
  console.log("unregisterTwilio");
}
