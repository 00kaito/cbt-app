import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Settings, Lightbulb } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { MoodScale as MoodScaleType } from "@shared/schema";

const defaultMoodLevels = [
  { 
    level: 1, 
    title: "Głęboka depresja", 
    description: "Wyraźnie spowolnione ruchy i mowa, bardzo mała energia. Trudności w wykonywaniu podstawowych czynności.",
    behavioralIndicators: ["Wyraźnie spowolnione ruchy", "Bardzo mała energia", "Trudności z podstawowymi czynnościami"],
    category: 'depression' as const
  },
  { 
    level: 2, 
    title: "Umiarkowana depresja", 
    description: "Obniżona motywacja, unikanie kontaktów społecznych. Mowa cicha, spowolniona.",
    behavioralIndicators: ["Obniżona motywacja", "Unikanie kontaktów", "Mowa cicha"],
    category: 'depression' as const
  },
  { 
    level: 3, 
    title: "Łagodna depresja", 
    description: "Pesymistyczne myśli, ale zdolność do wykonywania obowiązków. Obniżona energia.",
    behavioralIndicators: ["Pesymistyczne myśli", "Wykonywanie obowiązków", "Obniżona energia"],
    category: 'depression' as const
  },
  { 
    level: 4, 
    title: "Nastrój zrównoważony", 
    description: "Stabilny rytm dnia, normalny poziom energii. Adekwatne reakcje emocjonalne.",
    behavioralIndicators: ["Stabilny rytm dnia", "Normalny poziom energii", "Adekwatne reakcje"],
    category: 'normal' as const
  },
  { 
    level: 5, 
    title: "Łagodna hipomania", 
    description: "Wyższa energia, większa towarzyskość. Lekka gonitwa myśli, większa kreatywność.",
    behavioralIndicators: ["Wyższa energia", "Większa towarzyskość", "Lekka gonitwa myśli"],
    category: 'elevation' as const
  },
  { 
    level: 6, 
    title: "Umiarkowana mania", 
    description: "Wyraźna nadaktywność, bardzo szybka mowa. Impulsywność, ograniczona potrzeba snu.",
    behavioralIndicators: ["Wyraźna nadaktywność", "Bardzo szybka mowa", "Impulsywność"],
    category: 'mania' as const
  },
  { 
    level: 7, 
    title: "Pełnoobjawowa mania", 
    description: "Skrajna pobudliwość, nieustanna aktywność. Zachowania ryzykowne i niebezpieczne.",
    behavioralIndicators: ["Skrajna pobudliwość", "Nieustanna aktywność", "Zachowania ryzykowne"],
    category: 'mania' as const
  },
];

export default function MoodScale() {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [showABCSuggestion, setShowABCSuggestion] = useState(false);
  const { toast } = useToast();

  const { data: moodScales } = useQuery<MoodScaleType[]>({
    queryKey: ["/api/mood-scales"],
  });

  const { data: recentMoods } = useQuery({
    queryKey: ["/api/mood-entries"],
  });

  const createMoodEntryMutation = useMutation({
    mutationFn: async (moodData: { moodLevel: number; notes?: string; moodScaleId?: string }) => {
      const res = await apiRequest("POST", "/api/mood-entries", moodData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mood-entries"] });
      toast({
        title: "Mood recorded",
        description: "Your mood has been successfully tracked.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to record mood. Please try again.",
        variant: "destructive",
      });
    },
  });

  const currentScale = moodScales?.[0] || { levels: defaultMoodLevels };
  const averageMood = recentMoods?.reduce((sum: number, entry: any) => sum + entry.moodLevel, 0) / (recentMoods?.length || 1) || 4;

  const handleMoodSelect = (level: number) => {
    setSelectedLevel(level);
    
    // Check if mood significantly deviates from average
    const deviation = Math.abs(level - averageMood);
    if (deviation >= 2) {
      setShowABCSuggestion(true);
    }

    // Record the mood
    createMoodEntryMutation.mutate({
      moodLevel: level,
      moodScaleId: moodScales?.[0]?.id,
    });
  };

  return (
    <>
      <div className="bg-muted/30 rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-muted-foreground">Current Mood Scale</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-primary hover:text-primary/80"
            data-testid="button-customize-scale"
          >
            <Settings className="h-4 w-4 mr-1" />
            Customize Scale
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {currentScale.levels.map((level) => (
            <div
              key={level.level}
              className={`
                mood-scale-item cursor-pointer transition-all p-4 rounded-lg border
                ${selectedLevel === level.level 
                  ? "border-2 border-blue-500 bg-blue-100" 
                  : "border-border hover:bg-gray-50"
                }
                ${level.category === 'depression' ? 'bg-red-50 border-red-200 hover:bg-red-100' :
                  level.category === 'normal' ? 'bg-blue-50 border-blue-200 hover:bg-blue-100' :
                  level.category === 'elevation' ? 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100' :
                  'bg-orange-50 border-orange-200 hover:bg-orange-100'}
              `}
              onClick={() => handleMoodSelect(level.level)}
              data-testid={`mood-level-${level.level}`}
            >
              <div className="flex items-center mb-2">
                <div className={`w-3 h-3 rounded-full mr-2 ${
                  level.category === 'depression' ? 'bg-red-500' :
                  level.category === 'normal' ? 'bg-blue-500' :
                  level.category === 'elevation' ? 'bg-yellow-500' :
                  'bg-orange-500'
                }`}></div>
                <span className="text-xs text-muted-foreground">Poziom {level.level}</span>
              </div>
              <div className={`text-sm font-medium mb-2 ${selectedLevel === level.level ? "text-primary" : "text-foreground"}`}>
                {level.title}
              </div>
              <div className="text-xs text-muted-foreground mb-2 line-clamp-2">
                {level.description}
              </div>
              {level.behavioralIndicators && level.behavioralIndicators.length > 0 && (
                <div className="space-y-1">
                  {level.behavioralIndicators.slice(0, 2).map((indicator, index) => (
                    <div key={index} className="text-xs bg-white/50 px-2 py-1 rounded text-muted-foreground">
                      • {indicator}
                    </div>
                  ))}
                  {level.behavioralIndicators.length > 2 && (
                    <div className="text-xs text-muted-foreground">
                      +{level.behavioralIndicators.length - 2} więcej...
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ABC Schema Suggestion */}
      {showABCSuggestion && (
        <Card className="bg-accent/10 border-accent/20">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Lightbulb className="text-accent text-lg mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-foreground mb-1" data-testid="text-mood-suggestion-title">
                  Unusual mood detected
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Your mood seems different from your usual pattern. Would you like to explore what might have triggered this?
                </p>
                <div className="flex space-x-2">
                  <Button 
                    className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    size="sm"
                    data-testid="button-create-abc-schema"
                  >
                    Create ABC Thought Record
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowABCSuggestion(false)}
                    data-testid="button-dismiss-suggestion"
                  >
                    Not now
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
