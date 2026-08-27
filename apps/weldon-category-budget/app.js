import { renderIcons } from "./vendor/icons.js";

const categories = [
  { id: "steps", name: "33-脚踏", plan: 682267.66, booked: 0, count: 7 },
  { id: "cargo", name: "29-置物托盘", plan: 212910, booked: 0, count: 3 },
  { id: "doors", name: "42-车门", plan: 163937, booked: 163937, count: 2 },
  { id: "fender", name: "35-挡泥板", plan: 142992.85, booked: 142992.85, count: 1 },
  { id: "storage", name: "40-战术板", plan: 129800, booked: 0, count: 2 },
  { id: "roof", name: "07-车顶遮阳网", plan: 85787, booked: 85787, count: 2 },
  { id: "hitch", name: "拖车钩脚踏", plan: 65993.4, booked: 0, count: 1, isNew: true },
  { id: "blind", name: "盲点镜", plan: 19800, booked: 0, count: 1, isNew: true },
].map((item) => ({ ...item, gap: item.plan - item.booked }));

const products = [
  { category: "fender", name: "轮眉内衬（适配 JK 2门/4门）", region: "美国", launch: "2027.02", price: 199.99, qty: 715, gmv: 142992.85, status: "开发", project: "测试中", image: "fender-liner.jpeg" },
  { category: "steps", name: "F150 2015-2026 圆管脚踏（Crew Cab）", region: "非美", launch: "2027.02", price: 289.99, qty: 125, gmv: 36248.75, status: "开发", project: "打样中", image: "f150-step.png" },
  { category: "steps", name: "F150 圆管脚踏（非美第二站点）", region: "非美", launch: "2027.02", price: 289.99, qty: 79, gmv: 22909.21, status: "开发", project: "打样中", image: "f150-step.png" },
  { category: "steps", name: "JT 4 Door 2020-2026 六角管脚踏", region: "非美", launch: "2027.02", price: 279.99, qty: 30, gmv: 8399.7, status: "开发", project: "打样中", image: "jt-step.png" },
  { category: "roof", name: "Bronco 车顶网（前+后4门）", region: "美国", launch: "2027.03", price: 65.99, qty: 650, gmv: 42893.5, status: "未立项", project: "未立项", image: "bronco-roof-net.jpeg" },
  { category: "roof", name: "TJ 车顶网（前+后4门）", region: "美国", launch: "2027.03", price: 65.99, qty: 650, gmv: 42893.5, status: "未立项", project: "未立项", image: "tj-roof-net.jpeg" },
  { category: "doors", name: "JK 半门基础款", region: "美国", launch: "2027.03", price: 299.9, qty: 380, gmv: 113962, status: "开发", project: "未立项", image: "half-door.jpeg" },
  { category: "doors", name: "TJ 半门基础款", region: "美国", launch: "2027.03", price: 199.9, qty: 250, gmv: 49975, status: "开发", project: "未立项", image: "half-door.jpeg" },
  { category: "blind", name: "盲点镜变体", region: "美国", launch: "2027.03", price: 9.9, qty: 2000, gmv: 19800, status: "未立项", project: "ROI测算", image: "blind-source.jpeg" },
  { category: "cargo", name: "JK 后备箱储物架上下移动款", region: "美国", launch: "2027.05", price: 249.9, qty: 300, gmv: 74970, status: "未立项", project: "未立项", image: "jk-cargo.png" },
  { category: "cargo", name: "TJ 后备箱储物架基础款", region: "美国", launch: "2027.05", price: 189.9, qty: 300, gmv: 56970, status: "未立项", project: "未立项", image: "tj-cargo.png" },
  { category: "cargo", name: "Bronco 后备箱储物架上下移动款", region: "美国", launch: "2027.05", price: 269.9, qty: 300, gmv: 80970, status: "未立项", project: "未立项", image: "bronco-cargo.png" },
  { category: "storage", name: "JK 车门储物框", region: "美国", launch: "2027.03", price: 59.9, qty: 1000, gmv: 59900, status: "未立项", project: "未立项", image: "jk-door-storage.png" },
  { category: "storage", name: "JL 车门储物框", region: "美国", launch: "2027.03", price: 69.9, qty: 1000, gmv: 69900, status: "未立项", project: "未立项", image: "jl-door-storage.png" },
  { category: "hitch", name: "2in 拖车钩脚踏（附拖车管）", region: "美国", launch: "2027.03", price: 99.99, qty: 660, gmv: 65993.4, status: "未立项", project: "未立项", image: "hitch-source.png" },
  { category: "steps", name: "Tundra 2021+ 脚踏基础款", region: "美国", launch: "2027.04", price: 199.9, qty: 800, gmv: 159920, status: "未立项", project: "未立项" },
  { category: "steps", name: "Tundra 2021+ 脚踏升级款", region: "美国", launch: "2027.04", price: 269.9, qty: 500, gmv: 134950, status: "未立项", project: "未立项" },
  { category: "steps", name: "A1333-00003-BK 降本款", region: "美国", launch: "2027.05", price: 199.9, qty: 800, gmv: 159920, status: "未立项", project: "未立项" },
  { category: "steps", name: "A1333-00005-BK 降本款", region: "美国", launch: "2027.05", price: 199.9, qty: 800, gmv: 159920, status: "未立项", project: "未立项" },
];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const money = (value) => `$${Math.round(value).toLocaleString("en-US")}`;
const moneyCompact = (value) => value >= 1000000 ? `$${(value / 1000000).toFixed(3)}M` : `$${(value / 1000).toFixed(1)}K`;
let activeCategory = "all";
let activeMetric = "plan";

