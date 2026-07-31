import { renderIcons } from "./vendor/icons.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const sourceNames = {
  amazon: "Amazon",
  reddit: "Reddit",
  youtube: "YouTube",
  news: "Google News",
  alibaba: "Alibaba.com",
  "reference-workbook": "参考工作簿",
  "amazon-review": "Amazon 评论",
  "amazon-written-review": "Amazon 书面评论",
};

const marketCurrencies = { US: "USD", DE: "EUR", UK: "GBP", CA: "CAD" };
const stateNames = { success: "成功", limited: "受限", action_required: "需操作", failed: "失败", not_selected: "未选择" };
const confidenceNames = { 高: "高", 中: "中", 低: "低", high: "高", medium: "中", low: "低" };
const appConfig = globalThis.OPC_APP_CONFIG || {};
const apiBaseUrl = String(appConfig.apiBaseUrl || "").replace(/\/$/, "");
const staticMode = Boolean(appConfig.staticMode);
let apiAvailable = !staticMode;

let currentReport = null;
let loadingTimer = null;
let elapsedTimer = null;
let toastTimer = null;
const sourceSettingsVersion = "2026-07-30-five-sources";

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function httpUrl(value) {
  try {
    const url = new URL(String(value));
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function formatMoney(value, currency = "USD") {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "待采集";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(Number(value));
  } catch {
    return `${Number(value).toFixed(2)} ${currency}`;
  }
}

function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "待采集";
  return new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 1 }).format(Number(value));
}

