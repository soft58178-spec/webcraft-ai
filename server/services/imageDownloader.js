import axios from 'axios'
import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DOWNLOADS_DIR = path.join(__dirname, '../../public/downloads')

// Create downloads directory if not exists
if (!fs.existsSync(DOWNLOADS_DIR)) {
  fs.mkdirSync(DOWNLOADS_DIR, { recursive: true })
}

export async function downloadImages(imageUrls, baseUrl) {
  if (!imageUrls || imageUrls.length === 0) return []

  const downloaded = []
  const uniqueUrls = [...new Set(imageUrls)].slice(0, 50)

  for (const imageUrl of uniqueUrls) {
    try {
      const filename = generateFilename(imageUrl)
      const filepath = path.join(DOWNLOADS_DIR, filename)

      // Skip if already downloaded
      if (fs.existsSync(filepath)) {
        downloaded.push({
          originalUrl: imageUrl,
          localPath: `/downloads/${filename}`,
          filename
        })
        continue
      }

      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Referer': baseUrl
        }
      })

      const contentType = response.headers['content-type'] || ''

      if (!contentType.startsWith('image/')) continue

      // Process with sharp - resize if too large
      const imageBuffer = Buffer.from(response.data)

      await sharp(imageBuffer)
        .resize(1920, 1080, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .toFile(filepath)

      downloaded.push({
        originalUrl: imageUrl,
        localPath: `/downloads/${filename}`,
        filename,
        size: fs.statSync(filepath).size
      })

      console.log(`✅ Downloaded: ${filename}`)

    } catch (err) {
      console.error(`❌ Failed to download ${imageUrl}:`, err.message)
    }
  }

  return downloaded
}

export async function downloadSingleImage(url) {
  try {
    const filename = generateFilename(url)
    const filepath = path.join(DOWNLOADS_DIR, filename)

    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    const imageBuffer = Buffer.from(response.data)
    const base64 = imageBuffer.toString('base64')
    const contentType = response.headers['content-type'] || 'image/jpeg'

    return {
      base64: `data:${contentType};base64,${base64}`,
      filename,
      contentType
    }
  } catch (err) {
    console.error(`Failed to download image: ${err.message}`)
    return null
  }
}

function generateFilename(url) {
  try {
    const urlObj = new URL(url)
    const ext = path.extname(urlObj.pathname) || '.jpg'
    const name = path.basename(urlObj.pathname, ext)
      .replace(/[^a-zA-Z0-9-_]/g, '_')
      .slice(0, 50)
    const hash = Math.random().toString(36).slice(2, 8)
    return `${name}_${hash}${ext}`
  } catch {
    return `image_${Date.now()}.jpg`
  }
}

export function clearDownloads() {
  if (fs.existsSync(DOWNLOADS_DIR)) {
    fs.readdirSync(DOWNLOADS_DIR).forEach(file => {
      fs.unlinkSync(path.join(DOWNLOADS_DIR, file))
    })
  }
}
