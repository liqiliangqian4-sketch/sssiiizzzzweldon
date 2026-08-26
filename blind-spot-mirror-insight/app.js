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
    "Blind Spot Mirror 新品判断：GO / 分阶段立项。",
    "本次观察 164 张 Amazon 商品卡，去重为 120 个 ASIN；保留 47 个形态证据 ASIN，归并为 8 个唯一形态簇。",
    "首要新品机会是纯椭圆；圆角方形属于次级机会，建议低成本小批测试。",
    "D 形半椭圆与菱形已立项，继续验证；弧边楔形与长条圆角矩形同时存在已上架/已立项状态，属于重复开发风险。",
    "圆形和爱心形市场有量但 JOYTUTUS 已上架，不再新增同轮廓；ABS、铝框、防水胶等移入功能/材料路线。",
    "9 月：先完成楔形/矩形同车 A/B 对比，再决定是否保留独立 SKU；同时补椭圆样品规格。",
    "10 月：车型专配 OEM 贴面，先确认公司 2024 RAM 是 DS Classic 还是 DT 第五代。",
    "11 月：快速差异化只保留粘接可靠包、铝框耐久版和雨天视野组合；定位模板与普通 ABS 包边不算功能。",
    "12 月：评审现有 XL 的视野/粘接优化或中尺寸空白，不重复开发同尺寸 XL。",
    "公开月购、评价和榜位是需求信号，不是精确销量；父体共享数据不得跨子 ASIN 相加。",
  ].join("\n");

  try {
    await copyText(decision);
    showToast("核心结论已复制");
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
  rail.innerHTML = clusters.map((cluster) => {
    const representative = cluster.representative;
    const rankSignal = cluster.signals.bestRank ? `Best Sellers #${cluster.signals.bestRank}` : "未进抽样 Top 80";
    const boughtSignal = cluster.signals.maxBought ? `${cluster.signals.maxBought} 月购` : "无公开月购";
    const joytutus = (cluster.joytutus || []).map((item) => {
      const price = Number.isFinite(item.price) ? ` · ${priceLabel(item.price)}` : "";
      return `<a href="${item.url}">${item.asin}${price}</a>`;
    }).join("");
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
          <a class="shape-representative" href="${representative.url}"><strong>${representative.asin}</strong><span>${priceLabel(representative.price)} · ${representative.rating.toFixed(1)}★ · ${formatReviews(representative.reviews)}</span></a>
          <div class="shape-signal-grid">
            <div><span>价格带</span><strong>${cluster.signals.priceRange}</strong></div>
            <div><span>公开需求</span><strong>${rankSignal}<br>${boughtSignal}</strong></div>
          </div>
          <p>${cluster.summary}</p>
          ${joytutus ? `<div class="shape-joy"><span>JOYTUTUS</span>${joytutus}</div>` : ""}
          <div class="shape-verdict">${cluster.verdict}</div>
          <small>${cluster.action}</small>
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

await loadShapeMarket();

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
