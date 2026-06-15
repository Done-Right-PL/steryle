#!/usr/bin/env node
// Crawls www.surginatal.com via its sitemaps and saves a full-page
// screenshot of every page into the `screenshots/` folder.
//
// Usage:
//   node scripts/screenshot-surginatal.mjs            # all pages
//   node scripts/screenshot-surginatal.mjs --limit 10 # first 10 pages (test)
//   node scripts/screenshot-surginatal.mjs --limit 10 --out shots --concurrency 4

import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const ORIGIN = 'https://surginatal.com'
const ROOT_SITEMAP = `${ORIGIN}/sitemap.xml`
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

function parseArgs(argv) {
  const args = { limit: Infinity, out: 'screenshots', concurrency: 3 }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--limit') args.limit = Number(argv[++i])
    else if (a === '--out') args.out = argv[++i]
    else if (a === '--concurrency') args.concurrency = Number(argv[++i])
  }
  return args
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`)
  return res.text()
}

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1])
}

// Collect every page URL from the sitemap index + all child sitemaps.
async function collectUrls() {
  const indexXml = await fetchText(ROOT_SITEMAP)
  const childSitemaps = extractLocs(indexXml)

  const all = new Set()
  for (const sm of childSitemaps) {
    try {
      const xml = await fetchText(sm)
      for (const loc of extractLocs(xml)) all.add(loc)
      console.log(`  sitemap ${sm} -> ${extractLocs(xml).length} urls`)
    } catch (err) {
      console.warn(`  ! failed sitemap ${sm}: ${err.message}`)
    }
  }
  return [...all]
}

// Turn a URL into a safe, readable filename.
function urlToFilename(url) {
  const u = new URL(url)
  let p = (u.pathname + u.search).replace(/^\/+|\/+$/g, '')
  if (!p) p = 'home'
  const safe = p.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 180)
  return `${safe}.png`
}

// Scroll through the page so lazy-loaded images/sections render.
async function autoScroll(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let total = 0
      const step = 600
      const timer = setInterval(() => {
        window.scrollBy(0, step)
        total += step
        if (total >= document.body.scrollHeight) {
          clearInterval(timer)
          window.scrollTo(0, 0)
          resolve()
        }
      }, 120)
    })
  })
  await page.waitForTimeout(500)
}

async function shoot(page, url, outDir) {
  const file = path.join(outDir, urlToFilename(url))
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 })
  await autoScroll(page)
  await page.screenshot({ path: file, fullPage: true })
  return file
}

async function main() {
  const { limit, out, concurrency } = parseArgs(process.argv)
  const outDir = path.resolve(process.cwd(), out)
  await mkdir(outDir, { recursive: true })

  console.log('Collecting URLs from sitemaps...')
  let urls = await collectUrls()
  console.log(`Found ${urls.length} total URLs.`)
  if (Number.isFinite(limit)) {
    urls = urls.slice(0, limit)
    console.log(`Limiting to first ${urls.length} URLs (test run).`)
  }

  const browser = await chromium.launch()
  const results = []
  let idx = 0

  async function worker(id) {
    const ctx = await browser.newContext({
      userAgent: UA,
      viewport: { width: 1440, height: 900 },
      deviceScaleFactor: 1,
    })
    const page = await ctx.newPage()
    while (true) {
      const i = idx++
      if (i >= urls.length) break
      const url = urls[i]
      const label = `[${i + 1}/${urls.length}]`
      try {
        const file = await shoot(page, url, outDir)
        console.log(`${label} OK  ${url} -> ${path.basename(file)}`)
        results.push({ url, file, ok: true })
      } catch (err) {
        console.warn(`${label} ERR ${url}: ${err.message}`)
        results.push({ url, ok: false, error: err.message })
      }
    }
    await ctx.close()
  }

  const workers = Array.from({ length: Math.max(1, concurrency) }, (_, i) =>
    worker(i),
  )
  await Promise.all(workers)
  await browser.close()

  const ok = results.filter((r) => r.ok).length
  await writeFile(
    path.join(outDir, '_manifest.json'),
    JSON.stringify(results, null, 2),
  )
  console.log(`\nDone. ${ok}/${results.length} saved to ${outDir}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
