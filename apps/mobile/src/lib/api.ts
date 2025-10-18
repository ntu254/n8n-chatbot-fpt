import { Platform } from "react-native";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";

function getDefaultBaseUrl() {
  if (__DEV__) {
    // Android emulator uses 10.0.2.2 to reach host machine
    if (Platform.OS === "android") return "http://10.0.2.2:8080";
    return "http://localhost:8080";
  }
  // In production, set EXPO_PUBLIC_API_BASE_URL env or this fallback
  return "https://your-production-domain.example";
}

const apiBase =
  (Constants.expoConfig?.extra as any)?.apiBaseUrl?.trim() ||
  process.env.EXPO_PUBLIC_API_BASE_URL?.trim() ||
  getDefaultBaseUrl();

export async function postJson(path: string, body: any) {
  const url = path.startsWith("http") ? path : `${apiBase}${path}`;
  const token = await SecureStore.getItemAsync("tua_token");
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body ?? {})
  });
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res.text();
}