import React, { useEffect, useState } from 'react'
import { MainLayout } from '../components/MainLayout'
import { CaregiverForm } from '../components/CaregiverForm'
import { CourseAssignmentModal } from '../components/CourseAssignmentModal'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { StatusBadge } from '../components/StatusBadge'
import { profileService } from '../services/profiles'
import { complianceService } from '../services/compliance'
import type { Profile } from '../types'
import { Plus, Users, CreditCard as Edit, Trash2, UserCheck, UserX, Search, CircleCheck as CheckCircle, CircleAlert as AlertCircle, BookOpen } from 'lucide-react'

export function Caregivers() {
  const [caregivers, setCaregivers] = useState<Profile[]>([])
  const [filteredCaregivers, setFilteredCaregivers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingCaregiver, setEditingCaregiver] = useState<Profile | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedCaregiver, setSelectedCaregiver] = useState<Profile | null>(null)
  const [newCaregiverPassword, setNewCaregiverPassword] = useState<string | null>(null)

  useEffect(() => {
    loadCaregivers()
  }, [showInactive])

  useEffect(() => {
    filterCaregivers()
  }, [caregivers, searchTerm, showInactive])

  const loadCaregivers = async () => {
    try {
      const data = await profileService.getCaregivers(!showInactive)
      setCaregivers(data)
    } catch (error) {
      console.error('Error loading caregivers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterCaregivers = () => {
    let filtered = caregivers

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(c =>
        c.first_name.toLowerCase().includes(term) ||
        c.last_name.toLowerCase().includes(term) ||
        c.email.toLowerCase().includes(term) ||
        (c.organization?.toLowerCase().includes(term))
      )
    }

    setFilteredCaregivers(filtered)
  }

  const handleAddCaregiver = () => {
    setEditingCaregiver(null)
    setShowForm(true)
  }

  const handleEditCaregiver = (caregiver: Profile) => {
    setEditingCaregiver(caregiver)
    setShowForm(true)
  }

  const handleFormSubmit = async (data: {
    firstName: string
    lastName: string
    email: string
    organization?: string
  }) => {
    setIsSubmitting(true)
    try {
      if (editingCaregiver) {
        await profileService.updateCaregiver(editingCaregiver.id, data)
      } else {
        const result = await profileService.createCaregiver(data)
        console.log('Create caregiver result:', result)
        await complianceService.initializeCaregiverCompliance(result.id)
        if (result.defaultPassword) {
          setNewCaregiverPassword(result.defaultPassword)
        }
      }
      await loadCaregivers()
      setShowForm(false)
      setEditingCaregiver(null)
    } catch (error) {
      console.error('Error saving caregiver:', error)
      alert(`Failed to save caregiver: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteCaregiver = async (id: string) => {
    try {
      await profileService.deleteCaregiver(id)
      await loadCaregivers()
      setDeleteConfirm(null)
    } catch (error) {
      console.error('Error deleting caregiver:', error)
      alert('Failed to delete caregiver. Please try again.')
    }
  }

  const handleToggleActive = async (caregiver: Profile) => {
    try {
      if (caregiver.is_active) {
        await profileService.deactivateCaregiver(caregiver.id)
      } else {
        await profileService.reactivateCaregiver(caregiver.id)
      }
      await loadCaregivers()
    } catch (error) {
      console.error('Error toggling caregiver status:', error)
      alert('Failed to update caregiver status. Please try again.')
    }
  }

  const stats = {
    total: caregivers.length,
    active: caregivers.filter(c => c.is_active).length,
    inactive: caregivers.filter(c => !c.is_active).length
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Caregiver Management</h1>
            <p className="text-gray-600">Manage your caregiver team and track their information</p>
          </div>
          <button
            onClick={handleAddCaregiver}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>Add Caregiver</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Total Caregivers</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <Users className="text-gray-400" size={24} />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Active</p>
                <p className="text-3xl font-bold text-green-600">{stats.active}</p>
              </div>
              <UserCheck className="text-green-600" size={24} />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Inactive</p>
                <p className="text-3xl font-bold text-gray-600">{stats.inactive}</p>
              </div>
              <UserX className="text-gray-600" size={24} />
            </div>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search by name, email, or organization..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInactive}
                  onChange={(e) => setShowInactive(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Show inactive caregivers</span>
              </label>
            </div>
          </CardContent>
        </Card>

        {showForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>
                {editingCaregiver ? 'Edit Caregiver' : 'Add New Caregiver'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CaregiverForm
                caregiver={editingCaregiver}
                onSubmit={handleFormSubmit}
                onCancel={() => {
                  setShowForm(false)
                  setEditingCaregiver(null)
                }}
                isLoading={isSubmitting}
              />
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading caregivers...</p>
          </div>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Organization</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Status</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Compliance</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCaregivers.map((caregiver) => (
                    <tr key={caregiver.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {caregiver.first_name} {caregiver.last_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{caregiver.email}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {caregiver.organization || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        {caregiver.is_active ? (
                          <StatusBadge status="compliant" text="Active" />
                        ) : (
                          <StatusBadge status="overdue" text="Inactive" />
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        {caregiver.orientation_complete ? (
                          <CheckCircle className="inline text-green-600" size={20} />
                        ) : (
                          <AlertCircle className="inline text-yellow-600" size={20} />
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedCaregiver(caregiver)
                              setShowAssignModal(true)
                            }}
                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            title="Assign Training"
                          >
                            <BookOpen size={18} />
                          </button>
                          <button
                            onClick={() => handleEditCaregiver(caregiver)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleToggleActive(caregiver)}
                            className={`p-2 rounded-lg transition-colors ${
                              caregiver.is_active
                                ? 'text-orange-600 hover:bg-orange-50'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title={caregiver.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {caregiver.is_active ? <UserX size={18} /> : <UserCheck size={18} />}
                          </button>
                          {deleteConfirm === caregiver.id ? (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleDeleteCaregiver(caregiver.id)}
                                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                              >
                                Confirm
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-2 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(caregiver.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredCaregivers.length === 0 && (
                <div className="text-center py-12 text-gray-600">
                  {searchTerm ? 'No caregivers found matching your search.' : 'No caregivers yet. Add your first caregiver to get started.'}
                </div>
              )}
            </div>
          </Card>
        )}
      </div>

      {showAssignModal && selectedCaregiver && (
        <CourseAssignmentModal
          caregiver={selectedCaregiver}
          onClose={() => {
            setShowAssignModal(false)
            setSelectedCaregiver(null)
          }}
          onAssigned={() => {
            loadCaregivers()
          }}
        />
      )}

      {newCaregiverPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Caregiver Created Successfully</h2>
            <div className="mb-6">
              <p className="text-gray-600 mb-4">
                A new user account has been created. Please share these login credentials with the caregiver:
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Default Password:</p>
                <p className="text-lg font-mono font-bold text-blue-600 mb-3">{newCaregiverPassword}</p>
                <p className="text-xs text-gray-600">
                  The caregiver can change this password after their first login.
                </p>
              </div>
            </div>
            <button
              onClick={() => setNewCaregiverPassword(null)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </MainLayout>
  )
}
