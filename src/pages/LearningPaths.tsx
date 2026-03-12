import React, { useEffect, useState } from 'react'
import { MainLayout } from '../components/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { ToastContainer } from '../components/ToastContainer'
import { learningPathService } from '../services/learningPaths'
import { courseService } from '../services/courses'
import { profileService } from '../services/profiles'
import { useAuth } from '../contexts/AuthContext'
import type { LearningPathWithCourses, Course, Profile } from '../types'
import { Plus, CreditCard as Edit, Trash2, BookOpen, Users, GripVertical, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

export function LearningPaths() {
  const { user, profile } = useAuth()
  const [paths, setPaths] = useState<LearningPathWithCourses[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [caregivers, setCaregivers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingPath, setEditingPath] = useState<LearningPathWithCourses | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedPath, setSelectedPath] = useState<LearningPathWithCourses | null>(null)
  const [toasts, setToasts] = useState<Array<{ id: number; message: string; type: ToastType }>>([])
  const [toastId, setToastId] = useState(0)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true,
    selectedCourses: [] as string[]
  })

  const [assignmentData, setAssignmentData] = useState({
    caregiverId: '',
    dueDate: ''
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
      const [pathsData, coursesData, caregiversData] = await Promise.all([
        learningPathService.getAll(),
        courseService.getCourses(),
        profileService.getCaregivers()
      ])
      setPaths(pathsData)
      setCourses(coursesData)
      setCaregivers(caregiversData)
    } catch (err) {
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      if (editingPath) {
        await learningPathService.update(editingPath.id, {
          name: formData.name,
          description: formData.description,
          is_active: formData.is_active
        })

        const existingCourseIds = editingPath.courses.map(c => c.course_id)
        const coursesToAdd = formData.selectedCourses.filter(id => !existingCourseIds.includes(id))
        const coursesToRemove = existingCourseIds.filter(id => !formData.selectedCourses.includes(id))

        for (const courseId of coursesToRemove) {
          await learningPathService.removeCourse(editingPath.id, courseId)
        }

        for (let i = 0; i < coursesToAdd.length; i++) {
          await learningPathService.addCourse(
            editingPath.id,
            coursesToAdd[i],
            existingCourseIds.length + i
          )
        }
      } else {
        const newPath = await learningPathService.create({
          organization: profile?.organization || '',
          name: formData.name,
          description: formData.description,
          is_active: formData.is_active,
          created_by: user.id
        })

        for (let i = 0; i < formData.selectedCourses.length; i++) {
          await learningPathService.addCourse(newPath.id, formData.selectedCourses[i], i)
        }
      }

      await loadData()
      resetForm()
    } catch (err) {
      console.error('Error saving learning path:', err)
    }
  }

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPath || !user || !assignmentData.caregiverId) return

    try {
      await learningPathService.assignToCaregiver(
        selectedPath.id,
        assignmentData.caregiverId,
        user.id,
        assignmentData.dueDate || undefined
      )

      const caregiver = caregivers.find(c => c.id === assignmentData.caregiverId)
      const caregiverName = caregiver ? `${caregiver.first_name} ${caregiver.last_name}` : 'caregiver'

      showToast(
        `Learning path "${selectedPath.name}" and all its courses have been assigned to ${caregiverName}`,
        'success'
      )

      setShowAssignModal(false)
      setSelectedPath(null)
      setAssignmentData({ caregiverId: '', dueDate: '' })
    } catch (err) {
      console.error('Error assigning path:', err)
      showToast('Failed to assign learning path. Please try again.', 'error')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this learning path?')) return

    try {
      await learningPathService.delete(id)
      await loadData()
    } catch (err) {
      console.error('Error deleting path:', err)
    }
  }

  const handleEdit = (path: LearningPathWithCourses) => {
    setEditingPath(path)
    setFormData({
      name: path.name,
      description: path.description || '',
      is_active: path.is_active,
      selectedCourses: path.courses.map(c => c.course_id)
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_active: true,
      selectedCourses: []
    })
    setEditingPath(null)
    setShowForm(false)
  }

  const toggleCourse = (courseId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedCourses: prev.selectedCourses.includes(courseId)
        ? prev.selectedCourses.filter(id => id !== courseId)
        : [...prev.selectedCourses, courseId]
    }))
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
              <h1 className="text-3xl font-bold text-slate-900">Learning Paths</h1>
              <p className="text-slate-600 mt-2">Group courses together and assign them to caregivers</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Learning Path
            </button>
          </div>

          {showForm && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>{editingPath ? 'Edit' : 'Create'} Learning Path</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Path Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Select Courses
                    </label>
                    <div className="border border-slate-300 rounded-lg p-4 max-h-96 overflow-y-auto">
                      {courses.map((course) => (
                        <label
                          key={course.id}
                          className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.selectedCourses.includes(course.id)}
                            onChange={() => toggleCourse(course.id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-slate-900">{course.title}</div>
                            {course.category && (
                              <div className="text-sm text-slate-600">{course.category}</div>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-slate-700">
                      Active
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {editingPath ? 'Update' : 'Create'} Path
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

          <div className="grid gap-6">
            {paths.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-600">No learning paths yet. Create one to get started!</p>
                </CardContent>
              </Card>
            ) : (
              paths.map((path) => (
                <Card key={path.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle>{path.name}</CardTitle>
                        {path.description && (
                          <p className="text-sm text-slate-600 mt-1">{path.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {!path.is_active && (
                          <span className="px-2 py-1 text-xs bg-slate-200 text-slate-700 rounded">
                            Inactive
                          </span>
                        )}
                        <button
                          onClick={() => {
                            setSelectedPath(path)
                            setShowAssignModal(true)
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Assign to caregiver"
                        >
                          <Users className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleEdit(path)}
                          className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(path.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-slate-700 mb-3">
                        Courses ({path.courses.length})
                      </div>
                      {path.courses
                        .sort((a, b) => a.sequence_order - b.sequence_order)
                        .map((pathCourse, index) => (
                          <div
                            key={pathCourse.id}
                            className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                          >
                            <GripVertical className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-500 w-6">
                              {index + 1}.
                            </span>
                            <div className="flex-1">
                              <div className="font-medium text-slate-900">
                                {pathCourse.course?.title}
                              </div>
                              {pathCourse.course?.category && (
                                <div className="text-sm text-slate-600">
                                  {pathCourse.course.category}
                                </div>
                              )}
                            </div>
                            {pathCourse.course?.ce_hours && (
                              <span className="text-sm text-slate-600">
                                {pathCourse.course.ce_hours} CE hours
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </main>

      {showAssignModal && selectedPath && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900">Assign Learning Path</h2>
              <button
                onClick={() => {
                  setShowAssignModal(false)
                  setSelectedPath(null)
                  setAssignmentData({ caregiverId: '', dueDate: '' })
                }}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-slate-600 mb-2">
                Assigning: <span className="font-medium">{selectedPath.name}</span>
              </p>
              <p className="text-xs text-slate-500 bg-blue-50 p-3 rounded-lg">
                All {selectedPath.courses.length} courses in this learning path will be automatically assigned to the selected caregiver.
              </p>
            </div>

            <form onSubmit={handleAssign} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Caregiver
                </label>
                <select
                  value={assignmentData.caregiverId}
                  onChange={(e) => setAssignmentData({ ...assignmentData, caregiverId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select caregiver...</option>
                  {caregivers
                    .filter(c => c.is_active)
                    .map((caregiver) => (
                      <option key={caregiver.id} value={caregiver.id}>
                        {caregiver.first_name} {caregiver.last_name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Due Date (Optional)
                </label>
                <input
                  type="date"
                  value={assignmentData.dueDate}
                  onChange={(e) => setAssignmentData({ ...assignmentData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Assign Path
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAssignModal(false)
                    setSelectedPath(null)
                    setAssignmentData({ caregiverId: '', dueDate: '' })
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </MainLayout>
  )
}
