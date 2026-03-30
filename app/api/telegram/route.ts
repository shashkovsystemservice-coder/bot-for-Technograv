import { NextResponse } from 'next/server'
import { generateText } from 'ai'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`

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
    const { text } = await generateText({
      model: 'google/gemini-2.0-flash',
      system: `Ты дружелюбный бот для проведения опросов WanderBot. 
Твоя задача - помогать пользователям и отвечать на их вопросы.
Отвечай кратко, по-русски, дружелюбно и информативно.
Если пользователь хочет пройти опрос, предложи ему начать с команды /start.`,
      prompt: `Пользователь ${username || 'Гость'} написал: "${userMessage}"`,
    })
    return text
  } catch (error) {
    console.error('[v0] Gemini API error:', error)
    return 'Извините, произошла ошибка при обработке запроса. Попробуйте ещё раз позже.'
  }
}

async function handleStartCommand(chatId: number, username?: string): Promise<void> {
  try {
    const { text } = await generateText({
      model: 'google/gemini-2.0-flash',
      system: `Ты дружелюбный бот для опросов WanderBot. Поприветствуй пользователя.`,
      prompt: `Поприветствуй пользователя ${username || 'Гость'} и расскажи, что ты бот для проведения опросов. 
Объясни, что ты можешь помочь с различными вопросами и провести опросы. 
Упомяни доступные команды: /help для помощи. 
Ответь кратко в 2-3 предложения.`,
    })
    await sendTelegramMessage(chatId, text)
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
