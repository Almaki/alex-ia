export interface QuizQuestion {
  id: string
  content: string
  options: string[]
  correct_index: number
  explanation: string
  difficulty: 1 | 2 | 3
  category: string
  aircraft_type: string | null
}

export interface QuizSession {
  id: string
  mode: 'practice'
  difficulty: 1 | 2 | 3
  category: string | null
  total_questions: number
  correct_count: number
  score: number
  started_at: string
  finished_at: string | null
}

export interface QuizPlayerStats {
  elo_rating: number
  total_sessions: number
  total_correct: number
  total_answered: number
  best_streak: number
  current_streak: number
}

export type QuizPhase = 'lobby' | 'playing' | 'feedback' | 'results'

export interface QuizState {
  phase: QuizPhase
  session: QuizSession | null
  questions: QuizQuestion[]
  currentIndex: number
  selectedIndex: number | null
  stats: QuizPlayerStats | null
  timeRemaining: number
  streak: number
  error: string | null
}

export type QuizAction =
  | { type: 'LOAD_STATS'; stats: QuizPlayerStats }
  | { type: 'START_QUIZ'; session: QuizSession; questions: QuizQuestion[] }
  | { type: 'SELECT_ANSWER'; index: number }
  | { type: 'SHOW_FEEDBACK'; isCorrect: boolean; eloChange: number }
  | { type: 'NEXT_QUESTION' }
  | { type: 'FINISH_QUIZ'; correctCount: number; score: number }
  | { type: 'TICK_TIMER' }
  | { type: 'TIME_UP' }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'RESET' }

export const QUIZ_CATEGORIES = [
  { value: 'all', label: 'Todas las categorias' },
  { value: 'systems', label: 'Sistemas' },
  { value: 'aerodynamics', label: 'Aerodinamica' },
  { value: 'meteorology', label: 'Meteorologia' },
  { value: 'regulations', label: 'Regulaciones' },
  { value: 'procedures', label: 'Procedimientos' },
  { value: 'performance', label: 'Performance' },
  { value: 'navigation', label: 'Navegacion' },
  { value: 'human_factors', label: 'Factores Humanos' },
  { value: 'emergency', label: 'Emergencias' },
] as const

export const DIFFICULTY_OPTIONS = [
  { value: 1 as const, label: 'Basico', description: 'Conceptos fundamentales', color: 'green' },
  { value: 2 as const, label: 'Intermedio', description: 'Aplicacion practica', color: 'yellow' },
  { value: 3 as const, label: 'Avanzado', description: 'Escenarios complejos', color: 'red' },
] as const

export const ELO_RANKS = [
  { min: 0,    label: 'Cadete',         color: 'text-gray-400' },
  { min: 1000, label: 'Alumno',         color: 'text-green-400' },
  { min: 1200, label: 'Copiloto',       color: 'text-blue-400' },
  { min: 1400, label: 'Primer Oficial', color: 'text-purple-400' },
  { min: 1600, label: 'Capitan',        color: 'text-orange-400' },
  { min: 1800, label: 'Instructor',     color: 'text-red-400' },
  { min: 2000, label: 'Comandante',     color: 'text-yellow-300' },
] as const
