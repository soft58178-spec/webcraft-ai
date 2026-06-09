import { useState, useCallback } from 'react'

export function useGeminiAPI() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const generate = useCallback(async ({ prompt, siteData, history = [] }) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, siteData, history })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'Generation failed')
      }

      return data.response

    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const generateStream = useCallback(async ({ prompt, history = [], onChunk }) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/generate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, history })
      })

      if (!response.ok) throw new Error('Stream failed')

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(Boolean)

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const parsed = JSON.parse(data)
              if (parsed.text) {
                fullText += parsed.text
                onChunk?.(parsed.text, fullText)
              }
            } catch (e) {}
          }
        }
      }

      return fullText

    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const retry = useCallback(async (fn, maxRetries = 3, delay = 1000) => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn()
      } catch (err) {
        if (i === maxRetries - 1) throw err
        await new Promise(r => setTimeout(r, delay * (i + 1)))
      }
    }
  }, [])

  return {
    generate,
    generateStream,
    retry,
    isLoading,
    error,
    clearError: () => setError(null)
  }
}

// Keep old name for compatibility
export const useClaudeAPI = useGeminiAPI
