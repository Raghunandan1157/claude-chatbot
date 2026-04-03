const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  "https://knbijsnghjcaocwtjvvw.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuYmlqc25naGpjYW9jd3RqdnZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMjM3MzgsImV4cCI6MjA5MDY5OTczOH0.k7wem_YuGJ9wHavFBbg00W-d1S9Q0eXmCWdtPWMIFZs";

// Obsidian vault path (the folder has a trailing space in the name)
const OBSIDIAN_PATH =
  process.env.OBSIDIAN_PATH ||
  "/Users/raghunandanmali/Desktop/OBSIDIAN/AI_CHATBOT ";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function categoryEmoji(cat) {
  const map = {
    task: "✅",
    thought: "💭",
    idea: "💡",
    meeting: "📅",
    reminder: "🔔",
  };
  return map[cat] || "📝";
}

function statusTag(status) {
  if (!status) return "";
  const map = { todo: "🔲 To Do", in_progress: "🔄 In Progress", done: "✅ Done" };
  return ` [${map[status] || status}]`;
}

async function syncToObsidian() {
  console.log("Syncing unsynced entries to Obsidian...");

  const { data: entries, error } = await supabase
    .from("entries")
    .select("*")
    .eq("synced_to_obsidian", false)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Error fetching entries:", error.message);
    return;
  }

  if (!entries || entries.length === 0) {
    console.log("No new entries to sync.");
    return;
  }

  console.log(`Found ${entries.length} entries to sync.`);

  // Group entries by date
  const byDate = {};
  for (const entry of entries) {
    const dateKey = new Date(entry.created_at).toISOString().split("T")[0];
    if (!byDate[dateKey]) byDate[dateKey] = [];
    byDate[dateKey].push(entry);
  }

  // Write/append to daily files
  for (const [dateKey, dayEntries] of Object.entries(byDate)) {
    const filePath = path.join(OBSIDIAN_PATH, `${dateKey}.md`);
    const dateLabel = formatDate(dayEntries[0].created_at);

    let content = "";

    // If file doesn't exist, add header
    if (!fs.existsSync(filePath)) {
      content += `# Memory — ${dateLabel}\n\n`;
    }

    for (const entry of dayEntries) {
      const time = formatTime(entry.created_at);
      const emoji = categoryEmoji(entry.category);
      const status = statusTag(entry.status);

      content += `## ${emoji} ${entry.category.charAt(0).toUpperCase() + entry.category.slice(1)}${status}\n`;
      content += `*${time}*\n\n`;
      content += `${entry.content}\n\n---\n\n`;
    }

    fs.appendFileSync(filePath, content, "utf-8");
    console.log(`  Written ${dayEntries.length} entries to ${dateKey}.md`);
  }

  // Mark as synced
  const ids = entries.map((e) => e.id);
  await supabase
    .from("entries")
    .update({ synced_to_obsidian: true })
    .in("id", ids);

  console.log(`Synced ${entries.length} entries to Obsidian.`);
}

async function printSummary() {
  console.log("\n--- MEMORY SUMMARY ---\n");

  // Tasks
  const { data: tasks } = await supabase
    .from("entries")
    .select("*")
    .eq("category", "task")
    .in("status", ["todo", "in_progress"])
    .order("created_at", { ascending: false });

  if (tasks && tasks.length > 0) {
    console.log(`📋 OPEN TASKS (${tasks.length}):`);
    for (const t of tasks) {
      const icon = t.status === "in_progress" ? "🔄" : "🔲";
      console.log(`  ${icon} ${t.content}`);
    }
    console.log();
  }

  // Today's entries
  const today = new Date().toISOString().split("T")[0];
  const { data: todayEntries } = await supabase
    .from("entries")
    .select("*")
    .gte("created_at", today)
    .order("created_at", { ascending: true });

  if (todayEntries && todayEntries.length > 0) {
    console.log(`📅 TODAY'S ENTRIES (${todayEntries.length}):`);
    for (const e of todayEntries) {
      const time = formatTime(e.created_at);
      const emoji = categoryEmoji(e.category);
      console.log(`  ${emoji} [${time}] ${e.content.substring(0, 80)}${e.content.length > 80 ? "..." : ""}`);
    }
    console.log();
  }

  // Reminders
  const { data: reminders } = await supabase
    .from("entries")
    .select("*")
    .eq("category", "reminder")
    .order("created_at", { ascending: false })
    .limit(5);

  if (reminders && reminders.length > 0) {
    console.log(`🔔 RECENT REMINDERS:`);
    for (const r of reminders) {
      const time = formatTime(r.created_at);
      console.log(`  [${time}] ${r.content}`);
    }
    console.log();
  }

  // Stats
  const { data: allEntries } = await supabase
    .from("entries")
    .select("category")

  if (allEntries) {
    const counts = {};
    for (const e of allEntries) {
      counts[e.category] = (counts[e.category] || 0) + 1;
    }
    console.log("📊 TOTAL ENTRIES:", allEntries.length);
    for (const [cat, count] of Object.entries(counts)) {
      console.log(`  ${categoryEmoji(cat)} ${cat}: ${count}`);
    }
  }

  console.log("\n--- END SUMMARY ---\n");
}

async function startWatcher() {
  // Subscribe to new entries for live sync
  const channel = supabase
    .channel("obsidian-sync")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "entries" },
      async (payload) => {
        const entry = payload.new;
        console.log(`\nNew ${entry.category}: "${entry.content.substring(0, 50)}..."`);

        // Sync immediately
        const dateKey = new Date(entry.created_at).toISOString().split("T")[0];
        const filePath = path.join(OBSIDIAN_PATH, `${dateKey}.md`);
        const dateLabel = formatDate(entry.created_at);
        const time = formatTime(entry.created_at);
        const emoji = categoryEmoji(entry.category);
        const status = statusTag(entry.status);

        let content = "";
        if (!fs.existsSync(filePath)) {
          content += `# Memory — ${dateLabel}\n\n`;
        }

        content += `## ${emoji} ${entry.category.charAt(0).toUpperCase() + entry.category.slice(1)}${status}\n`;
        content += `*${time}*\n\n`;
        content += `${entry.content}\n\n---\n\n`;

        fs.appendFileSync(filePath, content, "utf-8");

        await supabase
          .from("entries")
          .update({ synced_to_obsidian: true })
          .eq("id", entry.id);

        console.log(`  → Synced to Obsidian (${dateKey}.md)`);
      }
    )
    .subscribe();

  console.log("Watching for new entries (live sync to Obsidian)...");
  console.log("Press Ctrl+C to stop.\n");

  process.on("SIGINT", () => {
    console.log("\nStopping watcher...");
    supabase.removeChannel(channel);
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    supabase.removeChannel(channel);
    process.exit(0);
  });
}

async function main() {
  console.log("🧠 Memory Bridge\n");

  // Ensure Obsidian folder exists
  if (!fs.existsSync(OBSIDIAN_PATH)) {
    fs.mkdirSync(OBSIDIAN_PATH, { recursive: true });
    console.log(`Created Obsidian folder: ${OBSIDIAN_PATH}`);
  }

  // Sync any unsynced entries
  await syncToObsidian();

  // Print summary
  await printSummary();

  // Start live watcher
  await startWatcher();
}

main().catch((err) => {
  console.error("Failed to start:", err);
  process.exit(1);
});
