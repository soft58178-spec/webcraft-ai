import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import {
  Copy, Check, Download, FileCode, ChevronRight,
  Eye, Code2, Package, Maximize2
} from 'lucide-react'
import { exportToZip } from '../utils/fileExporter'

export default function CodePreview({ files, projectName }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [copied, setCopied] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const fileList = Object.keys(files)

  const getLanguage = (filename) => {
    const ext = filename.split('.').pop()
    const map = {
      js: 'javascript', jsx: 'jsx', ts: 'typescript', tsx: 'tsx',
      css: 'css', html: 'html', json: 'json', md: 'markdown',
      py: 'python', sql: 'sql', env: 'bash', sh: 'bash'
    }
    return map[ext] || 'javascript'
  }

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop()
    const colors = {
      jsx: '#61dafb', tsx: '#61dafb', js: '#f7df1e', ts: '#3178c6',
      css: '#264de4', html: '#e34c26', json: '#cbcb41', md: '#ffffff',
      sql: '#336791', py: '#3572a5'
    }
    return colors[ext] || '#6c63ff'
  }

  const filteredFiles = fileList.filter(f =>
    f.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const currentFile = selectedFile || fileList[0]
  const currentContent = files[currentFile] || ''

  const copyCode = () => {
    navigator.clipboard.writeText(currentContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await exportToZip(files, projectName)
    } finally {
      setIsExporting(false)
    }
  }

  if (fileList.length === 0) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: '16px',
        color: 'rgba(255,255,255,0.3)'
      }}>
        <FileCode size={48} style={{ opacity: 0.3 }} />
        <div style={{ fontSize: '16px', fontWeight: 600 }}>No files generated yet</div>
        <div style={{ fontSize: '13px', opacity: 0.6 }}>
          Go to AI Chat and describe your website
        </div>
      </div>
    )
  }

  return (
    <div style={{
      height: '100%',
      display: 'flex',
      overflow: 'hidden'
    }}>

      {/* File List */}
      <div style={{
        width: '220px',
        minWidth: '220px',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(2,2,8,0.6)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>

        {/* Header */}
        <div style={{
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px'
          }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.3)',
              textTransform: 'uppercase',
              letterSpacing: '1px'
            }}>
              Files ({fileList.length})
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              disabled={isExporting}
              style={{
                padding: '5px 10px',
                borderRadius: '7px',
                border: 'none',
                background: 'linear-gradient(135deg, #6c63ff, #5a52e0)',
                color: 'white',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Download size={11} />
              {isExporting ? 'Zipping...' : 'ZIP'}
            </motion.button>
          </div>

          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search files..."
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: '7px',
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.04)',
              color: 'white',
              fontSize: '12px',
              outline: 'none'
            }}
          />
        </div>

        {/* File Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {filteredFiles.map((filename, i) => {
            const isActive = currentFile === filename
            const color = getFileIcon(filename)
            const parts = filename.split('/')
            const name = parts[parts.length - 1]
            const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : null

            return (
              <motion.div
                key={filename}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => setSelectedFile(filename)}
                style={{
                  padding: '8px 10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(108,99,255,0.15)' : 'transparent',
                  border: isActive
                    ? '1px solid rgba(108,99,255,0.25)'
                    : '1px solid transparent',
                  marginBottom: '2px',
                  transition: 'all 0.2s ease'
                }}
              >
                {folder && (
                  <div style={{
                    fontSize: '9px',
                    color: 'rgba(255,255,255,0.2)',
                    marginBottom: '2px',
                    fontFamily: 'JetBrains Mono, monospace'
                  }}>
                    {folder}/
                  </div>
                )}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px'
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '2px',
                    background: color,
                    flexShrink: 0
                  }} />
                  <span style={{
                    fontSize: '12px',
                    color: isActive ? 'white' : 'rgba(255,255,255,0.6)',
                    fontFamily: 'JetBrains Mono, monospace',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {name}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Code Editor */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>

        {/* Toolbar */}
        <div style={{
          height: '44px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(2,2,8,0.4)'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.6)',
            fontFamily: 'JetBrains Mono, monospace'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '2px',
              background: getFileIcon(currentFile)
            }} />
            {currentFile}
            <span style={{
              fontSize: '11px',
              color: 'rgba(255,255,255,0.2)',
              fontFamily: 'Inter, sans-serif'
            }}>
              {currentContent.split('\n').length} lines
            </span>
          </div>

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={copyCode}
              className="btn-icon"
              style={{ fontSize: '12px', gap: '4px', display: 'flex', alignItems: 'center', padding: '6px 10px' }}
            >
              {copied ? <Check size={13} color="#00ff88" /> : <Copy size={13} />}
              <span style={{ fontSize: '12px' }}>{copied ? 'Copied!' : 'Copy'}</span>
            </button>
            <button
              onClick={handleExport}
              className="btn-primary"
              style={{ fontSize: '12px', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={13} />
              Download ZIP
            </button>
          </div>
        </div>

        {/* Code */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <SyntaxHighlighter
            language={getLanguage(currentFile)}
            style={vscDarkPlus}
            showLineNumbers
            wrapLines
            customStyle={{
              margin: 0,
              padding: '20px',
              background: 'transparent',
              fontSize: '13px',
              lineHeight: '1.6',
              minHeight: '100%',
              fontFamily: 'JetBrains Mono, Fira Code, monospace'
            }}
            lineNumberStyle={{
              color: 'rgba(255,255,255,0.15)',
              minWidth: '40px',
              paddingRight: '16px'
            }}
          >
            {currentContent}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  )
}
