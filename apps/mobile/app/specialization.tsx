import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { postJson } from "../src/lib/api";

type Ranked = { code: string; score: number; rationale: string };

export default function SpecializationScreen() {
  const [gpa, setGpa] = useState<string>("3.0");
  const [interests, setInterests] = useState<string>("ai, data, math");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Ranked[]>([]);

  async function onRecommend() {
    setLoading(true);
    try {
      const profile = {
        gpa: Number(gpa),
        interests: interests.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
      };
      const res = await postJson("/api/recommendations/specialization", { profile });
      const ranked = (res?.ranked_specializations as Ranked[]) || [];
      setResults(ranked);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Khuyến nghị chuyên ngành</Text>
      <TextInput
        style={styles.input}
        placeholder="GPA (0 - 4)"
        placeholderTextColor="#9ca3af"
        keyboardType="decimal-pad"
        value={gpa}
        onChangeText={setGpa}
      />
      <TextInput
        style={styles.input}
        placeholder="Sở thích (ví dụ: ai, data, math, iot, network)"
        placeholderTextColor="#9ca3af"
        value={interests}
        onChangeText={setInterests}
      />
      <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={onRecommend} disabled={loading}>
        <Text style={styles.btnText}>{loading ? "..." : "Gợi ý"}</Text>
      </TouchableOpacity>

      <FlatList
        data={results}
        keyExtractor={(item) => item.code}
        contentContainerStyle={{ gap: 8, paddingVertical: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.code} — Điểm: {(item.score * 100).toFixed(0)}%</Text>
            <Text style={styles.cardText}>{item.rationale}</Text>
          </View>
        )}
      />
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
  card: { backgroundColor: "#111827", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#1f2937" },
  cardTitle: { color: "#e5e7eb", fontWeight: "700" },
  cardText: { color: "#9ca3af", marginTop: 4 }
});