import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/authOptions'
import { encrypt } from '@/lib/crypto'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const user = session?.user as { role?: string } | undefined
  if (!session || user?.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 })
  }

  const { users, updateExisting = false } = await req.json()
  if (!Array.isArray(users) || users.length === 0) {
    return NextResponse.json({ error: 'Aucun utilisateur fourni' }, { status: 400 })
  }

  let created = 0, updated = 0, skipped = 0
  const errors: string[] = []

  for (const u of users) {
    const { username, password, role = 'user', mistralKey = '' } =
      u as { username: string; password: string; role?: string; mistralKey?: string }

    if (!username || !password) { errors.push(`Données manquantes pour "${username}"`); continue }
    if (password.length < 6)    { errors.push(`Mot de passe trop court pour "${username}"`); continue }

    try {
      const passwordHash = await bcrypt.hash(password, 10)
      const encryptedKey  = mistralKey ? encrypt(mistralKey) : ''
      if (updateExisting) {
        const existing = await prisma.userEcovillage.findUnique({ where: { username } })
        if (existing) {
          await prisma.userEcovillage.update({
            where: { username },
            data: { passwordHash, role, mistralKey: encryptedKey },
          })
          updated++
        } else {
          await prisma.userEcovillage.create({ data: { username, passwordHash, role, mistralKey: encryptedKey } })
          created++
        }
      } else {
        await prisma.userEcovillage.create({ data: { username, passwordHash, role, mistralKey: encryptedKey } })
        created++
      }
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string }
      if (err.code === 'P2002') skipped++
      else errors.push(`Erreur pour "${username}": ${err.message}`)
    }
  }

  return NextResponse.json({ created, updated, skipped, errors })
}
