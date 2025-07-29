import { InterviewResponse, BusinessContext, WorkspaceCreationPlan } from "@/components/onboarding/OnboardingAgent";

// Business type templates for workspace generation
const BUSINESS_TYPE_TEMPLATES = {
  startup: {
    basketPrefix: "Startup",
    documentTypes: ["strategy", "analysis", "research", "planning"],
    themes: ["growth", "product-market-fit", "funding", "market-analysis"],
    patterns: ["customer-validation", "competitive-landscape", "growth-metrics"]
  },
  consulting: {
    basketPrefix: "Consulting",
    documentTypes: ["analysis", "research", "strategy", "planning"],
    themes: ["client-solutions", "methodology", "recommendations", "deliverables"],
    patterns: ["problem-solving", "framework-application", "client-engagement"]
  },
  retail: {
    basketPrefix: "Retail",
    documentTypes: ["analysis", "strategy", "research", "planning"],
    themes: ["customer-experience", "inventory", "sales-optimization", "market-trends"],
    patterns: ["seasonal-patterns", "customer-behavior", "supply-chain"]
  },
  technology: {
    basketPrefix: "Tech",
    documentTypes: ["strategy", "analysis", "research", "planning"],
    themes: ["innovation", "scalability", "user-experience", "technology-stack"],
    patterns: ["development-cycles", "user-feedback", "technical-debt"]
  },
  healthcare: {
    basketPrefix: "Healthcare",
    documentTypes: ["analysis", "research", "strategy", "planning"],
    themes: ["patient-outcomes", "compliance", "efficiency", "care-quality"],
    patterns: ["patient-flow", "regulatory-requirements", "outcome-metrics"]
  },
  default: {
    basketPrefix: "Business",
    documentTypes: ["strategy", "analysis", "research", "planning"],
    themes: ["objectives", "challenges", "opportunities", "stakeholders"],
    patterns: ["business-process", "stakeholder-needs", "success-metrics"]
  }
};

// Document templates based on challenge types
const CHALLENGE_DOCUMENT_TEMPLATES = {
  product: {
    strategy: "Product Strategy & Roadmap",
    analysis: "Market & Competitive Analysis", 
    research: "Customer Research & Insights",
    planning: "Product Development Plan"
  },
  marketing: {
    strategy: "Marketing Strategy & Positioning",
    analysis: "Market Analysis & Segmentation",
    research: "Customer & Campaign Research", 
    planning: "Marketing Campaign Plan"
  },
  operations: {
    strategy: "Operational Strategy & Goals",
    analysis: "Process & Efficiency Analysis",
    research: "Operational Research & Benchmarks",
    planning: "Operations Improvement Plan"
  },
  sales: {
    strategy: "Sales Strategy & Approach",
    analysis: "Sales Performance Analysis",
    research: "Customer & Market Research",
    planning: "Sales Execution Plan"
  },
  default: {
    strategy: "Strategic Overview & Direction",
    analysis: "Situation Analysis & Assessment",
    research: "Research & Market Intelligence",
    planning: "Action Plan & Implementation"
  }
};

export async function processInterview(
  responses: InterviewResponse[],
  context: BusinessContext
): Promise<WorkspaceCreationPlan> {
  
  // Determine business type template
  const businessType = inferBusinessType(context.businessType);
  const template = BUSINESS_TYPE_TEMPLATES[businessType] || BUSINESS_TYPE_TEMPLATES.default;
  
  // Determine challenge type for document templates
  const challengeType = inferChallengeType(context.challenge);
  const docTemplates = CHALLENGE_DOCUMENT_TEMPLATES[challengeType] || CHALLENGE_DOCUMENT_TEMPLATES.default;
  
  // Generate basket name and description
  const basketName = generateBasketName(context, template.basketPrefix);
  const basketDescription = generateBasketDescription(context);
  
  // Generate documents
  const documents = generateDocuments(context, docTemplates, template.documentTypes);
  
  // Generate context items
  const contextItems = generateContextItems(context, responses);
  
  // Generate intelligence seeds
  const intelligenceSeeds = generateIntelligenceSeeds(context, template);
  
  return {
    basketName,
    basketDescription,
    documents,
    contextItems,
    intelligenceSeeds
  };
}

function inferBusinessType(businessTypeText: string): keyof typeof BUSINESS_TYPE_TEMPLATES {
  const text = businessTypeText.toLowerCase();
  
  if (text.includes('startup') || text.includes('new company') || text.includes('founding')) {
    return 'startup';
  }
  if (text.includes('consulting') || text.includes('advisor') || text.includes('consultant')) {
    return 'consulting';
  }
  if (text.includes('retail') || text.includes('store') || text.includes('ecommerce')) {
    return 'retail';
  }
  if (text.includes('tech') || text.includes('software') || text.includes('app') || text.includes('platform')) {
    return 'technology';
  }
  if (text.includes('healthcare') || text.includes('medical') || text.includes('hospital')) {
    return 'healthcare';
  }
  
  return 'default';
}

function inferChallengeType(challengeText: string): keyof typeof CHALLENGE_DOCUMENT_TEMPLATES {
  const text = challengeText.toLowerCase();
  
  if (text.includes('product') || text.includes('feature') || text.includes('development')) {
    return 'product';
  }
  if (text.includes('marketing') || text.includes('campaign') || text.includes('brand')) {
    return 'marketing';
  }
  if (text.includes('operations') || text.includes('process') || text.includes('efficiency')) {
    return 'operations';
  }
  if (text.includes('sales') || text.includes('revenue') || text.includes('customers')) {
    return 'sales';
  }
  
  return 'default';
}

