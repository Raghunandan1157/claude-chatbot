type Props = {
  role: "user" | "assistant";
  content: string;
  status: string;
};

export default function MessageBubble({ role, content, status }: Props) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-[var(--user-bubble)] text-white rounded-br-md"
            : "bg-[var(--assistant-bubble)] text-[var(--text-primary)] rounded-bl-md border border-[var(--border)]"
        }`}
      >
        {status === "pending" && !isUser ? (
          <span className="inline-flex gap-1">
            <span className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full animate-bounce" />
            <span className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full animate-bounce [animation-delay:0.15s]" />
            <span className="w-1.5 h-1.5 bg-[var(--text-secondary)] rounded-full animate-bounce [animation-delay:0.3s]" />
          </span>
        ) : (
          content
        )}
        {status === "error" && (
          <span className="block text-xs text-red-400 mt-1">
            Failed to get response
          </span>
        )}
      </div>
    </div>
  );
}
