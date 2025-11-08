import axios from 'axios'
import { estimateNutritionByCategory } from './foodCategoryDetector'

export interface NutritionData {
  foodName: string
  calories: number
  protein: number
  fat: number
  carbs: number
  fiber: number
  sugar: number
  sodium?: number // 나트륨 (mg)
  isEstimated?: boolean // 추정치인지 여부
}

// Edamam API 사용 (무료 tier 제공)
// 실제 사용 시 .env 파일에 API 키를 저장하세요
const EDAMAM_APP_ID = import.meta.env.VITE_EDAMAM_APP_ID || ''
const EDAMAM_APP_KEY = import.meta.env.VITE_EDAMAM_APP_KEY || ''

// API 키가 없을 경우 대체 데이터 소스 사용
const useMockData = !EDAMAM_APP_ID || !EDAMAM_APP_KEY

// 한국 음식 영양 정보 데이터베이스 (확장)
const mockNutritionData: Record<string, NutritionData> = {
  // 과일
  '사과': { foodName: '사과', calories: 52, protein: 0.3, fat: 0.2, carbs: 14, fiber: 2.4, sugar: 10 },
  '바나나': { foodName: '바나나', calories: 89, protein: 1.1, fat: 0.3, carbs: 23, fiber: 2.6, sugar: 12 },
  '오렌지': { foodName: '오렌지', calories: 47, protein: 0.9, fat: 0.1, carbs: 12, fiber: 2.4, sugar: 9 },
  '포도': { foodName: '포도', calories: 69, protein: 0.7, fat: 0.2, carbs: 18, fiber: 0.9, sugar: 16 },
  '딸기': { foodName: '딸기', calories: 32, protein: 0.7, fat: 0.3, carbs: 8, fiber: 2, sugar: 5 },
  '수박': { foodName: '수박', calories: 30, protein: 0.6, fat: 0.2, carbs: 8, fiber: 0.4, sugar: 6 },
  '참외': { foodName: '참외', calories: 34, protein: 0.8, fat: 0.1, carbs: 8, fiber: 0.9, sugar: 8 },
  
  // 채소
  '당근': { foodName: '당근', calories: 41, protein: 0.9, fat: 0.2, carbs: 10, fiber: 2.8, sugar: 5 },
  '브로콜리': { foodName: '브로콜리', calories: 34, protein: 2.8, fat: 0.4, carbs: 7, fiber: 2.6, sugar: 1.5 },
  '시금치': { foodName: '시금치', calories: 23, protein: 2.9, fat: 0.4, carbs: 4, fiber: 2.2, sugar: 0.4 },
  '양배추': { foodName: '양배추', calories: 25, protein: 1.3, fat: 0.1, carbs: 6, fiber: 2.5, sugar: 3.2 },
  '토마토': { foodName: '토마토', calories: 18, protein: 0.9, fat: 0.2, carbs: 4, fiber: 1.2, sugar: 2.6 },
  '양파': { foodName: '양파', calories: 40, protein: 1.1, fat: 0.1, carbs: 9, fiber: 1.7, sugar: 4.2 },
  '오이': { foodName: '오이', calories: 16, protein: 0.7, fat: 0.1, carbs: 4, fiber: 0.5, sugar: 2 },
  '버섯': { foodName: '버섯', calories: 22, protein: 3.1, fat: 0.3, carbs: 3, fiber: 1, sugar: 2 },
  
  // 육류
  '치킨': { foodName: '치킨 (튀김)', calories: 296, protein: 25, fat: 15, carbs: 15, fiber: 0.5, sugar: 0, sodium: 900 },
  '삼겹살': { foodName: '삼겹살', calories: 518, protein: 9, fat: 53, carbs: 0, fiber: 0, sugar: 0, sodium: 80 },
  '불고기': { foodName: '불고기', calories: 242, protein: 22, fat: 14, carbs: 6, fiber: 0.2, sugar: 5, sodium: 800 },
  '갈비': { foodName: '갈비', calories: 278, protein: 20, fat: 20, carbs: 2, fiber: 0, sugar: 1, sodium: 600 },
  '닭가슴살': { foodName: '닭가슴살', calories: 165, protein: 31, fat: 3.6, carbs: 0, fiber: 0, sugar: 0, sodium: 80 },
  '소고기': { foodName: '소고기 (국거리)', calories: 250, protein: 26, fat: 15, carbs: 0, fiber: 0, sugar: 0, sodium: 70 },
  '돼지고기': { foodName: '돼지고기', calories: 242, protein: 27, fat: 14, carbs: 0, fiber: 0, sugar: 0, sodium: 70 },
  '양고기': { foodName: '양고기', calories: 294, protein: 25, fat: 21, carbs: 0, fiber: 0, sugar: 0, sodium: 80 },
  
  // 해산물
  '생선회': { foodName: '생선회 (연어)', calories: 208, protein: 25, fat: 12, carbs: 0, fiber: 0, sugar: 0 },
  '참치': { foodName: '참치', calories: 184, protein: 30, fat: 6, carbs: 0, fiber: 0, sugar: 0 },
  '고등어': { foodName: '고등어', calories: 262, protein: 24, fat: 18, carbs: 0, fiber: 0, sugar: 0 },
  '새우': { foodName: '새우', calories: 99, protein: 24, fat: 0.3, carbs: 0, fiber: 0, sugar: 0 },
  '오징어': { foodName: '오징어', calories: 92, protein: 18, fat: 1.4, carbs: 3, fiber: 0, sugar: 0 },
  '문어': { foodName: '문어', calories: 82, protein: 15, fat: 1, carbs: 2.2, fiber: 0, sugar: 0 },
  '게': { foodName: '게', calories: 101, protein: 19, fat: 1.5, carbs: 1.3, fiber: 0, sugar: 0 },
  
  // 면류/밥류
  '김밥': { foodName: '김밥', calories: 215, protein: 5.2, fat: 6.5, carbs: 33, fiber: 2.1, sugar: 2, sodium: 1200 },
  '비빔밥': { foodName: '비빔밥', calories: 188, protein: 7.5, fat: 6.2, carbs: 25, fiber: 3.5, sugar: 5, sodium: 800 },
  '라면': { foodName: '라면', calories: 378, protein: 9, fat: 14.5, carbs: 54, fiber: 2, sugar: 2, sodium: 1800 },
  '짜장면': { foodName: '짜장면', calories: 390, protein: 12, fat: 14, carbs: 58, fiber: 3, sugar: 8, sodium: 1200 },
  '짬뽕': { foodName: '짬뽕', calories: 420, protein: 15, fat: 16, carbs: 55, fiber: 3.5, sugar: 5, sodium: 1500 },
  '볶음밥': { foodName: '볶음밥', calories: 206, protein: 5, fat: 6.8, carbs: 32, fiber: 1.2, sugar: 2, sodium: 900 },
  '밥': { foodName: '밥 (흰쌀밥)', calories: 130, protein: 2.7, fat: 0.3, carbs: 28, fiber: 0.4, sugar: 0.1, sodium: 5 },
  '국수': { foodName: '국수', calories: 138, protein: 4.5, fat: 0.7, carbs: 28, fiber: 1.8, sugar: 0.6, sodium: 1200 },
  '우동': { foodName: '우동', calories: 143, protein: 4.8, fat: 0.5, carbs: 29, fiber: 1.2, sugar: 1, sodium: 1100 },
  '파스타': { foodName: '파스타', calories: 131, protein: 5, fat: 1.1, carbs: 25, fiber: 1.8, sugar: 0.6, sodium: 300 },
  
  // 찌개/탕류
  '된장찌개': { foodName: '된장찌개', calories: 78, protein: 4.2, fat: 2.8, carbs: 8.5, fiber: 1.2, sugar: 2.5, sodium: 900 },
  '김치찌개': { foodName: '김치찌개', calories: 85, protein: 4.8, fat: 3.2, carbs: 9, fiber: 1.5, sugar: 3, sodium: 950 },
  '부대찌개': { foodName: '부대찌개', calories: 142, protein: 8, fat: 5.5, carbs: 15, fiber: 2, sugar: 3, sodium: 1200 },
  '삼계탕': { foodName: '삼계탕', calories: 267, protein: 28, fat: 10, carbs: 12, fiber: 1, sugar: 3, sodium: 800 },
  '설렁탕': { foodName: '설렁탕', calories: 165, protein: 12, fat: 8, carbs: 12, fiber: 1.2, sugar: 2, sodium: 700 },
  '갈비탕': { foodName: '갈비탕', calories: 195, protein: 15, fat: 10, carbs: 12, fiber: 0.8, sugar: 2, sodium: 750 },
  '순두부찌개': { foodName: '순두부찌개', calories: 95, protein: 6.5, fat: 5.2, carbs: 6.5, fiber: 1.8, sugar: 2, sodium: 850 },
  '해물탕': { foodName: '해물탕', calories: 88, protein: 12, fat: 2.5, carbs: 5, fiber: 0.5, sugar: 2, sodium: 600 },
  
  // 기타 한식
  '떡볶이': { foodName: '떡볶이', calories: 206, protein: 4.5, fat: 2.8, carbs: 40, fiber: 1.5, sugar: 8, sodium: 1100 },
  '김치': { foodName: '김치', calories: 24, protein: 1.2, fat: 0.5, carbs: 4, fiber: 2.4, sugar: 1, sodium: 800 },
  '두부': { foodName: '두부', calories: 76, protein: 8, fat: 4.8, carbs: 1.9, fiber: 0.3, sugar: 0.6, sodium: 10 },
  '순두부': { foodName: '순두부', calories: 55, protein: 5.7, fat: 3.5, carbs: 1.8, fiber: 0.2, sugar: 0.7, sodium: 5 },
  '계란': { foodName: '계란', calories: 155, protein: 13, fat: 11, carbs: 1.1, fiber: 0, sugar: 1.1, sodium: 140 },
  '계란말이': { foodName: '계란말이', calories: 182, protein: 14, fat: 13, carbs: 2, fiber: 0, sugar: 1, sodium: 400 },
  '계란국': { foodName: '계란국', calories: 62, protein: 4.2, fat: 3.8, carbs: 2.5, fiber: 0.3, sugar: 1, sodium: 600 },
  
  // 간식/후식
  '아이스크림': { foodName: '아이스크림', calories: 207, protein: 3.5, fat: 11, carbs: 24, fiber: 0.7, sugar: 21, sodium: 80 },
  '케이크': { foodName: '케이크 (초콜릿)', calories: 389, protein: 4.6, fat: 19, carbs: 50, fiber: 2.3, sugar: 35, sodium: 200 },
  '초콜릿': { foodName: '초콜릿', calories: 546, protein: 7.8, fat: 31, carbs: 54, fiber: 7, sugar: 48, sodium: 20 },
  '도넛': { foodName: '도넛', calories: 452, protein: 5.3, fat: 25, carbs: 51, fiber: 2.3, sugar: 23, sodium: 300 },
  '피자': { foodName: '피자 (1조각)', calories: 266, protein: 12, fat: 10, carbs: 33, fiber: 2.3, sugar: 3.6, sodium: 550 },
  '햄버거': { foodName: '햄버거', calories: 295, protein: 15, fat: 14, carbs: 28, fiber: 2.1, sugar: 5, sodium: 900 },
  '탕후루': { foodName: '탕후루', calories: 180, protein: 0.5, fat: 0.1, carbs: 45, fiber: 0.2, sugar: 40, sodium: 5 },
  '마라탕': { foodName: '마라탕', calories: 320, protein: 18, fat: 22, carbs: 15, fiber: 2, sugar: 3, sodium: 2000 },
  
  // 음료
  '커피': { foodName: '커피 (아메리카노)', calories: 2, protein: 0.3, fat: 0, carbs: 0.3, fiber: 0, sugar: 0, sodium: 5 },
  '우유': { foodName: '우유', calories: 61, protein: 3.2, fat: 3.3, carbs: 4.8, fiber: 0, sugar: 4.8, sodium: 40 },
  '주스': { foodName: '오렌지 주스', calories: 45, protein: 0.7, fat: 0.2, carbs: 11, fiber: 0.2, sugar: 9, sodium: 1 },
  '탄산음료': { foodName: '콜라', calories: 42, protein: 0, fat: 0, carbs: 11, fiber: 0, sugar: 11, sodium: 10 },
  
  // 기타
  '샐러드': { foodName: '샐러드', calories: 65, protein: 2.5, fat: 3.8, carbs: 6, fiber: 2.5, sugar: 4, sodium: 200 },
  '샌드위치': { foodName: '샌드위치', calories: 248, protein: 12, fat: 10, carbs: 28, fiber: 2.1, sugar: 4, sodium: 800 },
  '떡': { foodName: '떡', calories: 235, protein: 3.8, fat: 0.5, carbs: 53, fiber: 0.6, sugar: 0, sodium: 5 },
  '만두': { foodName: '만두', calories: 265, protein: 11, fat: 16, carbs: 20, fiber: 1.2, sugar: 1, sodium: 600 },
}

