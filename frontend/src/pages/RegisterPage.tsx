import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getApiErrorMessage } from '../api/client'
import { Button, Input, Label } from '../components/ui'
import { ErrorBanner } from '../components/ErrorBanner'

export default function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState<Record<string,string>>({})
  const [apiError, setApiError] = useState<{message:string; details?: any} | null>(null)
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const v: Record<string,string> = {}
    if (!form.name || form.name.trim().length < 2) v.name = 'Name must be at least 2 characters'
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email)) v.email = 'Valid email required'
    if (!form.password || form.password.length < 8) v.password = 'Password must be at least 8 characters'
    if (Object.keys(v).length) { setErrors(v); return }
    setErrors({})
    setApiError(null)
    setLoading(true)
    try {
      await register(form.name.trim(), form.email.trim().toLowerCase(), form.password)
      navigate('/dashboard')
    } catch (err) {
      setApiError(getApiErrorMessage(err))
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex">
      <div className="flex w-full lg:w-[48%] items-center justify-center p-6 lg:p-10 bg-white">
        <div className="w-full max-w-md">
          <Link to="/login" className="inline-flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-xl bg-indigo-600 grid place-items-center text-white font-bold">TF</div>
            <span className="font-bold text-lg">TaskFlow Pro</span>
          </Link>
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Create your workspace</h1>
            <p className="text-sm text-slate-500 mt-2">Start managing projects in under a minute.</p>
          </div>

          {apiError && <div className="mb-4"><ErrorBanner title="Registration failed" message={apiError.message} details={apiError.details} /></div>}

          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div><Label required>Full name</Label><Input placeholder="Alex Morgan" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} error={errors.name} /></div>
            <div><Label required>Work email</Label><Input type="email" placeholder="alex@company.com" value={form.email} onChange={e=>setForm({...form, email:e.target.value})} error={errors.email} /></div>
            <div><Label required>Password</Label><Input type="password" placeholder="At least 8 characters" value={form.password} onChange={e=>setForm({...form, password:e.target.value})} error={errors.password} /><p className="text-xs text-slate-400 mt-1">Must be 8–72 characters.</p></div>
            <Button type="submit" loading={loading} className="w-full" size="lg">{loading ? 'Creating account...' : 'Create account'}</Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="font-medium text-indigo-600">Sign in</Link></p>
        </div>
      </div>

      <div className="hidden lg:flex w-[52%] bg-gradient-to-br from-slate-900 via-indigo-900 to-violet-800 p-10 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(120,119,198,0.3),transparent_60%)]" />
        <div className="relative w-full max-w-lg mx-auto flex flex-col justify-center">
          <div className="rounded-2xl bg-white p-6 text-slate-900 shadow-2xl">
            <p className="text-sm font-semibold">Why teams love TaskFlow Pro</p>
            <div className="mt-4 space-y-3">
              <div className="flex gap-3"><span className="h-6 w-6 rounded-full bg-emerald-100 grid place-items-center text-xs">✓</span><div><p className="text-sm font-medium">Lightning-fast Kanban</p><p className="text-xs text-slate-500">Drag, track, and ship tasks without lag.</p></div></div>
              <div className="flex gap-3"><span className="h-6 w-6 rounded-full bg-indigo-100 grid place-items-center text-xs">◧</span><div><p className="text-sm font-medium">Ownership & permissions</p><p className="text-xs text-slate-500">Every project scoped to you — private by default.</p></div></div>
              <div className="flex gap-3"><span className="h-6 w-6 rounded-full bg-amber-100 grid place-items-center text-xs">⚡</span><div><p className="text-sm font-medium">API-first architecture</p><p className="text-xs text-slate-500">Integrate with Slack, GitHub, Figma easily.</p></div></div>
            </div>
            <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
              <div className="flex -space-x-2"><div className="h-6 w-6 rounded-full bg-indigo-200 border-2 border-white"/><div className="h-6 w-6 rounded-full bg-violet-200 border-2 border-white"/><div className="h-6 w-6 rounded-full bg-slate-200 border-2 border-white"/></div>
              <span>Used by product teams at Linear, Vercel, Raycast</span>
            </div>
          </div>
          <blockquote className="mt-8 border-l-2 border-white/20 pl-4 text-sm italic text-indigo-100">"TaskFlow Pro cut our sprint planning time in half. The API is a joy to integrate with." — Engineering Lead, Acme</blockquote>
        </div>
      </div>
    </div>
  )
}
