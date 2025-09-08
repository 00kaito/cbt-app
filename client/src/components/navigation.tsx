import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Brain, Bell, User } from "lucide-react";
import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Navigation() {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const navItems = user?.role === "therapist" 
    ? [
        { href: "/therapist", label: "Dashboard", active: location === "/therapist" },
        { href: "/therapist/patients", label: "Patients", active: location.startsWith("/therapist/patients") },
        { href: "/therapist/sessions", label: "Sessions", active: location.startsWith("/therapist/sessions") },
      ]
    : [
        { href: "/", label: "Dashboard", active: location === "/" },
        { href: "/completed-exercises", label: "Completed Exercises", active: location === "/completed-exercises" },
        { href: "/settings", label: "Settings", active: location === "/settings" },
      ];

  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link href={user?.role === "therapist" ? "/therapist" : "/"} className="flex items-center space-x-2">
              <Brain className="text-primary text-2xl" />
              <h1 className="text-xl font-semibold text-foreground" data-testid="text-logo">
                MindBridge
              </h1>
            </Link>
            
            <nav className="hidden md:flex space-x-6">
              {navItems.map((item) => (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={
                    item.active
                      ? "text-primary font-medium border-b-2 border-primary pb-4"
                      : "text-muted-foreground hover:text-foreground transition-colors"
                  }
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              size="icon"
              className="relative"
              data-testid="button-notifications"
            >
              <Bell className="h-5 w-5" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2" data-testid="button-user-menu">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground text-sm font-medium">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground hidden sm:block" data-testid="text-user-name">
                    {user?.firstName} {user?.lastName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem data-testid="menu-profile">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => logoutMutation.mutate()}
                  data-testid="menu-logout"
                >
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
