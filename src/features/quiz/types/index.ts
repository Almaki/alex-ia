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

// ========== Challenge Types ==========

export type ChallengeStatus =
  | 'pending' | 'accepted' | 'playing'
  | 'completed' | 'declined' | 'expired' | 'cancelled'

export interface QuizChallenge {
  id: string
  challenger_id: string
  opponent_id: string
  status: ChallengeStatus
  difficulty: 1 | 2 | 3
  category: string | null
  question_ids: string[]
  challenger_correct: number
  challenger_total_time: number
  opponent_correct: number
  opponent_total_time: number
  winner_id: string | null
  challenger_elo_change: number
  opponent_elo_change: number
  expires_at: string
  started_at: string | null
  finished_at: string | null
  created_at: string
}

export interface OnlinePilot {
  id: string
  full_name: string | null
  elo_rating: number
  fleet: string | null
  position: string | null
}

export type ChallengePhase =
  | 'idle'
  | 'selecting'
  | 'waiting'
  | 'countdown'
  | 'playing'
  | 'waiting_opponent'
  | 'results'

export interface ChallengeState {
  phase: ChallengePhase
  challenge: QuizChallenge | null
  questions: QuizQuestion[]
  currentIndex: number
  selectedIndex: number | null
  timeRemaining: number
  myCorrect: number
  opponentProgress: number
  opponentCorrect: number
  onlinePilots: OnlinePilot[]
  incomingChallenge: (QuizChallenge & { challenger_name?: string; challenger_elo?: number }) | null
  opponentName: string | null
  countdown: number
  error: string | null
}

export type ChallengeAction =
  | { type: 'SET_ONLINE_PILOTS'; pilots: OnlinePilot[] }
  | { type: 'INCOMING_CHALLENGE'; challenge: QuizChallenge & { challenger_name?: string; challenger_elo?: number } }
  | { type: 'DISMISS_CHALLENGE' }
  | { type: 'START_SELECTING' }
  | { type: 'CHALLENGE_SENT'; challenge: QuizChallenge; opponentName: string }
  | { type: 'CHALLENGE_ACCEPTED'; challenge: QuizChallenge; questions: QuizQuestion[] }
  | { type: 'OPPONENT_ACCEPTED'; challenge: QuizChallenge; questions: QuizQuestion[] }
  | { type: 'CHALLENGE_DECLINED' }
  | { type: 'CHALLENGE_EXPIRED' }
  | { type: 'START_PLAYING' }
  | { type: 'TICK_COUNTDOWN' }
  | { type: 'SELECT_ANSWER'; index: number }
  | { type: 'SHOW_FEEDBACK'; isCorrect: boolean }
  | { type: 'NEXT_QUESTION' }
  | { type: 'OPPONENT_PROGRESS'; questionsAnswered: number; correct: number }
  | { type: 'FINISH_MY_PART' }
  | { type: 'SHOW_RESULTS'; challenge: QuizChallenge }
  | { type: 'TICK_TIMER' }
  | { type: 'TIME_UP' }
  | { type: 'SET_ERROR'; error: string }
  | { type: 'RESET' }
