/**
 * Frontend scraper utility
 * Handles communication with the backend scraper service
 */

export async function analyzeSite(url) {
  let targetUrl = url.trim()
  if (!targetUrl.startsWith('http')) {
    targetUrl = 'https://' + targetUrl
  }

  // Validate URL
  try {
    new URL(targetUrl)
  } catch {
    throw new Error('Invalid URL. Please enter a valid website address.')
  }

  const response = await fetch('/api/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: targetUrl })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || data.message || 'Failed to analyze site')
  }

  return data.data
}

export async function getSiteStructure(url) {
  let targetUrl = url.trim()
  if (!targetUrl.startsWith('http')) {
    targetUrl = 'https://' + targetUrl
  }

  const response = await fetch('/api/scrape/structure', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: targetUrl })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Failed to get site structure')
  }

  return data.structure
}

export function formatSiteDataForPrompt(siteData) {
  if (!siteData) return ''

  const pages = siteData.pages || []
  const mainPage = pages[0] || {}

  const sections = []

  // Basic info
  sections.push(`WEBSITE: ${siteData.originalUrl}`)
  sections.push(`TITLE: ${mainPage.title || 'Unknown'}`)
  sections.push(`DESCRIPTION: ${mainPage.description || 'None'}`)
  sections.push(`TOTAL PAGES: ${siteData.totalPages}`)

  // Navigation
  if (mainPage.navItems?.length > 0) {
    sections.push('\nNAVIGATION:')
    mainPage.navItems.forEach(item => {
      sections.push(`  - ${item.text}`)
    })
  }

  // All headings
  const allH1 = pages.flatMap(p => p.h1 || [])
  const allH2 = pages.flatMap(p => p.h2 || [])
  if (allH1.length > 0 || allH2.length > 0) {
    sections.push('\nMAIN HEADINGS:')
    allH1.forEach(h => sections.push(`  H1: ${h}`))
    allH2.slice(0, 20).forEach(h => sections.push(`  H2: ${h}`))
  }

  // Text content
  const allTexts = pages.flatMap(p => p.paragraphs || []).slice(0, 25)
  if (allTexts.length > 0) {
    sections.push('\nCONTENT:')
    allTexts.forEach(t => sections.push(`  - ${t}`))
  }

  // Buttons / CTAs
  const allButtons = pages.flatMap(p => p.buttons || []).slice(0, 15)
  if (allButtons.length > 0) {
    sections.push('\nBUTTONS / CTAs:')
    allButtons.forEach(b => sections.push(`  - ${b}`))
  }

  // Images
  const images = siteData.downloadedImages || siteData.images?.slice(0, 20) || []
  if (images.length > 0) {
    sections.push('\nIMAGES:')
    images.slice(0, 15).forEach(img => {
      const src = typeof img === 'string' ? img : (img.localPath || img.originalUrl)
      sections.push(`  - ${src}`)
    })
  }

  // Pages list
  if (pages.length > 1) {
    sections.push('\nPAGES TO RECREATE:')
    pages.forEach(p => {
      sections.push(`  - ${p.title || p.url} (${p.url})`)
    })
  }

  return sections.join('\n')
}

export function extractDomain(url) {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

export function isValidUrl(url) {
  try {
    new URL(url.startsWith('http') ? url : 'https://' + url)
    return true
  } catch {
    return false
  }
}

export function normalizeUrl(url) {
  if (!url) return ''
  url = url.trim()
  if (!url.startsWith('http')) {
    url = 'https://' + url
  }
  try {
    const parsed = new URL(url)
    return parsed.href
  } catch {
    return url
  }
}

export function getSiteStats(siteData) {
  if (!siteData) return null

  const pages = siteData.pages || []

  return {
    totalPages: siteData.totalPages || 0,
    totalImages: siteData.images?.length || 0,
    downloadedImages: siteData.downloadedImages?.length || 0,
    totalTexts: pages.reduce((acc, p) => acc + (p.paragraphs?.length || 0), 0),
    totalHeadings: pages.reduce((acc, p) =>
      acc + (p.h1?.length || 0) + (p.h2?.length || 0) + (p.h3?.length || 0), 0),
    totalButtons: pages.reduce((acc, p) => acc + (p.buttons?.length || 0), 0),
    navItems: pages[0]?.navItems?.length || 0,
    hasColors: (pages[0]?.colors?.length || 0) > 0,
    hasFonts: (pages[0]?.fonts?.length || 0) > 0,
    domain: extractDomain(siteData.originalUrl || ''),
    scrapedAt: siteData.scrapedAt
  }
}
