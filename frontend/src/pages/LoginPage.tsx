import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getApiErrorMessage } from '../api/client'
import { Button, Input, Label } from '../components/ui'
import { ErrorBanner } from '../components/ErrorBanner'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [apiError, setApiError] = useState<{message:string; details?: any} | null>(null)
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const e: Record<string,string> = {}
    if (!form.email) e.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Enter a valid email'
    if (!form.password) e.password = 'Password is required'
    return e
  }

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const v = validate()
    if (Object.keys(v).length) { setErrors(v); return }
    setErrors({})
    setApiError(null)
    setLoading(true)
    try {
      await login(form.email.trim().toLowerCase(), form.password)
      navigate('/dashboard')
    } catch (err) {
      setApiError(getApiErrorMessage(err))
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left - form */}
      <div className="flex w-full lg:w-[48%] items-center justify-center p-6 lg:p-10 bg-white">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 grid place-items-center text-white font-bold">TF</div>
            <span className="font-bold text-lg">TaskFlow Pro</span>
          </Link>

          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="text-sm text-slate-500 mt-2">Sign in to your workspace to continue.</p>
            <div className="mt-3 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs text-indigo-700">
              Demo: <span className="font-mono font-medium">demo@taskflow.dev</span> / <span className="font-mono font-medium">Password123!</span>
            </div>
          </div>

          {apiError && <div className="mb-4"><ErrorBanner title="Login failed" message={apiError.message} details={apiError.details} /></div>}

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div>
              <Label htmlFor="email" required>Email</Label>
              <Input id="email" type="email" placeholder="you@company.com" autoComplete="email" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} error={errors.email} />
            </div>
            <div>
              <div className="flex items-center justify-between"><Label htmlFor="password" required>Password</Label><a className="text-xs text-indigo-600 hover:underline">Forgot?</a></div>
              <Input id="password" type="password" placeholder="••••••••" autoComplete="current-password" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} error={errors.password} />
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">{loading ? 'Signing in...' : 'Sign in'}</Button>

            <div className="relative my-4"><div className="absolute inset-0 flex items-center"><div className="w-full border-t"/></div><div className="relative flex justify-center"><span className="bg-white px-2 text-xs text-slate-400">or continue with</span></div></div>

            <div className="grid grid-cols-2 gap-3">
              <button type="button" className="h-9 rounded-lg border px-3 text-sm font-medium hover:bg-slate-50">SSO</button>
              <button type="button" className="h-9 rounded-lg border px-3 text-sm font-medium hover:bg-slate-50">GitHub</button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">Don't have an account? <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-700">Create one</Link></p>
          <p className="mt-2 text-center text-xs text-slate-400">By signing in you agree to our Terms & Privacy.</p>
        </div>
      </div>

      {/* Right - hero */}
      <div className="hidden lg:flex w-[52%] bg-gradient-to-br from-indigo-600 via-violet-600 to-indigo-800 p-10 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />
        <div className="relative flex flex-col justify-between w-full max-w-lg mx-auto">
          <div />
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs backdrop-blur"><span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"/> Trusted by 10k+ remote teams</div>
            <h2 className="mt-6 text-3xl font-bold leading-tight">Manage projects<br/>without the chaos.</h2>
            <p className="mt-3 text-sm leading-relaxed text-indigo-100">Kanban boards, real-time updates, and simple task tracking — built for teams that ship fast.</p>
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur"><p className="text-xl font-bold">98%</p><p className="text-xs opacity-80">On-time delivery</p></div>
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur"><p className="text-xl font-bold">4.9/5</p><p className="text-xs opacity-80">Avg rating</p></div>
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur"><p className="text-xl font-bold">2x</p><p className="text-xs opacity-80">Faster planning</p></div>
            </div>
            <div className="mt-8 rounded-2xl bg-white p-4 shadow-xl text-slate-900">
              <div className="flex items-center gap-3"><div className="h-8 w-8 rounded-full bg-indigo-100 grid place-items-center text-xs">✓</div><div><p className="text-sm font-medium">Website Redesign sprint</p><p className="text-xs text-slate-500">12 tasks • 3 in progress</p></div><span className="ml-auto text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-full border">Active</span></div>
              <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden"><div className="h-full w-[68%] bg-indigo-600 rounded-full"/></div>
            </div>
          </div>
          <p className="text-xs opacity-60">© 2026 TaskFlow Pro — Design system v2.4</p>
        </div>
      </div>
    </div>
  )
}
