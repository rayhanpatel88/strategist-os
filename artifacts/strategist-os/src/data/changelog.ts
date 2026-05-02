export const CURRENT_VERSION = "1.6";
export const CHANGELOG_SEEN_KEY = "strategistai_changelog_seen";

export type ChangeItem = {
  type: "new" | "fix" | "improved";
  text: string;
};

export type ChangeEntry = {
  version: string;
  date: string;
  summary: string;
  items: ChangeItem[];
};

export const changelog: ChangeEntry[] = [
  {
    version: "1.6",
    date: "May 2026",
    summary: "Goals, Week Review, and Calendar upgrades",
    items: [
      { type: "new", text: "Goals page — set quarterly and monthly goals with key results, a progress slider, status tracking, and target dates" },
      { type: "new", text: "Goals widget on the Command Centre dashboard — urgency-sorted rows, overdue alerts, completion counter, and a direct link to manage all goals" },
      { type: "new", text: "Week Review on Calendar — 7-day momentum bar chart, day breakdown table, streak stats, and four reflection prompts with a week score picker" },
      { type: "new", text: "Recurring calendar templates — save any day plan as a template and have it auto-suggested on matching days of the week" },
      { type: "new", text: "Planning streak counter — live consecutive-day streak shown in the Calendar header and the dashboard Telemetry grid" },
      { type: "improved", text: "Calendar mobile layout — Plan, Schedule, and Tasks now use a dedicated tab bar so all panels are reachable on small screens" },
    ],
  },
  {
    version: "1.5",
    date: "Apr 2026",
    summary: "Calendar overhaul and daily execution tracking",
    items: [
      { type: "new", text: "Daily Calendar planner with time blocks, task list, objectives, priorities, and end-of-day review" },
      { type: "new", text: "Momentum score per day — tracks block completion percentage and surfaces it on the dashboard sparkline" },
      { type: "new", text: "AI day planner — generates a full day plan from your objectives using your existing context" },
      { type: "new", text: "Calendar navigation — jump to any date, use keyboard arrows, or return to today instantly" },
      { type: "improved", text: "Dashboard Execution Heatmap now links to the Calendar for any historical day" },
    ],
  },
  {
    version: "1.4",
    date: "Mar 2026",
    summary: "PWA and mobile experience",
    items: [
      { type: "new", text: "PWA support — install on any device from your browser" },
      { type: "new", text: "Home screen shortcuts for Diagnosis, Scorecard, Opportunities, and Planner" },
      { type: "new", text: "Offline mode — the app UI loads without a connection" },
      { type: "new", text: "Fully responsive layout across all pages and modules" },
      { type: "improved", text: "Renamed to StrategistAI" },
      { type: "improved", text: "Custom favicon and Apple touch icon" },
    ],
  },
  {
    version: "1.3",
    date: "Feb 2026",
    summary: "Search and public profile",
    items: [
      { type: "new", text: "Global search (Cmd+K) across all diagnoses, scorecards, and opportunities" },
      { type: "new", text: "Public Strategy Card — a shareable profile link for clients and collaborators" },
      { type: "improved", text: "Removed AI fluff from all system prompts and UI copy" },
      { type: "improved", text: "Replaced em dashes with cleaner punctuation throughout" },
    ],
  },
  {
    version: "1.2",
    date: "Jan 2026",
    summary: "Dashboard intelligence layer",
    items: [
      { type: "new", text: "Execution Heatmap with daily scoring on the dashboard" },
      { type: "new", text: "Weekly review system with automated summaries" },
      { type: "new", text: "Intelligence Feed — recent sessions at a glance" },
      { type: "new", text: "Leverage Score Trend chart" },
    ],
  },
  {
    version: "1.1",
    date: "Dec 2025",
    summary: "Core strategy modules",
    items: [
      { type: "new", text: "Strategic Diagnosis with bottleneck analysis and leverage scoring" },
      { type: "new", text: "8-dimension Optimisation Scorecard" },
      { type: "new", text: "Opportunity Stack builder" },
      { type: "new", text: "Execution Planner with 7-day sprint and 30-day roadmap" },
      { type: "new", text: "Prompt Arsenal with saved prompts library" },
      { type: "new", text: "Workflow Designer" },
    ],
  },
];
