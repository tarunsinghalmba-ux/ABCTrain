import React, { useEffect, useState } from 'react'
import { MainLayout } from '../components/MainLayout'
import { complianceService } from '../services/compliance'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { StatusBadge } from '../components/StatusBadge'
import { exportToCSV } from '../utils/exportCSV'
import type { CaregiverComplianceSummary, ComplianceRequirement } from '../types'
import {
  Download,
  CircleAlert as AlertCircle,
  CircleCheck as CheckCircle,
  Clock,
  Search,
  ListFilter as Filter,
  FileText,
  RefreshCw
} from 'lucide-react'
import { Link } from 'react-router-dom'

export function Compliance() {
  const [complianceData, setComplianceData] = useState<CaregiverComplianceSummary[]>([])
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCaregiver, setSelectedCaregiver] = useState<CaregiverComplianceSummary | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'compliant' | 'in_progress' | 'overdue'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<'name' | 'status' | 'ce_hours'>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  useEffect(() => {
    loadComplianceData()
  }, [])

  const loadComplianceData = async () => {
    setLoading(true)
    try {
      const [caregivers, reqs] = await Promise.all([
        complianceService.getAllCaregiversComplianceDetail(),
        complianceService.getAllRequirements()
      ])
      setComplianceData(caregivers)
      setRequirements(reqs)
    } catch (error) {
      console.error('Error loading compliance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredData = complianceData
    .filter(item => {
      if (filterStatus !== 'all' && item.compliance_status !== filterStatus) return false
      if (searchTerm) {
        const fullName = `${item.first_name} ${item.last_name}`.toLowerCase()
        if (!fullName.includes(searchTerm.toLowerCase())) return false
      }
      return true
    })
    .sort((a, b) => {
      let compareValue = 0

      if (sortField === 'name') {
        compareValue = `${a.first_name} ${a.last_name}`.localeCompare(`${b.first_name} ${b.last_name}`)
      } else if (sortField === 'ce_hours') {
        compareValue = a.annual_ce_hours_current_year - b.annual_ce_hours_current_year
      } else if (sortField === 'status') {
        const statusOrder = { 'overdue': 0, 'in_progress': 1, 'compliant': 2 }
        compareValue = statusOrder[a.compliance_status] - statusOrder[b.compliance_status]
      }

      return sortDirection === 'asc' ? compareValue : -compareValue
    })

  const handleExportCSV = () => {
    const exportData = filteredData.map(item => ({
      'Name': `${item.first_name} ${item.last_name}`,
      'Email': item.email,
      'Orientation Complete': item.orientation_complete ? 'Yes' : 'No',
      'ANE Training Complete': item.ane_training_complete ? 'Yes' : 'No',
      'Annual CE Hours': item.annual_ce_hours_current_year,
      'Last Review Date': item.last_compliance_review_date
        ? new Date(item.last_compliance_review_date).toLocaleDateString()
        : 'Never',
      'Status': item.compliance_status.replace('_', ' ').toUpperCase()
    }))
    exportToCSV(exportData, 'texas-hcssa-compliance-report')
  }

  const handleMarkComplete = async (profileId: string, requirementId: string) => {
    try {
      await complianceService.markRequirementComplete(profileId, requirementId)
      await loadComplianceData()
      if (selectedCaregiver?.profile_id === profileId) {
        const updated = await complianceService.getCaregiverComplianceDetail(profileId)
        setSelectedCaregiver(updated)
      }
    } catch (error) {
      console.error('Error marking requirement complete:', error)
    }
  }

  const toggleSort = (field: 'name' | 'status' | 'ce_hours') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const stats = {
    compliant: complianceData.filter(d => d.compliance_status === 'compliant').length,
    inProgress: complianceData.filter(d => d.compliance_status === 'in_progress').length,
    overdue: complianceData.filter(d => d.compliance_status === 'overdue').length,
    total: complianceData.length
  }

  const getRequirementDisplayName = (code: string): string => {
    const req = requirements.find(r => r.requirement_code === code)
    return req?.requirement_name || code
  }

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Texas HCSSA Compliance</h1>
            <p className="text-gray-600">Track compliance with 26 TAC §558 requirements</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadComplianceData}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download size={20} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="card p-6">
            <p className="text-gray-600 text-sm font-medium mb-2">Total Caregivers</p>
            <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
          </div>

          <div className="card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Compliant</p>
                <p className="text-3xl font-bold text-green-600">{stats.compliant}</p>
              </div>
              <CheckCircle className="text-green-600" size={24} />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">In Progress</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.inProgress}</p>
              </div>
              <Clock className="text-yellow-600" size={24} />
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-2">Overdue</p>
                <p className="text-3xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <AlertCircle className="text-red-600" size={24} />
            </div>
          </div>
        </div>

        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Compliance Requirements Framework</h3>
                  <p className="text-sm text-slate-600">View all Texas HCSSA compliance requirements and regulations</p>
                </div>
              </div>
              <Link
                to="/compliance-framework"
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Framework
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                {(['all', 'compliant', 'in_progress', 'overdue'] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      filterStatus === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {status === 'all' && 'All'}
                    {status === 'compliant' && 'Compliant'}
                    {status === 'in_progress' && 'In Progress'}
                    {status === 'overdue' && 'Overdue'}
                  </button>
                ))}
              </div>
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="Search caregivers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading compliance data...</p>
          </div>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      <button onClick={() => toggleSort('name')} className="flex items-center gap-1 hover:text-blue-600">
                        Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Orientation</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">ANE Training</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                      <button onClick={() => toggleSort('ce_hours')} className="flex items-center gap-1 hover:text-blue-600 mx-auto">
                        Annual CE Hours {sortField === 'ce_hours' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Last Review</th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                      <button onClick={() => toggleSort('status')} className="flex items-center gap-1 hover:text-blue-600 mx-auto">
                        Status {sortField === 'status' && (sortDirection === 'asc' ? '↑' : '↓')}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredData.map((item) => (
                    <tr key={item.profile_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900 font-medium">
                        {item.first_name} {item.last_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        {item.orientation_complete ? (
                          <CheckCircle className="inline text-green-600" size={20} />
                        ) : (
                          <AlertCircle className="inline text-red-600" size={20} />
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        {item.ane_training_complete ? (
                          <CheckCircle className="inline text-green-600" size={20} />
                        ) : (
                          <AlertCircle className="inline text-red-600" size={20} />
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-gray-900 font-medium">
                        {item.annual_ce_hours_current_year}/12
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.last_compliance_review_date
                          ? new Date(item.last_compliance_review_date).toLocaleDateString()
                          : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        {item.compliance_status === 'compliant' && <StatusBadge status="compliant" />}
                        {item.compliance_status === 'overdue' && <StatusBadge status="overdue" />}
                        {item.compliance_status === 'in_progress' && <StatusBadge status="in-progress" text="In Progress" />}
                      </td>
                      <td className="px-6 py-4 text-sm text-center">
                        <button
                          onClick={() => setSelectedCaregiver(item)}
                          className="text-blue-600 hover:text-blue-800 font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredData.length === 0 && (
                <div className="text-center py-12 text-gray-600">
                  No caregivers found matching the selected filters
                </div>
              )}
            </div>
          </Card>
        )}

        {selectedCaregiver && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl">
                      {selectedCaregiver.first_name} {selectedCaregiver.last_name}
                    </CardTitle>
                    <p className="text-gray-600 mt-1">{selectedCaregiver.email}</p>
                  </div>
                  <button
                    onClick={() => setSelectedCaregiver(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Orientation Complete</p>
                    <p className="text-lg font-semibold">
                      {selectedCaregiver.orientation_complete ? (
                        <span className="text-green-600">Yes</span>
                      ) : (
                        <span className="text-red-600">No</span>
                      )}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">ANE Training</p>
                    <p className="text-lg font-semibold">
                      {selectedCaregiver.ane_training_complete ? (
                        <span className="text-green-600">Yes</span>
                      ) : (
                        <span className="text-red-600">No</span>
                      )}
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Annual CE Hours</p>
                    <p className="text-lg font-semibold">
                      {selectedCaregiver.annual_ce_hours_current_year}/12
                    </p>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">Overall Status</p>
                    <div className="mt-1">
                      {selectedCaregiver.compliance_status === 'compliant' && <StatusBadge status="compliant" />}
                      {selectedCaregiver.compliance_status === 'overdue' && <StatusBadge status="overdue" />}
                      {selectedCaregiver.compliance_status === 'in_progress' && <StatusBadge status="in-progress" text="In Progress" />}
                    </div>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mb-4">Requirement Details</h3>
                <div className="space-y-3">
                  {selectedCaregiver.requirements.map((reqStatus) => {
                    const req = reqStatus.requirement as ComplianceRequirement
                    return (
                      <div key={reqStatus.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{req.requirement_name}</h4>
                            <p className="text-sm text-gray-600">{req.regulation_reference}</p>
                          </div>
                          <div className="ml-4">
                            {reqStatus.is_complete ? (
                              <CheckCircle className="text-green-600" size={24} />
                            ) : (
                              <button
                                onClick={() => handleMarkComplete(selectedCaregiver.profile_id, req.id)}
                                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                              >
                                Mark Complete
                              </button>
                            )}
                          </div>
                        </div>
                        {reqStatus.completion_date && (
                          <p className="text-sm text-gray-600">
                            Completed: {new Date(reqStatus.completion_date).toLocaleDateString()}
                          </p>
                        )}
                        {reqStatus.notes && (
                          <p className="text-sm text-gray-600 mt-1">Notes: {reqStatus.notes}</p>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="mt-6 flex justify-end">
                  <Link
                    to={`/caregivers/${selectedCaregiver.profile_id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    View Full Profile
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </MainLayout>
  )
}
