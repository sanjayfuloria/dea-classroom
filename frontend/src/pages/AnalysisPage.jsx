import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { listDatasets, getDataset } from '../engine/datasets'
import { runDEA } from '../engine/solver'
import { interpretResults } from '../engine/interpreter'
import { saveSession, getUploadedDatasets } from '../utils/api'
import Papa from 'papaparse'

const STEP_LABELS = ['Choose Data', 'Configure Variables', 'Set Model']

export default function AnalysisPage() {
  const navigate   = useNavigate()
  const [params]   = useSearchParams()
  const fileRef    = useRef()

  const [step, setStep]               = useState(0)
  const [builtins, setBuiltins]       = useState([])
  const [uploaded, setUploaded]       = useState([])
  const [selectedId, setSelectedId]   = useState(null)
  const [rawData, setRawData]         = useState(null)   // array of row objects
  const [columns, setColumns]         = useState([])
  const [preview, setPreview]         = useState([])
  const [dmuCol, setDmuCol]           = useState('DMU')
  const [inputCols, setInputCols]     = useState([])
  const [outputCols, setOutputCols]   = useState([])
  const [model, setModel]             = useState('CCR')
  const [orientation, setOrientation] = useState('input')
  const [running, setRunning]         = useState(false)
  const [error, setError]             = useState('')

  useEffect(() => {
    setBuiltins(listDatasets())
    getUploadedDatasets().then(setUploaded).catch(() => {})
    const preset = params.get('dataset')
    if (preset) loadBuiltinDataset(preset)
  }, [])

  function loadBuiltinDataset(id) {
    const ds = getDataset(id)
    if (!ds) return
    setSelectedId(id)
    setRawData(ds.data)
    const cols = Object.keys(ds.data[0])
    setColumns(cols)
    setPreview(ds.data.slice(0, 6))
    setDmuCol(cols[0])
    setInputCols(ds.input_cols)
    setOutputCols(ds.output_cols)
    setModel(ds.suggested_model || 'CCR')
    setOrientation(ds.suggested_orientation || 'input')
    if (step === 0) setStep(1)
  }

  function handleFileSelect(e) {
    const file = e.target.files[0]
    if (!file) return
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: ({ data, meta }) => {
        if (!data.length) { setError('File is empty'); return }
        // Convert numeric strings to numbers
        const parsed = data.map(row =>
          Object.fromEntries(Object.entries(row).map(([k, v]) => {
            const n = parseFloat(v); return [k, isNaN(n) ? v : n]
          }))
        )
        setRawData(parsed)
        setColumns(meta.fields)
        setPreview(parsed.slice(0, 6))
        setDmuCol(meta.fields[0])
        setInputCols([]); setOutputCols([])
        setSelectedId('__uploaded__')
        setStep(1)
      },
      error: () => setError('Could not parse CSV. Ensure it is a valid comma-separated file.'),
    })
  }

  function toggleCol(col, list, setList, other) {
    if (col === dmuCol || other.includes(col)) return
    setList(list.includes(col) ? list.filter(c => c !== col) : [...list, col])
  }

  async function runAnalysis() {
    if (!inputCols.length || !outputCols.length) { setError('Select at least one input and one output'); return }
    setRunning(true); setError('')
    try {
      const dmuNames = rawData.map(r => String(r[dmuCol]))
      const X = rawData.map(r => inputCols.map(c => parseFloat(r[c])))
      const Y = rawData.map(r => outputCols.map(c => parseFloat(r[c])))

      if (X.flat().some(v => isNaN(v) || v <= 0)) throw new Error('All input values must be positive numbers (> 0)')
      if (Y.flat().some(v => isNaN(v) || v <= 0)) throw new Error('All output values must be positive numbers (> 0)')

      const results = runDEA({ dmuNames, X, Y, inputNames: inputCols, outputNames: outputCols, model, orientation })
      const interpretation = interpretResults(results)

      const sessionId = await saveSession({
        datasetId: selectedId,
        model, orientation,
        inputCols, outputCols,
        results, interpretation,
        userName: '',
      })
      navigate(`/results/${sessionId}`)
    } catch (e) {
      setError(e.message || 'Analysis failed')
    } finally {
      setRunning(false)
    }
  }

  const sampleSize = rawData?.length || 0
  const minRequired = 3 * (inputCols.length + outputCols.length)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-serif font-bold text-navy mb-2">New DEA Analysis</h1>
      <p className="text-gray-500 text-sm mb-8">All computation runs in your browser — nothing is sent to a server.</p>

      {/* Stepper */}
      <div className="flex items-center gap-0 mb-10">
        {STEP_LABELS.map((label, i) => (
          <div key={i} className="flex items-center">
            <button onClick={() => i <= step && setStep(i)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                i === step ? 'bg-navy text-white' : i < step ? 'bg-teal/20 text-teal cursor-pointer hover:bg-teal/30' : 'text-gray-400 cursor-not-allowed'
              }`}>
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                i < step ? 'bg-teal text-white' : i === step ? 'bg-white text-navy' : 'bg-gray-200 text-gray-500'
              }`}>{i < step ? '✓' : i+1}</span>
              {label}
            </button>
            {i < STEP_LABELS.length-1 && <div className="w-8 h-px bg-gray-300 mx-1" />}
          </div>
        ))}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">{error}</div>}

      {/* Step 0 */}
      {step === 0 && (
        <div>
          <h2 className="text-lg font-semibold text-navy mb-4">Choose a Dataset</h2>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {builtins.map(ds => (
              <button key={ds.id} onClick={() => loadBuiltinDataset(ds.id)}
                className={`p-4 rounded-xl border-2 text-left transition-all hover:shadow-md ${selectedId===ds.id ? 'border-teal bg-teal/5' : 'border-gray-200 hover:border-gray-300'}`}>
                <div className="text-2xl mb-2">{ds.emoji}</div>
                <div className="font-semibold text-sm text-navy">{ds.name}</div>
                <div className="text-xs text-gray-500 mt-0.5">{ds.n_dmus} DMUs · {ds.n_inputs} inputs · {ds.n_outputs} outputs</div>
                <span className="text-xs px-2 py-0.5 bg-navy/10 text-navy rounded mt-2 inline-block">{ds.sector}</span>
              </button>
            ))}
          </div>
          {/* Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-teal transition-colors cursor-pointer"
            onClick={() => fileRef.current.click()}>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
            <div className="text-4xl mb-3">📤</div>
            <div className="font-semibold text-gray-700">Upload your own dataset (CSV)</div>
            <div className="text-sm text-gray-400 mt-1">First row = column headers · First column = DMU names · All values must be positive numbers</div>
          </div>
        </div>
      )}

      {/* Step 1 */}
      {step === 1 && (
        <div>
          <h2 className="text-lg font-semibold text-navy mb-4">Configure Variables</h2>
          {preview.length > 0 && (
            <div className="mb-6 overflow-x-auto rounded-xl border border-gray-200">
              <p className="text-xs text-gray-500 px-4 pt-3 pb-1">Data preview (first 6 rows)</p>
              <table className="w-full text-xs">
                <thead className="bg-navy text-white"><tr>{columns.map(c => <th key={c} className="px-3 py-2 text-left font-medium">{c}</th>)}</tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {preview.map((row, i) => (
                    <tr key={i} className={i%2===0?'bg-white':'bg-gray-50'}>
                      {columns.map(c => <td key={c} className="px-3 py-1.5 font-mono">{String(row[c]??'')}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">DMU Name Column</label>
              <select value={dmuCol} onChange={e => setDmuCol(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-teal focus:outline-none">
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Input Columns <span className="font-normal text-gray-400">(resources used)</span></label>
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {columns.filter(c=>c!==dmuCol).map(c => (
                  <label key={c} className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer text-sm transition-colors ${inputCols.includes(c)?'bg-blue-50 text-blue-700':outputCols.includes(c)?'bg-gray-100 text-gray-400 cursor-not-allowed':'hover:bg-gray-50'}`}>
                    <input type="checkbox" checked={inputCols.includes(c)} onChange={() => toggleCol(c, inputCols, setInputCols, outputCols)} />
                    {c}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy mb-2">Output Columns <span className="font-normal text-gray-400">(services produced)</span></label>
              <div className="space-y-1 max-h-52 overflow-y-auto">
                {columns.filter(c=>c!==dmuCol).map(c => (
                  <label key={c} className={`flex items-center gap-2 px-3 py-2 rounded cursor-pointer text-sm transition-colors ${outputCols.includes(c)?'bg-emerald-50 text-emerald-700':inputCols.includes(c)?'bg-gray-100 text-gray-400 cursor-not-allowed':'hover:bg-gray-50'}`}>
                    <input type="checkbox" checked={outputCols.includes(c)} onChange={() => toggleCol(c, outputCols, setOutputCols, inputCols)} />
                    {c}
                  </label>
                ))}
              </div>
            </div>
          </div>
          {sampleSize > 0 && inputCols.length > 0 && outputCols.length > 0 && (
            <div className={`mt-4 p-3 rounded-lg text-xs ${sampleSize >= minRequired ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-amber-50 border border-amber-200 text-amber-800'}`}>
              {sampleSize >= minRequired ? '✓' : '⚠'} {sampleSize} DMUs · {inputCols.length} inputs · {outputCols.length} outputs.
              Recommended minimum: {minRequired} DMUs.
              {sampleSize < minRequired && ' Some DMUs may score 1.0 trivially.'}
            </div>
          )}
          <button onClick={() => { if(inputCols.length && outputCols.length) setStep(2) }}
            disabled={!inputCols.length || !outputCols.length}
            className="mt-6 bg-navy text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-navy-light disabled:opacity-40 transition-colors">
            Continue →
          </button>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div>
          <h2 className="text-lg font-semibold text-navy mb-6">Select DEA Model</h2>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Returns to Scale Assumption</p>
              {[
                { v:'CCR', label:'CCR — Constant Returns to Scale', sub:'Best when all DMUs operate at similar scale (Charnes, Cooper & Rhodes, 1978)' },
                { v:'BCC', label:'BCC — Variable Returns to Scale', sub:'Best when DMUs vary significantly in size (Banker, Charnes & Cooper, 1984)' },
              ].map(opt => (
                <label key={opt.v} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer mb-3 transition-all ${model===opt.v?'border-navy bg-navy/5':'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="model" value={opt.v} checked={model===opt.v} onChange={()=>setModel(opt.v)} className="mt-1" />
                  <div><div className="font-semibold text-sm">{opt.label}</div><div className="text-xs text-gray-500 mt-0.5">{opt.sub}</div></div>
                </label>
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">Orientation</p>
              {[
                { v:'input',  label:'Input-Oriented',  sub:'How much can inputs be reduced while maintaining current outputs?' },
                { v:'output', label:'Output-Oriented', sub:'How much can outputs be expanded while keeping inputs fixed?' },
              ].map(opt => (
                <label key={opt.v} className={`flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer mb-3 transition-all ${orientation===opt.v?'border-teal bg-teal/5':'border-gray-200 hover:border-gray-300'}`}>
                  <input type="radio" name="orientation" value={opt.v} checked={orientation===opt.v} onChange={()=>setOrientation(opt.v)} className="mt-1" />
                  <div><div className="font-semibold text-sm">{opt.label}</div><div className="text-xs text-gray-500 mt-0.5">{opt.sub}</div></div>
                </label>
              ))}
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6 text-sm text-gray-700">
            Running <strong>{model}</strong> ({model==='CCR'?'Constant':'Variable'} Returns to Scale), <strong>{orientation}-oriented</strong> DEA on{' '}
            <strong>{inputCols.join(', ')}</strong> → <strong>{outputCols.join(', ')}</strong> for <strong>{rawData?.length} DMUs</strong>.
          </div>
          <div className="flex gap-3">
            <button onClick={()=>setStep(1)} className="px-6 py-2.5 rounded-lg text-sm font-medium border border-gray-300 hover:bg-gray-50 transition-colors">← Back</button>
            <button onClick={runAnalysis} disabled={running}
              className="bg-teal text-white px-8 py-2.5 rounded-lg text-sm font-medium hover:bg-teal-dark transition-colors disabled:opacity-50 flex items-center gap-2">
              {running ? <><span className="animate-spin">⟳</span> Computing…</> : '▶ Run Analysis'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
