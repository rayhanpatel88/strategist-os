import {
  buildDiagnosisPrompt,
  buildScorecardPrompt,
  buildPromptGeneratorPrompt,
  buildOpportunityStackPrompt,
  buildPlannerPrompt,
  type DiagnosisInput,
  type ScorecardInput,
  type PromptInput,
  type OpportunityInput,
  type PlannerInput,
} from "./ai-prompts.js";

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function callAI(prompt: string): Promise<string> {
  if (ANTHROPIC_API_KEY) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const data = await res.json() as { content: Array<{ text: string }> };
    return data.content[0].text;
  }

  if (OPENAI_API_KEY) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      }),
    });
    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0].message.content;
  }

  return null as unknown as string;
}

function extractJSON(text: string): unknown {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*\})/);
  if (match) return JSON.parse(match[1]);
  return JSON.parse(text);
}

export async function generateDiagnosis(input: DiagnosisInput) {
  const aiText = await callAI(buildDiagnosisPrompt(input));

  if (aiText) {
    try {
      return extractJSON(aiText);
    } catch {
      // fall through to mock
    }
  }

  return getMockDiagnosis(input);
}

export async function generateScorecard(input: ScorecardInput) {
  const aiText = await callAI(buildScorecardPrompt(input));

  if (aiText) {
    try {
      return extractJSON(aiText);
    } catch {
      // fall through to mock
    }
  }

  return getMockScorecard(input);
}

export async function generatePrompt(input: PromptInput) {
  const aiText = await callAI(buildPromptGeneratorPrompt(input));

  if (aiText) {
    try {
      return extractJSON(aiText);
    } catch {
      // fall through to mock
    }
  }

  return getMockPrompt(input);
}

export async function generateOpportunityStack(input: OpportunityInput) {
  const aiText = await callAI(buildOpportunityStackPrompt(input));

  if (aiText) {
    try {
      return extractJSON(aiText);
    } catch {
      // fall through to mock
    }
  }

  return getMockOpportunityStack(input);
}

export async function generateExecutionPlan(input: PlannerInput) {
  const aiText = await callAI(buildPlannerPrompt(input));

  if (aiText) {
    try {
      return extractJSON(aiText);
    } catch {
      // fall through to mock
    }
  }

  return getMockExecutionPlan(input);
}

function getMockDiagnosis(input: DiagnosisInput) {
  return {
    strategicDiagnosis: `The core situation in ${input.industry} reveals a positioning gap between your stated goal and the actual leverage available. The bottleneck is not what it appears on the surface — the constraint is fundamentally about sequencing and signal quality, not execution capacity. Most operators in your position underestimate the compounding effect of a single well-placed proof asset versus a scattered portfolio of activities.\n\nThe opportunity is to collapse the gap between what you can deliver and what the market perceives. This requires ruthless prioritisation: three actions executed with precision beat ten actions executed with moderate effort. The market rewards clarity and specificity; generalism is the enemy of traction at this stage.\n\nYour current assets are underutilised. There is likely one specific combination of skill and domain knowledge that creates a defensible moat — most people never identify it because they're optimising for visible activity rather than strategic position.`,
    leverageScore: 62,
    bottleneckAnalysis: `The true bottleneck is not ${input.bottleneck} — it's the absence of a clear proof-of-concept that collapses the trust gap with your target audience. You are trying to move too many levers simultaneously. The actual constraint is decision-making surface: you have too many open loops competing for cognitive bandwidth, which reduces execution quality on each.`,
    opportunityMap: [
      "Build one flagship proof asset that demonstrates your highest-value capability in the most concrete way possible",
      `Niche down further within ${input.industry} — hyper-specificity is the primary unlock for premium positioning`,
      "Create a systematic distribution mechanism for your existing work rather than producing more raw material",
      "Identify the 2-3 relationships that would have asymmetric impact on your trajectory and invest disproportionately in them",
    ],
    riskMap: [
      "Premature scaling: moving to distribution before the core product-market fit is proven leads to amplifying a weak signal",
      `Commodity positioning: remaining too broad within ${input.industry} makes you competing on effort rather than insight`,
      "Opportunity cost misallocation: the deadline pressure may push you toward visible activity rather than high-leverage moves",
    ],
    roiActions: [
      {
        action: `Define and publish your single sharpest positioning statement for ${input.industry}`,
        impact: "Every other action compounds on clarity. Without this, you are building on sand.",
        timeframe: "48 hours",
      },
      {
        action: "Ship one high-signal proof asset that demonstrates your exact value proposition to your ideal client",
        impact: "Social proof and demonstrated competence collapse the trust gap faster than any other mechanism",
        timeframe: "7 days",
      },
      {
        action: "Identify the three distribution channels where your target audience already concentrates and establish a consistent presence",
        impact: "Distribution compounds. You cannot outwork a system; build the system.",
        timeframe: "14 days",
      },
    ],
    eliteOperatorNextStep: `In the next 48 hours: write a single, specific positioning statement (20 words maximum) that you could put on a business card and have someone immediately understand who you help and what changes for them. Then identify the single person in your network closest to your ideal client and send them that positioning statement for feedback. Real signal from real markets in 48 hours. Everything else waits.`,
  };
}

