'use client'
import { useState } from 'react'

type Status = 'idle' | 'loading' | 'success' | 'error'

const SCENE = [
  { icon: '🏛️', compass: 'Centre', desc: 'Place du village, mairie, commerces, parkings surchargés, déchets domestiques' },
  { icon: '🌲', compass: 'Est',    desc: 'Forêt avec déforestation partielle, parc public, départ randonnées' },
  { icon: '💧', compass: 'Sud',    desc: "Rivière polluée traversant le village, station d'épuration" },
  { icon: '🏭', compass: 'Ouest',  desc: 'Zone industrielle, usine avec fumées noires, parking camions, déchetterie' },
  { icon: '🌾', compass: 'Nord',   desc: 'Champs agricoles, vergers, ferme pédagogique' },
  { icon: '⚠️', compass: 'Global', desc: "Pollution de l'usine, déchets présents, déforestation partielle, trafic routier important, gestion des déchets domestiques" },
]

interface Props {
  onContinue: () => void
  isLoggedIn: boolean
  onImageGenerated?: (b64: string) => void
}

export default function VillageImage({ onContinue, isLoggedIn, onImageGenerated }: Props) {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [imageB64, setImageB64] = useState('')

  const generate = async () => {
    setStatus('loading'); setErrorMsg(''); setImageB64('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      const data: { image?: string; error?: string } = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Erreur ' + res.status)
      if (!data.image) throw new Error('Aucune image reçue.')
      setImageB64(data.image)
      setStatus('success')
      onImageGenerated?.(data.image)
    } catch (e: unknown) {
      setStatus('error')
      setErrorMsg(e instanceof Error ? e.message : String(e))
    }
  }

  const download = () => {
    const a = document.createElement('a')
    a.href = 'data:image/png;base64,' + imageB64
    a.download = 'ecovillage-pessimiste.png'
    a.click()
  }

  return (
    <div className="vi-wrapper">
      <div className="vi-header">
        {/* Badge et boutons visibles seulement si connecté */}
        {isLoggedIn && <div className="vi-badge">Étape 1 / 3</div>}
        <h2 className="vi-title">Visualisez votre village</h2>
        <p className="vi-subtitle">Générez une illustration IA du village avant de commencer le questionnaire</p>
      </div>

      <div className="vi-scene-card">
        <div className="vi-scene-title">🗺️ Description de la scène</div>
        {SCENE.map(s => (
          <div key={s.compass} className={'vi-scene-row' + (s.compass === 'Global' ? ' vi-scene-global' : '')}>
            <span className="vi-scene-icon">{s.icon}</span>
            <span className="vi-scene-compass">{s.compass}</span>
            <span className="vi-scene-desc">{s.desc}</span>
          </div>
        ))}
      </div>

      {/* Toute la zone d'action est masquée si non connecté */}
      {isLoggedIn ? (
        <div className="vi-card">
          <div className="vi-actions">
            <button type="button" className="vi-generate-btn" onClick={generate} disabled={status === 'loading'}>
              {status === 'loading' ? <><span className="vi-spinner" /> Génération…</> : "🏘️ Obtenir l'image du village avant vos actions"}
            </button>
            <button type="button" className="vi-skip-btn" onClick={onContinue}>
              Passer cette étape →
            </button>
          </div>

          {status === 'error'   && <div className="vi-alert error">❌ {errorMsg}</div>}
          {status === 'loading' && <div className="vi-alert info">⏳ Mistral AI génère l'image (FLUX Pro Ultra), environ 20 secondes…</div>}
        </div>
      ) : (
        /* Rien n'est affiché si non connecté — NextAuth redirige déjà vers /login */
        null
      )}

      {isLoggedIn && status === 'success' && imageB64 && (
        <div className="vi-result">
          <div className="vi-result-header">
            <span className="vi-result-badge">✓ Image générée</span>
            <button type="button" className="vi-download-btn" onClick={download}>⬇ Télécharger</button>
          </div>
          <img src={'data:image/png;base64,' + imageB64} alt="Village pessimiste" className="vi-result-img" />
          <button type="button" className="vi-continue-btn" onClick={onContinue}>
            Continuer vers le questionnaire →
          </button>
        </div>
      )}
    </div>
  )
}
