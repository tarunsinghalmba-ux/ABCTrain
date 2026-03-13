import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, User, LayoutDashboard, BookOpen, FolderTree, Users, ClipboardCheck, Settings, Menu, X } from 'lucide-react'

export function Sidebar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleSignOut = async () => { await signOut(); navigate('/login') }

  const isAdmin    = profile?.role === 'admin' || profile?.role === 'manager'
  const isCaregiver = profile?.role === 'caregiver'
  const isStrictAdmin = profile?.role === 'admin'

  const initials = `${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}`.toUpperCase()

  const NavLink = ({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) => {
    const active = location.pathname === to
    return (
      <Link to={to} onClick={() => setMobileOpen(false)} style={{
        display:'flex', alignItems:'center', gap:12, padding:'10px 12px',
        borderRadius:10, textDecoration:'none', transition:'all 0.15s',
        background: active ? '#2563EB' : 'transparent',
        color: active ? 'white' : '#475569',
        fontWeight: active ? 600 : 500,
        fontSize: 14,
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#F1F5F9' }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
      >
        <Icon size={18} />
        <span>{label}</span>
      </Link>
    )
  }

  const sidebar = (
    <aside style={{
      width:240, background:'white', borderRight:'1px solid #F1F5F9',
      display:'flex', flexDirection:'column', height:'100%',
      boxShadow:'2px 0 8px rgba(0,0,0,0.03)',
    }}>
      {/* Logo */}
      <div style={{ padding:'24px 20px', borderBottom:'1px solid #F8FAFC' }}>
        <Link to="/dashboard" style={{ display:'flex', alignItems:'center', gap:12, textDecoration:'none' }}>
          <div style={{
            width:38, height:38, background:'linear-gradient(135deg,#1E3A5F,#2563EB)',
            borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center',
            color:'white', fontWeight:800, fontSize:16,
          }}>P</div>
          <div>
            <div style={{ fontWeight:800, fontSize:15, color:'#0F172A' }}>PAS Training</div>
            <div style={{ fontSize:11, color:'#94A3B8', fontWeight:500 }}>Learning Management</div>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'16px 12px', display:'flex', flexDirection:'column', gap:2, overflowY:'auto' }}>
        <NavLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
        {isAdmin && <>
          <NavLink to="/courses"        icon={BookOpen}      label="Courses" />
          <NavLink to="/learning-paths" icon={FolderTree}    label="Learning Paths" />
          <NavLink to="/caregivers"     icon={Users}         label="Caregivers" />
          <NavLink to="/compliance"     icon={ClipboardCheck}label="Compliance" />
        </>}
        {isStrictAdmin && <NavLink to="/admin-management" icon={Settings} label="User Management" />}
        {isCaregiver   && <NavLink to="/my-courses"       icon={BookOpen} label="My Courses" />}
      </nav>

      {/* User footer */}
      <div style={{ padding:'12px', borderTop:'1px solid #F8FAFC' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'#F8FAFC', borderRadius:10, marginBottom:8 }}>
          <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#1E3A5F,#2563EB)', display:'flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:12, fontWeight:700, flexShrink:0 }}>
            {initials || 'U'}
          </div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:700, color:'#0F172A', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{profile?.first_name} {profile?.last_name}</div>
            <div style={{ fontSize:11, color:'#94A3B8', textTransform:'capitalize' }}>{profile?.role}</div>
          </div>
        </div>
        <Link to="/profile" style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, textDecoration:'none', color:'#475569', fontSize:13, fontWeight:500, transition:'background 0.15s' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='#F1F5F9'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='transparent'}>
          <User size={16} /> Profile
        </Link>
        <button onClick={handleSignOut} style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:8, background:'transparent', border:'none', color:'#DC2626', fontSize:13, fontWeight:500, cursor:'pointer', transition:'background 0.15s' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background='#FEF2F2'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background='transparent'}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button className="lg:hidden" onClick={() => setMobileOpen(!mobileOpen)} style={{ position:'fixed', top:16, left:16, zIndex:50, padding:8, background:'white', borderRadius:8, border:'1px solid #F1F5F9', boxShadow:'0 2px 8px rgba(0,0,0,0.1)', cursor:'pointer' }}>
        {mobileOpen ? <X size={22} color="#0F172A" /> : <Menu size={22} color="#0F172A" />}
      </button>

      {/* Desktop */}
      <div className="hidden lg:flex" style={{ height:'100%' }}>{sidebar}</div>

      {/* Mobile */}
      {mobileOpen && (
        <>
          <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:40 }} onClick={() => setMobileOpen(false)} />
          <div style={{ position:'fixed', top:0, left:0, bottom:0, zIndex:50 }}>{sidebar}</div>
        </>
      )}
    </>
  )
}
