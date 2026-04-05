import { seedDatabase } from '@/lib/seed.js'
import { apiSuccess, apiError } from '@/lib/utils.js'

export async function GET() {
  try {
    const result = await seedDatabase()
    return apiSuccess(result)
  } catch (err) {
    console.error(err)
    return apiError('Seed failed: ' + err.message, 500)
  }
}
