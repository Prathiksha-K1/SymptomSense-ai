# SymptomSense AI

An intelligent web application that analyzes symptoms and provides AI-powered health insights, urgency assessments, and preventive recommendations.

## Features

- **AI-Powered Symptom Analysis**: Advanced OpenAI integration analyzes symptoms against a comprehensive medical knowledge base
- **Interactive Chat Interface**: Describe symptoms through text or voice input
- **Urgency Level Assessment**: Automatic classification of symptoms as Normal, Moderate, or Critical
- **Comprehensive Analysis Dashboard**: View possible conditions, preventive suggestions, and guidance on when to seek help
- **User Profiles**: Optional medical history tracking for personalized analysis
- **Analysis History**: Review past symptom analyses and track health patterns
- **Secure Authentication**: Email/password authentication with secure data storage
- **Responsive Design**: Professional medical UI optimized for desktop and mobile

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and optimized builds
- **Tailwind CSS** for responsive styling
- **Lucide React** for icons

### Backend
- **Supabase** for database, authentication, and serverless functions
- **PostgreSQL** with Row Level Security (RLS) for data protection
- **Supabase Edge Functions** (Deno runtime) for serverless API

### AI Integration
- **OpenAI GPT-4o-mini** for intelligent symptom analysis
- **Medical Knowledge Base** with symptom-condition mappings

## Prerequisites

- Node.js 18+ and npm
- A Supabase account and project
- An OpenAI API key

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd symptomsense-ai
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

The `.env` file should already contain your Supabase credentials:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Configure OpenAI API Key

The Edge Function requires an OpenAI API key. Configure it in your Supabase project:

1. Go to your Supabase project dashboard
2. Navigate to **Edge Functions** → **Secrets**
3. Add a new secret:
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key (get one at https://platform.openai.com/api-keys)

### 5. Database Setup

The database schema has already been applied via migrations. It includes:

- `user_profiles` - User information and medical history
- `symptom_analyses` - Stored symptom analysis results
- `symptom_conditions` - Medical knowledge base with 10+ common symptoms

All tables have Row Level Security enabled for data protection.

### 6. Edge Function Deployment

The `analyze-symptoms` Edge Function has been deployed and includes:
- Symptom analysis using OpenAI
- Integration with medical knowledge base
- Secure user authentication
- Automatic storage of analysis results

### 7. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 8. Build for Production

```bash
npm run build
```

## How to Use

1. **Sign Up**: Create an account with your email and password
2. **Set Up Profile** (Optional): Add your age and medical history for more personalized analysis
3. **Describe Symptoms**: Use the chat interface to type or speak your symptoms
4. **Receive Analysis**: Get AI-powered insights including:
   - Possible conditions with probability ratings
   - Urgency level (Normal, Moderate, Critical)
   - Preventive suggestions
   - When to seek professional help
   - General health advice
5. **Review History**: Access past analyses from the dashboard
6. **Monitor Progress**: Track symptoms over time

## API Usage

### Analyze Symptoms Endpoint

The Edge Function is available at:

```
POST https://your-project.supabase.co/functions/v1/analyze-symptoms
```

**Headers:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Content-Type: application/json
```

**Request Body:**
```json
{
  "symptomsText": "I have a headache and fever for 2 days",
  "userAge": 30,
  "medicalHistory": "No significant medical history"
}
```

**Response:**
```json
{
  "success": true,
  "analysis": {
    "id": "uuid",
    "user_id": "uuid",
    "symptoms_text": "I have a headache and fever for 2 days",
    "analysis_result": {
      "possibleConditions": [
        {
          "condition": "Influenza",
          "probability": "high",
          "description": "Common viral infection causing fever and headache"
        }
      ],
      "urgencyLevel": "moderate",
      "preventiveSuggestions": [
        "Rest and stay hydrated",
        "Take over-the-counter pain relievers"
      ],
      "whenToSeekHelp": [
        "If fever exceeds 103°F",
        "If symptoms worsen after 3 days"
      ],
      "generalAdvice": "Monitor your symptoms and consult a doctor if they persist."
    },
    "urgency_level": "moderate",
    "created_at": "2025-10-19T10:30:00.000Z"
  }
}
```

## Architecture

### Database Schema

```sql
-- User profiles with medical history
user_profiles (
  id uuid PRIMARY KEY,
  full_name text,
  age integer,
  medical_history text,
  created_at timestamptz,
  updated_at timestamptz
)

-- Symptom analysis records
symptom_analyses (
  id uuid PRIMARY KEY,
  user_id uuid,
  symptoms_text text,
  audio_url text,
  analysis_result jsonb,
  urgency_level text,
  created_at timestamptz
)

-- Medical knowledge base
symptom_conditions (
  id uuid PRIMARY KEY,
  symptom text UNIQUE,
  possible_conditions text[],
  severity_indicators text[],
  created_at timestamptz
)
```

### Security

- **Row Level Security (RLS)**: All tables have RLS policies ensuring users can only access their own data
- **Authentication**: Supabase Auth with email/password
- **API Security**: Edge Functions require valid JWT tokens
- **Data Validation**: Input validation on both client and server

## Important Notes

### Medical Disclaimer

**SymptomSense AI is an informational tool and NOT a medical diagnostic device.**

- This application does NOT provide medical diagnoses
- AI analysis is for informational purposes only
- Always consult qualified healthcare professionals for medical advice
- In case of emergency, call your local emergency services immediately (911 in the US)
- Never delay seeking medical attention based on information from this tool

### Ethical Considerations

- User privacy is paramount - all data is encrypted and secured
- The AI provides guidance, not diagnoses
- Urgency levels are suggestions, not definitive assessments
- Users are consistently reminded to seek professional medical care

### Limitations

- AI analysis is based on text descriptions and may not capture all nuances
- Audio transcription is simulated - integrate with OpenAI Whisper or similar for production
- Medical knowledge base includes 10 common symptoms - expand for broader coverage
- Analysis quality depends on symptom description detail

## Future Enhancements

- Integration with OpenAI Whisper for real audio transcription
- Expanded medical knowledge base with 100+ symptoms
- Multi-language support
- Symptom severity tracking charts
- Doctor appointment scheduling integration
- Export analysis reports as PDF
- Integration with wearable health devices
- Symptom pattern recognition over time

## Development Scripts

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linting
npm run lint

# Type checking
npm run typecheck
```

## Troubleshooting

### OpenAI API Errors

If you see "Failed to analyze symptoms with AI":
- Verify your OpenAI API key is correctly set in Supabase Edge Function secrets
- Check your OpenAI account has available credits
- Ensure the API key has permissions for chat completions

### Authentication Issues

If sign-up/sign-in fails:
- Check Supabase project URL and anon key in `.env`
- Verify email confirmation is disabled in Supabase Auth settings
- Check browser console for detailed error messages

### Database Errors

If you encounter "Failed to store analysis":
- Verify database migrations were applied successfully
- Check RLS policies allow authenticated users to insert data
- Review Supabase logs for detailed error information

## Support

For issues, questions, or contributions, please open an issue in the repository.

## License

This project is for educational and informational purposes. Always consult healthcare professionals for medical advice.

---

**Remember**: This is a demonstration of AI capabilities in healthcare information. It is not a replacement for professional medical care.
