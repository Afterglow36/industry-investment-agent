"use client";

import { strToU8, zipSync } from "fflate";
import type { ResearchResult } from "./research-types";

const xml = (value: string) => value.replace(/[<>&'\"]/g, (char) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[char] || char);
const stamp = () => new Date().toISOString();
const safeName = (value: string) => value.replace(/[\\/:*?"<>|]/g, "-").slice(0, 70);
const download = (bytes: Uint8Array, name: string, type: string) => {
  const blob = new Blob([bytes as BlobPart], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1200);
};

const pText = (text: string, size = 22, color = "10233F", bold = false, align = "l") =>
  `<a:p><a:pPr algn="${align}"/><a:r><a:rPr lang="zh-CN" sz="${size * 100}" b="${bold ? 1 : 0}" dirty="0"><a:solidFill><a:srgbClr val="${color}"/></a:solidFill><a:latin typeface="Microsoft YaHei"/><a:ea typeface="Microsoft YaHei"/></a:rPr><a:t>${xml(text)}</a:t></a:r><a:endParaRPr lang="zh-CN" sz="${size * 100}"/></a:p>`;
const shape = (x: number, y: number, w: number, h: number, fill: string, paragraphs: string, line = fill) =>
  `<p:sp><p:nvSpPr><p:cNvPr id="${Math.round(x * 97 + y * 31 + w * 13)}" name="shape"/><p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${Math.round(x * 914400)}" y="${Math.round(y * 914400)}"/><a:ext cx="${Math.round(w * 914400)}" cy="${Math.round(h * 914400)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:solidFill><a:srgbClr val="${fill}"/></a:solidFill><a:ln w="6350"><a:solidFill><a:srgbClr val="${line}"/></a:solidFill></a:ln></p:spPr><p:txBody><a:bodyPr wrap="square" lIns="127000" rIns="127000" tIns="91440" bIns="91440" anchor="ctr"/><a:lstStyle/>${paragraphs}</p:txBody></p:sp>`;
const slideXml = (content: string) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>${content}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`;

function buildSlides(result: ResearchResult) {
  const slides: string[] = [];
  const footer = (n: number) => shape(.45, 7.08, 12.45, .18, "FFFFFF", pText(`产业投资研究 Agent  ·  ${result.meta.cutoff}  ·  ${n}`, 8, "607187"), "FFFFFF");
  slides.push(slideXml(
    shape(0, 0, 13.333, 7.5, "10233F", "", "10233F") +
    shape(.75, .72, 1.55, .36, "F28A32", pText("INVESTMENT RESEARCH", 9, "10233F", true, "ctr"), "F28A32") +
    shape(.75, 2.05, 11.4, 1.35, "10233F", pText(`${result.meta.industry}产业投资研究`, 38, "FFFFFF", true) + pText("四图五清单 · 可追溯决策版", 18, "A9BDD2"), "10233F") +
    shape(.75, 5.75, 11.4, .72, "10233F", pText(`${result.meta.region}｜${result.meta.entity}`, 14, "FFFFFF") + pText(`数据截止：${result.meta.cutoff}`, 10, "A9BDD2"), "10233F")
  ));
  const agenda = ["管理层结论", "四张产业决策图", "五张管理清单", "评分与优先级", "证据链与数据缺口"];
  slides.push(slideXml(shape(.55, .35, 12.2, .7, "FFFFFF", pText("研究结构", 28, "10233F", true), "FFFFFF") + agenda.map((t, i) => shape(.7 + (i % 3) * 4.13, 1.55 + Math.floor(i / 3) * 2.15, 3.78, 1.68, i === 0 ? "FFF0E4" : "E8F0F6", pText(`0${i + 1}`, 10, "F28A32", true) + pText(t, 18, "10233F", true), "D7E0E9")).join("") + footer(2)));
  slides.push(slideXml(shape(.55, .35, 12.2, .7, "FFFFFF", pText("管理层摘要", 28, "10233F", true), "FFFFFF") + shape(.7, 1.35, 11.9, 1.05, "FFF7EF", pText(result.executiveSummary, 15, "10233F"), "F2C49B") + result.verdicts.slice(0, 3).map((v, i) => shape(.7 + i * 4.05, 2.85, 3.72, 2.55, i === 0 ? "10233F" : "E8F0F6", pText(v.level, 9, i === 0 ? "F28A32" : "1D5C91", true) + pText(v.title, 17, i === 0 ? "FFFFFF" : "10233F", true) + pText(v.rationale, 11, i === 0 ? "D7E0E9" : "607187"), i === 0 ? "10233F" : "D7E0E9")).join("") + footer(3)));
  result.maps.slice(0, 4).forEach((map, mi) => {
    const nodes = map.nodes.slice(0, 6);
    slides.push(slideXml(shape(.55, .35, 12.2, .78, "FFFFFF", pText(`图 ${mi + 1}｜${map.title}`, 27, "10233F", true) + pText(map.question, 10, "607187"), "FFFFFF") + nodes.map((node, i) => {
      const cols = Math.min(3, nodes.length);
      const w = cols === 2 ? 5.65 : 3.72;
      return shape(.7 + (i % cols) * (w + .32), 1.6 + Math.floor(i / cols) * 1.82, w, 1.48, i % 2 ? "FFF0E4" : "E8F0F6", pText(node.label, 15, "10233F", true) + pText(node.detail, 10, "607187"), "D7E0E9");
    }).join("") + shape(.7, 5.65, 11.9, .85, "10233F", pText("主体含义", 9, "F28A32", true) + pText(map.implication, 12, "FFFFFF"), "10233F") + footer(mi + 4)));
  });
  result.lists.slice(0, 5).forEach((list, li) => {
    const items = list.items.slice(0, 6);
    slides.push(slideXml(shape(.55, .35, 12.2, .7, "FFFFFF", pText(`清单 ${li + 1}｜${list.name}`, 27, "10233F", true), "FFFFFF") + shape(.65, 1.25, 12.0, .42, "10233F", pText("对象｜状态｜区域｜下一步动作", 10, "FFFFFF", true), "10233F") + items.map((item, i) => shape(.65, 1.75 + i * .79, 12, .64, i % 2 ? "F5F8FA" : "FFFFFF", pText(`${item.name}｜${item.status}｜${item.region}｜${item.nextAction}`, 10, "10233F"), "D7E0E9")).join("") + footer(li + 8)));
  });
  slides.push(slideXml(shape(.55, .35, 12.2, .7, "FFFFFF", pText("评分与尽调优先级", 27, "10233F", true), "FFFFFF") + result.scores.slice(0, 7).map((s, i) => shape(.7, 1.3 + i * .7, 11.85, .55, i === 0 ? "FFF0E4" : "F5F8FA", pText(`${i + 1}. ${s.name}  ·  ${s.score}/100  ·  ${s.status}  ·  ${s.rationale}`, 10, "10233F", i === 0), "D7E0E9")).join("") + shape(.7, 6.35, 11.85, .45, "FFFFFF", pText("评分用于确定尽调顺序，不构成投资建议。", 9, "A94D0C", true), "FFFFFF") + footer(13)));
  const gaps = result.dataGaps.slice(0, 6);
  slides.push(slideXml(shape(.55, .35, 12.2, .7, "FFFFFF", pText("数据缺口与下一步尽调", 27, "10233F", true), "FFFFFF") + gaps.map((g, i) => shape(.7 + (i % 2) * 6.05, 1.35 + Math.floor(i / 2) * 1.65, 5.7, 1.35, i % 2 ? "FFF0E4" : "E8F0F6", pText(g.item, 14, "10233F", true) + pText(`影响：${g.impact}`, 9, "607187") + pText(`动作：${g.nextAction}`, 9, "1D5C91", true), "D7E0E9")).join("") + footer(14)));
  slides.push(slideXml(shape(.55, .35, 12.2, .7, "FFFFFF", pText("证据来源索引", 27, "10233F", true), "FFFFFF") + result.sources.slice(0, 9).map((s, i) => shape(.7, 1.25 + i * .58, 11.9, .46, i % 2 ? "F5F8FA" : "FFFFFF", pText(`${s.id}｜${s.publisher}｜${s.title}｜${s.date}｜${s.grade}级`, 9, "10233F"), "D7E0E9")).join("") + footer(15)));
  return slides;
}

const clip = (value: unknown, max = 90) => {
  const text = String(value ?? "").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
};

function buildDetailedSlides(result: ResearchResult) {
  const db: any = result.database;
  const slides: string[] = [];
  const sourceById = new Map(result.sources.map(source => [source.id, source]));
  const publishers = (ids: string[] = []) => Array.from(new Set(ids.map(id => sourceById.get(id)?.publisher).filter(Boolean))).slice(0, 6).join("、") || "研究数据库与公开资料";
  const allIds = (items: any[] = []) => items.flatMap(item => item.sourceIds || []);
  const footer = (page: number, ids: string[] = []) =>
    shape(.48, 7.1, 10.9, .2, "FFFFFF", pText(`来源：${publishers(ids)}`, 7.5, "607187"), "FFFFFF") +
    shape(12.15, 7.08, .7, .22, "FFFFFF", pText(String(page).padStart(2, "0"), 8, "A94D0C", true, "r"), "FFFFFF");
  const heading = (title: string, subtitle = "") =>
    shape(.18, .35, .08, .72, "C91D2E", "", "C91D2E") +
    shape(.42, .32, 12.25, .82, "FFFFFF", pText(title, 23, "10233F", true) + (subtitle ? pText(subtitle, 9.5, "607187") : ""), "FFFFFF");
  const section = (part: string, title: string, subtitle: string, page: number) => slideXml(
    shape(0, 0, 13.333, 7.5, "FAF5F4", "", "FAF5F4") +
    shape(0, 0, .22, 7.5, "C91D2E", "", "C91D2E") +
    shape(.75, 2.35, 11.8, 1.25, "FAF5F4", pText(part, 15, "C91D2E", true) + pText(title, 32, "10233F", true), "FAF5F4") +
    shape(.78, 4.0, 10.5, .6, "FAF5F4", pText(subtitle, 14, "607187"), "FAF5F4") + footer(page)
  );
  const grid = (items: any[], mapper: (item: any, index: number) => [string, string], cols = 4, top = 1.45, bottom = 6.72) => {
    const rows = Math.max(1, Math.ceil(items.length / cols));
    const w = 11.95 / cols;
    const h = Math.min(1.58, (bottom - top) / rows);
    return items.map((item, index) => {
      const [title, detail] = mapper(item, index);
      const x = .62 + (index % cols) * w;
      const y = top + Math.floor(index / cols) * h;
      const fill = index % cols === 0 ? "FDE9D9" : index % cols === 3 ? "F5EAC5" : "F8F1F1";
      return shape(x, y, w - .16, h - .16, fill, pText(clip(title, 30), 11.5, "A31526", true) + pText(clip(detail, 105), 8.5, "31445B"), "E7C8C8");
    }).join("");
  };
  const table = (headers: string[], rows: Array<Array<unknown>>, widths?: number[], top = 1.5, height = 5.2) => {
    const normalized = widths || headers.map(() => 1 / headers.length);
    const sum = normalized.reduce((a, b) => a + b, 0);
    const x0 = .62;
    const totalW = 12.05;
    const rowH = height / Math.max(rows.length + 1, 2);
    let content = "";
    let cursor = x0;
    headers.forEach((header, index) => {
      const w = totalW * normalized[index] / sum;
      content += shape(cursor, top, w, rowH, index === 0 ? "8E1726" : "A92B37", pText(clip(header, 24), 8.5, "FFFFFF", true, "ctr"), "FFFFFF");
      cursor += w;
    });
    rows.forEach((row, ri) => {
      cursor = x0;
      row.forEach((value, ci) => {
        const w = totalW * normalized[ci] / sum;
        content += shape(cursor, top + rowH * (ri + 1), w, rowH, ri % 2 ? "FFF7F3" : "F8EEEE", pText(clip(value, ci === 0 ? 34 : 72), 7.8, ci === 0 ? "8E1726" : "31445B", ci === 0), "E7D3D3");
        cursor += w;
      });
    });
    return content;
  };
  const page = (title: string, subtitle: string, body: string, number: number, ids: string[] = []) => slideXml(heading(title, subtitle) + body + footer(number, ids));

  slides.push(slideXml(
    shape(0, 0, 13.333, 7.5, "FFFFFF", "", "FFFFFF") + shape(0, 0, .25, 7.5, "C91D2E", "", "C91D2E") +
    shape(.75, 1.75, 11.65, 1.65, "FFFFFF", pText(`${result.meta.industry}`, 34, "C91D2E", true) + pText("产业四图五清单分析", 31, "10233F", true), "FFFFFF") +
    shape(.78, 4.75, 8.8, .8, "FFFFFF", pText(`${result.meta.region}｜${result.meta.entity}`, 14, "607187") + pText(`数据截止：${result.meta.cutoff}`, 10, "607187"), "FFFFFF") + footer(1)
  ));
  slides.push(page("目录", "四图回答产业结构与布局问题，五清单承接投资、招引、试点和风险管理", grid([
    { t: "一", d: "产业链图、应用价值图、技术路线图、区域布局图" },
    { t: "二", d: "产业集群、政策、企业、项目、问题清单" },
  ], x => [`第${x.t}部分`, x.d], 2, 2.0, 5.0), 2));
  slides.push(section("第一部分", "四图分析", "产业链图 · 应用领域图 · 技术路线图 · 区域分布图", 3));
  slides.push(page("【四图总览】四张图依次回答产业是什么、谁需要、技术何时成熟、区域如何落位", "每张图均回溯17张基础底表，形成从事实到主体动作的完整判断链", grid(result.maps.slice(0, 4), (m, i) => [`0${i + 1}  ${m.title}`, `${m.question}｜${m.implication}`], 4, 1.7, 5.7), 4, allIds(result.maps.flatMap(m => m.nodes))));
  slides.push(page(`1.1【产业链全景图】${result.meta.industry}价值链、代表主体与卡点`, "覆盖基础部件、技术产品、平台应用、服务支付与资本进入方式", grid((db.industryChain || []).slice(0, 12), x => [`${x.layer}｜${x.segment}`, `${x.output}；代表主体：${x.representatives}；卡点：${x.bottleneck}`], 4), 5, allIds(db.industryChain)));
  slides.push(page("【环节研判】市场代理、成熟度和进入方式共同决定优先级", "宏观规模不能替代具体环节的盈利证据，成熟度也不等同于投资优先级", table(["环节", "成熟度/壁垒", "市场或盈利代理", "主体进入方式", "主要卡点"], (db.industryChain || []).slice(0, 8).map((x: any) => [x.segment, `${x.maturity}/${x.barrier}`, x.marketProxy, x.entryMode, x.bottleneck]), [1.1, .9, 1.8, 1.3, 1.5]), 6, allIds(db.industryChain)));
  slides.push(page(`1.2【应用领域图】${result.meta.industry}从需求、任务到采购和付费形成价值闭环`, "明确谁使用、谁采购、谁付费，以及产品用什么指标验收", grid((db.products || []).slice(0, 12), x => [`${x.track}｜${x.product}`, `任务：${x.task}；采购：${x.buyer}；付费：${x.payer}；模式：${x.businessModel}`], 4), 7, allIds(db.products)));
  slides.push(page("【应用分析】近期落地取决于需求频率、付费闭环和可量化经济性", "公开价格和运营参数不足时保留待核，不用宏观需求替代项目现金流", table(["场景", "情景", "初始投入", "年净收益", "回收期", "敏感变量"], (db.roiScenarios || []).slice(0, 9).map((x: any) => [x.scenario, x.case, x.initialInvestment, x.annualNetBenefit, x.paybackYears, x.sensitivity]), [1.5, .7, 1, 1, .8, 1.6]), 8, allIds(db.roiScenarios)));
  slides.push(page(`1.3【技术路线图】${result.meta.industry}按近期、中期和长期形成验证路线`, "技术路线同时显示TRL、渗透率、瓶颈、主流时间和可量化验证指标", grid((db.technologies || []).slice(0, 12), x => [`${x.mainstreamTime}｜${x.direction}`, `${x.trl}；渗透：${x.penetration}；瓶颈：${x.bottleneck}；指标：${x.verificationMetric}`], 4), 9, allIds(db.technologies)));
  slides.push(page("【成熟度与优先级】近期导入成熟模块，中期攻关关键瓶颈，长期保留技术储备", "投入窗口由成熟度、场景价值、验证周期、主体协同和持续收费能力共同决定", table(["技术方向", "TRL", "渗透率", "国内外差距", "投入窗口", "建议动作"], (db.technologies || []).slice(0, 9).map((x: any) => [x.direction, x.trl, x.penetration, x.gap, x.mainstreamTime, x.action]), [1.4, .7, .8, 1.5, .9, 1.4]), 10, allIds(db.technologies)));
  slides.push(page("【核心攻关路线】关键瓶颈必须转成工程指标、责任主体与里程碑", "避免把前沿技术名词直接写成产业机会，所有攻关方向先定义验收条件", grid((db.technologies || []).slice(0, 9), (x, i) => [`${i + 1}. ${x.direction}`, `瓶颈：${x.bottleneck}｜验证：${x.verificationMetric}｜动作：${x.action}`], 3), 11, allIds(db.technologies)));
  slides.push(page(`1.4【区域分布图】${result.meta.region}与外部集群形成核心布局、协同承载和导入分工`, "区域图同时表达企业、科研、平台、资本、制造与应用场景，不把规划名称当作成熟集群", grid((db.regions || []).slice(0, 12), x => [`${x.tier}｜${x.region}`, `${x.cluster}；优势：${x.strength}；短板：${x.weakness}；功能：${x.role}`], 4), 12, allIds(db.regions)));
  slides.push(section("第二部分", "五清单分析", "产业集群 · 政策 · 企业 · 项目 · 问题清单", 13));
  const listCounts = [db.regions, db.policies, db.enterprises, db.projects, db.problems].map((items: any[]) => items?.length || 0);
  slides.push(page("【五清单总览】五张清单把四图结论转成可跟踪的管理对象", "完整记录保留在数据库，PPT仅展示支撑当前判断的重点对象", grid(["产业集群", "政策", "重点企业", "重点项目", "产业问题"].map((name, i) => ({ name, count: listCounts[i] })), x => [x.name, `${x.count}条完整记录｜用于持续更新、筛选和推进`], 5, 1.9, 4.7), 14));
  slides.push(page(`2.1【产业集群清单】${result.meta.region}的产业要素与外部导入能力`, "从科研、平台、资本、制造和场景判断真实集群能力与短板", table(["区域/集群", "层级", "企业与科研", "优势与短板", "功能定位"], (db.regions || []).slice(0, 8).map((x: any) => [`${x.region}｜${x.cluster}`, x.tier, `${x.enterprises}；${x.research}`, `${x.strength}；${x.weakness}`, x.role]), [1.3, .7, 1.7, 1.8, 1.4]), 15, allIds(db.regions)));
  slides.push(page("【载体与主体资源】资源权属和实际控制力决定可执行动作", "将区域公共资源与主体自有、可支配资源分开，避免把所在地资源自动视为主体资产", table(["权属", "资源", "能力/规模", "协同方式", "权限边界/待核"], (db.resources || []).slice(0, 9).map((x: any) => [x.ownership, `${x.name}｜${x.type}`, x.capacity || x.evidence, x.collaboration, `${x.controlBoundary}；${x.verification}`]), [1, 1.4, 1.6, 1.5, 1.8]), 16, allIds(db.resources)));
  slides.push(page(`2.2【政策清单】${result.meta.industry}政策同时包含支持窗口与准入约束`, "政策支持不等于商业价值，申报、目录、补贴和采购条件均须逐项复核", table(["层级/日期", "政策与发布主体", "支持方式", "约束", "主体机会"], (db.policies || []).slice(0, 9).map((x: any) => [`${x.level}｜${x.date}`, `${x.name}｜${x.publisher}`, x.supportMethod, x.constraints, x.opportunity]), [1, 2.0, 1.6, 1.4, 1.5]), 17, allIds(db.policies)));
  slides.push(page("【政策解读】政策需要通过申报、目录、采购和资本工具转化为具体项目", "将有效期、支持对象、兑现条件和预算来源转成项目推进清单", grid((db.policies || []).slice(0, 8), x => [x.name, `支持：${x.supportMethod}｜门槛：${x.constraints}｜影响：${x.impact}`], 4), 18, allIds(db.policies)));
  slides.push(page(`2.3【重点企业清单】企业池覆盖龙头、成长、配套、本地和风险样本`, "分别记录技术产品、资质、商业化、财务融资、区域协同和尽调事项", grid((db.enterprises || []).slice(0, 12), x => [`${x.type}｜${x.name}`, `${x.segment}；${x.products}；协同：${x.collaboration}`], 4), 19, allIds(db.enterprises)));
  slides.push(page("【企业筛选】企业评分用于形成分层尽调池，不替代正式投资判断", "成熟公司、成长企业和早期团队按阶段解释证据覆盖率、风险与下一步", table(["企业/对象", "类别/阶段", "得分", "覆盖率", "核心依据", "下一步"], (db.scoreItems || []).filter((x: any) => /企业|公司/.test(x.category)).slice(0, 9).map((x: any) => [x.name, `${x.category}/${x.stage}`, x.total, x.coverage, x.rationale, x.nextAction]), [1.4, 1.1, .6, .8, 2.0, 1.3]), 20, allIds(db.scoreItems)));
  slides.push(page(`2.4【重点项目清单】项目池区分已发生、在建、签约、建议和融资事件`, "项目金额、建设状态、资金用途、合作诉求和风险均须回溯公开证据", grid((db.projects || []).slice(0, 12), x => [`${x.type}｜${x.name}`, `${x.location}；${x.status}；金额：${x.amount}；下一步：${x.nextAction}`], 4), 21, allIds(db.projects)));
  slides.push(page("【项目筛选】近期场景验证、中期投资培育和长期平台建设采用不同资金工具", "采购、联合运营、股权投资、基金、合资和招商必须匹配项目阶段与风险", table(["项目", "类型/状态", "金额/用途", "产业价值", "主要风险", "下一步"], (db.projects || []).slice(0, 9).map((x: any) => [x.name, `${x.type}/${x.status}`, `${x.amount}；${x.useOfFunds}`, x.value, x.risk, x.nextAction]), [1.5, 1.1, 1.3, 1.5, 1.4, 1.3]), 22, allIds(db.projects)));
  slides.push(page(`2.5【问题清单】${result.meta.industry}卡点、堵点与断点必须转成否决项和整改任务`, "问题清单覆盖技术、产品、市场、支付、安全、标准、组织和投资风险", table(["类型", "环节", "问题", "影响/严重度", "解决路径", "验证与重启条件"], (db.problems || []).slice(0, 9).map((x: any) => [x.type, x.segment, x.description, `${x.impact}｜${x.severity}`, x.solution, `${x.metric}；${x.restartCondition}`]), [.7, 1, 1.8, 1.5, 1.5, 1.7]), 23, allIds(db.problems)));
  slides.push(page("【问题归因】场景、技术、支付和组织问题需要不同责任主体闭环", "把问题原因转为责任、时序、验证指标与暂停边界，避免用泛化建议替代解决机制", grid((db.problems || []).slice(0, 9), x => [`${x.type}｜${x.owner}`, `原因：${x.cause}｜时序：${x.timing}｜指标：${x.metric}`], 3), 24, allIds(db.problems)));
  slides.push(page("【行动计划】以研究底库、试点数据和分层资本工具形成持续更新闭环", "所有进入动作以真实使用数据、付费闭环、合规与主体授权为前提", grid([
    { t: "0—30天", d: "确认产业边界、主体权限、重点对象和否决项；完成首轮企业与项目访谈" },
    { t: "30—90天", d: "启动低风险场景试点，获取报价、合同、利用率、运维和回款数据" },
    { t: "3—12个月", d: "根据里程碑配置采购、联合运营、少数股权、基金或招商工具" },
    { t: "1—3年", d: "形成区域功能分工、产业补链和可复制项目包，按季度更新数据库" },
  ], x => [x.t, x.d], 4, 1.8, 5.1) + shape(.72, 5.65, 11.82, .75, "8E1726", pText(`进入原则：${clip(result.executiveSummary, 180)}`, 11, "FFFFFF", true), "8E1726"), 25));
  return slides;
}

export function buildPptxBytes(result: ResearchResult) {
  const slides = result.database ? buildDetailedSlides(result) : buildSlides(result);
  const files: Record<string, Uint8Array> = {};
  const add = (path: string, value: string) => { files[path] = strToU8(value); };
  add("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>${slides.map((_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join("")}<Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`);
  add("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`);
  add("docProps/core.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xml(result.meta.industry)}产业投资研究</dc:title><dc:creator>产业投资研究 Agent</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${stamp()}</dcterms:created></cp:coreProperties>`);
  add("docProps/app.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"><Application>产业投资研究 Agent</Application><Slides>${slides.length}</Slides></Properties>`);
  add("ppt/presentation.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${slides.map((_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`).join("")}</p:sldIdLst><p:sldSz cx="12192000" cy="6858000" type="screen16x9"/><p:notesSz cx="6858000" cy="9144000"/></p:presentation>`);
  add("ppt/_rels/presentation.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>${slides.map((_, i) => `<Relationship Id="rId${i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`).join("")}</Relationships>`);
  add("ppt/slideMasters/slideMaster1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMap accent1="1D5C91" accent2="F28A32" accent3="2B806C" accent4="607187" accent5="D7E0E9" accent6="10233F" bg1="FFFFFF" bg2="F2F5F8" folHlink="800080" hlink="0000FF" tx1="10233F" tx2="607187"/><p:sldLayoutIdLst><p:sldLayoutId id="1" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>`);
  add("ppt/slideMasters/_rels/slideMaster1.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>`);
  add("ppt/slideLayouts/slideLayout1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`);
  add("ppt/slideLayouts/_rels/slideLayout1.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>`);
  add("ppt/theme/theme1.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Research"><a:themeElements><a:clrScheme name="Research"><a:dk1><a:srgbClr val="10233F"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="18385F"/></a:dk2><a:lt2><a:srgbClr val="F2F5F8"/></a:lt2><a:accent1><a:srgbClr val="1D5C91"/></a:accent1><a:accent2><a:srgbClr val="F28A32"/></a:accent2><a:accent3><a:srgbClr val="2B806C"/></a:accent3><a:accent4><a:srgbClr val="607187"/></a:accent4><a:accent5><a:srgbClr val="D7E0E9"/></a:accent5><a:accent6><a:srgbClr val="10233F"/></a:accent6><a:hlink><a:srgbClr val="0000FF"/></a:hlink><a:folHlink><a:srgbClr val="800080"/></a:folHlink></a:clrScheme><a:fontScheme name="Research"><a:majorFont><a:latin typeface="Microsoft YaHei"/><a:ea typeface="Microsoft YaHei"/><a:cs typeface="Arial"/></a:majorFont><a:minorFont><a:latin typeface="Microsoft YaHei"/><a:ea typeface="Microsoft YaHei"/><a:cs typeface="Arial"/></a:minorFont></a:fontScheme><a:fmtScheme name="Research"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`);
  slides.forEach((s, i) => {
    add(`ppt/slides/slide${i + 1}.xml`, s);
    add(`ppt/slides/_rels/slide${i + 1}.xml.rels`, `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/></Relationships>`);
  });
  return zipSync(files, { level: 6 });
}

export function downloadPptx(result: ResearchResult) {
  download(buildPptxBytes(result), `${safeName(result.meta.industry)}产业投资研究_四图五清单.pptx`, "application/vnd.openxmlformats-officedocument.presentationml.presentation");
}

const cell = (value: string | number, ref: string, style = 0) => typeof value === "number" ? `<c r="${ref}" s="${style}"><v>${value}</v></c>` : `<c r="${ref}" s="${style}" t="inlineStr"><is><t>${xml(String(value ?? ""))}</t></is></c>`;
const col = (n: number) => { let s = ""; while (n > 0) { n--; s = String.fromCharCode(65 + n % 26) + s; n = Math.floor(n / 26); } return s; };
function sheet(rows: Array<Array<string | number>>, headerRow = 4) {
  const width = Math.max(...rows.map(r => r.length), 1);
  const rowXml = rows.map((row, ri) => {
    const rowNumber = ri + 1;
    const style = rowNumber === 1 ? 1 : rowNumber === 2 ? 2 : rowNumber === headerRow ? 3 : 4;
    const height = rowNumber === 1 ? 30 : rowNumber === 2 ? 25 : rowNumber === headerRow ? 36 : 42;
    return `<row r="${rowNumber}" ht="${height}" customHeight="1">${row.map((v, ci) => cell(v, `${col(ci + 1)}${rowNumber}`, style)).join("")}</row>`;
  }).join("");
  const merges = width > 1 ? `<mergeCells count="2"><mergeCell ref="A1:${col(width)}1"/><mergeCell ref="A2:${col(width)}2"/></mergeCells>` : "";
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="${headerRow}" topLeftCell="A${headerRow + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols><col min="1" max="2" width="16" customWidth="1"/><col min="3" max="${Math.max(width, 3)}" width="24" customWidth="1"/></cols><sheetData>${rowXml}</sheetData>${merges}<autoFilter ref="A${headerRow}:${col(width)}${rows.length}"/></worksheet>`;
}
export function buildXlsxBytes(result: ResearchResult) {
  const db = result.database || {};
  const sourceById = new Map(result.sources.map(source => [source.id, source]));
  const evidence = (ids: string[] = []) => {
    const sources = ids.map(id => sourceById.get(id)).filter(Boolean);
    return [ids.join(";"), sources.map(s => s?.publisher).filter(Boolean).join(";"), sources.map(s => s?.url).filter(Boolean).join("\n"), sources.map(s => s?.grade).filter(Boolean).join(";")];
  };
  const richRows = (title: string, note: string, headers: string[], data: Array<Array<string | number>>) => [[title], [note], [], headers, ...data] as Array<Array<string | number>>;
  const boundaries = db.boundaries || {};
  const sheets = [
    ["使用说明", richRows(`${result.meta.industry}产业四图五清单｜增强基础数据库`, `面向${result.meta.entity}｜核心区域：${result.meta.region}｜数据截止：${result.meta.cutoff}｜事实、预测、企业披露、研究判断与情景假设分开`, ["模块", "内容", "验收口径"], [
      ["产业定义", boundaries.definition || result.meta.industry, "明确纳入与排除边界"], ["纳入范围", (boundaries.included || []).join("；"), "覆盖目标价值链"], ["排除范围", (boundaries.excluded || []).join("；"), "避免相邻产业口径混用"], ["价值链边界", boundaries.valueChainBoundary || "待补充", "基础部件至应用、服务与支付"], ["产品分类", (boundaries.productTaxonomy || []).join("；"), "产品、用户和任务可映射"], ["商业模式", (boundaries.businessModels || []).join("；"), "区分销售、租赁、服务和运营"], ["统计口径", boundaries.statisticalCaliber || "待补充", "不同口径不得直接相加"], ["地理范围", boundaries.geography || result.meta.region, "全国扫描、核心区域深挖"], ["目标读者", boundaries.targetAudience || result.meta.entity, "用于尽调、试点和项目推进"], ["管理层摘要", result.executiveSummary, "结论须可回溯"],
    ])],
    ["产业链环节", richRows(`${result.meta.industry}产业链环节增强数据库`, "覆盖基础与部件、技术与产品、平台与应用、服务与支付；市场代理与进入方式不等同于投资建议。", ["记录ID", "层级", "环节", "主要输出", "代表主体", "商业成熟度", "投资壁垒", "核心卡点", "成本/性能影响", "进入方式", "市场/盈利代理", "来源ID", "发布主体", "来源链接", "证据等级"], (db.industryChain || []).map((x: any) => [x.id, x.layer, x.segment, x.output, x.representatives, x.maturity, x.barrier, x.bottleneck, x.impact, x.entryMode, x.marketProxy, ...evidence(x.sourceIds)]))],
    ["重点产品", richRows("重点产品、场景与商业模式增强数据库", "同一企业可以有多个产品记录；价格、资质、交付和商业化均须有来源或明确待核。", ["记录ID", "赛道", "产品/方案", "企业", "用户", "任务", "场景", "采购者", "付费者", "商业模式", "公开价格", "资质", "商业进展", "主要风险", "主体动作", "来源ID", "发布主体", "来源链接", "证据等级"], (db.products || []).map((x: any) => [x.id, x.track, x.product, x.company, x.user, x.task, x.scenario, x.buyer, x.payer, x.businessModel, x.price, x.qualification, x.commercialization, x.risk, x.action, ...evidence(x.sourceIds)]))],
    ["市场规模及盈利能力", richRows("市场规模、需求与盈利代理指标增强数据库", "实际值、预测值、企业披露和情景估算分开；产值、收入、出货、合同和订单不可互相替代。", ["记录ID", "指标", "类型", "统计口径", "地区", "年份", "数值", "单位", "增速/毛利率", "数据属性", "可比性与局限", "来源ID", "发布主体", "来源链接", "证据等级"], (db.marketMetrics || []).map((x: any) => [x.id, x.metric, x.metricType, x.caliber, x.region, x.year, x.value, x.unit, x.growth, x.dataNature, x.comparability, ...evidence(x.sourceIds)]))],
    ["核心技术", richRows("核心技术路线、TRL与验证任务增强数据库", "TRL和投资窗口为公开信息基础上的研究判断，不代表监管认可或商业成熟。", ["记录ID", "技术层", "技术方向", "技术内涵", "TRL", "当前渗透", "主要瓶颈", "国内外差距", "主流时间", "代表主体", "验证指标", "建议动作", "来源ID", "发布主体", "来源链接", "证据等级"], (db.technologies || []).map((x: any) => [x.id, x.layer, x.direction, x.description, x.trl, x.penetration, x.bottleneck, x.gap, x.mainstreamTime, x.representatives, x.verificationMetric, x.action, ...evidence(x.sourceIds)]))],
    ["区域及产业集群", richRows("区域与产业集群增强数据库", "区分核心布局区、协同承载区和外部导入区；区域公共资源不等同于实施主体拥有。", ["记录ID", "区域层级", "城市/区域", "集群/园区", "重点企业", "科研", "公共平台", "资本", "制造", "应用场景", "优势", "短板", "功能定位", "来源ID", "发布主体", "来源链接", "证据等级"], (db.regions || []).map((x: any) => [x.id, x.tier, x.region, x.cluster, x.enterprises, x.research, x.platforms, x.capital, x.manufacturing, x.scenarios, x.strength, x.weakness, x.role, ...evidence(x.sourceIds)]))],
    ["政策清单", richRows(`${result.meta.industry}相关政策增强清单`, "政策支持、目录入选和试点资格均不等同于收入；申报条件和有效状态须逐项复核。", ["记录ID", "层级", "时间", "发布主体", "政策名称", "支持对象", "支持方式", "约束/门槛", "产业影响", "可争取机会", "有效状态", "来源ID", "来源发布主体", "来源链接", "证据等级"], (db.policies || []).map((x: any) => [x.id, x.level, x.date, x.publisher, x.name, x.supportObject, x.supportMethod, x.constraints, x.impact, x.opportunity, x.status, ...evidence(x.sourceIds)]))],
    ["重点企业", richRows("重点企业增强数据库", "覆盖龙头、成长、配套、本地和风险样本；企业披露需进一步核实。", ["记录ID", "企业", "类型", "地区", "产业环节", "产品", "技术", "资质", "商业化证据", "经营财务证据", "融资", "股东", "协同方式", "主要风险", "尽调事项", "来源ID", "发布主体", "来源链接", "证据等级"], (db.enterprises || []).map((x: any) => [x.id, x.name, x.type, x.region, x.segment, x.products, x.technology, x.qualification, x.commercialEvidence, x.financialEvidence, x.financing, x.shareholders, x.collaboration, x.risk, x.dueDiligence, ...evidence(x.sourceIds)]))],
    ["重点项目及融资事件", richRows("重点项目、采购、融资与产业落地机会", "已发生项目、在建项目、签约线索、建议项目和融资事件分开记录。", ["记录ID", "项目", "类型", "日期", "金额", "参与方", "地点", "状态", "资金用途", "产业价值", "合作诉求", "风险", "下一步", "来源ID", "发布主体", "来源链接", "证据等级"], (db.projects || []).map((x: any) => [x.id, x.name, x.type, x.date, x.amount, x.participants, x.location, x.status, x.useOfFunds, x.value, x.request, x.risk, x.nextAction, ...evidence(x.sourceIds)]))],
    ["产业问题", richRows("产业问题、影响与闭环解决清单", "区分卡点、堵点和断点；每项问题转为责任、时序、验证指标和重启条件。", ["记录ID", "类型", "具体环节", "问题描述", "原因", "影响", "严重度", "解决路径", "责任主体", "时序", "验证指标", "重启条件", "来源ID", "发布主体", "来源链接", "证据等级"], (db.problems || []).map((x: any) => [x.id, x.type, x.segment, x.description, x.cause, x.impact, x.severity, x.solution, x.owner, x.timing, x.metric, x.restartCondition, ...evidence(x.sourceIds)]))],
    [`${safeName(result.meta.entity).slice(0, 20)}公开资源`, richRows(`${result.meta.entity}及公开可协同资源增强清单`, "按主体自有、可支配或已签约、区域公共、外部可协同、待内部核实五级分类。", ["记录ID", "权属分类", "资源名称", "类型", "所在地", "公开证据", "能力/规模", "可协同方式", "控制与权限边界", "待核事项", "来源ID", "发布主体", "来源链接", "证据等级"], (db.resources || []).map((x: any) => [x.id, x.ownership, x.name, x.type, x.location, x.evidence, x.capacity, x.collaboration, x.controlBoundary, x.verification, ...evidence(x.sourceIds)]))],
    ["产品企业及项目综合评分", richRows("产品方向、企业及项目综合评分", "评分用于确定尽调、试点或谈判顺序；缺失证据降低覆盖率与得分，不构成投资建议。", ["对象类别", "对象", "阶段", "维度明细（1-5分）", "综合得分", "证据覆盖率", "状态/分级", "评分依据", "下一步", "来源ID", "发布主体", "来源链接", "证据等级"], [
      ...(db.scoreWeights || []).map((x: any) => [`${x.category || "通用"}权重`, x.dimension, "", `${x.weight}%`, "", "", "", x.rationale, "", "", "", "", ""]),
      ...(db.scoreItems || []).map((x: any) => [x.category, x.name, x.stage, (x.dimensions || []).map((d: any) => `${d.dimension}:${d.score}`).join("；"), x.total, x.coverage, x.status, x.rationale, x.nextAction, ...evidence(x.sourceIds)]),
    ])],
    ["场景或项目ROI测算", richRows(`${result.meta.industry}场景或项目经济性三情景测算`, "保守、基准、乐观情景仅用于筛选；正式决策前须用报价、合同和运营数据替换假设。", ["模型ID", "场景/项目", "情景", "初始投入", "年收入", "年节约", "年运营成本", "年净收益", "回收期", "ROI/NPV/适用指标", "核心假设", "敏感变量", "适用边界", "来源ID", "发布主体", "来源链接", "证据等级"], (db.roiScenarios || []).map((x: any) => [x.id, x.scenario, x.case, x.initialInvestment, x.annualRevenue, x.annualSavings, x.annualOpex, x.annualNetBenefit, x.paybackYears, x.roiOrNpv, x.assumptions, x.sensitivity, x.boundary, ...evidence(x.sourceIds)]))],
    ["数据来源索引", richRows("数据来源与审计索引", "来源ID用于数据库内部追溯；PPT页面显示发布主体，保留完整链接和核验状态。", ["来源ID", "发布主体", "资料名称", "发布日期/查询日", "来源链接", "类别", "可信度", "用途", "数据属性", "核验状态"], result.sources.map(s => [s.id, s.publisher, s.title, s.date, s.url, s.sourceType, s.grade, s.used, s.dataNature || "", s.verificationStatus || "" ]))],
    ["更新变更日志", richRows("数据库更新变更日志", "记录各表的新增、纠偏、结构调整与覆盖变化，便于后续局部更新。", ["日期", "模块", "变更类型", "变更说明", "更新前", "更新后", "完成状态"], (db.changeLog || []).map((x: any) => [x.date, x.module, x.changeType, x.description, x.before, x.after, x.status]))],
    ["数据缺口及待核事项", richRows("数据缺口、核实路径与责任清单", "缺乏公开证据的内容不补全；缺口转化为尽调任务、试点指标和内部核实清单。", ["缺口ID", "模块", "缺口事项", "影响", "重要性", "核实方式", "责任主体", "时点", "状态"], result.dataGaps.map(g => [g.id || "", g.module || "", g.item, g.impact, g.priority || "", g.method || g.nextAction || "", g.owner || "", g.timing || "", g.status || "待核"]))],
    ["检索过程及饱和度记录", richRows("公开资料检索过程与饱和度记录", "至少两轮检索：第一轮建立全景与候选池，第二轮补缺口并核验重点对象。", ["查询ID", "轮次", "主题", "检索式/动作", "优先来源", "主要结果", "新增有效记录", "重复程度", "证据质量", "饱和判断"], (db.searchLog || []).map((x: any) => [x.queryId, x.round, x.topic, x.query, x.preferredSources, x.result, x.newRecords, x.duplication, x.evidenceQuality, x.saturation]))],
  ] as Array<[string, Array<Array<string | number>>]>;
  const files: Record<string, Uint8Array> = {};
  const add = (path: string, value: string) => { files[path] = strToU8(value); };
  add("[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("")}</Types>`);
  add("_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`);
  add("xl/workbook.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets.map(([name], i) => `<sheet name="${xml(name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join("")}</sheets></workbook>`);
  add("xl/_rels/workbook.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join("")}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
  add("xl/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="3"><font><sz val="10"/><name val="Microsoft YaHei"/></font><font><b/><sz val="16"/><color rgb="FFFFFFFF"/><name val="Microsoft YaHei"/></font><font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Microsoft YaHei"/></font></fonts><fills count="5"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF10233F"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFDE9D9"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF5F8FA"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border/><border><left style="thin"><color rgb="FFD7E0E9"/></left><right style="thin"><color rgb="FFD7E0E9"/></right><top style="thin"><color rgb="FFD7E0E9"/></top><bottom style="thin"><color rgb="FFD7E0E9"/></bottom></border></borders><cellStyleXfs count="1"><xf/></cellStyleXfs><cellXfs count="5"><xf xfId="0" fontId="0" fillId="0" borderId="0"/><xf xfId="0" fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1"><alignment vertical="center"/></xf><xf xfId="0" fontId="0" fillId="3" borderId="0" applyFill="1"><alignment wrapText="1" vertical="center"/></xf><xf xfId="0" fontId="2" fillId="2" borderId="1" applyFont="1" applyFill="1" applyBorder="1"><alignment wrapText="1" vertical="center"/></xf><xf xfId="0" fontId="0" fillId="4" borderId="1" applyFill="1" applyBorder="1"><alignment wrapText="1" vertical="top"/></xf></cellXfs></styleSheet>`);
  sheets.forEach(([, rows], i) => add(`xl/worksheets/sheet${i + 1}.xml`, sheet(rows)));
  return zipSync(files, { level: 6 });
}

export function downloadXlsx(result: ResearchResult) {
  download(buildXlsxBytes(result), `${safeName(result.meta.industry)}产业研究数据库.xlsx`, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
}
