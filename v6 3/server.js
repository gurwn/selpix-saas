const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const automationRoutes = require('./automation-routes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001; // Changed to 3001 to avoid conflicts

// Middleware
app.use(helmet({
    contentSecurityPolicy: false // Disable for development
}));
app.use(cors({
    origin: '*',
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Ensure downloads directory exists for automation logs/mapping
const downloadsDir = path.join(__dirname, 'downloads');
fs.mkdirSync(downloadsDir, { recursive: true });

// Serve landing page first so root URL shows the marketing site
const landingPagePath = path.join(__dirname, '랜딩페이지.html');
app.get('/', (req, res) => {
    res.sendFile(landingPagePath);
});

// Static assets (index.html console, scripts, etc.)
app.use(express.static(__dirname));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);
// Automation routes (orders processing, approvals, mapping)
app.use('/api/v1', automationRoutes);

// Utility Functions
function generateId() {
    return crypto.randomUUID();
}

function validateUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

// Mock data storage
const mockData = {
    products: new Map(),
    margins: new Map(),
    keywords: new Map(),
    registrations: new Map(),
    automationJobs: new Map()
};

// Mock scraping function with enhanced data
async function scrapeProduct(url) {
    // Simulate scraping delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock product data with more realistic information
    const productNames = [
        '무선 블루투스 이어폰 프리미엄',
        '스마트폰 케이스 투명 실리콘',
        'USB-C 고속 충전 케이블',
        '휴대용 보조배터리 20000mAh',
        '무선 충전패드 고속충전',
        'LED 데스크 램프 조명',
        '키보드 마우스 세트 무선',
        '모니터 받침대 각도조절',
        '노트북 거치대 알루미늄',
        '스마트워치 실리콘 밴드'
    ];
    
    const categories = [
        '전자제품/액세서리',
        '컴퓨터/주변기기',
        '휴대폰/액세서리',
        '생활용품',
        '사무용품'
    ];
    
    const randomName = productNames[Math.floor(Math.random() * productNames.length)];
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const basePrice = Math.floor(Math.random() * 50000) + 5000; // 5,000 ~ 55,000원
    
    return {
        name: randomName,
        wholesalePrice: basePrice,
        description: `${randomName}의 상세 설명입니다. 고품질 소재로 제작되어 내구성이 뛰어나며, 다양한 용도로 활용 가능합니다.`,
        category: randomCategory,
        image: `https://via.placeholder.com/300x300?text=${encodeURIComponent(randomName)}`,
        specifications: {
            '브랜드': '테스트브랜드',
            '원산지': '대한민국',
            '보증기간': '1년',
            '색상': '블랙/화이트',
            '소재': '고급 플라스틱/실리콘'
        }
    };
}

// Enhanced margin calculation with more realistic formulas
function calculateMargin(params) {
    const {
        wholesalePrice,
        exchangeRate = 1350,
        shippingCost = 3000,
        storageFee = 0,
        commissionRate = 8.5,
        targetMarginRate = 30,
        advertisingCost = 0,
        roasTarget = 500
    } = params;

    const normalizedWholesale = Number(wholesalePrice) || 0;
    const normalizedExchangeRate = Number(exchangeRate) || 0;
    const normalizedShipping = Number(shippingCost) || 0;
    const normalizedStorage = Number(storageFee) || 0;
    const normalizedCommission = Number(commissionRate) || 0;
    const normalizedTargetMargin = Number(targetMarginRate) || 0;
    const normalizedAdvertising = Number(advertisingCost) || 0;
    const baseCost = normalizedWholesale;

    const packagingCost = 0;
    const totalCost = baseCost + normalizedShipping + normalizedStorage + packagingCost;

    // Calculate recommended price with market competitiveness factor
    const marginMultiplier = 1 + (normalizedTargetMargin / 100);
    const priceBeforeCommission = totalCost * marginMultiplier;
    const recommendedPrice = priceBeforeCommission / (1 - (normalizedCommission / 100));

    // Add competitive pricing suggestions
    const competitivePrices = [
        Math.round(recommendedPrice * 0.95), // 5% 할인가
        Math.round(recommendedPrice),        // 권장가
        Math.round(recommendedPrice * 1.05)  // 5% 프리미엄가
    ];

    // Calculate actual margin
    const revenue = recommendedPrice * (1 - (normalizedCommission / 100));
    const marginAmount = revenue - totalCost - normalizedAdvertising;
    const marginRate = (marginAmount / revenue) * 100;

    // Calculate ROAS
    const advertisingROAS = normalizedAdvertising > 0 ? (marginAmount / normalizedAdvertising) * 100 : 0;

    return {
        reportId: generateId(),
        wholesalePrice: normalizedWholesale,
        totalCost: Math.round(totalCost),
        recommendedPrice: Math.round(recommendedPrice),
        competitivePrices: competitivePrices,
        marginAmount: Math.round(marginAmount),
        marginRate: Math.round(marginRate * 100) / 100,
        advertisingROAS: Math.round(advertisingROAS * 100) / 100,
        createdAt: new Date().toISOString(),
        breakdown: {
            wholesalePrice: Math.round(baseCost),
            exchangeRate: normalizedExchangeRate,
            shippingCost: normalizedShipping,
            storageFee: normalizedStorage,
            packagingCost,
            commission: recommendedPrice * (normalizedCommission / 100),
            advertisingCost: normalizedAdvertising
        }
    };
}

// Enhanced keyword generation with more realistic Korean keywords
async function generateKeywords(productInfo, count = 20) {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const productName = productInfo.name || '상품';
    const category = productInfo.category || '제품';
    
    // Base keywords from product info
    const baseKeywords = [
        productName,
        category.split('/')[0], // Main category
        '인기상품', '베스트셀러', '추천상품', '할인특가', '신상품', '프리미엄',
        '고품질', '브랜드', '정품', '국내배송', '빠른배송', '무료배송',
        '사은품증정', '이벤트', '한정판매', '최저가', '당일발송', '리뷰좋은',
        '실용적인', '편리한', '내구성좋은', '가성비', '합리적인', '경제적인'
    ];
    
    // Category-specific keywords
    const categoryKeywords = {
        '전자제품': ['스마트', '디지털', '하이테크', '최신', '무선', '충전', 'LED', 'USB'],
        '컴퓨터': ['PC', '노트북', '게이밍', '오피스', '업무용', '학습용', '고성능'],
        '휴대폰': ['스마트폰', '아이폰', '갤럭시', '케이스', '액세서리', '보호필름'],
        '생활용품': ['실생활', '일상', '홈', '가정용', '편의', '실용'],
        '사무용품': ['오피스', '업무', '사무실', '학교', '학습', '문구']
    };
    
    // Add category-specific keywords
    for (const [cat, keywords] of Object.entries(categoryKeywords)) {
        if (category.includes(cat)) {
            baseKeywords.push(...keywords);
        }
    }
    
    // Generate combination keywords
    const modifiers = ['인기', '베스트', '추천', '할인', '특가', '프리미엄', '고급'];
    const combinedKeywords = [];
    
    for (const modifier of modifiers) {
        combinedKeywords.push(`${modifier} ${productName.split(' ')[0]}`);
        if (category) {
            combinedKeywords.push(`${modifier} ${category.split('/')[0]}`);
        }
    }
    
    // Combine all keywords and remove duplicates
    const allKeywords = [...new Set([...baseKeywords, ...combinedKeywords])];
    
    // Return requested count
    return allKeywords.slice(0, count);
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Health Check
app.get('/api/v1/system/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            database: 'up',
            puppeteer: 'up',
            gpt_api: 'up',
            coupang_api: 'up',
            automation_engine: 'up'
        },
        uptime: process.uptime(),
        version: '1.5.0'
    });
});

