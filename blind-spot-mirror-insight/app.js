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

const amazonLinks = [...document.querySelectorAll('a[href^="https://www.amazon.com/"]')];
amazonLinks.forEach((link) => {
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  link.title = "在新页面打开 Amazon 商品页";
  link.addEventListener("click", (event) => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    const productPage = window.open("about:blank", "_blank");
    if (!productPage) {
      showToast("浏览器拦截了新页面，请允许此网站打开弹窗");
      return;
    }
    productPage.opener = null;
    productPage.location.href = link.href;
  });
});

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
    "JOYTUTUS 已有圆形、爱心形、楔形和 3.7×2.5 英寸 XL 圆角矩形，4 个子 ASIN 共享父体评价。",
    "9 月：形状矩阵优先，首发椭圆与半椭圆；紧凑矩形只有在明显小于现有 XL 时立项，否则改做椭圆铝框版。",
    "10 月：车型专配 OEM 贴面，先确认公司 2024 RAM 是 DS Classic 还是 DT 第五代。",
    "11 月：快速差异化只保留粘接可靠包、铝框耐久版和雨天视野组合；定位模板与普通 ABS 包边不算功能。",
    "12 月：评审现有 XL 的视野/粘接优化或中尺寸空白，不重复开发同尺寸 XL。",
    "评价总数不能直接代替子 ASIN 销量；JOYTUTUS 4 个已做形状的 101 条评价不得重复计算。",
  ].join("\n");

  try {
    await copyText(decision);
    showToast("核心结论已复制");
  } catch {
    showToast("浏览器未允许复制，请手动选择结论");
  }
});

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
