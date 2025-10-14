import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { generatePlan, loadCurriculum, SemesterPlan } from "../src/services/learningPath";

export default function PlanScreen() {
  const [maxCredits, setMaxCredits] = useState(18);
  const curriculum = useMemo(() => loadCurriculum(), []);
  const plan = useMemo(() => generatePlan(curriculum, { maxCreditsPerTerm: maxCredits }), [curriculum, maxCredits]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lộ trình học (Demo)</Text>
      <Text style={styles.subtitle}>Giới hạn tín chỉ/kỳ: {maxCredits}</Text>
      <View style={styles.row}>
        <TouchableOpacity style={styles.btn} onPress={() => setMaxCredits(m => Math.max(12, m - 1))}><Text style={styles.btnText}>-</Text></TouchableOpacity>
        <TouchableOpacity style={styles.btn} onPress={() => setMaxCredits(m => Math.min(24, m + 1))}><Text style={styles.btnText}>+</Text></TouchableOpacity>
      </View>

      <FlatList
        data={plan}
        keyExtractor={(s) => s.term}
        contentContainerStyle={{ gap: 12, paddingVertical: 12 }}
        renderItem={({ item }) => <SemesterCard data={item} />}
      />
    </View>
  );
}

function SemesterCard({ data }: { data: SemesterPlan }) {
  const totalCredits = data.courses.reduce((sum, c) => sum + c.credits, 0);
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{data.term} — {totalCredits} tín chỉ</Text>
      {data.courses.map(c => (
        <View key={c.code} style={styles.courseRow}>
          <Text style={styles.courseCode}>{c.code}</Text>
          <Text style={styles.courseTitle}>{c.title} ({c.credits})</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1220", padding: 12 },
  title: { color: "#e5e7eb", fontSize: 18, fontWeight: "700" },
  subtitle: { color: "#9ca3af", marginTop: 4, marginBottom: 8 },
  row: { flexDirection: "row", gap: 8, marginBottom: 8 },
  btn: { backgroundColor: "#374151", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  btnText: { color: "#e5e7eb", fontWeight: "700", fontSize: 18 },
  card: { backgroundColor: "#111827", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#1f2937" },
  cardTitle: { color: "#e5e7eb", fontWeight: "700", marginBottom: 8 },
  courseRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  courseCode: { color: "#34d399", fontWeight: "700", width: 80 },
  courseTitle: { color: "#e5e7eb", flexShrink: 1 }
});