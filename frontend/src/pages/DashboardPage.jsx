import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getMySessions } from '../utils/api'
import { listDatasets } from '../engine/datasets'

export default function DashboardPage() {
  const { profile, isFaculty } = useAuth()
  const [sessions, setSessions] = useState([])
  const datasets = listDatasets()

  useEffect(() => { getMySessions().then(setSessions).catch(()=>{}) }, [])

  const meanEff = sessions.filter(s=>s.results?.summary?.mean_efficiency)
  const avgEff  = meanEff.length ? meanEff.reduce((a,s)=>a+s.results.summary.mean_efficiency,0)/meanEff.length : null

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-navy">Welcome back, {profile?.name?.split(' ')[0]} 👋</h1>
        <p className="text-gray-500 mt-1 text-sm">
          {isFaculty ? 'Manage analyses, view student sessions, and run DEA from the Faculty Panel.' : 'Select a dataset below or upload your own to start a new DEA analysis.'}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label:'Analyses Run',   value: sessions.length,                                     icon:'◎' },
          { label:'Efficient DMUs', value: sessions.reduce((a,s)=>a+(s.results?.summary?.n_efficient||0),0), icon:'✓' },
          { label:'Avg Efficiency', value: avgEff ? (avgEff*100).toFixed(1)+'%' : '—',          icon:'⬆' },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.label}</span>
              <span className="text-teal text-lg">{stat.icon}</span>
            </div>
            <div className="text-2xl font-bold text-navy">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Zero-cost badge */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3 mb-8 flex items-center gap-3 text-sm text-emerald-800">
        <span className="text-xl">🆓</span>
        <div>
          <strong>100% free — no server, no bills.</strong> All DEA computation runs in your browser using WebAssembly. Results are saved to Firebase (free tier).
        </div>
      </div>

      {/* Dataset cards */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-navy">Built-in Datasets</h2>
          <Link to="/analysis" className="text-sm text-teal hover:underline font-medium">Upload your own CSV →</Link>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {datasets.map(ds => (
            <Link key={ds.id} to={`/analysis?dataset=${ds.id}`}
              className="block p-5 rounded-xl border-2 border-gray-200 hover:border-teal hover:shadow-md transition-all group">
              <div className="text-3xl mb-3">{ds.emoji}</div>
              <div className="font-semibold text-gray-900 group-hover:text-navy text-sm">{ds.name}</div>
              <div className="text-xs text-gray-500 mt-0.5">{ds.n_dmus} DMUs · {ds.n_inputs} inputs · {ds.n_outputs} outputs</div>
              <div className="text-xs text-teal mt-3 font-medium opacity-0 group-hover:opacity-100 transition-opacity">Run analysis →</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent sessions */}
      {sessions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-navy mb-4">Recent Analyses</h2>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>{['Dataset','Model','Avg Efficiency','Efficient DMUs','Date'].map(h=>(
                  <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessions.slice(0,5).map(s=>(
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-navy">{s.datasetId}</td>
                    <td className="px-5 py-3"><span className="px-2 py-0.5 bg-navy/10 text-navy rounded font-mono text-xs">{s.model}</span></td>
                    <td className="px-5 py-3 font-mono text-xs">{s.results?.summary?.mean_efficiency?(s.results.summary.mean_efficiency*100).toFixed(1)+'%':'—'}</td>
                    <td className="px-5 py-3 text-xs">{s.results?.summary?.n_efficient??'—'}</td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{s.createdAt?.toDate?.()?.toLocaleDateString('en-IN')||'—'}</td>
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
