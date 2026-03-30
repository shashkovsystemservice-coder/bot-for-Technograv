'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, Link, Unlink } from 'lucide-react'

interface WebhookInfo {
  url: string
  pending_update_count: number
}

export function WebhookSetup() {
  const [webhookUrl, setWebhookUrl] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [currentWebhook, setCurrentWebhook] = useState<WebhookInfo | null>(null)

  const checkWebhook = async () => {
    try {
      const res = await fetch('/api/telegram/setup')
      const data = await res.json()
      if (data.ok && data.result?.url) {
        setCurrentWebhook(data.result)
      } else {
        setCurrentWebhook(null)
      }
    } catch {
      setCurrentWebhook(null)
    }
  }

  const setWebhook = async () => {
    if (!webhookUrl) {
      setMessage('Please enter a webhook URL')
      setStatus('error')
      return
    }

    setStatus('loading')
    try {
      const res = await fetch('/api/telegram/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set', webhookUrl }),
      })
      const data = await res.json()

      if (data.ok) {
        setStatus('success')
        setMessage('Webhook successfully configured!')
        await checkWebhook()
      } else {
        setStatus('error')
        setMessage(data.description || 'Failed to set webhook')
      }
    } catch {
      setStatus('error')
      setMessage('Connection error')
    }
  }

  const deleteWebhook = async () => {
    setStatus('loading')
    try {
      const res = await fetch('/api/telegram/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete' }),
      })
      const data = await res.json()

      if (data.ok) {
        setStatus('success')
        setMessage('Webhook removed')
        setCurrentWebhook(null)
      } else {
        setStatus('error')
        setMessage('Failed to remove webhook')
      }
    } catch {
      setStatus('error')
      setMessage('Connection error')
    }
  }

  // Check webhook status on mount
  useState(() => {
    checkWebhook()
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link className="h-5 w-5" />
          Webhook Configuration
        </CardTitle>
        <CardDescription>
          Connect your Telegram bot to receive messages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {currentWebhook?.url && (
          <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="text-sm">
              Connected: <code className="rounded bg-background px-1">{currentWebhook.url}</code>
            </span>
            <Badge variant="secondary" className="ml-auto">
              {currentWebhook.pending_update_count} pending
            </Badge>
          </div>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="https://your-domain.vercel.app/api/telegram/webhook"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
          />
          <Button onClick={setWebhook} disabled={status === 'loading'}>
            <Link className="mr-2 h-4 w-4" />
            Set
          </Button>
          {currentWebhook?.url && (
            <Button variant="destructive" onClick={deleteWebhook} disabled={status === 'loading'}>
              <Unlink className="mr-2 h-4 w-4" />
              Remove
            </Button>
          )}
        </div>

        {message && (
          <div
            className={`flex items-center gap-2 text-sm ${
              status === 'success' ? 'text-green-600' : 'text-destructive'
            }`}
          >
            {status === 'success' ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            {message}
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          After deploying, set the webhook URL to: <code>https://your-domain.vercel.app/api/telegram/webhook</code>
        </p>
      </CardContent>
    </Card>
  )
}
