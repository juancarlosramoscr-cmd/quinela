// src/app/profile/page.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/layout/Navbar'
import { createBrowserSupabase } from '@/lib/supabase'
import type { AvatarIcon } from '@/types'

const AVATARS: { icon: AvatarIcon; label: string }[] = [
  { icon: '🏆', label: 'Trofeo' },
  { icon: '⚽', label: 'Balón' },
  { icon: '🥅', label: 'Arco' },
  { icon: '👟', label: 'Botín' },
  { icon: '🏳️', label: 'Bandera' },
  { icon: '⭐', label: 'Estrella' },
  { icon: '👑', label: 'Corona' },
  { icon: '🥊', label: 'Campeón' },
]

const COLORS = [
  '#C9A84C','#E74C3C','#3498DB','#2ECC71',
  '#9B59B6','#E67E22','#1ABC9C','#E91E63',
]

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createBrowserSupabase()

  const [name, setName]       = useState('')
  const [nickname, setNickname] = useState('')
  const [avatar, setAvatar]   = useState<AvatarIcon>('🏆')
  const [color, setColor]     = useState(COLORS[0])
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  async function handleSubmit() {
    if (!name.trim()) { setError('Ingresá tu nombre'); return }
    setSaving(true)
    setError('')

    const { error: err } = await supabase
      .from('users')
      .insert({
        name: name.trim(),
        nickname: nickname.trim() || null,
        avatar_icon: avatar,
        color,
      })

    if (err) {
      setError('Hubo un error al crear el perfil. Intentá de nuevo.')
      setSaving(false)
      return
    }

    router.push('/predictions')
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-pitch-900 page-enter">

        {/* Header */}
        <div className="px-5 pt-6 pb-5 border-b border-white/6">
          <h1 className="font-bebas text-[28px] tracking-widest">
            CREAR <span className="text-gold">PERFIL</span>
          </h1>
          <p className="text-[11px] text-[#B8B0A0] uppercase tracking-wider mt-1">
            Tu identidad en la quiniela familiar
          </p>
        </div>

        <div className="max-w-md mx-auto px-5 py-6 space-y-6">

          {/* Name */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#B8B0A0] mb-2">
              Nombre completo
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Carlos Rodríguez"
              className="w-full bg-pitch-700 border border-white/8 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-gold/50 transition-colors"
            />
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#B8B0A0] mb-2">
              Apodo <span className="text-[#7A7060] normal-case">(opcional)</span>
            </label>
            <input
              type="text"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              placeholder="Ej: El Crack"
              className="w-full bg-pitch-700 border border-white/8 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-gold/50 transition-colors"
            />
          </div>

          {/* Avatar */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#B8B0A0] mb-3">
              Avatar
            </label>
            <div className="grid grid-cols-4 gap-2">
              {AVATARS.map(({ icon, label }) => (
                <button
                  key={icon}
                  onClick={() => setAvatar(icon)}
                  className={`flex flex-col items-center py-3 rounded-lg border transition-all ${
                    avatar === icon
                      ? 'border-gold bg-gold/10'
                      : 'border-white/6 bg-pitch-700 hover:border-gold/30'
                  }`}
                >
                  <span className="text-xl mb-1">{icon}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wide text-[#B8B0A0]">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-widest text-[#B8B0A0] mb-3">
              Color favorito
            </label>
            <div className="flex gap-2.5 flex-wrap">
              {COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-pitch-900 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-sm font-semibold">{error}</p>
          )}

          {/* Preview */}
          <div className="flex items-center gap-3 bg-pitch-800 border border-white/6 rounded-lg p-4">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl border"
              style={{ background: color + '22', borderColor: color + '66' }}
            >
              {avatar}
            </div>
            <div>
              <div className="font-semibold text-white">{name || 'Tu nombre'}</div>
              <div className="text-[12px] text-[#7A7060]">{nickname || 'Sin apodo'}</div>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="w-full bg-gold hover:bg-gold-light disabled:opacity-60 text-pitch-900 font-bold uppercase tracking-widest py-3 rounded-lg transition-colors text-sm"
          >
            {saving ? 'Creando perfil...' : '🚀 Entrar a la quiniela'}
          </button>
        </div>
      </main>
    </>
  )
}
