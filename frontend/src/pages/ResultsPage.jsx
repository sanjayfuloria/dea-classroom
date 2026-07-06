import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { getSession } from '../utils/api'

const TABS = ['Overview', 'DMU Details', 'Benchmarks', 'Teaching Points', 'Raw Data']

export default function ResultsPage() {
  const { id } = useParams()
  const [session, setSession]   = useState(null)
  const [tab, setTab]           = useState(0)
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    getSession(id)
      .then(setSession)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="p-8 text-gray-500">Loading results…</div>
  if (!session) return <div className="p-8 text-red-500">Session not found.</div>

  const { results, interpretation } = session
  const scores = results?.scores || []
  const summary = results?.summary || {}
  const interp  = interpretation || {}

  const chartData = scores
    .filter(s => s.theta != null)
    .map(s => ({ name: s.dmu, score: +(s.theta * 100).toFixed(1), fill: s.efficient ? '#028090' : '#C47A2A' }))
    .sort((a,b) => b.score - a.score)

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Link to="/sessions" className="hover:text-teal">Sessions</Link>
            <span>›</span>
            <span className="text-gray-600">{id.slice(0,8)}…</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-navy">DEA Results</h1>
          <p className="text-gray-500 text-sm mt-1">
            {results?.model} Model · {results?.orientation}-oriented ·{' '}
            {summary.n_dmus} DMUs · {summary.n_inputs} inputs · {summary.n_outputs} outputs
          </p>
        </div>
        <Link to="/python" state={{ sessionId: id }}
          className="flex items-center gap-2 px-4 py-2 border border-teal text-teal rounded-lg text-sm font-medium hover:bg-teal/5 transition-colors">
          <span>{'{}'}</span> Open in Python
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label:'Mean Efficiency',  val: summary.mean_efficiency ? (summary.mean_efficiency*100).toFixed(1)+'%' : '—', color:'text-navy'   },
          { label:'Efficient DMUs',   val: `${summary.n_efficient} / ${summary.n_dmus}`,                                  color:'text-teal'   },
          { label:'Inefficient DMUs', val: summary.n_inefficient,                                                         color:'text-gold'   },
          { label:'Min Efficiency',   val: summary.min_efficiency ? (summary.min_efficiency*100).toFixed(1)+'%' : '—',   color:'text-red-500' },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">{c.label}</p>
            <p className={`text-2xl font-bold ${c.color}`}>{c.val}</p>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6">
        {TABS.map((t, i) => (
          <button key={i} onClick={() => setTab(i)}
            className={`flex-1 text-sm font-medium py-2 rounded-lg transition-all ${
              tab === i ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── Tab 0: Overview ── */}
      {tab === 0 && (
        <div className="space-y-6">
          {/* Overall verdict */}
          <div className="bg-navy text-white rounded-2xl p-6">
            <h2 className="text-lg font-serif font-bold mb-2">{interp.overall?.headline}</h2>
            <p className="text-blue-100 text-sm leading-relaxed">{interp.overall?.finding}</p>
            <p className="text-blue-200 text-sm mt-3 italic">{interp.overall?.mean_efficiency_plain}</p>
          </div>

          {/* Efficiency bar chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold text-navy mb-4">Efficiency Scores by DMU</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top:5, right:20, left:0, bottom:5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize:11 }} />
                <YAxis domain={[0,100]} tickFormatter={v => v+'%'} tick={{ fontSize:11 }} />
                <Tooltip formatter={(v) => [v.toFixed(1)+'%', 'Efficiency Score']} />
                {/* Reference line at 100% */}
                <Bar dataKey="score" radius={[4,4,0,0]}>
                  {chartData.map((entry,i) => (
                    <Cell key={i} fill={entry.score >= 99.9 ? '#028090' : entry.score >= 80 ? '#C47A2A' : '#E53E3E'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-6 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-teal inline-block"></span> Efficient (100%)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-gold inline-block"></span> Moderately inefficient (80–99%)</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-500 inline-block"></span> Significantly inefficient (&lt;80%)</span>
            </div>
          </div>

          {/* Model note */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-blue-800"
            dangerouslySetInnerHTML={{ __html: interp.model_note || '' }} />
        </div>
      )}

      {/* ── Tab 1: DMU Details ── */}
      {tab === 1 && (
        <div className="space-y-3">
          {interp.dmu_interpretations?.map((d, i) => (
            <div key={d.dmu} className={`bg-white rounded-xl border overflow-hidden shadow-sm ${
              d.badge === 'efficient' ? 'border-teal/40' :
              d.badge === 'inefficient_high' ? 'border-amber-300' : 'border-red-200'
            }`}>
              <button className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(expanded === i ? null : i)}>
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold font-mono ${
                    d.badge === 'efficient' ? 'text-teal' :
                    d.badge === 'inefficient_high' ? 'text-amber-600' : 'text-red-500'
                  }`}>{d.score ? (d.score*100).toFixed(1)+'%' : '—'}</span>
                  <div>
                    <p className="font-semibold text-navy text-sm">{d.dmu}</p>
                    <p className="text-xs text-gray-500 mt-0.5 max-w-xl truncate">{d.headline}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {d.badge === 'efficient' && <span className="px-2.5 py-1 bg-teal/10 text-teal rounded-full text-xs font-semibold">Efficient ✓</span>}
                  <span className="text-gray-400 text-lg">{expanded===i ? '▲' : '▼'}</span>
                </div>
              </button>

              {expanded === i && (
                <div className="border-t border-gray-100 p-5 space-y-5">
                  <p className="text-sm text-gray-700 leading-relaxed">{d.detail}</p>

                  {d.scale_note && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 text-xs text-indigo-800">{d.scale_note}</div>
                  )}

                  {/* Improvement actions */}
                  {d.action && d.action.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Recommended Improvements</p>
                      <ul className="space-y-1.5">
                        {d.action.map((a, ai) => (
                          <li key={ai} className="flex items-start gap-2 text-sm text-gray-700">
                            <span className="text-teal mt-0.5">→</span> {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Targets table */}
                  {d.input_targets && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Input/Output Targets</p>
                      <div className="overflow-x-auto">
                        <table className="text-xs w-full border border-gray-200 rounded-lg overflow-hidden">
                          <thead className="bg-gray-50">
                            <tr>
                              {['Variable','Type','Current','Target','Change'].map(h => (
                                <th key={h} className="px-3 py-2 text-left text-gray-500 font-medium">{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {Object.entries(d.input_targets || {}).map(([k,target]) => {
                              const cur = d.input_current?.[k] || 0
                              const pct = cur > 0 ? ((target-cur)/cur*100).toFixed(1) : 0
                              return (
                                <tr key={k} className="bg-white">
                                  <td className="px-3 py-2 font-medium">{k}</td>
                                  <td className="px-3 py-2"><span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">Input</span></td>
                                  <td className="px-3 py-2 font-mono">{Number(cur).toFixed(2)}</td>
                                  <td className="px-3 py-2 font-mono font-semibold text-teal">{Number(target).toFixed(2)}</td>
                                  <td className={`px-3 py-2 font-mono text-xs ${pct < 0 ? 'text-red-500' : 'text-gray-500'}`}>{pct}%</td>
                                </tr>
                              )
                            })}
                            {Object.entries(d.output_targets || {}).map(([k,target]) => {
                              const cur = d.output_current?.[k] || 0
                              const pct = cur > 0 ? ((target-cur)/cur*100).toFixed(1) : 0
                              return (
                                <tr key={k} className="bg-white">
                                  <td className="px-3 py-2 font-medium">{k}</td>
                                  <td className="px-3 py-2"><span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-xs">Output</span></td>
                                  <td className="px-3 py-2 font-mono">{Number(cur).toFixed(2)}</td>
                                  <td className="px-3 py-2 font-mono font-semibold text-emerald-600">{Number(target).toFixed(2)}</td>
                                  <td className={`px-3 py-2 font-mono text-xs ${pct > 0 ? 'text-emerald-600' : 'text-gray-500'}`}>+{pct}%</td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Peers */}
                  {d.peers && d.peers.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Benchmark Peers (λ weights)</p>
                      <div className="flex flex-wrap gap-2">
                        {d.peers.map(p => (
                          <span key={p.dmu} className="px-3 py-1.5 bg-navy/10 text-navy rounded-lg text-xs font-medium">
                            {p.dmu} <span className="text-teal font-mono ml-1">λ={p.weight}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Tab 2: Benchmarks ── */}
      {tab === 2 && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h3 className="font-semibold text-navy mb-2">{interp.benchmark_insight?.headline}</h3>
            <p className="text-sm text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: interp.benchmark_insight?.text || '' }} />
          </div>

          {/* Scale efficiency table if BCC */}
          {results?.scale_efficiency && (
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-navy mb-4">Scale Efficiency Decomposition</h3>
              <p className="text-xs text-gray-500 mb-4">SE = OTE (CCR) ÷ PTE (BCC). SE &lt; 1 indicates scale inefficiency.</p>
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {['DMU','OTE (CCR)','PTE (BCC)','Scale Efficiency','Interpretation'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {Object.entries(results.scale_efficiency).map(([dmu, data]) => (
                    <tr key={dmu} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-navy">{dmu}</td>
                      <td className="px-4 py-3 font-mono text-sm">{(data.OTE_CCR*100).toFixed(1)}%</td>
                      <td className="px-4 py-3 font-mono text-sm">{(data.PTE_BCC*100).toFixed(1)}%</td>
                      <td className={`px-4 py-3 font-mono text-sm font-semibold ${data.SE >= 0.9999 ? 'text-teal' : 'text-amber-600'}`}>
                        {(data.SE*100).toFixed(1)}%
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {data.SE >= 0.9999 ? 'Most productive scale' :
                         data.OTE_CCR < data.PTE_BCC ? 'Scale inefficiency present' : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Tab 3: Teaching Points ── */}
      {tab === 3 && (
        <div className="space-y-4">
          {interp.teaching_points?.map((pt, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h3 className="font-semibold text-navy mb-3 flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-teal/10 text-teal flex items-center justify-center text-sm">{i+1}</span>
                {pt.title}
              </h3>
              <p className="text-sm text-gray-700 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: pt.text }} />
            </div>
          ))}
        </div>
      )}

      {/* ── Tab 4: Raw Data ── */}
      {tab === 4 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
            <h3 className="font-semibold text-navy">Raw Scores &amp; Lambda Weights</h3>
            <button onClick={() => {
              const csv = ['DMU,Score,Efficient,' + results.input_names.map(n=>'Input_'+n).join(',') + ',' + results.output_names.map(n=>'Output_'+n).join(',')]
              scores.forEach(s => {
                const inputs = results.input_names.map(n => s.input_current?.[n] ?? '').join(',')
                const outputs = results.output_names.map(n => s.output_current?.[n] ?? '').join(',')
                csv.push(`${s.dmu},${s.theta},${s.efficient ? 'Yes':'No'},${inputs},${outputs}`)
              })
              const blob = new Blob([csv.join('\n')], {type:'text/csv'})
              const a = document.createElement('a')
              a.href = URL.createObjectURL(blob)
              a.download = `dea_results_${id}.csv`
              a.click()
            }} className="text-xs px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              ↓ Export CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-navy text-white">
                <tr>
                  <th className="px-4 py-3 text-left">DMU</th>
                  <th className="px-4 py-3 text-left">θ Score</th>
                  <th className="px-4 py-3 text-left">Efficient?</th>
                  {results.input_names?.map(n => <th key={n} className="px-4 py-3 text-left">{n} (Input)</th>)}
                  {results.output_names?.map(n => <th key={n} className="px-4 py-3 text-left">{n} (Output)</th>)}
                  <th className="px-4 py-3 text-left">Peers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {scores.map(s => (
                  <tr key={s.dmu} className={s.efficient ? 'bg-teal/5' : ''}>
                    <td className="px-4 py-3 font-semibold text-navy">{s.dmu}</td>
                    <td className={`px-4 py-3 font-mono font-bold ${s.efficient ? 'text-teal' : 'text-amber-600'}`}>
                      {s.theta ? (s.theta*100).toFixed(2)+'%' : '—'}
                    </td>
                    <td className="px-4 py-3">{s.efficient ? '✓ Yes' : 'No'}</td>
                    {results.input_names?.map(n => <td key={n} className="px-4 py-3 font-mono">{s.input_current?.[n] ?? '—'}</td>)}
                    {results.output_names?.map(n => <td key={n} className="px-4 py-3 font-mono">{s.output_current?.[n] ?? '—'}</td>)}
                    <td className="px-4 py-3 text-gray-500">
                      {s.peers?.map(p => `${p.dmu}(${p.weight})`).join(', ') || 'self'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
