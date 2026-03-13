import React, { useEffect, useState } from 'react'
import { MainLayout } from '../components/MainLayout'
import { complianceService } from '../services/compliance'
import { exportToCSV } from '../utils/exportCSV'
import type { CaregiverComplianceSummary, ComplianceRequirement } from '../types'
import { Download, AlertCircle, CheckCircle, Clock, Search, FileText, RefreshCw, X } from 'lucide-react'
import { Link } from 'react-router-dom'

const anim = (delay=0): React.CSSProperties => ({ animation:'fadeSlideUp 0.45s ease both', animationDelay:`${delay}ms` })

export function Compliance() {
  const [data, setData] = useState<CaregiverComplianceSummary[]>([])
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<CaregiverComplianceSummary|null>(null)
  const [filterStatus, setFilterStatus] = useState<'all'|'compliant'|'in_progress'|'overdue'>('all')
  const [search, setSearch] = useState('')
  const [sortField, setSortField] = useState<'name'|'status'|'ce_hours'>('name')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')

  useEffect(()=>{ load() },[])

  const load = async () => {
    setLoading(true)
    try { const [c,r]=await Promise.all([complianceService.getAllCaregiversComplianceDetail(),complianceService.getAllRequirements()]); setData(c); setRequirements(r) }
    catch(e){ console.error(e) } finally { setLoading(false) }
  }

  const filtered = data.filter(d => {
    if(filterStatus!=='all'&&d.compliance_status!==filterStatus) return false
    if(search&&!`${d.first_name} ${d.last_name}`.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }).sort((a,b) => {
    let v=0
    if(sortField==='name') v=`${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
    else if(sortField==='ce_hours') v=a.annual_ce_hours_current_year-b.annual_ce_hours_current_year
    else if(sortField==='status') { const o={'overdue':0,'in_progress':1,'compliant':2}; v=o[a.compliance_status]-o[b.compliance_status] }
    return sortDir==='asc'?v:-v
  })

  const handleExport = () => {
    exportToCSV(filtered.map(d=>({'Name':`${d.first_name} ${d.last_name}`,'Email':d.email,'Orientation':d.orientation_complete?'Yes':'No','ANE Training':d.ane_training_complete?'Yes':'No','Annual CE Hours':d.annual_ce_hours_current_year,'Last Review':d.last_compliance_review_date?new Date(d.last_compliance_review_date).toLocaleDateString():'Never','Status':d.compliance_status.replace('_',' ').toUpperCase()})),'texas-hcssa-compliance-report')
  }

  const handleMarkComplete = async (profileId:string, reqId:string) => {
    try { await complianceService.markRequirementComplete(profileId,reqId); await load(); if(selected?.profile_id===profileId) setSelected(await complianceService.getCaregiverComplianceDetail(profileId)) }
    catch(e){ console.error(e) }
  }

  const toggleSort = (f:'name'|'status'|'ce_hours') => { if(sortField===f) setSortDir(d=>d==='asc'?'desc':'asc'); else { setSortField(f); setSortDir('asc') } }

  const stats = { compliant:data.filter(d=>d.compliance_status==='compliant').length, inProgress:data.filter(d=>d.compliance_status==='in_progress').length, overdue:data.filter(d=>d.compliance_status==='overdue').length, total:data.length }

  const StatusPill = ({s}:{s:string}) => {
    const cfg = s==='compliant'?{bg:'#F0FDF4',color:'#16A34A',dot:'#16A34A',label:'Compliant'}:s==='overdue'?{bg:'#FEF2F2',color:'#DC2626',dot:'#DC2626',label:'Overdue'}:{bg:'#FFFBEB',color:'#D97706',dot:'#D97706',label:'In Progress'}
    return <span style={{ display:'inline-flex',alignItems:'center',gap:5,fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,background:cfg.bg,color:cfg.color }}><span style={{ width:6,height:6,borderRadius:'50%',background:cfg.dot,display:'inline-block' }}/>{cfg.label}</span>
  }

  return (
    <MainLayout>
      <style>{`@keyframes fadeSlideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
      <div style={{ maxWidth:1200,margin:'0 auto',padding:32 }}>

        {/* Header */}
        <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:28,...anim() }}>
          <div>
            <h1 style={{ fontSize:26,fontWeight:800,color:'#0F172A',margin:'0 0 4px' }}>Texas HCSSA Compliance</h1>
            <p style={{ fontSize:14,color:'#64748B',margin:0 }}>Track compliance with 26 TAC §558 requirements</p>
          </div>
          <div style={{ display:'flex',gap:10 }}>
            <button onClick={load} disabled={loading} style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'9px 16px',background:'#F1F5F9',color:'#475569',border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer' }}>
              <RefreshCw size={16} style={{ animation:loading?'spin 1s linear infinite':undefined }}/> Refresh
            </button>
            <button onClick={handleExport} style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'9px 16px',background:'#2563EB',color:'white',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer' }}>
              <Download size={16}/> Export CSV
            </button>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:16,marginBottom:24 }}>
          {[
            { label:'Total',       value:stats.total,      color:'#2563EB', bg:'#EFF6FF', icon:<FileText size={20} color="#2563EB"/> },
            { label:'Compliant',   value:stats.compliant,  color:'#16A34A', bg:'#F0FDF4', icon:<CheckCircle size={20} color="#16A34A"/> },
            { label:'In Progress', value:stats.inProgress, color:'#D97706', bg:'#FFFBEB', icon:<Clock size={20} color="#D97706"/> },
            { label:'Overdue',     value:stats.overdue,    color:'#DC2626', bg:'#FEF2F2', icon:<AlertCircle size={20} color="#DC2626"/> },
          ].map((s,i) => (
            <div key={s.label} style={{ background:'white',borderRadius:14,border:'1px solid #F1F5F9',padding:'20px 22px',boxShadow:'0 1px 3px rgba(0,0,0,0.05)',...anim(i*60) }}>
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

        {/* Framework link */}
        <div style={{ background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:14,padding:'16px 20px',marginBottom:20,display:'flex',alignItems:'center',justifyContent:'space-between',...anim(240) }}>
          <div style={{ display:'flex',alignItems:'center',gap:12 }}>
            <div style={{ width:40,height:40,background:'white',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 1px 4px rgba(0,0,0,0.08)' }}><FileText size={20} color="#2563EB"/></div>
            <div>
              <p style={{ fontSize:15,fontWeight:700,color:'#0F172A',margin:'0 0 2px' }}>Compliance Requirements Framework</p>
              <p style={{ fontSize:13,color:'#64748B',margin:0 }}>View all Texas HCSSA regulations and requirements</p>
            </div>
          </div>
          <Link to="/compliance-framework" style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'9px 16px',background:'#2563EB',color:'white',borderRadius:10,fontSize:14,fontWeight:600,textDecoration:'none' }}>View Framework</Link>
        </div>

        {/* Filters */}
        <div style={{ background:'white',borderRadius:14,border:'1px solid #F1F5F9',padding:'14px 20px',marginBottom:20,display:'flex',alignItems:'center',justifyContent:'space-between',gap:16,...anim(300) }}>
          <div style={{ display:'flex',gap:8 }}>
            {(['all','compliant','in_progress','overdue'] as const).map(s=>(
              <button key={s} onClick={()=>setFilterStatus(s)} style={{ padding:'7px 14px',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',border:'none',background:filterStatus===s?'#2563EB':'#F1F5F9',color:filterStatus===s?'white':'#475569',transition:'all 0.15s' }}>
                {s==='all'?'All':s==='in_progress'?'In Progress':s.charAt(0).toUpperCase()+s.slice(1)}
              </button>
            ))}
          </div>
          <div style={{ position:'relative',width:220 }}>
            <Search size={15} style={{ position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'#94A3B8',pointerEvents:'none' }}/>
            <input type="text" placeholder="Search caregivers…" value={search} onChange={e=>setSearch(e.target.value)} style={{ width:'100%',padding:'8px 12px 8px 32px',border:'1px solid #E2E8F0',borderRadius:8,fontSize:13,outline:'none' }}/>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            {[1,2,3,4].map(i=><div key={i} style={{ height:52,borderRadius:10,background:'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)',backgroundSize:'200% 100%',animation:`shimmer 1.5s ease ${i*0.1}s infinite` }}/>)}
          </div>
        ) : (
          <div style={{ background:'white',borderRadius:14,border:'1px solid #F1F5F9',overflow:'hidden',...anim(360) }}>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%',borderCollapse:'collapse' }}>
                <thead style={{ background:'#F8FAFC',borderBottom:'1px solid #F1F5F9' }}>
                  <tr>
                    <th style={{ padding:'12px 16px',textAlign:'left' }}><button onClick={()=>toggleSort('name')} style={{ background:'none',border:'none',cursor:'pointer',fontSize:11,fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'0.06em' }}>Name {sortField==='name'&&(sortDir==='asc'?'↑':'↓')}</button></th>
                    {['Orientation','ANE Training'].map(h=><th key={h} style={{ padding:'12px 16px',textAlign:'center',fontSize:11,fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'0.06em' }}>{h}</th>)}
                    <th style={{ padding:'12px 16px',textAlign:'center' }}><button onClick={()=>toggleSort('ce_hours')} style={{ background:'none',border:'none',cursor:'pointer',fontSize:11,fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'0.06em' }}>CE Hours {sortField==='ce_hours'&&(sortDir==='asc'?'↑':'↓')}</button></th>
                    <th style={{ padding:'12px 16px',textAlign:'left',fontSize:11,fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'0.06em' }}>Last Review</th>
                    <th style={{ padding:'12px 16px',textAlign:'center' }}><button onClick={()=>toggleSort('status')} style={{ background:'none',border:'none',cursor:'pointer',fontSize:11,fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'0.06em' }}>Status {sortField==='status'&&(sortDir==='asc'?'↑':'↓')}</button></th>
                    <th style={{ padding:'12px 16px',textAlign:'center',fontSize:11,fontWeight:700,color:'#94A3B8',textTransform:'uppercase',letterSpacing:'0.06em' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => (
                    <tr key={item.profile_id} style={{ borderBottom:'1px solid #F8FAFC',transition:'background 0.1s' }}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#FAFBFC'}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}>
                      <td style={{ padding:'14px 16px' }}>
                        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                          <div style={{ width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#1E3A5F,#2563EB)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:11,fontWeight:700,flexShrink:0 }}>
                            {item.first_name[0]}{item.last_name[0]}
                          </div>
                          <div>
                            <div style={{ fontSize:14,fontWeight:600,color:'#0F172A' }}>{item.first_name} {item.last_name}</div>
                            <div style={{ fontSize:12,color:'#94A3B8' }}>{item.email}</div>
                          </div>
                        </div>
                      </td>
                      {[item.orientation_complete,item.ane_training_complete].map((ok,j)=>(
                        <td key={j} style={{ padding:'14px 16px',textAlign:'center' }}>
                          {ok ? <CheckCircle size={18} color="#16A34A"/> : <AlertCircle size={18} color="#D97706"/>}
                        </td>
                      ))}
                      <td style={{ padding:'14px 16px',textAlign:'center' }}>
                        <div style={{ display:'inline-flex',alignItems:'center',gap:6 }}>
                          <div style={{ width:80,height:6,background:'#F1F5F9',borderRadius:3,overflow:'hidden' }}>
                            <div style={{ height:'100%',background:'#2563EB',borderRadius:3,width:`${Math.min((item.annual_ce_hours_current_year/12)*100,100)}%`,transition:'width 0.5s' }}/>
                          </div>
                          <span style={{ fontSize:13,fontWeight:600,color:'#0F172A' }}>{item.annual_ce_hours_current_year}/12</span>
                        </div>
                      </td>
                      <td style={{ padding:'14px 16px',fontSize:13,color:'#64748B' }}>{item.last_compliance_review_date?new Date(item.last_compliance_review_date).toLocaleDateString():'Never'}</td>
                      <td style={{ padding:'14px 16px',textAlign:'center' }}><StatusPill s={item.compliance_status}/></td>
                      <td style={{ padding:'14px 16px',textAlign:'center' }}>
                        <button onClick={()=>setSelected(item)} style={{ padding:'6px 14px',background:'#EFF6FF',color:'#2563EB',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',transition:'background 0.15s' }}
                          onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#DBEAFE'}
                          onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='#EFF6FF'}>
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length===0 && <div style={{ textAlign:'center',padding:'48px 0',color:'#94A3B8',fontSize:14 }}>No caregivers match selected filters</div>}
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',padding:16,zIndex:50 }}>
          <div style={{ background:'white',borderRadius:18,maxWidth:640,width:'100%',maxHeight:'90vh',overflowY:'auto',boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ padding:'20px 24px',borderBottom:'1px solid #F1F5F9',display:'flex',alignItems:'flex-start',justifyContent:'space-between',position:'sticky',top:0,background:'white' }}>
              <div>
                <h2 style={{ fontSize:18,fontWeight:800,color:'#0F172A',margin:'0 0 2px' }}>{selected.first_name} {selected.last_name}</h2>
                <p style={{ fontSize:13,color:'#64748B',margin:0 }}>{selected.email}</p>
              </div>
              <button onClick={()=>setSelected(null)} style={{ width:32,height:32,background:'#F1F5F9',border:'none',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer' }}><X size={16} color="#64748B"/></button>
            </div>
            <div style={{ padding:24 }}>
              <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:24 }}>
                {[
                  { label:'Orientation', value:selected.orientation_complete?'Complete':'Incomplete', ok:selected.orientation_complete },
                  { label:'ANE Training', value:selected.ane_training_complete?'Complete':'Incomplete', ok:selected.ane_training_complete },
                  { label:'Annual CE Hours', value:`${selected.annual_ce_hours_current_year}/12`, ok:selected.annual_ce_hours_current_year>=12 },
                  { label:'Overall Status', value:selected.compliance_status.replace('_',' '), ok:selected.compliance_status==='compliant' },
                ].map(({label,value,ok})=>(
                  <div key={label} style={{ background:'#F8FAFC',borderRadius:12,padding:'14px 16px' }}>
                    <p style={{ fontSize:12,color:'#94A3B8',margin:'0 0 4px' }}>{label}</p>
                    <p style={{ fontSize:15,fontWeight:700,color:ok?'#16A34A':'#D97706',margin:0,textTransform:'capitalize' }}>{value}</p>
                  </div>
                ))}
              </div>
              <h3 style={{ fontSize:15,fontWeight:700,color:'#0F172A',marginBottom:12 }}>Requirements</h3>
              <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                {selected.requirements.map(rs=>{
                  const req = rs.requirement as ComplianceRequirement
                  return (
                    <div key={rs.id} style={{ border:'1px solid #F1F5F9',borderRadius:12,padding:'14px 16px' }}>
                      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between' }}>
                        <div style={{ flex:1 }}>
                          <p style={{ fontSize:14,fontWeight:700,color:'#0F172A',margin:'0 0 2px' }}>{req.requirement_name}</p>
                          <p style={{ fontSize:12,color:'#94A3B8',margin:0 }}>{req.regulation_reference}</p>
                        </div>
                        {rs.is_complete ? <CheckCircle size={20} color="#16A34A"/> : (
                          <button onClick={()=>handleMarkComplete(selected.profile_id,req.id)} style={{ padding:'6px 14px',background:'#2563EB',color:'white',border:'none',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer' }}>Mark Complete</button>
                        )}
                      </div>
                      {rs.completion_date && <p style={{ fontSize:12,color:'#64748B',margin:'8px 0 0' }}>Completed: {new Date(rs.completion_date).toLocaleDateString()}</p>}
                    </div>
                  )
                })}
              </div>
              <div style={{ marginTop:20,textAlign:'right' }}>
                <Link to={`/caregivers/${selected.profile_id}`} style={{ display:'inline-flex',alignItems:'center',gap:8,padding:'9px 18px',background:'#2563EB',color:'white',borderRadius:10,fontSize:14,fontWeight:600,textDecoration:'none' }}>View Full Profile</Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
