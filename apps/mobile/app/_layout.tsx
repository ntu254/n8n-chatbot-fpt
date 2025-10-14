import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: "#0f172a" },
          headerTintColor: "#e5e7eb",
          contentStyle: { backgroundColor: "#0b1220" }
        }}
      >
        <Stack.Screen name="index" options={{ title: "Chat AI" }} />
        <Stack.Screen name="plan" options={{ title: "Learning Plan (Demo)" }} />
      </Stack>
    </SafeAreaProvider>
  );
}