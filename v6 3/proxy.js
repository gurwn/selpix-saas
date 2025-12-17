// Cloudflare Worker Proxy for Selpix v1.5
// This handles HTTPS termination, routing, and GPT API proxying

const BACKEND_URL = 'https://your-gcp-vm-ip:3000'; // Replace with actual GCP VM URL
const OPENAI_API_URL = 'https://api.openai.com/v1';

// CORS headers
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
    'Access-Control-Max-Age': '86400',
};

// Security headers
const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
};

// Rate limiting storage
class RateLimiter {
    constructor() {
        this.requests = new Map();
    }
    
    isAllowed(ip, limit = 100, windowMs = 15 * 60 * 1000) {
        const now = Date.now();
        const windowStart = now - windowMs;
        
        if (!this.requests.has(ip)) {
            this.requests.set(ip, []);
        }
        
        const requests = this.requests.get(ip);
        
        // Remove old requests
        const validRequests = requests.filter(time => time > windowStart);
        this.requests.set(ip, validRequests);
        
        // Check if limit exceeded
        if (validRequests.length >= limit) {
            return false;
        }
        
        // Add current request
        validRequests.push(now);
        return true;
    }
}

const rateLimiter = new RateLimiter();

// Main request handler
addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
    const url = new URL(request.url);
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            status: 200,
            headers: corsHeaders
        });
    }
    
    // Rate limiting
    if (!rateLimiter.isAllowed(clientIP)) {
        return new Response(JSON.stringify({
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests. Please try again later.',
            timestamp: new Date().toISOString()
        }), {
            status: 429,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    }
    
    try {
        // Route requests
        if (url.pathname.startsWith('/api/gpt/')) {
            return await handleGPTRequest(request);
        } else if (url.pathname.startsWith('/api/')) {
            return await handleAPIRequest(request);
        } else {
            return await handleStaticRequest(request);
        }
    } catch (error) {
        console.error('Request handling error:', error);
        return new Response(JSON.stringify({
            error: 'PROXY_ERROR',
            message: 'An error occurred while processing your request',
            timestamp: new Date().toISOString()
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    }
}

// Handle GPT API requests
async function handleGPTRequest(request) {
    const url = new URL(request.url);
    const openaiPath = url.pathname.replace('/api/gpt', '');
    const openaiUrl = OPENAI_API_URL + openaiPath + url.search;
    
    // Validate API key
    const apiKey = OPENAI_API_KEY; // Set this in Cloudflare Worker environment variables
    if (!apiKey) {
        return new Response(JSON.stringify({
            error: 'CONFIGURATION_ERROR',
            message: 'OpenAI API key not configured'
        }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                ...corsHeaders
            }
        });
    }
    
    // Forward request to OpenAI
    const modifiedRequest = new Request(openaiUrl, {
        method: request.method,
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'User-Agent': 'Selpix-v1.5-Proxy'
        },
        body: request.method !== 'GET' ? await request.text() : undefined
    });
    
    const response = await fetch(modifiedRequest);
    const responseBody = await response.text();
    
    return new Response(responseBody, {
        status: response.status,
        headers: {
            'Content-Type': response.headers.get('Content-Type') || 'application/json',
            ...corsHeaders
        }
    });
}

// Handle API requests to backend
async function handleAPIRequest(request) {
    const url = new URL(request.url);
    const backendUrl = BACKEND_URL + url.pathname + url.search;
    
    // Forward request to backend
    const modifiedRequest = new Request(backendUrl, {
        method: request.method,
        headers: {
            'Content-Type': request.headers.get('Content-Type') || 'application/json',
            'Authorization': request.headers.get('Authorization') || '',
            'X-Forwarded-For': request.headers.get('CF-Connecting-IP') || '',
            'X-Real-IP': request.headers.get('CF-Connecting-IP') || '',
            'User-Agent': 'Selpix-v1.5-Proxy'
        },
        body: request.method !== 'GET' ? await request.text() : undefined
    });
    
    const response = await fetch(modifiedRequest);
    const responseBody = await response.text();
    
    return new Response(responseBody, {
        status: response.status,
        headers: {
            'Content-Type': response.headers.get('Content-Type') || 'application/json',
            ...corsHeaders,
            ...securityHeaders
        }
    });
}

// Handle static file requests (fallback)
async function handleStaticRequest(request) {
    return new Response(JSON.stringify({
        error: 'NOT_FOUND',
        message: 'Endpoint not found',
        timestamp: new Date().toISOString()
    }), {
        status: 404,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders
        }
    });
}

// GPT Keyword Generation Helper
async function generateKeywordsWithGPT(productInfo, count = 20) {
    const prompt = `
상품 정보를 바탕으로 한국 쿠팡 마켓플레이스에서 검색 노출을 극대화할 수 있는 키워드 ${count}개를 생성해주세요.

상품 정보:
- 이름: ${productInfo.name}
- 카테고리: ${productInfo.category}
- 설명: ${productInfo.description}

요구사항:
1. 한국어 키워드만 생성
2. 검색량이 높을 것으로 예상되는 키워드
3. 상품과 관련성이 높은 키워드
4. 특수문자 제외
5. 각 키워드는 1-3단어로 구성
6. 중복 제거

응답 형식: JSON 배열 ["키워드1", "키워드2", ...]
`;

    const response = await fetch(OPENAI_API_URL + '/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
                {
                    role: 'system',
                    content: '당신은 한국 이커머스 마케팅 전문가입니다. 상품 키워드 최적화에 특화되어 있습니다.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 500,
            temperature: 0.7
        })
    });
    
    const data = await response.json();
    
    if (data.choices && data.choices[0] && data.choices[0].message) {
        try {
            const keywords = JSON.parse(data.choices[0].message.content);
            return Array.isArray(keywords) ? keywords.slice(0, count) : [];
        } catch (error) {
            console.error('Failed to parse GPT response:', error);
            return [];
        }
    }
    
    return [];
}

// Export for testing
if (typeof module !== 'undefined') {
    module.exports = {
        handleRequest,
        generateKeywordsWithGPT,
        RateLimiter
    };
}