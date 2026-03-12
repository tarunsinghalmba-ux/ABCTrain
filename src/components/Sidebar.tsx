import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, User, LayoutDashboard, BookOpen, FolderTree, Users, ClipboardCheck, Settings, Menu, X } from 'lucide-react'
import { useState } from 'react'

export function Sidebar() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'
  const isCaregiver = profile?.role === 'caregiver'
  const isStrictAdmin = profile?.role === 'admin'

  const isActive = (path: string) => location.pathname === path

  const navLinkClass = (path: string) =>
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
      isActive(path)
        ? 'bg-blue-600 text-white'
        : 'text-gray-700 hover:bg-gray-100'
    }`

  return (
    <>
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:transform-none ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200">
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                P
              </div>
              <div>
                <span className="font-bold text-gray-900 text-lg block">PAS Training</span>
                <span className="text-xs text-gray-500">Learning Management</span>
              </div>
            </Link>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            <Link to="/dashboard" className={navLinkClass('/dashboard')}>
              <LayoutDashboard size={20} />
              <span>Dashboard</span>
            </Link>

            {isAdmin && (
              <>
                <Link to="/courses" className={navLinkClass('/courses')}>
                  <BookOpen size={20} />
                  <span>Courses</span>
                </Link>
                <Link to="/learning-paths" className={navLinkClass('/learning-paths')}>
                  <FolderTree size={20} />
                  <span>Learning Paths</span>
                </Link>
                <Link to="/caregivers" className={navLinkClass('/caregivers')}>
                  <Users size={20} />
                  <span>Caregivers</span>
                </Link>
                <Link to="/compliance" className={navLinkClass('/compliance')}>
                  <ClipboardCheck size={20} />
                  <span>Compliance</span>
                </Link>
              </>
            )}

            {isStrictAdmin && (
              <Link to="/admin-management" className={navLinkClass('/admin-management')}>
                <Settings size={20} />
                <span>User Management</span>
              </Link>
            )}

            {isCaregiver && (
              <Link to="/my-courses" className={navLinkClass('/my-courses')}>
                <BookOpen size={20} />
                <span>My Courses</span>
              </Link>
            )}
          </nav>

          <div className="p-4 border-t border-gray-200">
            <div className="mb-3 px-4 py-2 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-900">
                {profile?.first_name} {profile?.last_name}
              </p>
              <p className="text-xs text-gray-500 capitalize">{profile?.role}</p>
            </div>
            <div className="space-y-2">
              <Link
                to="/profile"
                className="flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <User size={18} />
                <span className="text-sm">Profile</span>
              </Link>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut size={18} />
                <span className="text-sm">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  )
}
