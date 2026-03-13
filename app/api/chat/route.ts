import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { messages, quizContext } = await req.json()

  const apiKey = req.headers.get('x-api-key') || process.env.MISTRAL_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Aucune clé API Mistral fournie.' }, { status: 401 })
  }

  const systemPrompt = `Tu es un expert en écologie, développement durable et transition énergétique des territoires ruraux. Tu rédiges des analyses détaillées, rigoureuses et pédagogiques destinées à des citoyens engagés.

${quizContext}

Pour chaque groupe (agriculteurs, industriels, habitants, élus), analyse en profondeur :
- L'impact écologique concret de chaque action choisie (réduction de CO₂, biodiversité, qualité de l'eau, qualité de l'air, consommation d'énergie)
- Les bénéfices à court terme (1-3 ans) et à long terme (10-20 ans)
- Les éventuelles tensions ou synergies entre les choix des différents groupes

Dresse ensuite un bilan collectif complet :
- Les priorités communes et la vision partagée du village
- Les convergences qui forment une stratégie cohérente
- Les divergences ou arbitrages nécessaires
- Une évaluation globale de l'ambition écologique du village sur une échelle de 1 à 10

Termine par des recommandations d'actions concrètes, classées par ordre de priorité et d'impact, avec des indicateurs mesurables de succès.

Sois précis, factuel, encourageant et constructif. Utilise des données chiffrées quand c'est pertinent. Tu t'exprimes exclusivement en français.`

  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-large-latest',
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
        max_tokens: 2500,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return NextResponse.json({ error: err }, { status: response.status })
    }

    const data = await response.json()
    return NextResponse.json({ content: data.choices?.[0]?.message?.content ?? '' })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
