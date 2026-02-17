import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'
import * as XLSX from 'xlsx'

// 파일 시스템 접근이 필요하므로 node 런타임으로 고정
export const runtime = 'nodejs'

interface CategoryRow {
  code: string
  path: string
  file: string
}

// 카테고리 엑셀 파일이 들어있는 폴더
const CATEGORY_DIR = path.join(
  process.cwd(),
  '엑셀데이터',
  'Coupang_Category_20250811_1412'
)

let categoryCache: CategoryRow[] | null = null

function loadCategoriesFromExcel(): CategoryRow[] {
  if (categoryCache) return categoryCache

  const entries: CategoryRow[] = []
  const files = fs.readdirSync(CATEGORY_DIR).filter((f) => f.endsWith('.xlsx'))

  for (const file of files) {
    try {
      // 임시 잠금 파일(~$)은 건너뛴다
      if (file.startsWith('~$')) continue

      if (!XLSX?.readFile) {
        console.error('[category-excel-read-error]', { file, err: 'XLSX.readFile is undefined (edge/runtime issue)' })
        continue
      }

      const workbook = XLSX.readFile(path.join(CATEGORY_DIR, file))
      const firstSheet = workbook.SheetNames[0]
      const sheet = workbook.Sheets[firstSheet]
      const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1')

      for (let r = range.s.r; r <= range.e.r; r++) {
        const cell = sheet[XLSX.utils.encode_cell({ r, c: 0 })]
        if (!cell || typeof cell.v !== 'string') continue

        const match = cell.v.match(/^\[(\d+)\]\s*(.+)$/)
        if (!match) continue

        entries.push({
          code: match[1],
          path: match[2],
          file,
        })
      }
    } catch (err) {
      console.error('[category-excel-read-error]', { file, err })
    }
  }

  categoryCache = entries
  return entries
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim().toLowerCase()
  const limit = Number(searchParams.get('limit') || 50)
  const fileFilter = (searchParams.get('file') || '').trim()
  const wantFilesOnly = searchParams.get('files') === '1'

  // 파일 목록만 요청
  if (wantFilesOnly) {
    const files = fs
      .readdirSync(CATEGORY_DIR)
      .filter((f) => f.endsWith('.xlsx') && !f.startsWith('~$'))
    return NextResponse.json({ ok: true, files })
  }

  const rows = loadCategoriesFromExcel()

  let filtered = rows
  if (q) {
    filtered = rows.filter(
      (row) =>
        row.code.includes(q) || row.path.toLowerCase().includes(q)
    )
  }

  if (fileFilter) {
    filtered = filtered.filter((row) => row.file === fileFilter)
  }

  return NextResponse.json({
    ok: true,
    total: filtered.length,
    items: filtered.slice(0, Math.max(1, Math.min(limit, 200))),
  })
}
