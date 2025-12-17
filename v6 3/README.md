# Selpix v1.5 - AI 기반 커머스 자동화 플랫폼

## 🚀 프로젝트 개요

Selpix v1.5는 AI 기반 커머스 자동화 플랫폼으로, 도매꾹에서 쿠팡 윙까지 3분 내 완전 자동화된 상품 등록 서비스를 제공합니다.

### 핵심 기능
- 🔍 **자동 상품 분석**: 도매꾹 URL 입력만으로 상품 정보 자동 추출
- 💰 **스마트 마진 계산**: 환율, 수수료, 배송비를 포함한 정확한 마진 계산
- 🤖 **AI 키워드 생성**: GPT 기반 검색 최적화 키워드 20개 자동 생성
- 📈 **자동 등록**: 쿠팡 윙 API를 통한 원클릭 상품 등록
- 📊 **실시간 모니터링**: Google Sheets 연동 데이터 관리
- 🤖 **Discord Bot**: 팀 협업을 위한 Discord 통합

### 성과 지표 (KPI)
- ⚡ **3분 내 완료**: 키워드→마진 계산→등록 전체 플로우
- 🎯 **20개 키워드**: AI 추천 키워드 자동 생성 및 복사 기능
- 📋 **자동 기록**: 마진 리포트 JSON & Google Sheets 자동 저장
- 🎯 **90% 정확도**: 광고 상품 식별 정확도 (목표)

## 🏗️ 시스템 아키텍처

```
[사용자] → [Netlify Frontend] → [Cloudflare Worker] → [GCP VM Backend]
                                        ↓
[Discord Bot] ← [Google Sheets] ← [Puppeteer Engine]
                    ↓
[GCP Secret Manager] + [GCP KMS] + [외부 API들]
```

### 기술 스택
- **Frontend**: HTML5, CSS3, JavaScript (Tailwind CSS, Alpine.js)
- **Backend**: Node.js, Express.js, Puppeteer
- **Proxy**: Cloudflare Worker
- **Database**: Google Sheets API
- **Security**: GCP Secret Manager, GCP KMS
- **Automation**: Discord Bot, n8n (선택적)

## 🚀 빠른 시작

### 1. 환경 설정

```bash
# 저장소 클론
git clone https://github.com/selpix/selpix-v1.5.git
cd selpix-v1.5

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# .env 파일을 편집하여 필요한 값들을 설정하세요
```

### 2. 필수 환경 변수

```bash
# Google Sheets
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_SERVICE_ACCOUNT_KEY=path/to/service-account.json

# OpenAI GPT
OPENAI_API_KEY=your_openai_api_key

# Discord Bot
DISCORD_BOT_TOKEN=your_bot_token
DISCORD_ROCKET_CHANNEL_ID=channel_id
DISCORD_CONSIGNMENT_CHANNEL_ID=channel_id
DISCORD_WING_CHANNEL_ID=channel_id
DISCORD_GENERAL_CHANNEL_ID=channel_id

# 기타
FRONTEND_URL=http://localhost:8080
NODE_ENV=development
```

### 3. 로컬 개발 환경 실행

```bash
# Docker Compose로 전체 스택 실행
docker-compose up -d

# 또는 개별 서비스 실행
npm run dev              # 백엔드 + 정적 리소스 (랜딩/콘솔)
npm run bot:dev          # Discord Bot
# 루트('/')는 랜딩페이지, /index.html은 콘솔
```

### 4. 서비스 접근

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3000
- **API Health Check**: http://localhost:3000/api/v1/system/health
- **Grafana (선택)**: http://localhost:3001 (admin/admin)

## 📖 사용 방법

### 웹 인터페이스

1. **상품 분석**
   - 도매꾹 상품 URL 입력
   - 자동 상품 정보 추출 및 분석

2. **마진 계산**
   - 환율, 배송비, 수수료 설정
   - 목표 마진율 입력
   - 자동 가격 추천 확인

3. **키워드 생성**
   - AI 기반 키워드 20개 자동 생성
   - 원클릭 복사 기능
   - 쿠팡 검색 링크 자동 생성

4. **자동 등록**
   - 판매가 및 할인율 설정
   - 키워드 선택
   - 쿠팡 윙 자동 등록