function getMockScorecard(input: ScorecardInput) {
  const dimensions = [
    { name: "Clarity", score: 58, reasoning: `Your goal in ${input.industry} is directionally correct but lacks the specificity required to create a clear decision filter. When clarity is low, every decision requires full deliberation rather than running against a predefined north star.`, howToImprove: "Write a single sentence defining who you serve, what they achieve, and what makes your approach distinct. Test it with three people outside your industry.", eliteRecommendation: "Top operators have a positioning statement so sharp it alienates the wrong clients automatically." },
    { name: "Leverage", score: 64, reasoning: "There are high-leverage assets in your profile that are not being systematically deployed. Leverage is the ratio of output to input — current activities suggest you are in linear rather than exponential mode.", howToImprove: "Map every activity you performed last week. Categorise each as leverage-building, maintenance, or subtraction. Eliminate the bottom category entirely.", eliteRecommendation: "Elite operators say no to 80% of opportunities so they can say yes with full resources to the remaining 20%." },
    { name: "Distribution", score: 41, reasoning: "The weakest dimension in your current profile. You are producing more than you are distributing, which creates an asymmetric negative return on creative effort.", howToImprove: "For every piece of content or output you create, identify three distribution mechanisms before publishing. Repurpose systematically.", eliteRecommendation: "Distribution is a system, not an afterthought. Allocate 40% of creative time to distribution and promotion of existing assets." },
    { name: "Execution Speed", score: 71, reasoning: "Your execution velocity is above average, but decision latency — the gap between identifying a high-value action and committing to it — is a drag on overall throughput.", howToImprove: "Introduce a 24-hour decision rule for opportunities under a defined threshold. Reserve full deliberation for major strategic commitments only.", eliteRecommendation: "Speed is a competitive advantage. The operator who ships first owns the narrative, even if iteration is required." },
    { name: "Differentiation", score: 49, reasoning: `In ${input.industry}, you are currently operating too close to the centre of the market. Differentiation requires being more specific, more opinionated, or more unconventional than the median competitor.`, howToImprove: "Identify the single most controversial opinion you hold about your industry that the majority of practitioners would disagree with. Lead with that.", eliteRecommendation: "The strongest brands are polarising. If nobody disagrees with your positioning, it is too bland to be remembered." },
    { name: "Proof/Credibility", score: 55, reasoning: "You have foundational credibility but lack a flagship proof asset — a single piece of work that demonstrates the full scope of your capability in the most compelling way possible.", howToImprove: "Identify your single best result, case study, or output and invest in documenting and packaging it as a premium case study or project showcase.", eliteRecommendation: "One extraordinary proof asset outperforms ten mediocre ones. Be famous for one thing before being known for many." },
    { name: "Monetisation Potential", score: 67, reasoning: "The monetisation architecture is present but the packaging needs refinement. The gap between the value you deliver and the price you command is likely larger than it should be.", howToImprove: "Raise your prices by 30% on your next offer. Document the response. Most operators are undercharging by a significant margin.", eliteRecommendation: "Price is a signal. Premium positioning enables premium pricing. Elite operators charge for outcomes, not time or effort." },
    { name: "Automation Potential", score: 72, reasoning: "Your domain has high automation potential that is not yet being captured. There are repetitive high-value processes in your workflow that could be systematised and scaled.", howToImprove: "Map the top three most time-intensive activities. For each, identify whether it could be templated, delegated, or automated with existing tools.", eliteRecommendation: "Build systems that operate while you sleep. Every hour spent on systematisation returns compounding hours in future capacity." },
  ];

  const overallScore = Math.round(dimensions.reduce((sum, d) => sum + d.score, 0) / dimensions.length);

  return {
    overallScore,
    dimensions,
    topPriority: "Distribution — this is your highest-leverage improvement because it creates compounding returns on all other activities you are already executing well.",
    strategicSummary: `Your strategic profile shows strong execution capability with a critical distribution gap. The core issue is that you are producing value that is not reaching the market at the velocity required to compound. Focus on building systematic distribution infrastructure before creating more content or capability. Clarity improvements will unlock premium positioning within ${input.industry}.`,
  };
}

