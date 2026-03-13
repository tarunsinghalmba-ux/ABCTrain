import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { complianceService } from '../services/compliance'
import { courseService } from '../services/courses'
import { learningPathService } from '../services/learningPaths'
import { dashboardService, DashboardStats, ActivityItem } from '../services/dashboard'
import { MainLayout } from '../components/MainLayout'
import type { ComplianceStatus, CourseAssignment, LearningPathAssignment } from '../types'
import {
  AlertCircle, CheckCircle, Clock, Users, TrendingUp, FolderTree,
  ArrowRight, BookOpen, ClipboardCheck, ChevronRight, Sparkles, Award
} from 'lucide-react'

// ── Animated counter ──────────────────────────────────────────────────
function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) { setValue(0); return }
    let start = 0
    const step = target / (duration / 16)
    const timer = setInterval(() => {
      start += step
      if (start >= target) { setValue(target); clearInterval(timer) }
      else setValue(Math.floor(start))
    }, 16)
    return () => clearInterval(timer)
  }, [target, duration])
  return value
}

// ── Progress ring ─────────────────────────────────────────────────────
function ProgressRing({ value, max, color }: { value: number; max: number; color: string }) {
  const r = 28, c = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  return (
    <svg width={72} height={72} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={36} cy={36} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={6} />
      <circle cx={36} cy={36} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease' }} />
    </svg>
  )
}

