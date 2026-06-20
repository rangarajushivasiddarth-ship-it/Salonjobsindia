import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Initialize Supabase client
function getSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase credentials not configured')
  }

  return createClient(url, key)
}

// Get client-side Supabase client
export function getSupabaseClientSide(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error('Supabase credentials not configured')
  }

  return createClient(url, key)
}

// Job Seeker Operations
export const jobSeekerService = {
  async create(userData: any) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('job_seekers')
      .insert([userData])
      .select()

    if (error) throw new Error(`Failed to create job seeker: ${error.message}`)
    return data?.[0]
  },

  async getByUserId(userId: string) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('job_seekers')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async update(userId: string, updates: any) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('job_seekers')
      .update(updates)
      .eq('user_id', userId)
      .select()

    if (error) throw new Error(`Failed to update job seeker: ${error.message}`)
    return data?.[0]
  },

  async getAllActive() {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('job_seekers')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },
}

// Salon Owner Operations
export const salonOwnerService = {
  async create(userData: any) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('salon_owners')
      .insert([userData])
      .select()

    if (error) throw new Error(`Failed to create salon owner: ${error.message}`)
    return data?.[0]
  },

  async getByUserId(userId: string) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('salon_owners')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async update(userId: string, updates: any) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('salon_owners')
      .update(updates)
      .eq('user_id', userId)
      .select()

    if (error) throw new Error(`Failed to update salon owner: ${error.message}`)
    return data?.[0]
  },

  async getAllActive() {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('salon_owners')
      .select('*')
      .eq('subscription_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async deductCredit(userId: string, amount: number = 1) {
    const supabase = getSupabaseClient()
    
    const owner = await salonOwnerService.getByUserId(userId)
    const currentBalance = owner?.credits || 0
    const newBalance = Math.max(0, currentBalance - amount)

    const { data, error } = await supabase
      .from('salon_owners')
      .update({ credits: newBalance })
      .eq('user_id', userId)
      .select()

    if (error) throw error

    // Log transaction
    await creditTransactionService.log(userId, 'unlock', -amount, newBalance)
    return data?.[0]
  },
}

// Job Operations
export const jobService = {
  async create(jobData: any) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('jobs')
      .insert([jobData])
      .select()

    if (error) throw new Error(`Failed to create job: ${error.message}`)
    return data?.[0]
  },

  async getById(jobId: string) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async getByOwnerId(ownerId: string) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async getAllLive() {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('is_live', true)
      .eq('status', 'approved')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async updateStatus(jobId: string, status: string) {
    const supabase = getSupabaseClient()
    const isLive = status === 'approved'

    const { data, error } = await supabase
      .from('jobs')
      .update({ status, is_live: isLive })
      .eq('id', jobId)
      .select()

    if (error) throw error
    return data?.[0]
  },
}

// Credits & Transactions
export const creditService = {
  async getBalance(userId: string) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('credits')
      .select('balance')
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      // Create if doesn't exist
      await creditService.initialize(userId)
      return 0
    }
    return data?.balance || 0
  },

  async initialize(userId: string) {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('credits')
      .insert({ user_id: userId, balance: 0 })
    
    if (error) throw error
  },
}

export const creditTransactionService = {
  async log(userId: string, type: string, amount: number, balanceAfter: number) {
    const supabase = getSupabaseClient()
    const { error } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        transaction_type: type,
        credits_changed: amount,
        balance_after: balanceAfter,
        description: `${type} - ${Math.abs(amount)} credits`
      })

    if (error) throw error
  },
}

// Subscriptions & Payments
export const subscriptionService = {
  async getByUserId(userId: string) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  async create(subscriptionData: any) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('subscriptions')
      .insert([subscriptionData])
      .select()

    if (error) throw error
    return data?.[0]
  },
}

export const paymentService = {
  async create(paymentData: any) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('payments')
      .insert([paymentData])
      .select()

    if (error) throw error
    return data?.[0]
  },

  async getPending() {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  async updateStatus(paymentId: string, status: string) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('payments')
      .update({ 
        status, 
        processed_at: status === 'approved' ? new Date() : null 
      })
      .eq('id', paymentId)
      .select()

    if (error) throw error
    return data?.[0]
  },
}

export default {
  jobSeekerService,
  salonOwnerService,
  jobService,
  creditService,
  creditTransactionService,
  fileMetadataService,
  subscriptionService,
  paymentService,
  getSupabaseClient,
  getSupabaseClientSide,
}
