// src/components/ui/LeaderboardTop10.tsx
import { clsx } from 'clsx'
import type { LeaderboardEntry } from '@/types'

interface Props {
  entries: LeaderboardEntry[]
}

const RANK_COLORS = ['text-gold', 'text-[#C0C0C0]', 'text-[#CD7F32]']
const RANK_MEDALS = ['🥇', '🥈', '🥉']

export default function LeaderboardTop10({ entries }: Props) {
  const top3 = entries.slice(0, 3)
  const rest  = entries.slice(3)
  const maxPts = entries[0]?.total_points ?? 1

  return (
    <div>
      {/* ── PODIUM ── */}
      <div className="flex items-end justify-center gap-2 px-5 pt-6 pb-0 max-w-md mx-auto">
        {[top3[1], top3[0], top3[2]].map((p, i) => {
          if (!p) return <div key={i} className="flex-1" />
          const heights = ['h-16', 'h-24', 'h-12']
          const borderCols = ['border-[#C0C0C0]/30', 'border-gold/35', 'border-[#CD7F32]/25']
          const bgCols = ['bg-white/5', 'bg-gold/10', 'bg-[#CD7F32]/6']
          const rankLabels = ['2', '1', '3']
          return (
            <div key={p.user_id} className="flex-1 text-center">
              <div className={clsx('text-[9px] font-bebas mb-1', RANK_COLORS[i])}>{rankLabels[i]}</div>
              <div className={clsx('rounded-t border border-b-0 flex flex-col items-center justify-center px-2 py-2', heights[i], borderCols[i], bgCols[i])}>
                <div className="text-xl mb-1">{p.avatar_icon}</div>
                <div className="text-[10px] font-bold text-white uppercase leading-tight truncate w-full">{p.name}</div>
                <div className={clsx('text-[11px] font-bold', RANK_COLORS[i])}>{p.total_points}pts</div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── TABLE ── */}
      <div className="px-4 pb-6 mt-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white/6">
              <th className="text-left text-[10px] font-bold uppercase tracking-widest text-[#7A7060] py-2 px-2 w-8">#</th>
              <th className="text-left text-[10px] font-bold uppercase tracking-widest text-[#7A7060] py-2 px-2">Jugador</th>
              <th className="text-right text-[10px] font-bold uppercase tracking-widest text-[#7A7060] py-2 px-2">Pts</th>
              <th className="text-center text-[10px] font-bold uppercase tracking-widest text-[#7A7060] py-2 px-2">⭐</th>
              <th className="text-center text-[10px] font-bold uppercase tracking-widest text-[#7A7060] py-2 px-2 hidden sm:table-cell">Prog.</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((p, i) => (
              <tr key={p.user_id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                <td className={clsx('py-2.5 px-2 font-bebas text-[15px] w-8', i < 3 ? RANK_COLORS[i] : 'text-[#7A7060]')}>
                  {i < 3 ? RANK_MEDALS[i] : i + 1}
                </td>
                <td className="py-2.5 px-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-sm shrink-0 border"
                      style={{ background: p.color + '22', borderColor: p.color + '66' }}
                    >
                      {p.avatar_icon}
                    </div>
                    <div>
                      <div className="text-[13px] font-semibold text-white">{p.name}</div>
                      {p.nickname && <div className="text-[11px] text-[#7A7060]">{p.nickname}</div>}
                    </div>
                  </div>
                </td>
                <td className="py-2.5 px-2 text-right font-bebas text-[18px] text-gold">{p.total_points}</td>
                <td className="py-2.5 px-2 text-center text-[12px] text-[#B8B0A0]">{p.exact_count}</td>
                <td className="py-2.5 px-2 hidden sm:table-cell">
                  <div className="w-16 h-1 bg-pitch-700 rounded overflow-hidden">
                    <div
                      className="h-full bg-gold rounded transition-all"
                      style={{ width: `${Math.round((p.total_points / maxPts) * 100)}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
