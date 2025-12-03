// Admin console backed by the API (cases CRUD, uploads, analytics).

const API_BASE = "";
const MANAGE_PAGE_SIZE = 50;

let cases = [];
let editingId = null;
let managePage = 1;
let filterMode = "all";
let filterYear = new Date().getFullYear();
let filterMonth = new Date().getMonth() + 1;
let filterStart = null;
let filterEnd = null;
let filterTags = new Set();

function escapeHtml(text) {
  const s = String(text ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeSvgText(text) {
  const s = String(text ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function tagColor(tag) {
  const map = {
    自動化: "#34d399",
    ヘルプデスク: "#0ea5e9",
    Teams: "#2563eb",
    コスト最適化: "#f59e0b",
    PowerBI: "#a855f7",
    クラウド: "#22c55e",
    セキュリティ: "#f97316",
    UX: "#8b5cf6",
    "ID 管理": "#ef4444",
    運用改善: "#06b6d4",
    可観測性: "#eab308",
    開発効率: "#4f46e5",
    ナレッジ: "#10b981",
    監視: "#f43f5e",
    権限管理: "#fb7185",
    AI: "#0ea5e9",
  };
  return map[tag] || "#2563eb";
}

function generateFallbackImage(title = "New Case", primaryTag = "未設定") {
  const safe = escapeSvgText(title.slice(0, 28) || "Case");
  const base = tagColor(primaryTag);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500'><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='${base}'/><stop offset='100%' stop-color='#60a5fa'/></linearGradient></defs><rect width='800' height='500' rx='32' fill='url(#g)'/><text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Segoe UI' font-size='48' font-weight='700'>${safe}</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function normalizeCase(item = {}) {
  const tags =
    Array.isArray(item.tags) && item.tags.length ? item.tags.filter(Boolean) : ["未設定"];
  return {
    ...item,
    id: item.id,
    title: item.title || "",
    summary: item.summary || "",
    detail: item.detail || "",
    tags,
    owner: item.owner || "",
    impact: item.impact || "",
    date: item.date || "",
    likes: Number(item.likes) || 0,
    pv: Number(item.pv) || 0,
    comments: Array.isArray(item.comments) ? item.comments : [],
    image_url: item.image_url || "",
    pdf_url: item.pdf_url || "",
    pdf_name: item.pdf_name || "",
    deleted: Boolean(item.deleted),
  };
}

function normalizeCases(list) {
  return (Array.isArray(list) ? list : []).map(normalizeCase);
}

async function fetchJson(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || `Request failed (${res.status})`);
  }
  return res.json();
}

async function uploadFile(input) {
  if (!input || !input.files || !input.files[0]) return null;
  const fd = new FormData();
  fd.append("file", input.files[0]);
  const res = await fetch(API_BASE + "/api/upload", {
    method: "POST",
    body: fd,
  });
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || "Upload failed");
  }
  return res.json();
}

function activeCases() {
  return cases.filter((c) => !c.deleted);
}

function parseYearMonth(dateStr) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return { y: null, m: null };
  return { y: d.getFullYear(), m: d.getMonth() + 1 };
}

function parseDateSafe(str) {
  const t = Date.parse(str);
  return Number.isNaN(t) ? 0 : t;
}

function filterByPeriod(list) {
  if (filterMode === "all") return list;
  if (filterMode === "year") {
    return list.filter((c) => parseYearMonth(c.date).y === filterYear);
  }
  if (filterMode === "month") {
    return list.filter((c) => {
      const { y, m } = parseYearMonth(c.date);
      return y === filterYear && m === filterMonth;
    });
  }
  if (filterMode === "custom" && filterStart && filterEnd) {
    const start = new Date(filterStart).getTime();
    const end = new Date(filterEnd).getTime();
    return list.filter((c) => {
      const t = new Date(c.date).getTime();
      return !Number.isNaN(t) && t >= start && t <= end;
    });
  }
  return list;
}

async function refreshCases() {
  try {
    const data = await fetchJson("/api/cases");
    cases = normalizeCases(data.cases || data || []);
    renderAnalytics();
    renderManageList();
    renderFilterTags();
  } catch (err) {
    console.error("Failed to load cases", err);
  }
}

