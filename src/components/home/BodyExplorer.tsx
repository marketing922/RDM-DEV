'use client'
import React, { useState } from 'react'
import Link from 'next/link'

export type BodyRegion = {
  id: string
  label: string
  adjective: string
  note?: string
  count: number
  plants: { name: string; slug: string }[]
}

type Props = {
  regions: BodyRegion[]
  locale: string
}

// Visual positions relative to the 400×580 silhouette viewBox.
// Pixel coordinates — converted to percentages at render time.
const SPOT_POSITIONS: Record<string, { x: number; y: number }> = {
  tete: { x: 290, y: 60 },
  gorge: { x: 250, y: 125 },
  respiration: { x: 305, y: 190 },
  digestion: { x: 195, y: 255 },
  feminin: { x: 295, y: 345 },
  circulation: { x: 260, y: 440 },
}

const VB_W = 400
const VB_H = 580

export default function BodyExplorer({ regions, locale }: Props) {
  const initial =
    regions.find((r) => r.id === 'digestion' && r.count > 0) ??
    regions.find((r) => r.count > 0) ??
    regions[0]
  const [active, setActive] = useState<BodyRegion>(initial)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-10 lg:gap-12 items-center">
      {/* ── Silhouette + hotspots ── */}
      <div
        className="relative mx-auto w-full max-w-[320px] sm:max-w-[400px] lg:max-w-[480px] aspect-[400/580]"
        aria-label="Silhouette humaine interactive pour explorer les plantes par région"
      >
        {/* Body outline — silhouette épurée en un seul trait */}
        <svg
          viewBox={`0 0 ${VB_W} ${VB_H}`}
          className="absolute inset-0 w-full h-full opacity-60"
          fill="none"
          stroke="#054A57"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {/* Tête */}
          <circle cx="200" cy="70" r="42" />
          {/* Cou */}
          <path d="M186 110 L186 130 L214 130 L214 110" />
          {/* Tronc + bras + jambes en un contour continu */}
          <path d="
            M150 140
            Q120 150 105 195
            L95 310
            Q92 330 100 345
            L115 330
            Q125 270 135 220
            L135 340
            L150 540
            L185 540
            L195 360
            L205 360
            L215 540
            L250 540
            L265 340
            L265 220
            Q275 270 285 330
            L300 345
            Q308 330 305 310
            L295 195
            Q280 150 250 140
            Z
          " />
        </svg>

        {/* Hotspots overlay */}
        {regions.map((r) => {
          const pos = SPOT_POSITIONS[r.id] || SPOT_POSITIONS.digestion
          const isActive = r.id === active.id
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setActive(r)}
              className="absolute flex items-center gap-2 -translate-x-1/2 -translate-y-1/2 focus:outline-none group"
              style={{
                left: `${(pos.x / VB_W) * 100}%`,
                top: `${(pos.y / VB_H) * 100}%`,
              }}
              aria-pressed={isActive ? 'true' : 'false'}
              aria-label={`${r.label} — ${r.count} plantes`}
            >
              {/* Dot */}
              <span
                className={
                  isActive
                    ? 'block w-[22px] h-[22px] rounded-full bg-rm-burgundy ring-[7px] ring-rm-burgundy/20 transition-[width,height,box-shadow] duration-200'
                    : 'block w-[14px] h-[14px] rounded-full bg-rm-ochre ring-[4px] ring-rm-ochre/20 transition-[width,height,box-shadow] duration-200 group-hover:ring-[6px] group-hover:ring-rm-ochre/30'
                }
              />
              {/* Label + count */}
              <span className="flex items-baseline gap-1.5 whitespace-nowrap -translate-x-0.5">
                <span
                  className={
                    isActive
                      ? 'font-sans text-[11px] font-semibold text-rm-burgundy border-b border-dashed border-rm-burgundy pb-0.5'
                      : 'font-sans text-[11px] font-semibold text-rm-teal border-b border-dashed border-rm-teal/70 pb-0.5 group-hover:text-rm-burgundy group-hover:border-rm-burgundy'
                  }
                >
                  {r.label}
                </span>
                <span className="font-mono text-[10px] text-rm-inkSoft">{r.count}</span>
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Selected region panel ── */}
      <div>
        <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.2em] text-rm-burgundy uppercase mb-2">
          Région sélectionnée
        </div>
        <h3 className="font-display text-[32px] sm:text-[40px] md:text-[52px] text-rm-teal leading-[1] tracking-[-0.015em]">
          {active.label}
        </h3>
        <p className="font-serif italic text-[15px] sm:text-[16px] md:text-[18px] text-rm-burgundy mt-1">
          {active.count > 0
            ? `${active.count} ${active.count > 1 ? 'plantes répertoriées' : 'plante répertoriée'}`
            : 'Encyclopédie en cours d’enrichissement'}
        </p>
        {active.note && (
          <p className="font-sans text-[12px] text-rm-inkSoft mt-1.5 tracking-[0.03em]">
            {active.note}
          </p>
        )}

        {active.plants.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5 sm:mt-6">
            {active.plants.slice(0, 6).map((p) => (
              <Link
                key={p.slug}
                href={`/${locale}/plantes/${p.slug}`}
                className="bg-rm-cream border border-rm-rule rounded-md px-3.5 py-3 flex items-center gap-2.5 hover:border-rm-ruleStrong hover:bg-rm-paper transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-rm-ochre shrink-0" />
                <span className="font-display text-[17px] text-rm-teal leading-none">
                  {p.name}
                </span>
              </Link>
            ))}
          </div>
        )}

        {active.count > 0 && (
          <Link
            href={`/${locale}/bienfaits?region=${active.id}`}
            className="inline-flex items-center gap-2 mt-6 bg-rm-burgundy text-white font-sans text-[13px] font-semibold px-[18px] py-3 rounded-lg hover:bg-rm-burgundy/90 transition-colors"
          >
            Les {active.count} plantes {active.adjective}
            <span aria-hidden="true">→</span>
          </Link>
        )}
      </div>
    </div>
  )
}
