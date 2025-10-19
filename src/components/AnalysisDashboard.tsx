import { useState, useEffect } from 'react';
import {
  Activity, AlertTriangle, CheckCircle, Clock, TrendingUp,
  FileText, AlertCircle, Info, X, Calendar
} from 'lucide-react';
import { supabase, AnalysisResult, SymptomAnalysis } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface AnalysisDashboardProps {
  currentAnalysis?: AnalysisResult & { id: string; created_at: string } | null;
}

export function AnalysisDashboard({ currentAnalysis }: AnalysisDashboardProps) {
  const [history, setHistory] = useState<SymptomAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<SymptomAnalysis | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    loadHistory();
  }, [currentAnalysis]);

  const loadHistory = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('symptom_analyses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setHistory(data);
    }
  };

  const getUrgencyConfig = (level: string) => {
    switch (level) {
      case 'critical':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          label: 'Critical',
          description: 'Seek immediate medical attention',
        };
      case 'moderate':
        return {
          icon: AlertTriangle,
          color: 'text-amber-600',
          bgColor: 'bg-amber-50',
          borderColor: 'border-amber-200',
          label: 'Moderate',
          description: 'Consult a healthcare provider soon',
        };
      default:
        return {
          icon: Info,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          label: 'Normal',
          description: 'Monitor symptoms and take preventive measures',
        };
    }
  };

  const displayAnalysis = currentAnalysis || (selectedAnalysis ? {
    ...selectedAnalysis.analysis_result,
    id: selectedAnalysis.id,
    created_at: selectedAnalysis.created_at,
  } : null);

  if (!displayAnalysis) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
        <div className="text-center">
          <Activity className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Analysis Yet</h3>
          <p className="text-gray-600">
            Start by describing your symptoms in the chat to receive an AI-powered analysis.
          </p>
        </div>

        {history.length > 0 && (
          <div className="mt-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Recent Analyses</h4>
            <div className="space-y-2">
              {history.map((item) => {
                const urgencyConfig = getUrgencyConfig(item.urgency_level);
                return (
                  <button
                    key={item.id}
                    onClick={() => setSelectedAnalysis(item)}
                    className="w-full text-left p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {item.symptoms_text}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <urgencyConfig.icon className={`w-3 h-3 ${urgencyConfig.color}`} />
                          <span className={`text-xs ${urgencyConfig.color} font-medium`}>
                            {urgencyConfig.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(item.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <FileText className="w-5 h-5 text-gray-400 group-hover:text-blue-600 flex-shrink-0" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  const urgencyConfig = getUrgencyConfig(displayAnalysis.urgencyLevel);

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
      <div className={`${urgencyConfig.bgColor} ${urgencyConfig.borderColor} border-b p-6`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 ${urgencyConfig.bgColor} rounded-xl`}>
              <urgencyConfig.icon className={`w-6 h-6 ${urgencyConfig.color}`} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Analysis Results</h3>
              <p className={`text-sm ${urgencyConfig.color} font-medium mt-1`}>
                {urgencyConfig.label} Priority
              </p>
            </div>
          </div>
          {selectedAnalysis && (
            <button
              onClick={() => setSelectedAnalysis(null)}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          )}
        </div>
        <p className="text-sm text-gray-700">{urgencyConfig.description}</p>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h4 className="text-lg font-semibold text-gray-900">Possible Conditions</h4>
          </div>
          <div className="space-y-3">
            {displayAnalysis.possibleConditions.map((condition, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-xl p-4 border border-gray-200"
              >
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-semibold text-gray-900">{condition.condition}</h5>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    condition.probability === 'high' ? 'bg-red-100 text-red-700' :
                    condition.probability === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {condition.probability} probability
                  </span>
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{condition.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h4 className="text-lg font-semibold text-gray-900">Preventive Suggestions</h4>
          </div>
          <ul className="space-y-2">
            {displayAnalysis.preventiveSuggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start gap-3 text-gray-700">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                <span className="text-sm leading-relaxed">{suggestion}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h4 className="text-lg font-semibold text-gray-900">When to Seek Help</h4>
          </div>
          <ul className="space-y-2">
            {displayAnalysis.whenToSeekHelp.map((sign, index) => (
              <li key={index} className="flex items-start gap-3 text-gray-700">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                <span className="text-sm leading-relaxed">{sign}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h5 className="font-semibold text-blue-900 mb-2">General Advice</h5>
              <p className="text-sm text-blue-800 leading-relaxed">
                {displayAnalysis.generalAdvice}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 text-gray-600 text-sm">
            <Clock className="w-4 h-4" />
            <span>
              Analysis completed on {new Date(displayAnalysis.created_at).toLocaleString()}
            </span>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-xs text-amber-900 leading-relaxed">
            <strong>Medical Disclaimer:</strong> This analysis is provided for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition. Never disregard professional medical advice or delay in seeking it because of information provided by this AI tool.
          </p>
        </div>
      </div>
    </div>
  );
}
