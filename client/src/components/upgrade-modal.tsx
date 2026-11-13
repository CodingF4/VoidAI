import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { guestToFullAccountSchema } from "@shared/schema";
import type { z } from "zod";
import { AlertCircle } from "lucide-react";

type FormData = z.infer<typeof guestToFullAccountSchema>;

export function UpgradeModal({ 
  isOpen, 
  onClose,
  onComplete 
}: { 
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  const { user, guestToFullAccountMutation } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(guestToFullAccountSchema),
    defaultValues: {
      username: user?.username || "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);
      await guestToFullAccountMutation.mutateAsync(data);
      onComplete();
    } catch (error) {
      console.error("Error upgrading account:", error);
      setError(error instanceof Error ? error.message : "Failed to upgrade account");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Complete Your Account</DialogTitle>
          <DialogDescription>
            Add an email address to enable premium features and subscription options.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input 
                      type="email" 
                      placeholder="Enter your email address" 
                      aria-required="true"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Choose a username"
                      aria-required="true"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
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
                      placeholder="Create a secure password"
                      aria-required="true"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button 
              type="submit" 
              className="w-full"
              disabled={guestToFullAccountMutation.isPending}
              aria-busy={guestToFullAccountMutation.isPending}
            >
              {guestToFullAccountMutation.isPending ? "Creating Account..." : "Complete Account"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}