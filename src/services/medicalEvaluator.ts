import { NutritionData } from './nutritionApi'
import { MealRecord } from './mealHistory'

export interface MedicalAssessment {
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F'
  summary: string
  detailedAnalysis: string[]
  healthImpact: {
    shortTerm: string[]
    longTerm: string[]
  }
  recommendations: string[]
  riskFactors: string[]
}

// 의학적 기준에 따른 평가
const DAILY_PROTEIN_GOAL = 50 // g (성인 기준)
const DAILY_FIBER_GOAL = 25 // g (성인 기준)
const DAILY_SUGAR_LIMIT = 50 // g (WHO 권장 기준)

export function getMedicalAssessment(
  food: NutritionData,
  yesterdayMeals: MealRecord[],
  todayMeals: MealRecord[],
  currentHour: number
): MedicalAssessment {
  const yesterdayCalories = yesterdayMeals.reduce((sum, meal) => sum + meal.nutrition.calories, 0)
  const todayCalories = todayMeals.reduce((sum, meal) => sum + meal.nutrition.calories, 0)
  const projectedTotal = todayCalories + food.calories
  
  // 하루 누적 영양소 계산
  const todayProtein = todayMeals.reduce((sum, meal) => sum + meal.nutrition.protein, 0)
  const todayFiber = todayMeals.reduce((sum, meal) => sum + meal.nutrition.fiber, 0)
  const todaySugar = todayMeals.reduce((sum, meal) => sum + meal.nutrition.sugar, 0)
  
  const projectedProtein = todayProtein + food.protein
  const projectedFiber = todayFiber + food.fiber
  const projectedSugar = todaySugar + food.sugar
  
  const analysis: string[] = []
  const shortTerm: string[] = []
  const longTerm: string[] = []
  const recommendations: string[] = []
  const riskFactors: string[] = []
  
  let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F'  // 기본값: F (거의 다 안 좋음)
  let score = 30  // 시작 점수: 30점 (거의 다 안 좋음)
  
  // === 1. 칼로리 평가 ===
  const calorieExcess = projectedTotal - 2000
  if (calorieExcess > 200) {
    score -= 20
    grade = 'F'
    analysis.push(`❌ 하루 권장 칼로리(2000kcal)를 ${calorieExcess.toFixed(0)}kcal 초과합니다. 이는 체중 증가로 이어질 수 있습니다.`)
    shortTerm.push('소화불량, 위 불편감, 졸음, 혈당 급상승 가능')
    longTerm.push('비만, 제2형 당뇨병, 심혈관 질환 위험 증가')
    riskFactors.push('고칼로리 과다 섭취')
  } else if (calorieExcess > 100) {
    score -= 15
    grade = 'F'
    analysis.push(`❌ 하루 권장 칼로리를 ${calorieExcess.toFixed(0)}kcal 초과합니다.`)
    longTerm.push('장기적으로 체중 증가 위험')
    riskFactors.push('칼로리 과다 섭취')
  } else if (calorieExcess > 0) {
    score -= 10
    grade = 'D'
    analysis.push(`❌ 하루 권장 칼로리를 ${calorieExcess.toFixed(0)}kcal 초과합니다.`)
  } else if (projectedTotal > 1900) {
    score -= 5
    grade = 'D'
    analysis.push(`⚠️ 하루 권장 칼로리에 근접합니다.`)
  }
  
  // === 2. 시간대별 평가 ===
  const getTimeLimit = (hour: number) => {
    if (hour >= 6 && hour < 10) return { limit: 500, name: '아침' }
    if (hour >= 10 && hour < 14) return { limit: 700, name: '점심' }
    if (hour >= 14 && hour < 18) return { limit: 400, name: '오후 간식' }
    if (hour >= 18 && hour < 22) return { limit: 600, name: '저녁' }
    return { limit: 200, name: '야식' }
  }
  
  const timeLimit = getTimeLimit(currentHour)
  if (food.calories > timeLimit.limit * 1.2) {
    score -= 20
    grade = 'F'
    analysis.push(`❌ ${timeLimit.name} 시간대에는 ${timeLimit.limit}kcal 이내가 적절한데, ${food.calories}kcal는 과도합니다.`)
    shortTerm.push('소화 부담, 졸음, 집중력 저하')
    if (currentHour >= 22 || currentHour < 6) {
      longTerm.push('수면 장애, 생체리듬 교란')
      riskFactors.push('야식 습관')
    }
  } else if (food.calories > timeLimit.limit * 1.05) {
    score -= 15
    grade = grade === 'F' ? 'F' : 'D'
    analysis.push(`❌ ${timeLimit.name} 시간대에 ${food.calories}kcal는 다소 높습니다.`)
  } else if (food.calories > timeLimit.limit) {
    score -= 10
    grade = grade === 'F' ? 'F' : 'D'
    analysis.push(`⚠️ ${timeLimit.name} 시간대에 ${food.calories}kcal는 높습니다.`)
  }
  
  // === 3. 영양소 분석 ===
  
  // 지방 분석
  const fatPercentage = (food.fat * 9) / food.calories * 100
  const saturatedFatEstimate = food.fat * 0.4 // 추정 (일반적으로 총 지방의 40%)
  
  if (fatPercentage > 25) {
    score -= 20
    grade = 'F'
    analysis.push(`❌ 지방 함량이 매우 높습니다 (${food.fat}g, 칼로리의 ${fatPercentage.toFixed(0)}%). 포화지방 추정치: ${saturatedFatEstimate.toFixed(1)}g`)
    shortTerm.push('소화 지연, 무기력감, 트리글리세리드 급상승')
    longTerm.push('혈중 콜레스테롤 증가, 동맥경화, 심혈관 질환 위험 증가')
    riskFactors.push('고지방 식이')
    recommendations.push('❌ 이 음식은 섭취하지 마세요. 가공식품과 튀긴 음식은 건강에 매우 해롭습니다.')
  } else if (fatPercentage > 15) {
    score -= 15
    grade = 'F'
    analysis.push(`❌ 지방 함량이 높습니다 (${food.fat}g, 칼로리의 ${fatPercentage.toFixed(0)}%)`)
    longTerm.push('지속적 섭취 시 심혈관 건강 악화 가능')
    riskFactors.push('고지방 식이')
  } else if (fatPercentage > 10) {
    score -= 10
    grade = grade === 'F' ? 'F' : 'D'
    analysis.push(`⚠️ 지방 함량이 다소 높습니다 (${food.fat}g)`)
  } else if (food.fat > 3) {
    score -= 5
    grade = grade === 'F' ? 'F' : 'D'
  }
  
  // 포화지방 평가 (WHO 권장: 하루 총 칼로리의 10% 이하)
  const saturatedFatLimit = (2000 * 0.1) / 9 // 약 22g
  if (saturatedFatEstimate > saturatedFatLimit * 0.5 && food.calories > 300) {
    riskFactors.push('포화지방 과다')
    recommendations.push('포화지방 함량이 높으니 일주일에 1-2회로 제한하세요')
  }
  
  // 당분 분석
  const sugarPercentage = (food.sugar * 4) / food.calories * 100
  
  if (food.sugar > 10) {
    score -= 20
    grade = 'F'
    analysis.push(`❌ 당분 함량이 매우 높습니다 (${food.sugar}g). 이는 WHO 일일 권장량의 ${((food.sugar / DAILY_SUGAR_LIMIT) * 100).toFixed(0)}%에 해당합니다.`)
    shortTerm.push('혈당 급상승 → 급강하, 에너지 불안정, 식탐 증가')
    longTerm.push('인슐린 저항성, 제2형 당뇨병, 비만, 충치 위험 증가')
    riskFactors.push('과당 섭취')
    recommendations.push('❌ 이 음식은 섭취하지 마세요. 당분이 너무 많아 건강에 매우 해롭습니다.')
  } else if (food.sugar > 5) {
    score -= 15
    grade = 'F'
    analysis.push(`❌ 당분 함량이 높습니다 (${food.sugar}g, 칼로리의 ${sugarPercentage.toFixed(0)}%)`)
    shortTerm.push('혈당 변동성 증가')
    longTerm.push('당뇨병 위험 증가')
    riskFactors.push('당분 과다 섭취')
  } else if (food.sugar > 2) {
    score -= 10
    grade = grade === 'F' ? 'F' : 'D'
    analysis.push(`⚠️ 당분 함량이 다소 높습니다 (${food.sugar}g)`)
  } else if (food.sugar > 0) {
    score -= 5
    grade = grade === 'F' ? 'F' : 'D'
  }
  
  // 단백질 평가
  const proteinRatio = (food.protein * 4) / food.calories * 100
  if (proteinRatio < 8 && food.calories > 200) {
    score -= 15
    analysis.push(`단백질 함량이 부족합니다 (${food.protein}g, 칼로리의 ${proteinRatio.toFixed(0)}%). 권장: 칼로리의 최소 10% 이상`)
    shortTerm.push('포만감 부족, 식탐 증가 가능')
    longTerm.push('근육량 감소, 면역력 저하, 회복 지연')
    recommendations.push(`단백질 함량이 높은 식품(닭가슴살, 생선, 두부 등)과 함께 섭취하세요`)
  } else if (proteinRatio > 20 && food.calories < 300) {
    // 단백질이 풍부해도 점수는 그대로 유지 (보너스 없음)
    analysis.push(`단백질이 풍부합니다 (${food.protein}g)`)
  }
  
  // 섬유질 평가
  if (food.fiber < 1 && food.calories > 200) {
    score -= 15
    analysis.push(`섬유질이 부족합니다 (${food.fiber}g). 권장 일일 섭취량: ${DAILY_FIBER_GOAL}g`)
    shortTerm.push('변비, 소화 불량, 혈당 급상승')
    longTerm.push('대장암 위험 증가, 콜레스테롤 상승, 심혈관 질환 위험')
    recommendations.push('채소나 전곡류를 함께 섭취하여 섬유질을 보충하세요')
  } else if (food.fiber > 3) {
    analysis.push(`섬유질이 풍부합니다 (${food.fiber}g) - 소화 건강과 혈당 조절에 도움이 됩니다`)
  }
  
  // 나트륨 추정 (일반적으로 가공식품에 높음)
  const isProcessedFood = food.fat > 15 || food.sugar > 20 || food.calories > 350
  if (isProcessedFood) {
    const estimatedSodium = food.calories > 300 ? 800 : 400 // 추정치 (mg)
    if (estimatedSodium > 600) {
      riskFactors.push('나트륨 과다 가능성')
      recommendations.push('가공식품은 나트륨 함량이 높을 수 있으니 물을 충분히 드세요')
    }
  }
  
  // === 4. 어제 식사 패턴 분석 ===
  if (yesterdayCalories > 2400) {
    if (food.calories > 400) {
      score -= 20
      grade = 'F'
      analysis.push(`어제 칼로리 섭취가 ${yesterdayCalories.toFixed(0)}kcal로 높았습니다. 오늘은 300kcal 이하의 가벼운 식사를 권장합니다.`)
      recommendations.push('연속된 고칼로리 섭취는 신진대사에 부담을 줍니다')
    }
  }
  
  // === 5. 영양소 균형 종합 평가 ===
  if (projectedProtein < DAILY_PROTEIN_GOAL * 0.8) {
    recommendations.push('오늘 단백질 섭취가 부족할 수 있습니다. 단백질 보충을 고려하세요')
  }
  if (projectedFiber < DAILY_FIBER_GOAL * 0.7) {
    recommendations.push('오늘 섬유질 섭취가 부족할 수 있습니다. 채소와 전곡류 섭취를 늘리세요')
  }
  if (projectedSugar > DAILY_SUGAR_LIMIT * 1.2) {
    riskFactors.push('일일 당분 섭취 과다')
    recommendations.push('오늘 당분 섭취가 권장 기준을 초과했습니다. 내일은 당분 함량이 낮은 음식을 선택하세요')
  }
  
  // 추가: 나트륨 평가
  const sodium = food.sodium || 0
  if (sodium > 800) {
    score -= 20
    grade = 'F'
    analysis.push(`❌ 나트륨 함량이 매우 높습니다 (${sodium}mg) - 고혈압, 심혈관 질환 위험 증가`)
    riskFactors.push('나트륨 과다')
    recommendations.push('❌ 이 음식은 섭취하지 마세요. 나트륨이 너무 많아 건강에 매우 해롭습니다.')
  } else if (sodium > 500) {
    score -= 15
    grade = 'F'
    analysis.push(`❌ 나트륨 함량이 높습니다 (${sodium}mg)`)
    riskFactors.push('나트륨 과다')
  } else if (sodium > 300) {
    score -= 10
    grade = grade === 'F' ? 'F' : 'D'
    analysis.push(`⚠️ 나트륨 함량이 다소 높습니다 (${sodium}mg)`)
  } else if (sodium > 100) {
    score -= 5
    grade = grade === 'F' ? 'F' : 'D'
  }
  
  // 추가: 패스트푸드/튀김/고당분 음식 특별 체크 (구글/네이버 건강 정보 기준)
  const foodNameLower = food.foodName.toLowerCase()
  
  const fastFoodKeywords = ['치킨', '튀김', '피자', '햄버거', '도넛', '프라이드', '치즈', '버거']
  const friedFoodKeywords = ['튀김', '프라이', '치킨', '닭강정', '돈까스', '생선까스', '고로케']
  const highSugarKeywords = ['탕후루', '사탕', '초콜릿', '케이크', '아이스크림', '도넛', '쿠키', '과자', '캔디']
  const processedFoodKeywords = ['라면', '짜장면', '짬뽕', '마라탕', '부대찌개', '떡볶이']
  const highSodiumKeywords = ['라면', '짜장', '짬뽕', '마라탕', '김치', '된장']
  
  const isFastFood = fastFoodKeywords.some(keyword => foodNameLower.includes(keyword))
  const isFriedFood = friedFoodKeywords.some(keyword => foodNameLower.includes(keyword))
  const isHighSugar = highSugarKeywords.some(keyword => foodNameLower.includes(keyword))
  const isProcessed = processedFoodKeywords.some(keyword => foodNameLower.includes(keyword))
  const isHighSodium = highSodiumKeywords.some(keyword => foodNameLower.includes(keyword))
  
  // 패스트푸드/튀김 음식은 무조건 F 등급
  if (isFastFood || isFriedFood) {
    score = 5
    grade = 'F'
    analysis.push(`❌ 패스트푸드/튀김 음식은 건강에 매우 해롭습니다. 구글/네이버 건강 정보에 따르면 고지방, 고칼로리로 비만, 심혈관 질환 위험을 높입니다.`)
    shortTerm.push('소화 지연, 무기력감, 트리글리세리드 급상승')
    longTerm.push('비만, 제2형 당뇨병, 동맥경화, 심혈관 질환, 뇌졸중 위험 증가')
    riskFactors.push('고지방 식이', '트랜스지방', '포화지방 과다')
    recommendations.push('❌ 절대 섭취하지 마세요. 구글/네이버 건강 정보: 튀긴 음식은 트랜스지방과 포화지방이 많아 콜레스테롤 상승과 동맥경화를 유발합니다.')
  }
  
  // 고당분 음식은 무조건 F 등급
  if (isHighSugar) {
    score = 8
    grade = 'F'
    analysis.push(`❌ 고당분 음식은 건강에 매우 해롭습니다. 구글/네이버 건강 정보에 따르면 혈당 급상승, 인슐린 저항성, 당뇨병 위험을 높입니다.`)
    shortTerm.push('혈당 급상승 → 급강하, 에너지 불안정, 식탐 증가')
    longTerm.push('인슐린 저항성, 제2형 당뇨병, 비만, 충치, 심혈관 질환 위험 증가')
    riskFactors.push('과당 섭취', '혈당 변동성 증가')
    recommendations.push('❌ 절대 섭취하지 마세요. 구글/네이버 건강 정보: 과도한 당분 섭취는 비만, 제2형 당뇨병, 충치, 심혈관 질환 위험을 증가시킵니다.')
  }
  
  // 가공식품/고나트륨 음식은 무조건 F 등급
  if (isProcessed || isHighSodium) {
    score = Math.min(score, 10)
    grade = 'F'
    analysis.push(`❌ 가공식품/고나트륨 음식은 건강에 해롭습니다. 구글/네이버 건강 정보에 따르면 고혈압, 심혈관 질환, 신장 질환 위험을 높입니다.`)
    shortTerm.push('혈압 상승, 부종, 갈증 증가')
    longTerm.push('고혈압, 뇌졸중, 심장병, 신장 질환, 골다공증 위험 증가')
    riskFactors.push('나트륨 과다', '가공식품 섭취')
    recommendations.push('❌ 절대 섭취하지 마세요. 구글/네이버 건강 정보: 나트륨 과다 섭취는 고혈압, 뇌졸중, 심장병 위험을 증가시킵니다.')
  }
  
  // 특별 체크: 치킨, 마라탕, 탕후루 같은 음식은 무조건 최악
  if (foodNameLower.includes('치킨') || foodNameLower.includes('마라탕') || foodNameLower.includes('탕후루') ||
      foodNameLower.includes('chicken') || foodNameLower.includes('fried')) {
    score = 3
    grade = 'F'
    analysis.push(`❌ 이 음식은 건강에 매우 해롭습니다. 구글/네이버 건강 정보에 따르면 절대 피해야 할 음식입니다.`)
    shortTerm.push('소화 불량, 위 불편감, 졸음, 혈당 급상승')
    longTerm.push('비만, 제2형 당뇨병, 심혈관 질환, 고혈압, 뇌졸중 위험 증가')
    riskFactors.push('고칼로리', '고지방', '고나트륨', '고당분')
    recommendations.push('❌ 절대 섭취하지 마세요. 구글/네이버 건강 정보: 이 음식은 건강에 매우 해롭습니다.')
  }
  
  // 추가: 거의 모든 음식은 안 좋게 평가
  if (food.calories > 100 || food.fat > 3 || food.sugar > 1 || sodium > 200) {
    if (score > 20) {
      score = 20
    }
    grade = 'F'
  }
  
  // === 최종 등급 결정 ===
  if (score < 15) grade = 'F'
  else if (score < 25) grade = 'F'
  else if (score < 40) grade = 'D'
  else if (score < 60) grade = 'D'
  else grade = 'D'  // 거의 다 D 이하
  
  // === 종합 평가 요약 ===
  let summary = ''
  if (grade === 'D') {
    summary = `❌ 이 음식은 영양소 불균형이나 과도한 칼로리로 건강에 부정적 영향을 줄 수 있습니다. 섭취를 자제하시기 바랍니다.`
  } else {
    summary = `❌ 이 음식은 현재 건강한 식단에 매우 부적합합니다. 고칼로리, 고지방, 고당분, 고나트륨으로 인해 만성 질환 위험을 높일 수 있습니다. 절대 섭취하지 마세요.`
  }
  
  // 기본 권장사항 추가
  if (recommendations.length === 0) {
    recommendations.push('균형잡힌 식단을 유지하세요', '충분한 수분 섭취를 권장합니다')
  }
  
  return {
    overallGrade: grade,
    summary,
    detailedAnalysis: analysis,
    healthImpact: {
      shortTerm,
      longTerm,
    },
    recommendations,
    riskFactors,
  }
}

