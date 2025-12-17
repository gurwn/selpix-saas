// Coupang Order Collection and Automated Processing Module
// Based on the Python auto.py script for Selpix v1.5

const crypto = require('crypto');
const axios = require('axios');

class CoupangCollector {
    constructor(config = {}) {
        this.config = {
            accessKey: config.accessKey || process.env.COUPANG_ACCESS_KEY,
            secretKey: config.secretKey || process.env.COUPANG_SECRET_KEY,
            vendorId: config.vendorId || process.env.COUPANG_VENDOR_ID,
            baseUrl: 'https://api-gateway.coupang.com',
            ...config
        };
        
        this.validateConfig();
    }
    
    validateConfig() {
        const required = ['accessKey', 'secretKey', 'vendorId'];
        for (const key of required) {
            if (!this.config[key]) {
                throw new Error(`Missing required config: ${key}`);
            }
        }
    }
    
    // Generate Coupang CEA signature
    generateSignature(method, path, query = '') {
        const signedDate = this.getSignedDate();
        const message = `${signedDate}${method}${path}${query}`;
        const signature = crypto
            .createHmac('sha256', this.config.secretKey)
            .update(message)
            .digest('hex');
        
        return {
            'Authorization': `CEA algorithm=HmacSHA256, access-key=${this.config.accessKey}, signed-date=${signedDate}, signature=${signature}`,
            'Content-Type': 'application/json;charset=UTF-8',
            'X-Requested-By': this.config.vendorId
        };
    }
    
    getSignedDate() {
        const now = new Date();
        const year = now.getUTCFullYear().toString().slice(-2);
        const month = String(now.getUTCMonth() + 1).padStart(2, '0');
        const day = String(now.getUTCDate()).padStart(2, '0');
        const hour = String(now.getUTCHours()).padStart(2, '0');
        const minute = String(now.getUTCMinutes()).padStart(2, '0');
        const second = String(now.getUTCSeconds()).padStart(2, '0');
        
        return `${year}${month}${day}T${hour}${minute}${second}Z`;
    }
    
    // Fetch orders from Coupang API
    async fetchOrders(options = {}) {
        const {
            status = 'ACCEPT',
            hoursBack = 24,
            maxPerPage = 50
        } = options;
        
        const now = new Date();
        const fromDate = new Date(now.getTime() - (hoursBack * 60 * 60 * 1000));
        
        const params = {
            createdAtFrom: this.formatKSTDate(fromDate),
            createdAtTo: this.formatKSTDate(now),
            status: status,
            maxPerPage: maxPerPage,
            searchType: 'timeFrame'
        };
        
        const path = `/v2/providers/openapi/apis/api/v5/vendors/${this.config.vendorId}/ordersheets`;
        const query = new URLSearchParams(params).toString();
        
        try {
            const response = await this.makeRequest('GET', path, query);
            return response.data || [];
        } catch (error) {
            console.error('Failed to fetch orders:', error.message);
            throw error;
        }
    }
    
    // Acknowledge shipment boxes (상품준비중 처리)
    async acknowledgeShipmentBoxes(shipmentBoxIds) {
        const path = `/v2/providers/openapi/apis/api/v4/vendors/${this.config.vendorId}/ordersheets/acknowledgement`;
        const body = {
            vendorId: this.config.vendorId,
            shipmentBoxIds: shipmentBoxIds.map(id => parseInt(id))
        };
        
        try {
            const response = await this.makeRequest('PATCH', path, '', body);
            return response;
        } catch (error) {
            console.error('Failed to acknowledge shipment boxes:', error.message);
            throw error;
        }
    }

    // Create seller product (상품 등록)
    async createSellerProduct(productPayload) {
        const path = '/v2/providers/seller_api/apis/api/v1/marketplace/seller-products';
        const body = {
            vendorId: this.config.vendorId,
            requested: false,
            saleStartedAt: productPayload?.saleStartedAt || null,
            saleEndedAt: productPayload?.saleEndedAt || null,
            ...productPayload
        };

        // Remove nulls to avoid schema errors
        Object.keys(body).forEach(key => {
            if (body[key] === null || typeof body[key] === 'undefined') {
                delete body[key];
            }
        });

        try {
            const response = await this.makeRequest('POST', path, '', body);
            return response;
        } catch (error) {
            const msg = error?.response?.data || error.message || 'Unknown error';
            console.error('Failed to create seller product:', msg);
            throw error;
        }
    }
    
