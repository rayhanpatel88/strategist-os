export type DiagnosisInput = {
  goal: string;
  industry: string;
  assets: string;
  constraints: string;
  deadline: string;
  desiredOutcome: string;
  bottleneck: string;
};

export type ScorecardInput = {
  goal: string;
  industry: string;
  currentStatus: string;
};

export type PromptInput = {
  category: string;
  context: string;
  goal: string;
};

export type OpportunityInput = {
  skills: string;
  experience: string;
  tools: string;
  projects: string;
  targetAudience: string;
  desiredPath: string;
};

export type PlannerInput = {
  strategicGoal: string;
  keyRecommendation: string;
  resources: string;
  constraints: string;
};

export const buildDiagnosisPrompt = (input: DiagnosisInput): string => `
You are a strategic advisor. Analyse the situation below and produce a clear, direct diagnosis.

GOAL: ${input.goal}
INDUSTRY/DOMAIN: ${input.industry}
CURRENT ASSETS: ${input.assets}
CONSTRAINTS: ${input.constraints}
DEADLINE: ${input.deadline}
DESIRED OUTCOME: ${input.desiredOutcome}
CURRENT BOTTLENECK: ${input.bottleneck}

Respond with a JSON object with EXACTLY this structure:
{
  "strategicDiagnosis": "A clear 2-3 paragraph diagnosis identifying the core strategic situation, key leverage points, and what is actually happening",
  "leverageScore": <number 1-100 representing leverage of current position>,
  "bottleneckAnalysis": "What is actually blocking progress, not just the surface-level issue",
  "opportunityMap": ["opportunity 1", "opportunity 2", "opportunity 3", "opportunity 4"],
  "riskMap": ["risk 1", "risk 2", "risk 3"],
  "roiActions": [
    {"action": "Highest ROI action", "impact": "Why this has outsized return", "timeframe": "e.g. 7 days"},
    {"action": "Second action", "impact": "Why this matters", "timeframe": "e.g. 14 days"},
    {"action": "Third action", "impact": "Why this compounds", "timeframe": "e.g. 30 days"}
  ],
  "eliteOperatorNextStep": "The highest-priority action for the next 48 hours, with specifics"
}

Be direct. No vague recommendations.
`;

export const buildScorecardPrompt = (input: ScorecardInput): string => `
You are a strategic scoring assistant. Score the following across 8 dimensions.

GOAL: ${input.goal}
INDUSTRY: ${input.industry}
CURRENT STATUS: ${input.currentStatus}

Score each dimension 1-100 with honesty. Respond with EXACTLY this JSON structure:
{
  "overallScore": <weighted average 1-100>,
  "dimensions": [
    {
      "name": "Clarity",
      "score": <1-100>,
      "reasoning": "Why this score, be specific",
      "howToImprove": "Concrete steps to improve this score",
      "eliteRecommendation": "What a stronger operator does differently here"
    },
    {
      "name": "Leverage",
      "score": <1-100>,
      "reasoning": "...",
      "howToImprove": "...",
      "eliteRecommendation": "..."
    },
    {
      "name": "Distribution",
      "score": <1-100>,
      "reasoning": "...",
      "howToImprove": "...",
      "eliteRecommendation": "..."
    },
    {
      "name": "Execution Speed",
      "score": <1-100>,
      "reasoning": "...",
      "howToImprove": "...",
      "eliteRecommendation": "..."
    },
    {
      "name": "Differentiation",
      "score": <1-100>,
      "reasoning": "...",
      "howToImprove": "...",
      "eliteRecommendation": "..."
    },
    {
      "name": "Proof/Credibility",
      "score": <1-100>,
      "reasoning": "...",
      "howToImprove": "...",
      "eliteRecommendation": "..."
    },
    {
      "name": "Monetisation Potential",
      "score": <1-100>,
      "reasoning": "...",
      "howToImprove": "...",
      "eliteRecommendation": "..."
    },
    {
      "name": "Automation Potential",
      "score": <1-100>,
      "reasoning": "...",
      "howToImprove": "...",
      "eliteRecommendation": "..."
    }
  ],
  "topPriority": "The single highest-leverage dimension to focus on right now",
  "strategicSummary": "2-3 sentence summary of the strategic position and what needs to change"
}
`;

export const buildPromptGeneratorPrompt = (input: PromptInput): string => `
You are a prompt writer. Create a structured, reusable prompt for the following use case.

CATEGORY: ${input.category}
CONTEXT: ${input.context}
GOAL: ${input.goal}

Create a well-structured, reusable prompt. Respond with EXACTLY this JSON:
{
  "title": "Descriptive title for this prompt",
  "category": "${input.category}",
  "prompt": "The complete, structured prompt. Include role assignment, context injection points, output format instructions, and quality gates. Use [VARIABLE] syntax for customisable parts.",
  "usage": "How to use this prompt effectively: when to deploy it, what to watch for",
  "variables": ["list", "of", "variable", "names", "to", "fill", "in"]
}

The prompt must be:
- Professional and precise
- Reusable across similar situations
- Structured with clear sections
- Producing consistent, useful output
`;

