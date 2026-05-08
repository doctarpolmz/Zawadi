export type RequestStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'fulfilled'

export interface DownloadToken {
  id: string
  user_id: string
  content_id: string
  token: string
  expires_at: string
  downloaded_at: string | null
  ip_address: string | null
  created_at: string
}

export interface UserDownload {
  id: string
  user_id: string
  content_id: string
  file_format: string
  file_size_mb: number | null
  downloaded_at: string
  content?: Content // joined
}

export interface ContentRequest {
  id: string
  user_id: string
  title: string
  type: 'movie' | 'music' | 'book'
  description: string | null
  category: string | null
  status: RequestStatus
  admin_reply: string | null
  upvotes: number
  created_at: string
  updated_at: string
  users?: { full_name: string | null; avatar_url: string | null; email?: string }
}

export interface RequestUpvote {
  id: string
  request_id: string
  user_id: string
  created_at: string
}
export type ContentType = 'movie' | 'music' | 'book'
export type SubTier = 'free' | 'basic' | 'premium'
export type PurchaseType = 'buy' | 'rent'
export type UserRole = 'user' | 'admin'

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: UserRole
  created_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  type: ContentType
}

export interface Content {
  id: string
  title: string
  type: ContentType
  category_id: string | null
  description: string | null
  price: number
  rent_price: number | null
  stream_url: string | null
  thumbnail_url: string | null
  drm_key_id: string | null
  is_free: boolean
  required_tier: SubTier
  duration_seconds: number | null
  created_at: string
  categories?: Category
  avg_rating?: number
  review_count?: number
  download_url?: string | null
  file_size_mb?: number | null
  is_downloadable?: boolean
}

export interface Subscription {
  id: string
  user_id: string
  tier: SubTier
  status: string
  stripe_sub_id: string | null
  flutter_ref: string | null
  expires_at: string | null
  created_at: string
}

export interface Purchase {
  id: string
  user_id: string
  content_id: string
  type: PurchaseType
  amount_paid: number
  currency: string
  payment_ref: string | null
  rent_expires_at: string | null
  purchased_at: string
  content?: Content
}

export interface Review {
  id: string
  user_id: string
  content_id: string
  rating: number
  body: string | null
  created_at: string
  users?: { full_name: string | null; avatar_url: string | null }
}

export interface WatchHistory {
  id: string
  user_id: string
  content_id: string
  progress_seconds: number
  completed: boolean
  last_watched: string
  content?: Content
}

export interface Download {
  id: string
  user_id: string
  content_id: string
  local_path: string | null
  expires_at: string | null
  created_at: string
  content?: Content
}

export interface Database {
  public: {
    Tables: {
      users: { Row: UserProfile }
      content: { Row: Content }
      categories: { Row: Category }
      subscriptions: { Row: Subscription }
      purchases: { Row: Purchase }
      reviews: { Row: Review }
      watch_history: { Row: WatchHistory }
      downloads: { Row: Download }
      download_tokens:  { Row: DownloadToken }
      user_downloads:   { Row: UserDownload }
      content_requests: { Row: ContentRequest }
      request_upvotes:  { Row: RequestUpvote }
    }
  }
}
