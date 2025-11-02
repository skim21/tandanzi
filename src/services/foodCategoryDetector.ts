import { NutritionData } from './nutritionApi'

// 카테고리별 평균 영양소 (100g 기준)
const categoryNutrition: Record<string, NutritionData> = {
  // 과일류
  fruit: { foodName: '과일류', calories: 60, protein: 0.8, fat: 0.3, carbs: 15, fiber: 2.5, sugar: 12 },
  
  // 채소류
  vegetable: { foodName: '채소류', calories: 25, protein: 2, fat: 0.2, carbs: 5, fiber: 2.5, sugar: 3 },
  
  // 육류 (튀김/고칼로리)
  friedMeat: { foodName: '튀긴 육류', calories: 350, protein: 20, fat: 25, carbs: 15, fiber: 0.5, sugar: 2 },
  
  // 육류 (일반)
  meat: { foodName: '육류', calories: 250, protein: 25, fat: 15, carbs: 2, fiber: 0, sugar: 1 },
  
  // 닭고기
  chicken: { foodName: '닭고기', calories: 165, protein: 31, fat: 3.6, carbs: 0, fiber: 0, sugar: 0 },
  
  // 해산물
  seafood: { foodName: '해산물', calories: 150, protein: 20, fat: 5, carbs: 2, fiber: 0, sugar: 1 },
  
  // 면류
  noodle: { foodName: '면류', calories: 140, protein: 4.5, fat: 0.8, carbs: 28, fiber: 1.5, sugar: 1 },
  
  // 밥류
  rice: { foodName: '밥류', calories: 130, protein: 2.7, fat: 0.3, carbs: 28, fiber: 0.4, sugar: 0.1 },
  
  // 찌개/탕류
  stew: { foodName: '찌개/탕류', calories: 90, protein: 6, fat: 3.5, carbs: 8, fiber: 1.2, sugar: 2 },
  
  // 빵류
  bread: { foodName: '빵류', calories: 265, protein: 9, fat: 3.2, carbs: 49, fiber: 2.7, sugar: 5 },
  
  // 패스트푸드
  fastfood: { foodName: '패스트푸드', calories: 295, protein: 14, fat: 13, carbs: 28, fiber: 2, sugar: 5 },
  
  // 디저트/과자
  dessert: { foodName: '디저트', calories: 400, protein: 5, fat: 18, carbs: 52, fiber: 2, sugar: 35 },
  
  // 음료
  beverage: { foodName: '음료', calories: 40, protein: 0.5, fat: 0.1, carbs: 10, fiber: 0.2, sugar: 9 },
  
  // 유제품
  dairy: { foodName: '유제품', calories: 60, protein: 3.2, fat: 3.3, carbs: 4.8, fiber: 0, sugar: 4.8 },
  
  // 계란류
  egg: { foodName: '계란류', calories: 155, protein: 13, fat: 11, carbs: 1.1, fiber: 0, sugar: 1.1 },
  
  // 견과류
  nuts: { foodName: '견과류', calories: 600, protein: 15, fat: 50, carbs: 20, fiber: 7, sugar: 4 },
}

// 키워드 기반 카테고리 매칭
const categoryKeywords: Record<string, string[]> = {
  fruit: ['과일', '사과', '바나나', '오렌지', '포도', '딸기', '수박', '참외', '복숭아', '배', '귤', '한라봉', '자두', '체리', '망고', '파인애플', '키위', '레몬', '석류'],
  vegetable: ['채소', '야채', '당근', '브로콜리', '시금치', '양배추', '토마토', '양파', '오이', '버섯', '배추', '무', '호박', '가지', '피망', '파', '마늘', '생강', '고추'],
  friedMeat: ['치킨', '닭튀김', '돈까스', '미트볼', '너겟', '치킨너겟', '프라이드'],
  meat: ['고기', '소고기', '돼지고기', '양고기', '갈비', '불고기', '삼겹살', '목살', '등심', '안심', '스테이크'],
  chicken: ['닭', '닭가슴살', '닭다리', '닭날개'],
  seafood: ['생선', '참치', '연어', '고등어', '새우', '오징어', '문어', '게', '홍합', '조개', '전복', '회', '해물', '멸치', '꽃게'],
  noodle: ['면', '라면', '국수', '우동', '파스타', '스파게티', '짜장면', '짬뽕', '우동', '라멘'],
  rice: ['밥', '볶음밥', '비빔밥', '김밥', '주먹밥', '밥'],
  stew: ['찌개', '탕', '국', '된장', '김치찌개', '부대찌개', '순두부', '설렁탕', '삼계탕', '갈비탕', '해물탕', '국물'],
  bread: ['빵', '토스트', '샌드위치', '햄버거', '버거', '도넛'],
  fastfood: ['패스트푸드', '햄버거', '피자', '치킨', '도넛', '치즈버거'],
  dessert: ['디저트', '케이크', '초콜릿', '아이스크림', '도넛', '쿠키', '파이', '티라미수', '푸딩', '젤리'],
  beverage: ['음료', '주스', '콜라', '사이다', '탄산', '차', '커피', '우유', '두유', '오렌지주스', '사과주스'],
  dairy: ['우유', '치즈', '요거트', '요구르트', '버터', '크림'],
  egg: ['계란', '달걀', '에그'],
  nuts: ['견과', '땅콩', '아몬드', '호두', '땅콩', '캐슈넛', '피스타치오'],
}

export function detectFoodCategory(foodName: string): string | null {
  const normalized = foodName.toLowerCase().trim()
  
  // 각 카테고리의 키워드를 확인
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    for (const keyword of keywords) {
      if (normalized.includes(keyword) || normalized.includes(keyword.toLowerCase())) {
        return category
      }
    }
  }
  
  return null
}

export function estimateNutritionByCategory(foodName: string): NutritionData {
  const category = detectFoodCategory(foodName)
  
  if (category && categoryNutrition[category]) {
    const base = categoryNutrition[category]
    return {
      foodName: foodName,
      calories: base.calories,
      protein: base.protein,
      fat: base.fat,
      carbs: base.carbs,
      fiber: base.fiber,
      sugar: base.sugar,
    }
  }
  
  // 카테고리를 찾지 못한 경우 기본값 (일반 음식 평균)
  return {
    foodName: foodName,
    calories: 200,
    protein: 10,
    fat: 8,
    carbs: 25,
    fiber: 2,
    sugar: 5,
  }
}

