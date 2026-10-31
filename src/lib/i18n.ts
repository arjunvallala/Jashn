import { LanguageCode } from '../domain/types';

export interface TranslationDictionary {
  appName: string;
  tagline: string;
  skipLink: string;
  nav: {
    dashboard: string;
    budget: string;
    timeline: string;
    vendors: string;
    ideas: string;
    chat: string;
    dataControl: string;
  };
  wizard: {
    title: string;
    subtitle: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    eventType: string;
    eventDate: string;
    city: string;
    guestCount: string;
    totalBudget: string;
    currency: string;
    styleVibe: string;
    mustHaves: string;
    constraints: string;
    dietary: string;
    accessibility: string;
    cultureTraditions: string;
    next: string;
    back: string;
    generate: string;
    generatingNotice: string;
    loadSample: string;
  };
  budget: {
    title: string;
    total: string;
    spent: string;
    remaining: string;
    contingency: string;
    costPerGuest: string;
    optimize: string;
    whatIf: string;
    overspendAlert: string;
  };
  timeline: {
    title: string;
    exportIcs: string;
    listView: string;
    calendarView: string;
    runOfShow: string;
    criticalPath: string;
    leadTimeWarning: string;
  };
  vendors: {
    title: string;
    disclaimer: string;
    pipeline: string;
    questionsToAsk: string;
    redFlags: string;
    inquiryDraft: string;
    copy: string;
    copied: string;
  };
  ideas: {
    title: string;
    refineChips: {
      all: string;
      cheaper: string;
      traditional: string;
      modern: string;
      accessible: string;
    };
    pinned: string;
  };
}