    // Make HTTP request with retry logic
    async makeRequest(method, path, query = '', body = null, maxRetries = 3) {
        const url = `${this.config.baseUrl}${path}${query ? '?' + query : ''}`;
        const headers = this.generateSignature(method, path, query);
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const config = {
                    method: method.toLowerCase(),
                    url: url,
                    headers: headers,
                    timeout: 30000
                };
                
                if (body && ['post', 'patch', 'put'].includes(method.toLowerCase())) {
                    config.data = body;
                }
                
                const response = await axios(config);
                return response.data;
            } catch (error) {
                if (attempt === maxRetries || !this.isRetryableError(error)) {
                    throw error;
                }
                
                // Exponential backoff
                await this.sleep(Math.pow(2, attempt) * 1000);
            }
        }
    }
    
    isRetryableError(error) {
        if (!error.response) return true;
        return error.response.status >= 500;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    formatKSTDate(date) {
        const kstOffset = 9 * 60; // KST is UTC+9
        const kstDate = new Date(date.getTime() + (kstOffset * 60 * 1000));
        return kstDate.toISOString().replace('Z', '+09:00');
    }
    
    // Flatten order data for processing
    flattenOrders(orders) {
        const flattened = [];
        
        for (const order of orders) {
            const receiver = order.receiver || {};
            const orderer = order.orderer || {};
            const items = order.orderItems || [];
            
            const baseData = {
                shipmentBoxId: order.shipmentBoxId,
                orderId: order.orderId,
                status: order.status,
                orderedAt: order.orderedAt,
                paidAt: order.paidAt,
                confirmDate: order.confirmDate,
                recipient: receiver.name || '',
                phone: receiver.receiverNumber || receiver.safeNumber || '',
                addr1: receiver.addr1 || '',
                addr2: receiver.addr2 || '',
                zipCode: receiver.zipcode || receiver.zipCode || '',
                deliveryMemo: order.deliveryMemo || receiver.deliveryMemo || '',
                ordererName: orderer.name || '',
                ordererEmail: orderer.email || '',
                ordererPhone: orderer.phone || orderer.ordererNumber || '',
                personalCustomsCode: order.personalCustomsClearanceCode || receiver.personalCustomsClearanceCode || ''
            };
            
            if (items.length === 0) {
                flattened.push({
                    ...baseData,
                    itemName: '',
                    optionName: '',
                    qty: 0,
                    salesPrice: 0,
                    orderPrice: 0
                });
            } else {
                for (const item of items) {
                    flattened.push({
                        ...baseData,
                        vendorItemId: item.vendorItemId || '',
                        productId: order.productId || '',
                        itemName: item.vendorItemName || item.productName || '',
                        optionName: item.sellerProductItemName || item.firstSellerProductItemName || '',
                        qty: item.shippingCount || item.orderQty || 0,
                        salesPrice: this.extractPrice(item.salesPrice),
                        orderPrice: this.extractPrice(item.orderPrice),
                        discountPrice: this.extractPrice(item.discountPrice)
                    });
                }
            }
        }
        
        return flattened;
    }
    
    extractPrice(priceObj) {
        if (!priceObj || typeof priceObj !== 'object') return 0;
        return parseInt(priceObj.units || 0);
    }
    
    // Group orders by shipmentBoxId for processing
    groupOrdersByBox(flatOrders) {
        const grouped = {};
        
        for (const order of flatOrders) {
            const key = order.shipmentBoxId || order.orderId || '';
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(order);
        }
        
        return grouped;
    }
    
    // Generate order summary for notifications
    generateOrderSummary(orderGroup) {
        if (!orderGroup || orderGroup.length === 0) return '';
        
        const first = orderGroup[0];
        const lines = [
            `[쿠팡 주문 알림] 상태=${first.status}`,
            `수취인: ${first.recipient} (${first.phone})`,
            `주소: ${first.addr1} ${first.addr2}`.trim(),
            '상품:'
        ];
        
        for (const order of orderGroup.slice(0, 10)) {
            lines.push(`- ${order.itemName} / ${order.optionName} x${order.qty}`);
        }
        
        if (orderGroup.length > 10) {
            lines.push(`... 외 ${orderGroup.length - 10}개`);
        }
        
        if (first.deliveryMemo) {
            lines.push(`메모: ${first.deliveryMemo}`);
        }
        
        lines.push(`shipmentBoxId=${first.shipmentBoxId} / orderId=${first.orderId}`);
        
        return lines.join('\n');
    }
}

