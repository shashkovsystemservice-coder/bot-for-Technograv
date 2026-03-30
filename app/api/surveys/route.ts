import { NextResponse } from 'next/server'
import { getSurveys, createSurvey, deleteSurvey, updateSurvey } from '@/lib/store'
import type { Survey } from '@/lib/types'

export async function GET() {
  const surveys = getSurveys()
  return NextResponse.json(surveys)
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const survey: Survey = {
      id: `survey-${Date.now()}`,
      title: data.title,
      description: data.description,
      questions: data.questions || [],
      isActive: data.isActive ?? false,
      createdAt: new Date(),
    }

    createSurvey(survey)
    return NextResponse.json(survey)
  } catch (error) {
    console.error('Create survey error:', error)
    return NextResponse.json({ error: 'Failed to create survey' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const data = await request.json()
    const { id, ...updates } = data
    
    if (!id) {
      return NextResponse.json({ error: 'Survey ID required' }, { status: 400 })
    }

    updateSurvey(id, updates)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Update survey error:', error)
    return NextResponse.json({ error: 'Failed to update survey' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Survey ID required' }, { status: 400 })
    }

    deleteSurvey(id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Delete survey error:', error)
    return NextResponse.json({ error: 'Failed to delete survey' }, { status: 500 })
  }
}
