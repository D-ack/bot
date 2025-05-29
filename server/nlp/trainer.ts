import { SimpleNLPProcessor } from './simple-processor.js';
import { storage } from '../storage.js';

export interface TrainingData {
  text: string;
  intent: string;
  response?: string;
}

export class MLTrainer {
  private processor: SimpleNLPProcessor;

  constructor() {
    this.processor = new SimpleNLPProcessor();
  }

  public async trainFromConversations(): Promise<{ accuracy: number; samples: number }> {
    try {
      const conversations = await storage.getAllConversations();
      const trainingData: TrainingData[] = [];

      for (const conversation of conversations) {
        const messages = await storage.getMessagesByConversation(conversation.id);
        
        // Extract user messages and categorize based on bot responses
        for (let i = 0; i < messages.length - 1; i++) {
          const userMessage = messages[i];
          const botMessage = messages[i + 1];

          if (userMessage.sender === 'user' && botMessage.sender === 'bot') {
            const intent = this.inferIntentFromResponse(botMessage.content);
            if (intent) {
              trainingData.push({
                text: userMessage.content,
                intent,
                response: botMessage.content
              });
            }
          }
        }
      }

      // Train the classifier
      this.processor.trainClassifier(trainingData);

      // Calculate accuracy (simplified - in real implementation, use cross-validation)
      const accuracy = await this.calculateAccuracy(trainingData);

      // Update ML model in storage
      const currentModel = await storage.getCurrentMlModel();
      if (currentModel) {
        await storage.updateMlModel(currentModel.id, {
          accuracy: Math.round(accuracy * 100),
          trainingData: trainingData.map(({ text, intent }) => ({ text, intent })),
          status: 'ready',
          lastTrainedAt: new Date()
        });
      }

      await storage.createLog({
        level: 'info',
        message: 'ML model training completed',
        details: { accuracy, samples: trainingData.length },
        source: 'ml_trainer'
      });

      return { accuracy: Math.round(accuracy * 100), samples: trainingData.length };
    } catch (error) {
      await storage.createLog({
        level: 'error',
        message: 'ML model training failed',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        source: 'ml_trainer'
      });
      throw error;
    }
  }

  private inferIntentFromResponse(response: string): string | null {
    const responseIntentMap: Record<string, string> = {
      'hello': 'greeting',
      'hi': 'greeting',
      'welcome': 'greeting',
      'goodbye': 'farewell',
      'bye': 'farewell',
      'help': 'help',
      'assist': 'help',
      'support': 'help',
      'order': 'order_inquiry',
      'tracking': 'order_inquiry',
      'price': 'pricing',
      'cost': 'pricing',
      'product': 'product_info',
      'information': 'product_info',
      'sorry': 'complaint',
      'apologize': 'complaint',
      'thank': 'gratitude',
      'cancel': 'cancel_request',
      'refund': 'cancel_request',
      'delivery': 'delivery_inquiry',
      'shipping': 'delivery_inquiry'
    };

    const lowerResponse = response.toLowerCase();
    for (const [keyword, intent] of Object.entries(responseIntentMap)) {
      if (lowerResponse.includes(keyword)) {
        return intent;
      }
    }

    return null;
  }

  private async calculateAccuracy(trainingData: TrainingData[]): Promise<number> {
    if (trainingData.length === 0) return 0;

    let correct = 0;
    const testSize = Math.min(50, Math.floor(trainingData.length * 0.2)); // 20% for testing

    for (let i = 0; i < testSize; i++) {
      const sample = trainingData[i];
      const processed = this.processor.processMessage(sample.text);
      
      if (processed.intent === sample.intent && processed.confidence > 70) {
        correct++;
      }
    }

    return testSize > 0 ? correct / testSize : 0;
  }

  public async generateResponse(message: string, platformId: number): Promise<{
    response: string;
    confidence: number;
    templateId?: number;
  }> {
    const processed = this.processor.processMessage(message);
    const botConfig = await storage.getBotConfig();
    
    if (!botConfig) {
      throw new Error('Bot configuration not found');
    }

    // If confidence is below threshold, use fallback
    if (processed.confidence < botConfig.confidenceThreshold) {
      return {
        response: botConfig.fallbackMessage,
        confidence: processed.confidence
      };
    }

    // Find appropriate template based on intent
    const templates = await storage.getAllTemplates();
    const matchingTemplate = templates.find(t => 
      t.category.toLowerCase().includes(processed.intent) || 
      t.name.toLowerCase().includes(processed.intent)
    );

    if (matchingTemplate) {
      let response = matchingTemplate.content;
      
      // Replace variables with entities if available
      if (matchingTemplate.variables && processed.entities) {
        for (const variable of matchingTemplate.variables) {
          const entityValue = processed.entities[variable];
          if (entityValue) {
            response = response.replace(`{${variable}}`, entityValue);
          }
        }
      }

      // Update template usage count
      await storage.updateTemplate(matchingTemplate.id, {
        usageCount: matchingTemplate.usageCount + 1
      });

      return {
        response,
        confidence: processed.confidence,
        templateId: matchingTemplate.id
      };
    }

    // Generate basic response based on intent
    const intentResponses: Record<string, string> = {
      greeting: "Hello! How can I help you today?",
      farewell: "Thank you for contacting us. Have a great day!",
      help: "I'm here to help. What do you need assistance with?",
      order_inquiry: "I can help you with your order. Could you please provide your order number?",
      pricing: "I'd be happy to provide pricing information. What product are you interested in?",
      product_info: "What would you like to know about our products?",
      complaint: "I apologize for any inconvenience. Let me help resolve this issue for you.",
      gratitude: "You're welcome! Is there anything else I can help you with?",
      cancel_request: "I understand you'd like to cancel. Let me help you with that process.",
      delivery_inquiry: "I can check on your delivery status. Please provide your order number."
    };

    const response = intentResponses[processed.intent] || botConfig.fallbackMessage;

    return {
      response,
      confidence: processed.confidence
    };
  }
}