export const buildOpportunityStackPrompt = (input: OpportunityInput): string => `
You are a business strategist. Analyse this person's assets and produce an opportunity stack.

SKILLS: ${input.skills}
EXPERIENCE: ${input.experience}
TOOLS KNOWN: ${input.tools}
CURRENT PROJECTS: ${input.projects}
TARGET AUDIENCE: ${input.targetAudience}
DESIRED PATH: ${input.desiredPath}

Respond with EXACTLY this JSON:
{
  "positioningAngle": "The sharpest positioning angle, specific to their combination of assets",
  "bestNiche": "The most defensible and profitable niche given their specific skills and context",
  "offerIdea": "A concrete offer or project idea with a clear value proposition and target buyer",
  "contentAngle": "The content angle that will attract their ideal audience and the perspective they can own",
  "proofAsset": "The single most valuable proof asset they should build next: specific, achievable, high-signal",
  "roadmap30Day": [
    {
      "week": 1,
      "focus": "Theme for week 1",
      "actions": ["specific action 1", "specific action 2", "specific action 3"]
    },
    {
      "week": 2,
      "focus": "Theme for week 2",
      "actions": ["specific action 1", "specific action 2", "specific action 3"]
    },
    {
      "week": 3,
      "focus": "Theme for week 3",
      "actions": ["specific action 1", "specific action 2", "specific action 3"]
    },
    {
      "week": 4,
      "focus": "Theme for week 4",
      "actions": ["specific action 1", "specific action 2", "specific action 3"]
    }
  ]
}
`;

export type DailyPlanInput = {
  goal: string;
  hoursAvailable: number;
  mustComplete: string;
  avoid: string;
};

export const buildDailyPlannerPrompt = (input: DailyPlanInput): string => `
You are an execution planner. Generate a focused, realistic daily plan.

GOAL FOR THE DAY: ${input.goal}
AVAILABLE HOURS: ${input.hoursAvailable}
MUST COMPLETE TODAY: ${input.mustComplete}
AVOID TODAY: ${input.avoid}

Respond with EXACTLY this JSON (no markdown, no extra text):
{
  "objective": "One clear sentence summarising the day's primary output",
  "priorities": ["Priority 1", "Priority 2", "Priority 3"],
  "timeBlocks": [
    {"id": "1", "startTime": "09:00", "endTime": "10:30", "activity": "Specific activity", "category": "Deep Work", "priority": "High", "status": "Planned"},
    {"id": "2", "startTime": "10:30", "endTime": "11:00", "activity": "Specific activity", "category": "Admin", "priority": "Medium", "status": "Planned"}
  ],
  "tasks": [
    {"id": "1", "name": "Specific task", "priority": "High", "estimatedDuration": "2 hours", "dueTime": "12:00", "linkedGoal": "goal text", "status": "Not Started"}
  ],
  "risks": ["Risk or constraint to watch for today", "Second risk"],
  "reviewQuestions": ["End-of-day question 1", "End-of-day question 2", "End-of-day question 3"]
}

Categories must be one of: Deep Work, Admin, Study, Client Work, Content, Health, Personal, Review.
Priority must be one of: High, Medium, Low.
`;

export const buildPlannerPrompt = (input: PlannerInput): string => `
You are an execution planner. Convert this recommendation into a precise execution plan.

STRATEGIC GOAL: ${input.strategicGoal}
KEY RECOMMENDATION: ${input.keyRecommendation}
AVAILABLE RESOURCES: ${input.resources}
CONSTRAINTS: ${input.constraints}

Respond with EXACTLY this JSON:
{
  "title": "Concise title for this execution plan",
  "sevenDaySprint": [
    {"day": 1, "task": "Specific task", "priority": "high", "estimatedTime": "2 hours"},
    {"day": 2, "task": "Specific task", "priority": "high", "estimatedTime": "3 hours"},
    {"day": 3, "task": "Specific task", "priority": "medium", "estimatedTime": "1.5 hours"},
    {"day": 4, "task": "Specific task", "priority": "high", "estimatedTime": "2 hours"},
    {"day": 5, "task": "Specific task", "priority": "medium", "estimatedTime": "2 hours"},
    {"day": 6, "task": "Specific task", "priority": "low", "estimatedTime": "1 hour"},
    {"day": 7, "task": "Review and reflect", "priority": "medium", "estimatedTime": "1 hour"}
  ],
  "thirtyDayRoadmap": [
    {"week": 1, "theme": "Week theme", "milestones": ["milestone 1", "milestone 2", "milestone 3"]},
    {"week": 2, "theme": "Week theme", "milestones": ["milestone 1", "milestone 2", "milestone 3"]},
    {"week": 3, "theme": "Week theme", "milestones": ["milestone 1", "milestone 2"]},
    {"week": 4, "theme": "Week theme", "milestones": ["milestone 1", "milestone 2", "milestone 3"]}
  ],
  "successMetrics": ["specific measurable metric 1", "metric 2", "metric 3", "metric 4"],
  "risks": [
    {"risk": "Specific risk", "mitigation": "How to mitigate it"},
    {"risk": "Another risk", "mitigation": "Mitigation strategy"},
    {"risk": "Third risk", "mitigation": "How to handle"}
  ],
  "reviewQuestions": [
    "What was the single biggest constraint on execution this week?",
    "Which action produced the most unexpected leverage?",
    "What assumption turned out to be wrong?",
    "Where did I under-invest time?",
    "What would I do differently?"
  ]
}
`;