function getMockPrompt(input: PromptInput) {
  const categoryTemplates: Record<string, object> = {
    "business-strategy": {
      title: `Strategic Analysis Framework: ${input.goal}`,
      category: input.category,
      prompt: `You are a senior strategy consultant with 20 years of experience across McKinsey, Bain, and elite VC firms. You have been hired to provide a definitive strategic analysis for the following situation.\n\nCONTEXT: [CONTEXT]\nPRIMARY GOAL: [GOAL]\nINDUSTRY: [INDUSTRY]\nCURRENT CONSTRAINTS: [CONSTRAINTS]\nDECISION HORIZON: [TIMELINE]\n\nProvide a structured strategic analysis that includes:\n\n1. SITUATION ASSESSMENT: What is actually happening here — not the surface narrative, but the underlying strategic reality\n2. CORE TENSION: The primary strategic tension that must be resolved\n3. OPTION SET: Three distinct strategic paths with tradeoffs for each\n4. RECOMMENDED MOVE: One recommended action with the precise reasoning chain\n5. RISK SURFACE: The three most likely failure modes and how to mitigate each\n6. DECISION CRITERIA: The metrics that will confirm or refute this strategic bet within 30 days\n\nBe specific. Avoid generic strategic advice. Operate as if you have real accountability for the outcome.`,
      usage: "Use this prompt when facing a major strategic decision, market entry, or positioning challenge. Fill in all variables before submitting. Works best with Claude Opus or GPT-4o.",
      variables: ["CONTEXT", "GOAL", "INDUSTRY", "CONSTRAINTS", "TIMELINE"],
    },
    "academic-writing": {
      title: `Academic Research Enhancement: ${input.goal}`,
      category: input.category,
      prompt: `You are a senior academic editor with expertise in [FIELD] who has published in Nature, Science, and top-tier journals in [FIELD]. You are reviewing and enhancing the following academic work.\n\nRESEARCH AREA: [RESEARCH_AREA]\nCURRENT DRAFT/SECTION: [DRAFT_TEXT]\nTARGET JOURNAL/AUDIENCE: [TARGET]\nKEY ARGUMENT: [KEY_ARGUMENT]\n\nProvide:\n1. CRITICAL ASSESSMENT: Where the current writing falls short of publishable quality\n2. STRUCTURAL IMPROVEMENTS: How to reorder or reorganise the argument for maximum impact\n3. LANGUAGE PRECISION: Specific phrases to replace with more precise academic language\n4. CITATION GAPS: Areas where additional evidence or citation is required\n5. ENHANCED VERSION: A rewritten version of the key section that meets top-tier journal standards\n6. REVIEWER ANTICIPATION: Three objections a hostile reviewer would raise and how to pre-empt them`,
      usage: "Ideal for dissertation chapters, journal submissions, conference papers. Replace variables with your specific research context.",
      variables: ["FIELD", "RESEARCH_AREA", "DRAFT_TEXT", "TARGET", "KEY_ARGUMENT"],
    },
    "ai-automation": {
      title: `AI Automation System Design: ${input.goal}`,
      category: input.category,
      prompt: `You are an expert AI systems architect who has built production automation systems at scale. Design a comprehensive AI automation solution for the following use case.\n\nUSE CASE: [USE_CASE]\nCURRENT MANUAL PROCESS: [MANUAL_PROCESS]\nINPUT DATA: [INPUT_DESCRIPTION]\nDESIRED OUTPUT: [OUTPUT_DESCRIPTION]\nCONSTRAINTS: [CONSTRAINTS]\nTECH STACK: [AVAILABLE_TOOLS]\n\nDeliver:\n1. SYSTEM ARCHITECTURE: End-to-end workflow diagram in text format\n2. AI MODEL SELECTION: Which model/API to use for each task and why\n3. PROMPT TEMPLATES: Specific prompt templates for each AI task in the workflow\n4. ERROR HANDLING: How the system handles edge cases and failures\n5. HUMAN-IN-THE-LOOP: Where human review is essential vs. optional\n6. IMPLEMENTATION SEQUENCE: Step-by-step build order\n7. MONETISATION PATH: How this system creates measurable business value`,
      usage: "Use when designing AI agents, automation pipelines, or workflow systems. Works best with concrete examples of the manual process.",
      variables: ["USE_CASE", "MANUAL_PROCESS", "INPUT_DESCRIPTION", "OUTPUT_DESCRIPTION", "CONSTRAINTS", "AVAILABLE_TOOLS"],
    },
    "linkedin-positioning": {
      title: `LinkedIn Authority Positioning: ${input.goal}`,
      category: input.category,
      prompt: `You are a LinkedIn positioning expert who has helped founders, executives, and knowledge workers build audiences of 10k-100k in competitive fields. You specialise in [FIELD].\n\nSUBJECT: [YOUR_NAME]\nCURRENT POSITIONING: [CURRENT_BIO]\nTARGET AUDIENCE: [TARGET_AUDIENCE]\nPRIMARY EXPERTISE: [EXPERTISE]\nCARRIER GOAL: [CAREER_GOAL]\n\nCreate:\n1. HEADLINE (120 chars max): A positioning statement that immediately communicates value to the ideal reader\n2. ABOUT SECTION: A 2000-character About section that establishes authority, demonstrates proof, and has a clear call to action\n3. FEATURED SECTION STRATEGY: Three pieces of content to pin that create immediate credibility\n4. CONTENT PILLARS: Four content themes that reinforce the positioning\n5. FIRST 5 POSTS: Specific post ideas with hooks, structures, and angles\n6. OUTREACH TEMPLATE: A personalised connection request for [TARGET_AUDIENCE]`,
      usage: "Use before a career pivot, when building an audience, or when your current profile is not generating the right opportunities.",
      variables: ["FIELD", "YOUR_NAME", "CURRENT_BIO", "TARGET_AUDIENCE", "EXPERTISE", "CAREER_GOAL"],
    },
    "content-creation": {
      title: `High-Impact Content System: ${input.goal}`,
      category: input.category,
      prompt: `You are a content strategist who has built content engines that generate 7-figure businesses. You understand how to create content that builds authority, generates leads, and compounds over time.\n\nCREATOR BACKGROUND: [BACKGROUND]\nTARGET AUDIENCE: [AUDIENCE]\nPLATFORM: [PLATFORM]\nCORE TOPIC: [TOPIC]\nDEPTH OF EXPERTISE: [EXPERTISE_LEVEL]\nBUSINESS GOAL: [GOAL]\n\nGenerate:\n1. CONTENT STRATEGY: Overarching framework for the next 90 days\n2. CONTENT MIX: The optimal ratio of education/entertainment/insight/promotion\n3. SIGNATURE FORMAT: A unique content format this creator should own\n4. 10 POST IDEAS: Specific titles, hooks, and structures with high viral potential\n5. SERIES CONCEPT: A 5-part series that builds authority on [TOPIC]\n6. REPURPOSING ENGINE: How to get 5x content from each piece created\n7. GROWTH TRIGGER: The single piece of content most likely to unlock audience growth`,
      usage: "Use for quarterly content planning, launching a new content channel, or breaking through a plateau.",
      variables: ["BACKGROUND", "AUDIENCE", "PLATFORM", "TOPIC", "EXPERTISE_LEVEL", "GOAL"],
    },
    "data-science": {
      title: `Data Science Project Enhancement: ${input.goal}`,
      category: input.category,
      prompt: `You are a principal data scientist with expertise in [DOMAIN] who has shipped production ML systems at leading tech companies and research institutions.\n\nPROJECT DESCRIPTION: [PROJECT_DESCRIPTION]\nCURRENT APPROACH: [CURRENT_METHODOLOGY]\nDATASET: [DATASET_DESCRIPTION]\nPERFORMANCE METRICS: [CURRENT_METRICS]\nTARGET PERFORMANCE: [TARGET_METRICS]\nCONSTRAINTS: [CONSTRAINTS]\n\nProvide:\n1. METHODOLOGY CRITIQUE: What is suboptimal about the current approach\n2. ARCHITECTURE RECOMMENDATION: Improved model/pipeline design\n3. FEATURE ENGINEERING: Specific feature ideas that would improve predictive power\n4. EVALUATION FRAMEWORK: A rigorous evaluation framework beyond the current metrics\n5. IMPLEMENTATION CODE: Key code snippets for the recommended improvements\n6. PUBLICATION ANGLE: How to frame this project for academic or industry publication\n7. PRODUCTIONISATION PATH: Steps to move from experiment to production system`,
      usage: "Use when stuck on a data science project, preparing for a competition, or elevating research for publication.",
      variables: ["DOMAIN", "PROJECT_DESCRIPTION", "CURRENT_METHODOLOGY", "DATASET_DESCRIPTION", "CURRENT_METRICS", "TARGET_METRICS", "CONSTRAINTS"],
    },
    "phd-research": {
      title: `PhD Research Positioning: ${input.goal}`,
      category: input.category,
      prompt: `You are a senior professor and PhD supervisor with 25 years of experience in [FIELD] who has supervised 30+ successful PhD completions and serves on journal editorial boards.\n\nRESEARCH AREA: [RESEARCH_AREA]\nCURRENT RESEARCH QUESTION: [RESEARCH_QUESTION]\nMETHODOLOGY: [METHODOLOGY]\nSTAGE OF RESEARCH: [STAGE]\nTARGET CONTRIBUTION: [CONTRIBUTION]\nSUPERVISOR FIELD: [SUPERVISOR_FIELD]\n\nProvide:\n1. RESEARCH GAP ANALYSIS: How this research positions within existing literature\n2. CONTRIBUTION SHARPENING: How to make the contribution claim more precise and defensible\n3. METHODOLOGY CRITIQUE: Potential weaknesses a viva panel would probe\n4. PUBLICATION STRATEGY: Which journals to target and in what sequence\n5. CONFERENCE POSITIONING: Which conferences to present at to build profile\n6. INDUSTRY RELEVANCE: How to frame this research for non-academic audiences\n7. CAREER POSITIONING: How this PhD positions you for your target career path`,
      usage: "Use when writing your research proposal, preparing for a viva, or positioning your PhD for academic or industry audiences.",
      variables: ["FIELD", "RESEARCH_AREA", "RESEARCH_QUESTION", "METHODOLOGY", "STAGE", "CONTRIBUTION", "SUPERVISOR_FIELD"],
    },
    "offer-creation": {
      title: `Premium Offer Architecture: ${input.goal}`,
      category: input.category,
      prompt: `You are an offer architect who has designed high-ticket consulting and productised service offers generating millions in revenue. You specialise in premium B2B positioning.\n\nSERVICE PROVIDER BACKGROUND: [BACKGROUND]\nTARGET CLIENT: [TARGET_CLIENT]\nCORE EXPERTISE: [EXPERTISE]\nCURRENT OFFER: [CURRENT_OFFER]\nDESIRED PRICE POINT: [PRICE_POINT]\nCOMPETITIVE CONTEXT: [COMPETITIVE_LANDSCAPE]\n\nDesign:\n1. OFFER ARCHITECTURE: The complete structure of a premium productised offer\n2. OUTCOME PROMISE: A specific, measurable outcome statement that justifies premium pricing\n3. DELIVERY MECHANISM: How the service is delivered to maximise perceived value\n4. PRICING RATIONALE: The pricing logic and how to justify it to clients\n5. SALES PAGE STRUCTURE: Headline, proof points, objection handlers, CTA\n6. OBJECTION RESPONSES: Answers to the top 5 objections premium clients raise\n7. CASE STUDY TEMPLATE: How to document results to attract the next tier of clients`,
      usage: "Use when productising a service, raising prices, or entering a premium market segment.",
      variables: ["BACKGROUND", "TARGET_CLIENT", "EXPERTISE", "CURRENT_OFFER", "PRICE_POINT", "COMPETITIVE_LANDSCAPE"],
    },
    "replit-app-building": {
      title: `Replit App Architecture: ${input.goal}`,
      category: input.category,
      prompt: `You are an expert full-stack developer specialising in rapid application development on Replit. You have shipped 50+ production applications and understand how to architect systems for speed and scalability.\n\nAPP CONCEPT: [APP_CONCEPT]\nPRIMARY USER: [TARGET_USER]\nCORE FUNCTIONALITY: [CORE_FEATURES]\nTECH PREFERENCES: [TECH_STACK]\nDEPLOYMENT TARGET: [DEPLOYMENT]\nMONETISATION: [MONETISATION_PLAN]\n\nDeliver:\n1. ARCHITECTURE OVERVIEW: Complete technical architecture diagram in text\n2. TECH STACK RECOMMENDATION: Specific libraries and frameworks with justification\n3. DATABASE SCHEMA: Core tables/collections with relationships\n4. API DESIGN: Endpoint structure with request/response examples\n5. IMPLEMENTATION ORDER: Sequence of features to build for fastest viable product\n6. REPLIT-SPECIFIC OPTIMISATIONS: Specific configurations for Replit deployment\n7. MONETISATION IMPLEMENTATION: How to implement the monetisation strategy technically`,
      usage: "Use before starting a new Replit project or when refactoring an existing application for scale.",
      variables: ["APP_CONCEPT", "TARGET_USER", "CORE_FEATURES", "TECH_STACK", "DEPLOYMENT", "MONETISATION_PLAN"],
    },
  };

  return categoryTemplates[input.category] || categoryTemplates["business-strategy"];
}

