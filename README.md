# 🏆 Quiniela Mundial 2026

Plataforma familiar de predicciones para el Mundial FIFA 2026.
**Stack:** Next.js 14 · Supabase · Tailwind CSS · API-Football · Vercel

---

## 🚀 GUÍA DE DEPLOY PASO A PASO

### PASO 1 — Crear proyecto en Supabase

1. Ir a **https://supabase.com** → "Start your project" → Sign in con GitHub
2. Clic en **"New project"**
   - Organization: tu nombre
   - Name: `quiniela-2026`
   - Database Password: generá uno seguro y guardalo
   - Region: **US East (N. Virginia)** — más cerca de las sedes
3. Esperar ~2 minutos hasta que cree la base de datos

4. Ir a **SQL Editor** (ícono de base de datos en el sidebar izquierdo)
5. Clic en **"New query"**
6. Pegar todo el contenido de `supabase-schema.sql` y clic en **"Run"**
   - Deberías ver "Success" en verde

7. Ir a **Settings → API** y copiar:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

---

### PASO 2 — Obtener API key de API-Football

1. Ir a **https://www.api-football.com** → "Get your API key"
2. Registrarse gratis (plan Free: 100 llamadas/día)
3. Ir a tu dashboard → copiar el **API Key**
4. Guardarlo como `API_FOOTBALL_KEY`

> 💡 **Tip:** El plan gratuito es suficiente durante el Mundial.
> Los días de partido hay ~8 partidos → ~40 llamadas/día (cada 5 min durante 6 horas).

---

### PASO 3 — Configurar variables de entorno localmente

1. Copiar el archivo de ejemplo:
   ```bash
   cp .env.local .env.local.backup  # ya existe, solo revisarlo
   ```

2. Editar `.env.local` con tus valores reales:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://abcdefghij.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
   API_FOOTBALL_KEY=abc123...
   CRON_SECRET=mi_secreto_super_largo_2026
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

---

### PASO 4 — Correr localmente

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

Abrí **http://localhost:3000** — deberías ver la landing.

---

### PASO 5 — Subir a Vercel (deploy gratuito)

#### Opción A — Desde la terminal (recomendado)

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy (primera vez hace las preguntas de configuración)
vercel

# Para producción
vercel --prod
```

#### Opción B — Desde el dashboard de Vercel

1. Ir a **https://vercel.com** → Sign in con GitHub
2. Clic en **"New Project"**
3. Importar tu repositorio de GitHub con el código
4. Vercel detecta Next.js automáticamente → clic en **"Deploy"**

#### Configurar variables de entorno en Vercel

1. Ir a tu proyecto en Vercel → **Settings → Environment Variables**
2. Agregar una por una todas las variables de `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `API_FOOTBALL_KEY`
   - `CRON_SECRET`
   - `NEXT_PUBLIC_APP_URL` (con tu dominio de Vercel, ej: `https://quiniela-2026.vercel.app`)

3. Hacer redeploy: **Deployments → ··· → Redeploy**

---

### PASO 6 — Configurar el Cron Job en Vercel

El archivo `vercel.json` ya tiene la configuración. Solo tenés que:

1. Editar `vercel.json` y reemplazar `REEMPLAZAR_CON_TU_CRON_SECRET` con el mismo
   valor que pusiste en `CRON_SECRET`
2. Hacer commit y push → Vercel lo detecta automáticamente
3. Verificar en Vercel → **Settings → Cron Jobs** que aparezca el cron

> ⚠️  Los Cron Jobs en Vercel requieren plan **Hobby o superior** (gratis).
> El cron corre una vez al día y llama a `/api/sync-results`.

---

### PASO 7 — Cargar los partidos (seed inicial)

Antes del Mundial, tenés que cargar los 48 partidos en la base de datos.

**Opción A — SQL manual en Supabase:**
```sql
-- Ejemplo: cargar equipos del Grupo A
INSERT INTO public.teams VALUES 
  ('usa', 'Estados Unidos', '🇺🇸', 'us', 'A', 'USA'),
  ('pan', 'Panamá',         '🇵🇦', 'pa', 'A', 'PAN'),
  ('bol', 'Bolivia',        '🇧🇴', 'bo', 'A', 'BOL'),
  ('aze', 'Azerbaiyán',     '🇦🇿', 'az', 'A', 'AZE');

-- Cargar un partido
INSERT INTO public.matches (group_id, home_team_id, away_team_id, match_date, external_api_id)
VALUES ('A', 'usa', 'pan', '2026-06-11T20:00:00Z', 12345);
```

**Opción B — Script automatizado** (crear `scripts/seed.ts`):
```bash
npx ts-node scripts/seed.ts
```
*(Pedime este script y te lo genero)*

**Opción C — Via API-Football:**
Llamar a `/api/sync-results` una vez para importar todos los fixtures.

---

## 📁 ESTRUCTURA DEL PROYECTO

```
quiniela-mundial-2026/
├── src/
│   ├── app/
│   │   ├── page.tsx              ← Landing
│   │   ├── layout.tsx            ← Root layout + fuentes
│   │   ├── globals.css
│   │   ├── profile/page.tsx      ← Crear perfil
│   │   ├── predictions/page.tsx  ← Mis predicciones
│   │   ├── results/page.tsx      ← Resultados reales
│   │   ├── leaderboard/page.tsx  ← Ranking
│   │   └── api/
│   │       ├── sync-results/     ← Cron: actualiza marcadores
│   │       └── predictions/      ← POST: guarda predicción
│   ├── components/
│   │   ├── layout/Navbar.tsx
│   │   └── ui/
│   │       ├── MatchPredictionCard.tsx
│   │       └── LeaderboardTop10.tsx
│   ├── lib/
│   │   ├── supabase.ts           ← Clientes Supabase
│   │   ├── scoring.ts            ← Sistema de puntos
│   │   ├── api-football.ts       ← Integración API
│   │   └── matches-data.ts       ← Datos estáticos equipos
│   └── types/index.ts            ← Tipos TypeScript
├── supabase-schema.sql           ← Schema completo BD
├── vercel.json                   ← Cron Jobs
├── .env.local                    ← Variables de entorno
└── README.md
```

---

## 🎯 SISTEMA DE PUNTOS

Configurado en `src/types/index.ts` — fácil de cambiar:

```typescript
export const SCORING = {
  EXACT_SCORE: 3,      // Marcador exacto
  CORRECT_RESULT: 1,   // Solo ganador/empate
  WRONG: 0,
}
```

---

## 📱 LINKS ÚTILES

- **Supabase Dashboard:** https://supabase.com/dashboard
- **Vercel Dashboard:** https://vercel.com/dashboard
- **API-Football Docs:** https://www.api-football.com/documentation-v3
- **API-Football Fixtures:** `GET /fixtures?league=1&season=2026`

---

## ❓ PROBLEMAS FRECUENTES

**"Error: Invalid API key"** → Revisá `API_FOOTBALL_KEY` en las env vars de Vercel

**"relation 'users' does not exist"** → No corriste el SQL schema en Supabase

**El cron no corre** → Verificá que `CRON_SECRET` en `vercel.json` coincida con la env var

**Predicciones no se guardan** → Revisá las políticas RLS en Supabase y que `SUPABASE_SERVICE_ROLE_KEY` esté configurada

---

¡Listo para el Mundial 2026! 🌎⚽🏆
