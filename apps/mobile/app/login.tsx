import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useRouter } from "expo-router";
import { login } from "../src/lib/auth";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import Constants from "expo-constants";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const extra = (Constants.expoConfig?.extra as any) || {};
  const googleCfg = extra?.google || {};
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    expoClientId: googleCfg?.expoClientId || process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID || "",
    androidClientId: googleCfg?.androidClientId || process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "",
    iosClientId: googleCfg?.iosClientId || process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "",
    scopes: ["openid", "profile", "email"]
  });

  useEffect(() => {
    (async () => {
      if (googleResponse?.type === "success") {
        const auth = googleResponse.authentication;
        let emailFromGoogle = "";
        if (auth?.accessToken) {
          try {
            const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
              headers: { Authorization: `Bearer ${auth.accessToken}` }
            });
            const json = await res.json();
            emailFromGoogle = String(json?.email || "");
          } catch {
            // ignore
          }
        }
        if (emailFromGoogle) {
          setLoading(true);
          try {
            const res = await login(emailFromGoogle, "google");
            if (res?.token) {
              Alert.alert("Đăng nhập thành công", "Bạn đã đăng nhập bằng Google.");
              router.replace("/");
            } else {
              Alert.alert("Thất bại", "Không nhận được token từ server.");
            }
          } catch {
            Alert.alert("Lỗi", "Không thể đăng nhập bằng Google.");
          } finally {
            setLoading(false);
          }
        } else {
          Alert.alert("Lỗi", "Không lấy được email từ Google.");
        }
      }
    })();
  }, [googleResponse]);

  async function onSubmit() {
    const e = email.trim();
    const p = password.trim();
    if (!e || !p) {
      Alert.alert("Thiếu thông tin", "Vui lòng nhập email và mật khẩu.");
      return;
    }
    setLoading(true);
    try {
      const res = await login(e, p);
      if (res?.token) {
        Alert.alert("Đăng nhập thành công", "Bạn đã đăng nhập.");
        router.replace("/");
      } else {
        Alert.alert("Thất bại", "Không nhận được token từ server.");
      }
    } catch {
      Alert.alert("Lỗi", "Không thể đăng nhập.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Đăng nhập</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#9ca3af"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Mật khẩu"
        placeholderTextColor="#9ca3af"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={onSubmit} disabled={loading}>
        <Text style={styles.btnText}>{loading ? "..." : "Đăng nhập"}</Text>
      </TouchableOpacity>

      <View style={{ height: 12 }} />

      <TouchableOpacity
        style={[styles.btnGoogle, (!googleRequest || loading) && { opacity: 0.6 }]}
        onPress={() => googlePromptAsync()}
        disabled={!googleRequest || loading}
      >
        <Text style={styles.btnTextGoogle}>Đăng nhập với Google</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1220", padding: 16 },
  title: { color: "#e5e7eb", fontSize: 20, fontWeight: "700", marginBottom: 12 },
  input: {
    backgroundColor: "#0f172a",
    color: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 10
  },
  btn: { backgroundColor: "#10b981", paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10 },
  btnText: { color: "#052e25", fontWeight: "700", textAlign: "center" },
  btnGoogle: { backgroundColor: "#1a73e8", paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10 },
  btnTextGoogle: { color: "#ffffff", fontWeight: "700", textAlign: "center" }
});