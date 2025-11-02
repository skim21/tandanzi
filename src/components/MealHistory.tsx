import { MealRecord } from '../services/mealHistory'
import { Calendar, Clock, Trash2 } from 'lucide-react'

interface MealHistoryProps {
  records: MealRecord[]
  onDelete?: (index: number) => void
}

export default function MealHistory({ records, onDelete }: MealHistoryProps) {
  if (records.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>기록된 식사가 없습니다</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {records.map((record, index) => (
        <div
          key={index}
          className="bg-gray-50 rounded-lg p-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-semibold text-gray-800">{record.foodName}</h4>
              <span className="text-sm font-bold text-blue-600">
                {record.nutrition.calories}kcal
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{record.date}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>{record.time}</span>
              </div>
            </div>
          </div>
          {onDelete && (
            <button
              onClick={() => onDelete(index)}
              className="ml-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="삭제"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  )
}

