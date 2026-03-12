import { supabase } from './supabase'
import type { Course, CourseAssignment, CourseCompletion } from '../types'

export const courseService = {
  async getCourses() {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_active', true)
      .order('title')

    if (error) throw error
    return data as Course[]
  },

  async createCourse(course: Omit<Course, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('courses')
      .insert(course)
      .select()

    if (error) throw error
    return data[0] as Course
  },

  async updateCourse(id: string, updates: Partial<Course>) {
    const { data, error } = await supabase
      .from('courses')
      .update(updates)
      .eq('id', id)
      .select()

    if (error) throw error
    return data[0] as Course
  },

  async deleteCourse(id: string) {
    const { error } = await supabase
      .from('courses')
      .update({ is_active: false })
      .eq('id', id)

    if (error) throw error
  },

  async assignCourses(courseIds: string[], caregiverId: string, dueDate: string, assignedById: string) {
    const assignments = courseIds.map(courseId => ({
      course_id: courseId,
      caregiver_id: caregiverId,
      assigned_by_id: assignedById,
      due_date: dueDate,
      assignment_type: 'individual' as const
    }))

    const { data, error } = await supabase
      .from('course_assignments')
      .insert(assignments)
      .select()

    if (error) throw error
    return data as CourseAssignment[]
  },

  async getCaregiverAssignments(caregiverId: string) {
    const { data, error } = await supabase
      .from('course_assignments')
      .select(`
        *,
        course:course_id(*)
      `)
      .eq('caregiver_id', caregiverId)
      .order('due_date')

    if (error) throw error
    return data as CourseAssignment[]
  },

  async getAssignmentsForManager() {
    const { data, error } = await supabase
      .from('course_assignments')
      .select(`
        *,
        course:course_id(*),
        caregiver:caregiver_id(*)
      `)
      .order('due_date')

    if (error) throw error
    return data as CourseAssignment[]
  },

  async getAllAssignments() {
    const { data, error } = await supabase
      .from('course_assignments')
      .select(`
        *,
        course:course_id(*),
        caregiver:caregiver_id(*)
      `)
      .is('completion_date', null)
      .order('due_date')

    if (error) throw error
    return data as CourseAssignment[]
  },

  async startCourse(assignmentId: string) {
    const { error } = await supabase
      .from('course_assignments')
      .update({ status: 'in_progress' })
      .eq('id', assignmentId)

    if (error) throw error
  },

  async completeAssignment(assignmentId: string, caregiverId: string, courseId: string, completionDate: string, certificateUrl?: string, certificateFilename?: string) {
    const { error: assignmentError } = await supabase
      .from('course_assignments')
      .update({
        status: 'completed',
        completion_date: completionDate,
        certificate_url: certificateUrl,
        certificate_filename: certificateFilename
      })
      .eq('id', assignmentId)

    if (assignmentError) throw assignmentError

    const { data, error } = await supabase
      .from('course_completions')
      .insert({
        assignment_id: assignmentId,
        caregiver_id: caregiverId,
        course_id: courseId,
        completion_date: completionDate,
        certificate_url: certificateUrl,
        certificate_filename: certificateFilename,
        is_verified: false
      })
      .select()

    if (error) throw error
    return data[0] as CourseCompletion
  },

  async getCaregiverCompletions(caregiverId: string) {
    const { data, error } = await supabase
      .from('course_completions')
      .select(`
        *,
        course:course_id(*)
      `)
      .eq('caregiver_id', caregiverId)
      .order('completion_date', { ascending: false })

    if (error) throw error
    return data as CourseCompletion[]
  },

  async verifyCompletion(completionId: string, verifiedById: string) {
    const { data, error } = await supabase
      .from('course_completions')
      .update({
        is_verified: true,
        verified_by_id: verifiedById,
        verification_date: new Date().toISOString()
      })
      .eq('id', completionId)
      .select()

    if (error) throw error
    return data[0] as CourseCompletion
  }
}
