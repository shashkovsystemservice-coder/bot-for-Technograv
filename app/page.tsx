'use client'

import { useState, useEffect } from 'react'
import useSWR, { mutate } from 'swr'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WebhookSetup } from '@/components/webhook-setup'
import { SurveyList } from '@/components/survey-list'
import { SurveyEditor } from '@/components/survey-editor'
import { ResponsesViewer } from '@/components/responses-viewer'
import { Bot, Plus, ClipboardList, BarChart3, Settings } from 'lucide-react'
import type { Survey, SurveyResponse } from '@/lib/types'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function AdminDashboard() {
  const { data: surveys = [], isLoading } = useSWR<Survey[]>('/api/surveys', fetcher)
  const { data: allResponses = [] } = useSWR<SurveyResponse[]>('/api/responses', fetcher)

  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [viewingResponsesFor, setViewingResponsesFor] = useState<string | null>(null)

  const handleSaveSurvey = async (surveyData: Partial<Survey>) => {
    if (surveyData.id) {
      await fetch('/api/surveys', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(surveyData),
      })
    } else {
      await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(surveyData),
      })
    }
    mutate('/api/surveys')
    setEditingSurvey(null)
    setIsCreating(false)
  }

  const handleDeleteSurvey = async (id: string) => {
    await fetch(`/api/surveys?id=${id}`, { method: 'DELETE' })
    mutate('/api/surveys')
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await fetch('/api/surveys', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, isActive }),
    })
    mutate('/api/surveys')
  }

  const viewingSurvey = viewingResponsesFor
    ? surveys.find((s) => s.id === viewingResponsesFor)
    : null
  const viewingResponses = viewingResponsesFor
    ? allResponses.filter((r) => r.surveyId === viewingResponsesFor)
    : []

  const activeSurveys = surveys.filter((s) => s.isActive).length
  const totalResponses = allResponses.length

  if (editingSurvey || isCreating) {
    return (
      <main className="min-h-screen bg-muted/30">
        <div className="container mx-auto max-w-4xl px-4 py-8">
          <SurveyEditor
            survey={editingSurvey || undefined}
            onSave={handleSaveSurvey}
            onCancel={() => {
              setEditingSurvey(null)
              setIsCreating(false)
            }}
          />
        </div>
      </main>
    )
  }

  if (viewingSurvey) {
    return (
      <main className="min-h-screen bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <ResponsesViewer
            survey={viewingSurvey}
            responses={viewingResponses}
            onBack={() => setViewingResponsesFor(null)}
          />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Bot className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">WanderBot</h1>
                <p className="text-sm text-muted-foreground">Telegram Survey Bot with AI</p>
              </div>
            </div>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Survey
            </Button>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Surveys</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{surveys.length}</div>
              <p className="text-xs text-muted-foreground">{activeSurveys} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalResponses}</div>
              <p className="text-xs text-muted-foreground">From all surveys</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">AI Model</CardTitle>
              <Bot className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Gemini</div>
              <p className="text-xs text-muted-foreground">google/gemini-2.0-flash</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="surveys" className="space-y-4">
          <TabsList>
            <TabsTrigger value="surveys" className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Surveys
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="surveys" className="space-y-4">
            {isLoading ? (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Loading surveys...
                </CardContent>
              </Card>
            ) : (
              <SurveyList
                surveys={surveys}
                onEdit={setEditingSurvey}
                onDelete={handleDeleteSurvey}
                onToggleActive={handleToggleActive}
                onViewResponses={setViewingResponsesFor}
              />
            )}
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <WebhookSetup />

            <Card>
              <CardHeader>
                <CardTitle>Bot Commands</CardTitle>
                <CardDescription>Available commands for your Telegram bot</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <code className="font-mono text-sm">/start</code>
                      <p className="text-sm text-muted-foreground">Start a new survey</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <code className="font-mono text-sm">/help</code>
                      <p className="text-sm text-muted-foreground">Get help information</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <code className="font-mono text-sm">/cancel</code>
                      <p className="text-sm text-muted-foreground">Cancel current survey</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Start Guide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="list-decimal list-inside space-y-2 text-sm">
                  <li>Deploy this project to Vercel</li>
                  <li>Set the webhook URL in the settings above</li>
                  <li>Create a survey and mark it as active</li>
                  <li>Users can start the bot with /start command</li>
                  <li>The AI will guide users through the survey</li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
