export interface MealRecord {
  foodName: string
  date: string // YYYY-MM-DD 형식
  time: string // HH:MM 형식
  nutrition: {
    calories: number
    protein: number
    fat: number
    carbs: number
    fiber: number
    sugar: number
  }
}

const STORAGE_KEY = 'tandanzi_meal_history'

export function saveMealRecord(record: MealRecord): void {
  const records = getMealRecords()
  records.push(record)
  // 최근 30일 기록만 저장
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  
  const filteredRecords = records.filter((r) => {
    const recordDate = new Date(r.date)
    return recordDate >= thirtyDaysAgo
  })
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredRecords))
}

export function getMealRecords(): MealRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

export function getMealsByDate(date: string): MealRecord[] {
  const records = getMealRecords()
  return records.filter((r) => r.date === date)
}

export function getYesterdayMeals(): MealRecord[] {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const dateStr = yesterday.toISOString().split('T')[0]
  return getMealsByDate(dateStr)
}

export function getTodayMeals(): MealRecord[] {
  const today = new Date()
  const dateStr = today.toISOString().split('T')[0]
  return getMealsByDate(dateStr)
}

export function clearMealHistory(): void {
  localStorage.removeItem(STORAGE_KEY)
}

