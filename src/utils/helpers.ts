import { Platform } from 'react-native';

export const isIOS = Platform.OS === 'ios';
export const isAndroid = Platform.OS === 'android';

export function parseDate(dateInput: Date | string | number | undefined | null): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }
  if (typeof dateInput === 'number') {
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof dateInput !== 'string') return null;

  const cleaned = dateInput.trim();
  if (!cleaned) return null;

  // Try standard parse
  let d = new Date(cleaned);
  if (!isNaN(d.getTime())) return d;

  // Handle "YYYY-MM-DD hh:mm AM/PM" or "YYYY-MM-DD HH:mm:ss" or "YYYY-MM-DD HH:mm"
  const match12 = cleaned.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i);
  if (match12) {
    let [_, yearStr, monthStr, dayStr, hoursStr, minutesStr, secondsStr, ampm] = match12;
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1;
    const day = parseInt(dayStr, 10);
    let hours = hoursStr ? parseInt(hoursStr, 10) : 0;
    const minutes = minutesStr ? parseInt(minutesStr, 10) : 0;
    const seconds = secondsStr ? parseInt(secondsStr, 10) : 0;

    if (ampm) {
      const isPM = ampm.toUpperCase() === 'PM';
      if (isPM && hours < 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
    }
    d = new Date(year, month, day, hours, minutes, seconds);
    if (!isNaN(d.getTime())) return d;
  }

  // Try replacing '-' with '/' or replacing space with 'T'
  d = new Date(cleaned.replace(/-/g, '/'));
  if (!isNaN(d.getTime())) return d;

  d = new Date(cleaned.replace(' ', 'T'));
  if (!isNaN(d.getTime())) return d;

  return null;
}

export function formatDate(date: Date | string | number | undefined | null, format: string = 'MM/dd/yyyy'): string {
  const d = parseDate(date);
  if (!d) return '';
  const pad = (n: number) => n.toString().padStart(2, '0');
  const map: Record<string, string> = {
    MM: pad(d.getMonth() + 1),
    dd: pad(d.getDate()),
    yyyy: d.getFullYear().toString(),
    HH: pad(d.getHours()),
    mm: pad(d.getMinutes()),
    ss: pad(d.getSeconds()),
  };
  return format.replace(/MM|dd|yyyy|HH|mm|ss/g, match => map[match]);
}

export function formatJobDate(dateInput: Date | string | number | undefined | null, fallback: string = 'Select Date & Time'): string {
  const d = parseDate(dateInput);
  if (!d) {
    if (
      typeof dateInput === 'string' &&
      dateInput.trim() &&
      !/invalid/i.test(dateInput) &&
      !/nan/i.test(dateInput) &&
      !/null/i.test(dateInput) &&
      !/undefined/i.test(dateInput)
    ) {
      return dateInput.trim();
    }
    return fallback;
  }
  return d.toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

export function getInitials(firstName?: string, lastName?: string): string {
  const f = firstName?.charAt(0) || '';
  const l = lastName?.charAt(0) || '';
  return `${f}${l}`.toUpperCase();
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  unit: 'M' | 'K' | 'N' = 'K'
): number {
  const radlat1 = (Math.PI * lat1) / 180;
  const radlat2 = (Math.PI * lat2) / 180;
  const theta = lon1 - lon2;
  const radtheta = (Math.PI * theta) / 180;
  let dist =
    Math.sin(radlat1) * Math.sin(radlat2) +
    Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
  dist = Math.acos(dist);
  dist = (dist * 180) / Math.PI;
  dist = dist * 60 * 1.1515;
  if (unit === 'K') dist = dist * 1.609344;
  if (unit === 'N') dist = dist * 0.8684;
  return parseFloat(dist.toFixed(2));
}

export function validateEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.toLowerCase());
}

export function validatePassword(password: string): boolean {
  return password.length >= 6;
}
