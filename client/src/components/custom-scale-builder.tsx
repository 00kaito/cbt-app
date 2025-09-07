import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { GripVertical, Trash2, Plus, RotateCcw } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MoodLevel {
  level: number;
  title: string;
  description: string;
  behavioralIndicators: string[];
  category: 'depression' | 'normal' | 'elevation' | 'mania';
}

const predefinedDescriptions = {
  depression: [
    {
      title: "Głęboka depresja",
      description: "Wyraźnie spowolnione ruchy i mowa, bardzo mała energia. Trudności w wykonywaniu codziennych czynności, nawet podstawowych (jedzenie, dbanie o higienę). Silne poczucie beznadziejności, wyraźne wycofanie społeczne.",
      behavioralIndicators: [
        "Wyraźnie spowolnione ruchy i mowa",
        "Bardzo mała energia", 
        "Trudności w wykonywaniu podstawowych czynności",
        "Problemy z jedzeniem i higieną",
        "Silne poczucie beznadziejności",
        "Wyraźne wycofanie społeczne"
      ],
      category: 'depression' as const
    },
    {
      title: "Umiarkowana depresja", 
      description: "Wyraźnie obniżona motywacja, unikanie kontaktów towarzyskich. Mowa cicha, spowolniona, ograniczona ekspresja twarzy. Duża trudność w podejmowaniu decyzji, pesymizm, poczucie winy.",
      behavioralIndicators: [
        "Wyraźnie obniżona motywacja",
        "Unikanie kontaktów towarzyskich",
        "Mowa cicha i spowolniona",
        "Ograniczona ekspresja twarzy",
        "Trudność w podejmowaniu decyzji",
        "Pesymizm i poczucie winy"
      ],
      category: 'depression' as const
    },
    {
      title: "Łagodna depresja",
      description: "Pesymistyczne myśli, ale zdolność do wykonywania obowiązków wciąż obecna. Obniżona energia i mniejsza satysfakcja z działań. Wycofanie z aktywności rekreacyjnych, łatwe męczenie się.",
      behavioralIndicators: [
        "Pesymistyczne myśli", 
        "Zdolność do wykonywania obowiązków wciąż obecna",
        "Obniżona energia",
        "Mniejsza satysfakcja z działań",
        "Wycofanie z aktywności rekreacyjnych",
        "Łatwe męczenie się"
      ],
      category: 'depression' as const
    }
  ],
  normal: [
    {
      title: "Nastrój zrównoważony (eutymia)",
      description: "Stabilny rytm dnia, normalny poziom energii. Spójna mowa, adekwatne reakcje emocjonalne. Wykonywanie zadań i kontaktów społecznych bez większych trudności.",
      behavioralIndicators: [
        "Stabilny rytm dnia",
        "Normalny poziom energii", 
        "Spójna mowa",
        "Adekwatne reakcje emocjonalne",
        "Wykonywanie zadań bez trudności",
        "Normalne kontakty społeczne"
      ],
      category: 'normal' as const
    }
  ],
  elevation: [
    {
      title: "Łagodna hipomania",
      description: "Wyższa energia niż zwykle, większa towarzyskość i rozmowność. Lekka gonitwa myśli, szybciej podejmowane decyzje. Rośnie chęć do działania i kreatywność, ale wciąż względnie kontrolowana.",
      behavioralIndicators: [
        "Wyższa energia niż zwykle",
        "Większa towarzyskość i rozmowność",
        "Lekka gonitwa myśli",
        "Szybciej podejmowane decyzje", 
        "Zwiększona chęć do działania",
        "Większa kreatywność, ale kontrolowana"
      ],
      category: 'elevation' as const
    }
  ],
  mania: [
    {
      title: "Umiarkowana mania",
      description: "Wyraźna nadaktywność, trudność w przerywaniu działań, wiele rozpoczętych aktywności. Bardzo szybka mowa, czasem trudna do przerwania. Impulsywność, ryzykowne decyzje (wydatki, zachowania społeczne). Ograniczona potrzeba snu bez poczucia zmęczenia.",
      behavioralIndicators: [
        "Wyraźna nadaktywność",
        "Trudność w przerywaniu działań",
        "Wiele rozpoczętych aktywności",
        "Bardzo szybka mowa",
        "Impulsywność",
        "Ryzykowne decyzje finansowe i społeczne",
        "Ograniczona potrzeba snu"
      ],
      category: 'mania' as const
    },
    {
      title: "Pełnoobjawowa mania",
      description: "Skrajna pobudliwość, nieustanna aktywność i rozmowność. Gonitwa myśli, trudność w logicznym podążaniu za wątkiem. Skłonność do irracjonalnych decyzji, zachowania ryzykowne i niebezpieczne. Zdarzają się symptomy psychotyczne (urojenia wielkościowe, brak krytycyzmu).",
      behavioralIndicators: [
        "Skrajna pobudliwość",
        "Nieustanna aktywność i rozmowność",
        "Gonitwa myśli", 
        "Trudność w logicznym myśleniu",
        "Irracjonalne decyzje",
        "Zachowania ryzykowne i niebezpieczne",
        "Możliwe symptomy psychotyczne",
        "Urojenia wielkościowe",
        "Brak krytycyzmu"
      ],
      category: 'mania' as const
    }
  ]
};

