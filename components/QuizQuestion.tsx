'use client'
import { useState } from 'react'
import { Question, PREAMBULES, Groupe } from '@/lib/questions'

interface Props {
  question: Question
  questionIndex: number
  totalQuestions: number
  groupe: Groupe
  onAnswer: (selectedIds: string[]) => void
}

const LETTERS = ['A', 'B', 'C', 'D', 'E']

export default function QuizQuestion({ question, questionIndex, totalQuestions, groupe, onAnswer }: Props) {
  const [selected, setSelected] = useState<string[]>([])
  const [hovered, setHovered] = useState<string | null>(null)
  const [showOptions, setShowOptions] = useState(false)
  const preambule = PREAMBULES[groupe]
  const progress = ((questionIndex + 1) / totalQuestions) * 100

  const toggle = (id: string) => {
    setSelected(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : prev.length < 2 ? [...prev, id] : prev
    )
  }

  const hoveredOption = question.options.find(o => o.id === hovered)

  return (
    <div className="quiz-card">
      <div className="progress-bar-wrap">
        <div className="progress-bar" style={{ width: `${progress}%` }} />
      </div>

      {/* Préambule */}
      <div className="inline-preambule">
        <div className="inline-preambule-section">
          <div className="inline-preambule-title">{preambule.intro.title}</div>
          <div className="inline-preambule-text">
            {preambule.intro.text.split('\n').map((line, i) => line ? <p key={i}>{line}</p> : <br key={i} />)}
          </div>
        </div>
        <div className="inline-preambule-section">
          <div className="inline-preambule-title objectifs-color">{preambule.objectifs.title}</div>
          <div className="inline-preambule-text">
            {preambule.objectifs.text.split('\n').map((line, i) => line ? <p key={i}>{line}</p> : <br key={i} />)}
          </div>
        </div>
      </div>

      <div className="question-area">
        <div className="question-text">
          <p>{preambule.callToAction}</p>
        </div>
        {!showOptions && (
          <button className="start-btn" style={{ marginTop: '1.5rem' }} onClick={() => setShowOptions(true)}>
            Continuer →
          </button>
        )}
      </div>

      {showOptions && (
      <><div className="q-meta" style={{ padding: '0 1.5rem' }}>
          <span className="q-number">Question {questionIndex + 1}/{totalQuestions}</span>
          <span className="q-hint">Choisissez 2 réponses</span>
        </div>
      <div className="options-list">
        {question.options.map((opt, i) => {
          const isSelected = selected.includes(opt.id)
          const isDisabled = selected.length === 2 && !isSelected
          return (
            <button
              key={opt.id}
              className={`option-btn${isSelected ? ' selected' : ''}${isDisabled ? ' disabled-look' : ''}`}
              onClick={() => toggle(opt.id)}
              onMouseEnter={() => setHovered(opt.id)}
              onMouseLeave={() => setHovered(null)}
            >
              <span className="option-letter">{LETTERS[i]}</span>
              {opt.emoji && <span className="option-emoji">{opt.emoji}</span>}
              <span className="option-text">
                <strong>{opt.text}</strong>
                {opt.detail && <span className="option-detail"> — {opt.detail}</span>}
              </span>
              {isSelected && <span className="option-check">◉</span>}
            </button>
          )
        })}
      </div>

      {hoveredOption && (hoveredOption.pros || hoveredOption.cons) && (
        <div className="pros-cons">
          {hoveredOption.pros && (
            <div className="pros-block">
              {hoveredOption.pros.map((p, i) => <div key={i} className="pro-item">✅ {p}</div>)}
            </div>
          )}
          {hoveredOption.cons && (
            <div className="cons-block">
              {hoveredOption.cons.map((c, i) => <div key={i} className="con-item">⚠️ {c}</div>)}
            </div>
          )}
        </div>
      )}

      <div className="actions">
        <span className="feedback-text">
          {selected.length === 0 && 'Choisissez 2 réponses'}
          {selected.length === 1 && 'Encore 1 réponse à choisir'}
          {selected.length === 2 && '2 réponses sélectionnées ✓'}
        </span>
        <button className="next-btn" onClick={() => onAnswer(selected)} disabled={selected.length < 2}>
          {questionIndex + 1 < totalQuestions ? 'Suivant →' : 'Voir le bilan →'}
        </button>
      </div>
      </>)}
    </div>
  )
}
