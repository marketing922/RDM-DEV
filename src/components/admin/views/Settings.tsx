import type { AdminViewServerProps } from 'payload'
import React from 'react'
import SettingsClient from './SettingsClient'

/**
 * Server wrapper for the Paramètres admin view.
 *
 * Fetches the `siteSettings` Global (if it exists) on the server and passes
 * the initial data to the interactive client component. If the Global hasn't
 * been created yet (fresh DB), we pass `null` and the client falls back to
 * sane defaults while showing a banner.
 */
const Settings = async (props: AdminViewServerProps) => {
  const payload = (props as any)?.initPageResult?.req?.payload
  let initial: any = null
  try {
    if (payload) {
      initial = await payload.findGlobal({ slug: 'siteSettings', depth: 1 })
    }
  } catch (_err) {
    // Global may not exist yet on fresh DB — the client will display
    // a small banner prompting the user to save to initialise.
    initial = null
  }
  return <SettingsClient initial={initial} />
}

export default Settings
