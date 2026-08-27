import { renderIcons } from "../../vendor/icons.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const marketData = {
  jan: { revenue: 648497.98, sales: 9117, medianPrice: 78.44, rating: 4.486, overlap: 46, delta: "样本基准" },
  jul: { revenue: 726448, sales: 10050, medianPrice: 74.99, rating: 4.42, overlap: 46, delta: "+12.0% vs 2026.01" },
};

const portfolio = [
  { id: "p0", priority: "P0", title: "2in 带拖车管三合一基础款", description: "首发验证 2in 通用接收器、脚踏、防撞和拖车盖组合，先把孔位同轴、防晃、承重和配件完整性做成质量基线。资料对应的 Amazon 参考链接已更正为 B0G6KSHXZM，当前售价为 $82.99；420 个为项目已确认的 2027 规划销量，GMV 仍按项目规划售价 $99.99 测算。", action: "当前", price: 82.99, planningPrice: 99.99, sales2027: 420, salesBasis: "项目已确认目标", projectStart: "2026.08", launchDate: "2027.04", referenceUrl: "https://www.amazon.com/dp/B0G6KSHXZM", imageSrc: "./assets/flagship-2in-hitch-step.png", imageSource: "Amazon 商品页主图（B0G6KSHXZM）" },
  { id: "double-short", priority: "P1", title: "双层脚踏（短）", description: "短款更适合城市 SUV 和日常洗车，双层表面兼顾抓地与舒适；开发重点是两层连接强度、防滑排水和收纳体积。Amazon 页面当前售价为 $74.99，2027 年销量按项目规划目标调整为 720 个。", action: "打样", price: 74.99, sales2027: 720, salesBasis: "项目规划目标（用户确认）", projectStart: "2026.09", launchDate: "2027.04", referenceUrl: "https://www.amazon.com/dp/B0F1D1ZCD5", imageSrc: "./assets/double-short.jpg", imageSource: "Amazon 商品页主图" },
  { id: "height", priority: "P3", title: "三段可调高度结构", description: "覆盖不同车高和用户身高，能扩展洗车、装卸和房车场景；资料只有方案方向，没有明确 Amazon 对标链接和图片，售价与销量均待验证。", action: "验证", price: null, sales2027: null, salesBasis: "待验证方案", projectStart: "2027.09", launchDate: "2028.04", referenceUrl: "", imageSrc: "", imageSource: "待验证方案" },
  { id: "d-ring", priority: "P2", title: "防盗 D 形环卸扣", description: "把锁止、防盗和拖车连接合并为高配附件，可提升客单价；Amazon 当前售价为 $89.09，2027 年销量按项目规划目标调整为 400 个；仍需验证锁体防锈、钥匙便利性以及与首发脚踏的兼容性。", action: "扩展", price: 89.09, sales2027: 400, salesBasis: "项目规划目标（用户确认）", projectStart: "2026.11", launchDate: "2027.11", referenceUrl: "https://www.amazon.com/dp/B06Y2YMTX9", imageSrc: "./assets/d-ring.jpg", imageSource: "Amazon 商品页主图" },
  { id: "led", priority: "P2", title: "LED 刹车灯 / 接电线束", description: "能明显提升尾部视觉价值，但售后风险集中在线束、防水和安装法规边界；Amazon 当前售价为 $59.99，2027 年销量按项目规划目标调整为 320 个；完成 IP67 灌胶、应力释放和通电淋雨验证后再上高配。", action: "后叠加", price: 59.99, sales2027: 320, salesBasis: "项目规划目标（用户确认）", projectStart: "2027.01", launchDate: "2028.02", referenceUrl: "https://www.amazon.com/dp/B08WCCZJ73", imageSrc: "./assets/led.jpg", imageSource: "Amazon 商品页主图" },
  { id: "plate", priority: "P2", title: "拖车钩脚踏 + 牌照架", description: "解决加装拖车钩后的牌照遮挡与安装冲突，适合做轻改装组合包；Amazon 当前参考价为 $58.99，2027 年销量按项目规划目标调整为 200 个；需要优先确认不同州牌照位置、灯光遮挡和折叠避让方案。", action: "调研", price: 58.99, sales2027: 200, salesBasis: "项目规划目标（用户确认）", projectStart: "2027.10", launchDate: "2028.06", referenceUrl: "https://www.amazon.com/dp/B0GD65VYS7", imageSrc: "./assets/plate.jpg", imageSource: "Amazon 商品页主图" },
  { id: "wind", priority: "P3", title: "拖车钩脚踏 + 风扇扰流", description: "资料仅提出提高行驶稳定性的方向，目前没有明确的 Amazon 对标链接、产品图片、售价或销量；先验证风阻、噪音、离地间隙和结构强度，不为装饰增加复杂度。", action: "验证", price: null, sales2027: null, salesBasis: "待验证方案", projectStart: "2027.11", launchDate: "2028.08", referenceUrl: "", imageSrc: "", imageSource: "待验证方案" },
  { id: "tube", priority: "P1", title: "圆管大件脚踏 / 48 英寸长踏板", description: "覆盖皮卡、房车和大件装卸，用圆管结构与更长踩踏面做差异化；Amazon 参考页当前售价为 $169.99，2027 年销量按项目规划目标调整为 320 个；要平衡承重、包装尺寸、运输破损和仓储费用。", action: "扩展", price: 169.99, sales2027: 320, salesBasis: "项目规划目标（用户确认）", projectStart: "2027.12", launchDate: "2028.10", referenceUrl: "https://www.amazon.com/dp/B07DG2N6Z2", imageSrc: "./assets/tube.jpg", imageSource: "Amazon 商品页主图（B07DG2N6Z2）" },
  { id: "fit", priority: "P2", title: "车型特配单品", description: "按资料优先切入 2021-2026 Ford F-150 / 2022-2026 F-150 Lightning EV，采用双层尾门踏板与免打孔安装；Amazon 当前售价为 $189.99，2027 年销量按项目规划目标调整为 600 个；需排除 Raptor 和双排气车型并控制专配库存。", action: "后置", price: 189.99, sales2027: 600, salesBasis: "项目规划目标（用户确认）", projectStart: "2028.01", launchDate: "2029.02", referenceUrl: "https://www.amazon.com/dp/B0G4C7WW3L", imageSrc: "./assets/fit.jpg", imageSource: "Amazon 商品页主图" },
  { id: "pet", priority: "P2", title: "宠物上下车单品", description: "宠物上下车场景明确，资料显示该细分产品数量少但年 GMV 贡献较高；Amazon 当前售价为 $169.99，2027 年销量按项目规划目标调整为 350 个。后续围绕防滑、折叠、承重和宠物安全感做独立产品线。", action: "后置", price: 169.99, sales2027: 350, salesBasis: "项目规划目标（用户确认）", projectStart: "2028.01", launchDate: "2029.04", referenceUrl: "https://www.amazon.com/dp/B01LCJAU4I", imageSrc: "./assets/pet.jpg", imageSource: "Amazon 商品页主图" },
];

