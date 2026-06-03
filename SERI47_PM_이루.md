# 이루(Seri47 CEO) — Seri47 앱 완성 총괄
소속: BEE Home(마루) 산하 · 보고선: 마루(BEE Home CEO) → 한울 → 허니비 · 채용일: 2026-06-02

---

## 임무 (Mandate)
Seri47 검침 앱을 **관리인이 매일 쓰는 완성된 실동작 앱**으로 만든다.

## 현재 상태 (2026-06-03 최신)

| 항목 | 상태 |
|---|---|
| 앱 버전 | **v9** (로컬 전용) |
| 파일 위치 | seri47-v9.html (개인정보 포함 → GitHub 금지) |
| Firebase | bee-free-9350a · 94호실 전체 영속 |
| LINE AI CS | BEE Free OA → Cloudflare Worker → Claude Haiku → 자동응답 ✅ |
| 계량기 메뉴 | 동결 |
| 완성선 KPI | "관리인이 1주 매일 1회↑ + 검침 1사이클 무오류 완주" |
| 병목 | Seri47 OA Webhook 연결 (관리인 요청 필요) |

## ★허니비에게만 올리는 것
1. Seri47 OA Webhook 연결 — 관리인에게 직접 요청 필요
2. 실입주자 데이터 go-live, 외부 공개, 비용 큰 결정
3. 완성선 도달/미달 보고

## 다음 액션
- [ ] **(허니비 1건)** 관리인에게 Seri47 OA Webhook URL 설정 요청
  - URL: `https://seri47-line-webhook.jww8559.workers.dev`
- [ ] Firebase 보안규칙 잠금 (도담)
- [ ] 허니비가 관리자 계정으로 실입주자 데이터 입력
- [ ] 관리인 워크바이 영상 수신 → 슬기 PoC

## 로그
- 2026-06-02 · 채용(겸임→전담 승격). 현 상태 전부 흡수.
- 2026-06-02 · LINE 채널 현실 확인: 관리인 개인 LINE 하나만 사용 → 과거대화 자동 API 수집 불가.
- 2026-06-02 · 빌딩주(20개 보유) "Please send me your system" 요청 → URL 전송.
- 2026-06-02 세션2 · v6→v7→v8 완성·배포.
- 2026-06-03 · **v9 완성.** 블랙리스트·여권암호화(AES-256)·전자계약·TM30·LINE QR·모듈분리. 로컬 전용.
- 2026-06-03 · **LINE AI CS 자동응답 완성.** Cloudflare Worker(seri47-line-webhook) 배포. BEE Free OA Webhook 연결. Claude Haiku 자동응답 한국어·영어·태국어 테스트 완료. 411호 userId 매핑 + csHistory Firebase 저장 확인.
- 2026-06-03 · **Bitwarden 보안 설정.** API 키 전부 Bitwarden Secure Note로 이전.
- 2026-06-03 · ctx.waitUntil 적용으로 Cloudflare CPU 타임아웃 문제 해결.
