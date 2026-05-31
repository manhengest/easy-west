import type { LeadSource } from '~/shared/lead-constants'

const leadOpen = ref(false)
const leadSource = ref<LeadSource>('cta')

function openLead(source: LeadSource) {
  leadSource.value = source
  leadOpen.value = true
}

export function useLeadHost() {
  return {
    leadOpen,
    leadSource,
    openLead,
  }
}
