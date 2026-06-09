import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import ThreeBackground from './components/ThreeBackground'
import Sidebar from './components/Sidebar'
import Chat from './components/Chat'
import CodePreview from './components/CodePreview'
import FileTree from './components/FileTree'
import SiteAnalyzer from './components/SiteAnalyzer'
import { Sparkles, Code2, Globe, Layers, Menu, X } from 'lucide-react'

export default function App() {
  const [activeView, setActiveView] = useState('chat')
  const [projects, setProjects] = useState([])
  const [currentProject, setCurrentProject] = useState(null)
  const [generatedFiles, setGeneratedFiles] = useState({})
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [scrapedData, setScrapedData] = useState(null)

  // Load projects from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('webcraft_projects')
    if (saved) {
      const parsed = JSON.parse(saved)
      setProjects(parsed)
      if (parsed.length > 0) setCurrentProject(parsed[0])
    }
  }, [])

  // Save projects to localStorage
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

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden', position: 'relative' }}>

      {/* 3D Background */}
      <ThreeBackground />

      {/* Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              width: '280px',
              minWidth: '280px',
              height: '100vh',
              zIndex: 10,
              position: 'relative'
            }}
          >
            <Sidebar
              projects={projects}
              currentProject={currentProject}
              onSelectProject={(p) => {
                setCurrentProject(p)
                setGeneratedFiles(p.files || {})
              }}
              onNewProject={() => createNewProject()}
              onDeleteProject={(id) => {
                setProjects(prev => prev.filter(p => p.id !== id))
                if (currentProject?.id === id) {
                  setCurrentProject(null)
                  setGeneratedFiles({})
                }
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

        {/* Header */}
        <div style={{
          height: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(2, 2, 8, 0.8)',
          backdropFilter: 'blur(20px)',
          zIndex: 5
        }}>
          {/* Left */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              className="btn-icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #6c63ff, #00d4ff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Sparkles size={14} color="white" />
              </div>
              <span style={{ fontWeight: 700, fontSize: '15px' }} className="gradient-text">
                WebCraft AI Pro
              </span>
            </div>

            {currentProject && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '14px' }}>/</span>
                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px' }}>
                  {currentProject.name}
                </span>
              </div>
            )}
          </div>

          {/* Center - View Switcher */}
          <div style={{
            display: 'flex',
            gap: '4px',
            background: 'rgba(255,255,255,0.04)',
            borderRadius: '10px',
            padding: '4px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            {views.map(view => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 500,
                  transition: 'all 0.2s ease',
                  background: activeView === view.id
                    ? 'linear-gradient(135deg, #6c63ff, #5a52e0)'
                    : 'transparent',
                  color: activeView === view.id
                    ? 'white'
                    : 'rgba(255,255,255,0.4)',
                }}
              >
                <view.icon size={14} />
                {view.label}
              </button>
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
              <div className="tag tag-success">
                {Object.keys(generatedFiles).length} files ready
              </div>
            )}
          </div>
        </div>

        {/* View Content */}
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <AnimatePresence mode="wait">
            {activeView === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{ height: '100%' }}
              >
                <Chat
                  currentProject={currentProject}
                  onCreateProject={createNewProject}
                  onFilesGenerated={updateProjectFiles}
                  onGeneratingChange={setIsGenerating}
                  scrapedData={scrapedData}
                  onViewCode={() => setActiveView('code')}
                />
              </motion.div>
            )}

            {activeView === 'code' && (
              <motion.div
                key="code"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{ height: '100%' }}
              >
                <CodePreview
                  files={generatedFiles}
                  projectName={currentProject?.name || 'my-website'}
                />
              </motion.div>
            )}

            {activeView === 'files' && (
              <motion.div
                key="files"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{ height: '100%' }}
              >
                <FileTree
                  files={generatedFiles}
                  projectName={currentProject?.name || 'my-website'}
                />
              </motion.div>
            )}

            {activeView === 'analyzer' && (
              <motion.div
                key="analyzer"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                style={{ height: '100%' }}
              >
                <SiteAnalyzer
                  onDataScraped={(data) => {
                    setScrapedData(data)
                    setActiveView('chat')
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
