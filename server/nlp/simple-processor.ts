export interface ProcessedMessage {
  intent: string;
  entities: Record<string, any>;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  keywords: string[];
}

export class SimpleNLPProcessor {
  constructor() {}

  public processMessage(message: string): ProcessedMessage {
    const cleanMessage = message.toLowerCase().trim();
    const tokens = cleanMessage.split(' ').filter(token => token.length > 0);
    
    // Simple intent classification
    const intent = this.classifyIntent(cleanMessage);
    
    // Simple sentiment analysis
    const sentiment = this.analyzeSentiment(cleanMessage);
    
    // Extract simple keywords
    const keywords = this.extractKeywords(tokens);
    
    return {
      intent,
      entities: {},
      sentiment,
      confidence: 0.75, // Fixed confidence for simplicity
      keywords
    };
  }

  private classifyIntent(message: string): string {
    // Simple keyword-based intent classification
    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      return 'greeting';
    }
    if (message.includes('help') || message.includes('support')) {
      return 'help_request';
    }
    if (message.includes('thank') || message.includes('thanks')) {
      return 'gratitude';
    }
    if (message.includes('bye') || message.includes('goodbye')) {
      return 'farewell';
    }
    if (message.includes('price') || message.includes('cost') || message.includes('payment')) {
      return 'pricing_inquiry';
    }
    if (message.includes('delivery') || message.includes('shipping')) {
      return 'delivery_inquiry';
    }
    return 'general_inquiry';
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'love', 'like', 'happy', 'pleased'];
    const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'dislike', 'angry', 'frustrated', 'disappointed'];
    
    const words = text.split(' ');
    let positiveCount = 0;
    let negativeCount = 0;
    
    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private extractKeywords(tokens: string[]): string[] {
    // Filter out common stop words and return meaningful keywords
    const stopWords = ['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by', 'that', 'this', 'it', 'from', 'they', 'we', 'say', 'her', 'she', 'he', 'will', 'my', 'one', 'all', 'would', 'there', 'their'];
    
    return tokens
      .filter(token => !stopWords.includes(token) && token.length > 2)
      .slice(0, 5);
  }

  public trainClassifier(examples: Array<{ text: string; intent: string }>) {
    // Simple training - could be expanded later
    console.log(`Training with ${examples.length} examples`);
  }

  public getConfidenceThreshold(): number {
    return 0.7;
  }
}