### Discord Bot 명령어

```bash
/소싱요청 url:도매꾹URL 플랫폼:wing 목표마진율:30
/소싱조회 요청id:optional
/소싱취소 요청id:required
/소싱템플릿
/도움말
```

## 🔧 API 문서

### 주요 엔드포인트

```bash
# 상품 분석
POST /api/v1/products/analyze
{
  "productUrl": "https://도매꾹URL",
  "exchangeRate": 1350,
  "shippingCost": 3000
}

# 마진 계산
POST /api/v1/margin/calculate
{
  "productId": "uuid",
  "wholesalePrice": 10000,
  "targetMarginRate": 30
}

# 키워드 생성
POST /api/v1/keywords/generate
{
  "productInfo": {
    "name": "상품명",
    "category": "카테고리",
    "description": "설명"
  },
  "count": 20
}

# 상품 등록
POST /api/v1/registration/register
{
  "productData": {
    "productInfo": {...},
    "pricing": {...},
    "keywords": [...]
  }
}
```

전체 API 문서는 [API 명세서](docs/api_specification.yaml)를 참조하세요.

## 🔒 보안

### 데이터 보호
- **전송 중 암호화**: HTTPS/TLS 1.3
- **저장 시 암호화**: GCP KMS를 통한 쿠키 및 토큰 암호화
- **키 관리**: GCP Secret Manager 중앙집중식 관리

### 인증 및 권한
- **다단계 인증**: 쿠팡 2차 인증 지원
- **세션 관리**: JWT + Refresh Token
- **권한 제어**: Role-based Access Control (RBAC)

## 📊 모니터링

### 핵심 지표
- **응답 시간**: API 엔드포인트별 평균/최대 응답 시간
- **처리량**: 초당 요청 수 (RPS)
- **에러율**: 4xx/5xx 에러 비율
- **가용성**: 99.9% 업타임 목표

### 알림 시스템
- Discord를 통한 실시간 장애 알림
- 자동 복구 및 에스컬레이션
- 상태 페이지를 통한 사용자 공지

## 🚀 배포

### 프로덕션 배포

```bash
# 전체 배포
npm run deploy:all

# 개별 서비스 배포
npm run deploy:frontend    # Netlify
npm run deploy:proxy       # Cloudflare Worker
npm run deploy:backend     # GCP VM
```

### 환경별 설정
- **Development**: 로컬 개발 환경
- **Staging**: 테스트 환경
- **Production**: 프로덕션 환경

## 🧪 테스트

```bash
# 전체 테스트 실행
npm test

# 특정 테스트 실행
npm test -- --grep "마진 계산"

# 커버리지 리포트
npm run test:coverage

# E2E 테스트
npm run test:e2e
```

## 📈 성능 최적화

### 프론트엔드
- 코드 분할 및 지연 로딩
- 이미지 최적화 (WebP, 지연 로딩)
- CDN을 통한 정적 리소스 배포

### 백엔드
- Redis 캐싱 전략
- 데이터베이스 쿼리 최적화
- 비동기 처리 및 큐 시스템

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 코딩 표준
- ESLint 설정 준수
- Jest를 통한 테스트 작성
- JSDoc을 통한 문서화

## 📝 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 지원

- **이슈 리포팅**: [GitHub Issues](https://github.com/selpix/selpix-v1.5/issues)
- **문의**: dev@selpix.com
- **Discord**: [Selpix 커뮤니티](https://discord.gg/selpix)

## 🗺️ 로드맵

### v1.5 (현재)
- ✅ MVP 핵심 기능 구현
- ✅ 쿠팡 윙 자동 등록
- ✅ Discord Bot 통합

### v1.6 (다음 4주)
- 🔄 다중 플랫폼 지원 (네이버, 11번가)
- 🔄 고급 분석 기능
- 🔄 모바일 앱 개발

### v2.0 (장기)
- 🔮 AI 기반 트렌드 예측
- 🔮 자동 재고 관리
- 🔮 글로벌 마켓플레이스 확장

---

**Selpix v1.5** - AI로 더 스마트한 커머스 자동화를 경험하세요! 🚀
