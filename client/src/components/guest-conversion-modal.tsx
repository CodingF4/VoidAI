import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState } from "react";
import { Star, Gift, Trophy } from "lucide-react";
import { motion } from "framer-motion";

interface GuestConversionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GuestConversionModal({ isOpen, onClose }: GuestConversionModalProps) {
  const [, setLocation] = useLocation();
  const [currentStep, setCurrentStep] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);

  const steps = [
    {
      title: "Welcome to VOID CHAT",
      description: "Experience the full potential of AI-powered conversations",
      icon: Star,
    },
    {
      title: "Unlock Premium Features",
      description: "Create an account to access advanced features and save your progress",
      icon: Gift,
    },
    {
      title: "Get Started Now",
      description: "Join thousands of users already enjoying premium features",
      icon: Trophy,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
      setHasInteracted(true);
    } else {
      handleCreateAccount();
    }
  };

  const handleCreateAccount = () => {
    onClose();
    setLocation("/auth?mode=register");
  };

  const handleLogin = () => {
    onClose();
    setLocation("/auth?mode=login");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center"
          >
            <div className="rounded-full bg-primary/10 p-3 mb-4">
              <div className="h-6 w-6 text-primary">
                {steps[currentStep].icon}
              </div>
            </div>
            <DialogTitle className="text-2xl font-bold">
              {steps[currentStep].title}
            </DialogTitle>
            <DialogDescription className="mt-2">
              {steps[currentStep].description}
            </DialogDescription>
          </motion.div>
        </DialogHeader>

        <div className="flex flex-col gap-4 mt-4">
          <div className="flex justify-center gap-2 mb-4">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors duration-200 ${
                  index === currentStep ? "bg-primary" : "bg-gray-200"
                }`}
              />
            ))}
          </div>

          <Button
            onClick={handleNext}
            className="w-full bg-gradient-to-r from-primary to-primary/80"
          >
            {currentStep < steps.length - 1 ? "Continue" : "Create Account"}
          </Button>

          {hasInteracted && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleLogin}
                className="flex-1"
              >
                Log In
              </Button>
              <Button
                variant="ghost"
                onClick={onClose}
                className="flex-1"
              >
                Maybe Later
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}