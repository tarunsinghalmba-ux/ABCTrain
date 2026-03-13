import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function Signup() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [role, setRole] = useState<'admin'|'manager'|'caregiver'>('caregiver')
  const [organization, setOrganization] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await signUp(email, password, firstName, lastName, role, organization || undefined); navigate('/dashboard') }
    catch (err: any) { setError(err.message || 'Failed to sign up') }
    finally { setLoading(false) }
  }

  const inputStyle: React.CSSProperties = { width:'100%', padding:'10px 14px', border:'1px solid #E2E8F0', borderRadius:10, fontSize:14, color:'#0F172A', outline:'none', transition:'border-color 0.15s, box-shadow 0.15s', boxSizing:'border-box' }
  const focusStyle = (e: React.FocusEvent<HTMLInputElement|HTMLSelectElement>) => { e.target.style.borderColor='#2563EB'; e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,0.1)' }
  const blurStyle  = (e: React.FocusEvent<HTMLInputElement|HTMLSelectElement>) => { e.target.style.borderColor='#E2E8F0'; e.target.style.boxShadow='none' }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#F8FAFC 0%,#EFF6FF 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <style>{`@keyframes fadeSlideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ width:'100%', maxWidth:440, animation:'fadeSlideUp 0.4s ease both' }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:52, height:52, background:'linear-gradient(135deg,#1E3A5F,#2563EB)', borderRadius:14, display:'inline-flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:22, fontWeight:800, marginBottom:14 }}>P</div>
          <h1 style={{ fontSize:24, fontWeight:800, color:'#0F172A', margin:'0 0 4px' }}>Create Account</h1>
          <p style={{ fontSize:14, color:'#64748B', margin:0 }}>Join PAS Training Manager</p>
        </div>

        <div style={{ background:'white', borderRadius:18, border:'1px solid #F1F5F9', boxShadow:'0 4px 24px rgba(0,0,0,0.07)', padding:32 }}>
          {error && <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', color:'#B91C1C', padding:'12px 16px', borderRadius:10, marginBottom:20, fontSize:14 }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#475569', marginBottom:6 }}>First Name</label>
                <input type="text" value={firstName} onChange={e=>setFirstName(e.target.value)} style={inputStyle} required onFocus={focusStyle} onBlur={blurStyle} />
              </div>
              <div>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#475569', marginBottom:6 }}>Last Name</label>
                <input type="text" value={lastName} onChange={e=>setLastName(e.target.value)} style={inputStyle} required onFocus={focusStyle} onBlur={blurStyle} />
              </div>
            </div>

            {[
              { label:'Email', type:'email', value:email, set:setEmail, placeholder:'name@example.com' },
              { label:'Password', type:'password', value:password, set:setPassword, placeholder:'••••••••' },
            ].map(f => (
              <div key={f.label} style={{ marginBottom:16 }}>
                <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#475569', marginBottom:6 }}>{f.label}</label>
                <input type={f.type} value={f.value} onChange={e=>f.set(e.target.value)} style={inputStyle} placeholder={f.placeholder} required onFocus={focusStyle} onBlur={blurStyle} />
              </div>
            ))}

            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#475569', marginBottom:6 }}>Role</label>
              <select value={role} onChange={e=>setRole(e.target.value as any)} style={{ ...inputStyle }} onFocus={focusStyle} onBlur={blurStyle}>
                <option value="caregiver">Caregiver</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div style={{ marginBottom:24 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#475569', marginBottom:6 }}>Organization <span style={{ fontWeight:400, color:'#94A3B8' }}>(optional)</span></label>
              <input type="text" value={organization} onChange={e=>setOrganization(e.target.value)} style={inputStyle} placeholder="Your agency name" onFocus={focusStyle} onBlur={blurStyle} />
            </div>

            <button type="submit" disabled={loading} style={{ width:'100%', padding:11, background: loading?'#93C5FD':'#2563EB', color:'white', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor: loading?'not-allowed':'pointer' }}>
              {loading ? 'Creating account…' : 'Sign Up'}
            </button>
          </form>

          <p style={{ textAlign:'center', fontSize:14, color:'#64748B', marginTop:20, marginBottom:0 }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color:'#2563EB', fontWeight:600, textDecoration:'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
