import React, { useEffect, useState } from 'react'
import { MainLayout } from '../components/MainLayout'
import { ToastContainer } from '../components/ToastContainer'
import { learningPathService } from '../services/learningPaths'
import { courseService } from '../services/courses'
import { profileService } from '../services/profiles'
import { useAuth } from '../contexts/AuthContext'
import type { LearningPathWithCourses, Course, Profile } from '../types'
import { Plus, Edit, Trash2, BookOpen, Users, GripVertical, X, FolderOpen } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'
const anim = (delay = 0): React.CSSProperties => ({ animation: 'fadeSlideUp 0.45s ease both', animationDelay: `${delay}ms` })
const inputS: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 14, color: '#0F172A', outline: 'none', boxSizing: 'border-box' }
const labelS: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }

export function LearningPaths() {
  const { user, profile } = useAuth()
  const [paths, setPaths] = useState<LearningPathWithCourses[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [caregivers, setCaregivers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPath, setEditingPath] = useState<LearningPathWithCourses | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedPath, setSelectedPath] = useState<LearningPathWithCourses | null>(null)
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: ToastType }>>([])
  const [toastId, setToastId] = useState(0)
  const [formData, setFormData] = useState({ name: '', description: '', is_active: true, selectedCourses: [] as string[] })
  const [assignmentData, setAssignmentData] = useState({ caregiverId: '', dueDate: '' })

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = toastId; setToastId(p => p + 1)
    setToasts(p => [...p, { id, message, type }])
  }
  const removeToast = (id: number) => setToasts(p => p.filter(t => t.id !== id))

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      setLoading(true)
      const [p, c, cg] = await Promise.all([learningPathService.getAll(), courseService.getCourses(), profileService.getCaregivers()])
      setPaths(p); setCourses(c); setCaregivers(cg)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user) return
    try {
      if (editingPath) {
        await learningPathService.update(editingPath.id, { name: formData.name, description: formData.description, is_active: formData.is_active })
        const existing = editingPath.courses.map(c => c.course_id)
        for (const id of existing.filter(id => !formData.selectedCourses.includes(id))) await learningPathService.removeCourse(editingPath.id, id)
        for (let i = 0; i < formData.selectedCourses.filter(id => !existing.includes(id)).length; i++) await learningPathService.addCourse(editingPath.id, formData.selectedCourses.filter(id => !existing.includes(id))[i], existing.length + i)
      } else {
        const np = await learningPathService.create({ organization: profile?.organization || '', name: formData.name, description: formData.description, is_active: formData.is_active, created_by: user.id })
        for (let i = 0; i < formData.selectedCourses.length; i++) await learningPathService.addCourse(np.id, formData.selectedCourses[i], i)
      }
      await load(); resetForm()
    } catch (e) { console.error(e) }
  }

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedPath || !user || !assignmentData.caregiverId) return
    try {
      await learningPathService.assignToCaregiver(selectedPath.id, assignmentData.caregiverId, user.id, assignmentData.dueDate || undefined)
      const cg = caregivers.find(c => c.id === assignmentData.caregiverId)
      showToast(`"${selectedPath.name}" assigned to ${cg ? `${cg.first_name} ${cg.last_name}` : 'caregiver'}`, 'success')
      setShowAssignModal(false); setSelectedPath(null); setAssignmentData({ caregiverId: '', dueDate: '' })
    } catch (e) { showToast('Failed to assign learning path', 'error') }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this learning path?')) return
    try { await learningPathService.delete(id); await load() } catch (e) { console.error(e) }
  }

  const handleEdit = (path: LearningPathWithCourses) => {
    setEditingPath(path)
    setFormData({ name: path.name, description: path.description || '', is_active: path.is_active, selectedCourses: path.courses.map(c => c.course_id) })
    setShowForm(true)
  }

  const resetForm = () => { setFormData({ name: '', description: '', is_active: true, selectedCourses: [] }); setEditingPath(null); setShowForm(false) }
  const toggleCourse = (id: string) => setFormData(p => ({ ...p, selectedCourses: p.selectedCourses.includes(id) ? p.selectedCourses.filter(x => x !== id) : [...p.selectedCourses, id] }))

  return (
    <MainLayout>
      <style>{`@keyframes fadeSlideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, ...anim() }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>Learning Paths</h1>
            <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>Group courses and assign them as structured tracks</p>
          </div>
          <button onClick={() => setShowForm(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={18} /> Create Path
          </button>
        </div>

        {/* Create / Edit Form */}
        {showForm && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #F1F5F9', padding: 24, marginBottom: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', ...anim() }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: '0 0 20px' }}>{editingPath ? 'Edit' : 'Create'} Learning Path</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: 16 }}>
                <label style={labelS}>Path Name</label>
                <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} style={inputS} required />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelS}>Description</label>
                <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} style={{ ...inputS, resize: 'vertical' }} rows={3} />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={labelS}>Select Courses</label>
                <div style={{ border: '1px solid #E2E8F0', borderRadius: 10, maxHeight: 280, overflowY: 'auto' }}>
                  {courses.map(c => (
                    <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #F8FAFC', transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F8FAFC'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                      <input type="checkbox" checked={formData.selectedCourses.includes(c.id)} onChange={() => toggleCourse(c.id)} style={{ width: 15, height: 15, accentColor: '#2563EB' }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{c.title}</div>
                        {c.category && <div style={{ fontSize: 12, color: '#94A3B8' }}>{c.category}</div>}
                      </div>
                    </label>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 6 }}>{formData.selectedCourses.length} course{formData.selectedCourses.length !== 1 ? 's' : ''} selected</p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: '#475569', marginBottom: 20 }}>
                <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} style={{ width: 15, height: 15, accentColor: '#2563EB' }} />
                Active
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={{ padding: '9px 20px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>{editingPath ? 'Update' : 'Create'} Path</button>
                <button type="button" onClick={resetForm} style={{ padding: '9px 20px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Paths list */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map(i => <div key={i} style={{ height: 120, borderRadius: 14, background: 'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)', backgroundSize: '200% 100%', animation: `shimmer 1.5s ease ${i * 0.1}s infinite` }} />)}
          </div>
        ) : paths.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 0', background: 'white', borderRadius: 14, border: '1px solid #F1F5F9', ...anim(120) }}>
            <FolderOpen size={44} color="#CBD5E1" style={{ marginBottom: 14 }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: '#475569', marginBottom: 6 }}>No learning paths yet</p>
            <p style={{ fontSize: 13, color: '#94A3B8', marginBottom: 20 }}>Create a path to group courses and assign them as a track</p>
            <button onClick={() => setShowForm(true)} style={{ padding: '9px 20px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Create First Path</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {paths.map((path, i) => (
              <div key={path.id} style={{ background: 'white', borderRadius: 14, border: '1px solid #F1F5F9', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', ...anim(i * 50) }}>
                {/* Path header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '18px 20px', borderBottom: path.courses.length > 0 ? '1px solid #F8FAFC' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 40, height: 40, background: '#F5F3FF', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FolderOpen size={20} color="#7C3AED" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>{path.name}</h3>
                        {!path.is_active && <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: '#F1F5F9', color: '#94A3B8' }}>Inactive</span>}
                      </div>
                      {path.description && <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 4px' }}>{path.description}</p>}
                      <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>{path.courses.length} course{path.courses.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[
                      { icon: <Users size={15} />, bg: '#EFF6FF', col: '#2563EB', hov: '#DBEAFE', action: () => { setSelectedPath(path); setShowAssignModal(true) }, title: 'Assign' },
                      { icon: <Edit size={15} />, bg: '#F8FAFC', col: '#475569', hov: '#F1F5F9', action: () => handleEdit(path), title: 'Edit' },
                      { icon: <Trash2 size={15} />, bg: '#FEF2F2', col: '#DC2626', hov: '#FEE2E2', action: () => handleDelete(path.id), title: 'Delete' },
                    ].map((btn, j) => (
                      <button key={j} onClick={btn.action} title={btn.title} style={{ width: 32, height: 32, background: btn.bg, border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: btn.col, transition: 'background 0.15s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = btn.hov}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = btn.bg}>
                        {btn.icon}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Courses in path */}
                {path.courses.length > 0 && (
                  <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {path.courses.sort((a, b) => a.sequence_order - b.sequence_order).map((pc, idx) => (
                      <div key={pc.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: '#F8FAFC', borderRadius: 8 }}>
                        <GripVertical size={14} color="#CBD5E1" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#CBD5E1', width: 18 }}>{idx + 1}</span>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{pc.course?.title}</span>
                          {pc.course?.category && <span style={{ fontSize: 11, color: '#94A3B8', marginLeft: 8 }}>{pc.course.category}</span>}
                        </div>
                        {pc.course?.ce_hours && <span style={{ fontSize: 11, color: '#94A3B8' }}>{pc.course.ce_hours} CE hrs</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign modal */}
      {showAssignModal && selectedPath && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: 18, maxWidth: 440, width: '100%', padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>Assign Learning Path</h2>
              <button onClick={() => { setShowAssignModal(false); setSelectedPath(null); setAssignmentData({ caregiverId: '', dueDate: '' }) }} style={{ width: 30, height: 30, background: '#F1F5F9', border: 'none', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><X size={15} color="#64748B" /></button>
            </div>
            <div style={{ background: '#EFF6FF', borderRadius: 10, padding: '12px 14px', marginBottom: 20 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1D4ED8', margin: '0 0 4px' }}>"{selectedPath.name}"</p>
              <p style={{ fontSize: 12, color: '#3B82F6', margin: 0 }}>All {selectedPath.courses.length} courses will be assigned automatically.</p>
            </div>
            <form onSubmit={handleAssign}>
              <div style={{ marginBottom: 16 }}>
                <label style={labelS}>Caregiver</label>
                <select value={assignmentData.caregiverId} onChange={e => setAssignmentData({ ...assignmentData, caregiverId: e.target.value })} style={inputS} required>
                  <option value="">Select caregiver…</option>
                  {caregivers.filter(c => c.is_active).map(c => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
                </select>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={labelS}>Due Date <span style={{ fontWeight: 400, color: '#94A3B8' }}>(optional)</span></label>
                <input type="date" value={assignmentData.dueDate} onChange={e => setAssignmentData({ ...assignmentData, dueDate: e.target.value })} style={inputS} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={{ flex: 1, padding: 10, background: '#2563EB', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Assign Path</button>
                <button type="button" onClick={() => { setShowAssignModal(false); setSelectedPath(null); setAssignmentData({ caregiverId: '', dueDate: '' }) }} style={{ flex: 1, padding: 10, background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </MainLayout>
  )
}
