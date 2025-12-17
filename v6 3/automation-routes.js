// Automation API Routes for Selpix v1.5
// Handles automated order processing and Coupang integration

const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { SelpixAutomation } = require('./coupang-collector');
const fs = require('fs').promises;
const path = require('path');
const crawler = require('./crawler');
require('dotenv').config();

const router = express.Router();

// Initialize automation instance (will be configured per request)
let automationInstances = new Map();

// Get or create automation instance for user
function getAutomationInstance(userId, config = {}) {
    if (!automationInstances.has(userId)) {
        const domeDefaults = {
            apiKey: process.env.DOME_API_KEY,
            loginId: process.env.DOME_LOGIN_ID,
            sessionId: process.env.DOME_SESSION_ID
        };
        const instance = new SelpixAutomation({
            coupang: {
                accessKey: config.coupangAccessKey,
                secretKey: config.coupangSecretKey,
                vendorId: config.coupangVendorId
            },
            domeggook: {
                apiKey: config.domeApiKey || domeDefaults.apiKey,
                loginId: config.domeLoginId || domeDefaults.loginId,
                sessionId: config.domeSessionId || domeDefaults.sessionId
            },
            mapping: config.mapping || {}
        });
        automationInstances.set(userId, instance);
    }
    return automationInstances.get(userId);
}

// Load mapping configuration
async function loadMapping(mappingPath = null) {
    try {
        const defaultPath = path.join(__dirname, 'downloads', 'dome_mapping.json');
        const filePath = mappingPath || defaultPath;
        
        const data = await fs.readFile(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.log('No mapping file found, using empty mapping');
        return {
            byVendorItemId: {},
            byProductName: {},
            byKeywords: [],
            defaults: {}
        };
    }
}

// Health check for automation services
router.get('/automation/health', async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            services: {
                coupang_api: 'unknown',
                domeggook_api: 'unknown',
                automation_engine: 'up'
            }
        };
        
        res.json(health);
    } catch (error) {
        res.status(500).json({
            error: 'HEALTH_CHECK_FAILED',
            message: error.message
        });
    }
});

// Get automation configuration
router.get('/automation/config', async (req, res) => {
    try {
        const mapping = await loadMapping();
        
        res.json({
            mappingStats: {
                vendorItemMappings: Object.keys(mapping.byVendorItemId || {}).length,
                productNameMappings: Object.keys(mapping.byProductName || {}).length,
                keywordRules: (mapping.byKeywords || []).length
            },
            activeInstances: automationInstances.size,
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: 'CONFIG_FETCH_FAILED',
            message: error.message
        });
    }
});

// Create Coupang seller product
router.post('/automation/coupang/products', [
    body('config').optional().isObject(),
    body('product').isObject()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const userId = req.user?.id || 'default';
        const config = req.body.config || {};
        const productPayload = req.body.product || {};

        const automation = getAutomationInstance(userId, config);
        const result = await automation.coupang.createSellerProduct(productPayload);

        res.json({
            success: true,
            result
        });
    } catch (error) {
        console.error('Failed to create Coupang product:', error);
        res.status(500).json({
            error: 'COUPANG_PRODUCT_CREATE_FAILED',
            message: error.message
        });
    }
});

