import React, { useEffect, useState } from 'react'
import { MainLayout } from '../components/MainLayout'
import { ToastContainer } from '../components/ToastContainer'
import { profileService } from '../services/profiles'
import { organizationService, type Organization } from '../services/organizations'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Profile } from '../types'
import { Users, Building2, Shield, Plus, Key } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'
type TabType = 'users' | 'organizations'
const anim = (d = 0): React.CSSProperties => ({ animation: 'fadeSlideUp 0.45s ease both', animationDelay: `${d}ms` })
const inputS: React.CSSProperties = { width: '100%', padding: '9px 12px', border: '1px solid #E2E8F0', borderRadius: 10, fontSize: 14, color: '#0F172A', outline: 'none', boxSizing: 'border-box' }
const labelS: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 600, color: '#475569', marginBottom: 6 }

export function AdminManagement() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('users')
  const [users, setUsers] = useState<Profile[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [showUserForm, setShowUserForm] = useState(false)
  const [showOrgForm, setShowOrgForm] = useState(false)
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: ToastType }>>([])
  const [toastId, setToastId] = useState(0)
  const [formData, setFormData] = useState({ email: '', firstName: '', lastName: '', role: 'caregiver' as 'admin' | 'manager' | 'caregiver', organization: '', phone: '' })
  const [orgFormData, setOrgFormData] = useState({ name: '', description: '' })

  const toast = (message: string, type: ToastType = 'info') => { const id = toastId; setToastId(p => p + 1); setToasts(p => [...p, { id, message, type }]) }
  const removeToast = (id: number) => setToasts(p => p.filter(t => t.id !== id))

  useEffect(() => { load() }, [])

  const load = async () => { try { setLoading(true); await Promise.all([loadUsers(), loadOrgs()]) } finally { setLoading(false) } }
  const loadUsers = async () => { try { setUsers(await profileService.getProfiles()) } catch (e) { toast('Failed to load users', 'error') } }
  const loadOrgs = async () => { try { setOrganizations(await organizationService.getOrganizations()) } catch (e) { toast('Failed to load organizations', 'error') } }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!user) return
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')
      const res = await fetch(`${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/create-user`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session.access_token}`, 'apikey': (import.meta as any).env.VITE_SUPABASE_ANON_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, firstName: formData.firstName, lastName: formData.lastName, role: formData.role, organization: formData.organization || null, phone: formData.phone || null })
      })
      const result = JSON.parse(await res.text())
      if (!res.ok) throw new Error(result.error || 'Failed to create user')
      toast(`${formData.firstName} ${formData.lastName} created — default password: Welcome123!`, 'success')
      setFormData({ email: '', firstName: '', lastName: '', role: 'caregiver', organization: '', phone: '' }); setShowUserForm(false)
      await loadUsers()
    } catch (e) { toast(e instanceof Error ? e.message : 'Failed to create user', 'error') }
  }

  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try { await organizationService.createOrganization(orgFormData.name, orgFormData.description); toast(`Organization "${orgFormData.name}" created`, 'success'); setOrgFormData({ name: '', description: '' }); setShowOrgForm(false); await loadOrgs() }
    catch (e) { toast(e instanceof Error ? e.message : 'Failed to create organization', 'error') }
  }

  const handleToggleUser = async (id: string, active: boolean) => { try { await profileService.updateProfile(id, { is_active: !active }); toast(`User ${!active ? 'activated' : 'deactivated'}`, 'success'); await loadUsers() } catch (e) { toast('Failed to update user', 'error') } }
  const handleToggleOrg = async (id: string, active: boolean) => { try { await organizationService.updateOrganization(id, { is_active: !active }); toast(`Organization ${!active ? 'activated' : 'deactivated'}`, 'success'); await loadOrgs() } catch (e) { toast('Failed to update organization', 'error') } }

  const roleStyle = (role: string) => ({ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: role === 'admin' ? '#FEF2F2' : role === 'manager' ? '#EFF6FF' : '#F0FDF4', color: role === 'admin' ? '#DC2626' : role === 'manager' ? '#2563EB' : '#16A34A' } as React.CSSProperties)
  const statusStyle = (active: boolean) => ({ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: active ? '#F0FDF4' : '#F1F5F9', color: active ? '#16A34A' : '#94A3B8' } as React.CSSProperties)

  return (
    <MainLayout>
      <style>{`@keyframes fadeSlideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 32 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, ...anim() }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>Admin Management</h1>
            <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>Create and manage users, organizations, and roles</p>
          </div>
          <button onClick={() => activeTab === 'users' ? setShowUserForm(true) : setShowOrgForm(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 18px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            <Plus size={18} /> {activeTab === 'users' ? 'Create User' : 'Create Organization'}
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid #F1F5F9', marginBottom: 24, ...anim(60) }}>
          {([['users', <Users size={16} />, 'Users'], ['organizations', <Building2 size={16} />, 'Organizations']] as const).map(([tab, icon, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab as TabType)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'none', border: 'none', borderBottom: activeTab === tab ? '2px solid #2563EB' : '2px solid transparent', color: activeTab === tab ? '#2563EB' : '#64748B', fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.15s', marginBottom: -1 }}>
              {icon}{label}
            </button>
          ))}
        </div>

        {/* User form */}
        {activeTab === 'users' && showUserForm && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #F1F5F9', padding: 24, marginBottom: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', ...anim() }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: '0 0 16px' }}>Create New User</h2>
            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 10, padding: '12px 14px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <Key size={16} color="#2563EB" style={{ marginTop: 1, flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#1D4ED8', margin: '0 0 2px' }}>Default Password</p>
                <p style={{ fontSize: 13, color: '#3B82F6', margin: 0 }}>New users are created with: <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>Welcome123!</span> — they can change it after login.</p>
              </div>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div><label style={labelS}>First Name</label><input type="text" value={formData.firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} style={inputS} required /></div>
                <div><label style={labelS}>Last Name</label><input type="text" value={formData.lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} style={inputS} required /></div>
              </div>
              <div style={{ marginBottom: 16 }}><label style={labelS}>Email</label><input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} style={inputS} required /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div><label style={labelS}>Role</label>
                  <select value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value as any })} style={inputS}>
                    <option value="caregiver">Caregiver</option><option value="manager">Manager</option><option value="admin">Admin</option>
                  </select>
                </div>
                <div><label style={labelS}>Organization</label>
                  <select value={formData.organization} onChange={e => setFormData({ ...formData, organization: e.target.value })} style={inputS}>
                    <option value="">Select organization (optional)</option>
                    {organizations.filter(o => o.is_active).map(o => <option key={o.id} value={o.name}>{o.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}><label style={labelS}>Phone <span style={{ fontWeight: 400, color: '#94A3B8' }}>(optional)</span></label><input type="tel" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} style={inputS} /></div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={{ padding: '9px 20px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Create User</button>
                <button type="button" onClick={() => setShowUserForm(false)} style={{ padding: '9px 20px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Org form */}
        {activeTab === 'organizations' && showOrgForm && (
          <div style={{ background: 'white', borderRadius: 16, border: '1px solid #F1F5F9', padding: 24, marginBottom: 24, boxShadow: '0 4px 16px rgba(0,0,0,0.06)', ...anim() }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', margin: '0 0 20px' }}>Create New Organization</h2>
            <form onSubmit={handleOrgSubmit}>
              <div style={{ marginBottom: 16 }}><label style={labelS}>Organization Name</label><input type="text" value={orgFormData.name} onChange={e => setOrgFormData({ ...orgFormData, name: e.target.value })} style={inputS} placeholder="e.g., North Division" required /></div>
              <div style={{ marginBottom: 20 }}><label style={labelS}>Description <span style={{ fontWeight: 400, color: '#94A3B8' }}>(optional)</span></label><textarea value={orgFormData.description} onChange={e => setOrgFormData({ ...orgFormData, description: e.target.value })} style={{ ...inputS, resize: 'vertical' }} rows={3} /></div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="submit" style={{ padding: '9px 20px', background: '#2563EB', color: 'white', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Create Organization</button>
                <button type="button" onClick={() => setShowOrgForm(false)} style={{ padding: '9px 20px', background: '#F1F5F9', color: '#475569', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Users table */}
        {activeTab === 'users' && (
          loading ? <div style={{ height: 200, borderRadius: 14, background: 'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease infinite' }} /> : (
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F1F5F9', overflow: 'hidden', ...anim(120) }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #F8FAFC', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Users size={17} color="#64748B" />
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Users</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>{users.length} total</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                    <tr>{['Name', 'Email', 'Role', 'Organization', 'Status', 'Actions'].map(h => <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #F8FAFC', transition: 'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAFBFC'}
                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                        <td style={{ padding: '13px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#1E3A5F,#2563EB)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{u.first_name[0]}{u.last_name[0]}</div>
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{u.first_name} {u.last_name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '13px 16px', fontSize: 13, color: '#64748B' }}>{u.email}</td>
                        <td style={{ padding: '13px 16px' }}><span style={roleStyle(u.role)}><Shield size={11} />{u.role}</span></td>
                        <td style={{ padding: '13px 16px', fontSize: 13, color: '#64748B' }}>{u.organization || '—'}</td>
                        <td style={{ padding: '13px 16px' }}><span style={statusStyle(u.is_active)}><span style={{ width: 6, height: 6, borderRadius: '50%', background: u.is_active ? '#16A34A' : '#CBD5E1', display: 'inline-block' }} />{u.is_active ? 'Active' : 'Inactive'}</span></td>
                        <td style={{ padding: '13px 16px' }}>
                          <button onClick={() => handleToggleUser(u.id, u.is_active)} style={{ padding: '5px 12px', background: u.is_active ? '#FEF2F2' : '#F0FDF4', color: u.is_active ? '#DC2626' : '#16A34A', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {users.length === 0 && <div style={{ textAlign: 'center', padding: '48px 0', color: '#94A3B8', fontSize: 14 }}>No users yet.</div>}
              </div>
            </div>
          )
        )}

        {/* Organizations table */}
        {activeTab === 'organizations' && (
          loading ? <div style={{ height: 200, borderRadius: 14, background: 'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s ease infinite' }} /> : (
            <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F1F5F9', overflow: 'hidden', ...anim(120) }}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid #F8FAFC', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Building2 size={17} color="#64748B" />
                <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>Organizations</span>
                <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>{organizations.length} total</span>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                    <tr>{['Name', 'Description', 'Users', 'Status', 'Actions'].map(h => <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {organizations.map(org => {
                      const uc = users.filter(u => u.organization === org.name).length
                      return (
                        <tr key={org.id} style={{ borderBottom: '1px solid #F8FAFC', transition: 'background 0.1s' }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAFBFC'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                          <td style={{ padding: '13px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 32, height: 32, background: '#F0FDF4', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={16} color="#16A34A" /></div>
                              <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{org.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: '13px 16px', fontSize: 13, color: '#64748B' }}>{org.description || '—'}</td>
                          <td style={{ padding: '13px 16px', fontSize: 13, color: '#64748B' }}>{uc} {uc === 1 ? 'user' : 'users'}</td>
                          <td style={{ padding: '13px 16px' }}><span style={statusStyle(org.is_active)}><span style={{ width: 6, height: 6, borderRadius: '50%', background: org.is_active ? '#16A34A' : '#CBD5E1', display: 'inline-block' }} />{org.is_active ? 'Active' : 'Inactive'}</span></td>
                          <td style={{ padding: '13px 16px' }}>
                            <button onClick={() => handleToggleOrg(org.id, org.is_active)} style={{ padding: '5px 12px', background: org.is_active ? '#FEF2F2' : '#F0FDF4', color: org.is_active ? '#DC2626' : '#16A34A', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                              {org.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                    {organizations.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: '48px 0', color: '#94A3B8', fontSize: 14 }}>No organizations yet.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )
        )}
      </div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </MainLayout>
  )
}
