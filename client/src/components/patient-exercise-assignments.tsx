import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Clock, Play, BookOpen, CheckCircle, Calendar, Eye, User } from "lucide-react";
import { ExerciseAssignment, ExerciseTemplate, ExerciseCompletion, AbcSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import ExerciseCompletionModal from "./exercise-completion-modal";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PatientExerciseAssignments() {
  const [selectedAssignment, setSelectedAssignment] = useState<ExerciseAssignment & { template: ExerciseTemplate } | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAbcSchema, setSelectedAbcSchema] = useState<AbcSchema | null>(null);
  const [abcModalOpen, setAbcModalOpen] = useState(false);
  const { toast } = useToast();

  const { data: assignments, isLoading } = useQuery<(ExerciseAssignment & { template: ExerciseTemplate })[]>({
    queryKey: ["/api/exercise-assignments"],
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
      setSelectedAssignment(null);
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

  const handleStartExercise = (assignment: ExerciseAssignment & { template: ExerciseTemplate }) => {
    setSelectedAssignment(assignment);
    setModalOpen(true);
  };

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

  const isExerciseCompleted = (assignmentId: string) => {
    return completions?.some(completion => completion.exerciseId === assignmentId) || false;
  };

  const getCompletionCount = (assignmentId: string) => {
    return completions?.filter(completion => completion.exerciseId === assignmentId).length || 0;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Twoje przypisane ćwiczenia
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Twoje przypisane ćwiczenia
            {assignments && assignments.length > 0 && (
              <Badge variant="secondary" className="ml-auto">
                {assignments.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!assignments || assignments.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2" data-testid="text-no-assignments">
                Brak przypisanych ćwiczeń
              </h3>
              <p className="text-muted-foreground">
                Twój terapeuta nie przypisał Ci jeszcze żadnych ćwiczeń.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {assignments.map((assignment) => {
                const completed = isExerciseCompleted(assignment.id);
                const completionCount = getCompletionCount(assignment.id);
                
                return (
                  <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-foreground" data-testid={`assignment-title-${assignment.id}`}>
                                {assignment.template.title}
                              </h3>
                              {completed && (
                                <Badge variant="secondary" className="text-xs">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Ukończone
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {assignment.template.description}
                            </p>
                          </div>
                          <Button 
                            onClick={() => handleStartExercise(assignment)}
                            disabled={completed}
                            data-testid={`button-start-${assignment.id}`}
                          >
                            <Play className="h-4 w-4 mr-2" />
                            {completed ? "Ukończone" : "Rozpocznij"}
                          </Button>
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{assignment.template.estimatedDuration} min</span>
                            </div>
                            <span className="capitalize">{assignment.template.difficulty}</span>
                            <span className="text-xs bg-muted px-2 py-1 rounded">
                              {assignment.template.category}
                            </span>
                          </div>
                          {completionCount > 0 && (
                            <span className="text-xs text-primary">
                              Wykonane {completionCount} razy
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                          <div className="flex items-center space-x-2">
                            <User className="h-4 w-4" />
                            <span>Przypisane przez terapeutę</span>
                          </div>
                          <div className="flex items-center space-x-4">
                            <span>
                              {format(new Date(assignment.assignedAt), "dd.MM.yyyy", { locale: pl })}
                            </span>
                            {assignment.abcSchemaId && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewAbcSchema(assignment.abcSchemaId!)}
                                className="h-6 px-2 text-xs"
                                data-testid={`button-view-abc-${assignment.id}`}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Zobacz ABC
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exercise Completion Modal */}
      <ExerciseCompletionModal
        exercise={selectedAssignment?.template || null}
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedAssignment(null);
        }}
        onComplete={(data) => {
          // Use the assignment ID instead of template ID for tracking
          completeExerciseMutation.mutate({
            ...data,
            exerciseId: selectedAssignment!.id,
          });
        }}
        isLoading={completeExerciseMutation.isPending}
      />

      {/* ABC Schema Modal */}
      <Dialog open={abcModalOpen} onOpenChange={setAbcModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Powiązany zapis myślowy ABC</DialogTitle>
            <DialogDescription>
              Zapis ABC powiązany z tym ćwiczeniem
            </DialogDescription>
          </DialogHeader>

          {selectedAbcSchema && (
            <div className="space-y-4">
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

              <div className="flex items-center space-x-4 text-sm text-muted-foreground border-t pt-4">
                <span>Nastrój przed: {selectedAbcSchema.moodBefore}/7</span>
                <span>Data utworzenia: {format(new Date(selectedAbcSchema.createdAt), "dd.MM.yyyy HH:mm", { locale: pl })}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}