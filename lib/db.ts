import { neon } from '@neondatabase/serverless';

// Берем URL из настроек Vercel
const sql = neon(process.env.POSTGRES_URL!);

export async function saveResponseToDb(response: any) {
  try {
    // 1. Создаем таблицу (если это первый запуск)
    await sql`
      CREATE TABLE IF NOT EXISTS responses (
        id TEXT PRIMARY KEY,
        survey_id TEXT,
        user_id TEXT,
        user_name TEXT,
        answers JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 2. Записываем данные
    await sql`
      INSERT INTO responses (id, survey_id, user_id, user_name, answers, created_at)
      VALUES (
        ${response.id}, 
        ${response.surveyId}, 
        ${response.userId}, 
        ${response.userName}, 
        ${JSON.stringify(response.answers)}, 
        ${new Date().toISOString()}
      )
    `;
    console.log('✅ Ответ Technograv сохранен в Supabase');
  } catch (error) {
    console.error('❌ Ошибка сохранения в БД:', error);
  }
}

export async function getAllResponsesFromDb() {
  try {
    return await sql`SELECT * FROM responses ORDER BY created_at DESC`;
  } catch (e) {
    return [];
  }
}