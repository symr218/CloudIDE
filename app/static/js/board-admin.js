// Admin screen: post form with image/PDF upload, edit/delete, and analytics.

const STORAGE_KEY = "customCases";
const TAG_PRESETS = [
  "自動化",
  "コスト最適化",
  "セキュリティ",
  "UX",
  "運用改善",
  "分析",
  "開発効率",
  "ナレッジ",
  "監視",
  "権限管理",
  "AI",
  "ヘルプデスク",
];

let editingId = null;

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
    分析: "#eab308",
    開発効率: "#4f46e5",
    ナレッジ: "#10b981",
    監視: "#f43f5e",
    権限管理: "#fb7185",
    AI: "#0ea5e9",
  };
  return map[tag] || "#2563eb";
}

function generateFallbackImage(title = "New Case", primaryTag = "未分類") {
  const safe = escapeSvgText(title.slice(0, 28) || "Case");
  const base = tagColor(primaryTag);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500'><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='${base}'/><stop offset='100%' stop-color='#60a5fa'/></linearGradient></defs><rect width='800' height='500' rx='32' fill='url(#g)'/><text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Segoe UI' font-size='48' font-weight='700'>${safe}</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadCustomCases() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCustomCases(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function normalizeCases(list) {
  return list.map((item) => {
    const tags =
      Array.isArray(item.tags) && item.tags.length ? item.tags.filter(Boolean) : ["未分類"];
    return {
      ...item,
      tags,
      likes: Number(item.likes) || 0,
      pv: Number(item.pv) || 0,
      comments: Array.isArray(item.comments) ? item.comments : [],
      deleted: Boolean(item.deleted),
    };
  });
}

async function handleSubmit(e) {
  e.preventDefault();

  const title = document.getElementById("title").value.trim();
  const owner = document.getElementById("owner").value.trim() || "IT サービスデスク";
  const impact = document.getElementById("impact").value.trim() || "効果 未設定";
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

  const imgFile = document.getElementById("image-file").files[0];
  let imageData = null;
  if (imgFile) {
    try {
      imageData = await readFileAsDataURL(imgFile);
    } catch {
      imageData = null;
    }
  }

  const pdfInput = document.getElementById("pdf-file");
  let pdfData = null;
  let pdfName = "";
  if (pdfInput && pdfInput.files[0]) {
    try {
      pdfData = await readFileAsDataURL(pdfInput.files[0]);
      pdfName = pdfInput.files[0].name || "attachment.pdf";
    } catch {
      pdfData = null;
    }
  }

  const list = loadCustomCases();

  if (editingId) {
    const idx = list.findIndex((c) => String(c.id) === String(editingId));
    if (idx !== -1) {
      list[idx] = {
        ...list[idx],
        title,
        summary,
        detail,
        tags: tags.length ? tags : ["未分類"],
        owner,
        impact,
        date,
        image: imageData || list[idx].image || generateFallbackImage(title, tags[0] || "未分類"),
        pdfData: pdfData !== null ? pdfData : list[idx].pdfData,
        pdfName: pdfData !== null ? pdfName : list[idx].pdfName,
      };
    }
  } else {
    const newCase = {
      id: Date.now().toString(),
      title,
      summary,
      detail,
      tags: tags.length ? tags : ["未分類"],
      owner,
      impact,
      date,
      likes: 0,
      pv: Math.floor(Math.random() * 300) + 120, // mock PV
      comments: [],
      image: imageData || generateFallbackImage(title, tags[0] || "未分類"),
      pdfData,
      pdfName,
    };
    list.unshift(newCase);
  }

  saveCustomCases(list);
  renderAnalytics();
  renderManageList();

  const status = document.getElementById("form-status");
  if (status) {
    status.textContent = editingId ? "更新しました。管理一覧に反映しました。" : "保存しました。管理一覧に反映しました。";
    status.classList.add("success");
  }
  e.target.reset();
  document.querySelectorAll(".tag-chip.selected").forEach((chip) => chip.classList.remove("selected"));
  editingId = null;
  switchTab("manage"); // 投稿完了後に管理タブへ
}

