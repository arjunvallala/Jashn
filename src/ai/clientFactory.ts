import { GeminiClient } from './clientInterface';
import { RealGeminiClient } from './realClient';
import { MockGeminiClient } from './mockClient';

let defaultClientOverride: GeminiClient | null = null;

export function setGlobalGeminiClient(client: GeminiClient | null): void {
  defaultClientOverride = client;
}

export function getGeminiClient(): GeminiClient {
  if (defaultClientOverride) {
    return defaultClientOverride;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'mock_key_for_ci') {
    return new MockGeminiClient({
      mode: 'success',
      data: {
        eventSummary: 'A vibrant, culturally respectful celebration curated for your loved ones.',
        categoryWeights: [
          { categoryId: 'venue_decor', suggestedWeight: 0.35, rationale: 'Heritage setting and lighting.' },
          { categoryId: 'food_beverage', suggestedWeight: 0.32, rationale: 'Inclusive dining menu.' },
          { categoryId: 'photography_video', suggestedWeight: 0.13, rationale: 'Candid photography.' },
          { categoryId: 'attire_beauty', suggestedWeight: 0.1, rationale: 'Ceremonial styling.' },
          { categoryId: 'music_entertainment', suggestedWeight: 0.05, rationale: 'Acoustic background set.' },
          { categoryId: 'logistics_invites', suggestedWeight: 0.05, rationale: 'Invitations & welcome kits.' },
        ],
        personalizedTasks: [
          {
            title: 'Sample Task: Reserve Tasting Session',
            description: 'Sample description',
            categoryId: 'food_beverage',
            dayOffset: -90,
            priority: 'high',
            dependencies: [],
          },
        ],
        vendorGuidance: [
          {
            categoryId: 'venue_decor',
            serviceName: 'Venue Setup',
            questionsToAsk: ['Are outside decorators allowed?'],
            contractRedFlags: ['Unclear overtime penalties.'],
            inquiryDraft: 'Hello, please send your brochure and pricing tiers.',
          },
        ],
        creativeIdeas: [
          {
            categoryId: 'venue_decor',
            title: 'Sustainable Marigold Wall',
            description: 'Biodegradable floral backdrop.',
            whyItFits: 'Eco-friendly and traditional.',
            costTier: '₹',
            estimatedBudgetPercent: 3,
            tags: ['eco', 'decor'],
          },
        ],
      },
    });
  }

  return new RealGeminiClient();
}
