import { useAuth } from "@/hooks/use-auth";
import Navigation from "@/components/navigation";
import CustomScaleBuilder from "@/components/custom-scale-builder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Palette, User } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();

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

          {/* Help */}
          <Card>
            <CardHeader>
              <CardTitle>Help & Support</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <p className="text-muted-foreground text-sm">
                  Need help? Contact your therapist or administrator.
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