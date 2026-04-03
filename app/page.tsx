import MemoryFeed from "@/components/MemoryFeed";
import StatsBar from "@/components/StatsBar";

export default function Home() {
  return (
    <main className="h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-[var(--border)] px-4 py-3 bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent)] via-purple-600 to-[var(--neon-pink)] flex items-center justify-center animate-glow-pulse">
              <span className="text-white text-lg">⚡</span>
            </div>
          </div>
          <div>
            <h1
              className="text-sm font-bold tracking-wider uppercase text-[var(--text-primary)]"
              style={{ fontFamily: "'Space Mono', monospace" }}
            >
              MEMORY
            </h1>
            <p className="text-[9px] uppercase tracking-[0.2em] text-[var(--text-muted)]"
              style={{ fontFamily: "'Space Mono', monospace" }}>
              Stay locked in
            </p>
          </div>
        </div>
      </header>

      {/* XP / Stats Bar */}
      <StatsBar />

      {/* Feed */}
      <div className="flex-1 overflow-hidden max-w-2xl mx-auto w-full">
        <MemoryFeed />
      </div>
    </main>
  );
}
