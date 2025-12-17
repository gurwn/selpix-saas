import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs'

export const runtime = 'nodejs'

type CrawlerInstance = any
declare const global: typeof globalThis & { __selpixCrawler?: CrawlerInstance }

const getCrawlerInstance = () => {
  if (global.__selpixCrawler) return global.__selpixCrawler

  const req = eval('require') as NodeRequire
  const baseDir = process.cwd()
  const crawlerPath = path.join(baseDir, 'v6 3', 'crawler.js')

  // reduce duplicate browser in dev by reusing instance and skipping close in crawler itself
  if (!process.env.PUPPETEER_EXECUTABLE_PATH) {
    const systemChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    if (fs.existsSync(systemChrome)) {
      process.env.PUPPETEER_EXECUTABLE_PATH = systemChrome
    } else {
      try {
        const puppeteerPath = path.join(baseDir, 'v6 3', 'node_modules', 'puppeteer')
        const puppeteer = req(puppeteerPath)
        process.env.PUPPETEER_EXECUTABLE_PATH = puppeteer.executablePath()
      } catch (err) {
        console.error('Failed to set puppeteer executable path from v6 3/node_modules', err)
      }
    }
  }
  if (!process.env.PUPPETEER_HEADLESS) {
    process.env.PUPPETEER_HEADLESS = 'true'
  }

  global.__selpixCrawler = req(crawlerPath)
  // 방어: 리스너 경고 방지
  if (typeof process.setMaxListeners === 'function') {
    process.setMaxListeners(0)
  }
  return global.__selpixCrawler
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const keyword = (body?.keyword || '').trim()
    if (!keyword) {
      return NextResponse.json({ success: false, error: 'keyword is required' }, { status: 400 })
    }

    const minPrice = Number(body?.minPrice ?? 0) || 0
    const maxPrice = Number(body?.maxPrice ?? 1000000) || 1000000
    const sites = Array.isArray(body?.sites) ? body.sites : ['domeggook']

    const crawler = getCrawlerInstance()
    const result = await crawler.crawlAllSites(keyword, minPrice, maxPrice, sites)

    return NextResponse.json({
      success: true,
      data: result
    })
  } catch (error: any) {
    console.error('Crawler API error', error)
    return NextResponse.json({ success: false, error: error?.message || 'crawl failed' }, { status: 500 })
  }
}
