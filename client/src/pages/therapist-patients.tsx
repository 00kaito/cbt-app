import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, UserPlus, User, Activity, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  latestMood?: number | null;
  newItemsSinceLastVisit: number;
}

export default function TherapistPatientsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [newPatientEmail, setNewPatientEmail] = useState("");

  const { data: patients = [], isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/therapist/patients"],
    enabled: user?.role === "therapist",
  });

  const addPatientMutation = useMutation({
    mutationFn: async (patientId: string) => {
      const response = await apiRequest("POST", "/api/therapist/patients", { patientId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/therapist/patients"] });
      setNewPatientEmail("");
      toast({
        title: "Pacjent dodany!",
        description: "Pacjent został pomyślnie przypisany do twojego konta.",
      });
    },
    onError: () => {
      toast({
        title: "Błąd",
        description: "Nie udało się dodać pacjenta. Spróbuj ponownie.",
        variant: "destructive",
      });
    },
  });

  const filteredPatients = patients.filter(patient =>
    `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMoodBadgeColor = (mood?: number | null) => {
    if (mood === null || mood === undefined) return "secondary";
    if (mood <= 3) return "destructive";
    if (mood <= 5) return "default";
    return "default";
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
      <div className="container mx-auto p-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Header */}
          <div className="w-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Pacjenci</h1>
                <p className="text-muted-foreground mt-1">
                  Zarządzaj swoimi pacjentami i monitoruj ich postępy
                </p>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Szukaj pacjentów..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                    data-testid="input-search-patients"
                  />
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div className="ml-2">
                      <p className="text-sm font-medium leading-none">Łączna liczba pacjentów</p>
                      <p className="text-2xl font-bold">{patients.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <div className="ml-2">
                      <p className="text-sm font-medium leading-none">Aktywni dziś</p>
                      <p className="text-2xl font-bold">{patients.filter(p => p.newItemsSinceLastVisit > 0).length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="ml-2">
                      <p className="text-sm font-medium leading-none">Nowych elementów</p>
                      <p className="text-2xl font-bold">{patients.reduce((sum, p) => sum + p.newItemsSinceLastVisit, 0)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Patients List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Lista pacjentów
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Ładowanie pacjentów...</p>
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      {searchTerm ? "Nie znaleziono pacjentów spełniających kryteria wyszukiwania." : "Nie masz jeszcze przypisanych pacjentów."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredPatients.map((patient) => (
                      <div key={patient.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{patient.firstName} {patient.lastName}</p>
                            <p className="text-sm text-muted-foreground">{patient.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {patient.latestMood !== null && patient.latestMood !== undefined && (
                            <Badge variant={getMoodBadgeColor(patient.latestMood)}>
                              Nastrój: {patient.latestMood}/10
                            </Badge>
                          )}
                          {patient.newItemsSinceLastVisit > 0 && (
                            <Badge variant="secondary">
                              {patient.newItemsSinceLastVisit} nowych
                            </Badge>
                          )}
                          <Link href={`/therapist/patient/${patient.id}`}>
                            <Button variant="outline" size="sm" data-testid={`button-view-patient-${patient.id}`}>
                              Zobacz szczegóły
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}