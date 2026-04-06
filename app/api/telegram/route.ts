import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { getActiveSurvey, getSession, updateSession, saveResponse, resetSession } from '@/lib/store'
import type { SurveyResponse } from '@/lib/types'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY || '')

async function sendTelegramMessage(chatId: number, text: string): Promise<void> {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }),
  })
}

export async function POST(request: Request) {
  try {
    const update = await request.json()
    if (!update.message?.text) return NextResponse.json({ ok: true })

    const { chat, from, text } = update.message
    const chatId = chat.id
    const userText = text.trim()
    const session = getSession(chatId)
    const activeSurvey = getActiveSurvey()

    // 1. Команды управления
    if (userText === '/start' || userText === '/reset') {
      resetSession(chatId)
      if (activeSurvey) {
        updateSession(chatId, { isInSurvey: true, currentQuestionIndex: 0 })
        await sendTelegramMessage(chatId, `<b>Приветствуем в Technograv!</b>\n\n${activeSurvey.description}`)
        await sendTelegramMessage(chatId, `<b>Вопрос 1/${activeSurvey.questions.length}:</b>\n${activeSurvey.questions[0].text}`)
      } else {
        await sendTelegramMessage(chatId, "Привет! Сейчас нет активных опросов, но я готов ответить на вопросы по автоматизации.")
      }
      return NextResponse.json({ ok: true })
    }

    // 2. Логика Опроса
    if (session.isInSurvey && activeSurvey) {
      const currentIndex = session.currentQuestionIndex
      const currentQuestion = activeSurvey.questions[currentIndex]

      // Сохраняем ответ (используем 'value', чтобы TypeScript не ругался)
      const newAnswers = [...(session.answers || []), { 
        questionId: currentQuestion.id, 
        value: userText 
      }]
      
      const nextIndex = currentIndex + 1

      if (nextIndex < activeSurvey.questions.length) {
        // Переход к следующему вопросу
        updateSession(chatId, { 
          currentQuestionIndex: nextIndex, 
          answers: newAnswers 
        })
        const nextQuestion = activeSurvey.questions[nextIndex]
        await sendTelegramMessage(chatId, `<b>Вопрос ${nextIndex + 1}/${activeSurvey.questions.length}:</b>\n${nextQuestion.text}`)
      } else {
        // Финиш опроса и отправка в Supabase
        const responseData: SurveyResponse = {
          id: Date.now().toString(),
          surveyId: activeSurvey.id,
          userId: chatId.toString(),
          userName: from.username || from.first_name || 'Anonymous',
          answers: newAnswers,
          createdAt: new Date()
        }

        await saveResponse(responseData)
        resetSession(chatId)
        
        await sendTelegramMessage(chatId, "<b>Спасибо!</b> Ваши ответы сохранены. Мы используем их для улучшения стратегии Technograv 2026.")
      }
      return NextResponse.json({ ok: true })
    }

    // 3. Свободное общение (Gemini AI)
    if (GOOGLE_API_KEY) {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
      const result = await model.generateContent(`Ты ассистент компании Technograv. Ответь кратко на вопрос пользователя: ${userText}`)
      await sendTelegramMessage(chatId, result.response.text())
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ ok: false })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'active', bot: 'TechnogravBot' })
}