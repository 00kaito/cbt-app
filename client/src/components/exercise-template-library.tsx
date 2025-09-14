import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Clock, Plus, BookOpen, Edit, Trash2, Copy, Users } from "lucide-react";
import { ExerciseTemplate, ExerciseAssignment, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import ExerciseTemplateModal from "@/components/exercise-template-modal";
import AssignTemplateModal from "@/components/assign-template-modal";

interface ExerciseTemplateLibraryProps {
  patients?: User[];
}

export default function ExerciseTemplateLibrary({ patients = [] }: ExerciseTemplateLibraryProps) {
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ExerciseTemplate | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<ExerciseTemplate | null>(null);
  const { toast } = useToast();

  const { data: templates, isLoading } = useQuery<ExerciseTemplate[]>({
    queryKey: ["/api/exercise-templates"],
  });

  const { data: assignments } = useQuery<(ExerciseAssignment & { template: ExerciseTemplate, patient: User })[]>({
    queryKey: ["/api/exercise-assignments"],
  });

  const createTemplateMutation = useMutation({
    mutationFn: async (templateData: any) => {
      const res = await apiRequest("POST", "/api/exercise-templates", templateData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercise-templates"] });
      setIsTemplateModalOpen(false);
      toast({
        title: "Szablon utworzony!",
        description: "Nowy szablon ćwiczenia został dodany do biblioteki.",
      });
    },
    onError: () => {
      toast({
        title: "Błąd",
        description: "Nie udało się utworzyć szablonu.",
        variant: "destructive",
      });
    },
  });

  const updateTemplateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PUT", `/api/exercise-templates/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercise-templates"] });
      setEditingTemplate(null);
      setIsTemplateModalOpen(false);
      toast({
        title: "Szablon zaktualizowany!",
        description: "Zmiany zostały zapisane.",
      });
    },
    onError: () => {
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować szablonu.",
        variant: "destructive",
      });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const res = await apiRequest("DELETE", `/api/exercise-templates/${templateId}`);
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercise-templates"] });
      toast({
        title: "Szablon usunięty",
        description: "Szablon został usunięty z biblioteki.",
      });
    },
    onError: () => {
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć szablonu.",
        variant: "destructive",
      });
    },
  });

  const duplicateTemplateMutation = useMutation({
    mutationFn: async (templateId: string) => {
      const res = await apiRequest("POST", `/api/exercise-templates/${templateId}/duplicate`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercise-templates"] });
      toast({
        title: "Szablon zduplikowany!",
        description: "Kopia szablonu została utworzona.",
      });
    },
    onError: () => {
      toast({
        title: "Błąd",
        description: "Nie udało się zduplikować szablonu.",
        variant: "destructive",
      });
    },
  });

  const handleCreateTemplate = (data: any) => {
    createTemplateMutation.mutate(data);
  };

  const handleUpdateTemplate = (data: any) => {
    if (editingTemplate) {
      updateTemplateMutation.mutate({ id: editingTemplate.id, data });
    }
  };

  const handleEditTemplate = (template: ExerciseTemplate) => {
    setEditingTemplate(template);
    setIsTemplateModalOpen(true);
  };

  const handleDeleteTemplate = (templateId: string) => {
    if (confirm("Czy na pewno chcesz usunąć ten szablon? To działanie nie może zostać cofnięte.")) {
      deleteTemplateMutation.mutate(templateId);
    }
  };

  const handleDuplicateTemplate = (templateId: string) => {
    duplicateTemplateMutation.mutate(templateId);
  };

  const handleAssignTemplate = (template: ExerciseTemplate) => {
    setSelectedTemplate(template);
    setIsAssignModalOpen(true);
  };

  const getAssignmentCount = (templateId: string) => {
    return assignments?.filter(a => a.templateId === templateId).length || 0;
  };

  const closeModal = () => {
    setIsTemplateModalOpen(false);
    setEditingTemplate(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Biblioteka szablonów ćwiczeń</h2>
          <p className="text-muted-foreground">Zarządzaj szablonami ćwiczeń i przypisuj je pacjentom</p>
        </div>
        <Button 
          onClick={() => setIsTemplateModalOpen(true)}
          data-testid="button-create-template"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nowy szablon
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      ) : !templates || templates.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2" data-testid="text-no-templates">
                Brak szablonów w bibliotece
              </h3>
              <p className="text-muted-foreground mb-4">
                Utwórz pierwszy szablon ćwiczenia, który będzie można przypisywać pacjentom.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setIsTemplateModalOpen(true)}
                data-testid="button-create-first-template"
              >
                <Plus className="h-4 w-4 mr-2" />
                Utwórz pierwszy szablon
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {templates.map((template) => {
            const assignmentCount = getAssignmentCount(template.id);
            
            return (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground" data-testid={`template-title-${template.id}`}>
                          {template.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {template.description}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1 ml-4">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditTemplate(template)}
                          data-testid={`button-edit-template-${template.id}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDuplicateTemplate(template.id)}
                          data-testid={`button-duplicate-template-${template.id}`}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteTemplate(template.id)}
                          data-testid={`button-delete-template-${template.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center space-x-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {assignmentCount} przypisań
                        </span>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => handleAssignTemplate(template)}
                        data-testid={`button-assign-template-${template.id}`}
                      >
                        Przypisz
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Template Creation/Edit Modal */}
      <ExerciseTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={closeModal}
        onSubmit={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
        isLoading={createTemplateMutation.isPending || updateTemplateMutation.isPending}
        template={editingTemplate}
        mode={editingTemplate ? "edit" : "create"}
      />

      {/* Assignment Modal */}
      <AssignTemplateModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedTemplate(null);
        }}
        template={selectedTemplate}
        patients={patients}
      />
    </div>
  );
}