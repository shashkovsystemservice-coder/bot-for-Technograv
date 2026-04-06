export interface Survey {
  id: string
  title: string
  description: string
  questions: Question[]
  isActive: boolean
  createdAt: Date
}

export interface Question {
  id: string
  text: string
  type: 'text' | 'choice' | 'rating'
  options?: string[]
}

// ИСПРАВЛЕННЫЙ ИНТЕРФЕЙС (соответствует вашей таблице в Supabase)
export interface SurveyResponse {
  id: string
  surveyId: string
  userId: string    // Было chatId, теперь userId (для БД)
  userName: string  // Было username?, теперь userName (обязательно для БД)
  answers: Answer[]
  createdAt: Date   // Было completedAt, теперь createdAt (для БД)
}

export interface Answer {
  questionId: string
  value: string
}

export interface UserSession {
  chatId: number
  currentSurveyId?: string
  currentQuestionIndex: number
  answers: Answer[]
  isInSurvey: boolean
}