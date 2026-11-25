import { dueFormLeads, matchPendingLead, type PendingLead } from '~/shared/pending-lead'
import type { MessengerLeadChannel } from '~/shared/lead-constants'

export const MAINTENANCE_BATCH = 5

export interface RecentChatCard {
  id: number
  sourceId: number | null
  statusTitle: string
  leadId?: string
  contactChannel?: string
  createdAt?: string
  channel: MessengerLeadChannel | null
}

export async function maintainPendingLeads(io: {
  now: number
  records: PendingLead[]
  read: (leadId: string) => Promise<PendingLead | null>
  save: (record: PendingLead) => Promise<void>
  createFormCard: (record: PendingLead) => Promise<number | null>
  listRecentChats: () => Promise<RecentChatCard[]>
  fillChat: (card: RecentChatCard, record: PendingLead) => Promise<boolean>
}): Promise<{ forms: number, chats: number }> {
  let forms = 0
  for (const record of dueFormLeads(io.records, io.now).slice(0, MAINTENANCE_BATCH)) {
    const fresh = await io.read(record.leadId)
    if (!fresh || fresh.kind !== 'form' || fresh.matchedCardId || fresh.formCardId) {
      continue
    }
    const cardId = await io.createFormCard(fresh)
    if (!cardId) {
      continue
    }
    const latest = await io.read(fresh.leadId)
    if (!latest || latest.matchedCardId) {
      continue
    }
    const saved = { ...latest, formCardId: cardId }
    await io.save(saved)
    const stored = io.records.find(item => item.leadId === saved.leadId)
    if (stored) {
      stored.formCardId = cardId
    }
    forms += 1
  }

  let chats = 0
  let recent: RecentChatCard[] = []
  try {
    recent = await io.listRecentChats()
  }
  catch (error) {
    console.error('[pending-leads] recent chat list failed', error)
  }

  for (const card of recent) {
    if (chats >= MAINTENANCE_BATCH) {
      break
    }
    if (!card.channel || !card.createdAt || card.leadId || card.contactChannel) {
      continue
    }
    const match = matchPendingLead(io.records, { channel: card.channel, createdAt: card.createdAt })
    if (!match) {
      continue
    }
    const fresh = await io.read(match.leadId)
    if (!fresh || fresh.matchedCardId || fresh.formCardId) {
      continue
    }
    const filled = await io.fillChat(card, fresh)
    if (!filled) {
      continue
    }
    await io.save({ ...fresh, matchedCardId: card.id })
    const stored = io.records.find(record => record.leadId === fresh.leadId)
    if (stored) {
      stored.matchedCardId = card.id
    }
    chats += 1
  }

  return { forms, chats }
}
