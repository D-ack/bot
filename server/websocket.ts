import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { storage } from './storage.js';

export interface WebSocketMessage {
  type: 'stats_update' | 'new_message' | 'platform_status' | 'ml_update' | 'log_update';
  data: any;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Set<WebSocket> = new Set();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupWebSocket();
    this.startPeriodicUpdates();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('WebSocket client connected');
      this.clients.add(ws);

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.clients.delete(ws);
      });

      // Send initial data
      this.sendInitialData(ws);
    });
  }

  private async sendInitialData(ws: WebSocket) {
    try {
      // Send current stats
      const stats = await this.calculateStats();
      this.sendToClient(ws, { type: 'stats_update', data: stats });

      // Send platform status
      const platforms = await storage.getAllPlatforms();
      this.sendToClient(ws, { type: 'platform_status', data: platforms });

      // Send recent messages
      const recentMessages = await storage.getRecentMessages(10);
      this.sendToClient(ws, { type: 'new_message', data: recentMessages });

      // Send ML model status
      const mlModel = await storage.getCurrentMlModel();
      this.sendToClient(ws, { type: 'ml_update', data: mlModel });

    } catch (error) {
      console.error('Error sending initial WebSocket data:', error);
    }
  }

  private sendToClient(ws: WebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  public broadcast(message: WebSocketMessage) {
    this.clients.forEach(client => {
      this.sendToClient(client, message);
    });
  }

  private startPeriodicUpdates() {
    // Update stats every 30 seconds
    setInterval(async () => {
      try {
        const stats = await this.calculateStats();
        this.broadcast({ type: 'stats_update', data: stats });
      } catch (error) {
        console.error('Error calculating stats for WebSocket:', error);
      }
    }, 30000);

    // Update platform status every 60 seconds
    setInterval(async () => {
      try {
        const platforms = await storage.getAllPlatforms();
        this.broadcast({ type: 'platform_status', data: platforms });
      } catch (error) {
        console.error('Error getting platform status for WebSocket:', error);
      }
    }, 60000);
  }

  private async calculateStats() {
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

    return {
      totalMessages: platforms.reduce((sum, p) => sum + p.messagesCount, 0),
      activeUsers,
      responseRate,
      avgResponseTime,
      todayMessages: todayMessages.length,
      mlAccuracy: mlModel?.accuracy || 0,
      activePlatforms: platforms.filter(p => p.status === 'active').length
    };
  }

  public async notifyNewMessage(message: any) {
    this.broadcast({ type: 'new_message', data: message });
  }

  public async notifyPlatformUpdate(platform: any) {
    this.broadcast({ type: 'platform_status', data: [platform] });
  }

  public async notifyMlUpdate(model: any) {
    this.broadcast({ type: 'ml_update', data: model });
  }

  public async notifyLogUpdate(log: any) {
    this.broadcast({ type: 'log_update', data: log });
  }
}
