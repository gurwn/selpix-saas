const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const fetch = global.fetch;

const BASE_URL = 'https://api-gateway.coupang.com';
const ACCESS_KEY = process.env.COUPANG_ACCESS_KEY;
const SECRET_KEY = process.env.COUPANG_SECRET_KEY;
const VENDOR_ID = process.env.COUPANG_VENDOR_ID;
const VENDOR_USER_ID = process.env.COUPANG_VENDOR_USER_ID || VENDOR_ID;
const RETURN_NAME = process.env.COUPANG_RETURN_CHARGE_NAME || '반품지';
const RETURN_CONTACT = toE164(process.env.COUPANG_RETURN_CONTACT || '+821024843810');
const RETURN_ZIP = process.env.COUPANG_RETURN_ZIPCODE || '00000';
const RETURN_ADDR = process.env.COUPANG_RETURN_ADDRESS || '주소 미입력';
const RETURN_ADDR_DETAIL = process.env.COUPANG_RETURN_ADDRESS_DETAIL || '상세주소 미입력';

const DETAIL_OVERRIDE = "https://deddagre.esellersimg.co.kr/d_smartg/smartg_timon.jpg";

function toE164(phone){
  if(!phone) return '+821024843810';
  const digits = phone.replace(/[^0-9]/g,'');
  if(phone.startsWith('+')) return phone;
  if(digits.startsWith('82')) return `+${digits}`;
  if(digits.startsWith('0')) return `+82${digits.slice(1)}`;
  return `+82${digits}`;
}

