'use client'

import React, { useEffect, useMemo, useRef } from 'react'

type Props = {
  id: string
  label?: string
  html?: string
  css?: string
  js?: string
}

const scopeCss = (css: string, scope: string): string => {
  if (!css) return ''
  // Retire les commentaires /* ... */ pour simplifier le parsing
  const noComments = css.replace(/\/\*[\s\S]*?\*\//g, '')
  // Découpe naïve : chaque bloc "selector { ... }" est préfixé par le scope.
  // Gère les @keyframes / @media / @supports en récursant si nécessaire.
  const addScope = (input: string): string => {
    let out = ''
    let buf = ''
    let depth = 0
    const stack: string[] = []
    for (let i = 0; i < input.length; i++) {
      const ch = input[i]
      if (ch === '{') {
        depth++
        if (depth === 1) {
          const selector = buf.trim()
          buf = ''
          if (/^@(keyframes|font-face|page)/i.test(selector)) {
            // Ne pas scoper l'intérieur des @keyframes / @font-face
            stack.push(selector + '{')
            continue
          }
          if (/^@(media|supports|container)/i.test(selector)) {
            out += selector + '{'
            stack.push('')
            continue
          }
          const scoped = selector
            .split(',')
            .map((s) => {
              const t = s.trim()
              if (!t) return ''
              if (t.startsWith('&')) return `.${scope}${t.slice(1)}`
              return `.${scope} ${t}`
            })
            .filter(Boolean)
            .join(', ')
          out += scoped + '{'
          stack.push('')
          continue
        }
        buf += ch
      } else if (ch === '}') {
        depth--
        if (depth === 0) {
          out += buf + '}'
          buf = ''
          stack.pop()
          continue
        }
        buf += ch
      } else {
        if (depth === 0) out += '' // collector is buf
        buf += ch
      }
    }
    return out + buf
  }
  try {
    return addScope(noComments)
  } catch {
    return ''
  }
}

const CustomCodeBlock: React.FC<Props> = ({ id, label, html, css, js }) => {
  const scopeClass = useMemo(() => `rm-cc-${String(id).replace(/[^a-zA-Z0-9_-]/g, '')}`, [id])
  const rootRef = useRef<HTMLDivElement | null>(null)
  const scopedCss = useMemo(() => (css ? scopeCss(css, scopeClass) : ''), [css, scopeClass])

  useEffect(() => {
    if (!js || !rootRef.current) return
    try {
      const fn = new Function('root', js)
      fn(rootRef.current)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(`[CustomCodeBlock${label ? ` · ${label}` : ''}] JS error:`, err)
    }
  }, [js, label])

  return (
    <section className={scopeClass} ref={rootRef} data-block="customCode">
      {scopedCss && <style dangerouslySetInnerHTML={{ __html: scopedCss }} />}
      {html && <div dangerouslySetInnerHTML={{ __html: html }} />}
    </section>
  )
}

export default CustomCodeBlock