// Domeggook (도매꾹) Integration Module
class DomeggookIntegrator {
    constructor(config = {}) {
        this.config = {
            apiKey: config.apiKey || process.env.DOME_API_KEY,
            loginId: config.loginId || process.env.DOME_LOGIN_ID,
            sessionId: config.sessionId || process.env.DOME_SESSION,
            baseUrl: 'https://domeggook.com/ssl/api/',
            version: '4.0',
            ...config
        };
    }
    
    // Login to Domeggook and get session ID
    async login(password) {
        const formData = new FormData();
        formData.append('aid', this.config.apiKey);
        formData.append('ver', '1.0');
        formData.append('mode', 'setLogin');
        formData.append('id', this.config.loginId);
        formData.append('pw', password);
        formData.append('oe', 'utf-8');
        formData.append('loginKeep', 'off');
        formData.append('userAgent', 'Selpix-Coupang-Collector/1.0');
        formData.append('ip', '127.0.0.1');
        formData.append('device', 'thirdparty');
        
        try {
            const response = await axios.post(this.config.baseUrl, formData, {
                timeout: 30000
            });
            
            const text = response.data;
            const sidMatch = text.match(/<sId>(.*?)<\/sId>/) || text.match(/&lt;sId&gt;(.*?)&lt;\/sId&gt;/);
            
            if (sidMatch && sidMatch[1]) {
                this.config.sessionId = sidMatch[1].trim();
                return this.config.sessionId;
            }
            
            throw new Error('Failed to extract session ID from login response');
        } catch (error) {
            console.error('Domeggook login failed:', error.message);
            throw error;
        }
    }
    
    // Place order in Domeggook
    async placeOrder(orderData, mapping) {
        const { itemsKv, deliInfo } = this.prepareOrderData(orderData, mapping);
        
        if (Object.keys(itemsKv).length === 0) {
            console.log('No mapped items found for order');
            return { result: 'NO_ITEMS', message: 'No mapped items found' };
        }
        
        const formData = new FormData();
        formData.append('aid', this.config.apiKey);
        formData.append('ver', '4.3');
        formData.append('mode', 'setOrder');
        formData.append('id', this.config.loginId);
        formData.append('sId', this.config.sessionId);
        formData.append('ie', 'utf-8');
        formData.append('oe', 'utf-8');
        formData.append('om', 'xml');
        formData.append('alliance', 'Selpix');
        formData.append('receipt', '0');
        formData.append('notify', 'true');
        formData.append('deliinfo', deliInfo);
        
        // Add items
        for (const [itemNo, itemValue] of Object.entries(itemsKv)) {
            formData.append(`item[${itemNo}]`, itemValue);
        }
        
        try {
            const response = await axios.post(this.config.baseUrl, formData, {
                timeout: 40000
            });
            
            return this.parseOrderResponse(response.data);
        } catch (error) {
            console.error('Domeggook order placement failed:', error.message);
            throw error;
        }
    }
    
    prepareOrderData(orderGroup, mapping) {
        if (!orderGroup || orderGroup.length === 0) {
            return { itemsKv: {}, deliInfo: '' };
        }
        
        const first = orderGroup[0];
        const deliInfo = this.buildDeliveryInfo(first);
        const itemsKv = {};
        
        for (const order of orderGroup) {
            const mappedItem = this.findMapping(order, mapping);
            if (!mappedItem) {
                console.log(`No mapping found for item: ${order.itemName}`);
                continue;
            }
            
            const { market, itemNo, optionCode } = mappedItem;
            const qty = Math.max(1, parseInt(order.qty) || 1);
            const deliveryWho = 'P'; // 선결제
            const sellerMsg = order.deliveryMemo || '';
            const requestMsg = '';
            
            const optPart = `${optionCode}|${qty}`;
            const value = `${market}||${deliveryWho}||${optPart}||${sellerMsg}|${requestMsg}`;
            
            if (itemsKv[itemNo]) {
                // Combine quantities for same item
                const parts = itemsKv[itemNo].split('||');
                const optionParts = parts[2].split('|');
                if (optionParts[0] === optionCode) {
                    const prevQty = parseInt(optionParts[1]) || 0;
                    optionParts[1] = String(prevQty + qty);
                    parts[2] = optionParts.join('|');
                    itemsKv[itemNo] = parts.join('||');
                } else {
                    parts[2] = parts[2] + '|' + optPart;
                    itemsKv[itemNo] = parts.join('||');
                }
            } else {
                itemsKv[itemNo] = value;
            }
        }
        
        return { itemsKv, deliInfo };
    }
    
