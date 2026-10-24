import { Link } from 'react-router-dom'
import { Button } from '../components/ui'

export default function NotFoundPage() {
  return (
    <div className="min-h-[60vh] grid place-items-center p-6 text-center">
      <div>
        <p className="text-6xl font-bold text-slate-200">404</p>
        <h1 className="mt-2 text-lg font-semibold">Page not found</h1>
        <p className="text-sm text-slate-500 mt-1">The page you’re looking for doesn’t exist or was moved.</p>
        <Link to="/dashboard" className="inline-block mt-6"><Button>Back to dashboard</Button></Link>
      </div>
    </div>
  )
}
