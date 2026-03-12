import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { complianceService } from '../services/compliance'
import { courseService } from '../services/courses'
import { learningPathService } from '../services/learningPaths'
import { dashboardService, DashboardStats, ActivityItem } from '../services/dashboard'
import { MainLayout } from '../components/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { StatusBadge } from '../components/StatusBadge'
import type { ComplianceStatus, CourseAssignment, LearningPathAssignment } from '../types'
import { CircleAlert as AlertCircle, CircleCheck as CheckCircle, Clock, Users, TrendingUp, FolderTree, ArrowRight } from 'lucide-react'

export function Dashboard() {
  const { profile } = useAuth()
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus | null>(null)
  const [assignments, setAssignments] = useState<CourseAssignment[]>([])
  const [pathAssignments, setPathAssignments] = useState<LearningPathAssignment[]>([])
  const [adminStats, setAdminStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!profile?.id) return

      try {
        if (profile.role === 'caregiver') {
          const status = await complianceService.getComplianceStatus(profile.id)
          setComplianceStatus(status)

          const [caregiverAssignments, pathAssignments] = await Promise.all([
            courseService.getCaregiverAssignments(profile.id),
            learningPathService.getAssignments(profile.id)
          ])
          setAssignments(caregiverAssignments)
          setPathAssignments(pathAssignments)
        } else if (profile.role === 'admin' || profile.role === 'manager') {
          const stats = await dashboardService.getAdminStats()
          setAdminStats(stats)

          const activity = await dashboardService.getRecentActivity()
          setRecentActivity(activity)
        }
      } catch (error) {
        console.error('Error loading dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [profile?.id, profile?.role])

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading dashboard...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Dashboard</h1>

        {profile?.role === 'caregiver' && complianceStatus && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card p-6">
                <p className="text-gray-600 text-sm font-medium mb-2">Total Assignments</p>
                <p className="text-3xl font-bold text-gray-900">{complianceStatus.total_assignments}</p>
              </div>

              <div className="card p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium mb-2">Completed</p>
                    <p className="text-3xl font-bold text-green-600">{complianceStatus.completed}</p>
                  </div>
                  <CheckCircle className="text-green-600" size={24} />
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium mb-2">Pending</p>
                    <p className="text-3xl font-bold text-yellow-600">{complianceStatus.pending}</p>
                  </div>
                  <Clock className="text-yellow-600" size={24} />
                </div>
              </div>

              <div className="card p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium mb-2">Overdue</p>
                    <p className="text-3xl font-bold text-red-600">{complianceStatus.overdue}</p>
                  </div>
                  <AlertCircle className="text-red-600" size={24} />
                </div>
              </div>
            </div>

            <div className="card p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Compliance Status</h2>
              <div className={`inline-block px-4 py-2 rounded-lg font-medium ${
                complianceStatus.status === 'compliant'
                  ? 'bg-green-100 text-green-800'
                  : complianceStatus.status === 'overdue'
                  ? 'bg-red-100 text-red-800'
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {complianceStatus.status === 'compliant' ? '✓ Compliant' :
                 complianceStatus.status === 'overdue' ? '⚠ Overdue' :
                 'Action Required'}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Course Assignments</h2>
                  {assignments.length > 0 && (
                    <Link to="/my-courses" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                      View all <ArrowRight size={16} />
                    </Link>
                  )}
                </div>
                <div className="space-y-3">
                  {assignments.length === 0 ? (
                    <p className="text-gray-500 text-sm">No individual course assignments</p>
                  ) : (
                    assignments.slice(0, 5).map((assignment) => (
                      <div key={assignment.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{assignment.course?.title}</p>
                          <p className="text-sm text-gray-600">Due: {new Date(assignment.due_date).toLocaleDateString()}</p>
                          {assignment.course?.category && (
                            <span className="inline-block mt-1 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                              {assignment.course.category}
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="card p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Learning Path Assignments</h2>
                <div className="space-y-3">
                  {pathAssignments.length === 0 ? (
                    <p className="text-gray-500 text-sm">No learning path assignments</p>
                  ) : (
                    pathAssignments.slice(0, 5).map((assignment) => (
                      <div key={assignment.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="p-2 bg-purple-100 rounded">
                          <FolderTree className="h-4 w-4 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{assignment.learning_path?.name}</p>
                          {assignment.due_date && (
                            <p className="text-sm text-gray-600">Due: {new Date(assignment.due_date).toLocaleDateString()}</p>
                          )}
                          {assignment.learning_path?.description && (
                            <p className="text-sm text-gray-500 mt-1">{assignment.learning_path.description}</p>
                          )}
                          <span className={`inline-block mt-2 text-xs px-2 py-1 rounded font-medium ${
                            assignment.status === 'completed' ? 'bg-green-100 text-green-700' :
                            assignment.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {assignment.status === 'completed' ? 'Completed' :
                             assignment.status === 'in_progress' ? 'In Progress' :
                             'Assigned'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {(profile?.role === 'admin' || profile?.role === 'manager') && adminStats && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Total Caregivers</p>
                      <p className="text-3xl font-bold text-gray-900">{adminStats.total_caregivers}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Users className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-2">Compliance Rate</p>
                      <p className="text-3xl font-bold text-green-600">{adminStats.compliance_percentage}%</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Link to="/courses?filter=due_soon">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Due Soon</p>
                        <p className="text-3xl font-bold text-yellow-600">{adminStats.due_soon_count}</p>
                        {adminStats.due_soon_count > 0 && (
                          <div className="flex items-center gap-1 mt-2 text-sm text-yellow-700 font-medium">
                            View details <ArrowRight size={16} />
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-yellow-100 rounded-lg">
                        <Clock className="h-6 w-6 text-yellow-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link to="/courses?filter=overdue">
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-2">Overdue</p>
                        <p className="text-3xl font-bold text-red-600">{adminStats.overdue_count}</p>
                        {adminStats.overdue_count > 0 && (
                          <div className="flex items-center gap-1 mt-2 text-sm text-red-700 font-medium">
                            View details <ArrowRight size={16} />
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-red-100 rounded-lg">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentActivity.length === 0 ? (
                      <p className="text-gray-500 text-sm">No recent activity</p>
                    ) : (
                      recentActivity.map((activity) => (
                        <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="p-2 bg-green-100 rounded">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900">{activity.caregiver_name}</p>
                            <p className="text-sm text-gray-600 truncate">{activity.course_title}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(activity.timestamp).toLocaleDateString()} at {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <a
                      href="/courses"
                      className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <h3 className="font-semibold text-blue-900 mb-1">Manage Courses</h3>
                      <p className="text-sm text-blue-700">Create and manage your course catalog</p>
                    </a>
                    <a
                      href="/learning-paths"
                      className="block p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                    >
                      <h3 className="font-semibold text-purple-900 mb-1">Learning Paths</h3>
                      <p className="text-sm text-purple-700">Group courses and assign training paths</p>
                    </a>
                    <a
                      href="/caregivers"
                      className="block p-4 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors"
                    >
                      <h3 className="font-semibold text-teal-900 mb-1">Manage Caregivers</h3>
                      <p className="text-sm text-teal-700">Add caregivers and assign training</p>
                    </a>
                    <a
                      href="/compliance"
                      className="block p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                    >
                      <h3 className="font-semibold text-green-900 mb-1">Compliance Dashboard</h3>
                      <p className="text-sm text-green-700">View training compliance and export reports</p>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
