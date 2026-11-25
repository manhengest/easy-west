import { maintainPendingLeads } from '../../utils/pending-maintenance'
import {
  buildChatCardFill,
  buildPipelineCardFromPending,
  createPipelineCard,
  listRecentChatCards,
  updatePipelineCard,
} from '../../utils/keycrm'
import {
  listFreshPendingLeads,
  pendingLeadBucket,
  readPendingLead,
  savePendingLead,
} from '../../utils/pending-leads'

export default defineTask({
  meta: {
    name: 'pending-leads:flush',
    description: 'Create Лід N for messenger forms with no chat after 15 minutes, and fill chat cards the webhook missed',
  },
  async run() {
    const config = useRuntimeConfig()
    const apiKey = typeof config.keycrmApiKey === 'string' ? config.keycrmApiKey.trim() : ''
    const bucket = pendingLeadBucket()
    const now = Date.now()
    const records = await listFreshPendingLeads(bucket, now)
    const result = await maintainPendingLeads({
      now,
      records,
      read: leadId => readPendingLead(bucket, leadId),
      save: record => savePendingLead(bucket, record),
      createFormCard: async (record) => {
        if (!apiKey) {
          return null
        }
        const created = await createPipelineCard(apiKey, buildPipelineCardFromPending(record))
        return created.ok ? created.id : null
      },
      listRecentChats: async () => {
        if (!apiKey) {
          return []
        }
        return listRecentChatCards(apiKey, now)
      },
      fillChat: async (card, record) => {
        if (!apiKey) {
          return false
        }
        const filled = await updatePipelineCard(apiKey, card.id, buildChatCardFill(record, card.id))
        return filled.ok
      },
    })
    return { result }
  },
})
