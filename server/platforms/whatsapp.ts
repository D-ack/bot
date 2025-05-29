import express from 'express';
import { storage } from '../storage.js';
import { SimpleMLTrainer } from '../nlp/simple-trainer.js';

export class WhatsAppHandler {
  private trainer: SimpleMLTrainer;

  constructor() {
    this.trainer = new SimpleMLTrainer();
  }

  public setupRoutes(app: express.Application) {
    // WhatsApp webhook verification
    app.get('/webhook/whatsapp', this.verifyWebhook.bind(this));
    
    // WhatsApp message handler
    app.post('/webhook/whatsapp', this.handleMessage.bind(this));
  }

  private async verifyWebhook(req: express.Request, res: express.Response) {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // Verify the webhook (you would check against your verify token)
    if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
      console.log('WhatsApp webhook verified');
      res.status(200).send(challenge);
    } else {
      res.status(403).send('Forbidden');
    }
  }

  private async handleMessage(req: express.Request, res: express.Response) {
    try {
      const body = req.body;
      
      if (body.object === 'whatsapp_business_account') {
        body.entry?.forEach(async (entry: any) => {
          const changes = entry.changes;
          
          changes?.forEach(async (change: any) => {
            if (change.field === 'messages') {
              const messages = change.value?.messages;
              
              messages?.forEach(async (message: any) => {
                await this.processIncomingMessage(message);
              });
            }
          });
        });
      }

      res.status(200).send('OK');
    } catch (error) {
      console.error('WhatsApp webhook error:', error);
      await storage.createLog({
        level: 'error',
        message: 'WhatsApp webhook processing failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        source: 'whatsapp'
      });
      res.status(500).send('Internal Server Error');
    }
  }

  private async processIncomingMessage(message: any) {
    const startTime = Date.now();
    
    try {
      // Get or create platform
      let platform = await storage.getPlatformByName('whatsapp');
      if (!platform) {
        platform = await storage.createPlatform({
          name: 'whatsapp',
          status: 'active',
          apiKey: process.env.WHATSAPP_API_KEY || null,
          webhookUrl: null,
          config: {}
        });
      }

      // Get or create conversation
      let conversation = await storage.getAllConversations().then(convs => 
        convs.find(c => c.platformId === platform!.id && c.userId === message.from)
      );

      if (!conversation) {
        conversation = await storage.createConversation({
          platformId: platform.id,
          userId: message.from,
          userName: message.profile?.name || 'Unknown User',
          status: 'active'
        });
      }

      // Store incoming message
      await storage.createMessage({
        conversationId: conversation.id,
        content: message.text?.body || '[Media]',
        sender: 'user',
        confidence: null,
        responseTime: null,
        templateId: null
      });

      // Generate bot response
      const { response, confidence, templateId } = await this.trainer.generateResponse(
        message.text?.body || '', 
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

      // Send response via WhatsApp API
      await this.sendMessage(message.from, response);

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
        message: 'WhatsApp message processed successfully',
        details: { 
          userId: message.from, 
          confidence, 
          responseTime,
          intent: 'processed'
        },
        source: 'whatsapp'
      });

    } catch (error) {
      await storage.createLog({
        level: 'error',
        message: 'Failed to process WhatsApp message',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        source: 'whatsapp'
      });
    }
  }

  private async sendMessage(to: string, message: string) {
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (!accessToken || !phoneNumberId) {
      console.warn('WhatsApp credentials not configured');
      return;
    }

    try {
      const response = await fetch(`https://graph.facebook.com/v17.0/${phoneNumberId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: to,
          text: { body: message }
        })
      });

      if (!response.ok) {
        throw new Error(`WhatsApp API error: ${response.statusText}`);
      }
    } catch (error) {
      await storage.createLog({
        level: 'error',
        message: 'Failed to send WhatsApp message',
        details: { error: error instanceof Error ? error.message : 'Unknown error', to },
        source: 'whatsapp'
      });
    }
  }
}
