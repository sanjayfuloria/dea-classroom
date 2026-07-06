import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Editor from '@monaco-editor/react'
import { savePythonRun } from '../utils/api'

// Pyodide — Python 3.11 running as WebAssembly in the browser
// scipy, numpy, pandas all available — zero server needed
const PYODIDE_URL = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js'

const SNIPPETS = [
  {
    label: 'Run CCR on Tutorial Data',
    code: `import numpy as np
from scipy.optimize import linprog

# Bank branches tutorial dataset (IFHE MBA course)
dmu_names = ['Branch A','Branch B','Branch C','Branch D','Branch E']
X = np.array([[5,15],[8,20],[4,12],[10,28],[6,16]], dtype=float)
Y = np.array([[120,24],[150,25],[100,18],[160,22],[130,26]], dtype=float)

print("=== CCR Input-Oriented DEA ===\\n")
results = []
for i, dmu in enumerate(dmu_names):
    x0, y0 = X[i], Y[i]
    n, m, s = len(X), X.shape[1], Y.shape[1]
    c = np.zeros(n+1); c[0] = 1.0
    A_inp = np.hstack([-x0.reshape(-1,1), X.T])
    A_out = np.hstack([np.zeros((s,1)), -Y.T])
    A_ub = np.vstack([A_inp, A_out])
    b_ub = np.concatenate([np.zeros(m), -y0])
    r = linprog(c, A_ub=A_ub, b_ub=b_ub, bounds=[(0,None)]*(n+1), method='highs')
    theta = r.x[0]; lam = r.x[1:]
    results.append((dmu, theta, lam))
    flag = "✓ Efficient" if theta > 0.9999 else f"✗ {round((1-theta)*100,1)}% inefficient"
    print(f"  {dmu:12s}  θ = {theta:.4f}   {flag}")

print(f"\\nMean efficiency: {np.mean([r[1] for r in results]):.4f}")
print(f"Efficient DMUs:  {[r[0] for r in results if r[1]>0.9999]}")
`,
  },
  {
    label: 'Manual LP for Branch D',
    code: `from scipy.optimize import linprog
import numpy as np

# Step-by-step LP for Branch D (the most inefficient branch)
X = np.array([[5,15],[8,20],[4,12],[10,28],[6,16]], dtype=float)
Y = np.array([[120,24],[150,25],[100,18],[160,22],[130,26]], dtype=float)
x0 = X[3]  # Branch D inputs:  10 staff, Rs28L cost
y0 = Y[3]  # Branch D outputs: 160 loans, Rs22Cr deposits
n = 5

print("Branch D LP:")
print(f"  Minimise θ")
print(f"  Input constraints:  Xλ ≤ θ × {x0.tolist()}")
print(f"  Output constraints: Yλ ≥ {y0.tolist()}")
print()

c = np.zeros(n+1); c[0] = 1.0
A_inp = np.hstack([-x0.reshape(-1,1), X.T])
A_out = np.hstack([np.zeros((2,1)), -Y.T])
A_ub = np.vstack([A_inp, A_out])
b_ub = np.concatenate([np.zeros(2), -y0])

r = linprog(c, A_ub=A_ub, b_ub=b_ub, bounds=[(0,None)]*6, method='highs')
theta = r.x[0]; lam = r.x[1:]

print(f"Optimal θ* = {theta:.4f}  ({round((1-theta)*100,2)}% inefficient)")
print(f"Lambda weights: {dict(zip(['A','B','C','D','E'], lam.round(4)))}")
print()
print("Two-stage improvement targets for Branch D:")
print(f"  Stage 1 (radial): Staff = {x0[0]}×{theta:.3f} = {x0[0]*theta:.2f} FTEs")
print(f"  Stage 1 (radial): Cost  = ₹{x0[1]}L×{theta:.3f} = ₹{x0[1]*theta:.2f}L")
s_inp = x0 * theta - X.T @ lam
s_out = Y.T @ lam - y0
print(f"  Stage 2 (slacks): Staff slack = {s_inp[0]:.4f}, Cost slack = {s_inp[1]:.4f}")
print(f"  Final targets: Staff = {x0[0]*theta - s_inp[0]:.2f} FTEs, Cost = ₹{x0[1]*theta - s_inp[1]:.2f}L")
`,
  },
  {
    label: 'BCC + Scale Efficiency',
    code: `from scipy.optimize import linprog
import numpy as np

X = np.array([[5,15],[8,20],[4,12],[10,28],[6,16]], dtype=float)
Y = np.array([[120,24],[150,25],[100,18],[160,22],[130,26]], dtype=float)
dmu_names = ['Branch A','Branch B','Branch C','Branch D','Branch E']

def run_dea(X, Y, vrs=False):
    scores = []
    for i in range(len(X)):
        x0, y0 = X[i], Y[i]; n=len(X); m=X.shape[1]; s=Y.shape[1]
        c = np.zeros(n+1); c[0]=1.0
        A_ub = np.vstack([np.hstack([-x0.reshape(-1,1),X.T]),
                          np.hstack([np.zeros((s,1)),-Y.T])])
        b_ub = np.concatenate([np.zeros(m),-y0])
        A_eq = np.hstack([[0],np.ones(n)]).reshape(1,-1) if vrs else None
        b_eq = np.array([1.]) if vrs else None
        r = linprog(c, A_ub=A_ub, b_ub=b_ub, A_eq=A_eq, b_eq=b_eq,
                    bounds=[(0,None)]*(n+1), method='highs')
        scores.append(r.x[0])
    return np.array(scores)

ccr = run_dea(X, Y, vrs=False)
bcc = run_dea(X, Y, vrs=True)
se  = ccr / bcc

print(f"{'DMU':<12} {'CCR (OTE)':<12} {'BCC (PTE)':<12} {'Scale Eff':<12} {'Interpretation'}")
print('-'*65)
for i, dmu in enumerate(dmu_names):
    interp = 'Optimal scale' if se[i] > 0.9999 else f'Scale inefficiency ({round((1-se[i])*100,1)}%)'
    print(f"{dmu:<12} {ccr[i]:<12.4f} {bcc[i]:<12.4f} {se[i]:<12.4f} {interp}")
print()
print("Formula: Scale Efficiency (SE) = OTE (CCR) ÷ PTE (BCC)")
print("SE < 1 → DMU not operating at its most productive scale size")
`,
  },
  {
    label: 'Malmquist Productivity Index',
    code: `from scipy.optimize import linprog
import numpy as np

def dmu_score(x0, y0, X, Y):
    n=len(X); m=len(x0); s=len(y0); c=np.zeros(n+1); c[0]=1.0
    A_ub=np.vstack([np.hstack([-x0.reshape(-1,1),X.T]),np.hstack([np.zeros((s,1)),-Y.T])])
    b_ub=np.concatenate([np.zeros(m),-y0])
    r=linprog(c,A_ub=A_ub,b_ub=b_ub,bounds=[(0,None)]*(n+1),method='highs')
    return r.x[0] if r.status==0 else 1.0

# Two periods — before and after a policy change
dmu_names = ['Bank A','Bank B','Bank C','Bank D']
X1 = np.array([[10,100],[8,80],[12,110],[9,90]],dtype=float)
Y1 = np.array([[50,20],[45,18],[55,22],[48,19]],dtype=float)
X2 = np.array([[9,95],[7,75],[11,105],[10,100]],dtype=float)
Y2 = np.array([[55,25],[50,22],[58,24],[45,18]],dtype=float)

print(f"{'DMU':<10} {'D_tt':<8} {'D_t+1,t+1':<12} {'EC':<8} {'TC':<8} {'MPI':<8} {'Change'}")
print('-'*65)
for i, dmu in enumerate(dmu_names):
    d_tt   = dmu_score(X1[i],Y1[i],X1,Y1)
    d_t1t1 = dmu_score(X2[i],Y2[i],X2,Y2)
    d_tt1  = dmu_score(X2[i],Y2[i],X1,Y1)
    d_t1t  = dmu_score(X1[i],Y1[i],X2,Y2)
    ec  = d_t1t1/d_tt
    tc  = np.sqrt((d_tt1/d_t1t1)*(d_tt/d_t1t))
    mpi = ec * tc
    print(f"{dmu:<10} {d_tt:<8.3f} {d_t1t1:<12.3f} {ec:<8.3f} {tc:<8.3f} {mpi:<8.3f} {'↑' if mpi>1 else '↓'}")

print("\\nMPI = EC × TC")
print("EC > 1 → catching up to frontier (managerial improvement)")
print("TC > 1 → frontier shifted outward (technological progress)")
`,
  },
]

