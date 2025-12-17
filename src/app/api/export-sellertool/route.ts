import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import * as XLSX from 'xlsx'

export const runtime = 'nodejs'

type Payload = {
  productName: string
  category: string
  sellPrice: number
  wholesalePrice?: number
  minOrder?: number
  shippingFee?: number
  imageUse?: boolean
  mainImage?: string
  detailImages?: string[]
  summary?: string
  detailHtml?: string
  supplierName?: string
}

const TEMPLATE_PATH = path.join(
  process.cwd(),
  '엑셀데이터',
  'Coupang_Category_20250811_1412',
  'coupang_sellertool_upload_example_V4.6.xlsm'
)

const SHEET_NAME = '기본'
const DATA_START_ROW = 4 // 0-index 기준: 5행부터 입력

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Payload
    if (!body?.productName) {
      return NextResponse.json({ ok: false, error: 'productName required' }, { status: 400 })
    }

    if (!fs.existsSync(TEMPLATE_PATH)) {
      return NextResponse.json({ ok: false, error: 'template not found' }, { status: 500 })
    }

    const wb = XLSX.readFile(TEMPLATE_PATH)
    const ws = wb.Sheets[SHEET_NAME]
    if (!ws || !ws['!ref']) {
      return NextResponse.json({ ok: false, error: 'sheet not found' }, { status: 500 })
    }

    // 헤더에서 컬럼 위치를 찾는다
    const headerRow = 1
    const range = XLSX.utils.decode_range(ws['!ref'])
    const headerMap: Record<string, number> = {}
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r: headerRow, c })
      const val = ws[cellAddr]?.v?.toString().trim()
      if (val) headerMap[val] = c
    }

    const setCell = (header: string, value: any) => {
      const col = headerMap[header]
      if (col === undefined) return
      const addr = XLSX.utils.encode_cell({ r: DATA_START_ROW, c: col })
      ws[addr] = { t: 's', v: value ?? '' }
    }

    // 기본 정보 매핑
    setCell('카테고리', body.category || '')
    setCell('등록상품명', body.productName || '')
    setCell('브랜드', body.supplierName || body.productName || '')
    setCell('제조사', body.supplierName || body.productName || '')
    setCell('판매가격', body.sellPrice ?? '')
    setCell('재고수량', body.minOrder ?? 1)
    setCell('출고리드타임', 2)
    setCell('성인상품(19)', 'N')
    setCell('과세여부', 'Y')
    setCell('해외구매대행', 'N')

    // 이미지/상세
    setCell('대표(옵션)이미지', body.mainImage || '')
    setCell('추가이미지', (body.detailImages || []).join(','))
    setCell('상세 설명', body.detailHtml || body.summary || '')

    // ws ref 유지
    wb.Sheets[SHEET_NAME] = ws

    const buffer = XLSX.write(wb, { bookType: 'xlsm', type: 'buffer' })
    const filename = `coupang_upload_${Date.now()}.xlsm`
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.ms-excel.sheet.macroEnabled.12',
        'Content-Disposition': `attachment; filename=\"${filename}\"`
      }
    })
  } catch (err: any) {
    console.error('export-sellertool error', err)
    return NextResponse.json({ ok: false, error: err?.message || 'export failed' }, { status: 500 })
  }
}
