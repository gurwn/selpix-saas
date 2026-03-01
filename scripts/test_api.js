require('dotenv').config({ path: '/home/dev/openclaw/.env' });
const { cf } = require('./lib/coupang_api');
const VID = process.env.COUPANG_VENDOR_ID;

async function test() {
  console.log('VID:', VID);
  
  // 상품 조회
  const query = `vendorId=${VID}&nextToken=1&maxPerPage=10&status=APPROVED`;
  const path = `/v2/providers/openapi/apis/api/v4/vendors/${VID}/items`;
  const { json, status } = await cf('GET', path, null, query);
  
  console.log('HTTP status:', status);
  console.log('code:', json?.code);
  console.log('message:', json?.message);
  console.log('data 개수:', Array.isArray(json?.data) ? json.data.length : json?.data);
  if (json?.data?.[0]) console.log('샘플 상품:', JSON.stringify(json.data[0]).slice(0, 200));
}

test().catch(console.error);
