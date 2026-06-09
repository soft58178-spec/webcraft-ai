import puppeteer from 'puppeteer'

export async function scrapeWebsite(url) {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  })

  try {
    const visitedUrls = new Set()
    const pages = []
    const images = new Set()
    const allLinks = new Set()

    const baseUrl = new URL(url).origin

    // Get all links from main page first
    const mainPage = await browser.newPage()
    await mainPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')
    await mainPage.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })

    // Collect all internal links
    const links = await mainPage.evaluate((base) => {
      return Array.from(document.querySelectorAll('a[href]'))
        .map(a => {
          try {
            return new URL(a.href, base).href
          } catch {
            return null
          }
        })
        .filter(href => href && href.startsWith(base))
        .filter((v, i, a) => a.indexOf(v) === i)
        .slice(0, 30)
    }, baseUrl)

    links.forEach(l => allLinks.add(l))
    allLinks.add(url)
    await mainPage.close()

    // Scrape each page
    for (const pageUrl of allLinks) {
      if (visitedUrls.has(pageUrl)) continue
      visitedUrls.add(pageUrl)

      try {
        const page = await browser.newPage()
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

        await page.goto(pageUrl, { waitUntil: 'networkidle2', timeout: 20000 })

        const pageData = await page.evaluate(() => {
          // Remove scripts and styles for cleaner text
          const scripts = document.querySelectorAll('script, style, noscript')
          scripts.forEach(s => s.remove())

          // Get all text content
          const title = document.title
          const description = document.querySelector('meta[name="description"]')?.content || ''
          const keywords = document.querySelector('meta[name="keywords"]')?.content || ''
          const h1 = Array.from(document.querySelectorAll('h1')).map(h => h.innerText.trim())
          const h2 = Array.from(document.querySelectorAll('h2')).map(h => h.innerText.trim())
          const h3 = Array.from(document.querySelectorAll('h3')).map(h => h.innerText.trim())
          const paragraphs = Array.from(document.querySelectorAll('p')).map(p => p.innerText.trim()).filter(t => t.length > 20)
          const buttons = Array.from(document.querySelectorAll('button, .btn, [class*="button"]')).map(b => b.innerText.trim()).filter(Boolean)
          const navItems = Array.from(document.querySelectorAll('nav a, header a')).map(a => ({ text: a.innerText.trim(), href: a.href }))

          // Get images
          const imgs = Array.from(document.querySelectorAll('img'))
            .map(img => img.src || img.dataset.src)
            .filter(src => src && src.startsWith('http'))

          // Get colors from inline styles
          const colors = []
          const allElements = document.querySelectorAll('*')
          allElements.forEach(el => {
            const style = window.getComputedStyle(el)
            const bg = style.backgroundColor
            const color = style.color
            if (bg && bg !== 'rgba(0, 0, 0, 0)' && bg !== 'transparent') colors.push(bg)
            if (color) colors.push(color)
          })

          // Get unique colors
          const uniqueColors = [...new Set(colors)].slice(0, 20)

          // Get fonts
          const fonts = []
          allElements.forEach(el => {
            const font = window.getComputedStyle(el).fontFamily
            if (font) fonts.push(font)
          })
          const uniqueFonts = [...new Set(fonts)].slice(0, 5)

          // Full HTML for structure analysis
          const bodyHTML = document.body.innerHTML.slice(0, 10000)

          return {
            title,
            description,
            keywords,
            h1,
            h2,
            h3,
            paragraphs: paragraphs.slice(0, 20),
            buttons,
            navItems,
            images: imgs,
            colors: uniqueColors,
            fonts: uniqueFonts,
            bodyHTML
          }
        })

        pages.push({
          url: pageUrl,
          ...pageData
        })

        pageData.images.forEach(img => images.add(img))

        await page.close()
        console.log(`✅ Scraped: ${pageUrl}`)

      } catch (err) {
        console.error(`❌ Failed to scrape ${pageUrl}:`, err.message)
      }
    }

    // Get favicon
    let favicon = ''
    try {
      const faviconPage = await browser.newPage()
      await faviconPage.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 })
      favicon = await faviconPage.evaluate(() => {
        const link = document.querySelector('link[rel*="icon"]')
        return link ? link.href : ''
      })
      await faviconPage.close()
    } catch (e) {}

    return {
      baseUrl,
      originalUrl: url,
      totalPages: pages.length,
      pages,
      images: Array.from(images),
      favicon,
      scrapedAt: new Date().toISOString()
    }

  } finally {
    await browser.close()
  }
}
