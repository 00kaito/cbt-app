import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Save, Share } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ABCSchemaForm() {
  const [formData, setFormData] = useState({
    activatingEvent: "",
    beliefs: "",
    consequences: "",
    moodBefore: 3,
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { toast } = useToast();

  const createAbcSchemaMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await apiRequest("POST", "/api/abc-schemas", data);
      return res.json();
    },
    onSuccess: (schema) => {
      queryClient.invalidateQueries({ queryKey: ["/api/abc-schemas"] });
      // Trigger analysis
      analyzeAbcSchema(schema.id);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save ABC schema. Please try again.",
        variant: "destructive",
      });
    },
  });

  const analyzeAbcSchema = async (schemaId: string) => {
    setIsAnalyzing(true);
    try {
      await apiRequest("POST", `/api/abc-schemas/${schemaId}/analyze`);
      queryClient.invalidateQueries({ queryKey: ["/api/abc-schemas"] });
      toast({
        title: "Analysis complete",
        description: "Your thought patterns have been analyzed.",
      });
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "Could not analyze thought patterns. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.activatingEvent || !formData.beliefs || !formData.consequences) {
      toast({
        title: "Missing information",
        description: "Please fill in all three sections (A, B, C).",
        variant: "destructive",
      });
      return;
    }

    createAbcSchemaMutation.mutate(formData);
  };

  const handleSaveDraft = () => {
    createAbcSchemaMutation.mutate(formData);
  };

  return (
    <section className="bg-card rounded-lg shadow-sm border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground" data-testid="text-abc-title">
          ABC Thought Record
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Before:</span>
          <Badge variant="destructive" data-testid="badge-mood-before">
            {formData.moodBefore}/10
          </Badge>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* A - Activating Event */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
              <span className="text-primary font-semibold text-sm">A</span>
            </div>
            <h3 className="font-medium text-foreground">Activating Event</h3>
          </div>
          <p className="text-sm text-muted-foreground">What happened? Describe the situation or event.</p>
          <Textarea
            placeholder="Describe what happened that triggered your thoughts and emotions..."
            value={formData.activatingEvent}
            onChange={(e) => setFormData(prev => ({ ...prev, activatingEvent: e.target.value }))}
            className="min-h-[100px]"
            data-testid="textarea-activating-event"
          />
        </div>

        {/* B - Beliefs */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-secondary/20 rounded-lg flex items-center justify-center">
              <span className="text-secondary font-semibold text-sm">B</span>
            </div>
            <h3 className="font-medium text-foreground">Beliefs & Thoughts</h3>
          </div>
          <p className="text-sm text-muted-foreground">What thoughts went through your mind?</p>
          <Textarea
            placeholder="What thoughts, interpretations, or beliefs came to mind? What did you tell yourself?"
            value={formData.beliefs}
            onChange={(e) => setFormData(prev => ({ ...prev, beliefs: e.target.value }))}
            className="min-h-[100px]"
            data-testid="textarea-beliefs"
          />
        </div>

        {/* C - Consequences */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-accent/20 rounded-lg flex items-center justify-center">
              <span className="text-accent font-semibold text-sm">C</span>
            </div>
            <h3 className="font-medium text-foreground">Consequences</h3>
          </div>
          <p className="text-sm text-muted-foreground">How did you feel and behave?</p>
          <Textarea
            placeholder="Emotions: How did you feel?
Physical: Any physical sensations?
Behavior: What did you do?"
            value={formData.consequences}
            onChange={(e) => setFormData(prev => ({ ...prev, consequences: e.target.value }))}
            className="min-h-[100px]"
            data-testid="textarea-consequences"
          />
        </div>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <Button 
            onClick={handleSubmit}
            disabled={createAbcSchemaMutation.isPending || isAnalyzing}
            data-testid="button-analyze-abc"
          >
            <Search className="h-4 w-4 mr-2" />
            {isAnalyzing ? "Analyzing..." : "Analyze Thoughts"}
          </Button>
          <Button 
            variant="outline"
            onClick={handleSaveDraft}
            disabled={createAbcSchemaMutation.isPending}
            data-testid="button-save-draft"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Draft
          </Button>
        </div>
        <Button 
          variant="outline"
          className="bg-slate-100 text-slate-600 hover:bg-slate-200"
          data-testid="button-share-therapist"
        >
          <Share className="h-4 w-4 mr-2" />
          Share with Therapist
        </Button>
      </div>
    </section>
  );
}
