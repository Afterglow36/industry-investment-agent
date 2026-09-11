"use client";

import { useMemo, useState } from "react";

type CaseKey = "storage" | "eldercare";
type SectionKey = "overview" | "process" | "maps" | "lists" | "scoring" | "sources" | "deliverables";

const navigation: { id: SectionKey; label: string; mark: string }[] = [
  { id: "overview", label: "决策总览", mark: "总" },
  { id: "process", label: "研究过程", mark: "研" },
  { id: "maps", label: "四图", mark: "图" },
  { id: "lists", label: "五清单", mark: "清" },
  { id: "scoring", label: "评分与测算", mark: "评" },
  { id: "sources", label: "证据溯源", mark: "证" },
  { id: "deliverables", label: "成果中心", mark: "果" },
];

const sources = [
  { id: "S01", publisher: "国家能源局", title: "2025年新型储能发展情况", date: "2026-01-30", grade: "A", url: "https://www.nea.gov.cn/20260130/50f657ce87f848e1a9a1861d1fd9aa23/c.html", used: "市场规模、技术结构、利用水平" },
  { id: "S02", publisher: "工业和信息化部等八部门", title: "新型储能制造业高质量发展行动方案解读", date: "2025-02-17", grade: "A", url: "https://www.miit.gov.cn/zwgk/zcjd/art/2025/art_d2cdb0db114246dab18d95b2ff2a2824.html", used: "产业边界、技术方向、产业秩序" },
  { id: "S04", publisher: "湖北省经济和信息化厅", title: "宜昌首个新型储能项目成功并网", date: "2026-01-21", grade: "A", url: "https://jxt.hubei.gov.cn/bmdt/szgz/202601/t20260121_5860531.shtml", used: "湖北项目、液流路线、区域落点" },
  { id: "S05", publisher: "市场监管总局、国家标准委", title: "GB/T 44767-2024 安全监测技术导则", date: "2024-10-26", grade: "A", url: "https://openstd.samr.gov.cn/bzgk/std/newGbInfo?hcno=5FA0CEFF0CF542D232EA0E89905DB6E4", used: "安全门槛、项目尽调" },
  { id: "S07", publisher: "湖南能源监管办", title: "湖南调峰辅助服务市场运行情况", date: "2025-11-14", grade: "B", url: "https://www.nea.gov.cn/20251114/4f1068f616e945d282655926b6bac54f/c.html", used: "外部收益参照，不直接代入湖北" },
];

const cases = {
  storage: {
    name: "新型储能",
    label: "泛化验证案例",
    entity: "湖北省地方国资产业投资平台（假设主体）",
    region: "湖北省",
    date: "2026-09-11",
    lead: "从设备制造转向系统集成、项目运营与安全能力，用真实项目数据决定资本进入节奏。",
    verdicts: [
      { level: "优先尽调", title: "锂离子储能系统集成", text: "规模基础最明确，重点核验订单质量、安全责任与湖北项目协同。", tone: "orange" },
      { level: "项目验证", title: "全钒液流与压缩空气", text: "长时储能窗口成立，但必须用可研、效率、CAPEX和运行数据解锁投资。", tone: "blue" },
      { level: "暂缓规模化", title: "同质化电芯扩产", text: "政策已提示防止低水平重复建设，不以新增通用产能作为第一切入口。", tone: "gray" },
    ],
    stats: [
      ["136 GW", "2025年底全国装机功率"],
      ["351 GWh", "2025年底全国储能容量"],
      ["51.2%", "独立储能累计占比"],
      ["1,195 h", "全年等效利用小时"],
    ],
  },
  eldercare: {
    name: "养老机器人",
    label: "原始方法案例",
    entity: "武汉城市建设投资开发集团有限公司",
    region: "武汉市",
    date: "2026-07-31",
    lead: "从老龄需求拆到具体任务、产品、采购者和付费者，再匹配城市场景与产业投资工具。",
    verdicts: [
      { level: "产品主线", title: "助行、护理与康复产品", text: "优先选择需求明确、可在机构或社区完成真实场景验证的产品方向。", tone: "orange" },
      { level: "场景主线", title: "机构—社区—居家分层", text: "按使用者、采购者与付费者拆分，避免把人口需求直接当成市场收入。", tone: "blue" },
      { level: "产业主线", title: "核心部件与系统能力", text: "用产品落地牵引本体、感知、控制与服务生态，不只罗列整机企业。", tone: "gray" },
    ],
    stats: [
      ["4 张", "产业决策图谱"],
      ["5 类", "完整管理清单"],
      ["多场景", "机构·社区·居家"],
      ["全链路", "数据到管理层PPT"],
    ],
  },
};

