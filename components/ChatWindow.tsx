"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import MessageBubble from "./MessageBubble";
import VoiceInput from "./VoiceInput";

type Message = {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  status: string;
  created_at: string;
};

const MODELS = [
  { id: "claude-haiku-4-5-20251001", label: "Haiku 4.5" },
  { id: "claude-sonnet-4-6", label: "Sonnet 4.6" },
  { id: "claude-opus-4-6", label: "Opus 4.6" },
];

function generateSessionId() {
  return crypto.randomUUID();
}

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [model, setModel] = useState(MODELS[0].id);
  const [sessionId] = useState(() => generateSessionId());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const loadMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: true });

      if (data) setMessages(data);
    };

    loadMessages();

    const channel = supabase
      .channel(`messages-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          if (newMsg.role === "assistant") setSending(false);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const updated = payload.new as Message;
          setMessages((prev) =>
            prev.map((m) => (m.id === updated.id ? updated : m))
          );
          if (updated.role === "assistant" && updated.status === "complete") {
            setSending(false);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      setSending(true);
      setInput("");

      const tempId = crypto.randomUUID();
      const optimistic: Message = {
        id: tempId,
        session_id: sessionId,
        role: "user",
        content: trimmed,
        status: "complete",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);

      const { data } = await supabase
        .from("messages")
        .insert({
          session_id: sessionId,
          role: "user",
          content: trimmed,
          status: "pending",
          model: model,
        })
        .select()
        .single();

      if (data) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? data : m))
        );
      }

      inputRef.current?.focus();
    },
    [sending, sessionId, model]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleVoiceTranscript = (text: string) => {
    sendMessage(text);
  };

  return (
    <div className="flex flex-col h-full max-w-2xl mx-auto w-full">
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl mb-4">👋</div>
              <h2 className="text-lg font-medium text-[var(--text-primary)] mb-1">
                Hey there!
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                I&apos;m your personal assistant. Ask me anything.
              </p>
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <MessageBubble
            key={msg.id}
            role={msg.role}
            content={msg.content}
            status={msg.status}
          />
        ))}
        {sending && (
          <MessageBubble role="assistant" content="" status="pending" />
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-[var(--border)] px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <label className="text-xs text-[var(--text-secondary)]">Model:</label>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={sending}
            className="bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-xs px-2 py-1 rounded-lg border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-40"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <VoiceInput onTranscript={handleVoiceTranscript} disabled={sending} />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder-[var(--text-secondary)] px-4 py-2.5 rounded-xl border border-[var(--border)] focus:outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-40"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="p-2.5 rounded-xl bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
