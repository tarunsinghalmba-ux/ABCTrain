import React, { useEffect, useState } from 'react'
import { MainLayout } from '../components/MainLayout'
import { CourseCompletionModal } from '../components/CourseCompletionModal'
import { courseService } from '../services/courses'
import { useAuth } from '../contexts/AuthContext'
import type { CourseAssignment } from '../types'
import { BookOpen, Clock, Calendar, ExternalLink, CircleCheck as CheckCircle, Play, Upload } from 'lucide-react'

export function MyCourses() {
  const { user } = useAuth()
  const [assignments, setAssignments] = useState<CourseAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAssignment, setSelectedAssignment] = useState<CourseAssignment | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'in_progress' | 'completed'>('all')

  useEffect(() => {
    loadAssignments()
  }, [])

  const loadAssignments = async () => {
    try {
      if (!user?.id) return
      const data = await courseService.getCaregiverAssignments(user.id)
      setAssignments(data)
    } catch (error) {
      console.error('Error loading assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartCourse = async (assignment: CourseAssignment) => {
    try {
      await courseService.startCourse(assignment.id)
      setAssignments(assignments.map(a =>
        a.id === assignment.id ? { ...a, status: 'in_progress' } : a
      ))

      if (assignment.course?.external_url) {
        window.open(assignment.course.external_url, '_blank')
      }
    } catch (error) {
      console.error('Error starting course:', error)
    }
  }

  const handleOpenCourse = (assignment: CourseAssignment) => {
    if (assignment.course?.external_url) {
      window.open(assignment.course.external_url, '_blank')
    }
  }

  const handleMarkComplete = (assignment: CourseAssignment) => {
    setSelectedAssignment(assignment)
  }

  const filteredAssignments = assignments.filter(a => {
    if (filter === 'all') return true
    const status = a.status || 'not_started'
    if (filter === 'pending') return status === 'not_started'
    return status === filter
  })

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'in_progress':
        return 'In Progress'
      default:
        return 'Not Started'
    }
  }

  const getDaysUntilDue = (dueDate: string) => {
    const today = new Date()
    const due = new Date(dueDate)
    const diffTime = due.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getDueDateColor = (dueDate: string, status?: string) => {
    if (status === 'completed') return 'text-green-600'

    const days = getDaysUntilDue(dueDate)
    if (days < 0) return 'text-red-600 font-semibold'
    if (days <= 7) return 'text-yellow-600 font-semibold'
    return 'text-gray-600'
  }

  const getDueDateText = (dueDate: string, status?: string) => {
    if (status === 'completed') return `Completed on ${new Date(dueDate).toLocaleDateString()}`

    const days = getDaysUntilDue(dueDate)
    if (days < 0) return `Overdue by ${Math.abs(days)} days`
    if (days === 0) return 'Due today'
    if (days === 1) return 'Due tomorrow'
    if (days <= 7) return `Due in ${days} days`
    return `Due ${new Date(dueDate).toLocaleDateString()}`
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Courses</h1>
          <p className="text-gray-600">View and complete your assigned training courses</p>
        </div>

        <div className="mb-6 flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({assignments.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'pending'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Not Started ({assignments.filter(a => !a.status || a.status === 'not_started').length})
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'in_progress'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            In Progress ({assignments.filter(a => a.status === 'in_progress').length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              filter === 'completed'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Completed ({assignments.filter(a => a.status === 'completed').length})
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading your courses...</p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No courses assigned yet' : `No ${filter.replace('_', ' ')} courses`}
            </h3>
            <p className="text-gray-600">
              {filter === 'all'
                ? 'Your assigned courses will appear here'
                : `You don't have any ${filter.replace('_', ' ')} courses`}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredAssignments.map((assignment) => (
              <div key={assignment.id} className="card p-6 hover:shadow-lg transition">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                          {assignment.course?.title}
                        </h3>
                        <div className="flex flex-wrap gap-2 mb-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getStatusColor(assignment.status)}`}>
                            {getStatusText(assignment.status)}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {assignment.course?.category}
                          </span>
                          {assignment.course?.is_required && (
                            <span className="inline-flex items-center px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">
                              Required
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {assignment.course?.description && (
                      <p className="text-gray-600 mb-3">{assignment.course.description}</p>
                    )}

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                      {assignment.course?.estimated_duration_minutes && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          <span>{assignment.course.estimated_duration_minutes} mins</span>
                        </div>
                      )}
                      {assignment.course?.ce_hours && assignment.course.ce_hours > 0 && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4" />
                          <span>{assignment.course.ce_hours} CE hours</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span className={getDueDateColor(assignment.due_date, assignment.status)}>
                          {getDueDateText(
                            assignment.status === 'completed' && assignment.completion_date
                              ? assignment.completion_date
                              : assignment.due_date,
                            assignment.status
                          )}
                        </span>
                      </div>
                    </div>

                    {assignment.course?.source_provider && (
                      <p className="text-sm text-gray-500 mt-2">
                        Provider: {assignment.course.source_provider}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 lg:min-w-[200px]">
                    {assignment.status === 'completed' ? (
                      <>
                        <button
                          disabled
                          className="btn-primary flex items-center justify-center gap-2 opacity-50 cursor-not-allowed"
                        >
                          <CheckCircle size={20} />
                          <span>Completed</span>
                        </button>
                        {assignment.certificate_url && (
                          <a
                            href={assignment.certificate_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-outline flex items-center justify-center gap-2"
                          >
                            <ExternalLink size={18} />
                            <span>View Certificate</span>
                          </a>
                        )}
                      </>
                    ) : assignment.status === 'in_progress' ? (
                      <>
                        <button
                          onClick={() => handleOpenCourse(assignment)}
                          className="btn-outline flex items-center justify-center gap-2"
                        >
                          <ExternalLink size={20} />
                          <span>Continue Course</span>
                        </button>
                        <button
                          onClick={() => handleMarkComplete(assignment)}
                          className="btn-primary flex items-center justify-center gap-2"
                        >
                          <Upload size={20} />
                          <span>Mark Complete</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleStartCourse(assignment)}
                        className="btn-primary flex items-center justify-center gap-2"
                      >
                        <Play size={20} />
                        <span>Start Course</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />

      {selectedAssignment && user && (
        <CourseCompletionModal
          assignment={selectedAssignment}
          caregiverId={user.id}
          onClose={() => setSelectedAssignment(null)}
          onCompleted={loadAssignments}
        />
      )}
    </MainLayout>
  )
}
