import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import scrapeRoutes from './routes/scrape.js'
import generateRoutes from './routes/generate.js'

dotenv.config()

const app = express()

app.use(cors())
app.use(express.json({ limit: '50mb' }))

app.use('/api/scrape', scrapeRoutes)
app.use('/api/generate', generateRoutes)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

export default app
