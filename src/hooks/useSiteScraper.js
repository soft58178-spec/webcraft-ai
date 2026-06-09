import { useState, useCallback } from 'react'

export function useSiteScraper() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [progress, setProgress] = useState([])
  const [siteData, setSiteData] = useState(null)
  const [status, setStatus] = useState('idle')

  const addProgress = useCallback((msg, type = 'info') => {
    setProgress(prev => [...prev, {
      id: Date.now() + Math.random(),
      msg,
      type,
      time: new Date().toLocaleTimeString()
    }])
  }, [])

  const scrapeStructure = useCallback(async (url) => {
    const response = await fetch('/api/scrape/structure', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Structure fetch failed')
    return data.structure
  }, [])

  const scrapeFullSite = useCallback(async (url) => {
    const response = await fetch('/api/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error || 'Scraping failed')
    return data.data
  }, [])

  const analyze = useCallback(async (url) => {
    setIsLoading(true)
    setError(null)
    setProgress([])
    setSiteData(null)
    setStatus('loading')

    let targetUrl = url.trim()
    if (!targetUrl.startsWith('http')) {
      targetUrl = 'https://' + targetUrl
    }

    try {
      addProgress('🔗 Connecting to website...', 'info')

      // Validate URL
      try {
        new URL(targetUrl)
      } catch {
        throw new Error('Invalid URL format')
      }

      addProgress('🗺️ Mapping site structure...', 'info')
      const structure = await scrapeStructure(targetUrl)
      addProgress(`✅ Found ${structure.pageCount} pages to scrape`, 'success')

      addProgress('📥 Scraping all pages...', 'info')
      const data = await scrapeFullSite(targetUrl)

      addProgress(`✅ Scraped ${data.totalPages} pages successfully`, 'success')
      addProgress(`🖼️ Found ${data.images?.length || 0} images`, 'success')

      const totalTexts = data.pages?.reduce((acc, p) => acc + (p.paragraphs?.length || 0), 0) || 0
      addProgress(`📝 Extracted ${totalTexts} text blocks`, 'success')
      addProgress(`🎨 Captured color palette and fonts`, 'success')
      addProgress('🚀 All data ready for AI redesign!', 'success')

      setSiteData(data)
      setStatus('success')
      return data

    } catch (err) {
      const message = err.message || 'Unknown error occurred'
      setError(message)
      setStatus('error')
      addProgress(`❌ Failed: ${message}`, 'error')
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [addProgress, scrapeStructure, scrapeFullSite])

  const reset = useCallback(() => {
    setIsLoading(false)
    setError(null)
    setProgress([])
    setSiteData(null)
    setStatus('idle')
  }, [])

  const getSummary = useCallback(() => {
    if (!siteData) return null
    return {
      url: siteData.originalUrl,
      pages: siteData.totalPages,
      images: siteData.images?.length || 0,
      texts: siteData.pages?.reduce((acc, p) => acc + (p.paragraphs?.length || 0), 0) || 0,
      headings: siteData.pages?.reduce((acc, p) => acc + (p.h1?.length || 0) + (p.h2?.length || 0), 0) || 0,
      navItems: siteData.pages?.[0]?.navItems?.length || 0,
    }
  }, [siteData])

  return {
    analyze,
    reset,
    getSummary,
    isLoading,
    error,
    progress,
    siteData,
    status,
    clearError: () => setError(null)
  }
}
