import { supabase } from './supabase'
import type {
  ComplianceStatus,
  ComplianceRequirement,
  CaregiverComplianceStatus,
  CaregiverComplianceSummary,
  ComplianceAuditLog
} from '../types'

export const complianceService = {
  async getComplianceStatus(caregiverId: string): Promise<ComplianceStatus> {
    const { data: assignments } = await supabase
      .from('course_assignments')
      .select('id, due_date')
      .eq('caregiver_id', caregiverId)

    const { data: completions } = await supabase
      .from('course_completions')
      .select('assignment_id, completion_date')
      .eq('caregiver_id', caregiverId)

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const completedAssignmentIds = new Set(completions?.map(c => c.assignment_id) || [])

    let completed = 0
    let pending = 0
    let overdue = 0

    assignments?.forEach(assignment => {
      if (completedAssignmentIds.has(assignment.id)) {
        completed++
      } else {
        const dueDate = new Date(assignment.due_date)
        dueDate.setHours(0, 0, 0, 0)

        if (dueDate < today) {
          overdue++
        } else {
          pending++
        }
      }
    })

    let status: 'compliant' | 'action_required' | 'overdue' = 'compliant'
    if (overdue > 0) {
      status = 'overdue'
    } else if (pending > 0) {
      status = 'action_required'
    }

    return {
      caregiver_id: caregiverId,
      status,
      total_assignments: assignments?.length || 0,
      completed,
      pending,
      overdue
    }
  },

  async getAllCaregiverComplianceStatus() {
    const { data: caregivers } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'caregiver')
      .eq('is_active', true)

    const statuses = await Promise.all(
      caregivers?.map(c => this.getComplianceStatus(c.id)) || []
    )

    return statuses
  },

  async getAllCaregiverComplianceStatusWithProfiles() {
    const { data: caregivers } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, created_at')
      .eq('role', 'caregiver')
      .eq('is_active', true)

    const statuses = await Promise.all(
      caregivers?.map(async (c) => {
        const status = await this.getComplianceStatus(c.id);
        return {
          ...status,
          caregiver_name: `${c.first_name} ${c.last_name}`,
          hire_date: c.created_at
        };
      }) || []
    )

    return statuses
  },

  async recordComplianceEvent(caregiverId: string, recordType: string, courseId?: string, details?: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('compliance_records')
      .insert({
        caregiver_id: caregiverId,
        record_type: recordType as 'completion' | 'overdue' | 'verification' | 'export',
        course_id: courseId,
        details
      })
      .select()

    if (error) throw error
    return data[0]
  },

  async getCaregiverComplianceHistory(caregiverId: string) {
    const { data, error } = await supabase
      .from('compliance_records')
      .select('*')
      .eq('caregiver_id', caregiverId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  async getAllRequirements(): Promise<ComplianceRequirement[]> {
    const { data, error } = await supabase
      .from('compliance_requirements')
      .select('*')
      .eq('is_active', true)
      .order('requirement_name')

    if (error) throw error
    return data || []
  },

  async getRequirementsByRole(role: 'admin' | 'caregiver'): Promise<ComplianceRequirement[]> {
    const { data, error } = await supabase
      .from('compliance_requirements')
      .select('*')
      .or(`required_for_role.eq.${role},required_for_role.eq.both`)
      .eq('is_active', true)
      .order('requirement_name')

    if (error) throw error
    return data || []
  },

  async getCaregiverComplianceDetail(profileId: string): Promise<CaregiverComplianceSummary | null> {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .maybeSingle()

    if (profileError) throw profileError
    if (!profile) return null

    const { data: statuses, error: statusError } = await supabase
      .from('caregiver_compliance_status')
      .select(`
        *,
        requirement:compliance_requirements(*)
      `)
      .eq('profile_id', profileId)

    if (statusError) throw statusError

    return {
      profile_id: profile.id,
      first_name: profile.first_name,
      last_name: profile.last_name,
      email: profile.email,
      orientation_complete: profile.orientation_complete || false,
      ane_training_complete: profile.ane_training_complete || false,
      annual_ce_hours_current_year: profile.annual_ce_hours_current_year || 0,
      last_compliance_review_date: profile.last_compliance_review_date,
      compliance_status: profile.compliance_status || 'in_progress',
      requirements: statuses || []
    }
  },

  async getAllCaregiversComplianceDetail(): Promise<CaregiverComplianceSummary[]> {
    const { data: caregivers, error: caregiversError } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'caregiver')
      .eq('is_active', true)

    if (caregiversError) throw caregiversError

    const summaries = await Promise.all(
      caregivers?.map(c => this.getCaregiverComplianceDetail(c.id)) || []
    )

    return summaries.filter((s): s is CaregiverComplianceSummary => s !== null)
  },

  async updateComplianceStatus(
    profileId: string,
    requirementId: string,
    updates: Partial<CaregiverComplianceStatus>
  ): Promise<CaregiverComplianceStatus> {
    const { data: existing } = await supabase
      .from('caregiver_compliance_status')
      .select('id')
      .eq('profile_id', profileId)
      .eq('requirement_id', requirementId)
      .maybeSingle()

    if (existing) {
      const { data, error } = await supabase
        .from('caregiver_compliance_status')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) throw error
      return data
    } else {
      const { data, error } = await supabase
        .from('caregiver_compliance_status')
        .insert({
          profile_id: profileId,
          requirement_id: requirementId,
          ...updates
        })
        .select()
        .single()

      if (error) throw error
      return data
    }
  },

  async markRequirementComplete(
    profileId: string,
    requirementId: string,
    notes?: string
  ): Promise<void> {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id

    await this.updateComplianceStatus(profileId, requirementId, {
      is_complete: true,
      completion_date: new Date().toISOString(),
      notes
    })

    if (currentUserId) {
      await supabase
        .from('compliance_audit_log')
        .insert({
          profile_id: profileId,
          requirement_id: requirementId,
          action: 'completed',
          performed_by: currentUserId,
          notes
        })
    }

    await this.updateProfileComplianceSummary(profileId)
  },

  async updateProfileComplianceSummary(profileId: string): Promise<void> {
    const { data: requirements } = await supabase
      .from('compliance_requirements')
      .select('*')
      .eq('is_active', true)

    const { data: statuses } = await supabase
      .from('caregiver_compliance_status')
      .select('*')
      .eq('profile_id', profileId)

    const statusMap = new Map(statuses?.map(s => [s.requirement_id, s]) || [])

    let orientationComplete = false
    let aneComplete = false
    let ceHours = 0
    let allCompliant = true
    let hasOverdue = false

    requirements?.forEach(req => {
      const status = statusMap.get(req.id)

      if (req.requirement_code === 'ATTENDANT_ORIENTATION') {
        orientationComplete = status?.is_complete || false
      }
      if (req.requirement_code === 'ANE_REPORTING') {
        aneComplete = status?.is_complete || false
      }
      if (req.requirement_code === 'ANNUAL_CE_ADMIN' && status?.is_complete) {
        ceHours = status.ce_hours_earned || 0
      }

      if (req.required_for_role !== 'admin') {
        if (!status?.is_complete) {
          allCompliant = false
          if (status?.expiration_date && new Date(status.expiration_date) < new Date()) {
            hasOverdue = true
          }
        }
      }
    })

    let complianceStatus: 'compliant' | 'in_progress' | 'overdue' = 'compliant'
    if (hasOverdue) {
      complianceStatus = 'overdue'
    } else if (!allCompliant) {
      complianceStatus = 'in_progress'
    }

    await supabase
      .from('profiles')
      .update({
        orientation_complete: orientationComplete,
        ane_training_complete: aneComplete,
        annual_ce_hours_current_year: ceHours,
        last_compliance_review_date: new Date().toISOString(),
        compliance_status: complianceStatus
      })
      .eq('id', profileId)
  },

  async getAuditLog(profileId?: string): Promise<ComplianceAuditLog[]> {
    let query = supabase
      .from('compliance_audit_log')
      .select('*')
      .order('created_at', { ascending: false })

    if (profileId) {
      query = query.eq('profile_id', profileId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  async initializeCaregiverCompliance(profileId: string): Promise<void> {
    const { data: requirements } = await supabase
      .from('compliance_requirements')
      .select('*')
      .or('required_for_role.eq.caregiver,required_for_role.eq.both')
      .eq('is_active', true)

    if (!requirements) return

    const inserts = requirements.map(req => ({
      profile_id: profileId,
      requirement_id: req.id,
      is_complete: false,
      ce_hours_earned: 0
    }))

    await supabase
      .from('caregiver_compliance_status')
      .insert(inserts)
  }
}
