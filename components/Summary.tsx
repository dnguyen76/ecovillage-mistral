'use client'
import { useState, useRef, useEffect } from 'react'
import { UserAnswer, GROUPES, Groupe } from '@/lib/questions'
import { buildAfterPrompt } from '@/lib/villagePrompts'

interface Props {
  answers: UserAnswer[]
  apiKey: string
  imageAvant: string
  onRestart: () => void
}

interface ChatMessage { role: 'user' | 'assistant'; content: string }
type ImgStatus = 'idle' | 'loading' | 'success' | 'error'

const ORDRE_GROUPES: Groupe[] = ['agriculteurs', 'industriels', 'habitants', 'elus']

function buildQuizContext(answers: UserAnswer[]): string {
  let ctx = `Bilan collectif d'un questionnaire participatif sur le développement durable d'un village.\n\n`
  ORDRE_GROUPES.forEach(groupe => {
    const ga = answers.filter(a => a.groupe === groupe)
    if (!ga.length) return
    const g = GROUPES[groupe as Groupe]
    ctx += `${g.emoji} ${g.label} :\n`
    ga.forEach((a, i) => {
      const chosen = a.selectedIds.map(id => a.options.find(o => o.id === id)?.text ?? id)
      ctx += `  Q${i + 1}: ${chosen.join(' + ')}\n`
    })
    ctx += '\n'
  })
  return ctx
}

function extractChoices(answers: UserAnswer[]) {
  const byGroupe: Record<string, string[]> = { agriculteurs: [], industriels: [], habitants: [], elus: [] }
  answers.forEach(a => {
    a.selectedIds.forEach(id => {
      const opt = a.options.find(o => o.id === id)
      if (opt && byGroupe[a.groupe]) byGroupe[a.groupe].push(opt.text)
    })
  })
  return byGroupe as { agriculteurs: string[]; industriels: string[]; habitants: string[]; elus: string[] }
}

async function callMistral(apiKey: string, messages: ChatMessage[], quizContext: string) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    body: JSON.stringify({ messages, quizContext }),
  })
  const data = await res.json()
  return data.content ?? `Erreur: ${data.error}`
}