function renderBars() {
  const max = Math.max(...categories.map((item) => item[activeMetric]));
  $("#categoryBars").innerHTML = categories.map((item) => `
    <div class="bar-row ${item.id === "steps" ? "focus" : ""} ${item.isNew ? "new" : ""}">
      <span class="bar-label" title="${item.name}">${item.name}</span>
      <div class="bar-track"><i class="bar-fill" style="width:${max ? item[activeMetric] / max * 100 : 0}%"></i></div>
      <span class="bar-value">${moneyCompact(item[activeMetric])}</span>
    </div>`).join("");
}

function renderFilters() {
  const items = [{ id: "all", name: "全部" }, ...categories];
  $("#categoryFilters").innerHTML = items.map((item) => `<button class="${item.id === activeCategory ? "active" : ""}" data-category="${item.id}" type="button">${item.name}</button>`).join("");
  $$('[data-category]').forEach((button) => button.addEventListener("click", () => {
    activeCategory = button.dataset.category;
    renderFilters();
    renderProducts();
  }));
}

function renderProducts() {
  const filtered = activeCategory === "all" ? products : products.filter((item) => item.category === activeCategory);
  const total = filtered.reduce((sum, item) => sum + item.gmv, 0);
  const unstarted = filtered.filter((item) => item.status === "未立项").length;
  const label = activeCategory === "all" ? "全部产品" : categories.find((item) => item.id === activeCategory)?.name;
  $("#portfolioSummary").innerHTML = `<strong>${label}</strong><span>${filtered.length} 个产品 · 规划 GMV ${moneyCompact(total)} · ${unstarted} 个未立项</span>`;
  $("#productGallery").innerHTML = filtered.slice(0, 8).map((item, index) => `
    <button class="product-card" type="button" data-product="${products.indexOf(item)}">
      <figure>${item.image ? `<img src="./assets/${item.image}" alt="${item.name}">` : `<div class="placeholder"><span data-icon="package-search"></span></div>`}</figure>
      <div class="card-copy"><strong>${item.name}</strong><span>${money(item.gmv)} · ${item.launch}</span></div>
    </button>`).join("");
  $("#productRows").innerHTML = filtered.map((item) => `<tr><td>${item.name}</td><td>${item.region}</td><td>${item.launch}</td><td>${money(item.gmv)}</td><td><span class="status ${item.status === "开发" ? "developing" : ""}">${item.status}</span></td></tr>`).join("");
  renderIcons($("#productGallery"));
  $$('[data-product]').forEach((button) => button.addEventListener("click", () => openProduct(products[Number(button.dataset.product)])));
}

