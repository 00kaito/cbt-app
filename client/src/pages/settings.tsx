import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/navigation";
import CustomScaleBuilder from "@/components/custom-scale-builder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Settings as SettingsIcon, Palette, User, UserPlus } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Settings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [therapistEmail, setTherapistEmail] = useState("");

  // Get current therapist assignments
  const { data: assignedTherapists, refetch: refetchTherapists } = useQuery({
    queryKey: ["/api/patient/therapists"],
    enabled: user?.role === "patient",
  });

  // Assign therapist mutation
  const assignTherapistMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await apiRequest("POST", "/api/patient/assign-therapist", { email });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patient/therapists"] });
      refetchTherapists();
      setTherapistEmail("");
      toast({
        title: "Therapist assigned",
        description: "Therapist has been successfully assigned to your account.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to assign therapist. Please check the email address.",
        variant: "destructive",
      });
    },
  });

  const handleAssignTherapist = () => {
    if (!therapistEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter therapist email address.",
        variant: "destructive",
      });
      return;
    }
    assignTherapistMutation.mutate(therapistEmail.trim());
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        {/* Header */}
        <div className="flex items-center space-x-3">
          <SettingsIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground" data-testid="text-settings-title">
              Settings
            </h1>
            <p className="text-muted-foreground">
              Customize your MindBridge experience
            </p>
          </div>
        </div>

        {/* Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Profile</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Name</label>
                <p className="text-sm text-muted-foreground mt-1">
                  {user?.firstName} {user?.lastName}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Username</label>
                <p className="text-sm text-muted-foreground mt-1">
                  {user?.username}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Role</label>
                <p className="text-sm text-muted-foreground mt-1 capitalize">
                  {user?.role}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-5 w-5" />
                <span>Preferences</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-sm">
                  Additional preferences coming soon
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Therapist Assignment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserPlus className="h-5 w-5" />
                <span>Therapist</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Therapist */}
              {assignedTherapists && assignedTherapists.length > 0 ? (
                <div>
                  <label className="text-sm font-medium text-foreground">Assigned Therapist</label>
                  {assignedTherapists.map((therapist: any) => (
                    <div key={therapist.id} className="mt-2 p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium">{therapist.firstName} {therapist.lastName}</p>
                      <p className="text-xs text-muted-foreground">{therapist.email}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div>
                  <label className="text-sm font-medium text-foreground">No therapist assigned</label>
                  <p className="text-xs text-muted-foreground mt-1">
                    Assign a therapist to enable data sharing
                  </p>
                </div>
              )}

              {/* Assign New Therapist */}
              <div className="pt-4 border-t">
                <label className="text-sm font-medium text-foreground">
                  Assign Therapist by Email
                </label>
                <div className="mt-2 flex space-x-2">
                  <Input
                    type="email"
                    placeholder="therapist@example.com"
                    value={therapistEmail}
                    onChange={(e) => setTherapistEmail(e.target.value)}
                    disabled={assignTherapistMutation.isPending}
                    data-testid="input-therapist-email"
                  />
                  <Button
                    onClick={handleAssignTherapist}
                    disabled={assignTherapistMutation.isPending || !therapistEmail.trim()}
                    data-testid="button-assign-therapist"
                  >
                    {assignTherapistMutation.isPending ? "Assigning..." : "Assign"}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter the email address of your therapist
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mood Scale Customization */}
        <CustomScaleBuilder />
      </main>
    </div>
  );
}