    buildDeliveryInfo(order) {
        const name = order.recipient || '';
        const email = order.ordererEmail || 'no-reply@selpix.app';
        
        // Sanitize zip code to 5 digits
        let zipCode = String(order.zipCode || '').replace(/\D/g, '');
        if (zipCode.length !== 5) {
            zipCode = zipCode.length > 5 ? zipCode.slice(0, 5) : '00000';
        }
        
        const addr1 = order.addr1 || '';
        const addr2 = order.addr2 || '';
        const phone = this.normalizePhone(order.phone || '');
        const extraPhone = this.normalizePhone(order.ordererPhone || '');
        const mall = 'Selpix';
        const customsCode = order.personalCustomsCode || '';
        
        return [name, email, zipCode, addr1, addr2, phone, extraPhone, mall, customsCode].join('|');
    }
    
    normalizePhone(phone) {
        if (!phone) return '';
        
        const digits = phone.replace(/\D/g, '');
        
        if (digits.length === 11 && digits.startsWith('010')) {
            return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
        } else if (digits.length === 10) {
            return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
        }
        
        return phone;
    }
    
    findMapping(order, mapping) {
        if (!mapping) return null;
        
        const { byVendorItemId = {}, byProductName = {}, byKeywords = [] } = mapping;
        
        // Try vendor item ID first
        const vid = String(order.vendorItemId || '').trim();
        if (vid && byVendorItemId[vid]) {
            const m = byVendorItemId[vid];
            return {
                market: m.market || 'supply',
                itemNo: String(m.itemNo),
                optionCode: String(m.optionCode || '00')
            };
        }
        
        // Try product name matching
        const itemName = order.itemName || '';
        for (const [key, m] of Object.entries(byProductName)) {
            if (key && itemName.includes(key)) {
                return {
                    market: m.market || 'supply',
                    itemNo: String(m.itemNo),
                    optionCode: String(m.optionCode || '00')
                };
            }
        }
        
        // Try keyword matching
        const searchText = `${itemName} ${order.optionName || ''}`.toLowerCase();
        for (const rule of byKeywords) {
            const includes = rule.includes || [];
            if (includes.length > 0 && includes.every(word => searchText.includes(word.toLowerCase()))) {
                return {
                    market: rule.market || 'supply',
                    itemNo: String(rule.itemNo),
                    optionCode: String(rule.optionCode || '00')
                };
            }
        }
        
        return null;
    }
    
    parseOrderResponse(responseText) {
        const result = responseText.includes('<result>SUCCESS</result>') || 
                      responseText.includes('&lt;result&gt;SUCCESS&lt;/result&gt;') ? 
                      'SUCCESS' : 'FAILED';
        
        const orders = [];
        const orderMatches = responseText.match(/<order>(.*?)<\/order>/g) || [];
        
        for (const orderMatch of orderMatches) {
            const orderNo = this.extractXmlTag(orderMatch, 'orderNo');
            const itemNo = this.extractXmlTag(orderMatch, 'itemNo');
            const getName = this.extractXmlTag(orderMatch, 'getName');
            
            orders.push({ orderNo, itemNo, getName });
        }
        
        return {
            result,
            orders,
            raw: responseText
        };
    }
    
    extractXmlTag(text, tagName) {
        const match = text.match(new RegExp(`<${tagName}>(.*?)</${tagName}>`));
        return match ? match[1].trim() : '';
    }
}

// Main automation controller
class SelpixAutomation {
    constructor(config = {}) {
        this.coupang = new CoupangCollector(config.coupang);
        this.domeggook = new DomeggookIntegrator(config.domeggook);
        this.mapping = config.mapping || {};
        this.seenIds = new Set();
        this.loadSeenIds();
    }
    
    loadSeenIds() {
        try {
            const fs = require('fs');
            const path = require('path');
            const seenPath = path.join(__dirname, 'downloads', 'seen_ids.json');
            
            if (fs.existsSync(seenPath)) {
                const data = JSON.parse(fs.readFileSync(seenPath, 'utf8'));
                this.seenIds = new Set(data);
            }
        } catch (error) {
            console.error('Failed to load seen IDs:', error.message);
        }
    }
    
