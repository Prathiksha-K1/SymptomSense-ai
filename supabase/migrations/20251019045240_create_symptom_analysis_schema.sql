/*
  # SymptomSense AI Database Schema

  1. New Tables
    - `symptom_analyses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `symptoms_text` (text) - User's symptom description
      - `audio_url` (text, nullable) - URL to audio recording if provided
      - `analysis_result` (jsonb) - AI analysis including possible conditions, urgency, suggestions
      - `urgency_level` (text) - normal, moderate, or critical
      - `created_at` (timestamptz)
    
    - `symptom_conditions`
      - `id` (uuid, primary key)
      - `symptom` (text) - Symptom name
      - `possible_conditions` (text[]) - Array of possible conditions
      - `severity_indicators` (text[]) - Signs that indicate severity
      - `created_at` (timestamptz)
    
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `full_name` (text)
      - `age` (integer, nullable)
      - `medical_history` (text, nullable)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Symptom conditions table is read-only for all authenticated users

  3. Indexes
    - Index on user_id for fast lookups
    - Index on created_at for chronological queries
    - Index on urgency_level for filtering
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  age integer,
  medical_history text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create symptom_analyses table
CREATE TABLE IF NOT EXISTS symptom_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  symptoms_text text NOT NULL,
  audio_url text,
  analysis_result jsonb NOT NULL DEFAULT '{}'::jsonb,
  urgency_level text NOT NULL DEFAULT 'normal',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE symptom_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own analyses"
  ON symptom_analyses FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analyses"
  ON symptom_analyses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own analyses"
  ON symptom_analyses FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_symptom_analyses_user_id ON symptom_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_symptom_analyses_created_at ON symptom_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_symptom_analyses_urgency ON symptom_analyses(urgency_level);

-- Create symptom_conditions table (medical knowledge base)
CREATE TABLE IF NOT EXISTS symptom_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  symptom text NOT NULL UNIQUE,
  possible_conditions text[] NOT NULL DEFAULT '{}',
  severity_indicators text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE symptom_conditions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read symptom conditions"
  ON symptom_conditions FOR SELECT
  TO authenticated
  USING (true);

-- Insert sample symptom-condition mappings
INSERT INTO symptom_conditions (symptom, possible_conditions, severity_indicators) VALUES
  ('fever', ARRAY['Common cold', 'Influenza', 'COVID-19', 'Infection', 'Heat exhaustion'], ARRAY['Temperature above 103°F', 'Lasting more than 3 days', 'Accompanied by severe headache', 'Difficulty breathing', 'Chest pain']),
  ('headache', ARRAY['Tension headache', 'Migraine', 'Dehydration', 'Sinusitis', 'High blood pressure'], ARRAY['Sudden severe headache', 'Headache with vision changes', 'Headache with confusion', 'Headache after head injury', 'Stiff neck with headache']),
  ('cough', ARRAY['Common cold', 'Bronchitis', 'Asthma', 'Allergies', 'Pneumonia', 'GERD'], ARRAY['Coughing up blood', 'Difficulty breathing', 'Chest pain', 'High fever', 'Cough lasting more than 3 weeks']),
  ('chest pain', ARRAY['Heart attack', 'Angina', 'Acid reflux', 'Muscle strain', 'Anxiety'], ARRAY['Pain spreading to arm/jaw', 'Shortness of breath', 'Sweating', 'Nausea', 'Dizziness']),
  ('shortness of breath', ARRAY['Asthma', 'Pneumonia', 'Heart disease', 'Anxiety', 'COPD'], ARRAY['Sudden onset', 'Chest pain', 'Blue lips or fingers', 'Confusion', 'Cannot speak full sentences']),
  ('abdominal pain', ARRAY['Indigestion', 'Gastroenteritis', 'Appendicitis', 'Ulcer', 'Kidney stones'], ARRAY['Severe pain', 'Pain in lower right abdomen', 'Vomiting blood', 'Rigid abdomen', 'High fever']),
  ('nausea', ARRAY['Food poisoning', 'Gastroenteritis', 'Migraine', 'Pregnancy', 'Medication side effect'], ARRAY['Severe dehydration', 'Blood in vomit', 'Severe abdominal pain', 'Confusion', 'Cannot keep fluids down']),
  ('fatigue', ARRAY['Anemia', 'Thyroid disorder', 'Depression', 'Sleep apnea', 'Chronic fatigue syndrome'], ARRAY['Extreme weakness', 'Chest pain', 'Shortness of breath', 'Fainting', 'Irregular heartbeat']),
  ('dizziness', ARRAY['Dehydration', 'Low blood pressure', 'Inner ear problem', 'Medication side effect', 'Anemia'], ARRAY['Fainting', 'Chest pain', 'Severe headache', 'Vision changes', 'Difficulty speaking']),
  ('sore throat', ARRAY['Common cold', 'Strep throat', 'Allergies', 'Dry air', 'Tonsillitis'], ARRAY['Difficulty swallowing', 'Difficulty breathing', 'High fever', 'Swollen neck', 'Cannot open mouth fully'])
ON CONFLICT (symptom) DO NOTHING;