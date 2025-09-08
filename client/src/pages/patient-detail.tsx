import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/navigation";
import MoodChart from "@/components/mood-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { ArrowLeft, User, Calendar, FileText, Share, TrendingUp } from "lucide-react";

export default function PatientDetail() {
  const { user } = useAuth();
  const params = useParams();
  const [location] = useLocation();
  
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
  
  const sharedSchemas = sharedData?.abcSchemas || [];

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
              <span>Shared ABC Thought Records ({sharedSchemas.length})</span>
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
                          ABC Thought Record
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(schema.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
                      <div>
                        <label className="font-medium text-foreground">A - Activating Event:</label>
                        <p className="text-muted-foreground mt-1">{schema.activatingEvent}</p>
                      </div>
                      <div>
                        <label className="font-medium text-foreground">B - Beliefs:</label>
                        <p className="text-muted-foreground mt-1">{schema.beliefs}</p>
                      </div>
                      <div>
                        <label className="font-medium text-foreground">C - Consequences:</label>
                        <p className="text-muted-foreground mt-1">{schema.consequences}</p>
                      </div>
                    </div>

                    {schema.analysis && (
                      <div className="mt-4 pt-4 border-t">
                        <label className="font-medium text-foreground">Analysis:</label>
                        <div className="mt-2 space-y-2">
                          {schema.analysis.distortions?.map((distortion: any, idx: number) => (
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
                  No shared thought records yet
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}