function getMockOpportunityStack(input: OpportunityInput) {
  return {
    positioningAngle: `The intersection of ${input.skills.split(",")[0]?.trim() || "your core expertise"} and ${input.industry || "your domain"} — specifically, deploying advanced technical capability to solve strategic problems that most practitioners approach with conventional tools. This creates a defensible position as someone who brings both the depth and the systems thinking.`,
    bestNiche: `${input.targetAudience.split(",")[0]?.trim() || "Ambitious professionals"} who need to move from ad-hoc execution to systematic, scalable processes — particularly those at the inflection point where manual approaches are breaking down under growth pressure.`,
    offerIdea: `A 30-day intensive engagement: "Strategic Systems Deployment" — where you audit a client's current workflow, identify the three highest-leverage automation and optimisation opportunities, and implement the first two before the engagement ends. Priced at £2,500-£5,000 depending on complexity. The proof asset is the before/after comparison.`,
    contentAngle: `"The Systems Operator" — content that documents the real process of building leverage through systematic thinking and AI tooling. Not theory; documented results. Case studies, process breakdowns, and contrarian takes on why most people's approach to productivity and output is fundamentally misaligned.`,
    proofAsset: `Build one public-facing system that demonstrates your full capability stack — an open-source tool, a documented case study with real numbers, or a live dashboard that people can interact with. The proof asset must be shareable in a single link and comprehensible within 60 seconds.`,
    roadmap30Day: [
      {
        week: 1,
        focus: "Positioning and Foundation",
        actions: [
          "Write and publish your sharp positioning statement across all platforms",
          "Document your three best results from the past 12 months with specific numbers",
          "Set up your proof asset infrastructure (portfolio site, case study template)",
        ],
      },
      {
        week: 2,
        focus: "Proof Asset Creation",
        actions: [
          "Build and publish the flagship proof asset that demonstrates your highest-value capability",
          "Write the first long-form piece of content establishing your core point of view",
          "Reach out to five ideal potential clients or collaborators with a specific, value-first message",
        ],
      },
      {
        week: 3,
        focus: "Distribution and Amplification",
        actions: [
          "Distribute the proof asset across three channels with tailored messaging for each",
          "Engage deeply with ten posts by people in your target audience's orbit",
          "Launch a weekly content rhythm: one substantial post per platform per week",
        ],
      },
      {
        week: 4,
        focus: "Offer Activation",
        actions: [
          "Package your first productised offer with a clear outcome, process, and price point",
          "Offer the first engagement at a discounted rate in exchange for a detailed case study",
          "Set up a basic lead capture system: a landing page, an email list, and a scheduling link",
        ],
      },
    ],
  };
}

