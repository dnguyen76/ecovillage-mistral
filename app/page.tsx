'use client'
import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import VillageImage from '@/components/VillageImage'
import QuizQuestion from '@/components/QuizQuestion'
import Summary from '@/components/Summary'
import { QUESTIONS, GROUPES, UserAnswer, Groupe } from '@/lib/questions'

type Phase = 'intro' | 'intro2' | 'image' | 'choix-groupe' | 'quiz' | 'summary'

const ORDRE_GROUPES: Groupe[] = ['agriculteurs', 'industriels', 'habitants', 'elus']

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [phase, setPhase]             = useState<Phase>('intro')
  const [groupeActuel, setGroupeActuel] = useState<Groupe | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [allAnswers, setAllAnswers]     = useState<UserAnswer[]>([])
  const [groupesDone, setGroupesDone]   = useState<Groupe[]>([])
  const [imageAvant, setImageAvant]       = useState<string>('')

  if (status === 'loading') return null

  const user       = session?.user as { name?: string; role?: string; mistralKey?: string } | undefined
  const apiKey     = user?.mistralKey ?? ''
  const isLoggedIn = status === 'authenticated'

  const questionsGroupe  = groupeActuel ? QUESTIONS.filter(q => q.groupe === groupeActuel) : []
  const groupesRestants  = ORDRE_GROUPES.filter(g => !groupesDone.includes(g))

  const handleGroupe = (g: Groupe) => { setGroupeActuel(g); setCurrentIndex(0); setPhase('quiz') }

  const handleAnswer = (selectedIds: string[]) => {
    const q = questionsGroupe[currentIndex]
    const newAnswers = [...allAnswers, { questionId: q.id, selectedIds, questionText: q.text, options: q.options, groupe: q.groupe }]
    setAllAnswers(newAnswers)
    if (currentIndex + 1 < questionsGroupe.length) {
      setCurrentIndex(currentIndex + 1)
    } else {
      const newDone = [...groupesDone, groupeActuel!]
      setGroupesDone(newDone)
      if (newDone.length === ORDRE_GROUPES.length) setPhase('summary')
      else { setGroupeActuel(null); setPhase('choix-groupe') }
    }
  }

  const restart = () => {
    setPhase('intro'); setGroupeActuel(null)
    setCurrentIndex(0); setAllAnswers([]); setGroupesDone([]); setImageAvant('')
  }

  return (
    <main className="app-container">
      <div className="header">
        <h1>🌿 ÉcoVillage</h1>
        <p className="subtitle">Donnez votre avis pour construire ensemble</p>
        <div className="user-bar">
          <span className="user-name">👤 {user?.name}</span>
          {user?.role === 'admin' && (
            <>
              <button className="admin-link-btn" onClick={() => router.push('/admin/users')}>⚙ Utilisateurs</button>
              <button className="admin-link-btn" onClick={() => router.push('/admin/sessions')}>📊 Sessions</button>
            </>
          )}
          <button className="logout-btn" onClick={() => signOut({ callbackUrl: '/login' })}>Déconnexion</button>
        </div>
      </div>

      {phase === 'intro' && (
        <div className="intro-card">
          <div className="intro-icon">🌿</div>
          <h2 className="intro-title">Bienvenue dans ÉcoVillage</h2>
          <p className="intro-text">
            L&apos;assistant virtuel Éco-Village encadre un jeu de simulation où les participants incarnent
            les habitants, élus, agriculteurs ou industriels d&apos;un village en transition.
            À travers des choix concrets, ils explorent ensemble comment construire un territoire
            plus écologique, solidaire et durable.
          </p>
          <button className="start-btn" onClick={() => setPhase('intro2')}>
            Découvrir le principe →
          </button>
        </div>
      )}

      {phase === 'intro2' && (
        <div className="intro-card">
          <h2 className="intro-title">🎉 Bienvenue dans le jeu Éco-Village&nbsp;!</h2>
          <p className="intro-text" style={{ textAlign: 'left' }}>
            Aujourd&apos;hui, c&apos;est vous qui avez les cartes en main. Votre mission&nbsp;: imaginer
            des actions concrètes pour transformer un village dans les années à venir.
          </p>
          <div className="intro-rules">
            <p className="intro-rules-title">Voici le principe du jeu&nbsp;:</p>
            <ul className="intro-rules-list">
              <li>Il y a <strong>4 groupes</strong> dans le village&nbsp;: 🚜 agriculteurs, 🏭 industriels, 🏘️ habitants, 🏛️ élus locaux.</li>
              <li>Chaque groupe dispose de <strong>5 actions</strong> possibles.</li>
              <li>Chaque groupe doit choisir <strong>2 actions</strong>.</li>
              <li>À la fin, nous aurons <strong>8 décisions</strong> au total.</li>
              <li>Ensuite, nous verrons à quoi ressemble le village <strong>quelques années plus tard</strong> selon vos choix.</li>
            </ul>
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <button className="start-btn" style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }} onClick={() => setPhase('intro')}>
              ← Retour
            </button>
            <button className="start-btn" onClick={() => setPhase('image')}>
              Commencer →
            </button>
          </div>
        </div>
      )}

      {phase === 'image' && <VillageImage onContinue={() => setPhase('choix-groupe')} isLoggedIn={isLoggedIn} onImageGenerated={setImageAvant} />}

      {phase === 'choix-groupe' && (
        <div className="groupe-screen">
          <p className="groupe-intro">Nous sommes…</p>
          {groupesDone.length > 0 && (
            <>
              <div className="groupes-progress">
                {ORDRE_GROUPES.map(g => (
                  <div key={g} className={'groupe-progress-item ' + (groupesDone.includes(g) ? 'done' : 'pending')}>
                    <span>{GROUPES[g].emoji}</span>
                    <span>{groupesDone.includes(g) ? '✓' : '…'}</span>
                  </div>
                ))}
              </div>
              <p className="groupes-remaining">
                {groupesRestants.length} groupe{groupesRestants.length > 1 ? 's' : ''} restant{groupesRestants.length > 1 ? 's' : ''} avant le bilan collectif
              </p>
            </>
          )}
          <div className="groupe-grid">
            {ORDRE_GROUPES.map(g => {
              const done = groupesDone.includes(g)
              return (
                <button key={g} className={'groupe-btn' + (done ? ' groupe-btn-done' : '')}
                  onClick={() => !done && handleGroupe(g)} disabled={done}>
                  <span className="groupe-emoji">{GROUPES[g].emoji}</span>
                  <span className="groupe-label">{GROUPES[g].label}</span>
                  {done && <span className="groupe-done-badge">✓ Répondu</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {phase === 'quiz' && groupeActuel && questionsGroupe[currentIndex] && (
        <QuizQuestion
          key={groupeActuel + '-' + currentIndex}
          question={questionsGroupe[currentIndex]}
          questionIndex={currentIndex}
          totalQuestions={questionsGroupe.length}
          groupe={groupeActuel}
          onAnswer={handleAnswer}
        />
      )}

      {phase === 'summary' && (
        <Summary answers={allAnswers} apiKey={apiKey} imageAvant={imageAvant} onRestart={restart} />
      )}
    </main>
  )
}
