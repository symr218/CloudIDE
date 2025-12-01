// Static bulletin board: seeded cases, detail drawer, likes (1 per user), PDF download support.

const STORAGE_KEY = "customCases";
const LIKED_KEY = "likedCaseIds";

const SEED_CASES = [
  {
    id: "c1",
    title: "AI活用で問い合わせ自動振り分け",
    summary: "問い合わせをAIでカテゴリ判定し、担当振り分けを自動化。",
    detail:
      "自然言語処理でカテゴリを推定し、Jira のキューに自動振り分け。SLA 違反を 25% 削減し、一次対応の体験も向上しました。",
    tags: ["自動化", "ヘルプデスク", "AI"],
    owner: "IT サービスデスク",
    impact: "SLA違反 -25%",
    date: "2025-05-01",
    likes: 8,
    pv: 540,
    comments: [
      { name: "Sato", team: "Ops", text: "手作業の振り分けがほぼゼロになりました。" },
      { name: "Yamada", team: "HR", text: "他部門でも流用できそうです。" },
    ],
  },
  {
    id: "c2",
    title: "リモートワークVPN可視化",
    summary: "VPN 混雑をダッシュボード化し、ピーク時の接続障害を減少。",
    detail:
      "帯域と同時接続数を監視し、ピーク時にゲートを自動増設。接続失敗を 30% 削減し、リモート体験を改善しました。",
    tags: ["監視", "クラウド", "運用改善"],
    owner: "ネットワーク",
    impact: "失敗率 -30%",
    date: "2025-04-18",
    likes: 5,
    pv: 480,
    comments: [],
  },
  {
    id: "c3",
    title: "権限申請のセルフサービス化",
    summary: "権限申請をフォーム化し承認フローを自動化、リードタイム短縮。",
    detail:
      "RBAC を整備し、PowerAutomate で承認ワークフローを自動化。承認リードタイムを 3 日から 1 日に短縮しました。",
    tags: ["権限管理", "自動化", "ナレッジ"],
    owner: "ID 管理",
    impact: "リードタイム -66%",
    date: "2025-05-10",
    likes: 7,
    pv: 620,
    comments: [],
  },
  {
    id: "c4",
    title: "ログイン監査でアカウント棚卸し",
    summary: "半年未ログインのアカウントを検知し自動失効。",
    detail:
      "サインインログを集約し、未使用アカウントを週次で自動失効。アカウント数を 12% 削減し、リスクを低減しました。",
    tags: ["セキュリティ", "ID 管理", "分析"],
    owner: "セキュリティ",
    impact: "無効化 +12%",
    date: "2025-05-22",
    likes: 6,
    pv: 510,
    comments: [],
  },
  {
    id: "c5",
    title: "パッチ適用の段階ロールアウト",
    summary: "自動テスト後に段階配信し、失敗を早期検知。",
    detail:
      "リング 0 で自動テストし、リング 1/2 へ段階配信。失敗を即座にロールバックし、停止時間を最小化しました。",
    tags: ["運用改善", "監視", "開発効率"],
    owner: "プラットフォーム",
    impact: "障害影響 -40%",
    date: "2025-04-05",
    likes: 4,
    pv: 430,
    comments: [],
  },
  {
    id: "c6",
    title: "コストタグの自動是正",
    summary: "未タグリソースを検知し自動でタグ付け、集計漏れを解消。",
    detail:
      "Policy で未タグを検知し、部門/環境タグを自動補完。コスト集計漏れをゼロにし、ダッシュボードの精度を向上させました。",
    tags: ["コスト最適化", "クラウド", "運用改善"],
    owner: "クラウド CoE",
    impact: "集計漏れ 0件",
    date: "2025-03-28",
    likes: 5,
    pv: 520,
    comments: [],
  },
  {
    id: "c7",
    title: "ナレッジ検索の高速化",
    summary: "全文検索と類似 FAQ 提案で自己解決率を向上。",
    detail:
      "ナレッジを検索基盤に集約し、類似 FAQ を提案。自己解決率を 18% 向上し、ヘルプデスク負荷を削減しました。",
    tags: ["ナレッジ", "UX", "分析"],
    owner: "ITSM",
    impact: "自己解決 +18%",
    date: "2025-04-15",
    likes: 9,
    pv: 700,
    comments: [],
  },
  {
    id: "c8",
    title: "ゼロタッチ PC キッティング",
    summary: "AutoPilot でキッティングを自動化し、1台あたり 90 分短縮。",
    detail:
      "標準イメージとポリシーをコード化し、到着即日利用可能に。1 台あたり 90 分 → 30 分に短縮しました。",
    tags: ["自動化", "開発効率", "UX"],
    owner: "エンドポイント",
    impact: "工数 -66%",
    date: "2025-05-30",
    likes: 12,
    pv: 880,
    comments: [],
  },
  {
    id: "c9",
    title: "Teams 会議録の自動要約",
    summary: "議事録を自動生成し、共有漏れを削減。",
    detail:
      "音声認識＋要約で議事録を自動配信。共有漏れを 80% 削減し、振り返り時間を短縮しました。",
    tags: ["AI", "ナレッジ", "自動化"],
    owner: "コラボチーム",
    impact: "共有漏れ -80%",
    date: "2025-06-01",
    likes: 10,
    pv: 910,
    comments: [],
  },
  {
    id: "c10",
    title: "セキュリティアラートの優先度自動付け",
    summary: "誤検知を減らし、重要アラートを優先的に処理。",
    detail:
      "脅威インテリジェンスと資産重要度から優先度を自動算出。誤検知対応を 35% 削減しました。",
    tags: ["セキュリティ", "監視", "分析"],
    owner: "SOC",
    impact: "誤検知 -35%",
    date: "2025-05-12",
    likes: 8,
    pv: 640,
    comments: [],
  },
];

