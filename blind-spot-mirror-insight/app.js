import { renderIcons } from "./vendor/icons.js";

const menuButton = document.querySelector("#menuButton");
const sideNav = document.querySelector("#sideNav");
const copyButton = document.querySelector("#copyDecision");
const toast = document.querySelector("#toast");
const navLinks = [...document.querySelectorAll(".side-nav nav a")];
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);

renderIcons();

function enhanceAmazonLinks(scope = document) {
  const amazonLinks = [...scope.querySelectorAll('a[href^="https://www.amazon.com/"]')];
  amazonLinks.forEach((link) => {
    if (link.dataset.amazonLinkReady === "true") return;
    link.dataset.amazonLinkReady = "true";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.title = "在新页面打开 Amazon 商品页";
  });
}

enhanceAmazonLinks();

document.querySelectorAll(".matrix-body > small").forEach((asin) => {
  asin.addEventListener("pointerdown", (event) => event.stopPropagation());
});

function setMenu(open) {
  sideNav.classList.toggle("open", open);
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "关闭导航" : "打开导航");
  menuButton.title = open ? "关闭导航" : "打开导航";
}

menuButton?.addEventListener("click", () => {
  setMenu(!sideNav.classList.contains("open"));
});

navLinks.forEach((link) => {
  link.addEventListener("click", () => setMenu(false));
});

