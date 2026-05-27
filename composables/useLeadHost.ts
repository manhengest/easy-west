import type { LeadSource } from '~/shared/lead-constants'

const LEAD_HOST_KEY = Symbol('leadHost') as InjectionKey<(source: LeadSource) => void>

export function provideLeadHost(open: (source: LeadSource) => void) {
  provide(LEAD_HOST_KEY, open)
}

export function useLeadHost() {
  return inject(LEAD_HOST_KEY, null)
}
