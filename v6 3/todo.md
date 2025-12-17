# Selpix v1.5 MVP Development Todo

## MVP Implementation Plan (4주 마일스톤)

### M0 (2일차): 기반 구축 ✓
- [x] 프로젝트 구조 설정
- [x] 시스템 설계 문서 검토
- [ ] 기본 HTML 템플릿 구현
- [ ] API 클라이언트 기본 구조

### M1 (1주차): 핵심 기능 구현
- [ ] 프런트엔드 UI 구현 (HTML/CSS/JS)
- [ ] 백엔드 API 서버 구현 (Node.js + Express)
- [ ] 사용자 인증 시스템
- [ ] 마진 계산 엔진
- [ ] Google Sheets 연동

### M2 (2주차): AI 및 자동화
- [ ] Cloudflare Worker 프록시 구현
- [ ] GPT 키워드 생성 기능
- [ ] 도매꾹 크롤링 (Puppeteer)
- [ ] Discord Bot 기본 구현

### M3 (4주차): 완성 및 최적화
- [ ] 쿠팡 윙 자동 등록
- [ ] 보안 강화 (GCP Secret Manager, KMS)
- [ ] 오류 처리 및 재시도 로직
- [ ] E2E 테스트 시나리오

## 구현할 파일 목록 (최대 8개 핵심 파일)

1. **index.html** - 메인 프런트엔드 UI
2. **main.js** - 프런트엔드 로직 및 API 호출
3. **server.js** - 백엔드 API 서버 (Node.js + Express)
4. **proxy.js** - Cloudflare Worker 프록시
5. **discord-bot.js** - Discord Bot 구현
6. **package.json** - 의존성 관리
7. **docker-compose.yml** - 로컬 개발 환경
8. **README.md** - 설정 및 실행 가이드

## 핵심 기능 우선순위
1. 도매꾹 URL 입력 → 상품 정보 추출
2. 마진 계산 (환율, 수수료, 배송비 포함)
3. AI 키워드 20개 생성
4. 쿠팡 검색 링크 자동 생성
5. Google Sheets 자동 기록
6. 쿠팡 윙 자동 등록 (기본 구현)

## 성공 기준
- 키워드→마진 계산→등록 전체 플로우 3분 내 완료
- 추천 키워드 20개 자동 생성 및 복사 기능
- 마진 리포트 JSON & 시트 자동 기록
- 기본적인 오류 처리 및 사용자 피드백