function renderMetricsGrid(target, stats) {
  if (!target) return;
  target.innerHTML = `
    <div class="metric-card"><div class="metric-label">件数</div><div class="metric-value">${stats.totalCases}</div></div>
    <div class="metric-card"><div class="metric-label">PV合計</div><div class="metric-value">${stats.totalPv}</div></div>
    <div class="metric-card"><div class="metric-label">いいね</div><div class="metric-value">${stats.totalLikes}</div></div>
    <div class="metric-card"><div class="metric-label">コメント</div><div class="metric-value">${stats.totalComments}</div></div>
  `;
}

function renderAnalytics() {
  const filtered = filterByPeriod(activeCases()).filter((c) => {
    if (!filterTags.size) return true;
    return c.tags.some((t) => filterTags.has(t));
  });
  const totalCases = filtered.length;
  const totalPv = filtered.reduce((sum, c) => sum + (c.pv || 0), 0);
  const totalLikes = filtered.reduce((sum, c) => sum + (c.likes || 0), 0);
  const totalComments = filtered.reduce((sum, c) => sum + (c.comments?.length || 0), 0);
  const metricsHost = document.getElementById("analytics-metrics");
  renderMetricsGrid(metricsHost, { totalCases, totalPv, totalLikes, totalComments });

  const tagAgg = {};
  filtered.forEach((c) => {
    const tags = c.tags.length ? c.tags : ["未設定"];
    tags.forEach((t) => {
      if (!tagAgg[t]) tagAgg[t] = { pv: 0, count: 0 };
      tagAgg[t].pv += c.pv || 0;
      tagAgg[t].count += 1;
    });
  });

  const pvCases = [...filtered].sort((a, b) => (b.pv || 0) - (a.pv || 0));
  const pvTags = Object.entries(tagAgg).sort((a, b) => b[1].pv - a[1].pv);

  const caseTable = document.getElementById("analytics-cases");
  if (caseTable) {
    caseTable.innerHTML =
      pvCases
        .map((c) => {
          const width = Math.min(100, (c.pv || 1) / (pvCases[0]?.pv || 1) * 100);
          return `<tr><td>${escapeHtml(c.title)}</td><td>${c.pv}</td><td><div class="bar"><span style="width:${width}%"></span></div></td></tr>`;
        })
        .join("") || "<tr><td colspan='3'>まだデータがありません</td></tr>";
  }

  const tagTable = document.getElementById("analytics-tags");
  if (tagTable) {
    tagTable.innerHTML =
      pvTags
        .map(([tag, v]) => {
          const width = Math.min(100, (v.pv || 1) / (pvTags[0]?.[1].pv || 1) * 100);
          return `<tr><td>${escapeHtml(tag)} (${v.count}件)</td><td>${v.pv}</td><td><div class="bar"><span style="width:${width}%"></span></div></td></tr>`;
        })
        .join("") || "<tr><td colspan='3'>まだデータがありません</td></tr>";
  }

  const likesTable = document.getElementById("analytics-likes");
  if (likesTable) {
    likesTable.innerHTML =
      pvCases
        .sort((a, b) => (b.likes || 0) - (a.likes || 0))
        .map((c) => `<tr><td>${escapeHtml(c.title)}</td><td>${c.likes}</td></tr>`)
        .join("") || "<tr><td colspan='2'>まだデータがありません</td></tr>";
  }

  const pie = document.getElementById("tag-pie");
  const legend = document.getElementById("tag-legend");
  if (pie && legend) {
    const topTags = pvTags.slice(0, 6);
    if (!topTags.length) {
      pie.style.background = "#f3f4f6";
      legend.innerHTML = "<div class='legend-item'>まだデータがありません</div>";
    } else {
      const total = topTags.reduce((s, [, v]) => s + (v.pv || 0), 0) || 1;
      let acc = 0;
      const segments = topTags.map(([tag, v]) => {
        const val = v.pv || 0;
        const start = (acc / total) * 100;
        acc += val;
        const end = (acc / total) * 100;
        const color = tagColor(tag);
        return { tag, start, end, color, pv: val, count: v.count };
      });
      const gradient = segments.map((s) => `${s.color} ${s.start}% ${s.end}%`).join(", ");
      pie.style.background = `conic-gradient(${gradient})`;
      legend.innerHTML =
        segments
          .map(
            (s) =>
              `<div class="legend-item"><span class="legend-dot" style="background:${s.color}"></span>${escapeHtml(
                s.tag
              )} (${s.count}件 / ${s.pv}PV)</div>`
          )
          .join("");
    }
  }

  const barHost = document.getElementById("case-bars");
  if (barHost) {
    const topCases = pvCases.slice(0, 8);
    const maxPv = topCases[0]?.pv || 1;
    barHost.innerHTML =
      topCases
        .map(
          (c) =>
            `<div class="bar-row"><span class="bar-label">${escapeHtml(
              c.title
            )}</span><div class="bar"><span style="width:${Math.min(
              100,
              (c.pv / maxPv) * 100
            )}%;"></span></div><span class="bar-value">${c.pv}</span></div>`
        )
        .join("") || "<div class='bar-row'>まだデータがありません</div>";
  }

  renderSidePanels(filtered);
}

