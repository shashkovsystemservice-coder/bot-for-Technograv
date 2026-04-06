import type { Survey, SurveyResponse, UserSession } from './types'
import { saveResponseToDb } from './db' // Импортируем связь с базой данных

// In-memory store (используется для сессий и временного кэша)
const surveys: Map<string, Survey> = new Map()
const responses: Map<string, SurveyResponse[]> = new Map()
const sessions: Map<number, UserSession> = new Map()

// Опрос по конкурентам Technograv 2026 (ACTIVE)
const technogravSurvey: Survey = {
  id: 'technograv-competitors-2026',
  title: 'Анализ конкурентного поля Technograv',
  description: 'Нам нужно четко разметить конкурентное поле. Это займет 3-4 минуты.',
  isActive: true,
  createdAt: new Date(),
  questions: [
    { 
      id: 'q1', 
      text: 'Кто наш «Топ-3» по частоте встреч? Напишите названия 3-5 компаний, которые чаще всего уводят у нас сделки или с кем нас постоянно сравнивают клиенты.', 
      type: 'text' 
    },
    { 
      id: 'q2', 
      text: 'Кто из них — «Чистый P0» (Продавцы железа)? Кто конкурирует с нами только ценой, наличием на складе и характеристиками самого станка?', 
      type: 'text' 
    },
    { 
      id: 'q3', 
      text: 'Кто уже «продаёт словами» автоматизацию (L1-L2)? Кто из конкурентов начал активно использовать в маркетинге слова «автоматизация», «умный завод», «роботизация»?', 
      type: 'text' 
    },
    { 
      id: 'q4', 
      text: 'Проверка на Proof (Доказательства): Видели ли вы у кого-то из конкурентов реально работающий в России проект уровня L2 (автономный участок, где софт управляет потоком)?', 
      type: 'text' 
    },
    { 
      id: 'q5', 
      text: 'Кто «звучит по-европейски»? Кого из китайских или локальных брендов клиенты воспринимают как технологичную альтернативу Trumpf/Bystronic и почему?', 
      type: 'text' 
    },
    { 
      id: 'q6', 
      text: 'Сервис и экспертиза: Оцените от 1 до 5, насколько силен инженерный департамент у нашего главного конкурента (способность делать предпроект и ТЗ).', 
      type: 'text' 
    },
    { 
      id: 'q7', 
      text: 'На каком поле мы проигрываем прямо сейчас? В чем конкуренты объективно сильнее Technograv сегодня? (Цена / Склад / Бренд / Кейсы)', 
      type: 'text' 
    },
    { 
      id: 'q8', 
      text: 'Софтверная гонка: Есть ли у кого-то из конкурентов свой софт для управления производством (MES/ERP), который они навязывают вместе со станками?', 
      type: 'text' 
    },
    { 
      id: 'q9', 
      text: '«Угроза будущего»: Если завтра клиент попросит «полностью автономный цех», чьё имя он назовет первым, кроме мировых гигантов?', 
      type: 'text' 
    },
    { 
      id: 'q10', 
      text: 'Наше позиционирование: Какое утверждение о Technograv будет звучать для клиента убийственным аргументом против конкурентов в 2026 году?', 
      type: 'text' 
    }
  ],
}

surveys.set(technogravSurvey.id, technogravSurvey)

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

// ОБНОВЛЕННАЯ ФУНКЦИЯ СОХРАНЕНИЯ
export async function saveResponse(response: SurveyResponse): Promise<void> {
  // 1. Сохраняем в оперативную память (для быстрой отрисовки)
  const existing = responses.get(response.surveyId) || []
  existing.push(response)
  responses.set(response.surveyId, existing)

  // 2. СОХРАНЯЕМ В SUPABASE (навсегда)
  try {
    await saveResponseToDb(response)
  } catch (err) {
    console.error('Ошибка при сохранении в базу данных:', err)
  }
}

export function getResponses(surveyId: string): SurveyResponse[] {
  return responses.get(surveyId) || []
}

export function getAllResponses(): SurveyResponse[] {
  return Array.from(responses.values()).flat()
}