'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import type { Question, Survey } from '@/lib/types'

interface SurveyEditorProps {
  survey?: Survey
  onSave: (survey: Partial<Survey>) => void
  onCancel: () => void
}

export function SurveyEditor({ survey, onSave, onCancel }: SurveyEditorProps) {
  const [title, setTitle] = useState(survey?.title || '')
  const [description, setDescription] = useState(survey?.description || '')
  const [questions, setQuestions] = useState<Question[]>(survey?.questions || [])

  const addQuestion = () => {
    const newQuestion: Question = {
      id: `q-${Date.now()}`,
      text: '',
      type: 'text',
    }
    setQuestions([...questions, newQuestion])
  }

  const updateQuestion = (index: number, updates: Partial<Question>) => {
    const updated = [...questions]
    updated[index] = { ...updated[index], ...updates }
    
    // Add default options for choice/rating types
    if (updates.type === 'choice' && !updated[index].options) {
      updated[index].options = ['Option 1', 'Option 2']
    }
    if (updates.type === 'rating' && !updated[index].options) {
      updated[index].options = ['1', '2', '3', '4', '5']
    }
    if (updates.type === 'text') {
      delete updated[index].options
    }
    
    setQuestions(updated)
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const updated = [...questions]
    if (updated[qIndex].options) {
      updated[qIndex].options![oIndex] = value
      setQuestions(updated)
    }
  }

  const addOption = (qIndex: number) => {
    const updated = [...questions]
    if (updated[qIndex].options) {
      updated[qIndex].options!.push(`Option ${updated[qIndex].options!.length + 1}`)
      setQuestions(updated)
    }
  }

  const removeOption = (qIndex: number, oIndex: number) => {
    const updated = [...questions]
    if (updated[qIndex].options && updated[qIndex].options!.length > 2) {
      updated[qIndex].options!.splice(oIndex, 1)
      setQuestions(updated)
    }
  }

  const handleSave = () => {
    if (!title.trim()) return
    
    onSave({
      id: survey?.id,
      title,
      description,
      questions,
      isActive: survey?.isActive ?? false,
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{survey ? 'Edit Survey' : 'Create New Survey'}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Survey title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of the survey"
            rows={3}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Questions</Label>
            <Button variant="outline" size="sm" onClick={addQuestion}>
              <Plus className="mr-2 h-4 w-4" />
              Add Question
            </Button>
          </div>

          {questions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              No questions yet. Click &quot;Add Question&quot; to get started.
            </div>
          ) : (
            <div className="space-y-4">
              {questions.map((question, qIndex) => (
                <Card key={question.id} className="relative">
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      <div className="flex items-start pt-2 text-muted-foreground">
                        <GripVertical className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-4">
                        <div className="flex gap-4">
                          <div className="flex-1">
                            <Input
                              value={question.text}
                              onChange={(e) => updateQuestion(qIndex, { text: e.target.value })}
                              placeholder="Question text"
                            />
                          </div>
                          <Select
                            value={question.type}
                            onValueChange={(type: Question['type']) => updateQuestion(qIndex, { type })}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="text">Text</SelectItem>
                              <SelectItem value="choice">Choice</SelectItem>
                              <SelectItem value="rating">Rating</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeQuestion(qIndex)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>

                        {question.type === 'choice' && question.options && (
                          <div className="space-y-2 pl-4">
                            <Label className="text-xs text-muted-foreground">Options</Label>
                            {question.options.map((option, oIndex) => (
                              <div key={oIndex} className="flex gap-2">
                                <Input
                                  value={option}
                                  onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                  placeholder={`Option ${oIndex + 1}`}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => removeOption(qIndex, oIndex)}
                                  disabled={question.options!.length <= 2}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => addOption(qIndex)}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add Option
                            </Button>
                          </div>
                        )}

                        {question.type === 'rating' && (
                          <p className="text-xs text-muted-foreground pl-4">
                            Users will rate from 1 to 5
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!title.trim()}>
            {survey ? 'Save Changes' : 'Create Survey'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
