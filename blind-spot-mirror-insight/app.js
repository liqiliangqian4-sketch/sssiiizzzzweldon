import { renderIcons } from "./vendor/icons.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const sourceNames = {
  amazon: "Amazon 商品与评论",
  reddit: "Reddit",
  youtube: "YouTube",
  "youtube-comments": "YouTube 评论",
  news: "Google News",
  "google-trends": "Google Trends",
  "bing-images": "Bing Images",
  "bing-web": "Bing Web",
  hackernews: "Hacker News 评论",
  stackexchange: "Stack Exchange 问答",
  "reference-workbook": "参考工作簿",
  "seller-sprite": "卖家精灵快照",
};

const marketCurrencies = { US: "USD", DE: "EUR", UK: "GBP", CA: "CAD" };
const stateNames = { success: "成功", limited: "受限", action_required: "需操作", failed: "失败", not_selected: "未选择", partial: "数据不足", empty: "数据为空" };
const confidenceNames = { 高: "高", 中: "中", 低: "低", high: "高", medium: "中", low: "低" };
const appConfig = globalThis.OPC_APP_CONFIG || {};
const apiBaseUrl = String(appConfig.apiBaseUrl || "").replace(/\/$/, "");
const staticMode = Boolean(appConfig.staticMode);
const reportOnly = Boolean(appConfig.reportOnly);
let apiAvailable = !staticMode;

let currentReport = null;
let loadingTimer = null;
let elapsedTimer = null;
let toastTimer = null;
const sourceSettingsVersion = "2026-08-03-product-shape-v2";

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
  $("#selectedSources").textContent = `${selectedSources().length} 个公开来源 · 深度模式`;
}

