import express from 'express'
import axios from 'axios'

const router = express.Router()

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent'

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
      fullPrompt = `
SCRAPED WEBSITE DATA:
Title: ${siteData.title}
Pages: ${siteData.pages?.length || 0}
Content: ${JSON.stringify(siteData.pages?.slice(0, 3), null, 2)}
Images: ${siteData.images?.slice(0, 10).join('\n')}

USER REQUEST: ${prompt}
      `
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
          parts: [{
            text: `You are WebCraft AI Pro — the world's best full-stack website generator.
RULES:
1. Always generate COMPLETE, production-ready code
2. Use React, Three.js, GSAP, Framer Motion
3. Create stunning 3D animations and visual effects
4. Generate full stack: Frontend + Backend + Database schema
5. Every file must be complete — no placeholders
6. Use glassmorphism, gradients, particle effects, scroll animations
7. Mobile responsive by default
8. Always wrap each file in: ===FILE: filename.ext=== code ===ENDFILE===
9. Generate ALL pages requested
10. Include package.json and README.md`
          }]
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 180000
      }
    )

    const text = response.data.candidates[0].content.parts[0].text

    res.json({ success: true, response: text, usage: response.data.usageMetadata })

  } catch (error) {
    console.error('Generate error:', error.response?.data || error.message)
    res.status(500).json({
      error: 'Generation failed',
      message: error.response?.data?.error?.message || error.message
    })
  }
})

export default router