    saveSeenIds() {
        try {
            const fs = require('fs');
            const path = require('path');
            const downloadDir = path.join(__dirname, 'downloads');
            
            if (!fs.existsSync(downloadDir)) {
                fs.mkdirSync(downloadDir, { recursive: true });
            }
            
            const seenPath = path.join(downloadDir, 'seen_ids.json');
            fs.writeFileSync(seenPath, JSON.stringify([...this.seenIds], null, 2));
        } catch (error) {
            console.error('Failed to save seen IDs:', error.message);
        }
    }
    
    // Main automation workflow
    async processOrders(options = {}) {
        try {
            console.log('Starting order processing...');
            
            // Fetch orders from Coupang
            const orders = await this.coupang.fetchOrders(options);
            console.log(`Fetched ${orders.length} orders from Coupang`);
            
            if (orders.length === 0) {
                return { processed: 0, newOrders: 0 };
            }
            
            // Flatten and group orders
            const flatOrders = this.coupang.flattenOrders(orders);
            const groupedOrders = this.coupang.groupOrdersByBox(flatOrders);
            
            // Find new orders
            const currentIds = new Set(Object.keys(groupedOrders));
            const newIds = [...currentIds].filter(id => !this.seenIds.has(id));
            
            console.log(`Found ${newIds.length} new orders out of ${currentIds.size} total`);
            
            if (newIds.length === 0) {
                return { processed: 0, newOrders: 0 };
            }
            
            // Process new orders
            let processedCount = 0;
            const results = [];
            
            for (const orderId of newIds) {
                try {
                    const orderGroup = groupedOrders[orderId];
                    const result = await this.processOrderGroup(orderId, orderGroup);
                    results.push(result);
                    
                    if (result.success) {
                        processedCount++;
                    }
                } catch (error) {
                    console.error(`Failed to process order ${orderId}:`, error.message);
                    results.push({
                        orderId,
                        success: false,
                        error: error.message
                    });
                }
            }
            
            // Update seen IDs
            for (const id of currentIds) {
                this.seenIds.add(id);
            }
            this.saveSeenIds();
            
            return {
                processed: processedCount,
                newOrders: newIds.length,
                results: results
            };
            
        } catch (error) {
            console.error('Order processing failed:', error.message);
            throw error;
        }
    }
    
    async processOrderGroup(orderId, orderGroup) {
        try {
            // Place order in Domeggook
            const orderResult = await this.domeggook.placeOrder(orderGroup, this.mapping);
            
            if (orderResult.result === 'SUCCESS') {
                // Acknowledge in Coupang (상품준비중)
                try {
                    const shipmentBoxIds = [orderId];
                    await this.coupang.acknowledgeShipmentBoxes(shipmentBoxIds);
                    console.log(`Acknowledged shipment box: ${orderId}`);
                } catch (ackError) {
                    console.error(`Failed to acknowledge ${orderId}:`, ackError.message);
                }
            }
            
            return {
                orderId,
                success: orderResult.result === 'SUCCESS',
                domeggookResult: orderResult,
                summary: this.coupang.generateOrderSummary(orderGroup)
            };
            
        } catch (error) {
            return {
                orderId,
                success: false,
                error: error.message
            };
        }
    }
    
    // Manual approval for specific order
    async approveOrder(shipmentBoxId, password = null) {
        try {
            if (password) {
                await this.domeggook.login(password);
            }
            
            // Fetch specific order details
            const orders = await this.coupang.fetchOrders({ 
                status: 'ACCEPT',
                hoursBack: 168 // 1 week back
            });
            
            const flatOrders = this.coupang.flattenOrders(orders);
            const targetOrders = flatOrders.filter(order => 
                String(order.shipmentBoxId) === String(shipmentBoxId)
            );
            
            if (targetOrders.length === 0) {
                throw new Error(`No orders found for shipmentBoxId: ${shipmentBoxId}`);
            }
            
            const result = await this.processOrderGroup(shipmentBoxId, targetOrders);
            return result;
            
        } catch (error) {
            console.error(`Manual approval failed for ${shipmentBoxId}:`, error.message);
            throw error;
        }
    }
}

module.exports = {
    CoupangCollector,
    DomeggookIntegrator,
    SelpixAutomation
};
