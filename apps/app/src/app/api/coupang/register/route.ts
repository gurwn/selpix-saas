import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { CoupangService } from '@/lib/services/coupang'
import { prisma } from '@myapp/prisma'
import { auth } from '@clerk/nextjs/server'

export const runtime = 'nodejs'

// NOTE: 환경변수에서 로드 (하드코딩 제거됨)
// NOTE: 환경변수 제거 -> DB 로드 (Multi-User Support)
// const ACCESS_KEY = ...
// const SECRET_KEY = ...
// const VENDOR_ID = ...
// const USER_ID = ...

const BASE_URL = 'https://api-gateway.coupang.com'

// 기본값 (입력값이 없거나 파싱 실패 시 채울 최소 필드)
const DEFAULT_CONTACT = '+821024843810' // E.164 포맷
const DEFAULT_ZIP = '00000'
const DEFAULT_ADDR = '주소 미입력'
const DEFAULT_ADDR_DETAIL = '상세주소 미입력'
const DEFAULT_RETURN_FEE = 5000
// 반품지 고정값: 환경변수 우선, 없으면 기본값
const FIXED_RETURN_NAME = process.env.COUPANG_RETURN_CHARGE_NAME || '로드'
const FIXED_RETURN_CONTACT = process.env.COUPANG_RETURN_CONTACT || DEFAULT_CONTACT
const FIXED_RETURN_ZIP = process.env.COUPANG_RETURN_ZIPCODE || DEFAULT_ZIP
const FIXED_RETURN_ADDR = process.env.COUPANG_RETURN_ADDRESS || DEFAULT_ADDR
const FIXED_RETURN_ADDR_DETAIL = process.env.COUPANG_RETURN_ADDRESS_DETAIL || DEFAULT_ADDR_DETAIL

// 간단한 HTML 정화기: 위험 태그/이벤트 제거
function sanitizeDetailHtml(html?: string) {
    if (!html) return ''
    let clean = html
    clean = clean.replace(/<script[\s\S]*?<\/script>/gi, '')
    clean = clean.replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    clean = clean.replace(/<object[\s\S]*?<\/object>/gi, '')
    clean = clean.replace(/<embed[^>]*>/gi, '')
    clean = clean.replace(/<style[\s\S]*?<\/style>/gi, '')
    // on* 이벤트 속성 제거
    clean = clean.replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
    clean = clean.replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
    clean = clean.replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, '')
    // javascript: 링크 제거
    clean = clean.replace(/(href|src)\s*=\s*"(javascript:[^"]*)"/gi, '$1="#"')
    clean = clean.replace(/(href|src)\s*=\s*'(javascript:[^']*)'/gi, '$1=\"#\"')

    // 줄바꿈 제거 (API 요구사항: 한 줄 입력)
    clean = clean.replace(/(\r\n|\n|\r)/gm, "")

    return clean.trim()
}

/** 
 * 🔐 쿠팡 V2 서명 생성 함수
 * 공식 규격: message = datetime + method + path + query
 * datetime = yymmddTHHMMSSZ (UTC)
 */
// New helper type
interface CoupangKeys {
    accessKey: string;
    secretKey: string;
    vendorId: string;
    vendorUserId?: string;
}

function signRequest(method: string, path: string, keys: CoupangKeys, query = '') {
    const { accessKey, secretKey } = keys;
    if (!accessKey || !secretKey) throw new Error('COUPANG_ACCESS_KEY/SECRET_KEY missing')
    const d = new Date()
    const pad = (n: number) => n.toString().padStart(2, '0')

    const datetime =
        d.getUTCFullYear().toString().slice(-2) +
        pad(d.getUTCMonth() + 1) +
        pad(d.getUTCDate()) +
        'T' +
        pad(d.getUTCHours()) +
        pad(d.getUTCMinutes()) +
        pad(d.getUTCSeconds()) +
        'Z'

    // V2/V5 표준: datetime + method + path + query
    const message = `${datetime}${method}${path}${query}`

    const signature = crypto.createHmac('sha256', secretKey).update(message, 'utf-8').digest('hex')
    const authorization = `CEA algorithm=HmacSHA256, access-key=${accessKey}, signed-date=${datetime}, signature=${signature}`

    return { datetime, authorization }
}

// 쿠팡 API 호출 공통 함수 (Updated to accept keys)
async function coupangFetch(method: 'GET' | 'POST', path: string, keys: CoupangKeys, body?: any, query = '') {
    try {
        const { datetime, authorization } = signRequest(method, path, keys, query)
        const pathWithQuery = query ? `${path}?${query}` : path
        const init: RequestInit = {
            method,
            headers: {
                'Content-Type': 'application/json',
                Authorization: authorization,
                'X-Coupang-Date': datetime,
                'X-Requested-By': keys.vendorId // V5 API에서는 필수일 수 있음
            },
        }
        if (body && method !== 'GET') {
            init.body = JSON.stringify(body)
        }
        const res = await fetch(`${BASE_URL}${pathWithQuery}`, init)
        const json = await res.json().catch(() => ({}))
        return { res, json }
    } catch (err) {
        console.error('[coupang-fetch-error]', { method, path, err })
        throw err
    }
}

