## Full SaaS 템플릿

### Tech Stacks

- Next.js 15 (앱: `apps/app`, 웹사이트: `apps/www`)
- Supabase (PostgreSQL DB)
- Prisma (ORM/Migration)
- tRPC (백엔드 API 공유)
- Shadcn UI, TailwindCSS (UI)
- TypeScript, Turborepo (모노레포)

---

### Node.js 설치

- 요구 사항: Node.js >= 20
- nvm 사용(권장):

https://nodejs.org/ko 접속 후 설치해주세요.

### pnpm 설치

- 이 템플릿은 pnpm 10.x를 사용합니다.
- corepack(권장):

```bash
corepack enable
corepack prepare pnpm@10.11.0 --activate
```

- 또는 전역 설치:

```bash
npm i -g pnpm@10
```

### Directory Structure

```text
full-saas/
  apps/
    app/   # SaaS 앱 (Next.js, 포트 3001)
    www/   # 랜딩/마케팅 사이트 (Next.js, 포트 3000)
  packages/
    api/      # 비즈니스 로직, tRPC 라우터
    prisma/   # Prisma 스키마/마이그레이션/클라이언트
    ui/       # 공용 UI 컴포넌트 라이브러리
    utils/    # 공용 유틸리티
  tooling/     # ESLint/TSConfig 등 공용 설정
```

### 사용하는 서비스와 역할

배포 후 Clerk 설정까지 완료해야 가입할 수 있습니다.

- Supabase: PostgreSQL 데이터베이스 호스팅
- Clerk: 인증/유저 관리 (Publishable/Secret/Webhook 키 필요)
- LemonSqueezy: 결제/구독 관리 (API 키, Store ID, Webhook Secret 필요)
- SendGrid: 트랜잭션 이메일 발송
- Google Analytics 4, Microsoft Clarity: 분석

### Supabase 가입 및 설정

1. `https://supabase.com` 회원가입 → 새 프로젝트 생성
2. Project 페이지 → Connect → ORMs → Prisma의 환경변수 복사
3. 루트 경로에 `.env.local` 생성 후 붙여넣기
4. 초기 마이그레이션 적용: `pnpm db:migrate:deploy`

### Clerk 가입 및 설정

1. `https://clerk.com` 회원가입 → 애플리케이션 생성
2. 메인 페이지에 나타나는 환경변수 복사 후 `.env.local`에 붙여넣기
3. Webhooks에서 엔드포인트 추가 → URL: `https://<도메인>/api/webhooks/clerk-dev`
4. Webhook Signing Secret 발급 → `.env.local`에 `CLERK_DEV_WEBHOOK_SIGNING_SECRET`으로 추가

### LemonSqueezy 가입 및 설정

1. `https://www.lemonsqueezy.com` 회원가입 → Store 생성
2. Account → API → API Key 발급 → `.env.local`에 `LEMONSQUEEZY_API_KEY` 추가
3. Store ID 확인 → `.env.local`에 `LEMONSQUEEZY_STORE_ID` 추가
4. Webhook 생성 → URL: `https://<도메인>/api/webhooks/lemonsqueezy`
5. Webhook Secret 복사 → `.env.local`에 `LEMONSQUEEZY_WEBHOOK_SECRET`으로 추가

### env 파일 설정

완료된 환경변수 파일 예시

```env
# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db>?pgbouncer=true&pool_timeout=30
DIRECT_URL=postgresql://<user>:<password>@<host>:<port>/<db>?sslmode=require

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_DEV_WEBHOOK_SIGNING_SECRET=whsec_dev_...
CLERK_WEBHOOK_SIGNING_SECRET=whsec_...

# LemonSqueezy
LEMONSQUEEZY_API_KEY=ls_live_...
LEMONSQUEEZY_STORE_ID=12345
LEMONSQUEEZY_WEBHOOK_SECRET=whsec_...

# Email (SendGrid) (선택)
SENDGRID_API_KEY=SG.xxxxx
SENDGRID_FROM_EMAIL=no-reply@yourdomain.com

# Analytics (선택)
NEXT_PUBLIC_GA_ID=G-XXXXXXX
NEXT_PUBLIC_CLARITY_PROJECT_ID=xxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_CRISP_WEBSITE_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# Deploy (선택)
VERCEL_URL=your-app.vercel.app
```

### 주요 명령어

- 루트에서 실행 (Turborepo가 각 패키지로 전달)

```bash
# 의존성 설치
pnpm install

# Prisma 클라이언트 생성
pnpm db:generate

# DB 마이그레이션 적용 (prod/dev 공통 배포용)
pnpm db:migrate:deploy

# 개발 서버 실행 (www: 3000, app: 3001)
pnpm dev

# 빌드 / 타입체크 / 린트 / 테스트
pnpm build
pnpm typecheck
pnpm lint
pnpm test
```

- 앱별로 개별 실행도 가능합니다.

```bash
# SaaS 앱만 실행
pnpm --filter @myapp/app dev

# 마케팅 사이트만 실행
pnpm --filter www dev
```

### 실행 순서 요약

1. Node 20+, pnpm 설치
2. 루트에서 `pnpm install`
3. 루트에 `.env` 작성 (Supabase/Clerk/LemonSqueezy 등)
4. `pnpm db:generate && pnpm db:migrate:deploy`
5. `pnpm dev`로 실행 (http://localhost:3000, http://localhost:3001)
