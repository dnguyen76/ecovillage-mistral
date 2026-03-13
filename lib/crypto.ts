import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY ?? ''
  if (!raw) throw new Error('ENCRYPTION_KEY manquante dans les variables d\'environnement')
  // Dérive une clé de 32 bytes depuis la valeur env (quelle que soit sa longueur)
  return crypto.createHash('sha256').update(raw).digest()
}

/**
 * Chiffre une chaîne en clair → retourne "iv:authTag:ciphertext" en base64
 */
export function encrypt(plaintext: string): string {
  if (!plaintext) return ''
  const key = getKey()
  const iv  = crypto.randomBytes(12) // 96 bits recommandé pour GCM
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag   = cipher.getAuthTag()
  // Stockage : iv (12) + authTag (16) + ciphertext — tout en base64 séparé par ":"
  return [
    iv.toString('base64'),
    authTag.toString('base64'),
    encrypted.toString('base64'),
  ].join(':')
}

/**
 * Déchiffre "iv:authTag:ciphertext" → chaîne en clair
 * Retourne '' si la valeur est vide ou non chiffrée (rétrocompatibilité)
 */
export function decrypt(stored: string): string {
  if (!stored) return ''
  // Rétrocompatibilité : si la valeur ne contient pas ":" c'est une clé en clair (ancien format)
  if (!stored.includes(':')) return stored
  try {
    const key = getKey()
    const [ivB64, authTagB64, encryptedB64] = stored.split(':')
    const iv        = Buffer.from(ivB64, 'base64')
    const authTag   = Buffer.from(authTagB64, 'base64')
    const encrypted = Buffer.from(encryptedB64, 'base64')
    const decipher  = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    return decipher.update(encrypted).toString('utf8') + decipher.final('utf8')
  } catch {
    return ''
  }
}
