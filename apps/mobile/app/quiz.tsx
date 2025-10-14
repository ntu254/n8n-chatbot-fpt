import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { postJson } from "../src/lib/api";

type Question = { id: string; skill_tag: string; difficulty: number; stem: string; choices: string[]; answer: number };

export default function QuizScreen() {
  const [quizId, setQuizId] = useState<string>("");
  const [question, setQuestion] = useState<Question | null>(null);
  const [loading, setLoading] = useState(false);

  async function start() {
    setLoading(true);
    try {
      const res = await postJson("/api/quizzes/start", { course: "CS301", skillTags: ["algorithms"] });
      setQuizId(res?.quizId || "");
      setQuestion(res?.question || null);
    } catch {
      setQuizId("");
      setQuestion(null);
    } finally {
      setLoading(false);
    }
  }

  async function answer(idx: number) {
    if (!quizId || !question) return;
    setLoading(true);
    try {
      const res = await postJson("/api/quizzes/answer", { quizId, questionId: question.id, answer: idx });
      setQuestion(res?.nextQuestion || null);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quiz thích ứng (MVP)</Text>
      {!quizId ? (
        <TouchableOpacity style={[styles.btn, loading && { opacity: 0.6 }]} onPress={start} disabled={loading}>
          <Text style={styles.btnText}>{loading ? "..." : "Bắt đầu"}</Text>
        </TouchableOpacity>
      ) : question ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Độ khó: {question.difficulty} — Kỹ năng: {question.skill_tag}</Text>
          <Text style={styles.cardText}>{question.stem}</Text>
          <View style={{ gap: 8, marginTop: 12 }}>
            {question.choices.map((c, idx) => (
              <TouchableOpacity key={idx} style={styles.choice} onPress={() => answer(idx)}>
                <Text style={styles.choiceText}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <Text style={{ color: "#9ca3af", marginTop: 12 }}>Quiz kết thúc hoặc không còn câu hỏi.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1220", padding: 16 },
  title: { color: "#e5e7eb", fontSize: 20, fontWeight: "700", marginBottom: 12 },
  btn: { backgroundColor: "#10b981", paddingHorizontal: 14, paddingVertical: 12, borderRadius: 10, alignSelf: "flex-start" },
  btnText: { color: "#052e25", fontWeight: "700" },
  card: { backgroundColor: "#111827", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: "#1f2937" },
  cardTitle: { color: "#e5e7eb", fontWeight: "700" },
  cardText: { color: "#e5e7eb", marginTop: 8 },
  choice: { backgroundColor: "#374151", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  choiceText: { color: "#e5e7eb" }
});