// Crawl a keyword and create Coupang product using scraped data plus template
router.post('/automation/coupang/create-from-crawl', [
    body('keyword').isString().notEmpty(),
    body('config').optional().isObject(),
    body('productTemplate').optional().isObject(),
    body('sites').optional().isArray(),
    body('minPrice').optional().isInt({ min: 0 }),
    body('maxPrice').optional().isInt({ min: 0 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const userId = req.user?.id || 'default';
        const config = req.body.config || {};
        const {
            keyword,
            sites = ['domeggook'],
            minPrice = 0,
            maxPrice = 1000000,
            productTemplate = {},
            itemDefaults = {}
        } = req.body;

        const crawlResult = await crawler.crawlAllSites(keyword, minPrice, maxPrice, sites);
        const baseProduct = crawlResult.products[0];

        if (!baseProduct) {
            return res.status(404).json({
                error: 'NO_PRODUCTS_FOUND',
                message: '크롤링 결과가 없습니다. 키워드나 가격범위를 조정하세요.'
            });
        }

        let enriched = baseProduct;
        if (baseProduct.site === 'domeggook' && baseProduct.sourceUrl) {
            try {
                enriched = await crawler.enrichDomeggookProduct(baseProduct);
            } catch (err) {
                console.warn('Failed to enrich domeggook product, using base product only:', err.message);
            }
        }

        const name = enriched.name || productTemplate.sellerProductName || keyword;
        const price = Number(enriched.price) || Number(itemDefaults.salePrice) || 0;
        const detailImages = (enriched.detailImages || []).filter(Boolean);
        const repImage = enriched.imageUrl || detailImages[0] || null;

        const imageObjects = [];
        if (repImage) {
            imageObjects.push({
                imageOrder: 0,
                imageType: 'REPRESENTATION',
                vendorPath: repImage
            });
        }
        detailImages.slice(0, 9).forEach(url => {
            if (!url) return;
            imageObjects.push({
                imageOrder: imageObjects.length,
                imageType: 'DETAIL',
                vendorPath: url
            });
        });

        const fallbackItem = {
            itemName: `${name}_1`,
            originalPrice: price,
            salePrice: price,
            maximumBuyCount: 99999,
            maximumBuyForPerson: 0,
            maximumBuyForPersonPeriod: 1,
            outboundShippingTimeDay: 2,
            unitCount: 1,
            adultOnly: 'EVERYONE',
            taxType: 'TAX',
            parallelImported: 'NOT_PARALLEL_IMPORTED',
            overseasPurchased: 'NOT_OVERSEAS_PURCHASED',
            pccNeeded: false,
            barcode: '',
            emptyBarcode: true,
            emptyBarcodeReason: '바코드 없음',
            certifications: [{ certificationType: 'NOT_REQUIRED', certificationCode: '' }],
            attributes: [{ attributeTypeName: '수량', attributeValueName: '1개' }],
            notices: productTemplate.notices || [],
            images: imageObjects,
            contents: []
        };

        const itemsSource = Array.isArray(productTemplate.items) && productTemplate.items.length
            ? productTemplate.items
            : [itemDefaults || fallbackItem];

        const items = itemsSource.map((item, idx) => ({
            itemName: item.itemName || `${name}_${idx + 1}`,
            originalPrice: item.originalPrice ?? fallbackItem.originalPrice,
            salePrice: item.salePrice ?? fallbackItem.salePrice,
            maximumBuyCount: item.maximumBuyCount ?? fallbackItem.maximumBuyCount,
            maximumBuyForPerson: item.maximumBuyForPerson ?? fallbackItem.maximumBuyForPerson,
            maximumBuyForPersonPeriod: item.maximumBuyForPersonPeriod ?? fallbackItem.maximumBuyForPersonPeriod,
            outboundShippingTimeDay: item.outboundShippingTimeDay ?? fallbackItem.outboundShippingTimeDay,
            unitCount: item.unitCount ?? fallbackItem.unitCount,
            adultOnly: item.adultOnly || fallbackItem.adultOnly,
            taxType: item.taxType || fallbackItem.taxType,
            parallelImported: item.parallelImported || fallbackItem.parallelImported,
            overseasPurchased: item.overseasPurchased || fallbackItem.overseasPurchased,
            pccNeeded: item.pccNeeded ?? fallbackItem.pccNeeded,
            barcode: item.barcode || fallbackItem.barcode,
            emptyBarcode: item.emptyBarcode ?? fallbackItem.emptyBarcode,
            emptyBarcodeReason: item.emptyBarcodeReason || fallbackItem.emptyBarcodeReason,
            modelNo: item.modelNo || '',
            extraProperties: item.extraProperties || {},
            certifications: item.certifications || fallbackItem.certifications,
            searchTags: item.searchTags || [],
            images: item.images || imageObjects,
            notices: item.notices || fallbackItem.notices,
            attributes: item.attributes || fallbackItem.attributes,
            contents: item.contents || fallbackItem.contents
        }));

        const payload = {
            ...productTemplate,
            sellerProductName: productTemplate.sellerProductName || name,
            displayProductName: productTemplate.displayProductName || name,
            generalProductName: productTemplate.generalProductName || name,
            productGroup: productTemplate.productGroup || name,
            brand: productTemplate.brand || productTemplate.generalProductName || name,
            items
        };

        const automation = getAutomationInstance(userId, config);
        const result = await automation.coupang.createSellerProduct(payload);

        res.json({
            success: true,
            payloadSent: payload,
            crawlPreview: {
                picked: enriched,
                totalFound: crawlResult.totalFound
            },
            result
        });
    } catch (error) {
        console.error('Failed to create Coupang product from crawl:', error);
        res.status(500).json({
            error: 'COUPANG_PRODUCT_CREATE_FROM_CRAWL_FAILED',
            message: error.message
        });
    }
});

// Start automated order processing
router.post('/automation/process-orders', [
    body('config').isObject().optional(),
    body('options').isObject().optional()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const userId = req.user?.id || 'default';
        const config = req.body.config || {};
        const options = req.body.options || {};
        
        // Load mapping
        const mapping = await loadMapping(config.mappingPath);
        config.mapping = mapping;
        
        // Get automation instance
        const automation = getAutomationInstance(userId, config);
        
        // Process orders
        const result = await automation.processOrders({
            status: options.status || 'ACCEPT',
            hoursBack: options.hoursBack || 24,
            maxPerPage: options.maxPerPage || 50
        });
        
        // Save processing log
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const logPath = path.join(__dirname, 'downloads', `automation_log_${timestamp}.json`);
        
        await fs.writeFile(logPath, JSON.stringify({
            timestamp: new Date().toISOString(),
            userId: userId,
            request: { config, options },
            result: result
        }, null, 2));
        
        res.json({
            success: true,
            processed: result.processed,
            newOrders: result.newOrders,
            logFile: logPath,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Automation processing failed:', error);
        res.status(500).json({
            error: 'AUTOMATION_FAILED',
            message: error.message
        });
    }
});

// Manual order approval
router.post('/automation/approve-order/:shipmentBoxId', [
    param('shipmentBoxId').isNumeric(),
    body('config').isObject().optional(),
    body('password').isString().optional()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const { shipmentBoxId } = req.params;
        const userId = req.user?.id || 'default';
        const config = req.body.config || {};
        const password = req.body.password;
        
        // Load mapping
        const mapping = await loadMapping(config.mappingPath);
        config.mapping = mapping;
        
        // Get automation instance
        const automation = getAutomationInstance(userId, config);
        
        // Approve specific order
        const result = await automation.approveOrder(shipmentBoxId, password);
        
        res.json({
            success: result.success,
            shipmentBoxId: shipmentBoxId,
            result: result,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Manual approval failed:', error);
        res.status(500).json({
            error: 'APPROVAL_FAILED',
            message: error.message,
            shipmentBoxId: req.params.shipmentBoxId
        });
    }
});

// Get order processing status
router.get('/automation/orders/status', async (req, res) => {
    try {
        const userId = req.user?.id || 'default';
        
        if (!automationInstances.has(userId)) {
            return res.json({
                status: 'not_initialized',
                message: 'No automation instance found for user'
            });
        }
        
        const automation = automationInstances.get(userId);
        
        // Get recent processing logs
        const downloadsDir = path.join(__dirname, 'downloads');
        const files = await fs.readdir(downloadsDir);
        const logFiles = files
            .filter(file => file.startsWith('automation_log_'))
            .sort()
            .slice(-10); // Last 10 logs
        
        const recentLogs = [];
        for (const file of logFiles) {
            try {
                const logPath = path.join(downloadsDir, file);
                const logData = JSON.parse(await fs.readFile(logPath, 'utf8'));
                recentLogs.push({
                    file: file,
                    timestamp: logData.timestamp,
                    processed: logData.result?.processed || 0,
                    newOrders: logData.result?.newOrders || 0
                });
            } catch (error) {
                // Skip corrupted log files
                continue;
            }
        }
        
        res.json({
            status: 'active',
            seenIdsCount: automation.seenIds.size,
            recentLogs: recentLogs,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'STATUS_CHECK_FAILED',
            message: error.message
        });
    }
});

// Upload or update mapping configuration
router.post('/automation/mapping', [
    body('mapping').isObject()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    try {
        const mapping = req.body.mapping;
        
        // Validate mapping structure
        const requiredKeys = ['byVendorItemId', 'byProductName', 'byKeywords', 'defaults'];
        for (const key of requiredKeys) {
            if (!(key in mapping)) {
                mapping[key] = key === 'byKeywords' ? [] : {};
            }
        }
        
        // Save mapping to file
        const mappingPath = path.join(__dirname, 'downloads', 'dome_mapping.json');
        await fs.writeFile(mappingPath, JSON.stringify(mapping, null, 2));
        
        // Clear automation instances to force reload of mapping
        automationInstances.clear();
        
        res.json({
            success: true,
            message: 'Mapping configuration updated',
            stats: {
                vendorItemMappings: Object.keys(mapping.byVendorItemId).length,
                productNameMappings: Object.keys(mapping.byProductName).length,
                keywordRules: mapping.byKeywords.length
            }
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'MAPPING_UPDATE_FAILED',
            message: error.message
        });
    }
});

// Get current mapping configuration
router.get('/automation/mapping', async (req, res) => {
    try {
        const mapping = await loadMapping();
        
        res.json({
            mapping: mapping,
            stats: {
                vendorItemMappings: Object.keys(mapping.byVendorItemId || {}).length,
                productNameMappings: Object.keys(mapping.byProductName || {}).length,
                keywordRules: (mapping.byKeywords || []).length
            }
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'MAPPING_FETCH_FAILED',
            message: error.message
        });
    }
});

// Clear seen IDs (for testing)
router.delete('/automation/seen-ids', async (req, res) => {
    try {
        const userId = req.user?.id || 'default';
        
        if (automationInstances.has(userId)) {
            const automation = automationInstances.get(userId);
            automation.seenIds.clear();
            automation.saveSeenIds();
        }
        
        res.json({
            success: true,
            message: 'Seen IDs cleared'
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'CLEAR_FAILED',
            message: error.message
        });
    }
});

// Get automation logs
router.get('/automation/logs', async (req, res) => {
    try {
        const { limit = 10, offset = 0 } = req.query;
        
        const downloadsDir = path.join(__dirname, 'downloads');
        const files = await fs.readdir(downloadsDir);
        const logFiles = files
            .filter(file => file.startsWith('automation_log_'))
            .sort()
            .reverse()
            .slice(offset, offset + parseInt(limit));
        
        const logs = [];
        for (const file of logFiles) {
            try {
                const logPath = path.join(downloadsDir, file);
                const logData = JSON.parse(await fs.readFile(logPath, 'utf8'));
                logs.push({
                    file: file,
                    ...logData
                });
            } catch (error) {
                // Skip corrupted files
                continue;
            }
        }
        
        res.json({
            logs: logs,
            total: files.filter(f => f.startsWith('automation_log_')).length
        });
        
    } catch (error) {
        res.status(500).json({
            error: 'LOGS_FETCH_FAILED',
            message: error.message
        });
    }
});

module.exports = router;
