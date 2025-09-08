import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Clock, TrendingUp, Brain, Eye } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { ExerciseCompletion, Exercise, TherapistExercise, AbcSchema } from "@shared/schema";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type CompletedExercise = ExerciseCompletion & { exercise: Exercise | TherapistExercise };

export default function CompletedExercises() {
  const [selectedAbcSchema, setSelectedAbcSchema] = useState<AbcSchema | null>(null);
  const [abcModalOpen, setAbcModalOpen] = useState(false);
  
  const { data: completedExercises, isLoading } = useQuery<CompletedExercise[]>({
    queryKey: ["/api/exercise-completions-with-exercise"],
  });

  const handleViewAbcSchema = async (abcSchemaId: string) => {
    try {
      const response = await fetch(`/api/abc-schemas/${abcSchemaId}`);
      if (response.ok) {
        const abcSchema = await response.json();
        setSelectedAbcSchema(abcSchema);
        setAbcModalOpen(true);
      }
    } catch (error) {
      console.error("Failed to fetch ABC schema:", error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Ukończone ćwiczenia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          Completed Exercises
          {completedExercises && completedExercises.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {completedExercises.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!completedExercises || completedExercises.length === 0 ? (
          <div className="text-center py-8">
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground" data-testid="text-no-completed-exercises">
              Brak ukończonych ćwiczeń
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Ukończ ćwiczenia z rekomendacji AI lub z biblioteki ćwiczeń
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {completedExercises.map((completion) => (
              <div
                key={completion.id}
                className="border border-border rounded-lg p-4 space-y-3"
                data-testid={`completed-exercise-${completion.id}`}
              >
                {/* Exercise Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground" data-testid="exercise-title">
                      {completion.exercise.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1" data-testid="exercise-description">
                      {completion.exercise.description}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-4">
                    <Badge variant="outline" data-testid="exercise-category">
                      {completion.exercise.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {completion.exercise.estimatedDuration}min
                    </div>
                  </div>
                </div>

                {/* Exercise Instructions */}
                <div className="bg-muted/50 rounded-md p-3">
                  <p className="text-sm font-medium text-foreground mb-2">Instrukcje ćwiczenia:</p>
                  <p className="text-sm text-muted-foreground" data-testid="exercise-instructions">
                    {completion.exercise.instructions}
                  </p>
                </div>

                {/* Patient Response */}
                <div className="bg-accent/10 rounded-md p-3">
                  <p className="text-sm font-medium text-foreground mb-2">Twoja odpowiedź:</p>
                  <p className="text-sm text-foreground" data-testid="patient-response">
                    {completion.response}
                  </p>
                </div>

                {/* ABC Schema Link */}
                {completion.abcSchemaId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-900">Powiązane z zapisem myślowym ABC</p>
                        <p className="text-xs text-blue-700">To ćwiczenie zostało wykonane w ramach analizy wzorców myślowych</p>
                      </div>
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewAbcSchema(completion.abcSchemaId!)}
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Zobacz ABC
                      </Button>
                    </div>
                  </div>
                )}

                {/* Mood Change & Metadata */}
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-4">
                    {completion.moodBefore && completion.moodAfter && (
                      <div className="flex items-center gap-2">
                        <TrendingUp 
                          className={`h-4 w-4 ${
                            completion.moodAfter > completion.moodBefore 
                              ? 'text-green-600' 
                              : completion.moodAfter < completion.moodBefore 
                                ? 'text-red-600' 
                                : 'text-gray-600'
                          }`} 
                        />
                        <span className="text-sm text-muted-foreground" data-testid="mood-change">
                          Nastrój: {completion.moodBefore} → {completion.moodAfter}
                        </span>
                      </div>
                    )}
                    {completion.effectiveness !== undefined && (
                      <Badge variant="secondary" data-testid="effectiveness">
                        {Math.round(completion.effectiveness * 100)}% skuteczności
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground" data-testid="completion-date">
                    {format(new Date(completion.completedAt), "dd.MM.yyyy HH:mm", { locale: pl })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* ABC Schema Modal */}
      <Dialog open={abcModalOpen} onOpenChange={setAbcModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Powiązany zapis myślowy ABC</DialogTitle>
            <DialogDescription>
              Szczegóły zapisu ABC, który doprowadził do wykonania ćwiczenia
            </DialogDescription>
          </DialogHeader>

          {selectedAbcSchema && (
            <div className="space-y-6">
              {/* ABC Schema Content */}
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                      <span className="text-primary font-semibold text-sm">A</span>
                    </div>
                    <h3 className="font-medium text-foreground">Zdarzenie wyzwalające</h3>
                  </div>
                  <p className="text-sm text-foreground bg-muted/30 p-3 rounded">
                    {selectedAbcSchema.activatingEvent}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center">
                      <span className="text-secondary font-semibold text-sm">B</span>
                    </div>
                    <h3 className="font-medium text-foreground">Przekonania i myśli</h3>
                  </div>
                  <p className="text-sm text-foreground bg-muted/30 p-3 rounded">
                    {selectedAbcSchema.beliefs}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                      <span className="text-accent font-semibold text-sm">C</span>
                    </div>
                    <h3 className="font-medium text-foreground">Konsekwencje</h3>
                  </div>
                  <p className="text-sm text-foreground bg-muted/30 p-3 rounded">
                    {selectedAbcSchema.consequences}
                  </p>
                </div>
              </div>

              {selectedAbcSchema.analysisResults && (
                <div className="space-y-4 border-t pt-6">
                  <h3 className="font-semibold text-foreground">Wyniki analizy AI</h3>
                  
                  {selectedAbcSchema.analysisResults.distortions?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-foreground mb-2">Wykryte zniekształcenia:</h4>
                      <div className="space-y-2">
                        {selectedAbcSchema.analysisResults.distortions.map((distortion, index) => (
                          <div key={index} className="bg-destructive/10 border border-destructive/20 rounded p-3">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-foreground">{distortion.type}</span>
                              <Badge variant="outline" className="text-xs">
                                {Math.round(distortion.confidence * 100)}% pewności
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">{distortion.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}