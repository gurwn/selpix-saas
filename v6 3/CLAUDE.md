# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Selpix v1.5** is an integrated AI-based commerce automation platform that automates product sourcing from Domeggook (도매꾹) wholesale marketplace to Coupang (Korean e-commerce platform). The system now includes:
- Product analysis, margin calculation, and AI keyword generation
- **NEW: Advanced advertising analytics** with chart visualization
- **NEW: Keyword performance analysis** with low-performer detection
- **NEW: Product price inspection** for bulk pricing
- **NEW: Real-time wholesale site crawling** (Domeggook, Coupang, 11st, Gmarket)
- Automatic product registration and order automation

### Key Performance Targets
- Complete workflow (analysis → margin → registration) in under 3 minutes
- Generate 20 AI-optimized keywords per product
- 90%+ accuracy in ad product identification
- Automatic recording to Google Sheets

## Commands

### Development
```bash
# Start development server (runs on port 3001 to avoid conflicts)
npm run dev

# Start server (production)
npm start
```

### Testing
```bash
# Run tests (placeholder - not implemented in MVP)
npm test

# Lint (placeholder - not implemented in MVP)
npm run lint
```

### Docker Development
```bash
# Start all services (backend, discord bot, frontend, redis)
docker-compose up -d

# Start with monitoring (includes Prometheus & Grafana)
docker-compose --profile monitoring up -d

# Stop all services
docker-compose down
```

### Access Points (when running locally)
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001 (note: uses 3001 not 3000)
- **Health Check**: http://localhost:3001/api/v1/system/health
- **Grafana** (with monitoring profile): http://localhost:3001 (admin/admin)

## Architecture Overview

### System Flow
```
[User] → [Frontend (HTML/JS)] → [Cloudflare Worker Proxy] → [Express Backend]
                                          ↓
[Discord Bot] ← [Google Sheets] ← [Automation Engine (Coupang API + Domeggook)]
```

### Key Components

1. **Frontend** ([index.html](프로토타입/v6/v6/index.html), [main.js](프로토타입/v6/v6/main.js))
   - Single-page application with Tailwind CSS & Alpine.js
   - Direct API calls to backend endpoints
   - Product analysis, margin calculation, keyword generation UI

2. **Backend API Server** ([server.js](프로토타입/v6/v6/server.js))
   - Express.js REST API (port 3001)
   - Mock implementations for MVP (uses in-memory Map storage)
   - Main endpoints: `/api/v1/products/analyze`, `/api/v1/margin/calculate`, `/api/v1/keywords/generate`, `/api/v1/registration/register`
   - Includes helmet security, CORS, rate limiting

3. **Automation Engine** ([coupang-collector.js](프로토타입/v6/v6/coupang-collector.js), [automation-routes.js](프로토타입/v6/v6/automation-routes.js))
   - **CoupangCollector**: Interfaces with Coupang API using CEA (HMAC-SHA256) signature authentication
   - **DomeggookIntegrator**: Handles order placement to Domeggook wholesale API
   - **SelpixAutomation**: Orchestrates order processing workflow
   - Tracks seen order IDs to avoid duplicate processing (stored in `downloads/seen_ids.json`)
   - Product mapping configuration stored in `downloads/dome_mapping.json`

4. **Discord Bot** ([discord-bot.js](프로토타입/v6/v6/discord-bot.js))
   - Slash commands: `/소싱요청`, `/소싱조회`, `/소싱취소`, `/소싱템플릿`, `/도움말`
   - Routes notifications to different channels based on platform (rocket/consignment/wing)
   - Integrates with backend API for product analysis and processing

5. **Cloudflare Worker Proxy** ([proxy.js](프로토타입/v6/v6/proxy.js))
   - Handles HTTPS termination and routing
   - Proxies OpenAI GPT API requests (path: `/api/gpt/*`)
   - Rate limiting (100 requests per 15 minutes per IP)
   - CORS and security headers

## Core Workflow Logic

