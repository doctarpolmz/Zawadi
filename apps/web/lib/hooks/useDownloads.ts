'use client'
import { useState, useCallback } from 'react'
import type { Download } from '@/types/database'

export function useDownloads() {
  const [downloads, setDownloads] = useState<Download[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDownloads = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/downloads')
      if (!response.ok) throw new Error('Failed to fetch downloads')
      const data = await response.json()
      setDownloads(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }, [])

  const addDownload = useCallback(async (contentId: string) => {
    setError(null)
    try {
      const response = await fetch('/api/downloads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId }),
      })
      if (!response.ok) throw new Error('Failed to add download')
      const data = await response.json()
      setDownloads((prev) => {
        const existing = prev.find((d) => d.content_id === contentId)
        if (existing) return prev
        return [data, ...prev]
      })
      return data
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    }
  }, [])

  const removeDownload = useCallback(async (contentId: string) => {
    setError(null)
    try {
      const response = await fetch('/api/downloads', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contentId }),
      })
      if (!response.ok) throw new Error('Failed to remove download')
      setDownloads((prev) => prev.filter((d) => d.content_id !== contentId))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      setError(message)
      throw err
    }
  }, [])

  const isDownloaded = useCallback(
    (contentId: string) => downloads.some((d) => d.content_id === contentId),
    [downloads]
  )

  const getDownloadExpiry = useCallback(
    (contentId: string) => {
      const download = downloads.find((d) => d.content_id === contentId)
      return download?.expires_at ? new Date(download.expires_at) : null
    },
    [downloads]
  )

  return {
    downloads,
    loading,
    error,
    fetchDownloads,
    addDownload,
    removeDownload,
    isDownloaded,
    getDownloadExpiry,
  }
}
