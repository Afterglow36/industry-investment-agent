export const runtime = "edge";

import { getSseData, splitSseBlocks } from "../../../lib/sse";

const DASHSCOPE_PAY_AS_YOU_GO_BASE_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1";
const DASHSCOPE_TOKEN_PLAN_BASE_URL = "https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1";
const DEFAULT_QWEN_MAX_OUTPUT_TOKENS = 65536;
const DEFAULT_RESEARCH_TOTAL_TIMEOUT_MINUTES = 60;
const DEFAULT_RESEARCH_INACTIVITY_TIMEOUT_MINUTES = 5;

function qwenMaxOutputTokens() {
  const configured = Number(process.env.QWEN_MAX_OUTPUT_TOKENS);
  if (!Number.isFinite(configured) || configured <= 0) return DEFAULT_QWEN_MAX_OUTPUT_TOKENS;
  return Math.min(Math.floor(configured), 131072);
}

function timeoutMinutes(name: string, fallback: number, minimum: number, maximum: number) {
  const configured = Number(process.env[name]);
  if (!Number.isFinite(configured) || configured <= 0) return fallback;
  return Math.min(Math.max(Math.floor(configured), minimum), maximum);
}

function isLocalRequest(request: Request) {
  const hostname = new URL(request.url).hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

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

function completedResponseText(response: Record<string, unknown> | undefined) {
  if (!response || !Array.isArray(response.output)) return "";
  return response.output.flatMap(item => {
    if (!item || typeof item !== "object" || !Array.isArray((item as { content?: unknown }).content)) return [];
    return (item as { content: Array<{ type?: string; text?: string }> }).content
      .filter(part => part?.type === "output_text" && typeof part.text === "string")
      .map(part => part.text || "");
  }).join("");
}

function parseReport(raw: string) {
  const clean = raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  try { return JSON.parse(clean); } catch {
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("模型没有返回可解析的研究数据库，请重试");
    return JSON.parse(clean.slice(start, end + 1));
  }
}

export async function POST(request: Request) {
  const form = await request.formData();
  const taskId = String(form.get("taskId") || crypto.randomUUID());
  const industry = String(form.get("industry") || "").trim();
  const region = String(form.get("region") || "全国").trim();
  const entity = String(form.get("entity") || "产业投资主体").trim();
  const focus = String(form.get("focus") || "产业链机会、区域布局、可落地项目与尽调优先级").trim();
  const provider = form.get("provider") === "qwen" ? "qwen" : "openai";
  const mode = form.get("mode") === "update" ? "update" : "full";
  const updateScope = String(form.get("updateScope") || "");
  const existing = String(form.get("existing") || "");
  const files = form.getAll("files").filter((x): x is File => x instanceof File);
  if (!industry) return Response.json({ error: "请输入目标产业" }, { status: 400 });

  const apiKey = provider === "qwen" ? process.env.DASHSCOPE_API_KEY : process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const keyName = provider === "qwen" ? "DASHSCOPE_API_KEY" : "OPENAI_API_KEY";
    return Response.json({ error: `真实研究后端尚未配置 ${keyName}。请在 Sites 的服务端环境变量中添加秘密变量。`, code: "MODEL_NOT_CONFIGURED" }, { status: 503 });
  }

  const usesTokenPlan = provider === "qwen" && apiKey.startsWith("sk-sp-");
  const qwenBaseUrl = (process.env.DASHSCOPE_BASE_URL || (usesTokenPlan ? DASHSCOPE_TOKEN_PLAN_BASE_URL : DASHSCOPE_PAY_AS_YOU_GO_BASE_URL)).replace(/\/$/, "");
  if (provider === "qwen" && usesTokenPlan && qwenBaseUrl !== DASHSCOPE_TOKEN_PLAN_BASE_URL) {
    return Response.json({
      error: "检测到 Token Plan 专属 API Key（sk-sp-），但 DASHSCOPE_BASE_URL 不是 Token Plan 专属地址。请改为 https://token-plan.cn-beijing.maas.aliyuncs.com/compatible-mode/v1。",
      code: "TOKEN_PLAN_BASE_URL_MISMATCH",
    }, { status: 503 });
  }
  if (provider === "qwen" && !usesTokenPlan && qwenBaseUrl === DASHSCOPE_TOKEN_PLAN_BASE_URL) {
    return Response.json({
      error: "Token Plan 专属地址必须与 sk-sp- 开头的 Token Plan API Key 配套使用。",
      code: "DASHSCOPE_BASE_URL_MISMATCH",
    }, { status: 503 });
  }
  if (usesTokenPlan && !isLocalRequest(request)) {
    return Response.json({
      error: "Token Plan 模式仅开放给本机交互式研究。公开展示站不能使用个人 Token Plan 密钥代调用模型，请在 localhost 运行本项目。",
      code: "TOKEN_PLAN_LOCAL_ONLY",
    }, { status: 403 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const upstreamController = new AbortController();
      const totalTimeoutMinutes = timeoutMinutes("RESEARCH_TOTAL_TIMEOUT_MINUTES", DEFAULT_RESEARCH_TOTAL_TIMEOUT_MINUTES, 10, 120);
      const inactivityTimeoutMinutes = timeoutMinutes("RESEARCH_INACTIVITY_TIMEOUT_MINUTES", DEFAULT_RESEARCH_INACTIVITY_TIMEOUT_MINUTES, 2, 15);
      const abortUpstream = (reason: string) => {
        if (!upstreamController.signal.aborted) upstreamController.abort(reason);
      };
      const onDisconnect = () => abortUpstream("client_disconnected");
      request.signal.addEventListener("abort", onDisconnect, { once: true });
      const totalTimeout = setTimeout(() => abortUpstream("research_total_timeout"), totalTimeoutMinutes * 60 * 1000);
      let inactivityTimeout: ReturnType<typeof setTimeout> | undefined;
      let heartbeat: ReturnType<typeof setInterval> | undefined;
      let currentProgress = 0;
      let currentStage = "";
      let closed = false;
      const startedAt = Date.now();
      let lastUpstreamActivityAt = startedAt;
      const markUpstreamActivity = () => {
        lastUpstreamActivityAt = Date.now();
        if (inactivityTimeout) clearTimeout(inactivityTimeout);
        inactivityTimeout = setTimeout(
          () => abortUpstream("research_inactivity_timeout"),
          inactivityTimeoutMinutes * 60 * 1000,
        );
      };
      markUpstreamActivity();
      const safeEmit = (payload: unknown) => {
        if (closed) return;
        try { emit(controller, encoder, payload); } catch { closed = true; }
      };
      const progress = (value: number, stage: string) => {
        currentProgress = Math.max(currentProgress, value);
        currentStage = stage;
        safeEmit({ type: "progress", progress: currentProgress, stage });
      };
      try {
        progress(4, "任务已进入研究队列");
        const content: Array<Record<string, unknown>> = [{
          type: "input_text",
          text: `${mode === "update" ? `对既有研究进行局部更新，范围：${updateScope}。保留未受影响的可靠内容，并更新来源与数据截止日。\n既有研究：${existing.slice(0, 120000)}` : "从零开展完整产业研究。"}\n\n任务ID：${taskId}\n产业：${industry}\n区域：${region}\n实施主体：${entity}\n研究重点：${focus}\n当前日期：${new Date().toISOString().slice(0, 10)}\n请使用web检索获得最新可核验信息。`,
        }];
        let totalBytes = 0;
        for (const file of files.slice(0, 8)) {
          totalBytes += file.size;
          if (totalBytes > 18 * 1024 * 1024) throw new Error("内部材料合计不能超过18MB");
          const bytes = new Uint8Array(await file.arrayBuffer());
          if (provider === "qwen") {
            if (!/\.(txt|md|csv|json)$/i.test(file.name)) throw new Error("千问模式当前支持直接上传 TXT、Markdown、CSV、JSON；PDF、Word、PPT、Excel 请先使用 OpenAI 模式，或后续接入百炼知识库。");
            content.push({ type: "input_text", text: `\n\n【内部材料：${file.name}】\n${new TextDecoder().decode(bytes).slice(0, 180000)}` });
          } else {
            let binary = "";
            for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
            content.push({ type: "input_file", filename: file.name, file_data: `data:${file.type || "application/octet-stream"};base64,${btoa(binary)}` });
          }
        }
        if (files.length) progress(14, `已读取 ${files.length} 份内部材料`);
        else progress(14, "已确认研究边界与输出结构");

        const endpoint = provider === "qwen"
          ? `${qwenBaseUrl}/responses`
          : "https://api.openai.com/v1/responses";
        const sharedInput = [{ role: "user", content }];
        const qwenBody = {
          model: process.env.QWEN_MODEL || "qwen3.8-max",
          instructions: `${instructions}\n\n你必须只输出一个可被 JSON.parse 解析的JSON对象，不要输出Markdown代码围栏或解释文字。对象必须严格遵循以下JSON Schema并补齐全部必填字段：\n${JSON.stringify(reportSchema)}`,
          input: sharedInput,
          tools: [{ type: "web_search" }, { type: "web_extractor" }, { type: "code_interpreter" }],
          tool_choice: "auto",
          enable_thinking: true,
          // Thinking tokens and the final JSON share this budget. 20k is too small
          // for a tool-heavy four-maps/five-lists report, so keep a larger,
          // model-safe default while allowing operators to tune it.
          max_output_tokens: qwenMaxOutputTokens(),
          stream: true,
          store: false,
        };
        const openaiBody = {
          model: process.env.OPENAI_MODEL || "gpt-6-astra",
          instructions,
          input: sharedInput,
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
        };
        progress(18, "已提交研究请求，等待模型响应");
        heartbeat = setInterval(() => {
          const elapsedMinutes = Math.max(1, Math.floor((Date.now() - startedAt) / 60000));
          const inactiveSeconds = Math.max(0, Math.floor((Date.now() - lastUpstreamActivityAt) / 1000));
          const activityText = inactiveSeconds < 60
            ? `${inactiveSeconds}秒前收到响应`
            : `${Math.floor(inactiveSeconds / 60)}分钟前收到响应`;
          safeEmit({
            type: "progress",
            progress: currentProgress,
            stage: `${currentStage} · 已运行 ${elapsedMinutes} 分钟 · 模型${activityText}`,
            heartbeat: true,
          });
        }, 15000);
        const apiResponse = await fetch(endpoint, {
          method: "POST",
          headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify(provider === "qwen" ? qwenBody : openaiBody),
          signal: upstreamController.signal,
        });
        if (!apiResponse.ok || !apiResponse.body) {
          const detail = await apiResponse.text();
          throw new Error(`研究模型调用失败（${apiResponse.status}）：${detail.slice(0, 500)}`);
        }
        markUpstreamActivity();
        progress(22, "已连接研究模型，正在规划检索路径");

        const reader = apiResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let output = "";
        let searches = 0;
        const searchIds = new Set<string>();
        const handleEvent = (event: Record<string, any>) => {
          if (event.type === "response.created" || event.type === "response.in_progress") {
            progress(24, "模型正在分析任务并规划检索");
          } else if (event.type === "response.reasoning_text.delta") {
            progress(26, "模型正在推理并拆解研究问题");
          } else if (event.type === "response.web_search_call.searching" || event.type === "response.web_search_call.in_progress") {
            const searchId = String(event.item_id || event.output_index || searches + 1);
            if (!searchIds.has(searchId)) { searchIds.add(searchId); searches++; }
            progress(Math.min(28 + searches * 4, 64), `正在进行第 ${Math.max(searches, 1)} 轮证据检索`);
          } else if (event.type === "response.web_search_call.completed") {
            progress(Math.min(40 + Math.max(searches, 1) * 4, 72), "已核验一组公开来源");
          } else if (event.type === "response.output_item.added" && event.item?.type === "web_extractor_call") {
            progress(Math.min(58 + searches * 3, 78), "正在读取网页正文");
          } else if (event.type === "response.output_item.done" && event.item?.type === "web_extractor_call") {
            progress(Math.min(62 + searches * 3, 80), "已提取并核验网页证据");
          } else if (event.type?.startsWith("response.code_interpreter_call.")) {
            progress(80, "正在计算评分与经济性指标");
          } else if (event.type === "response.output_text.delta") {
            output += event.delta || "";
            progress(Math.min(82 + Math.floor(output.length / 4000), 93), "正在构建四图五清单与评分数据库");
          } else if (event.type === "response.output_text.done" && !output && typeof event.text === "string") {
            output = event.text;
          } else if (event.type === "response.completed") {
            if (!output) output = completedResponseText(event.response);
            progress(94, "模型研究完成，正在校验结构化结果");
          } else if (event.type === "response.incomplete") {
            const reason = event.response?.incomplete_details?.reason;
            if (reason === "max_output_tokens") {
              throw new Error("模型已达到本次最大输出长度，未能完成全部四图五清单。系统已提高千问输出额度，请重新运行；若仍出现此提示，请缩小研究重点或改用局部更新模式。");
            }
            throw new Error(reason ? `模型输出未完整完成（${reason}），请重试` : "模型输出未完整完成，请缩小研究范围后重试");
          } else if (event.type === "response.failed") {
            throw new Error(event.response?.error?.message || "模型研究失败");
          }
        };
        const processBlock = (block: string) => {
          const data = getSseData(block);
          if (!data || data === "[DONE]") return;
          try { handleEvent(JSON.parse(data)); } catch (error) {
            if (error instanceof SyntaxError) return;
            throw error;
          }
        };
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          if (value?.byteLength) markUpstreamActivity();
          buffer += decoder.decode(value, { stream: true });
          const parsed = splitSseBlocks(buffer);
          buffer = parsed.rest;
          parsed.blocks.forEach(processBlock);
        }
        buffer += decoder.decode();
        if (buffer.trim()) processBlock(buffer);
        if (!output.trim()) throw new Error("模型连接已结束，但没有返回研究结果，请重试");
        const report = parseReport(output);
        report.meta = { ...report.meta, taskId, industry, region, entity, mode, cutoff: new Date().toISOString().slice(0, 10), generatedAt: new Date().toISOString() };
        progress(96, "正在生成数据库与PPT结构");
        safeEmit({ type: "result", progress: 100, stage: "研究完成，可下载数据库和PPT", result: report });
      } catch (error) {
        const aborted = upstreamController.signal.aborted;
        const reason = upstreamController.signal.reason;
        const message = !aborted
          ? error instanceof Error ? error.message : "研究任务失败"
          : reason === "research_inactivity_timeout"
            ? `连续${inactivityTimeoutMinutes}分钟未收到模型数据，任务已自动终止。请检查网络或稍后重试。`
            : reason === "research_total_timeout"
              ? `研究任务已达到${totalTimeoutMinutes}分钟总时限并自动终止。建议缩小研究范围或使用局部更新模式。`
              : "研究任务已中止。";
        safeEmit({ type: "error", error: message });
      } finally {
        if (heartbeat) clearInterval(heartbeat);
        if (inactivityTimeout) clearTimeout(inactivityTimeout);
        clearTimeout(totalTimeout);
        request.signal.removeEventListener("abort", onDisconnect);
        if (!closed) { closed = true; controller.close(); }
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" } });
}