let customCases = [];
let currentId = null;
let searchTerm = "";

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
    分析: "#eab308",
    開発効率: "#4f46e5",
    ナレッジ: "#10b981",
    監視: "#f43f5e",
    権限管理: "#fb7185",
    AI: "#0ea5e9",
  };
  return map[tag] || "#2563eb";
}

function generateFallbackImage(title = "Case", primaryTag = "未分類") {
  const safe = escapeSvgText(title.slice(0, 28) || "Case");
  const base = tagColor(primaryTag);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='800' height='500'><defs><linearGradient id='g' x1='0%' y1='0%' x2='100%' y2='100%'><stop offset='0%' stop-color='${base}'/><stop offset='100%' stop-color='#60a5fa'/></linearGradient></defs><rect width='800' height='500' rx='32' fill='url(#g)'/><text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' fill='white' font-family='Segoe UI' font-size='48' font-weight='700'>${safe}</text></svg>`;
  return "data:image/svg+xml;utf8," + encodeURIComponent(svg);
}

function normalizeCase(item) {
  const tags =
    Array.isArray(item.tags) && item.tags.length ? item.tags.filter(Boolean) : ["未分類"];
  const primary = tags[0];
  return {
    ...item,
    id: String(item.id || Date.now()),
    image: item.image || generateFallbackImage(item.title || "Case", primary),
    tags,
    likes: Number.isFinite(item.likes) ? item.likes : 0,
    pv: Number.isFinite(item.pv) ? item.pv : 0,
    comments: Array.isArray(item.comments) ? item.comments : [],
    pdfData: item.pdfData || null,
    pdfName: item.pdfName || "",
    deleted: Boolean(item.deleted),
  };
}

