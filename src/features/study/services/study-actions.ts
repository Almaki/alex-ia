'use server'

import { createClient } from '@/lib/supabase/server'
import type { StudyPlanWithTopics, StudyTopicWithSessions, StudySession, CreatePlanForm } from '../types'

export async function getActivePlan(): Promise<{ data: StudyPlanWithTopics | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'No autenticado' }
  }

  const { data: plan, error: planError } = await supabase
    .from('study_plans')
    .select('id, user_id, title, description, target_date, aircraft_type, plan_type, status, created_at, updated_at')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (planError) {
    if (planError.code === 'PGRST116') {
      return { data: null, error: null }
    }
    return { data: null, error: planError.message }
  }

  const { data: topics, error: topicsError } = await supabase
    .from('study_topics')
    .select('id, plan_id, category, week_number, target_difficulty, status, progress, notes, created_at, updated_at')
    .eq('plan_id', plan.id)
    .order('week_number', { ascending: true })
    .order('category', { ascending: true })

  if (topicsError) {
    return { data: null, error: topicsError.message }
  }

  const topicsWithSessions: StudyTopicWithSessions[] = await Promise.all(
    topics.map(async (topic) => {
      const { data: sessions, error: sessionsError } = await supabase
        .from('study_sessions')
        .select('id, topic_id, user_id, activity_type, duration_minutes, quiz_session_id, score, notes, completed_at, created_at')
        .eq('topic_id', topic.id)
        .order('completed_at', { ascending: false })

      return {
        ...topic,
        sessions: sessionsError ? [] : sessions,
        quizAccuracy: null,
      }
    })
  )

  const enrichedPlan: StudyPlanWithTopics = {
    ...plan,
    topics: topicsWithSessions,
  }

  return { data: enrichedPlan, error: null }
}

export async function createStudyPlan(form: CreatePlanForm): Promise<{ data: StudyPlanWithTopics | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'No autenticado' }
  }

  const { data: existingPlan } = await supabase
    .from('study_plans')
    .select('id')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single()

  if (existingPlan) {
    return { data: null, error: 'Ya tienes un plan activo. Archivalo o completalo antes de crear uno nuevo' }
  }

  const { data: plan, error: planError } = await supabase
    .from('study_plans')
    .insert({
      user_id: user.id,
      title: form.title,
      description: form.description,
      target_date: form.targetDate,
      aircraft_type: form.aircraftType,
      plan_type: form.planType,
      status: 'active',
    })
    .select('id, user_id, title, description, target_date, aircraft_type, plan_type, status, created_at, updated_at')
    .single()

  if (planError) {
    return { data: null, error: planError.message }
  }

  const schedule = generateTopicSchedule(form.selectedCategories, form.targetDate)

  const topicsToInsert = schedule.map((item) => ({
    plan_id: plan.id,
    category: item.category,
    week_number: item.week_number,
    target_difficulty: item.target_difficulty,
    status: 'pending' as const,
    progress: 0,
  }))

  const { data: topics, error: topicsError } = await supabase
    .from('study_topics')
    .insert(topicsToInsert)
    .select('id, plan_id, category, week_number, target_difficulty, status, progress, notes, created_at, updated_at')

  if (topicsError) {
    await supabase.from('study_plans').delete().eq('id', plan.id)
    return { data: null, error: topicsError.message }
  }

  const topicsWithSessions: StudyTopicWithSessions[] = topics.map((topic) => ({
    ...topic,
    sessions: [],
    quizAccuracy: null,
  }))

  const enrichedPlan: StudyPlanWithTopics = {
    ...plan,
    topics: topicsWithSessions,
  }

  return { data: enrichedPlan, error: null }
}

