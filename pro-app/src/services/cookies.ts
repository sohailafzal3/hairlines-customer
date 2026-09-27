import { storage } from "../utils/storage";
import { BASE_URL, StorageKeys } from "../constants";

export type CookieStore = string[];

export async function loadCookies(): Promise<CookieStore> {
  const cookies = await storage.get<CookieStore>(StorageKeys.savedCookies);
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
    const name = cookie.split("=")[0];
    if (name) map.set(name, cookie);
  });

  incoming.forEach((cookie) => {
    const name = cookie.split("=")[0];
    if (name) map.set(name, cookie);
  });

  await storage.set(StorageKeys.savedCookies, Array.from(map.values()));
}

export async function removeCookies(): Promise<void> {
  await storage.remove(StorageKeys.savedCookies);
}

export function cookieHeader(cookies: CookieStore): string {
  return cookies.join("; ");
}

export function baseDomain(): string {
  return BASE_URL;
}