function renderFilterTags() {
  const host = document.getElementById("filter-tags");
  if (!host) return;
  const uniqueTags = Array.from(
    new Set(activeCases().flatMap((c) => (Array.isArray(c.tags) ? c.tags : [])))
  ).filter(Boolean);
  host.innerHTML = uniqueTags
    .map(
      (t) =>
        `<button class="tag-chip ${filterTags.has(t) ? "selected" : ""}" data-value="${escapeHtml(
          t
        )}">${escapeHtml(t)}</button>`
    )
    .join("");
  host.querySelectorAll(".tag-chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const val = chip.dataset.value;
      if (filterTags.has(val)) {
        filterTags.delete(val);
      } else {
        filterTags.add(val);
      }
      renderFilterTags();
      renderAnalytics();
    });
  });
}

function renderTagChips() {
  const row = document.getElementById("tag-chip-row");
  if (!row) return;
  row.innerHTML = "";
  const presets = [
    "自動化",
    "コスト最適化",
    "セキュリティ",
    "UX",
    "運用改善",
    "可観測性",
    "開発効率",
    "ナレッジ",
    "監視",
    "権限管理",
    "AI",
    "ヘルプデスク",
  ];
  presets.forEach((name) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "tag-chip";
    chip.dataset.value = name;
    chip.textContent = name;
    chip.addEventListener("click", () => {
      chip.classList.toggle("selected");
    });
    row.appendChild(chip);
  });
}

function renderManageList() {
  const all = activeCases().sort((a, b) => parseDateSafe(b.date) - parseDateSafe(a.date));
  const totalPages = Math.max(1, Math.ceil(all.length / MANAGE_PAGE_SIZE));
  if (managePage > totalPages) managePage = totalPages;
  const start = (managePage - 1) * MANAGE_PAGE_SIZE;
  const list = all.slice(start, start + MANAGE_PAGE_SIZE);
  const host = document.getElementById("manage-list");
  if (!host) return;
  host.innerHTML =
    list
      .map(
        (c) => `
      <tr data-id="${c.id}">
        <td>
          <div class="manage-title">${escapeHtml(c.title)}</div>
          <div class="manage-meta">${escapeHtml(c.date)} / ${c.tags
            .map((t) => escapeHtml(t))
            .join(", ")}</div>
        </td>
        <td>${escapeHtml(c.owner)}</td>
        <td>${c.pv}</td>
        <td>${c.likes}</td>
        <td>${c.comments.length}</td>
        <td>
          <div class="manage-actions">
            <button class="btn small" data-action="edit" data-id="${c.id}">編集</button>
            <button class="btn small danger" data-action="delete" data-id="${c.id}">削除</button>
          </div>
        </td>
      </tr>
    `
      )
      .join("") || "<tr><td colspan='6'>まだ投稿がありません</td></tr>";

  renderManagePagination(totalPages);
}

