import { NextResponse } from 'next/server'
import { setWebhook, deleteWebhook, getWebhookInfo, setMyCommands } from '@/lib/telegram'

export async function POST(request: Request) {
  try {
    const { action, webhookUrl } = await request.json()

    if (action === 'set' && webhookUrl) {
      const result = await setWebhook(webhookUrl)
      // Also set bot commands for persistent menu
      await setMyCommands()
      return NextResponse.json(result)
    }

    if (action === 'setCommands') {
      const result = await setMyCommands()
      return NextResponse.json(result)
    }

    if (action === 'delete') {
      const result = await deleteWebhook()
      return NextResponse.json(result)
    }

    if (action === 'info') {
      const result = await getWebhookInfo()
      return NextResponse.json(result)
    }

    return NextResponse.json({ ok: false, error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Setup error:', error)
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const result = await getWebhookInfo()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Get webhook info error:', error)
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}
