import { Storage } from './storage';

const COOKIE_STORAGE_KEY = 'hairlines_api_cookies';

interface Cookie {
  name: string;
  value: string;
  path?: string;
  expires?: string;
  maxAge?: number;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: string;
}

/**
 * Simple cookie jar for React Native.
 *
 * React Native does not have a built-in cookie jar like browsers do, so
 * `withCredentials: true` alone is not enough for session-cookie auth.
 * This helper manually parses `Set-Cookie` response headers, persists the
 * cookies in AsyncStorage, and builds the `Cookie` request header for
 * subsequent API calls.
 */
export const CookieManager = {
  async setCookieFromHeader(setCookieHeader: string | string[] | undefined): Promise<void> {
    if (!setCookieHeader) return;

    const cookies = await this.getCookies();
    const headerArray = Array.isArray(setCookieHeader) ? setCookieHeader : [setCookieHeader];

    for (const header of headerArray) {
      if (!header) continue;
      const parsed = parseSetCookie(header);
      if (parsed) {
        cookies[parsed.name] = parsed;
      }
    }

    await Storage.setObject(COOKIE_STORAGE_KEY, cookies);
  },

  async getCookieHeader(): Promise<string | undefined> {
    const cookies = await this.getCookies();
    const cookieStrings = Object.values(cookies).map((cookie) => `${cookie.name}=${cookie.value}`);
    return cookieStrings.length > 0 ? cookieStrings.join('; ') : undefined;
  },

  async getCookies(): Promise<Record<string, Cookie>> {
    return (await Storage.getObject<Record<string, Cookie>>(COOKIE_STORAGE_KEY)) || {};
  },

  async clearCookies(): Promise<void> {
    await Storage.removeItem(COOKIE_STORAGE_KEY);
  },
};

function parseSetCookie(header: string): Cookie | null {
  const parts = header.split(';').map((part) => part.trim());
  if (parts.length === 0) return null;

  const [nameValue] = parts;
  const equalIndex = nameValue.indexOf('=');
  if (equalIndex < 0) return null;

  const name = nameValue.substring(0, equalIndex).trim();
  const value = nameValue.substring(equalIndex + 1).trim();

  const cookie: Cookie = { name, value };

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    const [key, rawValue] = part.split('=').map((s) => s.trim());
    const lowerKey = key.toLowerCase();
    const value = rawValue === undefined ? '' : rawValue;

    if (lowerKey === 'path') {
      cookie.path = value;
    } else if (lowerKey === 'expires') {
      cookie.expires = value;
    } else if (lowerKey === 'max-age') {
      cookie.maxAge = parseInt(value, 10);
    } else if (lowerKey === 'domain') {
      cookie.domain = value;
    } else if (lowerKey === 'secure') {
      cookie.secure = true;
    } else if (lowerKey === 'httponly') {
      cookie.httpOnly = true;
    } else if (lowerKey === 'samesite') {
      cookie.sameSite = value;
    }
  }

  return cookie;
}
