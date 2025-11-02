import { MedicalAssessment as MedicalAssessmentType } from '../services/medicalEvaluator'
import { Stethoscope, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react'

interface MedicalAssessmentProps {
  assessment: MedicalAssessmentType
}

export default function MedicalAssessmentCard({ assessment }: MedicalAssessmentProps) {
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A':
        return 'text-green-600 bg-green-50 border-green-300'
      case 'B':
        return 'text-blue-600 bg-blue-50 border-blue-300'
      case 'C':
        return 'text-yellow-600 bg-yellow-50 border-yellow-300'
      case 'D':
        return 'text-orange-600 bg-orange-50 border-orange-300'
      case 'F':
        return 'text-red-600 bg-red-50 border-red-300'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-300'
    }
  }

  const getGradeIcon = (grade: string) => {
    switch (grade) {
      case 'A':
        return <CheckCircle className="w-8 h-8 text-green-600" />
      case 'B':
        return <CheckCircle className="w-8 h-8 text-blue-600" />
      case 'C':
        return <AlertTriangle className="w-8 h-8 text-yellow-600" />
      case 'D':
        return <AlertTriangle className="w-8 h-8 text-orange-600" />
      case 'F':
        return <XCircle className="w-8 h-8 text-red-600" />
      default:
        return <Info className="w-8 h-8 text-gray-600" />
    }
  }

  return (
    <div className={`border-2 rounded-xl p-6 ${getGradeColor(assessment.overallGrade)}`}>
      {/* 헤더 */}
      <div className="flex items-center gap-3 mb-4">
        <Stethoscope className="w-8 h-8" />
        <div className="flex-1">
          <h3 className="text-2xl font-bold">의학적 종합 평가</h3>
          <p className="text-sm opacity-80">영양학 및 건강 전문가 기준 분석</p>
        </div>
        <div className="text-right">
          <div className="text-4xl font-extrabold">{assessment.overallGrade}</div>
          <div className="text-xs opacity-70">종합 등급</div>
        </div>
      </div>

      {/* 종합 요약 */}
      <div className="mb-6 p-4 bg-white/50 rounded-lg border-2 border-current/20">
        <div className="flex items-start gap-3">
          {getGradeIcon(assessment.overallGrade)}
          <p className="text-base leading-relaxed font-medium flex-1">{assessment.summary}</p>
        </div>
      </div>

      {/* 상세 분석 */}
      {assessment.detailedAnalysis.length > 0 && (
        <div className="mb-6">
          <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
            <Info className="w-5 h-5" />
            상세 분석
          </h4>
          <ul className="space-y-2">
            {assessment.detailedAnalysis.map((item, index) => (
              <li key={index} className="text-sm flex items-start gap-2 bg-white/30 rounded-lg p-3">
                <span className="mt-1 font-bold">•</span>
                <span className="flex-1">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 건강 영향 */}
      {(assessment.healthImpact.shortTerm.length > 0 ||
        assessment.healthImpact.longTerm.length > 0) && (
        <div className="mb-6">
          <h4 className="font-bold text-lg mb-3">건강 영향</h4>
          <div className="grid md:grid-cols-2 gap-4">
            {assessment.healthImpact.shortTerm.length > 0 && (
              <div className="bg-white/30 rounded-lg p-4">
                <h5 className="font-semibold mb-2 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  단기 영향 (즉시~수일)
                </h5>
                <ul className="space-y-1 text-sm">
                  {assessment.healthImpact.shortTerm.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-1">▸</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {assessment.healthImpact.longTerm.length > 0 && (
              <div className="bg-white/30 rounded-lg p-4">
                <h5 className="font-semibold mb-2 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  장기 영향 (지속 섭취 시)
                </h5>
                <ul className="space-y-1 text-sm">
                  {assessment.healthImpact.longTerm.map((item, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="mt-1">▸</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 위험 요인 */}
      {assessment.riskFactors.length > 0 && (
        <div className="mb-6">
          <h4 className="font-bold text-lg mb-3 flex items-center gap-2 text-red-700">
            <XCircle className="w-5 h-5" />
            위험 요인
          </h4>
          <div className="flex flex-wrap gap-2">
            {assessment.riskFactors.map((factor, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium"
              >
                {factor}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 권장사항 */}
      {assessment.recommendations.length > 0 && (
        <div className="pt-4 border-t-2 border-current/20">
          <h4 className="font-bold text-lg mb-3 flex items-center gap-2 text-blue-700">
            <CheckCircle className="w-5 h-5" />
            전문가 권장사항
          </h4>
          <ul className="space-y-2">
            {assessment.recommendations.map((rec, index) => (
              <li
                key={index}
                className="flex items-start gap-3 bg-white/50 rounded-lg p-3 text-sm"
              >
                <CheckCircle className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                <span className="flex-1">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 면책 조항 */}
      <div className="mt-6 pt-4 border-t border-current/20">
        <p className="text-xs opacity-70 italic">
          * 이 평가는 일반적인 영양 기준과 의학 연구 결과를 바탕으로 제공되며, 개인 건강 상태나
          의학적 조건에 따라 달라질 수 있습니다. 특별한 건강 상태가 있으시다면 전문의와 상담하시기
          바랍니다.
        </p>
      </div>
    </div>
  )
}

