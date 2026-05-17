import { supabase } from '../../lib/supabase'
import type { PerformanceReview } from '../../lib/types/database'

export async function getPerformanceReviews() {
  const { data, error } = await supabase
    .from('performance_reviews')
    .select('*')
    .order('review_date', { ascending: false })
  if (error) throw error
  return data as PerformanceReview[]
}

export async function getPerformanceByEmployee(employeeId: string) {
  const { data, error } = await supabase
    .from('performance_reviews')
    .select('*')
    .eq('employee_id', employeeId)
    .order('review_date', { ascending: false })
  if (error) throw error
  return data as PerformanceReview[]
}

export async function createPerformanceReview(review: Omit<PerformanceReview, 'id'>) {
  const { data, error } = await supabase
    .from('performance_reviews')
    .insert(review)
    .select()
    .single()
  if (error) throw error
  return data as PerformanceReview
}
