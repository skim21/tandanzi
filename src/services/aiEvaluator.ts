import { MealRecord } from './mealHistory'
import { NutritionData } from './nutritionApi'

export interface MealRecommendation {
  shouldEat: boolean
  score: number
  message: string
  reasons: string[]
  alternatives?: string[]
  missingNutrients?: string[] // 부족한 영양소
}

// 시간대별 권장 칼로리 (대략적인 기준)
const getTimeBasedCalorieLimit = (hour: number): number => {
  if (hour >= 6 && hour < 10) {
    return 500 // 아침
  } else if (hour >= 10 && hour < 14) {
    return 700 // 점심
  } else if (hour >= 14 && hour < 18) {
    return 400 // 오후 간식
  } else if (hour >= 18 && hour < 22) {
    return 600 // 저녁
  } else {
    return 300 // 야식 (늦은 시간)
  }
}

const getMealTimeName = (hour: number): string => {
  if (hour >= 6 && hour < 10) return '아침'
  if (hour >= 10 && hour < 14) return '점심'
  if (hour >= 14 && hour < 18) return '오후 간식'
  if (hour >= 18 && hour < 22) return '저녁'
  return '야식'
}

// 하루 권장 칼로리 (성인 기준, 활동량에 따라 조정 필요)
const DAILY_CALORIE_GOAL = 2000

