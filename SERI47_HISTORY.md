## 2026-06-04 — LINE QR 자동연결 + 호실 상태 UI 전면 정비 ✅

### LINE QR Auto-Link 완성
- **LIFF 앱 등록:** LINE Login 채널 → LIFF ID 2010286411-KSjGtKI5
- **Cloudflare Worker v5 배포:** `/liff` (LIFF 페이지) + `/link` (Firebase 저장) 추가
- **QR 스캔 흐름:** QR → LIFF 페이지 → 버튼 클릭 → LINE 프로필 자동 저장
- **저장 데이터:** lineId(userId) · lineName · linePic · lineLinked → Firebase seri47/state/rooms/{room}
- **앱 반영:** 고객 탭 LINE탭에 프로필 사진+이름+userId 카드 표시
- **연결 표시 조건:** lineLinked=true AND lineName 존재 시만 LINE✓ (stale 데이터 무시)
- **테스트 완료:** 411호 QR 스캔 → Ian 프로필 저장 확인

### 호실 상태 UI 전면 정비
- **payStatus 필드 추가:** paid / overdue (랜덤 paid 제거)
- **호실 색 우선순위:** 공실(회색) > 연체(빨간) > 블랙리스트(주황) > 입주중(파란)
- **공실/입주 토글 복귀:** 고객 상세 우측상단 ว่าง ↔ Occupied
- **납부상태 버튼 추가:** Paid / Overdue — 블랙리스트 위에 배치
- **미연결 배지:** '—' → '미연결'로 정직하게 표시
- **Firebase 동기화:** payStatus persist/load 완료

### git 저장소 초기화
- v1~v9 전체 파일 첫 커밋 (API 키 .gitignore 제외)

---

## 2026-06-03 (저녁) — v9 완성 + LINE AI CS 자동응답 완성 ★★★

### v9 개발 완료 (로컬 전용)
- **모듈 분리 아키텍처 도입:** 단일 HTML → index.html + modules/ 구조. 토큰 80% 절감 기반.
- **블랙리스트 기능:** 방별 토글 → 주황색(🟠) 대시보드·방지도·청구 전체 반영. Firebase 영속.
- **여권관리 탭 (AES-256-GCM 암호화):**
  - 여권번호: Manager는 XX****XX 마스킹, Owner만 10초 전체 열람
  - 여권 스캔 이미지: 블러 처리, Owner만 15초 열람
  - Firebase에는 암호화된 값만 저장 → 유출 시 해독 불가
  - 체크인/체크아웃/비자종류 필드 추가
- **전자계약 탭:**
  - Seri47 실제 계약서 양식 기반 (태국어/영어 PDF 분석 반영)
  - 터치/마우스 서명 캔버스 2개 (입주자/임대인)
  - 계약 내용 미리보기 + Firebase 저장
  - 조항 5(연체금), 21(계약해지), 22(퇴거) 자동 표시
- **TM30 탭:**
  - 태국 이민법: 외국인 입주 24시간 내 신고 의무
  - 여권정보 자동채움 + 태국 이민국 온라인 시스템 직링크
  - 신고완료 체크박스 + 날짜 Firebase 저장
- **LINE QR 탭:** QR 생성 + 인쇄 기능
- **AI CS 퇴거공지(eviction) 옵션 추가**
- **v9 로컬 저장:** `seri47-v9.html` (개인정보 포함 → GitHub 배포 금지)

### LINE AI CS 자동응답 파이프라인 완성 ★★★
- **Cloudflare Worker 신규 배포:** `seri47-line-webhook.jww8559.workers.dev`
- **LINE Developers Console Webhook 설정:** BEE Free OA → Webhook URL 연결 · Verify 성공
- **환경변수 5개 보안 설정:** LINE_TOKEN · LINE_SECRET · FIREBASE_URL · CLAUDE_KEY · AUTO_REPLY (모두 Cloudflare Secret 암호화)
- **API 키 보안 관리:** Bitwarden Secure Note에 보관 (Google Drive 평문 저장 → 삭제)
- **동작 흐름:**
  1. 입주자 LINE 메시지 → BEE Free OA
  2. Webhook → Cloudflare Worker
  3. userId → 방번호 조회 (Firebase userId_map)
  4. csHistory Firebase 저장
  5. Claude Haiku → 언어 자동감지 답장 발송
- **방번호 등록:** 3자리 숫자 입력 시 자동 userId↔방번호 매핑
- **언어 자동감지:** 한국어→한국어, 영어→영어, 태국어→태국어 (100개+ 언어)
- **응답 형식:** `# Reply to [이름] - Room [방번호]` 헤더 통일
- **테스트 완료:**
  - 허니비 LINE(411호) → BEE Free OA
  - Firebase userId_map: `Uc644dc39e...` → "411" 저장 확인
  - Firebase csHistory: "에어컨이 안 켜져요" 등 다수 저장 확인
  - v9 앱 411호 CS탭 실시간 표시 확인
  - Claude 자동응답: 한국어·영어 테스트 모두 성공
- **비용:** claude-haiku-4-5-20251001 · 월 500건 기준 약 350원
- **ctx.waitUntil 적용:** Cloudflare CPU 타임아웃 문제 해결

### 보안 개선
- Google Drive 평문 API 키 → Bitwarden 이전 권고
- Firebase 보안규칙: 현재 오픈 상태 → 익명인증 추가 후 잠금 예정 (도담)

### 다음 세션 우선순위
1. Seri47 OA Webhook 연결 (관리인 요청)
2. Firebase 보안규칙 잠금
3. 실입주자 데이터 입력

### 6. Code 환경 전환
- 작업환경 이동: 채팅창 "이루 소집"(연기) → Claude Code(실제 파일 작동).
- Git for Windows 설치 완료(세이브포인트=commit 용도). Git≠GitHub 개념 정리.
- Seri47 폴더에 CLAUDE.md 신규 배치(이루 Code용 작업규칙).
- Code 첫 세션: 폴더구조 파악 성공 = 이루 첫 출근.

### 7. 운영 교훈 (박제)
- 앱/코드=Code · 전략/대화=채팅 · 일반문서=Cowork. 같은 모델, 권한이 다름.
- 채팅창 코드 디버깅=추측 핑퐁 → 사용량 폭증(이틀 10만원). 재발방지: 코드는 Code에서.
- 무한루프 차단 "2회 시도 후 정지 + 원인가설 3개 보고"를 기술작업 표준으로.

