export interface ClaimPattern {
  regex: RegExp
  description: string
  severity: 'critical' | 'warning'
}

export const FORBIDDEN_CLAIM_PATTERNS: ClaimPattern[] = [
  { regex: /\b(guéri[rstez]?|guérison)\b/i, description: 'Allégation thérapeutique: "guérir"', severity: 'critical' },
  { regex: /\b(soign[eéè][rsz]?|soigne)\b/i, description: 'Allégation thérapeutique: "soigner"', severity: 'critical' },
  { regex: /\b(trait[eé][rsz]?|traitement)\b/i, description: 'Allégation thérapeutique: "traiter"', severity: 'critical' },
  { regex: /\b(prévien[ts]?|prévenir|prévention)\b/i, description: 'Allégation thérapeutique: "prévenir"', severity: 'critical' },
  { regex: /\b(diagnostic|diagnostiquer)\b/i, description: 'Allégation thérapeutique: "diagnostiquer"', severity: 'critical' },
  { regex: /\b(prescri[rstez]?|prescription)\b/i, description: 'Allégation médicale: "prescrire"', severity: 'critical' },
  { regex: /\b(médicament|pharmaceutique)\b/i, description: 'Référence médicamenteuse', severity: 'critical' },
  { regex: /\b(cancer|tumeur|diabète|alzheimer|parkinson)\b/i, description: 'Référence à une maladie grave', severity: 'critical' },
  { regex: /\b(maladie[s]?)\b/i, description: 'Référence à une maladie', severity: 'warning' },
  { regex: /\b(infection|pathologie|syndrome)\b/i, description: 'Terminologie médicale', severity: 'warning' },
  { regex: /\b(remplace[rsz]?\s+(un\s+)?traitement)\b/i, description: 'Remplacement de traitement', severity: 'critical' },
  { regex: /\b(arrêter?\s+(votre|son|un)\s+traitement)\b/i, description: 'Arrêt de traitement médical', severity: 'critical' },
  { regex: /\b(miraculeu[xse]|100\s*%\s*efficace|garanti[es]?\s+de\s+résultat)\b/i, description: 'Efficacité exagérée', severity: 'warning' },
  { regex: /\b(élimine|éradiqu|détruit)\s+(les?|la|le)\s/i, description: "Verbe d'élimination avec objet médical", severity: 'warning' },
]

export const AUTHORIZED_CLAIM_PREFIXES = [
  'contribue à', 'contribue au', 'aide à', 'favorise',
  'participe à', 'soutient', 'maintient', 'nécessaire à', 'joue un rôle dans',
]

export function isClaimAuthorized(claim: string): boolean {
  const lower = claim.toLowerCase().trim()
  return AUTHORIZED_CLAIM_PREFIXES.some((prefix) => lower.startsWith(prefix))
}
