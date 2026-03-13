import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/authOptions'
import { UserAnswer } from '@/lib/questions'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const sessionUser = session.user as { name?: string; id?: string }
  const username = sessionUser.name ?? 'inconnu'
  const userId = parseInt(sessionUser.id ?? '0')

  if (!userId) {
    return NextResponse.json({ error: 'ID utilisateur manquant' }, { status: 400 })
  }

  const { answers } = await req.json() as { answers: UserAnswer[] }

  if (!Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: 'Aucune réponse fournie' }, { status: 400 })
  }

  // Sépare les réponses par groupe
  const byGroupe = (groupe: string) => answers.filter(a => a.groupe === groupe)

  const summarize = (groupeAnswers: UserAnswer[]) =>
    groupeAnswers.flatMap(a =>
      a.selectedIds.map(id => {
        const opt = a.options.find(o => o.id === id)
        return opt ? (opt.emoji ? `${opt.emoji} ${opt.text}` : opt.text) : id
      })
    ).join(' · ')

  const agri  = byGroupe('agriculteurs')
  const indus = byGroupe('industriels')
  const hab   = byGroupe('habitants')
  const elus  = byGroupe('elus')

  try {
    const saved = await prisma.quizSession.create({
      data: {
        userId,
        username,
        answersAgriculteurs: agri  as object[],
        answersIndustriels:  indus as object[],
        answersHabitants:    hab   as object[],
        answersElus:         elus  as object[],
        summaryAgriculteurs: summarize(agri),
        summaryIndustriels:  summarize(indus),
        summaryHabitants:    summarize(hab),
        summaryElus:         summarize(elus),
      },
    })
    return NextResponse.json({ ok: true, sessionId: saved.id })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    )
  }
}

// GET — liste des sessions (admin uniquement)
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const user = session?.user as { role?: string } | undefined
  if (!session || user?.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page  = parseInt(searchParams.get('page')  ?? '1')
  const limit = parseInt(searchParams.get('limit') ?? '20')
  const skip  = (page - 1) * limit

  const [sessions, total] = await Promise.all([
    prisma.quizSession.findMany({
      orderBy: { completedAt: 'desc' },
      skip,
      take: limit,
      select: {
        id: true,
        username: true,
        completedAt: true,
        summaryAgriculteurs: true,
        summaryIndustriels: true,
        summaryHabitants: true,
        summaryElus: true,
      },
    }),
    prisma.quizSession.count(),
  ])

  return NextResponse.json({ sessions, total, page, limit })
}
