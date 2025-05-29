import natural from 'natural';
import nlp from 'compromise';

export interface ProcessedMessage {
  intent: string;
  entities: Record<string, any>;
  sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  keywords: string[];
}

export class NLPProcessor {
  private classifier: natural.LogisticRegressionClassifier;
  private sentiment: natural.SentimentAnalyzer;
  private stemmer: typeof natural.PorterStemmer;

  constructor() {
    this.classifier = new natural.LogisticRegressionClassifier();
    this.sentiment = new natural.SentimentAnalyzer('English', 
      natural.PorterStemmer, 'afinn');
    this.stemmer = natural.PorterStemmer;
    this.initializeTraining();
  }

  private initializeTraining() {
    // Basic training data for common intents
    const trainingData = [
      { text: 'hello hi hey', intent: 'greeting' },
      { text: 'bye goodbye see you later', intent: 'farewell' },
      { text: 'help support assistance', intent: 'help' },
      { text: 'order status tracking number', intent: 'order_inquiry' },
      { text: 'price cost how much money', intent: 'pricing' },
      { text: 'product information details specs', intent: 'product_info' },
      { text: 'complaint problem issue error', intent: 'complaint' },
      { text: 'thank you thanks appreciate', intent: 'gratitude' },
      { text: 'cancel refund return', intent: 'cancel_request' },
      { text: 'delivery shipping when arrive', intent: 'delivery_inquiry' }
    ];

    trainingData.forEach(({ text, intent }) => {
      const tokens = text.toLowerCase().split(' ');
      this.classifier.addDocument(tokens, intent);
    });

    this.classifier.train();
  }

  public processMessage(message: string): ProcessedMessage {
    const cleanMessage = message.toLowerCase().trim();
    const tokens = cleanMessage.split(' ');
    
    // Intent classification
    const intent = this.classifier.classify(tokens) || 'unknown';
    const classifications = this.classifier.getClassifications(tokens);
    const confidence = Math.round((classifications[0]?.value || 0) * 100);

    // Sentiment analysis
    const sentiment = this.analyzeSentiment(cleanMessage);

    // Entity extraction using compromise
    const doc = nlp(message);
    const entities = this.extractEntities(doc);

    // Keywords extraction
    const keywords = this.extractKeywords(tokens);

    return {
      intent,
      entities,
      sentiment,
      confidence,
      keywords
    };
  }

  private analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
    const tokens = text.toLowerCase().split(' ');
    const score = this.sentiment.getSentiment(tokens);
    
    if (score > 0.1) return 'positive';
    if (score < -0.1) return 'negative';
    return 'neutral';
  }

  private extractEntities(doc: any): Record<string, any> {
    const entities: Record<string, any> = {};

    // Extract common entities
    const people = doc.people().out('array');
    const places = doc.places().out('array');
    const organizations = doc.organizations().out('array');
    const dates = doc.dates().out('array');
    const numbers = doc.numbers().out('array');
    const money = doc.money().out('array');

    if (people.length > 0) entities.people = people;
    if (places.length > 0) entities.places = places;
    if (organizations.length > 0) entities.organizations = organizations;
    if (dates.length > 0) entities.dates = dates;
    if (numbers.length > 0) entities.numbers = numbers;
    if (money.length > 0) entities.money = money;

    // Extract phone numbers and emails with regex
    const phoneRegex = /(\+?[\d\s\-\(\)]{10,})/g;
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const orderRegex = /#?(\w{5,})/g;

    const phones = doc.text().match(phoneRegex);
    const emails = doc.text().match(emailRegex);
    const orders = doc.text().match(orderRegex);

    if (phones) entities.phoneNumbers = phones;
    if (emails) entities.emails = emails;
    if (orders) entities.orderNumbers = orders;

    return entities;
  }

  private extractKeywords(tokens: string[]): string[] {
    // Remove stopwords and stem
    const stopwords = natural.stopwords;
    const keywords = tokens
      .filter(token => !stopwords.includes(token))
      .filter(token => token.length > 2)
      .map(token => this.stemmer.stem(token))
      .filter((token, index, array) => array.indexOf(token) === index); // unique

    return keywords.slice(0, 5); // Top 5 keywords
  }

  public trainClassifier(examples: Array<{ text: string; intent: string }>) {
    examples.forEach(({ text, intent }) => {
      const tokens = text.toLowerCase().split(' ');
      this.classifier.addDocument(tokens, intent);
    });
    
    this.classifier.train();
  }

  public getConfidenceThreshold(): number {
    return 0.7; // 70% confidence threshold
  }
}
