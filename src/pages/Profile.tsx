import React, { useEffect, useState } from 'react'
import { MainLayout } from '../components/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { CourseCompletionModal } from '../components/CourseCompletionModal'
import { ToastContainer } from '../components/ToastContainer'
import { useAuth } from '../contexts/AuthContext'
import { courseService } from '../services/courses'
import { learningPathService } from '../services/learningPaths'
import { complianceService } from '../services/compliance'
import { organizationService, type AgencySettings } from '../services/organizations'
import { supabase } from '../services/supabase'
import type { CourseAssignment, LearningPathAssignment, ComplianceStatus } from '../types'
import { User, Mail, Building2, Shield, BookOpen, FolderTree, CircleCheck as CheckCircle, Clock, CircleAlert as AlertCircle, ExternalLink, Pause, Play, Key, Globe, Phone, MapPin, CircleUser as UserCircle } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

export function Profile() {
  const { profile } = useAuth()
  const [courseAssignments, setCourseAssignments] = useState<CourseAssignment[]>([])
  const [pathAssignments, setPathAssignments] = useState<LearningPathAssignment[]>([])
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus | null>(null)
  const [agencySettings, setAgencySettings] = useState<AgencySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [completingAssignment, setCompletingAssignment] = useState<CourseAssignment | null>(null)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showOrgSettingsForm, setShowOrgSettingsForm] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [orgSettingsData, setOrgSettingsData] = useState({
    address: '',
    website: '',
    phone: '',
    contact_name: '',
    contact_email: ''
  })
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: ToastType }>>([])
  const [toastId, setToastId] = useState(0)

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = toastId
    setToastId(prev => prev + 1)
    setToasts(prev => [...prev, { id, message, type }])
  }

  const removeToast = (id: number) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  useEffect(() => {
    loadProfileData()
  }, [profile?.id])

  const loadProfileData = async () => {
    if (!profile?.id) return

    try {
      setLoading(true)
      if (profile.role === 'caregiver') {
        const [courses, paths, compliance] = await Promise.all([
          courseService.getCaregiverAssignments(profile.id),
          learningPathService.getAssignments(profile.id),
          complianceService.getComplianceStatus(profile.id)
        ])
        setCourseAssignments(courses)
        setPathAssignments(paths)
        setComplianceStatus(compliance)
      }
      if ((profile.role === 'admin' || profile.role === 'manager') && profile.organization) {
        const settings = await organizationService.getAgencySettings(profile.organization)
        if (settings) {
          setAgencySettings(settings)
          setOrgSettingsData({
            address: settings.address || '',
            website: settings.website || '',
            phone: settings.phone || '',
            contact_name: settings.contact_name || '',
            contact_email: settings.contact_email || ''
          })
        }
      }
    } catch (error) {
      console.error('Error loading profile data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartCourse = async (assignmentId: string) => {
    try {
      await courseService.startCourse(assignmentId)
      await loadProfileData()
    } catch (error) {
      console.error('Error starting course:', error)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showToast('New passwords do not match', 'error')
      return
    }

    if (passwordData.newPassword.length < 8) {
      showToast('New password must be at least 8 characters', 'error')
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      })

      if (error) throw error

      showToast('Password changed successfully', 'success')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswordForm(false)
    } catch (error: any) {
      console.error('Error changing password:', error)
      showToast(error.message || 'Failed to change password', 'error')
    }
  }

  const handleOrgSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!profile?.organization) {
      showToast('No organization found', 'error')
      return
    }

    try {
      await organizationService.updateAgencySettings(profile.organization, orgSettingsData)
      showToast('Organization settings updated successfully', 'success')
      setShowOrgSettingsForm(false)
      await loadProfileData()
    } catch (error: any) {
      console.error('Error updating organization settings:', error)
      showToast(error.message || 'Failed to update organization settings', 'error')
    }
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading profile...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">My Profile</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <User className="text-gray-400 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium text-gray-900">
                      {profile?.first_name} {profile?.last_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="text-gray-400 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{profile?.email}</p>
                  </div>
                </div>

                {profile?.organization && (
                  <div className="flex items-start gap-3">
                    <Building2 className="text-gray-400 mt-1" size={20} />
                    <div>
                      <p className="text-sm text-gray-600">Organization</p>
                      <p className="font-medium text-gray-900">{profile.organization}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Shield className="text-gray-400 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Role</p>
                    <p className="font-medium text-gray-900 capitalize">{profile?.role}</p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Account Status</span>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        profile?.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {profile?.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowPasswordForm(!showPasswordForm)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    <Key className="w-4 h-4" />
                    Change Password
                  </button>
                </div>
              </CardContent>
            </Card>

            {showPasswordForm && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="At least 8 characters"
                        required
                        minLength={8}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Retype new password"
                        required
                        minLength={8}
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Update Password
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowPasswordForm(false)
                          setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                        }}
                        className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>

          {profile?.role === 'caregiver' && (
            <div className="lg:col-span-2 space-y-6">
              {complianceStatus && (
                <Card>
                  <CardHeader>
                    <CardTitle>Training Compliance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">
                          {complianceStatus.total_assignments}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Total</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {complianceStatus.completed}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Completed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-yellow-600">
                          {complianceStatus.pending}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Pending</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-600">
                          {complianceStatus.overdue}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Overdue</p>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Overall Status</span>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            complianceStatus.status === 'compliant'
                              ? 'bg-green-100 text-green-800'
                              : complianceStatus.status === 'overdue'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {complianceStatus.status === 'compliant'
                            ? 'Compliant'
                            : complianceStatus.status === 'overdue'
                            ? 'Overdue'
                            : 'Action Required'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BookOpen className="text-blue-600" size={20} />
                    <CardTitle>My Course Assignments</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {courseAssignments.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No course assignments</p>
                  ) : (
                    <div className="space-y-3">
                      {courseAssignments.map((assignment) => {
                        const isOverdue = !assignment.completion_date && new Date(assignment.due_date) < new Date()
                        const isCompleted = assignment.status === 'completed' || !!assignment.completion_date
                        const isInProgress = assignment.status === 'in_progress'
                        const isNotStarted = !assignment.status || assignment.status === 'not_started'

                        return (
                          <div
                            key={assignment.id}
                            className={`p-4 rounded-lg border-2 ${
                              isCompleted
                                ? 'border-green-200 bg-green-50'
                                : isOverdue
                                ? 'border-red-200 bg-red-50'
                                : isInProgress
                                ? 'border-yellow-200 bg-yellow-50'
                                : 'border-blue-200 bg-blue-50'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold text-gray-900">
                                    {assignment.course?.title}
                                  </h4>
                                  {isCompleted ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                                      <CheckCircle size={14} />
                                      Completed
                                    </span>
                                  ) : isInProgress ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                                      <Pause size={14} />
                                      In Progress
                                    </span>
                                  ) : isOverdue ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                                      <AlertCircle size={14} />
                                      Overdue
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                      <Clock size={14} />
                                      Not Started
                                    </span>
                                  )}
                                </div>
                                {assignment.course?.description && (
                                  <p className="text-sm text-gray-600 mb-2">
                                    {assignment.course.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-3 text-sm">
                                  <span className={`font-medium ${isOverdue ? 'text-red-700' : 'text-gray-600'}`}>
                                    Due: {new Date(assignment.due_date).toLocaleDateString()}
                                  </span>
                                  {assignment.course?.category && (
                                    <span className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                                      {assignment.course.category}
                                    </span>
                                  )}
                                  {assignment.course?.ce_hours && (
                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                      {assignment.course.ce_hours} CE hours
                                    </span>
                                  )}
                                </div>
                                {isCompleted && assignment.completion_date && (
                                  <p className="text-sm text-green-700 font-medium mt-2">
                                    Completed: {new Date(assignment.completion_date).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <div className="flex flex-col gap-2">
                                {!isCompleted && assignment.course?.external_url && (
                                  <>
                                    <a
                                      href={assignment.course.external_url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                    >
                                      <ExternalLink size={16} />
                                      View Course
                                    </a>
                                    {isNotStarted && (
                                      <button
                                        onClick={() => handleStartCourse(assignment.id)}
                                        className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors text-sm font-medium"
                                      >
                                        <Play size={16} />
                                        Start
                                      </button>
                                    )}
                                    {isInProgress && (
                                      <button
                                        onClick={() => setCompletingAssignment(assignment)}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                      >
                                        <CheckCircle size={16} />
                                        Mark Complete
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FolderTree className="text-purple-600" size={20} />
                    <CardTitle>My Learning Paths</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  {pathAssignments.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No learning path assignments</p>
                  ) : (
                    <div className="space-y-3">
                      {pathAssignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg"
                        >
                          <div className="p-2 bg-purple-100 rounded flex-shrink-0">
                            <FolderTree className="text-purple-600" size={16} />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">
                              {assignment.learning_path?.name}
                            </h4>
                            {assignment.learning_path?.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {assignment.learning_path.description}
                              </p>
                            )}
                            <div className="flex items-center gap-3 mt-2">
                              {assignment.due_date && (
                                <span className="text-sm text-gray-600">
                                  Due: {new Date(assignment.due_date).toLocaleDateString()}
                                </span>
                              )}
                              <span
                                className={`text-xs px-2 py-1 rounded font-medium ${
                                  assignment.status === 'completed'
                                    ? 'bg-green-100 text-green-700'
                                    : assignment.status === 'in_progress'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {assignment.status === 'completed'
                                  ? 'Completed'
                                  : assignment.status === 'in_progress'
                                  ? 'In Progress'
                                  : 'Assigned'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {(profile?.role === 'admin' || profile?.role === 'manager') && (
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Organization Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  {agencySettings && !showOrgSettingsForm ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-3">
                          <MapPin className="text-gray-400 mt-1 flex-shrink-0" size={20} />
                          <div>
                            <p className="text-sm text-gray-600">Address</p>
                            <p className="font-medium text-gray-900">{agencySettings.address || 'Not set'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Phone className="text-gray-400 mt-1 flex-shrink-0" size={20} />
                          <div>
                            <p className="text-sm text-gray-600">Phone</p>
                            <p className="font-medium text-gray-900">{agencySettings.phone || 'Not set'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Globe className="text-gray-400 mt-1 flex-shrink-0" size={20} />
                          <div>
                            <p className="text-sm text-gray-600">Website</p>
                            <p className="font-medium text-gray-900">{agencySettings.website || 'Not set'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <UserCircle className="text-gray-400 mt-1 flex-shrink-0" size={20} />
                          <div>
                            <p className="text-sm text-gray-600">Main Contact</p>
                            <p className="font-medium text-gray-900">{agencySettings.contact_name || 'Not set'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <Mail className="text-gray-400 mt-1 flex-shrink-0" size={20} />
                          <div>
                            <p className="text-sm text-gray-600">Contact Email</p>
                            <p className="font-medium text-gray-900">{agencySettings.contact_email || 'Not set'}</p>
                          </div>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-gray-200">
                        <button
                          onClick={() => setShowOrgSettingsForm(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Edit Organization Settings
                        </button>
                      </div>
                    </div>
                  ) : showOrgSettingsForm ? (
                    <form onSubmit={handleOrgSettingsUpdate} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address
                        </label>
                        <input
                          type="text"
                          value={orgSettingsData.address}
                          onChange={(e) => setOrgSettingsData({ ...orgSettingsData, address: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Organization address"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Phone
                          </label>
                          <input
                            type="tel"
                            value={orgSettingsData.phone}
                            onChange={(e) => setOrgSettingsData({ ...orgSettingsData, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="(555) 123-4567"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Website
                          </label>
                          <input
                            type="url"
                            value={orgSettingsData.website}
                            onChange={(e) => setOrgSettingsData({ ...orgSettingsData, website: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="https://example.com"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Main Contact Name
                          </label>
                          <input
                            type="text"
                            value={orgSettingsData.contact_name}
                            onChange={(e) => setOrgSettingsData({ ...orgSettingsData, contact_name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="John Doe"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contact Email
                          </label>
                          <input
                            type="email"
                            value={orgSettingsData.contact_email}
                            onChange={(e) => setOrgSettingsData({ ...orgSettingsData, contact_email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="contact@example.com"
                          />
                        </div>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button
                          type="submit"
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Save Settings
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowOrgSettingsForm(false)}
                          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="text-gray-500">No organization settings found</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Admin Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">
                    You have administrative access to manage caregivers, courses, learning paths, and view compliance reports.
                  </p>
                  <div className="mt-6 space-y-3">
                    <a
                      href="/caregivers"
                      className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <h3 className="font-semibold text-blue-900">Manage Caregivers</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Add, edit, and assign training to caregivers
                      </p>
                    </a>
                    <a
                      href="/courses"
                      className="block p-4 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                    >
                      <h3 className="font-semibold text-teal-900">Manage Courses</h3>
                      <p className="text-sm text-teal-700 mt-1">
                        Create and manage your course catalog
                      </p>
                    </a>
                    <a
                      href="/learning-paths"
                      className="block p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                    >
                      <h3 className="font-semibold text-purple-900">Learning Paths</h3>
                      <p className="text-sm text-purple-700 mt-1">
                        Group courses into structured learning paths
                      </p>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {completingAssignment && profile?.id && (
        <CourseCompletionModal
          assignment={completingAssignment}
          caregiverId={profile.id}
          onClose={() => setCompletingAssignment(null)}
          onCompleted={() => {
            setCompletingAssignment(null)
            loadProfileData()
          }}
        />
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </MainLayout>
  )
}
