import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { BEFORE_PROMPT } from '@/lib/villagePrompts'

export const maxDuration = 60

export async function GET() {
  return NextResponse.json({ status: 'ok' })
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const sessionUser = session?.user as { mistralKey?: string } | undefined
    const apiKey = sessionUser?.mistralKey || process.env.MISTRAL_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Clé Mistral AI manquante. Contactez un administrateur.' },
        { status: 401 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const prompt: string = body.customPrompt ?? BEFORE_PROMPT

    // 1. Créer un agent avec l'outil image_generation
    const agentRes = await fetch('https://api.mistral.ai/v1/agents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mistral-medium-2505',
        name: 'ecovillage-image-agent',
        description: 'Agent de génération d\'image pour écovillage',
        instructions: 'Generate exactly the image described by the user. Always use the image generation tool immediately.',
        tools: [{ type: 'image_generation' }],
        completion_args: { temperature: 0.3, top_p: 0.95 },
      }),
    })

    if (!agentRes.ok) {
      const text = await agentRes.text().catch(() => '')
      return NextResponse.json(
        { error: `Mistral agent ${agentRes.status}`, detail: text },
        { status: 502 }
      )
    }

    const { id: agentId } = await agentRes.json()

    // 2. Démarrer la conversation avec le prompt
    const convRes = await fetch('https://api.mistral.ai/v1/conversations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ agent_id: agentId, inputs: prompt }),
    })

    if (!convRes.ok) {
      const text = await convRes.text().catch(() => '')
      return NextResponse.json(
        { error: `Mistral conversation ${convRes.status}`, detail: text },
        { status: 502 }
      )
    }

    const conv = await convRes.json()

    // 3. Extraire le file_id depuis les chunks tool_file
    const entries = conv.outputs ?? conv.entries ?? []
    let fileId: string | null = null

    for (const entry of entries) {
      for (const chunk of (entry.content ?? [])) {
        if (chunk.type === 'tool_file' && chunk.file_type === 'png') {
          fileId = chunk.file_id
          break
        }
      }
      if (fileId) break
    }

    if (!fileId) {
      return NextResponse.json(
        { error: 'Aucune image générée', detail: JSON.stringify(conv).slice(0, 500) },
        { status: 502 }
      )
    }

    // 4. Télécharger l'image et la convertir en base64 (compatibilité avec le code client existant)
    const fileRes = await fetch(`https://api.mistral.ai/v1/files/${fileId}/content`, {
      headers: { 'Authorization': `Bearer ${apiKey}` },
    })

    if (!fileRes.ok) {
      const text = await fileRes.text().catch(() => '')
      return NextResponse.json(
        { error: `Mistral file ${fileRes.status}`, detail: text },
        { status: 502 }
      )
    }

    const b64 = Buffer.from(await fileRes.arrayBuffer()).toString('base64')
    return NextResponse.json({ image: b64 })

  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    )
  }
}
