const stringArray = { type: "array", items: { type: "string" } };

const objectArray = (required: string[], properties: Record<string, unknown>, minItems: number, maxItems: number) => ({
  type: "array",
  minItems,
  maxItems,
  items: { type: "object", additionalProperties: false, required, properties },
});

const sourceIds = { sourceIds: stringArray };

export const detailedReportSchema = {
  type: "object",
  additionalProperties: false,
  required: ["meta", "executiveSummary", "verdicts", "maps", "database", "sources", "dataGaps"],
  properties: {
    meta: {
      type: "object", additionalProperties: false,
      required: ["taskId", "industry", "region", "entity", "mode", "cutoff", "generatedAt"],
      properties: {
        taskId: { type: "string" }, industry: { type: "string" }, region: { type: "string" }, entity: { type: "string" },
        mode: { type: "string", enum: ["full", "update"] }, cutoff: { type: "string" }, generatedAt: { type: "string" },
      },
    },
    executiveSummary: { type: "string" },
    verdicts: objectArray(
      ["level", "title", "rationale", "evidenceIds"],
      { level: { type: "string" }, title: { type: "string" }, rationale: { type: "string" }, evidenceIds: stringArray }, 3, 5,
    ),
    maps: objectArray(
      ["title", "question", "nodes", "implication"],
      {
        title: { type: "string" }, question: { type: "string" },
        nodes: objectArray(["label", "detail", "evidenceIds"], { label: { type: "string" }, detail: { type: "string" }, evidenceIds: stringArray }, 5, 12),
        implication: { type: "string" },
      }, 4, 4,
    ),
    database: {
      type: "object", additionalProperties: false,
      required: ["boundaries", "industryChain", "products", "marketMetrics", "technologies", "regions", "policies", "enterprises", "projects", "problems", "resources", "scoreWeights", "scoreItems", "roiScenarios", "changeLog", "searchLog"],
      properties: {
        boundaries: {
          type: "object", additionalProperties: false,
          required: ["definition", "included", "excluded", "valueChainBoundary", "productTaxonomy", "businessModels", "statisticalCaliber", "geography", "targetAudience"],
          properties: {
            definition: { type: "string" }, included: stringArray, excluded: stringArray, valueChainBoundary: { type: "string" },
            productTaxonomy: stringArray, businessModels: stringArray, statisticalCaliber: { type: "string" }, geography: { type: "string" }, targetAudience: { type: "string" },
          },
        },
        industryChain: objectArray(
          ["id", "layer", "segment", "output", "representatives", "maturity", "barrier", "bottleneck", "impact", "entryMode", "marketProxy", "sourceIds"],
          { id: { type: "string" }, layer: { type: "string" }, segment: { type: "string" }, output: { type: "string" }, representatives: { type: "string" }, maturity: { type: "string" }, barrier: { type: "string" }, bottleneck: { type: "string" }, impact: { type: "string" }, entryMode: { type: "string" }, marketProxy: { type: "string" }, ...sourceIds }, 12, 35,
        ),
        products: objectArray(
          ["id", "track", "product", "company", "user", "task", "scenario", "buyer", "payer", "businessModel", "price", "qualification", "commercialization", "risk", "action", "sourceIds"],
          { id: { type: "string" }, track: { type: "string" }, product: { type: "string" }, company: { type: "string" }, user: { type: "string" }, task: { type: "string" }, scenario: { type: "string" }, buyer: { type: "string" }, payer: { type: "string" }, businessModel: { type: "string" }, price: { type: "string" }, qualification: { type: "string" }, commercialization: { type: "string" }, risk: { type: "string" }, action: { type: "string" }, ...sourceIds }, 15, 45,
        ),
        marketMetrics: objectArray(
          ["id", "metric", "metricType", "caliber", "region", "year", "value", "unit", "growth", "dataNature", "comparability", "sourceIds"],
          { id: { type: "string" }, metric: { type: "string" }, metricType: { type: "string" }, caliber: { type: "string" }, region: { type: "string" }, year: { type: "string" }, value: { type: "string" }, unit: { type: "string" }, growth: { type: "string" }, dataNature: { type: "string" }, comparability: { type: "string" }, ...sourceIds }, 10, 35,
        ),
        technologies: objectArray(
          ["id", "layer", "direction", "description", "trl", "penetration", "bottleneck", "gap", "mainstreamTime", "representatives", "verificationMetric", "action", "sourceIds"],
          { id: { type: "string" }, layer: { type: "string" }, direction: { type: "string" }, description: { type: "string" }, trl: { type: "string" }, penetration: { type: "string" }, bottleneck: { type: "string" }, gap: { type: "string" }, mainstreamTime: { type: "string" }, representatives: { type: "string" }, verificationMetric: { type: "string" }, action: { type: "string" }, ...sourceIds }, 10, 30,
        ),
        regions: objectArray(
          ["id", "tier", "region", "cluster", "enterprises", "research", "platforms", "capital", "manufacturing", "scenarios", "strength", "weakness", "role", "sourceIds"],
          { id: { type: "string" }, tier: { type: "string" }, region: { type: "string" }, cluster: { type: "string" }, enterprises: { type: "string" }, research: { type: "string" }, platforms: { type: "string" }, capital: { type: "string" }, manufacturing: { type: "string" }, scenarios: { type: "string" }, strength: { type: "string" }, weakness: { type: "string" }, role: { type: "string" }, ...sourceIds }, 8, 25,
        ),
        policies: objectArray(
          ["id", "level", "name", "date", "publisher", "supportObject", "supportMethod", "constraints", "impact", "opportunity", "status", "sourceIds"],
          { id: { type: "string" }, level: { type: "string" }, name: { type: "string" }, date: { type: "string" }, publisher: { type: "string" }, supportObject: { type: "string" }, supportMethod: { type: "string" }, constraints: { type: "string" }, impact: { type: "string" }, opportunity: { type: "string" }, status: { type: "string" }, ...sourceIds }, 12, 40,
        ),
        enterprises: objectArray(
          ["id", "name", "type", "region", "segment", "products", "technology", "qualification", "commercialEvidence", "financialEvidence", "financing", "shareholders", "collaboration", "risk", "dueDiligence", "sourceIds"],
          { id: { type: "string" }, name: { type: "string" }, type: { type: "string" }, region: { type: "string" }, segment: { type: "string" }, products: { type: "string" }, technology: { type: "string" }, qualification: { type: "string" }, commercialEvidence: { type: "string" }, financialEvidence: { type: "string" }, financing: { type: "string" }, shareholders: { type: "string" }, collaboration: { type: "string" }, risk: { type: "string" }, dueDiligence: { type: "string" }, ...sourceIds }, 20, 60,
        ),
        projects: objectArray(
          ["id", "name", "type", "date", "amount", "participants", "location", "status", "useOfFunds", "value", "request", "risk", "nextAction", "sourceIds"],
          { id: { type: "string" }, name: { type: "string" }, type: { type: "string" }, date: { type: "string" }, amount: { type: "string" }, participants: { type: "string" }, location: { type: "string" }, status: { type: "string" }, useOfFunds: { type: "string" }, value: { type: "string" }, request: { type: "string" }, risk: { type: "string" }, nextAction: { type: "string" }, ...sourceIds }, 12, 45,
        ),
        problems: objectArray(
          ["id", "type", "segment", "description", "cause", "impact", "severity", "solution", "owner", "timing", "metric", "restartCondition", "sourceIds"],
          { id: { type: "string" }, type: { type: "string" }, segment: { type: "string" }, description: { type: "string" }, cause: { type: "string" }, impact: { type: "string" }, severity: { type: "string" }, solution: { type: "string" }, owner: { type: "string" }, timing: { type: "string" }, metric: { type: "string" }, restartCondition: { type: "string" }, ...sourceIds }, 10, 30,
        ),
        resources: objectArray(
          ["id", "ownership", "name", "type", "location", "evidence", "capacity", "collaboration", "controlBoundary", "verification", "sourceIds"],
          { id: { type: "string" }, ownership: { type: "string" }, name: { type: "string" }, type: { type: "string" }, location: { type: "string" }, evidence: { type: "string" }, capacity: { type: "string" }, collaboration: { type: "string" }, controlBoundary: { type: "string" }, verification: { type: "string" }, ...sourceIds }, 8, 25,
        ),
        scoreWeights: objectArray(
          ["category", "dimension", "weight", "rationale"],
          { category: { type: "string" }, dimension: { type: "string" }, weight: { type: "number", minimum: 0, maximum: 100 }, rationale: { type: "string" } }, 12, 36,
        ),
        scoreItems: objectArray(
          ["category", "name", "stage", "dimensions", "total", "coverage", "status", "rationale", "nextAction", "sourceIds"],
          { category: { type: "string" }, name: { type: "string" }, stage: { type: "string" }, dimensions: objectArray(["dimension", "score", "evidence"], { dimension: { type: "string" }, score: { type: "number", minimum: 0, maximum: 5 }, evidence: { type: "string" } }, 4, 15), total: { type: "number", minimum: 0, maximum: 100 }, coverage: { type: "string" }, status: { type: "string" }, rationale: { type: "string" }, nextAction: { type: "string" }, ...sourceIds }, 12, 30,
        ),
        roiScenarios: objectArray(
          ["id", "scenario", "case", "initialInvestment", "annualRevenue", "annualSavings", "annualOpex", "annualNetBenefit", "paybackYears", "roiOrNpv", "assumptions", "sensitivity", "boundary", "sourceIds"],
          { id: { type: "string" }, scenario: { type: "string" }, case: { type: "string" }, initialInvestment: { type: "string" }, annualRevenue: { type: "string" }, annualSavings: { type: "string" }, annualOpex: { type: "string" }, annualNetBenefit: { type: "string" }, paybackYears: { type: "string" }, roiOrNpv: { type: "string" }, assumptions: { type: "string" }, sensitivity: { type: "string" }, boundary: { type: "string" }, ...sourceIds }, 6, 15,
        ),
        changeLog: objectArray(
          ["date", "module", "changeType", "description", "before", "after", "status"],
          { date: { type: "string" }, module: { type: "string" }, changeType: { type: "string" }, description: { type: "string" }, before: { type: "string" }, after: { type: "string" }, status: { type: "string" } }, 5, 20,
        ),
        searchLog: objectArray(
          ["queryId", "round", "topic", "query", "preferredSources", "result", "newRecords", "duplication", "evidenceQuality", "saturation"],
          { queryId: { type: "string" }, round: { type: "string" }, topic: { type: "string" }, query: { type: "string" }, preferredSources: { type: "string" }, result: { type: "string" }, newRecords: { type: "string" }, duplication: { type: "string" }, evidenceQuality: { type: "string" }, saturation: { type: "string" } }, 8, 20,
        ),
      },
    },
    sources: objectArray(
      ["id", "title", "publisher", "date", "url", "grade", "sourceType", "used", "dataNature", "verificationStatus"],
      { id: { type: "string" }, title: { type: "string" }, publisher: { type: "string" }, date: { type: "string" }, url: { type: "string" }, grade: { type: "string" }, sourceType: { type: "string" }, used: { type: "string" }, dataNature: { type: "string" }, verificationStatus: { type: "string" } }, 30, 100,
    ),
    dataGaps: objectArray(
      ["id", "module", "item", "impact", "priority", "method", "owner", "timing", "status"],
      { id: { type: "string" }, module: { type: "string" }, item: { type: "string" }, impact: { type: "string" }, priority: { type: "string" }, method: { type: "string" }, owner: { type: "string" }, timing: { type: "string" }, status: { type: "string" } }, 8, 25,
    ),
  },
};