const defaultLevels: MoodLevel[] = [
  { 
    level: 1, 
    title: "Głęboka depresja",
    description: "Wyraźnie spowolnione ruchy i mowa, bardzo mała energia. Trudności w wykonywaniu codziennych czynności, nawet podstawowych.",
    behavioralIndicators: ["Wyraźnie spowolnione ruchy i mowa", "Bardzo mała energia", "Trudności w wykonywaniu podstawowych czynności"],
    category: 'depression'
  },
  { 
    level: 2, 
    title: "Umiarkowana depresja",
    description: "Wyraźnie obniżona motywacja, unikanie kontaktów towarzyskich. Mowa cicha, spowolniona.",
    behavioralIndicators: ["Obniżona motywacja", "Unikanie kontaktów społecznych", "Mowa cicha, spowolniona"],
    category: 'depression'
  },
  { 
    level: 3, 
    title: "Łagodna depresja",
    description: "Pesymistyczne myśli, ale zdolność do wykonywania obowiązków wciąż obecna. Obniżona energia.",
    behavioralIndicators: ["Pesymistyczne myśli", "Zdolność do wykonywania obowiązków", "Obniżona energia"],
    category: 'depression'
  },
  { 
    level: 4, 
    title: "Nastrój zrównoważony (eutymia)",
    description: "Stabilny rytm dnia, normalny poziom energii. Spójna mowa, adekwatne reakcje emocjonalne.",
    behavioralIndicators: ["Stabilny rytm dnia", "Normalny poziom energii", "Spójna mowa"],
    category: 'normal'
  },
  { 
    level: 5, 
    title: "Łagodna hipomania", 
    description: "Wyższa energia niż zwykle, większa towarzyskość i rozmowność. Lekka gonitwa myśli.",
    behavioralIndicators: ["Wyższa energia", "Większa towarzyskość", "Lekka gonitwa myśli"],
    category: 'elevation'
  },
  { 
    level: 6, 
    title: "Umiarkowana mania",
    description: "Wyraźna nadaktywność, trudność w przerywaniu działań. Bardzo szybka mowa, impulsywność.",
    behavioralIndicators: ["Wyraźna nadaktywność", "Trudność w przerywaniu działań", "Bardzo szybka mowa"],
    category: 'mania'
  },
  { 
    level: 7, 
    title: "Pełnoobjawowa mania",
    description: "Skrajna pobudliwość, nieustanna aktywność. Gonitwa myśli, zachowania ryzykowne i niebezpieczne.",
    behavioralIndicators: ["Skrajna pobudliwość", "Nieustanna aktywność", "Gonitwa myśli", "Zachowania ryzykowne"],
    category: 'mania'
  },
];

