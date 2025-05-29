import express from 'express';
import { storage } from '../storage.js';
import { SimpleMLTrainer } from '../nlp/simple-trainer.js';

export class MessengerHandler {
  private trainer: SimpleMLTrainer;
  private verifyToken: string;
  private accessToken: string;

  constructor() {
    this.trainer = new SimpleMLTrainer();
    this.verifyToken = process.env.MESSENGER_VERIFY_TOKEN || '';
    this.accessToken = process.env.MESSENGER_ACCESS_TOKEN || '';
  }

  public setupRoutes(app: express.Application) {
    // Messenger webhook verification
    app.get('/webhook/messenger', this.verifyWebhook.bind(this));
    
    // Messenger message handler
    app.post('/webhook/messenger', this.handleMessage.bind(this));
  }

  private async verifyWebhook(req: express.Request, res: express.Response) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === this.verifyToken) {
      console.log('Messenger webhook verified');
      res.status(200).send(challenge);
    } else {
      res.status(403).send('Forbidden');
    }
  }

  private async handleMessage(req: express.Request, res: express.Response) {
    try {
      const body = req.body;
      
      if (body.object === 'page') {
        body.entry?.forEach(async (entry: any) => {
          const messaging = entry.messaging;
          
          messaging?.forEach(async (event: any) => {
            if (event.message) {
              await this.processIncomingMessage(event);
            }
          });
        });
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('Messenger webhook error:', error);
      await storage.createLog({
        level: 'error',
        message: 'Messenger webhook processing failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        source: 'messenger'
      });
      res.status(500).send('Internal Server Error');
    }
  }

  private async processIncomingMessage(event: any) {
    const startTime = Date.now();
    
    try {
      // Get or create platform
      let platform = await storage.getPlatformByName('messenger');
      if (!platform) {
        platform = await storage.createPlatform({
          name: 'messenger',
          status: 'active',
          apiKey: this.accessToken,
          webhookUrl: null,
          config: {}
        });
      }

      // Get or create conversation
      let conversation = await storage.getAllConversations().then(convs => 
        convs.find(c => c.platformId === platform!.id && c.userId === event.sender.id)
      );

      if (!conversation) {
        conversation = await storage.createConversation({
          platformId: platform.id,
          userId: event.sender.id,
          userName: 'Messenger User',
          status: 'active'
        });
      }

      // Store incoming message
      await storage.createMessage({
        conversationId: conversation.id,
        content: event.message?.text || '[Media]',
        sender: 'user',
        confidence: null,
        responseTime: null,
        templateId: null
      });

      // Generate bot response
      const { response, confidence, templateId } = await this.trainer.generateResponse(
        event.message?.text || '', 
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

      // Send response via Messenger API
      await this.sendMessage(event.sender.id, response);

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
        message: 'Messenger message processed successfully',
        details: { 
          userId: event.sender.id, 
          confidence, 
          responseTime
        },
        source: 'messenger'
      });

    } catch (error) {
      await storage.createLog({
        level: 'error',
        message: 'Failed to process Messenger message',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        source: 'messenger'
      });
    }
  }

  private async sendMessage(recipientId: string, message: string) {
    if (!this.accessToken) {
      console.warn('Messenger access token not configured');
      return;
    }

    try {
      const response = await fetch('https://graph.facebook.com/v17.0/me/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient: { id: recipientId },
          message: { text: message },
          access_token: this.accessToken
        })
      });

      if (!response.ok) {
        throw new Error(`Messenger API error: ${response.statusText}`);
      }
    } catch (error) {
      await storage.createLog({
        level: 'error',
        message: 'Failed to send Messenger message',
        details: { error: error instanceof Error ? error.message : 'Unknown error', recipientId },
        source: 'messenger'
      });
    }
  }
}
