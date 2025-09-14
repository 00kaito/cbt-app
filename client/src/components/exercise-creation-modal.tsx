import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertTherapistExerciseSchema, User } from "@shared/schema";
import { z } from "zod";

// Form schema for creating exercises
const exerciseFormSchema = z.object({
  title: z.string().min(1, "Tytuł jest wymagany"),
  description: z.string().min(1, "Opis jest wymagany"), 
  instructions: z.string().min(1, "Instrukcje są wymagane"),
  category: z.string().min(1, "Kategoria jest wymagana"),
  patientId: z.string().min(1, "Wybór przypisania jest wymagany"),
  estimatedDuration: z.number().min(1).max(120),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

type ExerciseFormData = z.infer<typeof exerciseFormSchema>;

interface ExerciseCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ExerciseFormData) => void;
  patients: User[];
  isLoading?: boolean;
  selectedPatient?: User;
  selectedAbcSchema?: any;
}

const categories = [
  "Kwestionowanie myśli",
  "Restrukturyzacja poznawcza", 
  "Uważność",
  "Relaksacja",
  "Aktywacja behawioralna",
  "Terapia ekspozycyjna",
  "Inne"
];

const difficulties = [
  { value: "easy", label: "Łatwy" },
  { value: "medium", label: "Średni" },
  { value: "hard", label: "Trudny" }
];

export default function ExerciseCreationModal({
  isOpen,
  onClose,
  onSubmit,
  patients,
  isLoading = false,
  selectedPatient,
  selectedAbcSchema,
}: ExerciseCreationModalProps) {
  const form = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: {
      title: selectedAbcSchema ? `Ćwiczenie dla ABC: ${selectedAbcSchema.activatingEvent.substring(0, 50)}...` : "",
      description: selectedAbcSchema ? `Ćwiczenie związane z zapisem myślowym ABC utworzonym ${new Date(selectedAbcSchema.createdAt).toLocaleDateString('pl-PL')}` : "",
      instructions: "",
      category: "",
      patientId: selectedPatient?.id || "all",
      estimatedDuration: 15,
      difficulty: "medium",
    },
  });

  const handleSubmit = (data: ExerciseFormData) => {
    onSubmit(data);
    form.reset();
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="modal-create-exercise">
        <DialogHeader>
          <DialogTitle>Utwórz nowe ćwiczenie</DialogTitle>
          <DialogDescription>
            Utwórz niestandardowe ćwiczenie terapeutyczne do przypisania konkretnemu pacjentowi.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Title */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tytuł ćwiczenia</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="np. Ćwiczenie kwestionowania myśli"
                      data-testid="input-exercise-title"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Opis</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Krótki opis tego, co to ćwiczenie ma osiągnąć..."
                      rows={3}
                      data-testid="textarea-exercise-description"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Instructions */}
            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instrukcje</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Szczegółowe instrukcje krok po kroku dla pacjenta..."
                      rows={4}
                      data-testid="textarea-exercise-instructions"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category and Difficulty Row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategoria</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      data-testid="select-exercise-category"
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz kategorię" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trudność</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      data-testid="select-exercise-difficulty"
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz trudność" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {difficulties.map((difficulty) => (
                          <SelectItem key={difficulty.value} value={difficulty.value}>
                            {difficulty.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Patient and Duration Row */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="patientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Przypisz ćwiczenie</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                      data-testid="select-patient"
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wybierz przypisanie" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all" data-testid="option-all-patients">
                          🌟 Wszyscy pacjenci (rekomendowane)
                        </SelectItem>
                        {patients.map((patient) => (
                          <SelectItem key={patient.id} value={patient.id} data-testid={`option-patient-${patient.id}`}>
                            {patient.firstName} {patient.lastName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="estimatedDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Czas trwania (minuty)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min={1}
                        max={120}
                        placeholder="15"
                        data-testid="input-exercise-duration"
                        {...field} 
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                data-testid="button-cancel-exercise"
              >
                Anuluj
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                data-testid="button-save-exercise"
              >
                {isLoading ? "Tworzenie..." : "Utwórz ćwiczenie"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}