'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface SessionRow {
  id: number
  username: string
  completedAt: string
  summaryAgriculteurs: string
  summaryIndustriels: string
  summaryHabitants: string
  summaryElus: string
  imageAvant: string
  imageApres: string
  bilanMistral: string
}

interface ApiResponse {
  sessions: SessionRow[]
  total: number
  page: number
  limit: number
}

const GROUPE_LABELS = [
  { key: 'summaryAgriculteurs', emoji: '🌾', label: 'Agriculteurs' },
  { key: 'summaryIndustriels',  emoji: '🏭', label: 'Industriels'  },
  { key: 'summaryHabitants',    emoji: '🏘️', label: 'Habitants'    },
  { key: 'summaryElus',         emoji: '🏛️', label: 'Élus'         },
] as const

export default function AdminSessionsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const user = session?.user as { role?: string; name?: string } | undefined

  const [data,    setData]    = useState<ApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [page,    setPage]    = useState(1)
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login')
    if (status === 'authenticated' && user?.role !== 'admin') router.replace('/')
  }, [status, user, router])

  const load = useCallback(async (p: number) => {
    setLoading(true)
    const res = await fetch(`/api/ecovillage-session?page=${p}&limit=20`)
    setData(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { load(page) }, [page, load])

  const downloadCSV = () => {
    if (!data?.sessions.length) return
    const header = ['ID', 'Utilisateur', 'Date', 'Agriculteurs', 'Industriels', 'Habitants', 'Élus', 'Bilan Mistral']
    const rows = data.sessions.map(s => [
      s.id,
      s.username,
      new Date(s.completedAt).toLocaleString('fr-FR'),
      `"${s.summaryAgriculteurs}"`,
      `"${s.summaryIndustriels}"`,
      `"${s.summaryHabitants}"`,
      `"${s.summaryElus}"`,
      `"${(s.bilanMistral ?? '').replace(/"/g, '""')}"`,
    ])
    const csv = [header, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `ecovillage_sessions_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  if (status === 'loading' || !session || user?.role !== 'admin') return null

  const totalPages = data ? Math.ceil(data.total / data.limit) : 1

  return (
    <main className="app-container" style={{ justifyContent: 'flex-start', paddingTop: '2rem' }}>
      <div className="header" style={{ marginBottom: '1.5rem', width: '100%', maxWidth: 800 }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>📊 Sessions enregistrées</h1>
        <p className="subtitle">ÉcoVillage — Administration</p>
        <div className="user-bar">
          <span className="user-name">👤 {user?.name}</span>
          <button className="admin-link-btn" onClick={() => router.push('/admin/users')}>⚙ Utilisateurs</button>
          <button className="admin-link-btn" onClick={() => router.push('/')}>← Questionnaire</button>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 800 }}>

        {/* Header actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {data ? `${data.total} session${data.total > 1 ? 's' : ''} enregistrée${data.total > 1 ? 's' : ''}` : '…'}
          </div>
          <button className="admin-dl-btn" onClick={downloadCSV} disabled={!data?.sessions.length}>
            ⬇ Exporter CSV
          </button>
        </div>

        {loading && (
          <div className="quiz-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: 36, animation: 'spin 1.2s linear infinite', display: 'inline-block' }}>🌱</div>
          </div>
        )}

        {!loading && data?.sessions.length === 0 && (
          <div className="quiz-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            Aucune session enregistrée pour l'instant.
          </div>
        )}

        {!loading && (data?.sessions ?? []).map(s => (
          <div key={s.id} className="quiz-card" style={{ marginBottom: '0.75rem', overflow: 'hidden' }}>
            {/* Row header */}
            <div
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', cursor: 'pointer', gap: 12 }}
              onClick={() => setExpanded(expanded === s.id ? null : s.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'DM Mono, monospace', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  #{String(s.id).padStart(4, '0')}
                </span>
                <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>👤 {s.username}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {new Date(s.completedAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
              <span style={{ color: 'var(--text-muted)', fontSize: '1rem' }}>{expanded === s.id ? '▲' : '▼'}</span>
            </div>

            {/* Expanded detail */}
            {expanded === s.id && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {GROUPE_LABELS.map(({ key, emoji, label }) => (
                  <div key={key}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 4 }}>
                      {emoji} {label}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: s[key] ? 'var(--text)' : 'var(--text-muted)', fontStyle: s[key] ? 'normal' : 'italic' }}>
                      {s[key] || 'Aucune réponse'}
                    </div>
                  </div>
                ))}
                {s.bilanMistral && (
                  <div>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 4 }}>
                      🤖 Bilan Mistral
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text)', lineHeight: 1.5, maxHeight: 120, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                      {s.bilanMistral}
                    </div>
                  </div>
                )}
                {(s.imageAvant || s.imageApres) && (
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {s.imageAvant && (
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 4 }}>🏭 Village avant</div>
                        <img src={`data:image/png;base64,${s.imageAvant}`} alt="avant" style={{ width: '100%', borderRadius: 8 }} />
                      </div>
                    )}
                    {s.imageApres && (
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 4 }}>🌿 Village après</div>
                        <img src={`data:image/png;base64,${s.imageApres}`} alt="après" style={{ width: '100%', borderRadius: 8 }} />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: '1.5rem' }}>
            <button className="admin-link-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Précédent</button>
            <span style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Page {page} / {totalPages}</span>
            <button className="admin-link-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Suivant →</button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .user-bar { display:flex; align-items:center; gap:0.75rem; justify-content:center; margin-top:0.75rem; flex-wrap:wrap; }
        .user-name { font-size:0.8rem; color:var(--text-muted); }
        .admin-link-btn {
          font-family:'Syne',sans-serif; font-weight:700; font-size:0.78rem;
          padding:0.4rem 1rem; border-radius:999px; cursor:pointer;
          background:transparent; border:1.5px solid var(--border); color:var(--text-muted);
          transition:all 0.15s; letter-spacing:0.05em;
        }
        .admin-link-btn:hover { border-color:var(--accent); color:var(--accent); }
        .admin-link-btn:disabled { opacity:0.4; cursor:not-allowed; }
        .admin-dl-btn { font-family:'Syne',sans-serif; font-weight:700; font-size:0.75rem; padding:0.45rem 1rem; border-radius:999px; border:1.5px solid var(--border); cursor:pointer; background:transparent; color:var(--text-muted); transition:all 0.15s; }
        .admin-dl-btn:hover { border-color:var(--accent); color:var(--accent); }
        .admin-dl-btn:disabled { opacity:0.4; cursor:not-allowed; }
      `}</style>
    </main>
  )
}
