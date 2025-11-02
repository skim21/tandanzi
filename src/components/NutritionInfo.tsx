import { NutritionData } from '../services/nutritionApi'
import { Droplet, Apple, Wheat, Beef } from 'lucide-react'

interface NutritionInfoProps {
  data: NutritionData
}

export default function NutritionInfo({ data }: NutritionInfoProps) {
  const nutritionItems = [
    {
      label: '탄수화물',
      value: `${data.carbs}g`,
      icon: Wheat,
      color: 'from-yellow-400 to-orange-500',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
    },
    {
      label: '단백질',
      value: `${data.protein}g`,
      icon: Beef,
      color: 'from-red-400 to-pink-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
    },
    {
      label: '지방',
      value: `${data.fat}g`,
      icon: Droplet,
      color: 'from-blue-400 to-cyan-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      label: '섬유질',
      value: `${data.fiber}g`,
      icon: Apple,
      color: 'from-green-400 to-emerald-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
  ]

  return (
    <div>
      <h3 className="text-2xl font-bold mb-6 text-gray-800">영양소 정보 (100g 기준)</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {nutritionItems.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.label}
              className={`${item.bgColor} p-5 rounded-xl border-2 border-transparent hover:border-gray-200 transition-all`}
            >
              <div className="flex items-center gap-2 mb-3">
                <div className={`bg-gradient-to-br ${item.color} p-2 rounded-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className={`font-semibold ${item.textColor}`}>{item.label}</span>
              </div>
              <div className={`text-2xl font-bold ${item.textColor}`}>{item.value}</div>
            </div>
          )
        })}
      </div>

      {/* Additional Info */}
      {data.sugar > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 font-medium">당류</span>
            <span className="text-xl font-bold text-gray-800">{data.sugar}g</span>
          </div>
        </div>
      )}

      {/* Health Tips */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h4 className="font-semibold text-gray-700 mb-3">💡 건강 팁</h4>
        <ul className="space-y-2 text-sm text-gray-600">
          {data.calories < 300 && (
            <li>✓ 저칼로리 식품으로 다이어트에 적합합니다</li>
          )}
          {data.protein > 10 && (
            <li>✓ 단백질이 풍부하여 근육 형성에 도움이 됩니다</li>
          )}
          {data.fiber > 5 && (
            <li>✓ 섬유질이 많아 소화에 좋고 포만감을 제공합니다</li>
          )}
          {data.fat > 20 && (
            <li>⚠ 지방 함량이 높아 적당히 섭취하세요</li>
          )}
          {data.sugar > 20 && (
            <li>⚠ 당분 함량이 높아 주의가 필요합니다</li>
          )}
        </ul>
      </div>
    </div>
  )
}

