export function buildWebsitePrompt(userMessage, scrapedData = null, history = []) {
  const isRedesign = scrapedData !== null
  const isFirstMessage = history.filter(m => m.role === 'user').length === 0

  if (isRedesign && isFirstMessage) return buildRedesignPrompt(userMessage, scrapedData)
  if (isFirstMessage) return buildNewWebsitePrompt(userMessage)
  return buildContinuationPrompt(userMessage, scrapedData)
}

function buildNewWebsitePrompt(userMessage) {
  return `
You are the world's best full-stack developer. Generate a COMPLETE website.

USER REQUEST: ${userMessage}

STRICT FILE STRUCTURE — generate ALL these files:

FRONTEND (folder: frontend/):
===FILE: frontend/package.json===
[complete]
===ENDFILE===
===FILE: frontend/vite.config.js===
[complete]
===ENDFILE===
===FILE: frontend/index.html===
[complete]
===ENDFILE===
===FILE: frontend/src/main.jsx===
[complete]
===ENDFILE===
===FILE: frontend/src/App.jsx===
[complete with React Router for all pages]
===ENDFILE===
===FILE: frontend/src/index.css===
[complete with all styles]
===ENDFILE===
===FILE: frontend/src/components/Header.jsx===
[complete]
===ENDFILE===
===FILE: frontend/src/components/Footer.jsx===
[complete]
===ENDFILE===
===FILE: frontend/src/components/Hero.jsx===
[complete with Three.js 3D scene]
===ENDFILE===
===FILE: frontend/src/pages/Home.jsx===
[complete]
===ENDFILE===
===FILE: frontend/src/pages/About.jsx===
[complete]
===ENDFILE===
===FILE: frontend/src/pages/Services.jsx===
[complete]
===ENDFILE===
===FILE: frontend/src/pages/Contact.jsx===
[complete]
===ENDFILE===

BACKEND (folder: backend/):
===FILE: backend/package.json===
[complete]
===ENDFILE===
===FILE: backend/server.js===
[complete Express server]
===ENDFILE===
===FILE: backend/routes/api.js===
[complete API routes]
===ENDFILE===
===FILE: backend/.env.example===
[complete]
===ENDFILE===

DATABASE:
===FILE: database/schema.js===
[complete MongoDB or SQL schema]
===ENDFILE===

DOCS:
===FILE: README.md===
[complete setup instructions]
===ENDFILE===

DESIGN REQUIREMENTS:
- Dark luxury theme
- Three.js 3D hero with particles and animations
- Framer Motion page transitions
- GSAP scroll animations
- Glassmorphism cards
- Gradient text and buttons
- Custom animated cursor
- Mobile responsive

CRITICAL: Every single file must be 100% complete. Never write [complete file] or placeholders — write the actual code!
`
}

function buildRedesignPrompt(userMessage, scrapedData) {
  const pages = scrapedData.pages || []
  const mainPage = pages[0] || {}
  const allTexts = pages.flatMap(p => p.paragraphs || []).slice(0, 30)
  const allHeadings = pages.flatMap(p => [...(p.h1 || []), ...(p.h2 || [])]).slice(0, 40)
  const allButtons = pages.flatMap(p => p.buttons || []).slice(0, 20)
  const navItems = mainPage.navItems || []
  const images = scrapedData.downloadedImages || scrapedData.images?.slice(0, 20) || []

  return `
You are the world's best full-stack developer. Redesign this website keeping ALL original content.

ORIGINAL SITE: ${scrapedData.originalUrl}
TOTAL PAGES: ${scrapedData.totalPages}

=== ORIGINAL CONTENT — USE ALL OF THIS ===

NAVIGATION:
${navItems.map(n => `- ${n.text}`).join('\n') || 'No nav items'}

HEADINGS:
${allHeadings.map(h => `- ${h}`).join('\n')}

TEXT CONTENT:
${allTexts.map(t => `- ${t}`).join('\n')}

BUTTONS:
${allButtons.map(b => `- ${b}`).join('\n')}

IMAGES:
${images.slice(0, 15).map(img => {
    const src = typeof img === 'string' ? img : img.localPath || img.originalUrl
    return `- ${src}`
  }).join('\n')}

PAGES TO RECREATE:
${pages.map(p => `- ${p.title || p.url}`).join('\n')}

USER REQUEST: ${userMessage}

GENERATE THESE FILES:

FRONTEND (folder: frontend/):
===FILE: frontend/package.json===
[complete]
===ENDFILE===
===FILE: frontend/vite.config.js===
[complete]
===ENDFILE===
===FILE: frontend/index.html===
[complete]
===ENDFILE===
===FILE: frontend/src/main.jsx===
[complete]
===ENDFILE===
===FILE: frontend/src/App.jsx===
[complete with all pages from original site]
===ENDFILE===
===FILE: frontend/src/index.css===
[complete]
===ENDFILE===
===FILE: frontend/src/components/Header.jsx===
[complete with original navigation]
===ENDFILE===
===FILE: frontend/src/components/Footer.jsx===
[complete]
===ENDFILE===
===FILE: frontend/src/components/Hero.jsx===
[complete with Three.js 3D]
===ENDFILE===
[all other pages from original site]

BACKEND (folder: backend/):
===FILE: backend/package.json===
[complete]
===ENDFILE===
===FILE: backend/server.js===
[complete]
===ENDFILE===
===FILE: backend/routes/api.js===
[complete]
===ENDFILE===

===FILE: README.md===
[complete]
===ENDFILE===

DESIGN:
- Completely new stunning design
- Keep ALL original texts, headings, buttons, images
- Three.js 3D animations
- Framer Motion transitions
- Dark luxury theme
- Glassmorphism

CRITICAL: Write 100% complete code for every file. Never use placeholders!
`
}

function buildContinuationPrompt(userMessage, scrapedData) {
  return `
Continue the website project.
${scrapedData ? `Original site: ${scrapedData.originalUrl}` : ''}

USER REQUEST: ${userMessage}

Generate requested files as complete code:
===FILE: path/filename.ext===
[100% complete code]
===ENDFILE===
`
}

export function buildQuickPrompt(type, details) {
  const prompts = {
    landing: `Create stunning 3D landing page for: ${details}`,
    ecommerce: `Build complete e-commerce store for: ${details}`,
    portfolio: `Create creative 3D portfolio for: ${details}`,
    restaurant: `Build luxury restaurant website for: ${details}`,
    saas: `Create SaaS product website for: ${details}`,
  }
  return prompts[type] || `Create complete website for: ${details}`
}
