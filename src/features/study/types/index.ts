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
  selectedSubsystems: string[]
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

export const PLAN_TYPE_OPTIONS: readonly {
  value: string
  label: string
  icon: string
  description: string
  recommendedCategories: readonly string[]
}[] = [
  {
    value: 'simulator_prep',
    label: 'Preparacion Simulador',
    icon: 'sim',
    description: 'Procedimientos normales, anormales y de emergencia. Factor humano integral, rutas de falla y decision making.',
    recommendedCategories: ['procedures', 'emergency', 'systems', 'human_factors'],
  },
  {
    value: 'line_check',
    label: 'Line Check',
    icon: 'line',
    description: 'Teoria operativa, procedimientos normales, memory items y regulaciones de linea.',
    recommendedCategories: ['procedures', 'regulations', 'systems', 'performance', 'navigation'],
  },
  {
    value: 'proficiency_check',
    label: 'Proficiency Check',
    icon: 'prof',
    description: 'Evaluacion completa de conocimientos tecnicos y operativos.',
    recommendedCategories: ['systems', 'procedures', 'emergency', 'performance', 'aerodynamics'],
  },
  {
    value: 'type_rating',
    label: 'Type Rating',
    icon: 'type',
    description: 'Conocimiento profundo de sistemas de aeronave, limitaciones y performance.',
    recommendedCategories: ['systems', 'performance', 'procedures', 'navigation', 'aerodynamics'],
  },
  {
    value: 'recurrent',
    label: 'Recurrente',
    icon: 'recur',
    description: 'Repaso general de todas las areas para mantenerte actualizado.',
    recommendedCategories: ['systems', 'procedures', 'emergency', 'regulations', 'meteorology'],
  },
]

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

export const SYSTEM_SUBCATEGORIES = [
  { value: 'hydraulic', label: 'Hidraulico' },
  { value: 'pneumatic', label: 'Neumatico' },
  { value: 'electrical', label: 'Electrico' },
  { value: 'fuel', label: 'Combustible' },
  { value: 'flight_controls', label: 'Controles de Vuelo' },
  { value: 'landing_gear', label: 'Tren de Aterrizaje' },
  { value: 'air_conditioning', label: 'Aire Acondicionado' },
  { value: 'pressurization', label: 'Presurización' },
  { value: 'fire_protection', label: 'Proteccion Contra Fuego' },
  { value: 'ice_rain', label: 'Anti-hielo' },
  { value: 'apu', label: 'APU' },
  { value: 'engines', label: 'Motores' },
  { value: 'navigation', label: 'Sistemas de Navegacion' },
  { value: 'communication', label: 'Comunicaciones' },
  { value: 'oxygen', label: 'Oxigeno' },
  { value: 'lighting', label: 'Iluminacion' },
] as const

export const TOPIC_STATUS_LABELS = {
  pending: { label: 'Pendiente', color: 'text-gray-400', bg: 'bg-gray-400/10' },
  in_progress: { label: 'En Progreso', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  completed: { label: 'Completado', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
} as const
