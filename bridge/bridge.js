const { createClient } = require("@supabase/supabase-js");
const { exec } = require("child_process");

const SUPABASE_URL =
  process.env.SUPABASE_URL ||
  "https://knbijsnghjcaocwtjvvw.supabase.co";
const SUPABASE_KEY =
  process.env.SUPABASE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuYmlqc25naGpjYW9jd3RqdnZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMjM3MzgsImV4cCI6MjA5MDY5OTczOH0.k7wem_YuGJ9wHavFBbg00W-d1S9Q0eXmCWdtPWMIFZs";

const CLAUDE_PATH = "/Users/raghunandanmali/.local/bin/claude";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

let isProcessing = false;
const messageQueue = [];

async function setOnline(online) {
  await supabase
    .from("bridge_status")
    .update({ is_online: online, last_heartbeat: new Date().toISOString() })
    .eq("id", 1);
  console.log(`Bridge status: ${online ? "ONLINE" : "OFFLINE"}`);
}

async function sendHeartbeat() {
  await supabase
    .from("bridge_status")
    .update({ last_heartbeat: new Date().toISOString(), is_online: true })
    .eq("id", 1);
}

function callClaude(message, model) {
  return new Promise((resolve, reject) => {
    // Escape single quotes in the message for shell safety
    const escaped = message.replace(/'/g, "'\\''");
    const modelFlag = model ? `--model ${model}` : "";
    const cmd = `${CLAUDE_PATH} -p ${modelFlag} '${escaped}'`;

    exec(cmd, { maxBuffer: 10 * 1024 * 1024, timeout: 120000 }, (err, stdout, stderr) => {
      if (err) {
        reject(new Error(stderr || err.message));
      } else {
        resolve(stdout.trim());
      }
    });
  });
}

async function processMessage(message) {
  console.log(
    `Processing [${message.model}]: "${message.content.substring(0, 50)}..."`
  );

  try {
    const response = await callClaude(message.content, message.model);

    await supabase.from("messages").insert({
      session_id: message.session_id,
      role: "assistant",
      content: response,
      status: "complete",
      model: message.model,
    });

    await supabase
      .from("messages")
      .update({ status: "complete" })
      .eq("id", message.id);

    console.log(`Response sent (${response.length} chars)`);
  } catch (err) {
    console.error("Claude error:", err.message);

    await supabase.from("messages").insert({
      session_id: message.session_id,
      role: "assistant",
      content: "Sorry, I encountered an error. Please try again.",
      status: "error",
    });
  }
}

async function processQueue() {
  if (isProcessing || messageQueue.length === 0) return;

  isProcessing = true;
  const msg = messageQueue.shift();
  await processMessage(msg);
  isProcessing = false;

  processQueue();
}

async function start() {
  console.log("Starting bridge...");
  console.log(`Using Claude CLI at: ${CLAUDE_PATH}`);

  await setOnline(true);

  const heartbeatInterval = setInterval(sendHeartbeat, 30000);

  // Pick up any pending messages from before bridge started
  const { data: pending } = await supabase
    .from("messages")
    .select("*")
    .eq("role", "user")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (pending && pending.length > 0) {
    console.log(`Found ${pending.length} pending messages`);
    messageQueue.push(...pending);
    processQueue();
  }

  // Listen for new user messages
  const channel = supabase
    .channel("new-messages")
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: "role=eq.user",
      },
      (payload) => {
        const msg = payload.new;
        if (msg.status === "pending") {
          console.log(`New message from session ${msg.session_id}`);
          messageQueue.push(msg);
          processQueue();
        }
      }
    )
    .subscribe();

  console.log("Bridge is running. Waiting for messages...");
  console.log("Press Ctrl+C to stop.\n");

  const shutdown = async () => {
    console.log("\nShutting down...");
    clearInterval(heartbeatInterval);
    supabase.removeChannel(channel);
    await setOnline(false);
    console.log("Bridge offline. Goodbye!");
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

start().catch((err) => {
  console.error("Failed to start bridge:", err);
  process.exit(1);
});
