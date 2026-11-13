import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Define subscription tiers
export const SubscriptionTier = {
  FREE: "free",
  PRO: "pro",
  ELITE: "elite",
  ENTERPRISE: "enterprise",
} as const;

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").unique(),
  password: text("password").notNull(),
  isGuest: boolean("is_guest").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  subscriptionTier: text("subscription_tier", {
    enum: Object.values(SubscriptionTier)
  }).default(SubscriptionTier.FREE).notNull(),
  subscriptionEndsAt: timestamp("subscription_ends_at"),
  isAdmin: boolean("is_admin").default(false).notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  role: text("role", { enum: ["user", "assistant"] }).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  userId: serial("user_id").references(() => users.id),
});

// Subscription features table
export const subscriptionFeatures = pgTable("subscription_features", {
  id: serial("id").primaryKey(),
  tier: text("tier", { enum: Object.values(SubscriptionTier) }).notNull(),
  feature: text("feature").notNull(),
  value: text("value").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User preferences table
export const preferences = pgTable("preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  colorScheme: text("color_scheme", { enum: ["default", "professional", "vibrant"] }).default("default").notNull(),
  fontSize: text("font_size", { enum: ["small", "medium", "large"] }).default("medium").notNull(),
  spacing: text("spacing", { enum: ["compact", "comfortable", "spacious"] }).default("comfortable").notNull(),
  messageLayout: text("message_layout", { enum: ["modern", "classic"] }).default("modern").notNull(),
  sidebarVisible: boolean("sidebar_visible").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User schemas
export const insertUserSchema = createInsertSchema(users)
  .extend({
    password: z.string().min(6, "Password must be at least 6 characters"),
    username: z.string().min(3, "Username must be at least 3 characters"),
    email: z.string().email("Please enter a valid email address").optional(),
    isGuest: z.boolean().optional(),
  })
  .omit({
    id: true,
    createdAt: true,
    subscriptionTier: true,
    subscriptionEndsAt: true,
    isAdmin: true,
    stripeCustomerId: true,
    stripeSubscriptionId: true,
  });

// Special admin registration schema with admin code
export const adminRegistrationSchema = insertUserSchema.extend({
  adminCode: z.string().min(1, "Admin code is required"),
});

// Message schemas
export const insertMessageSchema = createInsertSchema(messages).pick({
  content: true,
  role: true,
  userId: true,
});

// Feature schema
export const insertFeatureSchema = createInsertSchema(subscriptionFeatures).omit({
  id: true,
  createdAt: true,
});

// Preference schemas
export const insertPreferenceSchema = createInsertSchema(preferences)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true
  });

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type AdminRegistration = z.infer<typeof adminRegistrationSchema>;
export type User = typeof users.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;
export type SubscriptionFeature = typeof subscriptionFeatures.$inferSelect;
export type InsertPreference = z.infer<typeof insertPreferenceSchema>;
export type Preference = typeof preferences.$inferSelect;

// Subscription tier features
export const SUBSCRIPTION_FEATURES = {
  [SubscriptionTier.FREE]: {
    messageLimit: 1000,
    modelVersion: "gemini-2.5-flash",
    conversationMemory: false,
    customPersonality: false,
  },
  [SubscriptionTier.PRO]: {
    messageLimit: 10000,
    modelVersion: "gemini-2.5-flash",
    conversationMemory: true,
    customPersonality: true,
  },
  [SubscriptionTier.ELITE]: {
    messageLimit: 50000,
    modelVersion: "gemini-2.5-flash",
    conversationMemory: true,
    customPersonality: true,
    prioritySupport: true,
    advancedAnalytics: true,
    customPrompts: true,
    teamCollaboration: true,
  },
  [SubscriptionTier.ENTERPRISE]: {
    messageLimit: -1, // unlimited
    modelVersion: "gemini-2.5-flash",
    conversationMemory: true,
    customPersonality: true,
    prioritySupport: true,
    advancedAnalytics: true,
    customPrompts: true,
    teamCollaboration: true,
    customTraining: true,
    dedicatedSupport: true,
    customIntegrations: true,
    sla: true,
    onPremiseDeployment: true,
    multiLanguageSupport: true,
    customDataRetention: true,
    enterpriseReporting: true,
    apiAccess: true,
    whiteLabeling: true,
  },
} as const;

// Schema for converting guest account to full account
export const guestToFullAccountSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});