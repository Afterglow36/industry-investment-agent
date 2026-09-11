export const runtime = "edge";

const itemSchema = {
  type: "object",
  additionalProperties: false,
  required: ["name", "type", "status", "region", "summary", "evidenceIds", "nextAction"],
  properties: {
    name: { type: "string" }, type: { type: "string" }, status: { type: "string" }, region: { type: "string" },
    summary: { type: "string" }, evidenceIds: { type: "array", items: { type: "string" } }, nextAction: { type: "string" },
  },
};

const reportSchema = {
  type: "object",
  additionalProperties: false,
  required: ["meta", "executiveSummary", "verdicts", "maps", "lists", "scores", "sources", "dataGaps", "slides"],
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
    verdicts: { type: "array", minItems: 3, maxItems: 5, items: { type: "object", additionalProperties: false, required: ["level", "title", "rationale", "evidenceIds"], properties: { level: { type: "string" }, title: { type: "string" }, rationale: { type: "string" }, evidenceIds: { type: "array", items: { type: "string" } } } } },
    maps: { type: "array", minItems: 4, maxItems: 4, items: { type: "object", additionalProperties: false, required: ["title", "question", "nodes", "implication"], properties: { title: { type: "string" }, question: { type: "string" }, nodes: { type: "array", minItems: 3, maxItems: 8, items: { type: "object", additionalProperties: false, required: ["label", "detail", "evidenceIds"], properties: { label: { type: "string" }, detail: { type: "string" }, evidenceIds: { type: "array", items: { type: "string" } } } } }, implication: { type: "string" } } } },
    lists: { type: "array", minItems: 5, maxItems: 5, items: { type: "object", additionalProperties: false, required: ["name", "items"], properties: { name: { type: "string" }, items: { type: "array", minItems: 2, maxItems: 10, items: itemSchema } } } },
    scores: { type: "array", minItems: 3, maxItems: 10, items: { type: "object", additionalProperties: false, required: ["name", "type", "score", "status", "rationale", "evidenceIds"], properties: { name: { type: "string" }, type: { type: "string" }, score: { type: "number", minimum: 0, maximum: 100 }, status: { type: "string" }, rationale: { type: "string" }, evidenceIds: { type: "array", items: { type: "string" } } } } },
    sources: { type: "array", minItems: 5, maxItems: 30, items: { type: "object", additionalProperties: false, required: ["id", "title", "publisher", "date", "url", "grade", "sourceType", "used"], properties: { id: { type: "string" }, title: { type: "string" }, publisher: { type: "string" }, date: { type: "string" }, url: { type: "string" }, grade: { type: "string" }, sourceType: { type: "string" }, used: { type: "string" } } } },
    dataGaps: { type: "array", minItems: 2, maxItems: 10, items: { type: "object", additionalProperties: false, required: ["item", "impact", "nextAction"], properties: { item: { type: "string" }, impact: { type: "string" }, nextAction: { type: "string" } } } },
    slides: { type: "array", minItems: 8, maxItems: 20, items: { type: "object", additionalProperties: false, required: ["title", "subtitle", "bullets", "evidenceIds"], properties: { title: { type: "string" }, subtitle: { type: "string" }, bullets: { type: "array", items: { type: "string" } }, evidenceIds: { type: "array", items: { type: "string" } } } } },
  },
};

const instructions = `你是“产业投资研究 Agent”，服务政府产业平台、国有资本、产业集团、园区和市场化基金。你必须基于公开可核验信息和用户上传材料，形成可追溯产业研究，不得把评分或情景测算表述成投资建议。

研究规则：
1. 先界定产业边界，再完成两轮检索：第一轮搭全景，第二轮补政策、企业、项目、区域和争议缺口。
2. 优先使用政府、监管机构、标准、上市公司公告和企业官网；媒体只能补充线索。所有事实用来源ID关联。
3. 严格区分：公开事实、企业披露、内部材料、研究判断、待核验项。内部材料若无法外部验证，应标为内部材料，不得伪造URL。
4. 四图固定为：产业链全景图、应用领域与产品价值图、技术路线与投资优先级图、区域分布与产业布局图。
5. 五清单固定为：产业集群清单、政策清单、重点企业清单、重点项目清单、产业问题清单。
6. 企业、产品、项目评分用于尽调排序；数据缺失不得默认高分。经济性缺少CAPEX、收入机制或合同数据时，明确列入数据缺口。
7. 结论必须回答进入方向、验证条件和暂停边界，并结合实施主体的资源与资本工具。
8. 用简洁中文；每条结论说明证据ID。不要输出投资建议措辞。`;

function emit(controller: ReadableStreamDefaultController, encoder: TextEncoder, payload: unknown) {
  controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
}

