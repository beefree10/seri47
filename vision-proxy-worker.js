/**
 * Seri47 Vision Proxy — Cloudflare Worker
 * 역할: 브라우저(seri47-v4.html)가 Anthropic API를 직접 못 부르는 문제(CORS+키노출) 해결.
 *       앱은 이 Worker로 요청 → Worker가 API 키를 붙여 Anthropic에 전달 → 결과를 CORS 허용으로 반환.
 *
 * 배포 (5분):
 *   1) https://dash.cloudflare.com → Workers & Pages → Create → 이 코드 붙여넣기
 *   2) Settings → Variables → Secret 추가:  ANTHROPIC_API_KEY = sk-ant-...(당신 키)
 *   3) Deploy → 나온 URL(예: https://seri47-vision.xxxx.workers.dev)을
 *      seri47-v4.html 의  const VISION_PROXY = "...";  에 입력.
 *   * 비용: Anthropic 사용량(배치당 몇 센트) + Worker 무료 티어(월 10만 요청 무료).
 *   * 보안: API 키는 Worker Secret에만 존재. 브라우저/HTML에는 절대 노출 안 됨.
 */

const ALLOW_ORIGIN = "*"; // 운영 시 "https://beefree10.github.io" 등으로 좁히면 더 안전

const CORS = {
  "Access-Control-Allow-Origin": ALLOW_ORIGIN,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS });
    }
    if (request.method !== "POST") {
      return new Response("POST only", { status: 405, headers: CORS });
    }
    if (!env.ANTHROPIC_API_KEY) {
      return json({ error: "ANTHROPIC_API_KEY secret not set" }, 500);
    }

    let body;
    try {
      body = await request.text(); // 앱이 보낸 messages 페이로드 그대로 전달
    } catch (e) {
      return json({ error: "bad request body" }, 400);
    }

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body,
      });
      const text = await res.text();
      return new Response(text, {
        status: res.status,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    } catch (e) {
      return json({ error: "upstream fetch failed", detail: String(e) }, 502);
    }
  },
};

function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
