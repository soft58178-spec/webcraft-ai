router.post('/structure', async (req, res) => {
  const { url } = req.body

  if (!url) {
    return res.status(400).json({ error: 'URL is required' })
  }

  try {
    const { default: puppeteer } = await import('puppeteer')
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process'
      ]
    })

    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 })

    const structure = await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a[href]'))
        .map(a => a.href)
        .filter(href => href.startsWith(window.location.origin))
        .filter((v, i, a) => a.indexOf(v) === i)
        .slice(0, 50)

      return {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.content || '',
        links,
        pageCount: links.length
      }
    })

    await browser.close()
    res.json({ success: true, structure })

  } catch (error) {
    console.error('STRUCTURE ERROR:', error.message)
    console.error('FULL ERROR:', error)
    res.status(500).json({ error: error.message })
  }
})