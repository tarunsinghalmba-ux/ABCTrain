import React, { useEffect, useState } from 'react'
import { courseService } from '../services/courses'
import { learningPathService } from '../services/learningPaths'
import { useAuth } from '../contexts/AuthContext'
import type { Course, LearningPathWithCourses, Profile } from '../types'
import { X, BookOpen, FolderTree } from 'lucide-react'

interface CourseAssignmentModalProps {
  caregiver: Profile
  onClose: () => void
  onAssigned?: () => void
}

interface ToastMessage {
  type: 'success' | 'error'
  message: string
}

export function CourseAssignmentModal({ caregiver, onClose, onAssigned }: CourseAssignmentModalProps) {
  const { user } = useAuth()
  const [assignmentType, setAssignmentType] = useState<'course' | 'path'>('course')
  const [courses, setCourses] = useState<Course[]>([])
  const [paths, setPaths] = useState<LearningPathWithCourses[]>([])
  const [selectedId, setSelectedId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [coursesData, pathsData] = await Promise.all([
        courseService.getCourses(),
        learningPathService.getAll()
      ])
      setCourses(coursesData.filter(c => c.is_active))
      setPaths(pathsData.filter(p => p.is_active))
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedId) return

    try {
      setSubmitting(true)

      if (assignmentType === 'course') {
        await courseService.assignCourses(
          [selectedId],
          caregiver.id,
          dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          user.id
        )
      } else {
        await learningPathService.assignToCaregiver(
          selectedId,
          caregiver.id,
          user.id,
          dueDate || undefined
        )
      }

      setToast({
        type: 'success',
        message: `Successfully assigned ${assignmentType === 'course' ? 'course' : 'learning path'} to ${caregiver.first_name}`
      })

      setTimeout(() => {
        onAssigned?.()
        onClose()
      }, 1500)
    } catch (err: any) {
      console.error('Error assigning:', err)
      setToast({
        type: 'error',
        message: err.message || 'Failed to assign. Please try again.'
      })
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Assign Training</h2>
            <p className="text-sm text-slate-600 mt-1">
              Assign to: {caregiver.first_name} {caregiver.last_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Assignment Type
            </label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setAssignmentType('course')
                  setSelectedId('')
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  assignmentType === 'course'
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-slate-300 text-slate-700 hover:border-slate-400'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                <span className="font-medium">Individual Course</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAssignmentType('path')
                  setSelectedId('')
                }}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-colors ${
                  assignmentType === 'path'
                    ? 'border-blue-600 bg-blue-50 text-blue-900'
                    : 'border-slate-300 text-slate-700 hover:border-slate-400'
                }`}
              >
                <FolderTree className="w-5 h-5" />
                <span className="font-medium">Learning Path</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {assignmentType === 'course' ? 'Select Course' : 'Select Learning Path'}
              </label>
              {loading ? (
                <div className="text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <div className="border border-slate-300 rounded-lg max-h-96 overflow-y-auto">
                  {assignmentType === 'course' ? (
                    <>
                      {courses.length === 0 ? (
                        <div className="p-8 text-center text-slate-600">
                          No active courses available
                        </div>
                      ) : (
                        courses.map((course) => (
                          <label
                            key={course.id}
                            className={`flex items-start gap-3 p-4 border-b border-slate-200 last:border-b-0 cursor-pointer hover:bg-slate-50 transition-colors ${
                              selectedId === course.id ? 'bg-blue-50' : ''
                            }`}
                          >
                            <input
                              type="radio"
                              name="assignment"
                              value={course.id}
                              checked={selectedId === course.id}
                              onChange={(e) => setSelectedId(e.target.value)}
                              className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-slate-900">{course.title}</div>
                              {course.description && (
                                <div className="text-sm text-slate-600 mt-1">{course.description}</div>
                              )}
                              <div className="flex gap-2 mt-2">
                                {course.category && (
                                  <span className="text-xs px-2 py-1 bg-slate-200 text-slate-700 rounded">
                                    {course.category}
                                  </span>
                                )}
                                {course.ce_hours && (
                                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                                    {course.ce_hours} CE hours
                                  </span>
                                )}
                                {course.is_required && (
                                  <span className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded">
                                    Required
                                  </span>
                                )}
                              </div>
                            </div>
                          </label>
                        ))
                      )}
                    </>
                  ) : (
                    <>
                      {paths.length === 0 ? (
                        <div className="p-8 text-center text-slate-600">
                          No active learning paths available
                        </div>
                      ) : (
                        paths.map((path) => (
                          <label
                            key={path.id}
                            className={`flex items-start gap-3 p-4 border-b border-slate-200 last:border-b-0 cursor-pointer hover:bg-slate-50 transition-colors ${
                              selectedId === path.id ? 'bg-blue-50' : ''
                            }`}
                          >
                            <input
                              type="radio"
                              name="assignment"
                              value={path.id}
                              checked={selectedId === path.id}
                              onChange={(e) => setSelectedId(e.target.value)}
                              className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500"
                            />
                            <div className="flex-1">
                              <div className="font-medium text-slate-900">{path.name}</div>
                              {path.description && (
                                <div className="text-sm text-slate-600 mt-1">{path.description}</div>
                              )}
                              <div className="text-sm text-slate-600 mt-2">
                                {path.courses.length} course{path.courses.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </label>
                        ))
                      )}
                    </>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Due Date (Optional)
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {toast && (
              <div className={`p-4 rounded-lg ${
                toast.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
              }`}>
                <p className={`text-sm font-medium ${
                  toast.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {toast.message}
                </p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={!selectedId || submitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
              >
                {submitting ? 'Assigning...' : 'Assign'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