export function evaluateMeal(
  food: NutritionData,
  yesterdayMeals: MealRecord[],
  todayMeals: MealRecord[]
): MealRecommendation {
  const now = new Date()
  const currentHour = now.getHours()
  const mealTimeName = getMealTimeName(currentHour)
  
  // 어제 섭취한 총 칼로리 계산
  const yesterdayCalories = yesterdayMeals.reduce(
    (sum, meal) => sum + meal.nutrition.calories,
    0
  )
  
  // 오늘 이미 섭취한 칼로리 계산
  const todayCalories = todayMeals.reduce(
    (sum, meal) => sum + meal.nutrition.calories,
    0
  )
  
  // 현재 시간대 기준 권장 칼로리
  const timeBasedLimit = getTimeBasedCalorieLimit(currentHour)
  
  // 예상 총 칼로리 (이 음식을 먹는다면)
  const projectedTotal = todayCalories + food.calories
  
  const reasons: string[] = []
  const missingNutrients: string[] = []
  let score = 100
  let shouldEat = true
  
  // === 엄격한 평가 기준 ===
  
  // 1. 시간대별 적합성 평가 (더 엄격하게)
  const calorieRatio = food.calories / timeBasedLimit
  if (calorieRatio > 2.0) {
    score -= 35
    shouldEat = false
    reasons.push(`⚠️ 현재 시간(${mealTimeName})에는 ${timeBasedLimit}kcal 이내가 적당한데, ${food.calories}kcal는 너무 많습니다`)
  } else if (calorieRatio > 1.5) {
    score -= 25
    reasons.push(`⚠️ 현재 시간(${mealTimeName})에는 ${timeBasedLimit}kcal 이내가 적당합니다 (${food.calories}kcal)`)
    if (calorieRatio > 1.8) {
      shouldEat = false
    }
  } else if (calorieRatio > 1.2) {
    score -= 10
    reasons.push(`현재 시간대(${mealTimeName})에 다소 높은 칼로리입니다 (${food.calories}kcal)`)
  } else if (calorieRatio <= 0.8) {
    reasons.push(`✅ 현재 시간대(${mealTimeName})에 적합한 칼로리입니다`)
  }
  
  // 2. 하루 총 칼로리 평가 (더 엄격하게)
  if (projectedTotal > DAILY_CALORIE_GOAL * 1.4) {
    score -= 40
    shouldEat = false
    reasons.push(`❌ 하루 권장 칼로리(${DAILY_CALORIE_GOAL}kcal)를 ${(projectedTotal - DAILY_CALORIE_GOAL).toFixed(0)}kcal 초과합니다`)
  } else if (projectedTotal > DAILY_CALORIE_GOAL * 1.25) {
    score -= 30
    shouldEat = false
    reasons.push(`⚠️ 하루 권장 칼로리를 ${(projectedTotal - DAILY_CALORIE_GOAL).toFixed(0)}kcal 초과합니다 (${projectedTotal.toFixed(0)}kcal)`)
  } else if (projectedTotal > DAILY_CALORIE_GOAL * 1.1) {
    score -= 20
    reasons.push(`⚠️ 하루 권장 칼로리를 약간 초과합니다 (${projectedTotal.toFixed(0)}kcal)`)
  } else if (todayCalories < DAILY_CALORIE_GOAL * 0.6 && food.calories < 400) {
    reasons.push(`✅ 오늘 칼로리 섭취가 부족하므로 섭취를 권장합니다`)
  }
  
  // 3. 어제 대비 평가 (더 엄격하게)
  if (yesterdayCalories > DAILY_CALORIE_GOAL * 1.3) {
    if (food.calories > 350) {
      score -= 20
      reasons.push(`⚠️ 어제 칼로리 섭취가 ${yesterdayCalories.toFixed(0)}kcal로 많았으니 오늘은 가벼운 식사(300kcal 이하)를 권장합니다`)
      if (food.calories > 450) {
        shouldEat = false
      }
    }
  } else if (yesterdayCalories > DAILY_CALORIE_GOAL * 1.2) {
    if (food.calories > 500) {
      score -= 15
      reasons.push(`어제 칼로리 섭취가 많았으니 오늘은 적당한 식사를 권장합니다`)
    }
  }
  
  // 4. 영양소 균형 평가 (더 엄격하게)
  // 지방 평가
  const fatPercentage = (food.fat * 9) / food.calories * 100
  if (fatPercentage > 60) {
    score -= 25
    shouldEat = false
    reasons.push(`❌ 지방 함량이 매우 높습니다 (${food.fat}g, 칼로리의 ${fatPercentage.toFixed(0)}%)`)
  } else if (fatPercentage > 50) {
    score -= 20
    reasons.push(`⚠️ 지방 함량이 높습니다 (${food.fat}g, 칼로리의 ${fatPercentage.toFixed(0)}%)`)
  } else if (fatPercentage > 40) {
    score -= 10
    reasons.push(`지방 함량이 다소 높습니다 (${food.fat}g)`)
  }
  
  // 당분 평가
  if (food.sugar > 30) {
    score -= 25
    reasons.push(`❌ 당분 함량이 매우 높습니다 (${food.sugar}g)`)
    if (food.sugar > 40) {
      shouldEat = false
    }
  } else if (food.sugar > 20) {
    score -= 15
    reasons.push(`⚠️ 당분 함량이 높습니다 (${food.sugar}g)`)
  } else if (food.sugar > 15) {
    score -= 8
    reasons.push(`당분 함량이 다소 높습니다 (${food.sugar}g)`)
  }
  
  // 단백질 평가 (부족한 영양소 체크)
  const proteinRatio = (food.protein * 4) / food.calories * 100
  if (proteinRatio < 10 && food.calories > 150) {
    score -= 15
    missingNutrients.push('단백질')
    reasons.push(`⚠️ 단백질 함량이 낮습니다 (${food.protein}g) - 근육 형성과 회복에 중요합니다`)
  }
  
  // 섬유질 평가 (부족한 영양소 체크)
  if (food.fiber < 1 && food.calories > 200) {
    score -= 10
    missingNutrients.push('섬유질')
    reasons.push(`⚠️ 섬유질이 부족합니다 (${food.fiber}g) - 소화와 포만감에 중요합니다`)
  } else if (food.fiber > 3) {
    reasons.push(`✅ 섬유질이 풍부하여 건강에 좋습니다 (${food.fiber}g)`)
  }
  
  // 5. 늦은 시간 야식 경고 (더 엄격하게)
  if (currentHour >= 22 || currentHour < 6) {
    if (food.calories > 250) {
      score -= 30
      shouldEat = false
      reasons.push(`❌ 늦은 시간(야식)에 고칼로리 식품(${food.calories}kcal)은 소화에 부담이 되고 수면의 질을 떨어뜨립니다`)
    } else if (food.calories > 150) {
      score -= 15
      reasons.push(`⚠️ 늦은 시간에 ${food.calories}kcal는 다소 많을 수 있습니다`)
    }
    
    if (food.fat > 10) {
      score -= 10
      reasons.push(`늦은 시간에 고지방 식품은 소화를 느리게 합니다`)
    }
  }
  
  // 6. 점수 정규화 (0-100)
  score = Math.max(0, Math.min(100, score))
  
  // 7. 최종 권장 여부 결정 (더 엄격하게)
  if (score < 60) {
    shouldEat = false
  } else if (score < 70) {
    shouldEat = false // 70점 미만은 권장하지 않음
  }
  
  // 메시지 생성 (더 엄격한 기준)
  let message = ''
  if (shouldEat && score >= 85) {
    message = `✅ 지금 먹기에 매우 적절합니다!`
  } else if (shouldEat && score >= 75) {
    message = `✅ 지금 먹기에 적절합니다`
  } else if (score >= 65 && score < 75) {
    message = `⚠️ 먹을 수 있지만 주의가 필요합니다`
    shouldEat = false // 75점 미만은 권장하지 않음
  } else if (score >= 50) {
    message = `❌ 지금 먹기에는 부적절합니다`
  } else {
    message = `❌ 지금 먹지 않는 것이 좋습니다`
  }
  
  // 대안 제시
  const alternatives: string[] = []
  if (!shouldEat) {
    if (currentHour >= 22 || currentHour < 6) {
      alternatives.push('물', '허브차', '요거트')
    } else if (food.calories > timeBasedLimit) {
      alternatives.push('과일', '견과류', '샐러드')
    } else if (projectedTotal > DAILY_CALORIE_GOAL) {
      alternatives.push('저칼로리 식품', '단백질 쉐이크')
    }
  }
  
  return {
    shouldEat,
    score,
    message,
    reasons,
    alternatives: alternatives.length > 0 ? alternatives : undefined,
    missingNutrients: missingNutrients.length > 0 ? missingNutrients : undefined,
  }
}

