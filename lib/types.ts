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

// ВАЖНО: Эти поля должны совпадать с тем, что вы передаете в store.ts
export interface SurveyResponse {
  id: string
  surveyId: string
  userId: string    // Используем userId вместо chatId для совместимости с БД
  userName: string  // Должно быть именно userName (как в таблице)
  answers: Answer[]
  createdAt: Date   
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