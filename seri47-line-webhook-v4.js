// seri47-line-webhook Worker v5
// 변경: /link 저장 경로 수정 (units/ → seri47/state/rooms/) + LINE 프로필 전체 저장

const LIFF_ID = "2010286411-KSjGtKI5";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // LIFF 페이지 (GET /liff?room=201)
    if (url.pathname === "/liff") {
      return serveLiffPage(url, env);
    }

    // 호실 연결 (POST /link)
    if (url.pathname === "/link" && request.method === "POST") {
      return handleLink(request, env);
    }

    // 기존 Webhook (POST /)
    if (request.method !== "POST") {
      return new Response("OK", { status: 200 });
    }

    const body = await request.text();
    const signature = request.headers.get("x-line-signature");
    const valid = await verifySignature(body, signature, env.LINE_SECRET);
    if (!valid) {
      return new Response("Unauthorized", { status: 401 });
    }

    const data = JSON.parse(body);
    const events = data.events || [];

    for (const event of events) {
      if (event.type !== "message") continue;
      if (event.message.type !== "text") continue;

      const userId = event.source.userId;
      const text = event.message.text.trim();
      const ts = new Date(event.timestamp).toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
      });

      const roomInput = text.match(/^(\d{3})$/);
      if (roomInput) {
        const roomId = roomInput[1];
        await setRoomMapping(userId, roomId, env.FIREBASE_URL);
        await sendLine(
          userId,
          `✅ ${roomId}호로 등록됐습니다.\n이제 메시지를 보내시면 관리자에게 전달됩니다.`,
          env.LINE_TOKEN
        );
        continue;
      }

      const roomId = await getRoomByUserId(userId, env.FIREBASE_URL);

      if (!roomId) {
        await sendLine(
          userId,
          "안녕하세요 🏢 Seri 47입니다.\n방 번호를 입력해 주세요 (예: 411)",
          env.LINE_TOKEN
        );
        continue;
      }

      await saveToFirebase(roomId, userId, text, ts, env.FIREBASE_URL);

      if (env.AUTO_REPLY === "true") {
        ctx.waitUntil(
          getClaudeReply(roomId, text, env).then((reply) =>
            sendLine(userId, reply, env.LINE_TOKEN)
          )
        );
      } else {
        await sendLine(
          userId,
          "✅ 메시지가 전달됐습니다. 담당자가 곧 연락드리겠습니다. 🙏",
          env.LINE_TOKEN
        );
      }
    }

    return new Response("OK", { status: 200 });
  },
};

