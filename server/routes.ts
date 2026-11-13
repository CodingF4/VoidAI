import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMessageSchema, insertPreferenceSchema, guestToFullAccountSchema, SubscriptionTier } from "@shared/schema";
import { generateResponse, generateSummary, generateSuggestions, analyzeTopicConnections, generateStreamingResponse, processFileWithAI } from "./gemini";
import { cleanText } from "./text-processor"; // Import our simplified text processor
import { setupAuth } from "./auth";
import { WritableStream } from 'node:stream/web';
import { createSubscriptionSession, SUBSCRIPTION_PRICES, stripe } from "./stripe";
import multer from "multer";
import path from "path";
import express from "express";
import crypto from 'crypto';
import passport from 'passport';
import { hashPassword, getUploadsDir } from './utils';
import fs from 'fs/promises'; // Promise-based file operations
import { createReadStream } from 'fs'; // For stream operations


// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: async function (req, file, cb) {
      const uploadDir = getUploadsDir();
      try {
        // Make directory if it doesn't exist
        try {
          await fs.access(uploadDir);
        } catch {
          await fs.mkdir(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
      } catch (error) {
        cb(error as Error, uploadDir);
      }
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes first
  setupAuth(app);

  // Guest login route - after auth setup
  app.post("/api/guest-login", async (req, res) => {
    try {
      // Create a temporary guest user with isGuest flag
      const guestUser = await storage.createUser({
        username: `guest_${Date.now()}`,
        password: crypto.randomBytes(16).toString('hex'),
        isGuest: true
      });

      req.logIn(guestUser, async (err) => {
        if (err) {
          console.error("Error logging in guest:", err);
          return res.status(500).json({ message: "Failed to login as guest" });
        }

        // Clear any existing messages for this new guest user
        await storage.clearMessages(guestUser.id);
        res.status(200).json(guestUser);
      });
    } catch (error) {
      console.error("Guest login error:", error);
      res.status(500).json({ message: "Failed to create guest account" });
    }
  });

  // Middleware to ensure user is authenticated
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    // At this point req.user is guaranteed to exist
    if (!req.user) {
      return res.status(500).json({ message: "User not properly attached to request" });
    }
    // TypeScript will now understand that req.user is not null after this middleware
    next();
  };

  // Message endpoints
  app.get("/api/messages", requireAuth, async (req, res) => {
    try {
      // Get messages only for the current user
      const messages = await storage.getMessages(req.user!.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/messages", requireAuth, async (req, res) => {
    try {
      const data = insertMessageSchema.parse({
        ...req.body,
        userId: req.user!.id // Add user ID to the message
      });
      console.log("Processing message request:", { role: data.role, getResponse: req.body.getResponse });

      if (data.role === "user" && req.body.getResponse) {
        await storage.createMessage(data);
        const history = await storage.getMessages(req.user!.id); // Get user-specific history
        const recentMessages = history.slice(-10);

        // Handle file attachments
        let messageContent = data.content;
        let aiResponse: string;
        
        if (req.body.attachment) {
          const { name, type, url } = req.body.attachment;
          console.log(`Processing file attachment: ${name} (${type})`);
          console.log(`File URL in request: ${url}`);
          
          try {
            // For debugging, let's list all files in the uploads directory
            try {
              const files = await fs.readdir(getUploadsDir());
              console.log("Available files in uploads directory:", files);
            } catch (dirError) {
              console.error("Error reading uploads directory:", dirError);
            }
            
            // Get the full path of the uploaded file from the URL
            // Important: The URL will be in the format "/uploads/file-12345678.pdf"
            // We need to extract just the filename from the URL
            const fileName = path.basename(url);
            console.log(`Extracted filename from URL: ${fileName}`);
            
            // Check if the file exists directly in the uploads directory
            const filePath = path.join(getUploadsDir(), fileName);
            console.log(`Full file path to be processed: ${filePath}`);
            
            // Verify file exists before processing
            try {
              await fs.access(filePath);
              console.log(`File exists and is accessible: ${filePath}`);
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              console.error(`File not accessible: ${filePath}`);
              throw new Error(`File not found or not accessible: ${errorMessage}`);
            }
            
            // Process the file with Gemini based on the user's query
            const fileAnalysis = await processFileWithAI(filePath, type, data.content);
            
            // Generate response that includes the file analysis
            aiResponse = `I've analyzed the file you uploaded (${name}). Here's what I found:\n\n${fileAnalysis}\n\nIs there anything specific about this file you'd like to know?`;
            
            console.log("File processed successfully");
          } catch (fileError: any) {
            console.error("Error processing file:", fileError);
            aiResponse = `I'm having trouble analyzing the file you uploaded (${name}). The error was: ${fileError.message}. Could you try uploading it again or perhaps in a different format?`;
          }
        } else {
          // Standard message processing without attachment
          console.log("Generating AI response for standard message...");
          aiResponse = await generateResponse(
            recentMessages.map(m => ({
              role: m.role,
              content: m.content
            }))
          );
        }

        // Keep the raw model response (older text post-processing introduced spacing errors)
        // Our text processor was causing problems by adding spaces
        const cleanedResponse = aiResponse;

        const assistantMessage = await storage.createMessage({
          content: cleanedResponse,
          role: "assistant",
          userId: req.user!.id // Add userId to assistant message
        });

        // Send JSON response regardless of the Accept header
        // We're handling the streaming in the client now
        res.json({ aiMessage: assistantMessage });
      } else {
        const message = await storage.createMessage(data);
        res.json(message);
      }
    } catch (error) {
      console.error("Error processing message:", error);
      res.status(500).json({ message: "Failed to process message" });
    }
  });

  // Preferences endpoints
  app.get("/api/preferences", requireAuth, async (req, res) => {
    try {
      const preferences = await storage.getUserPreferences(req.user!.id);
      res.json(preferences);
    } catch (error: any) {
      console.error("Error fetching preferences:", error);
      res.status(500).json({ message: "Failed to fetch preferences" });
    }
  });

  app.post("/api/preferences", requireAuth, async (req, res) => {
    try {
      const validatedData = insertPreferenceSchema.parse({
        ...req.body,
        userId: req.user!.id
      });

      const preferences = await storage.updateUserPreferences(req.user!.id, validatedData);
      res.json(preferences);
    } catch (error: any) {
      console.error("Error updating preferences:", error);
      res.status(500).json({ message: "Failed to update preferences" });
    }
  });

  // File upload endpoint
  app.post("/api/upload", requireAuth, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Create public URL for the file
      const fileUrl = `/uploads/${req.file.filename}`;

      res.json({
        message: "File uploaded successfully",
        url: fileUrl,
        filename: req.file.filename
      });
    } catch (error: any) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file", error: error.message });
    }
  });

  // Serve uploaded files
  app.use('/uploads', express.static(getUploadsDir()));

  // Add route for converting guest account to full account
  app.post("/api/guest-to-full", requireAuth, async (req, res) => {
    try {
      const { username, email, password } = guestToFullAccountSchema.parse(req.body);

      // Check if username or email already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "Email already exists" });
      }

      // Update the guest user with new information
      const user = req.user;
      const updatedUser = await storage.updateUser(user!.id, {
        username,
        email,
        password: await hashPassword(password),
        isGuest: false
      });

      res.json(updatedUser);
    } catch (error: any) {
      console.error("Error converting guest account:", error);
      res.status(500).json({ message: "Failed to convert guest account" });
    }
  });
  
  // Add route for analyzing uploaded files with AI
  app.post("/api/analyze-file", requireAuth, async (req, res) => {
    try {
      const { filePath, fileType, userQuery } = req.body;
      
      if (!filePath || !fileType) {
        return res.status(400).json({ message: "File path and type are required" });
      }
      
      // The full path should include the uploads directory
      // Extract just the filename regardless of how the path was sent
      const fileName = path.basename(filePath);
      const fullPath = path.join(getUploadsDir(), fileName);
      
      console.log(`Analyzing file: ${fullPath}`);
      
      // Verify file exists before processing
      try {
        await fs.access(fullPath);
        console.log(`File exists check passed: ${fullPath}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`File not accessible: ${fullPath}`);
        return res.status(404).json({ 
          message: "File not found or not accessible", 
          error: errorMessage
        });
      }
      
      // Process the file with Gemini
      const analysis = await processFileWithAI(fullPath, fileType, userQuery || '');
      
      res.json({ 
        message: "File analyzed successfully",
        analysis
      });
    } catch (error: any) {
      console.error("Error analyzing file:", error);
      res.status(500).json({ 
        message: "Failed to analyze file", 
        error: error.message 
      });
    }
  });

  // Update subscription creation route to require email
  app.post("/api/create-subscription", requireAuth, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(503).json({
          message: "Subscriptions are not configured on this deployment."
        });
      }

      // Validate tier is one of the valid subscription tiers
      const { tier } = req.body;
      const validTier = tier as keyof typeof SUBSCRIPTION_PRICES;
      const priceId = SUBSCRIPTION_PRICES[validTier];

      if (!priceId) {
        return res.status(400).json({
          message: `Subscription tier '${tier}' is not available.`
        });
      }

      const user = req.user;
      if (!user) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Check if user has email
      if (!user.email) {
        return res.status(400).json({
          message: "Please add an email address to your account before subscribing",
          requiresEmail: true
        });
      }

      // Get the host from headers
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const baseUrl = `${protocol}://${host}`;

      // Create absolute return URL
      const returnUrl = new URL('/subscription', baseUrl).toString();

      // Create or update Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: user.id.toString()
          }
        });
        stripeCustomerId = customer.id;
        await storage.updateStripeCustomerId(user.id, customer.id);
      }

      // Create Stripe checkout session
      const sessionUrl = await createSubscriptionSession(
        stripeCustomerId,
        priceId,
        returnUrl
      );

      res.json({ url: sessionUrl });
    } catch (error: any) {
      console.error("Subscription creation error:", error);
      res.status(500).json({
        message: "Failed to create subscription",
        error: error.message
      });
    }
  });


  // Add email update endpoint
  app.post("/api/user/update-email", requireAuth, async (req, res) => {
    try {
      const { email } = req.body;

      if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        return res.status(400).json({ message: "Please provide a valid email address" });
      }

      // Check if email is already in use
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser && existingUser.id !== req.user?.id) {
        return res.status(400).json({ message: "This email address is already in use" });
      }

      const user = req.user;
      const updatedUser = await storage.updateUser(user!.id, {
        email
      });

      res.json(updatedUser);
    } catch (error: any) {
      console.error("Error updating email:", error);
      res.status(500).json({ message: "Failed to update email address" });
    }
  });

  // Existing message endpoints (removed GPT-4o checks)
  app.get("/api/suggestions", requireAuth, async (_req, res) => {
    try {
      const suggestions = await generateSuggestions();
      res.json(suggestions);
    } catch (error) {
      console.error("Error generating suggestions:", error);
      res.status(500).json({ message: "Failed to generate suggestions" });
    }
  });

  app.get("/api/summary", requireAuth, async (req, res) => {
    try {
      const messages = await storage.getMessages(req.user!.id); //filter by user ID
      const formattedMessages = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const summary = await generateSummary(formattedMessages);
      res.json(summary);
    } catch (error: any) {
      console.error("Error generating summary:", error);
      res.status(500).json({
        message: "Failed to generate summary",
        error: error.message
      });
    }
  });

  app.get("/api/topic-connections", requireAuth, async (req, res) => {
    try {
      const messages = await storage.getMessages(req.user!.id); //filter by user ID
      const formattedMessages = messages.map(m => ({
        role: m.role,
        content: m.content
      }));

      const analysis = await analyzeTopicConnections(formattedMessages);
      res.json(analysis);
    } catch (error: any) {
      console.error("Error analyzing topic connections:", error);
      res.status(500).json({
        message: "Failed to analyze topic connections",
        error: error.message
      });
    }
  });

  app.delete("/api/messages", requireAuth, async (req, res) => {
    try {
      // Clear only the current user's messages
      await storage.clearMessages(req.user!.id);
      res.sendStatus(200);
    } catch (error) {
      console.error("Error clearing messages:", error);
      res.status(500).json({ message: "Failed to clear messages" });
    }
  });

  // Add the file processing logic for fine-tuning
  app.post("/api/fine-tune", requireAuth, async (req, res) => {
    try {
      // For demonstration only - in a real app this would need proper error handling
      // and file format validation
      console.log("Fine-tuning is not fully implemented in this version");
      
      // Create a sample response with a mock job ID
      res.json({
        message: "Fine-tuning is temporarily disabled while we fix text spacing issues",
        jobId: "ft-mock-" + Date.now()
      });
    } catch (error: any) {
      console.error("Error with fine-tuning:", error);
      res.status(500).json({
        message: "Fine-tuning is currently disabled",
        error: error.message
      });
    }
  });

  app.get("/api/fine-tune/:jobId", requireAuth, async (req, res) => {
    try {
      // Return mock job status since fine-tuning is disabled
      res.json({
        id: req.params.jobId,
        status: "completed",
        message: "Fine-tuning is temporarily disabled while we fix text spacing issues",
        created_at: new Date().toISOString(),
        finished_at: new Date().toISOString()
      });
    } catch (error: any) {
      console.error("Error retrieving fine-tuning job:", error);
      res.status(500).json({
        message: "Failed to retrieve fine-tuning job",
        error: error.message
      });
    }
  });


  const httpServer = createServer(app);
  return httpServer;
}