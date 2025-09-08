import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/navigation";
import MoodChart from "@/components/mood-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { ArrowLeft, User, Calendar, FileText, Share, TrendingUp, CheckCircle, Clock, Eye, Activity } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

export default function PatientDetail() {
  const { user } = useAuth();
  const params = useParams();
  const [location] = useLocation();
  const [selectedAbcSchema, setSelectedAbcSchema] = useState<any>(null);
  const [abcExercises, setAbcExercises] = useState<any[]>([]);
  const [exerciseModalOpen, setExerciseModalOpen] = useState(false);
  
  // Extract patient ID from URL path
  const patientId = params.id || location.split('/').pop();
  
  // Fetch patient details
  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: ["/api/therapist/patient", patientId],
    enabled: user?.role === "therapist" && !!patientId,
  });

  // Fetch patient's mood entries
  const { data: moodEntries } = useQuery({
    queryKey: ["/api/therapist/patient", patientId, "mood-entries"],
    enabled: user?.role === "therapist" && !!patientId,
  });
  

  // Fetch shared ABC schemas
  const { data: sharedData } = useQuery({
    queryKey: ["/api/therapist/patient", patientId, "shared-data"],
    enabled: user?.role === "therapist" && !!patientId,
  });

  // Fetch patient's exercise completions
  const { data: exerciseCompletions } = useQuery({
    queryKey: ["/api/therapist/patient", patientId, "exercise-completions"],
    enabled: user?.role === "therapist" && !!patientId,
  });
  
  const sharedSchemas = sharedData?.abcSchemas || [];

  const handleViewAbcExercises = async (abcSchema: any) => {
    try {
      const response = await fetch(`/api/abc-schemas/${abcSchema.id}/exercises`);
      if (response.ok) {
        const exercises = await response.json();
        setAbcExercises(exercises);
        setSelectedAbcSchema(abcSchema);
        setExerciseModalOpen(true);
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
            <h1 className="text-xl font-semibold text-foreground mb-2">Access Denied</h1>
            <p className="text-muted-foreground">This page is only available to therapists.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (patientLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
            <div className="h-32 bg-muted rounded mb-6"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Card>
            <CardContent className="pt-6 text-center">
              <h1 className="text-xl font-semibold text-foreground mb-2">Patient Not Found</h1>
              <p className="text-muted-foreground mb-4">This patient is not assigned to you or does not exist.</p>
              <Link href="/therapist">
                <Button>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-4">
          <Link href="/therapist">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-patient-detail-title">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-muted-foreground">
              Patient ID: #{patient.id.slice(-6)}
            </p>
          </div>
        </div>

        {/* Patient Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Patient Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground">Name</label>
                <p className="text-sm text-muted-foreground mt-1">
                  {patient.firstName} {patient.lastName}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Email</label>
                <p className="text-sm text-muted-foreground mt-1">
                  {patient.email}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Status</label>
                <div className="mt-1">
                  <Badge variant="secondary" className="text-xs">
                    Active Patient
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mood Progress Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Mood Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {moodEntries && moodEntries.length > 0 ? (
              <div>
                <p className="text-sm text-muted-foreground mb-4">
                  Showing {moodEntries.length} mood entries for {patient?.firstName} {patient?.lastName}
                </p>
                <MoodChart moodEntries={moodEntries} />
              </div>
            ) : (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No mood data available yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Shared ABC Schemas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Share className="h-5 w-5" />
              <span>Udostępnione zapisy ABC ({sharedSchemas.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sharedSchemas && sharedSchemas.length > 0 ? (
              <div className="space-y-4">
                {sharedSchemas.map((schema: any) => (
                  <div key={schema.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-medium text-foreground">
                          Zapis myślowy ABC
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewAbcExercises(schema)}
                        >
                          <Activity className="h-4 w-4 mr-2" />
                          Zobacz powiązane ćwiczenia
                        </Button>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(schema.createdAt), "dd.MM.yyyy", { locale: pl })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
                      <div>
                        <label className="font-medium text-foreground">A - Zdarzenie wyzwalające:</label>
                        <p className="text-muted-foreground mt-1">{schema.activatingEvent}</p>
                      </div>
                      <div>
                        <label className="font-medium text-foreground">B - Przekonania:</label>
                        <p className="text-muted-foreground mt-1">{schema.beliefs}</p>
                      </div>
                      <div>
                        <label className="font-medium text-foreground">C - Konsekwencje:</label>
                        <p className="text-muted-foreground mt-1">{schema.consequences}</p>
                      </div>
                    </div>

                    {schema.analysisResults && (
                      <div className="mt-4 pt-4 border-t">
                        <label className="font-medium text-foreground">Analiza AI:</label>
                        <div className="mt-2 space-y-2">
                          {schema.analysisResults.distortions?.map((distortion: any, idx: number) => (
                            <div key={idx} className="text-sm">
                              <span className="font-medium text-orange-600">{distortion.type}</span>
                              <span className="text-muted-foreground"> - {distortion.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Share className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Brak udostępnionych zapisów myślowych
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exercise Completions Section - only therapist assigned exercises without ABC relationship */}
        {exerciseCompletions && exerciseCompletions.filter((completion: any) => !completion.abcSchemaId).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" data-testid="text-exercise-completions">
                <CheckCircle className="h-5 w-5" />
                <span>Ćwiczenia zlecone przez terapeutę ({exerciseCompletions.filter((completion: any) => !completion.abcSchemaId).length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {exerciseCompletions.filter((completion: any) => !completion.abcSchemaId).map((completion: any) => (
                <div
                  key={completion.id}
                  className="border rounded-lg p-4 space-y-3"
                  data-testid={`patient-exercise-completion-${completion.id}`}
                >
                  {/* Exercise Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-foreground" data-testid="exercise-title">
                        {completion.exercise?.title || "Exercise Completion"}
                      </h3>
                      {completion.exercise?.description && (
                        <p className="text-sm text-muted-foreground mt-1" data-testid="exercise-description">
                          {completion.exercise.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-4">
                      {completion.exercise?.category && (
                        <Badge variant="outline" data-testid="exercise-category">
                          {completion.exercise.category}
                        </Badge>
                      )}
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(completion.completedAt).toLocaleDateString('pl-PL')}
                      </div>
                    </div>
                  </div>

                  {/* Exercise Instructions */}
                  {completion.exercise?.instructions && (
                    <div className="bg-muted/50 rounded-md p-3">
                      <p className="text-sm font-medium text-foreground mb-2">Exercise Instructions:</p>
                      <p className="text-sm text-muted-foreground" data-testid="exercise-instructions">
                        {completion.exercise.instructions}
                      </p>
                    </div>
                  )}

                  {/* Patient Response */}
                  <div className="bg-accent/10 rounded-md p-3">
                    <p className="text-sm font-medium text-foreground mb-2">Patient Response:</p>
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
                    {completion.exercise?.estimatedDuration && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {completion.exercise.estimatedDuration}min
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

      {/* ABC Exercises Modal */}
      <Dialog open={exerciseModalOpen} onOpenChange={setExerciseModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ćwiczenia powiązane z zapisem ABC</DialogTitle>
            <DialogDescription>
              Ćwiczenia wykonane przez pacjenta w związku z tym zapisem myślowym
            </DialogDescription>
          </DialogHeader>

          {selectedAbcSchema && (
            <div className="space-y-6">
              {/* ABC Schema Summary */}
              <div className="bg-muted/30 rounded-lg p-4">
                <h3 className="font-medium text-foreground mb-3">Podsumowanie zapisu ABC:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-foreground">A - Zdarzenie:</span>
                    <p className="text-muted-foreground mt-1">{selectedAbcSchema.activatingEvent}</p>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">B - Przekonania:</span>
                    <p className="text-muted-foreground mt-1">{selectedAbcSchema.beliefs}</p>
                  </div>
                  <div>
                    <span className="font-medium text-foreground">C - Konsekwencje:</span>
                    <p className="text-muted-foreground mt-1">{selectedAbcSchema.consequences}</p>
                  </div>
                </div>
              </div>

              {/* Related Exercises */}
              {abcExercises && abcExercises.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Wykonane ćwiczenia:</h3>
                  {abcExercises.map((completion: any) => (
                    <div key={completion.id} className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{completion.exercise.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{completion.exercise.description}</p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {format(new Date(completion.completedAt), "dd.MM.yyyy HH:mm", { locale: pl })}
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        {completion.response && (
                          <div>
                            <p className="text-sm font-medium text-foreground">Odpowiedź pacjenta:</p>
                            <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded mt-1">
                              {completion.response}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-6 text-sm">
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
                              <span className="text-muted-foreground">
                                Nastrój: {completion.moodBefore} → {completion.moodAfter}
                              </span>
                            </div>
                          )}
                          {completion.effectiveness !== undefined && (
                            <Badge variant="secondary">
                              {Math.round(completion.effectiveness * 100)}% skuteczności
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Brak ćwiczeń powiązanych z tym zapisem ABC
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      </main>
    </div>
  );
}