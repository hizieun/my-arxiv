import type { ArxivCategory } from "./types";

export const AI_CATEGORIES: ArxivCategory[] = [
  { code: "cs.AI", name: "Artificial Intelligence", group: "Core AI" },
  { code: "cs.LG", name: "Machine Learning", group: "Core AI" },
  { code: "cs.CL", name: "Computation and Language (NLP)", group: "Core AI" },
  { code: "cs.CV", name: "Computer Vision", group: "Core AI" },
  { code: "cs.NE", name: "Neural and Evolutionary Computing", group: "Core AI" },
  { code: "cs.MA", name: "Multiagent Systems", group: "Core AI" },
  { code: "cs.RO", name: "Robotics", group: "Applications" },
  { code: "cs.IR", name: "Information Retrieval", group: "Applications" },
  { code: "cs.HC", name: "Human-Computer Interaction", group: "Applications" },
  { code: "cs.CR", name: "Cryptography and Security", group: "Applications" },
  { code: "stat.ML", name: "Statistics — Machine Learning", group: "Statistics" },
  { code: "stat.AP", name: "Statistics — Applications", group: "Statistics" },
];

export const DEFAULT_SELECTED_CATEGORIES = ["cs.AI", "cs.LG", "cs.CL"];

export function getCategoryByCode(code: string): ArxivCategory | undefined {
  return AI_CATEGORIES.find((c) => c.code === code);
}
