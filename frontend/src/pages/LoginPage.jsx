import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError('Invalid email or password. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex font-sans">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-navy p-12">
        <div>
          <div className="text-3xl font-serif font-bold text-white">DEA<span className="text-teal">·</span>Lab</div>
          <div className="text-sm text-blue-300 mt-1">IFHE Hyderabad</div>
        </div>
        <div>
          <blockquote className="text-xl font-serif text-blue-100 leading-relaxed italic">
            "Efficiency is doing things right; effectiveness is doing the right things."
          </blockquote>
          <p className="text-blue-400 text-sm mt-3">— Peter Drucker</p>
          <div className="mt-8 space-y-3">
            {['Interactive DEA computation', 'Live Python console', '6 built-in datasets', 'Faculty & student portals'].map(f => (
              <div key={f} className="flex items-center gap-2 text-blue-200 text-sm">
                <span className="text-teal">✓</span> {f}
              </div>
            ))}
          </div>
        </div>
        <div className="text-blue-500 text-xs">MBA · Service Operations Management · 3rd Semester</div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-serif font-bold text-navy mb-1">Sign in to DEA·Lab</h1>
          <p className="text-gray-500 text-sm mb-8">Enter your IFHE credentials to continue</p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <input
                type="email" required value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@ifhehyd.ac.in"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password" required value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-transparent"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full bg-navy text-white py-2.5 rounded-lg font-medium text-sm hover:bg-navy-light transition-colors disabled:opacity-50"
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            New to DEA·Lab?{' '}
            <Link to="/register" className="text-teal font-medium hover:underline">Create account</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
