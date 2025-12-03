// Static bulletin board backed by the API (cases, likes, comments, PV).

const API_BASE = "";
const LIKED_KEY = "likedCaseIds";

let customCases = [];
let currentId = null;
let searchTerm = "";
let currentPage = 1;
const PAGE_SIZE = 50;

function escapeHtml(text) {
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

async function refreshCases() {
  const data = await fetchJson("/api/cases");
  customCases = normalizeCases(data.cases || data || []);
  renderCards();
}

function replaceCase(updated) {
  const normalized = normalizeCase(updated);
  const idx = customCases.findIndex((c) => String(c.id) === String(normalized.id));
  if (idx === -1) {
    customCases.unshift(normalized);
  } else {
    customCases[idx] = normalized;
  }
}

function loadLikedSet() {
  try {
    return new Set(JSON.parse(localStorage.getItem(LIKED_KEY) || "[]"));
  } catch {
    return new Set();
  }
}

function saveLikedSet(set) {
  localStorage.setItem(LIKED_KEY, JSON.stringify(Array.from(set)));
}

function parseDate(str) {
  const t = Date.parse(str);
  return Number.isNaN(t) ? 0 : t;
}

function getAllCases() {
  return [...customCases]
    .filter((c) => !c.deleted)
    .sort(
      (a, b) => parseDate(b.date) - parseDate(a.date) || (b.pv || 0) - (a.pv || 0)
    );
}

function renderPagination(container, totalPages) {
  if (!container) return;
  if (totalPages <= 1) {
    container.innerHTML = "";
    container.style.display = "none";
    return;
  }
  container.style.display = "flex";
  container.innerHTML = "";

  const addBtn = (label, page, disabled = false, active = false) => {
    const btn = document.createElement("button");
    btn.className = "page-btn" + (active ? " active" : "");
    btn.textContent = label;
    btn.disabled = disabled;
    btn.addEventListener("click", () => setPage(page));
    container.appendChild(btn);
  };

  addBtn("前へ", Math.max(1, currentPage - 1), currentPage === 1);

  const windowSize = 5;
  let start = Math.max(1, currentPage - 2);
  let end = Math.min(totalPages, start + windowSize - 1);
  if (end - start < windowSize - 1) start = Math.max(1, end - windowSize + 1);

  for (let p = start; p <= end; p += 1) {
    addBtn(String(p), p, false, p === currentPage);
  }

  addBtn("次へ", Math.min(totalPages, currentPage + 1), currentPage === totalPages);
}

function renderCards() {
  const list = document.getElementById("case-list");
  const pager = document.getElementById("list-pagination");
  const liked = loadLikedSet();
  if (!list) return;
  list.innerHTML = "";

  const filtered = getAllCases().filter((item) => {
    if (!searchTerm) return true;
    const haystack = [
      item.title,
      item.summary,
      item.detail,
      item.tags.join(" "),
      item.owner,
      item.impact,
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(searchTerm.toLowerCase());
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (currentPage > totalPages) currentPage = totalPages;
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(start, start + PAGE_SIZE);

  pageItems.forEach((item) => {
    const tags = item.tags;
    const isLiked = liked.has(String(item.id));
    const primaryTag = tags[0] || "未設定";
    const tagCol = tagColor(primaryTag);
    const card = document.createElement("article");
    card.className = "case-card" + (isLiked ? " liked" : "");
    card.dataset.id = item.id;
    card.style.setProperty("--tag-color", tagCol);
    card.innerHTML = `
      <div class="color-bar"></div>
      <div class="thumb">
        <div class="tag-row">
          ${tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}
        </div>
      </div>
      <div class="card-body">
        <div class="card-title">${escapeHtml(item.title)}</div>
        <div class="card-summary">${escapeHtml(item.summary)}</div>
        <div class="card-meta">
          <span class="pill">担当: ${escapeHtml(item.owner)}</span>
          <span class="pill">効果: ${escapeHtml(item.impact)}</span>
        </div>
        <div class="card-actions">
          <button class="btn like-btn${isLiked ? " liked" : ""}" data-id="${item.id}">
            👍 ${isLiked ? "グッド済み" : "グッド"} <span class="like-num">${item.likes}</span>
          </button>
          <span class="stat">💬 ${item.comments.length}</span>
        </div>
      </div>
    `;
    const thumb = card.querySelector(".thumb");
    if (thumb) {
      const bg = item.image_url || "";
      if (bg) thumb.style.backgroundImage = `url("${bg}")`;
      thumb.style.backgroundColor = tagCol;
    }
    list.appendChild(card);
  });

  renderPagination(pager, totalPages);
}

function setPage(page) {
  const clamped = Math.max(1, page);
  if (clamped === currentPage) return;
  currentPage = clamped;
  renderCards();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function openDetail(id) {
  const item = getAllCases().find((c) => String(c.id) === String(id));
  if (!item) return;
  currentId = String(id);

  try {
    const res = await fetchJson(`/api/cases/${id}/view`, { method: "POST" });
    if (res.case) {
      replaceCase(res.case);
    }
  } catch (err) {
    console.error("Failed to record view", err);
  }

  const caseData = getAllCases().find((c) => String(c.id) === String(id)) || item;

  document.getElementById("detail-title").textContent = caseData.title;
  document.getElementById("detail-summary").textContent = caseData.summary;
  document.getElementById("detail-body").textContent = caseData.detail;
  document.getElementById("detail-owner").textContent = `担当: ${caseData.owner}`;
  document.getElementById("detail-impact").textContent = `効果: ${caseData.impact}`;
  document.getElementById("detail-date").textContent = `公開日: ${caseData.date}`;
  document.getElementById("detail-hero").style.backgroundImage = `url("${caseData.image_url || ""}")`;
  document.getElementById("detail-tags").textContent = caseData.tags.join(" / ");
  const likeCountEl = document.getElementById("like-count");
  const commentCountEl = document.getElementById("comment-count");
  if (likeCountEl) likeCountEl.textContent = caseData.likes;
  if (commentCountEl) commentCountEl.textContent = caseData.comments.length;

  const liked = loadLikedSet();
  const likeBtn = document.getElementById("like-btn");
  if (likeBtn) {
    likeBtn.classList.toggle("liked", liked.has(String(caseData.id)));
    likeBtn.innerHTML = `👍 ${liked.has(String(caseData.id)) ? "グッド済み" : "グッド"} <span id="like-count">${caseData.likes}</span>`;
  }

  const pdfLink = document.getElementById("detail-pdf");
  if (pdfLink) {
    if (caseData.pdf_url) {
      pdfLink.classList.remove("hidden");
      pdfLink.href = caseData.pdf_url;
      pdfLink.download = caseData.pdf_name || `${caseData.title}.pdf`;
      pdfLink.textContent = caseData.pdf_name
        ? `📄 ${caseData.pdf_name} をダウンロード`
        : "📄 添付PDFを開く";
      pdfLink.target = "_blank";
      pdfLink.rel = "noopener";
    } else {
      pdfLink.classList.add("hidden");
      pdfLink.removeAttribute("href");
    }
  }

  renderComments(caseData.comments);

  document.getElementById("detail-drawer").classList.add("open");
  const overlay = document.getElementById("drawer-overlay");
  if (overlay) overlay.classList.add("open");
}

function renderComments(list) {
  const container = document.getElementById("comment-list");
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

async function likeCase(id) {
  if (!id) return;
  const likedSet = loadLikedSet();
  if (likedSet.has(String(id))) return;

  try {
    const res = await fetchJson(`/api/cases/${id}/like`, { method: "POST" });
    if (res.case) replaceCase(res.case);
  } catch (err) {
    console.error("Failed to like", err);
  }
  likedSet.add(String(id));
  saveLikedSet(likedSet);

  if (String(currentId) === String(id)) {
    const item = getAllCases().find((c) => String(c.id) === String(id));
    const likeCountEl = document.getElementById("like-count");
    const likeBtn = document.getElementById("like-btn");
    if (item && likeCountEl) likeCountEl.textContent = item.likes;
    if (item && likeBtn)
      likeBtn.innerHTML = `👍 グッド済み <span id="like-count">${item.likes}</span>`;
  }

  renderCards();
}

async function addComment(e) {
  e.preventDefault();
  if (!currentId) return;
  const name = document.getElementById("comment-name")?.value.trim() || "";
  const team = document.getElementById("comment-team")?.value.trim() || "";
  const text = document.getElementById("comment-text")?.value.trim();
  if (!text) return;
  try {
    const res = await fetchJson(`/api/cases/${currentId}/comments`, {
      method: "POST",
      body: JSON.stringify({ name, team, text }),
    });
    if (res.case) {
      replaceCase(res.case);
      renderComments(res.case.comments || []);
      const commentCountEl = document.getElementById("comment-count");
      if (commentCountEl) commentCountEl.textContent = (res.case.comments || []).length;
      const form = e.target;
      if (form) form.reset();
    }
  } catch (err) {
    console.error("Failed to add comment", err);
  }
}

function attachEvents() {
  const closeBtn = document.getElementById("drawer-close");
  if (closeBtn) closeBtn.addEventListener("click", closeDrawer);
  const overlay = document.getElementById("drawer-overlay");
  if (overlay) overlay.addEventListener("click", closeDrawer);
  const likeBtn = document.getElementById("like-btn");
  if (likeBtn) likeBtn.addEventListener("click", () => likeCase(currentId));

  const list = document.getElementById("case-list");
  if (list) {
    list.addEventListener("click", (e) => {
      const like = e.target.closest(".like-btn");
      if (like) {
        likeCase(like.dataset.id);
        return;
      }
      const card = e.target.closest(".case-card");
      if (card) {
        openDetail(card.dataset.id);
      }
    });
  }

  const commentForm = document.getElementById("comment-form");
  if (commentForm) {
    commentForm.addEventListener("submit", (ev) => {
      addComment(ev).catch((err) => console.error(err));
    });
  }
}

function closeDrawer() {
  document.getElementById("detail-drawer").classList.remove("open");
  const overlay = document.getElementById("drawer-overlay");
  if (overlay) overlay.classList.remove("open");
  currentId = null;
}

function updateClockOnce() {
  const el = document.getElementById("current-time");
  if (el) el.textContent = new Date().toLocaleString("ja-JP");
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await refreshCases();
  } catch (err) {
    console.error("Failed to load cases", err);
  }
  attachEvents();
  updateClockOnce();
  const searchBox = document.getElementById("search-box");
  if (searchBox) {
    searchBox.addEventListener("input", (e) => {
      searchTerm = e.target.value;
      currentPage = 1;
      renderCards();
    });
  }
});
