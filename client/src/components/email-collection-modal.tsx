import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { z } from "zod";
import { AlertCircle, Mail } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { VerificationGame } from "./verification-game";
import { motion } from "framer-motion";

const emailSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type FormData = z.infer<typeof emailSchema>;

export function EmailCollectionModal({ 
  isOpen, 
  onClose,
  onComplete 
}: { 
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVerification, setShowVerification] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: user?.email || "",
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setError(null);
      setIsSubmitting(true);

      console.log("Updating email:", data.email);
      const res = await apiRequest("POST", "/api/user/update-email", data);

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message);
      }

      await res.json(); // Wait for the response to ensure the update is complete
      setShowVerification(true);
    } catch (error) {
      console.error("Error updating email:", error);
      setError(error instanceof Error ? error.message : "Failed to update email");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerificationComplete = (code: string) => {
    // Here we would normally verify the code with the server
    // For now, we'll just complete the process
    onComplete();
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex flex-col items-center text-center"
          >
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle>Add Your Email</DialogTitle>
            <DialogDescription>
              Please add your email to continue with the upgrade process
            </DialogDescription>
          </motion.div>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 p-3 rounded-md">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}

        {showVerification ? (
          <VerificationGame
            onComplete={handleVerificationComplete}
            onSkip={onComplete}
          />
        ) : (
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
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? "Updating..." : "Continue"}
              </Button>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}