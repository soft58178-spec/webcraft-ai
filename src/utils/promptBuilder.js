export function buildWebsitePrompt(userMessage, scrapedData = null, history = []) {
  const isRedesign = scrapedData !== null
  const isFirstMessage = history.filter(m => m.role === 'user').length === 0

  let prompt = ''

  if (isRedesign && isFirstMessage) {
    prompt = buildRedesignPrompt(userMessage, scrapedData)
  } else if (isFirstMessage) {
    prompt = buildNewWebsitePrompt(userMessage)
  } else {
    prompt = buildContinuationPrompt(userMessage, scrapedData)
  }

  return prompt
}

function buildNewWebsitePrompt(userMessage) {
  return `
You are the world's best full-stack website developer. Generate a COMPLETE, production-ready website.

USER REQUEST: ${userMessage}

STRICT REQUIREMENTS:
1. Generate EVERY file completely — no shortcuts, no "// TODO", no placeholders
2. Frontend: React + Vite with stunning visuals
3. Include Three.js for 3D elements and animations
4. Use GSAP or Framer Motion for smooth animations
5. Add scroll-triggered animations (elements appear on scroll)
6. Use glassmorphism, gradients, particle effects
7. Backend: Node.js + Express with full REST API
8. Database: Include schema (MongoDB or PostgreSQL)
9. Generate ALL pages (minimum 10-15 pages for a real website)
10. Mobile responsive — perfect on all screen sizes
11. Include README.md with setup instructions
12. Include .env.example with all required variables
13. Each file wrapped in: ===FILE: path/filename.ext===
   [complete file content]
   ===ENDFILE===

VISUAL REQUIREMENTS:
- Hero section with 3D Three.js background (particles, geometries, or custom shader)
- Smooth page transitions
- Parallax scrolling effects
- Animated counters, progress bars
- Hover micro-animations on all interactive elements
- Custom cursor effect
- Loading screen with animation
- Dark theme with vibrant accent colors
- Gradient text and backgrounds
- Floating elements and depth effects

PAGES TO GENERATE:
Based on the user request, generate all relevant pages including:
- Home/Landing page (hero, features, testimonials, CTA, footer)
- About page
- Services/Products page  
- Individual service/product detail pages
- Portfolio/Gallery (if relevant)
- Blog/News section
- Contact page with form
- 404 error page
- Any other relevant pages

FILE STRUCTURE TO GENERATE:
frontend/
  src/
    components/ (Header, Footer, Hero, all section components)
    pages/ (all page components)
    hooks/ (custom hooks)
    utils/ (helper functions)
    styles/ (CSS modules or global styles)
    App.jsx
    main.jsx
  public/
    index.html
  package.json
  vite.config.js

backend/
  routes/ (all API routes)
  models/ (database models)
  middleware/ (auth, validation, etc)
  controllers/ (business logic)
  server.js
  package.json

database/
  schema.sql (or schema.js for MongoDB)
  seed.js (sample data)

.env.example
README.md

START GENERATING ALL FILES NOW. Be thorough and complete.
`
}

function buildRedesignPrompt(userMessage, scrapedData) {
  const pages = scrapedData.pages || []
  const mainPage = pages[0] || {}

  // Extract key content
  const allTexts = pages.flatMap(p => p.paragraphs || []).slice(0, 30)
  const allHeadings = pages.flatMap(p => [...(p.h1 || []), ...(p.h2 || []), ...(p.h3 || [])]).slice(0, 40)
  const allButtons = pages.flatMap(p => p.buttons || []).slice(0, 20)
  const navItems = mainPage.navItems || []
  const images = scrapedData.downloadedImages || scrapedData.images?.slice(0, 20) || []
  const colors = mainPage.colors?.slice(0, 10) || []
  const fonts = mainPage.fonts?.slice(0, 5) || []

  return `
You are the world's best full-stack website developer. Redesign this website with a completely new, stunning design while keeping ALL original content.

ORIGINAL SITE: ${scrapedData.originalUrl}
TOTAL PAGES SCRAPED: ${scrapedData.totalPages}

=== ORIGINAL CONTENT TO KEEP (USE ALL OF THIS) ===

NAVIGATION ITEMS:
${navItems.map(n => `- ${n.text}: ${n.href}`).join('\n') || 'No nav items found'}

HEADINGS:
${allHeadings.map(h => `- ${h}`).join('\n') || 'No headings found'}

TEXT CONTENT:
${allTexts.map(t => `- ${t}`).join('\n') || 'No text found'}

BUTTON LABELS:
${allButtons.map(b => `- ${b}`).join('\n') || 'No buttons found'}

IMAGES AVAILABLE:
${images.slice(0, 15).map(img => {
  const src = typeof img === 'string' ? img : img.localPath || img.originalUrl
  return `- ${src}`
}).join('\n') || 'No images'}

ORIGINAL COLORS (for reference):
${colors.join(', ') || 'Not detected'}

ORIGINAL FONTS (for reference):
${fonts.join(', ') || 'Not detected'}

PAGE URLS TO RECREATE:
${pages.map(p => `- ${p.url} (${p.title})`).join('\n')}

=== USER REDESIGN REQUEST ===
${userMessage}

=== REDESIGN REQUIREMENTS ===
1. Keep ALL original text content, headings, navigation items, button labels
2. Use original images from the paths listed above
3. Create a COMPLETELY NEW visual design — better, more modern, more stunning
4. Add 3D elements with Three.js (hero background, product viewer, etc.)
5. Add Framer Motion animations throughout
6. Add scroll-triggered reveal animations
7. Use glassmorphism, gradients, particle effects
8. Keep the same number of pages as the original
9. Generate complete full-stack code (React frontend + Node.js backend)
10. Each file wrapped in: ===FILE: path/filename.ext===
    [complete file content]
    ===ENDFILE===

GENERATE ALL FILES NOW. Do not skip any pages or components.
`
}

function buildContinuationPrompt(userMessage, scrapedData) {
  return `
Continue working on this website project.

${scrapedData ? `Original site: ${scrapedData.originalUrl}` : ''}

USER REQUEST: ${userMessage}

Generate the requested changes/additions as complete files.
Each file wrapped in: ===FILE: path/filename.ext===
[complete file content]
===ENDFILE===

Make sure all code is complete and production-ready.
`
}

export function buildQuickPrompt(type, details) {
  const prompts = {
    landing: `Create a stunning landing page for: ${details}. Include hero with 3D Three.js animation, features section, testimonials, pricing, and CTA. Make it visually breathtaking.`,
    ecommerce: `Build a complete e-commerce store for: ${details}. Include product listings with 3D viewer, cart, checkout, user auth, and admin dashboard.`,
    portfolio: `Create a creative portfolio website for: ${details}. Include 3D animated hero, project gallery with filters, about section, skills visualization, and contact form.`,
    blog: `Build a modern blog platform for: ${details}. Include 3D animated header, article listings, categories, search, and admin panel.`,
    dashboard: `Create an analytics dashboard for: ${details}. Include 3D data visualizations, charts, real-time updates, dark theme with neon accents.`,
    restaurant: `Build a luxury restaurant website for: ${details}. Include 3D food animations, menu, reservations system, gallery, and location.`,
    saas: `Create a SaaS product website for: ${details}. Include animated hero with product demo, features with icons, pricing tables, testimonials, and onboarding flow.`,
    agency: `Build a creative agency website for: ${details}. Include immersive 3D hero, portfolio showcase, team section, services, and case studies.`,
  }
  return prompts[type] || `Create a complete website for: ${details}`
}