function renderAnalytics() {
  const cases = normalizeCases(loadCustomCases()).filter((c) => !c.deleted);
  const totalCases = cases.length;
  const totalPv = cases.reduce((sum, c) => sum + (c.pv || 0), 0);
  const totalLikes = cases.reduce((sum, c) => sum + (c.likes || 0), 0);

  const tagAgg = {};
  cases.forEach((c) => {
    const tags = c.tags.length ? c.tags : ["未分類"];
    tags.forEach((t) => {
      if (!tagAgg[t]) tagAgg[t] = { pv: 0, count: 0 };
      tagAgg[t].pv += c.pv || 0;
      tagAgg[t].count += 1;
    });
  });

  const pvCases = [...cases].sort((a, b) => (b.pv || 0) - (a.pv || 0));
  const pvTags = Object.entries(tagAgg).sort((a, b) => b[1].pv - a[1].pv);

  const metricEl = document.getElementById("analytics-metrics");
  if (metricEl) {
    metricEl.innerHTML = `
      <div class="metric-card">
        <div class="metric-title">総PV</div>
        <div class="metric-value">${totalPv}</div>
        <div class="metric-sub">記事数 ${totalCases}</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">総いいね</div>
        <div class="metric-value">${totalLikes}</div>
        <div class="metric-sub">平均いいね ${(totalCases ? (totalLikes / totalCases).toFixed(1) : 0)}</div>
      </div>
      <div class="metric-card">
        <div class="metric-title">タグ数</div>
        <div class="metric-value">${pvTags.length}</div>
        <div class="metric-sub">タグ別集計</div>
      </div>
    `;
  }

  const caseTable = document.getElementById("analytics-cases");
  if (caseTable) {
    caseTable.innerHTML =
      pvCases
        .map((c) => {
          const width = Math.min(100, (c.pv || 1) / (pvCases[0]?.pv || 1) * 100);
          return `<tr><td>${c.title}</td><td>${c.pv}</td><td><div class="bar"><span style="width:${width}%"></span></div></td></tr>`;
        })
        .join("") || "<tr><td colspan='3'>まだデータがありません</td></tr>";
  }

  const tagTable = document.getElementById("analytics-tags");
  if (tagTable) {
    tagTable.innerHTML =
      pvTags
        .map(([tag, v]) => {
          const width = Math.min(100, (v.pv || 1) / (pvTags[0]?.[1].pv || 1) * 100);
          return `<tr><td>${tag} (${v.count}件)</td><td>${v.pv}</td><td><div class="bar"><span style="width:${width}%"></span></div></td></tr>`;
        })
        .join("") || "<tr><td colspan='3'>まだデータがありません</td></tr>";
  }

  const likesTable = document.getElementById("analytics-likes");
  if (likesTable) {
    likesTable.innerHTML =
      pvCases
        .sort((a, b) => (b.likes || 0) - (a.likes || 0))
        .map((c) => `<tr><td>${c.title}</td><td>${c.likes}</td></tr>`)
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
              `<div class="legend-item"><span class="legend-dot" style="background:${s.color}"></span>${s.tag} (${s.count}件 / ${s.pv}PV)</div>`
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
            `<div class="bar-row"><span class="bar-label">${c.title}</span><div class="bar"><span style="width:${Math.min(
              100,
              (c.pv / maxPv) * 100
            )}%;"></span></div><span class="bar-value">${c.pv}</span></div>`
        )
        .join("") || "<div class='bar-row'>まだデータがありません</div>";
  }
}

function renderTagChips() {
  const row = document.getElementById("tag-chip-row");
  if (!row) return;
  row.innerHTML = "";
  TAG_PRESETS.forEach((name) => {
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
  const list = normalizeCases(loadCustomCases()).filter((c) => !c.deleted);
  const host = document.getElementById("manage-list");
  if (!host) return;
  host.innerHTML =
    list
      .map(
        (c) => `
      <tr>
        <td>
          <div class="manage-title">${c.title}</div>
          <div class="manage-meta">${c.date} / ${c.tags.join(", ")}</div>
        </td>
        <td>${c.owner}</td>
        <td>${c.pv}</td>
        <td>${c.likes}</td>
        <td>
          <div class="manage-actions">
            <button class="btn small" data-action="edit" data-id="${c.id}">編集</button>
            <button class="btn small danger" data-action="delete" data-id="${c.id}">削除</button>
          </div>
        </td>
      </tr>
    `
      )
      .join("") || "<tr><td colspan='5'>まだ投稿がありません</td></tr>";
}

function handleManageClick(e) {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const id = btn.dataset.id;
  const action = btn.dataset.action;
  if (action === "delete") {
    if (!window.confirm("この投稿を非表示（論理削除）にしますか？")) return;
    const list = loadCustomCases();
    const idx = list.findIndex((c) => String(c.id) === String(id));
    if (idx !== -1) {
      list[idx].deleted = true;
      saveCustomCases(list);
    }
    renderAnalytics();
    renderManageList();
    return;
  }
  if (action === "edit") {
    const item = loadCustomCases().find((c) => String(c.id) === String(id));
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
    switchTab("post");
    const status = document.getElementById("form-status");
    if (status) status.textContent = "編集モードで開きました。変更後に保存してください。";
  }
}

function switchTab(tab) {
  document.querySelectorAll(".tab-btn").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === tab);
  });
  document.querySelectorAll(".admin-section").forEach((sec) => {
    sec.classList.toggle("hidden", sec.dataset.tab !== tab);
  });
  const layout = document.querySelector(".admin-layout");
  if (layout) {
    layout.classList.toggle("two-col", tab === "ops");
  }
  if (tab === "ops") renderAnalytics();
  if (tab === "manage") renderManageList();
  if (tab === "post") {
    const status = document.getElementById("form-status");
    if (status) status.textContent = "";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("admin-form");
  if (form) form.addEventListener("submit", handleSubmit);
  renderTagChips();
  renderAnalytics();
  renderManageList();
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => switchTab(btn.dataset.tab));
  });
  const manageTable = document.getElementById("manage-table");
  if (manageTable) {
    manageTable.addEventListener("click", handleManageClick);
  }
  switchTab("ops"); // 初期表示は分析パネル
});