/* ─── LIFF 페이지 ─── */
function serveLiffPage(url, env) {
  const room = url.searchParams.get("room") || "";
  const workerOrigin = url.origin;

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
.logo{font-size:40px;margin-bottom:8px}
.title{font-size:20px;font-weight:700;color:#1e2535;margin-bottom:4px}
.room{font-size:36px;font-weight:800;color:#1a5fa8;margin:16px 0}
.sub{font-size:13px;color:#7080a0;line-height:1.7;margin-bottom:24px}
.btn{display:block;width:100%;padding:14px;background:#06C755;color:#fff;border:none;border-radius:12px;font-size:16px;font-weight:700;cursor:pointer;transition:.15s}
.btn:disabled{background:#ccc;cursor:default}
.status{margin-top:16px;font-size:13px;color:#7080a0;min-height:20px}
.ok{color:#06C755;font-weight:700;font-size:15px}
.err{color:#e53e3e}
</style>
</head>
<body>
<div class="card">
  <div class="logo">🐝</div>
  <div class="title">Seri 47 Residence</div>
  <div class="room">ห้อง ${room}</div>
  <div class="sub">กดปุ่มด้านล่างเพื่อเชื่อม LINE กับห้องของคุณ<br>버튼을 누르면 호실이 자동 연결됩니다</div>
  <button class="btn" id="btn" onclick="doLink()" disabled>กำลังโหลด...</button>
  <div class="status" id="status"></div>
</div>
<script>
const ROOM = "${room}";
const WORKER = "${workerOrigin}";
let lineUserId = null;

let lineProfile = null;

async function init() {
  try {
    await liff.init({ liffId: "${LIFF_ID}" });
    if (!liff.isLoggedIn()) { liff.login({ redirectUri: location.href }); return; }
    lineProfile = await liff.getProfile();
    document.getElementById("btn").disabled = false;
    document.getElementById("btn").textContent = "✅ เชื่อม LINE กับห้อง ${room}";
  } catch(e) {
    document.getElementById("status").innerHTML = '<span class="err">Error: ' + e.message + '</span>';
  }
}

async function doLink() {
  if (!lineProfile || !ROOM) return;
  const btn = document.getElementById("btn");
  const status = document.getElementById("status");
  btn.disabled = true;
  btn.textContent = "กำลังเชื่อม...";
  try {
    const res = await fetch(WORKER + "/link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room: ROOM,
        userId: lineProfile.userId,
        displayName: lineProfile.displayName,
        pictureUrl: lineProfile.pictureUrl || "",
        statusMessage: lineProfile.statusMessage || ""
      })
    });
    const d = await res.json();
    if (d.ok) {
      btn.textContent = "✅ เชื่อมสำเร็จ!";
      status.innerHTML = '<span class="ok">ห้อง ${room} เชื่อม LINE แล้ว 🎉<br>연결 완료!</span>';
    } else { throw new Error(d.error || "failed"); }
  } catch(e) {
    btn.disabled = false;
    btn.textContent = "เชื่อม LINE กับห้อง ${room}";
    status.innerHTML = '<span class="err">ลองอีกครั้ง: ' + e.message + '</span>';
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

/* ─── /link: Firebase seri47/state/rooms/{room} 에 LINE 프로필 전체 저장 ─── */
async function handleLink(request, env) {
  let body;
  try { body = await request.json(); } catch {
    return jsonResp({ ok: false, error: "Invalid JSON" }, 400);
  }

  const { room, userId, displayName, pictureUrl, statusMessage } = body;
  if (!room || !userId) {
    return jsonResp({ ok: false, error: "room and userId required" }, 400);
  }

  // v9 앱이 읽는 경로: seri47/state/rooms/{room}
  const res = await fetch(`${env.FIREBASE_URL}/seri47/state/rooms/${room}.json`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      lineId: userId,
      lineLinked: true,
      lineName: displayName || "",
      linePic: pictureUrl || "",
      lineStatus: statusMessage || "",
    }),
  });

  if (!res.ok) {
    return jsonResp({ ok: false, error: await res.text() }, 500);
  }

  // userId_map 에도 저장 (기존 문자 메시지 방식과 호환)
  await fetch(`${env.FIREBASE_URL}/seri47/userId_map/${userId}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(room),
  });

  // 환영 메시지
  await sendLine(
    userId,
    `🐝 Seri 47 Residence\nสวัสดีคุณ ${displayName}!\nห้อง ${room} เชื่อม LINE สำเร็จแล้ว ✅\n궁금한 점은 여기로 메시지 보내주세요.`,
    env.LINE_TOKEN
  );

  return jsonResp({ ok: true });
}

function jsonResp(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

/* ─── 기존 함수들 (변경 없음) ─── */
async function verifySignature(body, signature, secret) {
  if (!signature || !secret) return false;
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return btoa(String.fromCharCode(...new Uint8Array(sig))) === signature;
}

async function setRoomMapping(userId, roomId, fbUrl) {
  await fetch(`${fbUrl}/seri47/userId_map/${userId}.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(roomId),
  });
}

async function getRoomByUserId(userId, fbUrl) {
  const res = await fetch(`${fbUrl}/seri47/userId_map/${userId}.json`);
  if (!res.ok) return null;
  return (await res.json()) || null;
}

async function saveToFirebase(roomId, userId, text, ts, fbUrl) {
  const res = await fetch(`${fbUrl}/seri47/state/rooms/${roomId}/csHistory.json`);
  let history = [];
  if (res.ok) {
    const d = await res.json();
    if (Array.isArray(d)) history = d;
    else if (d && typeof d === "object") history = Object.values(d);
  }
  history.push({ ts, msg: text.slice(0, 300), note: "", source: "LINE_AUTO", userId });
  history = history.slice(-50);

  await fetch(`${fbUrl}/seri47/state/rooms/${roomId}/csHistory.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(history),
  });
  await fetch(`${fbUrl}/seri47/state/rooms/${roomId}/lineMsg.json`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(text),
  });
}

async function getClaudeReply(roomId, text, env) {
  const res = await fetch(`${env.FIREBASE_URL}/seri47/state/rooms/${roomId}.json`);
  const room = res.ok ? await res.json() : {};
  const prompt = `You are the CS assistant for Seri 47 Residence Bangkok.
Room: ${roomId}, Tenant: ${room.tenant || "Unknown"}
Always start your reply with "# Reply to ${room.tenant || "Tenant"} - Room ${roomId}"
Message: ${text}
Reply in the exact same language as the message. Keep it under 3 sentences. Be polite and helpful.
If maintenance request: confirm receipt, say manager will follow up within 24hrs.
If payment question: PromptPay 0812345678.`;

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": env.CLAUDE_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const d = await r.json();
    return d.content?.[0]?.text || "감사합니다. 곧 답변드리겠습니다. 🙏";
  } catch {
    return "감사합니다. 담당자가 곧 연락드리겠습니다. 🙏";
  }
}

async function sendLine(userId, text, token) {
  await fetch("https://api.line.me/v2/bot/message/push", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ to: userId, messages: [{ type: "text", text }] }),
  });
}
