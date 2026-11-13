import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import session from "express-session";
import { storage } from "./storage";

// Verify required environment variables
if (!process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is not set");
}

if (!process.env.ADMIN_CODE) {
  throw new Error("ADMIN_CODE environment variable is required");
}

log("Initializing Express application...");
const app = express();

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure session middleware
const sessionSettings = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: storage.sessionStore,
  name: "void_chat_sid",
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
};

log("Setting up session middleware...");
app.use(session(sessionSettings));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      log(logLine);
    }
  });

  next();
});

const port = Number(process.env.PORT) || 5000;
const isVercel = Boolean(process.env.VERCEL);

async function initialize() {
  log("Starting server initialization...");

  log("Registering routes...");
  const server = await registerRoutes(app);

  // Global error handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Error:", err);
    res.status(status).json({ message });
  });

  // Setup Vite only in development
  if (app.get("env") === "development") {
    log("Setting up Vite middleware for development...");
    await setupVite(app, server);
    log("Vite middleware setup complete");
  } else {
    log("Setting up static file serving for production...");
    serveStatic(app);
  }

  if (!isVercel) {
    log(`Attempting to start server on port ${port}...`);

    server.listen(port, "0.0.0.0", () => {
      log(`Server is running on port ${port}`);
      log(`Mode: ${app.get("env")}`);
      log("Ready to accept connections");
    });

    server.on("error", (error: any) => {
      if (error.syscall !== "listen") {
        throw error;
      }

      switch (error.code) {
        case "EACCES":
          console.error(`Port ${port} requires elevated privileges`);
          process.exit(1);
          break;
        case "EADDRINUSE":
          console.error(`Port ${port} is already in use`);
          process.exit(1);
          break;
        default:
          throw error;
      }
    });
  }

  return app;
}

const initPromise = initialize().catch((error) => {
  console.error("Failed to start server:", error);
  if (!isVercel) {
    process.exit(1);
  }
  throw error;
});

export default async function handler(req: Request, res: Response) {
  const ready = await initPromise;
  return ready(req, res);
}

export { app };
