/**
 * Coupang API Proxy Server
 *
 * Runs on this server (IP whitelisted) and proxies Coupang API calls
 * from the Vercel-hosted frontend.
 *
 * Architecture:
 *   [Vercel Frontend] → [This Proxy :4000] → [api-gateway.coupang.com]
 *                         (IP: 121.139.134.33)
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const crypto = require('crypto');
const cors = require('cors');
const { PrismaClient } = require('../node_modules/@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PROXY_PORT || 4000;
const PROXY_API_KEY = process.env.COUPANG_PROXY_KEY || '2c2ea54a9a6715e28865f855a9b0b7e7fed20c0d86d7c8e77f33b38327a61636';

const BASE_URL = 'https://api-gateway.coupang.com';

// Fixed return center values (same as in register/route.ts)
const FIXED_RETURN_NAME = process.env.COUPANG_RETURN_CHARGE_NAME || '로드';
const FIXED_RETURN_CONTACT = process.env.COUPANG_RETURN_CONTACT || '+821024843810';
const FIXED_RETURN_ZIP = process.env.COUPANG_RETURN_ZIPCODE || '00000';
const FIXED_RETURN_ADDR = process.env.COUPANG_RETURN_ADDRESS || '주소 미입력';
const FIXED_RETURN_ADDR_DETAIL = process.env.COUPANG_RETURN_ADDRESS_DETAIL || '상세주소 미입력';
const DEFAULT_RETURN_FEE = 5000;
const DEFAULT_CONTACT = '+821024843810';

// --- Middleware ---
app.use(express.json({ limit: '10mb' }));
app.use(cors({
  origin: [
    /\.vercel\.app$/,
    'http://localhost:3001',
    'http://localhost:3000',
  ],
  credentials: true,
}));

// API Key auth middleware
function authMiddleware(req, res, next) {
  const key = req.headers['x-proxy-key'];
  if (key !== PROXY_API_KEY) {
    return res.status(401).json({ error: 'Invalid proxy key' });
  }
  next();
}

app.use('/api/coupang', authMiddleware);

// --- Coupang Signing ---
function sign(method, path, keys, query = '') {
  const { accessKey, secretKey } = keys;
  const d = new Date();
  const pad = (n) => n.toString().padStart(2, '0');
  const datetime =
    d.getUTCFullYear().toString().slice(-2) +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z';
  const message = `${datetime}${method}${path}${query}`;
  const signature = crypto.createHmac('sha256', secretKey).update(message, 'utf-8').digest('hex');
  const authorization = `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`;
  return { datetime, authorization };
}

async function coupangFetch(method, path, keys, body, query = '') {
  const { datetime, authorization } = sign(method, path, keys, query);
  const pathWithQuery = query ? `${path}?${query}` : path;
  const init = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: authorization,
      'X-Coupang-Date': datetime,
      'X-Requested-By': keys.vendorId,
    },
  };
  if (body && method !== 'GET') {
    init.body = JSON.stringify(body);
  }
  const res = await fetch(`${BASE_URL}${pathWithQuery}`, init);
  const json = await res.json().catch(() => ({}));
  return { res, json };
}

// --- Helper: Get user credentials from DB ---
async function getCredentials(userId) {
  const creds = await prisma.coupangCredential.findFirst({
    where: { userId, isActive: true },
  });
  if (!creds) return null;
  return {
    accessKey: creds.accessKey,
    secretKey: creds.secretKey,
    vendorId: creds.vendorId,
    vendorUserId: creds.vendorUserId || creds.userId,
  };
}

// --- Health check ---
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'coupang-proxy', timestamp: new Date().toISOString() });
});

// ============================
// 1. GET /api/coupang/centers
// ============================
app.get('/api/coupang/centers', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ success: false, error: 'No userId' });

    const keys = await getCredentials(userId);
    if (!keys) return res.status(400).json({ success: false, error: 'No Coupang credentials found' });

    const outboundPath = '/v2/providers/marketplace_openapi/apis/api/v2/vendor/shipping-place/outbound';
    const returnPath = `/v2/providers/openapi/apis/api/v5/vendors/${keys.vendorId}/returnShippingCenters`;
    const query = 'pageNum=1&pageSize=50';

    const [outbound, returnCenters] = await Promise.all([
      coupangFetch('GET', outboundPath, keys, undefined, query),
      coupangFetch('GET', returnPath, keys, undefined, query),
    ]);

    const outboundData = outbound.json?.content || [];
    const returnData = returnCenters.json?.content || [];

    res.json({
      success: true,
      data: { outbound: outboundData, return: returnData },
    });
  } catch (error) {
    console.error('[proxy] centers error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================
// 2. GET/POST /api/coupang/return-centers
// ============================
app.get('/api/coupang/return-centers', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'No userId' });

    const keys = await getCredentials(userId);
    if (!keys) return res.status(400).json({ error: 'NO_CREDENTIALS' });

    const path = `/v2/providers/openapi/apis/api/v5/vendors/${keys.vendorId}/returnShippingCenters`;
    const query = 'pageNum=1&pageSize=50';
    const { datetime, authorization } = sign('GET', path, keys, query);
    const coupangRes = await fetch(`${BASE_URL}${path}?${query}`, {
      method: 'GET',
      headers: {
        Authorization: authorization,
        'X-Coupang-Date': datetime,
        'X-Requested-By': keys.vendorId,
      },
    });
    const json = await coupangRes.json().catch(() => ({}));
    if (!coupangRes.ok) {
      return res.status(coupangRes.status).json({ ok: false, status: coupangRes.status, coupang: json });
    }
    res.json({ ok: true, coupang: json });
  } catch (err) {
    console.error('[proxy] return-centers GET error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/coupang/return-centers', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'No userId' });

    const keys = await getCredentials(userId);
    if (!keys) return res.status(400).json({ error: 'NO_CREDENTIALS' });

    const body = req.body;
    const pathCreate = `/v2/providers/openapi/apis/api/v5/vendors/${keys.vendorId}/returnShippingCenters`;
    const { datetime, authorization } = sign('POST', pathCreate, keys);

    const payload = {
      vendorId: keys.vendorId,
      userId: keys.vendorUserId || body.userId || '',
      shippingPlaceName: body.shippingPlaceName || '반품지',
      goodsflowInfoOpenApiDto: body.goodsflowInfoOpenApiDto || {},
      placeAddresses: body.placeAddresses || [],
    };

    const coupangRes = await fetch(`${BASE_URL}${pathCreate}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
        'X-Coupang-Date': datetime,
        'X-Requested-By': keys.vendorId,
      },
      body: JSON.stringify(payload),
    });
    const json = await coupangRes.json().catch(() => ({}));
    if (!coupangRes.ok) {
      return res.status(coupangRes.status).json({ ok: false, status: coupangRes.status, coupang: json });
    }
    res.json({ ok: true, coupang: json });
  } catch (err) {
    console.error('[proxy] return-centers POST error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================
// 3. GET/POST /api/coupang/shipping-places
// ============================
app.get('/api/coupang/shipping-places', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'No userId' });

    const keys = await getCredentials(userId);
    if (!keys) return res.status(400).json({ error: 'NO_CREDENTIALS' });

    const path = '/v2/providers/marketplace_openapi/apis/api/v2/vendor/shipping-place/outbound';
    const query = 'pageNum=1&pageSize=50';
    const { datetime, authorization } = sign('GET', path, keys, query);
    const coupangRes = await fetch(`${BASE_URL}${path}?${query}`, {
      method: 'GET',
      headers: {
        Authorization: authorization,
        'X-Coupang-Date': datetime,
        'X-Requested-By': keys.vendorId,
      },
    });
    const json = await coupangRes.json().catch(() => ({}));
    if (!coupangRes.ok) {
      return res.status(coupangRes.status).json({ ok: false, status: coupangRes.status, coupang: json });
    }
    res.json({ ok: true, coupang: json });
  } catch (err) {
    console.error('[proxy] shipping-places GET error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.post('/api/coupang/shipping-places', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ error: 'No userId' });

    const keys = await getCredentials(userId);
    if (!keys) return res.status(400).json({ error: 'NO_CREDENTIALS' });

    const body = req.body;
    const pathCreate = `/v2/providers/openapi/apis/api/v5/vendors/${keys.vendorId}/outboundShippingCenters`;
    const { datetime, authorization } = sign('POST', pathCreate, keys);

    let placeAddresses = body.placeAddresses || [];
    if ((!placeAddresses || placeAddresses.length === 0) && body.supplierAddress) {
      placeAddresses = [{
        addressType: body.addressType || 'ROADNAME',
        countryCode: 'KR',
        companyContactNumber: body.companyContactNumber || body.supplierContact || '',
        phoneNumber2: body.phoneNumber2 || '',
        returnZipCode: body.returnZipCode || body.supplierZipCode || '',
        returnAddress: body.returnAddress || body.supplierAddress || '',
        returnAddressDetail: body.returnAddressDetail || body.supplierAddressDetail || '',
      }];
    }

    const payload = {
      vendorId: keys.vendorId,
      userId: keys.vendorUserId || body.userId || '',
      shippingPlaceName: body.shippingPlaceName || '출고지',
      usable: body.usable !== undefined ? body.usable : true,
      global: body.global !== undefined ? body.global : false,
      placeAddresses,
      remoteInfos: body.remoteInfos || [],
    };

    const coupangRes = await fetch(`${BASE_URL}${pathCreate}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: authorization,
        'X-Coupang-Date': datetime,
        'X-Requested-By': keys.vendorId,
      },
      body: JSON.stringify(payload),
    });
    const json = await coupangRes.json().catch(() => ({}));
    if (!coupangRes.ok) {
      return res.status(coupangRes.status).json({ ok: false, status: coupangRes.status, coupang: json });
    }
    res.json({ ok: true, coupang: json });
  } catch (err) {
    console.error('[proxy] shipping-places POST error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================
// 4. POST /api/coupang/register (full product registration)
// ============================
// This is the most complex endpoint - it's a pass-through that
// handles the full registration flow on the proxy side
app.post('/api/coupang/register', async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) return res.status(401).json({ ok: false, error: 'No userId' });

    const keys = await getCredentials(userId);
    if (!keys) return res.status(400).json({ ok: false, error: 'NO_CREDENTIALS' });

    const payload = req.body;
    const VENDOR_ID = keys.vendorId;
    const USER_ID = keys.vendorUserId || userId;

    // --- Parse supplier info ---
    const supplier = payload?.supplier || {};
    const supplierName = supplier.shippingPlaceName || supplier.supplierName || payload?.supplierName || '';
    let supplierContact = supplier.supplierContact || supplier.contact || payload?.supplierContact || '';
    let supplierAddress = supplier.supplierAddress || supplier.address || payload?.supplierAddress || '';
    let supplierAddressDetail = supplier.addressDetail || payload?.supplierAddressDetail || '';
    let supplierZip = supplier.zipCode || supplier.zip || payload?.supplierZip || payload?.zipCode || '';

    if (!supplierZip && supplierAddress) {
      const m = supplierAddress.match(/\b(\d{5,6})\b/);
      if (m) supplierZip = m[1];
    }

    // --- Shipping place names ---
    const cleanedSupplierName = (() => {
      let n = (supplierName || '').trim();
      n = n.replace(/^\([^)]*\)\s*/, '').trim();
      const parts = n.split(/\s+/);
      if (parts.length > 1 && /^[a-z0-9_-]+$/i.test(parts[0])) {
        n = parts.slice(1).join(' ').trim();
      }
      return n || supplierName;
    })();

    const shippingPlaceName = payload?.shippingPlaceName ||
      (cleanedSupplierName ? `${cleanedSupplierName}_출고지` : '출고지');
    const returnPlaceName = FIXED_RETURN_NAME || (cleanedSupplierName ? `${cleanedSupplierName}_반품지` : '반품지');

    const safeOutboundZip = (supplierZip || payload?.outboundZipCode || '00000').toString().trim() || '00000';
    const safeOutboundAddr = (supplierAddress || payload?.outboundAddress || '주소 미입력').toString().trim() || '주소 미입력';
    const safeOutboundAddrDetail = (supplierAddressDetail || payload?.outboundAddressDetail || '상세주소 미입력').toString().trim() || '상세주소 미입력';

    const safeReturnZip = (FIXED_RETURN_ZIP || '00000').toString().trim();
    const safeReturnAddr = (FIXED_RETURN_ADDR || '주소 미입력').toString().trim();
    const safeReturnAddrDetail = (FIXED_RETURN_ADDR_DETAIL || '상세주소 미입력').toString().trim();

    // E.164 phone
    function toE164(phone) {
      if (!phone) return DEFAULT_CONTACT;
      const digits = phone.replace(/[^0-9]/g, '');
      if (phone.startsWith('+')) return phone;
      if (digits.startsWith('82')) return `+${digits}`;
      if (digits.startsWith('0')) return `+82${digits.slice(1)}`;
      if (digits.length < 8) return DEFAULT_CONTACT;
      return `+82${digits}`;
    }

    const formattedPhone = toE164(supplierContact || payload?.companyContactNumber);
    const normalizedReturnContact = toE164(FIXED_RETURN_CONTACT);

    // --- Outbound: check existing, create if needed ---
    const outboundListPath = '/v2/providers/marketplace_openapi/apis/api/v2/vendor/shipping-place/outbound';
    const outboundPath = `/v2/providers/openapi/apis/api/v5/vendors/${VENDOR_ID}/outboundShippingCenters`;
    const returnListPath = `/v2/providers/openapi/apis/api/v4/vendors/${VENDOR_ID}/returnShippingCenters`;
    const returnPath = `/v2/providers/openapi/apis/api/v5/vendors/${VENDOR_ID}/returnShippingCenters`;

    let outRes = { ok: false, status: 0 };
    let outJson = {};

    // Check existing outbound
    try {
      const { res: outListRes, json: outListJson } = await coupangFetch(
        'GET', outboundListPath, keys, undefined,
        `pageNum=1&pageSize=50&placeNames=${encodeURIComponent(shippingPlaceName)}`
      );
      const outMatch = Array.isArray(outListJson?.content)
        ? outListJson.content.find((c) => c.shippingPlaceName === shippingPlaceName)
        : null;
      if (outMatch?.outboundShippingPlaceCode) {
        console.info('[proxy] outbound existing:', shippingPlaceName, outMatch.outboundShippingPlaceCode);
        outRes = { ok: true, status: 200 };
        outJson = { code: 'EXIST', data: outMatch };
      }
    } catch (e) {
      console.error('[proxy] outbound list error:', e);
    }

    // Create if needed
    if (!outRes.ok) {
      const outboundAddressObj = {
        addressType: 'JIBUN',
        countryCode: 'KR',
        companyContactNumber: formattedPhone,
        phoneNumber2: formattedPhone,
        returnZipCode: safeOutboundZip,
        returnAddress: safeOutboundAddr,
        returnAddressDetail: safeOutboundAddrDetail,
      };
      const outboundBody = {
        vendorId: VENDOR_ID,
        userId: USER_ID,
        shippingPlaceName,
        global: false,
        usable: true,
        placeAddresses: [outboundAddressObj],
        remoteInfos: payload?.remoteInfos?.length > 0
          ? payload.remoteInfos.map((r) => ({
              deliveryCode: r.deliveryCode || 'CJGLS',
              jeju: { amount: Number(r.jeju) || 0, currencyCode: 'KRW' },
              notJeju: { amount: Number(r.notJeju) || 0, currencyCode: 'KRW' },
            }))
          : [{ deliveryCode: 'CJGLS', jeju: { amount: 5000, currencyCode: 'KRW' }, notJeju: { amount: 2500, currencyCode: 'KRW' } }],
      };
      const outCreate = await coupangFetch('POST', outboundPath, keys, outboundBody);
      outRes = outCreate.res;
      outJson = outCreate.json;
    }

    // --- Return center: user-selected or fixed lookup ---
    let retRes = { ok: false, status: 0 };
    let retJson = {};

    const explicitReturnCode = payload.shipping?.returnCode;
    if (explicitReturnCode) {
      retRes = { ok: true, status: 200 };
      retJson = { code: 'SUCCESS', data: { returnCenterCode: explicitReturnCode, returnCenterId: explicitReturnCode } };
    } else {
      try {
        const { json: listJson } = await coupangFetch('GET', returnListPath, keys, undefined, 'pageNum=1&pageSize=50');
        const list = Array.isArray(listJson?.data?.content) ? listJson.data.content : listJson?.content;
        const target = Array.isArray(list) ? list.find((c) => c.shippingPlaceName === FIXED_RETURN_NAME) : null;
        if (target?.returnCenterCode) {
          retRes = { ok: true, status: 200 };
          retJson = { code: 'EXIST', data: target };
        } else {
          return res.status(400).json({
            ok: false,
            error: 'RETURN_CENTER_NOT_FOUND',
            message: `반품지(${FIXED_RETURN_NAME}) 코드가 없습니다.`,
            outbound: { success: outRes.ok, code: outJson?.data?.outboundShippingPlaceCode },
          });
        }
      } catch (e) {
        return res.status(500).json({ ok: false, error: 'RETURN_CENTER_LOOKUP_FAILED', detail: String(e) });
      }
    }

    let outboundShippingPlaceCode = outJson?.data?.outboundShippingPlaceCode || outJson?.data?.shippingPlaceId;

    // Refetch outbound code if missing
    if (!outboundShippingPlaceCode) {
      try {
        const { json: refetchJson } = await coupangFetch('GET', outboundListPath, keys, undefined,
          `pageNum=1&pageSize=20&placeNames=${encodeURIComponent(shippingPlaceName)}`);
        const listContent = refetchJson?.data?.content || refetchJson?.content;
        const match = Array.isArray(listContent) ? listContent.find((c) => c.shippingPlaceName === shippingPlaceName) : null;
        outboundShippingPlaceCode = match?.outboundShippingPlaceCode || match?.shippingPlaceId;
        if (outboundShippingPlaceCode) {
          outJson.data = outJson.data || {};
          outJson.data.outboundShippingPlaceCode = outboundShippingPlaceCode;
          outRes.ok = true;
        }
      } catch (e) {
        console.warn('[proxy] outbound refetch error:', e);
      }
    }

    const returnCenterCode = retJson?.data?.returnCenterCode || retJson?.data?.returnCenterId;

    // --- Product Registration ---
    let productResult = null;
    let productName = payload.overrides?.productName || payload.productName;
    let sellPrice = payload.overrides?.price || payload.sellPrice || payload.price;

    if (!productName) {
      return res.status(400).json({ ok: false, error: 'PRODUCT_NAME_MISSING' });
    }

    if (productName && retRes.ok && outRes.ok) {
      try {
        if (!outboundShippingPlaceCode) throw new Error('출고지 코드 없음');
        if (!returnCenterCode) throw new Error('반품지 코드 없음');

        let mainImage = payload.overrides?.imageUrl || payload.mainImage || payload.imageUrl;
        if (!mainImage && Array.isArray(payload.detailImages) && payload.detailImages.length > 0) {
          mainImage = payload.detailImages[0];
        }

        const getSafeVendorPath = (url) => {
          if (!url) return null;
          if (url.length <= 200) return url;
          const noQuery = url.split('?')[0];
          if (noQuery.length <= 200) return noQuery;
          return null;
        };

        const images = [];
        let imgCount = 0;
        const safeMain = getSafeVendorPath(mainImage);
        if (safeMain) {
          images.push({ imageOrder: imgCount++, imageType: 'REPRESENTATION', vendorPath: safeMain });
        }

        const itemPrice = Number(sellPrice) || 0;
        const itemName = `${productName}_1`;
        const sanitizeSearchTags = (tags) => {
          if (!Array.isArray(tags)) return [];
          return tags
            .map((t) => (typeof t === 'string' ? t.trim() : ''))
            .filter((t) => t.length > 0)
            .map((t) => (t.length > 20 ? t.slice(0, 20) : t))
            .slice(0, 20);
        };
        const normalizedSearchTags = sanitizeSearchTags(payload.keywords);

        // HTML sanitizer
        function sanitizeDetailHtml(html) {
          if (!html) return '';
          let clean = html;
          clean = clean.replace(/<script[\s\S]*?<\/script>/gi, '');
          clean = clean.replace(/<iframe[\s\S]*?<\/iframe>/gi, '');
          clean = clean.replace(/<object[\s\S]*?<\/object>/gi, '');
          clean = clean.replace(/<embed[^>]*>/gi, '');
          clean = clean.replace(/<style[\s\S]*?<\/style>/gi, '');
          clean = clean.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '');
          clean = clean.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '');
          clean = clean.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '');
          clean = clean.replace(/(href|src)\s*=\s*"(javascript:[^"]*)"/gi, '$1="#"');
          clean = clean.replace(/(\r\n|\n|\r)/gm, '');
          return clean.trim();
        }

        const buildFallbackHtml = () => {
          const imgs = [];
          if (Array.isArray(payload.detailImages)) {
            payload.detailImages.filter((v) => !!v).forEach((v) => imgs.push(v));
          }
          if (imgs.length === 0 && payload.mainImage) imgs.push(payload.mainImage);
          if (imgs.length === 0) return `<div>${payload.productName || '상품 상세설명'}</div>`;
          return `<div><h3>${payload.productName || '상품 상세설명'}</h3>${imgs.slice(0, 10).map((src) => `<p><img src="${src}" style="max-width:100%;height:auto;" /></p>`).join('')}</div>`;
        };

        const primaryOption = Array.isArray(payload.options)
          ? payload.options.find((o) => Array.isArray(o.values) && o.values.length > 0)
          : null;

        const baseItem = (optValue, idx) => ({
          itemName: optValue ? `${payload.productName}_${optValue}` : itemName,
          originalPrice: payload.overrides?.originalPrice || itemPrice,
          salePrice: itemPrice,
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
          attributes: optValue
            ? [{ attributeTypeName: primaryOption?.name || '옵션', attributeValueName: optValue, exposed: 'EXPOSED' }]
            : [{ attributeTypeName: '수량', attributeValueName: '1개' }],
          notices: [],
          searchTags: normalizedSearchTags,
          images,
        });

        const items = primaryOption
          ? primaryOption.values.slice(0, 50).map((v, idx) => baseItem(v, idx))
          : [baseItem()];

        // Category
        let incomingCategory = (payload.categoryCode ?? payload.displayCategoryCode ?? '').toString().trim();
        if (!incomingCategory || incomingCategory === 'undefined') {
          // Try category prediction
          try {
            if (productName) {
              const predictPath = '/v2/providers/openapi/apis/api/v1/categorization/predict';
              const { json: predictJson } = await coupangFetch('POST', predictPath, keys, {
                productName,
                sellerSkuCode: 'TEMP-SKU-PREDICT',
              });
              if (predictJson?.data?.predictedCategoryId) {
                incomingCategory = predictJson.data.predictedCategoryId;
              }
            }
          } catch (e) {
            console.warn('[proxy] category prediction failed:', e);
          }
          if (!incomingCategory || incomingCategory === 'undefined') {
            incomingCategory = '81283';
          }
        }

        const normalizedReturnFee = Number(payload.deliveryChargeOnReturn ?? payload.returnCharge ?? DEFAULT_RETURN_FEE) || DEFAULT_RETURN_FEE;
        const saleStartIso = payload.saleStartedAt || new Date().toISOString().slice(0, 19);
        const saleEndIso = payload.saleEndedAt || '2099-01-01T23:59:59';
        const rawContentHtml = payload.detailHtml || payload.summary || buildFallbackHtml();
        const contentHtml = sanitizeDetailHtml(rawContentHtml) || buildFallbackHtml();

        const fallbackNotices = [
          { noticeCategoryName: '기타재화', noticeCategoryDetailName: '품명 및 모델명', content: payload.productName || '상품명 미기재' },
          { noticeCategoryName: '기타재화', noticeCategoryDetailName: '법에 의한 인증·허가 등을 받았음을 확인할 수 있는 경우 그에 대한 사항', content: '해당사항없음' },
          { noticeCategoryName: '기타재화', noticeCategoryDetailName: '제조국 또는 원산지', content: '상세페이지 참조' },
          { noticeCategoryName: '기타재화', noticeCategoryDetailName: '제조자, 수입품의 경우 수입자를 함께 표기', content: supplier?.supplierName || '상세페이지 참조' },
          { noticeCategoryName: '기타재화', noticeCategoryDetailName: 'A/S 책임자와 전화번호', content: FIXED_RETURN_CONTACT },
        ];

        const contentsForItem = [{
          contentsType: 'TEXT',
          contentDetails: [{ content: contentHtml, detailType: 'TEXT' }],
        }];

        items.forEach((it) => {
          it.notices = fallbackNotices;
          it.contents = contentsForItem;
        });

        const productPayload = {
          vendorId: VENDOR_ID,
          displayCategoryCode: incomingCategory,
          sellerProductName: payload.originalProductName || payload.sellerProductName || productName,
          displayProductName: productName,
          generalProductName: productName,
          brand: payload.brand || payload.productName,
          saleStartedAt: saleStartIso,
          saleEndedAt: saleEndIso,
          deliveryMethod: 'SEQUENCIAL',
          deliveryCompanyCode: payload.deliveryCompanyCode || 'KDEXP',
          deliveryChargeType: payload.deliveryChargeType || 'FREE',
          deliveryCharge: payload.deliveryCharge ?? 0,
          freeShipOverAmount: payload.freeShipOverAmount ?? 0,
          deliveryChargeOnReturn: normalizedReturnFee,
          returnCharge: Number(payload.returnCharge ?? normalizedReturnFee) || normalizedReturnFee,
          remoteAreaDeliverable: payload.remoteAreaDeliverable || 'N',
          unionDeliveryType: payload.unionDeliveryType || 'UNION_DELIVERY',
          returnCenterCode,
          returnChargeName: payload.returnChargeName || returnPlaceName,
          companyContactNumber: normalizedReturnContact,
          returnZipCode: safeReturnZip,
          returnAddress: safeReturnAddr,
          returnAddressDetail: safeReturnAddrDetail,
          outboundShippingPlaceCode: payload.outboundShippingPlaceCode || outboundShippingPlaceCode,
          vendorUserId: USER_ID,
          requested: true,
          items,
          images,
          contents: contentsForItem,
          notices: [],
        };

        const productPath = '/v2/providers/seller_api/apis/api/v1/marketplace/seller-products';
        const { res: prodRes, json: prodJson } = await coupangFetch('POST', productPath, keys, productPayload);
        productResult = { status: prodRes.status, body: prodJson };

        // DB persistence
        if (prodRes.ok && (prodJson.code === 'SUCCESS' || prodJson.data?.content?.code === 'SUCCESS')) {
          try {
            const pName = payload.overrides?.productName || payload.productName || 'Unknown';
            const pPrice = Number(payload.overrides?.price || payload.sellPrice || payload.price || 0);
            const pSupplyPrice = Number(payload.overrides?.supplyPrice || payload.supplyPrice || 0);
            const pOriginalPrice = Number(payload.overrides?.originalPrice || pPrice);
            const pCategory = String(incomingCategory || '81283');
            const pImage = mainImage || '';

            const savedProduct = await prisma.product.create({
              data: {
                name: pName,
                wholesalePrice: pSupplyPrice,
                recommendedPrice: pOriginalPrice,
                margin: 0,
                competition: 'Coupang',
                searchVolume: 0,
                category: pCategory,
                image: pImage,
                source: 'Domeggook',
                trend: 'New',
                score: 80,
                userId: userId || undefined,
              },
            });

            await prisma.registration.create({
              data: {
                productId: savedProduct.id,
                productName: pName,
                category: pCategory,
                recommendedTitle: pName,
                price: pPrice,
                wholesalePrice: pSupplyPrice,
                status: 'REGISTERED',
                platform: 'COUPANG',
                userId: userId || undefined,
                sourceProductId: payload.sourceProductId || '',
                externalProductId: String(prodJson.data || ''),
              },
            });
          } catch (dbErr) {
            console.error('[proxy] DB persistence error:', dbErr);
          }
        }
      } catch (err) {
        console.error('[proxy] product registration error:', err);
        productResult = { error: err.message };
      }
    }

    const isProductSuccess = productResult?.status === 200 &&
      (productResult?.body?.code === 'SUCCESS' || productResult?.body?.data?.content?.code === 'SUCCESS');
    const finalSuccess = outRes.ok && retRes.ok && isProductSuccess;

    res.json({
      ok: finalSuccess,
      success: finalSuccess,
      message: finalSuccess
        ? '상품이 성공적으로 등록되었습니다.'
        : `등록 실패: ${productResult?.error || productResult?.body?.message || '상세 결과 확인 필요'}`,
      outbound: { success: outRes.ok, data: outJson, code: outboundShippingPlaceCode },
      returnCenter: { success: retRes.ok, data: retJson, code: returnCenterCode },
      coupang: productResult,
    });
  } catch (err) {
    console.error('[proxy] register error:', err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ============================
// 5. GET /api/crawler/top (도매꾹 키워드 검색)
// ============================
let crawlerServiceInstance = null;
async function getCrawlerService() {
  if (!crawlerServiceInstance) {
    const { CrawlerService } = require('./crawler');
    crawlerServiceInstance = new CrawlerService();
  }
  return crawlerServiceInstance;
}

app.get('/api/crawler/top', authMiddleware, async (req, res) => {
  try {
    const keyword = req.query.keyword;
    if (!keyword) {
      return res.status(400).json({ success: false, message: 'Keyword is required' });
    }
    console.log(`[proxy] Crawling Domeggook: ${keyword}`);
    const crawler = await getCrawlerService();
    const products = await crawler.crawlDomeggook(keyword);
    res.json({ success: true, data: products });
  } catch (error) {
    console.error('[proxy] crawler/top error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================
// 6. POST /api/crawler/preview (도매꾹 상품 상세)
// ============================
app.post('/api/crawler/preview', authMiddleware, async (req, res) => {
  try {
    const { productLink, baseData } = req.body;
    if (!productLink) {
      return res.status(400).json({ success: false, message: 'Product Link is required' });
    }
    console.log(`[proxy] Preview Domeggook: ${productLink}`);
    const crawler = await getCrawlerService();
    const baseProduct = {
      name: 'Unknown',
      price: 0,
      imageUrl: null,
      site: 'domeggook',
      ...baseData,
      sourceUrl: productLink,
    };
    const enriched = await crawler.enrichDomeggookProduct(baseProduct);
    res.json({ success: true, data: enriched });
  } catch (error) {
    console.error('[proxy] crawler/preview error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// --- Start server ---
app.listen(PORT, () => {
  console.log(`[Coupang Proxy] Running on port ${PORT}`);
  console.log(`[Coupang Proxy] Health check: http://localhost:${PORT}/health`);
});
