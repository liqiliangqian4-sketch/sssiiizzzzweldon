const INCH_PER_CM = 1 / 2.54;
const LB_PER_KG = 2.20462262185;
const US_VOLUME_DIVISOR = 139;
const PERIMETER_LIMIT = 130;
const RMB_PER_USD = 7.0759;

const fbaRateTable = [
  { number: 1, segment: "smallStandard", maxWeightLb: 0.125, startWeightLb: 0, intervalLb: 0, continuation: 0, under10: 2.43, tenTo50: 3.32, over50: 3.58 },
  { number: 2, segment: "smallStandard", maxWeightLb: 0.25, startWeightLb: 0, intervalLb: 0, continuation: 0, under10: 2.49, tenTo50: 3.42, over50: 3.68 },
  { number: 3, segment: "smallStandard", maxWeightLb: 0.375, startWeightLb: 0, intervalLb: 0, continuation: 0, under10: 2.56, tenTo50: 3.45, over50: 3.71 },
  { number: 4, segment: "smallStandard", maxWeightLb: 0.5, startWeightLb: 0, intervalLb: 0, continuation: 0, under10: 2.66, tenTo50: 3.54, over50: 3.80 },
  { number: 5, segment: "smallStandard", maxWeightLb: 0.625, startWeightLb: 0, intervalLb: 0, continuation: 0, under10: 2.77, tenTo50: 3.68, over50: 3.94 },
  { number: 6, segment: "smallStandard", maxWeightLb: 0.75, startWeightLb: 0, intervalLb: 0, continuation: 0, under10: 2.82, tenTo50: 3.78, over50: 4.04 },
  { number: 7, segment: "smallStandard", maxWeightLb: 0.875, startWeightLb: 0, intervalLb: 0, continuation: 0, under10: 2.92, tenTo50: 3.91, over50: 4.17 },
  { number: 8, segment: "smallStandard", maxWeightLb: 1, startWeightLb: 0, intervalLb: 0, continuation: 0, under10: 2.95, tenTo50: 3.96, over50: 4.22 },
  { number: 9, segment: "largeStandard", maxWeightLb: 0.25, startWeightLb: 0, intervalLb: 0, continuation: 0, under10: 2.91, tenTo50: 3.73, over50: 3.99 },
  { number: 10, segment: "largeStandard", maxWeightLb: 0.5, startWeightLb: 0, intervalLb: 0, continuation: 0, under10: 3.13, tenTo50: 3.95, over50: 4.21 },
  { number: 11, segment: "largeStandard", maxWeightLb: 0.75, startWeightLb: 0, intervalLb: 0, continuation: 0, under10: 3.38, tenTo50: 4.20, over50: 4.46 },
  { number: 12, segment: "largeStandard", maxWeightLb: 1, startWeightLb: 0, intervalLb: 0, continuation: 0, under10: 3.78, tenTo50: 4.60, over50: 4.86 },
  { number: 13, segment: "largeStandard", maxWeightLb: 1.25, startWeightLb: 0, intervalLb: 0, continuation: 0, under10: 4.22, tenTo50: 5.04, over50: 5.30 },
  { number: 14, segment: "largeStandard", maxWeightLb: 1.5, startWeightLb: 0, intervalLb: 0, continuation: 0, under10: 4.60, tenTo50: 5.42, over50: 5.68 },
  { number: 15, segment: "largeStandard", maxWeightLb: 1.75, startWeightLb: 0, intervalLb: 0, continuation: 0, under10: 4.75, tenTo50: 5.57, over50: 5.83 },
  { number: 16, segment: "largeStandard", maxWeightLb: 2, startWeightLb: 0, intervalLb: 0, continuation: 0, under10: 5.00, tenTo50: 5.82, over50: 6.08 },
  { number: 17, segment: "largeStandard", maxWeightLb: 2.25, startWeightLb: 0, intervalLb: 0, continuation: 0, under10: 5.10, tenTo50: 5.92, over50: 6.18 },
  { number: 18, segment: "largeStandard", maxWeightLb: 2.5, startWeightLb: 0, intervalLb: 0, continuation: 0, under10: 5.28, tenTo50: 6.10, over50: 6.36 },
  { number: 19, segment: "largeStandard", maxWeightLb: 2.75, startWeightLb: 0, intervalLb: 0, continuation: 0, under10: 5.44, tenTo50: 6.26, over50: 6.52 },
  { number: 20, segment: "largeStandard", maxWeightLb: 3, startWeightLb: 0, intervalLb: 0, continuation: 0, under10: 5.85, tenTo50: 6.67, over50: 6.93 },
  { number: 21, segment: "largeStandard", maxWeightLb: 20, startWeightLb: 3, intervalLb: 0.25, continuation: 0.08, under10: 6.15, tenTo50: 6.97, over50: 7.23 },
  { number: 22, segment: "smallOversize", maxWeightLb: 50, startWeightLb: 1, intervalLb: 1, continuation: 0.38, under10: 6.78, tenTo50: 7.55, over50: 7.55 },
  { number: 23, segment: "largeOversize", maxWeightLb: 50, startWeightLb: 1, intervalLb: 1, continuation: 0.38, under10: 8.58, tenTo50: 9.35, over50: 9.35 },
  { number: 24, segment: "oversize0to50", maxWeightLb: 50, startWeightLb: 1, intervalLb: 1, continuation: 0.38, under10: 25.56, tenTo50: 26.33, over50: 26.33 },
  { number: 25, segment: "oversize50to70", maxWeightLb: 70, startWeightLb: 51, intervalLb: 1, continuation: 0.75, under10: 36.55, tenTo50: 37.32, over50: 37.32 },
  { number: 26, segment: "oversize70to150", maxWeightLb: 150, startWeightLb: 71, intervalLb: 1, continuation: 0.75, under10: 50.55, tenTo50: 51.32, over50: 51.32 },
  { number: 27, segment: "oversize150Plus", maxWeightLb: Infinity, startWeightLb: 151, intervalLb: 1, continuation: 0.19, under10: 194.18, tenTo50: 194.95, over50: 194.95 }
];

