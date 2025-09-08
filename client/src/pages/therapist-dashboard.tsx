import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { UserPlus, Users, TrendingUp, Calendar } from "lucide-react";
import { Link } from "wouter";

export default function TherapistDashboard() {
  const { user } = useAuth();

  const { data: patients, isLoading } = useQuery({
    queryKey: ["/api/therapist/patients"],
    enabled: user?.role === "therapist",
  });

  if (user?.role !== "therapist") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h1 className="text-xl font-semibold text-foreground mb-2">Access Denied</h1>
            <p className="text-muted-foreground">This dashboard is only available to therapists.</p>
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
                Therapist Dashboard
              </h1>
              <p className="text-muted-foreground">
                Monitor patient progress and manage your practice
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Select>
                <SelectTrigger className="w-40" data-testid="select-filter">
                  <SelectValue placeholder="All Patients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Patients</SelectItem>
                  <SelectItem value="high-priority">High Priority</SelectItem>
                  <SelectItem value="recent-activity">Recent Activity</SelectItem>
                </SelectContent>
              </Select>
              <Button data-testid="button-add-patient">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Patient
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-muted/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-primary" />
                <h3 className="font-medium text-foreground">Total Patients</h3>
              </div>
              <p className="text-2xl font-bold text-foreground mt-2" data-testid="stat-total-patients">
                {patients?.length || 0}
              </p>
            </div>
            <div className="bg-muted/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-accent" />
                <h3 className="font-medium text-foreground">Active Today</h3>
              </div>
              <p className="text-2xl font-bold text-foreground mt-2" data-testid="stat-active-today">
                0
              </p>
            </div>
            <div className="bg-muted/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-secondary" />
                <h3 className="font-medium text-foreground">Sessions Today</h3>
              </div>
              <p className="text-2xl font-bold text-foreground mt-2" data-testid="stat-sessions-today">
                0
              </p>
            </div>
            <div className="bg-muted/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-destructive" />
                <h3 className="font-medium text-foreground">Need Attention</h3>
              </div>
              <p className="text-2xl font-bold text-foreground mt-2" data-testid="stat-need-attention">
                0
              </p>
            </div>
          </div>
        </section>

        {/* Patients Grid */}
        <section>
          <h2 className="text-xl font-semibold text-foreground mb-6">Your Patients</h2>
          
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
                  No patients yet
                </h3>
                <p className="text-muted-foreground mb-4">
                  Start building your patient list by adding your first patient.
                </p>
                <Button data-testid="button-add-first-patient">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add First Patient
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
                        <span className="text-xs text-muted-foreground">Active</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Last session:</span>
                        <span className="text-foreground">No sessions yet</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Current mood:</span>
                        <span className="text-foreground flex items-center">
                          <span className="w-2 h-2 bg-muted rounded-full mr-1"></span>
                          Not tracked
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Shared items:</span>
                        <span className="text-primary font-medium">0 new</span>
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
                          View Progress
                        </Button>
                      </Link>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1" 
                        data-testid={`button-schedule-${patient.id}`}
                      >
                        Schedule
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
