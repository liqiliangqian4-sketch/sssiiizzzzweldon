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
    "Blind Spot Mirror 新品判断：GO / 先验证。",
    "首发优先：低矮可调结构，重点解决角度漂移、曲面粘接和视觉突兀。",
    "第二阶段：JL/JT 或 RAM 车型专配 OEM 贴面。",
    "不建议：再做一款无差异通用圆镜；爱心/菱形只作为变体，不作为核心壁垒。",
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

window.addEventListener("resize", () => {
  if (window.innerWidth > 980) setMenu(false);
});
