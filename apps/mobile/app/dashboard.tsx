import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { postJson } from "../src/lib/api";

type AlertItem = { student_id: string; type: string; severity: string; created_at: string; payload: any };

export default function DashboardScreen() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchAlerts();
        setAlerts(res);
      } catch {
        setAlerts([]);
      }
    })();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard tiến độ</Text>
      <FlatList
        data={alerts}
        keyExtractor={(_, idx) => String(idx)}
        contentContainerStyle={{ gap: 8, paddingVertical: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {item.type} — mức độ: {item.severity}
            </Text>
            <Text style={styles.cardText}>Thời gian: {new Date(item.created_at).toLocaleString()}</Text>
            <Text style={styles.cardText}>Chi tiết: {JSON.stringify(item.payload)}</Text>
          </View>
        )}
      />
    </View>
  );
}

async function fetchAlerts(): Promise<AlertItem[]> {
  const res = await postJson("/api/alerts", {}); // POST or GET? Our API accepts GET; use fetch directly fallback
  // If server expects GET, fallback to GET fetch:
  if (Array.isArray(res)) return res as AlertItem[];
  try {
    const r = await fetch((process.env.EXPO_PUBLIC_API_BASE_URL || "") + "/api/alerts");
    const data = await r.json();
    return data as AlertItem[];
  } catch {
    return [];
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1220", padding: 16 },
  title: { color: "#e5e7eb", fontSize: 20, fontWeight: "700", marginBottom: 12 },
  card: { backgroundColor: "#111827", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#1f2937" },
  cardTitle: { color: "#e5e7eb", fontWeight: "700" },
  cardText: { color: "#9ca3af", marginTop: 4 }
});