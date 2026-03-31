import type { Survey, SurveyResponse, UserSession } from './types'

// In-memory store (in production, use a database)
const surveys: Map<string, Survey> = new Map()
const responses: Map<string, SurveyResponse[]> = new Map()
const sessions: Map<number, UserSession> = new Map()

// Initialize with a sample survey (inactive)
const sampleSurvey: Survey = {
  id: 'survey-1',
  title: 'Опрос удовлетворённости',
  description: 'Помогите нам стать лучше, ответив на несколько вопросов',
  questions: [
    {
      id: 'q1',
      text: 'Как вы оцениваете качество нашего сервиса?',
      type: 'rating',
      options: ['1', '2', '3', '4', '5'],
    },
    {
      id: 'q2',
      text: 'Что вам понравилось больше всего?',
      type: 'choice',
      options: ['Скорость работы', 'Удобство интерфейса', 'Поддержка', 'Цена'],
    },
    {
      id: 'q3',
      text: 'Есть ли у вас предложения по улучшению?',
      type: 'text',
    },
  ],
  isActive: false,
  createdAt: new Date(),
}

// Expert Interview Survey - Stage I (ACTIVE)
const expertSurvey: Survey = {
  id: 'survey-expert-stage-1',
  title: 'Стратегическая сессия: Запуск Этапа I',
  description: 'Максим, эти 5 вопросов разблокируют конкретные решения по позиционированию и приоритетам. 5-10 предложений на каждый ответ будет идеально.',
  questions: [
    {
      id: 'exp-q1',
      text: 'Подрядчики, приведшие >1 объекта: что у них общего? (Кто они, откуда, что их мотивирует?)',
      type: 'text',
    },
    {
      id: 'exp-q2',
      text: 'Проектировщики с договорами: сколько их и насколько они активны? (Что им нужно, чтобы предлагать SLED чаще?)',
      type: 'text',
    },
    {
      id: 'exp-q3',
      text: 'Модернизация vs Новое строительство: кто инициирует процесс и где цикл сделки быстрее?',
      type: 'text',
    },
    {
      id: 'exp-q4',
      text: 'Приоритетные регионы после Москвы и МО: где есть интуиция или готовые контакты (Екатеринбург, Казань и т.д.)?',
      type: 'text',
    },
    {
      id: 'exp-q5',
      text: 'Экономический порог SLED: минимальный размер объекта (м² или чек), ниже которого сделка невыгодна?',
      type: 'text',
    },
  ],
  isActive: true,
  createdAt: new Date(),
}

surveys.set(sampleSurvey.id, sampleSurvey)
surveys.set(expertSurvey.id, expertSurvey)

export function getSurveys(): Survey[] {
  return Array.from(surveys.values())
}

export function getSurvey(id: string): Survey | undefined {
  return surveys.get(id)
}

export function getActiveSurvey(): Survey | undefined {
  return Array.from(surveys.values()).find((s) => s.isActive)
}

export function createSurvey(survey: Survey): void {
  surveys.set(survey.id, survey)
}

export function updateSurvey(id: string, updates: Partial<Survey>): void {
  const existing = surveys.get(id)
  if (existing) {
    surveys.set(id, { ...existing, ...updates })
  }
}

export function deleteSurvey(id: string): void {
  surveys.delete(id)
}

export function getSession(chatId: number): UserSession {
  let session = sessions.get(chatId)
  if (!session) {
    session = {
      chatId,
      currentQuestionIndex: 0,
      answers: [],
      isInSurvey: false,
    }
    sessions.set(chatId, session)
  }
  return session
}

export function updateSession(chatId: number, updates: Partial<UserSession>): void {
  const session = getSession(chatId)
  sessions.set(chatId, { ...session, ...updates })
}

export function resetSession(chatId: number): void {
  sessions.set(chatId, {
    chatId,
    currentQuestionIndex: 0,
    answers: [],
    isInSurvey: false,
  })
}

export function saveResponse(response: SurveyResponse): void {
  const existing = responses.get(response.surveyId) || []
  existing.push(response)
  responses.set(response.surveyId, existing)
}

export function getResponses(surveyId: string): SurveyResponse[] {
  return responses.get(surveyId) || []
}

export function getAllResponses(): SurveyResponse[] {
  return Array.from(responses.values()).flat()
}