export default function PythonPage() {
  const location = useLocation()
  const sessionId = location.state?.sessionId || null

  const [code, setCode]       = useState(SNIPPETS[0].code)
  const [output, setOutput]   = useState('')
  const [error, setError]     = useState('')
  const [running, setRunning] = useState(false)
  const [pyReady, setPyReady] = useState(false)
  const [pyLoading, setPyLoading] = useState(false)
  const [history, setHistory] = useState([])
  const pyodideRef = useRef(null)
  const outputRef  = useRef()

  async function loadPyodide() {
    if (pyodideRef.current || pyLoading) return
    setPyLoading(true)
    try {
      // Dynamically load Pyodide from CDN
      if (!window.loadPyodide) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = PYODIDE_URL
          script.onload = resolve
          script.onerror = reject
          document.head.appendChild(script)
        })
      }
      const py = await window.loadPyodide({ indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/' })
      await py.loadPackage(['numpy', 'scipy'])
      pyodideRef.current = py
      setPyReady(true)
    } catch (e) {
      setError('Failed to load Python runtime. Check your internet connection.')
    } finally {
      setPyLoading(false)
    }
  }

  useEffect(() => { loadPyodide() }, [])

  async function runCode() {
    if (!pyodideRef.current) { setError('Python runtime not ready yet.'); return }
    setRunning(true); setOutput(''); setError('')
    try {
      // Redirect stdout
      pyodideRef.current.runPython(`
import sys, io
_stdout = io.StringIO()
sys.stdout = _stdout
`)
      try {
        pyodideRef.current.runPython(code)
      } catch(e) {
        setError(String(e))
      }
      const out = pyodideRef.current.runPython(`
sys.stdout = sys.__stdout__
_stdout.getvalue()
`)
      setOutput(out || '(no output)')
      setHistory(h => [{ code: code.slice(0,80)+(code.length>80?'…':''), ok: !error }, ...h.slice(0,9)])
      await savePythonRun(sessionId, code, out, null).catch(()=>{})
      setTimeout(() => outputRef.current?.scrollIntoView({ behavior:'smooth' }), 100)
    } catch(e) {
      setError(String(e))
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-teal text-lg font-mono">{'{}'}</span>
          <div>
            <div className="text-white text-sm font-semibold">Python Console</div>
            <div className="text-gray-400 text-xs">
              {pyReady ? '🟢 Python 3.11 ready (numpy · scipy in browser)' : pyLoading ? '⏳ Loading Python runtime…' : '⭕ Python not loaded'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select className="bg-gray-700 text-gray-200 text-xs rounded-lg px-3 py-1.5 border border-gray-600 focus:outline-none"
            onChange={e => { if(e.target.value!=='') setCode(SNIPPETS[+e.target.value].code) }} defaultValue="">
            <option value="">Load example…</option>
            {SNIPPETS.map((s,i) => <option key={i} value={i}>{s.label}</option>)}
          </select>
          {!pyReady && !pyLoading && (
            <button onClick={loadPyodide} className="px-3 py-1.5 bg-yellow-600 text-white rounded-lg text-xs font-medium">Load Python</button>
          )}
          <button onClick={runCode} disabled={running || !pyReady}
            className="flex items-center gap-2 px-4 py-1.5 bg-teal text-white rounded-lg text-sm font-medium hover:bg-teal-dark disabled:opacity-50 transition-colors">
            {running ? <><span className="animate-spin text-xs">⟳</span> Running</> : '▶ Run'}
          </button>
          <span className="text-gray-500 text-xs px-2 py-1 bg-gray-700 rounded font-mono hidden lg:block">Ctrl+Enter</span>
        </div>
      </div>

      {/* Editor + Output */}
      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 border-r border-gray-700">
          <Editor
            height="100%"
            defaultLanguage="python"
            value={code}
            onChange={v => setCode(v || '')}
            theme="vs-dark"
            options={{ fontSize:13, fontFamily:'JetBrains Mono, Menlo, monospace', minimap:{enabled:false}, lineNumbers:'on', scrollBeyondLastLine:false, padding:{top:12,bottom:12}, wordWrap:'on' }}
            onMount={(editor, monaco) => {
              editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, runCode)
            }}
          />
        </div>

        {/* Output pane */}
        <div className="w-80 flex flex-col bg-gray-900 border-l border-gray-800">
          <div className="flex-1 overflow-y-auto p-4" ref={outputRef}>
            <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">Output</div>
            {!pyReady && (
              <div className="bg-gray-800 rounded-lg p-3 text-xs text-gray-400">
                {pyLoading
                  ? '⏳ Loading Python 3.11 + numpy + scipy (first load ~10 seconds)…'
                  : 'Click "Load Python" to initialise the runtime.'}
              </div>
            )}
            {error && <div className="bg-red-900/40 border border-red-800 rounded-lg p-3 mb-3 text-xs text-red-300 font-mono whitespace-pre-wrap">{error}</div>}
            {output && <pre className="text-xs text-green-300 font-mono whitespace-pre-wrap leading-relaxed">{output}</pre>}
            {pyReady && !output && !error && !running && <p className="text-gray-600 text-xs italic">Click ▶ Run to execute your code</p>}
          </div>

          {history.length > 0 && (
            <div className="border-t border-gray-700 p-3 max-h-36 overflow-y-auto">
              <div className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-2">History</div>
              {history.map((h,i) => (
                <div key={i} className="flex items-center gap-2 mb-1.5 px-2 py-1 rounded bg-gray-800 text-xs text-gray-400">
                  <span className={`w-1.5 h-1.5 rounded-full ${h.ok?'bg-green-400':'bg-red-400'}`} />
                  <span className="font-mono truncate">{h.code}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="px-4 py-1 bg-teal/90 text-white text-xs flex items-center gap-4 flex-shrink-0">
        <span>🆓 Runs entirely in your browser via WebAssembly</span>
        <span>·</span>
        <span>numpy · scipy.optimize.linprog (HiGHS)</span>
        <span>·</span>
        <span>No server · No cost</span>
        {sessionId && <><span>·</span><span className="text-yellow-200">Session: {sessionId.slice(0,8)}</span></>}
      </div>
    </div>
  )
}
