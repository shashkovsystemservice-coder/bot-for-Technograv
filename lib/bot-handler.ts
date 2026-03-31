import { GoogleGenerativeAI } from '@google/generative-ai'
import type { TelegramUpdate, ReplyMarkup } from './telegram'
import { sendMessage, answerCallbackQuery } from './telegram'
import {
  getActiveSurvey,
  getSession,
  updateSession,
  resetSession,
  saveResponse,
} from './store'
import type { Question, Answer } from './types'

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || '')

async function generateAIResponse(context: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    
    const systemPrompt = `Ты дружелюбный бот для опросов. Отвечай кратко и по-русски. 
Твоя задача - помогать пользователям проходить опросы и отвечать на их вопросы.
Будь вежливым и полезным.`

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\n${context}` }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 256,
        temperature: 0.7,
      },
    })

    const response = result.response
    return response.text() || 'Извините, произошла ошибка. Попробуйте ещё раз.'
  } catch (error) {
    console.error('[v0] AI generation error:', error)
    return 'Извините, произошла ошибка. Попробуйте ещё раз.'
  }
}

function formatQuestion(question: Question, index: number, total: number): {
  text: string
  markup?: ReplyMarkup
} {
  const questionText = `<b>Вопрос ${index + 1}/${total}</b>\n\n${question.text}`

  if (question.type === 'choice' && question.options) {
    return {
      text: questionText,
      markup: {
        inline_keyboard: question.options.map((option) => [
          { text: option, callback_data: `answer:${question.id}:${option}` },
        ]),
      },
    }
  }

  if (question.type === 'rating' && question.options) {
    return {
      text: `${questionText}\n\nОцените от 1 до 5:`,
      markup: {
        inline_keyboard: [
          question.options.map((rating) => ({
            text: rating,
            callback_data: `answer:${question.id}:${rating}`,
          })),
        ],
      },
    }
  }

  return {
    text: `${questionText}\n\n<i>Напишите ваш ответ:</i>`,
  }
}

async function handleStartCommand(chatId: number, username?: string): Promise<void> {
  const survey = getActiveSurvey()

  if (!survey) {
    await sendMessage(
      chatId,
      'Привет! К сожалению, сейчас нет активных опросов. Попробуйте позже!'
    )
    return
  }

  updateSession(chatId, {
    currentSurveyId: survey.id,
    currentQuestionIndex: 0,
    answers: [],
    isInSurvey: true,
  })

  const welcomeMessage = `Привет${username ? `, ${username}` : ''}!\n\n` +
    `<b>${survey.title}</b>\n\n` +
    `${survey.description}\n\n` +
    `Опрос содержит ${survey.questions.length} вопросов. Начнём?`

  await sendMessage(chatId, welcomeMessage, {
    inline_keyboard: [
      [{ text: 'Начать опрос', callback_data: 'start_survey' }],
      [{ text: 'Отмена', callback_data: 'cancel' }],
    ],
  })
}

async function handleAnswer(
  chatId: number,
  questionId: string,
  value: string,
  username?: string
): Promise<void> {
  const session = getSession(chatId)
  const survey = session.currentSurveyId ? getActiveSurvey() : undefined

  if (!survey || !session.isInSurvey) {
    await sendMessage(chatId, 'Опрос не найден. Введите /start чтобы начать.')
    return
  }

  const newAnswers: Answer[] = [...session.answers, { questionId, value }]
  const nextIndex = session.currentQuestionIndex + 1

  if (nextIndex >= survey.questions.length) {
    // Survey completed
    saveResponse({
      id: `response-${Date.now()}`,
      surveyId: survey.id,
      chatId,
      username,
      answers: newAnswers,
      completedAt: new Date(),
    })

    resetSession(chatId)

    const thankYouMessage = await generateAIResponse(
      `Пользователь завершил опрос "${survey.title}". Поблагодари его за участие и скажи, что его ответы очень важны для нас. Ответь кратко, в 2-3 предложения.`
    )

    await sendMessage(chatId, thankYouMessage)

    // Notify admin about completed survey
    const ADMIN_ID = 703427310
    const userDisplay = username ? `@${username}` : `ID: ${chatId}`
    
    const answersFormatted = newAnswers
      .map((answer) => {
        const question = survey.questions.find((q) => q.id === answer.questionId)
        const questionText = question?.text || answer.questionId
        return `  - ${questionText}: ${answer.value}`
      })
      .join('\n')

    const adminReport = 
      `📥 <b>Новый ответ в опросе!</b>\n\n` +
      `👤 <b>Пользователь:</b> ${userDisplay}\n` +
      `📋 <b>Опрос:</b> ${survey.title}\n\n` +
      `📝 <b>Ответы:</b>\n${answersFormatted}`

    try {
      await sendMessage(ADMIN_ID, adminReport)
    } catch (error) {
      console.error('[v0] Failed to notify admin:', error)
    }
  } else {
    updateSession(chatId, {
      answers: newAnswers,
      currentQuestionIndex: nextIndex,
    })

    const nextQuestion = survey.questions[nextIndex]
    const { text, markup } = formatQuestion(nextQuestion, nextIndex, survey.questions.length)
    await sendMessage(chatId, text, markup)
  }
}

async function handleTextAnswer(chatId: number, text: string, username?: string): Promise<void> {
  const session = getSession(chatId)
  const survey = session.currentSurveyId ? getActiveSurvey() : undefined

  if (!survey || !session.isInSurvey) {
    // Not in survey, use AI to respond
    const response = await generateAIResponse(
      `Пользователь написал: "${text}". Ответь ему и предложи начать опрос командой /start`
    )
    await sendMessage(chatId, response)
    return
  }

  const currentQuestion = survey.questions[session.currentQuestionIndex]
  
  if (currentQuestion.type === 'text') {
    await handleAnswer(chatId, currentQuestion.id, text, username)
  } else {
    await sendMessage(
      chatId,
      'Пожалуйста, выберите один из предложенных вариантов ответа.'
    )
  }
}

export async function handleTelegramUpdate(update: TelegramUpdate): Promise<void> {
  // Handle callback queries (button clicks)
  if (update.callback_query) {
    const { id, from, message, data } = update.callback_query
    const chatId = message.chat.id

    await answerCallbackQuery(id)

    if (data === 'start_survey') {
      const session = getSession(chatId)
      const survey = getActiveSurvey()

      if (survey) {
        const firstQuestion = survey.questions[0]
        const { text, markup } = formatQuestion(firstQuestion, 0, survey.questions.length)
        await sendMessage(chatId, text, markup)
      }
    } else if (data === 'cancel') {
      resetSession(chatId)
      await sendMessage(chatId, 'Опрос отменён. Введите /start чтобы начать заново.')
    } else if (data.startsWith('answer:')) {
      const [, questionId, value] = data.split(':')
      await handleAnswer(chatId, questionId, value, from.username)
    }

    return
  }

  // Handle text messages
  if (update.message?.text) {
    const { chat, from, text } = update.message
    const chatId = chat.id

    if (text === '/start') {
      await handleStartCommand(chatId, from.username)
    } else if (text === '/help') {
      const helpText = await generateAIResponse(
        'Объясни пользователю как пользоваться ботом для опросов. Упомяни команды /start и /help. Ответь кратко.'
      )
      await sendMessage(chatId, helpText)
    } else if (text === '/cancel') {
      resetSession(chatId)
      await sendMessage(chatId, 'Опрос отменён. Введите /start чтобы начать новый опрос.')
    } else {
      await handleTextAnswer(chatId, text, from.username)
    }
  }
}