export const detailedResearchRequirements = `
输出必须达到“17张专业底表 + 25页决策PPT”的数据深度，而不是四图五清单摘要：
- 先完成两轮检索并保留searchLog；全国扫描后深挖核心区域，不得用同一批泛化描述填充不同记录。
- 企业、产品、项目必须分别建库；企业至少覆盖龙头、成长、配套、本地和风险样本，项目区分已发生、在建、签约、建议和融资事件。
- 产业链要覆盖基础部件、技术、产品、平台、应用、服务与支付；市场表严格区分产值、收入、出货、预测、合同与订单口径。
- 每个事实记录关联sourceIds。来源不足时保留“待核”，不得伪造数量、财务、订单、资质、项目金额或链接。
- 主体资源按主体自有、可支配或已签约、区域公共、外部可协同、待内部核实分级，区域资源不得自动视为主体资产。
- 产品方向、企业、项目分别建立评分权重，每一category的scoreWeights均合计100；缺失证据降低coverage与得分，高分只表示优先尽调、试点或谈判。
- ROI至少选择两个适合本产业的具体场景，每个场景给保守、基准、乐观三种情景；缺少价格成本依据时将其列入dataGaps。
- maps固定依次为产业链全景图、应用领域与产品价值图、技术路线与投资优先级图、区域分布与产业布局图。
- 结论必须回答进入方向、验证条件、暂停边界、主体动作和资本工具。`;

