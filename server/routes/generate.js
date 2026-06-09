import express from 'express'
import axios from 'axios'

const router = express.Router()

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

// Generate website code
router.post('/', async (req, res) => {
  const { prompt, siteData, history } = req.body

  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' })
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured' })
    }

    // Build messages history
    const messages = []

    if (history && history.length > 0) {
      history.forEach(msg => {
        messages.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        })
      })
    }

    // Add current prompt
    let fullPrompt = prompt

    if (siteData) {
      fullPrompt = `
SCRAPED WEBSITE DATA:
Title: ${siteData.title}
Description: ${siteData.description}
Pages: ${siteData.pages?.length || 0}
Content: ${JSON.stringify(siteData.pages?.slice(0, 5), null, 2)}
Images: ${siteData.images?.slice(0, 20).join('\n')}

USER REQUEST:
${prompt}
      `
    }

    messages.push({
      role: 'user',
      parts: [{ text: fullPrompt }]
    })

    const response = await axios.post(
      `${GEMINI_API_URL}?key=${apiKey}`,
      {
        contents: messages,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 32768,
        },
        systemInstruction: {
          parts: [{
            text: `You are WebCraft AI Pro — the world's best full stack website generator.

RULES:
1. Always generate COMPLETE, production-ready code
2. Use modern technologies: React, Three.js, GSAP, Framer Motion
3. Create stunning 3D animations and visual effects
4. Generate full stack: Frontend + Backend + Database schema
5. Every file must be complete — no placeholders, no "// add code here"
6. Use glassmorphism, gradients, particle effects, scroll animations
7. Mobile responsive by default
8. Always wrap each file in: ===FILE: filename.ext=== code ===ENDFILE===
9. Generate ALL pages requested — never skip pages
10. Include package.json, README.md with every project`
          }]
        }
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 120000
      }
    )

    const text = response.data.candidates[0].content.parts[0].text

    res.json({
      success: true,
      response: text,
      usage: response.data.usageMetadata
    })

  } catch (error) {
    console.error('Generate error:', error.response?.data || error.message)
    res.status(500).json({
      error: 'Generation failed',
      message: error.response?.data?.error?.message || error.message
    })
  }
})

// Stream response for real-time output
router.post('/stream', async (req, res) => {
  const { prompt, history } = req.body

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  try {
    const apiKey = process.env.GEMINI_API_KEY

    const messages = []

    if (history?.length > 0) {
      history.forEach(msg => {
        messages.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        })
      })
    }

    messages.push({ role: 'user', parts: [{ text: prompt }] })

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?key=${apiKey}`,
      {
        contents: messages,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 32768,
        }
      },
      {
        responseType: 'stream',
        headers: { 'Content-Type': 'application/json' }
      }
    )

    response.data.on('data', (chunk) => {
      const lines = chunk.toString().split('\n').filter(Boolean)
      lines.forEach(line => {
        try {
          const data = JSON.parse(line.replace(/^data: /, ''))
          const text = data.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) {
            res.write(`data: ${JSON.stringify({ text })}\n\n`)
          }
        } catch (e) {}
      })
    })

    response.data.on('end', () => {
      res.write('data: [DONE]\n\n')
      res.end()
    })

  } catch (error) {
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`)
    res.end()
  }
})

export default router