export const TRANSLATIONS: Record<LanguageCode, TranslationDictionary> = {
  en: {
    appName: 'Jashn',
    tagline: 'GenAI Celebration & Event Planner',
    skipLink: 'Skip to main content',
    nav: {
      dashboard: 'Dashboard',
      budget: 'Budget',
      timeline: 'Timeline',
      vendors: 'Vendors',
      ideas: 'Ideas',
      chat: 'AI Assistant',
      dataControl: 'Data & Privacy',
    },
    wizard: {
      title: 'Plan Your Grand Celebration',
      subtitle: 'Accessible, culturally rich, and budget-balanced planning powered by Gemini',
      step1: 'Event Basics',
      step2: 'Financials',
      step3: 'Aesthetics & Care',
      step4: 'Language & Preferences',
      eventType: 'Event Type',
      eventDate: 'Event Date',
      city: 'City / Location',
      guestCount: 'Expected Guests',
      totalBudget: 'Total Budget',
      currency: 'Currency',
      styleVibe: 'Celebration Style / Vibe',
      mustHaves: 'Must-Have Features',
      constraints: 'Guest Care & Inclusivity',
      dietary: 'Dietary Needs',
      accessibility: 'Accessibility Accommodations',
      cultureTraditions: 'Traditions & Customs',
      next: 'Next Step',
      back: 'Back',
      generate: 'Generate Celebration Plan',
      generatingNotice: 'Gemini is crafting your personalized plan. Balances are mathematically enforced.',
      loadSample: 'Load Sample Wedding (Instant Preview)',
    },
    budget: {
      title: 'Budget Allocation & Tracking',
      total: 'Total Budget',
      spent: 'Total Spent',
      remaining: 'Remaining',
      contingency: 'Protected Contingency',
      costPerGuest: 'Cost Per Guest',
      optimize: 'AI Optimize Deficit',
      whatIf: 'Live What-If Simulation',
      overspendAlert: 'Overspend Warning',
    },
    timeline: {
      title: 'Timeline & Back-Scheduling',
      exportIcs: 'Export iCalendar (.ics)',
      listView: 'Chronological List',
      calendarView: 'Calendar View',
      runOfShow: 'Day-Of Run-of-Show',
      criticalPath: 'Critical Path Milestones',
      leadTimeWarning: 'Tight Lead-Time Warning',
    },
    vendors: {
      title: 'Vendor Pipeline & Checklists',
      disclaimer: 'AI guidance & criteria only. Jashn never invents fake phone numbers or reviews. Always verify contracts directly.',
      pipeline: 'Status Pipeline',
      questionsToAsk: 'Essential Questions to Ask',
      redFlags: 'Contract Red Flags to Avoid',
      inquiryDraft: 'Customized Message Draft',
      copy: 'Copy Inquiry',
      copied: 'Copied to Clipboard!',
    },
    ideas: {
      title: 'Personalized Celebration Ideas',
      refineChips: {
        all: 'All Ideas',
        cheaper: 'Make It Cheaper (₹)',
        traditional: 'More Traditional',
        modern: 'More Modern',
        accessible: 'Sensory & Accessibility Friendly',
      },
      pinned: 'Saved & Pinned',
    },
  },
  hi: {
    appName: 'जश्न (Jashn)',
    tagline: 'उत्सव और विवाह योजना सहायक',
    skipLink: 'मुख्य सामग्री पर जाएं',
    nav: {
      dashboard: 'डैशबोर्ड',
      budget: 'बजट',
      timeline: 'समयरेखा',
      vendors: 'विक्रेता',
      ideas: 'विचार',
      chat: 'सहायक',
      dataControl: 'डेटा और गोपनीयता',
    },
    wizard: {
      title: 'अपने भव्य उत्सव की योजना बनाएं',
      subtitle: 'सांस्कृतिक रूप से समृद्ध और संतुलित बजट योजना',
      step1: 'उत्सव विवरण',
      step2: 'बजट और मुद्रा',
      step3: 'शैली और देखभाल',
      step4: 'भाषा',
      eventType: 'कार्यक्रम का प्रकार',
      eventDate: 'कार्यक्रम की तिथि',
      city: 'शहर / स्थान',
      guestCount: 'अतिथि संख्या',
      totalBudget: 'कुल बजट',
      currency: 'मुद्रा',
      styleVibe: 'उत्सव की शैली / थीम',
      mustHaves: 'अनिवार्य इच्छाएं',
      constraints: 'अतिथि देखभाल',
      dietary: 'खानपान प्राथमिकताएं',
      accessibility: 'सुलभता आवश्यकताएं',
      cultureTraditions: 'परंपराएं और रीति-रिवाज',
      next: 'अगला चरण',
      back: 'पीछे',
      generate: 'योजना तैयार करें',
      generatingNotice: 'योजना तैयार की जा रही है...',
      loadSample: 'नमूना विवाह लोड करें (त्वरित पूर्वावलोकन)',
    },
    budget: {
      title: 'बजट ट्रैकिंग और आवंटन',
      total: 'कुल बजट',
      spent: 'कुल खर्च',
      remaining: 'शेष राशि',
      contingency: 'सुरक्षित आकस्मिक निधि',
      costPerGuest: 'प्रति अतिथि लागत',
      optimize: 'बजट संतुलित करें',
      whatIf: 'अनुमानित पुनर्गणना',
      overspendAlert: 'अतिरिक्त खर्च चेतावनी',
    },
    timeline: {
      title: 'समयरेखा और दैनिक कार्यक्रम',
      exportIcs: 'कैलेंडर डाउनलोड करें (.ics)',
      listView: 'सूची दृश्य',
      calendarView: 'कैलेंडर दृश्य',
      runOfShow: 'उत्सव दिवस समय सारिणी',
      criticalPath: 'महत्वपूर्ण मील के पत्थर',
      leadTimeWarning: 'कम समय चेतावनी',
    },
    vendors: {
      title: 'विक्रेता चेकलिस्ट और मार्गदर्शन',
      disclaimer: 'एआई केवल मार्गदर्शन प्रदान करता है। किसी भी अनुबंध पर हस्ताक्षर करने से पहले स्वयं पुष्टि करें।',
      pipeline: 'स्थिति पाइपलाइन',
      questionsToAsk: 'पूछे जाने वाले महत्वपूर्ण प्रश्न',
      redFlags: 'अनुबंध में ध्यान देने योग्य बातें',
      inquiryDraft: 'संदेश मसौदा',
      copy: 'संदेश कॉपी करें',
      copied: 'कॉपी हो गया!',
    },
    ideas: {
      title: 'विशेष उत्सव विचार',
      refineChips: {
        all: 'सभी विचार',
        cheaper: 'किफायती विकल्प (₹)',
        traditional: 'पारंपरिक शैली',
        modern: 'आधुनिक रूप',
        accessible: 'वरिष्ठ एवं सुलभ अनुकूल',
      },
      pinned: 'सहेजे गए विचार',
    },
  },
  te: {
    appName: 'జష్న్ (Jashn)',
    tagline: 'వేడుకలు & వివాహ ప్రణాళికా సహాయకుడు',
    skipLink: 'ముఖ్య విషయానికి వెళ్ళండి',
    nav: {
      dashboard: 'డ్యాష్‌బోర్డ్',
      budget: 'బడ్జెట్',
      timeline: 'కాలపట్టిక',
      vendors: 'సర్వీస్ ప్రొవైడర్లు',
      ideas: 'ఆలోచనలు',
      chat: 'సహాయకుడు',
      dataControl: 'గోప్యత & డేటా',
    },
    wizard: {
      title: 'మీ శుభకార్య ప్రణాళికను రూపొందించుకోండి',
      subtitle: 'సంప్రదాయాలను గౌరవిస్తూ నిర్దిష్ట బడ్జెట్ ప్రణాళిక',
      step1: 'వేడుక వివరాలు',
      step2: 'బడ్జెట్',
      step3: 'శైలి & సంప్రదాయాలు',
      step4: 'భాష',
      eventType: 'కార్యక్రమ రకం',
      eventDate: 'తేదీ',
      city: 'నగరం / ఊరు',
      guestCount: 'అతిథుల సంఖ్య',
      totalBudget: 'మొత్తం బడ్జెట్',
      currency: 'కరెన్సీ',
      styleVibe: 'వేడుక శైలి / థీమ్',
      mustHaves: 'ముఖ్యమైన అవసరాలు',
      constraints: 'అతిథి సంరక్షణ',
      dietary: 'భోజన నియమాలు',
      accessibility: 'ప్రత్యేక సదుపాయాలు',
      cultureTraditions: 'ఆచారాలు & సంప్రదాయాలు',
      next: 'తరువాత',
      back: 'వెనుకకు',
      generate: 'ప్రణాళిక తయారు చేయండి',
      generatingNotice: 'ప్రణాళిక సిద్ధమవుతోంది...',
      loadSample: 'నమూనా వివాహం చూడండి (తక్షణ ప్రివ్యూ)',
    },
    budget: {
      title: 'బడ్జెట్ నిర్వహణ',
      total: 'మొత్తం బడ్జెట్',
      spent: 'ఖర్చు చేసిన మొత్తం',
      remaining: 'మిగిలిన నిధులు',
      contingency: 'రిజర్వ్ నిధి',
      costPerGuest: 'అతిథికి సగటు వ్యయం',
      optimize: 'ఖర్చులు ఆప్టిమైజ్ చేయండి',
      whatIf: 'లైవ్ అంచనాలు',
      overspendAlert: 'మితిమీరిన ఖర్చు హెచ్చరిక',
    },
    timeline: {
      title: 'ముఖ్యమైన తేదీలు & సమయపట్టిక',
      exportIcs: 'క్యాలెండర్ ఎగుమతి (.ics)',
      listView: 'జాబితా',
      calendarView: 'క్యాలెండర్',
      runOfShow: 'శుభదిన కార్యక్రమ వివరాలు',
      criticalPath: 'కీలక మైలురాళ్ళు',
      leadTimeWarning: 'సమయ పరిమితి హెచ్చరిక',
    },
    vendors: {
      title: 'సర్వీస్ ప్రొవైడర్ల చెక్‌లిస్ట్',
      disclaimer: 'AI సూచనలు మాత్రమే అందిస్తుంది. విక్రేతలతో నేరుగా వివరాలు నిర్ధారించుకోండి.',
      pipeline: 'స్టేటస్ పైప్‌లైన్',
      questionsToAsk: 'అడగాల్సిన ముఖ్యమైన ప్రశ్నలు',
      redFlags: 'కాంట్రాక్ట్ జాగ్రత్తలు',
      inquiryDraft: 'సందేశం డ్రాఫ్ట్',
      copy: 'కాపీ చేయండి',
      copied: 'కాపీ చేయబడింది!',
    },
    ideas: {
      title: 'ఆకర్షణీయమైన ఆలోచనలు',
      refineChips: {
        all: 'అన్ని ఆలోచనలు',
        cheaper: 'తక్కువ ఖర్చు (₹)',
        traditional: 'సాంప్రదాయ పద్ధతి',
        modern: 'ఆధునిక రూపం',
        accessible: 'అందరికీ అనుకూలం',
      },
      pinned: 'సేవ్ చేసినవి',
    },
  },
};

export const PLAIN_LANGUAGE_MAP: Record<string, string> = {
  'Contingency Reserve': 'Emergency Buffer Money',
  'Allocated Budget': 'Planned Money',
  'Cost per guest': 'Cost for each person',
  'Infeasible lead time': 'Not enough time remaining',
  'Topological sorting': 'Correct step-by-step order',
  'Critical Path': 'Must-Do-On-Time Tasks',
  'Run-of-show': 'Hour-by-hour schedule on the big day',
  'Deposit Due': 'Advance payment date',
};