const process = [
  ["01", "定义研究边界", "产业、地区、主体、资本工具和数据截止日"],
  ["02", "两轮证据检索", "先建全景，再补缺口、核重点对象与争议信息"],
  ["03", "建立事实数据库", "每条记录关联发布主体、日期、链接、可信度和待核状态"],
  ["04", "形成四图五清单", "从事实组织产业位置、价值、技术窗口和区域落点"],
  ["05", "评分与经济性", "权重随主体变化；缺失数据不默认为高分"],
  ["06", "一致性与视觉检查", "逐表逐页核对来源、数字、结论和交付物"],
];

const maps = [
  { title: "产业链全景图", question: "价值与能力分布在哪里？", result: "上游电芯与材料｜中游功率控制和集成｜下游项目建设｜运营交易与安全服务", tags: ["价值环节", "进入方式", "盈利代理指标"] },
  { title: "应用领域与产品价值图", question: "谁用、谁买、谁付费？", result: "独立储能｜新能源配套｜电网侧｜工商业用户侧｜调频与能量搬移", tags: ["任务", "采购主体", "收益来源"] },
  { title: "技术路线与投资优先级图", question: "技术何时值得投入？", result: "锂离子规模化｜液流/压缩空气项目验证｜钠离子里程碑观察｜安全与控制底层必选", tags: ["TRL", "验证周期", "投资门槛"] },
  { title: "区域分布与产业布局图", question: "主体应该在哪里做什么？", result: "武汉：研发资本与交易能力｜宜昌：长时储能实证｜全国领先省份：运营与项目经验导入", tags: ["核心承载", "协同区域", "外部导入"] },
];

const listData = [
  { name: "产业集群清单", count: "3类区域节点", text: "武汉研发与资本节点、宜昌长时储能实证节点、全国运营经验导入区。" },
  { name: "政策清单", count: "5项重点政策", text: "同时提炼技术创新、示范应用等支持项，以及安全和反低水平重复等约束项。" },
  { name: "重点企业清单", count: "首轮标杆池", text: "龙头只作行业标杆；本地对象需通过工商、项目和招投标证据继续扩充。" },
  { name: "重点项目清单", count: "1项实证样本", text: "宜昌长阳50MW/200MWh全钒液流项目进入运营与收益数据尽调。" },
  { name: "产业问题清单", count: "4项核心问题", text: "收益机制、安全责任、同质竞争与技术路线集中度均形成验证指标和重启条件。" },
];

const scoreBase = [
  { name: "锂离子储能系统集成", scores: [5, 4, 4, 5, 4, 3] },
  { name: "压缩空气长时储能", scores: [4, 3, 3, 3, 5, 3] },
  { name: "全钒液流电池储能", scores: [4, 4, 2, 3, 4, 3] },
  { name: "钠离子电池储能", scores: [3, 3, 2, 3, 3, 2] },
];
const weightNames = ["市场政策", "技术安全", "经济性", "区域协同", "国资适配", "风险退出"];

