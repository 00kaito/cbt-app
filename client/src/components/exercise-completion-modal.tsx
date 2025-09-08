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
import { Exercise, TherapistExercise } from "@shared/schema";
import { useState } from "react";
import { Clock, Star } from "lucide-react";

interface ExerciseCompletionModalProps {
  exercise: Exercise | TherapistExercise | null;
  isOpen: boolean;
  onClose: () => void;
  onComplete: (data: {
    exerciseId: string;
    response: string;
    moodBefore: number;
    moodAfter: number;
  }) => void;
  isLoading?: boolean;
}

export default function ExerciseCompletionModal({
  exercise,
  isOpen,
  onClose,
  onComplete,
  isLoading = false,
}: ExerciseCompletionModalProps) {
  const [response, setResponse] = useState("");
  const [moodBefore, setMoodBefore] = useState(4);
  const [moodAfter, setMoodAfter] = useState(4);

  const handleSubmit = () => {
    if (!exercise || !response.trim()) return;

    onComplete({
      exerciseId: exercise.id,
      response: response.trim(),
      moodBefore,
      moodAfter,
    });
  };

  const handleClose = () => {
    setResponse("");
    setMoodBefore(4);
    setMoodAfter(4);
    onClose();
  };

  if (!exercise) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-primary" />
            {exercise.title}
          </DialogTitle>
          <DialogDescription className="space-y-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {exercise.estimatedDuration} min
              </span>
              <span className="capitalize">{exercise.difficulty}</span>
              <span className="bg-primary/10 text-primary px-2 py-1 rounded-md">
                {exercise.category}
              </span>
            </div>
            
            <div className="space-y-2">
              <p className="text-foreground">{exercise.description}</p>
              <div className="bg-muted/50 p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Instrukcje:</p>
                <p className="text-sm">{exercise.instructions}</p>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Mood Before */}
          <div className="space-y-2">
            <Label htmlFor="mood-before">
              Jak się czujesz przed rozpoczęciem? (1-7)
            </Label>
            <Input
              id="mood-before"
              type="number"
              min="1"
              max="7"
              value={moodBefore}
              onChange={(e) => setMoodBefore(parseInt(e.target.value) || 4)}
              data-testid="input-mood-before"
            />
            <p className="text-xs text-muted-foreground">
              1 = Bardzo źle, 4 = Neutralnie, 7 = Doskonale
            </p>
          </div>

          {/* Exercise Response */}
          <div className="space-y-2">
            <Label htmlFor="exercise-response">
              Ukończ ćwiczenie
            </Label>
            <Textarea
              id="exercise-response"
              placeholder="Napisz swoje myśli, refleksje lub odpowiedzi na to ćwiczenie..."
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              className="min-h-32"
              data-testid="textarea-exercise-response"
            />
          </div>

          {/* Mood After */}
          <div className="space-y-2">
            <Label htmlFor="mood-after">
              Jak się czujesz po ukończeniu tego ćwiczenia? (1-7)
            </Label>
            <Input
              id="mood-after"
              type="number"
              min="1"
              max="7"
              value={moodAfter}
              onChange={(e) => setMoodAfter(parseInt(e.target.value) || 4)}
              data-testid="input-mood-after"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              data-testid="button-cancel-exercise"
            >
              Anuluj
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!response.trim() || isLoading}
              className="flex-1"
              data-testid="button-save-exercise"
            >
              {isLoading ? "Zapisywanie..." : "Zapisz ćwiczenie"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}