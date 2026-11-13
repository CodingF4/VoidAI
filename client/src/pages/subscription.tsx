import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { SUBSCRIPTION_FEATURES, SubscriptionTier } from "@shared/schema";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { loadStripe } from '@stripe/stripe-js';
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { EmailCollectionModal } from "@/components/email-collection-modal";
import { UpgradeRecommendation } from "@/components/upgrade-recommendation";
import { SubscriptionWizard } from "@/components/subscription-wizard";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [pendingTier, setPendingTier] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  const features = {
    messageLimit: "Messages per month",
    modelVersion: "AI Model Version",
    conversationMemory: "Conversation Memory",
    customPersonality: "Custom AI Personality",
    prioritySupport: "Priority Support",
    customTraining: "Custom AI Training",
    advancedAnalytics: "Advanced Analytics",
    customPrompts: "Custom Prompts",
    teamCollaboration: "Team Collaboration",
    dedicatedSupport: "Dedicated Support",
    customIntegrations: "Custom Integrations",
    sla: "Service Level Agreement",
    onPremiseDeployment: "On-Premise Deployment",
  };

  const upgradeMutation = useMutation({
    mutationFn: async (tier: string) => {
      try {
        console.log("Starting subscription upgrade for tier:", tier);
        console.log("Current user:", user);

        if (!user?.email) {
          console.log("No email found, showing email modal");
          setPendingTier(tier);
          setShowEmailModal(true);
          return null;
        }

        const response = await apiRequest("POST", "/api/create-subscription", { tier });
        const data = await response.json();

        if (!response.ok) {
          if (data.requiresEmail) {
            console.log("Server requires email, showing modal");
            setPendingTier(tier);
            setShowEmailModal(true);
            return null;
          }
          throw new Error(data.message || "Subscription configuration is not complete. Please try again later.");
        }

        if (!data.url) {
          throw new Error("Failed to create subscription session");
        }

        window.location.href = data.url;
      } catch (error: any) {
        console.error("Subscription error:", error);
        throw new Error(error.message || "Failed to start subscription process");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Subscription Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleUpgrade = async (tier: string) => {
    if (user?.subscriptionTier === tier) return;
    upgradeMutation.mutate(tier);
  };

  const handleEmailAdded = () => {
    setShowEmailModal(false);
    if (pendingTier) {
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      setTimeout(() => {
        handleUpgrade(pendingTier);
        setPendingTier(null);
      }, 500); 
    }
  };

  const handleWizardSelectTier = (tier: string) => {
    setShowWizard(false);
    handleUpgrade(tier);
  };

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <div className="flex justify-between items-center mb-10">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => setLocation("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Chat
        </Button>

        <Button
          variant="outline"
          onClick={() => setShowWizard(true)}
          className="mb-4"
        >
          Need Help Choosing?
        </Button>
      </div>

      <div className="mb-10">
        <UpgradeRecommendation onUpgrade={handleUpgrade} />
      </div>

      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-lg text-muted-foreground">
          Unlock advanced AI capabilities with our premium plans
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {Object.entries(SUBSCRIPTION_FEATURES).map(([tier, tierFeatures]) => (
          <Card key={tier} className={`relative ${user?.subscriptionTier === tier ? 'border-primary' : ''}`}>
            {user?.subscriptionTier === tier && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-sm rounded-full">
                Current Plan
              </div>
            )}
            <CardHeader>
              <CardTitle className="text-2xl">{tier.charAt(0).toUpperCase() + tier.slice(1)}</CardTitle>
              <CardDescription>
                {tier === SubscriptionTier.FREE && "Get started with basic features"}
                {tier === SubscriptionTier.PRO && "Advanced features for power users"}
                {tier === SubscriptionTier.ELITE && "Premium features for professionals"}
                {tier === SubscriptionTier.ENTERPRISE && "Custom solutions for organizations"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-2xl font-bold">
                  {tier === SubscriptionTier.FREE && "Free"}
                  {tier === SubscriptionTier.PRO && "$10/month"}
                  {tier === SubscriptionTier.ELITE && "$100/month"}
                  {tier === SubscriptionTier.ENTERPRISE && "Custom Pricing"}
                </div>
                <ul className="space-y-2">
                  {Object.entries(features).map(([feature, label]) => {
                    const value = tierFeatures[feature as keyof typeof tierFeatures];
                    const isAvailable = value !== undefined && value !== false;
                    return (
                      <li key={feature} className="flex items-center gap-2">
                        {isAvailable ? (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        )}
                        <span>
                          {label}{" "}
                          {feature === "messageLimit" && (
                            <span className="font-semibold">
                              {value === -1 ? "Unlimited" : value.toLocaleString()}
                            </span>
                          )}
                          {feature === "modelVersion" && (
                            <span className="font-semibold">{value}</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {tier === SubscriptionTier.FREE || user?.subscriptionTier === tier ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    disabled
                  >
                    {user?.subscriptionTier === tier ? "CURRENT" : "Free Plan"}
                  </Button>
                ) : tier === SubscriptionTier.ENTERPRISE ? (
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => window.location.href = "mailto:contact@void-chat.com"}
                  >
                    Contact Sales
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant="default"
                    disabled={upgradeMutation.isPending}
                    onClick={() => handleUpgrade(tier)}
                  >
                    {upgradeMutation.isPending ? "Processing..." : "Upgrade"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <SubscriptionWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onSelectTier={handleWizardSelectTier}
      />

      <EmailCollectionModal
        isOpen={showEmailModal}
        onClose={() => {
          setShowEmailModal(false);
          setPendingTier(null);
        }}
        onComplete={handleEmailAdded}
      />
    </div>
  );
}