import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, Clock, TrendingUp, Brain } from "lucide-react";
import { format } from "date-fns";
import { ExerciseCompletion, Exercise, TherapistExercise } from "@shared/schema";

type CompletedExercise = ExerciseCompletion & { exercise: Exercise | TherapistExercise };

export default function CompletedExercises() {
  const { data: completedExercises, isLoading } = useQuery<CompletedExercise[]>({
    queryKey: ["/api/exercise-completions-with-exercise"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Completed Exercises
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
              No completed exercises yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Complete exercises from AI recommendations or your Exercise Library
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
                  <p className="text-sm font-medium text-foreground mb-2">Exercise Instructions:</p>
                  <p className="text-sm text-muted-foreground" data-testid="exercise-instructions">
                    {completion.exercise.instructions}
                  </p>
                </div>

                {/* Patient Response */}
                <div className="bg-accent/10 rounded-md p-3">
                  <p className="text-sm font-medium text-foreground mb-2">Your Response:</p>
                  <p className="text-sm text-foreground" data-testid="patient-response">
                    {completion.response}
                  </p>
                </div>

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
                          Mood: {completion.moodBefore} → {completion.moodAfter}
                        </span>
                      </div>
                    )}
                    {completion.effectiveness !== undefined && (
                      <Badge variant="secondary" data-testid="effectiveness">
                        {Math.round(completion.effectiveness * 100)}% effective
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground" data-testid="completion-date">
                    {format(new Date(completion.completedAt), "MMM d, yyyy 'at' h:mm a")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}