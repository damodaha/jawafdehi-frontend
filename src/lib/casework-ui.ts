// Shared presentational helpers for the Casework Review portal.
import type { CategoryScore, Disposition, ReviewStatus } from "@/types/casework";

// Escape text interpolated into raw SVG/HTML markup (this module builds SVG
// strings rendered via dangerouslySetInnerHTML). A category like
// "Sourcing & References" or one containing < would otherwise produce invalid
// markup / an injection sink.
function escapeXml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function scoreBand(score: number | null | undefined): string {
  if (score == null) return "#94a3b8"; // slate
  if (score >= 80) return "#16a34a"; // green
  if (score >= 60) return "#d97706"; // amber
  return "#dc2626"; // red
}

export function dispositionColor(d: Disposition | null | undefined): string {
  switch (d) {
    case "PASS":
      return "bg-green-100 text-green-800 border-green-200";
    case "REVISE":
      return "bg-amber-100 text-amber-800 border-amber-200";
    case "REJECT":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

// Stable color per rule category, so the same category reads the same hue
// across the Rules page and review breakdowns. Falls back to a hash for any
// category not explicitly mapped.
const CATEGORY_COLORS: Record<string, string> = {
  Completeness: "bg-sky-100 text-sky-800 border-sky-200",
  Description: "bg-indigo-100 text-indigo-800 border-indigo-200",
  Tone: "bg-violet-100 text-violet-800 border-violet-200",
  Sourcing: "bg-teal-100 text-teal-800 border-teal-200",
  Timeline: "bg-cyan-100 text-cyan-800 border-cyan-200",
  Entities: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Ethics: "bg-rose-100 text-rose-800 border-rose-200",
  Integrity: "bg-amber-100 text-amber-800 border-amber-200",
};

const CATEGORY_FALLBACKS = [
  "bg-slate-100 text-slate-700 border-slate-200",
  "bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200",
  "bg-lime-100 text-lime-800 border-lime-200",
  "bg-orange-100 text-orange-800 border-orange-200",
];

export function categoryColor(category: string): string {
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  let h = 0;
  for (let i = 0; i < category.length; i++) h = (h * 31 + category.charCodeAt(i)) >>> 0;
  return CATEGORY_FALLBACKS[h % CATEGORY_FALLBACKS.length];
}

// Color for a rule's kind: deterministic (exact check) vs llm (judge).
export function kindColor(kind: "deterministic" | "llm" | string): string {
  return kind === "llm"
    ? "bg-blue-100 text-blue-800 border-blue-200"
    : "bg-slate-100 text-slate-700 border-slate-200";
}

export function statusColor(s: ReviewStatus): string {
  switch (s) {
    case "done":
      return "bg-green-100 text-green-800 border-green-200";
    case "running":
    case "pending":
      return "bg-blue-100 text-blue-800 border-blue-200";
    case "failed":
      return "bg-red-100 text-red-800 border-red-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function fmtDur(seconds: number | null | undefined): string {
  if (seconds == null) return "";
  if (seconds < 60) return `${seconds.toFixed(0)}s`;
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${s}s`;
}

// Minimal markdown -> HTML (headings, bold, lists, paragraphs). No deps.
export function mdToHtml(md: string): string {
  if (!md) return "";
  const esc = (t: string) =>
    t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const lines = md.split("\n");
  const out: string[] = [];
  let inList = false;
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (/^#{1,6}\s/.test(line)) {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      const level = line.match(/^#+/)![0].length;
      const text = esc(line.replace(/^#+\s/, ""));
      out.push(`<h${level} class="font-semibold mt-2">${text}</h${level}>`);
    } else if (/^[-*]\s/.test(line)) {
      if (!inList) {
        out.push('<ul class="list-disc pl-5 space-y-0.5">');
        inList = true;
      }
      out.push(`<li>${inline(esc(line.replace(/^[-*]\s/, "")))}</li>`);
    } else if (line === "") {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
    } else {
      if (inList) {
        out.push("</ul>");
        inList = false;
      }
      out.push(`<p>${inline(esc(line))}</p>`);
    }
  }
  if (inList) out.push("</ul>");
  return out.join("\n");
}

function inline(t: string): string {
  return t
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, '<code class="px-1 bg-slate-100 rounded">$1</code>');
}

// Pure inline-SVG radar/spider chart of per-category scores (no chart lib).
// Returns an SVG string; render via dangerouslySetInnerHTML. Only meaningful
// with >= 3 dimensions.
export function radarChartSvg(categories: CategoryScore[], size = 320): string {
  const dims = categories.filter((c) => c.category);
  if (dims.length < 3) return "";
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 56;
  const n = dims.length;
  const ang = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i: number, radius: number) => [
    cx + radius * Math.cos(ang(i)),
    cy + radius * Math.sin(ang(i)),
  ];

  const rings = [0.25, 0.5, 0.75, 1].map((f) => {
    const pts = dims
      .map((_, i) => pt(i, r * f))
      .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
      .join(" ");
    return `<polygon points="${pts}" fill="none" stroke="#e2e8f0" stroke-width="1"/>`;
  });

  const spokes = dims
    .map((_, i) => {
      const [x, y] = pt(i, r);
      return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#e2e8f0" stroke-width="1"/>`;
    })
    .join("");

  const dataPts = dims.map((c, i) => pt(i, (r * Math.max(0, Math.min(100, c.score))) / 100));
  const dataPoly = dataPts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

  const dots = dataPts
    .map(([x, y], i) => {
      const col = scoreBand(dims[i].score);
      return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="${col}"/>`;
    })
    .join("");

  const labels = dims
    .map((c, i) => {
      const [x, y] = pt(i, r + 22);
      const anchor = Math.abs(x - cx) < 8 ? "middle" : x > cx ? "start" : "end";
      return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="11" fill="#475569" text-anchor="${anchor}" dominant-baseline="middle">${escapeXml(c.category)} <tspan font-weight="700" fill="${scoreBand(c.score)}">${c.score}</tspan></text>`;
    })
    .join("");

  return `<svg viewBox="0 0 ${size} ${size}" width="100%" height="${size}" role="img" aria-label="Per-category scores radar chart">
    ${rings.join("")}
    ${spokes}
    <polygon points="${dataPoly}" fill="rgba(37,99,235,0.18)" stroke="#2563eb" stroke-width="2"/>
    ${dots}
    ${labels}
  </svg>`;
}
