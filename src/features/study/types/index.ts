export interface StudyPlan {
  id: string
  user_id: string
  title: string
  description: string | null
  target_date: string
  aircraft_type: string | null
  plan_type: string
  status: 'active' | 'completed' | 'archived'
  created_at: string
  updated_at: string
}

export interface StudyTopic {
  id: string
  plan_id: string
  category: string
  week_number: number
  target_difficulty: 1 | 2 | 3
  status: 'pending' | 'in_progress' | 'completed'
  progress: number
  notes: string | null
  created_at: string
  updated_at: string
}

export interface StudySession {
  id: string
  topic_id: string
  user_id: string
  activity_type: 'quiz' | 'chat' | 'review' | 'manual'
  duration_minutes: number | null
  quiz_session_id: string | null
  score: number | null
  notes: string | null
  completed_at: string
  created_at: string
}

export interface StudyTopicWithSessions extends StudyTopic {
  sessions: StudySession[]
  quizAccuracy: number | null
}

export interface StudyPlanWithTopics extends StudyPlan {
  topics: StudyTopicWithSessions[]
}

export interface CreatePlanForm {
  title: string
  description: string
  targetDate: string
  aircraftType: string | null
  planType: string
  selectedCategories: string[]
}

export type StudyPhase = 'loading' | 'no_plan' | 'creating' | 'dashboard'

export interface StudyState {
  phase: StudyPhase
  plan: StudyPlanWithTopics | null
  selectedWeek: number | null
  error: string | null
  saving: boolean
}

export type StudyAction =
  | { type: 'SET_LOADING' }
  | { type: 'SET_NO_PLAN' }
  | { type: 'SET_CREATING' }
  | { type: 'LOAD_PLAN'; plan: StudyPlanWithTopics }
  | { type: 'SELECT_WEEK'; week: number | null }
  | { type: 'UPDATE_TOPIC'; topicId: string; updates: Partial<StudyTopic> }
  | { type: 'ADD_SESSION'; topicId: string; session: StudySession }
  | { type: 'SET_SAVING'; saving: boolean }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'COMPLETE_PLAN' }
  | { type: 'ARCHIVE_PLAN' }

export const PLAN_TYPE_OPTIONS = [
  { value: 'simulator_prep', label: 'Preparacion Simulador' },
  { value: 'line_check', label: 'Line Check' },
  { value: 'proficiency_check', label: 'Proficiency Check' },
  { value: 'type_rating', label: 'Type Rating' },
  { value: 'recurrent', label: 'Recurrente' },
] as const

export const STUDY_CATEGORIES = [
  { value: 'systems', label: 'Sistemas', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { value: 'aerodynamics', label: 'Aerodinamica', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  { value: 'meteorology', label: 'Meteorologia', color: 'text-sky-400', bg: 'bg-sky-400/10' },
  { value: 'regulations', label: 'Regulaciones', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { value: 'procedures', label: 'Procedimientos', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { value: 'performance', label: 'Performance', color: 'text-green-400', bg: 'bg-green-400/10' },
  { value: 'navigation', label: 'Navegacion', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  { value: 'human_factors', label: 'Factores Humanos', color: 'text-pink-400', bg: 'bg-pink-400/10' },
  { value: 'emergency', label: 'Emergencias', color: 'text-red-400', bg: 'bg-red-400/10' },
] as const

export const TOPIC_STATUS_LABELS = {
  pending: { label: 'Pendiente', color: 'text-gray-400', bg: 'bg-gray-400/10' },
  in_progress: { label: 'En Progreso', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  completed: { label: 'Completado', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
} as const
