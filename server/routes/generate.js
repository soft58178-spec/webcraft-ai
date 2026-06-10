import express from 'express'
import axios from 'axios'

const router = express.Router()

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

const SYSTEM_PROMPT = `You are WebCraft AI Pro — the world's best full-stack website generator.

RULES:
1. Always generate COMPLETE, production-ready code
2. Use React, Three.js, GSAP, Framer Motion
3. Create stunning 3D animations and visual effects
4. Generate full stack: Frontend + Backend + Database schema
5. Every file must be complete — no placeholders, no shortcuts
6. Use glassmorphism, gradients, particle effects, scroll animations
7. Mobile responsive by default
8. Always wrap each file in: ===FILE: filename.ext=== code ===ENDFILE===
9. Generate ALL pages requested — never skip pages
10. Include package.json and README.md with every project`

router.post('/', async (req, res) => {
  const { prompt, siteData, history } = req.body

  if (!prompt) return res.status(400).json({ error: 'Prompt is required' })

  try {
    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) return res.status(500).json({ error: 'OpenRouter API key not configured' })

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT }
    ]

    if (history?.length > 0) {
      history.forEach(msg => {
        messages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content
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

    messages.push({ role: 'user', content: fullPrompt })

    const response = await axios.post(
      OPENROUTER_API_URL,
      {
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages,
        max_tokens: 32000,
        temperature: 0.7,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://webcraft-ai.onrender.com',
          'X-Title': 'WebCraft AI Pro'
        },
        timeout: 180000
      }
    )

    const text = response.data.choices[0].message.content

    res.json({
      success: true,
      response: text,
      usage: response.data.usage
    })

  } catch (error) {
    console.error('Generate error:', error.response?.data || error.message)
    res.status(500).json({
      error: 'Generation failed',
      message: error.response?.data?.error?.message || error.message
    })
  }
})

export default router
