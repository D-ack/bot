import express from 'express';
import { storage } from '../storage.js';
import { SimpleMLTrainer } from '../nlp/simple-trainer.js';

export class TelegramHandler {
  private trainer: SimpleMLTrainer;
  private botToken: string;

  constructor() {
    this.trainer = new SimpleMLTrainer();
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
  }

  public setupRoutes(app: express.Application) {
    // Telegram webhook handler
    app.post('/webhook/telegram', this.handleMessage.bind(this));
  }

  private async handleMessage(req: express.Request, res: express.Response) {
    try {
      const update = req.body;
      
      if (update.message) {
        await this.processIncomingMessage(update.message);
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Telegram webhook error:', error);
      await storage.createLog({
        level: 'error',
        message: 'Telegram webhook processing failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        source: 'telegram'
      });
      res.status(500).send('Internal Server Error');
    }
  }

  private async processIncomingMessage(message: any) {
    const startTime = Date.now();
    
    try {
      // Get or create platform
      let platform = await storage.getPlatformByName('telegram');
      if (!platform) {
        platform = await storage.createPlatform({
          name: 'telegram',
          status: 'active',
          apiKey: this.botToken,
          webhookUrl: null,
          config: {}
        });
      }

      // Get or create conversation
      let conversation = await storage.getAllConversations().then(convs => 
        convs.find(c => c.platformId === platform!.id && c.userId === message.from.id.toString())
      );

      if (!conversation) {
        conversation = await storage.createConversation({
          platformId: platform.id,
          userId: message.from.id.toString(),
          userName: `${message.from.first_name} ${message.from.last_name || ''}`.trim(),
          status: 'active'
        });
      }

      // Store incoming message
      await storage.createMessage({
        conversationId: conversation.id,
        content: message.text || '[Media]',
        sender: 'user',
        confidence: null,
        responseTime: null,
        templateId: null
      });

      // Generate bot response
      const { response, confidence, templateId } = await this.trainer.generateResponse(
        message.text || '', 
        platform.id
      );

      const responseTime = Date.now() - startTime;

      // Store bot response
      await storage.createMessage({
        conversationId: conversation.id,
        content: response,
        sender: 'bot',
        confidence,
        responseTime,
        templateId: templateId || null
      });

      // Send response via Telegram API
      await this.sendMessage(message.chat.id, response);

      // Update platform message count
      await storage.updatePlatform(platform.id, {
        messagesCount: platform.messagesCount + 1,
        lastMessageAt: new Date()
      });

      // Update conversation
      await storage.updateConversation(conversation.id, {
        messagesCount: conversation.messagesCount + 2,
        lastMessageAt: new Date()
      });

      await storage.createLog({
        level: 'info',
        message: 'Telegram message processed successfully',
        details: { 
          userId: message.from.id, 
          confidence, 
          responseTime,
          chatId: message.chat.id
        },
        source: 'telegram'
      });

    } catch (error) {
      await storage.createLog({
        level: 'error',
        message: 'Failed to process Telegram message',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        source: 'telegram'
      });
    }
  }

  private async sendMessage(chatId: number, message: string) {
    if (!this.botToken) {
      console.warn('Telegram bot token not configured');
      return;
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: chatId,
          text: message
        })
      });

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.statusText}`);
      }
    } catch (error) {
      await storage.createLog({
        level: 'error',
        message: 'Failed to send Telegram message',
        details: { error: error instanceof Error ? error.message : 'Unknown error', chatId },
        source: 'telegram'
      });
    }
  }

  public async setWebhook(webhookUrl: string) {
    if (!this.botToken) {
      throw new Error('Telegram bot token not configured');
    }

    try {
      const response = await fetch(`https://api.telegram.org/bot${this.botToken}/setWebhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: webhookUrl
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to set Telegram webhook: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('Telegram webhook set:', result);
      
      return result;
    } catch (error) {
      await storage.createLog({
        level: 'error',
        message: 'Failed to set Telegram webhook',
        details: { error: error instanceof Error ? error.message : 'Unknown error', webhookUrl },
        source: 'telegram'
      });
      throw error;
    }
  }
}
