import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { Check, MessageSquare, Brain, Code, BadgeCheck } from "lucide-react";
import { SUBSCRIPTION_FEATURES, SubscriptionTier } from "@shared/schema";

interface WizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTier: (tier: string) => void;
}

type Step = {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
};

export function SubscriptionWizard({ isOpen, onClose, onSelectTier }: WizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const steps: Step[] = [
    {
      id: 1,
      title: "Chat Experience",
      description: "How would you like to interact with the AI?",
      icon: <MessageSquare className="h-6 w-6" />,
    },
    {
      id: 2,
      title: "AI Capabilities",
      description: "What level of AI intelligence do you need?",
      icon: <Brain className="h-6 w-6" />,
    },
    {
      id: 3,
      title: "Advanced Features",
      description: "Select any additional features you'd like",
      icon: <Code className="h-6 w-6" />,
    },
    {
      id: 4,
      title: "Recommendation",
      description: "Based on your needs, here's our recommendation",
      icon: <BadgeCheck className="h-6 w-6" />,
    },
  ];

  const handleFeatureSelect = (feature: string) => {
    setSelectedFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  const getRecommendedTier = () => {
    const featureCount = selectedFeatures.length;
    if (featureCount <= 2) return SubscriptionTier.FREE;
    if (featureCount <= 4) return SubscriptionTier.PRO;
    return SubscriptionTier.ELITE;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="grid gap-4">
            <FeatureOption
              title="Basic Chat"
              description="Simple conversations with AI"
              selected={selectedFeatures.includes('basicChat')}
              onClick={() => handleFeatureSelect('basicChat')}
            />
            <FeatureOption
              title="Advanced Conversations"
              description="Multi-turn conversations with context memory"
              selected={selectedFeatures.includes('advancedChat')}
              onClick={() => handleFeatureSelect('advancedChat')}
            />
          </div>
        );
      case 1:
        return (
          <div className="grid gap-4">
            <FeatureOption
              title="Standard AI"
              description="Good for general conversations"
              selected={selectedFeatures.includes('standardAI')}
              onClick={() => handleFeatureSelect('standardAI')}
            />
            <FeatureOption
              title="Advanced AI"
              description="Enhanced understanding and responses"
              selected={selectedFeatures.includes('advancedAI')}
              onClick={() => handleFeatureSelect('advancedAI')}
            />
          </div>
        );
      case 2:
        return (
          <div className="grid gap-4">
            <FeatureOption
              title="File Analysis"
              description="AI can analyze uploaded files"
              selected={selectedFeatures.includes('fileAnalysis')}
              onClick={() => handleFeatureSelect('fileAnalysis')}
            />
            <FeatureOption
              title="Custom Training"
              description="Train AI on your specific needs"
              selected={selectedFeatures.includes('customTraining')}
              onClick={() => handleFeatureSelect('customTraining')}
            />
          </div>
        );
      case 3:
        const recommendedTier = getRecommendedTier();
        return (
          <div className="text-center">
            <h3 className="text-xl font-semibold mb-4">
              Recommended: {recommendedTier.charAt(0).toUpperCase() + recommendedTier.slice(1)} Plan
            </h3>
            <p className="text-muted-foreground mb-6">
              Based on your selected features, we recommend the {recommendedTier} plan.
            </p>
            <Button 
              onClick={() => onSelectTier(recommendedTier)}
              className="w-full bg-gradient-to-r from-primary to-primary/80"
            >
              Continue with {recommendedTier} Plan
            </Button>
          </div>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Find Your Perfect Plan</DialogTitle>
          <DialogDescription>
            Let's find the best plan for your needs
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => (
            <div
              key={step.id}
              className="flex flex-col items-center"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  index <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted'
                }`}
              >
                {step.icon}
              </div>
              <div className="h-1 w-full bg-muted mt-2" />
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-[300px]"
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between mt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
            disabled={currentStep === 0}
          >
            Back
          </Button>
          <Button
            onClick={() => setCurrentStep(prev => Math.min(3, prev + 1))}
            disabled={currentStep === 3}
          >
            Next
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FeatureOption({ 
  title, 
  description, 
  selected, 
  onClick 
}: { 
  title: string; 
  description: string; 
  selected: boolean; 
  onClick: () => void;
}) {
  return (
    <Card
      className={`p-4 cursor-pointer transition-all ${
        selected ? 'border-primary bg-primary/5' : ''
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium">{title}</h4>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        {selected && <Check className="h-5 w-5 text-primary" />}
      </div>
    </Card>
  );
}