const stageDetails = {
  structure: ["当前动作：先锁定孔位、水平度和防晃结构。", "所有外观和扩展功能都必须建立在“装得正、踩得稳”的首发质量基线上。"],
  test: ["下一动作：把用户差评转成出厂和实验室测试。", "重点验证承重、耐久、防锈、接收器适配、端盖固定和包装运输。"],
  listing: ["上市准备：把已验证的规格变成 Listing 证据。", "准备尺寸图、车型适配矩阵、承重视频、防晃说明和完整配件清单。"],
  launch: ["目标节点：2027 年 4 月正式上架。", "首发以可靠性和交付完整性为第一判断标准，LED 等复杂功能可在后续 SKU 叠加。"],
};

function money(value) {
  return `$${(value / 10000).toFixed(2)}万`;
}

function productGmv(item) {
  const gmvPrice = item.planningPrice ?? item.price;
  return Number.isFinite(gmvPrice) && Number.isFinite(item.sales2027) ? gmvPrice * item.sales2027 : null;
}

function formatGmv(value) {
  if (!Number.isFinite(value)) return "待验证";
  return `$${Math.round(value).toLocaleString("en-US")}`;
}

function formatPrice(value) {
  return Number.isFinite(value) ? `$${value.toFixed(2)}` : "待验证";
}

function formatSales(item) {
  return Number.isFinite(item.sales2027) ? `${item.sales2027.toLocaleString("en-US")} 个` : "待验证";
}

