import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { workflowsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import {
  CreateWorkflowBody,
  DeleteWorkflowParams,
} from "@workspace/api-zod";

const TEMPLATES = [
  {
    name: "Lead Generation Agent",
    description: "Automates prospect identification, qualification, and outreach at scale",
    trigger: "New ICP definition provided or weekly schedule",
    inputs: ["Ideal Customer Profile", "Target industry", "Desired company size", "Pain points"],
    aiTask: "Research prospects, score qualification fit, draft personalised outreach messages, and identify decision-makers",
    tools: ["OpenAI GPT-4o", "LinkedIn API", "Hunter.io", "Zapier"],
    output: "Qualified prospect list with personalised outreach sequences ready to send",
    humanReviewStep: "Review and approve outreach messages before sending; validate prospect scoring",
    monetisationUseCase: "Sell as a done-for-you lead generation service at £500-£2000/month per client. Package as a B2B growth system.",
    isTemplate: true,
  },
  {
    name: "Research Assistant Agent",
    description: "Conducts deep research synthesis on any topic with academic rigour",
    trigger: "User submits research question or topic",
    inputs: ["Research question", "Desired depth", "Source preferences", "Output format"],
    aiTask: "Search and retrieve sources, extract key insights, synthesise across sources, identify contradictions, structure findings",
    tools: ["Perplexity API", "OpenAI GPT-4o", "Notion API", "Google Scholar"],
    output: "Structured research report with citations, key insights, and synthesis summary",
    humanReviewStep: "Verify source credibility and check for hallucinated citations before using in published work",
    monetisationUseCase: "Offer as a research-as-a-service product for consultants, academics, and executive teams. £200-£1000 per research brief.",
    isTemplate: true,
  },
  {
    name: "Coursework Enhancement Agent",
    description: "Elevates student work from mediocre to distinction-level through AI-guided feedback loops",
    trigger: "Student submits draft coursework or essay",
    inputs: ["Draft text", "Assignment brief", "Marking criteria", "Module level"],
    aiTask: "Analyse against marking rubric, identify structural gaps, suggest evidence improvements, enhance academic language, check argument coherence",
    tools: ["OpenAI GPT-4o", "Turnitin API", "Google Scholar", "Zotero"],
    output: "Annotated feedback report + enhanced draft with tracked changes and improvement rationale",
    humanReviewStep: "Student reviews all suggestions; final submission must be student's own work",
    monetisationUseCase: "Academic tutoring service or university study support tool. £50-£200 per submission. SaaS model at £30/month.",
    isTemplate: true,
  },
  {
    name: "LinkedIn Content Engine",
    description: "Generates a month of high-engagement LinkedIn content from a single strategy brief",
    trigger: "Monthly content strategy session or on-demand",
    inputs: ["Creator niche", "Target audience", "Key message pillars", "Tone of voice", "Recent achievements"],
    aiTask: "Generate hooks, draft posts, create carousel outlines, write engagement comments, suggest optimal posting times",
    tools: ["OpenAI GPT-4o", "Buffer API", "LinkedIn API", "Canva API"],
    output: "30 days of scheduled posts across formats — text, carousels, long-form — with engagement strategy",
    humanReviewStep: "Review all posts for brand accuracy and personal voice before scheduling",
    monetisationUseCase: "LinkedIn ghostwriting retainer at £500-£2000/month. Package as personal brand building service for executives and founders.",
    isTemplate: true,
  },
  {
    name: "Client Onboarding Automation",
    description: "Delivers a frictionless, premium client onboarding experience automatically",
    trigger: "New client signs contract or completes payment",
    inputs: ["Client name", "Service purchased", "Start date", "Client goals from discovery call"],
    aiTask: "Generate personalised welcome pack, create client portal, draft onboarding checklist, prepare first deliverable template",
    tools: ["OpenAI GPT-4o", "Notion API", "Stripe Webhooks", "DocuSign API", "Slack API"],
    output: "Complete client portal, personalised welcome email, and 30-day project plan ready within 5 minutes of signing",
    humanReviewStep: "Review personalised content before sending; confirm access permissions are correct",
    monetisationUseCase: "Package as a consulting business infrastructure product. Reduces onboarding time from 3 hours to 15 minutes. Charge £200+ setup fee.",
    isTemplate: true,
  },
  {
    name: "Customer Support Assistant",
    description: "Handles 80% of customer queries autonomously with consistent, high-quality responses",
    trigger: "New customer message via email, chat, or support portal",
    inputs: ["Customer query", "Customer history", "Product documentation", "Previous resolutions"],
    aiTask: "Classify query intent, retrieve relevant documentation, draft resolution response, escalate complex cases",
    tools: ["OpenAI GPT-4o", "Intercom API", "Zendesk API", "Notion (knowledge base)"],
    output: "Drafted response with confidence score; auto-sent for high confidence, queued for review otherwise",
    humanReviewStep: "Human review for low-confidence responses, refunds, complaints, and escalations",
    monetisationUseCase: "White-label as a customer success automation product. £500-£3000/month SaaS. Reduces support costs by 60-80%.",
    isTemplate: true,
  },
  {
    name: "Data Analysis Assistant",
    description: "Converts raw datasets into actionable insights and executive-ready reports",
    trigger: "Data file uploaded or database query submitted",
    inputs: ["Dataset or database connection", "Business question", "Audience", "Preferred visualisation style"],
    aiTask: "Clean and explore data, identify key patterns and anomalies, generate visualisations, write narrative insights",
    tools: ["OpenAI GPT-4o with Code Interpreter", "Python/Pandas", "Plotly", "Google Sheets API"],
    output: "Interactive dashboard + executive summary report with insights ranked by business impact",
    humanReviewStep: "Validate statistical interpretations and business conclusions before presenting to stakeholders",
    monetisationUseCase: "Data insights service at £300-£2000 per analysis. Ongoing analytics retainer at £1000-£5000/month for enterprises.",
    isTemplate: true,
  },
  {
    name: "Personal Productivity Agent",
    description: "Manages tasks, prioritises daily actions, and eliminates decision fatigue for high-performers",
    trigger: "Daily morning run (7am) or user prompt",
    inputs: ["Current task list", "Calendar events", "Pending communications", "Weekly goals"],
    aiTask: "Prioritise tasks by impact vs effort, draft email responses, identify meeting prep needs, suggest focus blocks",
    tools: ["OpenAI GPT-4o", "Google Calendar API", "Notion API", "Gmail API", "Todoist API"],
    output: "Daily action plan ranked by priority, draft responses queued, and 90-minute deep work block scheduled",
    humanReviewStep: "Review and approve task priorities and drafted communications before sending",
    monetisationUseCase: "Executive assistant product for founders and high-performers. £200/month subscription or £2000+ annual plan.",
    isTemplate: true,
  },
];

const router: IRouter = Router();

router.get("/workflows", async (req, res) => {
  const userId = (req as any).userId as string;
  const workflows = await db
    .select()
    .from(workflowsTable)
    .where(and(eq(workflowsTable.isTemplate, false), eq(workflowsTable.userId, userId)))
    .orderBy(desc(workflowsTable.createdAt));
  res.json(workflows.map(w => ({
    ...w,
    createdAt: w.createdAt.toISOString(),
  })));
});

router.post("/workflows", async (req, res) => {
  const userId = (req as any).userId as string;
  const parsed = CreateWorkflowBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }
  const [workflow] = await db.insert(workflowsTable).values({ ...parsed.data, isTemplate: false, userId }).returning();
  res.status(201).json({
    ...workflow,
    createdAt: workflow.createdAt.toISOString(),
  });
});

router.get("/workflows/templates", async (_req, res) => {
  const dbTemplates = await db.select().from(workflowsTable).where(eq(workflowsTable.isTemplate, true));

  if (dbTemplates.length === 0) {
    const inserted = await db.insert(workflowsTable).values(TEMPLATES).returning();
    res.json(inserted.map(w => ({ ...w, createdAt: w.createdAt.toISOString() })));
    return;
  }

  res.json(dbTemplates.map(w => ({ ...w, createdAt: w.createdAt.toISOString() })));
});

router.delete("/workflows/:id", async (req, res) => {
  const userId = (req as any).userId as string;
  const parsed = DeleteWorkflowParams.safeParse({ id: Number(req.params.id) });
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid ID" });
    return;
  }
  await db.delete(workflowsTable).where(
    and(eq(workflowsTable.id, parsed.data.id), eq(workflowsTable.userId, userId))
  );
  res.status(204).send();
});

export default router;
