import Link from 'next/link'
import { CheckCircle } from 'lucide-react'

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-zawadi-dark flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="w-20 h-20 rounded-full bg-zawadi-green/20 border-2 border-zawadi-green flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10 text-zawadi-green" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Payment Successful!</h1>
          <p className="text-zinc-400 mt-2">Your content is now available in your library.</p>
        </div>
        <div className="flex flex-col gap-3">
          <Link href="/library" className="py-3 bg-zawadi-green text-zawadi-dark font-semibold rounded-xl hover:bg-zawadi-green/90 transition-colors">
            Go to My Library
          </Link>
          <Link href="/" className="py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
