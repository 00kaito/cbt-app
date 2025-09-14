import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertExerciseAssignmentSchema, ExerciseTemplate, User } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Clock, User as UserIcon, BookOpen } from "lucide-react";

// Form schema for assigning templates
const assignmentFormSchema = z.object({
  patientId: z.string().min(1, "Pacjent musi być wybrany"),
  abcSchemaId: z.string().optional(),
});

type AssignmentFormData = z.infer<typeof assignmentFormSchema>;

interface AssignTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: ExerciseTemplate | null;
  patients: User[];
}

export default function AssignTemplateModal({
  isOpen,
  onClose,
  template,
  patients,
}: AssignTemplateModalProps) {
  const { toast } = useToast();

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentFormSchema),
    defaultValues: {
      patientId: "",
      abcSchemaId: "",
    },
  });

  const selectedPatientId = form.watch("patientId");

  // Get ABC schemas for selected patient
  const { data: sharedData } = useQuery({
    queryKey: [`/api/therapist/shared-data/${selectedPatientId}`],
    enabled: !!selectedPatientId,
  });

  const abcSchemas = sharedData?.abcSchemas || [];

  const assignMutation = useMutation({
    mutationFn: async (data: AssignmentFormData) => {
      const assignmentData = {
        templateId: template!.id,
        patientId: data.patientId,
        abcSchemaId: data.abcSchemaId || undefined,
      };
      const res = await apiRequest("POST", "/api/exercise-assignments", assignmentData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercise-assignments"] });
      form.reset();
      onClose();
      toast({
        title: "Ćwiczenie przypisane!",
        description: "Szablon został przypisany do wybranego pacjenta.",
      });
    },
    onError: () => {
      toast({
        title: "Błąd",
        description: "Nie udało się przypisać ćwiczenia.",
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handleSubmit = (data: AssignmentFormData) => {
    assignMutation.mutate(data);
  };

  if (!template) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle data-testid="dialog-assign-title">
            Przypisz ćwiczenie pacjentowi
          </DialogTitle>
          <DialogDescription>
            Wybierz pacjenta, któremu chcesz przypisać to ćwiczenie. Opcjonalnie możesz powiązać z zapisem ABC.
          </DialogDescription>
        </DialogHeader>

        {/* Template Preview */}
        <div className="bg-muted/20 rounded-lg p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-medium text-foreground">{template.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
            </div>
            <BookOpen className="h-5 w-5 text-muted-foreground" />
          </div>
          
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{template.estimatedDuration} min</span>
              </div>
              <span className="capitalize">{template.difficulty}</span>
            </div>
            <span className="text-xs bg-muted px-2 py-1 rounded">
              {template.category}
            </span>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Patient Selection */}
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wybierz pacjenta</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-patient">
                        <SelectValue placeholder="Wybierz pacjenta" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {patients.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          <div className="flex items-center space-x-2">
                            <UserIcon className="h-4 w-4" />
                            <span>{patient.firstName} {patient.lastName}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* ABC Schema Selection (Optional) */}
            {selectedPatientId && abcSchemas && abcSchemas.length > 0 && (
              <FormField
                control={form.control}
                name="abcSchemaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Powiąż z zapisem ABC (opcjonalne)</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-abc-schema">
                          <SelectValue placeholder="Wybierz zapis ABC (opcjonalne)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">Bez powiązania z ABC</SelectItem>
                        {abcSchemas.map((schema: any) => (
                          <SelectItem key={schema.id} value={schema.id}>
                            <div className="max-w-xs truncate">
                              {schema.activatingEvent.substring(0, 50)}
                              {schema.activatingEvent.length > 50 ? "..." : ""}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                data-testid="button-cancel-assign"
              >
                Anuluj
              </Button>
              <Button 
                type="submit" 
                disabled={assignMutation.isPending}
                data-testid="button-assign"
              >
                {assignMutation.isPending ? "Przypisywanie..." : "Przypisz ćwiczenie"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}