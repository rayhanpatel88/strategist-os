import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { portfolioTable } from "@workspace/db";
import { UpdatePortfolioBody } from "@workspace/api-zod";

const DEFAULT_PORTFOLIO = {
  name: "Rayhan Patel",
  tagline: "I build AI systems that turn strategic ambiguity into elite execution — for founders, operators, and high-agency professionals who refuse to leave leverage on the table.",
  positioningStatement: "As an MSc Data Science candidate and AI automation specialist, I sit at the intersection of rigorous quantitative thinking and strategic systems design. My work translates the abstract potential of artificial intelligence into concrete, deployable leverage for the operators, founders, and institutions ready to compete at the frontier.",
  philosophy: "Most AI adoption is theatre — teams buying tools without strategy, creating complexity without leverage. I work from a different premise: intelligence without architecture is noise. The highest-ROI AI deployments I've built share three properties. They are ruthlessly specific about the bottleneck they solve. They are designed to compound over time, not just automate once. And they are built with the human operator in mind — augmenting judgment, not replacing it. The result is a category of AI deployment I call Strategic Intelligence Infrastructure: systems that make elite operators more elite, rather than making average operators less expensive.",
  contactEmail: "rayhan@strategistos.ai",
  bookingUrl: "https://cal.com/rayhan",
  systems: [
    {
      title: "Strategic Diagnosis Engine",
      description: "A structured intelligence system that converts messy operator contexts into precision leverage analyses — bottleneck identification, ROI prioritisation, and 0.1% operator recommendations.",
      outcome: "Used to run 200+ strategy sessions with founders and consultants across 12 industries",
    },
    {
      title: "AI Automation Scorecard",
      description: "An eight-dimension assessment framework that quantifies an organisation's automation readiness and produces a ranked improvement roadmap with implementation timelines.",
      outcome: "Deployed for three enterprise clients; average implementation lead time reduced by 40%",
    },
    {
      title: "LinkedIn Authority Architecture",
      description: "A systematic content engine that transforms a professional's unique knowledge stack into a consistent, high-engagement thought leadership presence without requiring daily content creation.",
      outcome: "Grew two client LinkedIn profiles from sub-500 to 5,000+ followers within 90 days",
    },
  ],
  caseStudies: [
    {
      title: "Scaling a Consulting Practice from £0 to £8k MRR in 60 Days",
      challenge: "A newly independent consultant with 12 years of corporate experience had the skills but no system for positioning, outreach, or client acquisition. Every week was reactive rather than strategic.",
      approach: "Applied the Opportunity Stack Builder to identify the hyper-specific positioning angle — 'AI readiness assessments for professional services firms with 20-200 employees' — then built a 4-week execution roadmap including one flagship proof asset, a productised offer, and a systematic LinkedIn outreach sequence.",
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
