// src/app/page.tsx
import Link from 'next/link'
import { Trophy, Users, Star, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-pitch-900">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden flex flex-col items-center justify-center text-center px-5 py-16 min-h-[88vh] stadium-bg">

        {/* Glow background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/5 blur-3xl" />
        </div>

        {/* Badge */}
        <div className="relative z-10 inline-flex items-center gap-2 bg-gold/10 border border-gold/35 rounded-full px-4 py-1.5 text-gold text-[11px] font-bold tracking-widest uppercase mb-6">
          🌎 FIFA World Cup 2026 · USA / CAN / MEX
        </div>

        {/* Logo placeholder — reemplazar con la imagen real */}
        <div className="relative z-10 mb-6">
          <div className="text-[80px] drop-shadow-[0_0_24px_rgba(201,168,76,0.5)]">🏆</div>
        </div>

        <h1 className="relative z-10 font-bebas text-[clamp(52px,14vw,96px)] leading-[0.9] tracking-widest text-white mb-3">
          QUINIELA<br /><span className="text-gold">FAMILIAR</span>
        </h1>

        <p className="relative z-10 text-[#B8B0A0] text-[15px] max-w-sm leading-relaxed mb-8">
          Predecí todos los partidos del Mundial 2026, competí con familia y amigos, y seguí el ranking en tiempo real.
        </p>

        <div className="relative z-10 flex gap-3 flex-wrap justify-center">
          <Link
            href="/profile"
            className="bg-gold hover:bg-gold-light text-pitch-900 font-bold text-sm tracking-widest uppercase px-7 py-3 rounded transition-colors"
          >
            ⚽ Crear mi perfil
          </Link>
          <Link
            href="/leaderboard"
            className="border border-gold/40 hover:border-gold text-gold font-semibold text-sm tracking-wider uppercase px-6 py-3 rounded transition-colors"
          >
            Ver ranking
          </Link>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────────── */}
      <section className="px-5 py-12 max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Trophy size={24} />, title: 'Predecí', desc: 'Ingresá el marcador exacto de cada partido de la fase de grupos.' },
          { icon: <Zap size={24} />, title: 'Se bloquea', desc: 'Confirmás con "Siguiente" y la predicción queda fija. Sin trampa.' },
          { icon: <Star size={24} />, title: 'Puntuás', desc: '3 pts marcador exacto · 1 pt resultado correcto · 0 pts si fallás.' },
          { icon: <Users size={24} />, title: 'Competís', desc: 'Ranking familiar actualizado automáticamente con cada resultado.' },
        ].map(({ icon, title, desc }) => (
          <div key={title} className="bg-pitch-800 border border-white/6 rounded-lg p-5">
            <div className="text-gold mb-3">{icon}</div>
            <div className="font-barlow-condensed text-gold text-[13px] font-bold uppercase tracking-wider mb-2">{title}</div>
            <p className="text-[#B8B0A0] text-[12px] leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>

      {/* ── FOOTER ───────────────────────────────────────────── */}
      <footer className="text-center py-6 text-[#7A7060] text-[11px] tracking-widest uppercase border-t border-white/5">
        Quiniela Familiar · Mundial 2026 · Para uso personal
      </footer>
    </main>
  )
}
