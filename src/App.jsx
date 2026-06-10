import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ThreeBackground from './components/ThreeBackground'
import Sidebar from './components/Sidebar'
import Chat from './components/Chat'
import CodePreview from './components/CodePreview'
import FileTree from './components/FileTree'
import SiteAnalyzer from './components/SiteAnalyzer'
import LoadingScreen from './components/LoadingScreen'
import GestureControl from './components/GestureControl'
import { Sparkles, Code2, Globe, Layers, Menu, X, Hand, Zap, Download } from 'lucide-react'
import { exportToZip } from './utils/fileExporter'

export default function App() {
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState('chat')
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [generatedFiles, setGeneratedFiles] = useState({})
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [scrapedData, setScrapedData] = useState(null)
  const [gestureOpen, setGestureOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')

  useEffect(() => {
    const saved = localStorage.getItem('webcraft_projects')
    if (saved) {
      const parsed = JSON.parse(saved)
      setProjects(parsed)
      if (parsed.length > 0) setCurrentProject(parsed[0])
    }
  }, [])

  useEffect(() => {
    if (projects.length > 0) {
      localStorage.setItem('webcraft_projects', JSON.stringify(projects))
    }
  }, [projects])

  const createNewProject = (name = 'New Project') => {
    const project = {
      id: Date.now().toString(),
      name,
      createdAt: new Date().toISOString(),
      files: {},
      messages: [],
      type: 'fullstack'
    }
    setProjects(prev => [project, ...prev])
    setCurrentProject(project)
    setGeneratedFiles({})
    return project
  }

  const updateProjectFiles = (files) => {
    setGeneratedFiles(files)
    if (currentProject) {
      const updated = { ...currentProject, files }
      setCurrentProject(updated)
      setProjects(prev => prev.map(p => p.id === updated.id ? updated : p))
    }
  }

  const views = [
    { id: 'chat', icon: Sparkles, label: 'AI Chat' },
    { id: 'code', icon: Code2, label: 'Code' },
    { id: 'files', icon: Layers, label: 'Files' },
    { id: 'analyzer', icon: Globe, label: 'Analyzer' },
  ]

  if (loading) {
    return (
      <AnimatePresence>
        <LoadingScreen onComplete={() => setLoading(false)} />
      </AnimatePresence>
    )
  }

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>
      <ThreeBackground />

      {/* Gesture Control */}
      <GestureControl
        isOpen={gestureOpen}
        onClose={() => setGestureOpen(false)}
        onText={(text) => setChatInput(text)}
      />

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ width: '280px', minWidth: '280px', height: '100vh', zIndex: 10, position: 'relative' }}
          >
            <Sidebar
              projects={projects}
              currentProject={currentProject}
              onSelectProject={(p) => { setCurrentProject(p); setGeneratedFiles(p.files || {}) }}
              onNewProject={() => createNewProject()}
              onDeleteProject={(id) => {
                setProjects(prev => prev.filter(p => p.id !== id))
                if (currentProject?.id === id) { setCurrentProject(null); setGeneratedFiles({}) }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

        {/* Header */}
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, type: 'spring', damping: 20 }}
          style={{
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(2,2,8,0.8)',
            backdropFilter: 'blur(30px)',
            zIndex: 5
          }}
        >
          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn-icon" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
            <motion.div
              whileHover={{ scale: 1.05 }}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: '28px', height: '28px', borderRadius: '8px',
                  background: 'linear-gradient(135deg, #6c63ff, #00d4ff)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 0 15px rgba(108,99,255,0.5)'
                }}
              >
                <Zap size={14} color="white" />
              </motion.div>
              <span style={{ fontWeight: 800, fontSize: '15px' }} className="gradient-text">
                WebCraft AI Pro
              </span>
            </motion.div>
            {currentProject && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>/</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>{currentProject.name}</span>
              </div>
            )}
          </div>

          {/* Center */}
          <div style={{
            display: 'flex', gap: '4px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '10px', padding: '4px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            {views.map(view => (
              <motion.button
                key={view.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveView(view.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '7px', border: 'none',
                  cursor: 'pointer', fontSize: '13px', fontWeight: 500,
                  transition: 'all 0.2s ease',
                  background: activeView === view.id
                    ? 'linear-gradient(135deg, #6c63ff, #5a52e0)'
                    : 'transparent',
                  color: activeView === view.id ? 'white' : 'rgba(255,255,255,0.4)',
                  boxShadow: activeView === view.id ? '0 4px 15px rgba(108,99,255,0.3)' : 'none'
                }}
              >
                <view.icon size={14} />
                {view.label}
              </motion.button>
            ))}
          </div>

          {/* Right */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <div className="status-dot loading" />
                <span style={{ fontSize: '12px', color: 'rgba(255,170,0,0.8)' }}>Generating...</span>
              </motion.div>
            )}

            {Object.keys(generatedFiles).length > 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => exportToZip(generatedFiles, currentProject?.name || 'my-website')}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px', borderRadius: '8px', border: 'none',
                  background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
                  color: '#003320', fontSize: '12px', fontWeight: 700,
                  cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,255,136,0.3)'
                }}
              >
                <Download size={13} />
                Download ZIP
              </motion.button>
            )}

            {/* Gesture Control Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setGestureOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px', borderRadius: '8px',
                border: '1px solid rgba(108,99,255,0.3)',
                background: 'rgba(108,99,255,0.1)',
                color: '#a89fff', fontSize: '12px', fontWeight: 600,
                cursor: 'pointer', transition: 'all 0.2s ease'
              }}
            >
              <Hand size={14} />
              Gestures
            </motion.button>
          </div>
        </motion.div>

        {/* View Content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            {activeView === 'chat' && (
              <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ height: '100%' }}>
                <Chat
                  currentProject={currentProject}
                  onCreateProject={createNewProject}
                  onFilesGenerated={updateProjectFiles}
                  onGeneratingChange={setIsGenerating}
                  scrapedData={scrapedData}
                  onViewCode={() => setActiveView('code')}
                  externalInput={chatInput}
                  onExternalInputUsed={() => setChatInput('')}
                />
              </motion.div>
            )}
            {activeView === 'code' && (
              <motion.div key="code" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ height: '100%' }}>
                <CodePreview files={generatedFiles} projectName={currentProject?.name || 'my-website'} />
              </motion.div>
            )}
            {activeView === 'files' && (
              <motion.div key="files" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ height: '100%' }}>
                <FileTree files={generatedFiles} projectName={currentProject?.name || 'my-website'} />
              </motion.div>
            )}
            {activeView === 'analyzer' && (
              <motion.div key="analyzer" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ height: '100%' }}>
                <SiteAnalyzer onDataScraped={(data) => { setScrapedData(data); setActiveView('chat') }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
