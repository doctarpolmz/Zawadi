import { createServerSupabaseClient } from '@/lib/supabase/server'
import { AdminRequestsPanel } from '@/components/requests/AdminRequestsPanel'

export const dynamic = 'force-dynamic'

export default async function AdminRequestsPage() {
  const supabase = createServerSupabaseClient()

  const { data: requests } = await supabase
    .from('content_requests')
    .select('*, users(full_name, email)')
    .order('upvotes', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Content Requests</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Review, reply to, and update the status of user content requests
        </p>
      </div>
      <AdminRequestsPanel initialRequests={(requests ?? []) as any} />
    </div>
  )
}
