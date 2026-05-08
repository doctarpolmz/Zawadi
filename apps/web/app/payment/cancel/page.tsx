import Link from 'next/link'
import { XCircle } from 'lucide-react'

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-zawadi-dark flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto">
          <XCircle className="w-10 h-10 text-red-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Payment Cancelled</h1>
          <p className="text-zinc-400 mt-2">No charges were made. You can try again anytime.</p>
        </div>
        <div className="flex flex-col gap-3">
          <Link href="/profile" className="py-3 bg-zawadi-green text-zawadi-dark font-semibold rounded-xl hover:bg-zawadi-green/90 transition-colors">
            View Plans
          </Link>
          <Link href="/" className="py-3 bg-white/10 text-white font-medium rounded-xl hover:bg-white/20 transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
