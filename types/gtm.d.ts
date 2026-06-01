import type { useScriptTriggerConsent } from '#imports'

declare module '#app' {
  interface NuxtApp {
    $gtmConsentTrigger?: ReturnType<typeof useScriptTriggerConsent>
  }
}

export {}
