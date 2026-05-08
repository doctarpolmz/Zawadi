'use client'
import { useState } from 'react'
import { Upload, Plus, X, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Category } from '@/types/database'

interface ContentUploadFormProps {
  categories: Category[]
}

const initialForm = {
  title: '',
  type: 'movie' as 'movie' | 'music' | 'book',
  category_id: '',
  description: '',
  price: '0',
  rent_price: '',
  is_free: true,
  required_tier: 'free' as 'free' | 'basic' | 'premium',
  stream_url: '',
  thumbnail_url: '',
  duration_seconds: '',
  download_url: '',
  file_size_mb: '',
  is_downloadable: true,
}

export function ContentUploadForm({ categories }: ContentUploadFormProps) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const filteredCats = categories.filter(c => c.type === form.type)

  const set = (key: keyof typeof form, value: any) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await (supabase.from('content') as any).insert({
      title: form.title,
      type: form.type,
      category_id: form.category_id || null,
      description: form.description || null,
      price: parseFloat(form.price) || 0,
      rent_price: form.rent_price ? parseFloat(form.rent_price) : null,
      is_free: form.is_free,
      required_tier: form.required_tier,
      stream_url: form.stream_url || null,
      thumbnail_url: form.thumbnail_url || null,
      duration_seconds: form.duration_seconds ? parseInt(form.duration_seconds) : null,
      download_url: form.download_url || null,
      file_size_mb: form.file_size_mb ? parseFloat(form.file_size_mb) : null,
      is_downloadable: form.is_downloadable,
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    setSuccess(true)
    setForm(initialForm)
    setTimeout(() => { setSuccess(false); setOpen(false) }, 2000)
  }

  return (
    <div className="bg-zawadi-surface rounded-2xl border border-white/5 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/2 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-zawadi-green/10 flex items-center justify-center">
            <Plus className="w-4 h-4 text-zawadi-green" />
          </div>
          <span className="font-semibold text-white">Add New Content</span>
        </div>
        {open ? <X className="w-4 h-4 text-zinc-500" /> : <Plus className="w-4 h-4 text-zinc-500" />}
      </button>

      {open && (
        <form onSubmit={handleSubmit} className="px-5 pb-5 border-t border-white/5 pt-5 space-y-4">
          {error && <p className="text-red-400 text-sm bg-red-400/10 px-3 py-2 rounded-lg">{error}</p>}
          {success && (
            <div className="flex items-center gap-2 text-zawadi-green text-sm bg-zawadi-green/10 px-3 py-2 rounded-lg">
              <Check className="w-4 h-4" /> Content added successfully!
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Title *</label>
              <input
                required
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="e.g. Black Panther"
                className="w-full px-3 py-2.5 rounded-xl bg-zawadi-surface2 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-zawadi-green transition-colors text-sm"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Type *</label>
              <select
                value={form.type}
                onChange={e => set('type', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zawadi-surface2 border border-white/10 text-white focus:outline-none focus:border-zawadi-green transition-colors text-sm"
              >
                <option value="movie">Movie</option>
                <option value="music">Music</option>
                <option value="book">Book</option>
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Category</label>
              <select
                value={form.category_id}
                onChange={e => set('category_id', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zawadi-surface2 border border-white/10 text-white focus:outline-none focus:border-zawadi-green transition-colors text-sm"
              >
                <option value="">Select category…</option>
                {filteredCats.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Stream URL */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Stream URL (Mux playback ID or direct URL)</label>
              <input
                value={form.stream_url}
                onChange={e => set('stream_url', e.target.value)}
                placeholder="https://... or Mux playback ID"
                className="w-full px-3 py-2.5 rounded-xl bg-zawadi-surface2 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-zawadi-green transition-colors text-sm"
              />
            </div>
            {/* Download URL */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Download URL (direct MP4/MP3/EPUB — for offline download)
                </label>
                <input
                  value={form.download_url}
                  onChange={e => set('download_url', e.target.value)}
                  placeholder="https://... or Supabase Storage path"
                  className="w-full px-3 py-2.5 rounded-xl bg-zawadi-surface2 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-zawadi-green transition-colors text-sm"
                />
              </div>

              {/* File size + downloadable toggle */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                  File Size (MB)
                </label>
                <input
                  type="number" min="0" step="0.1"
                  value={form.file_size_mb}
                  onChange={e => set('file_size_mb', e.target.value)}
                  placeholder="e.g. 850"
                  className="w-full px-3 py-2.5 rounded-xl bg-zawadi-surface2 border border-white/10 text-white focus:outline-none focus:border-zawadi-green transition-colors text-sm"
                />
              </div>
              <div className="flex items-center gap-3 sm:col-span-2">
                <input type="checkbox" id="is_downloadable"
                  checked={form.is_downloadable}
                  onChange={e => set('is_downloadable', e.target.checked)}
                  className="w-4 h-4 accent-zawadi-green" />
                <label htmlFor="is_downloadable" className="text-sm text-zinc-300">
                  Allow users to download this file
                </label>
              </div>

            {/* Thumbnail */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Thumbnail URL</label>
              <input
                value={form.thumbnail_url}
                onChange={e => set('thumbnail_url', e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2.5 rounded-xl bg-zawadi-surface2 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-zawadi-green transition-colors text-sm"
              />
            </div>

            {/* Description */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                rows={3}
                placeholder="Short description…"
                className="w-full px-3 py-2.5 rounded-xl bg-zawadi-surface2 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-zawadi-green transition-colors text-sm resize-none"
              />
            </div>

            {/* Price */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Purchase Price (USD)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={e => set('price', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zawadi-surface2 border border-white/10 text-white focus:outline-none focus:border-zawadi-green transition-colors text-sm"
              />
            </div>

            {/* Rent price */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Rental Price (USD, optional)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.rent_price}
                onChange={e => set('rent_price', e.target.value)}
                placeholder="e.g. 2.99"
                className="w-full px-3 py-2.5 rounded-xl bg-zawadi-surface2 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-zawadi-green transition-colors text-sm"
              />
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Duration (seconds)</label>
              <input
                type="number"
                min="0"
                value={form.duration_seconds}
                onChange={e => set('duration_seconds', e.target.value)}
                placeholder="e.g. 7200 (2 hrs)"
                className="w-full px-3 py-2.5 rounded-xl bg-zawadi-surface2 border border-white/10 text-white placeholder-zinc-600 focus:outline-none focus:border-zawadi-green transition-colors text-sm"
              />
            </div>

            {/* Required tier */}
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Required Subscription Tier</label>
              <select
                value={form.required_tier}
                onChange={e => set('required_tier', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zawadi-surface2 border border-white/10 text-white focus:outline-none focus:border-zawadi-green transition-colors text-sm"
              >
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="premium">Premium</option>
              </select>
            </div>

            {/* Is free */}
            <div className="flex items-center gap-3 sm:col-span-2">
              <input
                type="checkbox"
                id="is_free"
                checked={form.is_free}
                onChange={e => set('is_free', e.target.checked)}
                className="w-4 h-4 accent-zawadi-green"
              />
              <label htmlFor="is_free" className="text-sm text-zinc-300">Make this content free to all users</label>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-zawadi-green text-zawadi-dark font-semibold text-sm rounded-xl hover:bg-zawadi-green/90 transition-colors disabled:opacity-60"
            >
              <Upload className="w-4 h-4" />
              {saving ? 'Saving…' : 'Add Content'}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="px-5 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
