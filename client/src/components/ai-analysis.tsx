import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Bot, AlertTriangle, ArrowRight, Info } from "lucide-react";
import { AbcSchema } from "@shared/schema";

export default function AIAnalysis() {
  const { data: abcSchemas } = useQuery<AbcSchema[]>({
    queryKey: ["/api/abc-schemas"],
  });

  // Get the most recent analyzed schema
  const latestAnalyzedSchema = abcSchemas?.find(schema => schema.analysisResults);

  if (!latestAnalyzedSchema?.analysisResults) {
    return null;
  }

  const { distortions, recommendations } = latestAnalyzedSchema.analysisResults;

  return (
    <section className="bg-card rounded-lg shadow-sm border border-border p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
          <Bot className="text-white h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground" data-testid="text-ai-analysis-title">
            AI Analysis Results
          </h2>
          <p className="text-sm text-muted-foreground">
            Cognitive patterns identified in your thought record
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Identified Distortions */}
        <div className="space-y-4">
          <h3 className="font-medium text-foreground" data-testid="text-distortions-title">
            Identified Thought Patterns
          </h3>
          {distortions.length === 0 ? (
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <p className="text-muted-foreground" data-testid="text-no-distortions">
                No significant cognitive distortions detected.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {distortions.map((distortion, index) => (
                <div key={index} className="bg-muted/30 rounded-lg p-4" data-testid={`distortion-${index}`}>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-destructive/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <AlertTriangle className="text-destructive text-sm" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-foreground">{distortion.type}</h4>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(distortion.confidence * 100)}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{distortion.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Exercises */}
        <div className="space-y-4">
          <h3 className="font-medium text-foreground" data-testid="text-recommendations-title">
            Recommended Exercises
          </h3>
          {recommendations.length === 0 ? (
            <div className="bg-muted/30 rounded-lg p-4 text-center">
              <p className="text-muted-foreground" data-testid="text-no-recommendations">
                No specific exercises recommended at this time.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="bg-accent/10 border border-accent/20 rounded-lg p-4" data-testid={`recommendation-${index}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground capitalize">
                        {rec.exerciseId.replace('-', ' ')}
                      </h4>
                      <p className="text-sm text-muted-foreground mt-1">{rec.reason}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          15 min
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(rec.effectiveness * 100)}% effectiveness
                        </span>
                      </div>
                    </div>
                    <Button 
                      size="sm"
                      className="bg-accent hover:bg-accent/90 text-accent-foreground"
                      data-testid={`button-start-exercise-${index}`}
                    >
                      Start
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-border">
        <div className="text-sm text-muted-foreground flex items-center">
          <Info className="h-4 w-4 mr-1" />
          These suggestions are based on cognitive behavioral therapy principles
        </div>
        <Button variant="ghost" size="sm" data-testid="button-view-exercise-library">
          View Exercise Library <ArrowRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </section>
  );
}