### Product Analysis Flow
1. User submits Domeggook product URL
2. Backend scrapes product info (mock implementation returns randomized data)
3. System calculates margins with configurable exchange rate, shipping costs, commission rates
4. AI generates 20 Korean keywords optimized for Coupang search
5. System creates Coupang search links for each keyword
6. Optionally registers product to Coupang platform

### Automation Order Processing Flow
1. **Fetch Orders**: `CoupangCollector.fetchOrders()` retrieves new orders from Coupang API
2. **Flatten & Group**: Orders are flattened to item-level detail and grouped by `shipmentBoxId`
3. **Check Seen IDs**: Filter out previously processed orders using in-memory Set
4. **Map Products**: `DomeggookIntegrator.findMapping()` maps Coupang items to Domeggook products using:
   - `byVendorItemId`: Direct vendor item ID lookup
   - `byProductName`: Substring matching on product names
   - `byKeywords`: Keyword-based rules with `includes` arrays
5. **Place Order**: Submit order to Domeggook API with delivery info and mapped items
6. **Acknowledge**: If successful, call Coupang API to acknowledge shipment (상품준비중 status)
7. **Save State**: Update seen IDs and save processing logs to `downloads/` directory

### Margin Calculation Details
- **Total Cost** = (wholesalePrice × exchangeRate/1000) + shippingCost + storageFee + packagingCost (2% or min 500원)
- **Recommended Price** = totalCost × (1 + targetMarginRate/100) / (1 - commissionRate/100)
- Returns competitive pricing suggestions: 5% discount, recommended, 5% premium
- Calculates ROAS (Return on Ad Spend) if advertising costs provided

## Important Technical Details

### API Authentication Patterns

**Coupang API (CEA Signature)**:
- Authorization header: `CEA algorithm=HmacSHA256, access-key=..., signed-date=..., signature=...`
- Signature = HMAC-SHA256(secretKey, signedDate + method + path + query)
- Date format: `YYMMDDTHHMMSSZ` (UTC)
- See `CoupangCollector.generateSignature()` for implementation

**Domeggook API**:
- Form-based API using URL-encoded parameters
- Session-based authentication with `sId` token
- Order format: `market||deliveryWho||optionCode|qty||sellerMsg|requestMsg`
- Delivery info: `name|email|zipCode|addr1|addr2|phone|extraPhone|mall|customsCode`

### Data Storage Patterns
- **Mock Database**: Uses `Map` objects in memory for MVP (products, margins, keywords, registrations, automationJobs)
- **Seen IDs**: Persistent JSON file (`downloads/seen_ids.json`) to track processed orders
- **Mapping Config**: JSON file (`downloads/dome_mapping.json`) with structure:
  ```json
  {
    "byVendorItemId": { "vendorId": { "market": "supply", "itemNo": "123", "optionCode": "00" } },
    "byProductName": { "searchString": { "market": "supply", "itemNo": "456", "optionCode": "01" } },
    "byKeywords": [{ "includes": ["keyword1", "keyword2"], "market": "supply", "itemNo": "789", "optionCode": "02" }],
    "defaults": {}
  }
  ```
- **Automation Logs**: Timestamped JSON files in `downloads/automation_log_*.json`

### Configuration Files

- **.env.example**: Template for environment variables (copy to `.env`)
  - Required: `OPENAI_API_KEY`, `DISCORD_BOT_TOKEN`, `GOOGLE_SHEET_ID`
  - Coupang: `COUPANG_ACCESS_KEY`, `COUPANG_SECRET_KEY`, `COUPANG_VENDOR_ID`
  - Domeggook: `DOME_API_KEY`, `DOME_LOGIN_ID`, `DOME_SESSION`

- **docker-compose.yml**: Multi-service orchestration
  - `selpix-backend`: Main API server
  - `selpix-discord-bot`: Discord integration
  - `selpix-frontend`: Nginx-served frontend
  - `redis`: Optional caching layer
  - `prometheus` & `grafana`: Optional monitoring (use `--profile monitoring`)