function renderMetrics(period = "jul") {
  const data = marketData[period];
  const previous = period === "jul" ? marketData.jan : null;
  const revenueNote = previous ? "+12.0% 较 2026.01" : "2026.07 对比基准";
  const salesNote = previous ? "+10.2% 较 2026.01" : "2026.07 对比基准";
  const priceNote = previous ? "较 2026.01 下降 4.4%" : "2026.01 基准值";
  const metrics = [
    ["前 100 月销售额", money(data.revenue), revenueNote],
    ["前 100 月销量", data.sales.toLocaleString("en-US"), salesNote],
    ["价格中位数", `$${data.medianPrice.toFixed(2)}`, priceNote],
    ["平均评分", data.rating.toFixed(2), period === "jul" ? "评分略降，质量门槛更重要" : "2026.01 基准值"],
    ["两期 ASIN 重合", `${data.overlap}%`, period === "jul" ? "54% 样本发生更替" : "与 2026.07 对照"],
  ];
  $("#marketMetrics").innerHTML = metrics.map(([label, value, note]) => `<div class="metric-card"><span>${label}</span><strong>${value}</strong><small>${note}</small></div>`).join("");
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function openProjectCard(item = portfolio[0]) {
  const dialog = $("#projectDialog");
  const title = $(".dialog-heading h2", dialog);
  const eyebrow = $(".dialog-heading .eyebrow", dialog);
  const columns = $(".dialog-columns", dialog);
  const list = $(".dialog-checklist", dialog);
  title.textContent = item.title;
  eyebrow.textContent = `PROJECT CARD / ${item.priority}`;
  const plannedPrice = item.planningPrice ?? item.price;
  columns.innerHTML = `<div><h3>单品分析</h3><p>${item.description}</p></div><div><h3>经营测算</h3><p>Amazon 参考售价：${formatPrice(item.price)}<br>项目规划售价：${formatPrice(plannedPrice)}<br>2027 销量：${formatSales(item)}<br>2027 GMV：${formatGmv(productGmv(item))}<br>立项：${item.projectStart}<br>上架：${item.launchDate}</p></div>`;
  const checklist = item.id === "p0"
    ? ["2in 接收器：厚壁接收臂、加强筋、双层脚踏", "安装可靠：孔位同轴、防晃套件、编号零件袋", "质量验证：承重、耐久、盐雾、包装运输", "待决策：LED / 防盗 D 形环是否首发"]
    : ["明确用户场景与核心差异点", "完成结构打样和关键尺寸验证", "通过质量门槛后再进入 SKU 排期", "由产品、采购、质量和运营共同评审"];
  list.innerHTML = checklist.map((text, index) => `<div><span data-icon="${index === checklist.length - 1 && item.id === "p0" ? "clock-3" : "check"}"></span>${text}</div>`).join("");
  renderIcons(dialog);
  if (document.body.classList.contains("embedded-budget-module") && window.frameElement) {
    const frameRect = window.frameElement.getBoundingClientRect();
    const visibleCenter = Math.max(260, Math.min(document.documentElement.scrollHeight - 260, -frameRect.top + window.parent.innerHeight / 2));
    dialog.style.top = `${visibleCenter}px`;
    dialog.style.transform = "translateY(-50%)";
  }
  dialog.showModal();
}

function renderPortfolio(filter = "all") {
  const priorityRank = { P0: 0, P1: 1, P2: 2, P3: 3 };
  const orderedPortfolio = [...portfolio].sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority] || a.projectStart.localeCompare(b.projectStart) || a.launchDate.localeCompare(b.launchDate));
  const totalGmv = portfolio.reduce((total, item) => {
    const gmv = productGmv(item);
    return total + (Number.isFinite(gmv) ? Math.round(gmv) : 0);
  }, 0);
  const totalGmvValue = $("#portfolioTotalGmv strong");
  if (totalGmvValue) totalGmvValue.textContent = formatGmv(totalGmv);
  $("#portfolioList").innerHTML = orderedPortfolio.map((item) => {
    const displayPrice = item.id === "p0" ? item.planningPrice : item.price;
    const priceLabel = item.id === "p0" ? "项目定价" : "Amazon 售价";
    return `<div class="portfolio-item ${filter !== "all" && item.priority !== filter ? "hidden" : ""}">
    <div class="portfolio-thumb">${item.imageSrc ? `<img src="${item.imageSrc}" alt="${item.title} Amazon 参考图" referrerpolicy="no-referrer" onerror="this.onerror=null;this.src='./assets/product-reference.png'">` : `<div class="portfolio-image-empty">暂无参考图</div>`}<span>${item.imageSource}</span></div>
    <div class="portfolio-item-body">
      <div class="portfolio-item-header"><div><span class="priority-badge ${item.priority.toLowerCase()}">${item.priority}</span><strong>${item.title}</strong></div><div class="portfolio-actions">${item.referenceUrl ? `<a class="source-link" href="${item.referenceUrl}" target="_blank" rel="noopener" title="打开 Amazon 参考页面"><span data-icon="external-link"></span>Amazon</a>` : ""}<button type="button" data-project="${item.id}">${item.action} <span data-icon="chevron-right"></span></button></div></div>
      <div class="portfolio-metrics"><div><span>${priceLabel}</span><strong>${formatPrice(displayPrice)}</strong></div><div><span>27年销量</span><strong>${formatSales(item)}</strong></div><div><span>27年 GMV</span><strong>${formatGmv(productGmv(item))}</strong></div></div>
      <div class="portfolio-dates"><span>立项 ${item.projectStart}</span><span>上架 ${item.launchDate}</span></div>
      <p class="portfolio-analysis"><b>单品分析：</b>${item.description}</p>
    </div>
  </div>`;
  }).join("");
  renderIcons($("#portfolioList"));
  $$('[data-project]', $("#portfolioList")).forEach((button) => button.addEventListener("click", () => openProjectCard(portfolio.find((item) => item.id === button.dataset.project))));
}