// Authentication (Mock)
app.post('/api/v1/auth/login', [
    body('username').notEmpty(),
    body('password').notEmpty(),
    body('platform').isIn(['coupang'])
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const mockToken = Buffer.from(JSON.stringify({
        userId: generateId(),
        username: req.body.username,
        platform: req.body.platform,
        exp: Date.now() + (24 * 60 * 60 * 1000)
    })).toString('base64');
    
    res.json({
        success: true,
        sessionId: generateId(),
        accessToken: mockToken,
        refreshToken: generateId(),
        expiresAt: new Date(Date.now() + (24 * 60 * 60 * 1000)).toISOString(),
        user: {
            userId: generateId(),
            username: req.body.username,
            email: `${req.body.username}@example.com`,
            role: 'USER',
            permissions: ['read', 'write', 'automation']
        }
    });
});

// Product Analysis
app.post('/api/v1/products/analyze', [
    body('productUrl').isURL()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const productInfo = await scrapeProduct(req.body.productUrl);
        productInfo.productId = generateId();
        productInfo.wholesaleUrl = req.body.productUrl;
        
        // Store in mock database
        mockData.products.set(productInfo.productId, productInfo);
        
        res.json({
            productId: productInfo.productId,
            productInfo,
            scrapingStatus: 'SUCCESS',
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Product analysis failed:', error);
        res.status(422).json({
            error: 'SCRAPING_FAILED',
            message: error.message
        });
    }
});

// Margin Calculation
app.post('/api/v1/margin/calculate', [
    body('productId').isUUID(),
    body('wholesalePrice').isNumeric(),
    body('targetMarginRate').isNumeric()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const marginReport = calculateMargin(req.body);
        marginReport.productId = req.body.productId;
        
        // Store in mock database
        mockData.margins.set(marginReport.reportId, marginReport);
        
        res.json(marginReport);
        
    } catch (error) {
        console.error('Margin calculation failed:', error);
        res.status(500).json({
            error: 'CALCULATION_FAILED',
            message: error.message
        });
    }
});

