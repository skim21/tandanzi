import { MealRecommendation } from '../services/aiEvaluator'
import { Brain, CheckCircle, XCircle, AlertTriangle, Lightbulb } from 'lucide-react'

interface AIRecommendationProps {
  recommendation: MealRecommendation
}

export default function AIRecommendation({ recommendation }: AIRecommendationProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 60) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-red-600 bg-red-50 border-red-200'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-6 h-6" />
    if (score >= 60) return <AlertTriangle className="w-6 h-6" />
    return <XCircle className="w-6 h-6" />
  }

  return (
    <div className={`border-2 rounded-xl p-6 ${getScoreColor(recommendation.score)}`}>
      <div className="flex items-center gap-3 mb-4">
        <Brain className="w-8 h-8" />
        <div>
          <h3 className="text-xl font-bold">AI 건강 평가</h3>
          <p className="text-sm opacity-80">현재 시간과 어제 식사 기록을 분석했습니다</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          {getScoreIcon(recommendation.score)}
          <span className="text-2xl font-bold">{recommendation.message}</span>
        </div>
        <div className="text-3xl font-extrabold mb-2">{recommendation.score}점</div>
        <div className="w-full bg-white/50 rounded-full h-3 mb-4">
          <div
            className={`h-3 rounded-full transition-all ${
              recommendation.score >= 80
                ? 'bg-green-500'
                : recommendation.score >= 60
                ? 'bg-yellow-500'
                : 'bg-red-500'
            }`}
            style={{ width: `${recommendation.score}%` }}
          />
        </div>
      </div>

      {recommendation.reasons.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold mb-2">평가 이유:</h4>
          <ul className="space-y-1">
            {recommendation.reasons.map((reason, index) => (
              <li key={index} className="text-sm flex items-start gap-2">
                <span className="mt-1">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {recommendation.missingNutrients && recommendation.missingNutrients.length > 0 && (
        <div className="mt-4 pt-4 border-t border-current/20">
          <h4 className="font-semibold mb-2">⚠️ 부족한 영양소:</h4>
          <div className="flex flex-wrap gap-2">
            {recommendation.missingNutrients.map((nutrient, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium"
              >
                {nutrient}
              </span>
            ))}
          </div>
          <p className="text-xs mt-2 opacity-80">
            이 영양소들을 보충할 수 있는 다른 음식과 함께 드시는 것을 권장합니다
          </p>
        </div>
      )}

      {recommendation.alternatives && recommendation.alternatives.length > 0 && (
        <div className="mt-4 pt-4 border-t border-current/20">
          <div className="flex items-center gap-2 mb-2">
            <Lightbulb className="w-5 h-5" />
            <h4 className="font-semibold">대안 추천:</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {recommendation.alternatives.map((alt, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-white/50 rounded-full text-sm font-medium"
              >
                {alt}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

