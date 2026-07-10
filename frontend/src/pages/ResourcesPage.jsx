import { useState } from "react";
import mammoth from "mammoth";

const SLIDES_URL = "https://docs.google.com/presentation/d/e/2PACX-1vQ4cNJiCkV7r4ggLx3Dn9gYP9N-j9mESBFKalXP0kBuSWCLToRVeEnxhV7M7dBY3UiBNdcR-gRGwRTE/pubembed?start=false&loop=false&delayms=60000";

function SlideViewer() {
  return (
    <div style={{ width:"100%", background:"#000", borderRadius:"0.5rem", overflow:"hidden", aspectRatio:"16/9" }}>
      <iframe src={SLIDES_URL} frameBorder="0" allowFullScreen style={{ width:"100%", height:"100%", border:"none" }} title="The Five Branches — DEA Slide Deck" />
    </div>
  );
}

function DocxViewer() {
  const [html, setHtml] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [open, setOpen] = useState(false);

  async function loadDoc() {
    if (html) { setOpen(true); return; }
    setLoading(true); setError(null);
    try {
      const res = await fetch("/resources/DEA_Five_Branches.docx");
      const buf = await res.arrayBuffer();
      const result = await mammoth.convertToHtml({ arrayBuffer: buf });
      setHtml(result.value); setOpen(true);
    } catch (e) {
      setError("Could not load document. Please use the download button instead.");
    } finally { setLoading(false); }
  }

  return (
    <div>
      {!open && (
        <button onClick={loadDoc} disabled={loading}
          style={{ display:"flex", alignItems:"center", gap:"0.5rem", background: loading ? "#e2e8f0" : "linear-gradient(135deg,#185ABD,#2d6fd4)", color: loading ? "#94a3b8" : "#fff", border:"none", borderRadius:8, padding:"0.55rem 1.2rem", fontSize:"0.88rem", fontWeight:600, cursor: loading ? "default" : "pointer", boxShadow: loading ? "none" : "0 2px 8px rgba(24,90,189,0.3)" }}>
          {loading ? "Loading…" : <><span>👁</span> Read Document</>}
        </button>
      )}
      {error && <p style={{ color:"#dc2626", fontSize:"0.85rem", marginTop:"0.5rem" }}>{error}</p>}
      {open && html && (
        <div>
          <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:"0.5rem" }}>
            <button onClick={() => setOpen(false)} style={{ fontSize:"0.8rem", color:"#64748b", background:"#f1f5f9", border:"1px solid #e2e8f0", borderRadius:6, padding:"0.25rem 0.75rem", cursor:"pointer" }}>✕ Close</button>
          </div>
          <div dangerouslySetInnerHTML={{ __html: html }}
            style={{ background:"#fff", border:"1px solid #e2e8f0", borderRadius:"0.75rem", padding:"2rem 2.5rem", maxHeight:"60vh", overflowY:"auto", fontSize:"0.92rem", lineHeight:1.75, color:"#1e293b", boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }} />
        </div>
      )}
    </div>
  );
}

