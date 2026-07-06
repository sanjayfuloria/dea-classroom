import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm]     = useState({ name:'', email:'', password:'', role:'student' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)

  function update(field, val) { setForm(f => ({ ...f, [field]: val })) }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      await register(form.email, form.password, form.name, form.role)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans p-8">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        <div className="text-2xl font-serif font-bold text-navy mb-1">Create your account</div>
        <p className="text-gray-500 text-sm mb-8">Join DEA·Lab at IFHE Hyderabad</p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
            <input type="text" required value={form.name} onChange={e => update('name', e.target.value)}
              placeholder="Dr. Anand Sharma"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
            <input type="email" required value={form.email} onChange={e => update('email', e.target.value)}
              placeholder="you@ifhehyd.ac.in"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input type="password" required value={form.password} onChange={e => update('password', e.target.value)}
              placeholder="Minimum 6 characters"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal" />
          </div>

          {/* Role selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">I am a…</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value:'student', label:'Student', emoji:'📚', desc:'MBA programme' },
                { value:'faculty', label:'Faculty', emoji:'🎓', desc:'Course instructor' },
              ].map(r => (
                <button key={r.value} type="button" onClick={() => update('role', r.value)}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    form.role === r.value
                      ? 'border-teal bg-teal/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <div className="text-2xl mb-1">{r.emoji}</div>
                  <div className="font-semibold text-sm text-gray-900">{r.label}</div>
                  <div className="text-xs text-gray-500">{r.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full bg-navy text-white py-2.5 rounded-lg font-medium text-sm hover:bg-navy-light transition-colors disabled:opacity-50">
            {loading ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-teal font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