export async function searchFood(foodName: string): Promise<NutritionData> {
  if (!foodName || !foodName.trim()) {
    throw new Error('음식 이름을 입력해주세요.')
  }

  const normalizedName = foodName.trim()

  // Mock 데이터 사용 (API 키가 없는 경우)
  if (useMockData) {
    // 공백 제거하여 정확히 일치하는 항목 검색
    const trimmedName = normalizedName.replace(/\s+/g, '')
    
    // 정확히 일치하는 항목 검색
    let exactMatch = mockNutritionData[normalizedName]
    if (!exactMatch) {
      exactMatch = mockNutritionData[trimmedName]
    }
    
    if (exactMatch) {
      return { ...exactMatch }
    }

    // 부분 일치 검색 (한국어의 경우 대소문자 구분 없이)
    const partialMatch = Object.keys(mockNutritionData).find(
      (key) => {
        const normalizedKey = key.replace(/\s+/g, '')
        const normalizedInput = normalizedName.replace(/\s+/g, '')
        return normalizedKey.includes(normalizedInput) || normalizedInput.includes(normalizedKey)
      }
    )
    
    if (partialMatch) {
      return { ...mockNutritionData[partialMatch] }
    }

    // 데이터베이스에 없는 음식의 경우 카테고리 기반 추정치 제공
    const estimatedNutrition = estimateNutritionByCategory(normalizedName)
    return {
      ...estimatedNutrition,
      isEstimated: true,
    }
  }

  // Edamam API 사용
  try {
    const response = await axios.get('https://api.edamam.com/api/food-database/v2/parser', {
      params: {
        q: foodName,
        app_id: EDAMAM_APP_ID,
        app_key: EDAMAM_APP_KEY,
        type: 'public',
      },
    })

    if (response.data.hints && response.data.hints.length > 0) {
      const food = response.data.hints[0].food
      const nutrients = food.nutrients

      return {
        foodName: food.label || foodName,
        calories: Math.round(nutrients.ENERC_KCAL || 0),
        protein: Math.round(nutrients.PROCNT || 0),
        fat: Math.round(nutrients.FAT || 0),
        carbs: Math.round(nutrients.CHOCDF || 0),
        fiber: Math.round(nutrients.FIBTG || 0),
        sugar: Math.round(nutrients.SUGAR || 0),
      }
    }

    throw new Error('검색 결과를 찾을 수 없습니다.')
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error('음식 정보를 가져오는 중 오류가 발생했습니다.')
    }
    throw error
  }
}

