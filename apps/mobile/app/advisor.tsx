import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList } from "react-native";
import { postJson } from "../src/lib/api";

type Msg = { thread_id: string; sender: string; text: string; created_at: string };

export default function AdvisorChatScreen() {
  const [threadId] = useState("default");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  async function loadThread() {
    try {
      const res = await fetch(((process.env.EXPO_PUBLIC_API_BASE_URL || "") + `/api/messages/thread?thread_id=${encodeURIComponent(threadId)}`));
      const data = await res.json();
      setMessages((data?.messages as Msg[]) || []);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      setMessages([]);
    }
  }

  useEffect(() => {
    loadThread();
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput("");
    try {
      await postJson("/api/messages/send", { thread_id: threadId, sender: "student", text });
      await loadThread();
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chat với cố vấn (MVP)</Text>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(_, idx) => String(idx)}
        contentContainerStyle={{ gap: 8, paddingVertical: 12 }}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.sender === "student" ? styles.user : styles.bot]}>
            <Text style={styles.bubbleText}>{item.text}</Text>
            <Text style={styles.meta}>{new Date(item.created_at).toLocaleString()}</Text>
          </View>
        )}
      />
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          placeholder="Nhập tin nhắn..."
          placeholderTextColor="#9ca3af"
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity style={[styles.btn, sending && { opacity: 0.6 }]} onPress={send} disabled={sending}>
          <Text style={styles.btnText}>{sending ? "..." : "Gửi"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1220", padding: 12 },
  title: { color: "#e5e7eb", fontSize: 18, fontWeight: "700" },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  input: {
    flex: 1,
    backgroundColor: "#0f172a",
    color: "#e5e7eb",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10
  },
  btn: { backgroundColor: "#10b981", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  btnText: { color: "#052e25", fontWeight: "700" },
  bubble: { maxWidth: "80%", paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  bubbleText: { color: "#ffffff" },
  meta: { color: "#9ca3af", fontSize: 11, marginTop: 4 },
  user: { alignSelf: "flex-end", backgroundColor: "#2563eb" },
  bot: { alignSelf: "flex-start", backgroundColor: "#374151" }
});