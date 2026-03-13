import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { MainLayout } from '../components/MainLayout'
import { courseService } from '../services/courses'
import type { Course, CourseAssignment } from '../types'
import { Plus, Edit2, Trash2, AlertCircle, Clock, ExternalLink, ArrowLeft, BookOpen, Search } from 'lucide-react'

const S: React.CSSProperties = { animation:'fadeSlideUp 0.45s ease both' }

export function Courses() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<CourseAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string|null>(null)
  const [filterView, setFilterView] = useState<'all'|'due_soon'|'overdue'>('all')
  const [search, setSearch] = useState('')
  const blank: Partial<Course> = { title:'', description:'', category:'', estimated_duration_minutes:60, delivery_format:'external_link', source_provider:'', external_url:'', compliance_tag:'', regulation_reference:'', is_required:false, ce_hours:0, is_active:true }
  const [formData, setFormData] = useState<Partial<Course>>(blank)

  useEffect(() => {
    loadCourses(); loadAssignments()
    const f = searchParams.get('filter')
    if (f === 'due_soon' || f === 'overdue') setFilterView(f)
  }, [searchParams])

  const loadCourses = async () => { try { setCourses(await courseService.getCourses()) } catch(e){ console.error(e) } finally { setLoading(false) } }
  const loadAssignments = async () => { try { setAssignments(await courseService.getAllAssignments()) } catch(e){ console.error(e) } }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) { const u = await courseService.updateCourse(editingId, formData); setCourses(courses.map(c=>c.id===editingId?u:c)); setEditingId(null) }
      else { const c = await courseService.createCourse(formData as any); setCourses([...courses,c]) }
      setFormData(blank); setShowForm(false)
    } catch(e){ console.error(e) }
  }
  const handleDelete = async (id: string) => { if(!confirm('Deactivate this course?')) return; try { await courseService.deleteCourse(id); setCourses(courses.filter(c=>c.id!==id)) } catch(e){console.error(e)} }
  const handleEdit = (c: Course) => { setFormData(c); setEditingId(c.id); setShowForm(true) }

  const now = new Date()
  const soon = new Date(now.getTime()+30*24*60*60*1000)
  const getDueSoon = () => assignments.filter(a=>{ const d=new Date(a.due_date); return d>=now&&d<=soon })
  const getOverdue = () => assignments.filter(a=>new Date(a.due_date)<now)
  const displayAssignments = filterView==='due_soon'?getDueSoon():filterView==='overdue'?getOverdue():[]
  const filteredCourses = courses.filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase()))

  const inputS: React.CSSProperties = { width:'100%', padding:'9px 12px', border:'1px solid #E2E8F0', borderRadius:10, fontSize:14, outline:'none' }
  const labelS: React.CSSProperties = { display:'block', fontSize:13, fontWeight:600, color:'#475569', marginBottom:6 }

  return (
    <MainLayout>
      <style>{`@keyframes fadeSlideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ maxWidth:1200, margin:'0 auto', padding:32 }}>

        {/* Filter views */}
        {filterView !== 'all' && (
          <div style={S}>
            <Link to="/dashboard" style={{ display:'inline-flex', alignItems:'center', gap:6, color:'#2563EB', fontWeight:600, fontSize:14, textDecoration:'none', marginBottom:16 }}>
              <ArrowLeft size={16}/> Back to Dashboard
            </Link>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:44, height:44, borderRadius:12, background: filterView==='overdue'?'#FEF2F2':'#FFFBEB', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {filterView==='overdue' ? <AlertCircle size={22} color="#DC2626"/> : <Clock size={22} color="#D97706"/>}
                </div>
                <div>
                  <h1 style={{ fontSize:22, fontWeight:800, color:'#0F172A', margin:0 }}>{filterView==='overdue'?'Overdue Assignments':'Due Soon'}</h1>
                  <p style={{ fontSize:14, color:'#64748B', margin:0 }}>{filterView==='due_soon'?'Due within 30 days':'Past their due date'}</p>
                </div>
              </div>
              <button onClick={()=>{setFilterView('all');setSearchParams({})}} style={{ padding:'8px 16px', background:'#EFF6FF', color:'#2563EB', border:'none', borderRadius:8, fontSize:14, fontWeight:600, cursor:'pointer' }}>
                View All Courses
              </button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {displayAssignments.length===0 ? (
                <div style={{ textAlign:'center', padding:'48px 0', background:'white', borderRadius:14, border:'1px solid #F1F5F9' }}>
                  <p style={{ color:'#94A3B8', fontSize:14 }}>{filterView==='due_soon'?'No assignments due soon':'No overdue assignments'}</p>
                </div>
              ) : displayAssignments.map(a => (
                <div key={a.id} style={{ background:'white', borderRadius:14, border:`1px solid ${filterView==='overdue'?'#FECACA':'#FDE68A'}`, padding:'16px 20px', display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                      <span style={{ fontSize:15, fontWeight:700, color:'#0F172A' }}>{a.course?.title}</span>
                      <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background: filterView==='overdue'?'#FEF2F2':'#FFFBEB', color: filterView==='overdue'?'#B91C1C':'#B45309' }}>
                        {filterView==='overdue'?<AlertCircle size={11}/>:<Clock size={11}/>}
                        {filterView==='overdue'?'Overdue':'Due Soon'}
                      </span>
                    </div>
                    <p style={{ fontSize:13, color:'#64748B', margin:'0 0 4px' }}>Caregiver: {a.caregiver?.first_name} {a.caregiver?.last_name}</p>
                    <p style={{ fontSize:13, fontWeight:600, color: filterView==='overdue'?'#B91C1C':'#B45309', margin:0 }}>Due: {new Date(a.due_date).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All courses view */}
        {filterView === 'all' && (<>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:28, ...S }}>
            <div>
              <h1 style={{ fontSize:26, fontWeight:800, color:'#0F172A', margin:'0 0 4px' }}>Course Catalog</h1>
              <p style={{ fontSize:14, color:'#64748B', margin:0 }}>Manage and organize your training courses</p>
            </div>
            <button onClick={()=>{setEditingId(null);setFormData(blank);setShowForm(true)}} style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 18px', background:'#2563EB', color:'white', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer' }}>
              <Plus size={18}/> Add Course
            </button>
          </div>

          {/* Search */}
          <div style={{ position:'relative', marginBottom:20, ...S, animationDelay:'60ms' }}>
            <Search size={16} style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', color:'#94A3B8', pointerEvents:'none' }}/>
            <input type="text" placeholder="Search courses…" value={search} onChange={e=>setSearch(e.target.value)}
              style={{ ...inputS, paddingLeft:38 }}/>
          </div>

          {/* Add/Edit form */}
          {showForm && (
            <div style={{ background:'white', borderRadius:16, border:'1px solid #F1F5F9', padding:24, marginBottom:24, boxShadow:'0 4px 16px rgba(0,0,0,0.06)', ...S }}>
              <h2 style={{ fontSize:18, fontWeight:800, color:'#0F172A', margin:'0 0 20px' }}>{editingId?'Edit Course':'Add New Course'}</h2>
              <form onSubmit={handleSubmit}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                  <div><label style={labelS}>Course Title *</label><input type="text" value={formData.title||''} onChange={e=>setFormData({...formData,title:e.target.value})} style={inputS} required/></div>
                  <div><label style={labelS}>Category *</label><input type="text" value={formData.category||''} onChange={e=>setFormData({...formData,category:e.target.value})} style={inputS} placeholder="e.g. Safety Training" required/></div>
                </div>
                <div style={{ marginBottom:16 }}><label style={labelS}>Description</label><textarea value={formData.description||''} onChange={e=>setFormData({...formData,description:e.target.value})} style={{...inputS,resize:'vertical'}} rows={3}/></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                  <div><label style={labelS}>Delivery Format</label>
                    <select value={formData.delivery_format||'external_link'} onChange={e=>setFormData({...formData,delivery_format:e.target.value as any})} style={inputS}>
                      <option value="external_link">External Link</option>
                      <option value="embedded_video">Embedded Video</option>
                      <option value="pdf">PDF</option>
                    </select>
                  </div>
                  <div><label style={labelS}>Duration (min)</label><input type="number" value={formData.estimated_duration_minutes||60} onChange={e=>setFormData({...formData,estimated_duration_minutes:parseInt(e.target.value)})} style={inputS}/></div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                  <div><label style={labelS}>Source / Provider</label><input type="text" value={formData.source_provider||''} onChange={e=>setFormData({...formData,source_provider:e.target.value})} style={inputS} placeholder="e.g. Texas HHS"/></div>
                  <div><label style={labelS}>CE Hours</label><input type="number" step="0.5" value={formData.ce_hours||0} onChange={e=>setFormData({...formData,ce_hours:parseFloat(e.target.value)})} style={inputS}/></div>
                </div>
                <div style={{ marginBottom:16 }}><label style={labelS}>External URL</label><input type="url" value={formData.external_url||''} onChange={e=>setFormData({...formData,external_url:e.target.value})} style={inputS} placeholder="https://"/></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
                  <div><label style={labelS}>Compliance Tag</label><input type="text" value={formData.compliance_tag||''} onChange={e=>setFormData({...formData,compliance_tag:e.target.value})} style={inputS} placeholder="e.g. 26 TAC §558"/></div>
                  <div><label style={labelS}>Regulation Ref</label><input type="text" value={formData.regulation_reference||''} onChange={e=>setFormData({...formData,regulation_reference:e.target.value})} style={inputS}/></div>
                </div>
                <div style={{ display:'flex', gap:20, marginBottom:20 }}>
                  {[{key:'is_required',label:'Required by HCSSA'},{key:'is_active',label:'Active'}].map(({key,label})=>(
                    <label key={key} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:14, color:'#475569', fontWeight:500 }}>
                      <input type="checkbox" checked={(formData as any)[key]??false} onChange={e=>setFormData({...formData,[key]:e.target.checked})} style={{ width:16, height:16 }}/>{label}
                    </label>
                  ))}
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button type="submit" style={{ padding:'9px 20px', background:'#2563EB', color:'white', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer' }}>{editingId?'Update':'Add Course'}</button>
                  <button type="button" onClick={()=>setShowForm(false)} style={{ padding:'9px 20px', background:'#F1F5F9', color:'#475569', border:'none', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer' }}>Cancel</button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              {[1,2,3].map(i=><div key={i} style={{ height:90, borderRadius:14, background:'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)', backgroundSize:'200% 100%', animation:`shimmer 1.5s ease ${i*0.1}s infinite` }}/>)}
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {filteredCourses.map((c,i) => (
                <div key={c.id} style={{ background:'white', borderRadius:14, border:'1px solid #F1F5F9', padding:'18px 20px', display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, boxShadow:'0 1px 3px rgba(0,0,0,0.04)', transition:'box-shadow 0.2s', animation:'fadeSlideUp 0.4s ease both', animationDelay:`${i*40}ms` }}
                  onMouseEnter={e=>(e.currentTarget as HTMLElement).style.boxShadow='0 4px 16px rgba(0,0,0,0.08)'}
                  onMouseLeave={e=>(e.currentTarget as HTMLElement).style.boxShadow='0 1px 3px rgba(0,0,0,0.04)'}>
                  <div style={{ flex:1 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
                      <div style={{ width:36, height:36, background:'#EFF6FF', borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <BookOpen size={17} color="#2563EB"/>
                      </div>
                      <h3 style={{ fontSize:15, fontWeight:700, color:'#0F172A', margin:0 }}>{c.title}</h3>
                    </div>
                    {c.description && <p style={{ fontSize:13, color:'#64748B', margin:'0 0 8px 46px' }}>{c.description}</p>}
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginLeft:46 }}>
                      <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:'#EFF6FF', color:'#2563EB' }}>{c.category}</span>
                      {c.compliance_tag && <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:'#F0FDF4', color:'#16A34A' }}>{c.compliance_tag}</span>}
                      {c.is_required && <span style={{ fontSize:11, fontWeight:700, padding:'3px 10px', borderRadius:20, background:'#FEF2F2', color:'#DC2626' }}>Required</span>}
                      <span style={{ fontSize:11, color:'#94A3B8', display:'flex', alignItems:'center', gap:4 }}>
                        <Clock size={11}/> {c.estimated_duration_minutes}m
                        {c.source_provider && ` · ${c.source_provider}`}
                        {c.ce_hours ? ` · ${c.ce_hours} CE hrs` : ''}
                      </span>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    {c.external_url && (
                      <button onClick={()=>window.open(c.external_url,'_blank')} title="View" style={{ width:36, height:36, background:'#F1F5F9', border:'none', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'background 0.15s' }}
                        onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#E2E8F0'}
                        onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='#F1F5F9'}>
                        <ExternalLink size={15} color="#475569"/>
                      </button>
                    )}
                    <button onClick={()=>handleEdit(c)} title="Edit" style={{ width:36, height:36, background:'#EFF6FF', border:'none', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'background 0.15s' }}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#DBEAFE'}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='#EFF6FF'}>
                      <Edit2 size={15} color="#2563EB"/>
                    </button>
                    <button onClick={()=>handleDelete(c.id)} title="Delete" style={{ width:36, height:36, background:'#FEF2F2', border:'none', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', transition:'background 0.15s' }}
                      onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='#FEE2E2'}
                      onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='#FEF2F2'}>
                      <Trash2 size={15} color="#DC2626"/>
                    </button>
                  </div>
                </div>
              ))}
              {filteredCourses.length===0 && !showForm && (
                <div style={{ textAlign:'center', padding:'56px 0', background:'white', borderRadius:14, border:'1px solid #F1F5F9' }}>
                  <BookOpen size={40} color="#CBD5E1" style={{ marginBottom:12 }}/>
                  <p style={{ fontSize:15, color:'#64748B', marginBottom:16 }}>No courses yet. Add your first course to get started.</p>
                  <button onClick={()=>setShowForm(true)} style={{ padding:'9px 20px', background:'#2563EB', color:'white', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer' }}>Create First Course</button>
                </div>
              )}
            </div>
          )}
        </>)}
      </div>
    </MainLayout>
  )
}
