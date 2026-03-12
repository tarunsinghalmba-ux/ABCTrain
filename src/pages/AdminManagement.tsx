import React, { useEffect, useState } from 'react'
import { MainLayout } from '../components/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { ToastContainer } from '../components/ToastContainer'
import { profileService } from '../services/profiles'
import { organizationService, type Organization } from '../services/organizations'
import { supabase } from '../services/supabase'
import { useAuth } from '../contexts/AuthContext'
import type { Profile } from '../types'
import { Users, Building2, Shield, Plus, X, Key } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'
type TabType = 'users' | 'organizations'

export function AdminManagement() {
  const { user, profile } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('users')
  const [users, setUsers] = useState<Profile[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [showUserForm, setShowUserForm] = useState(false)
  const [showOrgForm, setShowOrgForm] = useState(false)
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: ToastType }>>([])
  const [toastId, setToastId] = useState(0)

  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'caregiver' as 'admin' | 'manager' | 'caregiver',
    organization: '',
    phone: ''
  })

  const [orgFormData, setOrgFormData] = useState({
    name: '',
    description: ''
  })

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = toastId
    setToastId(prev => prev + 1)
    setToasts(prev => [...prev, { id, message, type }])
  }

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      await Promise.all([loadUsers(), loadOrganizations()])
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const data = await profileService.getProfiles()
      setUsers(data)
    } catch (err) {
      console.error('Error loading users:', err)
      showToast('Failed to load users', 'error')
    }
  }

  const loadOrganizations = async () => {
    try {
      const data = await organizationService.getOrganizations()
      setOrganizations(data)
    } catch (err) {
      console.error('Error loading organizations:', err)
      showToast('Failed to load organizations', 'error')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      console.log('Creating user with data:', {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        role: formData.role,
        organization: formData.organization || null,
        phone: formData.phone || null
      })

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            firstName: formData.firstName,
            lastName: formData.lastName,
            role: formData.role,
            organization: formData.organization || null,
            phone: formData.phone || null
          })
        }
      )

      console.log('Response status:', response.status)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))

      let result
      try {
        const text = await response.text()
        console.log('Response text:', text)
        result = JSON.parse(text)
      } catch (parseError) {
        console.error('Failed to parse response:', parseError)
        throw new Error('Invalid response from server')
      }

      console.log('Create user result:', result)

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to create user')
      }

      showToast(
        `User ${formData.firstName} ${formData.lastName} created successfully with default password: Welcome123!`,
        'success'
      )

      resetForm()
      await loadUsers()
    } catch (err) {
      console.error('Error creating user:', err)
      showToast(err instanceof Error ? err.message : 'Failed to create user', 'error')
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      role: 'caregiver',
      organization: '',
      phone: ''
    })
    setShowUserForm(false)
  }

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    try {
      await profileService.updateProfile(userId, { is_active: !currentStatus })
      showToast(
        `User ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
        'success'
      )
      await loadUsers()
    } catch (err) {
      console.error('Error updating user:', err)
      showToast('Failed to update user status', 'error')
    }
  }

  const handleOrgSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await organizationService.createOrganization(orgFormData.name, orgFormData.description)
      showToast(`Organization "${orgFormData.name}" created successfully`, 'success')
      setOrgFormData({ name: '', description: '' })
      setShowOrgForm(false)
      await loadOrganizations()
    } catch (err) {
      console.error('Error creating organization:', err)
      showToast(err instanceof Error ? err.message : 'Failed to create organization', 'error')
    }
  }

  const handleToggleOrgActive = async (orgId: string, currentStatus: boolean) => {
    try {
      await organizationService.updateOrganization(orgId, { is_active: !currentStatus })
      showToast(
        `Organization ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
        'success'
      )
      await loadOrganizations()
    } catch (err) {
      console.error('Error updating organization:', err)
      showToast('Failed to update organization status', 'error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navigation />
        <main className="flex-1 p-8">
          <div className="text-center">Loading...</div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <MainLayout>

      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Admin Management</h1>
              <p className="text-slate-600 mt-2">Create and manage users, organizations, and roles</p>
            </div>
            <button
              onClick={() => activeTab === 'users' ? setShowUserForm(true) : setShowOrgForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              {activeTab === 'users' ? 'Create User' : 'Create Organization'}
            </button>
          </div>

          <div className="mb-6">
            <div className="flex gap-2 border-b border-slate-200">
              <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                  activeTab === 'users'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Users className="w-5 h-5" />
                Users
              </button>
              <button
                onClick={() => setActiveTab('organizations')}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
                  activeTab === 'organizations'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-5 h-5" />
                Organizations
              </button>
            </div>
          </div>

          {activeTab === 'users' && showUserForm && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Create New User</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <Key className="w-5 h-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-blue-900">Default Password</p>
                        <p className="text-sm text-blue-700">
                          All new users will be created with the password: <span className="font-mono font-semibold">Welcome123!</span>
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Users can change their password after logging in through their profile settings.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="caregiver">Caregiver</option>
                      <option value="manager">Manager</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Organization
                    </label>
                    <select
                      value={formData.organization}
                      onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select organization (optional)</option>
                      {organizations.filter(org => org.is_active).map(org => (
                        <option key={org.id} value={org.name}>{org.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create User
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === 'organizations' && showOrgForm && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Create New Organization</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleOrgSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      value={orgFormData.name}
                      onChange={(e) => setOrgFormData({ ...orgFormData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., North Division, East Region"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={orgFormData.description}
                      onChange={(e) => setOrgFormData({ ...orgFormData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Optional description"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Create Organization
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOrgFormData({ name: '', description: '' })
                        setShowOrgForm(false)
                      }}
                      className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {activeTab === 'users' && (
            <Card>
              <CardHeader>
                <CardTitle>Users</CardTitle>
              </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Email</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Role</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Organization</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Status</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-slate-100">
                        <td className="py-3 px-4 text-sm text-slate-900">
                          {user.first_name} {user.last_name}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full ${
                            user.role === 'admin'
                              ? 'bg-red-100 text-red-700'
                              : user.role === 'manager'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            <Shield className="w-3 h-3" />
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">
                          {user.organization || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            user.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-slate-200 text-slate-700'
                          }`}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleToggleActive(user.id, user.is_active)}
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          >
                            {user.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          )}

          {activeTab === 'organizations' && (
            <Card>
              <CardHeader>
                <CardTitle>Organizations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Description</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Users</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {organizations.map((org) => {
                        const userCount = users.filter(u => u.organization === org.name).length
                        return (
                          <tr key={org.id} className="border-b border-slate-100">
                            <td className="py-3 px-4 text-sm font-medium text-slate-900">
                              <div className="flex items-center gap-2">
                                <Building2 className="w-4 h-4 text-slate-400" />
                                {org.name}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-600">
                              {org.description || '-'}
                            </td>
                            <td className="py-3 px-4 text-sm text-slate-600">
                              {userCount} {userCount === 1 ? 'user' : 'users'}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                org.is_active
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-slate-200 text-slate-700'
                              }`}>
                                {org.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <button
                                onClick={() => handleToggleOrgActive(org.id, org.is_active)}
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                              >
                                {org.is_active ? 'Deactivate' : 'Activate'}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                      {organizations.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500">
                            No organizations yet. Click "Create Organization" to add one.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </MainLayout>
  )
}
