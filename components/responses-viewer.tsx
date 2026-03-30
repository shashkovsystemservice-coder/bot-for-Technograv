'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Download, User } from 'lucide-react'
import type { Survey, SurveyResponse } from '@/lib/types'

interface ResponsesViewerProps {
  survey: Survey
  responses: SurveyResponse[]
  onBack: () => void
}

export function ResponsesViewer({ survey, responses, onBack }: ResponsesViewerProps) {
  const getAnswerValue = (response: SurveyResponse, questionId: string): string => {
    const answer = response.answers.find((a) => a.questionId === questionId)
    return answer?.value || '-'
  }

  const exportToCSV = () => {
    const headers = ['Username', 'Date', ...survey.questions.map((q) => q.text)]
    const rows = responses.map((r) => [
      r.username || 'Anonymous',
      new Date(r.completedAt).toLocaleString(),
      ...survey.questions.map((q) => getAnswerValue(r, q.id)),
    ])

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${survey.title}-responses.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <CardTitle>{survey.title}</CardTitle>
              <CardDescription>{responses.length} responses</CardDescription>
            </div>
          </div>
          <Button variant="outline" onClick={exportToCSV} disabled={responses.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {responses.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No responses yet</p>
            <p className="text-sm">Responses will appear here when users complete the survey</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Date</TableHead>
                  {survey.questions.map((question) => (
                    <TableHead key={question.id}>{question.text}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {responses.map((response) => (
                  <TableRow key={response.id}>
                    <TableCell>
                      <Badge variant="secondary">{response.username || 'Anonymous'}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {new Date(response.completedAt).toLocaleDateString()}
                    </TableCell>
                    {survey.questions.map((question) => (
                      <TableCell key={question.id}>
                        {question.type === 'rating' ? (
                          <Badge variant="outline">{getAnswerValue(response, question.id)}/5</Badge>
                        ) : (
                          getAnswerValue(response, question.id)
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
