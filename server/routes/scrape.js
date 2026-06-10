import express from 'express'
import { scrapeWebsite } from '../services/scraperService.js'
import { downloadImages } from '../services/imageDownloader.js'

const router = express.Router()

// Scrape a website by URL
router.post('/', async (req, res) => {
  const { url } = req.body

  if (!url) {
    return res.status(400).json({ error: 'URL is required' })
  }

  try {
    console.log(`🔍 Scraping: ${url}`)

    // Scrape all pages
    const siteData = await scrapeWebsite(url)

    // Download images
    const imagesData = await downloadImages(siteData.images, url)

    res.json({
      success: true,
      data: {
        ...siteData,
        downloadedImages: imagesData
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

// Get site structure only (fast)
router.post('/structure', async (req, res) => {
  const { url } = req.body

  if (!url) {
    return res.status(400).json({ error: 'URL is required' })
  }

  try {
    const { default: puppeteer } = await import('puppeteer')
   const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--disable-gpu',
    '--single-process'
  ],
  executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || null
})

    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })

    const structure = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'))
        .map(a => a.href)
        .filter(href => href.startsWith(window.location.origin))
        .filter((v, i, a) => a.indexOf(v) === i)
        .slice(0, 50)

      const title = document.title
      const description = document.querySelector('meta[name="description"]')?.content  || ''

      return { title, description, links, pageCount: links.length }
    })

    await browser.close()

    res.json({ success: true, structure })

  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

export default router