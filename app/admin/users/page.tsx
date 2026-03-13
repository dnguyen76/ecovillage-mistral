'use client'
// app/admin/users/page.tsx
import { useState, useRef, useCallback, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

// ── CSV Parser ────────────────────────────────────────────────────────────────
interface ParsedUser { username: string; password: string; role: string; mistralKey: string }
interface ParseResult { users: ParsedUser[]; errors: string[] }

function parseCSV(text: string): ParseResult {
  const lines = text.trim().split(/\r?\n/)
  if (lines.length < 2) return { users: [], errors: ['Fichier vide ou sans données'] }

  const header      = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''))
  const usernameIdx = header.findIndex(h => ['nom', 'username', 'utilisateur', 'email', 'name'].includes(h))
  const passwordIdx = header.findIndex(h => ['mot_de_passe', 'password', 'mdp'].includes(h))
  const roleIdx      = header.findIndex(h => ['role', 'rôle'].includes(h))
  const mistralIdx   = header.findIndex(h => ['mistral_key', 'mistralkey', 'cle_mistral', 'clé_mistral', 'mistral'].includes(h))

  if (usernameIdx === -1) return { users: [], errors: ["Colonne 'nom' ou 'username' introuvable"] }
  if (passwordIdx === -1) return { users: [], errors: ["Colonne 'mot_de_passe' ou 'password' introuvable"] }

  const users: ParsedUser[] = []
  const errors: string[]    = []

  lines.slice(1).forEach((line, i) => {
    if (!line.trim()) return
    const cols     = line.split(',').map(c => c.trim().replace(/"/g, ''))
    const username = cols[usernameIdx]
    const password = cols[passwordIdx]
    const role       = roleIdx   !== -1 ? (cols[roleIdx]   || 'user') : 'user'
    const mistralKey = mistralIdx !== -1 ? (cols[mistralIdx] || '')     : ''

    if (!username)                        { errors.push(`Ligne ${i + 2} : nom manquant`); return }
    if (!password || password.length < 6) { errors.push(`Ligne ${i + 2} : mot de passe trop court (min 6 cars)`); return }

    users.push({ username, password, role, mistralKey })
  })

  return { users, errors }
}

// ── Role Badge ────────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: string }) {
  const isAdmin = role === 'admin'
  return (
    <span style={{
      background: isAdmin ? 'rgba(108,99,255,0.15)' : 'rgba(67,233,123,0.1)',
      color:      isAdmin ? 'var(--accent)'          : 'var(--correct)',
      border:     `1px solid ${isAdmin ? 'rgba(108,99,255,0.3)' : 'rgba(67,233,123,0.3)'}`,
      padding: '2px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'DM Mono, monospace',
    }}>
      {role}
    </span>
  )
}

