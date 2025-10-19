import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SymptomAnalysisRequest {
  symptomsText: string;
  userAge?: number;
  medicalHistory?: string;
}

interface AnalysisResult {
  possibleConditions: Array<{
    condition: string;
    probability: string;
    description: string;
  }>;
  urgencyLevel: "normal" | "moderate" | "critical";
  preventiveSuggestions: string[];
  whenToSeekHelp: string[];
  generalAdvice: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const { symptomsText, userAge, medicalHistory }: SymptomAnalysisRequest = await req.json();

    if (!symptomsText || symptomsText.trim().length === 0) {
      throw new Error("Symptoms text is required");
    }

    // Fetch relevant symptom-condition mappings from database
    const { data: symptomConditions } = await supabaseClient
      .from("symptom_conditions")
      .select("*");

    // Build context for AI
    const medicalContext = symptomConditions?.map(sc => 
      `Symptom: ${sc.symptom}\nPossible conditions: ${sc.possible_conditions.join(", ")}\nSeverity indicators: ${sc.severity_indicators.join(", ")}`
    ).join("\n\n") || "";

    // Call OpenAI API for analysis
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const systemPrompt = `You are a medical AI assistant that analyzes symptoms and provides preliminary health information. You must:
1. Analyze the provided symptoms carefully
2. Suggest possible conditions ranked by likelihood
3. Determine urgency level: normal, moderate, or critical
4. Provide preventive suggestions
5. Indicate when to seek medical help
6. Always remind users this is not a diagnosis and they should consult healthcare professionals

Medical Knowledge Base:
${medicalContext}

User context: ${userAge ? `Age: ${userAge}` : "Age unknown"}, ${medicalHistory ? `Medical history: ${medicalHistory}` : "No medical history provided"}

Respond in JSON format with this structure:
{
  "possibleConditions": [{"condition": "name", "probability": "high/medium/low", "description": "brief explanation"}],
  "urgencyLevel": "normal/moderate/critical",
  "preventiveSuggestions": ["suggestion1", "suggestion2"],
  "whenToSeekHelp": ["sign1", "sign2"],
  "generalAdvice": "overall advice"
}`;

    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze these symptoms: ${symptomsText}` }
        ],
        temperature: 0.7,
        response_format: { type: "json_object" }
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error("OpenAI API error:", errorData);
      throw new Error("Failed to analyze symptoms with AI");
    }

    const openaiData = await openaiResponse.json();
    const analysisResult: AnalysisResult = JSON.parse(openaiData.choices[0].message.content);

    // Store analysis in database
    const { data: analysis, error: insertError } = await supabaseClient
      .from("symptom_analyses")
      .insert({
        user_id: user.id,
        symptoms_text: symptomsText,
        analysis_result: analysisResult,
        urgency_level: analysisResult.urgencyLevel,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Database insert error:", insertError);
      throw new Error("Failed to store analysis");
    }

    return new Response(
      JSON.stringify({ success: true, analysis: { ...analysis, analysis_result: analysisResult } }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in analyze-symptoms:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : "An unexpected error occurred" 
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});