function setLoading(active, sources = []) {
  const status = $("#runStatus");
  const button = $("#runButton");
  clearInterval(loadingTimer);
  clearInterval(elapsedTimer);
  if (!active) {
    status.classList.add("hidden");
    button.disabled = reportOnly;
    button.innerHTML = reportOnly
      ? `<span data-icon="circle-check"></span><span>报告已生成</span>`
      : `<span data-icon="search"></span><span>开始洞察</span>`;
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

function renderCollectionStatus(report) {
  const status = report.collectionStatus || {};
  const amazon = status.amazon || {};
  const asins = amazon.asins || {};
  const reviews = amazon.writtenReviews || {};
  const forums = status.forums || {};
  const metric = (label, item) => {
    const gap = item.met ? "Target met" : "Gap " + formatNumber(Math.max(0, Number(item.target || 0) - Number(item.actual || 0)));
    return `<div class="collection-metric"><span>${label}</span><strong>${formatNumber(item.actual || 0)} / ${formatNumber(item.target || 0)}</strong><small class="${item.met ? "met" : "missing"}">${gap}</small></div>`;
  };
  return `<div class="panel collection-status"><div class="collection-status-head"><div><span class="eyebrow">Evidence coverage</span><h3>本次采集是否达到研究门槛</h3><p>只统计本次公开采集结果；参考报告、估算值和商品评论量不会计入下方数量。</p></div><span class="state-pill ${status.overallTargetMet ? "success" : "limited"}">${status.overallTargetMet ? "全部达标" : "存在数据缺口"}</span></div><div class="collection-grid">${metric("Amazon ASIN 商品", asins)}${metric("Amazon 书面评论", reviews)}${metric("论坛 / 社区样本", forums)}</div><p class="collection-note">搜索页已读取 ${formatNumber(amazon.searchPagesFetched || 0)} 页；评论尝试覆盖 ${formatNumber(amazon.reviewAsinsAttempted || 0)} 个 ASIN。停止原因：${escapeHTML(amazon.stopReason || "未采集")}. 未达标时，机会点只能作为待验证方向。</p></div>`;
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
    ${renderCollectionStatus(report)}
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
  const sourceStatuses = (report.sourceStatuses || []).filter((item) => ["alibaba", "1688"].includes(item.source));
  const actionRows = sourceStatuses.map((item) => `<div class="supply-action"><div><strong>${escapeHTML(sourceNames[item.source] || item.source)}</strong><p>${escapeHTML(item.message)}</p></div><span class="state-pill ${escapeHTML(item.state)}">${escapeHTML(stateNames[item.state] || item.state)}</span>${linkButton(item.url, `打开 ${sourceNames[item.source] || item.source}`)}</div>`).join("");
  const rows = items.map((item) => {
    const image = httpUrl(item.image);
    return `<tr><td><div class="product-cell">${image ? `<img src="${escapeHTML(image)}" alt="${escapeHTML(item.title)}" loading="lazy">` : `<span class="image-placeholder" data-icon="package-search"></span>`}<div><strong>${escapeHTML(item.title || "未命名供应商品")}</strong><small>${escapeHTML(item.supplier || item.id || "供应商待采集")}</small></div></div></td><td><strong>${formatMoney(item.price, item.currency || "CNY")}</strong></td><td>${item.moq ? formatNumber(item.moq) : "待采集"}</td><td>${escapeHTML(item.source || "供应端")}</td><td>${linkButton(item.url, "打开供应商品")}</td></tr>`;
  }).join("");
  return `<section class="report-section" id="supply" aria-labelledby="supply-title">
    ${sectionTitle("supply", "list-filter", "出口供应端洞察", `Alibaba.com / 1688 检索词：${supply.query || report.englishQuery}；批发价不等于到岸成本`)}
    ${priceBands ? `<div class="supply-stats">${priceBands}</div>` : ""}
    <div class="panel supply-guidance"><span data-icon="info"></span><p>${escapeHTML(supply.guidance || "待获取供应样本。")}</p></div>
    ${items.length ? `<div class="table-wrap" style="margin-top:12px"><table><thead><tr><th style="width:52%">供应商品</th><th style="width:14%">批发价</th><th style="width:12%">MOQ</th><th style="width:14%">来源</th><th style="width:8%">链接</th></tr></thead><tbody>${rows}</tbody></table></div>` : `<div class="panel supply-actions">${actionRows || `<p>未选择 Alibaba.com / 1688 数据源。</p>`}</div>`}
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
  const visibleSources = new Set(["amazon", "reddit", "youtube", "youtube-comments", "news", "google-trends", "bing-images", "hackernews", "stackexchange", "reference-workbook", "seller-sprite"]);
  const statuses = (report.sourceStatuses || []).filter((item) => visibleSources.has(item.source)).filter((item) => {
    const key = `${item.source}-${item.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const sourceRows = statuses.map((item) => `<div class="source-row"><strong>${escapeHTML(sourceNames[item.source] || item.source)}</strong><span class="state-pill ${escapeHTML(item.state)}">${escapeHTML(stateNames[item.state] || item.state)}</span><span>${formatNumber(item.count)} 条</span><p>${escapeHTML(item.message || "无补充信息")}</p>${linkButton(item.url, "打开数据源")}</div>`).join("");
  const evidenceRows = (report.evidence || []).filter((item) => visibleSources.has(item.source)).map((item) => `<div class="evidence-row"><strong>${escapeHTML(sourceNames[item.source] || item.source)}</strong><p>${escapeHTML(item.claim || "未记录主张")}</p><span class="confidence-chip">${escapeHTML(confidenceNames[item.confidence] || item.confidence || "待评估")}</span><small>${formatDate(item.capturedAt)}</small>${linkButton(item.url, "打开证据")}</div>`).join("");
  const tools = `<div class="evidence-tools"><button class="secondary-btn" id="exportMarkdown" type="button"><span data-icon="file-text"></span>Markdown</button><button class="secondary-btn" id="exportJson" type="button"><span data-icon="download"></span>JSON</button></div>`;
  const methodReference = report.methodReference || {};
  const methodRows = Object.values(methodReference).map((item) => `<article class="method-reference"><header><strong>${escapeHTML(item.name || "研究方法参考")}</strong>${item.published ? `<span>${escapeHTML(item.published)}</span>` : ""}</header><ul>${(item.adopted || []).map((entry) => `<li>${escapeHTML(entry)}</li>`).join("")}</ul>${item.url ? linkButton(item.url, "打开参考") : ""}<small>${escapeHTML(item.notEvidence || "参考方法，不替代本次产品证据")}</small></article>`).join("");
  const review = report.review || {};
  const reviewStats = review.statistics || {};
  return `<section class="report-section" id="evidence" aria-labelledby="evidence-title">
    ${sectionTitle("evidence", "database", "数据源与证据台账", `${report.evidence?.filter((item) => visibleSources.has(item.source)).length || 0} 条证据记录；失败和受限来源保留可见`, tools)}
    <div class="panel source-list">${sourceRows || `<div class="source-row"><span>没有数据源状态</span></div>`}</div>
    <div class="panel evidence-list" style="margin-top:12px">${evidenceRows || `<div class="evidence-row"><span>当前没有可展示证据</span></div>`}</div>
    <div class="content-panel panel" style="margin-top:12px"><h3>方法来源</h3><ul class="method-list">${(report.methodology || []).map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul>${methodRows ? `<div class="method-reference-list">${methodRows}</div>` : ""}</div>
    <div class="review-panel panel" style="margin-top:12px"><div class="panel-head"><div><span class="eyebrow">Review</span><h3>问题统计 / 复盘</h3></div><span>${escapeHTML(review.problem || "本次研究任务")}</span></div><div class="review-stats"><span>来源 ${formatNumber(reviewStats.sourcesSelected || 0)}</span><span>有样本 ${formatNumber(reviewStats.sourcesWithSamples || 0)}</span><span>近一年记录 ${formatNumber(reviewStats.recentRecords || 0)}</span><span>机会 ${formatNumber(reviewStats.opportunitiesWithEvidence || 0)}</span><span>空数据 ${formatNumber(reviewStats.dataGapCount || 0)}</span></div><div class="review-columns"><div><strong>已确认</strong><ul>${(review.confirmed || []).map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul></div><div><strong>未解决</strong><ul>${(review.unresolved || []).map((item) => `<li>${escapeHTML(item)}</li>`).join("") || "<li>无</li>"}</ul></div><div><strong>下一轮动作</strong><ul>${(review.nextActions || []).map((item) => `<li>${escapeHTML(item)}</li>`).join("")}</ul></div></div></div>
  </section>`;
}

function renderProductShape(report) {
  const shape = report.productShape || {};
  const forms = (shape.forms || []).map((form) => {
    const examples = (form.examples || []).map((item) => {
      const image = httpUrl(item.image);
      return `<li>${image ? `<img src="${escapeHTML(image)}" alt="${escapeHTML(item.title || form.label)}" loading="lazy">` : `<span class="shape-image-placeholder" data-icon="package-search"></span>`}<div><strong>${escapeHTML(item.title || "未命名商品")}</strong><small>${escapeHTML(sourceNames[item.source] || item.source || "公开样本")}</small></div>${linkButton(item.url, "打开形态证据")}</li>`;
    }).join("");
    return `<article class="shape-card"><header><div><span class="eyebrow">${escapeHTML(form.key || "form")}</span><h3>${escapeHTML(form.label || "未命名形态")}</h3></div><span class="state-pill ${form.status === "observed" ? "success" : "limited"}">${form.status === "observed" ? "已观察" : "未观察到"}</span></header><strong class="shape-count">${formatNumber(form.evidenceCount || 0)} <small>条形态证据</small></strong><p>${form.sources?.length ? `来源：${escapeHTML(form.sources.map((item) => sourceNames[item] || item).join("、"))}` : "当前没有可核验样本，不代表市场不存在。"}</p>${examples ? `<ul class="shape-examples">${examples}</ul>` : ""}</article>`;
  }).join("");
  return `<section class="report-section" id="product-shape" aria-labelledby="product-shape-title">
    ${sectionTitle("product-shape", "package-search", "产品形态识别", "先根据关键词查询公开商品和视觉样本，再决定后续痛点与机会点的讨论范围")}
    <div class="panel shape-summary"><div><span class="eyebrow">Resolved product family</span><h3>${escapeHTML(shape.category || report.query || "未识别产品")}</h3><p>${escapeHTML(shape.scope || "没有形态识别结果")}</p></div><div class="shape-summary-stat"><strong>${escapeHTML(shape.primaryForm || "形态待确认")}</strong><span>主导形态候选</span></div><div class="shape-summary-stat"><strong>${formatNumber(shape.sampleCount || 0)}</strong><span>形态样本</span></div></div>
    <div class="panel shape-method"><span data-icon="info"></span><p><strong>形态证据口径：</strong>${escapeHTML(shape.method || "只使用公开样本；未抓到的形态不会被补写成结论。")}</p></div>
    <div class="shape-grid">${forms || `<div class="panel evidence-empty">当前关键词没有专属形态规则，页面只保留公开样本，等待人工拆分产品形态。</div>`}</div>
  </section>`;
}

function renderSolutionEvidenceAudit(report) {
  const solution = report.solutionEvidence || {};
  const typeNames = { functional: "功能差异", appearance: "外观差异", scenario: "场景差异", material: "材料差异", installation: "安装差异" };
  const groups = (solution.groups || []).map((group) => {
    const links = (group.evidenceLinks || []).slice(0, 8).map((url) => linkButton(url, "打开关联证据")).join("");
    return `<article class="solution-audit-card"><header><div><span class="eyebrow">${escapeHTML(typeNames[group.differenceType] || group.differenceType || "功能差异")}</span><h3>${escapeHTML(group.opportunityTitle || group.formLabel || "机会点")}</h3></div><span class="state-pill ${group.evidenceStatus === "evidence-backed" ? "success" : "limited"}">${group.evidenceStatus === "evidence-backed" ? "证据支持" : "待验证"}</span></header><p>${escapeHTML(group.whyThisSolvesPain || "当前没有足够的真实原文支持该方案。")}</p><div class="solution-audit-counts"><span>原文 ${formatNumber(group.evidenceCount || 0)}</span><span>Amazon 评论 ${formatNumber(group.reviewEvidenceCount || 0)}</span><span>论坛 ${formatNumber(group.forumEvidenceCount || 0)}</span><span>候选商品 ${formatNumber((group.candidateProducts || []).length)}</span></div><div class="solution-audit-links">${links || "没有可打开的关联证据链接"}</div></article>`;
  }).join("");
  return `<section class="report-section" id="solution-evidence-audit"><div class="section-title-row"><div><span data-icon="link"></span><div><h2>机会点证据绑定</h2><p class="section-note">每个解决方案都必须回到真实评论或论坛原文；候选商品只证明市场上存在该形态。</p></div></div></div><div class="solution-audit-grid">${groups || `<div class="panel evidence-empty">当前没有证据支持的解决方案。</div>`}</div></section>`;
}

function renderSolutionEvidence(report) {
  const solution = report.solutionEvidence || {};
  const statusNames = { product_backed: "有公开商品方案", candidate_only: "只有形态候选", forum_fallback: "论坛链接回退", empty: "暂无可核验方案" };
  const groups = (solution.groups || []).map((group) => {
    const products = (group.products || []).map((item) => {
      const image = httpUrl(item.image);
      const price = item.price !== null && item.price !== undefined ? formatMoney(item.price, item.currency || "USD") : "价格待采集";
      const rating = item.rating ? formatNumber(item.rating) + " / 5" : "评分待采集";
      const reviews = item.reviewCount ? formatNumber(item.reviewCount) + " 条评论" : "评论数待采集";
      const matchTerms = (item.matchedPainTerms || []).join("、");
      return "<article class='solution-product'>"
        + "<div class='solution-product-image'>" + (image ? "<img src='" + escapeHTML(image) + "' alt='" + escapeHTML(item.title || group.formLabel) + "' loading='lazy'>" : "<span class='image-placeholder' data-icon='package-search'></span>") + "</div>"
        + "<div class='solution-product-body'><header><span class='tag'>" + escapeHTML(sourceNames[item.source] || item.source || "公开商品") + "</span><span>" + escapeHTML(item.asin || "") + "</span></header>"
        + "<h4>" + escapeHTML(item.title || "未命名公开方案") + "</h4><p>" + escapeHTML(item.snippet || "公开商品检索命中；请打开页面核对实际规格。") + "</p>"
        + (matchTerms ? "<p class='solution-product-match'><strong>已命中特征：</strong>" + escapeHTML(matchTerms) + "</p>" : "")
        + "<small>" + escapeHTML(price) + " · " + escapeHTML(rating) + " · " + escapeHTML(reviews) + "</small></div>"
        + linkButton(item.url, "打开解决方案商品")
        + "</article>";
    }).join("");
    const candidateProducts = (group.candidateProducts || []).map((item) => {
      return "<article class='solution-product solution-product-candidate'>"
        + "<div class='solution-product-image'><span class='image-placeholder' data-icon='scan-search'></span></div>"
        + "<div class='solution-product-body'><header><span class='tag'>仅形态候选</span><span>未通过痛点核验</span></header>"
        + "<h4>" + escapeHTML(item.title || "未命名候选商品") + "</h4><p>"
        + escapeHTML(item.matchReason || "没有找到与当前痛点对应的特征") + "</p><small>形态命中："
        + escapeHTML((item.matchedFormTerms || []).join("、") || "无") + "</small></div>"
        + linkButton(item.url, "打开候选商品")
        + "</article>";
    }).join("");
    const forumLinks = (group.forumLinks || []).map((item) => {
      const sourceLink = item.sourceUrl && item.sourceUrl !== item.url ? linkButton(item.sourceUrl, "打开原始讨论") : "";
      return "<article class='solution-forum-link'><div><header><span class='tag'>"
        + escapeHTML(sourceNames[item.source] || item.source || "公开讨论") + "</span><span>"
        + escapeHTML(item.linkKind || "原文链接") + "</span><span>" + escapeHTML(item.date || "日期未知")
        + "</span></header><h4>" + escapeHTML(item.title || "用户讨论原文") + "</h4><p>“"
        + escapeHTML(item.quote || "原文无可见正文") + "”</p></div><div class='solution-link-actions'>"
        + linkButton(item.url, "打开用户提到的链接") + sourceLink + "</div></article>";
    }).join("");
    const sourceStates = (group.searchSources || []).map((source) => {
      return escapeHTML(sourceNames[source.source] || source.source) + "：" + escapeHTML(stateNames[source.state] || source.state) + " " + formatNumber(source.count) + " 条";
    }).join(" · ");
    const productMarkup = products ? "<div class='solution-product-list'>" + products + "</div>" : "";
    const candidateMarkup = candidateProducts ? "<div class='solution-candidate-list'><div class='solution-list-label'>同形态候选（未作为解决方案）</div><div class='solution-product-list'>" + candidateProducts + "</div></div>" : "";
    const forumMarkup = forumLinks ? "<div class='solution-forum-list'><div class='solution-list-label'>用户原文 / 评论链接线索</div>" + forumLinks + "</div>" : "";
    const emptyMarkup = !products && !candidateProducts && !forumLinks ? "<div class='panel evidence-empty'>该形态和痛点目前没有可展示的商品或论坛链接。</div>" : "";
    return "<article class='solution-group'><header class='solution-group-head'><div><span class='eyebrow'>"
      + escapeHTML(group.formKey || "form") + " · " + escapeHTML(group.painLabel || "痛点") + "</span><h3>"
      + escapeHTML(group.formLabel || "形态待确认") + " / " + escapeHTML(group.opportunityTitle || "未命名机会")
      + "</h3><p>检索词：" + escapeHTML(group.searchQuery || solution.query || report.englishQuery)
      + "</p></div><span class='state-pill " + escapeHTML(group.status || "empty") + "'>"
      + escapeHTML(group.statusLabel || statusNames[group.status] || "待判断") + "</span></header>"
      + "<div class='solution-group-facts'><div><strong>建议切入差异</strong><p>"
      + escapeHTML(group.differencePoint || "把用户痛点转成可验收规格。") + "</p></div><div><strong>验证门槛</strong><p>"
      + escapeHTML(group.validation || "先做目标场景实测。") + "</p></div></div><p class='solution-group-note'>"
      + escapeHTML(group.note || "") + "</p>" + productMarkup + candidateMarkup + forumMarkup + emptyMarkup
      + "<small class='solution-source-status'>" + sourceStates + "</small></article>";
  }).join("");
  const statusLabel = statusNames[solution.status] || "待判断";
  return "<section class='report-section' id='solutions' aria-labelledby='solutions-title'>"
    + sectionTitle("solutions", "package-search", "解决方案与差异化切入", "先看公开产品如何解决同一形态/痛点；没有商品命中时展示用户原文链接线索")
    + "<div class='evidence-summary-grid solution-summary'><div><small>方案检索组</small><strong>" + formatNumber(solution.groupCount || 0)
    + "</strong></div><div><small>公开商品样本</small><strong>" + formatNumber(solution.productSampleCount || 0)
    + "</strong></div><div><small>形态候选</small><strong>" + formatNumber(solution.candidateProductSampleCount || 0)
    + "</strong></div><div><small>论坛/评论链接</small><strong>" + formatNumber(solution.forumLinkCount || 0)
    + "</strong></div><div><small>整体状态</small><strong class='" + (solution.status === "empty" ? "warning-number" : "positive-number")
    + "'>" + escapeHTML(statusLabel) + "</strong></div></div>"
    + "<div class='panel solution-method'><span data-icon='info'></span><p><strong>检索口径：</strong>"
    + escapeHTML(solution.method || "按形态和痛点检索公开方案。") + "<br><strong>使用边界：</strong>"
    + escapeHTML(solution.warning || "商品和论坛链接均需重新核验。") + "</p></div>"
    + "<div class='solution-group-list'>" + (groups || "<div class='panel evidence-empty'>当前没有足够的形态/痛点证据生成方案检索组。</div>") + "</div></section>";
}

function renderOpportunityEvidenceAudit(report) {
  const typeNames = { functional: "功能差异", appearance: "外观差异", scenario: "场景差异", material: "材料差异", installation: "安装差异" };
  const cards = (report.opportunities || []).map((item) => {
    const links = (item.evidenceLinks || []).slice(0, 8).map((url) => linkButton(url, "打开原文证据")).join("");
    return `<article class="opportunity-audit-card"><header><div><span class="priority-badge ${String(item.priority || "P2").toLowerCase()}">${escapeHTML(item.priority || "P2")}</span><span class="tag">${escapeHTML(typeNames[item.differenceType] || item.differenceType || "功能差异")}</span><h3>${escapeHTML(item.title || "未命名机会")}</h3></div><span class="state-pill ${item.evidenceStatus === "evidence-backed" ? "success" : "limited"}">${item.evidenceStatus === "evidence-backed" ? "证据支持" : "待验证"}</span></header><div class="opportunity-audit-counts"><span>匹配原文 ${formatNumber(item.evidenceCount || 0)}</span><span>Amazon 评论 ${formatNumber(item.reviewEvidenceCount || 0)}</span><span>论坛 ${formatNumber(item.forumEvidenceCount || 0)}</span><span>低星评论 ${formatNumber(item.negativeReviewCount || item.frequency?.negativeReviews || 0)}</span></div><p>${escapeHTML(item.productAction || item.action || "")}</p><div class="opportunity-audit-links">${links || "没有可打开的证据链接"}</div></article>`;
  }).join("");
  return `<section class="report-section" id="opportunity-evidence-audit"><div class="section-title-row"><div><span data-icon="scan-search"></span><div><h2>真实评论切入点</h2><p class="section-note">功能、外观、场景、材料和安装差异只在有对应原文时展示为证据支持。</p></div></div></div><div class="opportunity-audit-grid">${cards || `<div class="panel evidence-empty">没有足够原文形成可核验机会点。</div>`}</div></section>`;
}

function renderEvidenceDrivenUsers(report) {
  const summary = report.evidenceSummary || {};
  const visibleSources = new Set(["amazon", "reddit", "youtube", "youtube-comments", "news", "google-trends", "bing-images", "hackernews", "stackexchange"]);
  const evidence = (report.recentEvidence || []).filter((item) => visibleSources.has(item.source));
  const personas = (report.personas || []).map((item) => {
    const quotes = (item.representativeQuotes || []).map((quote) => `<li><small>${escapeHTML(sourceNames[quote.source] || quote.source)} · ${escapeHTML(quote.date || "日期未知")}</small><p>“${escapeHTML(quote.quote || "") }”</p>${linkButton(quote.url, "打开原文")}</li>`).join("");
    return `<article class="persona-item"><header><h3>${escapeHTML(item.name || "未命名画像")}</h3><span class="tag">${escapeHTML(item.priority || "待验证")}</span></header><p>${escapeHTML(item.behavior || "")}</p><p class="persona-scene"><strong>场景：</strong>${escapeHTML(item.scene || "")}</p><small>${escapeHTML(item.value || "")}</small><div class="persona-evidence-meta"><strong>${formatNumber(item.evidenceCount || 0)} 条命中</strong><span>${formatNumber(item.sourceCount || 0)} 个来源</span><span class="state-pill ${item.evidenceStatus === "evidence-backed" ? "success" : "limited"}">${item.evidenceStatus === "evidence-backed" ? "有证据" : "待验证"}</span></div>${item.coreReason ? `<p class="persona-core-reason"><strong>核心用户理由：</strong>${escapeHTML(item.coreReason)}</p>` : ""}${quotes ? `<details class="persona-evidence"><summary>展开原文证据</summary><ul>${quotes}</ul></details>` : ""}</article>`;
  }).join("");
  const emotionLabels = { pain: "痛点 Pain", itch: "痒点 Itch", pleasure: "爽点 Pleasure" };
  const emotionCards = Object.entries(report.emotions || {}).map(([key, value]) => {
    const detail = typeof value === "string" ? { coreInsight: value, scene: "未提供场景证据", copy: [], evidence: [], status: "hypothesis" } : value || {};
    const quotes = (detail.evidence || []).map((quote) => `<li><small>${escapeHTML(sourceNames[quote.source] || quote.source)} · ${escapeHTML(quote.date || "日期未知")}</small><p>“${escapeHTML(quote.quote || "") }”</p>${linkButton(quote.url, "打开原文")}</li>`).join("");
    return `<article class="emotion-item"><header><h3>${escapeHTML(emotionLabels[key] || key)}</h3><span class="state-pill ${detail.status === "evidence-backed" ? "success" : "limited"}">${detail.status === "evidence-backed" ? "有证据" : "待验证"}</span></header><p class="emotion-insight"><strong>核心洞察：</strong>${escapeHTML(detail.coreInsight || "")}</p><p><strong>具体场景：</strong>${escapeHTML(detail.scene || "")}</p>${(detail.copy || []).length ? `<div class="copy-tests"><strong>可测试文案（非用户原话）</strong><ul>${detail.copy.map((copy) => `<li>${escapeHTML(copy)}</li>`).join("")}</ul></div>` : ""}<small>${formatNumber(detail.evidenceCount || 0)} 条证据 · ${formatNumber(detail.sourceCount || 0)} 个来源 · ${escapeHTML(detail.statusNote || "")}</small>${quotes ? `<details class="emotion-evidence"><summary>展开 ${formatNumber((detail.evidence || []).length)} 条原文</summary><ul>${quotes}</ul></details>` : ""}</article>`;
  }).join("");
  const painRows = (report.pains || []).slice(0, 8).map((item) => `<div class="pain-row"><strong>${escapeHTML(item.label)}</strong><div class="pain-bar"><i style="width:${Math.max(0, Math.min(100, Number(item.strength) || 0))}%"></i></div><span>${formatNumber(item.count)} 条</span></div>`).join("");
  const cards = evidence.map((item) => `<article class="evidence-card">
    <header><span class="tag">${escapeHTML(sourceNames[item.source] || item.source)}</span><span>${escapeHTML(item.context || "")}</span><span>${formatDate(item.date)}</span></header>
    <h3>${escapeHTML(item.title || "用户原话")}</h3>
    <p>“${escapeHTML(item.quote || "原文无可见正文")}”</p>
    <footer>${item.rating ? `<span class="rating-chip">${formatNumber(item.rating)} / 5</span>` : ""}${item.comments !== null && item.comments !== undefined ? `<span>${formatNumber(item.comments)} 条评论</span>` : ""}${linkButton(item.url, "打开原始证据")}</footer>
  </article>`).join("");
  return `<section class="report-section" id="users" aria-labelledby="users-title">
    ${sectionTitle("users", "users", "用户画像与情绪洞察", `窗口 ${escapeHTML(summary.windowStart || "待确定")} 至 ${escapeHTML(summary.windowEnd || "待确定")}；论坛 ${formatNumber(summary.forumRecentRecords)} / ${formatNumber(summary.forumTarget)} 条`)}
    <div class="evidence-summary-grid">
      <div><small>可用原始记录</small><strong>${formatNumber(summary.totalRecords)}</strong></div>
      <div><small>近一年记录</small><strong>${formatNumber(summary.recentRecords)}</strong></div>
      <div><small>近一年论坛</small><strong>${formatNumber(summary.forumRecentRecords)}</strong></div>
      <div><small>论坛目标</small><strong class="${summary.forumTargetMet ? "positive-number" : "warning-number"}">${summary.forumTargetMet ? "已达标" : "未达标"}</strong></div>
    </div>
    <div class="insight-subheading"><div><span class="eyebrow">Stage 1</span><h3>四类行为画像</h3></div><span>按真实行为聚类，不按年龄性别脑补</span></div>
    <div class="insight-grid">${personas || `<div class="panel evidence-empty">当前没有足够原文生成画像。</div>`}</div>
    <div class="insight-subheading"><div><span class="eyebrow">Stage 2</span><h3>Pain / Itch / Pleasure</h3></div><span>文案与用户原话分开显示</span></div>
    <div class="emotion-grid">${emotionCards || `<div class="panel evidence-empty">当前没有足够原文生成情绪洞察。</div>`}</div>
    <div class="panel pain-list" style="margin-top:12px"><div class="panel-head"><div><h3>问题聚类</h3><p>启发式计数，点击机会卡片回看原文</p></div></div>${painRows || `<div class="pain-row"><span>当前没有足够文本形成问题聚类</span></div>`}</div>
    <div class="insight-subheading"><div><span class="eyebrow">Evidence</span><h3>近一年原始记录</h3></div><span>只展示可回溯的公开记录</span></div>
    <div class="panel evidence-card-list">${cards || `<div class="evidence-empty">近一年没有带日期的用户原话；不要用市场规模替代用户证据。</div>`}</div>
  </section>`;
}


function renderEvidenceDrivenOpportunities(report) {
  const items = report.opportunities || [];
  const cards = items.map((item) => {
    const evidence = (item.evidence || []).map((source) => `<li><div><strong>${escapeHTML(source.title || "原始证据")}</strong><small>${escapeHTML(sourceNames[source.source] || source.source)} · ${escapeHTML(source.date || "日期未知")} ${escapeHTML(source.context || "")}</small></div><p>“${escapeHTML(source.quote || "")}”</p>${linkButton(source.url, "打开原文")}</li>`).join("");
    return `<article class="opportunity-card">
      <div class="opportunity-card-head"><span class="priority-badge ${String(item.priority || "P2").toLowerCase()}">${escapeHTML(item.priority || "P2")}</span><div><h3>${escapeHTML(item.title || "未命名机会")}</h3><p>${escapeHTML(item.decision || "需补证据后判断")} · 置信度 ${escapeHTML(item.confidence || "待评估")}</p></div><strong>${formatNumber(item.recentEvidenceCount || 0)}<small> 条近一年证据</small></strong></div>
      <div class="opportunity-facts"><div><strong>用户问题</strong><p>${escapeHTML(item.userProblem || "")}</p></div><div><strong>频次与范围</strong><p>${formatNumber(item.evidenceCount)} 条匹配原文 · ${formatNumber(item.frequency?.sourceCount)} 个来源 · ${formatNumber(item.frequency?.negativeReviews)} 条低星评论</p></div><div><strong>共同模式</strong><p>${escapeHTML(item.pattern || "")}</p></div><div><strong>竞品缺口</strong><p>${escapeHTML(item.currentMarketGap || "")}</p></div><div><strong>产品动作</strong><p>${escapeHTML(item.productAction || item.action || "")}</p></div><div><strong>验证门槛</strong><p>${escapeHTML(item.validation || "")}</p></div></div>
      <details class="opportunity-evidence"><summary>展开 ${formatNumber((item.evidence || []).length)} 条原话证据</summary><ul>${evidence || `<li class="evidence-empty">当前机会没有可展示原话，仅保留为假设。</li>`}</ul></details>
      <div class="opportunity-risk"><strong>风险</strong><span>${escapeHTML(item.risk || "")}</span></div>
    </article>`;
  }).join("");
  const gaps = (report.dataGaps || []).map((gap) => `<article class="data-gap"><header><strong>${escapeHTML(sourceNames[gap.source] || gap.source)}</strong><span class="state-pill ${escapeHTML(gap.state || "empty")}">${escapeHTML(stateNames[gap.state] || gap.state || "数据为空")}</span></header><p><strong>原因：</strong>${escapeHTML(gap.reason || "")}</p><p><strong>影响：</strong>${escapeHTML(gap.impact || "")}</p><p><strong>下一步：</strong>${escapeHTML(gap.nextAction || "")}</p>${gap.fallbackAttempts?.length ? `<small>已尝试：${escapeHTML(gap.fallbackAttempts.join("；"))}</small>` : ""}</article>`).join("");
  return `<section class="report-section" id="opportunities" aria-labelledby="opportunities-title">
    ${sectionTitle("opportunities", "lightbulb", "证据驱动的机会点", "每个机会必须能回到用户原话；没有证据的内容只标为假设")}
    <div class="opportunity-card-list">${cards || `<div class="panel evidence-empty">暂未形成可核验机会点。</div>`}</div>
    <div class="data-gap-section"><div class="section-heading"><div><span class="eyebrow">Data gaps</span><h2>空数据与取消判断</h2></div><span>空数据不会被补写成结论</span></div><div class="data-gap-list">${gaps || `<div class="panel evidence-empty">当前没有发现空数据来源。</div>`}</div></div>
  </section>`;
}


function renderReport(report) {
  currentReport = report;
  const root = $("#reportRoot");
  root.innerHTML = [renderExecutive(report), renderProductShape(report), renderSolutionEvidence(report), renderSolutionEvidenceAudit(report), renderEvidenceDrivenUsers(report), renderEvidenceDrivenOpportunities(report), renderOpportunityEvidenceAudit(report), renderDefinition(report), renderEvidence(report)].join("");
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
    "## 解决方案与差异化切入",
    "- 状态：" + ((report.solutionEvidence && report.solutionEvidence.status) || "待判断"),
    ...((report.solutionEvidence && report.solutionEvidence.groups) || []).flatMap((group) => [
      "- " + (group.formLabel || "形态待确认") + " / " + (group.opportunityTitle || "未命名机会") + "：" + (group.differencePoint || "待定义"),
      ...((group.products || []).slice(0, 3).map((item) => "- 商品方案：" + item.title + "；" + (item.url || ""))),
      ...((group.forumLinks || []).slice(0, 3).map((item) => "- 用户链接线索：" + item.title + "；" + (item.url || ""))),
    ]),
    "",
    "## 产品定义",
    "",
    `- 概念：${report.productDefinition?.concept || "待定义"}`,
    `- 核心用户：${report.productDefinition?.coreUser || "待定义"}`,
    `- 用户任务：${report.productDefinition?.job || "待定义"}`,
    "",
    "## 用户画像与情绪",
    "",
    ...(report.personas || []).map((item) => `- ${item.name}（${item.priority || "待验证"}）：${item.behavior}；证据 ${item.evidenceCount || 0} 条 / ${item.sourceCount || 0} 个来源`),
    "",
    ...(Object.entries(report.emotions || {}).map(([key, item]) => `- ${key}：${typeof item === "string" ? item : item.coreInsight || "待验证"}；证据 ${typeof item === "string" ? 0 : item.evidenceCount || 0} 条`)),
    "",
    "## 近一年用户证据",
    "",
    `- 近一年记录：${report.evidenceSummary?.recentRecords || 0}`,
    `- 论坛记录：${report.evidenceSummary?.forumRecentRecords || 0} / ${report.evidenceSummary?.forumTarget || 30}`,
    "",
    "## 证据",
    "",
    ...(report.evidence || []).map((item) => `- [${sourceNames[item.source] || item.source}] ${item.claim}${httpUrl(item.url) ? `：${item.url}` : ""}`),
    "",
    "## 问题统计 / 复盘",
    "",
    ...(report.review?.confirmed || []).map((item) => `- 已确认：${item}`),
    ...(report.review?.unresolved || []).map((item) => `- 未解决：${item}`),
    ...(report.review?.nextActions || []).map((item) => `- 下一轮：${item}`),
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
  const sources = ["reference-workbook"];
  setLoading(true, sources);
  try {
    let report;
    try {
      report = await fetchReport(reportOnly ? "./data/reference-report.json" : apiEndpoint("/api/reference"));
      apiAvailable = true;
    } catch (apiError) {
      if (!staticMode) throw apiError;
      apiAvailable = false;
      report = await fetchReport("./data/reference-report.json");
    }
    $("#progressFill").style.width = "100%";
    if (staticMode) $("#queryInput").value = report.query || "";
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
  if (reportOnly) return;
  const query = $("#queryInput").value.trim();
  const sources = selectedSources();
  if (!query) return;
  if (!sources.length) {
    showError("至少选择一个数据源。", true);
    return;
  }
  const depth = "deep";
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
  if (reportOnly) {
    $("#serviceLabel").textContent = "公开洞察报告";
    return;
  }
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
  if (reportOnly) {
    $("#queryInput").readOnly = true;
    $("#runButton").disabled = true;
    $("#runButton").querySelector("span:last-child").textContent = "报告已生成";
    $("#referenceButton").hidden = true;
  }
  const saved = JSON.parse(localStorage.getItem("opc-insight-sources") || "null");
  if (Array.isArray(saved) && saved.length) {
    const available = new Set($$("#sourceOptions input").map((input) => input.value));
    const migrated = saved.filter((source) => available.has(source));
    const normalized = migrated.length ? migrated : [...available];
    $$("#sourceOptions input").forEach((input) => { input.checked = normalized.includes(input.value); });
    localStorage.setItem("opc-insight-sources", JSON.stringify(normalized));
    localStorage.setItem("opc-insight-sources-version", sourceSettingsVersion);
  }
  updateSourceCount();
  const launchedFromGitHub = applyLaunchRequest();
  checkHealth();
  $("#referenceButton").hidden = true;
  if (reportOnly) {
    loadReference();
  } else if (!launchedFromGitHub) {
    renderEmpty();
  }
}

init();