export async function POST(request: Request) {
  const form = await request.formData();
  const taskId = String(form.get("taskId") || crypto.randomUUID());
  const industry = String(form.get("industry") || "").trim();
  const region = String(form.get("region") || "全国").trim();
  const entity = String(form.get("entity") || "产业投资主体").trim();
  const focus = String(form.get("focus") || "产业链机会、区域布局、可落地项目与尽调优先级").trim();
  const mode = form.get("mode") === "update" ? "update" : "full";
  const updateScope = String(form.get("updateScope") || "");
  const existing = String(form.get("existing") || "");
  const files = form.getAll("files").filter((x): x is File => x instanceof File);
  if (!industry) return Response.json({ error: "请输入目标产业" }, { status: 400 });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "真实研究后端尚未配置 OPENAI_API_KEY。请在 Sites 的服务端环境变量中添加密钥。", code: "MODEL_NOT_CONFIGURED" }, { status: 503 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        emit(controller, encoder, { type: "progress", progress: 4, stage: "任务已进入研究队列" });
        const content: Array<Record<string, unknown>> = [{
          type: "input_text",
          text: `${mode === "update" ? `对既有研究进行局部更新，范围：${updateScope}。保留未受影响的可靠内容，并更新来源与数据截止日。\n既有研究：${existing.slice(0, 120000)}` : "从零开展完整产业研究。"}\n\n任务ID：${taskId}\n产业：${industry}\n区域：${region}\n实施主体：${entity}\n研究重点：${focus}\n当前日期：${new Date().toISOString().slice(0, 10)}\n请使用web检索获得最新可核验信息。`,
        }];
        let totalBytes = 0;
        for (const file of files.slice(0, 8)) {
          totalBytes += file.size;
          if (totalBytes > 18 * 1024 * 1024) throw new Error("内部材料合计不能超过18MB");
          const bytes = new Uint8Array(await file.arrayBuffer());
          let binary = "";
          for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
          content.push({ type: "input_file", filename: file.name, file_data: `data:${file.type || "application/octet-stream"};base64,${btoa(binary)}` });
        }
        if (files.length) emit(controller, encoder, { type: "progress", progress: 14, stage: `已读取 ${files.length} 份内部材料` });
        else emit(controller, encoder, { type: "progress", progress: 14, stage: "已确认研究边界与输出结构" });

        const apiResponse = await fetch("https://api.openai.com/v1/responses", {
          method: "POST",
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: process.env.OPENAI_MODEL || "gpt-6-astra",
            instructions,
            input: [{ role: "user", content }],
            tools: [{ type: "web_search", search_context_size: "high" }],
            tool_choice: "auto",
            include: ["web_search_call.action.sources"],
            max_tool_calls: 18,
            max_output_tokens: 20000,
            reasoning: { effort: "high" },
            text: { verbosity: "low", format: { type: "json_schema", name: "industry_investment_report", strict: true, schema: reportSchema } },
            stream: true,
            store: false,
            prompt_cache_key: "industry-investment-agent-v2",
          }),
        });
        if (!apiResponse.ok || !apiResponse.body) {
          const detail = await apiResponse.text();
          throw new Error(`研究模型调用失败（${apiResponse.status}）：${detail.slice(0, 500)}`);
        }

        const reader = apiResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let output = "";
        let searches = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split("\n\n");
          buffer = blocks.pop() || "";
          for (const block of blocks) {
            const dataLine = block.split("\n").find(line => line.startsWith("data: "));
            if (!dataLine || dataLine === "data: [DONE]") continue;
            try {
              const event = JSON.parse(dataLine.slice(6));
              if (event.type === "response.web_search_call.searching" || event.type === "response.web_search_call.in_progress") {
                searches++;
                emit(controller, encoder, { type: "progress", progress: Math.min(28 + searches * 4, 64), stage: `正在进行第 ${searches} 轮证据检索` });
              } else if (event.type === "response.web_search_call.completed") {
                emit(controller, encoder, { type: "progress", progress: Math.min(40 + searches * 4, 72), stage: "已核验一组公开来源" });
              } else if (event.type === "response.output_text.delta") {
                output += event.delta || "";
                if (output.length % 5000 < 500) emit(controller, encoder, { type: "progress", progress: Math.min(76 + Math.floor(output.length / 4000), 92), stage: "正在构建四图五清单与评分数据库" });
              } else if (event.type === "response.failed") {
                throw new Error(event.response?.error?.message || "模型研究失败");
              }
            } catch (error) {
              if (error instanceof SyntaxError) continue;
              throw error;
            }
          }
        }
        const report = JSON.parse(output);
        report.meta = { ...report.meta, taskId, industry, region, entity, mode, cutoff: new Date().toISOString().slice(0, 10), generatedAt: new Date().toISOString() };
        emit(controller, encoder, { type: "progress", progress: 96, stage: "正在生成数据库与PPT结构" });
        emit(controller, encoder, { type: "result", progress: 100, stage: "研究完成，可下载数据库和PPT", result: report });
      } catch (error) {
        emit(controller, encoder, { type: "error", error: error instanceof Error ? error.message : "研究任务失败" });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" } });
}
