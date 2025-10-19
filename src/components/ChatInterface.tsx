import { useState, useRef, useEffect } from 'react';
import { Send, Mic, MicOff, Loader2, AlertTriangle } from 'lucide-react';
import { supabase, AnalysisResult } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  onAnalysisComplete: (analysis: AnalysisResult & { id: string; created_at: string }) => void;
}

export function ChatInterface({ onAnalysisComplete }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "Hello! I'm SymptomSense AI. Please describe your symptoms in detail, and I'll help analyze them. You can type or use the microphone to speak.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      addMessage('bot', 'Sorry, I could not access your microphone. Please check your browser permissions and try again.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setRecording(false);
    }
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    addMessage('bot', 'Transcribing your audio...');
    setInput('Audio transcription feature is simulated. Please type your symptoms instead, or integrate with a speech-to-text API like OpenAI Whisper for full functionality.');
  };

  const addMessage = (type: 'user' | 'bot', content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const analyzeSymptoms = async (symptomsText: string) => {
    setLoading(true);
    addMessage('user', symptomsText);
    addMessage('bot', 'Analyzing your symptoms...');

    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('age, medical_history')
        .eq('id', user.id)
        .maybeSingle();

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-symptoms`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            symptomsText,
            userAge: profile?.age,
            medicalHistory: profile?.medical_history,
          }),
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to analyze symptoms');
      }

      const analysis = data.analysis;

      const conditionsList = analysis.analysis_result.possibleConditions
        .map((c: any) => `• ${c.condition} (${c.probability} probability): ${c.description}`)
        .join('\n');

      const urgencyEmoji =
        analysis.analysis_result.urgencyLevel === 'critical' ? '🚨' :
        analysis.analysis_result.urgencyLevel === 'moderate' ? '⚠️' : 'ℹ️';

      const responseMessage = `${urgencyEmoji} Analysis Complete\n\nPossible Conditions:\n${conditionsList}\n\nUrgency Level: ${analysis.analysis_result.urgencyLevel.toUpperCase()}\n\nI've completed the full analysis. Click "View Full Analysis" to see detailed recommendations and preventive measures.`;

      setMessages(prev => prev.filter(m => m.content !== 'Analyzing your symptoms...'));
      addMessage('bot', responseMessage);

      onAnalysisComplete(analysis);
    } catch (error) {
      console.error('Error analyzing symptoms:', error);
      setMessages(prev => prev.filter(m => m.content !== 'Analyzing your symptoms...'));
      addMessage('bot', `I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const symptomsText = input.trim();
    setInput('');
    analyzeSymptoms(symptomsText);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-lg border border-gray-200">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-4 rounded-t-2xl">
        <h2 className="text-xl font-semibold">Chat with AI Assistant</h2>
        <p className="text-sm text-blue-100 mt-1">Describe your symptoms in detail</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4" style={{ maxHeight: 'calc(100vh - 350px)', minHeight: '400px' }}>
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.type === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <p className="text-sm whitespace-pre-line leading-relaxed">{message.content}</p>
              <span className="text-xs opacity-70 mt-1 block">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800">
            This AI provides informational guidance only. Always consult healthcare professionals for medical advice.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your symptoms here..."
            disabled={loading || recording}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
          />

          <button
            type="button"
            onClick={recording ? stopRecording : startRecording}
            disabled={loading}
            className={`p-3 rounded-xl transition-all ${
              recording
                ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {recording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-cyan-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
