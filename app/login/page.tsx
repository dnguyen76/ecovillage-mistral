'use client'
import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const { status } = useSession()
  const [username, setUsername]         = useState('')
  const [password, setPassword]         = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError]               = useState('')
  const [loading, setLoading]           = useState(false)

  useEffect(() => {
    if (status === 'authenticated') router.replace('/')
  }, [status, router])

  if (status === 'loading' || status === 'authenticated') return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(''); setLoading(true)
    const res = await signIn('credentials', { username, password, redirect: false })
    setLoading(false)
    if (res?.error) {
      setError("Nom d'utilisateur ou mot de passe incorrect.")
    } else {
      router.replace('/')
    }
  }

  return (
    <main className="app-container">
      <div className="header">
        <h1>🌿 ÉcoVillage</h1>
        <p className="subtitle">Questionnaire participatif sur le développement durable</p>
      </div>

      <div className="login-card">
        <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔐</div>
        <h2 className="login-title">Connexion</h2>
        <p className="login-subtitle">Entrez vos identifiants pour accéder au questionnaire</p>

        <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
          <input type="text"     style={{ display: 'none' }} autoComplete="username"         readOnly />
          <input type="password" style={{ display: 'none' }} autoComplete="current-password" readOnly />

          <div className="login-field">
            <label className="login-label">Nom d'utilisateur</label>
            <input
              className="login-input"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required autoFocus autoComplete="off"
              name="ecovillage-username"
            />
          </div>

          <div className="login-field">
            <label className="login-label">Mot de passe</label>
            <div className="login-input-wrap">
              <input
                className="login-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required autoComplete="new-password"
                name="ecovillage-password"
                style={{ paddingRight: '3rem' }}
              />
              <button type="button" className="login-eye"
                onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                {showPassword ? '🙈' : '👁'}
              </button>
            </div>
          </div>

          {error && <div className="login-error">⚠ {error}</div>}

          <button type="submit" className="start-btn login-submit"
            disabled={loading || !username.trim() || !password}>
            {loading ? '…' : '→ Se connecter'}
          </button>
        </form>
      </div>
    </main>
  )
}
