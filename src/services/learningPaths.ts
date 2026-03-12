import { supabase } from './supabase'
import type { LearningPath, LearningPathCourse, LearningPathAssignment, LearningPathWithCourses } from '../types'

export const learningPathService = {
  async getAll(): Promise<LearningPathWithCourses[]> {
    const { data, error } = await supabase
      .from('learning_paths')
      .select(`
        *,
        courses:learning_path_courses(
          id,
          learning_path_id,
          course_id,
          sequence_order,
          created_at,
          course:courses(*)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getById(id: string): Promise<LearningPathWithCourses | null> {
    const { data, error } = await supabase
      .from('learning_paths')
      .select(`
        *,
        courses:learning_path_courses(
          id,
          learning_path_id,
          course_id,
          sequence_order,
          created_at,
          course:courses(*)
        )
      `)
      .eq('id', id)
      .order('sequence_order', { foreignTable: 'learning_path_courses', ascending: true })
      .maybeSingle()

    if (error) throw error
    return data
  },

  async create(learningPath: Omit<LearningPath, 'id' | 'created_at' | 'updated_at'>): Promise<LearningPath> {
    const { data, error } = await supabase
      .from('learning_paths')
      .insert(learningPath)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async update(id: string, updates: Partial<LearningPath>): Promise<LearningPath> {
    const { data, error } = await supabase
      .from('learning_paths')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('learning_paths')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async addCourse(learningPathId: string, courseId: string, sequenceOrder: number): Promise<LearningPathCourse> {
    const { data, error } = await supabase
      .from('learning_path_courses')
      .insert({
        learning_path_id: learningPathId,
        course_id: courseId,
        sequence_order: sequenceOrder
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async removeCourse(learningPathId: string, courseId: string): Promise<void> {
    const { error } = await supabase
      .from('learning_path_courses')
      .delete()
      .eq('learning_path_id', learningPathId)
      .eq('course_id', courseId)

    if (error) throw error
  },

  async updateCourseOrder(learningPathId: string, courseId: string, newOrder: number): Promise<void> {
    const { error } = await supabase
      .from('learning_path_courses')
      .update({ sequence_order: newOrder })
      .eq('learning_path_id', learningPathId)
      .eq('course_id', courseId)

    if (error) throw error
  },

  async assignToCaregiver(
    learningPathId: string,
    caregiverId: string,
    assignedBy: string,
    dueDate?: string
  ): Promise<LearningPathAssignment> {
    // First, create the learning path assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('learning_path_assignments')
      .insert({
        learning_path_id: learningPathId,
        caregiver_id: caregiverId,
        assigned_by: assignedBy,
        due_date: dueDate,
        status: 'assigned'
      })
      .select()
      .single()

    if (assignmentError) throw assignmentError

    // Get all courses in this learning path
    const { data: pathCourses, error: coursesError } = await supabase
      .from('learning_path_courses')
      .select('course_id')
      .eq('learning_path_id', learningPathId)

    if (coursesError) throw coursesError

    // Create course assignments for each course in the learning path
    if (pathCourses && pathCourses.length > 0) {
      // Check for existing assignments to avoid duplicates
      const { data: existingAssignments } = await supabase
        .from('course_assignments')
        .select('course_id')
        .eq('caregiver_id', caregiverId)
        .in('course_id', pathCourses.map(pc => pc.course_id))

      const existingCourseIds = new Set(existingAssignments?.map(a => a.course_id) || [])

      // Only create assignments for courses that don't already exist
      const newCourseAssignments = pathCourses
        .filter(pc => !existingCourseIds.has(pc.course_id))
        .map(pc => ({
          course_id: pc.course_id,
          caregiver_id: caregiverId,
          assigned_by_id: assignedBy,
          due_date: dueDate || null,
          assignment_type: 'individual' as const,
          status: 'not_started' as const
        }))

      if (newCourseAssignments.length > 0) {
        const { error: assignError } = await supabase
          .from('course_assignments')
          .insert(newCourseAssignments)

        if (assignError) throw assignError
      }
    }

    return assignment
  },

  async getAssignments(caregiverId?: string): Promise<LearningPathAssignment[]> {
    let query = supabase
      .from('learning_path_assignments')
      .select(`
        *,
        learning_path:learning_paths(*),
        caregiver:profiles!learning_path_assignments_caregiver_id_fkey(id, first_name, last_name, email)
      `)
      .order('assigned_at', { ascending: false })

    if (caregiverId) {
      query = query.eq('caregiver_id', caregiverId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  },

  async updateAssignmentStatus(assignmentId: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('learning_path_assignments')
      .update({ status })
      .eq('id', assignmentId)

    if (error) throw error
  },

  async removeAssignment(assignmentId: string): Promise<void> {
    const { error } = await supabase
      .from('learning_path_assignments')
      .delete()
      .eq('id', assignmentId)

    if (error) throw error
  }
}
