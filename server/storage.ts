import { messages, type Message, type InsertMessage, users, type User, type InsertUser, type Preference, type InsertPreference } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  getMessages(userId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  clearMessages(userId: number): Promise<void>;
  getUserPreferences(userId: number): Promise<Preference>;
  updateUserPreferences(userId: number, preferences: InsertPreference): Promise<Preference>;
  updateStripeCustomerId(userId: number, customerId: string): Promise<User>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private messages: Map<number, Message>;
  private users: Map<number, User>;
  private preferences: Map<number, Preference>;
  currentId: number;
  sessionStore: session.Store;

  constructor() {
    this.messages = new Map();
    this.users = new Map();
    this.preferences = new Map();
    this.currentId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // Prune expired entries every 24h
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = {
      id,
      username: insertUser.username,
      email: insertUser.email || null,
      password: insertUser.password,
      isGuest: insertUser.isGuest !== undefined ? insertUser.isGuest : true,
      isAdmin: false,
      subscriptionTier: "free",
      subscriptionEndsAt: null,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const user = await this.getUser(id);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = {
      ...user,
      ...updates,
    };

    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getMessages(userId: number): Promise<Message[]> {
    // Filter messages by userId
    return Array.from(this.messages.values())
      .filter(message => message.userId === userId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentId++;
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: new Date(),
      userId: insertMessage.userId || 1 // Use provided userId or default to 1
    };
    this.messages.set(id, message);
    return message;
  }

  async clearMessages(userId: number): Promise<void> {
    // Only clear messages for the specific user
    const messageEntries = Array.from(this.messages.entries());
    for (const [id, message] of messageEntries) {
      if (message.userId === userId) {
        this.messages.delete(id);
      }
    }
  }

  async getUserPreferences(userId: number): Promise<Preference> {
    const existingPrefs = this.preferences.get(userId);
    if (existingPrefs) {
      return existingPrefs;
    }

    // Create default preferences for new users 
    const defaultPrefs: Preference = {
      id: this.currentId++,
      userId,
      colorScheme: "default",
      fontSize: "medium",
      spacing: "comfortable",
      messageLayout: "modern",
      sidebarVisible: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.preferences.set(userId, defaultPrefs);
    return defaultPrefs;
  }

  async updateUserPreferences(userId: number, newPrefs: InsertPreference): Promise<Preference> {
    const existingPrefs = await this.getUserPreferences(userId);

    const updatedPrefs: Preference = {
      ...existingPrefs,
      ...newPrefs,
      updatedAt: new Date()
    };

    this.preferences.set(userId, updatedPrefs);
    return updatedPrefs;
  }

  async updateStripeCustomerId(userId: number, customerId: string): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const updatedUser = {
      ...user,
      stripeCustomerId: customerId
    };

    this.users.set(userId, updatedUser);
    return updatedUser;
  }
}

export const storage = new MemStorage();