function bindInteractions() {
  $$("[data-period]").forEach((button) => button.addEventListener("click", () => {
    $$("[data-period]").forEach((item) => item.classList.toggle("active", item === button));
    renderMetrics(button.dataset.period);
  }));
  $$("[data-filter]").forEach((button) => button.addEventListener("click", () => {
    $$("[data-filter]").forEach((item) => item.classList.toggle("active", item === button));
    renderPortfolio(button.dataset.filter);
  }));
  $$("[data-stage]").forEach((button) => button.addEventListener("click", () => {
    $$("[data-stage]").forEach((item) => item.classList.toggle("active", item === button));
    const [title, body] = stageDetails[button.dataset.stage];
    $("#timelineDetail").innerHTML = `<strong>${title}</strong><p>${body}</p>`;
  }));
  $("#openProject").addEventListener("click", () => openProjectCard());
  $("#closeProject").addEventListener("click", () => $("#projectDialog").close());
  $("#dialogDone").addEventListener("click", () => $("#projectDialog").close());
  $("#dialogPrint").addEventListener("click", () => window.print());
  $("#printPage").addEventListener("click", () => window.print());
  $("#copyBrief").addEventListener("click", async () => {
    const brief = "拖车钩脚踏类目建议：2in 带拖车管项目 P0，按 2027 年 4 月上架倒排；2027 年规划销量 420 个，项目 ROI 61%，利润点 24%，稳定年销量 680 个。先把孔位、水平度、防晃、承重和交付完整性做扎实，再分阶段叠加双层脚踏、可调高度、D 形环防盗、LED、牌照架和扰流；宠物及车型特配后置。";
    try { await navigator.clipboard.writeText(brief); showToast("CEO 汇报摘要已复制"); } catch { showToast("当前浏览器未授权复制，请使用打印视图"); }
  });
  const navLinks = $$("#pageNav a");
  const sections = navLinks.map((link) => document.querySelector(link.getAttribute("href"))).filter(Boolean);
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
  }), { rootMargin: "-20% 0px -68% 0px", threshold: 0 });
  sections.forEach((section) => observer.observe(section));
}

renderIcons();
renderMetrics();
renderPortfolio();
bindInteractions();

function enableBudgetEmbed() {
  if (new URLSearchParams(window.location.search).get("embed") !== "budget") return;
  document.body.classList.add("embedded-budget-module");
  requestAnimationFrame(() => window.scrollTo(0, 0));
  const section = document.querySelector("#portfolio");
  if (!section || window.parent === window) return;

  let frame = 0;
  const reportHeight = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      const height = Math.ceil(Math.max(section.scrollHeight, section.getBoundingClientRect().height));
      window.parent.postMessage({ type: "embedded-module-size", key: "hitch-portfolio", height }, "*");
    });
  };

  new ResizeObserver(reportHeight).observe(section);
  document.querySelectorAll("#portfolio img").forEach((image) => image.addEventListener("load", reportHeight, { once: true }));
  reportHeight();
}

enableBudgetEmbed();
