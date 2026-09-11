export type EvidenceRef = string[];

export type ResearchResult = {
  meta: {
    taskId: string;
    industry: string;
    region: string;
    entity: string;
    mode: "full" | "update";
    cutoff: string;
    generatedAt: string;
  };
  executiveSummary: string;
  verdicts: Array<{ level: string; title: string; rationale: string; evidenceIds: EvidenceRef }>;
  maps: Array<{
    title: string;
    question: string;
    nodes: Array<{ label: string; detail: string; evidenceIds: EvidenceRef }>;
    implication: string;
  }>;
  lists: Array<{
    name: string;
    items: Array<{
      name: string;
      type: string;
      status: string;
      region: string;
      summary: string;
      evidenceIds: EvidenceRef;
      nextAction: string;
    }>;
  }>;
  scores: Array<{
    name: string;
    type: string;
    score: number;
    status: string;
    rationale: string;
    evidenceIds: EvidenceRef;
  }>;
  sources: Array<{
    id: string;
    title: string;
    publisher: string;
    date: string;
    url: string;
    grade: string;
    sourceType: string;
    used: string;
  }>;
  dataGaps: Array<{ item: string; impact: string; nextAction: string }>;
  slides: Array<{ title: string; subtitle: string; bullets: string[]; evidenceIds: EvidenceRef }>;
};

export type StoredTask = {
  id: string;
  industry: string;
  region: string;
  entity: string;
  status: "ready" | "running" | "completed" | "failed";
  progress: number;
  stage: string;
  createdAt: string;
  updatedAt: string;
  fileNames: string[];
  result?: ResearchResult;
  error?: string;
};
