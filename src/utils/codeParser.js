/**
 * Parses AI response and extracts files
 * Supports format: ===FILE: path/filename.ext=== ... ===ENDFILE===
 */
export function parseFilesFromResponse(response) {
  const files = {}

  if (!response) return files

  // Primary pattern: ===FILE: path=== ... ===ENDFILE===
  const primaryPattern = /===FILE:\s*([^\n=]+)===\s*([\s\S]*?)===ENDFILE===/g
  let match

  while ((match = primaryPattern.exec(response)) !== null) {
    const filepath = match[1].trim()
    const content = match[2].trim()
    if (filepath && content) {
      files[filepath] = content
    }
  }

  // Fallback pattern: ```language\n...``` with filename comment
  if (Object.keys(files).length === 0) {
    const fallbackPattern = /```(?:jsx?|tsx?|css|html|json|md|sql|bash|sh|python)?\s*\n([\s\S]*?)```/g
    let i = 0

    while ((match = fallbackPattern.exec(response)) !== null) {
      const content = match[1].trim()
      if (!content) continue

      // Try to detect filename from first line comment
      const firstLine = content.split('\n')[0]
      let filename = null

      // Check for // filename.ext or /* filename.ext */ or # filename.ext
      const commentPatterns = [
        /^\/\/\s*([^\s]+\.[a-z]+)/i,
        /^\/\*\s*([^\s]+\.[a-z]+)/i,
        /^#\s*([^\s]+\.[a-z]+)/i,
        /^<!--\s*([^\s]+\.[a-z]+)/i,
      ]

      for (const pattern of commentPatterns) {
        const m = firstLine.match(pattern)
        if (m) {
          filename = m[1]
          break
        }
      }

      if (!filename) {
        // Guess from content
        filename = guessFilename(content, i)
      }

      files[filename] = content
      i++
    }
  }

  // Second fallback: look for file headers like "**filename.ext**" or "### filename.ext"
  if (Object.keys(files).length === 0) {
    const headerPattern = /(?:\*\*|###?\s+|`)([\w./\\-]+\.[a-z]{2,4})(?:\*\*|`)?[\s\S]*?```(?:\w+)?\n([\s\S]*?)```/gi

    while ((match = headerPattern.exec(response)) !== null) {
      const filepath = match[1].trim()
      const content = match[2].trim()
      if (filepath && content) {
        files[filepath] = content
      }
    }
  }

  return files
}

function guessFilename(content, index) {
  // Detect file type from content
  if (content.includes('import React') || content.includes('export default') || content.includes('jsx')) {
    if (content.includes('App') && index === 0) return 'src/App.jsx'
    if (content.includes('main') && content.includes('createRoot')) return 'src/main.jsx'
    return `src/components/Component${index}.jsx`
  }

  if (content.includes('express') || content.includes('app.listen') || content.includes('router')) {
    if (content.includes('app.listen')) return 'server.js'
    return `server/routes/route${index}.js`
  }

  if (content.includes('CREATE TABLE') || content.includes('INSERT INTO')) {
    return 'database/schema.sql'
  }

  if (content.includes('@import') || content.includes(':root') || content.includes('body {')) {
    return `src/styles/style${index}.css`
  }

  if (content.includes('<!DOCTYPE') || content.includes('<html')) {
    return 'public/index.html'
  }

  if (content.trim().startsWith('{') && content.includes('"name"') && content.includes('"version"')) {
    return 'package.json'
  }

  if (content.includes('# ') && !content.includes('function')) {
    return 'README.md'
  }

  return `file${index}.js`
}

export function extractCodeBlock(text, language) {
  const pattern = new RegExp('```' + language + '\\n([\\s\\S]*?)```', 'i')
  const match = text.match(pattern)
  return match ? match[1].trim() : null
}

export function countFiles(response) {
  const files = parseFilesFromResponse(response)
  return Object.keys(files).length
}

export function getFileExtensions(files) {
  const exts = {}
  Object.keys(files).forEach(filepath => {
    const ext = filepath.split('.').pop()
    exts[ext] = (exts[ext] || 0) + 1
  })
  return exts
}

export function validateFiles(files) {
  const issues = []

  Object.entries(files).forEach(([filepath, content]) => {
    if (!content || content.trim().length === 0) {
      issues.push(`Empty file: ${filepath}`)
    }
    if (content.includes('// TODO') || content.includes('// PLACEHOLDER')) {
      issues.push(`Incomplete file: ${filepath}`)
    }
  })

  return {
    isValid: issues.length === 0,
    issues
  }
}

export function organizeFiles(files) {
  const organized = {
    frontend: {},
    backend: {},
    database: {},
    config: {},
    docs: {}
  }

  Object.entries(files).forEach(([filepath, content]) => {
    if (filepath.startsWith('frontend/') || filepath.startsWith('src/') || filepath.endsWith('.jsx') || filepath.endsWith('.tsx')) {
      organized.frontend[filepath] = content
    } else if (filepath.startsWith('backend/') || filepath.startsWith('server/') || filepath === 'server.js') {
      organized.backend[filepath] = content
    } else if (filepath.startsWith('database/') || filepath.endsWith('.sql') || filepath.endsWith('schema.js')) {
      organized.database[filepath] = content
    } else if (filepath.endsWith('.md') || filepath.endsWith('.txt')) {
      organized.docs[filepath] = content
    } else {
      organized.config[filepath] = content
    }
  })

  return organized
}
