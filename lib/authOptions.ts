import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'
import { decrypt } from './crypto'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Nom d'utilisateur", type: 'text' },
        password: { label: 'Mot de passe', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null
        const user = await prisma.userEcovillage.findUnique({
          where: { username: credentials.username },
        })
        if (!user) return null
        const valid = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!valid) return null
        return {
          id: String(user.id),
          name: user.username,
          role: user.role,
          mistralKey: decrypt(user.mistralKey ?? ''),
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role       = (user as { role?: string }).role
        token.id         = user.id
        token.mistralKey = (user as { mistralKey?: string }).mistralKey ?? ''
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: unknown }).role             = token.role
        ;(session.user as { id?: unknown }).id               = token.id
        ;(session.user as { mistralKey?: unknown }).mistralKey = token.mistralKey
      }
      return session
    },
  },
  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
}
