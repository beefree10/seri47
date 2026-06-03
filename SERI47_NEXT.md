# SERI47 — NEXT
**세션 시작 시 가장 먼저 읽을 파일**
마지막 업데이트: 2026-06-03 (v9 + LINE AI CS 완성)

---

## 📍 현재 상태 (2026-06-03 최신)

| 항목 | 상태 |
|---|---|
| 최신 버전 | **v9** (로컬 전용 — 개인정보 포함, GitHub 배포 금지) |
| v9 파일 위치 | `C:\Users\hp\OneDrive\문서\claude\AI native company\Seri47\seri47-v9.html` |
| 호실 구조 | 94호 확정 (1F:101~110, 2~5F:각 21호) |
| Firebase | bee-free-9350a · seri47/state 경로 |
| Cloudflare Worker (계량기) | https://seri47-vision.jww8559.workers.dev (동결) |
| Cloudflare Worker (LINE) | https://seri47-line-webhook.jww8559.workers.dev (v3 가동중) |
| 비밀번호 | Manager=bee2026 · Owner=honey2026 · SHA-256 게이트 |
| PAT 토큰 | honeybee-deploy-2 · 만료 2026-06-30 |
| LINE OA (테스트) | BEE Free @854lohns — Webhook 연결 완료 |
| LINE OA (실제) | Seri47 OA — 아직 Webhook 미연결 (관리인 요청 필요) |
| 계량기 메뉴 | **동결** — 더 이상 수정하지 않음 |

---

## ✅ v9 완성 항목 (2026-06-03)

- [x] 로그인 화면 버전 표기 v9 수정
- [x] 블랙리스트 필드 + 주황색 구분 (대시보드·방지도·청구·고객파일)
- [x] 여권관리 탭 — AES-256-GCM 암호화 · Manager 마스킹 · Owner 10초 열람
- [x] 전자계약 탭 — Seri47 계약서 양식 · 터치서명 2개 (입주자/임대인)
- [x] TM30 탭 — 자동정보채움 + 태국 이민국 온라인 신고 링크
- [x] LINE QR 탭 — QR 생성 + 인쇄
- [x] AI CS 퇴거공지(eviction) 옵션 추가
- [x] 모듈 분리 아키텍처 (로컬 전용)
- [x] Firebase v9 필드 전체 (암호화값만 저장)

---

## ✅ LINE AI CS 자동응답 완성 (2026-06-03)

| 항목 | 내용 |
|---|---|
| Worker | seri47-line-webhook (Cloudflare, v3) |
| 환경변수 | LINE_TOKEN · LINE_SECRET · FIREBASE_URL · CLAUDE_KEY · AUTO_REPLY=true |
| 동작 | LINE 메시지 → Worker → Firebase csHistory 저장 + Claude 자동응답 |
| 언어 | 메시지 언어 자동감지 (한국어/영어/태국어/기타 모두) |
| 응답 형식 | # Reply to [이름] - Room [방번호] 로 시작 |
| 방번호 등록 | 3자리 숫자 입력 → userId↔방번호 Firebase 자동매핑 |
| 테스트 완료 | 허니비 LINE → BEE Free OA → 411호 CS탭 저장 확인 |
| Claude 모델 | claude-haiku-4-5-20251001 (빠르고 저렴) |
| 비용 | 월 500건 기준 약 350원 |

---

## 🔴 다음 액션 (우선순위순)

### 1. Seri47 OA Webhook 연결 (최우선)
- 관리인에게 LINE Developers Console 접근 요청 또는 직접 방문
- Webhook URL 설정: `https://seri47-line-webhook.jww8559.workers.dev`
- 완료 시: 실제 입주자 메시지 전부 시스템으로 유입

### 2. Firebase 보안규칙 잠금
- 현재: 전체 오픈 상태
- 목표: Firebase Auth 익명인증 추가 후 규칙 잠금
- 작업: 도담 담당

### 3. 실제 데이터 입력
- 허니비가 관리자 계정으로 v9 앱 접속
- 실입주자 이름/전화/국적 입력
- LINE 대화 export → CS탭 붙여넣기

### 4. 관리인 워크바이 영상 (병목)
- 수신 즉시: 슬기(Vision) PoC

---

## 🟢 완료된 인프라 (재사용 자산)

- **Firebase** bee-free-9350a: 94호실 전체 영속 (v9 필드 포함)
- **Cloudflare Worker Vision**: 계량기 AI 판독
- **Cloudflare Worker LINE**: 메시지 수신 → Firebase 저장 → Claude 자동응답
- **PromptPay QR**: EMVCo+CRC16 실제 스캔 가능
- **LINE OA BEE Free**: Webhook 연결 완료, AUTO_REPLY=true
- **SHA-256 로그인 게이트**: Manager·Owner 역할 분리
- **AES-256-GCM**: 여권정보 클라이언트 사이드 암호화
- **Bitwarden**: API 키 보안 보관 (Anthropic · LINE)

---

## 세션 시작 체크리스트
1. 이 파일(NEXT) 읽기
2. SERI47_HISTORY.md 최근 항목 확인
3. SERI47_PM_이루.md — 이루 현재 임무·로그 확인
4. 앱 파일: seri47-v9.html (로컬 전용)
5. Worker: seri47-line-webhook (Cloudflare)
