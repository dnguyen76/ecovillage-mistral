// scripts/createUser.js
// Usage : node scripts/createUser.js <username> <password> [role]
// Exemple: node scripts/createUser.js admin MonMotDePasse123 admin

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const [,, username, password, role = 'user'] = process.argv

  if (!username || !password) {
    console.error('❌ Usage : node scripts/createUser.js <username> <password> [role]')
    process.exit(1)
  }
  if (password.length < 6) {
    console.error('❌ Le mot de passe doit faire au moins 6 caractères.')
    process.exit(1)
  }

  const passwordHash = await bcrypt.hash(password, 10)

  try {
    const user = await prisma.userEcovillage.create({ data: { username, passwordHash, role } })
    console.log(`✅ Utilisateur créé : ${user.username} (${user.role})`)
  } catch (e) {
    if (e.code === 'P2002') console.error(`❌ "${username}" existe déjà dans user_ecovillage.`)
    else console.error('❌ Erreur :', e.message)
    process.exit(1)
  }
}

main().finally(() => prisma.$disconnect())
