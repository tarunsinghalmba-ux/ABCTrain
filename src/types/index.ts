export type UserRole = 'admin' | 'manager' | 'caregiver'

export interface Profile {
  id: string
  email: string
  first_name: string
  last_name: string
  role: UserRole
  organization?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Course {
  id: string
  title: string
  description?: string
  category: string
  estimated_duration_minutes?: number
  delivery_format: 'external_link' | 'embedded_video' | 'pdf'
  source_provider?: string
  external_url?: string
  compliance_tag?: string
  regulation_reference?: string
  is_required: boolean
  ce_hours?: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CourseAssignment {
  id: string
  course_id: string
  caregiver_id: string
  assigned_by_id: string
  due_date: string
  assignment_type: 'individual' | 'group'
  status?: 'not_started' | 'in_progress' | 'completed'
  completion_date?: string
  certificate_url?: string
  certificate_filename?: string
  created_at: string
  updated_at: string
  course?: Course
  caregiver?: Profile
}

export interface CourseCompletion {
  id: string
  assignment_id: string
  caregiver_id: string
  course_id: string
  completion_date?: string
  certificate_url?: string
  certificate_filename?: string
  is_verified: boolean
  verified_by_id?: string
  verification_date?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface ComplianceRecord {
  id: string
  caregiver_id: string
  record_type: 'completion' | 'overdue' | 'verification' | 'export'
  course_id?: string
  action_by_id?: string
  details?: Record<string, unknown>
  created_at: string
}

export interface ComplianceRequirement {
  id: string
  requirement_code: string
  requirement_name: string
  regulation_reference: string
  required_for_role: 'admin' | 'caregiver' | 'both'
  is_annual_requirement: boolean
  required_ce_hours: number
  linked_course_ids: string[]
  description?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CaregiverComplianceStatus {
  id: string
  profile_id: string
  requirement_id: string
  is_complete: boolean
  completion_date?: string
  expiration_date?: string
  ce_hours_earned: number
  notes?: string
  last_reviewed_date?: string
  created_at: string
  updated_at: string
  requirement?: ComplianceRequirement
}

export interface ComplianceAuditLog {
  id: string
  profile_id: string
  requirement_id?: string
  action: string
  performed_by: string
  notes?: string
  created_at: string
}

export interface ComplianceStatus {
  caregiver_id: string
  status: 'compliant' | 'action_required' | 'overdue'
  total_assignments: number
  completed: number
  pending: number
  overdue: number
}

export interface CaregiverComplianceSummary {
  profile_id: string
  first_name: string
  last_name: string
  email: string
  orientation_complete: boolean
  ane_training_complete: boolean
  annual_ce_hours_current_year: number
  last_compliance_review_date?: string
  compliance_status: 'compliant' | 'in_progress' | 'overdue'
  requirements: CaregiverComplianceStatus[]
}

export interface LearningPath {
  id: string
  organization: string
  name: string
  description?: string
  is_active: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface LearningPathCourse {
  id: string
  learning_path_id: string
  course_id: string
  sequence_order: number
  created_at: string
  course?: Course
}

export interface LearningPathAssignment {
  id: string
  learning_path_id: string
  caregiver_id: string
  assigned_by: string
  assigned_at: string
  due_date?: string
  status: 'assigned' | 'in_progress' | 'completed'
  created_at: string
  learning_path?: LearningPath
  caregiver?: Profile
}

export interface LearningPathWithCourses extends LearningPath {
  courses: LearningPathCourse[]
}
