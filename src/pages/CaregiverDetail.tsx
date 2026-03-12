import React, { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { MainLayout } from '../components/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { StatusBadge } from '../components/StatusBadge'
import { CourseAssignmentModal } from '../components/CourseAssignmentModal'
import { CourseCompletionModal } from '../components/CourseCompletionModal'
import { profileService } from '../services/profiles'
import { courseService } from '../services/courses'
import { learningPathService } from '../services/learningPaths'
import { complianceService } from '../services/compliance'
import type { Profile, CourseAssignment, LearningPathAssignment, CaregiverComplianceSummary } from '../types'
import { ArrowLeft, User, Mail, Building2, Calendar, BookOpen, FolderTree, CircleCheck as CheckCircle, Clock, CircleAlert as AlertCircle, CreditCard as Edit, Plus, ExternalLink } from 'lucide-react'

export function CaregiverDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [caregiver, setCaregiver] = useState<Profile | null>(null)
  const [courseAssignments, setCourseAssignments] = useState<CourseAssignment[]>([])
  const [pathAssignments, setPathAssignments] = useState<LearningPathAssignment[]>([])
  const [complianceDetail, setComplianceDetail] = useState<CaregiverComplianceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<CourseAssignment | null>(null)
  const [showCompletionModal, setShowCompletionModal] = useState(false)

  useEffect(() => {
    if (id) {
      loadCaregiverData()
    }
  }, [id])

  const loadCaregiverData = async () => {
    if (!id) return

    try {
      setLoading(true)
      const [profileData, courses, paths, compliance] = await Promise.all([
        profileService.getProfile(id),
        courseService.getCaregiverAssignments(id),
        learningPathService.getAssignments(id),
        complianceService.getCaregiverComplianceDetail(id)
      ])
      setCaregiver(profileData)
      setCourseAssignments(courses)
      setPathAssignments(paths)
      setComplianceDetail(compliance)
    } catch (error) {
      console.error('Error loading caregiver data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartCourse = async (assignment: CourseAssignment) => {
    try {
      await courseService.startCourse(assignment.id)
      loadCaregiverData()
    } catch (error) {
      console.error('Error starting course:', error)
    }
  }

  const handleMarkComplete = (assignment: CourseAssignment) => {
    setSelectedAssignment(assignment)
    setShowCompletionModal(true)
  }

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading caregiver details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!caregiver) {
    return (
      <div>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-600">Caregiver not found</p>
            <Link
              to="/caregivers"
              className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft size={20} />
              Back to Caregivers
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            to="/caregivers"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Caregivers
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                {caregiver.first_name} {caregiver.last_name}
              </h1>
              <p className="text-gray-600 mt-2">{caregiver.email}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAssignModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                Assign Training
              </button>
              <button
                onClick={() => navigate(`/caregivers`)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Edit size={20} />
                Edit
              </button>
            </div>
          </div>
        </div>

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
                      {caregiver.first_name} {caregiver.last_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="text-gray-400 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900">{caregiver.email}</p>
                  </div>
                </div>

                {caregiver.organization && (
                  <div className="flex items-start gap-3">
                    <Building2 className="text-gray-400 mt-1" size={20} />
                    <div>
                      <p className="text-sm text-gray-600">Organization</p>
                      <p className="font-medium text-gray-900">{caregiver.organization}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <Calendar className="text-gray-400 mt-1" size={20} />
                  <div>
                    <p className="text-sm text-gray-600">Hire Date</p>
                    <p className="font-medium text-gray-900">
                      {caregiver.hire_date
                        ? new Date(caregiver.hire_date).toLocaleDateString()
                        : 'Not set'}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        caregiver.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {caregiver.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {complianceDetail && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Compliance Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">Orientation</span>
                      {complianceDetail.orientation_complete ? (
                        <CheckCircle className="text-green-600" size={20} />
                      ) : (
                        <AlertCircle className="text-red-600" size={20} />
                      )}
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">ANE Training</span>
                      {complianceDetail.ane_training_complete ? (
                        <CheckCircle className="text-green-600" size={20} />
                      ) : (
                        <AlertCircle className="text-red-600" size={20} />
                      )}
                    </div>
                    <div className="p-3 bg-gray-50 rounded">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">Annual CE Hours</span>
                        <span className="font-semibold text-gray-900">
                          {complianceDetail.annual_ce_hours_current_year}/12
                        </span>
                      </div>
                      <div className="mt-2 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{
                            width: `${Math.min(
                              (complianceDetail.annual_ce_hours_current_year / 12) * 100,
                              100
                            )}%`
                          }}
                        />
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">Overall Status</span>
                        {complianceDetail.compliance_status === 'compliant' && (
                          <StatusBadge status="compliant" />
                        )}
                        {complianceDetail.compliance_status === 'overdue' && (
                          <StatusBadge status="overdue" />
                        )}
                        {complianceDetail.compliance_status === 'in_progress' && (
                          <StatusBadge status="in-progress" text="In Progress" />
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BookOpen className="text-blue-600" size={20} />
                    <CardTitle>Course Assignments</CardTitle>
                  </div>
                  <span className="text-sm text-gray-600">
                    {courseAssignments.length} assignment{courseAssignments.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {courseAssignments.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="mx-auto text-gray-400 mb-3" size={48} />
                    <p className="text-gray-500">No course assignments yet</p>
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Assign a course
                    </button>
                  </div>
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
                                    <Clock size={14} />
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
                            {!isCompleted && (
                              <div className="flex flex-col gap-2">
                                {isNotStarted && (
                                  <button
                                    onClick={() => handleStartCourse(assignment)}
                                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium whitespace-nowrap"
                                  >
                                    Start Course
                                  </button>
                                )}
                                {assignment.course?.external_url && (
                                  <a
                                    href={assignment.course.external_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium whitespace-nowrap"
                                  >
                                    <ExternalLink size={16} />
                                    View Course
                                  </a>
                                )}
                                {isInProgress && (
                                  <button
                                    onClick={() => handleMarkComplete(assignment)}
                                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium whitespace-nowrap"
                                  >
                                    <CheckCircle size={16} />
                                    Mark Complete
                                  </button>
                                )}
                              </div>
                            )}
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FolderTree className="text-purple-600" size={20} />
                    <CardTitle>Learning Path Assignments</CardTitle>
                  </div>
                  <span className="text-sm text-gray-600">
                    {pathAssignments.length} assignment{pathAssignments.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {pathAssignments.length === 0 ? (
                  <div className="text-center py-8">
                    <FolderTree className="mx-auto text-gray-400 mb-3" size={48} />
                    <p className="text-gray-500">No learning path assignments yet</p>
                    <button
                      onClick={() => setShowAssignModal(true)}
                      className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Assign a learning path
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pathAssignments.map((assignment) => (
                      <div
                        key={assignment.id}
                        className="p-4 border border-gray-200 rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-purple-100 rounded flex-shrink-0">
                            <FolderTree className="text-purple-600" size={20} />
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
                            {assignment.completed_at && (
                              <p className="text-sm text-green-600 mt-2 font-medium">
                                Completed: {new Date(assignment.completed_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {showAssignModal && (
        <CourseAssignmentModal
          caregiver={caregiver}
          onClose={() => setShowAssignModal(false)}
          onAssigned={() => {
            loadCaregiverData()
          }}
        />
      )}

      {showCompletionModal && selectedAssignment && (
        <CourseCompletionModal
          assignment={selectedAssignment}
          onClose={() => {
            setShowCompletionModal(false)
            setSelectedAssignment(null)
          }}
          onComplete={() => {
            loadCaregiverData()
            setShowCompletionModal(false)
            setSelectedAssignment(null)
          }}
        />
      )}
    </MainLayout>
  )
}
