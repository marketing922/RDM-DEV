import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

const BACKUP_DIR = process.env.WORM_BACKUP_DIR || path.join(process.cwd(), 'backups', 'worm')

export interface WormEntry {
  filename: string
  sha256: string
  createdAt: string
  collection: string
  documentId: string
  size: number
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true })
}

export async function writeWormBackup(
  collection: string,
  documentId: string,
  data: Buffer | string,
  extension = 'json',
): Promise<WormEntry> {
  const now = new Date()
  const yearMonth = `${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`
  const dir = path.join(BACKUP_DIR, collection, yearMonth)
  await ensureDir(dir)

  const content = typeof data === 'string' ? Buffer.from(data, 'utf-8') : data
  const sha256 = crypto.createHash('sha256').update(content).digest('hex')
  const timestamp = now.toISOString().replace(/[:.]/g, '-')
  const filename = `${documentId}_${timestamp}.${extension}`
  const filepath = path.join(dir, filename)

  // Write file
  await fs.writeFile(filepath, content)

  // Make read-only (WORM: Write Once Read Many)
  try {
    await fs.chmod(filepath, 0o444)
  } catch {
    // chmod may fail on Windows — log but don't block
    console.warn(`WORM chmod failed for ${filepath} — Windows may not support read-only enforcement`)
  }

  // Write index entry
  const entry: WormEntry = {
    filename,
    sha256,
    createdAt: now.toISOString(),
    collection,
    documentId,
    size: content.length,
  }

  const indexPath = path.join(dir, '_index.jsonl')
  await fs.appendFile(indexPath, JSON.stringify(entry) + '\n')

  return entry
}

export async function verifyWormIntegrity(filepath: string, expectedSha256: string): Promise<boolean> {
  try {
    const content = await fs.readFile(filepath)
    const actual = crypto.createHash('sha256').update(content).digest('hex')
    return actual === expectedSha256
  } catch {
    return false
  }
}

export async function listWormBackups(collection: string): Promise<WormEntry[]> {
  const entries: WormEntry[] = []
  const collectionDir = path.join(BACKUP_DIR, collection)

  try {
    const years = await fs.readdir(collectionDir)
    for (const year of years) {
      const months = await fs.readdir(path.join(collectionDir, year))
      for (const month of months) {
        const indexPath = path.join(collectionDir, year, month, '_index.jsonl')
        try {
          const content = await fs.readFile(indexPath, 'utf-8')
          const lines = content.trim().split('\n').filter(Boolean)
          entries.push(...lines.map((l) => JSON.parse(l)))
        } catch {
          // No index file
        }
      }
    }
  } catch {
    // Collection dir doesn't exist yet
  }

  return entries
}
