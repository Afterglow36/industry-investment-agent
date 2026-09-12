"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { downloadPptx, downloadXlsx } from "../lib/office";
import type { ResearchResult, StoredTask } from "../lib/research-types";
import { getSseData, splitSseBlocks } from "../lib/sse";

type Scope = "企业" | "政策" | "项目";
const phases = ["定义边界", "读取材料", "公开检索", "证据核验", "四图五清单", "生成成果"];

const sample: ResearchResult = {
  meta: { taskId: "sample-storage", industry: "新型储能", region: "湖北省", entity: "地方国资产业投资平台（示范）", mode: "full", cutoff: "2026-09-11", generatedAt: "2026-09-11T08:00:00Z" },
  executiveSummary: "以系统集成、项目运营和安全能力为优先切口；长时储能采用项目实证解锁；同质化电芯扩产暂缓进入。",
  verdicts: [
    { level: "优先尽调", title: "锂离子储能系统集成", rationale: "规模基础明确，重点核验订单、安全责任与湖北项目协同。", evidenceIds: ["S01", "S02"] },
    { level: "项目验证", title: "液流与压缩空气", rationale: "长时窗口成立，但需以可研、效率和运行数据解锁。", evidenceIds: ["S04"] },
    { level: "暂缓规模化", title: "同质化电芯扩产", rationale: "政策提示防止低水平重复建设。", evidenceIds: ["S02"] },
  ],
  maps: [
    { title: "产业链全景图", question: "价值与能力分布在哪里？", nodes: [{ label: "材料与电芯", detail: "上游制造", evidenceIds: ["S02"] }, { label: "系统集成", detail: "PCS、BMS、EMS与安全", evidenceIds: ["S01"] }, { label: "项目建设", detail: "规划、EPC与并网", evidenceIds: ["S04"] }, { label: "运营交易", detail: "调度、运维与收益", evidenceIds: ["S01"] }], implication: "国资平台可通过项目资本金、系统能力和运营协同进入。" },
    { title: "应用领域与产品价值图", question: "谁用、谁买、谁付费？", nodes: [{ label: "独立储能", detail: "容量与辅助服务", evidenceIds: ["S01"] }, { label: "新能源配套", detail: "消纳与调节", evidenceIds: ["S01"] }, { label: "工商业", detail: "峰谷套利与需量", evidenceIds: ["S01"] }], implication: "先确认调用和付费机制，再测算项目价值。" },
    { title: "技术路线与投资优先级图", question: "技术何时值得投入？", nodes: [{ label: "锂离子", detail: "规模化尽调", evidenceIds: ["S01"] }, { label: "全钒液流", detail: "长时项目验证", evidenceIds: ["S04"] }, { label: "压缩空气", detail: "地质与项目验证", evidenceIds: ["S02"] }], implication: "成熟度不等于投资优先级，所有路线均需经济性与安全里程碑。" },
    { title: "区域分布与产业布局图", question: "在哪里做什么？", nodes: [{ label: "武汉", detail: "研发、资本与交易", evidenceIds: ["S02"] }, { label: "宜昌", detail: "长时储能实证", evidenceIds: ["S04"] }, { label: "外部领先区域", detail: "运营经验导入", evidenceIds: ["S01"] }], implication: "公共资源与主体自有资源需分开核验。" },
  ],
  lists: ["产业集群清单", "政策清单", "重点企业清单", "重点项目清单", "产业问题清单"].map((name, i) => ({ name, items: [{ name: ["武汉—宜昌节点", "国家与湖北政策", "系统集成标杆", "宜昌液流项目", "收益与安全边界"][i], type: name.replace("清单", ""), status: "公开可核验", region: i === 0 || i === 3 ? "湖北省" : "全国", summary: "示范记录，真实任务将通过在线检索自动扩展。", evidenceIds: [i === 3 ? "S04" : "S01"], nextAction: "进入专题核验" }, { name: "数据缺口项", type: "待核", status: "待补充", region: "湖北省", summary: "需补充主体授权与项目经营数据。", evidenceIds: [], nextAction: "转为尽调任务" }] })),
  scores: [
    { name: "锂离子储能系统集成", type: "方向", score: 82, status: "进入尽调", rationale: "市场基础和项目适配度较高", evidenceIds: ["S01", "S02"] },
    { name: "全钒液流储能", type: "方向", score: 71, status: "项目验证", rationale: "长时价值明确，经济性待核", evidenceIds: ["S04"] },
    { name: "压缩空气储能", type: "方向", score: 68, status: "项目验证", rationale: "资源禀赋和工程条件关键", evidenceIds: ["S02"] },
  ],
  sources: [
    { id: "S01", publisher: "国家能源局", title: "2025年新型储能发展情况", date: "2026-01-30", url: "https://www.nea.gov.cn/", grade: "A", sourceType: "政府", used: "市场规模、技术结构" },
    { id: "S02", publisher: "工业和信息化部等八部门", title: "新型储能制造业高质量发展行动方案解读", date: "2025-02-17", url: "https://www.miit.gov.cn/", grade: "A", sourceType: "政府", used: "产业边界、技术方向" },
    { id: "S04", publisher: "湖北省经济和信息化厅", title: "宜昌首个新型储能项目成功并网", date: "2026-01-21", url: "https://jxt.hubei.gov.cn/", grade: "A", sourceType: "政府", used: "湖北项目与液流路线" },
    { id: "S05", publisher: "国家标准委", title: "储能电站安全监测技术导则", date: "2024-10-26", url: "https://openstd.samr.gov.cn/", grade: "A", sourceType: "标准", used: "安全门槛" },
    { id: "S07", publisher: "能源监管机构", title: "辅助服务市场运行资料", date: "2025-11-14", url: "https://www.nea.gov.cn/", grade: "B", sourceType: "监管", used: "收益机制参照" },
  ],
  dataGaps: [{ item: "湖北项目CAPEX", impact: "无法形成可靠IRR", nextAction: "获取可研和决算" }, { item: "容量租赁与结算合同", impact: "收入确定性不足", nextAction: "核验合同与回款" }],
  slides: [{ title: "封面", subtitle: "新型储能产业投资研究", bullets: [], evidenceIds: [] }],
};

