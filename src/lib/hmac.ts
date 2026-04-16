import crypto from 'crypto'

export function verifyHMAC(body: string, signature: string, secret: string): boolean {
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expected, 'hex'))
  } catch {
    return false
  }
}

export function createHMAC(body: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(body).digest('hex')
}
