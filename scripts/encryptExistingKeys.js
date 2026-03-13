// scripts/encryptExistingKeys.js
// Chiffre les mistralKey déjà en clair dans user_ecovillage
// Usage : node scripts/encryptExistingKeys.js

const { PrismaClient } = require('@prisma/client')
const crypto = require('crypto')

const ALGORITHM = 'aes-256-gcm'

function getKey() {
  const raw = process.env.ENCRYPTION_KEY ?? ''
  if (!raw) { console.error('❌ ENCRYPTION_KEY manquante'); process.exit(1) }
  return crypto.createHash('sha256').update(raw).digest()
}

function encrypt(plaintext) {
  if (!plaintext) return ''
  if (plaintext.includes(':')) return plaintext // déjà chiffré
  const key = getKey()
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(':')
}

const prisma = new PrismaClient()

async function main() {
  const users = await prisma.userEcovillage.findMany()
  let count = 0
  for (const u of users) {
    if (!u.mistralKey || u.mistralKey.includes(':')) continue // vide ou déjà chiffré
    const encrypted = encrypt(u.mistralKey)
    await prisma.userEcovillage.update({
      where: { id: u.id },
      data: { mistralKey: encrypted },
    })
    console.log(`✅ Clé chiffrée pour : ${u.username}`)
    count++
  }
  console.log(`\n${count} clé(s) chiffrée(s).`)
}

main()
  .catch(e => console.error('❌', e.message))
  .finally(() => prisma.$disconnect())
