import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/navigation";
import CompletedExercises from "@/components/completed-exercises";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function CompletedExercisesPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <h1 className="text-xl font-semibold text-foreground mb-2">Dostęp zabroniony</h1>
            <p className="text-muted-foreground">Zaloguj się, aby zobaczyć swoje ukończone ćwiczenia.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm" data-testid="button-back-to-dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Powrót do panelu
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground" data-testid="text-page-title">
                Ukończone ćwiczenia
              </h1>
              <p className="text-muted-foreground">
                Przeglądaj swój postęp i spostrzenie z ukończonych ćwiczeń terapeutycznych
              </p>
            </div>
          </div>
        </div>

        {/* Completed Exercises Component */}
        <CompletedExercises />
      </main>
    </div>
  );
}