import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const CONDITION_COLORS = {
  full:        "#10b981", // emerald
  no_sympy:    "#ef4444", // red
  no_decomp:   "#f59e0b", // amber
  no_pipeline: "#3b82f6", // blue
};

const CONDITION_LABELS = {
  full:        "Full Pipeline (Decomposer + SymPy + Verifier)",
  no_sympy:    "No SymPy Check",
  no_decomp:   "No Decomposer Step",
  no_pipeline: "Without Any Pipeline",
};

const TIER_ORDER = ["algebra","number_theory","combinatorics","calculus","olympiad"];

function parseSummary(data) {
  if (!data?.summary?.rows) return [];
  return data.summary.rows;
}

function UploadPrompt({ onLoad }) {
  return (
    <div style={{ padding: "4rem 2rem", textAlign: "center", color: "var(--text-secondary)", background: "var(--panel-bg)", borderRadius: "16px", border: "1px solid var(--border-color)", backdropFilter: "blur(12px)" }}>
      <div style={{ fontSize: 44, display: "block", marginBottom: "1rem" }}>📊</div>
      <p style={{ fontSize: 17, marginBottom: "1.5rem", color: "var(--text-primary)", fontWeight: 500 }}>
        Upload your <code>eval_results.json</code> to unlock the ablation analytics dashboard
      </p>
      <label style={{
        display: "inline-block", padding: "0.75rem 1.75rem",
        background: "var(--accent-color)",
        borderRadius: "8px",
        cursor: "pointer", fontSize: 14,
        fontWeight: 600,
        color: "#ffffff",
        transition: "all 0.2s",
        boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)"
      }}>
        📂 Choose JSON File
        <input type="file" accept=".json" style={{ display: "none" }}
          onChange={e => {
            const f = e.target.files[0];
            if (!f) return;
            const r = new FileReader();
            r.onload = ev => {
              try { onLoad(JSON.parse(ev.target.result)); }
              catch { alert("Invalid JSON file"); }
            };
            r.readAsText(f);
          }}
        />
      </label>
      <p style={{ marginTop: "1.5rem", fontSize: 12, color: "var(--text-secondary)", opacity: 0.8 }}>
        To generate it, run in your terminal: <br />
        <code style={{ background: "rgba(0,0,0,0.3)", padding: "0.25rem 0.5rem", borderRadius: 4, display: "inline-block", marginTop: 6, fontFamily: "monospace" }}>
          python eval_harness.py --tiers algebra number_theory --conditions full no_pipeline no_sympy
        </code>
      </p>
    </div>
  );
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: "var(--panel-bg)",
      border: "1px solid var(--border-color)",
      borderRadius: "12px",
      padding: "1.25rem",
      flex: 1, minWidth: "160px",
      backdropFilter: "blur(12px)",
    }}>
      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color: color || "var(--text-primary)" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--text-secondary)", opacity: 0.7, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function ConvergenceChart({ rows }) {
  const byTier = TIER_ORDER.filter(t => rows.some(r => r.tier === t));
  const chartData = byTier.map(tier => {
    const tierRows = rows.filter(r => r.tier === tier);
    const entry = { tier: tier.replace("_", " ") };
    for (const r of tierRows) {
      entry[r.condition] = Math.round(r.convergence_rate * 100);
    }
    return entry;
  });

  const conditions = [...new Set(rows.map(r => r.condition))];

  return (
    <div style={{ background: "var(--panel-bg)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem", backdropFilter: "blur(12px)" }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: "1.25rem", marginTop: 0, color: "var(--text-primary)" }}>Convergence rate by tier (%)</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 0, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="tier" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
          <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
          <Tooltip contentStyle={{ background: "#1a1d24", border: "1px solid var(--border-color)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" }} />
          <Legend iconSize={10} wrapperStyle={{ fontSize: 12, paddingTop: 10 }} formatter={v => CONDITION_LABELS[v] || v} />
          {conditions.map(c => (
            <Bar key={c} dataKey={c} name={c} fill={CONDITION_COLORS[c] || "#888"} radius={[4,4,0,0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function IterationsChart({ rows }) {
  const byTier = TIER_ORDER.filter(t => rows.some(r => r.tier === t));
  const chartData = byTier.map(tier => {
    const tierRows = rows.filter(r => r.tier === tier);
    const entry = { tier: tier.replace("_", " ") };
    for (const r of tierRows) {
      entry[r.condition] = r.mean_iterations;
    }
    return entry;
  });

  const conditions = [...new Set(rows.map(r => r.condition))];

  return (
    <div style={{ background: "var(--panel-bg)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem", backdropFilter: "blur(12px)" }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: "1.25rem", marginTop: 0, color: "var(--text-primary)" }}>Mean iterations to convergence</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 0, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="tier" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
          <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
          <Tooltip contentStyle={{ background: "#1a1d24", border: "1px solid var(--border-color)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" }} />
          <Legend iconSize={10} wrapperStyle={{ fontSize: 12, paddingTop: 10 }} formatter={v => CONDITION_LABELS[v] || v} />
          {conditions.map(c => (
            <Bar key={c} dataKey={c} name={c} fill={CONDITION_COLORS[c] || "#888"} radius={[4,4,0,0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function SympyValueChart({ rows }) {
  const fullRows = rows.filter(r => r.condition === "full");
  if (fullRows.length === 0) return null;

  const chartData = fullRows.map(r => ({
    tier: r.tier.replace("_", " "),
    "SymPy intercepts": r.total_sympy_intercepts,
    "LLM verifier fails": r.total_llm_fails,
  }));

  return (
    <div style={{ background: "var(--panel-bg)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem", backdropFilter: "blur(12px)" }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: "0.25rem", marginTop: 0, color: "var(--text-primary)" }}>SymPy value-add (full pipeline only)</h3>
      <p style={{ fontSize: 12, color: "var(--text-secondary)", marginBottom: "1.25rem", marginTop: 0 }}>
        Errors caught by SymPy before the LLM verifier ran — this highlights your key symbolic contribution!
      </p>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={chartData} margin={{ top: 0, right: 16, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="tier" tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
          <YAxis tick={{ fontSize: 11, fill: "var(--text-secondary)" }} />
          <Tooltip contentStyle={{ background: "#1a1d24", border: "1px solid var(--border-color)", borderRadius: 8, fontSize: 12, color: "var(--text-primary)" }} />
          <Legend iconSize={10} wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
          <Bar dataKey="SymPy intercepts" fill="#10b981" radius={[4,4,0,0]} />
          <Bar dataKey="LLM verifier fails" fill="#3b82f6" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ResultsTable({ rows }) {
  return (
    <div style={{ background: "var(--panel-bg)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "1.5rem", overflowX: "auto", backdropFilter: "blur(12px)" }}>
      <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: "1.25rem", marginTop: 0, color: "var(--text-primary)" }}>Empirical Results Breakdown</h3>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "var(--text-secondary)" }}>
            {["Condition","Tier","Problems","Conv %","Avg Iters","SymPy Hits","LLM Fails","Avg Time (s)"].map(h => (
              <th key={h} style={{ textAlign: "left", padding: "0.6rem 0.8rem", fontWeight: 600 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
              <td style={{ padding: "0.6rem 0.8rem", color: "var(--text-primary)", fontWeight: 500 }}>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: CONDITION_COLORS[r.condition] || "#888", marginRight: 8 }} />
                {r.condition === 'full' ? 'Full Pipeline' : CONDITION_LABELS[r.condition] || r.condition}
              </td>
              <td style={{ padding: "0.6rem 0.8rem", color: "var(--text-secondary)", textTransform: "capitalize" }}>{r.tier.replace("_"," ")}</td>
              <td style={{ padding: "0.6rem 0.8rem", color: "var(--text-primary)" }}>{r.n_problems}</td>
              <td style={{ padding: "0.6rem 0.8rem", fontWeight: 700, color: r.convergence_rate >= 0.7 ? "#10b981" : r.convergence_rate >= 0.4 ? "#f59e0b" : "#ef4444" }}>
                {(r.convergence_rate * 100).toFixed(0)}%
              </td>
              <td style={{ padding: "0.6rem 0.8rem", color: "var(--text-primary)" }}>{r.mean_iterations.toFixed(1)}</td>
              <td style={{ padding: "0.6rem 0.8rem", color: "#10b981", fontWeight: r.total_sympy_intercepts > 0 ? 700 : 400 }}>{r.total_sympy_intercepts}</td>
              <td style={{ padding: "0.6rem 0.8rem", color: "var(--text-primary)" }}>{r.total_llm_fails}</td>
              <td style={{ padding: "0.6rem 0.8rem", color: "var(--text-secondary)" }}>{r.mean_elapsed_s.toFixed(0)}s</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function EvalDashboard() {
  const [data, setData] = useState(null);

  if (!data) return <UploadPrompt onLoad={setData} />;

  const rows = parseSummary(data);
  const totalResults = data.results?.length || 0;
  const conditions = [...new Set(rows.map(r => r.condition))];

  const fullRows = rows.filter(r => r.condition === "full");
  const noSympyRows = rows.filter(r => r.condition === "no_sympy");
  const noPipelineRows = rows.filter(r => r.condition === "no_pipeline");

  const avgConvFull = fullRows.length
    ? fullRows.reduce((s, r) => s + r.convergence_rate, 0) / fullRows.length
    : null;
  const avgConvNoSympy = noSympyRows.length
    ? noSympyRows.reduce((s, r) => s + r.convergence_rate, 0) / noSympyRows.length
    : null;
  const avgConvNoPipeline = noPipelineRows.length
    ? noPipelineRows.reduce((s, r) => s + r.convergence_rate, 0) / noPipelineRows.length
    : null;
  const sympyLift = avgConvFull && avgConvNoSympy
    ? ((avgConvFull - avgConvNoSympy) * 100).toFixed(1)
    : null;
  const totalSympyHits = rows.filter(r => r.condition === "full")
    .reduce((s, r) => s + r.total_sympy_intercepts, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", paddingBottom: "2rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: "var(--text-primary)" }}>Empirical Ablation Analytics</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--text-secondary)" }}>
            {totalResults} problem runs · Date Generated: {data.timestamp?.slice(0,10)} · Active conditions: {conditions.map(c => c.toUpperCase()).join(", ")}
          </p>
        </div>
        <button
          onClick={() => setData(null)}
          style={{
            fontSize: 12, padding: "0.5rem 1rem",
            border: "1px solid var(--border-color)",
            borderRadius: "6px",
            background: "rgba(255,255,255,0.03)",
            cursor: "pointer",
            fontWeight: 500,
            color: "var(--text-secondary)",
            transition: "all 0.2s"
          }}
          onMouseOver={e => { e.target.style.background = "rgba(255,255,255,0.08)"; e.target.style.color = "var(--text-primary)"; }}
          onMouseOut={e => { e.target.style.background = "rgba(255,255,255,0.03)"; e.target.style.color = "var(--text-secondary)"; }}
        >
          🔄 Load New File
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        {avgConvFull !== null && (
          <StatCard label="Full Pipeline Convergence" value={`${(avgConvFull*100).toFixed(0)}%`} color="#10b981" />
        )}
        {avgConvNoSympy !== null && (
          <StatCard label="No-SymPy Convergence" value={`${(avgConvNoSympy*100).toFixed(0)}%`} color="#ef4444" />
        )}
        {avgConvNoPipeline !== null && (
          <StatCard label="No-Pipeline Convergence" value={`${(avgConvNoPipeline*100).toFixed(0)}%`} color="#3b82f6" />
        )}
        {sympyLift !== null && (
          <StatCard label="SymPy Accuracy Lift" value={`+${sympyLift}pp`} sub="Full vs No-SymPy Ablation" color="#3b82f6" />
        )}
        <StatCard label="SymPy Intercepts" value={totalSympyHits} sub="Errors caught before LLM ran" color="#f59e0b" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "1.5rem" }}>
        <ConvergenceChart rows={rows} />
        <IterationsChart rows={rows} />
      </div>

      <SympyValueChart rows={rows} />
      <ResultsTable rows={rows} />
    </div>
  );
}
