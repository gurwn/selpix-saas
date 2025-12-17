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
  if (typeof process.setMaxListeners === 'function') {
    process.setMaxListeners(0)
  }
  return global.__selpixCrawler
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const sourceUrl = body?.sourceUrl
    const name = body?.name || ''
    const price = body?.price || 0
    const site = body?.site || 'domeggook'

    if (!sourceUrl || typeof sourceUrl !== 'string') {
      return NextResponse.json({ success: false, error: 'sourceUrl is required' }, { status: 400 })
    }

    const crawler = getCrawlerInstance()
    const enriched = await crawler.enrichDomeggookProduct({
      sourceUrl,
      name,
      price,
      site
    })

    return NextResponse.json({ success: true, data: enriched })
  } catch (error: any) {
    console.error('Crawler detail error', error)
    return NextResponse.json({ success: false, error: error?.message || 'detail failed' }, { status: 500 })
  }
}
