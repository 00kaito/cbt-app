import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface CognitiveDistortion {
  type: string;
  description: string;
  confidence: number;
}

export interface ExerciseRecommendation {
  exerciseId: string;
  reason: string;
  effectiveness: number;
}

export interface ABCAnalysisResult {
  distortions: CognitiveDistortion[];
  recommendations: ExerciseRecommendation[];
}

export async function analyzeABCSchema(
  activatingEvent: string,
  beliefs: string,
  consequences: string
): Promise<ABCAnalysisResult> {
  try {
    const prompt = `
    Analyze the following ABC thought record for cognitive distortions and provide recommendations:

    A (Activating Event): ${activatingEvent}
    B (Beliefs/Thoughts): ${beliefs}
    C (Consequences): ${consequences}

    Please identify cognitive distortions present in the beliefs and provide exercise recommendations. 
    Return a JSON object with this exact structure:
    {
      "distortions": [
        {
          "type": "string (e.g., 'Catastrophizing', 'All-or-Nothing Thinking')",
          "description": "string (brief explanation of how this distortion applies)",
          "confidence": number (0-1, how confident you are this distortion is present)"
        }
      ],
      "recommendations": [
        {
          "exerciseId": "string (ID of recommended exercise)",
          "reason": "string (why this exercise is recommended)",
          "effectiveness": number (0-1, expected effectiveness for this case)"
        }
      ]
    }

    Common cognitive distortions to look for:
    - All-or-Nothing Thinking
    - Overgeneralization
    - Mental Filter
    - Disqualifying the Positive
    - Jumping to Conclusions
    - Magnification/Minimization
    - Emotional Reasoning
    - Should Statements
    - Labeling
    - Personalization
    - Catastrophizing

    Exercise IDs to recommend from:
    - "evidence-examination"
    - "balanced-thinking"
    - "thought-challenging"
    - "perspective-taking"
    - "behavioral-activation"
    - "mindfulness-exercise"
    - "worry-time"
    - "pros-cons-analysis"
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a cognitive behavioral therapy expert who analyzes thought patterns and recommends appropriate interventions."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    
    return {
      distortions: result.distortions || [],
      recommendations: result.recommendations || []
    };
  } catch (error) {
    console.error("Error analyzing ABC schema:", error);
    throw new Error("Failed to analyze thought patterns");
  }
}

export async function generateExerciseContent(
  exerciseType: string,
  userContext: string
): Promise<string> {
  try {
    const prompt = `
    Generate personalized content for a ${exerciseType} CBT exercise based on this user context:
    ${userContext}

    Provide specific, actionable guidance tailored to their situation. Make it practical and easy to follow.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "You are a CBT therapist creating personalized exercises for patients."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Error generating exercise content:", error);
    throw new Error("Failed to generate exercise content");
  }
}
