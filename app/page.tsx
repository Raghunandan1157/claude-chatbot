import MemoryFeed from "@/components/MemoryFeed";

export default function Home() {
  return (
    <main className="h-screen flex flex-col">
      <header className="border-b border-[var(--border)] px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-white text-sm font-bold">
            M
          </div>
          <div>
            <h1 className="text-sm font-semibold text-[var(--text-primary)]">
              Memory
            </h1>
            <p className="text-[10px] text-[var(--text-muted)]">
              Capture everything. Forget nothing.
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden max-w-2xl mx-auto w-full">
        <MemoryFeed />
      </div>
    </main>
  );
}
