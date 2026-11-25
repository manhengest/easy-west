import {
  applyMessengerClick,
  isPendingLeadExpired,
  parsePendingLead,
  type PendingLead,
} from '~/shared/pending-lead'
import type { MessengerLeadPayload } from '~/shared/lead-schema'

export interface PendingLeadBucket {
  getItem: (key: string) => Promise<unknown>
  setItem: (key: string, value: PendingLead) => Promise<unknown>
  getKeys: () => Promise<string[]>
  removeItem: (key: string) => Promise<unknown>
}

export function pendingLeadBucket(): PendingLeadBucket {
  const storage = useStorage('pendingLeads')
  return {
    getItem: key => storage.getItem(key),
    setItem: (key, value) => storage.setItem(key, value),
    getKeys: () => storage.getKeys(),
    removeItem: key => storage.removeItem(key),
  }
}

export async function readPendingLead(bucket: PendingLeadBucket, leadId: string): Promise<PendingLead | null> {
  return parsePendingLead(await bucket.getItem(leadId))
}

export async function savePendingLead(bucket: PendingLeadBucket, record: PendingLead): Promise<void> {
  await bucket.setItem(record.leadId, record)
}

export async function listFreshPendingLeads(bucket: PendingLeadBucket, now = Date.now()): Promise<PendingLead[]> {
  const keys = await bucket.getKeys()
  const records: PendingLead[] = []
  for (const key of keys) {
    const record = parsePendingLead(await bucket.getItem(key))
    if (!record || isPendingLeadExpired(record, now)) {
      await bucket.removeItem(key)
      continue
    }
    records.push(record)
  }
  return records
}

export async function upsertClickLead(
  bucket: PendingLeadBucket,
  payload: MessengerLeadPayload,
  now = Date.now(),
): Promise<{ record: PendingLead, pushLastTouch: boolean }> {
  const existing = await readPendingLead(bucket, payload.leadId)
  const applied = applyMessengerClick(existing, payload, new Date(now).toISOString())
  await savePendingLead(bucket, applied.record)
  return applied
}
