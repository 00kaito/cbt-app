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
import { insertExerciseTemplateSchema, ExerciseTemplate } from "@shared/schema";
import { z } from "zod";

// Form schema for creating/editing exercise templates
const templateFormSchema = insertExerciseTemplateSchema
  .omit({
    therapistId: true,
    isActive: true,
    originalTemplateId: true,
  })
  .extend({
    title: z.string().min(1, "Tytuł jest wymagany"),
    description: z.string().min(1, "Opis jest wymagany"), 
    instructions: z.string().min(1, "Instrukcje są wymagane"),
    category: z.string().min(1, "Kategoria jest wymagana"),
    estimatedDuration: z.coerce.number().min(1, "Czas musi być co najmniej 1 minuta").max(120, "Czas nie może przekraczać 120 minut"),
    difficulty: z.enum(["easy", "medium", "hard"], { required_error: "Poziom trudności jest wymagany" }),
  });

type TemplateFormData = z.infer<typeof templateFormSchema>;

interface ExerciseTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TemplateFormData) => void;
  isLoading?: boolean;
  template?: ExerciseTemplate | null;
  mode: "create" | "edit";
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

export default function ExerciseTemplateModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  template,
  mode,
}: ExerciseTemplateModalProps) {
  const form = useForm<TemplateFormData>({
    resolver: zodResolver(templateFormSchema),
    defaultValues: {
      title: template?.title || "",
      description: template?.description || "",
      instructions: template?.instructions || "",
      category: template?.category || "",
      estimatedDuration: template?.estimatedDuration || 15,
      difficulty: (template?.difficulty as "easy" | "medium" | "hard") || "medium",
    },
  });

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handleSubmit = (data: TemplateFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle data-testid="dialog-title">
            {mode === "edit" ? "Edytuj szablon ćwiczenia" : "Nowy szablon ćwiczenia"}
          </DialogTitle>
          <DialogDescription>
            {mode === "edit" 
              ? "Zaktualizuj szablon, który będzie można przypisywać pacjentom."
              : "Utwórz nowy szablon ćwiczenia, który będzie można przypisywać pacjentom."
            }
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
                      placeholder="Wprowadź tytuł ćwiczenia"
                      data-testid="input-template-title"
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
                      placeholder="Opisz cel i korzyści tego ćwiczenia"
                      className="min-h-[100px]"
                      data-testid="textarea-template-description"
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
                  <FormLabel>Instrukcje wykonania</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Szczegółowe instrukcje krok po kroku dla pacjenta"
                      className="min-h-[120px]"
                      data-testid="textarea-template-instructions"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category and Difficulty Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-template-category">
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
                    <FormLabel>Poziom trudności</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-template-difficulty">
                          <SelectValue placeholder="Wybierz poziom" />
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

            {/* Duration */}
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
                      data-testid="input-template-duration"
                      {...field} 
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                data-testid="button-cancel-template"
              >
                Anuluj
              </Button>
              <Button 
                type="submit" 
                disabled={isLoading}
                data-testid="button-save-template"
              >
                {isLoading 
                  ? (mode === "edit" ? "Aktualizowanie..." : "Tworzenie...") 
                  : (mode === "edit" ? "Aktualizuj szablon" : "Utwórz szablon")
                }
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}