import { Browser } from '@capacitor/browser'
import { Capacitor } from '@capacitor/core'

export async function openExternalUrl(
  url: string
) {
  if (!url) {
    return
  }

  if (Capacitor.isNativePlatform()) {
    await Browser.open({
      url,
    })

    return
  }

  window.open(
    url,
    '_blank',
    'noopener,noreferrer'
  )
}