### Error Handling Patterns
- Retry logic with exponential backoff for API calls (see `CoupangCollector.makeRequest()`)
- Only retry 5xx errors (server-side), not 4xx (client-side)
- Validation using express-validator for all POST endpoints
- Graceful degradation: automation continues even if individual orders fail

## Known Limitations (MVP Stage)

- **Mock implementations**: Product scraping, margin calculation, and keyword generation use mock data
- **No real GPT integration**: Keywords generated from predefined templates, not actual GPT API
- **In-memory storage**: All data lost on server restart (no database)
- **No authentication**: Auth endpoints return mock tokens
- **90% success rate**: Registration endpoint randomly fails 10% of the time for demo
- **Port conflict avoidance**: Server runs on 3001 instead of 3000 to avoid common conflicts

## File Structure Convention

The actual working directory is `프로토타입/v6/v6/` which contains:
- Core server files: `server.js`, `main.js`, `index.html`
- Automation modules: `coupang-collector.js`, `automation-routes.js`
- Integration: `discord-bot.js`, `proxy.js`
- Config: `package.json`, `.env.example`, `docker-compose.yml`
- Testing: `tests/api.test.js` (placeholder)
- Downloads: `downloads/` directory for logs and configs (gitignored)

## Development Notes

- Server handles port conflicts automatically (tries PORT+1 if EADDRINUSE)
- Frontend served as static files from Express (not separate server in dev mode)
- Rate limiting: 100 requests per 15 minutes per IP on `/api/*` routes
- Health check includes mock status of all services (always returns 'up')
- Discord bot registers slash commands on startup
- Cloudflare Worker proxy is deployment-specific (not used in local dev)

## New Integrated Features

### 1. Advanced Advertising Analytics (광고분석)
- **Excel Upload**: Upload `.xlsx` files with advertising data
- **Chart Visualization**: Chart.js-powered charts showing spend, revenue, and ROAS trends
- **Statistics Table**: Automatic calculation of CTR, conversion rate, and ROAS by ad zone (search/non-search/retargeting)
- **Data Processing**: Flexible header detection for various Excel formats
- **Implementation**: Frontend-only feature using XLSX.js and Chart.js
- **Access**: Navigate to "광고분석" menu in the frontend

### 2. Keyword Performance Analysis (키워드분석)
- **Excel Upload**: Upload keyword performance data (`.xlsx`)
- **Auto-Classification**: Separates good vs low-performing keywords based on:
  - Conversion rate < 1% → Low performer
  - ROAS < 100% → Low performer
- **Product Filtering**: Filter keywords by product ID
- **Export**: Download low-performing keywords as `.txt` file for ad exclusion
- **Implementation**: Frontend-only feature
- **Access**: Navigate to "키워드분석" menu

### 3. Product Price Inspection (상품검사)
- **Bulk Processing**: Upload Coupang Wing format Excel files
- **Recommended Pricing**: Auto-calculate 3 price tiers (1.7x, 2.0x, 2.2x wholesale price)
- **Sorting**: Sort by price or sales volume
- **Pagination**: 20 items per page
- **Batch Apply**: Apply pricing changes to Excel data in memory
- **Implementation**: Frontend-only feature
- **Access**: Navigate to "상품검사" menu

### 4. Wholesale Site Crawling (도매검색)
**Full-stack feature with Puppeteer-based web scraping**

#### Backend Component ([crawler.js](프로토타입/v6/v6/crawler.js))
- **Multi-site Support**: Domeggook, Coupang, 11st, Gmarket
- **Puppeteer Integration**: Headless browser automation
- **Cheerio Parsing**: Fast HTML parsing
- **Price Filtering**: Min/max price range support
- **Concurrent Crawling**: Multiple sites in parallel
- **Error Handling**: Per-site error tracking

#### API Endpoints
```javascript
// POST /api/v1/crawler/search
// Body: { keyword: string, sites: string[], minPrice?: number, maxPrice?: number }
// Returns: { products: Array, totalFound: number, errors: Array, duration: number }

// GET /api/v1/crawler/status
// Returns: { isRunning: boolean, browserActive: boolean }
```

