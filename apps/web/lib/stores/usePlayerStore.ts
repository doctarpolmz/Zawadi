'use client'
import { create } from 'zustand'
import type { Content } from '@/types/database'

interface PlayerState {
  currentContent: Content | null
  isPlaying: boolean
  volume: number
  progress: Record<string, number>
  queue: Content[]
  setCurrentContent: (content: Content | null) => void
  setPlaying: (playing: boolean) => void
  setVolume: (volume: number) => void
  setProgress: (contentId: string, seconds: number) => void
  addToQueue: (content: Content) => void
  clearQueue: () => void
  nextInQueue: () => void
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentContent: null,
  isPlaying: false,
  volume: 0.8,
  progress: {},
  queue: [],

  setCurrentContent: (content) => set({ currentContent: content, isPlaying: !!content }),
  setPlaying: (isPlaying) => set({ isPlaying }),
  setVolume: (volume) => set({ volume }),
  setProgress: (contentId, seconds) =>
    set((s) => ({ progress: { ...s.progress, [contentId]: seconds } })),
  addToQueue: (content) =>
    set((s) => ({ queue: [...s.queue, content] })),
  clearQueue: () => set({ queue: [] }),
  nextInQueue: () => {
    const { queue } = get()
    if (queue.length > 0) {
      const [next, ...rest] = queue
      set({ currentContent: next, queue: rest, isPlaying: true })
    }
  },
}))