document.addEventListener("click", (event) => {
  if (window.innerWidth > 980 || !sideNav.classList.contains("open")) return;
  if (sideNav.contains(event.target) || menuButton.contains(event.target)) return;
  setMenu(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") setMenu(false);
});

let scrollFrame = 0;
function updateActiveNav() {
  const marker = window.scrollY + 130;
  let current = sections[0];
  sections.forEach((section) => {
    if (section.offsetTop <= marker) current = section;
  });
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${current.id}`);
  });
}

window.addEventListener("scroll", () => {
  if (scrollFrame) return;
  scrollFrame = window.requestAnimationFrame(() => {
    updateActiveNav();
    scrollFrame = 0;
  });
}, { passive: true });

updateActiveNav();

let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.append(field);
  field.select();
  document.execCommand("copy");
  field.remove();
}

copyButton?.addEventListener("click", async () => {
  const decision = [
    "Blind Spot Mirror 新品开发评审分为四条路线。",
    "子体销量50+证据：原表筛得119个子ASIN，排除7个完整替换镜/车内镜后保留112个、65个父体；筛选使用U列子体销量，不使用重复的父体月销量。",
    "新增优先级：P0为4片装价值包、2.7/3英寸尺寸梯度和安装保障包；P1为F-150 OEM贴面与免胶Clip-on；胶囊/Wing/Falcon先做轮廓去重。",
    "形状矩阵：164 张 Amazon 商品卡去重为 120 个 ASIN，保留 47 个形态证据 ASIN，归并为 8 个唯一形态；选择未覆盖形态前先排除已上架/已立项重复。",
    "车型专配 OEM：RAM与Jeep继续推进，F-150 14th Gen进入扫描评估；立项前补齐车身代号、BLIS/非BLIS、非拖车镜排除、左右扫描和装配公差。",
    "快速功能：只保留备用 VHB + 清洁包、铝框耐久、雨眉/防水膜三项可快速验证方案。",
    "Wide Angle：定向搜索显示该词横跨 D 形、圆形、矩形和扇形，现阶段先作为关键词/利益点层；只有实车视野 A/B 显著领先才转独立新品。",
    "9 月做形状项目去重与椭圆评估，10 月确定 OEM 首发车型，11 月筛选快速功能，12 月完成 Wide Angle Go/No-Go。",
    "公开月购、评价和榜位是需求信号，不是精确销量；父体共享数据不得跨子 ASIN 相加。",
  ].join("\n");

  try {
    await copyText(decision);
    showToast("开发摘要已复制");
  } catch {
    showToast("浏览器未允许复制，请手动选择结论");
  }
});

function formatReviews(value) {
  if (!Number.isFinite(value)) return "—";
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 1 : 1)}K`;
  return new Intl.NumberFormat("en-US").format(value);
}

function priceLabel(value) {
  return Number.isFinite(value) ? `$${value.toFixed(2)}` : "价格待复核";
}

function formatNumber(value) {
  return Number.isFinite(value) ? new Intl.NumberFormat("en-US").format(value) : "—";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function statusMarkup(status = []) {
  if (!status.length) return "";
  return `<div class="shape-status-stack">${status.map((item) => {
    const tone = item === "已上架" ? "listed" : "planned";
    return `<span class="shape-status ${tone}">${item}</span>`;
  }).join("")}</div>`;
}

function renderShapeCards(clusters) {
  const rail = document.querySelector("#shapeRail");
  if (!rail) return;
  const validationById = {
    oval: "锁定中尺寸，并验证主镜遮挡",
    "d-semi-oval": "对比纯椭圆与现有 XL 的视野",
    square: "验证 CTR 是否高于圆角矩形",
    rhombus: "小批验证独立点击与转化",
    round: "只做胶材、成本与包装优化",
    heart: "只评估颜色与礼赠变体",
    "fan-wedge": "与现有楔形做同车 A/B 去重",
    "rectangle-oblong": "与现有 XL / 长条立项去重",
  };
  rail.innerHTML = clusters.map((cluster) => {
    const representative = cluster.representative;
    const demandSignal = cluster.signals.maxBought
      ? `${cluster.signals.maxBought} 月购`
      : cluster.signals.bestRank
        ? `Best Sellers #${cluster.signals.bestRank}`
        : `${formatReviews(representative.reviews)} 条评价`;
    return `
      <article class="shape-card ${cluster.verdictTone}">
        <div class="shape-media">
          <a href="${representative.url}" aria-label="打开 ${representative.asin} Amazon 商品页"><img src="${cluster.image}" alt="${cluster.nameZh}盲点镜代表商品"></a>
          <span class="shape-name">${cluster.nameZh}</span>
          ${statusMarkup(cluster.status)}
        </div>
        <div class="shape-card-body">
          <div class="shape-card-kicker"><span class="traction traction-${cluster.traction.replace("极", "very-").replace("中高", "mid-high").replace("中", "mid").replace("高", "high")}">${cluster.traction}牵引</span><span>${cluster.signals.sampleCount} 个证据 ASIN</span></div>
          <h4>${cluster.nameEn}</h4>
          <a class="shape-representative" href="${representative.url}"><strong>${representative.asin}</strong><span>打开 Amazon ↗</span></a>
          <div class="shape-price-row"><strong>${priceLabel(representative.price)}</strong><span>当前价</span></div>
          <div class="shape-compact-fact"><span>需求信号</span><strong>${demandSignal}</strong></div>
          <div class="shape-compact-fact action"><span>需验证</span><strong>${validationById[cluster.id] || cluster.action}</strong></div>
          <div class="shape-verdict">${cluster.verdict}</div>
        </div>
      </article>`;
  }).join("");
}

function renderShapeLedger(clusters) {
  const ledger = document.querySelector("#shapeLedgerGrid");
  if (!ledger) return;
  ledger.innerHTML = clusters.map((cluster) => `
    <section class="shape-evidence-group">
      <header><div><strong>${cluster.nameZh}</strong><span>${cluster.verdict}</span></div><b>${cluster.evidence.length} ASIN</b></header>
      <div class="shape-evidence-list">
        ${cluster.evidence.map((item) => {
          const signals = [
            item.rank ? `#${item.rank}` : "",
            item.bought ? `${item.bought}月购` : "",
            Number.isFinite(item.rating) ? `${item.rating.toFixed(1)}★` : "",
            Number.isFinite(item.reviews) ? formatReviews(item.reviews) : "",
          ].filter(Boolean).join(" · ");
          return `<a href="${item.url}"><span><strong>${item.asin}</strong><small>${item.note}</small></span><b>${priceLabel(item.price)}</b><em>${signals || "公开信号有限"}</em></a>`;
        }).join("")}
      </div>
      <p>${cluster.caveat}</p>
    </section>`).join("");
}

async function loadShapeMarket() {
  try {
    const response = await fetch("./data/amazon-shape-market-20260826.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    renderShapeCards(data.clusters);
    renderShapeLedger(data.clusters);
    enhanceAmazonLinks(document.querySelector("#route-shapes"));
  } catch (error) {
    const message = "形态数据加载失败，请刷新页面后重试";
    const rail = document.querySelector("#shapeRail");
    const ledger = document.querySelector("#shapeLedgerGrid");
    if (rail) rail.innerHTML = `<p class="shape-loading error">${message}</p>`;
    if (ledger) ledger.innerHTML = `<p class="shape-loading error">${message}</p>`;
    console.error(error);
  }
}

function renderThresholdMetrics(meta) {
  const metrics = document.querySelector("#thresholdMetrics");
  if (!metrics) return;
  metrics.innerHTML = `
    <article><span>原表达标</span><strong>${formatNumber(meta.rawAsinCount)}</strong><small>U列子体销量 ≥ ${meta.threshold}</small></article>
    <article><span>研究范围内</span><strong>${formatNumber(meta.inScopeAsinCount)}</strong><small>排除 ${meta.excludedAsinCount} 个非辅助贴片</small></article>
    <article><span>独立父体</span><strong>${formatNumber(meta.parentAsinCount)}</strong><small>避免只看变体数量</small></article>
    <article><span>样本子体销量</span><strong>${formatNumber(meta.childSalesSum)}</strong><small>达标样本合计，不是全市场</small></article>
    <article><span>价格中位数</span><strong>${priceLabel(meta.medianPrice)}</strong><small>112个范围内子ASIN</small></article>`;
}

function renderOpportunityCards(opportunities) {
  const grid = document.querySelector("#opportunityGrid");
  if (!grid) return;
  grid.innerHTML = opportunities.map((opportunity) => {
    const evidenceLinks = opportunity.evidence.slice(0, 3).map((item) => `
      <a href="${escapeHtml(item.url)}"><strong>${escapeHtml(item.asin)}</strong><span>${formatNumber(item.childSales)}件 · ${priceLabel(item.price)}</span></a>`).join("");
    const remaining = Math.max(0, opportunity.evidence.length - 3);
    return `
      <article class="opportunity-card priority-${opportunity.priority.toLowerCase()}">
        <div class="opportunity-media">
          <img src="${escapeHtml(opportunity.image)}" alt="${escapeHtml(opportunity.shortTitle)}代表商品">
          <span>${escapeHtml(opportunity.priority)}</span>
        </div>
        <div class="opportunity-body">
          <div class="opportunity-title"><div><small>${escapeHtml(opportunity.decision)}</small><h3>${escapeHtml(opportunity.title)}</h3></div><b>${formatNumber(opportunity.childSalesSum)}</b></div>
          <div class="opportunity-facts"><span>${opportunity.asinCount} 个子ASIN</span><span>${opportunity.parentCount} 个父体</span><span>销量合计</span></div>
          <p>${escapeHtml(opportunity.reason)}</p>
          <div class="opportunity-action"><span>下一步</span><strong>${escapeHtml(opportunity.nextStep)}</strong></div>
          <div class="opportunity-evidence">${evidenceLinks}${remaining ? `<span>另有 ${remaining} 个达标 ASIN</span>` : ""}</div>
          <small class="opportunity-risk">风险：${escapeHtml(opportunity.risk)}</small>
        </div>
      </article>`;
  }).join("");
}

function renderEvidenceRows(products, query = "", group = "all") {
  const rows = document.querySelector("#evidenceRows");
  const count = document.querySelector("#evidenceCount");
  if (!rows || !count) return;
  const normalized = query.trim().toLowerCase();
  const filtered = products.filter((product) => {
    const groupMatches = group === "all" || product.group === group;
    const haystack = `${product.asin} ${product.parentAsin} ${product.brand} ${product.title} ${product.type}`.toLowerCase();
    return groupMatches && (!normalized || haystack.includes(normalized));
  });

  count.textContent = `显示 ${filtered.length} / ${products.length} 个 ASIN`;
  if (!filtered.length) {
    rows.innerHTML = '<p class="evidence-empty">没有符合当前筛选条件的 ASIN</p>';
    return;
  }

  rows.innerHTML = filtered.map((product) => `
    <div class="evidence-row" role="row">
      <span class="evidence-product-cell" data-label="ASIN / 产品"><a href="${escapeHtml(product.url)}"><strong>${escapeHtml(product.asin)}</strong><small>${escapeHtml(product.brand)} · ${escapeHtml(product.title)}</small></a></span>
      <span data-label="分类"><b>${escapeHtml(product.type)}</b><small>${escapeHtml(product.groupLabel)}</small></span>
      <span data-label="子体销量"><strong>${formatNumber(product.childSales)}</strong></span>
      <span data-label="价格"><strong>${priceLabel(product.price)}</strong></span>
      <span data-label="父 ASIN"><code>${escapeHtml(product.parentAsin)}</code></span>
    </div>`).join("");
  enhanceAmazonLinks(rows);
}

function renderExcludedRows(excluded) {
  const rows = document.querySelector("#excludedRows");
  if (!rows) return;
  rows.innerHTML = excluded.map((item) => `
    <div><strong>${escapeHtml(item.asin)}</strong><span>子体销量 ${formatNumber(item.childSales)}</span><p>${escapeHtml(item.reason)} · ${escapeHtml(item.title)}</p></div>`).join("");
}

async function loadThresholdEvidence() {
  const grid = document.querySelector("#opportunityGrid");
  try {
    const response = await fetch("./data/child-sales-50plus-20260826.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    renderThresholdMetrics(data.meta);
    renderOpportunityCards(data.opportunities);
    renderEvidenceRows(data.products);
    renderExcludedRows(data.excluded);

    const search = document.querySelector("#evidenceSearch");
    const group = document.querySelector("#evidenceGroup");
    const update = () => renderEvidenceRows(data.products, search?.value || "", group?.value || "all");
    search?.addEventListener("input", update);
    group?.addEventListener("change", update);
    enhanceAmazonLinks(document.querySelector("#threshold"));
  } catch (error) {
    if (grid) grid.innerHTML = '<p class="threshold-loading error">50+证据池加载失败，请刷新页面后重试</p>';
    const count = document.querySelector("#evidenceCount");
    if (count) count.textContent = "数据加载失败";
    console.error(error);
  }
}

await Promise.all([loadShapeMarket(), loadThresholdEvidence()]);

document.querySelectorAll("img").forEach((image) => {
  image.addEventListener(
    "error",
    () => {
      const fallback = document.createElement("span");
      fallback.className = "image-fallback";
      fallback.textContent = `图片暂不可用\n${image.alt || "打开商品链接查看"}`;
      image.replaceWith(fallback);
    },
    { once: true },
  );
});

document.querySelectorAll("[data-carousel-shell]").forEach((shell) => {
  const rail = shell.querySelector("[data-carousel]");
  const previous = shell.querySelector("[data-carousel-prev]");
  const next = shell.querySelector("[data-carousel-next]");

  if (!rail) return;

  const updateControls = () => {
    const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const atStart = rail.scrollLeft <= 2;
    const atEnd = rail.scrollLeft >= maxScroll - 2;
    if (previous) previous.disabled = atStart;
    if (next) next.disabled = atEnd;
  };

  const scrollRail = (direction) => {
    const distance = Math.min(Math.max(rail.clientWidth * 0.82, 280), 720);
    rail.scrollBy({ left: direction * distance, behavior: "smooth" });
  };

  previous?.addEventListener("click", () => scrollRail(-1));
  next?.addEventListener("click", () => scrollRail(1));
  rail.addEventListener("scroll", updateControls, { passive: true });
  rail.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollRail(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollRail(1);
    }
  });

  let dragging = false;
  let moved = false;
  let startX = 0;
  let startScroll = 0;

  rail.addEventListener("pointerdown", (event) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    dragging = true;
    moved = false;
    startX = event.clientX;
    startScroll = rail.scrollLeft;
    rail.setPointerCapture(event.pointerId);
  });

  rail.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const delta = event.clientX - startX;
    if (Math.abs(delta) > 5) {
      moved = true;
      rail.classList.add("dragging");
    }
    rail.scrollLeft = startScroll - delta;
  });

  const endDrag = (event) => {
    if (!dragging) return;
    dragging = false;
    rail.classList.remove("dragging");
    if (rail.hasPointerCapture(event.pointerId)) rail.releasePointerCapture(event.pointerId);
    window.setTimeout(() => { moved = false; }, 0);
  };

  rail.addEventListener("pointerup", endDrag);
  rail.addEventListener("pointercancel", endDrag);
  rail.addEventListener("click", (event) => {
    if (moved) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  if ("ResizeObserver" in window) {
    new ResizeObserver(updateControls).observe(rail);
  }
  updateControls();
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 980) setMenu(false);
});