const resources = [
  {
    id:"pptx", title:"The Five Branches", subtitle:"A DEA Story — Classroom Slide Deck",
    description:"A 16-slide narrative presentation covering the complete DEA analysis of five bank branches — setup, LP formulation, ratio analysis, the efficiency frontier, and improvement targets. Includes speaker notes on every slide.",
    filename:"DEA_Five_Branches.pptx", url:"/resources/DEA_Five_Branches.pptx", type:"PowerPoint",
    meta:[{label:"Slides",value:"16"},{label:"Format",value:".pptx"},{label:"Size",value:"80 KB"},{label:"Audience",value:"MBA 3rd Sem"}],
    tags:["Lecture","Narrative","DEA Fundamentals"], accent:"#D04A28", accentLight:"#FDF1EE",
    icon:(<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width={40} height={40}><rect width="40" height="40" rx="8" fill="#D04A28"/><rect x="14" y="6" width="16" height="20" rx="2" fill="white"/><rect x="17" y="11" width="10" height="2" rx="1" fill="#D04A28"/><rect x="17" y="15" width="7" height="1.5" rx="0.75" fill="#D04A28" opacity="0.6"/><rect x="17" y="18" width="8" height="1.5" rx="0.75" fill="#D04A28" opacity="0.6"/></svg>),
    viewer:<SlideViewer />,
  },
  {
    id:"docx", title:"The Five Branches", subtitle:"A Complete DEA Story — Reading Document",
    description:"A ~4,000-word narrative teaching case in prose form — suitable as pre-reading, a take-home case, or an exam reference. Covers intuition, LP formulation, full worked solutions, peer benchmarks, and improvement targets.",
    filename:"DEA_Five_Branches.docx", url:"/resources/DEA_Five_Branches.docx", type:"Word Document",
    meta:[{label:"Words",value:"~4,000"},{label:"Format",value:".docx"},{label:"Size",value:"24 KB"},{label:"Audience",value:"MBA 3rd Sem"}],
    tags:["Pre-reading","Case Study","Take-home"], accent:"#185ABD", accentLight:"#EEF4FD",
    icon:(<svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" width={40} height={40}><rect width="40" height="40" rx="8" fill="#185ABD"/><rect x="14" y="6" width="16" height="20" rx="2" fill="white"/><rect x="17" y="11" width="10" height="1.5" rx="0.75" fill="#185ABD" opacity="0.5"/><rect x="17" y="14" width="10" height="1.5" rx="0.75" fill="#185ABD" opacity="0.5"/><rect x="17" y="17" width="10" height="1.5" rx="0.75" fill="#185ABD" opacity="0.5"/><text x="20" y="27" textAnchor="middle" fill="#185ABD" fontSize="7" fontWeight="bold" fontFamily="sans-serif">W</text></svg>),
    viewer:<DocxViewer />,
  },
];

export default function ResourcesPage() {
  const [downloading, setDownloading] = useState(null);
  const [expanded, setExpanded] = useState({ pptx: true, docx: false });

  const handleDownload = (r) => {
    setDownloading(r.id);
    const a = document.createElement("a"); a.href = r.url; a.download = r.filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(() => setDownloading(null), 1500);
  };

  return (
    <div style={{ maxWidth:900, margin:"0 auto", padding:"2rem 1.5rem", fontFamily:"'Inter','Segoe UI',sans-serif" }}>
      <div style={{ marginBottom:"2rem" }}>
        <h2 style={{ fontSize:"1.5rem", fontWeight:700, color:"#1a2744", margin:0 }}>Teaching Resources</h2>
        <p style={{ color:"#64748b", marginTop:"0.4rem", fontSize:"0.95rem", lineHeight:1.6 }}>
          Classroom materials for the Five Branches DEA case.{" "}
          <span style={{ color:"#1a2744", fontWeight:500 }}>Service Operations Management · MBA 3rd Semester · IFHE Hyderabad</span>
        </p>
        <div style={{ height:3, width:48, background:"linear-gradient(90deg,#C9A84C,#e8c96d)", borderRadius:2, marginTop:"0.75rem" }} />
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:"1.5rem" }}>
        {resources.map((r) => (
          <div key={r.id} style={{ background:"#fff", border:"1px solid #e2e8f0", borderLeft:`4px solid ${r.accent}`, borderRadius:"0.75rem", boxShadow:"0 1px 4px rgba(0,0,0,0.06)", overflow:"hidden" }}>
            <div style={{ padding:"1.25rem 1.5rem", display:"flex", gap:"1.25rem", alignItems:"flex-start" }}>
              <div style={{ flexShrink:0, paddingTop:2 }}>{r.icon}</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:"flex", flexWrap:"wrap", alignItems:"baseline", gap:"0.5rem", marginBottom:"0.2rem" }}>
                  <span style={{ fontSize:"1.05rem", fontWeight:700, color:"#1a2744" }}>{r.title}</span>
                  <span style={{ fontSize:"0.8rem", background:r.accentLight, color:r.accent, fontWeight:600, padding:"0.15rem 0.5rem", borderRadius:99 }}>{r.type}</span>
                </div>
                <div style={{ fontSize:"0.85rem", color:"#64748b", marginBottom:"0.5rem", fontStyle:"italic" }}>{r.subtitle}</div>
                <p style={{ fontSize:"0.88rem", color:"#374151", lineHeight:1.65, margin:"0 0 0.75rem 0" }}>{r.description}</p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"0.5rem", marginBottom:"0.75rem" }}>
                  {r.meta.map((m) => (
                    <div key={m.label} style={{ background:"#f8fafc", border:"1px solid #e2e8f0", borderRadius:6, padding:"0.2rem 0.6rem", fontSize:"0.78rem" }}>
                      <span style={{ color:"#94a3b8", fontWeight:500 }}>{m.label}: </span>
                      <span style={{ color:"#1a2744", fontWeight:600 }}>{m.value}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between", gap:"0.75rem" }}>
                  <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap" }}>
                    {r.tags.map((t) => (<span key={t} style={{ fontSize:"0.73rem", background:"#f1f5f9", color:"#475569", padding:"0.15rem 0.5rem", borderRadius:99, fontWeight:500 }}>{t}</span>))}
                  </div>
                  <div style={{ display:"flex", gap:"0.5rem" }}>
                    <button onClick={() => setExpanded(p => ({...p, [r.id]:!p[r.id]}))}
                      style={{ display:"flex", alignItems:"center", gap:"0.4rem", background: expanded[r.id] ? r.accentLight : "#f1f5f9", color: expanded[r.id] ? r.accent : "#475569", border:`1px solid ${expanded[r.id] ? r.accent : "#e2e8f0"}`, borderRadius:8, padding:"0.45rem 1rem", fontSize:"0.85rem", fontWeight:600, cursor:"pointer" }}>
                      {expanded[r.id] ? "▲ Hide" : "▼ View"}
                    </button>
                    <button onClick={() => handleDownload(r)} disabled={downloading===r.id}
                      style={{ display:"flex", alignItems:"center", gap:"0.4rem", background: downloading===r.id ? "#e2e8f0" : "linear-gradient(135deg,#1a2744,#2d3f6e)", color: downloading===r.id ? "#94a3b8" : "#fff", border:"none", borderRadius:8, padding:"0.45rem 1rem", fontSize:"0.85rem", fontWeight:600, cursor: downloading===r.id ? "default" : "pointer", boxShadow: downloading===r.id ? "none" : "0 2px 8px rgba(26,39,68,0.25)" }}>
                      {downloading===r.id ? "Downloaded ✓" : <><svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3M2 12h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg> Download</>}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {expanded[r.id] && (
              <div style={{ borderTop:`1px solid ${r.accentLight}`, padding:"1.25rem 1.5rem", background:"#fafbfc" }}>
                {r.viewer}
              </div>
            )}
          </div>
        ))}
      </div>
      <p style={{ fontSize:"0.78rem", color:"#94a3b8", marginTop:"2rem", textAlign:"center" }}>
        These materials are intended for classroom use at IFHE Hyderabad · Service Operations Management · MBA Programme
      </p>
    </div>
  );
}