function formatDate(value) {
  if (!value) return "待记录";
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return escapeHTML(value);
  return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function linkButton(url, label = "打开来源") {
  const safe = httpUrl(url);
  if (!safe) return "";
  return `<a class="external-link" href="${escapeHTML(safe)}" target="_blank" rel="noreferrer" title="${escapeHTML(label)}" aria-label="${escapeHTML(label)}"><span data-icon="external-link"></span></a>`;
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

function selectedSources() {
  return $$("#sourceOptions input:checked").map((input) => input.value);
}

function updateSourceCount() {
  $("#selectedSources").textContent = `${selectedSources().length} 个数据源`;
}

function setLoading(active, sources = []) {
  const status = $("#runStatus");
  const button = $("#runButton");
  clearInterval(loadingTimer);
  clearInterval(elapsedTimer);
  if (!active) {
    status.classList.add("hidden");
    button.disabled = false;
    button.innerHTML = `<span data-icon="search"></span><span>开始洞察</span>`;
    renderIcons(button);
    return;
  }

  status.classList.remove("hidden");
  button.disabled = true;
  button.innerHTML = `<span data-icon="loader-circle" class="spinner"></span><span>研究中</span>`;
  $("#runStatusTitle").textContent = "正在采集公开数据";
  $("#progressFill").style.width = "8%";
  $("#sourceProgress").innerHTML = sources
    .map((source) => `<span data-source="${source}"><span data-icon="clock-3"></span>${sourceNames[source]}</span>`)
    .join("");
  renderIcons(status);

  let progress = 8;
  let sourceIndex = 0;
  loadingTimer = setInterval(() => {
    progress = Math.min(88, progress + Math.max(1, Math.round((90 - progress) / 10)));
    $("#progressFill").style.width = `${progress}%`;
    const source = sources[sourceIndex];
    if (source) {
      const item = $(`[data-source="${source}"]`, $("#sourceProgress"));
      item?.classList.add("done");
      if (item) item.innerHTML = `<span data-icon="check"></span>${sourceNames[source]}`;
      renderIcons(item);
      sourceIndex += 1;
    }
  }, 1700);

  const started = Date.now();
  elapsedTimer = setInterval(() => {
    const seconds = Math.floor((Date.now() - started) / 1000);
    $("#runElapsed").textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
  }, 1000);
}

function sectionTitle(id, icon, title, note = "", tools = "") {
  return `<div class="section-title-row"><div><span data-icon="${icon}"></span><div><h2 id="${id}-title">${escapeHTML(title)}</h2>${note ? `<p class="section-note">${escapeHTML(note)}</p>` : ""}</div></div>${tools}</div>`;
}

function renderExecutive(report) {
  const e = report.executive;
  const signals = report.signals;
  const signalItems = [
    ["需求", signals.demand, "公开需求信号"],
    ["竞争", signals.competition, "数值越高越拥挤"],
    ["痛点缺口", signals.painGap, "可解决问题强度"],
    ["溢价", signals.premium, "价格分层空间"],
    ["可行性", signals.feasibility, "当前验证条件"],
  ];
  return `<section class="report-section" id="overview" aria-labelledby="overview-title">
    ${sectionTitle("overview", "layout-dashboard", `${report.query} · 决策总览`, `${report.market} 站点 · 英文检索词：${report.englishQuery}`,
      `<div class="action-bar"><button class="secondary-btn" id="copySummary" type="button"><span data-icon="copy"></span>复制结论</button></div>`)}
    <div class="panel executive-grid">
      <div class="verdict-panel">
        <div class="verdict-row"><span class="verdict-badge ${escapeHTML(e.tone)}">${escapeHTML(e.verdict)}</span><small>${formatDate(report.generatedAt)}</small></div>
        <h3>${escapeHTML(e.oneLiner)}</h3>
        <div class="condition-line"><span data-icon="shield-check"></span><span><strong>进入条件：</strong>${escapeHTML(e.condition)}</span></div>
      </div>
      <div class="score-panel"><div class="score-ring" style="--score:${Number(e.score) || 0}"><strong>${formatNumber(e.score)}</strong></div><span>机会指数 / 100</span></div>
      <div class="score-panel"><div class="score-ring" style="--score:${Number(e.confidence) || 0}"><strong>${formatNumber(e.confidence)}</strong></div><span>证据置信度 / 100</span></div>
    </div>
    <div class="panel signal-grid">
      ${signalItems.map(([label, value, note]) => `<div class="signal-item"><span class="signal-label">${label}</span><div class="signal-value"><strong>${formatNumber(value)}</strong><small>${note}</small></div><div class="mini-track"><i style="width:${Math.max(0, Math.min(100, Number(value) || 0))}%"></i></div></div>`).join("")}
    </div>
    <div class="notice"><span data-icon="info"></span><p><strong>口径：</strong>事实来自当次公开页面与用户工作簿；份额属于工作簿估算；机会、竞争和可行性为模型推断；未抓到的数据明确标为待采集。</p></div>
  </section>`;
}

function renderReferenceMatrices(reference) {
  if (!reference?.used || (!reference.materials?.length && !reference.installMethods?.length)) return "";
  const materialRows = (reference.materials || []).map((item) => `<tr><td><strong>${escapeHTML(item.name)}</strong></td><td>${escapeHTML(item.cost)}</td><td>${escapeHTML(item.appearance)}</td><td>${"●".repeat(Math.max(0, Number(item.durability) || 0))}</td><td>${escapeHTML(item.priceBand)}</td><td>${escapeHTML(item.recommendation)}</td></tr>`).join("");
  const methodRows = (reference.installMethods || []).map((item) => `<tr><td><strong>${escapeHTML(item.name)}</strong></td><td>${escapeHTML(item.share)} <span class="tag">工作簿估算</span></td><td>${escapeHTML(item.difficulty)}</td><td>${escapeHTML(item.returnRisk)}</td><td>${escapeHTML(item.recommendation)}</td></tr>`).join("");
  return `<div class="table-wrap" style="margin-top:12px"><table><thead><tr><th style="width:16%">材料</th><th style="width:9%">成本</th><th>外观</th><th style="width:12%">耐久</th><th style="width:14%">价格带</th><th style="width:20%">建议</th></tr></thead><tbody>${materialRows}</tbody></table></div>
  <div class="table-wrap" style="margin-top:12px"><table><thead><tr><th style="width:22%">安装方式</th><th style="width:20%">北美份额</th><th style="width:12%">难度</th><th style="width:12%">退修风险</th><th>建议</th></tr></thead><tbody>${methodRows}</tbody></table></div>`;
}

function renderMarket(report) {
  const s = report.marketStats;
  const currency = report.pricing?.currency || marketCurrencies[report.market] || "USD";
  return `<section class="report-section" id="market" aria-labelledby="market-title">
    ${sectionTitle("market", "chart-no-axes-combined", "市场与价格", "价格来自当前可见零售样本")}
    <div class="panel stat-grid">
      <div class="stat-item"><span>竞品样本</span><strong>${formatNumber(s.competitorCount)}</strong></div>
      <div class="stat-item"><span>最低可见价</span><strong>${formatMoney(s.priceMin, currency)}</strong></div>
      <div class="stat-item"><span>样本中位价</span><strong>${formatMoney(s.priceMedian, currency)}</strong></div>
      <div class="stat-item"><span>最高可见价</span><strong>${formatMoney(s.priceMax, currency)}</strong></div>
      <div class="stat-item"><span>来源成功覆盖</span><strong>${formatNumber(s.sourceCoverage)}%</strong></div>
    </div>
    <div class="panel pricing-panel" style="margin-top:12px"><div class="panel-head"><div><h3>测试价格梯度</h3><p>进入毛利核算前的产品建议</p></div></div><div class="price-stack">
        <div class="price-tier"><span>入门款</span><small>验证转化</small><strong>${formatMoney(report.pricing.entry, currency)}</strong></div>
        <div class="price-tier"><span>核心款</span><small>主推成交</small><strong>${formatMoney(report.pricing.core, currency)}</strong></div>
        <div class="price-tier"><span>高配款</span><small>验证溢价</small><strong>${formatMoney(report.pricing.premium, currency)}</strong></div>
      </div><p class="pricing-logic">${escapeHTML(report.pricing.logic)}</p></div>
    ${renderReferenceMatrices(report.reference)}
  </section>`;
}

function renderChannels(report) {
  const statusMap = new Map((report.sourceStatuses || []).map((item) => [item.source, item]));
  const cards = (report.channelOverview || []).map((channel) => {
    const sources = (channel.sources || []).map((source) => {
      const status = statusMap.get(source);
      return `<li><strong>${escapeHTML(sourceNames[source] || source)}</strong><span>${status ? `${formatNumber(status.count)} 条` : "未选择"}</span></li>`;
    }).join("");
    return `<article class="channel-card"><header><div><span class="eyebrow">${escapeHTML(channel.key)}</span><h3>${escapeHTML(channel.title)}</h3></div><span class="state-pill ${escapeHTML(channel.state)}">${escapeHTML(stateNames[channel.state] || channel.state)}</span></header><strong class="channel-count">${formatNumber(channel.count)} <small>条可见样本</small></strong><p>${escapeHTML(channel.purpose)}</p><ul>${sources}</ul></article>`;
  }).join("");
  return `<section class="report-section" id="channels" aria-labelledby="channels-title">
    ${sectionTitle("channels", "globe", "渠道证据矩阵", "零售、用户声音、趋势和供应端分组统计，不混用分母")}
    <div class="channel-grid">${cards}</div>
  </section>`;
}

function renderCompetitors(report) {
  const currency = marketCurrencies[report.market] || "USD";
  const rows = (report.competitors || []).map((item) => {
    const image = httpUrl(item.image);
    return `<tr><td><div class="product-cell">${image ? `<img src="${escapeHTML(image)}" alt="${escapeHTML(item.title)}" loading="lazy">` : `<span class="image-placeholder" data-icon="package-search"></span>`}<div><strong>${escapeHTML(item.title || "未命名商品")}</strong><small>${escapeHTML(item.asin || item.source || "市场样本")}</small></div></div></td><td><strong>${formatMoney(item.price, item.source === "Amazon" && report.reference?.used ? "USD" : currency)}</strong></td><td>${item.rating ? `${formatNumber(item.rating)} / 5` : "待采集"}</td><td>${formatNumber(item.reviewCount)}</td><td>${escapeHTML(item.source || "公开网页")}</td><td>${linkButton(item.url, "打开商品页面")}</td></tr>`;
  }).join("");
  return `<section class="report-section" id="competitors" aria-labelledby="competitors-title">
    ${sectionTitle("competitors", "package-search", "竞品样本", `共 ${report.competitors?.length || 0} 条；排序仅代表采集顺序，不代表销量排名`)}
    <div class="table-wrap"><table><thead><tr><th style="width:45%">商品</th><th style="width:13%">可见价格</th><th style="width:10%">评分</th><th style="width:12%">评论数</th><th style="width:12%">来源</th><th style="width:8%">链接</th></tr></thead><tbody>${rows || `<tr><td colspan="6">未获取到竞品样本，请查看数据源状态。</td></tr>`}</tbody></table></div>
  </section>`;
}

function renderSupply(report) {
  const supply = report.supply || {};
  const items = supply.items || [];
  const priceBands = (supply.priceBands || []).map((band) => `<div class="supply-stat"><span>${escapeHTML(band.currency)} 批发价</span><strong>${formatMoney(band.median, band.currency)}</strong><small>${formatMoney(band.min, band.currency)} - ${formatMoney(band.max, band.currency)} · ${formatNumber(band.sampleCount)} 个有价样本</small></div>`).join("");
  const sourceStatuses = (report.sourceStatuses || []).filter((item) => item.source === "alibaba");
  const actionRows = sourceStatuses.map((item) => `<div class="supply-action"><div><strong>${escapeHTML(sourceNames[item.source] || item.source)}</strong><p>${escapeHTML(item.message)}</p></div><span class="state-pill ${escapeHTML(item.state)}">${escapeHTML(stateNames[item.state] || item.state)}</span>${linkButton(item.url, `打开 ${sourceNames[item.source] || item.source}`)}</div>`).join("");
  const rows = items.map((item) => {
    const image = httpUrl(item.image);
    return `<tr><td><div class="product-cell">${image ? `<img src="${escapeHTML(image)}" alt="${escapeHTML(item.title)}" loading="lazy">` : `<span class="image-placeholder" data-icon="package-search"></span>`}<div><strong>${escapeHTML(item.title || "未命名供应商品")}</strong><small>${escapeHTML(item.supplier || item.id || "供应商待采集")}</small></div></div></td><td><strong>${formatMoney(item.price, item.currency || "CNY")}</strong></td><td>${item.moq ? formatNumber(item.moq) : "待采集"}</td><td>${escapeHTML(item.source || "供应端")}</td><td>${linkButton(item.url, "打开供应商品")}</td></tr>`;
  }).join("");
  return `<section class="report-section" id="supply" aria-labelledby="supply-title">
    ${sectionTitle("supply", "list-filter", "出口供应端洞察", `Alibaba.com 英文检索词：${supply.query || report.englishQuery}；批发价不等于到岸成本`)}
    ${priceBands ? `<div class="supply-stats">${priceBands}</div>` : ""}
    <div class="panel supply-guidance"><span data-icon="info"></span><p>${escapeHTML(supply.guidance || "待获取供应样本。")}</p></div>
    ${items.length ? `<div class="table-wrap" style="margin-top:12px"><table><thead><tr><th style="width:52%">供应商品</th><th style="width:14%">批发价</th><th style="width:12%">MOQ</th><th style="width:14%">来源</th><th style="width:8%">链接</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="panel supply-actions">${actionRows || `<p>未选择 Alibaba.com 数据源。</p>`}</div>`}
  </section>`;
}

function renderUsers(report) {
  const personas = (report.personas || []).map((item) => `<article class="persona-item"><header><h3>${escapeHTML(item.name)}</h3><span class="tag">${escapeHTML(item.priority)}</span></header><p>${escapeHTML(item.behavior)}</p><small>${escapeHTML(item.value)}</small></article>`).join("");
  const emotions = report.emotions || {};
  const painRows = (report.pains || []).slice(0, 8).map((item) => `<div class="pain-row"><strong>${escapeHTML(item.label)}</strong><div class="pain-bar"><i style="width:${Math.max(0, Math.min(100, Number(item.strength) || 0))}%"></i></div><span>${formatNumber(item.count)} 条</span></div>`).join("");
  const voiceRows = (report.voices || []).map((item) => `<article class="voice-row"><div><span class="tag">${escapeHTML(sourceNames[item.source] || item.source)}</span><small>${escapeHTML(item.context || "")}</small></div><h3>${escapeHTML(item.title || "未命名声音样本")}</h3><p>${escapeHTML(item.snippet || "原文无可见正文")}</p>${linkButton(item.url, "打开原始声音")}</article>`).join("");
  return `<section class="report-section" id="users" aria-labelledby="users-title">
    ${sectionTitle("users", "users", "用户、情绪与问题", "评论、问答与社区文本聚类；样本量不足时只作为方向")}
    <div class="insight-grid">${personas}</div>
    <div class="emotion-grid">
      <article class="emotion-item"><h3>痛点 Pain</h3><p>${escapeHTML(emotions.pain)}</p></article>
      <article class="emotion-item"><h3>痒点 Itch</h3><p>${escapeHTML(emotions.itch)}</p></article>
      <article class="emotion-item"><h3>爽点 Pleasure</h3><p>${escapeHTML(emotions.pleasure)}</p></article>
    </div>
    <div class="panel pain-list" style="margin-top:12px">${painRows || `<div class="pain-row"><span>当前没有足够文本形成问题聚类</span></div>`}</div>
    <div class="voice-list">${voiceRows || `<div class="panel voice-empty">当前没有可展示的 Amazon 书面评论、Reddit 或 YouTube 原始样本。</div>`}</div>
  </section>`;
}

function renderOpportunities(report) {
  const rows = (report.opportunities || []).map((item) => `<div class="opportunity-row"><span class="priority-badge ${item.priority.toLowerCase()}">${escapeHTML(item.priority)}</span><div><h3>${escapeHTML(item.title)}</h3><small>${escapeHTML(item.evidenceLabel)} · ${formatNumber(item.evidenceCount)} 条信号 · ${item.evidenceStatus === "hypothesis" ? "待验证假设" : "证据支持"}</small></div><div><strong>产品动作</strong><p>${escapeHTML(item.action)}</p></div><div><strong>验收口径</strong><p>${escapeHTML(item.validation)}</p></div></div>`).join("");
  return `<section class="report-section" id="opportunities" aria-labelledby="opportunities-title">
    ${sectionTitle("opportunities", "lightbulb", "机会优先级", "P0 决定能否上市，P1 决定体验，P2 用于拉开可感知差异")}
    <div class="panel opportunity-list">${rows || `<div class="opportunity-row"><span>待补充用户证据后排序</span></div>`}</div>
  </section>`;
}

function iconList(items, icon, className) {
  return `<ul class="${className}">${(items || []).map((item) => `<li><span data-icon="${icon}"></span><span>${escapeHTML(item)}</span></li>`).join("")}</ul>`;
}

function renderDefinition(report) {
  const p = report.productDefinition || {};
  const groups = report.keywordGroups || {};
  const opportunityChecks = (report.opportunities || []).map((item) => `${item.priority} · ${item.validation}`);
  return `<section class="report-section" id="definition" aria-labelledby="definition-title">
    ${sectionTitle("definition", "target", "产品定义与研发验收", "从用户任务反推规格，不把未验证卖点写进 Listing")}
    <div class="definition-grid">
      <article class="definition-block wide"><h3>产品概念</h3><p>${escapeHTML(p.concept)}</p></article>
      <article class="definition-block"><h3>核心用户</h3><p>${escapeHTML(p.coreUser)}</p></article>
      <article class="definition-block"><h3>用户任务</h3><p>${escapeHTML(p.job)}</p></article>
      <article class="definition-block"><h3>Must-have</h3>${iconList(p.mustHave, "check", "check-list")}</article>
      <article class="definition-block"><h3>差异化</h3>${iconList(p.differentiators, "circle-check", "check-list")}</article>
      <article class="definition-block"><h3>禁止承诺</h3>${iconList(p.doNotClaim, "triangle-alert", "warning-list")}</article>
      <article class="definition-block"><h3>研发/质量验收</h3>${iconList(opportunityChecks, "shield-check", "check-list")}</article>
      <article class="definition-block wide"><h3>关键词结构</h3>
        <p>核心词</p><ul class="keyword-list">${(groups.core || []).map((word) => `<li>${escapeHTML(word)}</li>`).join("") || "<li>待采集</li>"}</ul>
        <p>属性词</p><ul class="keyword-list">${(groups.attributes || []).map((word) => `<li>${escapeHTML(word)}</li>`).join("") || "<li>待采集</li>"}</ul>
        <p>长尾词</p><ul class="keyword-list">${(groups.longTail || []).map((word) => `<li>${escapeHTML(word)}</li>`).join("") || "<li>待采集</li>"}</ul>
      </article>
    </div>
  </section>`;
}

function renderLaunch(report) {
  const phases = (report.launchPlan || []).map((phase) => `<article class="launch-phase"><span class="phase-kicker">${escapeHTML(phase.phase)}</span><h3>${escapeHTML(phase.title)}</h3><small>${escapeHTML(phase.owner)}</small><ul>${(phase.actions || []).map((action) => `<li>${escapeHTML(action)}</li>`).join("")}</ul><div class="gate"><strong>放行门槛：</strong>${escapeHTML(phase.gate)}</div></article>`).join("");
  const north = report.northStar || {};
  return `<section class="report-section" id="launch" aria-labelledby="launch-title">
    ${sectionTitle("launch", "rocket", "90天上市计划", "每个阶段有负责人、动作与放行门槛")}
    <div class="panel launch-timeline">${phases}</div>
    <div class="panel north-star"><div><span class="eyebrow">North Star</span><strong>${escapeHTML(north.metric)}</strong></div><div><p>${escapeHTML(north.definition)}</p><ul class="keyword-list">${(north.guardrails || []).map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul></div></div>
  </section>`;
}

function renderEvidence(report) {
  const seen = new Set();
  const statuses = (report.sourceStatuses || []).filter((item) => {
    const key = `${item.source}-${item.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const sourceRows = statuses.map((item) => `<div class="source-row"><strong>${escapeHTML(sourceNames[item.source] || item.source)}</strong><span class="state-pill ${escapeHTML(item.state)}">${escapeHTML(stateNames[item.state] || item.state)}</span><span>${formatNumber(item.count)} 条</span><p>${escapeHTML(item.message || "无补充信息")}</p>${linkButton(item.url, "打开数据源")}</div>`).join("");
  const evidenceRows = (report.evidence || []).map((item) => `<div class="evidence-row"><strong>${escapeHTML(sourceNames[item.source] || item.source)}</strong><p>${escapeHTML(item.claim || "未记录主张")}</p><span class="confidence-chip">${escapeHTML(confidenceNames[item.confidence] || item.confidence || "待评估")}</span><small>${formatDate(item.capturedAt)}</small>${linkButton(item.url, "打开证据")}</div>`).join("");
  const tools = `<div class="evidence-tools"><button class="secondary-btn" id="exportMarkdown" type="button"><span data-icon="file-text"></span>Markdown</button><button class="secondary-btn" id="exportJson" type="button"><span data-icon="download"></span>JSON</button></div>`;
  return `<section class="report-section" id="evidence" aria-labelledby="evidence-title">
    ${sectionTitle("evidence", "database", "数据源与证据台账", `${report.marketStats?.evidenceCount || 0} 条证据记录；失败、受限和需操作来源保留可见`, tools)}
    <div class="panel source-list">${sourceRows || `<div class="source-row"><span>没有数据源状态</span></div>`}</div>
    <div class="panel evidence-list" style="margin-top:12px">${evidenceRows || `<div class="evidence-row"><span>当前没有可展示证据</span></div>`}</div>
    <div class="content-panel panel" style="margin-top:12px"><h3>方法来源</h3><ul class="method-list">${(report.methodology || []).map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul></div>
  </section>`;
}

function renderReport(report) {
  currentReport = report;
  const root = $("#reportRoot");
  root.innerHTML = [renderExecutive(report), renderMarket(report), renderChannels(report), renderCompetitors(report), renderSupply(report), renderUsers(report), renderOpportunities(report), renderDefinition(report), renderLaunch(report), renderEvidence(report)].join("");
  renderIcons(root);
  bindReportActions();
  $$('img', root).forEach((image) => image.addEventListener("error", () => {
    const placeholder = document.createElement("span");
    placeholder.className = "image-placeholder";
    placeholder.dataset.icon = "package-search";
    image.replaceWith(placeholder);
    renderIcons(placeholder.parentElement);
  }, { once: true }));
}

function markdownReport(report) {
  const lines = [
    `# ${report.query} 产品机会洞察`,
    "",
    `- 站点：${report.market}`,
    `- 英文检索词：${report.englishQuery}`,
    `- 生成时间：${report.generatedAt}`,
    `- 决策：${report.executive.verdict}`,
    `- 机会指数：${report.executive.score}/100（方向性指数）`,
    `- 置信度：${report.executive.confidence}/100`,
    "",
    "## 核心结论",
    "",
    report.executive.oneLiner,
    "",
    `进入条件：${report.executive.condition}`,
    "",
    "## 机会优先级",
    "",
    ...(report.opportunities || []).map((item) => `- ${item.priority} ${item.title}：${item.action}；验收：${item.validation}`),
    "",
    "## 产品定义",
    "",
    `- 概念：${report.productDefinition?.concept || "待定义"}`,
    `- 核心用户：${report.productDefinition?.coreUser || "待定义"}`,
    `- 用户任务：${report.productDefinition?.job || "待定义"}`,
    "",
    "## 渠道与供应端",
    "",
    ...(report.channelOverview || []).map((item) => `- ${item.title}：${item.count} 条可见样本，状态 ${stateNames[item.state] || item.state}`),
    `- Alibaba.com 英文检索词：${report.supply?.query || report.englishQuery}`,
    `- 供应端判断：${report.supply?.guidance || "待采集"}`,
    "",
    "## 证据",
    "",
    ...(report.evidence || []).map((item) => `- [${sourceNames[item.source] || item.source}] ${item.claim}${httpUrl(item.url) ? `：${item.url}` : ""}`),
    "",
    "> 评分为方向性信号指数，不是 Amazon 官方销量或市场规模。",
  ];
  return lines.join("\n");
}

function downloadFile(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 500);
}

function bindReportActions() {
  $("#copySummary")?.addEventListener("click", async () => {
    const text = `${currentReport.executive.verdict}｜${currentReport.executive.oneLiner}\n进入条件：${currentReport.executive.condition}`;
    try {
      await navigator.clipboard.writeText(text);
      showToast("结论已复制");
    } catch {
      showToast("浏览器未授权剪贴板");
    }
  });
  $("#exportJson")?.addEventListener("click", () => {
    downloadFile(`${currentReport.englishQuery.replace(/[^a-z0-9]+/gi, "-") || "market-insight"}.json`, JSON.stringify(currentReport, null, 2), "application/json;charset=utf-8");
    showToast("JSON 已导出");
  });
  $("#exportMarkdown")?.addEventListener("click", () => {
    downloadFile(`${currentReport.englishQuery.replace(/[^a-z0-9]+/gi, "-") || "market-insight"}.md`, markdownReport(currentReport), "text/markdown;charset=utf-8");
    showToast("Markdown 已导出");
  });
}

async function fetchReport(url, options) {
  $("#errorBanner").classList.add("hidden");
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.detail || payload.error || `HTTP ${response.status}`);
  return payload;
}

function apiEndpoint(path) {
  return apiBaseUrl ? `${apiBaseUrl}${path}` : path;
}

function openLocalResearch(query, market, depth, sources) {
  const localUrl = new URL(apiBaseUrl || "http://127.0.0.1:4177");
  localUrl.searchParams.set("query", query);
  localUrl.searchParams.set("market", market);
  localUrl.searchParams.set("depth", depth);
  localUrl.searchParams.set("sources", sources.join(","));
  localUrl.searchParams.set("autorun", "1");
  window.location.assign(localUrl.href);
}

async function loadReference({ scroll = false } = {}) {
  const sources = ["amazon", "reference-workbook"];
  setLoading(true, sources);
  try {
    let report;
    try {
      report = await fetchReport(apiEndpoint("/api/reference"));
      apiAvailable = true;
    } catch (apiError) {
      if (!staticMode) throw apiError;
      apiAvailable = false;
      report = await fetchReport("./data/reference-report.json");
    }
    $("#progressFill").style.width = "100%";
    renderReport(report);
    if (scroll) $("#overview").scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    showError(error.message);
    renderEmpty();
  } finally {
    setLoading(false);
  }
}

async function runResearch(event) {
  event.preventDefault();
  const query = $("#queryInput").value.trim();
  const sources = selectedSources();
  if (!query) return;
  if (!sources.length) {
    showError("至少选择一个数据源。", true);
    return;
  }
  const depth = $('input[name="depth"]:checked').value;
  if (staticMode) {
    openLocalResearch(query, $("#marketSelect").value, depth, sources);
    return;
  }
  setLoading(true, sources);
  try {
    const report = await fetchReport(apiEndpoint("/api/research"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, market: $("#marketSelect").value, depth, sources }),
    });
    apiAvailable = true;
    $("#progressFill").style.width = "100%";
    renderReport(report);
    $("#overview").scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    const offline = staticMode && /Failed to fetch|NetworkError|Load failed|fetch/i.test(error.message);
    showError(offline
      ? "未连接本机研究引擎。请保持 OPC 洞察服务在 127.0.0.1:4177 运行后重试。"
      : error.message, true);
  } finally {
    setLoading(false);
  }
}

