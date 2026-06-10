import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, FolderOpen, Clock, Sparkles,
  ChevronRight, Globe, Code2, Zap
} from 'lucide-react'

export default function Sidebar({
  projects,
  currentProject,
  onSelectProject,
  onNewProject,
  onDeleteProject
}) {
  const [hoveredId, setHoveredId] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const formatDate = (iso) => {
    const d = new Date(iso)
    const now = new Date()
    const diff = now - d
    if (diff < 60000) return 'Just now'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`
    return d.toLocaleDateString()
  }

  const getProjectIcon = (project) => {
    if (project.type === 'scraped') return Globe
    if (project.type === 'fullstack') return Code2
    return Sparkles
  }

  return (
    <div style={{
      width: '280px',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'rgba(2, 2, 8, 0.85)',
      backdropFilter: 'blur(30px)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      position: 'relative',
      zIndex: 10
    }}>

      {/* Logo */}
      <div style={{
        padding: '20px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6c63ff, #00d4ff)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 20px rgba(108,99,255,0.4)'
        }}>
          <Zap size={18} color="white" />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '14px' }} className="gradient-text">
            WebCraft AI
          </div>
          <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '1px' }}>
            Pro Edition
          </div>
        </div>
      </div>

      {/* New Project Button */}
      <div style={{ padding: '12px 16px' }}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onNewProject}
          style={{
            width: '100%',
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1px dashed rgba(108,99,255,0.4)',
            background: 'rgba(108,99,255,0.08)',
            color: 'rgba(108,99,255,0.9)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '13px',
            fontWeight: 600,
            transition: 'all 0.2s ease'
          }}
          className="hover-glow"
        >
          <Plus size={15} />
          New Project
        </motion.button>
      </div>

      {/* Projects Label */}
      <div style={{
        padding: '8px 20px 6px',
        fontSize: '10px',
        fontWeight: 700,
        color: 'rgba(255,255,255,0.25)',
        textTransform: 'uppercase',
        letterSpacing: '1px'
      }}>
        Projects ({projects.length})
      </div>

      {/* Projects List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '4px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <AnimatePresence>
          {projects.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'rgba(255,255,255,0.2)',
                fontSize: '13px'
              }}
            >
              <FolderOpen size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
              <div>No projects yet</div>
              <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.6 }}>
                Click "New Project" to start
              </div>
            </motion.div>
          ) : (
            projects.map((project, index) => {
              const Icon = getProjectIcon(project)
              const isActive = currentProject?.id === project.id
              const isHovered = hoveredId === project.id
              const fileCount = Object.keys(project.files || {}).length

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: index * 0.05 }}
                  onMouseEnter={() => setHoveredId(project.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() => onSelectProject(project)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: isActive
                      ? 'rgba(108,99,255,0.15)'
                      : isHovered
                        ? 'rgba(255,255,255,0.05)'
                        : 'transparent',
                    border: isActive
                      ? '1px solid rgba(108,99,255,0.3)'
                      : '1px solid transparent',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '7px',
                      background: isActive
                        ? 'rgba(108,99,255,0.3)'
                        : 'rgba(255,255,255,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <Icon size={13} color={isActive ? '#a89fff' : 'rgba(255,255,255,0.4)'} />
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: isActive ? 'white' : 'rgba(255,255,255,0.7)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {project.name}
                      </div>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '2px'
                      }}>
                        <Clock size={9} color="rgba(255,255,255,0.25)" />
                        <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.25)' }}>
                          {formatDate(project.createdAt)}
                        </span>
                        {fileCount > 0 && (
                          <span style={{
                            fontSize: '10px',
                            color: 'rgba(108,99,255,0.7)',
                            background: 'rgba(108,99,255,0.1)',
                            padding: '1px 5px',
                            borderRadius: '4px'
                          }}>
                            {fileCount} files
                          </span>
                        )}
                      </div>
                    </div>

                    {isActive && (
                      <ChevronRight size={12} color="rgba(108,99,255,0.6)" />
                    )}

                    {isHovered && !isActive && (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        onClick={(e) => {
                          e.stopPropagation()
                          setConfirmDelete(project.id)
                        }}
                        style={{
                          background: 'rgba(255,68,68,0.1)',
                          border: '1px solid rgba(255,68,68,0.2)',
                          borderRadius: '6px',
                          padding: '4px',
                          cursor: 'pointer',
                          color: 'rgba(255,68,68,0.7)',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <Trash2 size={11} />
                      </motion.button>
                    )}
                  </div>

                  {/* Confirm Delete */}
                  <AnimatePresence>
                    {confirmDelete === project.id && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                          marginTop: '8px',
                          padding: '8px',
                          background: 'rgba(255,68,68,0.08)',
                          borderRadius: '8px',
                          border: '1px solid rgba(255,68,68,0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '8px'
                        }}
                      >
                        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                          Delete project?
                        </span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => setConfirmDelete(null)}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '5px',
                              border: '1px solid rgba(255,255,255,0.1)',
                              background: 'transparent',
                              color: 'rgba(255,255,255,0.5)',
                              fontSize: '11px',
                              cursor: 'pointer'
                            }}
                          >
                            No
                          </button>
                          <button
                            onClick={() => {
                              onDeleteProject(project.id)
                              setConfirmDelete(null)
                            }}
                            style={{
                              padding: '3px 8px',
                              borderRadius: '5px',
                              border: 'none',
                              background: 'rgba(255,68,68,0.3)',
                              color: 'rgba(255,100,100,1)',
                              fontSize: '11px',
                              cursor: 'pointer',
                              fontWeight: 600
                            }}
                          >
                            Yes
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )
            })
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <div className="status-dot online" />
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>
          WebCraft V1 Pro Connected
        </span>
      </div>
    </div>
  )
}
