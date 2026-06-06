// src/components/layout/Navbar.tsx
'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'

const LINKS = [
  { href: '/predictions', label: 'Predicciones' },
  { href: '/results',     label: 'Resultados' },
  { href: '/leaderboard', label: 'Ranking' },
]

export default function Navbar() {
  const path = usePathname()

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-4 py-2.5 bg-pitch-900/95 backdrop-blur border-b border-gold/15">

      {/* Brand */}
      <Link href="/" className="flex items-center gap-2.5 group">
        <span className="text-2xl">🏆</span>
        <div className="leading-tight">
          <div className="font-bebas text-gold text-[17px] tracking-widest group-hover:text-gold-light transition-colors">
            QUINIELA <span className="text-white">26</span>
          </div>
          <div className="text-[9px] text-[#7A7060] uppercase tracking-widest">Mundial 2026</div>
        </div>
      </Link>

      {/* Links */}
      <div className="flex gap-1">
        {LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={clsx(
              'px-3 py-1.5 text-[11px] font-semibold uppercase tracking-widest rounded transition-all',
              path.startsWith(href)
                ? 'bg-gold/12 text-gold border border-gold/25'
                : 'text-[#B8B0A0] hover:text-gold border border-transparent'
            )}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Profile shortcut */}
      <Link
        href="/profile"
        className="text-[11px] text-[#B8B0A0] hover:text-gold transition-colors uppercase tracking-wider"
      >
        Mi perfil
      </Link>
    </nav>
  )
}
