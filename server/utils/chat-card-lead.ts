import { matchPendingLead } from '~/shared/pending-lead'
import { KEYCRM_STATUS, messengerChannelForSource } from './keycrm-map'
import { buildChatCardFill, updatePipelineCard, type PipelineCardView } from './keycrm'
import {
  listFreshPendingLeads,
  pendingLeadBucket,
  readPendingLead,
  savePendingLead,
  type PendingLeadBucket,
} from './pending-leads'

export type AttachmentPlan = 'auto' | 'manual'

export function attachmentPlan(
  card: Pick<PipelineCardView, 'statusTitle' | 'sourceId' | 'leadId' | 'contactChannel'>,
  notice: { sourceId?: number },
): AttachmentPlan | null {
  if (card.leadId && !card.contactChannel) {
    return 'manual'
  }
  const sourceId = notice.sourceId ?? card.sourceId
  if (
    card.statusTitle === KEYCRM_STATUS.newRequest
    && messengerChannelForSource(sourceId)
    && !card.leadId
  ) {
    return 'auto'
  }
  return null
}

export async function fillChatFromPending(
  apiKey: string,
  card: PipelineCardView,
  notice: { sourceId?: number, createdAt?: string },
  bucket?: PendingLeadBucket,
): Promise<'filled' | 'skipped' | 'failed'> {
  const plan = attachmentPlan(card, notice)
  if (!plan) {
    return 'skipped'
  }
  const store = bucket ?? pendingLeadBucket()

  if (plan === 'manual' && card.leadId) {
    const record = await readPendingLead(store, card.leadId)
    if (!record) {
      return 'skipped'
    }
    return writeFill(apiKey, card.id, record, store)
  }

  const channel = messengerChannelForSource(notice.sourceId ?? card.sourceId)
  const createdAt = notice.createdAt ?? card.createdAt
  if (!channel || !createdAt) {
    return 'skipped'
  }
  const match = matchPendingLead(await listFreshPendingLeads(store), { channel, createdAt })
  if (!match) {
    return 'skipped'
  }
  return writeFill(apiKey, card.id, match, store)
}

async function writeFill(
  apiKey: string,
  cardId: number,
  record: Parameters<typeof buildChatCardFill>[0],
  bucket: PendingLeadBucket,
): Promise<'filled' | 'failed'> {
  const result = await updatePipelineCard(apiKey, cardId, buildChatCardFill(record, cardId))
  if (!result.ok) {
    console.error('[keycrm] chat card was not filled', { cardId, status: result.status })
    return 'failed'
  }
  await savePendingLead(bucket, { ...record, matchedCardId: cardId })
  return 'filled'
}