function generateBasketName(context: BusinessContext, prefix: string): string {
  // Extract key terms from challenge
  const challengeWords = context.challenge
    .split(' ')
    .filter(word => word.length > 4)
    .slice(0, 3);
  
  if (challengeWords.length > 0) {
    const keyTerm = challengeWords[0].charAt(0).toUpperCase() + challengeWords[0].slice(1);
    return `${prefix} ${keyTerm} Project`;
  }
  
  return `${prefix} Project`;
}

function generateBasketDescription(context: BusinessContext): string {
  return `Comprehensive workspace for ${context.challenge.toLowerCase()}. ` +
         `Focused on delivering ${context.successCriteria.toLowerCase()} ` +
         `for ${context.stakeholders.toLowerCase()}.`;
}

function generateDocuments(
  context: BusinessContext,
  docTemplates: typeof CHALLENGE_DOCUMENT_TEMPLATES[keyof typeof CHALLENGE_DOCUMENT_TEMPLATES],
  documentTypes: string[]
) {
  return documentTypes.map(type => {
    const title = docTemplates[type as keyof typeof docTemplates] || `${type.charAt(0).toUpperCase() + type.slice(1)} Document`;
    
    return {
      title,
      type,
      initialContent: generateInitialContent(type, context),
      suggestedBlocks: generateSuggestedBlocks(type, context)
    };
  });
}

function generateInitialContent(type: string, context: BusinessContext): string {
  const templates = {
    strategy: `# Strategic Overview\n\n## Challenge\n${context.challenge}\n\n## Success Criteria\n${context.successCriteria}\n\n## Key Stakeholders\n${context.stakeholders}\n\n## Current Context\n${context.existingInfo}`,
    
    analysis: `# Analysis Framework\n\n## Current Situation\n${context.challenge}\n\n## Available Information\n${context.existingInfo}\n\n## Success Metrics\n${context.successCriteria}\n\n## Stakeholder Impact\n${context.stakeholders}`,
    
    research: `# Research Plan\n\n## Research Objectives\nUnderstanding: ${context.challenge}\n\n## Information Available\n${context.existingInfo}\n\n## Target Insights\nSupporting: ${context.successCriteria}\n\n## Key Audiences\n${context.stakeholders}`,
    
    planning: `# Implementation Plan\n\n## Project Goal\n${context.challenge}\n\n## Success Definition\n${context.successCriteria}\n\n## Stakeholder Involvement\n${context.stakeholders}\n\n## Current Assets\n${context.existingInfo}`
  };
  
  return templates[type as keyof typeof templates] || `# ${type.charAt(0).toUpperCase() + type.slice(1)}\n\n${context.challenge}`;
}

function generateSuggestedBlocks(type: string, context: BusinessContext): string[] {
  const blockTemplates = {
    strategy: ["Executive Summary", "Market Analysis", "Strategic Objectives", "Implementation Roadmap", "Risk Assessment"],
    analysis: ["Current State", "Gap Analysis", "Competitive Landscape", "SWOT Analysis", "Recommendations"],
    research: ["Research Methodology", "Data Collection", "Key Findings", "Insights & Implications", "Next Steps"],
    planning: ["Project Scope", "Timeline & Milestones", "Resource Requirements", "Success Metrics", "Risk Mitigation"]
  };
  
  return blockTemplates[type as keyof typeof blockTemplates] || ["Overview", "Analysis", "Recommendations", "Next Steps"];
}

function generateContextItems(context: BusinessContext, responses: InterviewResponse[]) {
  const items = [];
  
  // Add business context
  items.push({
    type: "business_context",
    content: context.businessType,
    relevance: 0.9
  });
  
  // Add stakeholder context
  items.push({
    type: "stakeholder_info",
    content: context.stakeholders,
    relevance: 0.8
  });
  
  // Add success criteria
  items.push({
    type: "success_criteria",
    content: context.successCriteria,
    relevance: 0.9
  });
  
  // Add existing information context
  if (context.existingInfo.trim()) {
    items.push({
      type: "existing_data",
      content: context.existingInfo,
      relevance: 0.7
    });
  }
  
  return items;
}

function generateIntelligenceSeeds(
  context: BusinessContext,
  template: typeof BUSINESS_TYPE_TEMPLATES[keyof typeof BUSINESS_TYPE_TEMPLATES]
) {
  // Extract themes from context
  const contextThemes = extractThemesFromText(context.challenge + " " + context.successCriteria);
  const themes = [...template.themes, ...contextThemes].slice(0, 5);
  
  // Generate patterns based on business type and context
  const patterns = [...template.patterns, "stakeholder-alignment", "success-measurement"];
  
  // Generate connections based on stakeholders and business type
  const connections = [
    `${context.businessType}-${context.stakeholders}`,
    `challenge-${extractKeyword(context.challenge)}`,
    `success-${extractKeyword(context.successCriteria)}`
  ];
  
  return {
    themes,
    patterns,
    connections
  };
}

function extractThemesFromText(text: string): string[] {
  const keywords = text.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 4)
    .filter(word => !['challenge', 'project', 'business', 'company'].includes(word))
    .slice(0, 3);
  
  return keywords;
}

function extractKeyword(text: string): string {
  const words = text.split(' ').filter(word => word.length > 4);
  return words[0]?.toLowerCase() || 'general';
}