function normalizeCases(list) {
  return list.map(normalizeCase);
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

function findCase(id) {
  const idStr = String(id);
  return getAllCases().find((c) => String(c.id) === idStr);
}

function renderCards() {
  const list = document.getElementById("case-list");
  const liked = loadLikedSet();
  if (!list) return;
  list.innerHTML = "";

  getAllCases()
    .filter((item) => {
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
    })
    .forEach((item) => {
      const tags = item.tags;
      const isLiked = liked.has(item.id);
      const primaryTag = tags[0] || "未分類";
      const tagCol = tagColor(primaryTag);
      const card = document.createElement("article");
      card.className = "case-card" + (isLiked ? " liked" : "");
      card.dataset.id = item.id;
      card.style.setProperty("--tag-color", tagCol);
      card.innerHTML = `
        <div class="color-bar"></div>
        <div class="thumb">
          <div class="tag-row">
            ${tags.map((t) => `<span class="tag">${t}</span>`).join("")}
          </div>
        </div>
        <div class="card-body">
          <div class="card-title">${item.title}</div>
          <div class="card-summary">${item.summary}</div>
          <div class="card-meta">
            <span class="pill">担当 ${item.owner}</span>
            <span class="pill">効果 ${item.impact}</span>
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
        thumb.style.backgroundImage = `url("${item.image}")`;
        thumb.style.backgroundColor = tagCol;
      }
      list.appendChild(card);
    });
}

function openDetail(id) {
  const item = findCase(id);
  if (!item) return;
  currentId = String(id);

  const idx = customCases.findIndex((c) => String(c.id) === String(id));
  if (idx !== -1) {
    customCases[idx].pv = (customCases[idx].pv || 0) + 1;
    saveCustomCases(customCases);
  }

  document.getElementById("detail-title").textContent = item.title;
  document.getElementById("detail-summary").textContent = item.summary;
  document.getElementById("detail-body").textContent = item.detail;
  document.getElementById("detail-owner").textContent = `担当: ${item.owner}`;
  document.getElementById("detail-impact").textContent = `効果: ${item.impact}`;
  document.getElementById("detail-date").textContent = `公開日: ${item.date}`;
  document.getElementById("detail-hero").style.backgroundImage = `url("${item.image}")`;
  document.getElementById("detail-tags").textContent = item.tags.join(" / ");
  const likeCountEl = document.getElementById("like-count");
  const commentCountEl = document.getElementById("comment-count");
  if (likeCountEl) likeCountEl.textContent = item.likes;
  if (commentCountEl) commentCountEl.textContent = item.comments.length;

  const liked = loadLikedSet();
  const likeBtn = document.getElementById("like-btn");
  if (likeBtn) {
    likeBtn.classList.toggle("liked", liked.has(item.id));
    likeBtn.innerHTML = `👍 ${liked.has(item.id) ? "グッド済み" : "グッド"} <span id="like-count">${item.likes}</span>`;
  }

  const pdfLink = document.getElementById("detail-pdf");
  if (pdfLink) {
    if (item.pdfData) {
      pdfLink.classList.remove("hidden");
      pdfLink.href = item.pdfData;
      pdfLink.download = item.pdfName || `${item.title}.pdf`;
      pdfLink.textContent = item.pdfName ? `📄 ${item.pdfName} をダウンロード` : "📄 添付PDFを開く";
      pdfLink.target = "_blank";
      pdfLink.rel = "noopener";
    } else {
      pdfLink.classList.add("hidden");
      pdfLink.removeAttribute("href");
    }
  }

  renderComments(item.comments);

  document.getElementById("detail-drawer").classList.add("open");
  const overlay = document.getElementById("drawer-overlay");
  if (overlay) overlay.classList.add("open");
}

function likeCase(id) {
  const idx = customCases.findIndex((c) => String(c.id) === String(id));
  const likedSet = loadLikedSet();
  if (likedSet.has(String(id))) return;

  if (idx !== -1) {
    customCases[idx].likes += 1;
    saveCustomCases(customCases);
  }
  likedSet.add(String(id));
  saveLikedSet(likedSet);

  if (String(currentId) === String(id)) {
    const item = findCase(id);
    const likeCountEl = document.getElementById("like-count");
    const likeBtn = document.getElementById("like-btn");
    if (item && likeCountEl) likeCountEl.textContent = item.likes;
    if (item && likeBtn)
      likeBtn.innerHTML = `👍 グッド済み <span id="like-count">${item.likes}</span>`;
  }

  renderCards();
}

function renderComments(list) {
  const container = document.getElementById("comment-list");
  if (!container) return;
  container.innerHTML = "";
  list.forEach((c) => {
    const div = document.createElement("div");
    div.className = "comment";
    const who = [c?.name || "匿名", c?.team].filter(Boolean).join(" / ");
    div.innerHTML = `
      <div class="comment-head">
        <span>${who}</span>
        <span>${new Date().toLocaleDateString("ja-JP")}</span>
      </div>
      <div class="comment-body">${escapeHtml(c?.text)}</div>
    `;
    container.appendChild(div);
  });
}

function addComment(e) {
  e.preventDefault();
  if (!currentId) return;
  const name = document.getElementById("comment-name")?.value.trim() || "";
  const team = document.getElementById("comment-team")?.value.trim() || "";
  const text = document.getElementById("comment-text")?.value.trim();
  if (!text) return;
  const idx = customCases.findIndex((c) => String(c.id) === String(currentId));
  if (idx === -1) return;
  const entry = { name: name || "匿名", team, text };
  customCases[idx].comments.push(entry);
  saveCustomCases(customCases);
  renderComments(customCases[idx].comments);
  const commentCountEl = document.getElementById("comment-count");
  if (commentCountEl) commentCountEl.textContent = customCases[idx].comments.length;
  const form = e.target;
  if (form) form.reset();
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
    commentForm.addEventListener("submit", addComment);
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

document.addEventListener("DOMContentLoaded", () => {
  const stored = loadCustomCases();
  if (stored.length) {
    customCases = normalizeCases(stored);
  } else {
    customCases = normalizeCases(SEED_CASES);
    saveCustomCases(customCases);
    localStorage.removeItem(LIKED_KEY);
  }

  renderCards();
  attachEvents();
  updateClockOnce();
  const searchBox = document.getElementById("search-box");
  if (searchBox) {
    searchBox.addEventListener("input", (e) => {
      searchTerm = e.target.value;
      renderCards();
    });
  }
});
