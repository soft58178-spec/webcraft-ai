import express from 'express'
import axios from 'axios'

const router = express.Router()

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'

const SYSTEM_PROMPT = `You are WebCraft AI Pro — the world's best full-stack website generator.

CRITICAL RULES:
1. Generate EVERY file 100% complete — no placeholders ever
2. Use React, Three.js, GSAP, Framer Motion
3. Create stunning 3D animations and visual effects
4. Generate full stack: frontend/ and backend/ folders
5. Wrap every file: ===FILE: path/file.ext=== content ===ENDFILE===
6. NEVER stop mid-file — always finish completely
7. Generate ALL pages — never skip any
8. Include package.json and README.md`

router.post('/', async (req, res) => {
  const { prompt, siteData, history } = req.body
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' })

  try {
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
SCRAPED SITE: ${siteData.originalUrl}
Pages: ${siteData.totalPages}
Content: ${JSON.stringify(siteData.pages?.slice(0, 3))}
Images: ${siteData.images?.slice(0, 10).join('\n')}

REQUEST: ${prompt}`
    }

    messages.push({ role: 'user', content: fullPrompt })

    const response = await axios.post(
      `${OLLAMA_URL}/api/chat`,
      {
        model: 'qwen3:14b',
        messages,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 32000,
          num_ctx: 32768
        }
      },
      {
        timeout: 300000 // 5 минут
      }
    )

    const text = response.data.message.content

    res.json({
      success: true,
      response: text,
      usage: { model: 'qwen3:14b (local)' }
    })

  } catch (error) {
    console.error('Ollama error:', error.message)

    // Если Ollama недоступна — пробуем Gemini как запасной
    if (process.env.GEMINI_API_KEY) {
      try {
        console.log('Ollama unavailable, falling back to Gemini...')
        const geminiResponse = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 65536 },
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] }
          },
          { headers: { 'Content-Type': 'application/json' }, timeout: 180000 }
        )
        const text = geminiResponse.data.candidates[0].content.parts[0].text
        return res.json({ success: true, response: text, usage: { model: 'gemini-3-flash-preview (fallback)' } })
      } catch (geminiError) {
        console.error('Gemini fallback error:', geminiError.message)
      }
    }

    res.status(500).json({
      error: 'Generation failed',
      message: 'Ollama is not running. Please start Ollama on your computer.'
    })
  }
})

export default router
