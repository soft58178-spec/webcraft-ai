import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Globe, Search, Loader, CheckCircle, XCircle,
  Image, FileText, Link, Palette, Type, ArrowRight,
  Eye, Sparkles, AlertCircle
} from 'lucide-react'

export default function SiteAnalyzer({ onDataScraped }) {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState('idle') // idle, loading, success, error
  const [progress, setProgress] = useState([])
  const [siteData, setSiteData] = useState(null)
  const [error, setError] = useState('')

  const addProgress = (msg, type = 'info') => {
    setProgress(prev => [...prev, { msg, type, id: Date.now() }])
  }

  const analyzeSite = async () => {
    if (!url.trim()) return

    let targetUrl = url.trim()
    if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl

    setStatus('loading')
    setProgress([])
    setSiteData(null)
    setError('')

    addProgress('🔗 Connecting to website...', 'info')

    try {
      // First get structure
      addProgress('🗺️ Mapping site structure...', 'info')
      const structureRes = await fetch('/api/scrape/structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      })

      const structureData = await structureRes.json()
      if (!structureRes.ok) throw new Error(structureData.error || 'Failed to get structure')

      addProgress(`✅ Found ${structureData.structure.pageCount} pages`, 'success')
      addProgress('📥 Scraping all pages and content...', 'info')

      // Full scrape
      const scrapeRes = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl })
      })

      const scrapeData = await scrapeRes.json()
      if (!scrapeRes.ok) throw new Error(scrapeData.error || 'Scraping failed')

      addProgress(`✅ Scraped ${scrapeData.data.totalPages} pages`, 'success')
      addProgress(`🖼️ Downloaded ${scrapeData.data.downloadedImages?.length || 0} images`, 'success')
      addProgress(`📝 Extracted all texts and content`, 'success')
      addProgress(`🎨 Captured colors and fonts`, 'success')
      addProgress('✨ Ready to redesign!', 'success')

      setSiteData(scrapeData.data)
      setStatus('success')

    } catch (err) {
      setError(err.message)
      setStatus('error')
      addProgress(`❌ Error: ${err.message}`, 'error')
    }
  }

  const handleUseData = () => {
    if (siteData) onDataScraped(siteData)
  }

  return (
    <div style={{
      height: '100%',
      overflow: 'auto',
      padding: '30px',
      display: 'flex',
      flexDirection: 'column',
      gap: '24px',
      maxWidth: '800px',
      margin: '0 auto',
      width: '100%'
    }}>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #00d4ff, #6c63ff)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Globe size={20} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'white' }}>
              Site Analyzer
            </h2>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
              Paste any URL — I'll extract all content and redesign it
            </p>
          </div>
        </div>
      </motion.div>

      {/* URL Input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{
          padding: '20px',
          borderRadius: '16px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'rgba(255,255,255,0.6)', marginBottom: '12px' }}>
          Website URL
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            padding: '10px 14px'
          }}>
            <Globe size={16} color="rgba(255,255,255,0.3)" />
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && analyzeSite()}
              placeholder="https://example.com"
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'white',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif'
              }}
            />
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={analyzeSite}
            disabled={!url.trim() || status === 'loading'}
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              border: 'none',
              background: url.trim() && status !== 'loading'
                ? 'linear-gradient(135deg, #6c63ff, #5a52e0)'
                : 'rgba(255,255,255,0.06)',
              color: url.trim() && status !== 'loading' ? 'white' : 'rgba(255,255,255,0.3)',
              cursor: url.trim() && status !== 'loading' ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap'
            }}
          >
            {status === 'loading'
              ? <><Loader size={15} className="animate-spin" /> Analyzing...</>
              : <><Search size={15} /> Analyze Site</>
            }
          </motion.button>
        </div>

        {/* Example URLs */}
        <div style={{
          marginTop: '12px',
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>Try:</span>
          {['apple.com', 'stripe.com', 'notion.so', 'linear.app'].map(example => (
            <button
              key={example}
              onClick={() => setUrl('https://' + example)}
              style={{
                padding: '3px 8px',
                borderRadius: '5px',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'transparent',
                color: 'rgba(108,99,255,0.7)',
                fontSize: '11px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {example}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Progress Log */}
      <AnimatePresence>
        {progress.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '16px 20px',
              borderRadius: '14px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.3)',
              textTransform: 'uppercase',
              letterSpacing: '1px',
              marginBottom: '4px'
            }}>
              Analysis Log
            </div>
            {progress.map(item => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                style={{
                  fontSize: '13px',
                  color: item.type === 'error'
                    ? 'rgba(255,68,68,0.8)'
                    : item.type === 'success'
                      ? 'rgba(0,255,136,0.8)'
                      : 'rgba(255,255,255,0.5)',
                  fontFamily: 'JetBrains Mono, monospace'
                }}
              >
                {item.msg}
              </motion.div>
            ))}
            {status === 'loading' && (
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                style={{
                  fontSize: '13px',
                  color: 'rgba(108,99,255,0.6)',
                  fontFamily: 'JetBrains Mono, monospace'
                }}
              >
                ⏳ Processing...
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {status === 'success' && siteData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
          >
            {/* Stats Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '12px'
            }}>
              {[
                { icon: FileText, label: 'Pages', value: siteData.totalPages, color: '#6c63ff' },
                { icon: Image, label: 'Images', value: siteData.images?.length || 0, color: '#00d4ff' },
                { icon: Type, label: 'Text blocks', value: siteData.pages?.reduce((a, p) => a + (p.paragraphs?.length || 0), 0) || 0, color: '#ff6b6b' },
                { icon: Link, label: 'Links', value: siteData.pages?.reduce((a, p) => a + (p.navItems?.length || 0), 0) || 0, color: '#00ff88' },
              ].map((stat, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  style={{
                    padding: '16px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    textAlign: 'center'
                  }}
                >
                  <stat.icon size={20} color={stat.color} style={{ margin: '0 auto 8px' }} />
                  <div style={{ fontSize: '22px', fontWeight: 800, color: stat.color }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pages found */}
            {siteData.pages && siteData.pages.length > 0 && (
              <div style={{
                padding: '16px 20px',
                borderRadius: '14px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: 'rgba(255,255,255,0.3)',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  marginBottom: '12px'
                }}>
                  Pages Found
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {siteData.pages.slice(0, 8).map((page, i) => (
                    <div key={i} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.02)'
                    }}>
                      <CheckCircle size={13} color="#00ff88" />
                      <span style={{
                        flex: 1,
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.6)',
                        fontFamily: 'JetBrains Mono, monospace',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {page.url}
                      </span>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)' }}>
                        {page.paragraphs?.length || 0} blocks
                      </span>
                    </div>
                  ))}
                  {siteData.pages.length > 8 && (
                    <div style={{
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.3)',
                      textAlign: 'center',
                      padding: '4px'
                    }}>
                      +{siteData.pages.length - 8} more pages
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleUseData}
              style={{
                padding: '16px 24px',
                borderRadius: '14px',
                border: 'none',
                background: 'linear-gradient(135deg, #6c63ff 0%, #00d4ff 100%)',
                color: 'white',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 8px 30px rgba(108,99,255,0.4)'
              }}
            >
              <Sparkles size={18} />
              Use this data — Redesign with AI
              <ArrowRight size={18} />
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              padding: '16px 20px',
              borderRadius: '14px',
              background: 'rgba(255,68,68,0.08)',
              border: '1px solid rgba(255,68,68,0.2)',
              display: 'flex',
              gap: '12px',
              alignItems: 'flex-start'
            }}
          >
            <AlertCircle size={18} color="rgba(255,68,68,0.8)" style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,100,100,0.9)', marginBottom: '4px' }}>
                Failed to analyze site
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,100,100,0.6)' }}>
                {error}
              </div>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
                Make sure the backend server is running: npm run dev
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
