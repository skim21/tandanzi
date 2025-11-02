import { useState, useEffect } from 'react'
import SearchBar from './components/SearchBar'
import NutritionInfo from './components/NutritionInfo'
import MealHistory from './components/MealHistory'
import AIRecommendation from './components/AIRecommendation'
import MedicalAssessmentCard from './components/MedicalAssessment'
import { searchFood, NutritionData } from './services/nutritionApi'
import {
  saveMealRecord,
  getYesterdayMeals,
  getTodayMeals,
  clearMealHistory,
  MealRecord,
} from './services/mealHistory'
import { evaluateMeal, MealRecommendation } from './services/aiEvaluator'
import { getMedicalAssessment, MedicalAssessment } from './services/medicalEvaluator'
import { Heart, Activity, TrendingUp, History, Save, X } from 'lucide-react'

function App() {
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recommendation, setRecommendation] = useState<MealRecommendation | null>(null)
  const [medicalAssessment, setMedicalAssessment] = useState<MedicalAssessment | null>(null)
  const [yesterdayMeals, setYesterdayMeals] = useState<MealRecord[]>([])
  const [todayMeals, setTodayMeals] = useState<MealRecord[]>([])
  const [showHistory, setShowHistory] = useState(false)

  useEffect(() => {
    loadMealHistory()
  }, [])

  const loadMealHistory = () => {
    setYesterdayMeals(getYesterdayMeals())
    setTodayMeals(getTodayMeals())
  }

  const handleSearch = async (foodName: string) => {
    if (!foodName.trim()) return

    setLoading(true)
    setError(null)
    setNutritionData(null)
    setRecommendation(null)
    setMedicalAssessment(null)

    try {
      const data = await searchFood(foodName)
      setNutritionData(data)

      // AI 평가 수행
      const aiRecommendation = evaluateMeal(data, yesterdayMeals, todayMeals)
      setRecommendation(aiRecommendation)

      // 의학적 종합 평가 수행
      const now = new Date()
      const medical = getMedicalAssessment(data, yesterdayMeals, todayMeals, now.getHours())
      setMedicalAssessment(medical)
    } catch (err) {
      setError(err instanceof Error ? err.message : '음식 정보를 가져오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveMeal = () => {
    if (!nutritionData) return

    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    const record: MealRecord = {
      foodName: nutritionData.foodName,
      date: dateStr,
      time: timeStr,
      nutrition: {
        calories: nutritionData.calories,
        protein: nutritionData.protein,
        fat: nutritionData.fat,
        carbs: nutritionData.carbs,
        fiber: nutritionData.fiber,
        sugar: nutritionData.sugar,
      },
    }

    saveMealRecord(record)
    loadMealHistory()

      // 저장 후 AI 평가 다시 수행
      if (nutritionData) {
        const updatedTodayMeals = getTodayMeals()
        const aiRecommendation = evaluateMeal(nutritionData, yesterdayMeals, updatedTodayMeals)
        setRecommendation(aiRecommendation)
        const now = new Date()
        const medical = getMedicalAssessment(nutritionData, yesterdayMeals, updatedTodayMeals, now.getHours())
        setMedicalAssessment(medical)
      }
  }

  const handleDeleteMeal = (index: number, isToday: boolean) => {
    const meals = isToday ? todayMeals : yesterdayMeals
    const meal = meals[index]
    if (!meal) return

    // 로컬 스토리지에서 삭제
    const allRecords = [...getYesterdayMeals(), ...getTodayMeals()]
    allRecords.splice(
      allRecords.findIndex(
        (r) => r.date === meal.date && r.time === meal.time && r.foodName === meal.foodName
      ),
      1
    )

    clearMealHistory()
    allRecords.forEach(saveMealRecord)

    loadMealHistory()

    // 삭제 후 AI 평가 다시 수행
    if (nutritionData) {
      const updatedTodayMeals = getTodayMeals()
      const aiRecommendation = evaluateMeal(nutritionData, yesterdayMeals, updatedTodayMeals)
      setRecommendation(aiRecommendation)
      const now = new Date()
      const medical = getMedicalAssessment(nutritionData, yesterdayMeals, updatedTodayMeals, now.getHours())
      setMedicalAssessment(medical)
    }
  }

  const getHealthScore = (calories: number): { score: number; message: string; color: string } => {
    if (calories < 200) {
      return { score: 90, message: '매우 좋음! 저칼로리 식품입니다.', color: 'text-green-600' }
    } else if (calories < 400) {
      return { score: 75, message: '좋음! 적당한 칼로리입니다.', color: 'text-green-500' }
    } else if (calories < 600) {
      return { score: 60, message: '보통. 적당히 드시면 됩니다.', color: 'text-yellow-500' }
    } else if (calories < 800) {
      return { score: 45, message: '주의. 칼로리가 다소 높습니다.', color: 'text-orange-500' }
    } else {
      return { score: 30, message: '경고. 고칼로리 식품입니다.', color: 'text-red-500' }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-2xl shadow-lg">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              탄단지
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            음식의 열량과 영양 정보를 쉽게 확인하세요
          </p>
        </header>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-8">
          <SearchBar onSearch={handleSearch} loading={loading} />
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          </div>
        )}

        {/* Nutrition Info */}
        {nutritionData && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-800">
                    {nutritionData.foodName}
                  </h2>
                  {nutritionData.isEstimated && (
                    <p className="text-sm text-gray-500 mt-1">
                      ℹ️ 카테고리 기반 추정치입니다 (정확한 영양소 정보는 음식명을 더 구체적으로 입력해주세요)
                    </p>
                  )}
                </div>
                <button
                  onClick={handleSaveMeal}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>식사 기록</span>
                </button>
              </div>

              {/* Calories & Health Score */}
              <div className="grid md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-700">칼로리</h3>
                  </div>
                  <div className="text-4xl font-bold text-blue-600 mb-1">
                    {nutritionData.calories}
                  </div>
                  <div className="text-sm text-gray-600">kcal (100g 기준)</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Heart className="w-6 h-6 text-purple-600" />
                    <h3 className="text-lg font-semibold text-gray-700">건강 점수</h3>
                  </div>
                  {(() => {
                    const health = getHealthScore(nutritionData.calories)
                    return (
                      <>
                        <div className={`text-4xl font-bold ${health.color} mb-1`}>
                          {health.score}
                        </div>
                        <div className="text-sm text-gray-600">{health.message}</div>
                      </>
                    )
                  })()}
                </div>
              </div>

              {/* Nutrition Details */}
              <NutritionInfo data={nutritionData} />
            </div>

            {/* AI Recommendation */}
            {recommendation && (
              <AIRecommendation recommendation={recommendation} />
            )}

            {/* Medical Assessment */}
            {medicalAssessment && (
              <MedicalAssessmentCard assessment={medicalAssessment} />
            )}
          </div>
        )}

        {/* Meal History Button */}
        <div className="max-w-4xl mx-auto mb-6">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <History className="w-4 h-4" />
            <span>식사 기록 보기</span>
          </button>
        </div>

        {/* Meal History Panel */}
        {showHistory && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-800">식사 기록</h2>
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-gray-700">오늘</h3>
                  <MealHistory
                    records={todayMeals}
                    onDelete={(index) => handleDeleteMeal(index, true)}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-3 text-gray-700">어제</h3>
                  <MealHistory
                    records={yesterdayMeals}
                    onDelete={(index) => handleDeleteMeal(index, false)}
                  />
                </div>
              </div>

              {todayMeals.length === 0 && yesterdayMeals.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>기록된 식사가 없습니다</p>
                  <p className="text-sm mt-2">음식을 검색하고 "식사 기록" 버튼을 눌러 기록하세요</p>
                </div>
              )}

              {todayMeals.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 font-medium">오늘 총 칼로리:</span>
                    <span className="text-xl font-bold text-blue-600">
                      {todayMeals.reduce((sum, meal) => sum + meal.nutrition.calories, 0)}kcal
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Info Section */}
        {!nutritionData && !loading && !showHistory && (
          <div className="max-w-2xl mx-auto text-center text-gray-500 mt-12">
            <p>위 검색창에 음식 이름을 입력하고 검색해보세요!</p>
            <p className="text-sm mt-2">예: 사과, 치킨, 김밥, 된장찌개, 피자, 떡볶이</p>
            <p className="text-xs mt-4 text-gray-400">
              💡 AI가 현재 시간과 어제 식사 기록을 분석해 먹기 적절한지 평가해드립니다
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default App