// ── Import result type ────────────────────────────────────────────────────────
interface ImportResult { created: number; updated: number; skipped: number; errors: string[] }

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [tab,            setTab]            = useState<'csv' | 'manual'>('csv')
  const [preview,        setPreview]        = useState<ParseResult | null>(null)
  const [isDragging,     setIsDragging]     = useState(false)
  const [importStatus,   setImportStatus]   = useState<null | 'loading' | ImportResult>(null)
  const [updateExisting, setUpdateExisting] = useState(false)   // ← nouveau toggle
  const [manualForm,     setManualForm]     = useState({ username: '', password: '', role: 'user', mistralKey: '' })
  const [manualUsers,    setManualUsers]    = useState<ParsedUser[]>([])
  const [showPassword,   setShowPassword]   = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const user = session?.user as { role?: string; name?: string } | undefined

  useEffect(() => {
    if (status === 'unauthenticated') router.replace('/login')
    if (status === 'authenticated' && user?.role !== 'admin') router.replace('/')
  }, [status, user, router])

  if (status === 'loading' || !session || user?.role !== 'admin') return null

  // ── CSV ──
  const handleFile = useCallback((file: File | null | undefined) => {
    if (!file || !file.name.endsWith('.csv')) return
    const reader = new FileReader()
    reader.onload = e => {
      setPreview(parseCSV((e.target?.result as string) ?? ''))
      setImportStatus(null)
    }
    reader.readAsText(file, 'UTF-8')
  }, [])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleCSVImport = async () => {
    if (!preview?.users?.length) return
    setImportStatus('loading')
    const res = await fetch('/api/admin/import-users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: preview.users, updateExisting }),
    })
    setImportStatus(await res.json())
  }

  // ── Manual ──
  const addManualUser = () => {
    const { username, password, role } = manualForm
    if (!username.trim() || password.length < 6) return
    if (manualUsers.find(u => u.username === username.trim())) return
    setManualUsers(prev => [...prev, { username: username.trim(), password, role, mistralKey: manualForm.mistralKey.trim() }])
    setManualForm({ username: '', password: '', role: 'user', mistralKey: '' })
  }

  const handleManualImport = async () => {
    if (!manualUsers.length) return
    setImportStatus('loading')
    const res = await fetch('/api/admin/import-users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ users: manualUsers, updateExisting }),
    })
    setImportStatus(await res.json())
    setManualUsers([])
  }

  const reset = () => { setImportStatus(null); setPreview(null); setManualUsers([]) }

  const downloadExample = () => {
    const csv  = `nom,mot_de_passe,role,mistral_key\nalice.martin,MotDePasse123,user,\nbob.dupont,SecurePass456,admin,sk-xxx`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'exemple_utilisateurs.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  // ── Toggle component ──
  const Toggle = ({ label, sublabel }: { label: string; sublabel: string }) => (
    <label className="toggle-wrap">
      <div className="toggle-text">
        <span className="toggle-label">{label}</span>
        <span className="toggle-sublabel">{sublabel}</span>
      </div>
      <div
        className={`toggle-switch ${updateExisting ? 'on' : ''}`}
        onClick={() => setUpdateExisting(v => !v)}
      >
        <div className="toggle-knob" />
      </div>
    </label>
  )

  return (
    <main className="app-container" style={{ justifyContent: 'flex-start', paddingTop: '2rem' }}>

      {/* HEADER */}
      <div className="header" style={{ marginBottom: '1.5rem', width: '100%', maxWidth: 700 }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)' }}>⚙ Gestion des utilisateurs</h1>
        <p className="subtitle">ÉcoVillage — Administration</p>
        <div className="user-bar">
          <span className="user-name">👤 {user?.name}</span>
          <button className="admin-link-btn" onClick={() => router.push('/')}>← Retour au questionnaire</button>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 700 }}>

        {/* ── LOADING ── */}
        {importStatus === 'loading' && (
          <div className="quiz-card" style={{ padding: '3rem', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16, display: 'inline-block', animation: 'spin 1.2s linear infinite' }}>🌱</div>
            <p style={{ color: 'var(--text-muted)' }}>Création des comptes en cours…</p>
          </div>
        )}

        {/* ── RÉSULTAT ── */}
        {importStatus && importStatus !== 'loading' && (
          <div className="quiz-card" style={{ padding: '2.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
            <h2 style={{ fontFamily: 'Syne, sans-serif', marginBottom: 16, color: 'var(--correct)', fontSize: '1.4rem' }}>
              Opération terminée
            </h2>

            {/* Compteurs */}
            <div className="import-counters">
              {importStatus.created > 0 && (
                <div className="import-counter created">
                  <span className="counter-num">{importStatus.created}</span>
                  <span className="counter-label">créé{importStatus.created > 1 ? 's' : ''}</span>
                </div>
              )}
              {importStatus.updated > 0 && (
                <div className="import-counter updated">
                  <span className="counter-num">{importStatus.updated}</span>
                  <span className="counter-label">mis à jour</span>
                </div>
              )}
              {importStatus.skipped > 0 && (
                <div className="import-counter skipped">
                  <span className="counter-num">{importStatus.skipped}</span>
                  <span className="counter-label">ignoré{importStatus.skipped > 1 ? 's' : ''}</span>
                </div>
              )}
            </div>

            {importStatus.skipped > 0 && !updateExisting && (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: 16 }}>
                💡 Activez "Mettre à jour si existant" pour modifier les comptes existants
              </p>
            )}

            {importStatus.errors?.length > 0 && (
              <div className="admin-error-box" style={{ marginBottom: 16, textAlign: 'left' }}>
                {importStatus.errors.map((e, i) => <div key={i} style={{ fontSize: '0.82rem' }}>⚠ {e}</div>)}
              </div>
            )}

            <button className="start-btn" style={{ fontSize: '0.9rem', padding: '0.75rem 2rem' }} onClick={reset}>
              ← Nouvelle importation
            </button>
          </div>
        )}

        {/* ── TABS + FORM ── */}
        {!importStatus && (
          <>
            {/* Toggle global — visible dans les deux tabs */}
            <div className="toggle-card">
              <Toggle
                label="Mettre à jour si existant"
                sublabel={updateExisting
                  ? 'Activé — le mot de passe et le rôle seront mis à jour pour les comptes déjà existants'
                  : 'Désactivé — les comptes déjà existants seront ignorés'}
              />
            </div>

            <div className="admin-tabs">
              <button className={`admin-tab ${tab === 'csv' ? 'active' : ''}`}    onClick={() => setTab('csv')}>📄 Importer via CSV</button>
              <button className={`admin-tab ${tab === 'manual' ? 'active' : ''}`} onClick={() => setTab('manual')}>✏️ Saisie manuelle</button>
            </div>

            {/* ─ CSV TAB ─ */}
            {tab === 'csv' && (
              <div>
                <div className="admin-example-box">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap', marginBottom: 10 }}>
                    <div>
                      <div className="admin-section-label">📋 Format CSV attendu</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Colonnes : <code>nom</code> · <code>mot_de_passe</code> · <code>role</code> · <code>mistral_key</code> (optionnels)
                      </div>
                    </div>
                    <button className="admin-dl-btn" onClick={downloadExample}>⬇ Exemple CSV</button>
                  </div>
                  <div className="admin-code-block">
                    {['nom,mot_de_passe,role,mistral_key', 'alice.martin,MotDePasse123,user,', 'bob.dupont,SecurePass456,admin,sk-xxx'].map((l, i) => (
                      <div key={i} style={{ color: i === 0 ? 'var(--accent)' : 'var(--text-muted)', fontSize: 12, lineHeight: 1.9 }}>{l}</div>
                    ))}
                  </div>
                </div>

                <div
                  className={`admin-dropzone ${isDragging ? 'dragging' : ''}`}
                  onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>🌍</span>
                  <div>{isDragging ? 'Relâchez le fichier ici' : 'Déposez votre fichier CSV ici'}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>ou cliquez pour parcourir · .csv uniquement</div>
                  <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }}
                    onChange={e => handleFile(e.target.files?.[0])} />
                </div>

                {(preview?.errors?.length ?? 0) > 0 && (
                  <div className="admin-error-box">
                    <div className="admin-section-label" style={{ color: 'var(--wrong)', marginBottom: 4 }}>
                      ⚠ {preview!.errors.length} erreur{preview!.errors.length > 1 ? 's' : ''}
                    </div>
                    {preview!.errors.map((e, i) => <div key={i} style={{ fontSize: '0.8rem' }}>{e}</div>)}
                  </div>
                )}

                {(preview?.users?.length ?? 0) > 0 && (
                  <>
                    <div className="quiz-card" style={{ overflow: 'hidden', marginBottom: 16 }}>
                      <div className="admin-table-header">
                        <span className="admin-section-label">✓ {preview!.users.length} utilisateur{preview!.users.length > 1 ? 's' : ''} prêt{preview!.users.length > 1 ? 's' : ''}</span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>mots de passe hashés avant stockage</span>
                      </div>
                      <table className="admin-table">
                        <thead>
                          <tr><th>#</th><th>Nom d'utilisateur</th><th>Mot de passe</th><th>Rôle</th></tr>
                        </thead>
                        <tbody>
                          {preview!.users.map((u, i) => (
                            <tr key={i}>
                              <td style={{ color: 'var(--text-muted)', fontFamily: 'DM Mono, monospace' }}>{String(i + 1).padStart(2, '0')}</td>
                              <td>{u.username}</td>
                              <td style={{ fontFamily: 'DM Mono, monospace', color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{'•'.repeat(Math.min(u.password.length, 10))}</td>
                              <td><RoleBadge role={u.role} /></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="admin-action-row">
                      <button className="restart-btn" style={{ width: 'auto', margin: 0, padding: '0.7rem 1.5rem' }} onClick={() => setPreview(null)}>✕ Annuler</button>
                      <button className="next-btn" onClick={handleCSVImport}>
                        {updateExisting ? '🔄' : '🌱'} {updateExisting ? 'Importer / Mettre à jour' : 'Importer'} {preview!.users.length} utilisateur{preview!.users.length > 1 ? 's' : ''}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ─ MANUAL TAB ─ */}
            {tab === 'manual' && (
              <div>
                <div className="quiz-card" style={{ padding: '1.5rem', marginBottom: 16 }}>
                  <div className="admin-form-grid">
                    <div className="admin-form-field">
                      <label className="admin-section-label">Nom d'utilisateur</label>
                      <input className="chat-input" type="text" placeholder="alice.martin"
                        value={manualForm.username}
                        onChange={e => setManualForm(f => ({ ...f, username: e.target.value }))}
                        onKeyDown={e => e.key === 'Enter' && addManualUser()}
                      />
                    </div>
                    <div className="admin-form-field">
                      <label className="admin-section-label">Mot de passe (min 6 cars)</label>
                      <div style={{ position: 'relative' }}>
                        <input className="chat-input" type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••" style={{ paddingRight: 40, width: '100%' }}
                          value={manualForm.password}
                          onChange={e => setManualForm(f => ({ ...f, password: e.target.value }))}
                          onKeyDown={e => e.key === 'Enter' && addManualUser()}
                        />
                        <button type="button" onClick={() => setShowPassword(v => !v)}
                          style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 16 }}>
                          {showPassword ? '🙈' : '👁'}
                        </button>
                      </div>
                    </div>
                    <div className="admin-form-field">
                      <label className="admin-section-label">Rôle</label>
                      <select className="chat-input" value={manualForm.role}
                        onChange={e => setManualForm(f => ({ ...f, role: e.target.value }))}>
                        <option value="user">Utilisateur</option>
                        <option value="admin">Administrateur</option>
                      </select>
                    </div>
                    <div className="admin-form-field" style={{ gridColumn: '1 / -1' }}>
                      <label className="admin-section-label">Clé Mistral AI <span style={{fontWeight:400,textTransform:'none',letterSpacing:0}}>(optionnel)</span></label>
                      <input className="chat-input" type="text" placeholder="sk-…"
                        value={manualForm.mistralKey}
                        onChange={e => setManualForm(f => ({ ...f, mistralKey: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button className="next-btn"
                      onClick={addManualUser}
                      disabled={!manualForm.username.trim() || manualForm.password.length < 6}>
                      + Ajouter à la liste
                    </button>
                  </div>
                </div>

                {manualUsers.length > 0 && (
                  <>
                    <div className="quiz-card" style={{ overflow: 'hidden', marginBottom: 16 }}>
                      <div className="admin-table-header">
                        <span className="admin-section-label">{manualUsers.length} utilisateur{manualUsers.length > 1 ? 's' : ''} à traiter</span>
                      </div>
                      <table className="admin-table">
                        <thead><tr><th>Nom d'utilisateur</th><th>Rôle</th><th></th></tr></thead>
                        <tbody>
                          {manualUsers.map((u, i) => (
                            <tr key={i}>
                              <td>{u.username}</td>
                              <td><RoleBadge role={u.role} /></td>
                              <td style={{ textAlign: 'right' }}>
                                <button onClick={() => setManualUsers(prev => prev.filter((_, idx) => idx !== i))}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--wrong)', fontSize: 18 }}>✕</button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="admin-action-row">
                      <button className="restart-btn" style={{ width: 'auto', margin: 0, padding: '0.7rem 1.5rem' }} onClick={() => setManualUsers([])}>✕ Vider</button>
                      <button className="next-btn" onClick={handleManualImport}>
                        {updateExisting ? '🔄 Créer / Mettre à jour' : '🌱 Créer'} {manualUsers.length} utilisateur{manualUsers.length > 1 ? 's' : ''}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
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

        /* Toggle */
        .toggle-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 1rem;
          padding: 1rem 1.25rem;
          margin-bottom: 1rem;
        }
        .toggle-wrap {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
          cursor: pointer;
          user-select: none;
        }
        .toggle-text { display: flex; flex-direction: column; gap: 2px; }
        .toggle-label {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 0.88rem;
          color: var(--text);
        }
        .toggle-sublabel {
          font-size: 0.75rem;
          color: var(--text-muted);
          line-height: 1.4;
        }
        .toggle-switch {
          width: 48px;
          height: 26px;
          border-radius: 999px;
          background: var(--surface2);
          border: 1.5px solid var(--border);
          position: relative;
          flex-shrink: 0;
          transition: background 0.2s, border-color 0.2s;
          cursor: pointer;
        }
        .toggle-switch.on {
          background: var(--accent);
          border-color: var(--accent);
        }
        .toggle-knob {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--text-muted);
          transition: transform 0.2s, background 0.2s;
        }
        .toggle-switch.on .toggle-knob {
          transform: translateX(22px);
          background: #fff;
        }

        /* Compteurs résultat */
        .import-counters {
          display: flex;
          gap: 1rem;
          justify-content: center;
          margin-bottom: 1rem;
          flex-wrap: wrap;
        }
        .import-counter {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.75rem 1.5rem;
          border-radius: 0.875rem;
          border: 1.5px solid;
          min-width: 90px;
        }
        .import-counter.created  { background: rgba(67,233,123,0.08);  border-color: rgba(67,233,123,0.3);  }
        .import-counter.updated  { background: rgba(108,99,255,0.08);  border-color: rgba(108,99,255,0.3);  }
        .import-counter.skipped  { background: rgba(255,199,0,0.08);   border-color: rgba(255,199,0,0.3);   }
        .counter-num   { font-family:'Syne',sans-serif; font-size:2rem; font-weight:800; line-height:1; }
        .counter-label { font-size:0.75rem; color:var(--text-muted); margin-top:2px; }
        .import-counter.created .counter-num  { color: var(--correct); }
        .import-counter.updated .counter-num  { color: var(--accent); }
        .import-counter.skipped .counter-num  { color: #ffc700; }

        /* Reste des styles admin */
        .admin-tabs { display:flex; gap:4px; margin-bottom:1.25rem; background:var(--surface); padding:4px; border-radius:1rem; border:1px solid var(--border); }
        .admin-tab { flex:1; padding:0.7rem 0; border-radius:0.75rem; border:none; cursor:pointer; font-family:'Syne',sans-serif; font-size:0.85rem; font-weight:700; background:transparent; color:var(--text-muted); transition:all 0.2s; }
        .admin-tab.active { background:var(--surface2); color:var(--text); box-shadow:0 2px 8px rgba(0,0,0,0.3); }
        .admin-example-box { background:var(--surface); border:1px solid var(--border); border-radius:1rem; padding:1.25rem; margin-bottom:1rem; }
        .admin-section-label { font-family:'Syne',sans-serif; font-weight:700; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.1em; color:var(--text-muted); }
        .admin-code-block { background:var(--bg); border-radius:0.5rem; padding:0.75rem 1rem; margin-top:0.5rem; font-family:'DM Mono',monospace; }
        .admin-dl-btn { font-family:'Syne',sans-serif; font-weight:700; font-size:0.75rem; padding:0.45rem 1rem; border-radius:999px; border:1.5px solid var(--border); cursor:pointer; background:transparent; color:var(--text-muted); transition:all 0.15s; white-space:nowrap; }
        .admin-dl-btn:hover { border-color:var(--accent); color:var(--accent); }
        .admin-dropzone { border:2px dashed var(--border); border-radius:1rem; padding:2.5rem 1.5rem; text-align:center; cursor:pointer; background:var(--surface); transition:all 0.2s; margin-bottom:1rem; color:var(--text-muted); font-size:0.9rem; }
        .admin-dropzone.dragging { border-color:var(--accent); background:rgba(108,99,255,0.06); color:var(--text); }
        .admin-dropzone:hover { border-color:var(--accent); }
        .admin-error-box { background:rgba(255,77,109,0.07); border:1px solid rgba(255,77,109,0.25); border-radius:0.875rem; padding:1rem 1.25rem; margin-bottom:1rem; color:var(--wrong); }
        .admin-table-header { display:flex; justify-content:space-between; align-items:center; padding:0.875rem 1.25rem; border-bottom:1px solid var(--border); }
        .admin-table { width:100%; border-collapse:collapse; }
        .admin-table th { padding:0.6rem 1.25rem; text-align:left; font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.08em; border-bottom:1px solid var(--border); font-family:'Syne',sans-serif; }
        .admin-table td { padding:0.75rem 1.25rem; font-size:0.85rem; border-bottom:1px solid var(--surface2); color:var(--text); }
        .admin-table tr:last-child td { border-bottom:none; }
        .admin-action-row { display:flex; justify-content:flex-end; gap:0.75rem; }
        .admin-form-grid { display:grid; grid-template-columns:1fr 1fr auto; gap:1rem; }
        .admin-form-field { display:flex; flex-direction:column; gap:0.4rem; }
        @media (max-width:560px) { .admin-form-grid { grid-template-columns:1fr; } }
      `}</style>
    </main>
  )
}

// ── Sessions Tab Component (ajout en bas du fichier) ──────────────────────
// Ce composant est importé dans AdminUsersPage via une navigation distincte
// Accessible sur /admin/sessions
