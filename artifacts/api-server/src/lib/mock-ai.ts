import { openai } from "@workspace/integrations-openai-ai-server";
import {
  buildDiagnosisPrompt,
  buildScorecardPrompt,
  buildPromptGeneratorPrompt,
  buildOpportunityStackPrompt,
  buildPlannerPrompt,
  buildDailyPlannerPrompt,
  type DiagnosisInput,
  type ScorecardInput,
  type PromptInput,
  type OpportunityInput,
  type PlannerInput,
  type DailyPlanInput,
} from "./ai-prompts.js";

async function callAI(prompt: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-5.1",
    max_completion_tokens: 8192,
    messages: [
      {
        role: "system",
        content:
          "You are a strategic advisor. Always respond with valid JSON only. No markdown fences, no preamble, no explanation. Output raw JSON that exactly matches the requested structure.",
      },
      { role: "user", content: prompt },
    ],
  });
  return response.choices[0]?.message?.content ?? "";
}

function extractJSON(text: string): unknown {
  const match = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/(\{[\s\S]*\})/s);
  if (match) return JSON.parse(match[1]);
  return JSON.parse(text);
}

export async function generateDiagnosis(input: DiagnosisInput) {
  const aiText = await callAI(buildDiagnosisPrompt(input));
  return extractJSON(aiText);
}

export async function generateScorecard(input: ScorecardInput) {
  const aiText = await callAI(buildScorecardPrompt(input));
  return extractJSON(aiText);
}

export async function generatePrompt(input: PromptInput) {
  const aiText = await callAI(buildPromptGeneratorPrompt(input));
  return extractJSON(aiText);
}

export async function generateOpportunityStack(input: OpportunityInput) {
  const aiText = await callAI(buildOpportunityStackPrompt(input));
  return extractJSON(aiText);
}

export async function generateExecutionPlan(input: PlannerInput) {
  const aiText = await callAI(buildPlannerPrompt(input));
  return extractJSON(aiText);
}

export async function generateDailyPlan(input: DailyPlanInput) {
  const aiText = await callAI(buildDailyPlannerPrompt(input));
  return extractJSON(aiText);
}
