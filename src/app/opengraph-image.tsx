import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Les Remèdes de Mamie — l\'almanach des plantes qui soignent'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

// Google Fonts direct TTF URLs (served from fonts.gstatic.com)
const DM_SERIF_DISPLAY_REGULAR =
  'https://fonts.gstatic.com/s/dmserifdisplay/v15/-nFnOHM81r4j6k0gjAW3mujVU2B2G_Vx1aqeTgOK.ttf'
const DM_SERIF_DISPLAY_ITALIC =
  'https://fonts.gstatic.com/s/dmserifdisplay/v15/-nFhOHM81r4j6k0gjAW3mujVU2B2G_5x0vrx52jxYFU.ttf'
const SOURCE_SERIF_ITALIC =
  'https://fonts.gstatic.com/s/sourceserif4/v8/vEFI2_tTDB4M7-auWDN0ahZJW3IX2ih5nk3AucvUHf6OAVIJmeUDygwjihdqpyrc8CsSpjo.ttf'
const INTER_TIGHT_BOLD =
  'https://fonts.gstatic.com/s/intertight/v7/NGSnv5HMAFg6IuGlBNMjxJEL2VmU3NS7Z2JRNkMdfOCbVd3ZKHsgxQ.ttf'
const JETBRAINS_MONO_REGULAR =
  'https://fonts.gstatic.com/s/jetbrainsmono/v24/tDbY2o-flEEny0FZhsfKu5WU4zr3E_BX0PnT8RD8yKxjPVmUsaaDhw.ttf'

async function loadFont(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.arrayBuffer()
  } catch {
    return null
  }
}

