import React, { useEffect, useState } from 'react'
import { MainLayout } from '../components/MainLayout'
import { complianceService } from '../services/compliance'
import type { ComplianceRequirement } from '../types'
import { ArrowLeft, FileText, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

export function ComplianceFramework() {
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])
  const load = async () => { try { setRequirements(await complianceService.getAllRequirements()) } catch (e) { console.error(e) } finally { setLoading(false) } }

  const filtered = requirements.filter(r => r.required_for_role !== 'admin')

  return (
    <MainLayout>
      <style>{`@keyframes fadeSlideUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}@keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: 32 }}>

        <Link to="/compliance" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#2563EB', fontWeight: 600, fontSize: 14, textDecoration: 'none', marginBottom: 20, animation: 'fadeSlideUp 0.4s ease both' }}>
          <ArrowLeft size={15} /> Back to Compliance
        </Link>

        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 28, animation: 'fadeSlideUp 0.4s ease both', animationDelay: '60ms' }}>
          <div style={{ width: 48, height: 48, background: '#EFF6FF', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ShieldCheck size={24} color="#2563EB" />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', margin: '0 0 4px' }}>Compliance Requirements Framework</h1>
            <p style={{ fontSize: 14, color: '#64748B', margin: 0 }}>Texas HCSSA compliance requirements per 26 TAC §558</p>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[1, 2, 3, 4, 5].map(i => <div key={i} style={{ height: 52, borderRadius: 10, background: 'linear-gradient(90deg,#F1F5F9 25%,#E2E8F0 50%,#F1F5F9 75%)', backgroundSize: '200% 100%', animation: `shimmer 1.5s ease ${i * 0.1}s infinite` }} />)}
          </div>
        ) : (
          <div style={{ background: 'white', borderRadius: 14, border: '1px solid #F1F5F9', overflow: 'hidden', animation: 'fadeSlideUp 0.45s ease both', animationDelay: '120ms' }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #F8FAFC', display: 'flex', alignItems: 'center', gap: 8 }}>
              <FileText size={17} color="#64748B" />
              <span style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>All Compliance Requirements</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>{filtered.length} requirements</span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                  <tr>
                    {['Requirement', 'Regulation', 'Role', 'Description'].map(h => (
                      <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((req, i) => (
                    <tr key={req.id} style={{ borderBottom: '1px solid #F8FAFC', animation: `fadeSlideUp 0.4s ease both`, animationDelay: `${120 + i * 30}ms`, transition: 'background 0.1s' }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#FAFBFC'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                      <td style={{ padding: '13px 16px', fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{req.requirement_name}</td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#64748B', fontFamily: 'monospace' }}>{req.regulation_reference}</td>
                      <td style={{ padding: '13px 16px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: '#EFF6FF', color: '#2563EB' }}>
                          {req.required_for_role}
                        </span>
                      </td>
                      <td style={{ padding: '13px 16px', fontSize: 13, color: '#64748B' }}>{req.description || 'See linked courses'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
