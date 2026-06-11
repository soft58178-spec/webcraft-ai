import express from 'express'
import axios from 'axios'

const router = express.Router()
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'

const SYSTEM_PROMPT = `You are WebCraft AI Pro — the world's best full-stack website generator.
RULES:
1. Every file 100% complete
2. Use React, Three.js, GSAP, Framer Motion
3. Stunning 3D animations
4. frontend/ and backend/ folders
5. ===FILE: path=== code ===ENDFILE===
6. Never stop mid-file
7. Include package.json and README.md`

router.post('/', async (req, res) => {
  const { prompt, siteData, history } = req.body
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' })
  try {
    const messages = [{ role: 'system', content: SYSTEM_PROMPT }]
    if (history?.length > 0) {
      history.forEach(msg => messages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      }))
    }
    messages.push({ role: 'user', content: prompt })
    const response = await axios.post(`${OLLAMA_URL}/api/chat`, {
      model: 'qwen2.5:7b',
      messages,
      stream: false,
      options: { temperature: 0.7, num_predict: 32000, num_ctx: 32768 }
    }, {
      headers: { 'ngrok-skip-browser-warning': 'true' },
      timeout: 300000
    })
    res.json({ success: true, response: response.data.message.content })
  } catch (error) {
    res.status(500).json({ error: 'Generation failed', message: error.message })
  }
})

export default router