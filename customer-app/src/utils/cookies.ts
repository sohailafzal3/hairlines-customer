import { Storage } from './storage';
import { kBaseUrl } from '../constants';

export type CookieStore = string[];

export async function loadCookies(): Promise<CookieStore> {
  const cookies = await Storage.getObject<CookieStore>('savedCookies');
  return cookies ?? [];
}

export async function saveCookiesFromResponse(
  setCookieHeader?: string | string[]
): Promise<void> {
  if (!setCookieHeader) return;
  const incoming = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [setCookieHeader];
  const existing = await loadCookies();
  const map = new Map<string, string>();

  existing.forEach((cookie) => {
    const cleanCookie = cookie.split(';')[0].trim();
    const name = cleanCookie.split('=')[0].trim();
    if (name && cleanCookie.includes('=')) {
      map.set(name, cleanCookie);
    }
  });

  incoming.forEach((cookie) => {
    const cleanCookie = cookie.split(';')[0].trim();
    const name = cleanCookie.split('=')[0].trim();
    if (name && cleanCookie.includes('=')) {
      map.set(name, cleanCookie);
    }
  });

  await Storage.setObject('savedCookies', Array.from(map.values()));
}

export async function removeCookies(): Promise<void> {
  await Storage.removeItem('savedCookies');
}

export function cookieHeader(cookies: CookieStore): string {
  return cookies.join('; ');
}

export function baseDomain(): string {
  return kBaseUrl;
}
