import React, { useEffect, useState } from 'react'
import { MainLayout } from '../components/MainLayout'
import { CourseCompletionModal } from '../components/CourseCompletionModal'
import { ToastContainer } from '../components/ToastContainer'
import { useAuth } from '../contexts/AuthContext'
import { courseService } from '../services/courses'
import { learningPathService } from '../services/learningPaths'
import { complianceService } from '../services/compliance'
import { organizationService, type AgencySettings } from '../services/organizations'
import { supabase } from '../services/supabase'
import type { CourseAssignment, LearningPathAssignment, ComplianceStatus } from '../types'
import { User, Mail, Building2, Shield, BookOpen, FolderTree, CheckCircle, Clock, AlertCircle, ExternalLink, Play, Key, Globe, Phone, MapPin } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'
const anim = (d = 0): React.CSSProperties => ({ animation: 'fadeSlideUp 0.45s ease both', animationDelay: `${d}ms` })
const inputS: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 14, color: '#0F172A', outline: 'none', boxSizing: 'border-box' }
const labelS: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }

export function Profile() {
  const { profile } = useAuth()
  const [courseAssignments, setCourseAssignments] = useState<CourseAssignment[]>([])
  const [pathAssignments, setPathAssignments] = useState<LearningPathAssignment[]>([])
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus | null>(null)
  const [agencySettings, setAgencySettings] = useState<AgencySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [completingAssignment, setCompletingAssignment] = useState<CourseAssignment | null>(null)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showOrgForm, setShowOrgForm] = useState(false)
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmPassword: '' })
  const [orgData, setOrgData] = useState({ address: '', website: '', phone: '', contact_name: '', contact_email: '' })
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: ToastType }>>([])
  const [toastId, setToastId] = useState(0)

  const toast = (message: string, type: ToastType = 'info') => { const id = toastId; setToastId(p => p + 1); setToasts(p => [...p, { id, message, type }]) }
  const removeToast = (id: number) => setToasts(p => p.filter(t => t.id !== id))

  useEffect(() => { loadData() }, [profile?.id])

  const loadData = async () => {
    if (!profile?.id) return
    try {
      setLoading(true)
      if (profile.role === 'caregiver') {
        const [c, p, cs] = await Promise.all([courseService.getCaregiverAssignments(profile.id), learningPathService.getAssignments(profile.id), complianceService.getComplianceStatus(profile.id)])
        setCourseAssignments(c); setPathAssignments(p); setComplianceStatus(cs)
      }
      if ((profile.role === 'admin' || profile.role === 'manager') && profile.organization) {
        const s = await organizationService.getAgencySettings(profile.organization)
        if (s) { setAgencySettings(s); setOrgData({ address: s.address || '', website: s.website || '', phone: s.phone || '', contact_name: s.contact_name || '', contact_email: s.contact_email || '' }) }
      }
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) { toast('Passwords do not match', 'error'); return }
    if (passwordData.newPassword.length < 8) { toast('Password must be at least 8 characters', 'error'); return }
    try { const { error } = await supabase.auth.updateUser({ password: passwordData.newPassword }); if (error) throw error; toast('Password changed successfully', 'success'); setPasswordData({ newPassword: '', confirmPassword: '' }); setShowPasswordForm(false) }
    catch (e: any) { toast(e.message || 'Failed to change password', 'error') }
  }

  const handleOrgUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile?.organization) { toast('No organization found', 'error'); return }
    try { await organizationService.updateAgencySettings(profile.organization, orgData); toast('Organization settings updated', 'success'); setShowOrgForm(false); await loadData() }
    catch (e: any) { toast(e.message || 'Failed to update settings', 'error') }
  }

  const roleCfg = (r?: string) => r === 'admin' ? { bg: '#FEF2F2', c: '#DC2626' } : r === 'manager' ? { bg: '#EFF6FF', c: '#2563EB' } : { bg: '#F0FDF4', c: '#16A34A' }

  if (loading) return (
    <MainLayout>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ width: 40, height: 40, border: '3px solid #EFF6FF', borderTop: '3px solid #2563EB', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </MainLayout>
  )

  return (
    <MainLayout>
      <style>{`@keyframes fadeSlideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>
        <div style={{ marginBottom: 28, ...anim() }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>My Profile</h1>
          <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>Manage your account and settings</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
          {/* Left: Personal Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F1F5F9', overflow: 'hidden', ...anim(60) }}>
              {/* Avatar banner */}
              <div style={{ background: 'linear-gradient(135deg,#1E3A5F,#2563EB)', padding: '24px 20px 48px', position: 'relative' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '2px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 20, fontWeight: 800 }}>
                  {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                </div>
              </div>
              <div style={{ padding: '0 20px 20px', marginTop: -24 }}>
                <div style={{ background: 'white', borderRadius: 10, padding: '12px 14px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: 16 }}>
                  <p style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: '0 0 2px' }}>{profile?.first_name} {profile?.last_name}</p>
                  <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>{profile?.email}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[
                    { icon: <Mail size={14} />, label: 'Email', value: profile?.email },
                    ...(profile?.organization ? [{ icon: <Building2 size={14} />, label: 'Organization', value: profile.organization }] : []),
                    { icon: <Shield size={14} />, label: 'Role', value: profile?.role },
                  ].map(({ icon, label, value }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                      <div style={{ width: 26, height: 26, background: '#F8FAFC', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#94A3B8' }}>{icon}</div>
                      <div>
                        <p style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700, margin: '0 0 1px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', margin: 0, textTransform: 'capitalize' }}>{value}</p>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #F8FAFC' }}>
                    <span style={{ fontSize: 12, color: '#94A3B8' }}>Status</span>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: profile?.is_active ? '#F0FDF4' : '#FEF2F2', color: profile?.is_active ? '#16A34A' : '#DC2626' }}>
                      {profile?.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  {profile?.role && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: '#94A3B8' }}>Access Level</span>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: roleCfg(profile.role).bg, color: roleCfg(profile.role).c, textTransform: 'capitalize' }}>{profile.role}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Change password */}
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F1F5F9', padding: 16, ...anim(120) }}>
              <button onClick={() => setShowPasswordForm(!showPasswordForm)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 14px', background: '#F8FAFC', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, color: '#475569', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#F1F5F9'}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = '#F8FAFC'}>
                <Key size={16} /> Change Password
              </button>
              {showPasswordForm && (
                <form onSubmit={handlePasswordChange} style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div><label style={labelS}>New Password</label><input type="password" value={passwordData.newPassword} onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })} style={inputS} placeholder="Min 8 characters" required minLength={8} /></div>
                  <div><label style={labelS}>Confirm Password</label><input type="password" value={passwordData.confirmPassword} onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} style={inputS} placeholder="Retype password" required minLength={8} /></div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="submit" style={{ flex: 1, padding: '8px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Update</button>
                    <button type="button" onClick={() => { setShowPasswordForm(false); setPasswordData({ newPassword: '', confirmPassword: '' }) }} style={{ flex: 1, padding: '8px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Right: Role-specific content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* CAREGIVER: compliance summary */}
            {profile?.role === 'caregiver' && complianceStatus && (
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F1F5F9', padding: 20, ...anim(80) }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px' }}>Training Compliance</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 16 }}>
                  {[
                    { label: 'Total', val: complianceStatus.total_assignments, color: '#2563EB' },
                    { label: 'Completed', val: complianceStatus.completed, color: '#16A34A' },
                    { label: 'Pending', val: complianceStatus.pending, color: '#D97706' },
                    { label: 'Overdue', val: complianceStatus.overdue, color: '#DC2626' },
                  ].map(s => (
                    <div key={s.label} style={{ background: '#F8FAFC', borderRadius: 10, padding: '12px', textAlign: 'center' }}>
                      <p style={{ fontSize: 24, fontWeight: 800, color: s.color, margin: '0 0 2px' }}>{s.val}</p>
                      <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, margin: 0 }}>{s.label}</p>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #F8FAFC' }}>
                  <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>Overall Status</span>
                  {(() => {
                    const s = complianceStatus.status; const cfg = s === 'compliant' ? { bg: '#F0FDF4', c: '#16A34A', label: 'Compliant' } : s === 'overdue' ? { bg: '#FEF2F2', c: '#DC2626', label: 'Overdue' } : { bg: '#FFFBEB', c: '#D97706', label: 'Action Required' }
                    return <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: cfg.bg, color: cfg.c }}>{cfg.label}</span>
                  })()}
                </div>
              </div>
            )}

            {/* CAREGIVER: course assignments */}
            {profile?.role === 'caregiver' && (
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F1F5F9', overflow: 'hidden', ...anim(140) }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px', borderBottom: '1px solid #F8FAFC' }}>
                  <BookOpen size={17} color="#2563EB" />
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>My Course Assignments</span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>{courseAssignments.length}</span>
                </div>
                <div style={{ padding: 16 }}>
                  {courseAssignments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8', fontSize: 14 }}>No course assignments</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {courseAssignments.map(a => {
                        const isDone = a.status === 'completed' || !!a.completion_date
                        const isOD = !a.completion_date && new Date(a.due_date) < new Date()
                        const isIP = a.status === 'in_progress'
                        const cfg = isDone ? { bg: '#F0FDF4', border: '#BBF7D0', ic: <CheckCircle size={12} />, c: '#16A34A', label: 'Completed' }
                          : isOD ? { bg: '#FEF2F2', border: '#FECACA', ic: <AlertCircle size={12} />, c: '#DC2626', label: 'Overdue' }
                          : isIP ? { bg: '#FFFBEB', border: '#FDE68A', ic: <Clock size={12} />, c: '#D97706', label: 'In Progress' }
                          : { bg: '#EFF6FF', border: '#BFDBFE', ic: <Clock size={12} />, c: '#2563EB', label: 'Not Started' }
                        return (
                          <div key={a.id} style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 12, padding: '14px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{a.course?.title}</span>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'white', color: cfg.c }}>{cfg.ic}{cfg.label}</span>
                                </div>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, fontSize: 12 }}>
                                  <span style={{ fontWeight: 600, color: isOD ? '#DC2626' : '#64748B' }}>Due: {new Date(a.due_date).toLocaleDateString()}</span>
                                  {a.course?.category && <span style={{ padding: '1px 8px', background: 'white', borderRadius: 20, color: '#2563EB', fontWeight: 600 }}>{a.course.category}</span>}
                                  {a.course?.ce_hours && <span style={{ padding: '1px 8px', background: 'white', borderRadius: 20, color: '#16A34A', fontWeight: 600 }}>{a.course.ce_hours} CE hrs</span>}
                                </div>
                                {isDone && a.completion_date && <p style={{ fontSize: 12, color: '#16A34A', fontWeight: 600, margin: '6px 0 0' }}>Completed: {new Date(a.completion_date).toLocaleDateString()}</p>}
                              </div>
                              {!isDone && a.course?.external_url && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                                  <a href={a.course.external_url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}><ExternalLink size={12} />View</a>
                                  {(!a.status || a.status === 'not_started') && <button onClick={() => courseService.startCourse(a.id).then(loadData)} style={{ padding: '6px 12px', background: '#D97706', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}><Play size={12} /></button>}
                                  {isIP && <button onClick={() => setCompletingAssignment(a)} style={{ padding: '6px 12px', background: '#16A34A', color: 'white', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Complete</button>}
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
            )}

            {/* CAREGIVER: learning paths */}
            {profile?.role === 'caregiver' && (
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F1F5F9', overflow: 'hidden', ...anim(200) }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '16px 20px', borderBottom: '1px solid #F8FAFC' }}>
                  <FolderTree size={17} color="#7C3AED" />
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>My Learning Paths</span>
                  <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>{pathAssignments.length}</span>
                </div>
                <div style={{ padding: 16 }}>
                  {pathAssignments.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8', fontSize: 14 }}>No learning path assignments</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {pathAssignments.map(a => {
                        const sc = a.status === 'completed' ? { bg: '#F0FDF4', border: '#BBF7D0', c: '#16A34A', label: 'Completed' } : a.status === 'in_progress' ? { bg: '#FFFBEB', border: '#FDE68A', c: '#D97706', label: 'In Progress' } : { bg: '#F8FAFC', border: '#F1F5F9', c: '#64748B', label: 'Assigned' }
                        return (
                          <div key={a.id} style={{ border: `1px solid ${sc.border}`, background: sc.bg, borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                            <div style={{ width: 32, height: 32, background: '#F5F3FF', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <FolderTree size={15} color="#7C3AED" />
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{a.learning_path?.name}</span>
                                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: 'white', color: sc.c }}>{sc.label}</span>
                              </div>
                              {a.due_date && <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Due: {new Date(a.due_date).toLocaleDateString()}</p>}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ADMIN/MANAGER: org settings */}
            {(profile?.role === 'admin' || profile?.role === 'manager') && (
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F1F5F9', overflow: 'hidden', ...anim(80) }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #F8FAFC' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Building2 size={17} color="#64748B" />
                    <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Organization Settings</span>
                  </div>
                  {!showOrgForm && agencySettings && (
                    <button onClick={() => setShowOrgForm(true)} style={{ padding: '6px 14px', background: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                  )}
                </div>
                <div style={{ padding: 20 }}>
                  {agencySettings && !showOrgForm ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                      {[
                        { icon: <MapPin size={14} />, label: 'Address', value: agencySettings.address },
                        { icon: <Phone size={14} />, label: 'Phone', value: agencySettings.phone },
                        { icon: <Globe size={14} />, label: 'Website', value: agencySettings.website },
                        { icon: <Mail size={14} />, label: 'Contact', value: agencySettings.contact_name },
                        { icon: <Mail size={14} />, label: 'Contact Email', value: agencySettings.contact_email },
                      ].map(({ icon, label, value }) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                          <div style={{ width: 26, height: 26, background: '#F8FAFC', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#94A3B8' }}>{icon}</div>
                          <div>
                            <p style={{ fontSize: 10, color: '#94A3B8', fontWeight: 700, margin: '0 0 1px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
                            <p style={{ fontSize: 13, fontWeight: 600, color: value ? '#0F172A' : '#CBD5E1', margin: 0 }}>{value || 'Not set'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : showOrgForm ? (
                    <form onSubmit={handleOrgUpdate}>
                      <div style={{ marginBottom: 16 }}><label style={labelS}>Address</label><input type="text" value={orgData.address} onChange={e => setOrgData({ ...orgData, address: e.target.value })} style={inputS} /></div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                        <div><label style={labelS}>Phone</label><input type="tel" value={orgData.phone} onChange={e => setOrgData({ ...orgData, phone: e.target.value })} style={inputS} /></div>
                        <div><label style={labelS}>Website</label><input type="url" value={orgData.website} onChange={e => setOrgData({ ...orgData, website: e.target.value })} style={inputS} /></div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                        <div><label style={labelS}>Contact Name</label><input type="text" value={orgData.contact_name} onChange={e => setOrgData({ ...orgData, contact_name: e.target.value })} style={inputS} /></div>
                        <div><label style={labelS}>Contact Email</label><input type="email" value={orgData.contact_email} onChange={e => setOrgData({ ...orgData, contact_email: e.target.value })} style={inputS} /></div>
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button type="submit" style={{ padding: '9px 20px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Save</button>
                        <button type="button" onClick={() => setShowOrgForm(false)} style={{ padding: '9px 20px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                      </div>
                    </form>
                  ) : (
                    <p style={{ fontSize: 14, color: '#94A3B8', textAlign: 'center', padding: '24px 0' }}>No organization settings found</p>
                  )}
                </div>
              </div>
            )}

            {/* ADMIN/MANAGER: quick links */}
            {(profile?.role === 'admin' || profile?.role === 'manager') && (
              <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F1F5F9', padding: 20, ...anim(160) }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 16px' }}>Quick Access</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { href: '/caregivers', bg: '#EFF6FF', c: '#1D4ED8', title: 'Manage Caregivers', sub: 'Add, edit, and assign training to caregivers' },
                    { href: '/courses', bg: '#F0FDF4', c: '#15803D', title: 'Manage Courses', sub: 'Create and manage your course catalog' },
                    { href: '/learning-paths', bg: '#F5F3FF', c: '#6D28D9', title: 'Learning Paths', sub: 'Group courses into structured learning paths' },
                    { href: '/compliance', bg: '#FFFBEB', c: '#B45309', title: 'Compliance Dashboard', sub: 'Track and manage compliance across your team' },
                  ].map(link => (
                    <a key={link.href} href={link.href} style={{ display: 'block', padding: '14px 16px', background: link.bg, borderRadius: 12, textDecoration: 'none', transition: 'opacity 0.15s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = '1'}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: link.c, margin: '0 0 2px' }}>{link.title}</p>
                      <p style={{ fontSize: 12, color: link.c, margin: 0, opacity: 0.7 }}>{link.sub}</p>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {completingAssignment && profile?.id && (
        <CourseCompletionModal assignment={completingAssignment} caregiverId={profile.id} onClose={() => setCompletingAssignment(null)} onCompleted={() => { setCompletingAssignment(null); loadData() }} />
      )}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </MainLayout>
  )
}
