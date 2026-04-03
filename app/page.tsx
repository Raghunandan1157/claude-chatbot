import ChatWindow from "@/components/ChatWindow";
import StatusDot from "@/components/StatusDot";

export default function Home() {
  return (
    <main className="h-screen flex flex-col">
      <header className="border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-sm font-bold">
            C
          </div>
          <div>
            <h1 className="text-sm font-semibold text-[var(--text-primary)]">
              Personal Assistant
            </h1>
            <StatusDot />
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <ChatWindow />
      </div>
    </main>
  );
}
