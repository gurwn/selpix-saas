
import crypto from 'crypto';

interface CoupangConfig {
    accessKey?: string;
    secretKey?: string;
    vendorId?: string;
    userId?: string;
    baseUrl?: string;
}

export class CoupangService {
    private config: Required<CoupangConfig>;

    constructor(config: CoupangConfig = {}) {
        this.config = {
            accessKey: (config.accessKey || process.env.COUPANG_ACCESS_KEY || '').trim(),
            secretKey: (config.secretKey || process.env.COUPANG_SECRET_KEY || '').trim(),
            vendorId: (config.vendorId || process.env.COUPANG_VENDOR_ID || '').trim(),
            userId: (config.userId || process.env.COUPANG_VENDOR_USER_ID || '').trim(),
            baseUrl: 'https://api-gateway.coupang.com',
            ...config,
        };

        // removed strict validation to allow instantiation without keys (for mock fallback if needed)
    }

    // Generate Coupang CEA signature
    private generateSignature(method: string, path: string, query = '') {
        const signedDate = this.getSignedDate();
        const message = `${signedDate}${method}${path}${query}`;
        const signature = crypto
            .createHmac('sha256', this.config.secretKey)
            .update(message, 'utf-8') // Explicit encoding
            .digest('hex');

        return {
            Authorization: `CEA algorithm=HmacSHA256, access-key=${this.config.accessKey}, signed-date=${signedDate}, signature=${signature}`,
            'X-Coupang-Date': signedDate,
        };
    }

    private getSignedDate() {
        const now = new Date();
        // UTC date string format: YYMMDDThhmmssZ
        const year = now.getUTCFullYear().toString().slice(-2);
        const month = String(now.getUTCMonth() + 1).padStart(2, '0');
        const day = String(now.getUTCDate()).padStart(2, '0');
        const hour = String(now.getUTCHours()).padStart(2, '0');
        const minute = String(now.getUTCMinutes()).padStart(2, '0');
        const second = String(now.getUTCSeconds()).padStart(2, '0');

        return `${year}${month}${day}T${hour}${minute}${second}Z`;
    }

    // Get Outbound Shipping Centers (출고지 조회)
    async getOutboundShippingCenters() {
        // Use Marketplace OpenAPI V2 endpoint (Standard Open API)
        // Docs: /v2/providers/marketplace_openapi/apis/api/v2/vendor/shipping-place/outbound
        const path = `/v2/providers/marketplace_openapi/apis/api/v2/vendor/shipping-place/outbound`;

        try {
            // Required params: pageNum, pageSize
            const data = await this.makeRequest('GET', path, 'pageNum=1&pageSize=50');
            return data.content || [];
        } catch (error) {
            console.error('Failed to fetch outbound shipping centers:', error);
            return [];
        }
    }

    // Create Outbound Shipping Center (출고지 생성)
    async createOutboundShippingCenter(name: string, contact: string, address: string, detailAddress: string) {
        // Updated to V5 to match robust `shipping-places/route.ts` logic
        // Old: /v2/providers/openapi/apis/api/v4/vendors/${this.config.vendorId}/outbound-shipping-places
        const path = `/v2/providers/openapi/apis/api/v5/vendors/${this.config.vendorId}/outboundShippingCenters`;

        const body = {
            vendorId: this.config.vendorId,
            userId: this.config.userId,
            outboundShippingPlaceName: name,
            shippingPlacePhoneNumber: contact,
            global: false,
            usable: true,
            placeAddresses: [{
                addressType: 'JIBUN', // Defaulting to JIBUN
                countryCode: 'KR',
                companyContactNumber: contact,
                phoneNumber2: contact,
                returnAddress: address,
                returnZipCode: '00000', // Mock Zipcode
                returnAddressDetail: detailAddress
            }]
        };

        try {
            return await this.makeRequest('POST', path, '', body);
        } catch (error) {
            console.error('Failed to create outbound shipping center:', error);
            throw error;
        }
    }

    // Get Return Shipping Centers (반품지 조회)
    async getReturnShippingCenters() {
        // Use V5 OpenAPI endpoint (Search result confirms V5 for Return List)
        // Path: /v2/providers/openapi/apis/api/v5/vendors/{vendorId}/returnShippingCenters
        const path = `/v2/providers/openapi/apis/api/v5/vendors/${this.config.vendorId}/returnShippingCenters`;

        try {
            // V5 likely requires pageNum/pageSize like others
            const data = await this.makeRequest('GET', path, 'pageNum=1&pageSize=50');
            return data.content || [];
        } catch (error) {
            console.error('Failed to fetch return shipping centers:', error);
            return [];
        }
    }



    // Create seller product (상품 등록)
    async createSellerProduct(productPayload: any) {
        const path = '/v2/providers/seller_api/apis/api/v1/marketplace/seller-products';

        // Clean payload
        const body: any = {
            vendorId: this.config.vendorId,
            requested: false,
            saleStartedAt: productPayload?.saleStartedAt || null,
            saleEndedAt: productPayload?.saleEndedAt || null,
            ...productPayload,
        };

        // Remove null/undefined keys
        Object.keys(body).forEach((key) => {
            if (body[key] === null || typeof body[key] === 'undefined') {
                delete body[key];
            }
        });

        try {
            // Log payload for debugging
            console.log('Sending Product Payload:', JSON.stringify(body, null, 2));

            const response = await this.makeRequest('POST', path, '', body);
            return response;
        } catch (error: any) {
            console.error('Failed to create seller product:', error);
            throw error;
        }
    }

    // Predict Category from Product Name (POST)
    // Docs: https://api-gateway.coupang.com/v2/providers/openapi/apis/api/v1/categorization/predict
    async predictCategory(info: { productName: string, productDescription?: string, brand?: string, attributes?: any }) {
        if (!info.productName) return null;
        const path = '/v2/providers/openapi/apis/api/v1/categorization/predict';

        const body = {
            productName: info.productName,
            productDescription: info.productDescription,
            brand: info.brand,
            attributes: info.attributes,
            sellerSkuCode: 'TEMP-SKU-PREDICT' // Optional but good practice
        };

        try {
            // Using POST with Body
            const data = await this.makeRequest('POST', path, '', body);
            console.log('[CoupangService] Predict Response:', JSON.stringify(data, null, 2));
            return data.data; // Expected: { predictedCategoryId, predictedCategoryName, ... }
        } catch (error) {
            console.warn('Category Prediction Failed:', error);
            return null; // Fallback to manual
        }
    }

    // Make HTTP request using fetch
    private async makeRequest(method: string, path: string, query = '', body: any = null) {
        const url = `${this.config.baseUrl}${path}${query ? '?' + query : ''}`;
        const headers: any = this.generateSignature(method, path, query);

        const config: RequestInit = {
            method,
            headers,
        };

        if (body && ['POST', 'PATCH', 'PUT'].includes(method.toUpperCase())) {
            config.body = JSON.stringify(body);
            headers['Content-Type'] = 'application/json';
            headers['X-Requested-By'] = this.config.vendorId;
        }

        try {
            const res = await fetch(url, config);
            const text = await res.text();
            let data;

            try {
                data = text ? JSON.parse(text) : {};
            } catch (e) {
                console.error('Failed to parse response JSON:', text);
                throw new Error(`Invalid JSON response: ${text || '(empty)'}`);
            }

            if (!res.ok) {
                // Enhance error message
                const msg = data.message || JSON.stringify(data) || `HTTP error ${res.status}`;
                throw new Error(msg);
            }

            return data;
        } catch (error) {
            console.error(`Coupang API Request Failed [${method} ${path}]`, error);
            throw error;
        }
    }
}
