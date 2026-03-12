import { supabase } from './supabase'
import type { Profile } from '../types'

export const profileService = {
  async createCaregiver(data: {
    email: string
    firstName: string
    lastName: string
    organization?: string
  }): Promise<Profile & { defaultPassword?: string }> {
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      throw new Error('Not authenticated')
    }

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-caregiver-user`

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        organization: data.organization,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error creating caregiver:', errorText)
      throw new Error(errorText || 'Failed to create caregiver')
    }

    const result = await response.json()

    if (!result.success) {
      console.error('Error creating caregiver:', result.error)
      throw new Error(result.error || 'Failed to create caregiver')
    }

    return result as Profile & { defaultPassword?: string }
  },

  async getCaregivers(includeInactive = false) {
    let query = supabase
      .from('profiles')
      .select('*')
      .eq('role', 'caregiver')

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query.order('last_name')

    if (error) throw error
    return data as Profile[]
  },

  async getAllCaregivers() {
    return this.getCaregivers(true)
  },

  async getProfile(id: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    return data as Profile | null
  },

  async updateCaregiver(id: string, updates: {
    firstName?: string
    lastName?: string
    email?: string
    organization?: string
    isActive?: boolean
  }) {
    const updateData: Record<string, unknown> = {}

    if (updates.firstName !== undefined) updateData.first_name = updates.firstName
    if (updates.lastName !== undefined) updateData.last_name = updates.lastName
    if (updates.email !== undefined) updateData.email = updates.email
    if (updates.organization !== undefined) updateData.organization = updates.organization
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive

    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as Profile
  },

  async deleteCaregiver(id: string) {
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  async deactivateCaregiver(id: string) {
    return this.updateCaregiver(id, { isActive: false })
  },

  async reactivateCaregiver(id: string) {
    return this.updateCaregiver(id, { isActive: true })
  },

  async getProfiles(includeInactive = true) {
    let query = supabase
      .from('profiles')
      .select('*')

    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query.order('last_name')

    if (error) throw error
    return data as Profile[]
  },

  async updateProfile(id: string, updates: Partial<Profile>) {
    const updateData: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() }

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle()

    if (error) throw error
    if (!data) throw new Error('Profile not found')
    return data as Profile
  }
}
