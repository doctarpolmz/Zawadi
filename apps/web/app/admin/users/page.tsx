import { createServerSupabaseClient } from '@/lib/supabase/server'
import { formatDate, getInitials } from '@/lib/utils'

export default async function AdminUsersPage() {
  const supabase = createServerSupabaseClient()
  const users = ((await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)) as any).data as any[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Users</h1>
        <p className="text-zinc-400 text-sm mt-1">{users.length} registered users</p>
      </div>

      <div className="bg-zawadi-surface rounded-2xl border border-white/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-4 py-3 text-left text-zinc-500 font-medium">User</th>
              <th className="px-4 py-3 text-left text-zinc-500 font-medium hidden md:table-cell">Email</th>
              <th className="px-4 py-3 text-left text-zinc-500 font-medium">Role</th>
              <th className="px-4 py-3 text-left text-zinc-500 font-medium hidden sm:table-cell">Joined</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zawadi-green/20 flex items-center justify-center text-xs font-medium text-zawadi-green shrink-0">
                      {getInitials(user.full_name)}
                    </div>
                    <span className="text-white font-medium truncate">{user.full_name ?? 'Anonymous'}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-zinc-400 hidden md:table-cell truncate max-w-[200px]">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`capitalize px-2 py-0.5 rounded-md text-xs font-medium ${user.role === 'admin' ? 'bg-zawadi-gold/20 text-zawadi-gold' : 'bg-white/10 text-zinc-400'}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-zinc-500 hidden sm:table-cell">{formatDate(user.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
