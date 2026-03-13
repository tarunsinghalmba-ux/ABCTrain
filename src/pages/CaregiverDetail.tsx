import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { MainLayout } from '../components/MainLayout'
import { CourseAssignmentModal } from '../components/CourseAssignmentModal'
import { CourseCompletionModal } from '../components/CourseCompletionModal'
import { profileService } from '../services/profiles'
import { courseService } from '../services/courses'
import { learningPathService } from '../services/learningPaths'
import { complianceService } from '../services/compliance'
import type { Profile, CourseAssignment, LearningPathAssignment, CaregiverComplianceSummary } from '../types'
import { ArrowLeft, User, Mail, Building2, Calendar, BookOpen, FolderTree, CheckCircle, Clock, AlertCircle, Plus, ExternalLink } from 'lucide-react'

const anim = (d = 0): React.CSSProperties => ({ animation: 'fadeSlideUp 0.45s ease both', animationDelay: `${d}ms` })

export function CaregiverDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [caregiver, setCaregiver] = useState<Profile | null>(null)
  const [courseAssignments, setCourseAssignments] = useState<CourseAssignment[]>([])
  const [pathAssignments, setPathAssignments] = useState<LearningPathAssignment[]>([])
  const [complianceDetail, setComplianceDetail] = useState<CaregiverComplianceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<CourseAssignment | null>(null)
  const [showCompletionModal, setShowCompletionModal] = useState(false)

  useEffect(() => { if (id) loadData() }, [id])

  const loadData = async () => {
    if (!id) return
    try {
      setLoading(true)
      const [profile, courses, paths, compliance] = await Promise.all([
        profileService.getProfile(id), courseService.getCaregiverAssignments(id),
        learningPathService.getAssignments(id), complianceService.getCaregiverComplianceDetail(id)
      ])
      setCaregiver(profile); setCourseAssignments(courses); setPathAssignments(paths); setComplianceDetail(compliance)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handleStart = async (a: CourseAssignment) => { try { await courseService.startCourse(a.id); loadData() } catch (e) { console.error(e) } }
  const handleMarkComplete = (a: CourseAssignment) => { setSelectedAssignment(a); setShowCompletionModal(true) }

  if (loading) return (
    <MainLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid #EFF6FF', borderTop: '3px solid #2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ fontSize: 14, color: '#94A3B8' }}>Loading caregiver details…</p>
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </MainLayout>
  )

  if (!caregiver) return (
    <MainLayout>
      <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center', padding: 32 }}>
        <User size={48} color="#CBD5E1" style={{ marginBottom: 16 }} />
        <p style={{ fontSize: 16, color: '#64748B', marginBottom: 20 }}>Caregiver not found</p>
        <Link to="/caregivers" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#2563EB', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}><ArrowLeft size={15} /> Back to Caregivers</Link>
      </div>
    </MainLayout>
  )

  const statusCfg = (s: string) => s === 'completed' ? { bg: '#F0FDF4', color: '#16A34A', icon: <CheckCircle size={13} />, label: 'Completed' }
    : s === 'in_progress' ? { bg: '#FFFBEB', color: '#D97706', icon: <Clock size={13} />, label: 'In Progress' }
    : { bg: '#FEF2F2', color: '#DC2626', icon: <AlertCircle size={13} />, label: 'Overdue' }

  return (
    <MainLayout>
      <style>{`@keyframes fadeSlideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>

        {/* Back link */}
        <Link to="/caregivers" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#64748B', fontWeight: 600, fontSize: 13, textDecoration: 'none', marginBottom: 20, ...anim() }}>
          <ArrowLeft size={15} /> Back to Caregivers
        </Link>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, ...anim(60) }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg,#1E3A5F,#2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 18, fontWeight: 800 }}>
              {caregiver.first_name[0]}{caregiver.last_name[0]}
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>{caregiver.first_name} {caregiver.last_name}</h1>
              <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>{caregiver.email}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => setShowAssignModal(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              <Plus size={17} /> Assign Training
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Personal info */}
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F1F5F9', padding: 20, ...anim(120) }}>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px' }}>Personal Info</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { icon: <User size={15} />, label: 'Name', value: `${caregiver.first_name} ${caregiver.last_name}` },
                  { icon: <Mail size={15} />, label: 'Email', value: caregiver.email },
                  ...(caregiver.organization ? [{ icon: <Building2 size={15} />, label: 'Organization', value: caregiver.organization }] : []),
                  { icon: <Calendar size={15} />, label: 'Hire Date', value: (caregiver as any).hire_date ? new Date((caregiver as any).hire_date).toLocaleDateString() : 'Not set' },
                ].map(({ icon, label, value }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 28, height: 28, background: '#F8FAFC', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#94A3B8' }}>{icon}</div>
                    <div>
                      <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: 0 }}>{value}</p>
                    </div>
                  </div>
                ))}
                <div style={{ paddingTop: 12, borderTop: '1px solid #F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, color: '#94A3B8' }}>Status</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: caregiver.is_active ? '#F0FDF4' : '#FEF2F2', color: caregiver.is_active ? '#16A34A' : '#DC2626' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: caregiver.is_active ? '#16A34A' : '#DC2626', display: 'inline-block' }} />
                    {caregiver.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            {/* Compliance summary */}
            {complianceDetail && (
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F1F5F9', padding: 20, ...anim(180) }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px' }}>Compliance</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Orientation', ok: complianceDetail.orientation_complete },
                    { label: 'ANE Training', ok: complianceDetail.ane_training_complete },
                  ].map(({ label, ok }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: '#F8FAFC', borderRadius: 8 }}>
                      <span style={{ fontSize: 13, color: '#475569' }}>{label}</span>
                      {ok ? <CheckCircle size={17} color="#16A34A" /> : <AlertCircle size={17} color="#D97706" />}
                    </div>
                  ))}
                  <div style={{ padding: '10px 12px', background: '#F8FAFC', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 13, color: '#475569' }}>Annual CE Hours</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{complianceDetail.annual_ce_hours_current_year}/12</span>
                    </div>
                    <div style={{ height: 6, background: '#E2E8F0', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: '#2563EB', borderRadius: 3, width: `${Math.min((complianceDetail.annual_ce_hours_current_year / 12) * 100, 100)}%`, transition: 'width 0.5s' }} />
                    </div>
                  </div>
                  <div style={{ paddingTop: 10, borderTop: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>Overall Status</span>
                    {(() => {
                      const s = complianceDetail.compliance_status
                      const cfg = s === 'compliant' ? { bg: '#F0FDF4', c: '#16A34A', label: 'Compliant' } : s === 'overdue' ? { bg: '#FEF2F2', c: '#DC2626', label: 'Overdue' } : { bg: '#FFFBEB', c: '#D97706', label: 'In Progress' }
                      return <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: cfg.bg, color: cfg.c }}>{cfg.label}</span>
                    })()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Course Assignments */}
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F1F5F9', overflow: 'hidden', ...anim(120) }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F8FAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <BookOpen size={17} color="#2563EB" />
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Course Assignments</span>
                </div>
                <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>{courseAssignments.length} assignment{courseAssignments.length !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ padding: 16 }}>
                {courseAssignments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <BookOpen size={36} color="#CBD5E1" style={{ marginBottom: 10 }} />
                    <p style={{ fontSize: 14, color: '#94A3B8' }}>No course assignments yet</p>
                    <button onClick={() => setShowAssignModal(true)} style={{ marginTop: 10, padding: '7px 16px', background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Assign a course</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {courseAssignments.map(a => {
                      const isOverdue = !a.completion_date && new Date(a.due_date) < new Date()
                      const isDone = a.status === 'completed' || !!a.completion_date
                      const isInProg = a.status === 'in_progress'
                      const statusKey = isDone ? 'completed' : isInProg ? 'in_progress' : isOverdue ? 'overdue' : 'not_started'
                      const cfg = isDone ? { bg: '#F0FDF4', border: '#BBF7D0', icon: <CheckCircle size={12} />, color: '#16A34A', label: 'Completed' }
                        : isOverdue ? { bg: '#FEF2F2', border: '#FECACA', icon: <AlertCircle size={12} />, color: '#DC2626', label: 'Overdue' }
                        : isInProg ? { bg: '#FFFBEB', border: '#FDE68A', icon: <Clock size={12} />, color: '#D97706', label: 'In Progress' }
                        : { bg: '#EFF6FF', border: '#BFDBFE', icon: <Clock size={12} />, color: '#2563EB', label: 'Not Started' }
                      return (
                        <div key={a.id} style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 12, padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{a.course?.title}</span>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'white', color: cfg.color }}>{cfg.icon}{cfg.label}</span>
                              </div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12, color: '#64748B' }}>
                                <span style={{ fontWeight: 600, color: isOverdue ? '#DC2626' : '#64748B' }}>Due: {new Date(a.due_date).toLocaleDateString()}</span>
                                {a.course?.category && <span style={{ padding: '1px 8px', background: 'white', borderRadius: 20, fontWeight: 600 }}>{a.course.category}</span>}
                                {a.course?.ce_hours && <span style={{ padding: '1px 8px', background: 'white', borderRadius: 20, fontWeight: 600, color: '#16A34A' }}>{a.course.ce_hours} CE hrs</span>}
                              </div>
                              {isDone && a.completion_date && <p style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, margin: '6px 0 0' }}>Completed: {new Date(a.completion_date).toLocaleDateString()}</p>}
                            </div>
                            {!isDone && (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                                {(!a.status || a.status === 'not_started') && (
                                  <button onClick={() => handleStart(a)} style={{ padding: '6px 12px', background: '#16A34A', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Start</button>
                                )}
                                {a.course?.external_url && (
                                  <a href={a.course.external_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}><ExternalLink size={12} />View</a>
                                )}
                                {isInProg && (
                                  <button onClick={() => handleMarkComplete(a)} style={{ padding: '6px 12px', background: '#16A34A', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Complete</button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Learning Path Assignments */}
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F1F5F9', overflow: 'hidden', ...anim(180) }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F8FAFC' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FolderTree size={17} color="#7C3AED" />
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Learning Paths</span>
                </div>
                <span style={{ fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>{pathAssignments.length} assignment{pathAssignments.length !== 1 ? 's' : ''}</span>
              </div>
              <div style={{ padding: 16 }}>
                {pathAssignments.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <FolderTree size={36} color="#CBD5E1" style={{ marginBottom: 10 }} />
                    <p style={{ fontSize: 14, color: '#94A3B8' }}>No learning path assignments yet</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {pathAssignments.map(a => {
                      const sc = a.status === 'completed' ? { bg: '#F0FDF4', border: '#BBF7D0', color: '#16A34A', label: 'Completed' }
                        : a.status === 'in_progress' ? { bg: '#FFFBEB', border: '#FDE68A', color: '#D97706', label: 'In Progress' }
                        : { bg: '#F8FAFC', border: '#F1F5F9', color: '#64748B', label: 'Assigned' }
                      return (
                        <div key={a.id} style={{ border: `1px solid ${sc.border}`, background: sc.bg, borderRadius: 12, padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <div style={{ width: 34, height: 34, background: '#F5F3FF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <FolderTree size={17} color="#7C3AED" />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{a.learning_path?.name}</span>
                                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'white', color: sc.color }}>{sc.label}</span>
                              </div>
                              {a.learning_path?.description && <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 4px' }}>{a.learning_path.description}</p>}
                              {a.due_date && <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Due: {new Date(a.due_date).toLocaleDateString()}</p>}
                              {(a as any).completed_at && <p style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, margin: '4px 0 0' }}>Completed: {new Date((a as any).completed_at).toLocaleDateString()}</p>}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAssignModal && caregiver && (
        <CourseAssignmentModal caregiver={caregiver} onClose={() => setShowAssignModal(false)} onAssigned={loadData} />
      )}
      {showCompletionModal && selectedAssignment && (
        <CourseCompletionModal assignment={selectedAssignment} caregiverId={id!} onClose={() => { setShowCompletionModal(false); setSelectedAssignment(null) }} onCompleted={() => { loadData(); setShowCompletionModal(false); setSelectedAssignment(null) }} />
      )}
    </MainLayout>
  )
}
