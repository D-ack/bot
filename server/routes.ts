import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { insertBotConfigSchema, insertPlatformSchema, insertTemplateSchema } from "@shared/schema.js";
import { WhatsAppHandler } from "./platforms/whatsapp.js";
import { TelegramHandler } from "./platforms/telegram.js";
import { MessengerHandler } from "./platforms/messenger.js";
import { SimpleMLTrainer } from "./nlp/simple-trainer.js";
import { WebSocketManager } from "./websocket.js";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // Initialize WebSocket manager
  const wsManager = new WebSocketManager(httpServer);
  
  // Initialize ML trainer
  const mlTrainer = new SimpleMLTrainer();
  
  // Initialize platform handlers
  const whatsappHandler = new WhatsAppHandler();
  const telegramHandler = new TelegramHandler();
  const messengerHandler = new MessengerHandler();
  
  // Setup platform webhooks
  whatsappHandler.setupRoutes(app);
  telegramHandler.setupRoutes(app);
  messengerHandler.setupRoutes(app);

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const platforms = await storage.getAllPlatforms();
      const conversations = await storage.getAllConversations();
      const recentMessages = await storage.getRecentMessages(1000);
      const mlModel = await storage.getCurrentMlModel();

      // Calculate today's messages
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayMessages = recentMessages.filter(m => m.sentAt >= today);

      // Calculate response times
      const botMessages = recentMessages.filter(m => m.sender === 'bot' && m.responseTime);
      const avgResponseTime = botMessages.length > 0 
        ? Math.round(botMessages.reduce((sum, m) => sum + (m.responseTime || 0), 0) / botMessages.length)
        : 0;

      // Calculate response rate
      const userMessages = recentMessages.filter(m => m.sender === 'user');
      const responseRate = userMessages.length > 0 
        ? Math.round((botMessages.length / userMessages.length) * 100)
        : 100;

      // Calculate active users (unique users in last 24 hours)
      const activeUsers = new Set(
        conversations
          .filter(c => c.lastMessageAt && c.lastMessageAt >= today)
          .map(c => c.userId)
      ).size;

      const stats = {
        totalMessages: platforms.reduce((sum, p) => sum + p.messagesCount, 0),
        activeUsers,
        responseRate,
        avgResponseTime: `${(avgResponseTime / 1000).toFixed(1)}s`,
        todayMessages: todayMessages.length,
        mlAccuracy: mlModel?.accuracy || 0,
        activePlatforms: platforms.filter(p => p.status === 'active').length
      };

      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Get bot configuration
  app.get("/api/bot/config", async (req, res) => {
    try {
      const config = await storage.getBotConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch bot config" });
    }
  });

  // Update bot configuration
  app.patch("/api/bot/config", async (req, res) => {
    try {
      const configData = insertBotConfigSchema.parse(req.body);
      const updatedConfig = await storage.updateBotConfig(configData);
      res.json(updatedConfig);
    } catch (error) {
      res.status(400).json({ message: "Invalid configuration data" });
    }
  });

  // Get all platforms
  app.get("/api/platforms", async (req, res) => {
    try {
      const platforms = await storage.getAllPlatforms();
      res.json(platforms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch platforms" });
    }
  });

  // Create platform
  app.post("/api/platforms", async (req, res) => {
    try {
      const platformData = insertPlatformSchema.parse(req.body);
      const platform = await storage.createPlatform(platformData);
      
      // Setup webhook if needed
      if (platform.name === 'telegram' && platform.apiKey) {
        const webhookUrl = `${req.protocol}://${req.get('host')}/webhook/telegram`;
        try {
          await telegramHandler.setWebhook(webhookUrl);
          await storage.updatePlatform(platform.id, { webhookUrl });
        } catch (error) {
          console.error('Failed to set Telegram webhook:', error);
        }
      }
      
      wsManager.notifyPlatformUpdate(platform);
      res.json(platform);
    } catch (error) {
      res.status(400).json({ message: "Invalid platform data" });
    }
  });

  // Update platform
  app.patch("/api/platforms/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const platformData = insertPlatformSchema.partial().parse(req.body);
      const platform = await storage.updatePlatform(id, platformData);
      wsManager.notifyPlatformUpdate(platform);
      res.json(platform);
    } catch (error) {
      res.status(400).json({ message: "Invalid platform data" });
    }
  });

  // Get all conversations
  app.get("/api/conversations", async (req, res) => {
    try {
      const conversations = await storage.getAllConversations();
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch conversations" });
    }
  });

  // Get conversation messages
  app.get("/api/conversations/:id/messages", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const messages = await storage.getMessagesByConversation(id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Get recent messages for chat preview
  app.get("/api/messages/recent", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 20;
      const messages = await storage.getRecentMessages(limit);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch recent messages" });
    }
  });

  // Get all templates
  app.get("/api/templates", async (req, res) => {
    try {
      const templates = await storage.getAllTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  // Create template
  app.post("/api/templates", async (req, res) => {
    try {
      const templateData = insertTemplateSchema.parse(req.body);
      const template = await storage.createTemplate(templateData);
      res.json(template);
    } catch (error) {
      res.status(400).json({ message: "Invalid template data" });
    }
  });

  // Update template
  app.patch("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const templateData = insertTemplateSchema.partial().parse(req.body);
      const template = await storage.updateTemplate(id, templateData);
      res.json(template);
    } catch (error) {
      res.status(400).json({ message: "Invalid template data" });
    }
  });

  // Delete template
  app.delete("/api/templates/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTemplate(id);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ message: "Failed to delete template" });
    }
  });

  // Get ML model status
  app.get("/api/ml/model", async (req, res) => {
    try {
      const model = await storage.getCurrentMlModel();
      res.json(model);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch ML model" });
    }
  });

  // Train ML model
  app.post("/api/ml/train", async (req, res) => {
    try {
      const result = await mlTrainer.trainFromConversations();
      wsManager.notifyMlUpdate(result);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to train ML model" });
    }
  });

  // Test bot response
  app.post("/api/bot/test", async (req, res) => {
    try {
      const { message, platformId = 1 } = req.body;
      if (!message) {
        return res.status(400).json({ message: "Message is required" });
      }
      
      const response = await mlTrainer.generateResponse(message, platformId);
      res.json(response);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate response" });
    }
  });

  // Get analytics
  app.get("/api/analytics", async (req, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const analytics = await storage.getAnalytics(days);
      res.json(analytics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Get logs
  app.get("/api/logs", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });

  return httpServer;
}