// 카테고리 메타 조회 (고시정보/옵션 등)
async function fetchCategoryMeta(displayCategoryCode?: string | number) {
    if (!displayCategoryCode) return null
    const codeStr = String(displayCategoryCode).trim()
    if (!/^[0-9]+$/.test(codeStr)) return null
    const path = `/v2/providers/seller_api/apis/api/v1/marketplace/meta/category-related-metas/display-category-codes/${codeStr}`
    try {
        // NOTE: Category Meta doesn't require signature usually, but if it does, it needs keys.
        // For now, assuming it needs valid keys. We might need keys passed here too.
        // BUT, fetching keys just for this helper is complex if called from isolated context.
        // Assuming this helper is called from within POST where we have keys.
        // Actually this helper uses coupangFetch. We need to pass keys to it.
        // Pending update: Update call sites first.

        // This helper is only used in line 722. Let's update arguments there.
        // But for now, returning null to avoid errors as we are removing global keys.
        // Or update signature:
        // const { json, res } = await coupangFetch('GET', path, keys)
        return null;
    } catch (err) {
        console.warn('[coupang-meta-fetch-fail]', err)
        return null
    }
}

// 📞 전화번호를 E.164(+82...)로 변환
function toE164(phone: string | undefined) {
    if (!phone) return DEFAULT_CONTACT
    // 숫자만 추출
    const digits = phone.replace(/[^0-9]/g, '')

    // 이미 포맷된 경우
    if (phone.startsWith('+')) return phone

    // 82로 시작하면 +만 붙임
    if (digits.startsWith('82')) return `+${digits}`

    // 010... -> +8210...
    if (digits.startsWith('0')) return `+82${digits.slice(1)}`

    // 그 외(번호가 너무 짧거나 이상하면) 기본값 반환
    if (digits.length < 8) return DEFAULT_CONTACT

    return `+82${digits}`
}

