
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { useState } from "react";
import { UpgradeModal } from "./upgrade-modal";
import { GuestConversionModal } from "./guest-conversion-modal";
import { motion } from "framer-motion";
import { Lock, CheckCircle, ArrowRight, Star } from "lucide-react";
import { SUBSCRIPTION_FEATURES, SubscriptionTier } from "@shared/schema";

function Feature({ title, status }: { title: string; status: "locked" | "available" }) {
  return (
    <div className="flex items-center gap-2">
      {status === "locked" ? (
        <Lock className="h-4 w-4 text-muted-foreground" />
      ) : (
        <CheckCircle className="h-4 w-4 text-primary" />
      )}
      <span className={status === "locked" ? "text-muted-foreground" : ""}>
        {title}
      </span>
    </div>
  );
}

export function GuestUpgradeBanner() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showConversionModal, setShowConversionModal] = useState(false);

  if (!user?.isGuest) return null;

  const freeFeatures = SUBSCRIPTION_FEATURES[SubscriptionTier.FREE];
  const proFeatures = SUBSCRIPTION_FEATURES[SubscriptionTier.PRO];

  return (
    <>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, delay: 1 }}
        className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background to-background/80 border-t p-4 backdrop-blur-sm z-50"
      >
        <div className="container max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <h3 className="font-medium text-lg">Unlock Premium Features</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                Create a full account to access advanced features and personalized experiences:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-4">
                <Feature title="Save Conversations" status="locked" />
                <Feature title={`${freeFeatures.messageLimit} Messages/Month`} status="available" />
                <Feature title="Custom AI Personality" status="locked" />
                <Feature title="Advanced Analytics" status="locked" />
              </div>
            </div>
            <div className="flex gap-2 items-center self-stretch md:self-center">
              <Button
                variant="ghost"
                onClick={() => setShowConversionModal(true)}
                className="flex-1 md:flex-none"
              >
                Continue as Guest
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/auth?mode=login")}
                className="flex-1 md:flex-none"
              >
                Log In
              </Button>
              <Button
                onClick={() => setShowUpgradeModal(true)}
                className="flex-1 md:flex-none bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
              >
                Create Account <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      <UpgradeModal 
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        onComplete={() => {
          setShowUpgradeModal(false);
          setLocation("/subscription");
        }}
      />

      <GuestConversionModal
        isOpen={showConversionModal}
        onClose={() => setShowConversionModal(false)}
      />
    </>
  );
}
