import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import { Header } from './components/Header';
import { ChatInterface } from './components/ChatInterface';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { ProfileSetup } from './components/ProfileSetup';
import { Settings } from 'lucide-react';
import { AnalysisResult } from './lib/supabase';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentAnalysis, setCurrentAnalysis] = useState<(AnalysisResult & { id: string; created_at: string }) | null>(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <Header />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Health Analysis Dashboard</h2>
            <p className="text-gray-600 mt-1">
              Describe your symptoms and receive AI-powered health insights
            </p>
          </div>
          <button
            onClick={() => setShowProfileSetup(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all shadow-sm"
          >
            <Settings className="w-4 h-4" />
            <span className="text-sm font-medium">Profile</span>
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="lg:sticky lg:top-24 h-fit">
            <ChatInterface onAnalysisComplete={(analysis) => setCurrentAnalysis(analysis)} />
          </div>

          <div>
            <AnalysisDashboard currentAnalysis={currentAnalysis} />
          </div>
        </div>

        <div className="mt-8 bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Important Information</h3>
          <div className="space-y-4 text-sm text-gray-700 leading-relaxed">
            <p>
              <strong>About SymptomSense AI:</strong> This application uses artificial intelligence to analyze symptoms
              and provide preliminary health information based on medical knowledge databases. The AI considers your
              described symptoms, age, and medical history to generate personalized insights.
            </p>
            <p>
              <strong>How It Works:</strong> Enter your symptoms through text or voice, and our AI will analyze them
              against a comprehensive medical database. You'll receive possible conditions, urgency levels, preventive
              suggestions, and guidance on when to seek professional help.
            </p>
            <p>
              <strong>Urgency Levels Explained:</strong>
            </p>
            <ul className="list-disc pl-6 space-y-1">
              <li><strong>Normal:</strong> Symptoms are likely minor. Monitor and take preventive measures.</li>
              <li><strong>Moderate:</strong> Symptoms warrant attention. Consider consulting a healthcare provider soon.</li>
              <li><strong>Critical:</strong> Symptoms may indicate a serious condition. Seek immediate medical attention.</li>
            </ul>
            <p className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900">
              <strong>Medical Disclaimer:</strong> SymptomSense AI is an informational tool and NOT a medical diagnostic
              device. It does not replace professional medical advice, diagnosis, or treatment. Always consult qualified
              healthcare professionals for medical decisions. In case of emergency, call your local emergency services
              immediately.
            </p>
          </div>
        </div>
      </main>

      {showProfileSetup && (
        <ProfileSetup
          isModal={true}
          onClose={() => setShowProfileSetup(false)}
        />
      )}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
