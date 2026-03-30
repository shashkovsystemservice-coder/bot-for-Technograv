'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreVertical, Edit, Trash2, ClipboardList } from 'lucide-react'
import type { Survey } from '@/lib/types'

interface SurveyListProps {
  surveys: Survey[]
  onEdit: (survey: Survey) => void
  onDelete: (id: string) => void
  onToggleActive: (id: string, isActive: boolean) => void
  onViewResponses: (surveyId: string) => void
}

export function SurveyList({
  surveys,
  onEdit,
  onDelete,
  onToggleActive,
  onViewResponses,
}: SurveyListProps) {
  if (surveys.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No surveys yet</p>
          <p className="text-sm text-muted-foreground">Create your first survey to get started</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {surveys.map((survey) => (
        <Card key={survey.id}>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  {survey.title}
                  {survey.isActive && (
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  )}
                </CardTitle>
                <CardDescription>{survey.description}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Active</span>
                  <Switch
                    checked={survey.isActive}
                    onCheckedChange={(checked) => onToggleActive(survey.id, checked)}
                  />
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(survey)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onViewResponses(survey.id)}>
                      <ClipboardList className="mr-2 h-4 w-4" />
                      View Responses
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => onDelete(survey.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{survey.questions.length} questions</span>
              <span>Created {new Date(survey.createdAt).toLocaleDateString()}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
