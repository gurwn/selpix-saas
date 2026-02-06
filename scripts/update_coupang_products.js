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
const RETURN_CONTACT = process.env.COUPANG_RETURN_CONTACT || '010-0000-0000';
const RETURN_ZIP = process.env.COUPANG_RETURN_ZIPCODE || '00000';
const RETURN_ADDR = process.env.COUPANG_RETURN_ADDRESS || '주소 미입력';
const RETURN_ADDR_DETAIL = process.env.COUPANG_RETURN_ADDRESS_DETAIL || '상세주소 미입력';
const DETAIL_OVERRIDE = "https://deddagre.esellersimg.co.kr/d_smartg/smartg_timon.jpg";

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

async function getProduct(id){
  const pathUrl = `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products/${id}`;
  const {json} = await cf('GET', pathUrl, null, '');
  if(json?.code !== 'SUCCESS') throw new Error('상품 조회 실패: '+JSON.stringify(json));
  return json.data;
}

async function getMeta(displayCategoryCode){
  const pathUrl = `/v2/providers/seller_api/apis/api/v1/marketplace/meta/category-related-metas/display-category-codes/${displayCategoryCode}`;
  const {json} = await cf('GET', pathUrl, null, '');
  if(json?.code !== 'SUCCESS') throw new Error('메타 조회 실패: '+JSON.stringify(json));
  return json.data;
}

function buildNotices(meta){
  const notices=[];
  const preferred = meta?.noticeCategories?.find(c=>c.noticeCategoryName.includes('기타')) || meta?.noticeCategories?.[0];
  if(preferred){
    const catName = preferred.noticeCategoryName;
    (preferred.noticeCategoryDetailNames||[]).forEach(d=>{
      if(d.required==='MANDATORY') notices.push({noticeCategoryName: catName, noticeCategoryDetailName: d.noticeCategoryDetailName, content:'상세페이지 참조'});
    });
  }
  if(!notices.length){
    notices.push({noticeCategoryName:'기타 재화', noticeCategoryDetailName:'품명 및 모델명', content:'상세페이지 참조'});
  }
  return notices;
}

function keepOnlyRepresentation(images){
  if(!Array.isArray(images) || images.length===0) return [];
  const rep = images.find(img=>img.imageType==='REPRESENTATION') || images[0];
  return [{ imageOrder: 0, imageType: 'REPRESENTATION', vendorPath: rep.vendorPath || rep.cdnPath || '' }];
}

async function updateProduct(id){
  const product = await getProduct(id);
  const meta = await getMeta(product.displayCategoryCode);
  const notices = buildNotices(meta);

  // 배송: 무료배송
  product.deliveryChargeType = 'FREE';
  product.deliveryCharge = 0;
  product.freeShipOverAmount = 0;
  product.deliveryChargeOnReturn = 5000;
  product.returnCharge = 5000;
  product.deliveryMethod = product.deliveryMethod || 'SEQUENCIAL';
  product.deliveryCompanyCode = product.deliveryCompanyCode || 'CJGLS';
  product.returnCenterCode = product.returnCenterCode || 'NO_RETURN_CENTERCODE';
  product.returnChargeName = RETURN_NAME;
  product.companyContactNumber = RETURN_CONTACT;
  product.returnZipCode = RETURN_ZIP;
  product.returnAddress = RETURN_ADDR;
  product.returnAddressDetail = RETURN_ADDR_DETAIL;
  product.outboundShippingPlaceCode = product.outboundShippingPlaceCode;
  product.vendorUserId = VENDOR_USER_ID;

  // 상세설명: 추가 이미지 삽입 (대표 이미지는 유지)
  product.items = (product.items || []).map(item => {
    item.images = keepOnlyRepresentation(item.images || []);
    item.notices = notices;
    item.contents = [
      { contentsType: 'TEXT', contentDetails: [ { content: `<img src="${DETAIL_OVERRIDE}" border="0" />`, detailType: 'TEXT' } ] }
    ];
    return item;
  });

  const pathUrl = `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products`;
  const {res,json} = await cf('PUT', pathUrl, product);
  return {res,json};
}

async function main(){
  const ids = [16028965794, 16028965819];
  for(const id of ids){
    const {res,json} = await updateProduct(id);
    console.log('update', id, 'status', res.status, 'code', json?.code, 'message', json?.message);
    fs.writeFileSync(path.join(__dirname,'..','data','scraping',`coupang_update_${id}.json`), JSON.stringify(json, null, 2));
  }
}

main().catch(e=>{console.error(e); process.exit(1);});
