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
  let score = 20  // 시작 점수: 20점 (거의 다 안 좋음)
  let shouldEat = false  // 기본값: 안 먹는 게 좋음
  let hasBadNutrients = false  // 나쁜 영양소 플래그
  
  // === 극도로 엄격한 평가 기준 (20점 시작, 거의 다 안 좋게 평가) ===
  
  // 1. 시간대별 적합성 평가 (극도로 엄격하게 - 대부분 안 좋게)
  const calorieRatio = food.calories / timeBasedLimit
  if (calorieRatio > 1.2) {
    score -= 30  // 즉시 10점 이하
    hasBadNutrients = true
    shouldEat = false
    reasons.push(`❌ 현재 시간(${mealTimeName})에는 ${timeBasedLimit}kcal 이내가 적당한데, ${food.calories}kcal는 매우 많습니다`)
  } else if (calorieRatio > 1.1) {
    score -= 25
    hasBadNutrients = true
    shouldEat = false
    reasons.push(`❌ 현재 시간(${mealTimeName})에는 ${timeBasedLimit}kcal 이내가 적당합니다 (${food.calories}kcal)`)
  } else if (calorieRatio > 1.05) {
    score -= 20
    hasBadNutrients = true
    shouldEat = false
    reasons.push(`❌ 현재 시간대(${mealTimeName})에 높은 칼로리입니다 (${food.calories}kcal)`)
  } else if (calorieRatio > 1.0) {
    score -= 15
    shouldEat = false
    reasons.push(`⚠️ 현재 시간대(${mealTimeName})에 다소 높은 칼로리입니다 (${food.calories}kcal)`)
  } else if (calorieRatio <= 0.9 && food.calories < 200) {
    // 좋은 경우에도 보너스 거의 없음
    score += 3  // 최소 보너스
    reasons.push(`현재 시간대(${mealTimeName})에 적합한 칼로리입니다`)
  } else {
    // 그냥 평범한 경우도 패널티
    score -= 5
    reasons.push(`⚠️ 현재 시간대(${mealTimeName})에 평범한 칼로리입니다`)
  }
  
  // 2. 하루 총 칼로리 평가 (극도로 엄격하게)
  if (projectedTotal > DAILY_CALORIE_GOAL * 1.05) {
    score -= 30  // 즉시 10점 이하
    hasBadNutrients = true
    shouldEat = false
    reasons.push(`❌ 하루 권장 칼로리(${DAILY_CALORIE_GOAL}kcal)를 ${(projectedTotal - DAILY_CALORIE_GOAL).toFixed(0)}kcal 초과합니다`)
  } else if (projectedTotal > DAILY_CALORIE_GOAL * 1.02) {
    score -= 25
    hasBadNutrients = true
    shouldEat = false
    reasons.push(`❌ 하루 권장 칼로리를 ${(projectedTotal - DAILY_CALORIE_GOAL).toFixed(0)}kcal 초과합니다 (${projectedTotal.toFixed(0)}kcal)`)
  } else if (projectedTotal > DAILY_CALORIE_GOAL * 1.0) {
    score -= 20
    shouldEat = false
    reasons.push(`❌ 하루 권장 칼로리를 약간 초과합니다 (${projectedTotal.toFixed(0)}kcal)`)
  } else if (projectedTotal > DAILY_CALORIE_GOAL * 0.98) {
    score -= 10
    shouldEat = false
    reasons.push(`⚠️ 하루 권장 칼로리에 근접합니다 (${projectedTotal.toFixed(0)}kcal)`)
  } else if (todayCalories < DAILY_CALORIE_GOAL * 0.2 && food.calories < 150 && food.fat < 5 && food.sugar < 3) {
    // 정말 좋은 경우에만 최소 보너스
    score += 2  // 최소 보너스
    reasons.push(`오늘 칼로리 섭취가 매우 부족합니다`)
  } else {
    // 평범한 경우도 패널티
    score -= 5
    reasons.push(`⚠️ 칼로리 섭취를 주의하세요`)
  }
  
  // 3. 어제 대비 평가 (극도로 엄격하게)
  if (yesterdayCalories > DAILY_CALORIE_GOAL * 1.2) {
    if (food.calories > 300) {
      score -= 35  // 패널티 증가
      shouldEat = false
      reasons.push(`❌ 어제 칼로리 섭취가 ${yesterdayCalories.toFixed(0)}kcal로 많았으니 오늘은 가벼운 식사(200kcal 이하)를 권장합니다`)
    } else if (food.calories > 250) {
      score -= 25
      reasons.push(`⚠️ 어제 칼로리 섭취가 많았으니 가벼운 식사를 권장합니다`)
    }
  } else if (yesterdayCalories > DAILY_CALORIE_GOAL * 1.1) {
    if (food.calories > 400) {
      score -= 30  // 패널티 증가
      shouldEat = false
      reasons.push(`⚠️ 어제 칼로리 섭취가 많았으니 오늘은 적당한 식사를 권장합니다`)
    }
  }
  
  // 4. 영양소 균형 평가 (극도로 엄격하게 - 대부분 안 좋게)
  // 지방 평가
  const fatPercentage = (food.fat * 9) / food.calories * 100
  if (fatPercentage > 30) {
    score -= 30  // 즉시 10점 이하
    hasBadNutrients = true
    shouldEat = false
    reasons.push(`❌ 지방 함량이 매우 높습니다 (${food.fat}g, 칼로리의 ${fatPercentage.toFixed(0)}%) - 건강에 매우 안 좋습니다`)
  } else if (fatPercentage > 20) {
    score -= 25
    hasBadNutrients = true
    shouldEat = false
    reasons.push(`❌ 지방 함량이 높습니다 (${food.fat}g, 칼로리의 ${fatPercentage.toFixed(0)}%) - 건강에 좋지 않습니다`)
  } else if (fatPercentage > 15) {
    score -= 20
    hasBadNutrients = true
    shouldEat = false
    reasons.push(`❌ 지방 함량이 다소 높습니다 (${food.fat}g, 칼로리의 ${fatPercentage.toFixed(0)}%)`)
  } else if (fatPercentage > 10) {
    score -= 15
    shouldEat = false
    reasons.push(`⚠️ 지방 함량이 높은 편입니다 (${food.fat}g)`)
  } else if (fatPercentage > 5) {
    score -= 10
    reasons.push(`⚠️ 지방 함량이 다소 높습니다 (${food.fat}g)`)
  } else {
    // 지방이 적어도 패널티는 유지
    score -= 3
  }
  
  // 당분 평가 (시간대 무관하게 엄격하게)
  if (food.sugar > 10) {
    score -= 30  // 즉시 10점 이하
    hasBadNutrients = true
    shouldEat = false
    reasons.push(`❌ 당분 함량이 매우 높습니다 (${food.sugar}g) - 건강에 매우 안 좋습니다`)
  } else if (food.sugar > 6) {
    score -= 25
    hasBadNutrients = true
    shouldEat = false
    reasons.push(`❌ 당분 함량이 높습니다 (${food.sugar}g) - 건강에 좋지 않습니다`)
  } else if (food.sugar > 3) {
    score -= 20
    hasBadNutrients = true
    shouldEat = false
    reasons.push(`❌ 당분 함량이 다소 높습니다 (${food.sugar}g)`)
  } else if (food.sugar > 1) {
    score -= 15
    shouldEat = false
    reasons.push(`⚠️ 당분 함량이 있는 편입니다 (${food.sugar}g)`)
  } else if (food.sugar > 0) {
    score -= 8
    reasons.push(`⚠️ 당분 함량이 약간 있습니다 (${food.sugar}g)`)
  }
  
  // 단백질 평가 (부족한 영양소 체크)
  const proteinRatio = (food.protein * 4) / food.calories * 100
  if (proteinRatio < 15 && food.calories > 150) {
    score -= 25  // 패널티
    missingNutrients.push('단백질')
    reasons.push(`❌ 단백질 함량이 낮습니다 (${food.protein}g) - 근육 형성과 회복에 중요합니다`)
  } else if (proteinRatio < 12 && food.calories > 150) {
    score -= 15
    missingNutrients.push('단백질')
    reasons.push(`⚠️ 단백질 함량이 부족합니다 (${food.protein}g)`)
  } else if (proteinRatio > 20 && food.calories < 300) {
    // 좋은 경우에도 보너스 최소화
    score += 5  // 최소 보너스
    reasons.push(`단백질이 풍부합니다 (${food.protein}g)`)
  }
  
  // 섬유질 평가 (부족한 영양소 체크)
  if (food.fiber < 3 && food.calories > 200) {
    score -= 20  // 패널티
    missingNutrients.push('섬유질')
    reasons.push(`❌ 섬유질이 부족합니다 (${food.fiber}g) - 소화와 포만감에 중요합니다`)
  } else if (food.fiber < 2 && food.calories > 200) {
    score -= 15
    missingNutrients.push('섬유질')
    reasons.push(`⚠️ 섬유질이 부족합니다 (${food.fiber}g)`)
  } else if (food.fiber > 4) {
    // 좋은 경우에도 보너스 최소화 (그냥 그럭저럭)
    score += 5  // 최소 보너스
    reasons.push(`섬유질이 풍부합니다 (${food.fiber}g)`)
  }
  
  // 5. 늦은 시간 야식 경고 (극도로 엄격하게)
  if (currentHour >= 22 || currentHour < 6) {
    if (food.calories > 200) {
      score -= 50  // 매우 큰 패널티
      shouldEat = false
      reasons.push(`❌ 늦은 시간(야식)에 고칼로리 식품(${food.calories}kcal)은 소화에 부담이 되고 수면의 질을 떨어뜨립니다`)
    } else if (food.calories > 120) {
      score -= 35  // 큰 패널티
      shouldEat = false
      reasons.push(`❌ 늦은 시간에 ${food.calories}kcal는 많습니다`)
    } else if (food.calories > 80) {
      score -= 20
      reasons.push(`⚠️ 늦은 시간에 ${food.calories}kcal는 다소 많을 수 있습니다`)
    }
    
    if (food.fat > 8) {
      score -= 25  // 패널티 증가
      reasons.push(`❌ 늦은 시간에 고지방 식품은 소화를 느리게 합니다`)
    } else if (food.fat > 5) {
      score -= 15
      reasons.push(`⚠️ 늦은 시간에 지방 함량이 높습니다`)
    }
  }
  
  // 5. 나트륨 평가 추가 (나쁜 영양소 - 대부분 안 좋게)
  const sodium = food.sodium || 0
  
  if (sodium > 800) {
    score -= 30  // 즉시 10점 이하
    hasBadNutrients = true
    shouldEat = false
    reasons.push(`❌ 나트륨 함량이 매우 높습니다 (${sodium}mg) - 고혈압, 심혈관 질환 위험 증가`)
  } else if (sodium > 500) {
    score -= 25
    hasBadNutrients = true
    shouldEat = false
    reasons.push(`❌ 나트륨 함량이 높습니다 (${sodium}mg) - 건강에 좋지 않습니다`)
  } else if (sodium > 300) {
    score -= 20
    hasBadNutrients = true
    shouldEat = false
    reasons.push(`❌ 나트륨 함량이 다소 높습니다 (${sodium}mg)`)
  } else if (sodium > 150) {
    score -= 15
    shouldEat = false
    reasons.push(`⚠️ 나트륨 함량이 있는 편입니다 (${sodium}mg)`)
  } else if (sodium > 50) {
    score -= 10
    reasons.push(`⚠️ 나트륨 함량이 약간 있습니다 (${sodium}mg)`)
  } else if (sodium > 0) {
    score -= 5
  }
  
  // 6. 가공식품/패스트푸드 특별 체크 (치킨, 피자, 햄버거, 과자 등 - 대부분 안 좋게)
  const isProcessedFood = 
    (food.calories > 200 && (food.fat > 8 || food.sugar > 4)) ||
    food.calories > 250 ||
    sodium > 400 ||
    food.sugar > 6 ||
    fatPercentage > 15
  
  if (isProcessedFood) {
    score -= 25
    hasBadNutrients = true
    shouldEat = false
    reasons.push(`❌ 가공식품/패스트푸드 특성상 건강에 매우 좋지 않습니다`)
  }
  
  // 추가: 칼로리가 높으면 무조건 나쁨
  if (food.calories > 250) {
    score -= 15
    hasBadNutrients = true
    shouldEat = false
    reasons.push(`❌ 칼로리가 높아 건강에 좋지 않습니다`)
  }
  
  // 7. 점수 정규화 (0-100)
  score = Math.max(0, Math.min(100, score))
  
  // 8. 최종 점수 조정: 거의 모든 음식은 안 좋게 평가
  // 나쁜 영양소가 있으면 무조건 15점 이하로 강제
  if (hasBadNutrients && score > 15) {
    score = 15  // 나쁜 영양소 있으면 최대 15점
    shouldEat = false
  }
  
  // 추가: 거의 모든 음식은 안 좋게 평가
  if (food.calories > 100 || food.fat > 3 || food.sugar > 1 || sodium > 100) {
    if (score > 20) {
      score = 20  // 거의 모든 음식은 20점 이하
    }
    shouldEat = false
  }
  
  // 추가: 칼로리가 있으면 무조건 나쁨
  if (food.calories > 50) {
    if (score > 18) {
      score = 18
    }
    shouldEat = false
  }
  
  // 9. 최종 권장 여부 결정 (극도로 엄격하게)
  // 거의 모든 음식은 안 좋게
  shouldEat = false  // 무조건 권장하지 않음
  
  // 메시지 생성 (극도로 엄격한 기준 - 거의 다 안 좋게)
  let message = ''
  if (score >= 25) {
    message = `❌ 먹기에는 부적절합니다`
  } else if (score >= 15) {
    message = `❌ 건강에 좋지 않습니다`
  } else if (score >= 10) {
    message = `❌ 매우 부적절합니다`
  } else {
    message = `❌ 절대 먹지 마세요`
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

