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

export interface SurveyResponse {
  id: string
  surveyId: string
  chatId: number
  username?: string
  answers: Answer[]
  completedAt: Date
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
