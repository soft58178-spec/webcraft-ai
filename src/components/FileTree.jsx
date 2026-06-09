import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Folder, FolderOpen, FileCode, FileText, File,
  Download, ChevronRight, ChevronDown, Package
} from 'lucide-react'
import { exportToZip } from '../utils/fileExporter'

function buildTree(files) {
  const tree = {}
  Object.keys(files).forEach(filepath => {
    const parts = filepath.split('/')
    let current = tree
    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        current[part] = { _isFile: true, _path: filepath, _content: files[filepath] }
      } else {
        if (!current[part]) current[part] = {}
        current = current[part]
      }
    })
  })
  return tree
}

function getFileColor(filename) {
  const ext = filename.split('.').pop()
  const colors = {
    jsx: '#61dafb', tsx: '#61dafb', js: '#f7df1e', ts: '#3178c6',
    css: '#264de4', html: '#e34c26', json: '#cbcb41', md: '#ffffff',
    sql: '#336791', py: '#3572a5', env: '#ecd53f', sh: '#89e051'
  }
  return colors[ext] || '#6c63ff'
}

function getFileSize(content) {
  const bytes = new Blob([content]).size
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function TreeNode({ name, node, depth = 0, onSelect, selectedPath }) {
  const [isOpen, setIsOpen] = useState(depth < 2)

  if (node._isFile) {
    const isSelected = selectedPath === node._path
    const color = getFileColor(name)
    const size = getFileSize(node._content || '')

    return (
      <motion.div
        initial={{ opacity: 0, x: -5 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => onSelect(node._path, node._content)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 12px 6px',
          paddingLeft: `${depth * 16 + 12}px`,
          borderRadius: '8px',
          cursor: 'pointer',
          background: isSelected ? 'rgba(108,99,255,0.12)' : 'transparent',
          border: isSelected ? '1px solid rgba(108,99,255,0.2)' : '1px solid transparent',
          marginBottom: '2px',
          transition: 'all 0.15s ease'
        }}
        whileHover={{
          background: isSelected ? 'rgba(108,99,255,0.15)' : 'rgba(255,255,255,0.04)'
        }}
      >
        <div style={{
          width: '7px',
          height: '7px',
          borderRadius: '2px',
          background: color,
          flexShrink: 0
        }} />
        <span style={{
          flex: 1,
          fontSize: '13px',
          color: isSelected ? 'white' : 'rgba(255,255,255,0.65)',
          fontFamily: 'JetBrains Mono, monospace',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {name}
        </span>
        <span style={{
          fontSize: '10px',
          color: 'rgba(255,255,255,0.2)',
          flexShrink: 0
        }}>
          {size}
        </span>
      </motion.div>
    )
  }

  // Folder
  const children = Object.entries(node).sort(([, a], [, b]) => {
    const aIsFile = a._isFile ? 1 : 0
    const bIsFile = b._isFile ? 1 : 0
    return aIsFile - bIsFile
  })

  return (
    <div>
      <motion.div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          paddingLeft: `${depth * 16 + 12}px`,
          borderRadius: '8px',
          cursor: 'pointer',
          marginBottom: '2px',
          transition: 'background 0.15s ease'
        }}
        whileHover={{ background: 'rgba(255,255,255,0.04)' }}
      >
        <motion.div
          animate={{ rotate: isOpen ? 90 : 0 }}
          transition={{ duration: 0.15 }}
        >
          <ChevronRight size={12} color="rgba(255,255,255,0.3)" />
        </motion.div>

        {isOpen
          ? <FolderOpen size={14} color="#e8b84b" />
          : <Folder size={14} color="#e8b84b" />
        }

        <span style={{
          fontSize: '13px',
          color: 'rgba(255,255,255,0.7)',
          fontWeight: 500,
          fontFamily: 'JetBrains Mono, monospace'
        }}>
          {name}
        </span>

        <span style={{
          fontSize: '10px',
          color: 'rgba(255,255,255,0.2)',
          marginLeft: 'auto'
        }}>
          {children.length}
        </span>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden' }}
          >
            {children.map(([childName, childNode]) => (
              <TreeNode
                key={childName}
                name={childName}
                node={childNode}
                depth={depth + 1}
                onSelect={onSelect}
                selectedPath={selectedPath}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function FileTree({ files, projectName }) {
  const [selectedPath, setSelectedPath] = useState(null)
  const [selectedContent, setSelectedContent] = useState('')
  const [isExporting, setIsExporting] = useState(false)

  const fileList = Object.keys(files)
  const tree = buildTree(files)

  const totalSize = Object.values(files).reduce((acc, content) => {
    return acc + new Blob([content]).size
  }, 0)

  const formatTotalSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
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
        <Package size={48} style={{ opacity: 0.3 }} />
        <div style={{ fontSize: '16px', fontWeight: 600 }}>No files yet</div>
        <div style={{ fontSize: '13px', opacity: 0.6 }}>Generate a website first</div>
      </div>
    )
  }

  return (
    <div style={{ height: '100%', display: 'flex', overflow: 'hidden' }}>

      {/* Tree Panel */}
      <div style={{
        width: '280px',
        minWidth: '280px',
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
            marginBottom: '8px'
          }}>
            <span style={{
              fontSize: '13px',
              fontWeight: 700,
              color: 'white'
            }}>
              {projectName || 'my-website'}
            </span>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleExport}
              disabled={isExporting}
              className="btn-primary"
              style={{
                padding: '5px 10px',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Download size={11} />
              {isExporting ? 'Exporting...' : 'Download ZIP'}
            </motion.button>
          </div>

          <div style={{
            display: 'flex',
            gap: '12px',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.3)'
          }}>
            <span>{fileList.length} files</span>
            <span>{formatTotalSize(totalSize)}</span>
          </div>
        </div>

        {/* Tree */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
          {Object.entries(tree).sort(([, a], [, b]) => {
            const aIsFile = a._isFile ? 1 : 0
            const bIsFile = b._isFile ? 1 : 0
            return aIsFile - bIsFile
          }).map(([name, node]) => (
            <TreeNode
              key={name}
              name={name}
              node={node}
              depth={0}
              onSelect={(path, content) => {
                setSelectedPath(path)
                setSelectedContent(content)
              }}
              selectedPath={selectedPath}
            />
          ))}
        </div>
      </div>

      {/* File Preview */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {selectedPath ? (
          <>
            <div style={{
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(2,2,8,0.4)',
              gap: '8px',
              fontSize: '13px',
              color: 'rgba(255,255,255,0.5)',
              fontFamily: 'JetBrains Mono, monospace'
            }}>
              <div style={{
                width: '7px',
                height: '7px',
                borderRadius: '2px',
                background: getFileColor(selectedPath)
              }} />
              {selectedPath}
            </div>
            <div style={{ flex: 1, overflow: 'auto', padding: '20px' }}>
              <pre style={{
                fontFamily: 'JetBrains Mono, Fira Code, monospace',
                fontSize: '13px',
                lineHeight: 1.6,
                color: 'rgba(255,255,255,0.75)',
                margin: 0,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word'
              }}>
                {selectedContent}
              </pre>
            </div>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: '12px',
            color: 'rgba(255,255,255,0.2)'
          }}>
            <FileCode size={40} style={{ opacity: 0.3 }} />
            <span style={{ fontSize: '13px' }}>Select a file to preview</span>
          </div>
        )}
      </div>
    </div>
  )
}
