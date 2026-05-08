import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { Toaster } from '@/components/ui/Toaster'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Zawadi — Africa\'s Stories, On Africa\'s Terms',
  description: 'Stream movies, music and books. Africa\'s premier entertainment platform.',
  keywords: ['streaming', 'movies', 'music', 'books', 'Africa', 'Nollywood', 'Afrobeats'],
  openGraph: {
    title: 'Zawadi',
    description: 'Stream movies, music and books',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} font-sans antialiased`}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
