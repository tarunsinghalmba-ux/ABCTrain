import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try { await signIn(email, password); navigate('/dashboard') }
    catch (err: any) { setError(err.message || 'Failed to sign in') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#F8FAFC 0%,#EFF6FF 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <style>{`@keyframes fadeSlideUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ width:'100%', maxWidth:420, animation:'fadeSlideUp 0.4s ease both' }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:52, height:52, background:'linear-gradient(135deg,#1E3A5F,#2563EB)', borderRadius:14, display:'inline-flex', alignItems:'center', justifyContent:'center', color:'white', fontSize:22, fontWeight:800, marginBottom:14 }}>P</div>
          <h1 style={{ fontSize:24, fontWeight:800, color:'#0F172A', margin:'0 0 4px' }}>PAS Training Manager</h1>
          <p style={{ fontSize:14, color:'#64748B', margin:0 }}>Sign in to your account</p>
        </div>

        <div style={{ background:'white', borderRadius:18, border:'1px solid #F1F5F9', boxShadow:'0 4px 24px rgba(0,0,0,0.07)', padding:32 }}>
          {error && (
            <div style={{ background:'#FEF2F2', border:'1px solid #FECACA', color:'#B91C1C', padding:'12px 16px', borderRadius:10, marginBottom:20, fontSize:14 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:16 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#475569', marginBottom:6 }}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                style={{ width:'100%', padding:'10px 14px', border:'1px solid #E2E8F0', borderRadius:10, fontSize:14, color:'#0F172A', outline:'none', transition:'border-color 0.15s, box-shadow 0.15s', boxSizing:'border-box' }}
                placeholder="name@example.com" required
                onFocus={e => { e.target.style.borderColor='#2563EB'; e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,0.1)' }}
                onBlur={e => { e.target.style.borderColor='#E2E8F0'; e.target.style.boxShadow='none' }}
              />
            </div>

            <div style={{ marginBottom:24 }}>
              <label style={{ display:'block', fontSize:13, fontWeight:600, color:'#475569', marginBottom:6 }}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                style={{ width:'100%', padding:'10px 14px', border:'1px solid #E2E8F0', borderRadius:10, fontSize:14, color:'#0F172A', outline:'none', transition:'border-color 0.15s, box-shadow 0.15s', boxSizing:'border-box' }}
                placeholder="••••••••" required
                onFocus={e => { e.target.style.borderColor='#2563EB'; e.target.style.boxShadow='0 0 0 3px rgba(37,99,235,0.1)' }}
                onBlur={e => { e.target.style.borderColor='#E2E8F0'; e.target.style.boxShadow='none' }}
              />
            </div>

            <button type="submit" disabled={loading} style={{
              width:'100%', padding:'11px', background: loading ? '#93C5FD' : '#2563EB',
              color:'white', border:'none', borderRadius:10, fontSize:15, fontWeight:700,
              cursor: loading ? 'not-allowed' : 'pointer', transition:'background 0.15s',
            }}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p style={{ textAlign:'center', fontSize:14, color:'#64748B', marginTop:20, marginBottom:0 }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{ color:'#2563EB', fontWeight:600, textDecoration:'none' }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
