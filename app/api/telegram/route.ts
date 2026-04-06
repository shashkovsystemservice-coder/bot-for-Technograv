import { NextResponse } from 'next/server'
import { getActiveSurvey, getSession, updateSession, saveResponse, resetSession } from '@/lib/store'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

async function sendTelegramMessage(chatId: number, text: string) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
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
    const survey = getActiveSurvey()

    if (userText === '/start') {
      resetSession(chatId)
      updateSession(chatId, { isInSurvey: true, currentQuestionIndex: 0, answers: [] })
      await sendTelegramMessage(chatId, `<b>Технограв: Опрос 2026</b>\n\n${survey.description}`)
      await sendTelegramMessage(chatId, `<b>Вопрос 1:</b>\n${survey.questions[0].text}`)
      return NextResponse.json({ ok: true })
    }

    if (session.isInSurvey) {
      const idx = session.currentQuestionIndex
      const answers = [...session.answers, { q: survey.questions[idx].text, a: userText }]
      
      if (idx + 1 < survey.questions.length) {
        updateSession(chatId, { currentQuestionIndex: idx + 1, answers })
        await sendTelegramMessage(chatId, `<b>Вопрос ${idx + 2}:</b>\n${survey.questions[idx + 1].text}`)
      } else {
        // Конец опроса
        await saveResponse({
          surveyId: survey.id,
          userId: chatId.toString(),
          userName: from.username || from.first_name || 'User',
          answers: answers
        })
        resetSession(chatId)
        await sendTelegramMessage(chatId, "<b>Готово!</b> Данные переданы в отдел стратегии Технограв. Спасибо!")
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Критическая ошибка:', e)
    return NextResponse.json({ ok: true }) // Всегда отвечаем OK Телеграму
  }
}