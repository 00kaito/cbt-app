import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Redirect } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Brain, Heart, Shield, Users } from "lucide-react";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    firstName: "",
    lastName: "",
    role: "patient" as "patient" | "therapist",
  });

  // Redirect if already logged in
  if (user) {
    return <Redirect to={user.role === "therapist" ? "/therapist" : "/"} />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      loginMutation.mutate({
        username: formData.username,
        password: formData.password,
      });
    } else {
      registerMutation.mutate(formData);
    }
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Brain className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">MindBridge</h1>
            </div>
            <CardTitle data-testid="auth-title">
              {isLogin ? "Witaj ponownie" : "Utwórz konto"}
            </CardTitle>
            <CardDescription>
              {isLogin 
                ? "Zaloguj się, aby kontynuować swój proces terapeutyczny" 
                : "Dołącz do naszej wspierającej społeczności"
              }
            </CardDescription>
          </CardHeader>
          
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {!isLogin && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">Imię</Label>
                      <Input
                        id="firstName"
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        required={!isLogin}
                        data-testid="input-firstName"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Nazwisko</Label>
                      <Input
                        id="lastName"
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        required={!isLogin}
                        data-testid="input-lastName"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required={!isLogin}
                      data-testid="input-email"
                    />
                  </div>

                  <div>
                    <Label htmlFor="role">Jestem...</Label>
                    <Select 
                      value={formData.role} 
                      onValueChange={(value: "patient" | "therapist") => handleInputChange("role", value)}
                    >
                      <SelectTrigger data-testid="select-role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="patient">Pacjentem</SelectItem>
                        <SelectItem value="therapist">Terapeutą</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="username">Nazwa użytkownika</Label>
                <Input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => handleInputChange("username", e.target.value)}
                  required
                  data-testid="input-username"
                />
              </div>

              <div>
                <Label htmlFor="password">Hasło</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  required
                  data-testid="input-password"
                />
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full"
                disabled={loginMutation.isPending || registerMutation.isPending}
                data-testid={isLogin ? "button-login" : "button-register"}
              >
                {loginMutation.isPending || registerMutation.isPending 
                  ? "Proszę czekać..." 
                  : (isLogin ? "Zaloguj się" : "Utwórz konto")
                }
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-sm text-primary hover:underline"
                  data-testid="button-toggle-auth"
                >
                  {isLogin 
                    ? "Nie masz konta? Zarejestruj się" 
                    : "Masz już konto? Zaloguj się"
                  }
                </button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>

      {/* Right side - Hero */}
      <div className="flex-1 bg-gradient-to-br from-primary/10 to-secondary/10 p-8 flex items-center justify-center">
        <div className="max-w-md text-center space-y-6">
          <div className="space-y-4">
            <Brain className="h-16 w-16 text-primary mx-auto" />
            <h2 className="text-3xl font-bold text-foreground">
              Zdrowie psychiczne uproszczone
            </h2>
            <p className="text-muted-foreground text-lg">
              Śledź swój nastrój, ćwicz techniki CBT i łącz się z terapeutami na jednej platformie.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-left">
              <Heart className="h-6 w-6 text-accent flex-shrink-0" />
              <div>
                <h3 className="font-medium text-foreground">Śledzenie nastroju</h3>
                <p className="text-sm text-muted-foreground">Monitoruj swoje samopoczucie z personalizowanymi skalami</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-left">
              <Shield className="h-6 w-6 text-accent flex-shrink-0" />
              <div>
                <h3 className="font-medium text-foreground">Narzędzia CBT</h3>
                <p className="text-sm text-muted-foreground">Ćwicz ćwiczenia terapii poznawczo-behawioralnej opartej na dowodach</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-left">
              <Users className="h-6 w-6 text-accent flex-shrink-0" />
              <div>
                <h3 className="font-medium text-foreground">Połączenie z terapeutą</h3>
                <p className="text-sm text-muted-foreground">Dziel się postępami i współpracuj ze specjalistami zdrowia psychicznego</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
