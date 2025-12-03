// Simple DB viewer: fetch cases via API and render table + details.

const API_BASE = "";
let cases = [];
let includeDeleted = false;

function escapeHtml(text) {
  const s = String(text ?? "");
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function fetchJson(path) {
  const res = await fetch(API_BASE + path);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function renderTable() {
  const tbody = document.querySelector("#case-table tbody");
  if (!tbody) return;
  const filtered = includeDeleted ? cases : cases.filter((c) => !c.deleted);
  tbody.innerHTML =
    filtered
      .map(
        (c) => `
      <tr data-id="${c.id}">
        <td>${c.id}</td>
        <td>${escapeHtml(c.title)}</td>
        <td>${(c.tags || []).map(escapeHtml).join(", ")}</td>
        <td>${c.pv}</td>
        <td>${c.likes}</td>
        <td>${c.comments?.length || 0}</td>
        <td>${escapeHtml(c.date)}</td>
        <td>${c.deleted ? "削除" : ""}</td>
      </tr>
    `
      )
      .join("") || "<tr><td colspan='8'>データなし</td></tr>";
}

function renderDetail(id) {
  const item = cases.find((c) => String(c.id) === String(id));
  const panel = document.getElementById("detail-panel");
  if (!panel || !item) return;
  panel.hidden = false;
  document.getElementById("detail-title").textContent = `${item.title || ""} (ID: ${item.id})`;
  document.getElementById("detail-tags").innerHTML =
    (item.tags || []).map((t) => `<span class="pill">${escapeHtml(t)}</span>`).join("") ||
    `<span class="pill">未設定</span>`;
  document.getElementById("detail-meta").textContent = `PV: ${item.pv} / いいね: ${item.likes} / 日付: ${item.date || "-"} / 削除: ${item.deleted ? "true" : "false"}`;
  document.getElementById("detail-summary").textContent = item.summary || "";
  document.getElementById("detail-detail").textContent = item.detail || "";
  document.getElementById("detail-raw").textContent = JSON.stringify(item, null, 2);

  const commentsHost = document.getElementById("detail-comments");
  if (commentsHost) {
    commentsHost.innerHTML =
      (item.comments || [])
        .map(
          (c) => `
        <div class="comment-box">
          <div class="comment-head"><span>${escapeHtml(c.name || "匿名")} / ${escapeHtml(
            c.team || "-"
          )}</span><span>${c.created_at ? new Date(c.created_at).toLocaleDateString("ja-JP") : ""}</span></div>
          <div>${escapeHtml(c.text || "")}</div>
        </div>`
        )
      .join("") || `<div class="muted">コメントなし</div>`;
  }
}

async function loadCases() {
  try {
    const data = await fetchJson("/api/cases");
    cases = (data.cases || []).map((c) => ({
      ...c,
      tags: Array.isArray(c.tags) ? c.tags : [],
      comments: Array.isArray(c.comments) ? c.comments : [],
      likes: Number(c.likes) || 0,
      pv: Number(c.pv) || 0,
      deleted: Boolean(c.deleted),
    }));
    renderTable();
  } catch (err) {
    alert("読み込みに失敗しました: " + err.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadCases();
  const reload = document.getElementById("reload-btn");
  if (reload) reload.addEventListener("click", loadCases);
  const toggleDeleted = document.getElementById("toggle-deleted");
  if (toggleDeleted) {
    toggleDeleted.addEventListener("change", (e) => {
      includeDeleted = e.target.checked;
      renderTable();
    });
  }
  const tbody = document.querySelector("#case-table tbody");
  if (tbody) {
    tbody.addEventListener("click", (e) => {
      const tr = e.target.closest("tr[data-id]");
      if (tr) renderDetail(tr.dataset.id);
    });
  }
});
