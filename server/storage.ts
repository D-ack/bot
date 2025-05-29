import { 
  users, platforms, conversations, messages, templates, mlModels, analytics, logs, botConfigs,
  type User, type InsertUser, type Platform, type InsertPlatform, type Conversation, type InsertConversation,
  type Message, type InsertMessage, type Template, type InsertTemplate, type MlModel, type InsertMlModel,
  type Analytics, type InsertAnalytics, type Log, type InsertLog, type BotConfig, type InsertBotConfig
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Bot Config
  getBotConfig(): Promise<BotConfig | undefined>;
  updateBotConfig(config: Partial<InsertBotConfig>): Promise<BotConfig>;

  // Platforms
  getAllPlatforms(): Promise<Platform[]>;
  getPlatform(id: number): Promise<Platform | undefined>;
  getPlatformByName(name: string): Promise<Platform | undefined>;
  createPlatform(platform: InsertPlatform): Promise<Platform>;
  updatePlatform(id: number, platform: Partial<InsertPlatform>): Promise<Platform>;

  // Conversations
  getAllConversations(): Promise<Conversation[]>;
  getConversation(id: number): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  updateConversation(id: number, conversation: Partial<InsertConversation>): Promise<Conversation>;

  // Messages
  getMessagesByConversation(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  getRecentMessages(limit?: number): Promise<Message[]>;

  // Templates
  getAllTemplates(): Promise<Template[]>;
  getTemplate(id: number): Promise<Template | undefined>;
  createTemplate(template: InsertTemplate): Promise<Template>;
  updateTemplate(id: number, template: Partial<InsertTemplate>): Promise<Template>;
  deleteTemplate(id: number): Promise<void>;

  // ML Models
  getCurrentMlModel(): Promise<MlModel | undefined>;
  createMlModel(model: InsertMlModel): Promise<MlModel>;
  updateMlModel(id: number, model: Partial<InsertMlModel>): Promise<MlModel>;

  // Analytics
  getAnalytics(days?: number): Promise<Analytics[]>;
  createAnalytics(analytics: InsertAnalytics): Promise<Analytics>;

  // Logs
  getLogs(limit?: number): Promise<Log[]>;
  createLog(log: InsertLog): Promise<Log>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private platforms: Map<number, Platform> = new Map();
  private conversations: Map<number, Conversation> = new Map();
  private messages: Map<number, Message> = new Map();
  private templates: Map<number, Template> = new Map();
  private mlModels: Map<number, MlModel> = new Map();
  private analytics: Map<number, Analytics> = new Map();
  private logs: Map<number, Log> = new Map();
  private botConfigs: Map<number, BotConfig> = new Map();

  private currentId = 1;

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Initialize default bot config
    const defaultBotConfig: BotConfig = {
      id: 1,
      name: "LuvSmithCorp Bot",
      language: "en",
      tone: "professional",
      confidenceThreshold: 75,
      maxResponseTime: 3,
      fallbackMessage: "Sorry, I didn't understand that. Can you please rephrase?",
      autoTraining: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.botConfigs.set(1, defaultBotConfig);

    // Initialize platforms
    const platforms = [
      { name: "whatsapp", status: "active", messagesCount: 847 },
      { name: "telegram", status: "active", messagesCount: 523 },
      { name: "messenger", status: "active", messagesCount: 477 }
    ];

    platforms.forEach((platform, index) => {
      const id = index + 1;
      this.platforms.set(id, {
        id,
        name: platform.name,
        status: platform.status,
        apiKey: null,
        webhookUrl: null,
        config: {},
        messagesCount: platform.messagesCount,
        lastMessageAt: new Date(Date.now() - Math.random() * 3600000),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    // Initialize default templates
    const defaultTemplates = [
      {
        name: "Welcome Message",
        category: "Greetings",
        content: "Hello! Welcome to LuvSmithCorp. How can I assist you today?",
        variables: [],
      },
      {
        name: "Order Support",
        category: "Customer Support",
        content: "I'd be happy to help you with your order. Could you please provide your order number?",
        variables: ["orderNumber"],
      },
      {
        name: "Product Information",
        category: "Sales",
        content: "I can provide information about our products. What would you like to know?",
        variables: ["productName"],
      }
    ];

    defaultTemplates.forEach((template, index) => {
      const id = index + 1;
      this.templates.set(id, {
        id,
        ...template,
        isActive: true,
        usageCount: Math.floor(Math.random() * 100),
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    });

    // Initialize ML model
    this.mlModels.set(1, {
      id: 1,
      name: "LuvSmithCorp NLP Model",
      version: "1.0.0",
      accuracy: 94,
      trainingData: [],
      status: "ready",
      lastTrainedAt: new Date(Date.now() - 7200000), // 2 hours ago
      createdAt: new Date(),
    });

    this.currentId = 10;
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Bot Config
  async getBotConfig(): Promise<BotConfig | undefined> {
    return this.botConfigs.get(1);
  }

  async updateBotConfig(config: Partial<InsertBotConfig>): Promise<BotConfig> {
    const existing = this.botConfigs.get(1);
    if (!existing) {
      throw new Error("Bot config not found");
    }
    const updated: BotConfig = { ...existing, ...config, updatedAt: new Date() };
    this.botConfigs.set(1, updated);
    return updated;
  }

  // Platforms
  async getAllPlatforms(): Promise<Platform[]> {
    return Array.from(this.platforms.values());
  }

  async getPlatform(id: number): Promise<Platform | undefined> {
    return this.platforms.get(id);
  }

  async getPlatformByName(name: string): Promise<Platform | undefined> {
    return Array.from(this.platforms.values()).find(p => p.name === name);
  }

  async createPlatform(insertPlatform: InsertPlatform): Promise<Platform> {
    const id = this.currentId++;
    const platform: Platform = { 
      id, 
      name: insertPlatform.name,
      status: insertPlatform.status || 'inactive',
      apiKey: insertPlatform.apiKey || null,
      webhookUrl: insertPlatform.webhookUrl || null,
      config: insertPlatform.config || null,
      messagesCount: 0,
      lastMessageAt: null,
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.platforms.set(id, platform);
    return platform;
  }

  async updatePlatform(id: number, platformUpdate: Partial<InsertPlatform>): Promise<Platform> {
    const existing = this.platforms.get(id);
    if (!existing) {
      throw new Error("Platform not found");
    }
    const updated: Platform = { ...existing, ...platformUpdate, updatedAt: new Date() };
    this.platforms.set(id, updated);
    return updated;
  }

  // Conversations
  async getAllConversations(): Promise<Conversation[]> {
    return Array.from(this.conversations.values());
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    return this.conversations.get(id);
  }

  async createConversation(insertConversation: InsertConversation): Promise<Conversation> {
    const id = this.currentId++;
    const conversation: Conversation = { 
      id, 
      platformId: insertConversation.platformId,
      userId: insertConversation.userId,
      status: insertConversation.status || 'active',
      userName: insertConversation.userName || null,
      messagesCount: 0,
      lastMessageAt: null,
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.conversations.set(id, conversation);
    return conversation;
  }

  async updateConversation(id: number, conversationUpdate: Partial<InsertConversation>): Promise<Conversation> {
    const existing = this.conversations.get(id);
    if (!existing) {
      throw new Error("Conversation not found");
    }
    const updated: Conversation = { ...existing, ...conversationUpdate, updatedAt: new Date() };
    this.conversations.set(id, updated);
    return updated;
  }

  // Messages
  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(m => m.conversationId === conversationId);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentId++;
    const message: Message = { 
      id, 
      conversationId: insertMessage.conversationId,
      content: insertMessage.content,
      sender: insertMessage.sender,
      confidence: insertMessage.confidence || null,
      responseTime: insertMessage.responseTime || null,
      templateId: insertMessage.templateId || null,
      sentAt: new Date() 
    };
    this.messages.set(id, message);
    return message;
  }

  async getRecentMessages(limit = 50): Promise<Message[]> {
    return Array.from(this.messages.values())
      .sort((a, b) => b.sentAt.getTime() - a.sentAt.getTime())
      .slice(0, limit);
  }

  // Templates
  async getAllTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values());
  }

  async getTemplate(id: number): Promise<Template | undefined> {
    return this.templates.get(id);
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const id = this.currentId++;
    const template: Template = { 
      id, 
      name: insertTemplate.name,
      content: insertTemplate.content,
      category: insertTemplate.category,
      variables: insertTemplate.variables ? [...insertTemplate.variables] : null,
      isActive: insertTemplate.isActive ?? true,
      usageCount: 0,
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.templates.set(id, template);
    return template;
  }

  async updateTemplate(id: number, templateUpdate: Partial<InsertTemplate>): Promise<Template> {
    const existing = this.templates.get(id);
    if (!existing) {
      throw new Error("Template not found");
    }
    const updated: Template = { 
      ...existing, 
      ...templateUpdate, 
      variables: Array.isArray(templateUpdate.variables) ? templateUpdate.variables : existing.variables,
      updatedAt: new Date() 
    };
    this.templates.set(id, updated);
    return updated;
  }

  async deleteTemplate(id: number): Promise<void> {
    this.templates.delete(id);
  }

  // ML Models
  async getCurrentMlModel(): Promise<MlModel | undefined> {
    return Array.from(this.mlModels.values()).find(m => m.status === "ready");
  }

  async createMlModel(insertMlModel: InsertMlModel): Promise<MlModel> {
    const id = this.currentId++;
    const model: MlModel = { 
      id, 
      name: insertMlModel.name,
      version: insertMlModel.version,
      status: insertMlModel.status || 'training',
      accuracy: insertMlModel.accuracy || 0,
      trainingData: insertMlModel.trainingData || null,
      lastTrainedAt: insertMlModel.lastTrainedAt || null,
      createdAt: new Date() 
    };
    this.mlModels.set(id, model);
    return model;
  }

  async updateMlModel(id: number, modelUpdate: Partial<InsertMlModel>): Promise<MlModel> {
    const existing = this.mlModels.get(id);
    if (!existing) {
      throw new Error("ML Model not found");
    }
    const updated: MlModel = { ...existing, ...modelUpdate };
    this.mlModels.set(id, updated);
    return updated;
  }

  // Analytics
  async getAnalytics(days = 30): Promise<Analytics[]> {
    return Array.from(this.analytics.values())
      .filter(a => a.date.getTime() > Date.now() - (days * 24 * 60 * 60 * 1000))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }

  async createAnalytics(insertAnalytics: InsertAnalytics): Promise<Analytics> {
    const id = this.currentId++;
    const analytics: Analytics = { 
      id, 
      date: insertAnalytics.date,
      totalMessages: insertAnalytics.totalMessages || 0,
      activeUsers: insertAnalytics.activeUsers || 0,
      responseRate: insertAnalytics.responseRate || 0,
      avgResponseTime: insertAnalytics.avgResponseTime || 0,
      platformBreakdown: insertAnalytics.platformBreakdown || null
    };
    this.analytics.set(id, analytics);
    return analytics;
  }

  // Logs
  async getLogs(limit = 100): Promise<Log[]> {
    return Array.from(this.logs.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, limit);
  }

  async createLog(insertLog: InsertLog): Promise<Log> {
    const id = this.currentId++;
    const log: Log = { 
      id, 
      source: insertLog.source,
      message: insertLog.message,
      level: insertLog.level,
      details: insertLog.details || null,
      createdAt: new Date() 
    };
    this.logs.set(id, log);
    return log;
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getBotConfig(): Promise<BotConfig | undefined> {
    const [config] = await db.select().from(botConfigs).limit(1);
    return config || undefined;
  }

  async updateBotConfig(config: Partial<InsertBotConfig>): Promise<BotConfig> {
    const existing = await this.getBotConfig();
    if (existing) {
      const [updated] = await db
        .update(botConfigs)
        .set({ ...config, updatedAt: new Date() })
        .where(eq(botConfigs.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(botConfigs)
        .values({ ...config, createdAt: new Date(), updatedAt: new Date() })
        .returning();
      return created;
    }
  }

  async getAllPlatforms(): Promise<Platform[]> {
    return await db.select().from(platforms);
  }

  async getPlatform(id: number): Promise<Platform | undefined> {
    const [platform] = await db.select().from(platforms).where(eq(platforms.id, id));
    return platform || undefined;
  }

  async getPlatformByName(name: string): Promise<Platform | undefined> {
    const [platform] = await db.select().from(platforms).where(eq(platforms.name, name));
    return platform || undefined;
  }

  async createPlatform(platform: InsertPlatform): Promise<Platform> {
    const [created] = await db
      .insert(platforms)
      .values({ ...platform, createdAt: new Date(), updatedAt: new Date() })
      .returning();
    return created;
  }

  async updatePlatform(id: number, platform: Partial<InsertPlatform>): Promise<Platform> {
    const [updated] = await db
      .update(platforms)
      .set({ ...platform, updatedAt: new Date() })
      .where(eq(platforms.id, id))
      .returning();
    return updated;
  }

  async getAllConversations(): Promise<Conversation[]> {
    return await db.select().from(conversations);
  }

  async getConversation(id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id));
    return conversation || undefined;
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [created] = await db
      .insert(conversations)
      .values({ ...conversation, createdAt: new Date(), updatedAt: new Date() })
      .returning();
    return created;
  }

  async updateConversation(id: number, conversation: Partial<InsertConversation>): Promise<Conversation> {
    const [updated] = await db
      .update(conversations)
      .set({ ...conversation, updatedAt: new Date() })
      .where(eq(conversations.id, id))
      .returning();
    return updated;
  }

  async getMessagesByConversation(conversationId: number): Promise<Message[]> {
    return await db.select().from(messages).where(eq(messages.conversationId, conversationId));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [created] = await db
      .insert(messages)
      .values({ ...message, sentAt: new Date() })
      .returning();
    return created;
  }

  async getRecentMessages(limit = 50): Promise<Message[]> {
    return await db.select().from(messages).orderBy(desc(messages.sentAt)).limit(limit);
  }

  async getAllTemplates(): Promise<Template[]> {
    return await db.select().from(templates);
  }

  async getTemplate(id: number): Promise<Template | undefined> {
    const [template] = await db.select().from(templates).where(eq(templates.id, id));
    return template || undefined;
  }

  async createTemplate(template: InsertTemplate): Promise<Template> {
    const [created] = await db
      .insert(templates)
      .values({ ...template, createdAt: new Date(), updatedAt: new Date() })
      .returning();
    return created;
  }

  async updateTemplate(id: number, template: Partial<InsertTemplate>): Promise<Template> {
    const [updated] = await db
      .update(templates)
      .set({ ...template, updatedAt: new Date() })
      .where(eq(templates.id, id))
      .returning();
    return updated;
  }

  async deleteTemplate(id: number): Promise<void> {
    await db.delete(templates).where(eq(templates.id, id));
  }

  async getCurrentMlModel(): Promise<MlModel | undefined> {
    const [model] = await db.select().from(mlModels).orderBy(desc(mlModels.createdAt)).limit(1);
    return model || undefined;
  }

  async createMlModel(model: InsertMlModel): Promise<MlModel> {
    const [created] = await db
      .insert(mlModels)
      .values({ ...model, createdAt: new Date() })
      .returning();
    return created;
  }

  async updateMlModel(id: number, model: Partial<InsertMlModel>): Promise<MlModel> {
    const [updated] = await db
      .update(mlModels)
      .set(model)
      .where(eq(mlModels.id, id))
      .returning();
    return updated;
  }

  async getAnalytics(days = 30): Promise<Analytics[]> {
    return await db.select().from(analytics).limit(days);
  }

  async createAnalytics(analyticsData: InsertAnalytics): Promise<Analytics> {
    const [created] = await db
      .insert(analytics)
      .values(analyticsData)
      .returning();
    return created;
  }

  async getLogs(limit = 100): Promise<Log[]> {
    return await db.select().from(logs).orderBy(desc(logs.createdAt)).limit(limit);
  }

  async createLog(log: InsertLog): Promise<Log> {
    const [created] = await db
      .insert(logs)
      .values({ ...log, createdAt: new Date() })
      .returning();
    return created;
  }
}

export const storage = new DatabaseStorage();