function getMockExecutionPlan(input: PlannerInput) {
  return {
    title: `Execution Plan: ${input.strategicGoal.substring(0, 50)}${input.strategicGoal.length > 50 ? "..." : ""}`,
    sevenDaySprint: [
      { day: 1, task: "Define the success criteria for this plan in writing — specific, measurable, with a binary pass/fail condition", priority: "high", estimatedTime: "1 hour" },
      { day: 2, task: "Identify and clear all blockers: the three things that could prevent this plan from succeeding, and pre-empt each one", priority: "high", estimatedTime: "2 hours" },
      { day: 3, task: "Execute the primary deliverable from the key recommendation — ship something, not plan something", priority: "high", estimatedTime: "3 hours" },
      { day: 4, task: "Get one piece of real feedback from a target stakeholder or market signal on the primary deliverable", priority: "high", estimatedTime: "1.5 hours" },
      { day: 5, task: "Iterate on the primary deliverable based on feedback — improve the single most important dimension", priority: "medium", estimatedTime: "2 hours" },
      { day: 6, task: "Build the distribution or visibility mechanism: ensure the right people see the work", priority: "medium", estimatedTime: "2 hours" },
      { day: 7, task: "Week review: what worked, what didn't, what the next constraint is — write it down", priority: "medium", estimatedTime: "1 hour" },
    ],
    thirtyDayRoadmap: [
      {
        week: 1,
        theme: "Foundation and First Ship",
        milestones: ["Primary deliverable shipped and live", "First real feedback obtained", "Distribution mechanism activated"],
      },
      {
        week: 2,
        theme: "Iteration and Refinement",
        milestones: ["Second version shipped based on feedback", "Systematic outreach initiated", "Analytics and measurement in place"],
      },
      {
        week: 3,
        theme: "Scale and Compound",
        milestones: ["Third iteration shipped", "Secondary proof points documented", "Relationships with key stakeholders deepened"],
      },
      {
        week: 4,
        theme: "Consolidation and Next Phase",
        milestones: ["Full 30-day results documented as a case study", "Next strategic phase defined with clear criteria", "Systems that operated this month automated or delegated"],
      },
    ],
    successMetrics: [
      "Primary deliverable is live and accessible to target audience by end of week 1",
      "At least three pieces of substantive feedback received from ideal stakeholders by end of week 2",
      "Measurable progress indicator improves by minimum 20% versus baseline by day 30",
      "One documented case study or proof point created that can be used for future positioning",
    ],
    risks: [
      { risk: "Scope creep: the plan expands beyond what resources can support", mitigation: "Hard deadline on scope — nothing new enters the plan for 30 days without removing something existing" },
      { risk: "Perfectionism preventing first ship: waiting for the work to be ready before publishing", mitigation: "Non-negotiable ship date on day 3 regardless of perceived readiness; imperfect and live beats perfect and invisible" },
      { risk: "External disruption: unexpected events consuming the resource allocation", mitigation: "Identify minimum viable daily commitment (30 minutes) that keeps the plan moving even in disrupted weeks" },
    ],
    reviewQuestions: [
      "What was the single biggest constraint on execution this week?",
      "Which action produced the most unexpected positive leverage?",
      "What assumption turned out to be wrong, and what does that change?",
      "Where did I under-invest time relative to where I over-invested?",
      "If I could only do one thing differently next week, what would it be?",
    ],
  };
}
