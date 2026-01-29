export type FleetType = 'A320' | 'B737' | 'E190' | 'ATR72' | 'A350' | 'B787' | 'CRJ' | 'ERJ'
export type PositionType = 'captain' | 'first_officer' | 'cabin_crew' | 'student'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  fleet: FleetType | null
  position: PositionType | null
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'created_at' | 'updated_at' | 'onboarding_completed'>
        Update: Partial<Omit<Profile, 'id' | 'created_at'>>
      }
    }
  }
}

export const FLEET_OPTIONS: { value: FleetType; label: string; manufacturer: string }[] = [
  { value: 'A320', label: 'A320 Family', manufacturer: 'Airbus' },
  { value: 'B737', label: 'B737 NG/MAX', manufacturer: 'Boeing' },
  { value: 'E190', label: 'E190/E195', manufacturer: 'Embraer' },
  { value: 'ATR72', label: 'ATR 72', manufacturer: 'ATR' },
  { value: 'A350', label: 'A350 XWB', manufacturer: 'Airbus' },
  { value: 'B787', label: 'B787 Dreamliner', manufacturer: 'Boeing' },
  { value: 'CRJ', label: 'CRJ Series', manufacturer: 'Bombardier' },
  { value: 'ERJ', label: 'ERJ 145', manufacturer: 'Embraer' },
]

export const POSITION_OPTIONS: { value: PositionType; label: string; description: string }[] = [
  { value: 'captain', label: 'Capitan', description: 'Piloto al mando' },
  { value: 'first_officer', label: 'Primer Oficial', description: 'Copiloto' },
  { value: 'cabin_crew', label: 'Sobrecargo', description: 'Tripulacion de cabina' },
  { value: 'student', label: 'Estudiante', description: 'Piloto en formacion' },
]

// --- Chat & RAG types ---

export interface Conversation {
  id: string
  user_id: string
  title: string | null
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  conversation_id: string
  role: 'user' | 'assistant'
  content: string
  sources: SourceCitation[] | null
  created_at: string
}

export interface SourceCitation {
  chunk_id: string
  manual_type: string
  aircraft_type: string | null
  section: string | null
  page_number: number | null
  similarity: number
}

export interface ManualChunk {
  id: string
  content: string
  manual_type: string
  aircraft_type: string | null
  section: string | null
  chapter: string | null
  page_number: number | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface UsageDaily {
  id: string
  user_id: string
  date: string
  query_count: number
  voice_input_seconds: number
  voice_output_chars: number
  created_at: string
  updated_at: string
}

// --- Quiz types ---

export interface QuizQuestionRow {
  id: string
  content: string
  options: string[]
  correct_index: number
  explanation: string
  difficulty: number
  category: string
  aircraft_type: string | null
  source_chunk_id: number | null
  created_at: string
}

export interface QuizSessionRow {
  id: string
  user_id: string
  mode: string
  difficulty: number
  category: string | null
  total_questions: number
  correct_count: number
  score: number
  started_at: string
  finished_at: string | null
  created_at: string
}

export interface QuizAnswerRow {
  id: string
  session_id: string
  question_id: string
  selected_index: number
  is_correct: boolean
  time_seconds: number | null
  created_at: string
}

export interface QuizPlayerStatsRow {
  id: string
  user_id: string
  elo_rating: number
  total_sessions: number
  total_correct: number
  total_answered: number
  best_streak: number
  current_streak: number
  updated_at: string
  created_at: string
}

// --- Study Room types ---

export interface StudyPlanRow {
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

export interface StudyTopicRow {
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

export interface StudySessionRow {
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
