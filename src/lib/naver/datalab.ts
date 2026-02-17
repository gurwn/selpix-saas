import type { DataLabPoint } from '@/lib/trends/types'

const NAVER_CLIENT_ID = process.env.NAVER_CLIENT_ID || ''
const NAVER_CLIENT_SECRET = process.env.NAVER_CLIENT_SECRET || ''
const DATALAB_BASE = 'https://openapi.naver.com/v1/datalab'

function getHeaders() {
  return {
    'Content-Type': 'application/json',
    'X-Naver-Client-Id': NAVER_CLIENT_ID,
    'X-Naver-Client-Secret': NAVER_CLIENT_SECRET,
  }
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function getDefaultDateRange(): { startDate: string; endDate: string } {
  const end = new Date()
  const start = new Date()
  start.setFullYear(start.getFullYear() - 1)
  return { startDate: formatDate(start), endDate: formatDate(end) }
}

export async function getShoppingTrend(
  keyword: string,
  options?: { startDate?: string; endDate?: string; timeUnit?: 'date' | 'week' | 'month' }
): Promise<DataLabPoint[]> {
  const { startDate, endDate } = options?.startDate && options?.endDate
    ? { startDate: options.startDate, endDate: options.endDate }
    : getDefaultDateRange()

  const body = {
    startDate,
    endDate,
    timeUnit: options?.timeUnit || 'month',
    category: '',
    keyword: [{ name: keyword, param: [keyword] }],
    device: 'pc',
    gender: '',
    ages: [],
  }

  const res = await fetch(`${DATALAB_BASE}/shopping/categories`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`DataLab shopping trend error ${res.status}: ${text}`)
  }

  const json = await res.json()
  const data = json.results?.[0]?.data || []
  return data.map((d: { period: string; ratio: number }) => ({
    period: d.period,
    ratio: d.ratio,
  }))
}

export async function compareKeywords(
  keywords: string[],
  options?: { startDate?: string; endDate?: string; timeUnit?: 'date' | 'week' | 'month' }
): Promise<{ keyword: string; data: DataLabPoint[] }[]> {
  const { startDate, endDate } = options?.startDate && options?.endDate
    ? { startDate: options.startDate, endDate: options.endDate }
    : getDefaultDateRange()

  // DataLab allows max 5 keyword groups per request
  const keywordGroups = keywords.slice(0, 5).map((kw) => ({
    name: kw,
    param: [kw],
  }))

  const body = {
    startDate,
    endDate,
    timeUnit: options?.timeUnit || 'month',
    category: '',
    keyword: keywordGroups,
    device: 'pc',
    gender: '',
    ages: [],
  }

  const res = await fetch(`${DATALAB_BASE}/shopping/categories`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`DataLab compare error ${res.status}: ${text}`)
  }

  const json = await res.json()
  return (json.results || []).map((r: { title: string; data: { period: string; ratio: number }[] }) => ({
    keyword: r.title,
    data: (r.data || []).map((d: { period: string; ratio: number }) => ({
      period: d.period,
      ratio: d.ratio,
    })),
  }))
}

export async function getRelatedKeywords(keyword: string): Promise<string[]> {
  // Naver autocomplete API for related keyword suggestions
  try {
    const res = await fetch(
      `https://ac.search.naver.com/nx/ac?q=${encodeURIComponent(keyword)}&con=1&frm=nv&ans=2&r_format=json&r_enc=UTF-8&r_unicode=0&t_koreng=1&run=2&rev=4&q_enc=UTF-8`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    )
    if (!res.ok) return []
    const json = await res.json()
    const items: string[][] = json.items || []
    return items.flat().filter((item: string) => item && item !== keyword).slice(0, 10)
  } catch {
    return []
  }
}

export async function getCategoryTrend(
  categoryCode: string,
  options?: { startDate?: string; endDate?: string; timeUnit?: 'date' | 'week' | 'month' }
): Promise<DataLabPoint[]> {
  const { startDate, endDate } = options?.startDate && options?.endDate
    ? { startDate: options.startDate, endDate: options.endDate }
    : getDefaultDateRange()

  // Max 3 categories per request for DataLab
  const body = {
    startDate,
    endDate,
    timeUnit: options?.timeUnit || 'month',
    category: [{ name: categoryCode, param: [categoryCode] }],
    device: 'pc',
    gender: '',
    ages: [],
  }

  const res = await fetch(`${DATALAB_BASE}/shopping/categories`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`DataLab category trend error ${res.status}: ${text}`)
  }

  const json = await res.json()
  const data = json.results?.[0]?.data || []
  return data.map((d: { period: string; ratio: number }) => ({
    period: d.period,
    ratio: d.ratio,
  }))
}
