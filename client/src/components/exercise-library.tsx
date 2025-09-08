import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Clock, Play, BookOpen } from "lucide-react";
import { Exercise } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import ExerciseCompletionModal from "./exercise-completion-modal";

export default function ExerciseLibrary() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const { toast } = useToast();

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
        title: "Exercise completed!",
        description: "Your progress has been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save exercise completion.",
        variant: "destructive",
      });
    },
  });

  const handleStartExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setModalOpen(true);
  };

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
    {
      id: "mindfulness-exercise",
      title: "Mindfulness Breathing",
      description: "Practice present-moment awareness through focused breathing",
      instructions: "Focus on your breath for 5-10 minutes. When your mind wanders, gently return attention to breathing.",
      category: "Mindfulness",
      targetDistortions: ["emotional-reasoning", "worry"],
      estimatedDuration: 10,
      difficulty: "easy",
    },
  ];

  const displayExercises = exercises || mockExercises;
  const categories = Array.from(new Set(displayExercises.map(ex => ex.category)));

  const filteredExercises = selectedCategory === "all" 
    ? displayExercises 
    : displayExercises.filter(ex => ex.category === selectedCategory);

  return (
    <section className="bg-card rounded-lg shadow-sm border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground" data-testid="text-exercise-library-title">
          Exercise Library
        </h2>
        <div className="flex space-x-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
            data-testid="filter-all"
          >
            All
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
            No exercises available
          </h3>
          <p className="text-muted-foreground">
            Exercise library is being populated. Check back soon!
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
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      {exercise.estimatedDuration} minutes
                    </span>
                  </div>
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Category:</span>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {exercise.category}
                    </Badge>
                  </div>
                  {exercise.targetDistortions && exercise.targetDistortions.length > 0 && (
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">Targets:</span>
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
                  Start Exercise
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
  );
}
