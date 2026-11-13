import Stripe from "stripe";
import { SubscriptionTier } from "@shared/schema";

const stripeSecret = process.env.STRIPE_SECRET_KEY;

export const stripe = stripeSecret
  ? new Stripe(stripeSecret, {
      apiVersion: "2025-02-24.acacia" as any,
    })
  : null;

export const SUBSCRIPTION_PRICES = {
  [SubscriptionTier.PRO]: process.env.STRIPE_PRICE_PRO || "",
  [SubscriptionTier.ELITE]: process.env.STRIPE_PRICE_ELITE || "",
};

export async function createSubscriptionSession(
  customerId: string,
  priceId: string,
  returnUrl: string
): Promise<string> {
  if (!stripe) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY to enable subscriptions.");
  }

  if (!priceId) {
    throw new Error("Invalid price ID");
  }

  if (!returnUrl || !returnUrl.startsWith("http")) {
    throw new Error("Invalid return URL");
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer: customerId,
      success_url: `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}?canceled=true`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      subscription_data: {
        trial_period_days: 7,
      },
    });

    if (!session.url) {
      throw new Error("Failed to create checkout session URL");
    }

    return session.url;
  } catch (error: any) {
    console.error("Stripe session creation error:", error);
    throw new Error(`Failed to create subscription session: ${error.message}`);
  }
}

export async function cancelSubscription(subscriptionId: string): Promise<void> {
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }
  await stripe.subscriptions.cancel(subscriptionId);
}

export async function updateSubscription(
  subscriptionId: string,
  newPriceId: string
): Promise<void> {
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }
  await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscriptionId,
        price: newPriceId,
      },
    ],
  });
}