export default async function Image() {
  const [dmRegular, dmItalic, sourceItalic, interBold, mono] = await Promise.all([
    loadFont(DM_SERIF_DISPLAY_REGULAR),
    loadFont(DM_SERIF_DISPLAY_ITALIC),
    loadFont(SOURCE_SERIF_ITALIC),
    loadFont(INTER_TIGHT_BOLD),
    loadFont(JETBRAINS_MONO_REGULAR),
  ])

  const fonts: Array<{
    name: string
    data: ArrayBuffer
    weight?: 400 | 700
    style?: 'normal' | 'italic'
  }> = []
  if (dmRegular)
    fonts.push({ name: 'DM Serif Display', data: dmRegular, weight: 400, style: 'normal' })
  if (dmItalic)
    fonts.push({ name: 'DM Serif Display', data: dmItalic, weight: 400, style: 'italic' })
  if (sourceItalic)
    fonts.push({ name: 'Source Serif 4', data: sourceItalic, weight: 400, style: 'italic' })
  if (interBold) fonts.push({ name: 'Inter Tight', data: interBold, weight: 700, style: 'normal' })
  if (mono)
    fonts.push({ name: 'JetBrains Mono', data: mono, weight: 400, style: 'normal' })

  // Palette
  const CREAM = '#FEF9E9'
  const BURGUNDY = '#A2211E'
  const TEAL = '#054A57'
  const OCHRE = '#D0802C'
  const BORDER = '#DCD8C7'

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: CREAM,
          fontFamily: '"Source Serif 4", serif',
          position: 'relative',
        }}
      >
        {/* Main content area */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            width: '100%',
            height: '574px',
          }}
        >
          {/* Left block */}
          <div
            style={{
              width: '600px',
              height: '574px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              padding: '64px 56px',
              boxSizing: 'border-box',
            }}
          >
            {/* Eyebrow */}
            <div
              style={{
                display: 'flex',
                fontFamily: '"Inter Tight", sans-serif',
                fontSize: 14,
                fontWeight: 700,
                color: BURGUNDY,
                textTransform: 'uppercase',
                letterSpacing: 3,
                marginBottom: 28,
              }}
            >
              N° IV · Édition du printemps
            </div>

            {/* Headline */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                fontFamily: '"DM Serif Display", serif',
                fontSize: 68,
                lineHeight: 1,
                letterSpacing: -1.5,
                color: TEAL,
              }}
            >
              <span>L&apos;almanach des&nbsp;</span>
              <span
                style={{
                  fontStyle: 'italic',
                  color: BURGUNDY,
                }}
              >
                plantes
              </span>
              <span>&nbsp;qui soignent depuis toujours.</span>
            </div>

            {/* Sub-caption */}
            <div
              style={{
                display: 'flex',
                fontFamily: '"Source Serif 4", serif',
                fontStyle: 'italic',
                fontSize: 18,
                color: TEAL,
                opacity: 0.7,
                marginTop: 32,
              }}
            >
              Pharmacopée française · Médecine traditionnelle chinoise
            </div>
          </div>

          {/* Right block */}
          <div
            style={{
              width: '600px',
              height: '574px',
              display: 'flex',
              position: 'relative',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Botanical sprig SVG, centered */}
            <svg
              width="420"
              height="420"
              viewBox="0 0 140 140"
              style={{
                opacity: 0.35,
              }}
            >
              {/* Main stem */}
              <path
                d="M70 12 C 78 40, 84 72, 78 122"
                stroke={OCHRE}
                strokeWidth="1.6"
                fill="none"
                strokeLinecap="round"
              />
              {/* Leaf 1 - upper left */}
              <path
                d="M73 30 C 58 26, 46 32, 44 44 C 56 46, 70 42, 73 30 Z"
                fill={OCHRE}
                fillOpacity="0.9"
                stroke={OCHRE}
                strokeWidth="1"
              />
              <path d="M73 30 L 48 42" stroke={OCHRE} strokeWidth="0.8" fill="none" />
              {/* Leaf 2 - upper right */}
              <path
                d="M75 48 C 90 46, 102 54, 102 66 C 90 66, 78 60, 75 48 Z"
                fill={OCHRE}
                fillOpacity="0.9"
                stroke={OCHRE}
                strokeWidth="1"
              />
              <path d="M75 48 L 100 62" stroke={OCHRE} strokeWidth="0.8" fill="none" />
              {/* Leaf 3 - middle left */}
              <path
                d="M78 70 C 62 70, 50 78, 50 92 C 64 92, 78 84, 78 70 Z"
                fill={OCHRE}
                fillOpacity="0.9"
                stroke={OCHRE}
                strokeWidth="1"
              />
              <path d="M78 70 L 54 88" stroke={OCHRE} strokeWidth="0.8" fill="none" />
              {/* Leaf 4 - lower right */}
              <path
                d="M79 92 C 94 92, 106 100, 104 114 C 90 114, 80 106, 79 92 Z"
                fill={OCHRE}
                fillOpacity="0.9"
                stroke={OCHRE}
                strokeWidth="1"
              />
              <path d="M79 92 L 102 110" stroke={OCHRE} strokeWidth="0.8" fill="none" />
              {/* Small bud at top */}
              <circle cx="70" cy="11" r="3" fill={OCHRE} fillOpacity="0.9" />
            </svg>

            {/* Herbarium label card, bottom right */}
            <div
              style={{
                position: 'absolute',
                right: 40,
                bottom: 40,
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: CREAM,
                border: `1px solid ${BORDER}`,
                padding: '14px 20px',
                transform: 'rotate(-2deg)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                width: 180,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 10,
                  color: TEAL,
                  opacity: 0.8,
                  letterSpacing: 1,
                  marginBottom: 4,
                }}
              >
                N° 014
              </div>
              <div
                style={{
                  display: 'flex',
                  fontFamily: '"DM Serif Display", serif',
                  fontStyle: 'italic',
                  fontSize: 16,
                  color: BURGUNDY,
                  lineHeight: 1.1,
                }}
              >
                Matricaria recutita
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            height: '56px',
            borderTop: `1px solid ${BORDER}`,
            padding: '0 56px',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontFamily: '"DM Serif Display", serif',
              fontSize: 22,
              color: TEAL,
            }}
          >
            Les Remèdes de Mamie
          </div>
          <div
            style={{
              display: 'flex',
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 14,
              color: BURGUNDY,
              letterSpacing: 0.5,
            }}
          >
            remedes-mamie.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fonts.length > 0 ? fonts : undefined,
    },
  )
}