function Badge({ children, tone = "blue" }: { children: React.ReactNode; tone?: string }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export default function Home() {
  const [activeCase, setActiveCase] = useState<CaseKey>("storage");
  const [section, setSection] = useState<SectionKey>("overview");
  const [activeMap, setActiveMap] = useState(0);
  const [activeList, setActiveList] = useState(0);
  const [selectedSource, setSelectedSource] = useState<(typeof sources)[number] | null>(null);
  const [weights, setWeights] = useState([20, 20, 20, 20, 10, 10]);
  const [showProject, setShowProject] = useState(false);
  const [project, setProject] = useState({ industry: "低空经济", entity: "地方国资产业投资平台", region: "湖北省" });
  const current = cases[activeCase];
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  const ranked = useMemo(() => scoreBase.map((item) => ({
    ...item,
    total: Math.round(item.scores.reduce((sum, value, index) => sum + value * weights[index], 0) / Math.max(totalWeight, 1) * 20),
  })).sort((a, b) => b.total - a.total), [weights, totalWeight]);

  const jump = (id: SectionKey) => {
    setSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <main>
      <header className="topbar">
        <button className="brand" onClick={() => jump("overview")} aria-label="返回总览">
          <span className="brand-seal">研</span>
          <span><strong>产业投资研究 Agent</strong><small>Evidence-led investment research</small></span>
        </button>
        <div className="top-actions">
          <div className="case-switch" aria-label="切换展示案例">
            <button className={activeCase === "storage" ? "active" : ""} onClick={() => setActiveCase("storage")}>新型储能</button>
            <button className={activeCase === "eldercare" ? "active" : ""} onClick={() => setActiveCase("eldercare")}>养老机器人</button>
          </div>
          <button className="primary-button" onClick={() => setShowProject(true)}>＋ 创建研究任务</button>
        </div>
      </header>

      <aside className="sidebar" aria-label="网站导航">
        <div className="sidebar-line" />
        {navigation.map((item) => (
          <button key={item.id} className={section === item.id ? "active" : ""} onClick={() => jump(item.id)}>
            <span>{item.mark}</span><em>{item.label}</em>
          </button>
        ))}
        <div className="sidebar-status"><i /> Agent ready<small>数据截止 {current.date}</small></div>
      </aside>

      <div className="page-shell">
        <section className="hero" id="overview">
          <div className="hero-copy">
            <div className="eyebrow"><Badge tone="orange">{current.label}</Badge><span>{current.region} · {current.entity}</span></div>
            <h1>让每一条产业判断，<br /><span>都能回到证据。</span></h1>
            <p>{current.lead}</p>
            <div className="hero-actions">
              <button className="primary-button large" onClick={() => jump("maps")}>查看研究成果 <b>→</b></button>
              <button className="text-button" onClick={() => jump("sources")}>打开证据链 <b>↗</b></button>
            </div>
          </div>
          <div className="evidence-console">
            <div className="console-head"><span>结论证据链 · LIVE</span><i /><i /><i /></div>
            <button className="evidence-node conclusion" onClick={() => jump("scoring")}>
              <small>管理层结论</small><strong>{current.verdicts[0].title}</strong><span>优先纳入下一轮尽调</span>
            </button>
            <div className="connector"><span>由评分与事实共同支持</span></div>
            <div className="record-row">
              <button className="evidence-node"><small>数据库记录</small><strong>{activeCase === "storage" ? "R-MARKET-01" : "产品与场景记录"}</strong><span>事实 · 已核验</span></button>
              <button className="evidence-node source" onClick={() => setSelectedSource(sources[0])}><small>原始来源</small><strong>{activeCase === "storage" ? "国家能源局" : "公开资料与工作底稿"}</strong><span>点击查看详情 ↗</span></button>
            </div>
            <div className="console-foot"><span>事实</span><span>企业披露</span><span>研究判断</span><span>待核实</span></div>
          </div>
        </section>

        <section className="metric-strip" aria-label="案例关键指标">
          {current.stats.map(([value, label]) => <div key={label}><strong>{value}</strong><span>{label}</span></div>)}
          <button onClick={() => jump("sources")}>全部可追溯 <b>→</b></button>
        </section>

        <section className="section-block verdict-section">
          <div className="section-title"><span>DECISION BRIEF</span><h2>这项研究，最终要回答三件事</h2><p>不是行业资料汇编，而是进入、验证与暂停的决策边界。</p></div>
          <div className="verdict-grid">
            {current.verdicts.map((v, index) => (
              <article className={`verdict-card ${v.tone}`} key={v.title}>
                <div><span>0{index + 1}</span><Badge tone={v.tone}>{v.level}</Badge></div>
                <h3>{v.title}</h3><p>{v.text}</p>
                <button onClick={() => index === 0 ? jump("scoring") : jump("lists")}>查看判断依据 →</button>
              </article>
            ))}
          </div>
        </section>

        <section className="section-block process-section" id="process">
          <div className="section-title split"><div><span>RESEARCH TRACE</span><h2>研究过程不是黑箱</h2></div><p>每一步都有输入、输出与校验条件。<br />只有数据库先成立，图和PPT才能成立。</p></div>
          <div className="process-track">
            {process.map(([num, title, text], index) => <article key={num}><div className="step-num">{num}</div><div><h3>{title}</h3><p>{text}</p></div><span className="step-state">{index < 5 ? "已完成" : "已通过"}</span></article>)}
          </div>
        </section>

        <section className="section-block maps-section" id="maps">
          <div className="section-title split"><div><span>FOUR DECISION MAPS</span><h2>四张图，形成一条判断链</h2></div><p>点击图名切换。每张图回答一个不同的投资问题。</p></div>
          <div className="map-workbench">
            <div className="map-tabs">
              {maps.map((m, index) => <button key={m.title} className={activeMap === index ? "active" : ""} onClick={() => setActiveMap(index)}><span>0{index + 1}</span><strong>{m.title}</strong><small>{m.question}</small></button>)}
            </div>
            <div className="map-canvas">
              <div className="map-head"><div><Badge tone="orange">图 {activeMap + 1}</Badge><h3>{maps[activeMap].title}</h3></div><button onClick={() => setSelectedSource(sources[activeMap === 2 ? 1 : activeMap === 3 ? 2 : 0])}>查看图表来源 ↗</button></div>
              <p className="map-question">{maps[activeMap].question}</p>
              <div className={`diagram diagram-${activeMap}`}>
                {maps[activeMap].result.split("｜").map((part, index) => <div key={part}><span>{String(index + 1).padStart(2, "0")}</span><strong>{part.split("：")[0]}</strong><small>{part.split("：")[1] || maps[activeMap].tags[index % maps[activeMap].tags.length]}</small></div>)}
              </div>
              <div className="map-insight"><span>主体含义</span><p>{activeMap === 0 ? "地方国资更适合通过系统能力、项目资本金和运营协同进入，而非简单复制通用制造产能。" : activeMap === 1 ? "先确认采购、调用和付费机制，再测算项目价值；宏观需求不能直接等同收入。" : activeMap === 2 ? "成熟度不等于投资优先级，所有路线都需通过安全、经济性和真实项目里程碑。" : "区域公共资源与主体自有资源必须分开，空间建议需等待授权和权属核实。"}</p></div>
            </div>
          </div>
        </section>

        <section className="section-block lists-section" id="lists">
          <div className="section-title split"><div><span>FIVE MANAGEMENT LISTS</span><h2>五张清单，把研究变成可管理对象</h2></div><p>PPT展示重点对象，完整记录保留在数据库。</p></div>
          <div className="list-browser">
            <div className="list-menu">{listData.map((item, index) => <button key={item.name} className={activeList === index ? "active" : ""} onClick={() => setActiveList(index)}><span>0{index + 1}</span>{item.name}<b>→</b></button>)}</div>
            <div className="list-detail">
              <div><Badge tone="blue">{listData[activeList].count}</Badge><h3>{listData[activeList].name}</h3><p>{listData[activeList].text}</p></div>
              <table><thead><tr><th>对象</th><th>证据状态</th><th>下一步动作</th></tr></thead><tbody>
                <tr><td>{activeList === 0 ? "湖北核心节点" : activeList === 1 ? "国家与湖北政策" : activeList === 2 ? "产业标杆与本地对象" : activeList === 3 ? "已发生项目" : "高影响问题"}</td><td><Badge tone="blue">公开可核验</Badge></td><td>进入专题核验</td></tr>
                <tr><td>{activeList === 4 ? "安全与收益边界" : "数据缺口项"}</td><td><Badge tone="gray">待补充</Badge></td><td>转为尽调任务</td></tr>
              </tbody></table>
              <button className="text-button" onClick={() => jump("deliverables")}>下载完整清单 →</button>
            </div>
          </div>
        </section>

        <section className="section-block score-section" id="scoring">
          <div className="section-title split"><div><span>SCORING LAB</span><h2>权重跟着主体目标变化</h2></div><p>拖动权重，观察排序变化。评分只决定尽调优先级，不构成投资建议。</p></div>
          <div className="score-lab">
            <div className="weight-panel"><div className="panel-title"><h3>评分权重</h3><Badge tone={totalWeight === 100 ? "blue" : "orange"}>合计 {totalWeight}%</Badge></div>
              {weightNames.map((name, index) => <label key={name}><span>{name}<b>{weights[index]}%</b></span><input type="range" min="0" max="40" step="5" value={weights[index]} onChange={(e) => setWeights(weights.map((w, i) => i === index ? Number(e.target.value) : w))} /></label>)}
              <button className="reset" onClick={() => setWeights([20, 20, 20, 20, 10, 10])}>恢复国资平台模型</button>
            </div>
            <div className="ranking-panel"><div className="panel-title"><h3>方向排序</h3><span>动态计算 · 100分制</span></div>
              {ranked.map((item, index) => <div className="rank-row" key={item.name}><span className="rank">{index + 1}</span><div><strong>{item.name}</strong><small>{index === 0 ? "进入尽调" : index < 3 ? "项目验证" : "里程碑观察"}</small></div><div className="scorebar"><i style={{ width: `${item.total}%` }} /></div><b>{item.total}</b></div>)}
              <div className="model-note"><span>经济性模型状态</span><strong>等待项目数据</strong><p>缺少湖北CAPEX、合同与结算数据，当前不输出貌似精确的IRR。</p></div>
            </div>
          </div>
        </section>

        <section className="section-block source-section" id="sources">
          <div className="section-title split"><div><span>PROVENANCE LEDGER</span><h2>点击任何来源，查看它支撑了什么</h2></div><p>来源ID用于数据库关联；读者界面显示发布主体和原始链接。</p></div>
          <div className="source-table">
            <div className="source-head"><span>来源</span><span>资料名称</span><span>用途</span><span>等级</span></div>
            {sources.map((source) => <button key={source.id} onClick={() => setSelectedSource(source)}><span><b>{source.id}</b>{source.publisher}<small>{source.date}</small></span><strong>{source.title}</strong><em>{source.used}</em><Badge tone={source.grade === "A" ? "blue" : "gray"}>{source.grade}级</Badge></button>)}
          </div>
        </section>

        <section className="section-block deliver-section" id="deliverables">
          <div className="deliver-heading"><span>DELIVERABLES</span><h2>一套研究，四种可复用成果</h2><p>管理层看PPT，研究团队维护数据库，项目团队执行尽调，外部沟通使用四图。</p></div>
          <div className="deliver-grid">
            <a href={activeCase === "storage" ? "/downloads/新型储能产业投资研究_泛化测试数据库.xlsx" : "/downloads/养老机器人产业基础数据库.xlsx"} download><span>EXCEL</span><h3>产业基础数据库</h3><p>事实记录、来源索引、评分、ROI与数据缺口。</p><b>下载成果 ↘</b></a>
            <a href={activeCase === "storage" ? "/downloads/新型储能PPT逐页测试稿.md" : "/downloads/养老机器人四图五清单_20260731.pptx"} download><span>{activeCase === "storage" ? "STORYBOARD" : "POWERPOINT"}</span><h3>管理层汇报</h3><p>{activeCase === "storage" ? "26页逐页逻辑测试稿，可继续生成PPTX。" : "养老机器人四图五清单完整PPT成果。"}</p><b>下载成果 ↘</b></a>
            <button onClick={() => jump("maps")}><span>4 MAPS</span><h3>产业决策图谱</h3><p>价值位置、应用付费、技术窗口与区域落点。</p><b>在线查看 →</b></button>
            <a href={activeCase === "storage" ? "/downloads/新型储能泛化测试报告.md" : "/downloads/养老机器人产业基础数据库.xlsx"} download><span>AUDIT</span><h3>研究与校验记录</h3><p>记录检索饱和度、来源边界和待核事项。</p><b>下载成果 ↘</b></a>
          </div>
        </section>

        <footer><div><span className="brand-seal">研</span><strong>产业投资研究 Agent</strong></div><p>让研究结论可追溯，让投资动作可验证。</p><span>Research prototype · {current.date}</span></footer>
      </div>

      {selectedSource && <div className="drawer-backdrop" onClick={() => setSelectedSource(null)}><aside className="source-drawer" onClick={(e) => e.stopPropagation()}><button className="drawer-close" onClick={() => setSelectedSource(null)}>×</button><Badge tone={selectedSource.grade === "A" ? "blue" : "gray"}>{selectedSource.grade}级来源</Badge><h2>{selectedSource.title}</h2><dl><div><dt>发布主体</dt><dd>{selectedSource.publisher}</dd></div><div><dt>发布日期</dt><dd>{selectedSource.date}</dd></div><div><dt>支撑内容</dt><dd>{selectedSource.used}</dd></div><div><dt>核验状态</dt><dd>原始链接已核验</dd></div></dl><div className="source-warning">来源证明事实，不自动证明投资结论。研究判断仍需结合主体资源、项目经济性和风险边界。</div><a className="primary-button" href={selectedSource.url} target="_blank" rel="noreferrer">打开原始来源 ↗</a></aside></div>}

      {showProject && <div className="modal-backdrop" onClick={() => setShowProject(false)}><section className="project-modal" onClick={(e) => e.stopPropagation()}><button className="drawer-close" onClick={() => setShowProject(false)}>×</button><div className="eyebrow"><Badge tone="orange">NEW RESEARCH</Badge><span>建立标准化项目配置</span></div><h2>创建产业研究任务</h2><div className="form-grid"><label>目标产业<input value={project.industry} onChange={(e) => setProject({ ...project, industry: e.target.value })} /></label><label>核心区域<input value={project.region} onChange={(e) => setProject({ ...project, region: e.target.value })} /></label><label className="full">实施主体<input value={project.entity} onChange={(e) => setProject({ ...project, entity: e.target.value })} /></label></div><div className="generated-config"><span>任务将生成</span><div><b>01</b> 产业基础数据库</div><div><b>02</b> 四图五清单</div><div><b>03</b> 产品、企业与项目评分</div><div><b>04</b> 管理层PPT与尽调清单</div></div><button className="primary-button large" onClick={() => { setShowProject(false); alert(`已生成演示配置：${project.region} · ${project.industry} · ${project.entity}`); }}>生成项目配置 →</button><p className="modal-note">演示站仅生成任务配置；完整研究由已安装的 Agent 在 Codex 中执行。</p></section></div>}
    </main>
  );
}
