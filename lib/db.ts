import { neon } from '@neondatabase/serverless';
import type { SurveyResponse } from './types';

// Эта строка берет ссылку из настроек Vercel
const sql = neon(process.env.POSTGRES_URL!);

export async function saveResponseToDb(response: SurveyResponse) {
  try {
    // Преобразуем массив ответов в JSON-строку для корректной записи в JSONB
    const answersJson = JSON.stringify(response.answers);

    await sql`
      INSERT INTO responses (id, survey_id, user_id, user_name, answers, created_at)
      VALUES (
        ${response.id}, 
        ${response.surveyId}, 
        ${response.userId}, 
        ${response.userName}, 
        ${answersJson}, 
        ${response.createdAt.toISOString()}
      )
      ON CONFLICT (id) DO NOTHING;
    `;
    
    console.log('✅ Данные успешно записаны в Supabase');
  } catch (error) {
    console.error('❌ Ошибка выполнения SQL-запроса:', error);
    throw error; // Пробрасываем ошибку выше для логов
  }
}

// Функция для админки (чтобы данные подтягивались из базы)
export async function getAllResponsesFromDb() {
  try {
    const result = await sql`SELECT * FROM responses ORDER BY created_at DESC`;
    return result;
  } catch (error) {
    console.error('❌ Ошибка получения данных:', error);
    return [];
  }
}