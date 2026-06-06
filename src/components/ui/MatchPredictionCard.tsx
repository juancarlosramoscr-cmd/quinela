// src/components/ui/MatchPredictionCard.tsx
'use client'
import { useState } from 'react'
import { clsx } from 'clsx'
import type { Match, Prediction } from '@/types'
import { isMatchLocked } from '@/lib/scoring'

interface Props {
  match: Match
  prediction: Prediction | null
  onConfirm: (matchId: string, home: number, away: number) => Promise<void>
}

const STATUS_LABEL = {
  pending: 'Pendiente',
  live:    'En juego',
  final:   'Finalizado',
}
const STATUS_CLASS = {
  pending: 'text-gold bg-gold/10',
  live:    'text-red-400 bg-red-400/10 animate-pulse',
  final:   'text-green-400 bg-green-400/10',
}

export default function MatchPredictionCard({ match, prediction, onConfirm }: Props) {
  const [homeVal, setHomeVal] = useState<string>(prediction?.predicted_home?.toString() ?? '')
  const [awayVal, setAwayVal] = useState<string>(prediction?.predicted_away?.toString() ?? '')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)

  const isLocked = match.status !== 'pending' || isMatchLocked(match.match_date)
  const isConfirmed = !!prediction?.locked
  const canConfirm = !isLocked && !isConfirmed

  const homeTeam = match.home_team!
  const awayTeam = match.away_team!

  async function handleConfirm() {
    if (homeVal === '' || awayVal === '') return
    setSaving(true)
    await onConfirm(match.id, parseInt(homeVal), parseInt(awayVal))
    setSaving(false)
    setShowModal(false)
  }

  return (
    <>
      <div className={clsx(
        'flex items-center gap-2 px-4 py-2.5 border-b border-white/[0.035] transition-colors',
        isConfirmed && 'bg-green-pitch/10',
        isLocked && !isConfirmed && 'opacity-45',
        !isLocked && !isConfirmed && 'hover:bg-pitch-800'
      )}>

        {/* Home team */}
        <div className="flex-1 flex items-center gap-1.5 min-w-0">
          <span className="text-lg shrink-0">{homeTeam.flag}</span>
          <span className="text-[13px] font-semibold text-white truncate">{homeTeam.name}</span>
        </div>

        {/* Score inputs / display */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isConfirmed ? (
            <>
              <div className="w-8 h-8 flex items-center justify-center font-bebas text-lg text-green-400 bg-green-400/15 border border-green-400/30 rounded">
                {prediction.predicted_home}
              </div>
              <span className="text-[10px] text-[#7A7060] font-bold">vs</span>
              <div className="w-8 h-8 flex items-center justify-center font-bebas text-lg text-green-400 bg-green-400/15 border border-green-400/30 rounded">
                {prediction.predicted_away}
              </div>
            </>
          ) : (
            <>
              <input
                type="number" min={0} max={20}
                value={homeVal}
                onChange={e => setHomeVal(e.target.value)}
                disabled={isLocked}
                placeholder="—"
                className="score-input w-8 h-8 text-center font-bebas text-lg text-gold bg-pitch-700 border border-white/10 rounded outline-none disabled:cursor-not-allowed disabled:text-[#7A7060]"
              />
              <span className="text-[10px] text-[#7A7060] font-bold">vs</span>
              <input
                type="number" min={0} max={20}
                value={awayVal}
                onChange={e => setAwayVal(e.target.value)}
                disabled={isLocked}
                placeholder="—"
                className="score-input w-8 h-8 text-center font-bebas text-lg text-gold bg-pitch-700 border border-white/10 rounded outline-none disabled:cursor-not-allowed disabled:text-[#7A7060]"
              />
            </>
          )}
        </div>

        {/* Away team */}
        <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
          <span className="text-[13px] font-semibold text-white truncate text-right">{awayTeam.name}</span>
          <span className="text-lg shrink-0">{awayTeam.flag}</span>
        </div>

        {/* Action */}
        <div className="w-20 text-right shrink-0">
          {isLocked && !isConfirmed ? (
            <span className="text-[9px] font-bold text-red-400 uppercase tracking-wide">🔒 Cerrado</span>
          ) : isConfirmed ? (
            <span className="text-[9px] font-bold text-green-400 uppercase tracking-wide">✔ Listo</span>
          ) : (
            <button
              onClick={() => {
                if (homeVal === '' || awayVal === '') return
                setShowModal(true)
              }}
              className="text-[10px] font-bold uppercase tracking-wide px-2.5 py-1.5 border border-gold/35 bg-gold/7 text-gold rounded hover:bg-gold/15 hover:border-gold transition-all"
            >
              Siguiente
            </button>
          )}
        </div>

        {/* Date + status */}
        <div className="w-14 text-right text-[10px] text-[#7A7060] shrink-0">
          <div>{new Date(match.match_date).toLocaleDateString('es', { month: 'short', day: 'numeric' })}</div>
          <div>{new Date(match.match_date).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })}</div>
          <span className={clsx('inline-block mt-0.5 px-1.5 py-px rounded text-[8px] font-bold uppercase tracking-wide', STATUS_CLASS[match.status])}>
            {STATUS_LABEL[match.status]}
          </span>
        </div>
      </div>

      {/* ── CONFIRM MODAL ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-4">
          <div className="bg-pitch-800 border border-gold/30 rounded-xl p-7 max-w-xs w-full text-center shadow-2xl">
            <div className="text-3xl mb-3">🔒</div>
            <h3 className="font-bebas text-xl tracking-widest mb-2">CONFIRMAR PREDICCIÓN</h3>
            <p className="text-[#B8B0A0] text-sm mb-2">
              {homeTeam.name} vs {awayTeam.name}
            </p>
            <div className="font-bebas text-4xl text-gold mb-3">
              {homeVal} — {awayVal}
            </div>
            <p className="text-red-400 text-[11px] font-semibold mb-6">
              ⚠️ Una vez confirmada, no se puede modificar.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 border border-white/10 text-[#B8B0A0] hover:text-white text-sm font-semibold rounded transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving}
                className="flex-1 py-2.5 bg-gold hover:bg-gold-light text-pitch-900 text-sm font-bold rounded transition-colors disabled:opacity-60"
              >
                {saving ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
