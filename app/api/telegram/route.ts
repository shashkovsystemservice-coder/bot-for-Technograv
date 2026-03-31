import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const GOOGLE_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

const genAI = new GoogleGenerativeAI(GOOGLE_API_KEY || '')

interface TelegramMessage {
  message_id: number
  from: {
    id: number
    first_name: string
    username?: string
  }
  chat: {
    id: number
    type: string
  }
  text?: string
}

interface TelegramUpdate {
  update_id: number
  message?: TelegramMessage
}

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

async function generateGeminiResponse(userMessage: string, username?: string): Promise<string> {
  try {
    if (!GOOGLE_API_KEY) {
      console.error('[v0] GOOGLE_GENERATIVE_AI_API_KEY is not set')
      return 'Извините, сервис временно недоступен.'
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    
    const systemPrompt = `Ты дружелюбный бот для проведения опросов WanderBot. 
Твоя задача - помогать пользователям и отвечать на их вопросы.
Отвечай кратко, по-русски, дружелюбно и информативно.
Если пользователь хочет пройти опрос, предложи ему начать с команды /start.`

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: `${systemPrompt}\n\nПользователь ${username || 'Гость'} написал: "${userMessage}"` }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 256,
        temperature: 0.7,
      },
    })

    const response = result.response
    return response.text() || 'Извините, произошла ошибка при обработке запроса.'
  } catch (error) {
    console.error('[v0] Gemini API error:', error)
    return 'Извините, произошла ошибка при обработке запроса. Попробуйте ещё раз позже.'
  }
}

async function handleStartCommand(chatId: number, username?: string): Promise<void> {
  try {
    if (!GOOGLE_API_KEY) {
      await sendTelegramMessage(
        chatId,
        `Привет${username ? `, ${username}` : ''}! Я WanderBot - бот для опросов.\n\nИспользуйте /help для получения справки.`
      )
      return
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    
    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ 
            text: `Ты дружелюбный бот для опросов WanderBot. Поприветствуй пользователя ${username || 'Гость'} и расскажи, что ты бот для проведения опросов. 
Объясни, что ты можешь помочь с различными вопросами и провести опросы. 
Упомяни доступные команды: /help для помощи. 
Ответь кратко в 2-3 предложения.` 
          }],
        },
      ],
      generationConfig: {
        maxOutputTokens: 256,
        temperature: 0.7,
      },
    })

    const text = result.response.text()
    await sendTelegramMessage(chatId, text || `Привет${username ? `, ${username}` : ''}! Я WanderBot.`)
  } catch (error) {
    console.error('[v0] Start command error:', error)
    await sendTelegramMessage(
      chatId,
      `Привет${username ? `, ${username}` : ''}! Я WanderBot - бот для опросов.\n\nИспользуйте /help для получения справки.`
    )
  }
}

async function handleHelpCommand(chatId: number): Promise<void> {
  const helpMessage = `<b>Справка по WanderBot</b>

Доступные команды:
/start - Начать работу с ботом
/help - Показать эту справку

Я использую искусственный интеллект Gemini для общения. Вы можете задать мне любой вопрос!`

  await sendTelegramMessage(chatId, helpMessage)
}

export async function POST(request: Request) {
  try {
    if (!TELEGRAM_BOT_TOKEN) {
      console.error('[v0] TELEGRAM_BOT_TOKEN is not set')
      return NextResponse.json({ ok: false, error: 'Bot token not configured' }, { status: 500 })
    }

    const update: TelegramUpdate = await request.json()

    if (!update.message?.text) {
      return NextResponse.json({ ok: true })
    }

    const { chat, from, text } = update.message
    const chatId = chat.id
    const username = from.username || from.first_name

    // Handle commands
    if (text === '/start') {
      await handleStartCommand(chatId, username)
    } else if (text === '/help') {
      await handleHelpCommand(chatId)
    } else {
      // Generate AI response for any other message
      const response = await generateGeminiResponse(text, username)
      await sendTelegramMessage(chatId, response)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[v0] Telegram webhook error:', error)
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'active',
    bot: 'WanderBot',
    description: 'Telegram Survey Bot powered by Gemini AI',
  })
}
