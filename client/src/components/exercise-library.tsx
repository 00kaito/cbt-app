import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Clock, Play, BookOpen, CheckCircle, Calendar } from "lucide-react";
import { Link } from "wouter";
import { TherapistExercise, ExerciseCompletion } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import ExerciseCompletionModal from "./exercise-completion-modal";

export default function ExerciseLibrary() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedExercise, setSelectedExercise] = useState<TherapistExercise | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: exercises } = useQuery<TherapistExercise[]>({
    queryKey: ["/api/patient/exercises"],
  });

  const { data: completions } = useQuery<ExerciseCompletion[]>({
    queryKey: ["/api/exercise-completions"],
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

  const handleStartExercise = (exercise: TherapistExercise) => {
    setSelectedExercise(exercise);
    setModalOpen(true);
  };

  // Use only exercises assigned by therapist
  const displayExercises = exercises || [];
  const categories = ["all", ...Array.from(new Set(displayExercises.map(ex => ex.category)))];

  const filteredExercises = selectedCategory === "all" 
    ? displayExercises 
    : displayExercises.filter(ex => ex.category === selectedCategory);

  return (
    <div className="space-y-8">

      {/* Available Exercises Section */}
      <section className="bg-card rounded-lg shadow-sm border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground" data-testid="text-exercise-library-title">
          Biblioteka ćwiczeń
        </h2>
        <div className="flex space-x-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
            data-testid="filter-all"
          >
            Wszystkie
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              data-testid={`filter-${category.toLowerCase().replace(' ', '-')}`}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {filteredExercises.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2" data-testid="text-no-exercises">
            Brak dostępnych ćwiczeń
          </h3>
          <p className="text-muted-foreground">
            Biblioteka ćwiczeń jest uzupełniana. Sprawdź ponownie wkrótce!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExercises.map((exercise) => (
            <Card key={exercise.id} className="hover:shadow-md transition-shadow" data-testid={`exercise-${exercise.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-lg">{exercise.title}</CardTitle>
                  <Badge variant="outline" className={`
                    ${exercise.difficulty === 'easy' ? 'bg-green-50 text-green-700' : 
                      exercise.difficulty === 'medium' ? 'bg-yellow-50 text-yellow-700' : 
                      'bg-red-50 text-red-700'}
                  `}>
                    {exercise.difficulty}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{exercise.description}</p>
                {exercise.instructions && (
                  <div className="mt-3 p-3 bg-muted/30 rounded-md">
                    <h4 className="text-sm font-medium text-foreground mb-2">Instrukcje:</h4>
                    <p className="text-sm text-foreground leading-relaxed">{exercise.instructions}</p>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {exercise.estimatedDuration} minut
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Kategoria:</span>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {exercise.category}
                    </Badge>
                  </div>
                  {exercise.targetDistortions && exercise.targetDistortions.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Cele:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {exercise.targetDistortions.slice(0, 2).map((distortion) => (
                          <Badge key={distortion} variant="outline" className="text-xs">
                            {distortion.replace('-', ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button 
                  className="w-full"
                  onClick={() => handleStartExercise(exercise)}
                  data-testid={`button-start-${exercise.id}`}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Rozpocznij ćwiczenie
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
    </div>
  );
}