// Keyword Generation
app.post('/api/v1/keywords/generate', [
    body('productInfo').isObject(),
    body('count').optional().isInt({ min: 5, max: 50 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const keywords = await generateKeywords(req.body.productInfo, req.body.count || 20);
        
        // Generate search links
        const searchLinks = {};
        keywords.forEach(keyword => {
            searchLinks[keyword] = `https://www.coupang.com/np/search?q=${encodeURIComponent(keyword)}`;
        });
        
        const response = {
            productId: req.body.productInfo.productId || generateId(),
            keywords,
            searchLinks,
            generatedAt: new Date().toISOString(),
            source: 'AI'
        };
        
        // Store in mock database
        mockData.keywords.set(response.productId, response);
        
        res.json(response);
        
    } catch (error) {
        console.error('Keyword generation failed:', error);
        res.status(503).json({
            error: 'AI_SERVICE_UNAVAILABLE',
            message: error.message
        });
    }
});

// Product Registration (Enhanced Mock)
app.post('/api/v1/registration/register', [
    body('productData').isObject()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const registrationId = generateId();
        const platformProductId = 'CP' + Date.now();
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Mock success (90% success rate for demo)
        const success = Math.random() > 0.1;
        const status = success ? 'SUCCESS' : 'FAILED';
        
        const response = {
            success,
            registrationId,
            platformProductId: success ? platformProductId : null,
            productUrl: success ? `https://www.coupang.com/vp/products/${platformProductId}` : null,
            status,
            message: success ? '상품이 성공적으로 등록되었습니다.' : '등록 중 오류가 발생했습니다.',
            timestamp: new Date().toISOString(),
            estimatedLiveDate: success ? new Date(Date.now() + (2 * 60 * 60 * 1000)).toISOString() : null // 2 hours later
        };
        
        // Store in mock database
        mockData.registrations.set(registrationId, {
            ...response,
            productData: req.body.productData
        });
        
        res.json(response);
        
    } catch (error) {
        console.error('Registration failed:', error);
        res.status(422).json({
            error: 'REGISTRATION_FAILED',
            message: error.message
        });
    }
});

