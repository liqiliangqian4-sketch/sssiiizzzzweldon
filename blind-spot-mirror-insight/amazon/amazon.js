import { renderIcons } from "../vendor/icons.js";

const $ = (selector, root = document) => root.querySelector(selector);
const esc = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
const appRoot = window.location.origin;
let report = null;
let timer = null;

function money(value, currency = "USD") {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "待采集";
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 2 }).format(Number(value));
}

function number(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "待采集";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Number(value));
}

function httpUrl(value) {
  try { const url = new URL(String(value)); return ["http:", "https:"].includes(url.protocol) ? url.href : ""; } catch { return ""; }
}

function link(value, label = "打开 Amazon 商品") {
  const url = httpUrl(value);
  return url ? `<a class="external-link" href="${esc(url)}" target="_blank" rel="noreferrer" aria-label="${esc(label)}" title="${esc(label)}"><span data-icon="external-link"></span></a>` : "";
}

function stars(value) {
  const score = Number(value || 0);
  return `<span class="stars" aria-label="${score} / 5">${"★".repeat(Math.max(0, Math.round(score)))}${"☆".repeat(Math.max(0, 5 - Math.round(score)))}</span> <span>${score ? score.toFixed(1) : "待采集"}</span>`;
}

function setLoading(active) {
  $("#runAmazon").disabled = active;
  $("#runAmazon").innerHTML = active ? `<span class="spinner" data-icon="loader-circle"></span><span>检索中</span>` : `<span data-icon="search"></span><span>开始检索</span>`;
  $("#runLine").classList.toggle("hidden", !active);
  if (!active) { clearInterval(timer); return; }
  const started = Date.now();
  $("#runText").textContent = "正在读取 Amazon 公开页面";
  timer = setInterval(() => { const seconds = Math.floor((Date.now() - started) / 1000); $("#runElapsed").textContent = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`; }, 1000);
  renderIcons($("#runAmazon"));
}

function renderScore(report) {
  return `<section class="score-header"><div class="score-copy"><p class="eyebrow">Amazon-only decision</p><h2>${esc(report.executive?.oneLiner || "已完成 Amazon 站内检索")}</h2><p class="condition"><strong>进入条件：</strong>${esc(report.executive?.condition || "先完成样品、成本和核心风险验证")}</p></div><div class="score"><strong>${number(report.executive?.score)}</strong><span>机会指数 / 100</span></div><div class="score"><strong>${number(report.executive?.confidence)}</strong><span>证据置信度 / 100</span></div></section>`;
}

function renderMetrics(report) {
  const stats = report.marketStats || {};
  return `<section class="metric-grid"><div class="metric"><small>可见商品</small><strong>${number(stats.competitorCount)}</strong></div><div class="metric"><small>最低可见价</small><strong>${money(stats.priceMin)}</strong></div><div class="metric"><small>样本中位价</small><strong>${money(stats.priceMedian)}</strong></div><div class="metric"><small>平均评分</small><strong>${stats.averageRating ? `${Number(stats.averageRating).toFixed(1)} / 5` : "待采集"}</strong></div><div class="metric"><small>中位评论量</small><strong>${number(stats.medianReviewCount)}</strong></div></section>`;
}

function renderPrice(report) {
  const products = report.competitors || [];
  const prices = products.map((item) => Number(item.price)).filter(Number.isFinite);
  if (!prices.length) return `<section class="content-panel"><div class="section-heading"><h2>价格分布</h2><span>无可见价格</span></div><p class="muted">本次没有获取到可核验价格。</p></section>`;
  const min = Math.min(...prices); const max = Math.max(...prices); const step = Math.max((max - min) / 4, 1);
  const buckets = Array.from({ length: 5 }, (_, index) => ({ low: min + index * step, high: index === 4 ? max + 0.01 : min + (index + 1) * step, count: 0 }));
  prices.forEach((price) => { const bucket = buckets.find((item) => price >= item.low && price < item.high) || buckets[4]; bucket.count += 1; });
  const peak = Math.max(...buckets.map((item) => item.count), 1);
  const rows = buckets.map((item) => `<div class="bar-row"><span class="bar-label">${money(item.low)} - ${money(item.high)}</span><span class="bar-track"><span class="bar-fill" style="width:${Math.round(item.count / peak * 100)}%"></span></span><span class="bar-value">${item.count} 个</span></div>`).join("");
  return `<section class="content-panel"><div class="section-heading"><h2>价格分布</h2><span>${prices.length} 个有价样本</span></div><div class="bars">${rows}</div></section>`;
}

function renderPains(report) {
  const pains = (report.pains || []).filter((item) => item.count > 0).slice(0, 6);
  const rows = (pains.length ? pains : (report.pains || []).slice(0, 4)).map((item) => `<div class="pain"><strong>${esc(item.label)}</strong><small>${number(item.count)} 条评论信号</small></div>`).join("");
  return `<section class="content-panel"><div class="section-heading"><h2>评论痛点</h2><span>Amazon 书面评论聚类</span></div><div class="pains">${rows || `<p class="muted">暂无评论痛点样本。</p>`}</div></section>`;
}

function formatPercent(value) {
  return value === null || value === undefined || Number.isNaN(Number(value)) ? "—" : `${Number(value).toFixed(Number(value) % 1 ? 2 : 0)}%`;
}

function formatCapturedAt(value) {
  if (!value) return "采集时间待记录";
  try { return new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); } catch { return value; }
}

function renderSellerSprite(report) {
  const data = report.sellerSprite || { state: "not_available", keywords: [] };
  const keywords = data.keywords || [];
  if (!keywords.length) {
    return `<section class="seller-sprite-data content-panel"><div class="section-heading"><h2>卖家精灵关键词指标</h2><span class="state-pill pending">待采集</span></div><p class="muted">${esc(data.message || "当前关键词没有已采集的卖家精灵快照。")}</p></section>`;
  }
  const totalSearches = keywords.reduce((sum, item) => sum + Number(item.monthlySearches || 0), 0);
  const totalPurchases = keywords.reduce((sum, item) => sum + Number(item.monthlyPurchases || 0), 0);
  const prices = keywords.map((item) => Number(item.medianPrice)).filter(Number.isFinite).sort((a, b) => a - b);
  const keywordMedianPrice = prices.length ? prices[Math.floor(prices.length / 2)] : null;
  const rows = keywords.map((item) => {
    const bid = item.ppcBid ? `$${Number(item.ppcBid.min).toFixed(2)} / $${Number(item.ppcBid.median).toFixed(2)} / $${Number(item.ppcBid.max).toFixed(2)}` : "—";
    const products = (item.representativeProducts || []).slice(0, 3).map((product) => `<a class="asin-link" href="https://www.amazon.com/dp/${esc(product.asin)}" target="_blank" rel="noreferrer">${esc(product.asin)}</a>`).join(" ");
    return `<tr><td><strong>${esc(item.keyword)}</strong><small>${esc(item.translation || "")}</small></td><td>${number(item.monthlySearches)}<small>日均 ${number(item.dailySearches)}</small></td><td>${number(item.monthlyPurchases)} / ${formatPercent(item.purchaseRate)}</td><td>${formatPercent(item.growthRate)}</td><td>${bid}</td><td>${number(item.productCount)}<small>${money(item.medianPrice)} · ${number(item.medianReviews)} 条评</small></td><td>${item.medianRating ? `${Number(item.medianRating).toFixed(1)} / 5` : "—"}<small>${products}</small></td></tr>`;
  }).join("");
  return `<section class="seller-sprite-data table-panel"><div class="section-heading"><div><h2>卖家精灵关键词指标</h2><p class="table-subtitle">${esc(data.message || "")}</p></div><div class="seller-sprite-meta"><span class="state-pill captured">已采集快照</span><span>${esc(data.month || "月份待记录")} · ${esc(formatCapturedAt(data.capturedAt))}</span>${link(data.url, "打开卖家精灵查询")}</div></div><div class="seller-sprite-metrics"><div><small>相关关键词</small><strong>${number(keywords.length)}</strong></div><div><small>月搜索量合计</small><strong>${number(totalSearches)}</strong></div><div><small>月购买量合计</small><strong>${number(totalPurchases)}</strong></div><div><small>关键词中位价</small><strong>${money(keywordMedianPrice)}</strong></div></div><div class="seller-sprite-table-wrap"><table class="seller-sprite-table"><thead><tr><th>关键词</th><th>月搜索量</th><th>月购买量 / 购买率</th><th>增长率</th><th>PPC 竞价<br>低 / 中 / 高</th><th>商品数<br>中位价 / 评论</th><th>中位评分<br>代表 ASIN</th></tr></thead><tbody>${rows}</tbody></table></div><p class="data-note">字段来自卖家精灵页面快照，不是 Amazon 官方公开销量；“中位价 / 评论 / 评分”是卖家精灵该关键词样本的聚合指标。未命中的新关键词不会用估算值填充。</p></section>`;
}

function sortedProducts(products) {
  const term = $("#productFilter")?.value.trim().toLowerCase() || "";
  const sort = $("#productSort")?.value || "reviews";
  const filtered = products.filter((item) => !term || `${item.title} ${item.asin}`.toLowerCase().includes(term));
  return filtered.sort((a, b) => sort === "price" ? (Number(a.price || Infinity) - Number(b.price || Infinity)) : sort === "rating" ? (Number(b.rating || 0) - Number(a.rating || 0)) : Number(b.reviewCount || 0) - Number(a.reviewCount || 0));
}

function renderProducts(report) {
  const rows = sortedProducts(report.competitors || []).map((item) => `<tr><td><div class="product-cell">${item.image ? `<img src="${esc(item.image)}" alt="" loading="lazy">` : `<span class="image-placeholder" data-icon="package-search"></span>`}<div><strong>${esc(item.title || "未命名商品")}</strong><small>${esc(item.asin || "ASIN 待采集")}</small></div></div></td><td class="price">${money(item.price)}</td><td class="rating">${stars(item.rating)}</td><td class="review-count">${number(item.reviewCount)}</td><td>${link(item.url)}</td></tr>`).join("");
  return `<section class="table-panel"><div class="section-heading"><h2>竞品清单</h2><div class="table-tools"><input id="productFilter" type="search" placeholder="筛选标题 / ASIN" aria-label="筛选竞品"><select id="productSort" aria-label="竞品排序"><option value="reviews">按评论量</option><option value="rating">按评分</option><option value="price">按价格</option></select></div></div><table class="product-table"><thead><tr><th>商品</th><th>价格</th><th>评分</th><th>评论量</th><th>链接</th></tr></thead><tbody id="productRows">${rows || `<tr><td colspan="5" class="empty-row">没有匹配商品</td></tr>`}</tbody></table></section>`;
}

function renderReviews(report) {
  const reviews = (report.voices || []).filter((item) => item.source === "amazon-written-review").slice(0, 9);
  const cards = reviews.map((item) => `<article class="review-card"><h3>${esc(item.title || "Amazon 用户评论")}</h3><p>${esc(item.snippet || "暂无评论正文")}</p><div class="review-meta"><span>${esc(item.context || "Amazon review")}</span><span>${item.metric ? `${Number(item.metric).toFixed(1)} / 5` : "待采集"}</span></div>${link(item.url, "打开原始评论")}</article>`).join("");
  return `<section class="review-panel"><div class="section-heading"><h2>用户原声</h2><span>${reviews.length} 条书面评论样本</span></div><div class="review-list">${cards || `<p class="muted">暂无可展示的 Amazon 书面评论。</p>`}</div></section>`;
}

function renderOpportunities(report) {
  const items = (report.opportunities || []).slice(0, 6);
  const cards = items.map((item) => `<article class="opportunity"><span class="priority">${esc(item.priority)} · ${number(item.evidenceCount)} 条信号</span><h3>${esc(item.title)}</h3><p>${esc(item.action)}</p></article>`).join("");
  const keywords = [...(report.keywordGroups?.core || []), ...(report.keywordGroups?.attributes || [])].slice(0, 12).map((item) => `<span class="keyword">${esc(item)}</span>`).join("");
  return `<section class="opportunity-panel"><div class="section-heading"><h2>产品机会与关键词</h2><span>从 Amazon 评论和商品标题提炼</span></div><div class="opportunity-list">${cards || `<p class="muted">暂无机会信号。</p>`}</div><div class="keyword-list" style="margin-top:16px">${keywords || `<span class="muted">关键词待采集</span>`}</div></section>`;
}

function renderReport(nextReport) {
  report = nextReport;
  $("#queryLabel").textContent = nextReport.query || nextReport.englishQuery || "Amazon 产品";
  $("#generatedLabel").textContent = nextReport.generatedAt ? new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(nextReport.generatedAt)) : "已完成";
  $("#reportRoot").innerHTML = [renderScore(nextReport), renderMetrics(nextReport), renderSellerSprite(nextReport), `<section class="content-grid">${renderPrice(nextReport)}${renderPains(nextReport)}</section>`, renderProducts(nextReport), renderReviews(nextReport), renderOpportunities(nextReport)].join("");
  renderIcons($("#reportRoot"));
  $("#productFilter").addEventListener("input", () => { $("#productRows").outerHTML = renderProducts(report).match(/<tbody id="productRows">[\s\S]*<\/tbody>/)[0]; renderIcons($("#productRows")); });
  $("#productSort").addEventListener("change", () => { $("#productRows").outerHTML = renderProducts(report).match(/<tbody id="productRows">[\s\S]*<\/tbody>/)[0]; renderIcons($("#productRows")); });
}

async function run(event) {
  event.preventDefault();
  const query = $("#amazonQuery").value.trim();
  if (!query) return;
  $("#errorLine").classList.add("hidden"); setLoading(true);
  try {
    const response = await fetch(`${appRoot}/api/research`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, market: $("#amazonMarket").value, depth: $("#amazonDepth").value, sources: ["amazon"] }) });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.detail || payload.error || `HTTP ${response.status}`);
    renderReport(payload);
  } catch (error) { $("#errorText").textContent = error.message; $("#errorLine").classList.remove("hidden"); }
  finally { setLoading(false); renderIcons(); }
}

$("#amazonForm").addEventListener("submit", run);
renderIcons();
