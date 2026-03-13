import { supabase } from './supabase'

export interface Organization {
  id: string
  name: string
  description: string | null
  is_active: boolean
  address: string | null
  phone: string | null
  website: string | null
  admin_name: string | null
  admin_email: string | null
  created_at: string
  updated_at: string
}

export interface AgencySettings {
  id: string
  organization_id: string
  address: string | null
  website: string | null
  phone: string | null
  contact_name: string | null
  contact_email: string | null
  default_course_due_days: number
  enable_course_reminders: boolean
  reminder_days_before: number
  created_at: string
  updated_at: string
}

export const organizationService = {
  async getOrganizations(): Promise<Organization[]> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('name')

    if (error) throw error
    return data || []
  },

  async createOrganization(name: string, description?: string): Promise<Organization> {
    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name,
        description: description || null,
        is_active: true
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  async updateOrganization(
    id: string,
    updates: Partial<Pick<Organization, 'name' | 'description' | 'is_active' | 'address' | 'phone' | 'website' | 'admin_name' | 'admin_email'>>
  ): Promise<Organization> {
    const { data, error } = await supabase
      .from('organizations')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  async deleteOrganization(id: string): Promise<void> {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async getAgencySettings(organizationId: string): Promise<AgencySettings | null> {
    const { data, error } = await supabase
      .from('agency_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .maybeSingle()

    if (error) throw error
    return data
  },

  async updateAgencySettings(
    organizationId: string,
    updates: Partial<Omit<AgencySettings, 'id' | 'organization_id' | 'created_at' | 'updated_at'>>
  ): Promise<AgencySettings> {
    const { data, error } = await supabase
      .from('agency_settings')
      .update(updates)
      .eq('organization_id', organizationId)
      .select()
      .single()

    if (error) throw error
    return data
  }
}
