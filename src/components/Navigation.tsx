import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LogOut, Menu, X, User } from 'lucide-react'
import { useState } from 'react'

export function Navigation() {
  const { profile, signOut } = useAuth()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const isAdmin = profile?.role === 'admin' || profile?.role === 'manager'
  const isCaregiver = profile?.role === 'caregiver'
  const isStrictAdmin = profile?.role === 'admin'

  return (
    <nav className="bg-white shadow border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold">P</div>
            <span className="font-bold text-gray-900">PAS Training</span>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link to="/dashboard" className="text-gray-700 hover:text-primary-600 transition">Dashboard</Link>
            {isAdmin && (
              <>
                <Link to="/courses" className="text-gray-700 hover:text-primary-600 transition">Courses</Link>
                <Link to="/learning-paths" className="text-gray-700 hover:text-primary-600 transition">Learning Paths</Link>
                <Link to="/caregivers" className="text-gray-700 hover:text-primary-600 transition">Caregivers</Link>
                <Link to="/compliance" className="text-gray-700 hover:text-primary-600 transition">Compliance</Link>
              </>
            )}
            {isStrictAdmin && (
              <Link to="/admin-management" className="text-gray-700 hover:text-primary-600 transition">User Management</Link>
            )}
            {isCaregiver && (
              <Link to="/my-courses" className="text-gray-700 hover:text-primary-600 transition">My Courses</Link>
            )}
            <div className="flex items-center space-x-4 pl-6 border-l border-gray-200">
              <span className="text-sm text-gray-600">{profile?.first_name} {profile?.last_name}</span>
              <Link
                to="/profile"
                className="text-gray-700 hover:text-blue-600 transition"
                title="View Profile"
              >
                <User size={20} />
              </Link>
              <button
                onClick={handleSignOut}
                className="text-gray-700 hover:text-red-600 transition"
                title="Sign out"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          <button
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 space-y-3">
            <Link to="/dashboard" className="block text-gray-700 hover:text-primary-600">Dashboard</Link>
            {isAdmin && (
              <>
                <Link to="/courses" className="block text-gray-700 hover:text-primary-600">Courses</Link>
                <Link to="/learning-paths" className="block text-gray-700 hover:text-primary-600">Learning Paths</Link>
                <Link to="/caregivers" className="block text-gray-700 hover:text-primary-600">Caregivers</Link>
                <Link to="/compliance" className="block text-gray-700 hover:text-primary-600">Compliance</Link>
              </>
            )}
            {isStrictAdmin && (
              <Link to="/admin-management" className="block text-gray-700 hover:text-primary-600">User Management</Link>
            )}
            {isCaregiver && (
              <Link to="/my-courses" className="block text-gray-700 hover:text-primary-600">My Courses</Link>
            )}
            <Link to="/profile" className="block text-gray-700 hover:text-blue-600">Profile</Link>
            <button
              onClick={handleSignOut}
              className="block w-full text-left text-gray-700 hover:text-red-600 py-2"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
