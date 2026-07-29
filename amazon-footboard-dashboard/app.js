(() => {
  const data = window.MARKET_DATA;
  const dashboardCurrent = {
    gmv10k: 8601.48,
    asinCount: 5001,
    averagePrice: 250.48,
    brandCount: 555,
  };
  const companyProducts = (window.JOYTUTUS_PRODUCTS || []).map((product) => ({
    ...product,
    price: product.currentPrice ?? product.marketPrice,
    gmv: product.marketGmv ?? null,
    gmv2026: product.gmv2026 ?? null,
    brand: product.brand || "JOYTUTUS",
    vehicle: product.vehicle || "Amazon 标题已核对",
    months: product.months ?? 0,
    latestMonth: product.latestMonth || "未入库",
    latestPrice: product.latestPrice ?? product.currentPrice,
    latestGmvUsd: product.latestGmvUsd ?? null,
  }));
  const featured = companyProducts.filter((product) => Number.isFinite(product.price));
  const vehicleCoverage = window.VEHICLE_COVERAGE || [];
  const plot = document.getElementById("market-plot");
  const canvas = document.getElementById("market-canvas");
  const ctx = canvas.getContext("2d");
  const bandLayer = document.getElementById("band-layer");
  const bubbleLayer = document.getElementById("bubble-layer");
  const tooltip = document.getElementById("chart-tooltip");
  const xMax = 500;
  const priceSegments = [
    { low: 0, high: 100, start: 0, end: 10 },
    { low: 100, high: 150, start: 10, end: 28 },
    { low: 150, high: 200, start: 28, end: 46 },
    { low: 200, high: 250, start: 46, end: 64 },
    { low: 250, high: 300, start: 64, end: 82 },
    { low: 300, high: 400, start: 82, end: 92 },
    { low: 400, high: 500, start: 92, end: 100 },
  ];
  const visiblePriceBands = data.bands.filter((band) => band.low < xMax);
  const maxMarketGmv = Math.max(...data.bands.map((band) => band.gmvMonthlyUsd));
  const maxBubbleGmv = Math.max(...data.points.map((point) => point[2]));
  const maxCompanyMonthlyGmv = Math.max(...featured.map((product) => product.gmv || 0), 1);
  const companyGmv2026Values = featured.map((product) => product.gmv2026).filter((gmv) => Number.isFinite(gmv) && gmv > 0);
  const minCompanyGmv2026 = companyGmv2026Values.length ? Math.min(...companyGmv2026Values) : 1;
  const maxCompanyGmv2026 = companyGmv2026Values.length ? Math.max(...companyGmv2026Values) : 1;
  const allPoints = [];
  const bubbleNodes = new Map();
  let plotWidth = 0;
  let plotHeight = 0;

  const colors = {
    muted: "#718096",
    line: "#d9d6cf",
    teal: "#147d83",
    coral: "#e07855",
  };

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
  }[char]));

  const formatNumber = (value, digits = 0) => new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value || 0);

  const formatMoney = (value) => {
    const amount = Number(value) || 0;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}K`;
    return `$${formatNumber(amount, 0)}`;
  };

  const formatMoneyFull = (value) => `$${formatNumber(Number(value) || 0, 0)}`;
  const priceAxisPercent = (price) => {
    const value = Math.min(Math.max(Number(price) || 0, 0), xMax);
    const segment = priceSegments.find((item) => value >= item.low && value <= item.high) || priceSegments[priceSegments.length - 1];
    const fraction = segment.high === segment.low ? 0 : (value - segment.low) / (segment.high - segment.low);
    return segment.start + fraction * (segment.end - segment.start);
  };
  const priceX = (price) => priceAxisPercent(price) / 100 * plotWidth;

  function renderMetrics() {
    document.getElementById("metric-ytd-gmv").textContent = `$${(dashboardCurrent.gmv10k / 100).toFixed(2)}M`;
    document.getElementById("metric-ytd-asin").textContent = formatNumber(dashboardCurrent.asinCount);
    document.getElementById("metric-avg-price").textContent = `$${formatNumber(dashboardCurrent.averagePrice, 2)}`;
    document.getElementById("metric-brand-count").textContent = formatNumber(dashboardCurrent.brandCount);
  }

  function renderBands() {
    const totalAsins = data.bands.reduce((sum, band) => sum + band.asinCount, 0);
    const totalGmv = data.bands.reduce((sum, band) => sum + band.gmvTotal10k, 0);
    document.getElementById("band-table-body").innerHTML = data.bands.map((band) => {
      const asinShare = band.asinCount / totalAsins * 100;
      const gmvShare = band.gmvTotal10k / totalGmv * 100;
      return `<tr>
        <td><strong>${escapeHtml(band.label)}</strong></td>
        <td>${formatNumber(band.asinCount)}</td>
        <td>${asinShare.toFixed(1)}%</td>
        <td>${formatMoney(band.gmvTotal10k * 10000)}</td>
        <td>${formatMoney(band.gmvMonthlyUsd)}</td>
        <td><div class="bar-track"><span style="width:${Math.max(gmvShare, 1)}%"></span></div><small>${gmvShare.toFixed(1)}%</small></td>
      </tr>`;
    }).join("");
  }

  const detailChartGroups = [
    { label: "Jeep Wrangler JK", years: "2007-2018", key: "Jeep Wrangler JK" },
    { label: "Jeep Wrangler JL", years: "2018-2026", key: "Jeep Wrangler JL" },
    { label: "Ram 1500 New Body", years: "2019-2026", key: "Ram 1500 New Body" },
    { label: "Ram 1500 Classic / Heavy Duty", years: "2009-2026", key: "Ram 1500 Classic / Heavy Duty" },
    { label: "Chevrolet Silverado / GMC Sierra", years: "2019-2026", key: "Chevrolet Silverado / GMC Sierra" },
    { label: "Jeep Gladiator JT", years: "2020-2026", key: "Jeep Gladiator JT" },
  ];
  const miniPriceMin = 150;
  const miniPriceMax = 300;
  const miniGmvMax = 25000;
  const miniPricePercent = (price) => Math.min(96, Math.max(4, (Number(price) - miniPriceMin) / (miniPriceMax - miniPriceMin) * 100));
  const miniGmvPercent = (gmv) => Math.min(92, Math.max(8, 100 - (Number(gmv) || 0) / miniGmvMax * 100));

  function renderDetailCharts() {
    const container = document.getElementById("detail-chart-grid");
    if (!container) return;
    container.innerHTML = detailChartGroups.map((group) => {
      const products = featured
        .filter((product) => product.detailGroup === group.key)
        .sort((a, b) => a.price - b.price);
      const bubbles = products.map((product) => {
        const size = Math.max(38, Math.min(76, bubbleSize(product.gmv2026) * 0.78));
        const image = product.image
          ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.asin)} Amazon 主图" loading="lazy" />`
          : `<span>${escapeHtml(product.asin.slice(-4))}</span>`;
        return `<button type="button" class="mini-bubble" data-mini-asin="${escapeHtml(product.asin)}" aria-label="${escapeHtml(product.asin)}，售价 $${formatNumber(product.price, 0)}，2026 总 GMV ${formatMoney(product.gmv2026)}" style="--bubble-left:${miniPricePercent(product.price)}%;--bubble-top:${miniGmvPercent(product.gmv)}%;--bubble-size:${size}px">${image}</button>`;
      }).join("");
      const legend = products.length
        ? products.map((product) => `<button type="button" class="mini-key" data-mini-asin="${escapeHtml(product.asin)}"><strong>${escapeHtml(product.asin)}</strong><span>$${formatNumber(product.price, 0)} · 月均 ${formatMoney(product.gmv)}</span></button>`).join("")
        : `<span class="mini-empty">暂无 Joytutus ASIN</span>`;
      return `<article class="detail-chart-card">
        <div class="detail-chart-heading"><div><h3>${escapeHtml(group.label)}</h3><span>${escapeHtml(group.years)} · ${products.length} ASIN</span></div><small>月均 GMV / 售价</small></div>
        <div class="mini-plot" role="img" aria-label="${escapeHtml(group.label)} 细分车型售价与月均 GMV 气泡图，气泡大小代表 2026 总 GMV">
          <span class="mini-y-tick mini-y-high">$20K</span><span class="mini-y-tick mini-y-mid">$10K</span><span class="mini-y-tick mini-y-low">$0</span>
          <span class="mini-gridline mini-gridline-high"></span><span class="mini-gridline mini-gridline-mid"></span><span class="mini-gridline mini-gridline-low"></span>
          ${bubbles}
          <span class="mini-x-tick mini-x-left">$150</span><span class="mini-x-tick mini-x-center">$225</span><span class="mini-x-tick mini-x-right">$300</span>
        </div>
        <div class="mini-chart-legend">${legend}</div>
      </article>`;
    }).join("");
    container.querySelectorAll("[data-mini-asin]").forEach((node) => {
      node.addEventListener("click", () => {
        const product = featured.find((item) => item.asin === node.dataset.miniAsin);
        if (product) selectProduct(product, true);
      });
    });
    container.querySelectorAll(".mini-bubble img").forEach((image) => {
      image.addEventListener("error", () => image.classList.add("image-missing"));
    });
  }

  const normalizeVehicle = (value) => String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  const matchesVehicle = (row, product) => {
    const productVehicle = normalizeVehicle(`${product.vehicle || ""} ${product.title || ""}`);
    return row.aliases.some((alias) => productVehicle.includes(normalizeVehicle(alias)));
  };
  const getVehicleMatches = (row) => row.aliases.length ? featured.filter((product) => matchesVehicle(row, product)) : [];
  const coverageRowKey = (vehicle) => normalizeVehicle(vehicle).replace(/\s+/g, "-");

  function renderCoverageDetails(row, matched) {
    if (!matched.length) return `<div class="coverage-detail-empty">暂无 Joytutus ASIN；${row.action ? `推进安排：${escapeHtml(row.action)}` : "暂无拆分信息"}</div>`;
    return `<div class="coverage-detail-table">
      <div class="coverage-detail-grid coverage-detail-head"><span>年份区间</span><span>型号</span><span>ASIN</span><span>Amazon 售价</span><span>2026 总 GMV</span><span>月均 GMV</span></div>
      ${matched.map((product) => `<div class="coverage-detail-grid coverage-detail-item">
        <span>${escapeHtml(product.yearRange || "标题未提取")}</span>
        <span>${escapeHtml(product.model || product.vehicle)}</span>
        <a class="coverage-detail-asin" href="${escapeHtml(product.link)}" target="_blank" rel="noreferrer">${escapeHtml(product.asin)}</a>
        <span>$${formatNumber(product.price, 0)}</span>
        <span>${formatMoney(product.gmv2026)}</span>
        <span>${formatMoney(product.gmv)}</span>
      </div>`).join("")}
    </div>`;
  }

  function renderCoverage() {
    const rows = vehicleCoverage.map((row) => {
      const matched = getVehicleMatches(row);
      const gmv2026 = matched.reduce((sum, product) => sum + (Number(product.gmv2026) || 0), 0);
      const marketSalesUsd = Number.isFinite(row.marketSalesWan) ? row.marketSalesWan * 10000 : null;
      const brandMarketShare = marketSalesUsd ? gmv2026 / marketSalesUsd : null;
      const status = row.aliases.length === 0 ? "长尾合计" : (matched.length ? "现有产品" : (row.action || "待推进"));
      const statusClass = row.aliases.length === 0 ? "is-tail" : (matched.length ? "is-covered" : "is-gap");
      const rowKey = coverageRowKey(row.vehicle);
      const asins = matched.length
        ? matched.map((product) => `<span class="coverage-asin">${escapeHtml(product.asin)}</span>`).join(" <span class=\"coverage-separator\">·</span> ")
        : `<span class="coverage-empty">${row.aliases.length ? "暂无 Joytutus ASIN" : "未拆分"}</span>`;
      const marketBarWidth = Math.max(2, row.marketShare / vehicleCoverage[0].marketShare * 100);
      const vehicleCell = row.aliases.length
        ? `<button type="button" class="coverage-toggle" data-coverage-toggle="${escapeHtml(rowKey)}" aria-expanded="false" aria-controls="coverage-detail-${escapeHtml(rowKey)}"><span class="coverage-chevron" aria-hidden="true">›</span><strong>${escapeHtml(row.vehicle)}</strong></button>`
        : `<strong>${escapeHtml(row.vehicle)}</strong>`;
      const detailRow = row.aliases.length ? `<tr id="coverage-detail-${escapeHtml(rowKey)}" class="coverage-detail-row ${statusClass}" data-coverage-detail="${escapeHtml(rowKey)}" hidden><td colspan="6">${renderCoverageDetails(row, matched)}</td></tr>` : "";
      return `<tr class="${statusClass}">
        <td>${vehicleCell}</td>
        <td><div class="coverage-share"><div class="coverage-share-track"><span style="width:${marketBarWidth}%"></span></div><small>${(row.marketShare * 100).toFixed(1)}%</small></div></td>
        <td><div class="coverage-asins">${asins}</div></td>
        <td>${gmv2026 ? formatMoney(gmv2026) : "—"}</td>
        <td class="coverage-brand-share">${brandMarketShare === null ? "—" : `${(brandMarketShare * 100).toFixed(2)}%`}</td>
        <td><span class="coverage-status">${status}</span></td>
      </tr>${detailRow}`;
    }).join("");
    document.getElementById("coverage-table-body").innerHTML = rows;
    document.querySelectorAll("[data-coverage-toggle]").forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const detail = document.getElementById(`coverage-detail-${toggle.dataset.coverageToggle}`);
        const expanded = toggle.getAttribute("aria-expanded") === "true";
        toggle.setAttribute("aria-expanded", String(!expanded));
        if (detail) detail.hidden = expanded;
        toggle.closest("tr")?.classList.toggle("is-expanded", !expanded);
      });
    });
  }

  function renderCoverageSummary() {
    const focusRows = vehicleCoverage.filter((row) => row.aliases.length);
    const coveredRows = focusRows.filter((row) => getVehicleMatches(row).length);
    const coveredShare = coveredRows.reduce((sum, row) => sum + row.marketShare, 0);
    const focusShare = focusRows.reduce((sum, row) => sum + row.marketShare, 0);
    const focusCoverageRate = focusShare ? coveredShare / focusShare : 0;
    const gaps = focusRows.filter((row) => !coveredRows.includes(row)).map((row) => row.vehicle);
    document.getElementById("coverage-summary").innerHTML = `重点 10 个车型中，Joytutus 现有产品对应 <strong>${coveredRows.length} 个</strong>，对应全市场销售额 <strong>${(coveredShare * 100).toFixed(1)}%</strong>，相当于前 10 重点车型市场的 <strong>${(focusCoverageRate * 100).toFixed(1)}%</strong>。按 Amazon 标题与车型字段双重匹配，多车型 ASIN 分别计入；<strong>Toyota Tacoma、Ford F-150、Ford Bronco</strong>：开发，待上市售卖；<strong>Chevrolet Colorado、Toyota Tundra</strong>：跟供应商联系，待立项。`;
  }

  function renderDecision() {
    const largestBand = data.bands.reduce((best, band) => band.gmvMonthlyUsd > best.gmvMonthlyUsd ? band : best, data.bands[0]);
    const densestBand = data.bands.reduce((best, band) => band.asinCount > best.asinCount ? band : best, data.bands[0]);
    const tracked = featured.filter((product) => product.gmv !== null);
    const pending = featured.filter((product) => product.gmv === null);
    const topTracked = tracked.reduce((best, product) => (product.gmv || 0) > (best?.gmv || 0) ? product : best, tracked[0]);
    document.getElementById("decision-copy").innerHTML = `
      <p class="decision-lead">当前最厚的市场带是 <strong>${escapeHtml(largestBand.label)}</strong>，月均大盘 GMV 约 <strong>${formatMoney(largestBand.gmvMonthlyUsd)}</strong>。</p>
      <div class="signal-row"><span class="signal-index">A</span><span>已核对的 Joytutus 层保留 <b>${tracked.length} 个有运营数据的 SKU</b>，其中 ${topTracked ? `<b>${escapeHtml(topTracked.asin)}</b> 的月均 GMV 最高，约 ${formatMoney(topTracked.gmv)}。` : "暂未匹配到运营数据。"}</span></div>
      <div class="signal-row"><span class="signal-index">B</span><span><b>${escapeHtml(densestBand.label)}</b> 的 ASIN 数最多，共 ${formatNumber(densestBand.asinCount)} 个，供给密度高，进入时需要明确车型或功能差异。</span></div>
      <div class="signal-row"><span class="signal-index">C</span><span>${pending.length ? `<b>${pending.map((product) => escapeHtml(product.asin)).join("、")}</b> 已确认 Amazon 标题与主图，但不在当前仪表板历史数据中，页面不虚构 GMV。` : "所有 Joytutus SKU 都已匹配到运营数据。"}</span></div>`;
  }

  function renderTrend() {
    const svg = document.getElementById("trend-chart");
    const width = 640;
    const height = 150;
    const pad = { top: 14, right: 10, bottom: 18, left: 8 };
    const values = data.trend.map((item) => item.gmv10k / 100);
    const maxValue = Math.max(...values);
    const x = (index) => pad.left + index / (values.length - 1) * (width - pad.left - pad.right);
    const y = (value) => height - pad.bottom - value / maxValue * (height - pad.top - pad.bottom);
    const path = values.map((value, index) => `${index ? "L" : "M"}${x(index).toFixed(1)},${y(value).toFixed(1)}`).join(" ");
    const area = `${path} L${x(values.length - 1)},${height - pad.bottom} L${x(0)},${height - pad.bottom} Z`;
    const guides = [0.25, 0.5, 0.75].map((fraction) => {
      const gy = y(maxValue * fraction);
      return `<line x1="${pad.left}" x2="${width - pad.right}" y1="${gy}" y2="${gy}" class="trend-guide" />`;
    }).join("");
    const lastIndex = values.length - 1;
    svg.innerHTML = `${guides}<path d="${area}" class="trend-area" /><path d="${path}" class="trend-line" /><circle cx="${x(lastIndex)}" cy="${y(values[lastIndex])}" r="4" class="trend-point" /><text x="${width - 8}" y="${Math.max(18, y(values[lastIndex]) - 10)}" text-anchor="end" class="trend-label">$${values[lastIndex].toFixed(1)}M</text>`;
  }

  function renderBandsOnPlot() {
    bandLayer.innerHTML = visiblePriceBands.map((band) => {
      const start = priceAxisPercent(band.low);
      const end = priceAxisPercent(band.high === null ? xMax : Math.min(band.high, xMax));
      const height = Math.max(7, band.gmvMonthlyUsd / maxMarketGmv * 100);
      return `<div class="band-column" style="left:${start}%;width:${Math.max(end - start, 2)}%;height:${height}%">
        <div class="band-label"><b>${escapeHtml(band.label)}</b><small>${formatMoney(band.gmvMonthlyUsd)} / month</small></div>
      </div>`;
    }).join("");
  }

  function renderProductScale() {
    const scaleMax = Math.max(5000, Math.ceil(maxCompanyMonthlyGmv / 5000) * 5000);
    const ticks = Array.from({ length: 6 }, (_, index) => scaleMax - index * scaleMax / 5);
    document.querySelector(".plot-scale").innerHTML = ticks.map((value) => `<span>${formatMoney(value)}</span>`).join("");
  }

  function renderPriceAxis() {
    const axis = document.getElementById("price-axis-ticks");
    if (!axis) return;
    const ticks = [0, 100, 150, 200, 250, 300, 400, 500];
    axis.innerHTML = ticks.map((value, index) => {
      const edgeClass = index === 0 ? " is-start" : (index === ticks.length - 1 ? " is-end" : "");
      return `<span class="x-axis-tick${edgeClass}" style="left:${priceAxisPercent(value)}%">$${value}</span>`;
    }).join("");
  }

  function drawMarketPoints() {
    const dpr = window.devicePixelRatio || 1;
    canvas.width = plotWidth * dpr;
    canvas.height = plotHeight * dpr;
    canvas.style.width = `${plotWidth}px`;
    canvas.style.height = `${plotHeight}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, plotWidth, plotHeight);
    ctx.strokeStyle = colors.line;
    ctx.lineWidth = 1;
    [0.25, 0.5, 0.75].forEach((fraction) => {
      const y = plotHeight * (1 - fraction);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(plotWidth, y);
      ctx.stroke();
    });
    allPoints.length = 0;
    data.points.forEach((point, index) => {
      const asin = point[0];
      const price = point[1];
      const gmv = point[2];
      const seed = Array.from(asin).reduce((sum, char) => sum + char.charCodeAt(0), 0) + index * 17;
      const vertical = Math.min(plotHeight * 0.34, Math.log1p(Math.max(gmv, 0)) / Math.log1p(maxBubbleGmv) * plotHeight * 0.34);
      const jitter = (seed % 19) - 9;
      const px = priceX(price);
      const py = Math.max(10, plotHeight - 16 - vertical + jitter);
      const radius = gmv > 0 ? 2.1 : 1.2;
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fillStyle = price >= 500 ? "rgba(224,120,85,.48)" : "rgba(20,125,131,.38)";
      ctx.fill();
      allPoints.push({ asin, price, gmv, x: px, y: py });
    });
  }

  function bubbleSize(gmv2026) {
    const responsiveScale = plotWidth < 520 ? 0.86 : 1;
    if (gmv2026 === null) return 36 * responsiveScale;
    const minDiameter = 42;
    const maxDiameter = 116;
    const denominator = Math.sqrt(maxCompanyGmv2026) - Math.sqrt(minCompanyGmv2026);
    const ratio = denominator > 0
      ? (Math.sqrt(Math.max(gmv2026, 0)) - Math.sqrt(minCompanyGmv2026)) / denominator
      : 0.5;
    return (minDiameter + Math.min(Math.max(ratio, 0), 1) * (maxDiameter - minDiameter)) * responsiveScale;
  }

  function overlaps(candidate, placed) {
    return placed.some((item) => {
      if (item.band !== candidate.band) return false;
      const dx = candidate.x - item.x;
      const dy = candidate.y - item.y;
      const minDistance = (candidate.size + item.size) / 2 + 8;
      return dx * dx + dy * dy < minDistance * minDistance;
    });
  }

  function priceBandFor(price) {
    return visiblePriceBands.find((band) => price >= band.low && (band.high === null || price < band.high)) || visiblePriceBands[visiblePriceBands.length - 1];
  }

  function renderBubbles() {
    bubbleLayer.innerHTML = "";
    bubbleNodes.clear();
    const placed = [];
    featured.forEach((product, index) => {
      const size = bubbleSize(product.gmv2026);
      const priceBand = priceBandFor(product.price);
       const bandLeft = priceAxisPercent(priceBand.low) / 100 * plotWidth;
       const bandRight = priceAxisPercent(priceBand.high === null ? xMax : priceBand.high) / 100 * plotWidth;
      const bandMinX = Math.max(size / 2 + 3, bandLeft + 4);
      const bandMaxX = Math.min(plotWidth - size / 2 - 3, bandRight - 4);
      const minX = Math.min(bandMinX, bandMaxX);
      const maxX = Math.max(bandMinX, bandMaxX);
      const baseX = Math.min(Math.max(priceX(product.price), minX), maxX);
      const baselineCenterY = plotHeight - 28;
      const vertical = product.gmv === null
        ? 0
        : Math.min(plotHeight * 0.76, Math.max(product.gmv, 0) / maxCompanyMonthlyGmv * plotHeight * 0.76);
      const targetY = baselineCenterY - vertical;
      let bestCandidate = { x: baseX, y: targetY, size, band: priceBand };
      let bestDistance = Number.POSITIVE_INFINITY;
      const horizontalOffsets = [
        0,
        ...Array.from({ length: 10 }, (_, offset) => (offset + 1) * size * 0.58),
        ...Array.from({ length: 10 }, (_, offset) => -(offset + 1) * size * 0.58),
      ];
      for (const offset of horizontalOffsets) {
        const candidateX = Math.min(
          Math.max(baseX + offset, minX),
          maxX,
        );
        const candidate = { x: candidateX, y: targetY, size, band: priceBand };
        const distance = Math.abs(candidateX - baseX);
        if (distance < bestDistance) {
          bestCandidate = candidate;
          bestDistance = distance;
        }
        if (!overlaps(candidate, placed)) {
          bestCandidate = candidate;
          break;
        }
      }
      placed.push(bestCandidate);
      const bubble = document.createElement("button");
      bubble.type = "button";
      bubble.className = `image-bubble${product.gmv === null ? " is-untracked" : ""}`;
      bubble.style.width = `${size}px`;
      bubble.style.height = `${size}px`;
      bubble.style.left = `${bestCandidate.x}px`;
      bubble.style.top = `${Math.max(5, bestCandidate.y - size / 2)}px`;
      const gmvText = product.gmv2026 === null ? "暂无 2026 GMV" : `2026 总 GMV ${formatMoney(product.gmv2026)}`;
      bubble.setAttribute("aria-label", `Joytutus ${product.asin}，价格 $${product.price.toFixed(0)}，${gmvText}`);
      bubble.innerHTML = product.image ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.asin)} 主图" loading="lazy" />` : `<span>${escapeHtml(product.asin.slice(-4))}</span>`;
      bubble.addEventListener("click", () => selectProduct(product, true));
      bubble.addEventListener("pointerenter", (event) => showTooltip(product, event.clientX, event.clientY));
      bubble.addEventListener("pointerleave", hideTooltip);
      const image = bubble.querySelector("img");
      if (image) image.addEventListener("error", () => image.classList.add("image-missing"));
      bubbleLayer.appendChild(bubble);
      bubbleNodes.set(product.asin, bubble);
      if (index === 0) bubble.classList.add("is-top");
    });
  }

  function showTooltip(product, clientX, clientY) {
    const price = Number(product.price) || 0;
    const gmv = product.gmv === null ? "暂无运营 GMV" : formatMoney(product.gmv);
    const brand = product.brand || "市场 ASIN";
    const vehicle = product.vehicle || "";
    const gmv2026 = product.gmv2026 === null ? "暂无" : formatMoney(product.gmv2026);
    tooltip.innerHTML = `<strong>${escapeHtml(product.asin)}</strong><span>$${formatNumber(price, 0)} · 2026 总 GMV <b>${escapeHtml(gmv2026)}</b></span><span>月均 GMV ${escapeHtml(gmv)} · ${escapeHtml(brand)} · ${escapeHtml(vehicle)}</span>`;
    tooltip.classList.add("is-visible");
    tooltip.setAttribute("aria-hidden", "false");
    const rect = plot.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    tooltip.style.left = `${Math.min(Math.max(localX + 14, 8), Math.max(8, plotWidth - 250))}px`;
    tooltip.style.top = `${Math.min(Math.max(localY - 76, 8), plotHeight - 84)}px`;
  }

  function hideTooltip() {
    tooltip.classList.remove("is-visible");
    tooltip.setAttribute("aria-hidden", "true");
  }

  function selectProduct(product, fromInteraction) {
    bubbleNodes.forEach((node, asin) => node.classList.toggle("is-selected", asin === product.asin));
    document.getElementById("detail-status").textContent = fromInteraction ? "已选择" : (product.gmv === null ? "待入库" : "Joytutus SKU");
    const price = Number(product.price) || 0;
    const gmvLabel = product.gmv === null ? "暂无" : formatMoneyFull(product.gmv);
    const gmv2026Label = product.gmv2026 === null ? "暂无" : formatMoneyFull(product.gmv2026);
    document.getElementById("chart-readout").textContent = `${product.asin} · $${formatNumber(price, 0)} · 2026 总 GMV ${gmv2026Label} · 月均 GMV ${gmvLabel}`;
    const imageBlock = product.image
      ? `<div class="product-image-wrap"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.asin)} 商品主图" onerror="this.classList.add('image-missing')" /></div>`
      : `<div class="product-image-wrap product-image-empty">暂无主图</div>`;
    const statusText = product.gmv === null ? "Amazon 标题已确认 · 运营数据待入库" : "Amazon 标题已确认 · 运营数据已匹配";
    document.getElementById("product-body").innerHTML = `
      <div class="product-main">${imageBlock}<div class="product-ident"><span class="product-rank">${statusText}</span><h3>${escapeHtml(product.asin)}</h3><p>${escapeHtml(product.brand)} · ${escapeHtml(product.vehicle)}</p><p class="product-title">${escapeHtml(product.title)}</p><a href="${escapeHtml(product.link)}" target="_blank" rel="noreferrer">在 Amazon 打开详情页 <span>→</span></a></div></div>
      <div class="product-stats"><div><span>Amazon 当前售价</span><strong>$${formatNumber(price, 0)}</strong></div><div><span>2026 总 GMV</span><strong>${gmv2026Label}</strong></div><div><span>月均 GMV</span><strong>${gmvLabel}</strong></div><div><span>活跃月份</span><strong>${product.gmv === null ? "待入库" : `${product.months} 个月`}</strong></div><div><span>最近月份</span><strong>${escapeHtml(product.latestMonth)}</strong></div></div>`;
  }

  function rerenderPlot() {
    plotWidth = plot.clientWidth;
    plotHeight = plot.clientHeight;
    renderBandsOnPlot();
    renderProductScale();
    renderPriceAxis();
    renderBubbles();
  }

  plot.addEventListener("pointermove", (event) => {
    if (event.target.closest(".image-bubble")) return;
    const rect = plot.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    let nearest = null;
    let distance = 12 * 12;
    allPoints.forEach((point) => {
      const dx = point.x - x;
      const dy = point.y - y;
      const next = dx * dx + dy * dy;
      if (next < distance) {
        distance = next;
        nearest = point;
      }
    });
    if (nearest) showTooltip(nearest, event.clientX, event.clientY);
    else hideTooltip();
  });
  plot.addEventListener("pointerleave", hideTooltip);

  const coverageSection = document.querySelector(".coverage-section");
  if (coverageSection) document.getElementById("top").appendChild(coverageSection);

  renderMetrics();
  renderBands();
  renderCoverage();
  renderCoverageSummary();
  renderDecision();
  renderTrend();
  rerenderPlot();
  renderDetailCharts();
  const initialProduct = featured.reduce((best, product) => (product.gmv || -1) > (best.gmv || -1) ? product : best, featured[0]);
  selectProduct(initialProduct, false);
  window.addEventListener("resize", () => {
    rerenderPlot();
    renderDetailCharts();
  });
})();
