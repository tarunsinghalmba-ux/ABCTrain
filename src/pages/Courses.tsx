import React, { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { MainLayout } from '../components/MainLayout'
import { courseService } from '../services/courses'
import type { Course, CourseAssignment } from '../types'
import { Plus, CreditCard as Edit2, Trash2, CircleAlert as AlertCircle, Clock, ExternalLink, ArrowLeft } from 'lucide-react'

export function Courses() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [courses, setCourses] = useState<Course[]>([])
  const [assignments, setAssignments] = useState<CourseAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterView, setFilterView] = useState<'all' | 'due_soon' | 'overdue'>('all')
  const [formData, setFormData] = useState<Partial<Course>>({
    title: '',
    description: '',
    category: '',
    estimated_duration_minutes: 60,
    delivery_format: 'external_link',
    source_provider: '',
    external_url: '',
    compliance_tag: '',
    regulation_reference: '',
    is_required: false,
    ce_hours: 0,
    is_active: true
  })

  useEffect(() => {
    loadCourses()
    loadAssignments()

    const filter = searchParams.get('filter')
    if (filter === 'due_soon' || filter === 'overdue') {
      setFilterView(filter)
    }
  }, [searchParams])

  const loadCourses = async () => {
    try {
      const data = await courseService.getCourses()
      setCourses(data)
    } catch (error) {
      console.error('Error loading courses:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadAssignments = async () => {
    try {
      const data = await courseService.getAllAssignments()
      setAssignments(data)
    } catch (error) {
      console.error('Error loading assignments:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingId) {
        const updated = await courseService.updateCourse(editingId, formData)
        setCourses(courses.map(c => c.id === editingId ? updated : c))
        setEditingId(null)
      } else {
        const created = await courseService.createCourse(formData as Omit<Course, 'id' | 'created_at' | 'updated_at'>)
        setCourses([...courses, created])
      }
      setFormData({
        title: '',
        description: '',
        category: '',
        estimated_duration_minutes: 60,
        delivery_format: 'external_link',
        source_provider: '',
        external_url: '',
        compliance_tag: '',
        regulation_reference: '',
        is_required: false,
        ce_hours: 0,
        is_active: true
      })
      setShowForm(false)
    } catch (error) {
      console.error('Error saving course:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to deactivate this course?')) return

    try {
      await courseService.deleteCourse(id)
      setCourses(courses.filter(c => c.id !== id))
    } catch (error) {
      console.error('Error deleting course:', error)
    }
  }

  const handleEdit = (course: Course) => {
    setFormData(course)
    setEditingId(course.id)
    setShowForm(true)
  }

  const getDueSoonAssignments = () => {
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    return assignments.filter(a => {
      const dueDate = new Date(a.due_date)
      return dueDate >= now && dueDate <= thirtyDaysFromNow
    })
  }

  const getOverdueAssignments = () => {
    const now = new Date()
    return assignments.filter(a => {
      const dueDate = new Date(a.due_date)
      return dueDate < now
    })
  }

  const displayAssignments = filterView === 'due_soon'
    ? getDueSoonAssignments()
    : filterView === 'overdue'
    ? getOverdueAssignments()
    : []

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filterView !== 'all' && (
          <div className="mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-4"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </Link>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {filterView === 'due_soon' && (
                  <>
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <Clock className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Due Soon</h2>
                      <p className="text-gray-600">Assignments due within the next 30 days</p>
                    </div>
                  </>
                )}
                {filterView === 'overdue' && (
                  <>
                    <div className="p-3 bg-red-100 rounded-lg">
                      <AlertCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Overdue Assignments</h2>
                      <p className="text-gray-600">Assignments past their due date</p>
                    </div>
                  </>
                )}
              </div>
              <button
                onClick={() => {
                  setFilterView('all')
                  setSearchParams({})
                }}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                View All Courses
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {displayAssignments.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <p className="text-gray-500">
                    {filterView === 'due_soon'
                      ? 'No assignments due soon'
                      : 'No overdue assignments'}
                  </p>
                </div>
              ) : (
                displayAssignments.map((assignment) => (
                  <div
                    key={assignment.id}
                    className={`p-4 rounded-lg border-2 ${
                      filterView === 'overdue'
                        ? 'border-red-200 bg-red-50'
                        : 'border-yellow-200 bg-yellow-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {assignment.course?.title}
                          </h3>
                          {filterView === 'overdue' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                              <AlertCircle size={14} />
                              Overdue
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded">
                              <Clock size={14} />
                              Due Soon
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          Caregiver: {assignment.caregiver?.first_name} {assignment.caregiver?.last_name}
                        </p>
                        <p className={`text-sm font-medium mt-1 ${
                          filterView === 'overdue' ? 'text-red-700' : 'text-yellow-700'
                        }`}>
                          Due: {new Date(assignment.due_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {filterView === 'all' && (
          <>
            <div className="flex items-center justify-between mb-8">
              <h1 className="text-4xl font-bold text-gray-900">Course Catalog</h1>
              <button
            onClick={() => {
              setEditingId(null)
              setFormData({
                title: '',
                description: '',
                category: '',
                estimated_duration_minutes: 60,
                delivery_format: 'external_link',
                source_provider: '',
                external_url: '',
                compliance_tag: '',
                regulation_reference: '',
                is_required: false,
                ce_hours: 0,
                is_active: true
              })
              setShowForm(true)
            }}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus size={20} />
            <span>Add Course</span>
          </button>
        </div>

        {showForm && (
          <div className="card p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">{editingId ? 'Edit Course' : 'Add New Course'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Title *</label>
                  <input
                    type="text"
                    value={formData.title || ''}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="input-field"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Infection Control, Safety Training"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Format *</label>
                  <select
                    value={formData.delivery_format || 'external_link'}
                    onChange={(e) => setFormData({ ...formData, delivery_format: e.target.value as any })}
                    className="input-field"
                  >
                    <option value="external_link">External Link</option>
                    <option value="embedded_video">Embedded Video</option>
                    <option value="pdf">PDF</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Duration (minutes)</label>
                  <input
                    type="number"
                    value={formData.estimated_duration_minutes || 60}
                    onChange={(e) => setFormData({ ...formData, estimated_duration_minutes: parseInt(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source/Provider</label>
                  <input
                    type="text"
                    value={formData.source_provider || ''}
                    onChange={(e) => setFormData({ ...formData, source_provider: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Texas HHS, Alison"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CE Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.ce_hours || 0}
                    onChange={(e) => setFormData({ ...formData, ce_hours: parseFloat(e.target.value) })}
                    className="input-field"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">External URL</label>
                <input
                  type="url"
                  value={formData.external_url || ''}
                  onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                  className="input-field"
                  placeholder="https://example.com/course"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Compliance Tag</label>
                  <input
                    type="text"
                    value={formData.compliance_tag || ''}
                    onChange={(e) => setFormData({ ...formData, compliance_tag: e.target.value })}
                    className="input-field"
                    placeholder="e.g., 26 TAC §558"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Regulation Reference</label>
                  <input
                    type="text"
                    value={formData.regulation_reference || ''}
                    onChange={(e) => setFormData({ ...formData, regulation_reference: e.target.value })}
                    className="input-field"
                    placeholder="e.g., HIPAA, ANE Reporting"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-6">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_required || false}
                    onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">Required by HCSSA</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active !== false}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button type="submit" className="btn-primary">
                  {editingId ? 'Update Course' : 'Add Course'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading courses...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {courses.map((course) => (
              <div key={course.id} className="card p-6 hover:shadow-lg transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{course.title}</h3>
                    <p className="text-gray-600 mb-2">{course.description}</p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">{course.category}</span>
                      {course.compliance_tag && (
                        <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-sm">{course.compliance_tag}</span>
                      )}
                      {course.is_required && (
                        <span className="inline-block px-2 py-1 bg-red-100 text-red-800 rounded text-sm font-medium">Required</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {course.estimated_duration_minutes} mins • {course.source_provider}
                      {course.ce_hours ? ` • ${course.ce_hours} CE hours` : ''}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {course.external_url && (
                      <button
                        onClick={() => window.open(course.external_url, '_blank')}
                        className="btn-outline p-2 flex items-center gap-2"
                        title="View course"
                      >
                        <ExternalLink size={20} />
                        <span className="hidden sm:inline">View</span>
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(course)}
                      className="btn-outline p-2"
                      title="Edit course"
                    >
                      <Edit2 size={20} />
                    </button>
                    <button
                      onClick={() => handleDelete(course.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg border border-red-200 transition"
                      title="Delete course"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {courses.length === 0 && !showForm && (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-4">No courses yet. Create your first course to get started.</p>
                <button onClick={() => setShowForm(true)} className="btn-primary">
                  Create First Course
                </button>
              </div>
            )}
          </div>
        )}
        </>
        )}
      </div>
    </MainLayout>
  )
}
