import { storage } from "../utils/storage";
import { BASE_URL, StorageKeys } from "../constants";

export interface ParsedCookie {
  name: string;
  value: string;
}

export type CookieStore = ParsedCookie[];

function parseCookie(header: string): ParsedCookie | null {
  const parts = header.split(";").map((part) => part.trim());
  if (parts.length === 0) return null;

  const [nameValue] = parts;
  const equalIndex = nameValue.indexOf("=");
  if (equalIndex < 0) return null;

  const name = nameValue.substring(0, equalIndex).trim();
  const value = nameValue.substring(equalIndex + 1).trim();
  if (!name) return null;

  return { name, value };
}

function normalizeCookie(item: any): ParsedCookie | null {
  if (!item) return null;
  if (typeof item === "string") {
    return parseCookie(item);
  }
  if (typeof item === "object" && item.name && item.value) {
    return { name: String(item.name).trim(), value: String(item.value).trim() };
  }
  return null;
}

export async function loadCookies(): Promise<CookieStore> {
  const raw = await storage.get<any[]>(StorageKeys.savedCookies);
  if (!Array.isArray(raw)) return [];
  const valid: ParsedCookie[] = [];
  raw.forEach((item) => {
    const parsed = normalizeCookie(item);
    if (parsed) valid.push(parsed);
  });
  return valid;
}

export async function saveCookiesFromResponse(
  setCookieHeader?: string | string[]
): Promise<void> {
  if (!setCookieHeader) return;
  const incoming = Array.isArray(setCookieHeader)
    ? setCookieHeader
    : [setCookieHeader];
  const existing = await loadCookies();
  const map = new Map<string, ParsedCookie>();

  existing.forEach((cookie) => {
    if (cookie?.name) map.set(cookie.name, cookie);
  });

  incoming.forEach((header) => {
    if (!header) return;
    const parsed = parseCookie(header);
    if (parsed) {
      map.set(parsed.name, parsed);
    }
  });

  await storage.set(StorageKeys.savedCookies, Array.from(map.values()));
}

export async function setCookieDirect(name: string, value: string): Promise<void> {
  if (!name || !value) return;
  const existing = await loadCookies();
  const map = new Map<string, ParsedCookie>();
  existing.forEach((c) => {
    if (c?.name) map.set(c.name, c);
  });
  map.set(name, { name, value });
  await storage.set(StorageKeys.savedCookies, Array.from(map.values()));
}

export async function removeCookies(): Promise<void> {
  await storage.remove(StorageKeys.savedCookies);
}

export function cookieHeader(cookies: CookieStore): string {
  if (!Array.isArray(cookies) || cookies.length === 0) return "";
  return cookies
    .filter((c) => c && c.name && c.value)
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
}

export function baseDomain(): string {
  return BASE_URL;
}
