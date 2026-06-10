import express from 'express'
import axios from 'axios'
import * as cheerio from 'cheerio'

const router = express.Router()

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.5',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
}

async function fetchPage(url) {
  try {
    const response = await axios.get(url, {
      headers: HEADERS,
      timeout: 15000,
      maxRedirects: 5
    })
    return response.data
  } catch (err) {
    console.error(`Failed to fetch ${url}:`, err.message)
    return null
  }
}

function extractPageData(html, url) {
  const $ = cheerio.load(html)

  // Remove scripts and styles
  $('script, style, noscript').remove()

  const title = $('title').text().trim()
  const description = $('meta[name="description"]').attr('content') || ''
  const keywords = $('meta[name="keywords"]').attr('content') || ''

  const h1 = $('h1').map((_, el) => $(el).text().trim()).get().filter(Boolean)
  const h2 = $('h2').map((_, el) => $(el).text().trim()).get().filter(Boolean)
  const h3 = $('h3').map((_, el) => $(el).text().trim()).get().filter(Boolean)

  const paragraphs = $('p').map((_, el) => $(el).text().trim()).get()
    .filter(t => t.length > 20).slice(0, 20)

  const buttons = $('button, .btn, [class*="button"], a.btn').map((_, el) => $(el).text().trim()).get()
    .filter(Boolean).slice(0, 20)

  const navItems = $('nav a, header a').map((_, el) => ({
    text: $(el).text().trim(),
    href: $(el).attr('href') || ''
  })).get().filter(item => item.text)

  const images = $('img').map((_, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src') || ''
    if (!src) return null
    try {
      return new URL(src, url).href
    } catch {
      return null
    }
  }).get().filter(Boolean)

  const links = $('a[href]').map((_, el) => {
    const href = $(el).attr('href')
    try {
      return new URL(href, url).href
    } catch {
      return null
    }
  }).get().filter(Boolean)

  return {
    url,
    title,
    description,
    keywords,
    h1,
    h2,
    h3,
    paragraphs,
    buttons,
    navItems,
    images,
    links
  }
}

// Full scrape
router.post('/', async (req, res) => {
  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'URL is required' })

  try {
    const baseUrl = new URL(url).origin
    const visitedUrls = new Set()
    const pages = []
    const allImages = new Set()

    // Fetch main page
    console.log(`🔍 Scraping: ${url}`)
    const mainHtml = await fetchPage(url)
    if (!mainHtml) throw new Error('Could not fetch the website')

    const mainData = extractPageData(mainHtml, url)
    pages.push(mainData)
    visitedUrls.add(url)
    mainData.images.forEach(img => allImages.add(img))

    // Get internal links
    const internalLinks = mainData.links
      .filter(link => link.startsWith(baseUrl))
      .filter(link => !visitedUrls.has(link))
      .filter(link => !link.includes('#'))
      .filter(link => !link.match(/\.(pdf|jpg|jpeg|png|gif|svg|ico|css|js|zip|exe)$/i))
      .slice(0, 20)

    // Scrape subpages
    for (const pageUrl of internalLinks) {
      if (visitedUrls.has(pageUrl)) continue
      visitedUrls.add(pageUrl)

      const html = await fetchPage(pageUrl)
      if (!html) continue

      const pageData = extractPageData(html, pageUrl)
      pages.push(pageData)
      pageData.images.forEach(img => allImages.add(img))
      console.log(`✅ Scraped: ${pageUrl}`)
    }

    res.json({
      success: true,
      data: {
        baseUrl,
        originalUrl: url,
        totalPages: pages.length,
        pages,
        images: Array.from(allImages),
        downloadedImages: [],
        scrapedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Scrape error:', error)
    res.status(500).json({
      error: 'Failed to scrape website',
      message: error.message
    })
  }
})

// Structure only
router.post('/structure', async (req, res) => {
  const { url } = req.body
  if (!url) return res.status(400).json({ error: 'URL is required' })

  try {
    const baseUrl = new URL(url).origin
    const html = await fetchPage(url)
    if (!html) throw new Error('Could not fetch the website')

    const $ = cheerio.load(html)
    const title = $('title').text().trim()
    const description = $('meta[name="description"]').attr('content') || ''

    const links = $('a[href]').map((_, el) => {
      const href = $(el).attr('href')
      try {
        const fullUrl = new URL(href, url).href
        return fullUrl.startsWith(baseUrl) ? fullUrl : null
      } catch {
        return null
      }
    }).get().filter(Boolean)

    const uniqueLinks = [...new Set(links)].slice(0, 30)

    res.json({
      success: true,
      structure: {
        title,
        description,
        links: uniqueLinks,
        pageCount: uniqueLinks.length
      }
    })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router
