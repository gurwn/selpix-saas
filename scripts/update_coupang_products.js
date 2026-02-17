const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '/home/dev/openclaw/.env' });

const { cf, getCategoryMeta, buildNotices, getConfig } = require('./lib/coupang_api');

const { VID: VENDOR_ID, VUID: VENDOR_USER_ID } = getConfig();
const RETURN_NAME = process.env.COUPANG_RETURN_CHARGE_NAME || '반품지';
const RETURN_CONTACT = process.env.COUPANG_RETURN_CONTACT || '010-0000-0000';
const RETURN_ZIP = process.env.COUPANG_RETURN_ZIPCODE || '00000';
const RETURN_ADDR = process.env.COUPANG_RETURN_ADDRESS || '주소 미입력';
const RETURN_ADDR_DETAIL = process.env.COUPANG_RETURN_ADDRESS_DETAIL || '상세주소 미입력';
const DETAIL_OVERRIDE = "https://deddagre.esellersimg.co.kr/d_smartg/smartg_timon.jpg";

async function getProduct(id){
  const pathUrl = `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products/${id}`;
  const {json} = await cf('GET', pathUrl);
  if(json?.code !== 'SUCCESS') throw new Error('상품 조회 실패: '+JSON.stringify(json));
  return json.data;
}

function keepOnlyRepresentation(images){
  if(!Array.isArray(images) || images.length===0) return [];
  const rep = images.find(img=>img.imageType==='REPRESENTATION') || images[0];
  return [{ imageOrder: 0, imageType: 'REPRESENTATION', vendorPath: rep.vendorPath || rep.cdnPath || '' }];
}

async function updateProduct(id){
  const product = await getProduct(id);
  const meta = await getCategoryMeta(product.displayCategoryCode);
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