#### Frontend Component
- **Search Interface**: Keyword input, price range, site selection
- **Real-time Results**: Product grid with images, prices, and direct links
- **Site Filtering**: Filter results by marketplace
- **Performance Metrics**: Shows crawl duration and error messages
- **Access**: Navigate to "도매검색" menu

#### Important Notes
- **Resource Intensive**: Puppeteer launches Chrome instances
- **Timeout**: 30-60 seconds per site depending on response time
- **Headless Mode**: Controlled by `PUPPETEER_HEADLESS` env var (default: true)
- **Rate Limiting**: Be mindful of target site rate limits
- **Anti-Bot Measures**: Some sites may block scrapers; uses realistic User-Agent

### Dependencies Added
```json
{
  "puppeteer": "^21.0.0",  // Web scraping
  "cheerio": "^1.0.0-rc.12"  // HTML parsing
}
```

Install new dependencies:
```bash
cd 프로토타입/v6/v6
npm install
```

## Frontend Navigation Structure

The integrated platform now has the following menu items:
1. **대시보드** (Dashboard) - Overview and statistics
2. **자동화** (Automation) - Order automation configuration
3. **이력** (History) - Registration history
4. **마진계산** (Margin Calculator) - Profit calculation tool
5. **광고분석** (Ad Analysis) - Advertising performance charts
6. **키워드분석** (Keyword Analysis) - Keyword performance evaluation
7. **상품검사** (Product Inspection) - Bulk pricing tool
8. **도매검색** (Wholesale Search) - Multi-site product search

All features are accessible from the main navigation bar and use Alpine.js for reactive state management.

## Data Flow for New Features

### Advertising Analytics Flow
```
[User] → Upload Excel → [Frontend XLSX Parser] → [Chart.js Visualization] → Display Stats & Charts
```

### Keyword Analysis Flow
```
[User] → Upload Excel → [Frontend Parser] → Calculate ROAS → [Classify Keywords] → Display Tables → [Optional] Download TXT
```

### Wholesale Search Flow
```
[User] → Enter Keyword → [Frontend] → POST /api/v1/crawler/search →
[crawler.js] → [Puppeteer] → [Target Sites] → [Cheerio Parse] →
Return Products → [Frontend Display Grid]
```

## Testing New Features

### Test Advertising Analytics
1. Navigate to "광고분석"
2. Upload test file: `A01410454_pa_daily_keyword_20250824_20250827.xlsx` (if available)
3. View generated charts and statistics tables

### Test Keyword Analysis
1. Navigate to "키워드분석"
2. Upload keyword performance Excel file
3. Review good/low-performing keyword tables
4. Download low-performing keywords as TXT

### Test Product Inspection
1. Navigate to "상품검사"
2. Upload Coupang Wing format Excel (with proper headers)
3. Input wholesale prices
4. View auto-calculated recommended prices
5. Apply pricing changes

### Test Wholesale Search
1. Navigate to "도매검색"
2. Enter keyword (e.g., "무지 티셔츠")
3. Select sites (recommend starting with Domeggook only)
4. Set price range (optional)
5. Click search
6. Wait 30-60 seconds for results
7. Filter by site if multiple selected
8. Click "상세보기" to open product pages

## Troubleshooting

### Puppeteer Issues
- **Error: Chromium not found**: Run `npm install puppeteer` again
- **Timeout errors**: Increase timeout in crawler.js or check network connection
- **ECONNREFUSED**: Target site may be blocking requests or down
- **Memory issues**: Close browser after crawling (handled automatically)

### Frontend Issues
- **XLSX not loading**: Check that XLSX.js CDN is accessible
- **Chart not rendering**: Verify Chart.js is loaded, check console for errors
- **Upload errors**: Ensure Excel file has correct format/headers

### API Issues
- **404 on /api/v1/crawler/search**: Ensure crawler.js is properly required in server.js
- **500 errors**: Check server logs for Puppeteer errors
- **Slow responses**: Crawling is intentionally slow (30-60s per site)