export function deriveSummaryViews(report: any) {
  const db = report.database || {};
  report.dataGaps = Array.isArray(report.dataGaps) ? report.dataGaps : [];
  const validSourceIds = new Set((report.sources || []).map((source: any) => source.id));
  const danglingSourceIds = new Set<string>();
  const inspectEvidence = (value: any) => {
    if (Array.isArray(value)) return value.forEach(inspectEvidence);
    if (!value || typeof value !== "object") return;
    for (const [key, child] of Object.entries(value)) {
      if ((key === "sourceIds" || key === "evidenceIds") && Array.isArray(child)) {
        child.forEach(id => { if (!validSourceIds.has(id)) danglingSourceIds.add(String(id)); });
      } else inspectEvidence(child);
    }
  };
  inspectEvidence({ verdicts: report.verdicts, maps: report.maps, database: db });
  if (danglingSourceIds.size) report.dataGaps.push({
    id: "G-AUTO-SOURCE", module: "数据来源索引", item: `存在未登记来源ID：${Array.from(danglingSourceIds).join("、")}`,
    impact: "相关事实无法完整回溯", priority: "高", method: "补充来源索引或移除无效引用", owner: "研究团队", timing: "交付前", status: "自动校验发现",
  });
  const weights = new Map<string, Map<string, number>>();
  for (const item of db.scoreWeights || []) {
    if (!weights.has(item.category)) weights.set(item.category, new Map());
    weights.get(item.category)?.set(item.dimension, Number(item.weight) || 0);
  }
  for (const [category, categoryWeights] of weights) {
    const totalWeight = Array.from(categoryWeights.values()).reduce((sum, value) => sum + value, 0);
    if (Math.abs(totalWeight - 100) > 0.01) report.dataGaps.push({
      id: `G-AUTO-WEIGHT-${category}`, module: "综合评分", item: `${category}评分权重合计为${totalWeight}%，不等于100%`,
      impact: "综合得分不可直接用于排序", priority: "高", method: "重新校准评分权重", owner: "研究团队", timing: "交付前", status: "自动校验发现",
    });
  }
  for (const item of db.scoreItems || []) {
    const categoryWeights = weights.get(item.category);
    if (!categoryWeights?.size) continue;
    let weighted = 0;
    let coveredWeight = 0;
    for (const dimension of item.dimensions || []) {
      const weight = categoryWeights.get(dimension.dimension) || 0;
      if (weight <= 0 || !Number.isFinite(Number(dimension.score))) continue;
      weighted += Number(dimension.score) * weight / 5;
      if (String(dimension.evidence || "").trim()) coveredWeight += weight;
    }
    item.total = Math.round(weighted * 10) / 10;
    item.coverage = `${Math.min(100, Math.round(coveredWeight))}%`;
  }
  report.lists = [
    ["产业集群清单", db.regions || [], (item: any) => ({ name: item.cluster || item.region, type: item.tier, status: item.role, region: item.region, summary: `${item.strength || ""}${item.weakness ? `；短板：${item.weakness}` : ""}`, evidenceIds: item.sourceIds || [], nextAction: item.role || "进一步核验" })],
    ["政策清单", db.policies || [], (item: any) => ({ name: item.name, type: item.level, status: item.status, region: report.meta?.region || "全国", summary: `${item.supportMethod || ""}${item.constraints ? `；约束：${item.constraints}` : ""}`, evidenceIds: item.sourceIds || [], nextAction: item.opportunity || "逐项匹配申报条件" })],
    ["重点企业清单", db.enterprises || [], (item: any) => ({ name: item.name, type: item.type, status: item.commercialEvidence || "待核", region: item.region, summary: `${item.segment || ""}；${item.collaboration || ""}`, evidenceIds: item.sourceIds || [], nextAction: item.dueDiligence || "进入专题尽调" })],
    ["重点项目清单", db.projects || [], (item: any) => ({ name: item.name, type: item.type, status: item.status, region: item.location, summary: `${item.value || ""}${item.risk ? `；风险：${item.risk}` : ""}`, evidenceIds: item.sourceIds || [], nextAction: item.nextAction || "明确推进条件" })],
    ["产业问题清单", db.problems || [], (item: any) => ({ name: item.description, type: item.type, status: item.severity, region: report.meta?.region || "全国", summary: `${item.cause || ""}；影响：${item.impact || ""}`, evidenceIds: item.sourceIds || [], nextAction: item.solution || "转为整改任务" })],
  ].map(([name, items, mapper]: any[]) => ({ name, items: items.map(mapper) }));
  report.scores = (db.scoreItems || []).map((item: any) => ({
    name: item.name, type: item.category, score: item.total, status: item.status,
    rationale: item.rationale, evidenceIds: item.sourceIds || [],
  }));
  return report;
}