function openProduct(item) {
  $("#dialogContent").innerHTML = `<div class="dialog-product">
    ${item.image ? `<img src="./assets/${item.image}" alt="${item.name}">` : `<div class="dialog-placeholder"><span data-icon="package-search"></span></div>`}
    <div class="dialog-copy"><p class="eyebrow">PRODUCT BUDGET & STATUS</p><h2>${item.name}</h2>
      <div class="dialog-specs"><div><span>三级类目</span><strong>${categories.find((c) => c.id === item.category)?.name}</strong></div><div><span>目标区域</span><strong>${item.region}</strong></div><div><span>售价 × 销量</span><strong>$${item.price.toFixed(2)} × ${item.qty.toLocaleString()}</strong></div><div><span>规划 GMV</span><strong>${money(item.gmv)}</strong></div><div><span>计划上架</span><strong>${item.launch}</strong></div><div><span>当前阶段</span><strong>${item.project}</strong></div></div>
      <p><strong>产品经理说明：</strong>${item.status === "未立项" ? "该产品已有销量和 GMV 规划，但尚未立项；需与运营确认预算、差异点和上架时间后再进入开发。" : "该产品已进入开发阶段，预算口径已形成，下一步围绕样品、质量和上架节点完成闭环。"}</p>
    </div></div>`;
  renderIcons($("#productDialog"));
  $("#productDialog").showModal();
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function bindEmbeddedModules() {
  const frames = [
    { element: $("#blindRoutesFrame"), key: "blind-routes" },
    { element: $("#hitchPortfolioFrame"), key: "hitch-portfolio" },
  ];

  window.addEventListener("message", (event) => {
    const frame = frames.find((item) => item.key === event.data?.key && event.source === item.element?.contentWindow);
    if (!frame || event.data?.type !== "embedded-module-size") return;
    const height = Math.max(640, Math.ceil(Number(event.data.height) || 0));
    frame.element.style.height = `${height}px`;
    frame.element.parentElement?.classList.add("is-ready");
  });
}

function bind() {
  $$('[data-metric]').forEach((button) => button.addEventListener("click", () => {
    activeMetric = button.dataset.metric;
    $$('[data-metric]').forEach((item) => item.classList.toggle("active", item === button));
    renderBars();
  }));
  $("#closeDialog").addEventListener("click", () => $("#productDialog").close());
  $("#printPage").addEventListener("click", () => window.print());
  $("#menuButton").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
  $$("#pageNav a").forEach((link) => link.addEventListener("click", () => $("#sidebar").classList.remove("open")));
  $("#copyBrief").addEventListener("click", async () => {
    const text = "Weldon 2027 产品判断：19个产品规划GMV $1.503M，已填预算 $0.393M，至少 $1.111M 需在9月15日前回填。优先补脚踏、置物托盘和战术板预算；盲点镜走安装保障/OEM专配路线；拖车钩脚踏先统一660件/3月与420件/4月口径。";
    try { await navigator.clipboard.writeText(text); showToast("汇报摘要已复制"); } catch { showToast("浏览器未开放剪贴板权限"); }
  });
  const links = $$("#pageNav a");
  const sections = links.map((link) => $(link.getAttribute("href"))).filter(Boolean);
  const observer = new IntersectionObserver((entries) => entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    links.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
  }), { rootMargin: "-20% 0px -65% 0px" });
  sections.forEach((section) => observer.observe(section));
  bindEmbeddedModules();
}

renderIcons();
renderBars();
renderFilters();
renderProducts();
bind();
