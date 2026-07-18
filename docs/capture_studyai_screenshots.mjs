import fs from "node:fs";
import path from "node:path";

const outputDir = path.resolve("docs");
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function login() {
  const response = await fetch("http://localhost:5000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "demo@studyai.local", password: "Demo123456" })
  });
  if (!response.ok) throw new Error(`Login failed: ${response.status}`);
  return response.json();
}

async function findBrowserTarget() {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const targets = await fetch("http://127.0.0.1:9222/json/list").then((response) => response.json());
      const target = targets.find((item) => item.type === "page");
      if (target?.webSocketDebuggerUrl) return target;
    } catch {}
    await delay(250);
  }
  throw new Error("Edge remote debugging target is unavailable.");
}

function connect(url) {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    const pending = new Map();
    let sequence = 0;
    socket.addEventListener("open", () => {
      const call = (method, params = {}) => new Promise((resolveCall, rejectCall) => {
        const id = ++sequence;
        pending.set(id, { resolve: resolveCall, reject: rejectCall });
        socket.send(JSON.stringify({ id, method, params }));
      });
      resolve({ socket, call });
    });
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (!message.id || !pending.has(message.id)) return;
      const request = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) request.reject(new Error(message.error.message));
      else request.resolve(message.result || {});
    });
    socket.addEventListener("error", reject);
  });
}

async function main() {
  const auth = await login();
  const target = await findBrowserTarget();
  const { socket, call } = await connect(target.webSocketDebuggerUrl);
  await call("Page.enable");
  await call("Runtime.enable");
  await call("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 1000,
    deviceScaleFactor: 1,
    mobile: false
  });

  await call("Page.navigate", { url: "http://localhost:5173/login" });
  await delay(1200);
  await call("Runtime.evaluate", {
    expression: `localStorage.setItem("study_ai_token", ${JSON.stringify(auth.token)}); localStorage.setItem("study_ai_user", ${JSON.stringify(JSON.stringify(auth.user))});`
  });

  const pages = [
    ["studyai-dashboard.png", "http://localhost:5173/"],
    ["studyai-documents.png", "http://localhost:5173/documents"],
    ["studyai-document-detail.png", "http://localhost:5173/documents/210d05b7-15ef-417a-a399-dbb582a2f5ab"],
    ["studyai-search.png", "http://localhost:5173/search"]
  ];

  for (const [fileName, url] of pages) {
    await call("Page.navigate", { url });
    await delay(2200);
    const screenshot = await call("Page.captureScreenshot", {
      format: "png",
      fromSurface: true,
      captureBeyondViewport: false
    });
    fs.writeFileSync(path.join(outputDir, fileName), Buffer.from(screenshot.data, "base64"));
    console.log(`CAPTURED=${fileName}`);
  }

  socket.close();
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
