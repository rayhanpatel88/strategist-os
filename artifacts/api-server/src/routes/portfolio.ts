import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { portfolioTable } from "@workspace/db";
import { UpdatePortfolioBody } from "@workspace/api-zod";

const DEFAULT_PORTFOLIO = {
  name: "Rayhan Patel",
  tagline: "I design and deploy AI systems that convert unclear goals into structured decisions, ranked priorities, and executable next steps. Built for founders, operators, and professionals who prioritise outcomes over activity.",
  positioningStatement: "MSc Data Science candidate. AI automation specialist. My work sits at the boundary between rigorous quantitative analysis and strategic systems design. I build AI deployments that solve specific problems, compound over time, and keep the operator in control of the process.",
  philosophy: "Most AI adoption is theatre. Teams buy tools without strategy, adding complexity without leverage. I work from a different premise: intelligence without architecture is noise. The highest-return AI deployments share three properties. They are specific about the problem they solve. They are designed to compound over time. And they are built around the operator's judgment, not against it. The result is a category I call Strategic Intelligence Infrastructure: systems that make capable operators more capable, not just faster.",
  contactEmail: "rayhan@strategistos.ai",
  bookingUrl: "https://cal.com/rayhan",
  systems: [
    {
      title: "Strategic Diagnosis Engine",
      description: "A structured system that converts operator context into a precision analysis: bottleneck identification, ROI prioritisation, and ranked next steps. Designed to replace vague strategic conversations with clear decisions.",
      outcome: "Validated across 200+ strategy sessions with founders and consultants across 12 industries.",
    },
    {
      title: "Automation Readiness Scorecard",
      description: "An eight-dimension assessment framework that measures an organisation's actual automation potential and produces a ranked improvement roadmap with implementation timelines.",
      outcome: "Deployed for three enterprise clients. Average implementation lead time reduced by 40%.",
    },
    {
      title: "LinkedIn Authority System",
      description: "A systematic content engine that transforms a professional's knowledge stack into a consistent, high-signal presence. No daily content creation required.",
      outcome: "Grew two client profiles from under 500 to 5,000+ followers within 90 days.",
    },
  ],
  caseStudies: [
    {
      title: "Scaling a Consulting Practice from £0 to £8k MRR in 60 Days",
      challenge: "A newly independent consultant with 12 years of corporate experience had the skills but no system for positioning, outreach, or client acquisition. Every week was reactive rather than strategic.",
      approach: "Applied the Opportunity Stack Builder to identify the sharpest positioning angle: AI readiness assessments for professional services firms with 20 to 200 employees. Then built a 4-week execution roadmap including one flagship proof asset, a productised offer, and a systematic LinkedIn outreach sequence.",
      result: "Three paying clients at £2,500/month each within 60 days. One has since expanded to a £12,000 quarterly engagement.",
      industry: "Consulting",
    },
    {
      title: "Automating Research Synthesis for a PhD Programme",
      challenge: "A doctoral candidate in machine learning was spending 18+ hours per week on literature review and research synthesis, leaving insufficient time for original contribution and writing.",
      approach: "Designed and deployed a Research Assistant Agent using OpenAI and Perplexity APIs, structured around the candidate's specific research domain and citation requirements. Built a custom Notion integration for output organisation.",
      result: "Research synthesis time reduced from 18 to 4 hours per week. Candidate submitted two conference papers in the following term.",
      industry: "Academic Research",
    },
  ],
};

const router: IRouter = Router();

router.get("/portfolio", async (_req, res) => {
  const rows = await db.select().from(portfolioTable).limit(1);

  if (rows.length === 0) {
    const [created] = await db.insert(portfolioTable).values(DEFAULT_PORTFOLIO).returning();
    res.json(created);
    return;
  }

  res.json(rows[0]);
});

router.put("/portfolio", async (req, res) => {
  const parsed = UpdatePortfolioBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.issues });
    return;
  }

  const rows = await db.select().from(portfolioTable).limit(1);

  if (rows.length === 0) {
    const [created] = await db.insert(portfolioTable).values(parsed.data as typeof DEFAULT_PORTFOLIO).returning();
    res.json(created);
    return;
  }

  const [updated] = await db
    .update(portfolioTable)
    .set(parsed.data as typeof DEFAULT_PORTFOLIO)
    .returning();

  res.json(updated);
});

export default router;