// Get registration status
app.get('/api/v1/registration/status/:registrationId', (req, res) => {
    const { registrationId } = req.params;
    const registration = mockData.registrations.get(registrationId);
    
    if (!registration) {
        return res.status(404).json({
            error: 'REGISTRATION_NOT_FOUND',
            message: 'Registration ID not found'
        });
    }
    
    res.json({
        registrationId,
        status: registration.status,
        platformProductId: registration.platformProductId,
        productUrl: registration.productUrl,
        message: registration.message,
        updatedAt: registration.timestamp
    });
});

// Get product history
app.get('/api/v1/history/products', (req, res) => {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;
    
    let products = Array.from(mockData.registrations.values());
    
    if (status) {
        products = products.filter(p => p.status === status);
    }
    
    const paginatedProducts = products.slice(offset, offset + parseInt(limit));
    
    res.json({
        products: paginatedProducts.map(p => ({
            productId: p.productData?.productInfo?.productId || generateId(),
            name: p.productData?.productInfo?.name || 'Unknown Product',
            status: p.status,
            createdAt: p.timestamp,
            lastUpdated: p.timestamp,
            registrationCount: 1
        })),
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: products.length,
            totalPages: Math.ceil(products.length / limit)
        }
    });
});

// ===================================
// Crawling API (도매검색 통합)
// ===================================
const crawler = require('./crawler');

// POST /api/v1/crawler/search - 도매 사이트 크롤링
app.post('/api/v1/crawler/search', [
    body('keyword').notEmpty().withMessage('Keyword is required'),
    body('sites').optional().isArray().withMessage('Sites must be an array'),
    body('minPrice').optional().isInt({ min: 0 }).withMessage('minPrice must be >= 0'),
    body('maxPrice').optional().isInt({ min: 0 }).withMessage('maxPrice must be >= 0')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'VALIDATION_ERROR',
                details: errors.array()
            });
        }

        const { keyword, sites = ['domeggook'], minPrice = 0, maxPrice = 1000000 } = req.body;

        console.log(`🔍 Crawling request: keyword="${keyword}", sites=${sites.join(',')}, price=${minPrice}-${maxPrice}`);

        const result = await crawler.crawlAllSites(keyword, minPrice, maxPrice, sites);

        res.json({
            success: true,
            data: result,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Crawling API error:', error);
        res.status(500).json({
            error: 'CRAWL_ERROR',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

app.post('/api/v1/crawler/detail', [
    body('sourceUrl').isURL().withMessage('sourceUrl is required and must be a valid URL'),
    body('site').optional().isString(),
    body('name').optional().isString(),
    body('price').optional().isNumeric()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                error: 'VALIDATION_ERROR',
                details: errors.array()
            });
        }

        const detail = await crawler.enrichDomeggookProduct(req.body);

        res.json({
            success: true,
            data: detail,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Crawler detail error:', error);
        res.status(500).json({
            error: 'CRAWL_DETAIL_ERROR',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// GET /api/v1/crawler/status - 크롤러 상태 확인
app.get('/api/v1/crawler/status', (req, res) => {
    try {
        const status = crawler.getStatus();
        res.json({
            success: true,
            data: status,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: 'STATUS_ERROR',
            message: error.message
        });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
        timestamp: new Date().toISOString(),
        requestId: generateId()
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        error: 'NOT_FOUND',
        message: 'Endpoint not found',
        timestamp: new Date().toISOString()
    });
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    process.exit(0);
});

// Check if port is available before starting
const server = app.listen(PORT, (err) => {
    if (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
    console.log(`Selpix v1.5 API Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Frontend URL: http://localhost:${PORT}`);
    console.log(`Health Check: http://localhost:${PORT}/api/v1/system/health`);
});

// Handle server errors
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use. Trying port ${PORT + 1}...`);
        server.listen(PORT + 1);
    } else {
        console.error('Server error:', err);
        process.exit(1);
    }
});

module.exports = app;