function setManagePage(page) {
  const clamped = Math.max(1, page);
  if (clamped === managePage) return;
  managePage = clamped;
  renderManageList();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderManagePagination(totalPages) {
  const host = document.getElementById("manage-pagination");
  if (!host) return;
  if (totalPages <= 1) {
    host.innerHTML = "";
    host.style.display = "none";
    return;
  }
  host.style.display = "flex";
  host.innerHTML = "";

  const addBtn = (label, page, disabled = false, active = false) => {
    const btn = document.createElement("button");
    btn.className = "page-btn" + (active ? " active" : "");
    btn.textContent = label;
    btn.disabled = disabled;
    btn.addEventListener("click", () => setManagePage(page));
    host.appendChild(btn);
  };

  addBtn("前へ", Math.max(1, managePage - 1), managePage === 1);

  const windowSize = 5;
  let start = Math.max(1, managePage - 2);
  let end = Math.min(totalPages, start + windowSize - 1);
  if (end - start < windowSize - 1) start = Math.max(1, end - windowSize + 1);

  for (let p = start; p <= end; p += 1) {
    addBtn(String(p), p, false, p === managePage);
  }

  addBtn("次へ", Math.min(totalPages, managePage + 1), managePage === totalPages);
}

function renderManageComments(list) {
  const container = document.getElementById("admin-comment-list");
  if (!container) return;
  container.innerHTML = "";
  list.forEach((c) => {
    const div = document.createElement("div");
    div.className = "comment";
    const who = [c?.name || "匿名", c?.team].filter(Boolean).join(" / ");
    const dateText = c?.created_at
      ? new Date(c.created_at).toLocaleDateString("ja-JP")
      : new Date().toLocaleDateString("ja-JP");
    div.innerHTML = `
      <div class="comment-head">
        <span>${escapeHtml(who)}</span>
        <span>${escapeHtml(dateText)}</span>
      </div>
      <div class="comment-body">${escapeHtml(c?.text)}</div>
    `;
    container.appendChild(div);
  });
}

function openManageDetail(id) {
  const item = activeCases().find((c) => String(c.id) === String(id));
  if (!item) return;
  const tagsText = (item.tags && item.tags.length ? item.tags : ["未設定"]).join(" / ");
  const detailDrawer = document.getElementById("admin-detail-drawer");
  document.getElementById("admin-detail-title").textContent = item.title || "";
  document.getElementById("admin-detail-summary").textContent = item.summary || "";
  document.getElementById("admin-detail-body").textContent = item.detail || "";
  document.getElementById("admin-detail-owner").textContent = `担当: ${item.owner || "-"}`;
  document.getElementById("admin-detail-impact").textContent = `効果: ${item.impact || "-"}`;
  document.getElementById("admin-detail-date").textContent = `公開日: ${item.date || "-"}`;
  document.getElementById("admin-detail-pv").textContent = `PV: ${item.pv ?? "-"}`;
  document.getElementById("admin-detail-likes").textContent = `👍: ${item.likes ?? "-"}`;
  document.getElementById("admin-like-count").textContent = item.likes ?? 0;
  document.getElementById("admin-comment-count").textContent = item.comments?.length ?? 0;
  document.getElementById("admin-detail-tags").textContent = tagsText;
  const hero = document.getElementById("admin-detail-hero");
  if (hero)
    hero.style.backgroundImage = `url("${item.image_url || generateFallbackImage(item.title, item.tags?.[0])}")`;

  const pdfLink = document.getElementById("admin-detail-pdf");
  if (pdfLink) {
    if (item.pdf_url) {
      pdfLink.classList.remove("hidden");
      pdfLink.href = item.pdf_url;
      pdfLink.download = item.pdf_name || `${item.title || "attachment"}.pdf`;
      pdfLink.textContent = item.pdf_name ? `📄 ${item.pdf_name} を開く` : "📄 添付PDFを開く";
      pdfLink.target = "_blank";
      pdfLink.rel = "noopener";
    } else {
      pdfLink.classList.add("hidden");
      pdfLink.removeAttribute("href");
    }
  }

  renderManageComments(item.comments || []);

  if (detailDrawer) detailDrawer.classList.add("open");
  const overlay = document.getElementById("admin-drawer-overlay");
  if (overlay) overlay.classList.add("open");
}

function closeManageDetail() {
  const detailDrawer = document.getElementById("admin-detail-drawer");
  if (detailDrawer) detailDrawer.classList.remove("open");
  const overlay = document.getElementById("admin-drawer-overlay");
  if (overlay) overlay.classList.remove("open");
}

function renderSidePanels(casesList) {
  const totalHost = document.getElementById("side-totals");
  if (totalHost) {
    const likes = casesList.reduce((s, c) => s + (c.likes || 0), 0);
    const pv = casesList.reduce((s, c) => s + (c.pv || 0), 0);
    totalHost.innerHTML = `
      <div class="mini-card"><div class="label">件数</div><div class="value">${casesList.length}</div></div>
      <div class="mini-card"><div class="label">PV</div><div class="value">${pv}</div></div>
      <div class="mini-card"><div class="label">いいね</div><div class="value">${likes}</div></div>
    `;
  }

  const tagAgg = {};
  casesList.forEach((c) => {
    (c.tags || ["未設定"]).forEach((t) => {
      if (!tagAgg[t]) tagAgg[t] = { pv: 0, count: 0 };
      tagAgg[t].pv += c.pv || 0;
      tagAgg[t].count += 1;
    });
  });
  const topTags = Object.entries(tagAgg)
    .sort((a, b) => b[1].pv - a[1].pv)
    .slice(0, 6);
  const topTagsHost = document.getElementById("side-top-tags");
  if (topTagsHost) {
    topTagsHost.innerHTML =
      topTags
        .map(
          ([tag, v]) =>
            `<div class="side-item"><div class="title">${escapeHtml(
              tag
            )}</div><div class="meta">${v.count}件 / ${v.pv}PV</div></div>`
        )
        .join("") || "<div class='side-item'>データなし</div>";
  }

  const latestHost = document.getElementById("side-latest");
  if (latestHost) {
    const latest = [...casesList].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
    latestHost.innerHTML =
      latest
        .map(
          (c) =>
            `<div class="side-item"><div class="title">${escapeHtml(
              c.title
            )}</div><div class="meta">${escapeHtml(c.date)} / ${c.tags
              .map((t) => escapeHtml(t))
              .join(", ")}</div></div>`
        )
        .join("") || "<div class='side-item'>データなし</div>";
  }
}

function populatePeriodInputs() {
  const yearSel = document.getElementById("period-year");
  const monthSel = document.getElementById("period-month");
  if (yearSel) {
    const currentYear = new Date().getFullYear();
    yearSel.innerHTML = Array.from({ length: 5 }, (_, i) => currentYear - i)
      .map((y) => `<option value="${y}" ${y === filterYear ? "selected" : ""}>${y}年</option>`)
      .join("");
  }
  if (monthSel) {
    monthSel.innerHTML = Array.from({ length: 12 }, (_, i) => i + 1)
      .map(
        (m) => `<option value="${m}" ${m === filterMonth ? "selected" : ""}>${m}月</option>`
      )
      .join("");
  }
}

async function handleSubmit(e) {
  e.preventDefault();
  const title = document.getElementById("title").value.trim();
  const owner = document.getElementById("owner").value.trim() || "IT サービスチーム";
  const impact = document.getElementById("impact").value.trim() || "効果未設定";
  const date =
    document.getElementById("date").value || new Date().toISOString().slice(0, 10);
  const summary = document.getElementById("summary").value.trim();
  const detail = document.getElementById("detail").value.trim();
  const selectedTags = Array.from(document.querySelectorAll(".tag-chip.selected")).map(
    (c) => c.dataset.value
  );
  const extraTags = document
    .getElementById("tags-extra")
    .value.split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const tags = [...selectedTags, ...extraTags];

  if (!title || !summary || !detail) return;

  const existing = cases.find((c) => String(c.id) === String(editingId));
  let imageUrl = existing?.image_url || "";
  let pdfUrl = existing?.pdf_url || "";
  let pdfName = existing?.pdf_name || "";

  try {
    const imgUpload = await uploadFile(document.getElementById("image-file"));
    if (imgUpload?.url) imageUrl = imgUpload.url;
  } catch (err) {
    console.error("Image upload failed", err);
  }
  try {
    const pdfUpload = await uploadFile(document.getElementById("pdf-file"));
    if (pdfUpload?.url) {
      pdfUrl = pdfUpload.url;
      pdfName = pdfUpload.name || "";
    }
  } catch (err) {
    console.error("PDF upload failed", err);
  }

  const payload = {
    title,
    summary,
    detail,
    tags: tags.length ? tags : ["未設定"],
    owner,
    impact,
    date,
    image_url: imageUrl || generateFallbackImage(title, tags[0]),
    pdf_url: pdfUrl || "",
    pdf_name: pdfName || "",
  };

  const status = document.getElementById("form-status");

  try {
    if (editingId) {
      const res = await fetchJson(`/api/cases/${editingId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      if (res.case) cases = normalizeCases([res.case, ...cases.filter((c) => c.id !== res.case.id)]);
      if (status) status.textContent = "更新しました";
    } else {
      const res = await fetchJson("/api/cases", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      if (res.case) cases = normalizeCases([res.case, ...cases]);
      if (status) status.textContent = "保存しました";
    }
    editingId = null;
    e.target.reset();
    document.querySelectorAll(".tag-chip.selected").forEach((chip) => chip.classList.remove("selected"));
    renderAnalytics();
    renderManageList();
    renderFilterTags();
    switchTab("manage");
  } catch (err) {
    console.error("Failed to save case", err);
    if (status) status.textContent = "保存に失敗しました";
  }
}

function handleManageClick(e) {
  const btn = e.target.closest("button[data-action]");
  if (!btn) {
    const row = e.target.closest("tr[data-id]");
    if (row) {
      openManageDetail(row.dataset.id);
    }
    return;
  }
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  if (action === "delete") {
    if (!window.confirm("この投稿を非表示（論理削除）にしますか？")) return;
    fetchJson(`/api/cases/${id}`, { method: "DELETE" })
      .then(() => refreshCases())
      .catch((err) => console.error("Delete failed", err));
    return;
  }
  if (action === "edit") {
    const item = activeCases().find((c) => String(c.id) === String(id));
    if (!item) return;
    editingId = item.id;
    document.getElementById("title").value = item.title || "";
    document.getElementById("owner").value = item.owner || "";
    document.getElementById("impact").value = item.impact || "";
    document.getElementById("date").value = item.date || "";
    document.getElementById("summary").value = item.summary || "";
    document.getElementById("detail").value = item.detail || "";
    document.getElementById("tags-extra").value = "";
    document.querySelectorAll(".tag-chip").forEach((chip) => {
      chip.classList.toggle("selected", item.tags?.includes(chip.dataset.value));
    });
    const status = document.getElementById("form-status");
    if (status) status.textContent = "編集モードで開きました。保存してください。";
    switchTab("post");
  }
}

function switchTab(tab) {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.tab === tab);
  });
  document.querySelectorAll(".admin-section").forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.tab !== tab);
  });
}

function bindEvents() {
  const form = document.getElementById("admin-form");
  if (form) form.addEventListener("submit", (e) => handleSubmit(e));

  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });

  const manageTable = document.getElementById("manage-list");
  if (manageTable) manageTable.addEventListener("click", handleManageClick);

  const overlay = document.getElementById("admin-drawer-overlay");
  const closeBtn = document.getElementById("admin-drawer-close");
  if (overlay) overlay.addEventListener("click", closeManageDetail);
  if (closeBtn) closeBtn.addEventListener("click", closeManageDetail);

  const periodMode = document.getElementById("period-mode");
  const yearSel = document.getElementById("period-year");
  const monthSel = document.getElementById("period-month");
  const startInput = document.getElementById("period-start");
  const endInput = document.getElementById("period-end");
  if (periodMode) periodMode.addEventListener("change", () => { filterMode = periodMode.value; renderAnalytics(); });
  if (yearSel) yearSel.addEventListener("change", () => { filterYear = Number(yearSel.value); renderAnalytics(); });
  if (monthSel) monthSel.addEventListener("change", () => { filterMonth = Number(monthSel.value); renderAnalytics(); });
  if (startInput) startInput.addEventListener("change", () => { filterStart = startInput.value; renderAnalytics(); });
  if (endInput) endInput.addEventListener("change", () => { filterEnd = endInput.value; renderAnalytics(); });

  const manageContainer = document.getElementById("manage-list");
  if (manageContainer) {
    manageContainer.addEventListener("click", handleManageClick);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  populatePeriodInputs();
  renderTagChips();
  bindEvents();
  refreshCases();
});