export default function CustomScaleBuilder() {
  const [scaleLength, setScaleLength] = useState("7");
  const [levels, setLevels] = useState<MoodLevel[]>(defaultLevels);
  const [scaleName, setScaleName] = useState("My Custom Mood Scale");
  const { toast } = useToast();

  const createMoodScaleMutation = useMutation({
    mutationFn: async (scaleData: { name: string; levels: MoodLevel[] }) => {
      const res = await apiRequest("POST", "/api/mood-scales", scaleData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mood-scales"] });
      toast({
        title: "Scale saved",
        description: "Your custom mood scale has been created successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to save custom scale. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleScaleLengthChange = (newLength: string) => {
    setScaleLength(newLength);
    const length = parseInt(newLength);
    
    if (length < levels.length) {
      setLevels(levels.slice(0, length));
    } else if (length > levels.length) {
      const newLevels = [...levels];
      for (let i = levels.length; i < length; i++) {
        newLevels.push({
          level: i + 1,
          emoji: "😐",
          title: `Level ${i + 1}`,
          description: "Custom mood level description"
        });
      }
      setLevels(newLevels);
    }
  };

  const updateLevel = (index: number, field: keyof MoodLevel, value: string | string[]) => {
    const updatedLevels = [...levels];
    if (field === 'level') {
      updatedLevels[index][field] = parseInt(value as string);
    } else if (field === 'behavioralIndicators') {
      updatedLevels[index][field] = value as string[];
    } else {
      updatedLevels[index][field] = value as string;
    }
    setLevels(updatedLevels);
  };

  const loadPredefinedDescription = (index: number, category: 'depression' | 'normal' | 'elevation' | 'mania', descIndex: number) => {
    const predefined = predefinedDescriptions[category][descIndex];
    if (predefined) {
      updateLevel(index, 'title', predefined.title);
      updateLevel(index, 'description', predefined.description);
      updateLevel(index, 'behavioralIndicators', predefined.behavioralIndicators);
      updateLevel(index, 'category', predefined.category);
    }
  };

  const removeLevel = (index: number) => {
    if (levels.length > 3) {
      const newLevels = levels.filter((_, i) => i !== index);
      // Renumber levels
      newLevels.forEach((level, i) => {
        level.level = i + 1;
      });
      setLevels(newLevels);
      setScaleLength(newLevels.length.toString());
    }
  };

  const addLevel = () => {
    if (levels.length < 10) {
      const newLevel: MoodLevel = {
        level: levels.length + 1,
        emoji: "😐",
        title: `Level ${levels.length + 1}`,
        description: "Custom mood level description"
      };
      setLevels([...levels, newLevel]);
      setScaleLength((levels.length + 1).toString());
    }
  };

  const resetToDefault = () => {
    setLevels(defaultLevels);
    setScaleLength("7");
    setScaleName("My Custom Mood Scale");
  };

  const handleSave = () => {
    if (!scaleName.trim()) {
      toast({
        title: "Missing name",
        description: "Please enter a name for your custom scale.",
        variant: "destructive",
      });
      return;
    }

    createMoodScaleMutation.mutate({
      name: scaleName,
      levels,
    });
  };

  return (
    <section className="bg-card rounded-lg shadow-sm border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-foreground" data-testid="text-scale-builder-title">
          Customize Your Mood Scale
        </h2>
        <Button 
          variant="outline" 
          onClick={resetToDefault}
          data-testid="button-reset-scale"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Default
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Scale Builder */}
        <div className="space-y-4">
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Scale Name
              </label>
              <Input
                value={scaleName}
                onChange={(e) => setScaleName(e.target.value)}
                placeholder="Enter scale name"
                data-testid="input-scale-name"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-foreground">Scale Configuration</h3>
              <Select value={scaleLength} onValueChange={handleScaleLengthChange}>
                <SelectTrigger className="w-32" data-testid="select-scale-length">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Levels</SelectItem>
                  <SelectItem value="5">5 Levels</SelectItem>
                  <SelectItem value="7">7 Levels</SelectItem>
                  <SelectItem value="9">9 Levels</SelectItem>
                  <SelectItem value="10">10 Levels</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Drag and Drop Scale Items */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {levels.map((level, index) => (
              <div 
                key={index} 
                className="bg-muted/30 border border-border rounded-lg p-4 cursor-move"
                data-testid={`scale-item-${index}`}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <div className={`w-4 h-4 rounded-full ${
                      level.category === 'depression' ? 'bg-red-500' :
                      level.category === 'normal' ? 'bg-blue-500' :
                      level.category === 'elevation' ? 'bg-yellow-500' :
                      'bg-orange-500'
                    }`}></div>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      type="text"
                      value={level.title}
                      onChange={(e) => updateLevel(index, 'title', e.target.value)}
                      className="font-medium"
                      data-testid={`input-title-${index}`}
                    />
                    <Textarea
                      value={level.description}
                      onChange={(e) => updateLevel(index, 'description', e.target.value)}
                      className="text-sm resize-none"
                      rows={2}
                      data-testid={`textarea-description-${index}`}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeLevel(index)}
                    disabled={levels.length <= 3}
                    className="text-muted-foreground hover:text-destructive"
                    data-testid={`button-remove-${index}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {/* Add New Level Button */}
            {levels.length < 10 && (
              <Button
                variant="outline"
                className="w-full border-2 border-dashed"
                onClick={addLevel}
                data-testid="button-add-level"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Level
              </Button>
            )}
          </div>
        </div>

        {/* Scale Preview */}
        <div className="space-y-4">
          <h3 className="font-medium text-foreground">Preview</h3>
          <Card className="bg-muted/20">
            <CardContent className="p-4">
              <div className="space-y-2">
                {levels.map((level, index) => (
                  <div 
                    key={index}
                    className="bg-card border border-border rounded-lg p-3 hover:bg-primary/5 cursor-pointer transition-all"
                    data-testid={`preview-item-${index}`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{level.emoji}</span>
                      <div className="flex-1 text-left">
                        <div className="font-medium text-sm">{level.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {level.description}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {level.level}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <div className="flex space-x-3">
            <Button 
              className="flex-1"
              onClick={handleSave}
              disabled={createMoodScaleMutation.isPending}
              data-testid="button-save-scale"
            >
              {createMoodScaleMutation.isPending ? "Saving..." : "Save Custom Scale"}
            </Button>
            <Button variant="outline" data-testid="button-test-scale">
              Test Scale
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
