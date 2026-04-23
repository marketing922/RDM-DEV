import React from 'react'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { RM, StatusPill, PageHeader } from '@/components/admin/primitives'

// TODO: Custom Edit view is intentionally skipped for this round.
// TODO: "Dernière act." currently falls back to updatedAt because Payload's
//       default auth config does not expose lastLogin on the doc — wire it up
//       once a loginAttempts/lastLogin hook is in place.
// TODO: "Contribs." count is a placeholder (0) — computing per-user authored
//       document counts via N extra queries would be expensive; revisit with a
//       batched aggregation or a virtual field.

const ROLE_CARDS: Array<{ value: string; name: string; perms: string }> = [
  { value: 'admin', name: 'Admin', perms: 'Tous droits · publication · gestion équipe' },
  { value: 'editor', name: 'Éditeur', perms: 'Écrire, modifier, soumettre à révision' },
  {
    value: 'compliance_reviewer',
    name: 'Contributeur',
    perms: 'Écrire ses propres brouillons',
  },
  { value: 'publisher', name: 'Lecture seule', perms: 'Consulter · commenter' },
]

const ROLE_LABEL: Record<string, string> = {
  admin: 'Administrateur',
  editor: 'Éditeur',
  compliance_reviewer: 'Vérificateur conformité',
  publisher: 'Publieur',
}

const AVATAR_COLORS = [RM.ochre, RM.teal, RM.burgundy, '#6A9A5E', '#5A4A7A', RM.stone]

function pickColor(seed: string): string {
  const s = seed && seed.length > 0 ? seed : 'x'
  return AVATAR_COLORS[s.charCodeAt(0) % AVATAR_COLORS.length]
}

function buildInitials(doc: any): string {
  const first = (doc?.firstName ?? '').toString().trim()
  const last = (doc?.lastName ?? '').toString().trim()
  if (first || last) {
    const a = first ? first[0] : ''
    const b = last ? last[0] : ''
    return (a + b).toUpperCase() || '?'
  }
  const email = (doc?.email ?? '').toString().trim()
  if (email) return email.slice(0, 2).toUpperCase()
  return '?'
}

function buildName(doc: any): string {
  const first = (doc?.firstName ?? '').toString().trim()
  const last = (doc?.lastName ?? '').toString().trim()
  const full = `${first} ${last}`.trim()
  if (full) return full
  const email = (doc?.email ?? '').toString().trim()
  if (email) return email.split('@')[0]
  return '—'
}

function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  const diffMs = Date.now() - d.getTime()
  const mins = Math.round(diffMs / 60000)
  if (mins < 1) return "à l'instant"
  if (mins < 60) return `il y a ${mins} min`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `il y a ${hours} h`
  const days = Math.round(hours / 24)
  if (days < 30) return `il y a ${days} j`
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

const GRID_COLUMNS = '2fr 1.4fr 120px 110px 100px 40px'

