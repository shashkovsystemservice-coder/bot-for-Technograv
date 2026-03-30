const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`

export interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from: {
      id: number
      is_bot: boolean
      first_name: string
      username?: string
    }
    chat: {
      id: number
      type: string
    }
    date: number
    text?: string
  }
  callback_query?: {
    id: string
    from: {
      id: number
      username?: string
    }
    message: {
      chat: {
        id: number
      }
    }
    data: string
  }
}

export interface InlineKeyboardButton {
  text: string
  callback_data: string
}

export interface ReplyMarkup {
  inline_keyboard: InlineKeyboardButton[][]
}

export async function sendMessage(
  chatId: number,
  text: string,
  replyMarkup?: ReplyMarkup
): Promise<void> {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
  }

  if (replyMarkup) {
    body.reply_markup = replyMarkup
  }

  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export async function answerCallbackQuery(callbackQueryId: string): Promise<void> {
  await fetch(`${TELEGRAM_API}/answerCallbackQuery`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ callback_query_id: callbackQueryId }),
  })
}

export async function setWebhook(url: string): Promise<{ ok: boolean; description?: string }> {
  const response = await fetch(`${TELEGRAM_API}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  })
  return response.json()
}

export async function deleteWebhook(): Promise<{ ok: boolean }> {
  const response = await fetch(`${TELEGRAM_API}/deleteWebhook`, {
    method: 'POST',
  })
  return response.json()
}

export async function getWebhookInfo(): Promise<{
  ok: boolean
  result: { url: string; pending_update_count: number }
}> {
  const response = await fetch(`${TELEGRAM_API}/getWebhookInfo`)
  return response.json()
}
