import { NextResponse } from 'next/server'
import { getResponses, getAllResponses } from '@/lib/store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const surveyId = searchParams.get('surveyId')

  if (surveyId) {
    const responses = await getResponses(surveyId)
    return NextResponse.json(responses)
  }

  const allResponses = await getAllResponses()
  return NextResponse.json(allResponses)
}
