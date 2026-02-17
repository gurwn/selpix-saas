import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export const runtime = 'nodejs'

const PROXY_URL = process.env.COUPANG_PROXY_URL
const PROXY_KEY = process.env.COUPANG_PROXY_KEY || ''

export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
        }

        const payload = await req.json()

        if (PROXY_URL) {
            // Forward entire payload to proxy server
            const res = await fetch(`${PROXY_URL}/api/coupang/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-proxy-key': PROXY_KEY,
                    'x-user-id': userId,
                },
                body: JSON.stringify(payload),
            });
            const json = await res.json();
            return NextResponse.json(json, { status: res.status });
        }

        // Direct mode (local dev) - full registration logic
        const crypto = await import('crypto');
        const { prisma } = await import('@myapp/prisma');
        const { CoupangService } = await import('@/lib/services/coupang');
        const { aiService } = await import('@/lib/services/ai');

        const creds = await prisma.coupangCredential.findFirst({
            where: { userId, isActive: true }
        });
        if (!creds) {
            return NextResponse.json({
                ok: false,
                error: 'NO_CREDENTIALS',
                message: '사용 중인 쿠팡 계정이 없습니다. 설정 페이지에서 사용할 계정을 선택해주세요.'
            }, { status: 400 });
        }

        interface CoupangKeys {
            accessKey: string;
            secretKey: string;
            vendorId: string;
            vendorUserId?: string;
        }

        const keys: CoupangKeys = {
            accessKey: creds.accessKey,
            secretKey: creds.secretKey,
            vendorId: creds.vendorId,
            vendorUserId: creds.vendorUserId || creds.userId
        };

        const VENDOR_ID = keys.vendorId;
        const USER_ID = keys.vendorUserId || userId;
        const BASE_URL = 'https://api-gateway.coupang.com'
        const DEFAULT_CONTACT = '+821024843810'
        const DEFAULT_ZIP = '00000'
        const DEFAULT_ADDR = '주소 미입력'
        const DEFAULT_ADDR_DETAIL = '상세주소 미입력'
        const DEFAULT_RETURN_FEE = 5000
        const FIXED_RETURN_NAME = process.env.COUPANG_RETURN_CHARGE_NAME || '로드'
        const FIXED_RETURN_CONTACT = process.env.COUPANG_RETURN_CONTACT || DEFAULT_CONTACT
        const FIXED_RETURN_ZIP = process.env.COUPANG_RETURN_ZIPCODE || DEFAULT_ZIP
        const FIXED_RETURN_ADDR = process.env.COUPANG_RETURN_ADDRESS || DEFAULT_ADDR
        const FIXED_RETURN_ADDR_DETAIL = process.env.COUPANG_RETURN_ADDRESS_DETAIL || DEFAULT_ADDR_DETAIL

        const coupangService = new CoupangService({
            accessKey: keys.accessKey,
            secretKey: keys.secretKey,
            vendorId: keys.vendorId,
            userId: keys.vendorUserId || userId
        });

        function signRequest(method: string, path: string, k: CoupangKeys, query = '') {
            const { accessKey, secretKey } = k;
            if (!accessKey || !secretKey) throw new Error('COUPANG_ACCESS_KEY/SECRET_KEY missing')
            const d = new Date()
            const pad = (n: number) => n.toString().padStart(2, '0')
            const datetime = d.getUTCFullYear().toString().slice(-2) + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + pad(d.getUTCMinutes()) + pad(d.getUTCSeconds()) + 'Z'
            const message = `${datetime}${method}${path}${query}`
            const signature = crypto.createHmac('sha256', secretKey).update(message, 'utf-8').digest('hex')
            const authorization = `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`
            return { datetime, authorization }
        }

        async function coupangFetch(method: 'GET' | 'POST', path: string, k: CoupangKeys, body?: any, query = '') {
            const { datetime, authorization } = signRequest(method, path, k, query)
            const pathWithQuery = query ? `${path}?${query}` : path
            const init: RequestInit = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: authorization,
                    'X-Coupang-Date': datetime,
                    'X-Requested-By': k.vendorId
                },
            }
            if (body && method !== 'GET') init.body = JSON.stringify(body)
            const res = await fetch(`${BASE_URL}${pathWithQuery}`, init)
            const json = await res.json().catch(() => ({}))
            return { res, json }
        }

        function sanitizeDetailHtml(html?: string) {
            if (!html) return ''
            let clean = html
            clean = clean.replace(/<script[\s\S]*?<\/script>/gi, '')
            clean = clean.replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
            clean = clean.replace(/<object[\s\S]*?<\/object>/gi, '')
            clean = clean.replace(/<embed[^>]*>/gi, '')
            clean = clean.replace(/<style[\s\S]*?<\/style>/gi, '')
            clean = clean.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
            clean = clean.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
            clean = clean.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')
            clean = clean.replace(/(href|src)\s*=\s*"(javascript:[^"]*)"/gi, '$1="#"')
            clean = clean.replace(/(\r\n|\n|\r)/gm, "")
            return clean.trim()
        }

        function toE164(phone: string | undefined) {
            if (!phone) return DEFAULT_CONTACT
            const digits = phone.replace(/[^0-9]/g, '')
            if (phone.startsWith('+')) return phone
            if (digits.startsWith('82')) return `+${digits}`
            if (digits.startsWith('0')) return `+82${digits.slice(1)}`
            if (digits.length < 8) return DEFAULT_CONTACT
            return `+82${digits}`
        }

        const supplier = payload?.supplier || {}
        const supplierName = supplier.shippingPlaceName || supplier.supplierName || supplier.vendorName || supplier.name || payload?.supplierName || payload?.vendorName || ''
        let supplierContact = supplier.supplierContact || supplier.contact || supplier.phone || supplier.tel || payload?.supplierContact || ''
        let supplierAddress = supplier.supplierAddress || supplier.address || supplier.address1 || supplier.addr || payload?.supplierAddress || ''
        let supplierAddressDetail = supplier.addressDetail || supplier.addrDetail || payload?.supplierAddressDetail || ''
        let supplierZip = supplier.zipCode || supplier.zip || supplier.postCode || payload?.supplierZip || payload?.zipCode || ''
        if (!supplierZip && supplierAddress) {
            const m = supplierAddress.match(/\b(\d{5,6})\b/)
            if (m) supplierZip = m[1]
        }

        const cleanedSupplierName = (() => {
            let n = (supplierName || '').trim()
            n = n.replace(/^\([^)]*\)\s*/, '').trim()
            const parts = n.split(/\s+/)
            if (parts.length > 1 && /^[a-z0-9_-]+$/i.test(parts[0])) n = parts.slice(1).join(' ').trim()
            return n || supplierName
        })()

        const inboundName = payload?.shippingPlaceName
        const isGenericName = (name?: string) => {
            if (!name) return true
            return ['기본출고지', '출고지', '기본반품지', '반품지'].includes(name.trim())
        }
        const shippingPlaceName = !isGenericName(inboundName) && inboundName?.trim()
            ? inboundName.trim()
            : cleanedSupplierName ? `${cleanedSupplierName}_출고지` : '출고지'
        const returnPlaceName = FIXED_RETURN_NAME || (cleanedSupplierName ? `${cleanedSupplierName}_반품지` : '반품지')

        const {
            companyContactNumber = supplierContact || DEFAULT_CONTACT,
            outboundZipCode = supplierZip || DEFAULT_ZIP,
            outboundAddress = supplierAddress || DEFAULT_ADDR,
            outboundAddressDetail = supplierAddressDetail || DEFAULT_ADDR_DETAIL,
            returnZipCode = FIXED_RETURN_ZIP,
            returnAddress = FIXED_RETURN_ADDR,
            returnAddressDetail = FIXED_RETURN_ADDR_DETAIL,
            remoteInfos = [],
        } = payload || {}

        const trimStr = (v: any) => (typeof v === 'string' ? v.trim() : '')
        const safeOutboundZip = trimStr(outboundZipCode) || trimStr(supplierZip) || DEFAULT_ZIP
        const safeOutboundAddr = trimStr(outboundAddress) || trimStr(supplierAddress) || DEFAULT_ADDR
        const safeOutboundAddrDetail = trimStr(outboundAddressDetail) || trimStr(supplierAddressDetail) || DEFAULT_ADDR_DETAIL
        const safeReturnZip = trimStr(FIXED_RETURN_ZIP) || DEFAULT_ZIP
        const safeReturnAddr = trimStr(FIXED_RETURN_ADDR) || DEFAULT_ADDR
        const safeReturnAddrDetail = trimStr(FIXED_RETURN_ADDR_DETAIL) || DEFAULT_ADDR_DETAIL

        if (!shippingPlaceName || !safeOutboundAddr || !safeOutboundZip) {
            return NextResponse.json({ ok: false, error: '출고지명/주소/우편번호가 비어 있습니다.' }, { status: 400 })
        }

        const formattedPhone = toE164(companyContactNumber)
        const normalizedReturnContact = toE164(FIXED_RETURN_CONTACT || companyContactNumber)

        const outboundAddressObj = {
            addressType: 'JIBUN', countryCode: 'KR',
            companyContactNumber: formattedPhone, phoneNumber2: formattedPhone,
            returnZipCode: safeOutboundZip, returnAddress: safeOutboundAddr, returnAddressDetail: safeOutboundAddrDetail,
        }
        const outboundPath = `/v2/providers/openapi/apis/api/v5/vendors/${VENDOR_ID}/outboundShippingCenters`
        const outboundListPath = `/v2/providers/marketplace_openapi/apis/api/v2/vendor/shipping-place/outbound`
        const returnPath = `/v2/providers/openapi/apis/api/v5/vendors/${VENDOR_ID}/returnShippingCenters`
        const returnListPath = `/v2/providers/openapi/apis/api/v4/vendors/${VENDOR_ID}/returnShippingCenters`

        let outRes: any = { ok: false, status: 0 }
        let outJson: any = {}
        try {
            const { json: outListJson } = await coupangFetch('GET', outboundListPath, keys, undefined, `pageNum=1&pageSize=50&placeNames=${encodeURIComponent(shippingPlaceName)}`)
            const outMatch = Array.isArray(outListJson?.content) ? outListJson.content.find((c: any) => c.shippingPlaceName === shippingPlaceName) : null
            if (outMatch?.outboundShippingPlaceCode) {
                outRes = { ok: true, status: 200 }
                outJson = { code: 'EXIST', data: outMatch }
            }
        } catch (e) { console.error('[출고지-조회-에러]', e) }

        if (!outRes.ok) {
            const outboundBody = {
                vendorId: VENDOR_ID, userId: USER_ID, shippingPlaceName, global: false, usable: true,
                placeAddresses: [outboundAddressObj],
                remoteInfos: remoteInfos.length > 0
                    ? remoteInfos.map((r: any) => ({ deliveryCode: r.deliveryCode || 'CJGLS', jeju: { amount: Number(r.jeju) || 0, currencyCode: 'KRW' }, notJeju: { amount: Number(r.notJeju) || 0, currencyCode: 'KRW' } }))
                    : [{ deliveryCode: 'CJGLS', jeju: { amount: 5000, currencyCode: 'KRW' }, notJeju: { amount: 2500, currencyCode: 'KRW' } }],
            }
            const outCreate = await coupangFetch('POST', outboundPath, keys, outboundBody)
            outRes = outCreate.res
            outJson = outCreate.json
        }

        let retRes: any = { ok: false, status: 0 }
        let retJson: any = {}
        const explicitReturnCode = payload.shipping?.returnCode
        if (explicitReturnCode) {
            retRes = { ok: true, status: 200 }
            retJson = { code: 'SUCCESS', data: { returnCenterCode: explicitReturnCode, returnCenterId: explicitReturnCode } }
        } else {
            try {
                const { json: listJson } = await coupangFetch('GET', returnListPath, keys, undefined, 'pageNum=1&pageSize=50')
                const list = Array.isArray(listJson?.data?.content) ? listJson.data.content : listJson?.content
                const target = Array.isArray(list) ? list.find((c: any) => c.shippingPlaceName === FIXED_RETURN_NAME) : null
                if (target?.returnCenterCode) {
                    retRes = { ok: true, status: 200 }
                    retJson = { code: 'EXIST', data: target }
                } else {
                    return NextResponse.json({ ok: false, error: 'RETURN_CENTER_NOT_FOUND', message: `반품지(${FIXED_RETURN_NAME}) 코드가 없습니다.` }, { status: 400 })
                }
            } catch (e) {
                return NextResponse.json({ ok: false, error: 'RETURN_CENTER_LOOKUP_FAILED', detail: String(e) }, { status: 500 })
            }
        }

        let outboundShippingPlaceCode = outJson?.data?.outboundShippingPlaceCode || outJson?.data?.shippingPlaceId
        if (!outboundShippingPlaceCode) {
            try {
                const { json: refetchJson } = await coupangFetch('GET', outboundListPath, keys, undefined, `pageNum=1&pageSize=20&placeNames=${encodeURIComponent(shippingPlaceName)}`)
                const listContent = refetchJson?.data?.content || refetchJson?.content
                const match = Array.isArray(listContent) ? listContent.find((c: any) => c.shippingPlaceName === shippingPlaceName) : null
                outboundShippingPlaceCode = match?.outboundShippingPlaceCode || match?.shippingPlaceId || outboundShippingPlaceCode
                if (outboundShippingPlaceCode) { outJson.data = outJson.data || {}; outJson.data.outboundShippingPlaceCode = outboundShippingPlaceCode; outRes.ok = true }
            } catch (e) { console.warn('[출고지-재조회-실패]', e) }
        }
        const returnCenterCode = retJson?.data?.returnCenterCode || retJson?.data?.returnCenterId

        let productResult: any = null
        let productName = payload.overrides?.productName || payload.productName
        let sellPrice = payload.overrides?.price || payload.sellPrice || payload.price

        const useAiPrompts = payload?.useAiPrompts || payload?.aiPrompts || payload?.aiOptimize
        if (useAiPrompts) {
            try {
                const context = `[상품정보]\n- 상품명: ${productName}\n- 브랜드: ${payload.brand || '없음'}\n- 특징/옵션: ${JSON.stringify(payload.attributes || payload.options || {})}`
                const meta = await aiService.generateProductMetadata(context)
                if (meta?.optimizedName) productName = meta.optimizedName
                const priceInput = {
                    totalCost: Number(payload.supplyPrice || payload.wholesalePrice || payload.cost || 0),
                    feeRate: Number(payload.feeRate || 10.9),
                    shippingCost: Number(payload.shippingCost || payload.deliveryCharge || 0),
                    adOnOff: Boolean(payload.adOnOff),
                    marketPrices: Array.isArray(payload.marketPrices) ? payload.marketPrices : [],
                    candidatePrices: Array.isArray(payload.candidatePrices) ? payload.candidatePrices : [Number(sellPrice || 0)],
                    unitCount: Number(payload.unitCount || payload.minOrderQuantity || 1)
                }
                const priceRec = await aiService.generatePriceRecommendation(priceInput)
                if (priceRec?.recommendedPrice) sellPrice = priceRec.recommendedPrice
            } catch (e) { console.warn('[AI skipped]', e) }
        }

        if (!productName) {
            return NextResponse.json({ ok: false, error: 'PRODUCT_NAME_MISSING' }, { status: 400 })
        }

        if (productName && retRes.ok && outRes.ok) {
            try {
                if (!outboundShippingPlaceCode) throw new Error('출고지 코드 없음')
                if (!returnCenterCode) throw new Error('반품지 코드 없음')

                let mainImage = payload.overrides?.imageUrl || payload.mainImage || payload.imageUrl
                if (!mainImage && Array.isArray(payload.detailImages) && payload.detailImages.length > 0) mainImage = payload.detailImages[0]

                const getSafeVendorPath = (url: string | undefined | null) => {
                    if (!url) return null
                    if (url.length <= 200) return url
                    const noQuery = url.split('?')[0]
                    if (noQuery.length <= 200) return noQuery
                    return null
                }

                const images: any[] = []
                let imgCount = 0
                const safeMain = getSafeVendorPath(mainImage)
                if (safeMain) images.push({ imageOrder: imgCount++, imageType: 'REPRESENTATION', vendorPath: safeMain })

                const itemPrice = Number(sellPrice) || 0
                const itemName = `${productName}_1`
                const sanitizeSearchTags = (tags: any) => {
                    if (!Array.isArray(tags)) return []
                    return tags.map((t: any) => (typeof t === 'string' ? t.trim() : '')).filter((t: string) => t.length > 0).map((t: string) => (t.length > 20 ? t.slice(0, 20) : t)).slice(0, 20)
                }
                const normalizedSearchTags = sanitizeSearchTags(payload.keywords)

                const buildFallbackHtml = () => {
                    const imgs: string[] = []
                    if (Array.isArray(payload.detailImages)) payload.detailImages.filter((v: string) => !!v).forEach((v: string) => imgs.push(v))
                    if (imgs.length === 0 && payload.mainImage) imgs.push(payload.mainImage)
                    if (imgs.length === 0) return `<div>${payload.productName || '상품 상세설명'}</div>`
                    return `<div><h3>${payload.productName || '상품 상세설명'}</h3>${imgs.slice(0, 10).map((src) => `<p><img src="${src}" style="max-width:100%;height:auto;" /></p>`).join('')}</div>`
                }

                const primaryOption = Array.isArray(payload.options) ? payload.options.find((o: any) => Array.isArray(o.values) && o.values.length > 0) : null
                const baseItem = (optValue?: string) => ({
                    itemName: optValue ? `${payload.productName}_${optValue}` : itemName,
                    originalPrice: payload.overrides?.originalPrice || itemPrice,
                    salePrice: itemPrice,
                    maximumBuyCount: 99999, maximumBuyForPerson: 0, maximumBuyForPersonPeriod: 1, outboundShippingTimeDay: 2, unitCount: 1,
                    adultOnly: 'EVERYONE', taxType: 'TAX', parallelImported: 'NOT_PARALLEL_IMPORTED', overseasPurchased: 'NOT_OVERSEAS_PURCHASED',
                    pccNeeded: false, barcode: '', emptyBarcode: true, emptyBarcodeReason: '바코드 없음',
                    certifications: [{ certificationType: 'NOT_REQUIRED', certificationCode: '' }],
                    attributes: optValue
                        ? [{ attributeTypeName: primaryOption?.name || primaryOption?.title || '옵션', attributeValueName: optValue, exposed: 'EXPOSED' }]
                        : [{ attributeTypeName: '수량', attributeValueName: '1개' }],
                    notices: [], searchTags: normalizedSearchTags, images
                })

                const items = primaryOption ? primaryOption.values.slice(0, 50).map((v: string) => baseItem(v)) : [baseItem()]

                let incomingCategory = (payload.categoryCode ?? payload.displayCategoryCode ?? '').toString().trim()
                if (!incomingCategory || incomingCategory === 'undefined') {
                    try {
                        const searchName = productName || payload.category
                        if (searchName) {
                            const predicted = await coupangService.predictCategory({ productName: searchName })
                            if (predicted && predicted.predictedCategoryId) incomingCategory = predicted.predictedCategoryId
                        }
                    } catch (e) { console.warn('[Category Prediction Failed]', e) }
                    if (!incomingCategory || incomingCategory === 'undefined') incomingCategory = '81283'
                }

                const normalizedReturnFee = Number(payload.deliveryChargeOnReturn ?? payload.returnCharge ?? DEFAULT_RETURN_FEE) || DEFAULT_RETURN_FEE
                const saleStartIso = payload.saleStartedAt || new Date().toISOString().slice(0, 19)
                const saleEndIso = payload.saleEndedAt || '2099-01-01T23:59:59'
                const rawContentHtml = payload.detailHtml || payload.summary || buildFallbackHtml()
                const contentHtml = sanitizeDetailHtml(rawContentHtml) || buildFallbackHtml()

                const fallbackNotices = [
                    { noticeCategoryName: '기타재화', noticeCategoryDetailName: '품명 및 모델명', content: payload.productName || '상품명 미기재' },
                    { noticeCategoryName: '기타재화', noticeCategoryDetailName: '법에 의한 인증·허가 등을 받았음을 확인할 수 있는 경우 그에 대한 사항', content: '해당사항없음' },
                    { noticeCategoryName: '기타재화', noticeCategoryDetailName: '제조국 또는 원산지', content: '상세페이지 참조' },
                    { noticeCategoryName: '기타재화', noticeCategoryDetailName: '제조자, 수입품의 경우 수입자를 함께 표기', content: payload.supplier?.supplierName || '상세페이지 참조' },
                    { noticeCategoryName: '기타재화', noticeCategoryDetailName: 'A/S 책임자와 전화번호', content: payload.companyContactNumber || FIXED_RETURN_CONTACT }
                ]
                const contentsForItem = [{ contentsType: 'TEXT', contentDetails: [{ content: contentHtml, detailType: 'TEXT' }] }]
                items.forEach((it: any) => { it.notices = fallbackNotices; (it as any).contents = contentsForItem })

                const productPayload = {
                    vendorId: VENDOR_ID, displayCategoryCode: incomingCategory,
                    sellerProductName: payload.originalProductName || payload.sellerProductName || productName,
                    displayProductName: productName, generalProductName: productName, brand: payload.brand || payload.productName,
                    saleStartedAt: saleStartIso, saleEndedAt: saleEndIso, deliveryMethod: 'SEQUENCIAL',
                    deliveryCompanyCode: payload.deliveryCompanyCode || 'KDEXP', deliveryChargeType: payload.deliveryChargeType || 'FREE',
                    deliveryCharge: payload.deliveryCharge ?? 0, freeShipOverAmount: payload.freeShipOverAmount ?? 0,
                    deliveryChargeOnReturn: normalizedReturnFee, returnCharge: Number(payload.returnCharge ?? normalizedReturnFee) || normalizedReturnFee,
                    remoteAreaDeliverable: payload.remoteAreaDeliverable || 'N', unionDeliveryType: payload.unionDeliveryType || 'UNION_DELIVERY',
                    returnCenterCode, returnChargeName: payload.returnChargeName || returnPlaceName,
                    companyContactNumber: FIXED_RETURN_CONTACT, returnZipCode: safeReturnZip, returnAddress: safeReturnAddr, returnAddressDetail: safeReturnAddrDetail,
                    outboundShippingPlaceCode: payload.outboundShippingPlaceCode || outboundShippingPlaceCode,
                    vendorUserId: USER_ID, requested: true, items, images, contents: contentsForItem, notices: []
                }

                const productPath = '/v2/providers/seller_api/apis/api/v1/marketplace/seller-products'
                const { res: prodRes, json: prodJson } = await coupangFetch('POST', productPath, keys, productPayload)
                productResult = { status: prodRes.status, body: prodJson }

                if (prodRes.ok && (prodJson.code === 'SUCCESS' || prodJson.data?.content?.code === 'SUCCESS')) {
                    try {
                        const pName = payload.overrides?.productName || payload.productName || 'Unknown'
                        const pPrice = Number(payload.overrides?.price || payload.sellPrice || payload.price || 0)
                        const pSupplyPrice = Number(payload.overrides?.supplyPrice || payload.supplyPrice || 0)
                        const pOriginalPrice = Number(payload.overrides?.originalPrice || pPrice)
                        const pCategory = String(incomingCategory || '81283')
                        const pImage = mainImage || ''

                        const savedProduct = await prisma.product.create({
                            data: {
                                name: pName, wholesalePrice: pSupplyPrice, recommendedPrice: pOriginalPrice,
                                margin: 0, competition: 'Coupang', searchVolume: 0, category: pCategory,
                                image: pImage, source: 'Domeggook', trend: 'New', score: 80, userId: userId || undefined,
                            }
                        })
                        await prisma.registration.create({
                            data: {
                                productId: savedProduct.id, productName: pName, category: pCategory,
                                recommendedTitle: pName, price: pPrice, wholesalePrice: pSupplyPrice,
                                status: 'REGISTERED', platform: 'COUPANG', userId: userId || undefined,
                                sourceProductId: payload.sourceProductId || '', externalProductId: String(prodJson.data || ''),
                            }
                        })
                    } catch (dbError) { console.error('[Persistence Failed]', dbError) }
                }
            } catch (err: any) {
                console.error('[상품생성-에러]', err)
                productResult = { error: err?.message || String(err) }
            }
        }

        const isProductSuccess = productResult?.status === 200 && (productResult?.body?.code === 'SUCCESS' || productResult?.body?.data?.content?.code === 'SUCCESS')
        const finalSuccess = outRes.ok && retRes.ok && isProductSuccess

        return NextResponse.json({
            ok: finalSuccess, success: finalSuccess,
            message: finalSuccess ? '상품이 성공적으로 등록되었습니다.' : `등록 실패: ${productResult?.error || productResult?.body?.message || '상세 결과 확인 필요'}`,
            outbound: { success: outRes.ok, data: outJson, code: outboundShippingPlaceCode },
            returnCenter: { success: retRes.ok, data: retJson, code: returnCenterCode },
            coupang: productResult
        })
    } catch (err: any) {
        console.error('서버 내부 에러:', err)
        return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
    }
}
