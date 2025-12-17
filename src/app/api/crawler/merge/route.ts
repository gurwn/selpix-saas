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
    const list = Array.isArray(body?.products) ? body.products : []
    const site = body?.site || 'domeggook'
    const requestedLimit = Number(body?.limit ?? list.length)
    const limit = Math.min(list.length, Number.isFinite(requestedLimit) && requestedLimit > 0 ? requestedLimit : list.length)

    if (!list.length) {
      return NextResponse.json({ success: false, error: 'products required' }, { status: 400 })
    }

  const crawler = getCrawlerInstance()
  const targets = list.slice(0, limit)

  const enriched = await Promise.all(
    targets.map(async (item) => {
      try {
        const res = await crawler.enrichDomeggookProduct({
          sourceUrl: item.url || item.sourceUrl,
          name: item.name,
          price: item.price,
          site
        })
        return { ...item, ...res }
      } catch {
        return item
      }
    })
  )

  // 나머지는 원본 유지
  if (list.length > limit) {
    enriched.push(...list.slice(limit))
  }

  return NextResponse.json({ success: true, data: enriched })
  } catch (error: any) {
    console.error('Crawler merge error', error)
    return NextResponse.json({ success: false, error: error?.message || 'merge failed' }, { status: 500 })
  }
}
