import crypto from 'crypto'

const API_KEY = process.env.NAVER_AD_API_KEY || ''
const SECRET_KEY = process.env.NAVER_AD_SECRET || ''
const CUSTOMER_ID = process.env.NAVER_AD_CUSTOMER_ID || ''
const BASE_URL = 'https://api.naver.com'

export interface KeywordStats {
  keyword: string
  monthlyPcSearch: number
  monthlyMobileSearch: number
  totalSearch: number
  compIdx: string // "높음" | "중간" | "낮음"
  plAvgDepth: number
  pcCtr: number
  mobileCtr: number
  pcClickCount: number
  mobileClickCount: number
}

function sign(timestamp: string, method: string, path: string): string {
  const msg = `${timestamp}.${method}.${path}`
  return crypto.createHmac('sha256', SECRET_KEY).update(msg).digest('base64')
}

function hasCredentials(): boolean {
  return !!(API_KEY && SECRET_KEY && CUSTOMER_ID)
}

/**
 * Fetch keyword stats from Naver Search Ad API /keywordstool.
 * Returns empty array if credentials are missing (graceful fallback).
 * Batches keywords in groups of 5 (API limit).
 */
export async function getKeywordStats(keywords: string[]): Promise<KeywordStats[]> {
  if (!hasCredentials() || keywords.length === 0) return []

  const results: KeywordStats[] = []

  // Process in batches of 5
  for (let i = 0; i < keywords.length; i += 5) {
    const batch = keywords.slice(i, i + 5)
    const path = '/keywordstool'
    const method = 'GET'
    const timestamp = String(Date.now())
    const signature = sign(timestamp, method, path)

    const params = new URLSearchParams({
      hintKeywords: batch.join(','),
      showDetail: '1',
    })

    try {
      const res = await fetch(`${BASE_URL}${path}?${params}`, {
        method,
        headers: {
          'X-Timestamp': timestamp,
          'X-API-KEY': API_KEY,
          'X-API-SECRET': SECRET_KEY,
          'X-CUSTOMER': CUSTOMER_ID,
          'X-Signature': signature,
        },
      })

      if (!res.ok) {
        console.error(`Search Ad API error ${res.status}: ${await res.text()}`)
        continue
      }

      const json = await res.json()
      const keywordList: any[] = json.keywordList || []

      for (const item of keywordList) {
        results.push({
          keyword: item.relKeyword || '',
          monthlyPcSearch: parseCount(item.monthlyPcQcCnt),
          monthlyMobileSearch: parseCount(item.monthlyMobileQcCnt),
          totalSearch:
            parseCount(item.monthlyPcQcCnt) + parseCount(item.monthlyMobileQcCnt),
          compIdx: item.compIdx || '',
          plAvgDepth: parseFloat(item.plAvgDepth) || 0,
          pcCtr: parseFloat(item.monthlyAvePcCtr) || 0,
          mobileCtr: parseFloat(item.monthlyAveMobileCtr) || 0,
          pcClickCount: parseCount(item.monthlyAvePcClkCnt),
          mobileClickCount: parseCount(item.monthlyAveMobileClkCnt),
        })
      }
    } catch (err) {
      console.error('Search Ad API fetch error:', err)
    }
  }

  return results
}

/** Parse count value — API returns "< 10" for very low volumes */
function parseCount(value: any): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    if (value.startsWith('< ')) return 0
    const n = parseInt(value, 10)
    return isNaN(n) ? 0 : n
  }
  return 0
}

/**
 * Get stats for exact keywords only (filter out related keywords).
 * The API returns related keywords too — this filters to only the requested ones.
 */
export async function getExactKeywordStats(
  keywords: string[]
): Promise<Map<string, KeywordStats>> {
  const allStats = await getKeywordStats(keywords)
  const map = new Map<string, KeywordStats>()

  const lowerKeywords = new Set(keywords.map((k) => k.toLowerCase()))
  for (const stat of allStats) {
    if (lowerKeywords.has(stat.keyword.toLowerCase())) {
      map.set(stat.keyword.toLowerCase(), stat)
    }
  }

  return map
}
