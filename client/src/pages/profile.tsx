import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Loader2, LogOut, ArrowUpRight, Shield } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function ProfilePage() {
  const { user, logoutMutation } = useAuth();
  const [, setLocation] = useLocation();

  if (!user) {
    setLocation("/auth");
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-4 min-h-screen">
      <div className="grid grid-cols-[1fr_400px] gap-4">
        <div></div>

        <div className="relative mt-8">
          {!user.isAdmin && (
            <Button
              variant="default"
              className="absolute -top-12 right-0 gap-2"
              onClick={() => setLocation("/subscription")}
            >
              <ArrowUpRight className="h-4 w-4" />
              Upgrade Plan
            </Button>
          )}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Profile</CardTitle>
                  <CardDescription>Manage your account settings</CardDescription>
                </div>
                <ThemeToggle />
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Account Information</h3>
                <div className="grid gap-1">
                  <div className="text-sm text-muted-foreground">Username</div>
                  <div className="font-medium">{user.username}</div>
                </div>
                <div className="grid gap-1">
                  <div className="text-sm text-muted-foreground">Member Since</div>
                  <div className="font-medium">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="grid gap-1">
                  <div className="text-sm text-muted-foreground">Account Type</div>
                  <div className="flex items-center gap-2">
                    {user.isAdmin ? (
                      <Badge variant="default" className="bg-primary text-primary-foreground">
                        <Shield className="w-3 h-3 mr-1" />
                        Administrator
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="capitalize">
                        {user.subscriptionTier}
                      </Badge>
                    )}
                  </div>
                </div>
                {user.isAdmin && (
                  <div className="mt-4 p-4 bg-primary/10 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4" />
                      Administrator Access
                    </h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      You have full access to all features and administrative capabilities.
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Actions</h3>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto"
                    onClick={() => setLocation("/")}
                  >
                    Back to Chat
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full sm:w-auto"
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                  >
                    {logoutMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing out...
                      </>
                    ) : (
                      <>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}