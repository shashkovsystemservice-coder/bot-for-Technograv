import { NextResponse } from 'next/server'
import { handleTelegramUpdate } from '@/lib/bot-handler'
import type { TelegramUpdate } from '@/lib/telegram'

export async function POST(request: Request) {
  try {
    const update: TelegramUpdate = await request.json()
    await handleTelegramUpdate(update)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Webhook endpoint active' })
}
