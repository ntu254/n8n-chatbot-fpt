import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { Link } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { postJson } from "../src/lib/api";
import { getOrCreateSessionId } from "../src/lib/session";

type Message = { id: string; role: "user" | "bot"; text: string };

export default function ChatScreen() {
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem("tua_chat_history");
      if (saved) setMessages(JSON.parse(saved));
    })();
  }, []);

  useEffect(() => {
    AsyncStorage.setItem("tua_chat_history", JSON.stringify(messages)).catch(() => {});
  }, [messages]);

  useEffect(() => {
    setMessages(prev => prev.length ? prev : [
      { id: "welcome", role: "bot", text: "Xin chào, mình là TuaTua. Hãy nhập câu hỏi của bạn!" }
    ]);
  }, []);

  const sendMessage = useCallback(async () => {
    const chatInput = input.trim();
    if (!chatInput || sending) return;
    setInput("");
    setSending(true);

    const userMsg: Message = { id: String(Date.now()), role: "user", text: chatInput };
    setMessages(m => [...m, userMsg]);

    try {
      const sessionId = await getOrCreateSessionId();
      const res = await postJson("/api/chat", { chatInput, sessionId });

      let respText = "";
      if (res && typeof res === "object") {
        respText = (res.output ?? res.data ?? res.message ?? res.result ?? JSON.stringify(res)) as string;
      } else if (typeof res === "string") {
        respText = res;
      } else {
        respText = "(không có nội dung phản hồi)";
      }

      const botMsg: Message = { id: String(Date.now() + 1), role: "bot", text: String(respText) };
      setMessages(m => [...m, botMsg]);
      listRef.current?.scrollToEnd({ animated: true });
    } catch (e) {
      const botMsg: Message = { id: String(Date.now() + 1), role: "bot", text: "Đã xảy ra lỗi khi gọi /api/chat." };
      setMessages(m => [...m, botMsg]);
    } finally {
      setSending(false);
    }
  }, [input, sending]);

  const renderItem = useCallback(({ item }: { item: Message }) => {
    const isUser = item.role === "user";
    return (
      <View style={[styles.bubble, isUser ? styles.user : styles.bot]}>
        <Text style={styles.bubbleText}>{item.text}</Text>
      </View>
    );
  }, []);

  const footer = useMemo(() => (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          multiline
          placeholder="Nhập tin nhắn..."
          placeholderTextColor="#9ca3af"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => sendMessage()}
          blurOnSubmit={false}
          returnKeyType="send"
        />
        <TouchableOpacity onPress={sendMessage} disabled={sending} style={[styles.sendBtn, sending && { opacity: 0.6 }]}>
          <Text style={styles.sendText}>{sending ? "..." : "Gửi"}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  ), [input, sending, sendMessage]);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>TuaTua Chat</Text>
        <Link href="/plan" style={styles.link}>Lộ trình (demo)</Link>
      </View>

      <FlatList
        ref={listRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />

      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b1220", paddingHorizontal: 12, paddingTop: 12 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    justifyContent: "space-between"
  },
  title: { color: "#e5e7eb", fontSize: 18, fontWeight: "600" },
  link: { color: "#34d399", fontWeight: "600" },
  listContent: { paddingVertical: 8, gap: 8 },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginVertical: 4
  },
  user: {
    alignSelf: "flex-end",
    backgroundColor: "#2563eb"
  },
  bot: {
    alignSelf: "flex-start",
    backgroundColor: "#374151"
  },
  bubbleText: { color: "#ffffff" },
  inputRow: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingBottom: 12 },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 160,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#0f172a",
    color: "#e5e7eb"
  },
  sendBtn: {
    backgroundColor: "#10b981",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10
  },
  sendText: { color: "#052e25", fontWeight: "700" }
});