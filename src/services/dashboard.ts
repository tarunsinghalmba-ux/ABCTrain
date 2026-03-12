import { supabase } from './supabase';

export interface DashboardStats {
  total_caregivers: number;
  compliant_count: number;
  overdue_count: number;
  due_soon_count: number;
  compliance_percentage: number;
}

export interface ActivityItem {
  id: string;
  type: 'completion' | 'assignment' | 'overdue';
  caregiver_name: string;
  course_title: string;
  timestamp: string;
  details?: string;
}

export const dashboardService = {
  async getAdminStats(): Promise<DashboardStats> {
    const today = new Date().toISOString().split('T')[0];
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() + 30);
    const warningDateStr = warningDate.toISOString().split('T')[0];

    const { data: caregivers } = await supabase
      .from('profiles')
      .select('id')
      .eq('role', 'caregiver')
      .eq('is_active', true);

    const total_caregivers = caregivers?.length || 0;

    const { data: assignments } = await supabase
      .from('course_assignments')
      .select(`
        id,
        due_date,
        caregiver_id,
        course_completions (
          id,
          completion_date
        )
      `);

    let compliant_count = 0;
    let overdue_count = 0;
    let due_soon_count = 0;

    const caregiverStatuses = new Map<string, boolean>();

    assignments?.forEach(assignment => {
      const hasCompletion = assignment.course_completions && assignment.course_completions.length > 0;
      const isOverdue = !hasCompletion && assignment.due_date < today;
      const isDueSoon = !hasCompletion && assignment.due_date >= today && assignment.due_date <= warningDateStr;

      if (isOverdue) {
        overdue_count++;
        caregiverStatuses.set(assignment.caregiver_id, false);
      } else if (isDueSoon) {
        due_soon_count++;
      }
    });

    compliant_count = total_caregivers - caregiverStatuses.size;
    const compliance_percentage = total_caregivers > 0
      ? Math.round((compliant_count / total_caregivers) * 100)
      : 100;

    return {
      total_caregivers,
      compliant_count,
      overdue_count,
      due_soon_count,
      compliance_percentage
    };
  },

  async getRecentActivity(): Promise<ActivityItem[]> {
    const { data: completions } = await supabase
      .from('course_completions')
      .select(`
        id,
        created_at,
        caregiver:profiles!course_completions_caregiver_id_fkey (
          first_name,
          last_name
        ),
        course:courses (
          title
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10);

    const activities: ActivityItem[] = completions?.map(completion => ({
      id: completion.id,
      type: 'completion' as const,
      caregiver_name: `${completion.caregiver?.first_name} ${completion.caregiver?.last_name}`,
      course_title: completion.course?.title || 'Unknown Course',
      timestamp: completion.created_at,
      details: 'Completed course'
    })) || [];

    return activities;
  }
};
