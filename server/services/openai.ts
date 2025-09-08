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
    Przeanalizuj następujący zapis myślowy ABC pod kątem zniekształceń poznawczych i udziel rekomendacji:

    A (Zdarzenie wyzwalające): ${activatingEvent}
    B (Przekonania/Myśli): ${beliefs}
    C (Konsekwencje): ${consequences}

    Proszę zidentyfikuj zniekształcenia poznawcze obecne w przekonaniach i podaj rekomendacje ćwiczeń. 
    Zwróć obiekt JSON o dokładnie tej strukturze:
    {
      "distortions": [
        {
          "type": "string (np. 'Katastrofizowanie', 'Myślenie wszystko albo nic')",
          "description": "string (krótkie wyjaśnienie jak to zniekształcenie ma zastosowanie)",
          "confidence": number (0-1, jak bardzo jesteś pewny że to zniekształcenie jest obecne)"
        }
      ],
      "recommendations": [
        {
          "exerciseId": "string (ID rekomendowanego ćwiczenia)",
          "reason": "string (dlaczego to ćwiczenie jest rekomendowane)",
          "effectiveness": number (0-1, oczekiwana skuteczność dla tego przypadku)"
        }
      ]
    }

    Powszechne zniekształcenia poznawcze do wyszukania:
    - Myślenie wszystko albo nic
    - Nadmiernie uogólnianie
    - Filtr mentalny
    - Dyskwalifikowanie pozytywów
    - Wyciąganie pochopnych wniosków
    - Powiększanie/Pomniejszanie
    - Rozumowanie emocjonalne
    - Stwierdzenia "powinienem"
    - Etykietowanie
    - Personalizacja
    - Katastrofizowanie

    ID ćwiczeń do polecenia:
    - "evidence-examination"
    - "balanced-thinking"
    - "thought-challenging"
    - "perspective-taking"
    - "behavioral-activation"
    - "mindfulness-exercise"
    - "worry-time"
    - "pros-cons-analysis"
    
    Odpowiedź udziel w języku polskim.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "Jesteś ekspertem terapii poznawczo-behawioralnej, który analizuje wzorce myślowe i rekomenduje odpowiednie interwencje. Odpowiadaj w języku polskim."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
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
    Wygeneruj spersonalizowaną treść dla ćwiczenia CBT typu ${exerciseType} na podstawie tego kontekstu użytkownika:
    ${userContext}

    Podaj konkretne, praktyczne wskazówki dostosowane do ich sytuacji. Zrób to praktyczne i łatwe do wykonania.
    Odpowiedz w języku polskim.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: "Jesteś terapeuą CBT tworzącym spersonalizowane ćwiczenia dla pacjentów. Odpowiadaj w języku polskim."
        },
        {
          role: "user",
          content: prompt
        }
      ],
    });

    return response.choices[0].message.content || "";
  } catch (error) {
    console.error("Error generating exercise content:", error);
    throw new Error("Failed to generate exercise content");
  }
}
