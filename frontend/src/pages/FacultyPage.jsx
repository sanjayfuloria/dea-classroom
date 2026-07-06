import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getAllSessions, getCourses, createCourse } from '../utils/api'

export default function FacultyPage() {
  const { profile } = useAuth()
  const [students, setStudents] = useState([])
  const [courses, setCourses]   = useState([])
  const [newCourse, setNewCourse] = useState('')
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getAllSessions().catch(()=>[]),
      getCourses(profile?.uid||'').catch(()=>[]),
    ]).then(([s,c])=>{ setStudents(s); setCourses(c) }).finally(()=>setLoading(false))
  }, [])

  async function handleCreateCourse() {
    if (!newCourse.trim()) return
    const c = await createCourse(newCourse, '', profile?.uid||'')
    setCourses(prev=>[...prev, c]); setNewCourse('')
  }

  const byUser = students.reduce((acc,s)=>{
    const uid=s.userId; if(!acc[uid]) acc[uid]={name:s.userName||'Student',sessions:[]}
    acc[uid].sessions.push(s); return acc
  },{})

  const meanEff = students.filter(s=>s.results?.summary?.mean_efficiency)
  const avgEff  = meanEff.length ? meanEff.reduce((a,s)=>a+s.results.summary.mean_efficiency,0)/meanEff.length : 0

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-3xl font-serif font-bold text-navy">Faculty Panel</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of all student analyses and course management</p>
        </div>
        <Link to="/analysis" className="bg-teal text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-dark transition-colors">+ New Analysis</Link>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { label:'Total Sessions',    value:students.length,             icon:'◎', color:'text-navy' },
          { label:'Active Students',   value:Object.keys(byUser).length,  icon:'👤', color:'text-teal' },
          { label:'Class Avg Efficiency', value:`${(avgEff*100).toFixed(1)}%`, icon:'⬆', color:'text-gold' },
          { label:'Courses',           value:courses.length,              icon:'📚', color:'text-indigo-600' },
        ].map(s=>(
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-2">{s.label}</p>
            <div className="flex items-center gap-2"><span className="text-xl">{s.icon}</span><span className={`text-2xl font-bold ${s.color}`}>{s.value}</span></div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 w-fit">
        {[['overview','Student Activity'],['courses','Courses']].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${tab===id?'bg-white text-navy shadow-sm':'text-gray-500 hover:text-gray-700'}`}>{label}</button>
        ))}
      </div>

      {tab==='overview' && (
        <div className="space-y-4">
          {Object.entries(byUser).length===0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200 text-gray-500">No student sessions yet.</div>
          ) : Object.entries(byUser).map(([uid,u])=>(
            <div key={uid} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-navy rounded-full flex items-center justify-center text-white text-xs font-bold">{(u.name||'U').charAt(0).toUpperCase()}</div>
                  <div><p className="font-semibold text-navy text-sm">{u.name}</p><p className="text-xs text-gray-400">{u.sessions.length} session{u.sessions.length>1?'s':''}</p></div>
                </div>
              </div>
              <table className="w-full text-xs">
                <thead><tr className="text-left text-gray-400 border-b border-gray-100">{['Dataset','Model','Avg Efficiency','Date',''].map(h=><th key={h} className="px-5 py-2 font-medium">{h}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {u.sessions.slice(0,5).map(s=>(
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-5 py-2 font-medium">{s.datasetId}</td>
                      <td className="px-5 py-2"><span className="px-1.5 py-0.5 bg-navy/10 text-navy rounded font-mono">{s.model}</span></td>
                      <td className="px-5 py-2 font-mono">{s.results?.summary?.mean_efficiency?(s.results.summary.mean_efficiency*100).toFixed(1)+'%':'—'}</td>
                      <td className="px-5 py-2 text-gray-400">{s.createdAt?.toDate?.()?.toLocaleDateString('en-IN')||'—'}</td>
                      <td className="px-5 py-2"><Link to={`/results/${s.id}`} className="text-teal font-medium hover:underline">View →</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {tab==='courses' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="font-semibold text-navy mb-3">Create a Course</h3>
            <div className="flex gap-3">
              <input value={newCourse} onChange={e=>setNewCourse(e.target.value)}
                placeholder="e.g. MBA Service Operations — Batch 2025"
                className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
                onKeyDown={e=>e.key==='Enter'&&handleCreateCourse()} />
              <button onClick={handleCreateCourse} className="bg-navy text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-navy-light transition-colors">Create</button>
            </div>
          </div>
          {courses.length===0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200 text-gray-500 text-sm">No courses yet.</div>
          ) : courses.map(c=>(
            <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex items-center justify-between">
              <div><p className="font-semibold text-navy">{c.title}</p><p className="text-xs text-gray-400 mt-0.5">{c.enrolledStudents?.length||0} students enrolled</p></div>
              <div className="text-xs text-gray-400 font-mono">{c.id?.slice(0,8)}…</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
