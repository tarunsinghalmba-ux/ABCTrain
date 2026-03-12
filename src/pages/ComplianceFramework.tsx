import React, { useEffect, useState } from 'react'
import { MainLayout } from '../components/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card'
import { complianceService } from '../services/compliance'
import type { ComplianceRequirement } from '../types'
import { ArrowLeft, FileText } from 'lucide-react'
import { Link } from 'react-router-dom'

export function ComplianceFramework() {
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRequirements()
  }, [])

  const loadRequirements = async () => {
    try {
      const reqs = await complianceService.getAllRequirements()
      setRequirements(reqs)
    } catch (error) {
      console.error('Error loading requirements:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <MainLayout>

      <main className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Link
              to="/compliance"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Compliance
            </Link>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Compliance Requirements Framework</h1>
            <p className="text-slate-600">Texas Home and Community Support Services Agency (HCSSA) compliance requirements per 26 TAC §558</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <p className="mt-4 text-slate-600">Loading requirements...</p>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  All Compliance Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900">Requirement</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900">Regulation</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900">Role</th>
                        <th className="px-4 py-3 text-left font-semibold text-slate-900">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {requirements
                        .filter(r => r.required_for_role !== 'admin')
                        .map(req => (
                          <tr key={req.id} className="hover:bg-slate-50">
                            <td className="px-4 py-3 font-medium text-slate-900">{req.requirement_name}</td>
                            <td className="px-4 py-3 text-slate-600">{req.regulation_reference}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {req.required_for_role}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{req.description || 'See linked courses'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </MainLayout>
  )
}
