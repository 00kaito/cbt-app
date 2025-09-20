import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Edit,
  Trash2,
  Share,
  Bot,
  Calendar,
  AlertTriangle,
  MoreVertical,
  Eye,
  ArrowRight,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AbcSchema, Exercise } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import ExerciseCompletionModal from "./exercise-completion-modal";

interface MyAbcSchemasProps {
  onEditSchema?: (schema: AbcSchema) => void;
}

export default function MyAbcSchemas({ onEditSchema }: MyAbcSchemasProps) {
  const { toast } = useToast();
  const [selectedSchema, setSelectedSchema] = useState<AbcSchema | null>(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [analyzingSchemas, setAnalyzingSchemas] = useState<Set<string>>(
    new Set(),
  );
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const { data: abcSchemas, isLoading } = useQuery<AbcSchema[]>({
    queryKey: ["/api/abc-schemas"],
  });

  const { data: exercises } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  const { data: relatedExercises } = useQuery<
    (ExerciseCompletion & { exercise: Exercise | TherapistExercise })[]
  >({
    queryKey: ["/api/abc-schemas", selectedSchema?.id, "exercises"],
    enabled: !!selectedSchema?.id && viewModalOpen,
  });

  // Fetch assigned therapist exercises for this patient
  const { data: patientExercises } = useQuery<any[]>({
    queryKey: ["/api/patient/exercises"],
    enabled: viewModalOpen,
  });

  const deleteAbcSchemaMutation = useMutation({
    mutationFn: async (schemaId: string) => {
      await apiRequest("DELETE", `/api/abc-schemas/${schemaId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/abc-schemas"] });
      toast({
        title: "Usunięto",
        description: "Zapis myślowy został usunięty.",
      });
    },
    onError: () => {
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć zapisu myślowego.",
        variant: "destructive",
      });
    },
  });

  const shareWithTherapistMutation = useMutation({
    mutationFn: async (schemaId: string) => {
      await apiRequest("POST", `/api/abc-schemas/${schemaId}/share`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/abc-schemas"] });
      toast({
        title: "Udostępniono",
        description: "Zapis myślowy został udostępniony terapeucie.",
      });
    },
    onError: () => {
      toast({
        title: "Błąd",
        description: "Nie udało się udostępnić zapisu myślowego.",
        variant: "destructive",
      });
    },
  });

  const analyzeAbcSchemaMutation = useMutation({
    mutationFn: async (schemaId: string) => {
      await apiRequest("POST", `/api/abc-schemas/${schemaId}/analyze`);
    },
    onSuccess: (_, schemaId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/abc-schemas"] });
      setAnalyzingSchemas((prev) => {
        const newSet = new Set(prev);
        newSet.delete(schemaId);
        return newSet;
      });
      toast({
        title: "Analiza zakończona",
        description: "Twoje wzorce myślowe zostały przeanalizowane.",
      });
    },
    onError: (_, schemaId) => {
      setAnalyzingSchemas((prev) => {
        const newSet = new Set(prev);
        newSet.delete(schemaId);
        return newSet;
      });
      toast({
        title: "Analiza nie powiodła się",
        description: "Nie udało się przeanalizować wzorców myślowych.",
        variant: "destructive",
      });
    },
  });

  const handleView = (schema: AbcSchema) => {
    setSelectedSchema(schema);
    setViewModalOpen(true);
  };

  const handleEdit = (schema: AbcSchema) => {
    if (onEditSchema) {
      onEditSchema(schema);
    }
  };

  const handleDelete = (schemaId: string) => {
    if (confirm("Czy na pewno chcesz usunąć ten zapis myślowy?")) {
      deleteAbcSchemaMutation.mutate(schemaId);
    }
  };

  const handleShare = (schemaId: string) => {
    shareWithTherapistMutation.mutate(schemaId);
  };

  const handleAnalyze = (schemaId: string) => {
    setAnalyzingSchemas((prev) => new Set(prev.add(schemaId)));
    analyzeAbcSchemaMutation.mutate(schemaId);
  };

  const handleStartExercise = (exerciseId: string) => {
    const exercise = exercises?.find((ex) => ex.id === exerciseId);
    if (exercise) {
      setSelectedExercise(exercise);
      setExerciseModalOpen(true);
    }
  };

  const completeExerciseMutation = useMutation({
    mutationFn: async (data: {
      exerciseId: string;
      response: string;
      moodBefore: number;
      moodAfter: number;
      abcSchemaId?: string;
    }) => {
      const res = await apiRequest("POST", "/api/exercise-completions", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/exercise-completions"],
      });
      setExerciseModalOpen(false);
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

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Moje myślowe ABC</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-muted/20 rounded-lg p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate pagination
  const totalItems = abcSchemas?.length || 0;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedSchemas = abcSchemas?.slice(startIndex, endIndex) || [];

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle data-testid="text-my-abc-schemas">
              Moje myślowe ABC
            </CardTitle>
            {totalItems > 0 && (
              <div className="text-sm text-muted-foreground">
                {startIndex + 1}-{Math.min(endIndex, totalItems)} z {totalItems}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!abcSchemas?.length ? (
            <div className="text-center py-8">
              <Edit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p
                className="text-muted-foreground"
                data-testid="text-no-abc-schemas"
              >
                Brak zapisanych myślowych ABC
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Twoje zapisane szkice i przeanalizowane zapisy pojawią się tutaj
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedSchemas.map((schema) => (
                <div
                  key={schema.id}
                  className="border rounded-lg p-4 hover:bg-muted/10 transition-colors"
                  data-testid={`abc-schema-${schema.id}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground truncate">
                        {schema.activatingEvent.length > 60
                          ? `${schema.activatingEvent.substring(0, 60)}...`
                          : schema.activatingEvent}
                      </h3>
                      <div className="flex items-center space-x-2 mt-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(new Date(schema.createdAt), "d MMM yyyy", {
                            locale: pl,
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {analyzingSchemas.has(schema.id) && (
                        <Badge
                          variant="secondary"
                          className="text-xs animate-pulse"
                        >
                          <div className="w-3 h-3 mr-1 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          Analizowanie...
                        </Badge>
                      )}
                      {!analyzingSchemas.has(schema.id) &&
                        schema.analysisResults && (
                          <Badge variant="secondary" className="text-xs">
                            <Bot className="h-3 w-3 mr-1" />
                            Przeanalizowane
                          </Badge>
                        )}
                      {schema.sharedWithTherapist && (
                        <Badge variant="outline" className="text-xs">
                          <Share className="h-3 w-3 mr-1" />
                          Udostępnione
                        </Badge>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            data-testid={`menu-${schema.id}`}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(schema)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Zobacz
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(schema)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edytuj
                          </DropdownMenuItem>
                          {/**
                         <DropdownMenuItem 
                            onClick={() => handleAnalyze(schema.id)}
                            disabled={analyzingSchemas.has(schema.id)}
                          >
                            {analyzingSchemas.has(schema.id) ? (
                              <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Bot className="h-4 w-4 mr-2" />
                            )}
                            {analyzingSchemas.has(schema.id) ? "Analizowanie..." : "Analizuj AI"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleShare(schema.id)}>
                            <Share className="h-4 w-4 mr-2" />
                            Udostępnij terapeucie
                          </DropdownMenuItem>
                          */}
                          <DropdownMenuItem
                            onClick={() => handleDelete(schema.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Usuń
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <span className="font-medium text-primary">A:</span>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {schema.activatingEvent.length > 50
                          ? `${schema.activatingEvent.substring(0, 50)}...`
                          : schema.activatingEvent}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-secondary">B:</span>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {schema.beliefs.length > 50
                          ? `${schema.beliefs.substring(0, 50)}...`
                          : schema.beliefs}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-accent">C:</span>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {schema.consequences.length > 50
                          ? `${schema.consequences.substring(0, 50)}...`
                          : schema.consequences}
                      </p>
                    </div>
                  </div>

                  {schema.analysisResults?.distortions &&
                    schema.analysisResults.distortions.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center space-x-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                          <span className="text-sm font-medium">
                            Wykryte wzorce:
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {schema.analysisResults.distortions
                            .slice(0, 3)
                            .map((distortion, index) => (
                              <Badge
                                key={index}
                                variant="destructive"
                                className="text-xs"
                              >
                                {distortion.type}
                              </Badge>
                            ))}
                          {schema.analysisResults.distortions.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{schema.analysisResults.distortions.length - 3}{" "}
                              więcej
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mt-6 pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Poprzednia
              </Button>
              <span className="text-sm text-muted-foreground">
                Strona {currentPage} z {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                Następna
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Schema Modal */}
      <Dialog open={viewModalOpen} onOpenChange={setViewModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Podgląd zapisu myślowego ABC</DialogTitle>
            <DialogDescription>
              {selectedSchema &&
                format(new Date(selectedSchema.createdAt), "d MMMM yyyy", {
                  locale: pl,
                })}
            </DialogDescription>
          </DialogHeader>

          {selectedSchema && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                      <span className="text-primary font-semibold text-sm">
                        A
                      </span>
                    </div>
                    <h3 className="font-medium text-foreground">
                      Zdarzenie wyzwalające
                    </h3>
                  </div>
                  <p className="text-sm text-foreground bg-muted/30 p-3 rounded">
                    {selectedSchema.activatingEvent}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center">
                      <span className="text-secondary font-semibold text-sm">
                        B
                      </span>
                    </div>
                    <h3 className="font-medium text-foreground">
                      Przekonania i myśli
                    </h3>
                  </div>
                  <p className="text-sm text-foreground bg-muted/30 p-3 rounded">
                    {selectedSchema.beliefs}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
                      <span className="text-accent font-semibold text-sm">
                        C
                      </span>
                    </div>
                    <h3 className="font-medium text-foreground">
                      Konsekwencje
                    </h3>
                  </div>
                  <p className="text-sm text-foreground bg-muted/30 p-3 rounded">
                    {selectedSchema.consequences}
                  </p>
                </div>
              </div>

              {selectedSchema.analysisResults && (
                <div className="space-y-4 border-t pt-6">
                  <h3 className="font-semibold text-foreground">
                    Wyniki analizy AI
                  </h3>

                  {selectedSchema.analysisResults.distortions?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-foreground mb-2">
                        Wykryte zniekształcenia:
                      </h4>
                      <div className="space-y-2">
                        {selectedSchema.analysisResults.distortions.map(
                          (distortion, index) => (
                            <div
                              key={index}
                              className="bg-destructive/10 border border-destructive/20 rounded p-3"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-medium text-foreground">
                                  {distortion.type}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(distortion.confidence * 100)}%
                                  pewności
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {distortion.description}
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {selectedSchema.analysisResults.recommendations?.length >
                    0 && (
                    <div>
                      <h4 className="font-medium text-foreground mb-2">
                        Rekomendowane ćwiczenia:
                      </h4>
                      <div className="space-y-2">
                        {selectedSchema.analysisResults.recommendations.map(
                          (rec, index) => (
                            <div
                              key={index}
                              className="bg-accent/10 border border-accent/20 rounded p-3"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <span className="font-medium text-foreground capitalize">
                                    {rec.exerciseId.replace("-", " ")}
                                  </span>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {rec.reason}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  className="bg-accent hover:bg-accent/90 text-accent-foreground ml-3"
                                  onClick={() =>
                                    handleStartExercise(rec.exerciseId)
                                  }
                                  data-testid={`button-start-exercise-${index}`}
                                >
                                  Rozpocznij
                                </Button>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Assigned Exercises for this ABC */}
              {selectedSchema &&
                patientExercises &&
                patientExercises.filter(
                  (ex) => ex.abcSchemaId === selectedSchema.id,
                ).length > 0 && (
                  <div className="space-y-4 border-t pt-6">
                    <h3 className="font-semibold text-foreground">
                      Ćwiczenia przypisane przez terapeutę
                    </h3>
                    <div className="space-y-3">
                      {patientExercises
                        .filter((ex) => ex.abcSchemaId === selectedSchema.id)
                        .map((exercise) => (
                          <div
                            key={exercise.id}
                            className="bg-accent/5 border border-accent/20 rounded p-3"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h4 className="font-medium text-foreground">
                                  {exercise.title}
                                </h4>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {exercise.description}
                                </p>
                                <div className="flex items-center space-x-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {exercise.category}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    ~{exercise.estimatedDuration} min
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {exercise.difficulty === "easy"
                                      ? "Łatwy"
                                      : exercise.difficulty === "medium"
                                        ? "Średni"
                                        : "Trudny"}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => {
                                  setSelectedExercise(exercise);
                                  setExerciseModalOpen(true);
                                }}
                                className="ml-3"
                              >
                                <ArrowRight className="h-4 w-4 mr-1" />
                                Wykonaj
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

              {/* Related Exercise Completions */}
              {relatedExercises && relatedExercises.length > 0 && (
                <div className="space-y-4 border-t pt-6">
                  <h3 className="font-semibold text-foreground">
                    Wykonane ćwiczenia powiązane z tym zapisem
                  </h3>
                  <div className="space-y-3">
                    {relatedExercises.map((completion) => (
                      <div
                        key={completion.id}
                        className="bg-primary/5 border border-primary/20 rounded p-3"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">
                              {completion.exercise.title}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              {completion.exercise.description}
                            </p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs text-muted-foreground">
                                Nastrój przed: {completion.moodBefore}/7
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Nastrój po: {completion.moodAfter}/7
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(
                                  new Date(completion.completedAt),
                                  "dd.MM.yyyy HH:mm",
                                  { locale: pl },
                                )}
                              </span>
                            </div>
                            {completion.response && (
                              <div className="mt-2">
                                <p className="text-sm font-medium text-foreground">
                                  Odpowiedź:
                                </p>
                                <p className="text-sm text-muted-foreground bg-muted/30 p-2 rounded mt-1">
                                  {completion.response}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                {selectedSchema && !selectedSchema.sharedWithTherapist && (
                  <Button
                    variant="outline"
                    onClick={() => handleShare(selectedSchema.id)}
                    disabled={shareWithTherapistMutation.isPending}
                    data-testid="button-share-from-modal"
                  >
                    <Share className="h-4 w-4 mr-2" />
                    {shareWithTherapistMutation.isPending
                      ? "Udostępnianie..."
                      : "Udostępnij terapeucie"}
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Exercise Completion Modal */}
      <ExerciseCompletionModal
        exercise={selectedExercise}
        isOpen={exerciseModalOpen}
        onClose={() => {
          setExerciseModalOpen(false);
          setSelectedExercise(null);
        }}
        onComplete={(data) => {
          completeExerciseMutation.mutate({
            ...data,
            abcSchemaId: selectedSchema?.id,
          });
        }}
        isLoading={completeExerciseMutation.isPending}
      />
    </>
  );
}