export default async function UsersList(props: any) {
  const payload = props?.payload ?? props?.req?.payload ?? props?.initPageResult?.req?.payload
  const providedDocs: any[] | undefined = props?.data?.docs
  const providedTotal: number | undefined = props?.data?.totalDocs

  let docs: any[] = providedDocs ?? []
  let totalDocs = providedTotal ?? 0
  // TODO: wire to real invitation state if/when invitations are modelled.
  const pendingCount: number = 0
  const roleCounts: Record<string, number> = {}

  if (payload) {
    try {
      if (!providedDocs) {
        const res = await payload.find({
          collection: 'users',
          depth: 0,
          limit: 50,
          sort: '-updatedAt',
          overrideAccess: true,
        })
        docs = (res?.docs as any[]) ?? []
        totalDocs = Number(res?.totalDocs ?? docs.length)
      }
      for (const r of ROLE_CARDS) {
        const c = await payload
          .count({
            collection: 'users',
            where: { role: { equals: r.value } },
            overrideAccess: true,
          })
          .catch(() => ({ totalDocs: 0 }))
        roleCounts[r.value] = Number(c?.totalDocs ?? 0)
      }
    } catch {
      // Swallow — fall back to whatever `data` already contained.
    }
  }

  const sub = `${totalDocs} membre${totalDocs === 1 ? '' : 's'} · ${pendingCount} invitation${pendingCount === 1 ? '' : 's'} en attente`

  const headerCellBase: React.CSSProperties = {
    fontSize: 10,
    letterSpacing: 1.5,
    color: RM.inkSoft,
    textTransform: 'uppercase',
    fontWeight: 600,
    fontFamily: RM.fSans,
  }

  return (
    <div style={{ padding: '32px 32px 60px' }}>
      <PageHeader eyebrow="Équipe" title="Utilisateurs" sub={sub} />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 360px',
          gap: 24,
          alignItems: 'start',
        }}
      >
        {/* LEFT — Users table */}
        <div
          style={{
            background: RM.paper,
            border: `1px solid ${RM.rule}`,
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          {/* Header row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: GRID_COLUMNS,
              alignItems: 'center',
              padding: '12px 20px',
              background: RM.creamSoft,
              gap: 12,
            }}
          >
            <div style={headerCellBase}>Personne</div>
            <div style={headerCellBase}>Rôle</div>
            <div style={headerCellBase}>Statut</div>
            <div style={headerCellBase}>Dernière act.</div>
            <div style={{ ...headerCellBase, textAlign: 'right' }}>Contribs.</div>
            <div style={headerCellBase} aria-hidden />
          </div>

          {docs.length === 0 ? (
            <div
              style={{
                padding: '32px 20px',
                fontSize: 13,
                fontFamily: RM.fSans,
                color: RM.inkSoft,
                textAlign: 'center',
              }}
            >
              Aucun utilisateur pour l’instant.
            </div>
          ) : (
            docs.map((doc, idx) => {
              const isLast = idx === docs.length - 1
              const seed = String(doc?.id ?? doc?.email ?? 'x')
              const avatarColor = pickColor(seed)
              const initials = buildInitials(doc)
              const name = buildName(doc)
              const email = (doc?.email ?? '').toString()
              const roleValue = (doc?.role ?? '').toString()
              const roleDisplay = ROLE_LABEL[roleValue] ?? roleValue ?? '—'
              // The mockup keeps "Publié/Brouillon" as proxies for active/invited.
              const isActive = Boolean(email) && !doc?._isPending
              const statusLabel = isActive ? 'Publié' : 'Brouillon'
              const lastActivity = formatRelative(doc?._lastLogin ?? doc?.updatedAt)
              const contribs = 0 // TODO: count authored articles/plants

              return (
                <Link
                  key={String(doc?.id ?? idx)}
                  href={`/admin/collections/users/${doc?.id}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: GRID_COLUMNS,
                    alignItems: 'center',
                    padding: '16px 20px',
                    borderBottom: isLast ? 'none' : `1px solid ${RM.rule}`,
                    fontSize: 13,
                    fontFamily: RM.fSans,
                    color: RM.ink,
                    textDecoration: 'none',
                    gap: 12,
                  }}
                >
                  {/* Personne */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: avatarColor,
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontFamily: RM.fSans,
                        fontWeight: 600,
                        fontSize: 13,
                        flexShrink: 0,
                      }}
                    >
                      {initials}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontFamily: RM.fDisplay,
                          fontSize: 16,
                          color: RM.teal,
                          lineHeight: 1.2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {name}
                      </div>
                      <div
                        style={{
                          fontFamily: RM.fMono,
                          fontSize: 11,
                          color: RM.inkSoft,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {email || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Rôle */}
                  <div style={{ fontSize: 12, color: RM.ink, fontFamily: RM.fSans }}>
                    {roleDisplay}
                  </div>

                  {/* Statut */}
                  <div>
                    <StatusPill label={statusLabel} />
                  </div>

                  {/* Dernière act. */}
                  <div style={{ fontSize: 12, color: RM.inkSoft, fontFamily: RM.fSans }}>
                    {lastActivity}
                  </div>

                  {/* Contribs */}
                  <div
                    style={{
                      fontFamily: RM.fMono,
                      fontSize: 12,
                      color: RM.teal,
                      fontWeight: 600,
                      textAlign: 'right',
                    }}
                  >
                    {contribs}
                  </div>

                  {/* Chevron */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      alignItems: 'center',
                      color: RM.inkSoft,
                    }}
                  >
                    <ChevronRight size={14} />
                  </div>
                </Link>
              )
            })
          )}
        </div>

        {/* RIGHT — Roles panel */}
        <div
          style={{
            background: RM.paper,
            border: `1px solid ${RM.rule}`,
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '14px 18px',
              borderBottom: `1px solid ${RM.rule}`,
              background: RM.creamSoft,
              fontSize: 10,
              letterSpacing: 2,
              color: RM.inkSoft,
              textTransform: 'uppercase',
              fontWeight: 600,
              fontFamily: RM.fSans,
            }}
          >
            Rôles & permissions
          </div>

          {ROLE_CARDS.map((r, i) => {
            const isLast = i === ROLE_CARDS.length - 1
            const count = roleCounts[r.value] ?? 0
            return (
              <div
                key={r.value}
                style={{
                  padding: '14px 18px',
                  borderBottom: isLast ? 'none' : `1px solid ${RM.rule}`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      fontFamily: RM.fDisplay,
                      fontSize: 17,
                      color: RM.teal,
                      lineHeight: 1.2,
                    }}
                  >
                    {r.name}
                  </div>
                  <div
                    style={{
                      fontFamily: RM.fMono,
                      fontSize: 11,
                      color: RM.inkSoft,
                    }}
                  >
                    {count}
                  </div>
                </div>
                <div
                  style={{
                    marginTop: 4,
                    fontFamily: RM.fSerif,
                    fontStyle: 'italic',
                    fontSize: 12,
                    color: RM.inkSoft,
                    lineHeight: 1.4,
                  }}
                >
                  {r.perms}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