function showError(message, retainReport = false) {
  $("#errorText").textContent = message;
  $("#errorBanner").classList.remove("hidden");
  if (!retainReport) currentReport = null;
}

function renderEmpty() {
  $("#reportRoot").innerHTML = `<div class="empty-state"><div><span data-icon="package-search"></span><h2>暂无洞察报告</h2><p>输入产品名称后，系统将显示本次可验证的数据和未采集项。</p></div></div>`;
  renderIcons($("#reportRoot"));
}

function bindNavigation() {
  $("#reportNav").addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link) return;
    $$("#reportNav a").forEach((item) => item.classList.toggle("active", item === link));
    $(".sidebar").classList.remove("open");
  });
  $("#mobileNavButton").addEventListener("click", () => $(".sidebar").classList.toggle("open"));
}

function applyLaunchRequest() {
  if (staticMode) return false;
  const params = new URLSearchParams(window.location.search);
  const query = params.get("query")?.trim();
  if (!query) return false;

  $("#queryInput").value = query;
  const market = params.get("market");
  if ([...$("#marketSelect").options].some((option) => option.value === market)) {
    $("#marketSelect").value = market;
  }
  const depth = params.get("depth");
  const depthInput = $$('input[name="depth"]').find((input) => input.value === depth);
  if (depthInput) depthInput.checked = true;
  const requestedSources = new Set((params.get("sources") || "").split(",").filter(Boolean));
  if (requestedSources.size) {
    $$("#sourceOptions input").forEach((input) => { input.checked = requestedSources.has(input.value); });
  }
  updateSourceCount();

  if (params.get("autorun") === "1") {
    window.history.replaceState({}, "", window.location.pathname);
    setTimeout(() => $("#researchForm").requestSubmit(), 0);
    return true;
  }
  return false;
}

