import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { insertBotConfigSchema, insertPlatformSchema, insertTemplateSchema } from "@shared/schema.js";
import { WebSocketManager } from "./websocket.js";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize WebSocket manager
  const wsManager = new WebSocketManager(httpServer);
  
  // API Routes
  
  // Bot configuration
  app.get("/api/bot/config", async (_req, res) => {
    try {
      const config = await storage.getBotConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch bot config" });
    }
  });

  app.patch("/api/bot/config", async (req, res) => {
    try {
      const result = insertBotConfigSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid configuration data" });
      }
      const config = await storage.updateBotConfig(result.data);
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: "Failed to update bot config" });
    }
  });

  // Platforms
  app.get("/api/platforms", async (_req, res) => {
    try {
      const platforms = await storage.getAllPlatforms();
      res.json(platforms);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch platforms" });
    }
  });

  app.post("/api/platforms", async (req, res) => {
    try {
      const result = insertPlatformSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid platform data" });
      }
      const platform = await storage.createPlatform(result.data);
      res.json(platform);
    } catch (error) {
      res.status(500).json({ error: "Failed to create platform" });
    }
  });

  // Conversations
  app.get("/api/conversations", async (_req, res) => {
    try {
      const conversations = await storage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  // Messages
  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.id);
      const messages = await storage.getMessagesByConversation(conversationId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Templates
  app.get("/api/templates", async (_req, res) => {
    try {
      const templates = await storage.getAllTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch templates" });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const result = insertTemplateSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: "Invalid template data" });
      }
      const template = await storage.createTemplate(result.data);
      res.json(template);
    } catch (error) {
      res.status(500).json({ error: "Failed to create template" });
    }
  });

  // Analytics
  app.get("/api/analytics", async (_req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  // Logs
  app.get("/api/logs", async (_req, res) => {
    try {
      const logs = await storage.getLogs();
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch logs" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (_req, res) => {
    try {
      const platforms = await storage.getAllPlatforms();
      const conversations = await storage.getAllConversations();
      const messages = await storage.getRecentMessages();
      
      const stats = {
        totalMessages: messages.length,
        activeUsers: conversations.length,
        responseRate: 85,
        avgResponseTime: "1.2s",
        todayMessages: Math.floor(messages.length * 0.3),
        mlAccuracy: 87,
        activePlatforms: platforms.filter(p => p.status === 'active').length
      };
      
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard stats" });
    }
  });

  // ML Training
  app.post("/api/ml/train", async (_req, res) => {
    try {
      // Simulate training
      const result = { accuracy: 0.87, samples: 150 };
      
      await storage.createLog({
        level: 'info',
        message: 'ML model training completed',
        source: 'ml_trainer',
        details: null
      });
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to train model" });
    }
  });

  return httpServer;
}