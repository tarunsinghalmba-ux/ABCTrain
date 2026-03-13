import React, { useEffect, useState } from 'react'
import { MainLayout } from '../components/MainLayout'
import { CaregiverForm } from '../components/CaregiverForm'
import { CourseAssignmentModal } from '../components/CourseAssignmentModal'
import { StatusBadge } from '../components/StatusBadge'
import { profileService } from '../services/profiles'
import { complianceService } from '../services/compliance'
import type { Profile } from '../types'
import { Plus, Users, Edit, Trash2, UserCheck, UserX, Search, CheckCircle, AlertCircle, BookOpen } from 'lucide-react'

export function Caregivers() {
  const [caregivers, setCaregivers] = useState<Profile[]>([])
  const [filtered, setFiltered] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Profile|null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string|null>(null)
  const [showAssign, setShowAssign] = useState(false)
  const [selectedCg, setSelectedCg] = useState<Profile|null>(null)
  const [newPassword, setNewPassword] = useState<string|null>(null)

  useEffect(()=>{ loadCaregivers() },[showInactive])
  useEffect(()=>{ filterList() },[caregivers,search])

  const loadCaregivers = async () => { try { setCaregivers(await profileService.getCaregivers(!showInactive)) } catch(e){console.error(e)} finally{setLoading(false)} }
  const filterList = () => {
    let f = caregivers
    if (search) { const t=search.toLowerCase(); f=f.filter(c=>c.first_name.toLowerCase().includes(t)||c.last_name.toLowerCase().includes(t)||c.email.toLowerCase().includes(t)||(c.organization?.toLowerCase().includes(t))) }
    setFiltered(f)
  }

  const handleFormSubmit = async (data:{firstName:string;lastName:string;email:string;organization?:string}) => {
    setSubmitting(true)
    try {
      if (editing) { await profileService.updateCaregiver(editing.id,data) }
      else { const r=await profileService.createCaregiver(data); await complianceService.initializeCaregiverCompliance(r.id); if(r.defaultPassword) setNewPassword(r.defaultPassword) }
      await loadCaregivers(); setShowForm(false); setEditing(null)
    } catch(e){ alert(`Failed: ${e instanceof Error?e.message:'Unknown'}`) }
    finally { setSubmitting(false) }
  }
  const handleDelete = async (id:string) => { try { await profileService.deleteCaregiver(id); await loadCaregivers(); setDeleteConfirm(null) } catch(e){alert('Failed to delete')} }
  const handleToggle = async (cg:Profile) => { try { cg.is_active?await profileService.deactivateCaregiver(cg.id):await profileService.reactivateCaregiver(cg.id); await loadCaregivers() } catch(e){alert('Failed to update status')} }

  const stats = { total:caregivers.length, active:caregivers.filter(c=>c.is_active).length, inactive:caregivers.filter(c=>!c.is_active).length }

  const iconBox = (bg:string,icon:React.ReactNode) => (
    <div style={{ width:40,height:40,background:bg,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center' }}>{icon}</div>
  )

  return (
    <MainLayout>
      <style>{`@keyframes fadeSlideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:32 }}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28, animation:'fadeSlideUp 0.4s ease both' }}>
          <div>
            <h1 style={{ fontSize:26,fontWeight:800,color:'#0F172A',margin:'0 0 4px' }}>Caregiver Management</h1>
            <p style={{ fontSize:14,color:'#64748B',margin:0 }}>Manage your team and track their training</p>
          </div>
          <button onClick={()=>{setEditing(null);setShowForm(true)}} style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'10px 18px',background:'#2563EB',color:'white',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer' }}>
            <Plus size={18}/> Add Caregiver
          </button>
        </div>

        {/* Stats */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:24 }}>
          {[
            { label:'Total Caregivers', value:stats.total,  color:'#2563EB', bg:'#EFF6FF', icon:<Users size={20} color="#2563EB"/> },
            { label:'Active',           value:stats.active,  color:'#16A34A', bg:'#F0FDF4', icon:<UserCheck size={20} color="#16A34A"/> },
            { label:'Inactive',         value:stats.inactive,color:'#64748B', bg:'#F1F5F9', icon:<UserX size={20} color="#64748B"/> },
          ].map((s,i) => (
            <div key={s.label} style={{ background:'white',borderRadius:14,border:'1px solid #F1F5F9',padding:'20px 22px',boxShadow:'0 1px 3px rgba(0,0,0,0.05)',animation:'fadeSlideUp 0.45s ease both',animationDelay:`${i*60}ms` }}>
              <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between' }}>
                <div>
                  <p style={{ fontSize:11,fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:6 }}>{s.label}</p>
                  <p style={{ fontSize:32,fontWeight:800,color:s.color,margin:0 }}>{s.value}</p>
                </div>
                <div style={{ width:40,height:40,background:s.bg,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center' }}>{s.icon}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search + filter */}
        <div style={{ background:'white',borderRadius:14,border:'1px solid #F1F5F9',padding:'16px 20px',marginBottom:20,display:'flex',alignItems:'center',gap:16,animation:'fadeSlideUp 0.45s ease both',animationDelay:'180ms' }}>
          <div style={{ position:'relative',flex:1,maxWidth:380 }}>
            <Search size={16} style={{ position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',color:'#94A3B8',pointerEvents:'none' }}/>
            <input type="text" placeholder="Search by name, email or org…" value={search} onChange={e=>setSearch(e.target.value)}
              style={{ width:'100%',padding:'9px 12px 9px 36px',border:'1px solid #E2E8F0',borderRadius:10,fontSize:14,outline:'none' }}/>
          </div>
          <label style={{ display:'flex',alignItems:'center',gap:8,cursor:'pointer',fontSize:14,color:'#475569',fontWeight:500,flexShrink:0 }}>
            <input type="checkbox" checked={showInactive} onChange={e=>setShowInactive(e.target.checked)} style={{ width:16,height:16 }}/>
            Show inactive
          </label>
        </div>

        {/* Add/Edit form */}
        {showForm && (
          <div style={{ background:'white',borderRadius:14,border:'1px solid #F1F5F9',marginBottom:20,overflow:'hidden',animation:'fadeSlideUp 0.4s ease both' }}>
            <div style={{ padding:'16px 20px',borderBottom:'1px solid #F8FAFC' }}>
              <h2 style={{ fontSize:16,fontWeight:700,color:'#0F172A',margin:0 }}>{editing?'Edit Caregiver':'Add New Caregiver'}</h2>
            </div>
            <div style={{ padding:20 }}>
              <CaregiverForm caregiver={editing} onSubmit={handleFormSubmit} onCancel={()=>{setShowForm(false);setEditing(null)}} isLoading={submitting}/>
            </div>
          </div>
        )}

        {/* Table */}
        {loading ? (
          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            {[1,2,3,4].map(i=><div key={i} style={{ height:56,borderRadius:10,background:'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)',backgroundSize:'200% 100%',animation:`shimmer 1.5s ease ${i*0.1}s infinite` }}/>)}
          </div>
        ) : (
          <div style={{ background:'white',borderRadius:14,border:'1px solid #F1F5F9',overflow:'hidden',animation:'fadeSlideUp 0.45s ease both',animationDelay:'240ms' }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse' }}>
                <thead style={{ background:'#F8FAFC',borderBottom:'1px solid #F1F5F9' }}>
                  <tr>
                    {['Name','Email','Organization','Status','Compliance','Actions'].map(h=>(
                      <th key={h} style={{ padding:'12px 16px',textAlign:h==='Actions'||h==='Status'||h==='Compliance'?'center':'left',fontSize:11,fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'0.07em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((cg,i) => (
                    <tr key={cg.id} style={{ borderBottom:'1px solid #F8FAFC', transition:'background 0.1s' }}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#FAFBFC'}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                      <td style={{ padding:'14px 16px' }}>
                        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                          <div style={{ width:34,height:34,borderRadius:'50%',background:'linear-gradient(135deg,#1E3A5F,#2563EB)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:12,fontWeight:700,flexShrink:0 }}>
                            {cg.first_name[0]}{cg.last_name[0]}
                          </div>
                          <span style={{ fontSize:14,fontWeight:600,color:'#0F172A' }}>{cg.first_name} {cg.last_name}</span>
                        </div>
                      </td>
                      <td style={{ padding:'14px 16px',fontSize:13,color:'#64748B' }}>{cg.email}</td>
                      <td style={{ padding:'14px 16px',fontSize:13,color:'#64748B' }}>{cg.organization||'—'}</td>
                      <td style={{ padding:'14px 16px',textAlign:'center' }}>
                        <span style={{ display:'inline-flex',alignItems:'center',gap:5,fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,background:cg.is_active?'#F0FDF4':'#FEF2F2',color:cg.is_active?'#16A34A':'#DC2626' }}>
                          <span style={{ width:6,height:6,borderRadius:'50%',background:cg.is_active?'#16A34A':'#DC2626',display:'inline-block' }}/>
                          {cg.is_active?'Active':'Inactive'}
                        </span>
                      </td>
                      <td style={{ padding:'14px 16px',textAlign:'center' }}>
                        {(cg as any).orientation_complete
                          ? <CheckCircle size={18} color="#16A34A"/>
                          : <AlertCircle size={18} color="#D97706"/>}
                      </td>
                      <td style={{ padding:'14px 16px' }}>
                        <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:6 }}>
                          {[
                            { icon:<BookOpen size={15}/>, bg:'#F5F3FF', col:'#7C3AED', hov:'#EDE9FE', action:()=>{setSelectedCg(cg);setShowAssign(true)}, title:'Assign Training' },
                            { icon:<Edit size={15}/>,     bg:'#EFF6FF', col:'#2563EB', hov:'#DBEAFE', action:()=>{setEditing(cg);setShowForm(true)}, title:'Edit' },
                            { icon: cg.is_active?<UserX size={15}/>:<UserCheck size={15}/>, bg: cg.is_active?'#FFFBEB':'#F0FDF4', col:cg.is_active?'#D97706':'#16A34A', hov:cg.is_active?'#FEF3C7':'#DCFCE7', action:()=>handleToggle(cg), title:cg.is_active?'Deactivate':'Activate' },
                          ].map((btn,j) => (
                            <button key={j} onClick={btn.action} title={btn.title} style={{ width:32,height:32,background:btn.bg,border:'none',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:btn.col,transition:'background 0.15s' }}
                              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background=btn.hov}
                              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background=btn.bg}>
                              {btn.icon}
                            </button>
                          ))}
                          {deleteConfirm===cg.id ? (
                            <div style={{ display:'flex',gap:4 }}>
                              <button onClick={()=>handleDelete(cg.id)} style={{ padding:'4px 10px',background:'#DC2626',color:'white',border:'none',borderRadius:6,fontSize:12,fontWeight:700,cursor:'pointer' }}>Confirm</button>
                              <button onClick={()=>setDeleteConfirm(null)} style={{ padding:'4px 10px',background:'#F1F5F9',color:'#475569',border:'none',borderRadius:6,fontSize:12,fontWeight:600,cursor:'pointer' }}>Cancel</button>
                            </div>
                          ) : (
                            <button onClick={()=>setDeleteConfirm(cg.id)} title="Delete" style={{ width:32,height:32,background:'#FEF2F2',border:'none',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'#DC2626',transition:'background 0.15s' }}
                              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#FEE2E2'}
                              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='#FEF2F2'}>
                              <Trash2 size={15}/>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length===0 && (
                <div style={{ textAlign:'center',padding:'48px 0',color:'#94A3B8',fontSize:14 }}>
                  {search?'No caregivers match your search.':'No caregivers yet. Add your first caregiver to get started.'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showAssign && selectedCg && (
        <CourseAssignmentModal caregiver={selectedCg} onClose={()=>{setShowAssign(false);setSelectedCg(null)}} onAssigned={loadCaregivers}/>
      )}

      {newPassword && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,zIndex:50 }}>
          <div style={{ background:'white',borderRadius:18,maxWidth:420,width:'100%',padding:32,boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <h2 style={{ fontSize:20,fontWeight:800,color:'#0F172A',marginBottom:12 }}>Caregiver Created</h2>
            <p style={{ fontSize:14,color:'#64748B',marginBottom:16 }}>Share these credentials with the caregiver:</p>
            <div style={{ background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:12,padding:16,marginBottom:20 }}>
              <p style={{ fontSize:12,fontWeight:600,color:'#64748B',marginBottom:6 }}>Default Password:</p>
              <p style={{ fontSize:20,fontWeight:800,color:'#1D4ED8',fontFamily:'monospace',marginBottom:6 }}>{newPassword}</p>
              <p style={{ fontSize:12,color:'#94A3B8',margin:0 }}>Caregiver can change this after first login.</p>
            </div>
            <button onClick={()=>setNewPassword(null)} style={{ width:'100%',padding:11,background:'#2563EB',color:'white',border:'none',borderRadius:10,fontSize:15,fontWeight:700,cursor:'pointer' }}>Done</button>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
