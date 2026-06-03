/**
 * Seri47 LINE Link Worker — Cloudflare Worker
 *
 * 라우트:
 *   GET  /liff?room=201   → 입주자가 QR 스캔 시 열리는 LIFF 페이지
 *   POST /link            → LIFF에서 { room, userId } 전송 → Firebase 저장
 *   POST /webhook         → LINE 서버 Webhook (follow 이벤트 등 수신)
 *
 * Cloudflare Worker 환경변수 (Secret)으로 등록할 것:
 *   LINE_CHANNEL_ACCESS_TOKEN
 *   LINE_CHANNEL_SECRET
 *   FIREBASE_DB_URL        예: https://bee-free-9350a-default-rtdb.asia-southeast1.firebasedatabase.app
 *   FIREBASE_API_KEY
 *
 * 배포 후 v9.html 의 generateLineQR() URL을 아래로 변경:
 *   https://<이 워커 주소>/liff?room=${u.id}
 */

const LIFF_ID = "2010286411-KSjGtKI5";
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    if (url.pathname === "/liff") {
      return serveLiffPage(url, env);
    }

    if (url.pathname === "/link" && request.method === "POST") {
      return handleLink(request, env);
    }

    if (url.pathname === "/webhook" && request.method === "POST") {
      return handleWebhook(request, env);
    }

    return new Response("Seri47 LINE Link Worker", { status: 200 });
  },
};

/* ───────────────────────────────────────────
   1) LIFF 페이지: QR 스캔 시 입주자에게 보임
─────────────────────────────────────────── */
function serveLiffPage(url, env) {
  const room = url.searchParams.get("room") || "";
  const workerUrl = url.origin;

  const html = `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Seri 47 — ห้อง ${room}</title>
<script src="https://static.line-scdn.net/liff/edge/versions/2.22.3/sdk.js"></script>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,sans-serif;background:#f0f4f8;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:20px}
  .card{background:#fff;border-radius:20px;padding:32px 24px;max-width:360px;width:100%;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,.1)}
  .logo{font-size:36px;margin-bottom:8px}
  .title{font-size:20px;font-weight:700;color:#1e2535;margin-bottom:4px}
  .room{font-size:32px;font-weight:800;color:#1a5fa8;margin:16px 0}
  .sub{font-size:13px;color:#7080a0;line-height:1.6;margin-bottom:24px}
  .btn{display:block;width:100%;padding:14px;background:#06C755;color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer}
  .btn:disabled{background:#ccc}
  .status{margin-top:16px;font-size:13px;color:#7080a0;min-height:20px}
  .success{color:#06C755;font-weight:700;font-size:15px}
  .error{color:#e53e3e;font-size:13px}
</style>
</head>
<body>
<div class="card">
  <div class="logo">🐝</div>
  <div class="title">Seri 47 Residence</div>
  <div class="room">ห้อง ${room}</div>
  <div class="sub">กดปุ่มด้านล่างเพื่อเชื่อม LINE กับห้องของคุณ<br>자동으로 호실이 연결됩니다</div>
  <button class="btn" id="btn" onclick="doLink()" disabled>กำลังโหลด...</button>
  <div class="status" id="status"></div>
</div>

<script>
const ROOM = "${room}";
const WORKER_URL = "${workerUrl}";
let lineUserId = null;

async function init() {
  try {
    await liff.init({ liffId: "${LIFF_ID}" });
    if (!liff.isLoggedIn()) {
      liff.login({ redirectUri: location.href });
      return;
    }
    const profile = await liff.getProfile();
    lineUserId = profile.userId;
    document.getElementById("btn").disabled = false;
    document.getElementById("btn").textContent = "✅ เชื่อม LINE กับห้อง ${room}";
  } catch (e) {
    document.getElementById("status").innerHTML = '<span class="error">เกิดข้อผิดพลาด: ' + e.message + '</span>';
  }
}

async function doLink() {
  if (!lineUserId || !ROOM) return;
  const btn = document.getElementById("btn");
  const status = document.getElementById("status");
  btn.disabled = true;
  btn.textContent = "กำลังเชื่อม...";
  try {
    const res = await fetch(WORKER_URL + "/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room: ROOM, userId: lineUserId }),
    });
    const data = await res.json();
    if (data.ok) {
      btn.textContent = "✅ เชื่อมสำเร็จ!";
      status.innerHTML = '<span class="success">ห้อง ${room} เชื่อม LINE แล้ว 🎉</span>';
    } else {
      throw new Error(data.error || "Unknown error");
    }
  } catch (e) {
    btn.disabled = false;
    btn.textContent = "เชื่อม LINE กับห้อง ${room}";
    status.innerHTML = '<span class="error">ลองอีกครั้ง: ' + e.message + '</span>';
  }
}

init();
</script>
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html;charset=UTF-8" },
  });
}

/* ───────────────────────────────────────────
   2) /link: LIFF → Firebase에 userId 저장
─────────────────────────────────────────── */
async function handleLink(request, env) {
  let body;
  try {
    body = await request.json();
  } catch {
    return jsonResp({ ok: false, error: "Invalid JSON" }, 400);
  }

  const { room, userId } = body;
  if (!room || !userId) {
    return jsonResp({ ok: false, error: "room and userId required" }, 400);
  }

  // Firebase REST API로 저장: /units/{room}/lineId 와 lineLinked
  const dbUrl = env.FIREBASE_DB_URL;
  const apiKey = env.FIREBASE_API_KEY;
  const path = `/units/${room}.json?auth=${apiKey}`;

  const res = await fetch(dbUrl + path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lineId: userId, lineLinked: true }),
  });

  if (!res.ok) {
    const err = await res.text();
    return jsonResp({ ok: false, error: err }, 500);
  }

  // 입주자에게 환영 메시지 발송
  await sendLineMessage(userId, `🐝 Seri 47 Residence\nห้อง ${room} เชื่อม LINE สำเร็จแล้ว!\n호실 연결이 완료되었습니다 ✅`, env);

  return jsonResp({ ok: true });
}

/* ───────────────────────────────────────────
   3) /webhook: LINE 이벤트 수신 (서명 검증)
─────────────────────────────────────────── */
async function handleWebhook(request, env) {
  const body = await request.text();

  // 서명 검증
  const sig = request.headers.get("x-line-signature");
  const valid = await verifySignature(body, sig, env.LINE_CHANNEL_SECRET);
  if (!valid) {
    return new Response("Unauthorized", { status: 401 });
  }

  const data = JSON.parse(body);
  for (const event of data.events || []) {
    if (event.type === "follow") {
      // 친구 추가 이벤트 — LIFF 링크가 이미 처리하지만 혹시 직접 추가한 경우 로그만
      console.log("Follow event:", event.source.userId);
    }
  }

  return new Response("OK", { status: 200 });
}

/* ─── 유틸 ─── */
async function verifySignature(body, signature, secret) {
  if (!signature || !secret) return false;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(body));
  const computed = btoa(String.fromCharCode(...new Uint8Array(sig)));
  return computed === signature;
}

async function sendLineMessage(userId, text, env) {
  await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.LINE_CHANNEL_ACCESS_TOKEN}`,
    },
    body: JSON.stringify({
      to: userId,
      messages: [{ type: "text", text }],
    }),
  });
}

function jsonResp(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}
