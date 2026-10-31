import { EventType, VendorItem } from '../domain/types';

export interface TemplateVendorCategory {
  categoryId: string;
  categoryName: string;
  serviceName: string;
  questionsToAsk: string[];
  contractRedFlags: string[];
  inquiryDraft: string;
}

export const VENDOR_TEMPLATES: Record<EventType, TemplateVendorCategory[]> = {
  wedding: [
    {
      categoryId: 'venue_decor',
      categoryName: 'Venue & Décor',
      serviceName: 'Banquet Hall / Lawn & Stage Décor',
      questionsToAsk: [
        'What is the maximum indoor & lawn guest capacity under fire safety regulations?',
        'Are outside decorators and caterers permitted, or is there an exclusive in-house panel fee?',
        'What are the generator power-backup hours and fuel allowances?',
        'What is the noise curfew for amplified outdoor music according to local police guidelines?',
        'Is there dedicated bridal green room access with air conditioning and secure lockers?',
      ],
      contractRedFlags: [
        'Vague cleanup or electricity surcharge clauses with uncapped overtime fees.',
        'No clear force majeure or cancellation/rescheduling terms in writing.',
        'Deposit non-refundable without itemized proof of advance expenses incurred.',
      ],
      inquiryDraft:
        'Hello, we are planning a wedding celebration on [Event Date] in [City] for approximately [Guest Count] guests. We would love to check your availability, receive your venue brochure, and understand package options including basic setup and decor guidelines. Thank you!',
    },
    {
      categoryId: 'food_beverage',
      categoryName: 'Catering & Beverages',
      serviceName: 'Full Service Wedding Catering',
      questionsToAsk: [
        'Do you provide separate vegetarian and non-vegetarian preparation areas / utensils?',
        'Can you accommodate specific dietary requirements (e.g. Jain, gluten-free, vegan)?',
        'How many live counter staff and floor servers are included per 50 guests?',
        'Do you provide an advance food tasting session for 4 family members before finalizing?',
        'What is your protocol for excess food management and hygienic safe packaging?',
      ],
      contractRedFlags: [
        'Per-plate quote does not specify whether mineral water, ice, and service crockery are included.',
        'Clause stating prices can increase if vegetable or commodity prices fluctuate before event date.',
        'No health license or food safety handling certification available upon request.',
      ],
      inquiryDraft:
        'Hello, we are organizing our wedding catering for [Guest Count] guests on [Event Date] in [City]. We are looking for a high-quality buffet menu with live counters respecting dietary preferences ([Dietary Preferences]). Please share your sample menus, tasting policy, and per-guest pricing tiers.',
    },
    {
      categoryId: 'photography_video',
      categoryName: 'Photography & Cinematography',
      serviceName: 'Candid & Traditional Wedding Photography',
      questionsToAsk: [
        'How many primary photographers and cinematographers will personally be on-site?',
        'What is the exact delivery timeline for raw photographs, color-graded selects, and the wedding teaser reel?',
        'Is drone aerial coverage included, and do you obtain requisite municipal flight clearances?',
        'What backup camera bodies and audio recording equipment do you carry to the venue?',
      ],
      contractRedFlags: [
        'Lead photographer named in the portfolio assigns junior subcontracted crew without prior notice.',
        'Retention of high-resolution digital raw files behind additional unannounced paywalls.',
        'Delivery timeline exceeding 90 days without pre-agreed milestone preview dates.',
      ],
      inquiryDraft:
        'Hello, we love your photography portfolio and are looking for a photography and cinematography team for our celebration on [Event Date] in [City]. Our vibe is [Style / Vibe]. Please share your deliverables package, crew size, and current quote options.',
    },
    {
      categoryId: 'attire_beauty',
      categoryName: 'Attire, Jewelry & Grooming',
      serviceName: 'Bridal Makeup & Styling Artist',
      questionsToAsk: [
        'Do you travel to the venue location, and are travel/stay charges explicitly itemized?',
        'What cosmetic brands (dermatologically tested, cruelty-free) do you use in your kit?',
        'Does the booking include saree/dupatta draping, hair extensions, and jewelry setting?',
        'Is a paid trial session available, and does the trial fee adjust against final booking?',
      ],
      contractRedFlags: [
        'Double-booking multiple brides on the same morning without dedicated assistant buffer time.',
        'Refusal to provide an advance makeup trial.',
        'Sudden surcharge for early morning (pre-7 AM) call times not disclosed upfront.',
      ],
      inquiryDraft:
        'Hello! I am inquiring about bridal hair, makeup, and draping services for a wedding celebration on [Event Date] in [City]. The look desired is [Style / Vibe]. Could you please share your availability, bridal package inclusions, and trial session details?',
    },
    {
      categoryId: 'music_entertainment',
      categoryName: 'Music & Entertainment',
      serviceName: 'DJ, Sound System & Lighting',
      questionsToAsk: [
        'What audio wattage and speaker setup is recommended for our venue size and guest count?',
        'Do you provide corded and wireless microphones for ceremonial blessings and family emcees?',
        'Can we provide a custom "Must-Play" and "Do-Not-Play" song list in advance?',
      ],
      contractRedFlags: [
        'Sound engineer not included, requiring the family to operate mixers.',
        'Absence of public performance licensing guidance (PPL / IPRS where legally required).',
      ],
      inquiryDraft:
        'Hello! We are looking for a DJ and sound setup for our celebration on [Event Date] in [City]. Our music preference spans [Style / Vibe] with lively family celebration songs. Please share your equipment specifications, sample sets, and package pricing.',
    },
  ],
  birthday: [
    {
      categoryId: 'venue_decor',
      categoryName: 'Venue & Theme Styling',
      serviceName: 'Party Hall & Balloon Decorator',
      questionsToAsk: [
        'How many hours before the party can your team access the venue for balloon installation?',
        'Are organic, biodegradable balloons and reusable backdrop frameworks utilized?',
        'Is teardown and removal at the end of the party included in the quoted price?',
      ],
      contractRedFlags: [
        'Additional unstated fees for cleanup of glitter, balloon scraps, or adhesives.',
      ],
      inquiryDraft:
        'Hello! We are planning a birthday party for [Guest Count] guests on [Event Date] in [City] with the theme "[Style / Vibe]". Could you share your theme decor catalog and pricing?',
    },
    {
      categoryId: 'food_cake',
      categoryName: 'Catering & Custom Cake',
      serviceName: 'Bespoke Birthday Cake & Party Catering',
      questionsToAsk: [
        'Is refrigerated delivery directly to the venue available, and at what scheduled hour?',
        'Can you provide allergy-friendly (eggless, nut-free) portions clearly labeled?',
      ],
      contractRedFlags: [
        'Delivery window not guaranteed, risking cake arrival after party commencement.',
      ],
      inquiryDraft:
        'Hello, we are planning a birthday cake and snacks menu for [Guest Count] guests on [Event Date] in [City]. The theme is [Style / Vibe]. Please share your flavor options, design catalog, and quotation.',
    },
  ],
  community: [
    {
      categoryId: 'venue_infrastructure',
      categoryName: 'Venue & Infrastructure',
      serviceName: 'Tentage, Stage & Seating Rental',
      questionsToAsk: [
        'Is the marquee canopy waterproof and certified for wind stability in open grounds?',
        'Does the quote include delivery, setup, and municipal safety fire-retardant certification?',
      ],
      contractRedFlags: [
        'Hidden charges for extra chairs, stage carpeting, or generator diesel fuel.',
      ],
      inquiryDraft:
        'Hello! We are planning a community gathering for [Guest Count] participants on [Event Date] in [City]. We require stage fabrication, marquee canopy, and seating. Please provide your rental rate card and availability.',
    },
  ],
  other: [
    {
      categoryId: 'venue_setup',
      categoryName: 'Venue & Setup',
      serviceName: 'Event Hall Coordination',
      questionsToAsk: ['What setup and teardown buffer time is provided without additional charge?'],
      contractRedFlags: ['Unclear overtime penalties.'],
      inquiryDraft:
        'Hello! We are organizing an event on [Event Date] in [City] for [Guest Count] attendees. Please share your availability and package options.',
    },
  ],
};

export function createInitialVendors(eventType: EventType): VendorItem[] {
  const templates = VENDOR_TEMPLATES[eventType] ?? VENDOR_TEMPLATES.other;
  return templates.map((tmpl, index) => ({
    id: `vendor-${eventType}-${index + 1}`,
    categoryId: tmpl.categoryId,
    categoryName: tmpl.categoryName,
    serviceName: tmpl.serviceName,
    status: 'to_contact',
    questionsToAsk: tmpl.questionsToAsk,
    contractRedFlags: tmpl.contractRedFlags,
    inquiryDraft: tmpl.inquiryDraft,
  }));
}