export default function Summary({ answers, apiKey, imageAvant, onRestart }: Props) {
  const [bilanMessages, setBilanMessages] = useState<ChatMessage[]>([])
  const [bilanInput, setBilanInput] = useState('')
  const [bilanLoading, setBilanLoading] = useState(false)
  const bilanEndRef = useRef<HTMLDivElement>(null)

  const [imgStatus, setImgStatus] = useState<ImgStatus>('idle')
  const [imgError, setImgError] = useState('')
  const [imageB64, setImageB64] = useState('')

  const [analyseMessages, setAnalyseMessages] = useState<ChatMessage[]>([])
  const [analyseLoading, setAnalyseLoading] = useState(false)
  const analyseEndRef = useRef<HTMLDivElement>(null)

  const [savedSessionId, setSavedSessionId] = useState<number | null>(null)
  const [saveError, setSaveError] = useState('')

  const quizContext = buildQuizContext(answers)

  useEffect(() => { bilanEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [bilanMessages, bilanLoading])
  useEffect(() => { analyseEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [analyseMessages, analyseLoading])

  // saveSession — appelée une fois le bilan Mistral reçu
  const saveSession = async (bilanText: string, imageApresB64: string) => {
    try {
      const res = await fetch('/api/ecovillage-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          imageAvant,
          imageApres: imageApresB64,
          bilanMistral: bilanText,
        }),
      })
      const d = await res.json()
      if (d.sessionId) setSavedSessionId(d.sessionId)
      else setSaveError(d.error ?? 'Erreur sauvegarde')
    } catch {
      setSaveError('Impossible de sauvegarder la session')
    }
  }

  useEffect(() => {
    const auto: ChatMessage = { role: 'user', content: "Dresse un bilan collectif des choix des 4 groupes : convergences, divergences et pistes d'action concrètes pour le village." }
    setBilanMessages([auto])
    setBilanLoading(true)
    callMistral(apiKey, [auto], quizContext)
      .then(content => {
        setBilanMessages(prev => [...prev, { role: 'assistant', content }])
        // Sauvegarde après réception du bilan (images pas encore générées)
        saveSession(content, '')
      })
      .catch(() => setBilanMessages(prev => [...prev, { role: 'assistant', content: "Impossible de contacter l'API Mistral." }]))
      .finally(() => setBilanLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sendBilan = async () => {
    if (!bilanInput.trim() || bilanLoading) return
    const userMsg: ChatMessage = { role: 'user', content: bilanInput.trim() }
    const newMessages = [...bilanMessages, userMsg]
    setBilanMessages(newMessages); setBilanInput(''); setBilanLoading(true)
    const content = await callMistral(apiKey, newMessages, quizContext).catch(() => "Erreur API Mistral.")
    setBilanMessages(prev => [...prev, { role: 'assistant', content }])
    setBilanLoading(false)
  }

  const generateImage = async () => {
    setImgStatus('loading'); setImgError(''); setImageB64('')
    try {
      const choices = extractChoices(answers)
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customPrompt: buildAfterPrompt(choices) }),
      })
      const data: { image?: string; error?: string } = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Erreur ' + res.status)
      if (!data.image) throw new Error('Aucune image reçue.')
      setImageB64(data.image)
      setImgStatus('success')
      // Met à jour la session avec l'image après
      saveSession(bilanMessages.find(m => m.role === 'assistant')?.content ?? '', data.image)

      const analyseQ: ChatMessage = {
        role: 'user',
        content: "Analyse les actions choisies par chacun des 4 groupes sous l'angle écologique : impacts environnementaux concrets de chaque action, synergies entre groupes, et bénéfices les plus importants pour le village et la planète."
      }
      setAnalyseMessages([analyseQ]); setAnalyseLoading(true)
      callMistral(apiKey, [analyseQ], quizContext)
        .then(content => setAnalyseMessages(prev => [...prev, { role: 'assistant', content }]))
        .catch(() => setAnalyseMessages(prev => [...prev, { role: 'assistant', content: "Impossible de contacter l'API Mistral." }]))
        .finally(() => setAnalyseLoading(false))

    } catch (e: unknown) {
      setImgStatus('error')
      setImgError(e instanceof Error ? e.message : String(e))
    }
  }

  const downloadImage = () => {
    const a = document.createElement('a')
    a.href = 'data:image/png;base64,' + imageB64
    a.download = 'village-transforme.png'
    a.click()
  }

  return (
    <div className="summary-card">
      <div className="summary-header">
        <div className="summary-groupe-badge">🌿 Bilan collectif</div>
        <h2>Les priorités du village</h2>
        <p className="summary-subtitle">4 groupes · {answers.length} réponses collectées</p>
      </div>

      <div className="summary-answers">
        {ORDRE_GROUPES.map(groupe => {
          const ga = answers.filter(a => a.groupe === groupe)
          if (!ga.length) return null
          const g = GROUPES[groupe]
          return (
            <div key={groupe} className="summary-groupe-block">
              <div className="summary-groupe-header">{g.emoji} {g.label}</div>
              {ga.map((a, i) => (
                <div key={a.questionId} className="summary-answer-item neutral-item">
                  <div className="summary-q">{i + 1}. {a.questionText}</div>
                  <div className="summary-choices">
                    {a.selectedIds.map(id => {
                      const opt = a.options.find(o => o.id === id)
                      return <div key={id} className="chosen-ans">{opt?.emoji} {opt?.text}</div>
                    })}
                  </div>
                </div>
              ))}
            </div>
          )
        })}
      </div>

      <div className="chatbot-section">
        <div className="chatbot-title"><span className="dot" />Bilan collectif — Mistral AI</div>
        <div className="chat-messages">
          {bilanMessages.map((msg, i) => (
            <div key={i} className={'chat-msg ' + msg.role}>{msg.content}</div>
          ))}
          {bilanLoading && <div className="chat-msg loading">Mistral analyse les priorités collectives…</div>}
          <div ref={bilanEndRef} />
        </div>
        <div className="chat-input-row">
          <input className="chat-input" type="text"
            placeholder="Posez une question sur le bilan collectif…"
            value={bilanInput} onChange={e => setBilanInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendBilan()}
            disabled={bilanLoading} />
          <button className="chat-send-btn" onClick={sendBilan} disabled={bilanLoading || !bilanInput.trim()}>
            Envoyer
          </button>
        </div>
      </div>

      <div className="optim-section">
        <div className="optim-header">
          <span className="optim-badge">🔄 Même village — même point de vue — mêmes bâtiments</span>
          <h3 className="optim-title">Village avant → après les actions</h3>
          <p className="optim-subtitle">
            Le même village, du même angle, redessiné après les <strong>actions des 4 groupes</strong>.
            Comparez visuellement avec l'image du début.
          </p>
        </div>

        <div className="optim-actions-recap">
          {ORDRE_GROUPES.map(groupe => {
            const ga = answers.filter(a => a.groupe === groupe)
            if (!ga.length) return null
            const g = GROUPES[groupe]
            const allChosen = ga.flatMap(a =>
              a.selectedIds.map(id => {
                const opt = a.options.find(o => o.id === id)
                return opt ? (opt.emoji ? opt.emoji + ' ' + opt.text : opt.text) : ''
              }).filter(Boolean)
            )
            return (
              <div key={groupe} className="optim-recap-row">
                <span className="optim-recap-groupe">{g.emoji} {g.label}</span>
                <span className="optim-recap-choices">{allChosen.join(' · ')}</span>
              </div>
            )
          })}
        </div>

        <div className="optim-config">
          <p className="vi-hint">🇫🇷 Génération via Mistral AI — FLUX Pro Ultra (Black Forest Labs)</p>

          <button type="button" className="optim-generate-btn" onClick={generateImage} disabled={imgStatus === 'loading'}>
            {imgStatus === 'loading'
              ? <><span className="vi-spinner" /> Génération du village transformé…</>
              : '🌱 Générer le village après actions'}
          </button>

          {imgStatus === 'error'   && <div className="vi-alert error">❌ {imgError}</div>}
          {imgStatus === 'loading' && <div className="vi-alert info">⏳ Mistral AI génère l'image (FLUX Pro Ultra), environ 20 secondes…</div>}
        </div>

        {imgStatus === 'success' && imageB64 && (
          <div className="optim-result">
            <div className="vi-result-header">
              <span className="vi-result-badge">✓ Village transformé</span>
              <button type="button" className="vi-download-btn" onClick={downloadImage}>⬇ Télécharger</button>
            </div>
            <img src={'data:image/png;base64,' + imageB64} alt="Village transformé" className="vi-result-img" />
          </div>
        )}

        {(analyseMessages.length > 0 || analyseLoading) && (
          <div className="analysis-section">
            <div className="chatbot-title">
              <span className="dot dot-green" />
              Analyse écologique des actions — Mistral AI
            </div>
            <div className="chat-messages">
              {analyseMessages.map((msg, i) => (
                <div key={i} className={'chat-msg ' + msg.role}>{msg.content}</div>
              ))}
              {analyseLoading && <div className="chat-msg loading">Mistral analyse l'impact écologique des actions choisies…</div>}
              <div ref={analyseEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* Indicateur de sauvegarde */}
      <div className="session-save-indicator">
        {savedSessionId && (
          <span className="save-ok">✓ Session #{savedSessionId} enregistrée</span>
        )}
        {saveError && (
          <span className="save-err">⚠ {saveError}</span>
        )}
      </div>

      <button className="restart-btn" onClick={onRestart}>↩ Recommencer</button>
    </div>
  )
}
