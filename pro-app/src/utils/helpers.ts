import { Platform, Linking, Alert } from "react-native";

export const isIOS = Platform.OS === "ios";

export function showAlert(title: string, message?: string) {
  Alert.alert(title, message);
}

export function formatCurrency(amount = 0, currency = "$"): string {
  return `${currency}${Number(amount).toFixed(2)}`;
}

export function formatPhone(phone?: string): string {
  return phone?.replace(/\D/g, "") ?? "";
}

export function openDialer(phone?: string) {
  if (!phone) return;
  const url = `tel:${phone}`;
  Linking.canOpenURL(url).then((supported) => {
    if (supported) Linking.openURL(url);
  });
}

export function openUrl(url?: string) {
  if (!url) return;
  Linking.canOpenURL(url).then((supported) => {
    if (supported) Linking.openURL(url);
  });
}

export function truncate(str?: string, length = 30): string {
  if (!str) return "";
  return str.length > length ? `${str.substring(0, length)}…` : str;
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
