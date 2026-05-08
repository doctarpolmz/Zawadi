'use client'
import { useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'
interface Toast { id: string; message: string; type: ToastType }

let globalToast: ((msg: string, type?: ToastType) => void) | null = null
export const toast = (msg: string, type: ToastType = 'info') => globalToast?.(msg, type)

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([])

  globalToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const icons = { success: CheckCircle, error: AlertCircle, info: Info }
  const colors = {
    success: 'border-zawadi-green/30 bg-zawadi-green/10',
    error: 'border-red-500/30 bg-red-500/10',
    info: 'border-blue-500/30 bg-blue-500/10',
  }

  return (
    <div className="fixed bottom-24 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(t => {
        const Icon = icons[t.type]
        return (
          <div key={t.id} className={cn('flex items-center gap-3 px-4 py-3 rounded-xl border text-sm animate-fadeIn pointer-events-auto', colors[t.type])}>
            <Icon className="w-4 h-4 shrink-0 text-white/70" />
            <span className="flex-1 text-white">{t.message}</span>
            <button onClick={() => setToasts(prev => prev.filter(i => i.id !== t.id))} className="opacity-60 hover:opacity-100 transition-opacity">
              <X className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
