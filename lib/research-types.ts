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
  database?: Record<string, any>;
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
    dataNature?: string;
    verificationStatus?: string;
  }>;
  dataGaps: Array<{ id?: string; module?: string; item: string; impact: string; nextAction?: string; priority?: string; method?: string; owner?: string; timing?: string; status?: string }>;
  slides?: Array<{ title: string; subtitle: string; bullets: string[]; evidenceIds: EvidenceRef }>;
};

export type StoredTask = {
  id: string;
  provider?: "openai" | "qwen";
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
  /** Last complete model draft, stored locally so formatting failures can resume without re-searching. */
  recoveryDraft?: string;
};
