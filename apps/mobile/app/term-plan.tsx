import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from "react-native";
import { loadCurriculum, Course } from "../src/services/learningPath";

export default function TermPlanScreen() {
  const curriculum = useMemo(() => loadCurriculum(), []);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const courses = curriculum.courses;

  const selectedCourses = courses.filter((c) => selected[c.code]);
  const totalCredits = selectedCourses.reduce((sum, c) => sum + c.credits, 0);

  function toggle(code: string) {
    setSelected((prev) => ({ ...prev, [code]: !prev[code] }));
  }

  function violatesPrereq(course: Course) {
    const pre = course.prerequisites || [];
    return pre.some((p) => !selected[p]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lập kế hoạch học kỳ (MVP)</Text>
      <Text style={styles.subtitle}>Chọn môn cho kỳ — tổng tín chỉ: {totalCredits}</Text>

      <FlatList
        data={courses}
        keyExtractor={(c) => c.code}
        contentContainerStyle={{ gap: 8, paddingVertical: 12 }}
        renderItem={({ item }) => {
          const isSelected = !!selected[item.code];
          const prereqViolated = isSelected && violatesPrereq(item);
          return (
            <TouchableOpacity
              onPress={() => toggle(item.code)}
              style={[styles.row, isSelected && styles.rowSelected]}
            >
              <Text style={[styles.code, prereqViolated && styles.warn]}>{item.code}</Text>
              <Text style={styles.title2}>{item.title} ({item.credits})</Text>
              {isSelected && prereqViolated && <Text style={styles.warnText}>Thiếu tiên quyết</Text>}
            </TouchableOpacity>
          );
        }}
      />
      {totalCredits > 20 && <Text style={styles.warnText}>Cảnh báo: quá tải tín chỉ (>{20})</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1220", padding: 12 },
  title: { color: "#e5e7eb", fontSize: 18, fontWeight: "700" },
  subtitle: { color: "#9ca3af", marginTop: 4, marginBottom: 8 },
  row: { backgroundColor: "#111827", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#1f2937" },
  rowSelected: { borderColor: "#34d399" },
  code: { color: "#34d399", fontWeight: "700", marginBottom: 4 },
  title2: { color: "#e5e7eb" },
  warn: { color: "#f59e0b" },
  warnText: { color: "#f59e0b", marginTop: 8 }
});