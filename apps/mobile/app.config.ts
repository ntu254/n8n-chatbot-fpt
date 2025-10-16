import { ExpoConfig } from "expo/config";

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL || "";
const googleExpoClientId = process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID || "";
const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "";
const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "";

const config: ExpoConfig = {
  name: "AI Adaptive Learning",
  slug: "ai-adaptive-learning",
  scheme: "aiadaptive",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  updates: {
    fallbackToCacheTimeout: 0
  },
  assetBundlePatterns: ["**/*"],
  ios: {
    supportsTablet: true
  },
  android: {
    permissions: []
  },
  web: {
    bundler: "metro"
  },
  plugins: ["expo-router"],
  experiments: {
    typedRoutes: true
  },
  extra: {
    apiBaseUrl,
    google: {
      expoClientId: googleExpoClientId,
      androidClientId: googleAndroidClientId,
      iosClientId: googleIosClientId
    }
  }
};

export default config;