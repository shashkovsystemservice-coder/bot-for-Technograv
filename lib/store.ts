import { createClient } from '@supabase/supabase-js'

// 1. ПОДКЛЮЧЕНИЕ К БАЗЕ
const SUPABASE_URL = process.env.SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || ''

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// 2. ТВОЙ ОПРОС TECHNOGRAV 2026 (ПЕРЕНЕСЕН ПОЛНОСТЬЮ)
export const technogravSurvey = {
  id: 'technograv-competitors-2026',
  title: 'Анализ конкурентного поля Technograv',
  description: 'Нам нужно четко разметить конкурентное поле. Это займет 3-4 минуты.',
  isActive: true,
  questions: [
    { id: 'q1', text: 'Кто наш «Топ-3» по частоте встреч? Напишите названия 3-5 компаний, которые чаще всего уводят у нас сделки или с кем нас постоянно сравнивают клиенты.' },
    { id: 'q2', text: 'Кто из них — «Чистый P0» (Продавцы железа)? Кто конкурирует с нами только ценой, наличием на складе и характеристиками самого станка?' },
    { id: 'q3', text: 'Кто уже «продаёт словами» автоматизацию (L1-L2)? Кто из конкурентов начал активно использовать в маркетинге слова «автоматизация», «умный завод», «роботизация»?' },
    { id: 'q4', text: 'Проверка на Proof (Доказательства): Видели ли вы у кого-то из конкурентов реально работающий в России проект уровня L2 (автономный участок, где софт управляет потоком)?' },
    { id: 'q5', text: 'Кто «звучит по-европейски»? Кого из китайских или локальных брендов клиенты воспринимают как технологичную альтернативу Trumpf/Bystronic и почему?' },
    { id: 'q6', text: 'Сервис и экспертиза: Оцените от 1 до 5, насколько силен инженерный департамент у нашего главного конкурента (способность делать предпроект и ТЗ).' },
    { id: 'q7', text: 'На каком поле мы проигрываем прямо сейчас? В чем конкуренты объективно сильнее Technograv сегодня? (Цена / Склад / Бренд / Кейсы)' },
    { id: 'q8', text: 'Софтверная гонка: Есть ли у кого-то из конкурентов свой софт для управления производством (MES/ERP), который они навязывают вместе со станками?' },
    { id: 'q9', text: '«Угроза будущего»: Если завтра клиент попросит «полностью автономный цех», чьё имя он назовет первым, кроме мировых гигантов?' },
    { id: 'q10', text: 'Наше позиционирование: Какое утверждение о Technograv будет звучать для клиента убийственным аргументом против конкурентов в 2026 году?' }
  ]
}

// 3. ЛОГИКА СЕССИЙ (ДЛЯ ТЕЛЕГРАМА)
const sessions = new Map<number, any>()

export function getSession(chatId: number) {
  if (!sessions.has(chatId)) {
    sessions.set(chatId, { isInSurvey: false, currentQuestionIndex: 0, answers: [] })
  }
  return sessions.get(chatId)
}

export function updateSession(chatId: number, data: any) {
  const current = getSession(chatId)
  sessions.set(chatId, { ...current, ...data })
}

export function resetSession(chatId: number) {
  sessions.delete(chatId)
}

export function getActiveSurvey() {
  return technogravSurvey
}

// 4. ФУНКЦИЯ СОХРАНЕНИЯ В SUPABASE
export async function saveResponse(responseData: any) {
  const { data, error } = await supabase
    .from('responses')
    .insert([{
      survey_id: responseData.surveyId,
      user_id: responseData.userId,
      user_name: responseData.userName,
      answers: responseData.answers,
      created_at: new Date().toISOString()
    }])

  if (error) {
    console.error('Ошибка Supabase:', error.message)
    throw error
  }
  return data
}

// 5. CRUD ДЛЯ ОПРОСОВ (в памяти)
const surveysStore = new Map<string, any>()
surveysStore.set(technogravSurvey.id, technogravSurvey)

export function getSurveys() {
  return Array.from(surveysStore.values())
}

export function createSurvey(survey: any) {
  surveysStore.set(survey.id, survey)
  return survey
}

export function updateSurvey(id: string, updates: any) {
  const existing = surveysStore.get(id)
  if (existing) surveysStore.set(id, { ...existing, ...updates })
}

export function deleteSurvey(id: string) {
  surveysStore.delete(id)
}

// 6. ПОЛУЧЕНИЕ ОТВЕТОВ ИЗ SUPABASE
export async function getResponses(surveyId: string) {
  const { data, error } = await supabase
    .from('responses')
    .select('*')
    .eq('survey_id', surveyId)
    .order('created_at', { ascending: false })
  if (error) return []
  return data || []
}

export async function getAllResponses() {
  const { data, error } = await supabase
    .from('responses')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) return []
  return data || []
}