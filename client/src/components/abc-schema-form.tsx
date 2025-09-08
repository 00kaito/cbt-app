import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Save, Share } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { AbcSchema } from "@shared/schema";

interface ABCSchemaFormProps {
  editingSchema?: AbcSchema | null;
  onCancelEdit?: () => void;
}

export default function ABCSchemaForm({ editingSchema, onCancelEdit }: ABCSchemaFormProps = {}) {
  const [formData, setFormData] = useState({
    activatingEvent: editingSchema?.activatingEvent || "",
    beliefs: editingSchema?.beliefs || "",
    consequences: editingSchema?.consequences || "",
    moodBefore: editingSchema?.moodBefore || 3,
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [lastCreatedSchemaId, setLastCreatedSchemaId] = useState<string | null>(null);
  const { toast } = useToast();

  // Get assigned therapists
  const { data: assignedTherapists } = useQuery({
    queryKey: ["/api/patient/therapists"],
  });

  // Share with therapist mutation
  const shareWithTherapistMutation = useMutation({
    mutationFn: async (schemaId: string) => {
      if (!assignedTherapists || assignedTherapists.length === 0) {
        throw new Error("No therapist assigned. Please assign a therapist in Settings.");
      }
      
      const therapistId = assignedTherapists[0].id; // Use first assigned therapist
      const res = await apiRequest("POST", `/api/abc-schemas/${schemaId}/share`, { therapistId });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Udostępniono terapeucie",
        description: "Twój schemat ABC został udostępniony terapeucie.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Udostępnianie nie powiodło się",
        description: error.message || "Nie udało się udostępnić terapeucie. Spróbuj ponownie.",
        variant: "destructive",
      });
    },
  });

  const createAbcSchemaMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const endpoint = editingSchema ? `/api/abc-schemas/${editingSchema.id}` : "/api/abc-schemas";
      const method = editingSchema ? "PATCH" : "POST";
      const res = await apiRequest(method, endpoint, data);
      return res.json();
    },
    onSuccess: (schema) => {
      setLastCreatedSchemaId(schema.id);
      queryClient.invalidateQueries({ queryKey: ["/api/abc-schemas"] });
      if (editingSchema && onCancelEdit) {
        onCancelEdit();
        toast({
          title: "Zaktualizowano",
          description: "Zapis myślowy ABC został zaktualizowany.",
        });
      } else {
        // Trigger analysis for new schemas
        analyzeAbcSchema(schema.id);
      }
    },
    onError: () => {
      toast({
        title: "Błąd",
        description: editingSchema ? "Nie udało się zaktualizować schematu ABC." : "Nie udało się zapisać schematu ABC. Spróbuj ponownie.",
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
        title: "Analiza zakończona",
        description: "Twoje wzorce myślowe zostały przeanalizowane.",
      });
    } catch (error) {
      toast({
        title: "Analiza nie powiodła się",
        description: "Nie udało się przeanalizować wzorców myślowych. Spróbuj ponownie.",
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = () => {
    if (!formData.activatingEvent || !formData.beliefs || !formData.consequences) {
      toast({
        title: "Brakuje informacji",
        description: "Proszę wypełnić wszystkie trzy sekcje (A, B, C).",
        variant: "destructive",
      });
      return;
    }

    createAbcSchemaMutation.mutate(formData);
  };

  const handleSaveDraft = () => {
    createAbcSchemaMutation.mutate(formData);
  };

  const handleShareWithTherapist = () => {
    if (!lastCreatedSchemaId) {
      toast({
        title: "Brak schematu do udostępnienia",
        description: "Proszę najpierw zapisać schemat ABC przed udostępnieniem.",
        variant: "destructive",
      });
      return;
    }

    if (!assignedTherapists || assignedTherapists.length === 0) {
      toast({
        title: "Nie przypisano terapeuty",
        description: "Proszę przypisać terapeutę w Ustawieniach przed udostępnieniem.",
        variant: "destructive",
      });
      return;
    }

    shareWithTherapistMutation.mutate(lastCreatedSchemaId);
  };

  return (
    <section 
      className="bg-card rounded-lg shadow-sm border border-border p-6"
      data-testid="abc-schema-section"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground" data-testid="text-abc-title">
          {editingSchema ? "Edytuj zapis myślowy ABC" : "Zapis myślowy ABC"}
        </h2>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Przed:</span>
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
            <h3 className="font-medium text-foreground">Zdarzenie wyzwalające</h3>
          </div>
          <p className="text-sm text-muted-foreground">Co się stało? Opisz sytuację lub zdarzenie.</p>
          <Textarea
            placeholder="Opisz co się stało, co wywołało Twoje myśli i emocje..."
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
            <h3 className="font-medium text-foreground">Przekonania i myśli</h3>
          </div>
          <p className="text-sm text-muted-foreground">Jakie myśli przeszły przez Twój umysł?</p>
          <Textarea
            placeholder="Jakie myśli, interpretacje lub przekonania przyszły Ci do głowy? Co sobie powiedziałeś?"
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
            <h3 className="font-medium text-foreground">Konsekwencje</h3>
          </div>
          <p className="text-sm text-muted-foreground">Jak się czułeś i jak się zachowałeś?</p>
          <Textarea
            placeholder="Emocje: Jak się czułeś?
Fizyczne: Czy były jakieś doznania fizyczne?
Zachowanie: Co robiłeś?"
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
            {isAnalyzing ? "Analizowanie..." : (editingSchema ? "Analizuj ponownie" : "Analizuj myśli")}
          </Button>
          <Button 
            variant="outline"
            onClick={handleSaveDraft}
            disabled={createAbcSchemaMutation.isPending}
            data-testid="button-save-draft"
          >
            <Save className="h-4 w-4 mr-2" />
            {editingSchema ? "Zaktualizuj" : "Zapisz szkic"}
          </Button>
          {editingSchema && (
            <Button 
              variant="ghost"
              onClick={() => {
                if (onCancelEdit) onCancelEdit();
              }}
              data-testid="button-cancel-edit"
            >
              Anuluj edycję
            </Button>
          )}
        </div>
        <Button 
          variant="outline"
          className="bg-slate-100 text-slate-600 hover:bg-slate-200"
          onClick={handleShareWithTherapist}
          disabled={shareWithTherapistMutation.isPending || !lastCreatedSchemaId}
          data-testid="button-share-therapist"
        >
          <Share className="h-4 w-4 mr-2" />
          {shareWithTherapistMutation.isPending ? "Udostępnianie..." : "Udostępnij terapeucie"}
        </Button>
      </div>
    </section>
  );
}
