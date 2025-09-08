import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/navigation";
import MoodScale from "@/components/mood-scale";
import ABCSchemaForm from "@/components/abc-schema-form";
import AIAnalysis from "@/components/ai-analysis";
import MoodChart from "@/components/mood-chart";
import ExerciseLibrary from "@/components/exercise-library";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Brain, Edit, Share } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();

  const { data: recentActivities } = useQuery({
    queryKey: ["/api/exercise-completions"],
    enabled: !!user,
  });

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Quick Mood Entry */}
        <section className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Jak się dzisiaj czujesz?</h2>
            <span className="text-sm text-muted-foreground" data-testid="text-current-date">
              {format(new Date(), "MMMM d, yyyy")}
            </span>
          </div>
          
          <MoodScale />
        </section>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mood Chart */}
          <div className="lg:col-span-2">
            <MoodChart />
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-recent-activity">Ostatnia aktywność</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentActivities?.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground" data-testid="text-no-activity">
                    Brak ostatniej aktywności
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Rozpocznij od śledzenia nastroju lub wykonania ćwiczenia
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-start space-x-3" data-testid="activity-item">
                    <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Brain className="text-accent text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">Completed: Thought Challenging</p>
                      <p className="text-xs text-muted-foreground">Mood improved from 3 to 6</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3" data-testid="activity-item">
                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Edit className="text-primary text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">ABC Schema Created</p>
                      <p className="text-xs text-muted-foreground">Work stress incident</p>
                      <p className="text-xs text-muted-foreground">Yesterday</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3" data-testid="activity-item">
                    <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Share className="text-secondary text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">Shared with Therapist</p>
                      <p className="text-xs text-muted-foreground">3 mood entries & 1 exercise</p>
                      <p className="text-xs text-muted-foreground">2 days ago</p>
                    </div>
                  </div>
                </>
              )}
              
              <Button variant="ghost" size="sm" className="w-full mt-4" data-testid="button-view-all-activity">
                View all activity
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* ABC Schema Form */}
        <ABCSchemaForm />

        {/* AI Analysis */}
        <AIAnalysis />


        {/* Exercise Library */}
        <ExerciseLibrary />
      </main>
    </div>
  );
}
