import React, { useEffect, useState } from 'react'
import { MainLayout } from '../components/MainLayout'
import { CourseCompletionModal } from '../components/CourseCompletionModal'
import { courseService } from '../services/courses'
import { useAuth } from '../contexts/AuthContext'
import type { CourseAssignment } from '../types'
import { BookOpen, Clock, Calendar, ExternalLink, CheckCircle, Play, Upload } from 'lucide-react'

export function MyCourses() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<CourseAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<CourseAssignment|null>(null)
  const [filter, setFilter] = useState<'all'|'pending'|'in_progress'|'completed'>('all')

  useEffect(()=>{ loadAssignments() },[])

  const loadAssignments = async () => {
    try { if(!user?.id) return; setAssignments(await courseService.getCaregiverAssignments(user.id)) }
    catch(e){ console.error(e) } finally { setLoading(false) }
  }

  const handleStart = async (a: CourseAssignment) => {
    try { await courseService.startCourse(a.id); setAssignments(assignments.map(x=>x.id===a.id?{...x,status:'in_progress'}:x)); if(a.course?.external_url) window.open(a.course.external_url,'_blank') }
    catch(e){ console.error(e) }
  }

  const getDays = (d:string) => Math.ceil((new Date(d).getTime()-Date.now())/(1000*60*60*24))
  const getDueText = (d:string, status?:string) => {
    if(status==='completed') return `Completed ${new Date(d).toLocaleDateString()}`
    const days=getDays(d)
    if(days<0) return `Overdue by ${Math.abs(days)} days`
    if(days===0) return 'Due today'
    if(days===1) return 'Due tomorrow'
    if(days<=7) return `Due in ${days} days`
    return `Due ${new Date(d).toLocaleDateString()}`
  }
  const getDueColor = (d:string,status?:string) => { if(status==='completed') return '#16A34A'; const days=getDays(d); if(days<0) return '#DC2626'; if(days<=7) return '#D97706'; return '#64748B' }

  const filtered = assignments.filter(a => {
    if(filter==='all') return true
    if(filter==='pending') return !a.status||a.status==='not_started'
    return a.status===filter
  })

  const counts = { all:assignments.length, pending:assignments.filter(a=>!a.status||a.status==='not_started').length, in_progress:assignments.filter(a=>a.status==='in_progress').length, completed:assignments.filter(a=>a.status==='completed').length }

  const statusStyle = (s?:string): React.CSSProperties => ({
    display:'inline-flex',alignItems:'center',gap:5,fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:20,
    background: s==='completed'?'#F0FDF4':s==='in_progress'?'#EFF6FF':'#F1F5F9',
    color: s==='completed'?'#16A34A':s==='in_progress'?'#2563EB':'#64748B',
  })

  return (
    <MainLayout>
      <style>{`@keyframes fadeSlideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
      <div style={{ maxWidth:1200,margin:'0 auto',padding:32 }}>

        <div style={{ marginBottom:28,animation:'fadeSlideUp 0.4s ease both' }}>
          <h1 style={{ fontSize:26,fontWeight:800,color:'#0F172A',margin:'0 0 4px' }}>My Courses</h1>
          <p style={{ fontSize:14,color:'#64748B',margin:0 }}>Your assigned training courses</p>
        </div>

        {/* Filter tabs */}
        <div style={{ display:'flex',gap:8,marginBottom:24,animation:'fadeSlideUp 0.4s ease both',animationDelay:'60ms' }}>
          {([['all','All'],['pending','Not Started'],['in_progress','In Progress'],['completed','Completed']] as const).map(([k,label])=>(
            <button key={k} onClick={()=>setFilter(k)} style={{ padding:'7px 16px',borderRadius:8,fontSize:13,fontWeight:600,cursor:'pointer',border:'none',transition:'all 0.15s',background:filter===k?'#2563EB':'#F1F5F9',color:filter===k?'white':'#475569' }}>
              {label} ({counts[k]})
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            {[1,2,3].map(i=><div key={i} style={{ height:120,borderRadius:14,background:'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)',backgroundSize:'200% 100%',animation:`shimmer 1.5s ease ${i*0.1}s infinite` }}/>)}
          </div>
        ) : filtered.length===0 ? (
          <div style={{ textAlign:'center',padding:'56px 0',background:'white',borderRadius:14,border:'1px solid #F1F5F9' }}>
            <BookOpen size={40} color="#CBD5E1" style={{ marginBottom:12 }}/>
            <h3 style={{ fontSize:16,fontWeight:700,color:'#0F172A',marginBottom:6 }}>{filter==='all'?'No courses assigned yet':`No ${filter.replace('_',' ')} courses`}</h3>
            <p style={{ fontSize:14,color:'#64748B' }}>Your assigned courses will appear here</p>
          </div>
        ) : (
          <div style={{ display:'flex',flexDirection:'column',gap:12 }}>
            {filtered.map((a,i) => {
              const done = a.status==='completed'
              const inProg = a.status==='in_progress'
              return (
                <div key={a.id} style={{ background:'white',borderRadius:14,border:'1px solid #F1F5F9',padding:'20px 24px',display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:20,boxShadow:'0 1px 3px rgba(0,0,0,0.04)',animation:'fadeSlideUp 0.4s ease both',animationDelay:`${i*40}ms` }}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex',alignItems:'flex-start',gap:12,marginBottom:10 }}>
                      <div style={{ width:40,height:40,background:'#EFF6FF',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                        <BookOpen size={20} color="#2563EB"/>
                      </div>
                      <div>
                        <h3 style={{ fontSize:16,fontWeight:700,color:'#0F172A',margin:'0 0 6px' }}>{a.course?.title}</h3>
                        <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
                          <span style={statusStyle(a.status)}>{done?'Completed':inProg?'In Progress':'Not Started'}</span>
                          {a.course?.category && <span style={{ ...statusStyle(),background:'#EFF6FF',color:'#2563EB' }}>{a.course.category}</span>}
                          {a.course?.is_required && <span style={{ ...statusStyle(),background:'#FEF2F2',color:'#DC2626' }}>Required</span>}
                        </div>
                      </div>
                    </div>
                    {a.course?.description && <p style={{ fontSize:13,color:'#64748B',margin:'0 0 10px 52px' }}>{a.course.description}</p>}
                    <div style={{ display:'flex',flexWrap:'wrap',gap:16,marginLeft:52 }}>
                      {a.course?.estimated_duration_minutes && <span style={{ display:'flex',alignItems:'center',gap:5,fontSize:13,color:'#94A3B8' }}><Clock size={13}/>{a.course.estimated_duration_minutes} min</span>}
                      {a.course?.ce_hours && a.course.ce_hours>0 && <span style={{ display:'flex',alignItems:'center',gap:5,fontSize:13,color:'#94A3B8' }}><CheckCircle size={13}/>{a.course.ce_hours} CE hrs</span>}
                      <span style={{ display:'flex',alignItems:'center',gap:5,fontSize:13,fontWeight:600,color:getDueColor(done&&a.completion_date?a.completion_date:a.due_date,a.status) }}>
                        <Calendar size={13}/>{getDueText(done&&a.completion_date?a.completion_date:a.due_date,a.status)}
                      </span>
                    </div>
                  </div>
                  <div style={{ display:'flex',flexDirection:'column',gap:8,minWidth:160 }}>
                    {done ? (
                      <>
                        <button disabled style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'9px 16px',background:'#F0FDF4',color:'#16A34A',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'not-allowed' }}>
                          <CheckCircle size={16}/> Completed
                        </button>
                        {a.certificate_url && (
                          <a href={a.certificate_url} target="_blank" rel="noopener noreferrer" style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'9px 16px',background:'#EFF6FF',color:'#2563EB',border:'none',borderRadius:10,fontSize:14,fontWeight:600,textDecoration:'none' }}>
                            <ExternalLink size={16}/> Certificate
                          </a>
                        )}
                      </>
                    ) : inProg ? (
                      <>
                        <button onClick={()=>a.course?.external_url&&window.open(a.course.external_url,'_blank')} style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'9px 16px',background:'#EFF6FF',color:'#2563EB',border:'none',borderRadius:10,fontSize:14,fontWeight:600,cursor:'pointer' }}>
                          <ExternalLink size={16}/> Continue
                        </button>
                        <button onClick={()=>setSelected(a)} style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'9px 16px',background:'#2563EB',color:'white',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer' }}>
                          <Upload size={16}/> Mark Complete
                        </button>
                      </>
                    ) : (
                      <button onClick={()=>handleStart(a)} style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'9px 16px',background:'#2563EB',color:'white',border:'none',borderRadius:10,fontSize:14,fontWeight:700,cursor:'pointer' }}>
                        <Play size={16}/> Start Course
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {selected && user && (
        <CourseCompletionModal assignment={selected} caregiverId={user.id} onClose={()=>setSelected(null)} onCompleted={loadAssignments}/>
      )}
    </MainLayout>
  )
}
