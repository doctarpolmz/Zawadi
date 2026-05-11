import { Navbar } from '@/components/layout/Navbar'
import { AudioPlayerBar } from '@/components/player/AudioPlayerBar'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zawadi-dark">
      <Navbar />
      <main className="pt-20 pb-32">{children}</main>
      <AudioPlayerBar />
    </div>
  )
}
