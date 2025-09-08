import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/navigation";
import ExerciseCreationModal from "@/components/exercise-creation-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation } from "@tanstack/react-query";
import { UserPlus, Users, TrendingUp, Calendar, Plus, BookOpen, Clock, Edit, Trash2, Eye, Brain } from "lucide-react";
import { Link } from "wouter";
import { User, AbcSchema, ExerciseCompletion, Exercise, TherapistExercise } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function TherapistDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null);
  const [selectedAbcSchema, setSelectedAbcSchema] = useState<AbcSchema | null>(null);
  const [abcModalOpen, setAbcModalOpen] = useState(false);
  const [abcExercises, setAbcExercises] = useState<(ExerciseCompletion & { exercise: Exercise | TherapistExercise })[]>([]);

  const { data: patients, isLoading } = useQuery<User[]>({
    queryKey: ["/api/therapist/patients"],
    enabled: user?.role === "therapist",
  });

  const { data: therapistExercises, isLoading: exercisesLoading } = useQuery({
    queryKey: ["/api/therapist/exercises"],
    enabled: user?.role === "therapist",
  });

  const createExerciseMutation = useMutation({
    mutationFn: async (exerciseData: any) => {
      const res = await apiRequest("POST", "/api/therapist/exercises", exerciseData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/therapist/exercises"] });
      setIsExerciseModalOpen(false);
      toast({
        title: "Ćwiczenie utworzone!",
        description: "Ćwiczenie zostało przypisane wybranemu pacjentowi.",
      });
    },
    onError: () => {
      toast({
        title: "Błąd",
        description: "Nie udało się utworzyć ćwiczenia. Spróbuj ponownie.",
        variant: "destructive",
      });
    },
  });

  const handleViewAbcSchemas = async (patient: User) => {
    try {
      // Fetch patient's ABC schemas - display them in a modal or navigate to a page
      window.location.href = `/therapist/patient/${patient.id}#abc-schemas`;
    } catch (error) {
      console.error("Failed to navigate to ABC schemas:", error);
    }
  };

  const handleViewAbcDetails = async (abcSchema: AbcSchema) => {
    try {
      // Fetch exercises related to this ABC schema
      const response = await fetch(`/api/abc-schemas/${abcSchema.id}/exercises`);
      if (response.ok) {
        const exercises = await response.json();
        setAbcExercises(exercises);
        setSelectedAbcSchema(abcSchema);
        setAbcModalOpen(true);
      }
    } catch (error) {
      console.error("Failed to fetch related exercises:", error);
    }
  };

  if (user?.role !== "therapist") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h1 className="text-xl font-semibold text-foreground mb-2">Dostęp zabroniony</h1>
            <p className="text-muted-foreground">Ten panel jest dostępny tylko dla terapeutów.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Header */}
        <section className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground" data-testid="text-dashboard-title">
                Panel terapeuty
              </h1>
              <p className="text-muted-foreground">
                Monitoruj postępy pacjentów i zarządzaj praktyką
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Select>
                <SelectTrigger className="w-40" data-testid="select-filter">
                  <SelectValue placeholder="Wszyscy pacjenci" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszyscy pacjenci</SelectItem>
                  <SelectItem value="high-priority">Wysoki priorytet</SelectItem>
                  <SelectItem value="recent-activity">Ostatnia aktywność</SelectItem>
                </SelectContent>
              </Select>
              <Button data-testid="button-add-patient">
                <UserPlus className="h-4 w-4 mr-2" />
                Dodaj pacjenta
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-muted/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="font-medium text-foreground">Wszyscy pacjenci</h3>
              </div>
              <p className="text-2xl font-bold text-foreground mt-2" data-testid="stat-total-patients">
                {patients?.length || 0}
              </p>
            </div>
            <div className="bg-muted/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                <h3 className="font-medium text-foreground">Aktywni dzisiaj</h3>
              </div>
              <p className="text-2xl font-bold text-foreground mt-2" data-testid="stat-active-today">
                0
              </p>
            </div>
            <div className="bg-muted/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-secondary" />
                <h3 className="font-medium text-foreground">Sesje dzisiaj</h3>
              </div>
              <p className="text-2xl font-bold text-foreground mt-2" data-testid="stat-sessions-today">
                0
              </p>
            </div>
            <div className="bg-muted/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-destructive" />
                <h3 className="font-medium text-foreground">Wymagają uwagi</h3>
              </div>
              <p className="text-2xl font-bold text-foreground mt-2" data-testid="stat-need-attention">
                0
              </p>
            </div>
          </div>
        </section>

        {/* Patients Grid */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6">Twoi pacjenci</h2>
          
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-muted/20 rounded-lg p-4 animate-pulse">
                  <div className="h-20 bg-muted rounded"></div>
                </div>
              ))}
            </div>
          ) : patients?.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2" data-testid="text-no-patients">
                  Brak pacjentów
                </h3>
                <p className="text-muted-foreground mb-4">
                  Rozpocznij budowanie listy pacjentów, dodając pierwszego pacjenta.
                </p>
                <Button data-testid="button-add-first-patient">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Dodaj pierwszego pacjenta
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {patients?.map((patient) => (
                <Card key={patient.id} className="hover:shadow-md transition-shadow cursor-pointer" data-testid={`card-patient-${patient.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-primary-foreground font-medium text-sm">
                            {patient.firstName[0]}{patient.lastName[0]}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground" data-testid={`text-patient-name-${patient.id}`}>
                            {patient.firstName} {patient.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground">ID: #{patient.id.slice(-6)}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className="w-2 h-2 bg-accent rounded-full"></div>
                        <span className="text-xs text-muted-foreground">Aktywny</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Ostatnia sesja:</span>
                        <span className="text-foreground">Brak sesji</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Obecny nastrój:</span>
                        <span className="text-foreground flex items-center">
                          {patient.latestMood ? (
                            <>
                              <span 
                                className={`w-2 h-2 rounded-full mr-1 ${
                                  patient.latestMood.value >= 7 ? 'bg-green-500' :
                                  patient.latestMood.value >= 4 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                              ></span>
                              {patient.latestMood.value}/10
                            </>
                          ) : (
                            <>
                              <span className="w-2 h-2 bg-muted rounded-full mr-1"></span>
                              Nie śledzony
                            </>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Udostępnione elementy:</span>
                        <span className="text-primary font-medium">
                          {patient.newItemsSinceLastVisit || 0} nowych
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      <Link href={`/therapist/patient/${patient.id}`} className="flex-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full" 
                          data-testid={`button-view-progress-${patient.id}`}
                        >
                          Zobacz postępy
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Exercise Management Section */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Zarządzanie ćwiczeniami</h2>
            <Button 
              onClick={() => setIsExerciseModalOpen(true)}
              data-testid="button-create-exercise"
            >
              <Plus className="h-4 w-4 mr-2" />
              Utwórz ćwiczenie
            </Button>
          </div>
          
          {exercisesLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              </CardContent>
            </Card>
          ) : !therapistExercises || therapistExercises.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2" data-testid="text-no-exercises">
                    No exercises created yet
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    Create custom exercises to assign to your patients for therapeutic progress.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsExerciseModalOpen(true)}
                    data-testid="button-create-first-exercise"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Exercise
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {therapistExercises.map((exercise) => {
                const assignedPatient = patients?.find(p => p.id === exercise.patientId);
                
                return (
                  <Card key={exercise.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium text-foreground" data-testid={`exercise-title-${exercise.id}`}>
                              {exercise.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {exercise.description}
                            </p>
                          </div>
                          <div className="flex items-center space-x-1 ml-4">
                            <Button variant="ghost" size="sm" data-testid={`button-edit-${exercise.id}`}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" data-testid={`button-delete-${exercise.id}`}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-4 w-4" />
                              <span>{exercise.estimatedDuration} min</span>
                            </div>
                            <span className="capitalize">{exercise.difficulty}</span>
                          </div>
                          <span className="text-xs bg-muted px-2 py-1 rounded">
                            {exercise.category}
                          </span>
                        </div>

                        {assignedPatient && (
                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center space-x-2">
                              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                <span className="text-primary-foreground text-xs">
                                  {assignedPatient.firstName[0]}{assignedPatient.lastName[0]}
                                </span>
                              </div>
                              <span className="text-sm text-foreground">
                                {assignedPatient.firstName} {assignedPatient.lastName}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {new Date(exercise.createdAt).toLocaleDateString('pl-PL')}
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      </main>

      {/* Exercise Creation Modal */}
      <ExerciseCreationModal
        isOpen={isExerciseModalOpen}
        onClose={() => setIsExerciseModalOpen(false)}
        onSubmit={(data) => createExerciseMutation.mutate(data)}
        patients={patients || []}
        isLoading={createExerciseMutation.isPending}
      />

      {/* ABC Schema Modal */}
      <Dialog open={abcModalOpen} onOpenChange={setAbcModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Zapis myślowy ABC - Powiązane ćwiczenia</DialogTitle>
            <DialogDescription>
              Szczegóły zapisu ABC pacjenta oraz wykonane ćwiczenia powiązane z tym zapisem
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

                <div className="flex items-center space-x-4 text-sm text-muted-foreground border-t pt-4">
                  <span>Nastrój przed: {selectedAbcSchema.moodBefore}/7</span>
                  <span>Data utworzenia: {format(new Date(selectedAbcSchema.createdAt), "dd.MM.yyyy HH:mm", { locale: pl })}</span>
                </div>
              </div>

              {/* AI Analysis Results */}
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

              {/* Related Exercises */}
              {abcExercises && abcExercises.length > 0 && (
                <div className="space-y-4 border-t pt-6">
                  <h3 className="font-semibold text-foreground">Wykonane ćwiczenia powiązane z tym zapisem</h3>
                  <div className="space-y-3">
                    {abcExercises.map((completion) => (
                      <div key={completion.id} className="bg-primary/5 border border-primary/20 rounded p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground">{completion.exercise.title}</h4>
                            <p className="text-sm text-muted-foreground mt-1">{completion.exercise.description}</p>
                            <div className="flex items-center space-x-4 mt-2">
                              <span className="text-xs text-muted-foreground">
                                Nastrój przed: {completion.moodBefore}/7
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Nastrój po: {completion.moodAfter}/7
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(completion.completedAt), "dd.MM.yyyy HH:mm", { locale: pl })}
                              </span>
                            </div>
                            {completion.response && (
                              <div className="mt-3">
                                <p className="text-sm font-medium text-foreground">Odpowiedź pacjenta:</p>
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

              {(!abcExercises || abcExercises.length === 0) && (
                <div className="text-center py-6 border-t">
                  <p className="text-muted-foreground">Brak wykonanych ćwiczeń powiązanych z tym zapisem ABC</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
