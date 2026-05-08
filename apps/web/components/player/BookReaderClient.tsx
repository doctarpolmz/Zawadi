'use client'
import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Sun, Moon, Minus, Plus, BookOpen } from 'lucide-react'
import type { Content } from '@/types/database'
import { createClient } from '@/lib/supabase/client'

interface BookReaderClientProps {
  content: Content
}

export function BookReaderClient({ content }: BookReaderClientProps) {
  const viewerRef = useRef<HTMLDivElement>(null)
  const bookRef = useRef<any>(null)
  const renditionRef = useRef<any>(null)
  const [loaded, setLoaded] = useState(false)
  const [theme, setTheme] = useState<'dark' | 'sepia' | 'light'>('dark')
  const [fontSize, setFontSize] = useState(100)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    if (!viewerRef.current || !content.stream_url) return

    import('epubjs').then(({ default: ePub }) => {
      const book = ePub(content.stream_url!)
      const rendition = book.renderTo(viewerRef.current!, {
        width: '100%',
        height: '100%',
        spread: 'auto',
        minSpreadWidth: 900,
      })

      const themes: Record<string, any> = {
        dark: { body: { background: '#0A0A0F', color: '#E5E5E5' } },
        sepia: { body: { background: '#F5E6C8', color: '#3D2B1F' } },
        light: { body: { background: '#FFFFFF', color: '#1A1A1A' } },
      }
      Object.entries(themes).forEach(([name, css]) => rendition.themes.register(name, css))
      rendition.themes.select(theme)
      rendition.themes.fontSize(`${fontSize}%`)
      rendition.display()

      book.ready.then(() => {
        setLoaded(true)
        book.locations.generate(1024).then(() => {
          setTotalPages(book.locations.length())
        })
      })

      rendition.on('relocated', async (loc: any) => {
        const pct = Math.round(loc.start.percentage * 100)
        setCurrentPage(Math.round(loc.start.percentage * (totalPages || 100)))
        const supabase = createClient()
        await (supabase.from('watch_history') as any).upsert(
          { content_id: content.id, progress_seconds: pct, last_watched: new Date().toISOString() },
          { onConflict: 'user_id,content_id' }
        )
      })

      bookRef.current = book
      renditionRef.current = rendition
    })

    return () => bookRef.current?.destroy()
  }, [content.stream_url])

  useEffect(() => {
    renditionRef.current?.themes.select(theme)
  }, [theme])

  useEffect(() => {
    renditionRef.current?.themes.fontSize(`${fontSize}%`)
  }, [fontSize])

  const themeStyles: Record<string, string> = {
    dark: 'bg-zawadi-dark text-white',
    sepia: 'bg-amber-50 text-amber-900',
    light: 'bg-white text-gray-900',
  }

  return (
    <div className={`flex flex-col h-full ${themeStyles[theme]} transition-colors duration-300`}>
      {/* Toolbar */}
      <div className={`flex items-center justify-between px-4 py-2 border-b ${theme === 'dark' ? 'border-white/10 bg-zawadi-surface' : 'border-black/10 bg-white/80'} backdrop-blur-sm`}>
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 opacity-60" />
          <span className="text-sm font-medium opacity-80 truncate max-w-xs hidden sm:block">{content.title}</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Font size */}
          <div className="flex items-center gap-1">
            <button onClick={() => setFontSize(s => Math.max(60, s - 10))}
              className="p-1.5 rounded hover:bg-white/10 transition-colors">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs opacity-60 w-10 text-center">{fontSize}%</span>
            <button onClick={() => setFontSize(s => Math.min(200, s + 10))}
              className="p-1.5 rounded hover:bg-white/10 transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Theme toggle */}
          <div className="flex items-center gap-1 bg-black/10 rounded-lg p-1">
            {(['dark', 'sepia', 'light'] as const).map(t => (
              <button key={t} onClick={() => setTheme(t)}
                className={`px-2 py-1 rounded text-xs capitalize transition-colors ${theme === t ? 'bg-zawadi-green text-zawadi-dark font-medium' : 'opacity-60 hover:opacity-100'}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Reader area */}
      <div className="flex-1 relative overflow-hidden">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-2 border-zawadi-green border-t-transparent rounded-full animate-spin" />
              <p className="text-sm opacity-60">Loading book…</p>
            </div>
          </div>
        )}
        <div ref={viewerRef} className="w-full h-full" />
      </div>

      {/* Navigation */}
      <div className={`flex items-center justify-between px-4 py-3 border-t ${theme === 'dark' ? 'border-white/10 bg-zawadi-surface' : 'border-black/10'}`}>
        <button
          onClick={() => renditionRef.current?.prev()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
        >
          <ChevronLeft className="w-4 h-4" /> Previous
        </button>

        {totalPages > 0 && (
          <span className="text-xs opacity-50">
            {currentPage} / {totalPages}
          </span>
        )}

        <button
          onClick={() => renditionRef.current?.next()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors text-sm"
        >
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
