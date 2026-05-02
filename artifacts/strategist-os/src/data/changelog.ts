export const CURRENT_VERSION = "1.4";
export const CHANGELOG_SEEN_KEY = "strategistai_changelog_seen";

export type ChangeItem = {
  type: "new" | "fix" | "improved";
  text: string;
};

export type ChangeEntry = {
  version: string;
  date: string;
  items: ChangeItem[];
};

export const changelog: ChangeEntry[] = [
  {
    version: "1.4",
    date: "May 2025",
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
    date: "Apr 2025",
    items: [
      { type: "new", text: "Global search (Cmd+K) across all diagnoses, scorecards, and opportunities" },
      { type: "new", text: "Public Strategy Card — a shareable profile link for clients and collaborators" },
      { type: "improved", text: "Removed AI fluff from all system prompts and UI copy" },
      { type: "improved", text: "Replaced em dashes with cleaner punctuation throughout" },
    ],
  },
  {
    version: "1.2",
    date: "Apr 2025",
    items: [
      { type: "new", text: "Execution Heatmap with daily scoring on the dashboard" },
      { type: "new", text: "Weekly review system with automated summaries" },
      { type: "new", text: "Intelligence Feed — recent sessions at a glance" },
      { type: "new", text: "Leverage Score Trend chart" },
    ],
  },
  {
    version: "1.1",
    date: "Mar 2025",
    items: [
      { type: "new", text: "Strategic Diagnosis with bottleneck analysis and leverage scoring" },
      { type: "new", text: "8-dimension Optimisation Scorecard" },
      { type: "new", text: "Opportunity Stack builder" },
      { type: "new", text: "Execution Planner with 7-day sprint and 30-day roadmap" },
      { type: "new", text: "Prompt Arsenal with saved prompts library" },
      { type: "new", text: "Workflow Designer" },
      { type: "new", text: "Calendar and daily planning" },
    ],
  },
];