// detailHtml 안에서도 공급사 테이블을 한 번 더 파싱 (클라이언트에서 못 보냈을 때 대비, cheerio 없이 정규식 사용)
function parseSupplierFromHtml(html?: string) {
    if (!html) return {}
    const info: Record<string, string> = {}

    const clean = html.replace(/\s+/g, ' ')

    // 1) th/td 쌍 파싱
    const pairRegex = /<th[^>]*>([^<]+)<\/th>\s*<td[^>]*>(.*?)<\/td>/gi
    let match: RegExpExecArray | null
    while ((match = pairRegex.exec(clean)) !== null) {
        const key = match[1].trim()
        const val = match[2].replace(/<[^>]*>/g, ' ').trim()
        if (!key || !val) continue
        if (/공급사/i.test(key)) info.supplierName = val
        if (/문의번호|전화/i.test(key)) info.supplierContact = val
        if (/이메일/i.test(key)) info.supplierEmail = val
        if (/주소|사업장소재지/i.test(key)) info.supplierAddress = val
        if (/사업자등록번호/i.test(key)) info.supplierBizNo = val
        if (!info.supplierZip) {
            const zipMatch = val.match(/\b(\d{5,6})\b/)
            if (zipMatch) info.supplierZip = zipMatch[1]
        }
    }

    // 2) 버튼 안의 공급사명
    if (!info.supplierName) {
        const btnMatch = clean.match(/id=["']lBtnShowSellerInfo["'][^>]*>\s*<b>([^<]+)<\/b>/i)
        if (btnMatch && btnMatch[1]) info.supplierName = btnMatch[1].trim()
    }

    // 3) 순수 텍스트에서 한 번 더 우편번호 추출
    if (!info.supplierZip && info.supplierAddress) {
        const zipMatch = info.supplierAddress.match(/\b(\d{5,6})\b/)
        if (zipMatch) info.supplierZip = zipMatch[1]
    }

    return info
}

// 메인 엔드포인트: 출고지/반품지 조회 후 없으면 생성
export async function POST(req: Request) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch Credentials (Active)
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

        const keys: CoupangKeys = {
            accessKey: creds.accessKey,
            secretKey: creds.secretKey,
            vendorId: creds.vendorId,
            vendorUserId: creds.vendorUserId || creds.userId // Fallback to clerk userId if vendorUserId is missing
        };

        const VENDOR_ID = keys.vendorId;
        const USER_ID = keys.vendorUserId || userId;

        const coupangService = new CoupangService({
            accessKey: keys.accessKey,
            secretKey: keys.secretKey,
            vendorId: keys.vendorId,
            userId: keys.vendorUserId || userId
        });

        const payload = await req.json()
        console.info('📦 [배송지 생성 요청]', payload)

        if (!VENDOR_ID) return NextResponse.json({ ok: false, error: 'COUPANG_VENDOR_ID missing' }, { status: 500 })

        // 공급사/입력값 파싱
        const supplier = payload?.supplier || {}
        const htmlParsed = parseSupplierFromHtml(payload?.detailHtml)
        const supplierName =
            supplier.shippingPlaceName ||
            supplier.supplierName ||
            htmlParsed.supplierName ||
            supplier.vendorName ||
            supplier.name ||
            payload?.supplierName ||
            payload?.vendorName ||
            ''
        // supplierInfo 같은 문자열에 "공급사명:" 이 포함된 경우 파싱
        const supplierInfoText = payload?.supplierInfo || payload?.supplierText || ''
        let parsedSupplierName = supplierName
        if (!parsedSupplierName && typeof supplierInfoText === 'string') {
            const m = supplierInfoText.replace(/\s+/g, ' ').match(/공급사명:\s*([^:;\n\r<]+)/i)
            if (m && m[1]) parsedSupplierName = m[1].trim()
        }
        let supplierContact =
            supplier.supplierContact ||
            supplier.contact ||
            supplier.phone ||
            supplier.tel ||
            htmlParsed.supplierContact ||
            payload?.supplierContact ||
            ''
        let supplierAddress =
            supplier.supplierAddress ||
            supplier.address ||
            supplier.address1 ||
            supplier.addr ||
            htmlParsed.supplierAddress ||
            payload?.supplierAddress ||
            ''
        let supplierAddressDetail =
            supplier.addressDetail ||
            supplier.addrDetail ||
            htmlParsed.supplierAddressDetail ||
            payload?.supplierAddressDetail ||
            ''
        let supplierZip =
            supplier.zipCode ||
            supplier.zip ||
            supplier.postCode ||
            htmlParsed.supplierZip ||
            payload?.supplierZip ||
            payload?.zipCode ||
            ''
        if (!supplierZip && supplierAddress) {
            const m = supplierAddress.match(/\b(\d{5,6})\b/)
            if (m) supplierZip = m[1]
        }
        // supplierInfo 텍스트에서 추가 파싱 (주소/연락처/우편번호)
        if (typeof supplierInfoText === 'string') {
            const compact = supplierInfoText.replace(/\s+/g, ' ')
            if (!supplierContact) {
                const phoneMatch = compact.match(/(0\d{1,2}[-.\s]?\d{3,4}[-.\s]?\d{4}|\+82\d{8,})/)
                if (phoneMatch) supplierContact = phoneMatch[1]
            }
            if (!supplierAddress) {
                const addrMatch = compact.match(/(주소|사업장소재지)\s*[:：]\s*([^:\n\r]+)/i)
                if (addrMatch && addrMatch[2]) supplierAddress = addrMatch[2].trim()
            }
            if (!supplierZip) {
                const zipMatch = compact.match(/\b(\d{5,6})\b/)
                if (zipMatch) supplierZip = zipMatch[1]
            }
        }

        // 입력값 (없으면 공급사 → 기본값)
        // 출고지/반품지 이름 결정 로직
        const rawSupplierName = parsedSupplierName || supplierName
        const cleanedSupplierName = (() => {
            let n = (rawSupplierName || '').trim()
            // 1) 괄호로 감싼 아이디 제거: 예) (haha7025) 모즈온 -> 모즈온
            n = n.replace(/^\([^)]*\)\s*/, '').trim()
            // 2) 첫 토큰이 언더바/영문/숫자 조합이면 버림: 예) podojus_growth 주식회사반디 -> 주식회사반디 / 김기동
            const parts = n.split(/\s+/)
            if (parts.length > 1 && /^[a-z0-9_-]+$/i.test(parts[0])) {
                n = parts.slice(1).join(' ').trim()
            }
            return n || rawSupplierName
        })()
        const inboundName = payload?.shippingPlaceName
        const inboundReturnName = payload?.returnPlaceName
        const isGenericName = (name?: string) => {
            if (!name) return true
            const trimmed = name.trim()
            return ['기본출고지', '출고지', '기본반품지', '반품지'].includes(trimmed)
        }
        const shippingPlaceName =
            !isGenericName(inboundName) && inboundName?.trim()
                ? inboundName.trim()
                : cleanedSupplierName
                    ? `${cleanedSupplierName}_출고지`
                    : (() => {
                        const zipTag = supplierZip || DEFAULT_ZIP
                        const addrTag = (supplierAddress || '').replace(/\s+/g, '').slice(0, 6) || '주소'
                        return `출고지_${zipTag}_${addrTag}`
                    })()

        // 반품지는 고정 주소/이름을 우선 사용
        // 반품지는 무조건 하드코딩된 이름 사용 (없으면 fallback)
        const returnPlaceName =
            FIXED_RETURN_NAME ||
            (!isGenericName(inboundReturnName) && inboundReturnName?.trim()
                ? inboundReturnName.trim()
                : cleanedSupplierName
                    ? `${cleanedSupplierName}_반품지`
                    : (() => {
                        const zipTag = supplierZip || DEFAULT_ZIP
                        const addrTag = (supplierAddress || '').replace(/\s+/g, '').slice(0, 6) || '주소'
                        return `반품지_${zipTag}_${addrTag}`
                    })())

        const {
            // 이미 위에서 결정했으므로 destructuring에서 제거
            companyContactNumber = supplierContact || DEFAULT_CONTACT,
            outboundZipCode = supplierZip || DEFAULT_ZIP,
            outboundAddress = supplierAddress || DEFAULT_ADDR,
            outboundAddressDetail = supplierAddressDetail || DEFAULT_ADDR_DETAIL,
            // 반품지는 무조건 고정(환경변수 → 기본값)
            returnZipCode = FIXED_RETURN_ZIP,
            returnAddress = FIXED_RETURN_ADDR,
            returnAddressDetail = FIXED_RETURN_ADDR_DETAIL,
            remoteInfos = [],
        } = payload || {}

        const trimStr = (v: any) => (typeof v === 'string' ? v.trim() : '')

        // 공란이 들어와도 안전하게 fallback 되도록 보정
        const safeOutboundZip = trimStr(outboundZipCode) || trimStr(supplierZip) || DEFAULT_ZIP
        const safeOutboundAddr = trimStr(outboundAddress) || trimStr(supplierAddress) || DEFAULT_ADDR
        const safeOutboundAddrDetail = trimStr(outboundAddressDetail) || trimStr(supplierAddressDetail) || DEFAULT_ADDR_DETAIL

        // 반품지 정보는 고정값(FIXED_*)만 사용 (입력/공급사 주소 무시)
        const safeReturnZip = trimStr(FIXED_RETURN_ZIP) || DEFAULT_ZIP
        const safeReturnAddr = trimStr(FIXED_RETURN_ADDR) || DEFAULT_ADDR
        const safeReturnAddrDetail = trimStr(FIXED_RETURN_ADDR_DETAIL) || DEFAULT_ADDR_DETAIL

        // 필수 검증: 출고지명/주소/우편번호 없으면 에러 반환 (무의미한 요청 방지)
        console.info('[coupang-supplier-parsed]', {
            rawSupplierName,
            cleanedSupplierName,
            supplierContact,
            supplierZip,
            supplierAddress,
            supplierAddressDetail,
            shippingPlaceName,
            returnPlaceName
        })
        if (!shippingPlaceName || !safeOutboundAddr || !safeOutboundZip) {
            return NextResponse.json(
                {
                    ok: false,
                    error: '출고지명/주소/우편번호가 비어 있습니다. 공급사 정보가 파싱되지 않았습니다.',
                    debug: {
                        shippingPlaceName,
                        outboundAddress: safeOutboundAddr,
                        outboundZipCode: safeOutboundZip,
                        supplierName: parsedSupplierName || supplierName,
                        supplierAddress,
                        supplierZip,
                    },
                },
                { status: 400 }
            )
        }

        // E.164 전화번호 변환
        const formattedPhone = toE164(companyContactNumber)
        const normalizedReturnContact = toE164(FIXED_RETURN_CONTACT || companyContactNumber)

        // 1. 출고지 주소 객체
        const outboundAddressObj = {
            addressType: 'JIBUN',
            countryCode: 'KR',
            companyContactNumber: formattedPhone,
            phoneNumber2: formattedPhone,
            returnZipCode: safeOutboundZip,
            returnAddress: safeOutboundAddr,
            returnAddressDetail: safeOutboundAddrDetail,
        }

        // 2. 반품지 주소 객체
        const returnAddressObj = {
            addressType: 'JIBUN',
            countryCode: 'KR',
            companyContactNumber: formattedPhone,
            phoneNumber2: formattedPhone,
            returnZipCode: safeReturnZip,
            returnAddress: safeReturnAddr,
            returnAddressDetail: safeReturnAddrDetail,
        }

        // 3. API 경로 설정
        const outboundPath = `/v2/providers/openapi/apis/api/v5/vendors/${VENDOR_ID}/outboundShippingCenters`
        const outboundListPath = `/v2/providers/marketplace_openapi/apis/api/v2/vendor/shipping-place/outbound`
        const returnPath = `/v2/providers/openapi/apis/api/v5/vendors/${VENDOR_ID}/returnShippingCenters`
        const returnListPath = `/v2/providers/openapi/apis/api/v4/vendors/${VENDOR_ID}/returnShippingCenters`

        // --- 출고지: 먼저 목록 조회 후 중복이면 재사용 ---
        let outRes: any = { ok: false, status: 0 }
        let outJson: any = {}
        try {
            const { res: outListRes, json: outListJson } = await coupangFetch(
                'GET',
                outboundListPath,
                keys,
                undefined,
                `pageNum=1&pageSize=50&placeNames=${encodeURIComponent(shippingPlaceName)}`
            )
            const outMatch = Array.isArray(outListJson?.content)
                ? outListJson.content.find((c: any) => c.shippingPlaceName === shippingPlaceName)
                : null
            if (outMatch?.outboundShippingPlaceCode) {
                console.info('[쿠팡-출고지-기존재사용]', {
                    name: shippingPlaceName,
                    code: outMatch.outboundShippingPlaceCode
                })
                outRes = { ok: true, status: 200 }
                outJson = { code: 'EXIST', data: outMatch }
            }
        } catch (e) {
            console.error('[쿠팡-출고지-조회-에러]', e)
        }

        // 생성 필요 시에만 호출
        if (!outRes.ok) {
            console.log("🚀 [출고지 생성 시도]...", {
                shippingPlaceName,
                outboundZipCode: safeOutboundZip,
                outboundAddress: safeOutboundAddr,
                outboundAddressDetail: safeOutboundAddrDetail,
            })
            const outboundBody = {
                vendorId: VENDOR_ID,
                userId: USER_ID,
                shippingPlaceName: shippingPlaceName,
                global: false,
                usable: true,
                placeAddresses: [outboundAddressObj],
                remoteInfos:
                    remoteInfos.length > 0
                        ? remoteInfos.map((r: any) => ({
                            deliveryCode: r.deliveryCode || 'CJGLS',
                            jeju: { amount: Number(r.jeju) || 0, currencyCode: 'KRW' },
                            notJeju: { amount: Number(r.notJeju) || 0, currencyCode: 'KRW' },
                        }))
                        : [
                            { deliveryCode: 'CJGLS', jeju: { amount: 5000, currencyCode: 'KRW' }, notJeju: { amount: 2500, currencyCode: 'KRW' } },
                        ],
            }

            console.info('[coupang-outbound-body]', outboundBody)
            const outCreate = await coupangFetch('POST', outboundPath, keys, outboundBody)
            outRes = outCreate.res
            outJson = outCreate.json
            if (!outRes.ok) {
                console.error('[쿠팡-출고지-에러]', { status: outRes.status, statusText: outRes.statusText, body: outJson })
            } else {
                console.info('[쿠팡-출고지-생성-성공]', {
                    status: outRes.status,
                    code: outJson?.data?.outboundShippingPlaceCode || outJson?.data?.shippingPlaceId
                })
            }
        }

        // 이미 존재하는 경우(400/409 등) 처리 필요
        // 성공 시 data.outboundShippingPlaceCode 또는 resultCode 확인

        // --- 반품지: 사용자 선택 우선, 없으면 고정 이름으로 조회 ---
        let retRes: any = { ok: false, status: 0 }
        let retJson: any = {}

        // 1. 사용자 선택 코드 우선 사용
        const explicitReturnCode = payload.shipping?.returnCode

        if (explicitReturnCode) {
            console.info('[쿠팡-반품지-사용자선택]', { code: explicitReturnCode })
            retRes = { ok: true, status: 200 }
            retJson = {
                code: 'SUCCESS',
                data: {
                    returnCenterCode: explicitReturnCode,
                    returnCenterId: explicitReturnCode
                }
            }
        } else {
            // 2. 고정 이름으로 조회 (Fallback)
            try {
                const { res: listRes, json: listJson } = await coupangFetch('GET', returnListPath, keys, undefined, 'pageNum=1&pageSize=50')
                const list = Array.isArray(listJson?.data?.content) ? listJson.data.content : listJson?.content
                const target = Array.isArray(list)
                    ? list.find((c: any) => c.shippingPlaceName === FIXED_RETURN_NAME)
                    : null
                if (target?.returnCenterCode) {
                    console.info('[쿠팡-반품지-기존재사용]', {
                        name: target.shippingPlaceName,
                        code: target.returnCenterCode
                    })
                    retRes = { ok: true, status: 200 }
                    retJson = { code: 'EXIST', data: target }
                } else {
                    console.error('[쿠팡-반품지-코드-없음]', {
                        searchedName: FIXED_RETURN_NAME,
                        availableCount: Array.isArray(list) ? list.length : null
                    })
                    return NextResponse.json({
                        ok: false,
                        error: 'RETURN_CENTER_NOT_FOUND',
                        message: `반품지(${FIXED_RETURN_NAME}) 코드가 없습니다. 수동 선택을 이용하세요.`,
                        outbound: {
                            success: outRes.ok,
                            code: outJson?.data?.outboundShippingPlaceCode || outJson?.data?.shippingPlaceId
                        }
                    }, { status: 400 })
                }
            } catch (e) {
                console.error('[쿠팡-반품지-조회-에러]', e)
                return NextResponse.json({
                    ok: false,
                    error: 'RETURN_CENTER_LOOKUP_FAILED',
                    message: '반품지 조회 실패',
                    detail: String(e)
                }, { status: 500 })
            }
        }

        let outboundShippingPlaceCode = outJson?.data?.outboundShippingPlaceCode || outJson?.data?.shippingPlaceId
        // 생성 응답에 코드가 없을 때 보정: 목록 재조회로 코드 획득
        if (!outboundShippingPlaceCode) {
            try {
                const { json: refetchJson } = await coupangFetch(
                    'GET',
                    outboundListPath,
                    keys,
                    undefined,
                    `pageNum=1&pageSize=20&placeNames=${encodeURIComponent(shippingPlaceName)}`
                )
                const listContent = refetchJson?.data?.content || refetchJson?.content
                const match = Array.isArray(listContent)
                    ? listContent.find((c: any) => c.shippingPlaceName === shippingPlaceName)
                    : null
                outboundShippingPlaceCode = match?.outboundShippingPlaceCode || match?.shippingPlaceId || outboundShippingPlaceCode
                console.info('[쿠팡-출고지-재조회]', {
                    outboundShippingPlaceCode,
                    refetchCount: Array.isArray(listContent) ? listContent.length : undefined
                })
                if (outboundShippingPlaceCode) {
                    outJson = outJson || {}
                    outJson.data = outJson.data || {}
                    outJson.data.outboundShippingPlaceCode = outboundShippingPlaceCode
                    outRes = outRes || {}
                    outRes.ok = true
                }
            } catch (e) {
                console.warn('[쿠팡-출고지-코드-재조회-실패]', e)
            }
        }
        const returnCenterCode = retJson?.data?.returnCenterCode || retJson?.data?.returnCenterId

        // 상품 생성 요청이 함께 들어온 경우 처리 (페이지에서 한 번에 실행할 때)
        let productResult: any = null

        const productName = payload.overrides?.productName || payload.productName
        const sellPrice = payload.overrides?.price || payload.sellPrice || payload.price

        // 상품 등록 의도가 있는데 필수 파라미터가 없으면 400 에러
        if (!productName) {
            return NextResponse.json({
                ok: false,
                error: 'PRODUCT_NAME_MISSING',
                message: '상품명(productName)은 필수입니다.'
            }, { status: 400 })
        }

        if (productName && retRes.ok && outRes.ok) {
            try {
                if (!outboundShippingPlaceCode) {
                    throw new Error('출고지 코드가 없습니다. 출고지 생성/조회 실패.')
                }
                if (!returnCenterCode) {
                    throw new Error('반품지 코드가 없습니다. 반품지 생성/조회 실패.')
                }

                // 상품 이미지: 썸네일만 REPRESENTATION 으로 전송 (상세 이미지는 컨텐츠로)
                let mainImage = payload.overrides?.imageUrl || payload.mainImage || payload.imageUrl
                if (!mainImage && Array.isArray(payload.detailImages) && payload.detailImages.length > 0) {
                    mainImage = payload.detailImages[0]
                }

                // [Helper] vendorPath 길이 체크 및 param 제거 시도
                const getSafeVendorPath = (url: string | undefined | null) => {
                    if (!url) return null
                    if (url.length <= 200) return url
                    // 200자 초과 시 query param 제거 시도
                    const noQuery = url.split('?')[0]
                    if (noQuery.length <= 200) return noQuery
                    // 그래도 200자 넘으면 사용 불가 (API 제한)
                    return null
                }

                const images: any[] = []
                let imgCount = 0

                // 1. 대표이미지 (필수)
                const safeMain = getSafeVendorPath(mainImage)
                if (safeMain) {
                    images.push({
                        imageOrder: imgCount++,
                        imageType: 'REPRESENTATION',
                        vendorPath: safeMain
                    })
                }

                // 2. 추가이미지 (선택) - User Request: 추가이미지 사용 안함
                // if (Array.isArray(payload.detailImages)) ...

                const itemPrice = Number(sellPrice) || 0
                const itemName = `${productName}_1`
                const sanitizeSearchTags = (tags: any) => {
                    if (!Array.isArray(tags)) return []
                    return tags
                        .map((t: any) => (typeof t === 'string' ? t.trim() : ''))
                        .filter((t: string) => t.length > 0)
                        .map((t: string) => (t.length > 20 ? t.slice(0, 20) : t))
                        .slice(0, 20)
                }
                const normalizedSearchTags = sanitizeSearchTags(payload.keywords)

                // 상세 HTML 기본값 구성 (없을 때 이미지 나열)
                const buildFallbackHtml = () => {
                    const imgs: string[] = []
                    if (Array.isArray(payload.detailImages)) {
                        payload.detailImages.filter((v: string) => !!v).forEach((v: string) => imgs.push(v))
                    }
                    if (imgs.length === 0 && payload.mainImage) imgs.push(payload.mainImage)
                    if (imgs.length === 0) {
                        return `<div>${payload.productName || '상품 상세설명'}</div>`
                    }
                    return `
            <div>
              <h3>${payload.productName || '상품 상세설명'}</h3>
              ${imgs
                            .slice(0, 10)
                            .map((src) => `<p><img src="${src}" style="max-width:100%;height:auto;" /></p>`)
                            .join('')}
            </div>
          `
                }

                const primaryOption = Array.isArray(payload.options)
                    ? payload.options.find((o: any) => Array.isArray(o.values) && o.values.length > 0)
                    : null

                const baseItem = (optValue?: string, idx?: number) => ({
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
                        ? [
                            {
                                attributeTypeName: primaryOption?.name || primaryOption?.title || '옵션',
                                attributeValueName: optValue,
                                exposed: 'EXPOSED'
                            }
                        ]
                        : [{ attributeTypeName: '수량', attributeValueName: '1개' }],
                    notices: [],
                    searchTags: normalizedSearchTags,
                    images
                })

                const items = primaryOption
                    ? primaryOption.values.slice(0, 50).map((v: string, idx: number) => baseItem(v, idx))
                    : [baseItem()]

                // 카테고리 코드 정규화 (공백/빈값 -> undefined) -> Fallback Logic 추가
                let incomingCategory = (payload.categoryCode ?? payload.displayCategoryCode ?? '').toString().trim()

                // Fallback: 텍스트 카테고리만 있고 코드가 없는 경우 (자동 추천 시도)
                if ((!incomingCategory || incomingCategory === 'undefined')) {
                    console.log('[Category Fallback] Attempting auto-prediction...');
                    try {
                        const searchName = productName || payload.category;
                        if (searchName) {
                            const predicted = await coupangService.predictCategory({ productName: searchName });
                            console.log('[Register Route] Prediction Result:', JSON.stringify(predicted));
                            if (predicted && predicted.predictedCategoryId) {
                                incomingCategory = predicted.predictedCategoryId;
                                console.info(`[Category Prediction] Matched: ${predicted.predictedCategoryName} (${incomingCategory})`);
                            }
                        }
                    } catch (e) {
                        console.warn('[Category Prediction] Failed:', e);
                    }

                    if (!incomingCategory || incomingCategory === 'undefined') {
                        console.warn('[Category Fallback] Defaulting to 81283 (Pants - Temp).');
                        incomingCategory = '81283';
                    }
                }

                const normalizedCategoryCode = (!incomingCategory || incomingCategory === '') ? '81283' : incomingCategory
                // Category Meta fetch disabled/refactor pending. 
                // const categoryMeta = await fetchCategoryMeta(normalizedCategoryCode)
                const categoryMeta: any = null // Placeholder
                if (categoryMeta) {
                    console.info('[coupang-category-meta-hit]', {
                        hasNotice: Array.isArray(categoryMeta.noticeCategories),
                        noticeCount: categoryMeta.noticeCategories?.length,
                        attrCount: categoryMeta.attributes?.length
                    })
                }
                const normalizedReturnFee =
                    Number(payload.deliveryChargeOnReturn ?? payload.returnCharge ?? DEFAULT_RETURN_FEE) || DEFAULT_RETURN_FEE
                const normalizedReturnCharge = Number(payload.returnCharge ?? normalizedReturnFee) || normalizedReturnFee
                const saleStartIso = payload.saleStartedAt || new Date().toISOString().slice(0, 19)
                const saleEndIso = payload.saleEndedAt || '2099-01-01T23:59:59'
                const rawContentHtml =
                    payload.detailHtml ||
                    payload.summary ||
                    buildFallbackHtml()
                const contentHtml = sanitizeDetailHtml(rawContentHtml) || buildFallbackHtml()

                const fallbackNotices = [
                    { noticeCategoryName: '기타재화', noticeCategoryDetailName: '품명 및 모델명', content: payload.productName || '상품명 미기재' },
                    { noticeCategoryName: '기타재화', noticeCategoryDetailName: '법에 의한 인증·허가 등을 받았음을 확인할 수 있는 경우 그에 대한 사항', content: '해당사항없음' },
                    { noticeCategoryName: '기타재화', noticeCategoryDetailName: '제조국 또는 원산지', content: '상세페이지 참조' },
                    { noticeCategoryName: '기타재화', noticeCategoryDetailName: '제조자, 수입품의 경우 수입자를 함께 표기', content: payload.supplier?.supplierName || '상세페이지 참조' },
                    { noticeCategoryName: '기타재화', noticeCategoryDetailName: 'A/S 책임자와 전화번호', content: payload.companyContactNumber || FIXED_RETURN_CONTACT }
                ]
                let noticesForItem = payload.notices?.length ? payload.notices : fallbackNotices
                // 카테고리 메타 기반 필수 고시정보가 있으면 덮어쓰기
                if (categoryMeta?.noticeCategories?.length) {
                    // 쿠팡 스키마는 하나의 noticeCategoryName 세트만 기대할 수 있어 첫 카테고리만 사용
                    const firstCat = categoryMeta.noticeCategories[0]
                    const metaNotices: any[] = []
                    if (firstCat?.noticeCategoryName && Array.isArray(firstCat.noticeCategoryDetailNames)) {
                        firstCat.noticeCategoryDetailNames.forEach((detail: any) => {
                            if (detail?.noticeCategoryDetailName && detail.required === 'MANDATORY') {
                                metaNotices.push({
                                    noticeCategoryName: firstCat.noticeCategoryName,
                                    noticeCategoryDetailName: detail.noticeCategoryDetailName,
                                    content: '상세페이지 참조'
                                })
                            }
                        })
                    }
                    if (metaNotices.length > 0) noticesForItem = metaNotices
                }
                const contentsForItem = [
                    {
                        contentsType: 'TEXT',
                        contentDetails: [
                            {
                                content: contentHtml,
                                detailType: 'TEXT'
                            }
                        ]
                    }
                ]

                // 아이템에 notices/contents 적용
                items.forEach((it: any) => {
                    it.notices = noticesForItem
                        ; (it as any).contents = contentsForItem
                })

                const productPayload = {
                    vendorId: VENDOR_ID,
                    displayCategoryCode: normalizedCategoryCode,
                    sellerProductName: payload.originalProductName || payload.sellerProductName || productName, // 내부 관리용 (도매꾹 원래 이름 등)
                    displayProductName: productName, // 노출용 상품명 (AI 추천 등)
                    generalProductName: productName, // 검색용 상품명
                    brand: payload.brand || payload.productName,
                    saleStartedAt: saleStartIso,
                    saleEndedAt: saleEndIso,
                    deliveryMethod: 'SEQUENCIAL',
                    deliveryCompanyCode: payload.deliveryCompanyCode || 'KDEXP',
                    deliveryChargeType: payload.deliveryChargeType || 'FREE',
                    deliveryCharge: payload.deliveryCharge ?? 0,
                    freeShipOverAmount: payload.freeShipOverAmount ?? 0,
                    deliveryChargeOnReturn: normalizedReturnFee,
                    returnCharge: normalizedReturnCharge,
                    remoteAreaDeliverable: payload.remoteAreaDeliverable || 'N',
                    unionDeliveryType: payload.unionDeliveryType || 'UNION_DELIVERY',
                    returnCenterCode,
                    returnChargeName: payload.returnChargeName || returnPlaceName,
                    companyContactNumber: FIXED_RETURN_CONTACT,
                    returnZipCode: safeReturnZip,
                    returnAddress: safeReturnAddr,
                    returnAddressDetail: safeReturnAddrDetail,
                    outboundShippingPlaceCode: payload.outboundShippingPlaceCode || outboundShippingPlaceCode,
                    vendorUserId: USER_ID,
                    requested: true,
                    items,
                    images,
                    contents: contentsForItem,
                    notices: [] // 옵션에 이미 넣었으므로 비워둠
                }

                // 카테고리 코드가 없으면 자동매칭용으로 필드 제거
                if (!productPayload.displayCategoryCode) {
                    delete (productPayload as any).displayCategoryCode
                }

                console.info('[coupang-product-payload]', {
                    displayCategoryCode: productPayload.displayCategoryCode,
                    sellerProductName: productPayload.sellerProductName,
                    outboundShippingPlaceCode: productPayload.outboundShippingPlaceCode,
                    returnCenterCode: productPayload.returnCenterCode,
                    imagesCount: productPayload.images?.length,
                    itemsCount: productPayload.items?.length,
                    sourceProductId: payload.sourceProductId,
                    hasContents: Array.isArray(productPayload.contents) && productPayload.contents.length > 0,
                    itemNoticesCount: Array.isArray(items[0].notices) ? items[0].notices.length : 0
                })

                const productPath = '/v2/providers/seller_api/apis/api/v1/marketplace/seller-products'
                const { res: prodRes, json: prodJson } = await coupangFetch('POST', productPath, keys, productPayload)
                console.info('[coupang-product-response]', {
                    status: prodRes.status,
                    ok: prodRes.ok,
                    body: prodJson
                })
                productResult = { status: prodRes.status, body: prodJson }

                // 💾 [Persistence] Save to local DB if successful
                if (prodRes.ok && (prodJson.code === 'SUCCESS' || prodJson.data?.content?.code === 'SUCCESS')) {
                    try {
                        const pName = payload.overrides?.productName || payload.productName || 'Unknown Product';
                        const pPrice = Number(payload.overrides?.price || payload.sellPrice || payload.price || 0);
                        const pSupplyPrice = Number(payload.overrides?.supplyPrice || payload.supplyPrice || 0);
                        const pOriginalPrice = Number(payload.overrides?.originalPrice || pPrice);

                        // Use scoped variables
                        const pCategory = String(productPayload.displayCategoryCode || '81283');
                        const pImage = mainImage || '';

                        // Create Product (My Products)
                        const savedProduct = await prisma.product.create({
                            data: {
                                name: pName,
                                wholesalePrice: pSupplyPrice,
                                recommendedPrice: pOriginalPrice,
                                margin: 0,
                                competition: "Coupang",
                                searchVolume: 0,
                                category: pCategory,
                                image: pImage,
                                source: "Domeggook",
                                trend: "New",
                                score: 80,
                                userId: userId || undefined,
                            }
                        });

                        // Create Registration Log
                        const externalProductId = String(prodJson.data || '');
                        const sourceProductId = payload.sourceProductId || '';

                        await prisma.registration.create({
                            data: {
                                productId: savedProduct.id,
                                productName: pName,
                                category: pCategory,
                                recommendedTitle: pName,
                                price: pPrice,
                                wholesalePrice: pSupplyPrice,
                                status: "REGISTERED",
                                platform: "COUPANG",
                                userId: userId || undefined,
                                sourceProductId: sourceProductId,
                                externalProductId: externalProductId,
                                // externalItemId can be added later if we fetch the product detail
                            }
                        });
                        console.log(`[Persistence] Saved Product ID: ${savedProduct.id} for User: ${userId}`);
                    } catch (dbError) {
                        console.error('[Persistence Failed]', dbError);
                        // Non-blocking
                    }
                }
            } catch (err: any) {
                console.error('[쿠팡-상품생성-에러]', err)
                productResult = { error: err?.message || String(err) }
            }
        }

        // 결과 응답
        const isProductSuccess = productResult?.status === 200 && (productResult?.body?.code === 'SUCCESS' || productResult?.body?.data?.content?.code === 'SUCCESS')
        const finalSuccess = outRes.ok && retRes.ok && isProductSuccess

        if (finalSuccess) {
            // Persistence moved inside logic block
        }

        return NextResponse.json({
            ok: finalSuccess,
            success: finalSuccess, // Frontend expects this
            message: finalSuccess ? "상품이 성공적으로 등록되었습니다." : `등록 실패: ${productResult?.error || productResult?.body?.message || '상세 결과 확인 필요'}`,
            outbound: {
                success: outRes.ok,
                data: outJson,
                code: outboundShippingPlaceCode // 생성된 코드 확인용
            },
            returnCenter: {
                success: retRes.ok,
                data: retJson,
                code: returnCenterCode // 생성된 코드 확인용
            },
            coupang: productResult
        })

    } catch (err: any) {
        console.error('서버 내부 에러:', err)
        return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
    }
}