// ── Admin stat card ───────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sublabel, href, delay = 0 }: {
  label: string; value: number; icon: React.ElementType
  color: 'blue' | 'green' | 'amber' | 'red'
  sublabel?: string; href?: string; delay?: number
}) {
  const count = useCountUp(value)
  const palette = {
    blue:  { bg: '#EFF6FF', icon: '#2563EB', text: '#1D4ED8', ring: '#BFDBFE' },
    green: { bg: '#F0FDF4', icon: '#16A34A', text: '#15803D', ring: '#BBF7D0' },
    amber: { bg: '#FFFBEB', icon: '#D97706', text: '#B45309', ring: '#FDE68A' },
    red:   { bg: '#FEF2F2', icon: '#DC2626', text: '#B91C1C', ring: '#FECACA' },
  }[color]

  const cardStyle: React.CSSProperties = {
    background: 'white', borderRadius: 16, padding: '24px',
    border: '1px solid #F1F5F9',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    animationDelay: `${delay}ms`,
    animation: 'fadeSlideUp 0.5s ease both',
    cursor: href ? 'pointer' : 'default',
  }

  const inner = (
    <div style={cardStyle}
      onMouseEnter={e => { if (href) { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.10)' }}}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.05), 0 4px 12px rgba(0,0,0,0.04)' }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</p>
          <p style={{ fontSize: 36, fontWeight: 800, color: palette.text, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{count}{label === 'Compliance Rate' ? '%' : ''}</p>
          {sublabel && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8, color: palette.icon, fontSize: 13, fontWeight: 600 }}>
              <ArrowRight size={13} /> {sublabel}
            </div>
          )}
        </div>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: palette.bg, border: `1px solid ${palette.ring}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={22} color={palette.icon} />
        </div>
      </div>
    </div>
  )
  return href ? <Link to={href} style={{ textDecoration: 'none' }}>{inner}</Link> : inner
}

// ── Caregiver dashboard ───────────────────────────────────────────────
function CaregiverDashboard({ complianceStatus, assignments, pathAssignments, name }: {
  complianceStatus: ComplianceStatus; assignments: CourseAssignment[]
  pathAssignments: LearningPathAssignment[]; name: string
}) {
  const totalCount     = useCountUp(complianceStatus.total_assignments)
  const completedCount = useCountUp(complianceStatus.completed)
  const overdueCount   = useCountUp(complianceStatus.overdue)
  const pendingCount   = useCountUp(complianceStatus.pending)

  const statusConfig = {
    compliant:       { label: 'Compliant',       color: '#16A34A', bg: 'rgba(255,255,255,0.15)' },
    action_required: { label: 'Action Required', color: '#FBBF24', bg: 'rgba(255,255,255,0.15)' },
    overdue:         { label: 'Overdue',          color: '#F87171', bg: 'rgba(255,255,255,0.15)' },
  }
  const sc = statusConfig[complianceStatus.status] ?? statusConfig.action_required
  const pct = complianceStatus.total_assignments > 0
    ? Math.round((complianceStatus.completed / complianceStatus.total_assignments) * 100) : 0

  return (
    <div>
      {/* Welcome banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1E3A5F 0%, #2563EB 60%, #3B82F6 100%)',
        borderRadius: 20, padding: '28px 32px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
        animation: 'fadeSlideUp 0.4s ease both',
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -50, right: 100, width: 130, height: 130, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>Welcome back 👋</p>
          <h1 style={{ color: 'white', fontSize: 28, fontWeight: 800, margin: '0 0 14px' }}>{name}</h1>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', borderRadius: 8, padding: '6px 14px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: sc.color, boxShadow: `0 0 8px ${sc.color}` }} />
            <span style={{ color: 'white', fontSize: 13, fontWeight: 600 }}>{sc.label}</span>
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <ProgressRing value={pct} max={100} color="#60A5FA" />
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: 600, marginTop: 4 }}>{pct}% complete</p>
        </div>
      </div>

      {/* Mini stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {([
          { label: 'Total', value: totalCount,     icon: BookOpen,     color: '#64748B' },
          { label: 'Completed', value: completedCount, icon: CheckCircle,  color: '#16A34A' },
          { label: 'Pending',   value: pendingCount,   icon: Clock,        color: '#D97706' },
          { label: 'Overdue',   value: overdueCount,   icon: AlertCircle,  color: '#DC2626' },
        ] as const).map(({ label, value, icon: Icon, color }, i) => (
          <div key={label} style={{
            background: 'white', borderRadius: 14, padding: '20px 22px',
            border: '1px solid #F1F5F9', boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            animation: 'fadeSlideUp 0.5s ease both', animationDelay: `${i * 60}ms`,
          }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon size={18} color={color} />
              <span style={{ fontSize: 28, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Two-column */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Course assignments */}
        <div style={{
          background: 'white', borderRadius: 16, border: '1px solid #F1F5F9',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden',
          animation: 'fadeSlideUp 0.5s ease both', animationDelay: '240ms',
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BookOpen size={16} color="#2563EB" />
              </div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>Course Assignments</h2>
            </div>
            {assignments.length > 0 && (
              <Link to="/my-courses" style={{ fontSize: 13, color: '#2563EB', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                View all <ChevronRight size={14} />
              </Link>
            )}
          </div>
          <div style={{ padding: '12px 16px' }}>
            {assignments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8' }}>
                <BookOpen size={32} style={{ marginBottom: 8, opacity: 0.35 }} />
                <p style={{ fontSize: 14 }}>No assignments yet</p>
              </div>
            ) : assignments.slice(0, 4).map((a, i) => (
              <div key={a.id} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                padding: '12px 8px', borderBottom: i < Math.min(assignments.length, 4) - 1 ? '1px solid #F8FAFC' : 'none',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <BookOpen size={16} color="#3B82F6" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, color: '#1E293B', fontSize: 14, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.course?.title}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={11} color="#94A3B8" /> Due {new Date(a.due_date).toLocaleDateString()}
                    </span>
                    {a.course?.category && (
                      <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#EFF6FF', color: '#2563EB', fontWeight: 600 }}>{a.course.category}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Learning paths */}
        <div style={{
          background: 'white', borderRadius: 16, border: '1px solid #F1F5F9',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden',
          animation: 'fadeSlideUp 0.5s ease both', animationDelay: '300ms',
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #F8FAFC', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FolderTree size={16} color="#7C3AED" />
            </div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>Learning Paths</h2>
          </div>
          <div style={{ padding: '12px 16px' }}>
            {pathAssignments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8' }}>
                <FolderTree size={32} style={{ marginBottom: 8, opacity: 0.35 }} />
                <p style={{ fontSize: 14 }}>No learning paths assigned</p>
              </div>
            ) : pathAssignments.slice(0, 4).map((a, i) => {
              const pathColors = {
                completed:   { bg: '#F0FDF4', text: '#16A34A', dot: '#16A34A' },
                in_progress: { bg: '#FFFBEB', text: '#D97706', dot: '#D97706' },
                assigned:    { bg: '#F8FAFC', text: '#64748B', dot: '#94A3B8' },
              }
              const pc = pathColors[a.status as keyof typeof pathColors] ?? pathColors.assigned
              return (
                <div key={a.id} style={{
                  display: 'flex', gap: 12, alignItems: 'flex-start',
                  padding: '12px 8px', borderBottom: i < Math.min(pathAssignments.length, 4) - 1 ? '1px solid #F8FAFC' : 'none',
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <FolderTree size={16} color="#7C3AED" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 600, color: '#1E293B', fontSize: 14, margin: '0 0 5px' }}>{a.learning_path?.name}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20, background: pc.bg, color: pc.text, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: pc.dot, display: 'inline-block' }} />
                        {a.status === 'completed' ? 'Completed' : a.status === 'in_progress' ? 'In Progress' : 'Assigned'}
                      </span>
                      {a.due_date && <span style={{ fontSize: 12, color: '#94A3B8' }}>Due {new Date(a.due_date).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Admin dashboard ───────────────────────────────────────────────────
function AdminDashboard({ adminStats, recentActivity, name, role }: {
  adminStats: DashboardStats; recentActivity: ActivityItem[]; name: string; role: string
}) {
  return (
    <div>
      {/* Header banner */}
      <div style={{
        background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 50%, #1D4ED8 100%)',
        borderRadius: 20, padding: '28px 32px', marginBottom: 28,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
        animation: 'fadeSlideUp 0.4s ease both',
      }}>
        <div style={{ position: 'absolute', top: -40, right: 60, width: 200, height: 200, borderRadius: '50%', background: 'rgba(99,102,241,0.12)' }} />
        <div style={{ position: 'absolute', bottom: -50, right: -20, width: 160, height: 160, borderRadius: '50%', background: 'rgba(59,130,246,0.1)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: 500, marginBottom: 6 }}>
            {role === 'admin' ? '⚙️ Admin Portal' : '📋 Manager Portal'}
          </p>
          <h1 style={{ color: 'white', fontSize: 28, fontWeight: 800, margin: '0 0 14px' }}>Welcome, {name}</h1>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 16px' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Caregivers</span>
              <span style={{ color: 'white', fontSize: 22, fontWeight: 800, fontVariantNumeric: 'tabular-nums' }}>{adminStats.total_caregivers}</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: 10, padding: '8px 16px' }}>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, fontWeight: 600, display: 'block', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Compliance</span>
              <span style={{ color: '#4ADE80', fontSize: 22, fontWeight: 800 }}>{adminStats.compliance_percentage}%</span>
            </div>
          </div>
        </div>
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 72, height: 72, margin: '0 auto' }}>
            <ProgressRing value={adminStats.compliance_percentage} max={100} color="#4ADE80" />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Award size={20} color="#4ADE80" />
            </div>
          </div>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, fontWeight: 600, marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Overall Rate</p>
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <StatCard label="Total Caregivers" value={adminStats.total_caregivers} icon={Users} color="blue" delay={0} />
        <StatCard label="Compliance Rate" value={adminStats.compliance_percentage} icon={TrendingUp} color="green" delay={60} />
        <StatCard label="Due Soon" value={adminStats.due_soon_count} icon={Clock} color="amber"
          sublabel={adminStats.due_soon_count > 0 ? 'View details' : undefined}
          href={adminStats.due_soon_count > 0 ? '/courses?filter=due_soon' : undefined} delay={120} />
        <StatCard label="Overdue" value={adminStats.overdue_count} icon={AlertCircle} color="red"
          sublabel={adminStats.overdue_count > 0 ? 'View details' : undefined}
          href={adminStats.overdue_count > 0 ? '/courses?filter=overdue' : undefined} delay={180} />
      </div>

      {/* Bottom grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent activity */}
        <div style={{
          background: 'white', borderRadius: 16, border: '1px solid #F1F5F9',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden',
          animation: 'fadeSlideUp 0.5s ease both', animationDelay: '240ms',
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #F8FAFC', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Sparkles size={16} color="#16A34A" />
            </div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>Recent Activity</h2>
          </div>
          <div style={{ padding: '8px 16px' }}>
            {recentActivity.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: '#94A3B8' }}>
                <CheckCircle size={32} style={{ marginBottom: 8, opacity: 0.3 }} />
                <p style={{ fontSize: 14 }}>No recent activity</p>
              </div>
            ) : recentActivity.map((a, i) => (
              <div key={a.id} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                padding: '12px 8px', borderBottom: i < recentActivity.length - 1 ? '1px solid #F8FAFC' : 'none',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckCircle size={16} color="#16A34A" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, color: '#1E293B', fontSize: 14, margin: '0 0 2px' }}>{a.caregiver_name}</p>
                  <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.course_title}</p>
                  <p style={{ fontSize: 11, color: '#94A3B8', margin: 0 }}>
                    {new Date(a.timestamp).toLocaleDateString()} · {new Date(a.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{
          background: 'white', borderRadius: 16, border: '1px solid #F1F5F9',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)', overflow: 'hidden',
          animation: 'fadeSlideUp 0.5s ease both', animationDelay: '300ms',
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #F8FAFC', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ChevronRight size={16} color="#2563EB" />
            </div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>Quick Actions</h2>
          </div>
          <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { href: '/courses',        icon: BookOpen,      label: 'Manage Courses',    desc: 'Create and manage course catalog',      bg: '#EFF6FF', iconColor: '#2563EB', hover: '#DBEAFE' },
              { href: '/learning-paths', icon: FolderTree,    label: 'Learning Paths',    desc: 'Group courses into training paths',     bg: '#F5F3FF', iconColor: '#7C3AED', hover: '#EDE9FE' },
              { href: '/caregivers',     icon: Users,         label: 'Manage Caregivers', desc: 'Add caregivers and assign training',     bg: '#F0FDFA', iconColor: '#0D9488', hover: '#CCFBF1' },
              { href: '/compliance',     icon: ClipboardCheck,label: 'Compliance',        desc: 'View and export compliance reports',    bg: '#F0FDF4', iconColor: '#16A34A', hover: '#DCFCE7' },
            ].map(({ href, icon: Icon, label, desc, bg, iconColor, hover }) => (
              <Link key={href} to={href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 16px', borderRadius: 12, background: bg,
                  transition: 'background 0.15s ease, transform 0.15s ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = hover; (e.currentTarget as HTMLElement).style.transform = 'translateX(3px)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = bg; (e.currentTarget as HTMLElement).style.transform = 'translateX(0)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', flexShrink: 0 }}>
                    <Icon size={18} color={iconColor} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, color: '#0F172A', fontSize: 14, margin: '0 0 2px' }}>{label}</p>
                    <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{desc}</p>
                  </div>
                  <ChevronRight size={16} color="#94A3B8" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Loading skeleton ──────────────────────────────────────────────────
function SkeletonLoader() {
  return (
    <MainLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px' }}>
        <div style={{ height: 140, borderRadius: 20, background: 'linear-gradient(90deg, #F1F5F9 25%, #E2E8F0 50%, #F1F5F9 75%)', marginBottom: 28, animation: 'shimmer 1.5s ease infinite', backgroundSize: '200% 100%' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 24 }}>
          {[1,2,3,4].map(i => <div key={i} style={{ height: 100, borderRadius: 16, background: '#F1F5F9', animation: `shimmer 1.5s ease ${i * 0.1}s infinite`, backgroundSize: '200% 100%' }} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {[1,2].map(i => <div key={i} style={{ height: 300, borderRadius: 16, background: '#F1F5F9', animation: `shimmer 1.5s ease ${i * 0.15}s infinite`, backgroundSize: '200% 100%' }} />)}
        </div>
      </div>
    </MainLayout>
  )
}

// ── Export ────────────────────────────────────────────────────────────
export function Dashboard() {
  const { profile } = useAuth()
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus | null>(null)
  const [assignments, setAssignments]           = useState<CourseAssignment[]>([])
  const [pathAssignments, setPathAssignments]   = useState<LearningPathAssignment[]>([])
  const [adminStats, setAdminStats]             = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity]     = useState<ActivityItem[]>([])
  const [loading, setLoading]                   = useState(true)

  useEffect(() => {
    if (!profile?.id) return
    const load = async () => {
      try {
        if (profile.role === 'caregiver') {
          const status = await complianceService.getComplianceStatus(profile.id)
          setComplianceStatus(status)
          const [ca, pa] = await Promise.all([
            courseService.getCaregiverAssignments(profile.id),
            learningPathService.getAssignments(profile.id),
          ])
          setAssignments(ca); setPathAssignments(pa)
        } else {
          const [stats, activity] = await Promise.all([
            dashboardService.getAdminStats(),
            dashboardService.getRecentActivity(),
          ])
          setAdminStats(stats); setRecentActivity(activity)
        }
      } catch (err) { console.error('Dashboard load error:', err) }
      finally { setLoading(false) }
    }
    load()
  }, [profile?.id, profile?.role])

  if (loading) return <SkeletonLoader />

  const fullName = `${profile?.first_name ?? ''} ${profile?.last_name ?? ''}`.trim()

  return (
    <>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position:  200% 0; }
        }
      `}</style>
      <MainLayout>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px' }}>
          {profile?.role === 'caregiver' && complianceStatus && (
            <CaregiverDashboard complianceStatus={complianceStatus} assignments={assignments} pathAssignments={pathAssignments} name={fullName} />
          )}
          {(profile?.role === 'admin' || profile?.role === 'manager') && adminStats && (
            <AdminDashboard adminStats={adminStats} recentActivity={recentActivity} name={fullName} role={profile.role} />
          )}
        </div>
      </MainLayout>
    </>
  )
}