function sign(method, pathUrl, query='') {
  const d = new Date();
  const pad = n => String(n).padStart(2,'0');
  const datetime = `${String(d.getUTCFullYear()).slice(-2)}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  const msg = `${datetime}${method}${pathUrl}${query}`;
  const sig = crypto.createHmac('sha256', SECRET_KEY).update(msg,'utf-8').digest('hex');
  return { datetime, authorization: `CEA algorithm=HmacSHA256, access-key=${ACCESS_KEY}, signed-date=${datetime}, signature=${sig}` };
}

async function cf(method, pathUrl, body=null, query=''){
  const {datetime, authorization} = sign(method, pathUrl, query);
  const url = `${BASE_URL}${pathUrl}${query ? '?' + query : ''}`;
  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type':'application/json',
      'Authorization': authorization,
      'X-Coupang-Date': datetime,
      'X-Requested-By': VENDOR_ID,
    },
    body: body && method !== 'GET' ? JSON.stringify(body) : undefined
  });
  let json={};
  try{ json = await res.json(); }catch(e){ }
  return {res,json};
}

async function predictCategory(productName){
  const pathUrl = '/v2/providers/openapi/apis/api/v1/categorization/predict';
  const body = { productName: productName.slice(0,200) };
  const {json} = await cf('POST', pathUrl, body);
  const id = json?.data?.predictedCategoryId;
  const name = json?.data?.predictedCategoryName;
  if(!id) throw new Error('카테고리 예측 실패: '+JSON.stringify(json));
  return {id, name};
}

async function getCategoryMeta(displayCategoryCode){
  const pathUrl = `/v2/providers/seller_api/apis/api/v1/marketplace/meta/category-related-metas/display-category-codes/${displayCategoryCode}`;
  const {json} = await cf('GET', pathUrl, null, '');
  if(json?.code!=='SUCCESS') throw new Error('메타 조회 실패: '+JSON.stringify(json));
  return json.data;
}

async function ensureOutbound(name='자동출고지'){
  const listPath = `/v2/providers/marketplace_openapi/apis/api/v2/vendor/shipping-place/outbound`;
  const q = `pageNum=1&pageSize=50&placeNames=${encodeURIComponent(name)}`;
  try{
    const {json}=await cf('GET', listPath, null, q);
    const list = json?.data?.content || json?.content || [];
    const hit = list.find(x=>x.shippingPlaceName===name);
    if(hit) return hit.outboundShippingPlaceCode || hit.shippingPlaceId;
  }catch(e){console.warn('outbound list fail',e.message);} 
  const pathUrl = `/v2/providers/openapi/apis/api/v5/vendors/${VENDOR_ID}/outboundShippingCenters`;
  const body = {
    vendorId: VENDOR_ID,
    userId: VENDOR_USER_ID,
    shippingPlaceName: name,
    global: false,
    usable: true,
    placeAddresses: [{
      addressType:'JIBUN', countryCode:'KR', companyContactNumber: RETURN_CONTACT, phoneNumber2: RETURN_CONTACT,
      returnZipCode: RETURN_ZIP, returnAddress: RETURN_ADDR, returnAddressDetail: RETURN_ADDR_DETAIL
    }],
    remoteInfos:[{deliveryCode:'CJGLS', jeju:{amount:5000,currencyCode:'KRW'}, notJeju:{amount:2500,currencyCode:'KRW'}}]
  };
  const {json}=await cf('POST', pathUrl, body);
  const code = json?.data?.outboundShippingPlaceCode || json?.data?.shippingPlaceId || json?.data?.resultMessage;
  if(json?.code!=='SUCCESS' && json?.data?.resultCode!=='SUCCESS') throw new Error('출고지 생성 실패: '+JSON.stringify(json));
  if(!code) throw new Error('출고지 코드 누락: '+JSON.stringify(json));
  return code;
}

async function ensureReturn(name='자동반품지'){
  const listPath = `/v2/providers/openapi/apis/api/v4/vendors/${VENDOR_ID}/returnShippingCenters`;
  try{
    const {json}=await cf('GET', listPath, null, 'pageNum=1&pageSize=50');
    const list = json?.data?.content || json?.content || [];
    const hit = list.find(x=>x.shippingPlaceName===name) || list[0];
    if(hit) return hit.returnCenterCode || hit.returnCenterId;
  }catch(e){console.warn('return list fail',e.message);} 
  const pathUrl = `/v2/providers/openapi/apis/api/v5/vendors/${VENDOR_ID}/returnShippingCenters`;
  const body = {
    vendorId: VENDOR_ID,
    userId: VENDOR_USER_ID,
    shippingPlaceName: name,
    placeAddresses:[{
      addressType:'JIBUN', countryCode:'KR', companyContactNumber: RETURN_CONTACT, phoneNumber2: RETURN_CONTACT,
      returnZipCode: RETURN_ZIP, returnAddress: RETURN_ADDR, returnAddressDetail: RETURN_ADDR_DETAIL
    }]
  };
  const {json}=await cf('POST', pathUrl, body);
  const code = json?.data?.returnCenterCode || json?.data?.returnCenterId || json?.data?.resultMessage;
  if(json?.code!=='SUCCESS' && json?.data?.resultCode!=='SUCCESS') throw new Error('반품지 생성 실패: '+JSON.stringify(json));
  if(!code) throw new Error('반품지 코드 누락: '+JSON.stringify(json));
  return code;
}

function buildNoticesFromMeta(meta){
  const notices=[];
  if(meta?.noticeCategories?.length){
    // 기타 재화 카테고리 우선
    const preferred = meta.noticeCategories.find(c=>c.noticeCategoryName.includes('기타')) || meta.noticeCategories[0];
    const catName = preferred.noticeCategoryName;
    (preferred.noticeCategoryDetailNames||[]).forEach(d=>{
      if(d.required==='MANDATORY'){
        notices.push({noticeCategoryName: catName, noticeCategoryDetailName: d.noticeCategoryDetailName, content:'상세페이지 참조'});
      }
    });
  }
  if(!notices.length){
    notices.push({noticeCategoryName:'기타 재화', noticeCategoryDetailName:'품명 및 모델명', content:'상세페이지 참조'});
  }
  return notices;
}

function buildItems(product, cat, meta, images){
  const notices = buildNoticesFromMeta(meta);
  const contents = [ { contentsType:'TEXT', contentDetails:[{content: ((product.detailHtml||product.detailText||product.description||product.name||'상품 상세설명') + `<img src="${DETAIL_OVERRIDE}" border="0" />`).slice(0,2000), detailType:'TEXT'}] } ];
  const basePrice = Number(product.price)||0;
  let attrs=[];
  if(cat.name.includes('무선충전기')){
    attrs=[
      {attributeTypeName:'색상', value:'블랙'},
      {attributeTypeName:'수량', value:`${product.minOrderQuantity||1}개`}
    ];
  } else if(cat.name.includes('물통')||cat.name.includes('보틀')){
    attrs=[
      {attributeTypeName:'색상', value:'화이트'},
      {attributeTypeName:'개당 용량', value:'500ml'},
      {attributeTypeName:'수량', value:`${product.minOrderQuantity||1}개`}
    ];
  }
  const attrEntries = attrs.map(a=>({
    attributeTypeName: a.attributeTypeName,
    attributeValueName: a.value,
    exposed:'EXPOSED'
  }));

  const nameSuffix = attrEntries.map(a=>`${a.attributeTypeName}:${a.attributeValueName}`).join(' ');
  return [{
    itemName: `${product.name} ${nameSuffix}`.slice(0,200),
    originalPrice: basePrice,
    salePrice: basePrice,
    maximumBuyCount: 99999,
    maximumBuyForPerson: 0,
    maximumBuyForPersonPeriod: 1,
    outboundShippingTimeDay: 2,
    unitCount: 1,
    adultOnly:'EVERYONE', taxType:'TAX', parallelImported:'NOT_PARALLEL_IMPORTED', overseasPurchased:'NOT_OVERSEAS_PURCHASED',
    pccNeeded:false,
    barcode:'', emptyBarcode:true, emptyBarcodeReason:'상품확인불가_바코드없음사유',
    certifications:[{certificationType:'NOT_REQUIRED', certificationCode:''}],
    attributes: attrEntries,
    notices,
    searchTags:[],
    images,
    contents,
    offerCondition:'NEW',
    offerDescription:''
  }];
}

function sanitizeImages(list){
  const base = Array.isArray(list)?list:[];
  const dedup=[...new Set(base.filter(Boolean))];
  return dedup.map((src,i)=>({imageOrder:i, imageType: i===0?'REPRESENTATION':'DETAIL', vendorPath: src.slice(0,200)})).slice(0,3);
}

function buildPayload(product, outboundCode, returnCode, cat, meta){
  const detailImages = product.detailImages||[];
  const images = sanitizeImages(detailImages.length?detailImages:[product.imageUrl].filter(Boolean));
  const items = buildItems(product, cat, meta, images);
  const productName = (product.name || '도매꾹 상품').slice(0,200);
  return {
    vendorId: VENDOR_ID,
    displayCategoryCode: cat.id,
    sellerProductName: productName,
    displayProductName: productName,
    generalProductName: productName,
    brand: product.brand || productName,
    saleStartedAt: new Date().toISOString().slice(0,19),
    saleEndedAt: '2099-01-01T23:59:59',
    deliveryMethod: 'SEQUENCIAL',
    deliveryCompanyCode: 'CJGLS',
    deliveryChargeType: 'FREE',
    deliveryCharge: 0,
    freeShipOverAmount: 0,
    deliveryChargeOnReturn: 5000,
    returnCharge: 5000,
    remoteAreaDeliverable: 'N',
    unionDeliveryType: 'UNION_DELIVERY',
    returnCenterCode: returnCode,
    returnChargeName: RETURN_NAME,
    companyContactNumber: RETURN_CONTACT,
    returnZipCode: RETURN_ZIP,
    returnAddress: RETURN_ADDR,
    returnAddressDetail: RETURN_ADDR_DETAIL,
    outboundShippingPlaceCode: outboundCode,
    vendorUserId: VENDOR_USER_ID,
    requested: true,
    items,
    images,
    contents: [
      { contentsType:'TEXT', contentDetails:[{content: ((product.detailHtml||product.detailText||product.description||productName||'상품 상세설명') + `<img src="${DETAIL_OVERRIDE}" border="0" />`).slice(0,2000), detailType:'TEXT'}] }
    ],
    notices: buildNoticesFromMeta(meta)
  };
}

async function main(){
  const file = path.join(__dirname,'..','data','scraping','domeggook_payloads_20260205.json');
  const arr = JSON.parse(fs.readFileSync(file,'utf-8'));
  const outbound = await ensureOutbound('자동출고지');
  const ret = await ensureReturn('자동반품지');
  console.log('codes', {outbound, ret});
  if(!outbound || !ret) throw new Error('출고/반품 코드 없음');

  for(const entry of arr){
    const product = entry.product;
    const cat = await predictCategory(product.name || '상품');
    const meta = await getCategoryMeta(cat.id);
    const payload = buildPayload(product, outbound, ret, cat, meta);
    const pathUrl = '/v2/providers/seller_api/apis/api/v1/marketplace/seller-products';
    console.log('\n[등록 시도]', product.name, 'cat', cat);
    const {res,json} = await cf('POST', pathUrl, payload);
    console.log('status', res.status, 'ok', res.ok, 'code', json?.code, 'message', json?.message);
    const ts = Date.now();
    fs.writeFileSync(path.join(__dirname,'..','data','scraping',`coupang_response_${ts}.json`), JSON.stringify({product:product.name, status:res.status, body:json}, null,2));
    if(!res.ok || json?.code!=='SUCCESS') console.error('fail body', json);
  }
}

main().catch(e=>{console.error(e); process.exit(1);});
