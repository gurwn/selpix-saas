
import dotenv from 'dotenv';
import path from 'path';

// Load env from apps/app/.env.local
dotenv.config({ path: path.resolve(process.cwd(), 'apps/app/.env.local') });

import { CoupangService } from './apps/app/src/lib/services/coupang';

async function main() {
    console.log('--- Starting Coupang Debug ---');
    console.log('Vendor ID:', process.env.COUPANG_VENDOR_ID);
    console.log('Access Key:', process.env.COUPANG_ACCESS_KEY ? '(Present)' : '(Missing)');

    if (!process.env.COUPANG_ACCESS_KEY) {
        console.error('Error: .env.local not loaded or keys missing');
        return;
    }

    const service = new CoupangService();

    // Test 1: Check Auth by listing products (usually works if keys are good)
    try {
        console.log('\n[Test 1] Check Auth (List Products)...');
        // V1 Product List API
        // GET /v2/providers/seller_api/apis/api/v1/marketplace/seller-products
        const query = `vendorId=${process.env.COUPANG_VENDOR_ID}&pageNum=1&pageSize=1`;
        const path = `/v2/providers/seller_api/apis/api/v1/marketplace/seller-products`;

        // @ts-ignore
        const res = await service.makeRequest('GET', path, query);
        console.log('Auth Success! Found products:', JSON.stringify(res.data?.length || 0, null, 2));
    } catch (e: any) { console.log('Auth/ProductList Failed:', e.message); }

    // Test 2: 'centers' instead of 'places' ?
    try {
        console.log('\n[Test 2] Outbound Centers (centers vs places)...');
        const path = `/v2/providers/openapi/apis/api/v4/vendors/${process.env.COUPANG_VENDOR_ID}/outbound-shipping-centers`;
        // @ts-ignore
        const res = await service.makeRequest('GET', path);
        console.log('Success:', JSON.stringify(res, null, 2));
    } catch (e: any) { console.log('Failed:', e.message); }
}

main();