const presets = {
  "tacoma-original": { sku: "G507 Tacoma 原始包装", length: 217.5, width: 39, height: 19, weight: 33.5, price: 100 },
  "tacoma-optimized": { sku: "G507 Tacoma 优化后", length: 215, width: 35, height: 19, weight: 33.5, price: 100 },
  "a474-original": { sku: "A1333-00001-BK 原始包装", length: 184, width: 39, height: 31, weight: 29, price: 100 },
  "a474-optimized": { sku: "A1333-00001-BK 优化后", length: 184, width: 28.5, height: 31, weight: 29, price: 100 }
};

const state = { unit: "metric" };
const $ = (id) => document.getElementById(id);

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round((value + Number.EPSILON) * factor) / factor;
}

function fmt(value, digits = 2) {
  if (!Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
}

function fmtMoney(value) {
  return `$${fmt(value, 2)}`;
}

function currentFactor() {
  return state.unit === "metric" ? { length: 1, weight: 1 } : { length: 2.54, weight: 1 / LB_PER_KG };
}

function readInputValue(id) {
  const raw = String($(id).value ?? "").trim();
  return raw === "" ? null : Number(raw);
}

function getCanonicalInputs() {
  const factor = currentFactor();
  const values = {
    length: readInputValue("length"),
    width: readInputValue("width"),
    height: readInputValue("height"),
    weight: readInputValue("weight"),
    price: readInputValue("price")
  };
  if (state.unit === "metric") {
    return values;
  }
  return {
    length: values.length === null ? null : values.length * factor.length,
    width: values.width === null ? null : values.width * factor.length,
    height: values.height === null ? null : values.height * factor.length,
    weight: values.weight === null ? null : values.weight / LB_PER_KG,
    price: values.price
  };
}

function writeCanonicalInputs(values) {
  const factor = currentFactor();
  const lengthScale = state.unit === "metric" ? 1 : INCH_PER_CM;
  const weightScale = state.unit === "metric" ? 1 : LB_PER_KG;
  $("length").value = values.length == null ? "" : round(values.length * lengthScale, 2);
  $("width").value = values.width == null ? "" : round(values.width * lengthScale, 2);
  $("height").value = values.height == null ? "" : round(values.height * lengthScale, 2);
  $("weight").value = values.weight == null ? "" : round(values.weight * weightScale, 2);
  $("price").value = values.price == null ? "" : values.price;
  void factor;
}

function setUnit(nextUnit) {
  if (nextUnit === state.unit) return;
  const canonical = getCanonicalInputs();
  state.unit = nextUnit;
  writeCanonicalInputs(canonical);
  updateUnitLabels();
  calculate();
}

function updateUnitLabels() {
  const lengthUnit = state.unit === "metric" ? "cm" : "in";
  const weightUnit = state.unit === "metric" ? "kg" : "lb";
  $("dimension-unit-label").textContent = lengthUnit;
  $("length-unit").textContent = lengthUnit;
  $("width-unit").textContent = lengthUnit;
  $("height-unit").textContent = lengthUnit;
  $("weight-unit-label").textContent = weightUnit;
  $("weight-unit").textContent = weightUnit;
  document.querySelectorAll(".segment[data-unit]").forEach((button) => {
    const active = button.dataset.unit === state.unit;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function sortEdges(length, width, height) {
  return [length, width, height].sort((a, b) => b - a);
}

function classifyFba(billable, longest, second, shortest, perimeter) {
  if (billable <= 1 && longest <= 15 && second <= 12 && shortest <= 0.75) return "smallStandard";
  if (billable <= 20 && longest <= 18 && second <= 14 && shortest <= 8) return "largeStandard";
  if (billable <= 50 && longest <= 37 && second <= 28 && shortest <= 20 && perimeter <= 130) return "smallOversize";
  if (billable <= 50 && longest <= 59 && second <= 33 && shortest <= 33 && perimeter <= 130) return "largeOversize";
  if (billable <= 150 && (longest > 96 || perimeter > 130)) return "specialOversize";
  if (billable <= 50 && longest <= 96 && perimeter <= 130) return "oversize0to50";
  if (billable <= 50) return "oversize0to50";
  if (billable <= 70 && longest <= 96 && perimeter <= 130) return "oversize50to70";
  if (billable <= 70) return "oversize50to70";
  if (billable <= 150 && longest <= 96 && perimeter <= 130) return "oversize70to150";
  if (billable <= 150) return "oversize70to150";
  return "oversize150Plus";
}

function rateSegment(segment, billableWeightLb) {
  if (segment !== "specialOversize") return segment;
  if (billableWeightLb <= 50) return "oversize0to50";
  if (billableWeightLb <= 70) return "oversize50to70";
  return "oversize70to150";
}

function feeWeight(segment, billableWeightLb) {
  if (segment === "smallStandard") return Math.ceil((billableWeightLb - 1e-9) * 8) / 8;
  if (segment === "largeStandard") return billableWeightLb <= 3
    ? Math.ceil((billableWeightLb - 1e-9) * 4) / 4
    : 3 + Math.ceil((billableWeightLb - 3 - 1e-9) * 4) / 4;
  return Math.ceil(billableWeightLb - 1e-9);
}

function findRate(segment, billableWeightLb) {
  const effectiveSegment = rateSegment(segment, billableWeightLb);
  const ratedWeightLb = feeWeight(segment, billableWeightLb);
  return fbaRateTable.find((row) => row.segment === effectiveSegment && ratedWeightLb <= row.maxWeightLb + 1e-9) || null;
}

function getPriceTier(price) {
  if (price === null || !Number.isFinite(price) || price > 50) return { label: ">$50", key: "over50" };
  if (price >= 10) return { label: "$10–$50", key: "tenTo50" };
  return { label: "<$10", key: "under10" };
}

function getCanonicalCalculation() {
  const inputs = getCanonicalInputs();
  const required = ["length", "width", "height", "weight"];
  if (required.some((key) => !Number.isFinite(inputs[key]) || inputs[key] <= 0)) return { error: "请完整填写外箱长、宽、高和包装重量。" };
  if (inputs.price !== null && (!Number.isFinite(inputs.price) || inputs.price < 0)) return { error: "商品售价只能是 0 或更大的数字。" };

  const dimensionsIn = [inputs.length, inputs.width, inputs.height].map((value) => value * INCH_PER_CM);
  const edges = sortEdges(...dimensionsIn);
  const [longest, second, shortest] = edges;
  const perimeterEdges = edges.map((value) => Math.ceil(value));
  const realWeightLb = inputs.weight * LB_PER_KG;
  const volumeWeightLb = (dimensionsIn[0] * dimensionsIn[1] * dimensionsIn[2]) / US_VOLUME_DIVISOR;
  const billableWeightLb = Math.max(realWeightLb, volumeWeightLb);
  const fbaPerimeter = longest + 2 * (second + shortest);
  const perimeter = perimeterEdges[0] + 2 * (perimeterEdges[1] + perimeterEdges[2]);
  const segment = classifyFba(billableWeightLb, longest, second, shortest, fbaPerimeter);
  const feeWeightLb = feeWeight(segment, billableWeightLb);
  const rate = findRate(segment, billableWeightLb);
  const priceTier = getPriceTier(inputs.price);
  if (!rate) return { error: "当前尺寸或重量超出 Amazon 2026 FBA费率表范围。" };
  const baseFee = rate[priceTier.key];
  const continuationRate = rate.continuation || 0;
  const continuationUnits = rate.intervalLb > 0
    ? Math.ceil(Math.max(0, feeWeightLb - (rate.startWeightLb || 0)) / rate.intervalLb)
    : 0;
  const continuationFee = continuationUnits * continuationRate;
  const fbaFee = baseFee + continuationFee;
  return {
    inputs,
    dimensionsIn,
    edges,
    perimeterEdges,
    longest,
    second,
    shortest,
    fbaPerimeter,
    realWeightLb,
    volumeWeightLb,
    billableWeightLb,
    feeWeightLb,
    perimeter,
    segment,
    rate,
    priceTier,
    baseFee,
    continuationRate,
    continuationUnits,
    continuationFee,
    fbaFee
  };
}

function formatSegment(segment) {
  const labels = {
    smallStandard: "小号标准尺寸",
    largeStandard: "大号标准尺寸",
    smallOversize: "小号大件",
    largeOversize: "大号大件",
    oversize0to50: "超大件 · 0–50 lb",
    oversize50to70: "超大件 · 50–70 lb",
    oversize70to150: "超大件 · 70–150 lb",
    oversize150Plus: "超大件 · 150 lb以上",
    specialOversize: "特大号 · 0–150 lb"
  };
  return labels[segment] || segment;
}

function renderEmpty() {
  $("form-status").textContent = "";
  $("fba-fee").textContent = "$0.00";
  $("fba-rmb").textContent = "约 ¥0.00";
  $("fba-segment").textContent = "等待输入";
  $("fba-rate-number").textContent = "—";
  $("fba-price-tier").textContent = "—";
  $("perimeter-value").innerHTML = "0.0 <small>in</small>";
  $("perimeter-status").textContent = "等待输入";
  $("perimeter-status").className = "result-status status-neutral";
  $("perimeter-margin").textContent = "—";
  $("perimeter-fill").style.width = "0%";
  $("perimeter-fill").style.background = "var(--green)";
  ["metric-real-weight", "metric-volume-weight", "metric-billable-weight", "metric-shipping-weight"].forEach((id) => { $(id).textContent = "0.0 lb"; });
  $("metric-real-weight-secondary").textContent = "0.0 kg";
  ["detail-dimensions", "detail-sorted-edges", "detail-perimeter-formula", "detail-fba-perimeter", "detail-fee-formula"].forEach((id) => { $(id).textContent = "—"; });
  $("decision-note").className = "decision-note";
  $("decision-note").querySelector("p").textContent = "输入尺寸后，这里会告诉你距离 130 in 围长还剩多少空间。";
}

function calculate() {
  const result = getCanonicalCalculation();
  if (result.error) {
    renderEmpty();
    $("form-status").textContent = result.error;
    return;
  }
  $("form-status").textContent = "";
  const { inputs, dimensionsIn, edges, perimeterEdges, fbaPerimeter, realWeightLb, volumeWeightLb, billableWeightLb, feeWeightLb, perimeter, segment, rate, priceTier, baseFee, continuationRate, continuationUnits, fbaFee } = result;
  const withinLimit = perimeter <= PERIMETER_LIMIT;
  const margin = PERIMETER_LIMIT - perimeter;
  const marginText = withinLimit ? `余 ${fmt(margin, 1)} in` : `超 ${fmt(Math.abs(margin), 1)} in`;
  const dimsText = dimensionsIn.map((value) => fmt(value, 2)).join(" × ") + " in";
  const sortedText = `${edges.map((value) => fmt(value, 2)).join(" / ")} → ${perimeterEdges.join(" / ")} in`;
  const continuationLabel = rate.intervalLb < 1 ? " / 4 oz" : "";
  const feeFormula = `${fmtMoney(baseFee)} + ${continuationUnits} × ${fmtMoney(continuationRate)}${continuationLabel} = ${fmtMoney(fbaFee)}`;

  $("fba-fee").textContent = fmtMoney(fbaFee);
  $("fba-rmb").textContent = `约 ¥${fmt(fbaFee * RMB_PER_USD, 2)}`;
  $("fba-segment").textContent = formatSegment(segment);
  $("fba-rate-number").textContent = priceTier.label;
  $("fba-price-tier").textContent = "2026 FBA";
  $("perimeter-value").innerHTML = `${fmt(perimeter, 1)} <small>in</small>`;
  $("perimeter-status").textContent = withinLimit ? "130 in 以内" : "超出 130 in";
  $("perimeter-status").className = `result-status ${withinLimit ? "status-ok" : "status-warn"}`;
  $("perimeter-margin").textContent = marginText;
  $("perimeter-fill").style.width = `${Math.min(100, Math.max(0, perimeter / PERIMETER_LIMIT * 100))}%`;
  $("perimeter-fill").style.background = withinLimit ? "var(--green)" : "var(--red)";
  $("metric-real-weight").textContent = `${fmt(realWeightLb, 1)} lb`;
  $("metric-real-weight-secondary").textContent = `${fmt(inputs.weight, 2)} kg`;
  $("metric-volume-weight").textContent = `${fmt(volumeWeightLb, 1)} lb`;
  $("metric-billable-weight").textContent = `${fmt(billableWeightLb, 1)} lb`;
  $("metric-shipping-weight").textContent = `${fmt(feeWeightLb, feeWeightLb < 1 ? 3 : 2)} lb`;
  $("detail-dimensions").textContent = dimsText;
  $("detail-sorted-edges").textContent = sortedText;
  $("detail-perimeter-formula").textContent = `${perimeterEdges[0]} + 2 × (${perimeterEdges[1]} + ${perimeterEdges[2]}) = ${perimeter} in`;
  $("detail-fba-perimeter").textContent = `${fmt(fbaPerimeter, 2)} in（原始英寸）`;
  $("detail-fee-formula").textContent = feeFormula;

  const decisionNote = $("decision-note");
  const decisionText = decisionNote.querySelector("p");
  decisionNote.className = `decision-note${withinLimit && margin <= 5 ? " note-warning" : ""}`;
  if (!withinLimit) {
    const totalReductionIn = Math.abs(margin) / 2;
    decisionText.textContent = `已超出 ${fmt(Math.abs(margin), 1)} in；若最长边不变，另外两边合计至少再缩减 ${fmt(totalReductionIn, 1)} in。`;
  } else if (margin <= 5) {
    decisionText.textContent = `仅剩 ${fmt(margin, 1)} in 余量，建议保留实测误差和纸箱变形缓冲。`;
  } else {
    decisionText.textContent = `当前距离红线还有 ${fmt(margin, 1)} in，围长处于可控范围。`;
  }
}

function applyPreset(key) {
  const preset = presets[key];
  if (!preset) return;
  state.unit = "metric";
  writeCanonicalInputs(preset);
  $("sku").value = preset.sku;
  updateUnitLabels();
  calculate();
}

function resetForm() {
  state.unit = "metric";
  writeCanonicalInputs({ length: 217.5, width: 39, height: 19, weight: 33.5, price: 100 });
  $("sku").value = "";
  updateUnitLabels();
  calculate();
}

$("calculator-form").addEventListener("submit", (event) => {
  event.preventDefault();
  calculate();
});

document.querySelectorAll(".segment[data-unit]").forEach((button) => {
  button.addEventListener("click", () => setUnit(button.dataset.unit));
});

document.querySelectorAll("input").forEach((input) => {
  input.addEventListener("input", calculate);
});

document.querySelectorAll(".preset").forEach((button) => {
  button.addEventListener("click", () => applyPreset(button.dataset.preset));
});

$("reset-button").addEventListener("click", resetForm);

updateUnitLabels();
calculate();
