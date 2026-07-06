import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getMySessions } from '../utils/api'

export default function SessionsPage() {
  const [sessions, setSessions] = useState([])
  const [loading, setLoading]   = useState(true)
  useEffect(() => { getMySessions().then(setSessions).catch(()=>{}).finally(()=>setLoading(false)) }, [])
  if (loading) return <div className="p-8 text-gray-500">Loading sessions…</div>

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-navy">My Sessions</h1>
          <p className="text-gray-500 text-sm mt-1">All your DEA analyses — click any row to view full results</p>
        </div>
        <Link to="/analysis" className="bg-navy text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors">+ New Analysis</Link>
      </div>
      {sessions.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-200">
          <div className="text-5xl mb-4">◎</div>
          <h2 className="text-lg font-semibold text-navy mb-2">No analyses yet</h2>
          <p className="text-gray-500 text-sm mb-6">Run your first DEA analysis to see results here.</p>
          <Link to="/analysis" className="bg-teal text-white px-6 py-2.5 rounded-lg text-sm font-medium">Start Analysis</Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>{['Dataset','Model','Avg Efficiency','Efficient DMUs','Date',''].map(h=>(
                <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sessions.map(s=>(
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4 font-medium text-navy">{s.datasetId}</td>
                  <td className="px-5 py-4"><span className="px-2 py-0.5 bg-navy/10 text-navy rounded font-mono text-xs">{s.model}</span></td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-teal rounded-full" style={{width:`${(s.results?.summary?.mean_efficiency||0)*100}%`}} />
                      </div>
                      <span className="font-mono text-xs">{s.results?.summary?.mean_efficiency?(s.results.summary.mean_efficiency*100).toFixed(1)+'%':'—'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs">{s.results?.summary?.n_efficient??'—'}</td>
                  <td className="px-5 py-4 text-gray-400 text-xs">{s.createdAt?.toDate?.()?.toLocaleDateString('en-IN')||'—'}</td>
                  <td className="px-5 py-4"><Link to={`/results/${s.id}`} className="text-teal text-xs font-medium hover:underline">View →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
