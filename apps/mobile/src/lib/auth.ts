import * as SecureStore from "expo-secure-store";
import { postJson } from "./api";

const TOKEN_KEY = "tua_token";

export async function getToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch {}
}

export async function clearToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {}
}

export async function login(email: string, password: string): Promise<{ token: string } | null> {
  const res = await postJson("/api/auth/login", { email, password });
  const token = (res?.token as string) || "";
  if (token) {
    await setToken(token);
    return { token };
  }
  return null;
}