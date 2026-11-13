import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertUserSchema, adminRegistrationSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

export default function AuthPage() {
  const [, params] = window.location.search.match(/tab=([^&]*)/) || [];
  const [activeTab, setActiveTab] = useState<"login" | "register" | "admin">(
    params === "register" ? "register" : params === "admin" ? "admin" : "login"
  );
  const [, setLocation] = useLocation();
  const { user, loginMutation, registerMutation, adminRegisterMutation, guestLoginMutation } = useAuth();

  const form = useForm({
    resolver: zodResolver(
      activeTab === "admin" ? adminRegistrationSchema : insertUserSchema
    ),
    defaultValues: {
      username: "",
      password: "",
      adminCode: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: any) => {
    try {
      if (activeTab === "login") {
        await loginMutation.mutateAsync(data);
        setLocation("/");
      } else if (activeTab === "admin") {
        await adminRegisterMutation.mutateAsync(data);
        setLocation("/");
      } else {
        await registerMutation.mutateAsync(data);
        setLocation("/");
      }
    } catch (error) {
      console.error("Auth error:", error);
    }
  };

  const handleGuestLogin = async () => {
    try {
      await guestLoginMutation.mutateAsync();
      setLocation("/");
    } catch (error) {
      console.error("Guest login error:", error);
    }
  };

  if (user) {
    setLocation("/");
    return (
      <div className="flex items-center justify-center min-h-screen" role="status" aria-label="Loading">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen md:grid md:grid-cols-2 gap-4 px-4 py-8 md:px-0">
      <div className="flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl md:text-3xl">Welcome to VOID CHAT</CardTitle>
            <CardDescription className="text-base">
              Your personal AI assistant for engaging conversations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleGuestLogin}
                disabled={guestLoginMutation?.isPending}
              >
                {guestLoginMutation?.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait...
                  </>
                ) : (
                  "Continue as Guest"
                )}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Tabs 
                value={activeTab} 
                onValueChange={(v) => {
                  setActiveTab(v as "login" | "register" | "admin");
                  const newUrl = `/auth?tab=${v}`;
                  window.history.replaceState(null, '', newUrl);
                }}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-3 mb-6" aria-label="Authentication options">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                  <TabsTrigger value="admin">Admin</TabsTrigger>
                </TabsList>
                <TabsContent value="login">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Enter your username" 
                                {...field} 
                                aria-required="true"
                                autoComplete="username"
                              />
                            </FormControl>
                            <FormMessage role="alert" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Enter your password" 
                                {...field} 
                                aria-required="true"
                                autoComplete="current-password"
                              />
                            </FormControl>
                            <FormMessage role="alert" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="rememberMe"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                aria-label="Remember me on this device"
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Remember me</FormLabel>
                              <FormDescription>
                                Stay logged in for 30 days
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loginMutation.isPending}
                        aria-disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                            <span>Logging in...</span>
                            <span className="sr-only">Please wait while logging in</span>
                          </>
                        ) : (
                          "Login"
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                <TabsContent value="register">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Choose a username" 
                                {...field} 
                                aria-required="true"
                                autoComplete="username"
                              />
                            </FormControl>
                            <FormDescription>
                              At least 3 characters long
                            </FormDescription>
                            <FormMessage role="alert" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Create a password" 
                                {...field} 
                                aria-required="true"
                                autoComplete="new-password"
                              />
                            </FormControl>
                            <FormDescription>
                              At least 6 characters long
                            </FormDescription>
                            <FormMessage role="alert" />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={registerMutation.isPending}
                        aria-disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                            <span>Creating account...</span>
                            <span className="sr-only">Please wait while creating your account</span>
                          </>
                        ) : (
                          "Create Account"
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
                <TabsContent value="admin">
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Choose a username" 
                                {...field} 
                                aria-required="true"
                                autoComplete="username"
                              />
                            </FormControl>
                            <FormDescription>
                              At least 3 characters long
                            </FormDescription>
                            <FormMessage role="alert" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Create a password" 
                                {...field} 
                                aria-required="true"
                                autoComplete="new-password"
                              />
                            </FormControl>
                            <FormDescription>
                              At least 6 characters long
                            </FormDescription>
                            <FormMessage role="alert" />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="adminCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Admin Code</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Enter admin code" 
                                {...field} 
                                aria-required="true"
                              />
                            </FormControl>
                            <FormDescription>
                              Enter the secure admin code
                            </FormDescription>
                            <FormMessage role="alert" />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={adminRegisterMutation.isPending}
                        aria-disabled={adminRegisterMutation.isPending}
                      >
                        {adminRegisterMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                            <span>Creating admin account...</span>
                            <span className="sr-only">Please wait while creating your admin account</span>
                          </>
                        ) : (
                          "Create Admin Account"
                        )}
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="hidden md:flex flex-col justify-center p-8 bg-muted/50">
        <div className="max-w-md mx-auto space-y-6">
          <h2 className="text-3xl font-bold">Experience Intelligent Conversations</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div 
                className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0"
                aria-hidden="true"
              >
                1
              </div>
              <div>
                <h3 className="font-semibold text-lg">Smart Conversation Starters</h3>
                <p className="text-muted-foreground">Get personalized suggestions to kick off engaging discussions</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div 
                className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0"
                aria-hidden="true"
              >
                2
              </div>
              <div>
                <h3 className="font-semibold text-lg">AI-Powered Responses</h3>
                <p className="text-muted-foreground">Enjoy meaningful interactions with our advanced AI assistant</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div 
                className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary flex-shrink-0"
                aria-hidden="true"
              >
                3
              </div>
              <div>
                <h3 className="font-semibold text-lg">File Analysis & Insights</h3>
                <p className="text-muted-foreground">Get detailed analysis of your documents and files</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}