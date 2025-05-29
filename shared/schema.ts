import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const botConfigs = pgTable("bot_configs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().default("LuvSmithCorp Bot"),
  language: text("language").notNull().default("en"),
  tone: text("tone").notNull().default("professional"),
  confidenceThreshold: integer("confidence_threshold").notNull().default(75),
  maxResponseTime: integer("max_response_time").notNull().default(3),
  fallbackMessage: text("fallback_message").notNull().default("Sorry, I didn't understand that. Can you please rephrase?"),
  autoTraining: boolean("auto_training").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const platforms = pgTable("platforms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // whatsapp, telegram, messenger
  status: text("status").notNull().default("inactive"), // active, inactive, error
  apiKey: text("api_key"),
  webhookUrl: text("webhook_url"),
  config: json("config").$type<Record<string, any>>().default({}),
  messagesCount: integer("messages_count").notNull().default(0),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  platformId: integer("platform_id").notNull(),
  userId: text("user_id").notNull(), // platform-specific user ID
  userName: text("user_name"),
  status: text("status").notNull().default("active"), // active, resolved, escalated
  messagesCount: integer("messages_count").notNull().default(0),
  lastMessageAt: timestamp("last_message_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  content: text("content").notNull(),
  sender: text("sender").notNull(), // user, bot
  confidence: integer("confidence"), // ML confidence score (0-100)
  responseTime: integer("response_time"), // in milliseconds
  templateId: integer("template_id"),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
});

export const templates = pgTable("templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  content: text("content").notNull(),
  variables: json("variables").$type<string[]>().default([]),
  isActive: boolean("is_active").notNull().default(true),
  usageCount: integer("usage_count").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const mlModels = pgTable("ml_models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  version: text("version").notNull(),
  accuracy: integer("accuracy").notNull().default(0), // percentage
  trainingData: json("training_data").$type<any[]>().default([]),
  status: text("status").notNull().default("training"), // training, ready, error
  lastTrainedAt: timestamp("last_trained_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analytics = pgTable("analytics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  totalMessages: integer("total_messages").notNull().default(0),
  activeUsers: integer("active_users").notNull().default(0),
  responseRate: integer("response_rate").notNull().default(0), // percentage
  avgResponseTime: integer("avg_response_time").notNull().default(0), // milliseconds
  platformBreakdown: json("platform_breakdown").$type<Record<string, number>>().default({}),
});

export const logs = pgTable("logs", {
  id: serial("id").primaryKey(),
  level: text("level").notNull(), // info, warn, error
  message: text("message").notNull(),
  details: json("details").$type<Record<string, any>>(),
  source: text("source").notNull(), // platform name or system component
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertBotConfigSchema = createInsertSchema(botConfigs).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPlatformSchema = createInsertSchema(platforms).omit({ id: true, createdAt: true, updatedAt: true });
export const insertConversationSchema = createInsertSchema(conversations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, sentAt: true });
export const insertTemplateSchema = createInsertSchema(templates).omit({ id: true, createdAt: true, updatedAt: true });
export const insertMlModelSchema = createInsertSchema(mlModels).omit({ id: true, createdAt: true });
export const insertAnalyticsSchema = createInsertSchema(analytics).omit({ id: true });
export const insertLogSchema = createInsertSchema(logs).omit({ id: true, createdAt: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type BotConfig = typeof botConfigs.$inferSelect;
export type InsertBotConfig = z.infer<typeof insertBotConfigSchema>;
export type Platform = typeof platforms.$inferSelect;
export type InsertPlatform = z.infer<typeof insertPlatformSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Template = typeof templates.$inferSelect;
export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type MlModel = typeof mlModels.$inferSelect;
export type InsertMlModel = z.infer<typeof insertMlModelSchema>;
export type Analytics = typeof analytics.$inferSelect;
export type InsertAnalytics = z.infer<typeof insertAnalyticsSchema>;
export type Log = typeof logs.$inferSelect;
export type InsertLog = z.infer<typeof insertLogSchema>;
