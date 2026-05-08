import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zawadi-dark flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        <div className="text-8xl font-black gradient-text">404</div>
        <h1 className="text-2xl font-bold text-white">Page not found</h1>
        <p className="text-zinc-400">This content doesn't exist or has been removed.</p>
        <Link href="/" className="inline-block px-6 py-3 bg-zawadi-green text-zawadi-dark font-semibold rounded-xl hover:bg-zawadi-green/90 transition-colors mt-4">
          Back to Home
        </Link>
      </div>
    </div>
  )
}