function generateTopicSchedule(
  selectedCategories: string[],
  targetDate: string
): Array<{ category: string; week_number: number; target_difficulty: 1 | 2 | 3 }> {
  const now = new Date()
  const target = new Date(targetDate)
  const totalWeeks = Math.max(1, Math.min(16, Math.ceil((target.getTime() - now.getTime()) / (7 * 24 * 60 * 60 * 1000))))

  const phase1End = Math.ceil(totalWeeks * 0.33)
  const phase2End = Math.ceil(totalWeeks * 0.66)

  function getDifficulty(week: number): 1 | 2 | 3 {
    if (week <= phase1End) return 1
    if (week <= phase2End) return 2
    return 3
  }

  const schedule: Array<{ category: string; week_number: number; target_difficulty: 1 | 2 | 3 }> = []

  for (const category of selectedCategories) {
    const categoryIndex = selectedCategories.indexOf(category)

    const week1 = Math.min(phase1End, 1 + (categoryIndex % Math.max(1, phase1End)))
    schedule.push({ category, week_number: week1, target_difficulty: 1 })

    if (totalWeeks > phase1End) {
      const phase2Length = Math.max(1, phase2End - phase1End)
      const week2 = phase1End + 1 + (categoryIndex % phase2Length)
      schedule.push({ category, week_number: Math.min(week2, phase2End), target_difficulty: 2 })
    }

    if (totalWeeks > phase2End) {
      const phase3Length = Math.max(1, totalWeeks - phase2End)
      const week3 = phase2End + 1 + (categoryIndex % phase3Length)
      schedule.push({ category, week_number: Math.min(week3, totalWeeks), target_difficulty: 3 })
    }
  }

  return schedule
}

export async function updateTopicStatus(
  topicId: string,
  status: string,
  progress: number
): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  const { data: topic } = await supabase
    .from('study_topics')
    .select('plan_id')
    .eq('id', topicId)
    .single()

  if (!topic) {
    return { error: 'Tema no encontrado' }
  }

  const { data: plan } = await supabase
    .from('study_plans')
    .select('user_id')
    .eq('id', topic.plan_id)
    .single()

  if (!plan || plan.user_id !== user.id) {
    return { error: 'No autorizado' }
  }

  const { error } = await supabase
    .from('study_topics')
    .update({ status, progress, updated_at: new Date().toISOString() })
    .eq('id', topicId)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

export async function logStudySession(
  topicId: string,
  activityType: string,
  durationMinutes?: number,
  score?: number,
  notes?: string
): Promise<{ data: StudySession | null; error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { data: null, error: 'No autenticado' }
  }

  const { data: topic } = await supabase
    .from('study_topics')
    .select('plan_id, status')
    .eq('id', topicId)
    .single()

  if (!topic) {
    return { data: null, error: 'Tema no encontrado' }
  }

  const { data: plan } = await supabase
    .from('study_plans')
    .select('user_id')
    .eq('id', topic.plan_id)
    .single()

  if (!plan || plan.user_id !== user.id) {
    return { data: null, error: 'No autorizado' }
  }

  const { data: session, error: sessionError } = await supabase
    .from('study_sessions')
    .insert({
      topic_id: topicId,
      user_id: user.id,
      activity_type: activityType,
      duration_minutes: durationMinutes ?? null,
      score: score ?? null,
      notes: notes ?? null,
      completed_at: new Date().toISOString(),
    })
    .select('id, topic_id, user_id, activity_type, duration_minutes, quiz_session_id, score, notes, completed_at, created_at')
    .single()

  if (sessionError) {
    return { data: null, error: sessionError.message }
  }

  const { data: sessions } = await supabase
    .from('study_sessions')
    .select('id')
    .eq('topic_id', topicId)

  const sessionsCount = sessions?.length ?? 1
  const newProgress = Math.min(100, sessionsCount * 25)

  const updateData: { progress: number; updated_at: string; status?: string } = {
    progress: newProgress,
    updated_at: new Date().toISOString(),
  }

  if (topic.status === 'pending') {
    updateData.status = 'in_progress'
  }

  await supabase
    .from('study_topics')
    .update(updateData)
    .eq('id', topicId)

  return { data: session, error: null }
}

export async function completePlan(planId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  const { error } = await supabase
    .from('study_plans')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', planId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

export async function archivePlan(planId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  const { error } = await supabase
    .from('study_plans')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', planId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

export async function deletePlan(planId: string): Promise<{ error: string | null }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'No autenticado' }
  }

  const { error } = await supabase
    .from('study_plans')
    .delete()
    .eq('id', planId)
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}
