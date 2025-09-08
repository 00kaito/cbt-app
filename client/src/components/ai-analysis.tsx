import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bot, AlertTriangle, ArrowRight, Info } from "lucide-react";
import { AbcSchema, Exercise } from "@shared/schema";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import ExerciseCompletionModal from "./exercise-completion-modal";

export default function AIAnalysis() {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: abcSchemas } = useQuery<AbcSchema[]>({
    queryKey: ["/api/abc-schemas"],
  });

  const { data: exercises } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  const completeExerciseMutation = useMutation({
    mutationFn: async (data: {
      exerciseId: string;
      response: string;
      moodBefore: number;
      moodAfter: number;
    }) => {
      const res = await apiRequest("POST", "/api/exercise-completions", {
        exerciseId: data.exerciseId,
        response: data.response,
        moodBefore: data.moodBefore,
        moodAfter: data.moodAfter,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercise-completions"] });
      setModalOpen(false);
      setSelectedExercise(null);
      toast({
        title: "Ćwiczenie ukończone!",
        description: "Twój postęp został zapisany.",
      });
    },
    onError: () => {
      toast({
        title: "Błąd",
        description: "Nie udało się zapisać ukończenia ćwiczenia.",
        variant: "destructive",
      });
    },
  });

  const handleStartExercise = (exerciseId: string) => {
    // Find exercise from the mock list or fetched exercises
    const mockExercises: Exercise[] = [
      {
        id: "evidence-examination",
        title: "Evidence Examination",
        description: "Examine the evidence for and against your negative thoughts",
        instructions: "List all evidence supporting your thought, then list evidence against it. Compare both lists objectively.",
        category: "Thought Challenging",
        targetDistortions: ["catastrophizing", "all-or-nothing-thinking"],
        estimatedDuration: 15,
        difficulty: "medium",
      },
      {
        id: "balanced-thinking",
        title: "Balanced Thinking",
        description: "Reframe negative thoughts into more balanced, realistic perspectives",
        instructions: "Take your negative thought and rewrite it in a more balanced, fair way that considers multiple perspectives.",
        category: "Cognitive Restructuring",
        targetDistortions: ["all-or-nothing-thinking", "mental-filter"],
        estimatedDuration: 10,
        difficulty: "easy",
      },
      {
        id: "thought-challenging",
        title: "Thought Challenging",
        description: "Question the validity and helpfulness of negative thoughts",
        instructions: "Ask yourself: Is this thought helpful? Is it realistic? What would I tell a friend having this thought?",
        category: "Thought Challenging",
        targetDistortions: ["overgeneralization", "mind-reading"],
        estimatedDuration: 12,
        difficulty: "medium",
      },
    ];

    const allExercises = [...(exercises || []), ...mockExercises];
    const exercise = allExercises.find(ex => ex.id === exerciseId);
    
    if (exercise) {
      setSelectedExercise(exercise);
      setModalOpen(true);
    }
  };

  // Get the most recent analyzed schema
  const latestAnalyzedSchema = abcSchemas?.find(schema => schema.analysisResults);

  if (!latestAnalyzedSchema?.analysisResults) {
    return null;
  }

  const { distortions, recommendations } = latestAnalyzedSchema.analysisResults;

  return (
    <section className="bg-card rounded-lg shadow-sm border border-border p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
          <Bot className="text-white h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground" data-testid="text-ai-analysis-title">
            Wyniki analizy AI
          </h2>
          <p className="text-sm text-muted-foreground">
            Wzorce poznawcze zidentyfikowane w Twoim zapisie myślowym
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Identified Distortions */}
        <div className="space-y-4">
          <h3 className="font-medium text-foreground" data-testid="text-distortions-title">
            Zidentyfikowane wzorce myślowe
          </h3>
          {distortions.length === 0 ? (
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <p className="text-muted-foreground" data-testid="text-no-distortions">
                Nie wykryto znaczących zniekształceń poznawczych.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {distortions.map((distortion, index) => (
                <div key={index} className="bg-muted/30 rounded-lg p-4" data-testid={`distortion-${index}`}>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-destructive/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="text-destructive text-sm" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-foreground">{distortion.type}</h4>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(distortion.confidence * 100)}% pewności
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{distortion.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Exercises */}
        <div className="space-y-4">
          <h3 className="font-medium text-foreground" data-testid="text-recommendations-title">
            Rekomendowane ćwiczenia
          </h3>
          {recommendations.length === 0 ? (
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <p className="text-muted-foreground" data-testid="text-no-recommendations">
                W tej chwili nie ma żadnych konkretnych ćwiczeń do polecenia.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="bg-accent/10 border border-accent/20 rounded-lg p-4" data-testid={`recommendation-${index}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground capitalize">
                        {rec.exerciseId.replace('-', ' ')}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">{rec.reason}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          15 min
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(rec.effectiveness * 100)}% skuteczność
                        </span>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      className="bg-accent hover:bg-accent/90 text-accent-foreground"
                      onClick={() => handleStartExercise(rec.exerciseId)}
                      data-testid={`button-start-exercise-${index}`}
                    >
                      Rozpocznij
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="text-sm text-muted-foreground flex items-center">
          <Info className="h-4 w-4 mr-1" />
          Te sugestie są oparte na zasadach terapii poznawczo-behawioralnej
        </div>
        <Button variant="ghost" size="sm" data-testid="button-view-exercise-library">
          Zobacz bibliotekę ćwiczeń <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      <ExerciseCompletionModal
        exercise={selectedExercise}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedExercise(null);
        }}
        onComplete={completeExerciseMutation.mutate}
        isLoading={completeExerciseMutation.isPending}
      />
    </section>
  );
}
