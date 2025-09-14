import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar, Clock, User, Search, Plus } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  latestMood?: number | null;
  newItemsSinceLastVisit: number;
}

interface SessionSummary {
  patient: Patient;
  lastVisit?: string;
  newActivity: number;
  upcomingSession?: string;
}

export default function TherapistSessionsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: patients = [], isLoading } = useQuery<Patient[]>({
    queryKey: ["/api/therapist/patients"],
    enabled: user?.role === "therapist",
  });

  // Transform patients data into session summaries
  const sessions: SessionSummary[] = patients.map(patient => ({
    patient,
    newActivity: patient.newItemsSinceLastVisit,
    // For now, these are mock values - you can extend this based on your session tracking needs
    lastVisit: undefined,
    upcomingSession: undefined,
  }));

  const filteredSessions = sessions.filter(session =>
    `${session.patient.firstName} ${session.patient.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.patient.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalSessions = sessions.length;
  const activeSessions = sessions.filter(s => s.newActivity > 0).length;
  const totalNewActivity = sessions.reduce((sum, s) => sum + s.newActivity, 0);

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
                <h1 className="text-3xl font-bold text-foreground">Sesje</h1>
                <p className="text-muted-foreground mt-1">
                  Monitoruj aktywność pacjentów i planuj sesje terapeutyczne
                </p>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Szukaj sesji..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-64"
                    data-testid="input-search-sessions"
                  />
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div className="ml-2">
                      <p className="text-sm font-medium leading-none">Łączna liczba sesji</p>
                      <p className="text-2xl font-bold">{totalSessions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div className="ml-2">
                      <p className="text-sm font-medium leading-none">Aktywne dziś</p>
                      <p className="text-2xl font-bold">{activeSessions}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center">
                    <Plus className="h-4 w-4 text-muted-foreground" />
                    <div className="ml-2">
                      <p className="text-sm font-medium leading-none">Nowa aktywność</p>
                      <p className="text-2xl font-bold">{totalNewActivity}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sessions List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Przegląd sesji
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Ładowanie sesji...</p>
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      {searchTerm ? "Nie znaleziono sesji spełniających kryteria wyszukiwania." : "Nie masz jeszcze aktywnych sesji."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredSessions.map((session) => (
                      <div key={session.patient.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{session.patient.firstName} {session.patient.lastName}</p>
                            <p className="text-sm text-muted-foreground">{session.patient.email}</p>
                            {session.lastVisit && (
                              <p className="text-xs text-muted-foreground">
                                Ostatnia wizyta: {format(new Date(session.lastVisit), "dd MMM yyyy", { locale: pl })}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {session.patient.latestMood !== null && session.patient.latestMood !== undefined && (
                            <Badge variant="outline">
                              Nastrój: {session.patient.latestMood}/10
                            </Badge>
                          )}
                          {session.newActivity > 0 && (
                            <Badge variant="secondary">
                              {session.newActivity} nowych elementów
                            </Badge>
                          )}
                          <Link href={`/therapist/patient/${session.patient.id}`}>
                            <Button variant="outline" size="sm" data-testid={`button-view-session-${session.patient.id}`}>
                              Zobacz sesję
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