function makeId() { return `R-${Date.now().toString(36).toUpperCase()}`; }
function Badge({ children, tone = "blue" }: { children: React.ReactNode; tone?: string }) { return <span className={`badge badge-${tone}`}>{children}</span>; }

export default function Home() {
  const [tasks, setTasks] = useState<StoredTask[]>([]);
  const [selectedId, setSelectedId] = useState("sample-storage");
  const [showCreate, setShowCreate] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [form, setForm] = useState<{ industry: string; region: string; entity: string; focus: string; provider: "qwen" | "openai" }>({ industry: "低空经济", region: "湖北省", entity: "地方国资产业投资平台", focus: "产业链机会、区域布局、可落地项目与尽调优先级", provider: "qwen" });
  const [updateScope, setUpdateScope] = useState<Scope | null>(null);
  const [source, setSource] = useState<ResearchResult["sources"][number] | null>(null);
  const [busy, setBusy] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const activeRequest = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const restored: StoredTask[] = JSON.parse(localStorage.getItem("industry-research-tasks-v2") || "[]");
        setTasks(restored.map(task => task.status === "running" ? {
          ...task,
          status: "failed",
          stage: "任务已中断",
          error: "页面刷新或研究服务重启后，原实时连接已断开。请重新运行该任务。",
          updatedAt: new Date().toISOString(),
        } : task));
      } catch { setTasks([]); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);
  useEffect(() => { if (tasks.length) localStorage.setItem("industry-research-tasks-v2", JSON.stringify(tasks.slice(0, 12))); }, [tasks]);

  const selectedTask = tasks.find(t => t.id === selectedId);
  const result = selectedId === "sample-storage" ? sample : selectedTask?.result;
  const activeTask = selectedId === "sample-storage" ? { id: "sample-storage", industry: "新型储能", region: "湖北省", entity: sample.meta.entity, status: "completed" as const, progress: 100, stage: "示范研究已完成", createdAt: sample.meta.generatedAt, updatedAt: sample.meta.generatedAt, fileNames: [], result: sample } : selectedTask;
  const completed = tasks.filter(t => t.status === "completed").length;
  const totalRecords = result ? result.lists.reduce((n, l) => n + l.items.length, 0) + result.sources.length : 0;

  const upsert = (id: string, patch: Partial<StoredTask>) => setTasks(prev => prev.some(t => t.id === id) ? prev.map(t => t.id === id ? { ...t, ...patch } : t) : prev);

  async function runResearch(mode: "full" | "update", scope?: Scope) {
    const base = mode === "update" && activeTask?.result ? activeTask : undefined;
    const id = base?.id || makeId();
    const data = base ? { industry: base.industry, region: base.region, entity: base.entity, provider: base.provider || "openai" as const } : form;
    const now = new Date().toISOString();
    const task: StoredTask = base ? { ...base, status: "running", progress: 2, stage: `正在更新${scope}`, updatedAt: now } : { id, provider: data.provider, industry: data.industry, region: data.region, entity: data.entity, status: "running", progress: 2, stage: "正在建立研究任务", createdAt: now, updatedAt: now, fileNames: files.map(f => f.name) };
    setTasks(prev => [task, ...prev.filter(t => t.id !== id)]);
    setSelectedId(id); setShowCreate(false); setUpdateScope(null); setBusy(true);
    const body = new FormData();
    body.set("taskId", id); body.set("industry", data.industry); body.set("region", data.region); body.set("entity", data.entity); body.set("provider", data.provider); body.set("mode", mode); body.set("focus", form.focus);
    if (scope) body.set("updateScope", scope);
    if (base?.result) body.set("existing", JSON.stringify(base.result));
    files.forEach(file => body.append("files", file));
    const requestController = new AbortController();
    activeRequest.current = requestController;
    try {
      const response = await fetch("/api/research", { method: "POST", body, signal: requestController.signal });
      if (!response.ok || !response.body) { const err = await response.json().catch(() => ({})); throw new Error(err.error || `请求失败（${response.status}）`); }
      const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
      let terminalEvent = false;
      const processBlock = (block: string) => {
        const data = getSseData(block); if (!data || data === "[DONE]") return;
        const event = JSON.parse(data);
        if (event.type === "progress") upsert(id, { progress: event.progress, stage: event.stage, updatedAt: new Date().toISOString() });
        if (event.type === "result") { terminalEvent = true; upsert(id, { status: "completed", progress: 100, stage: event.stage, result: event.result, updatedAt: new Date().toISOString() }); }
        if (event.type === "error") { terminalEvent = true; throw new Error(event.error); }
      };
      while (true) {
        const { done, value } = await reader.read(); if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parsed = splitSseBlocks(buffer); buffer = parsed.rest;
        parsed.blocks.forEach(processBlock);
      }
      buffer += decoder.decode();
      if (buffer.trim()) processBlock(buffer);
      if (!terminalEvent) throw new Error("研究连接提前结束，请重新运行任务");
    } catch (error) {
      const cancelled = requestController.signal.aborted;
      upsert(id, { status: "failed", stage: cancelled ? "任务已终止" : "任务失败", error: cancelled ? "你已终止本次研究，可调整范围后重新运行。" : error instanceof Error ? error.message : "任务失败", updatedAt: new Date().toISOString() });
    } finally {
      if (activeRequest.current === requestController) activeRequest.current = null;
      setBusy(false); setFiles([]);
    }
  }

  const stageIndex = useMemo(() => Math.min(phases.length - 1, Math.floor((activeTask?.progress || 0) / 18)), [activeTask?.progress]);

  return <main className="app-shell">
    <header className="topbar">
      <button className="brand" onClick={() => setSelectedId("sample-storage")}><span className="brand-seal">研</span><span><strong>产业投资研究 Agent</strong><small>LIVE RESEARCH WORKBENCH · PHASE 2</small></span></button>
      <div className="top-summary"><span><b>{tasks.length}</b> 研究任务</span><span><b>{completed}</b> 已完成</span><button className="primary-button" onClick={() => setShowCreate(true)}>＋ 创建研究任务</button></div>
    </header>

    <aside className="task-sidebar">
      <div className="sidebar-title"><span>RESEARCH TASKS</span><button onClick={() => setShowCreate(true)}>＋</button></div>
      <button className={`task-card ${selectedId === "sample-storage" ? "active" : ""}`} onClick={() => setSelectedId("sample-storage")}><div><Badge tone="orange">示范</Badge><small>已完成</small></div><strong>新型储能</strong><span>湖北省 · 四图五清单</span><i><em style={{ width: "100%" }} /></i></button>
      {tasks.map(task => <button key={task.id} className={`task-card ${selectedId === task.id ? "active" : ""}`} onClick={() => setSelectedId(task.id)}><div><Badge tone={task.status === "completed" ? "blue" : task.status === "failed" ? "red" : "orange"}>{task.status === "completed" ? "完成" : task.status === "failed" ? "失败" : "研究中"}</Badge><small>{task.provider === "qwen" ? "QWEN" : "OPENAI"} · {task.progress}%</small></div><strong>{task.industry}</strong><span>{task.region} · {task.fileNames.length}份材料</span><i><em style={{ width: `${task.progress}%` }} /></i></button>)}
      <div className="sidebar-note"><i />研究结果保存在当前浏览器；内部材料仅随本次研究请求发送。</div>
    </aside>

    <section className="workspace">
      {!activeTask ? <div className="empty-state"><span>研</span><h1>开始一项新的产业研究</h1><p>支持任意产业、任意区域和不同投资主体。</p><button className="primary-button" onClick={() => setShowCreate(true)}>创建研究任务</button></div> : <>
        <div className="workspace-head"><div><div className="eyebrow"><Badge tone={activeTask.status === "completed" ? "blue" : activeTask.status === "failed" ? "red" : "orange"}>{activeTask.status === "completed" ? "研究已完成" : activeTask.status === "failed" ? "需要处理" : "Agent 正在运行"}</Badge><span>{activeTask.id} · {activeTask.provider === "qwen" ? "Qwen3.8-Max" : activeTask.id === "sample-storage" ? "示范数据" : "OpenAI"}</span></div><h1>{activeTask.industry}<small>产业投资研究</small></h1><p>{activeTask.region} · {activeTask.entity}</p></div><div className="head-actions">{result && <><button className="outline-button" onClick={() => downloadXlsx(result)}>下载数据库 .xlsx</button><button className="primary-button" onClick={() => downloadPptx(result)}>直接生成 PPTX ↘</button></>}</div></div>

        {activeTask.status !== "completed" && <section className="run-panel"><div className="run-status"><div className={`agent-orb ${activeTask.status}`}><span>研</span></div><div><small>{activeTask.provider === "qwen" ? "QWEN3.8-MAX" : "OPENAI"} · 当前阶段</small><h2>{activeTask.stage}</h2><p>{activeTask.error || "研究过程会实时回传检索、核验和结构化进度。"}</p></div><strong>{activeTask.progress}%</strong></div><div className="master-progress"><i style={{ width: `${activeTask.progress}%` }} /></div><div className="phase-track">{phases.map((p, i) => <div className={i <= stageIndex ? "done" : ""} key={p}><span>{i < stageIndex ? "✓" : `0${i + 1}`}</span><b>{p}</b></div>)}</div>{activeTask.status === "running" && busy && <button className="outline-button retry" onClick={() => activeRequest.current?.abort()}>终止本次任务</button>}{activeTask.status === "failed" && <button className="outline-button retry" onClick={() => { setForm({ ...form, industry: activeTask.industry, region: activeTask.region, entity: activeTask.entity, provider: activeTask.provider || "openai" }); setShowCreate(true); }}>修改配置后重试</button>}</section>}

        {result && <>
          <section className="decision-hero"><div><span>DECISION BRIEF</span><h2>{result.executiveSummary}</h2></div><div className="research-metrics"><div><strong>4</strong><span>决策图谱</span></div><div><strong>5</strong><span>管理清单</span></div><div><strong>{totalRecords}</strong><span>结构化记录</span></div><div><strong>{result.sources.length}</strong><span>可追溯来源</span></div></div></section>
          <section className="verdict-grid">{result.verdicts.slice(0, 3).map((v, i) => <article key={v.title} className={i === 0 ? "featured" : ""}><div><span>0{i + 1}</span><Badge tone={i === 0 ? "orange" : "blue"}>{v.level}</Badge></div><h3>{v.title}</h3><p>{v.rationale}</p><small>证据：{v.evidenceIds.join(" · ") || "待核"}</small></article>)}</section>
          <div className="section-heading"><div><span>FOUR MAPS</span><h2>四张图，形成一条判断链</h2></div><p>产业位置 → 应用价值 → 技术窗口 → 区域落点</p></div>
          <section className="maps-grid">{result.maps.map((map, i) => <article key={map.title}><div className="map-num">0{i + 1}</div><h3>{map.title}</h3><p>{map.question}</p><div className="node-row">{map.nodes.slice(0, 4).map(node => <span key={node.label}><b>{node.label}</b><small>{node.detail}</small></span>)}</div><footer><b>主体含义</b>{map.implication}</footer></article>)}</section>
          <div className="section-heading"><div><span>FIVE LISTS</span><h2>五张清单，支持局部更新</h2></div><p>点击企业、政策或项目更新，只重跑对应模块。</p></div>
          <section className="lists-grid">{result.lists.map((list, i) => <article key={list.name}><span>0{i + 1}</span><h3>{list.name}</h3><strong>{list.items.length} 条记录</strong><ul>{list.items.slice(0, 3).map(item => <li key={item.name}><b>{item.name}</b><small>{item.status} · {item.evidenceIds.join(",") || "待核"}</small></li>)}</ul></article>)}</section>
          <section className="update-panel"><div><span>INCREMENTAL UPDATE</span><h2>保持研究常新，不必从头重做</h2><p>复用当前数据库和证据链，更新目标模块后重新生成 Excel 与 PPTX。</p></div><div>{(["企业", "政策", "项目"] as Scope[]).map(scope => <button key={scope} disabled={busy} onClick={() => setUpdateScope(scope)}>更新{scope}<b>→</b></button>)}</div></section>
          <div className="section-heading"><div><span>PROVENANCE</span><h2>证据来源台账</h2></div><p>公开来源与内部材料分级展示。</p></div>
          <section className="source-ledger"><div className="ledger-head"><span>ID</span><span>来源与标题</span><span>用途</span><span>等级</span></div>{result.sources.map(s => <button key={s.id} onClick={() => setSource(s)}><b>{s.id}</b><span><strong>{s.publisher}</strong><small>{s.title} · {s.date}</small></span><em>{s.used}</em><Badge tone={s.sourceType === "内部材料" ? "orange" : "blue"}>{s.grade}级</Badge></button>)}</section>
          <section className="export-panel"><div><Badge tone="orange">REAL FILE OUTPUT</Badge><h2>17张专业底表与25页可编辑决策PPTX</h2><p>逐页学习养老机器人母版的决策逻辑，覆盖四图及分析、五清单及筛选、主体资源、评分、经济性、风险和行动计划。</p></div><button onClick={() => downloadPptx(result)}>生成并下载 PowerPoint <b>↘</b></button><button onClick={() => downloadXlsx(result)}>生成并下载研究数据库 <b>↘</b></button></section>
        </>}
      </>}
    </section>

    {showCreate && <div className="modal-backdrop" onClick={() => setShowCreate(false)}><section className="project-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setShowCreate(false)}>×</button><div className="eyebrow"><Badge tone="orange">NEW RESEARCH</Badge><span>任意产业 · 真实在线研究</span></div><h2>创建产业研究任务</h2><div className="provider-switch"><button className={form.provider === "qwen" ? "active" : ""} onClick={() => { setForm({ ...form, provider: "qwen" }); setFiles([]); }}><b>通义千问</b><small>Qwen3.8-Max · 中文联网研究</small></button><button className={form.provider === "openai" ? "active" : ""} onClick={() => { setForm({ ...form, provider: "openai" }); setFiles([]); }}><b>OpenAI</b><small>复杂文件与结构化研究</small></button></div><div className="form-grid"><label>目标产业<input value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} placeholder="例如：商业航天、合成生物、低空经济" /></label><label>核心区域<input value={form.region} onChange={e => setForm({ ...form, region: e.target.value })} /></label><label className="full">实施主体<input value={form.entity} onChange={e => setForm({ ...form, entity: e.target.value })} /></label><label className="full">研究重点<textarea value={form.focus} onChange={e => setForm({ ...form, focus: e.target.value })} /></label></div><div className="upload-zone" onClick={() => fileInput.current?.click()}><input ref={fileInput} type="file" multiple accept={form.provider === "qwen" ? ".csv,.txt,.md,.json" : ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.md"} onChange={e => setFiles(Array.from(e.target.files || []))} /><span>＋</span><strong>上传内部材料</strong><p>{form.provider === "qwen" ? "千问当前直读 TXT、Markdown、CSV、JSON；复杂文档请选择 OpenAI" : "PDF、Word、PPT、Excel、CSV、TXT；最多8份，合计18MB"}</p>{files.length > 0 && <div>{files.map(f => <em key={f.name}>{f.name} · {(f.size / 1024 / 1024).toFixed(1)}MB</em>)}</div>}</div><div className="output-checks"><span>将自动生成</span><b>17张专业底表</b><b>四图五清单</b><b>分层评分与三情景测算</b><b>25页可编辑PPTX</b></div><button className="primary-button launch" disabled={!form.industry || busy} onClick={() => runResearch("full")}>启动 {form.provider === "qwen" ? "Qwen3.8-Max" : "OpenAI"} 研究 →</button><p className="security-note">API Key 只由服务端秘密变量读取；内部材料不会写入公开来源或浏览器存储。</p></section></div>}

    {updateScope && result && <div className="modal-backdrop" onClick={() => setUpdateScope(null)}><section className="update-modal" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setUpdateScope(null)}>×</button><Badge tone="orange">局部更新</Badge><h2>更新{updateScope}模块</h2><p>Agent 将复用现有研究，重新检索和核验{updateScope}信息，并同步刷新受影响的图、清单、评分、来源与PPT。</p><label>补充内部材料（可选）<input type="file" multiple onChange={e => setFiles(Array.from(e.target.files || []))} /></label><button className="primary-button launch" onClick={() => runResearch("update", updateScope)}>开始更新{updateScope} →</button></section></div>}

    {source && <div className="drawer-backdrop" onClick={() => setSource(null)}><aside className="source-drawer" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setSource(null)}>×</button><Badge tone={source.sourceType === "内部材料" ? "orange" : "blue"}>{source.grade}级 · {source.sourceType}</Badge><h2>{source.title}</h2><dl><div><dt>发布主体</dt><dd>{source.publisher}</dd></div><div><dt>发布日期</dt><dd>{source.date}</dd></div><div><dt>支撑内容</dt><dd>{source.used}</dd></div></dl>{source.url && source.url !== "内部材料" ? <a className="primary-button" href={source.url} target="_blank" rel="noreferrer">打开原始来源 ↗</a> : <p className="internal-note">内部材料不提供公开链接，仅在本次研究证据链中引用。</p>}</aside></div>}
  </main>;
}