async function checkHealth() {
  try {
    const result = await fetchReport(apiEndpoint("/api/health"));
    apiAvailable = true;
    $("#serviceLabel").textContent = staticMode
      ? `本机实时引擎 ${result.version}`
      : `${result.service} ${result.version}`;
    $(".service-state i").style.background = "";
  } catch {
    apiAvailable = false;
    $("#serviceLabel").textContent = staticMode ? "GitHub 参考报告版" : "服务异常";
    $(".service-state i").style.background = staticMode ? "#b98210" : "#b42318";
  }
}

function init() {
  renderIcons();
  bindNavigation();
  $("#researchForm").addEventListener("submit", runResearch);
  $("#referenceButton").addEventListener("click", () => loadReference({ scroll: true }));
  $("#settingsButton").addEventListener("click", () => $("#settingsDialog").showModal());
  $("#saveSettings").addEventListener("click", () => {
    updateSourceCount();
    localStorage.setItem("opc-insight-sources", JSON.stringify(selectedSources()));
    localStorage.setItem("opc-insight-sources-version", sourceSettingsVersion);
    showToast("数据源设置已保存");
  });
  $("#dismissError").addEventListener("click", () => $("#errorBanner").classList.add("hidden"));
  const saved = JSON.parse(localStorage.getItem("opc-insight-sources") || "null");
  if (Array.isArray(saved) && saved.length) {
    const storedVersion = localStorage.getItem("opc-insight-sources-version");
    const available = new Set($$("#sourceOptions input").map((input) => input.value));
    const migrated = storedVersion === sourceSettingsVersion
      ? saved.filter((source) => available.has(source))
      : [...new Set([...saved.filter((source) => available.has(source)), "alibaba"])];
    $$("#sourceOptions input").forEach((input) => { input.checked = migrated.includes(input.value); });
    localStorage.setItem("opc-insight-sources", JSON.stringify(migrated));
    localStorage.setItem("opc-insight-sources-version", sourceSettingsVersion);
  }
  updateSourceCount();
  const launchedFromGitHub = applyLaunchRequest();
  checkHealth();
  if (!launchedFromGitHub) loadReference();
}

init();
