import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { SUBSCRIPTION_FEATURES, SubscriptionTier } from "@shared/schema";
import { Sparkles } from "lucide-react";
import { useMemo } from "react";

interface UpgradeRecommendationProps {
  onUpgrade: (tier: string) => void;
}

export function UpgradeRecommendation({ onUpgrade }: UpgradeRecommendationProps) {
  const { user } = useAuth();

  const recommendedTier = useMemo(() => {
    // Simple recommendation logic based on current subscription
    // In a real app, this would be more sophisticated based on usage patterns
    if (!user) return SubscriptionTier.FREE;
    
    switch (user.subscriptionTier) {
      case SubscriptionTier.FREE:
        return SubscriptionTier.PRO;
      case SubscriptionTier.PRO:
        return SubscriptionTier.ELITE;
      default:
        return user.subscriptionTier;
    }
  }, [user]);

  if (!user || user.subscriptionTier === SubscriptionTier.ENTERPRISE) {
    return null;
  }

  const tierFeatures = SUBSCRIPTION_FEATURES[recommendedTier as keyof typeof SUBSCRIPTION_FEATURES];
  const currentFeatures = SUBSCRIPTION_FEATURES[user.subscriptionTier as keyof typeof SUBSCRIPTION_FEATURES];

  const improvements = {
    messageLimit: tierFeatures.messageLimit > currentFeatures.messageLimit 
      ? `${tierFeatures.messageLimit - currentFeatures.messageLimit} more messages per month`
      : null,
    modelVersion: tierFeatures.modelVersion !== currentFeatures.modelVersion
      ? "Access to advanced AI model"
      : null,
    conversationMemory: !currentFeatures.conversationMemory && tierFeatures.conversationMemory
      ? "Long-term conversation memory"
      : null,
    customPersonality: !currentFeatures.customPersonality && tierFeatures.customPersonality
      ? "Custom AI personality settings"
      : null,
  };

  const visibleImprovements = Object.values(improvements).filter(Boolean);

  return (
    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Recommended Upgrade
        </CardTitle>
        <CardDescription>
          Based on your usage, we recommend upgrading to {recommendedTier} for these benefits:
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 mb-4">
          {visibleImprovements.map((improvement, index) => (
            <li key={index} className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
              <span className="text-sm">{improvement}</span>
            </li>
          ))}
        </ul>
        <Button 
          onClick={() => onUpgrade(recommendedTier)}
          className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
        >
          Upgrade to {recommendedTier}
        </Button>
      </CardContent>
    </Card>
  );
}
