import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send, Sparkles, User, Copy, Check, Code2,
  Zap, Globe, RefreshCw, Wand2
} from 'lucide-react'
import { parseFilesFromResponse } from '../utils/codeParser'
import { buildWebsitePrompt } from '../utils/promptBuilder'

const EXAMPLE_PROMPTS = [
  "Create a stunning 3D SaaS landing page with particle effects",
  "Build a luxury e-commerce store with 3D product viewer",
  "Make a creative agency portfolio with WebGL background",
  "Generate a modern restaurant website with 3D animations",
  "Create a crypto dashboard with neon glow effects",
]

export default function Chat({
  currentProject, onCreateProject, onFilesGenerated,
  onGeneratingChange, scrapedData, onViewCode,
  externalInput, onExternalInputUsed
}) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [showExamples, setShowExamples] = useState(true)
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    if (scrapedData) {
      setMessages(prev => [...prev, {
        id: Date.now(), role: 'system',
        content: `✅ Site scraped!\n📄 Pages: ${scrapedData.totalPages}\n🖼️ Images: ${scrapedData.images?.length || 0}\n🔗 URL: ${scrapedData.baseUrl}\n\nNow tell me how to redesign it!`,
        type: 'info'
      }])
    }
  }, [scrapedData])

  useEffect(() => {
    if (externalInput) {
      setInput(externalInput)
      onExternalInputUsed?.()
    }
  }, [externalInput])

  const sendMessage = async (messageText = input) => {
    if (!messageText.trim() || isLoading) return
    const userMessage = { id: Date.now(), role: 'user', content: messageText.trim() }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setShowExamples(false)
    onGeneratingChange(true)

    let project = currentProject
    if (!project) project = onCreateProject(messageText.slice(0, 40) + '...')

    const fullPrompt = buildWebsitePrompt(messageText, scrapedData, messages)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: fullPrompt,
          siteData: scrapedData,
          history: messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }))
        })
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Generation failed')

      const assistantMessage = { id: Date.now() + 1, role: 'assistant', content: data.response, hasFiles: false }
      const files = parseFilesFromResponse(data.response)

      if (Object.keys(files).length > 0) {
        assistantMessage.hasFiles = true
        assistantMessage.fileCount = Object.keys(files).length
        onFilesGenerated(files)
      }
      setMessages(prev => [...prev, assistantMessage])
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now() + 1, role: 'assistant',
        content: `❌ Error: ${error.message}\n\nPlease check your API key and try again.`,
        isError: true
      }])
    } finally {
      setIsLoading(false)
      onGeneratingChange(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const copyMessage = (id, content) => {
    navigator.clipboard.writeText(content)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const autoResize = (e) => {
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 200) + 'px'
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', padding: '40px 20px' }}>
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
              style={{
                width: '72px', height: '72px', borderRadius: '22px',
                background: 'linear-gradient(135deg, #6c63ff, #00d4ff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 0 40px rgba(108,99,255,0.5), 0 0 80px rgba(108,99,255,0.2)'
              }}
            >
              <Zap size={32} color="white" />
            </motion.div>

            <h2 style={{ fontSize: '26px', fontWeight: 800, marginBottom: '8px' }} className="gradient-text">
              WebCraft AI Pro
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '14px', maxWidth: '400px', margin: '0 auto 32px', lineHeight: 1.6 }}>
              Describe your dream website or paste a URL to redesign. I'll generate a complete full-stack website with stunning 3D animations.
            </p>

            <AnimatePresence>
              {showExamples && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '500px', margin: '0 auto' }}
                >
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
                    Try these examples
                  </div>
                  {EXAMPLE_PROMPTS.map((prompt, i) => (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      onClick={() => sendMessage(prompt)}
                      style={{
                        padding: '10px 14px', borderRadius: '10px',
                        border: '1px solid rgba(255,255,255,0.08)',
                        background: 'rgba(255,255,255,0.03)',
                        color: 'rgba(255,255,255,0.6)',
                        cursor: 'pointer', fontSize: '13px', textAlign: 'left',
                        transition: 'all 0.2s ease', display: 'flex', alignItems: 'center', gap: '8px'
                      }}
                      whileHover={{ background: 'rgba(108,99,255,0.1)', borderColor: 'rgba(108,99,255,0.3)', color: 'rgba(255,255,255,0.9)' }}
                    >
                      <Sparkles size={12} style={{ opacity: 0.5, flexShrink: 0 }} />
                      {prompt}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        <AnimatePresence>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{ display: 'flex', gap: '12px', flexDirection: msg.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                style={{
                  width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: msg.role === 'user'
                    ? 'rgba(255,255,255,0.1)'
                    : msg.type === 'info'
                      ? 'rgba(0,212,255,0.15)'
                      : 'linear-gradient(135deg, #6c63ff, #00d4ff)',
                  border: msg.role === 'user' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                  boxShadow: msg.role === 'assistant' ? '0 4px 15px rgba(108,99,255,0.3)' : 'none'
                }}
              >
                {msg.role === 'user' ? <User size={14} color="rgba(255,255,255,0.6)" /> : <Sparkles size={14} color="white" />}
              </motion.div>

              <div style={{ maxWidth: '75%', position: 'relative' }}>
                <div style={{
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px',
                  background: msg.role === 'user'
                    ? 'rgba(108,99,255,0.2)'
                    : msg.isError ? 'rgba(255,68,68,0.1)'
                      : msg.type === 'info' ? 'rgba(0,212,255,0.08)'
                        : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${msg.role === 'user'
                    ? 'rgba(108,99,255,0.3)'
                    : msg.isError ? 'rgba(255,68,68,0.2)'
                      : msg.type === 'info' ? 'rgba(0,212,255,0.15)'
                        : 'rgba(255,255,255,0.07)'}`,
                  fontSize: '14px', lineHeight: 1.6,
                  color: msg.isError ? 'rgba(255,100,100,0.9)' : 'rgba(255,255,255,0.85)',
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word'
                }}>
                  {msg.content.length > 500 ? msg.content.slice(0, 500) + '...[code generated]' : msg.content}
                </div>

                {msg.hasFiles && (
                  <motion.button
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={onViewCode}
                    whileHover={{ scale: 1.02 }}
                    style={{
                      marginTop: '8px', padding: '8px 12px', borderRadius: '8px',
                      border: '1px solid rgba(0,255,136,0.2)',
                      background: 'rgba(0,255,136,0.08)', color: '#00ff88',
                      cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                      display: 'flex', alignItems: 'center', gap: '6px', width: 'fit-content'
                    }}
                  >
                    <Code2 size={13} />
                    {msg.fileCount} files generated — View Code →
                  </motion.button>
                )}

                {msg.role === 'assistant' && !msg.isError && (
                  <button
                    onClick={() => copyMessage(msg.id, msg.content)}
                    style={{
                      position: 'absolute', top: '8px', right: '-32px',
                      background: 'transparent', border: 'none', cursor: 'pointer',
                      color: 'rgba(255,255,255,0.2)', padding: '4px', borderRadius: '4px'
                    }}
                  >
                    {copiedId === msg.id ? <Check size={13} color="#00ff88" /> : <Copy size={13} />}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}
          >
            <div style={{
              width: '34px', height: '34px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #6c63ff, #00d4ff)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              boxShadow: '0 4px 15px rgba(108,99,255,0.3)'
            }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                <Wand2 size={14} color="white" />
              </motion.div>
            </div>
            <div style={{
              padding: '12px 16px', borderRadius: '4px 14px 14px 14px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', gap: '12px'
            }}>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[0, 1, 2].map(i => (
                  <motion.div key={i}
                    animate={{ y: [0, -8, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }}
                    style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#6c63ff' }}
                  />
                ))}
              </div>
              <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
                Crafting your website...
              </span>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '16px 20px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(2,2,8,0.8)',
        backdropFilter: 'blur(20px)'
      }}>
        {scrapedData && (
          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
            style={{
              marginBottom: '10px', padding: '8px 12px', borderRadius: '8px',
              background: 'rgba(0,212,255,0.08)', border: '1px solid rgba(0,212,255,0.15)',
              display: 'flex', alignItems: 'center', gap: '8px',
              fontSize: '12px', color: 'rgba(0,212,255,0.8)'
            }}
          >
            <Globe size={13} />
            Site loaded: {scrapedData.baseUrl} ({scrapedData.totalPages} pages)
          </motion.div>
        )}

        <motion.div
          whileFocusWithin={{ borderColor: 'rgba(108,99,255,0.5)', boxShadow: '0 0 0 3px rgba(108,99,255,0.1)' }}
          style={{
            display: 'flex', gap: '10px', alignItems: 'flex-end',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '14px', padding: '10px 14px',
            transition: 'all 0.3s ease'
          }}
        >
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); autoResize(e) }}
            onKeyDown={handleKeyDown}
            placeholder="Describe your website or paste a URL to redesign..."
            rows={1}
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: 'white', fontSize: '14px', lineHeight: 1.6, resize: 'none',
              fontFamily: 'Inter, sans-serif', maxHeight: '200px', overflowY: 'auto'
            }}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            style={{
              width: '38px', height: '38px', borderRadius: '10px', border: 'none',
              background: input.trim() && !isLoading
                ? 'linear-gradient(135deg, #6c63ff, #5a52e0)'
                : 'rgba(255,255,255,0.06)',
              cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, boxShadow: input.trim() && !isLoading ? '0 4px 15px rgba(108,99,255,0.4)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {isLoading
              ? <RefreshCw size={15} color="rgba(255,255,255,0.4)" className="animate-spin" />
              : <Send size={15} color={input.trim() ? 'white' : 'rgba(255,255,255,0.3)'} />
            }
          </motion.button>
        </motion.div>
        <div style={{ marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
          Enter to send · Shift+Enter for new line · Powered by Groq AI
        </div>
      </div>
    </div>
  )
}
