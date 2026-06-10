import express from 'express'
import axios from 'axios'

const router = express.Router()

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent'

const SYSTEM_PROMPT = `You are WebCraft AI Pro — the world's best full-stack website generator.

CRITICAL RULES — NEVER BREAK THESE:
1. Generate EVERY file 100% complete — no [complete file], no placeholders
2. Use React, Three.js, GSAP, Framer Motion
3. Create stunning 3D animations
4. Full stack: Frontend + Backend
5. Wrap every file: ===FILE: path/file.ext=== content ===ENDFILE===
6. NEVER stop mid-file — always finish completely
7. Generate ALL pages — never skip
8. Include package.json and README.md`

router.post('/', async (req, res) => {
  const { prompt, siteData, history } = req.body
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' })

  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' })

    const messages = []
    if (history?.length > 0) {
      history.forEach(msg => {
        messages.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        })
      })
    }

    let fullPrompt = prompt
    if (siteData) {
      fullPrompt = `SCRAPED SITE: ${siteData.originalUrl}
Pages: ${siteData.totalPages}
Content: ${JSON.stringify(siteData.pages?.slice(0, 3))}
Images: ${siteData.images?.slice(0, 10).join('\n')}

REQUEST: ${prompt}`
    }

    messages.push({ role: 'user', parts: [{ text: fullPrompt }] })

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${apiKey}`,
      {
        contents: messages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 65536,
        },
        systemInstruction: {
          parts: [{ text: SYSTEM_PROMPT }]
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 180000
      }
    )

    const text = response.data.candidates[0].content.parts[0].text
    res.json({ success: true, response: text })

  } catch (error) {
    console.error('Error:', error.response?.data || error.message)
    res.status(500).json({
      error: 'Generation failed',
      message: error.response?.data?.error?.message || error.message
    })
  }
})

export default router
